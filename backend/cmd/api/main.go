package main

import (
	"context"
	"database/sql"
	"log"
	"net/http"
	"os"
	"os/signal"
	"strconv"
	"syscall"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/joho/godotenv"
	_ "github.com/lib/pq"
	"github.com/prometheus/client_golang/prometheus/promhttp"
	"github.com/redis/go-redis/v9"

	"github.com/homelabvpn/backend/internal/admin"
	"github.com/homelabvpn/backend/internal/api"
	"github.com/homelabvpn/backend/internal/auth"
	"github.com/homelabvpn/backend/internal/metrics"
	"github.com/homelabvpn/backend/internal/relay"
	"github.com/homelabvpn/backend/internal/subscription"
	"github.com/homelabvpn/backend/internal/vpn"
)

func main() {
	// Load environment variables
	if err := godotenv.Load(); err != nil {
		log.Println("No .env file found, using environment variables")
	}

	// Configuration
	config := &Config{
		Port:                getEnv("PORT", "8080"),
		DatabaseURL:         getEnv("DATABASE_URL", "postgres://localhost:5432/homelabvpn?sslmode=disable"),
		RedisURL:            getEnv("REDIS_URL", "redis://localhost:6379"),
		JWTSecret:           getEnv("JWT_SECRET", "your-secret-key-change-in-production"),
		AdminJWTSecret:      getEnv("ADMIN_JWT_SECRET", "admin-secret-key-change-in-production"),
		GoogleClientID:      getEnv("GOOGLE_CLIENT_ID", ""),
		GoogleClientSecret:  getEnv("GOOGLE_CLIENT_SECRET", ""),
		GoogleRedirectURL:   getEnv("GOOGLE_REDIRECT_URL", "http://localhost:3000/api/auth/google/callback"),
		StripeSecretKey:     getEnv("STRIPE_SECRET_KEY", ""),
		StripeWebhookSecret: getEnv("STRIPE_WEBHOOK_SECRET", ""),
		FrontendURL:         getEnv("FRONTEND_URL", "http://localhost:3000"),
		AdminFrontendURL:    getEnv("ADMIN_FRONTEND_URL", "http://localhost:3001"),
		Environment:         getEnv("ENVIRONMENT", "development"),
		RelayAPIKey:         getEnv("RELAY_API_KEY", ""),
	}

	// Initialize database connection
	db, err := sql.Open("postgres", config.DatabaseURL)
	if err != nil {
		log.Fatalf("Failed to connect to database: %v", err)
	}
	defer db.Close()

	if err := db.Ping(); err != nil {
		log.Printf("Warning: Database not available: %v", err)
	}

	// Initialize Redis connection
	redisOpt, err := redis.ParseURL(config.RedisURL)
	if err != nil {
		log.Printf("Warning: Failed to parse Redis URL: %v", err)
		redisOpt = &redis.Options{Addr: "localhost:6379"}
	}
	redisClient := redis.NewClient(redisOpt)
	defer redisClient.Close()

	ctx := context.Background()
	if _, err := redisClient.Ping(ctx).Result(); err != nil {
		log.Printf("Warning: Redis not available: %v", err)
	}

	// Initialize services
	jwtManager := auth.NewJWTManager(config.JWTSecret, 15*time.Minute)
	oauthManager := auth.NewGoogleOAuthManager(
		config.GoogleClientID,
		config.GoogleClientSecret,
		config.GoogleRedirectURL,
	)

	vpnService := vpn.NewService(db, redisClient)
	subscriptionService := subscription.NewService(db, config.StripeSecretKey)
	stripeWebhookHandler := subscription.NewWebhookHandler(config.StripeWebhookSecret, subscriptionService)

	// Initialize admin services
	adminAuthService := admin.NewAuthService(db, config.AdminJWTSecret)
	adminMetricsService := admin.NewMetricsService(db, redisClient)
	adminHandler := admin.NewHandler(db, redisClient, adminAuthService, adminMetricsService)

	// Initialize relay services
	relayService := relay.NewService(db, redisClient)
	relayHandler := relay.NewHandler(relayService, config.RelayAPIKey)

	// Start metrics collector
	adminMetricsService.StartMetricsCollector(ctx)

	// Initialize Gin router
	if config.Environment == "production" {
		gin.SetMode(gin.ReleaseMode)
	}

	router := gin.Default()

	// CORS middleware (allow both user and admin frontends)
	router.Use(corsMiddleware(config.FrontendURL, config.AdminFrontendURL))

	// Prometheus metrics middleware
	router.Use(metricsMiddleware())

	// Health check endpoints
	router.GET("/health", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{"status": "healthy"})
	})

	router.GET("/ready", func(c *gin.Context) {
		// Check database connectivity
		if err := db.Ping(); err != nil {
			c.JSON(http.StatusServiceUnavailable, gin.H{"status": "not ready", "error": "database unavailable"})
			return
		}
		c.JSON(http.StatusOK, gin.H{"status": "ready"})
	})

	// Prometheus metrics endpoint
	router.GET("/metrics", gin.WrapH(promhttp.Handler()))

	// Initialize API handlers
	apiHandler := api.NewHandler(
		db,
		redisClient,
		jwtManager,
		oauthManager,
		vpnService,
		subscriptionService,
		stripeWebhookHandler,
		config.FrontendURL,
	)

	// Setup routes
	v1 := router.Group("/api/v1")
	{
		// Auth routes
		authGroup := v1.Group("/auth")
		{
			authGroup.GET("/google/start", apiHandler.StartGoogleOAuth)
			authGroup.POST("/google/callback", apiHandler.GoogleOAuthCallback)
			authGroup.POST("/refresh", apiHandler.RefreshToken)
			authGroup.POST("/logout", apiHandler.AuthMiddleware(), apiHandler.Logout)
		}

		// User routes (protected)
		userGroup := v1.Group("/users")
		userGroup.Use(apiHandler.AuthMiddleware())
		{
			userGroup.GET("/me", apiHandler.GetCurrentUser)
			userGroup.DELETE("/me", apiHandler.DeleteUser)
		}

		// VPN routes (protected)
		vpnGroup := v1.Group("/vpn")
		vpnGroup.Use(apiHandler.AuthMiddleware())
		{
			vpnGroup.GET("/config", apiHandler.GetVPNConfig)
			vpnGroup.POST("/config/regenerate", apiHandler.RegenerateVPNKeys)
			vpnGroup.GET("/servers", apiHandler.GetVPNServers)
		}

		// Subscription routes
		subGroup := v1.Group("/subscriptions")
		{
			subGroup.GET("/plans", apiHandler.GetPlans)
			subGroup.POST("/checkout", apiHandler.AuthMiddleware(), apiHandler.CreateCheckoutSession)
			subGroup.POST("/webhook", apiHandler.HandleStripeWebhook)
			subGroup.GET("/current", apiHandler.AuthMiddleware(), apiHandler.GetCurrentSubscription)
			subGroup.POST("/cancel", apiHandler.AuthMiddleware(), apiHandler.CancelSubscription)
		}
	}

	// Admin API routes
	adminV1 := router.Group("/api/admin/v1")
	{
		// Admin auth routes (public)
		adminAuthGroup := adminV1.Group("/auth")
		{
			adminAuthGroup.POST("/login", adminHandler.Login)
			adminAuthGroup.POST("/refresh", adminHandler.RefreshToken)
		}

		// Protected admin routes
		adminProtected := adminV1.Group("")
		adminProtected.Use(adminHandler.AuthMiddleware())
		{
			// Current admin
			adminProtected.GET("/me", adminHandler.GetCurrentAdmin)
			adminProtected.POST("/me/password", adminHandler.ChangePassword)
			adminProtected.POST("/logout", adminHandler.Logout)

			// Dashboard & Metrics
			adminProtected.GET("/dashboard/stats", adminHandler.GetDashboardStats)
			adminProtected.GET("/dashboard/health", adminHandler.GetSystemHealth)
			adminProtected.GET("/dashboard/bandwidth", adminHandler.GetBandwidthHistory)
			adminProtected.GET("/dashboard/user-growth", adminHandler.GetUserGrowth)
			adminProtected.GET("/dashboard/revenue", adminHandler.GetRevenueStats)

			// User management
			adminProtected.GET("/users", adminHandler.ListUsers)
			adminProtected.GET("/users/:id", adminHandler.GetUser)
			adminProtected.PUT("/users/:id", adminHandler.RequireRole("super_admin", "admin"), adminHandler.UpdateUser)
			adminProtected.DELETE("/users/:id", adminHandler.RequireRole("super_admin", "admin"), adminHandler.DeleteUser)

			// Subscription management
			adminProtected.GET("/subscriptions", adminHandler.ListSubscriptions)
			adminProtected.PUT("/subscriptions/:id", adminHandler.RequireRole("super_admin", "admin"), adminHandler.UpdateSubscription)
			adminProtected.POST("/subscriptions/:id/cancel", adminHandler.RequireRole("super_admin", "admin"), adminHandler.CancelSubscription)

			// Server management
			adminProtected.GET("/servers", adminHandler.ListServers)
			adminProtected.PUT("/servers/:id", adminHandler.RequireRole("super_admin", "admin"), adminHandler.UpdateServer)

			// Audit logs
			adminProtected.GET("/audit-logs", adminHandler.GetAuditLogs)

			// Peer management (for iOS relay platform switching)
			adminProtected.GET("/peers", adminHandler.ListPeers)
			adminProtected.GET("/peers/:id", adminHandler.GetPeer)
			adminProtected.PUT("/peers/:id/platform", adminHandler.RequireRole("super_admin", "admin"), adminHandler.UpdatePeerPlatform)
			adminProtected.POST("/peers/bulk-platform", adminHandler.RequireRole("super_admin", "admin"), adminHandler.BulkUpdatePeerPlatform)

			// Relay management (admin can view relays)
			adminProtected.GET("/relays", relayHandler.ListRelays)
		}
	}

	// Relay API routes (for Linode VPS sync)
	relayAPI := router.Group("/api/relay/v1")
	relayAPI.Use(relayHandler.APIKeyMiddleware())
	{
		relayAPI.POST("/register", relayHandler.Register)
		relayAPI.POST("/heartbeat", relayHandler.Heartbeat)
		relayAPI.GET("/peers", relayHandler.GetPeers)
		relayAPI.GET("/peers/wireguard-config", relayHandler.GetWireGuardConfig)
	}

	// Create HTTP server
	srv := &http.Server{
		Addr:         ":" + config.Port,
		Handler:      router,
		ReadTimeout:  15 * time.Second,
		WriteTimeout: 15 * time.Second,
		IdleTimeout:  60 * time.Second,
	}

	// Start server in goroutine
	go func() {
		log.Printf("🚀 HomelabVPN API server starting on port %s", config.Port)
		if err := srv.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			log.Fatalf("Server failed to start: %v", err)
		}
	}()

	// Graceful shutdown
	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
	<-quit
	log.Println("Shutting down server...")

	ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
	defer cancel()

	if err := srv.Shutdown(ctx); err != nil {
		log.Fatalf("Server forced to shutdown: %v", err)
	}

	log.Println("Server exited gracefully")
}

type Config struct {
	Port                string
	DatabaseURL         string
	RedisURL            string
	JWTSecret           string
	AdminJWTSecret      string
	GoogleClientID      string
	GoogleClientSecret  string
	GoogleRedirectURL   string
	StripeSecretKey     string
	StripeWebhookSecret string
	FrontendURL         string
	AdminFrontendURL    string
	Environment         string
	RelayAPIKey         string
}

func getEnv(key, defaultValue string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return defaultValue
}

func corsMiddleware(allowedOrigins ...string) gin.HandlerFunc {
	originMap := make(map[string]bool)
	for _, origin := range allowedOrigins {
		originMap[origin] = true
	}

	return func(c *gin.Context) {
		origin := c.Request.Header.Get("Origin")

		// Check if origin is allowed
		if originMap[origin] {
			c.Writer.Header().Set("Access-Control-Allow-Origin", origin)
		} else if len(allowedOrigins) > 0 {
			// Default to first origin for non-browser requests
			c.Writer.Header().Set("Access-Control-Allow-Origin", allowedOrigins[0])
		}

		c.Writer.Header().Set("Access-Control-Allow-Credentials", "true")
		c.Writer.Header().Set("Access-Control-Allow-Headers", "Content-Type, Content-Length, Accept-Encoding, X-CSRF-Token, Authorization, accept, origin, Cache-Control, X-Requested-With")
		c.Writer.Header().Set("Access-Control-Allow-Methods", "POST, OPTIONS, GET, PUT, DELETE")

		if c.Request.Method == "OPTIONS" {
			c.AbortWithStatus(204)
			return
		}

		c.Next()
	}
}

func metricsMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		start := time.Now()

		c.Next()

		// Record metrics
		duration := time.Since(start).Seconds()
		status := strconv.Itoa(c.Writer.Status())
		endpoint := c.FullPath()
		if endpoint == "" {
			endpoint = "unknown"
		}

		metrics.HTTPRequestsTotal.WithLabelValues(c.Request.Method, endpoint, status).Inc()
		metrics.HTTPRequestDuration.WithLabelValues(c.Request.Method, endpoint).Observe(duration)
	}
}
