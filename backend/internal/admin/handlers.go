package admin

import (
	"database/sql"
	"net/http"
	"strconv"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/redis/go-redis/v9"
)

// Handler contains all admin API handlers
type Handler struct {
	db          *sql.DB
	redis       *redis.Client
	authService *AuthService
	metrics     *MetricsService
}

// NewHandler creates a new admin handler
func NewHandler(db *sql.DB, redis *redis.Client, authService *AuthService, metrics *MetricsService) *Handler {
	return &Handler{
		db:          db,
		redis:       redis,
		authService: authService,
		metrics:     metrics,
	}
}

// AuthMiddleware validates admin JWT tokens
func (h *Handler) AuthMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		authHeader := c.GetHeader("Authorization")
		if authHeader == "" {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "missing authorization header"})
			c.Abort()
			return
		}

		parts := strings.SplitN(authHeader, " ", 2)
		if len(parts) != 2 || parts[0] != "Bearer" {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "invalid authorization format"})
			c.Abort()
			return
		}

		claims, err := h.authService.VerifyToken(parts[1])
		if err != nil {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "invalid or expired token"})
			c.Abort()
			return
		}

		c.Set("adminID", claims.AdminID)
		c.Set("adminEmail", claims.Email)
		c.Set("adminUsername", claims.Username)
		c.Set("adminRole", claims.Role)
		c.Next()
	}
}

// RequireRole middleware checks if admin has required role
func (h *Handler) RequireRole(roles ...string) gin.HandlerFunc {
	return func(c *gin.Context) {
		adminRole := c.GetString("adminRole")
		for _, role := range roles {
			if adminRole == role {
				c.Next()
				return
			}
		}
		c.JSON(http.StatusForbidden, gin.H{"error": "insufficient permissions"})
		c.Abort()
	}
}

// Login handles admin login
func (h *Handler) Login(c *gin.Context) {
	var req struct {
		Username string `json:"username" binding:"required"`
		Password string `json:"password" binding:"required"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid request body"})
		return
	}

	user, accessToken, refreshToken, err := h.authService.Login(c, req.Username, req.Password)
	if err != nil {
		switch err {
		case ErrInvalidCredentials:
			c.JSON(http.StatusUnauthorized, gin.H{"error": "invalid username or password"})
		case ErrUserInactive:
			c.JSON(http.StatusForbidden, gin.H{"error": "account is inactive"})
		default:
			c.JSON(http.StatusInternalServerError, gin.H{"error": "login failed"})
		}
		return
	}

	// Log audit event
	h.authService.LogAuditEvent(c, user.ID, "login", "", nil, nil, c.ClientIP())

	c.JSON(http.StatusOK, gin.H{
		"token":        accessToken,
		"refreshToken": refreshToken,
		"expiresIn":    int(h.authService.GetTokenDuration().Seconds()),
		"user":         user,
	})
}

// RefreshToken refreshes an admin access token
func (h *Handler) RefreshToken(c *gin.Context) {
	var req struct {
		RefreshToken string `json:"refreshToken" binding:"required"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid request body"})
		return
	}

	accessToken, err := h.authService.RefreshAccessToken(c, req.RefreshToken)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "invalid refresh token"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"token":     accessToken,
		"expiresIn": int(h.authService.GetTokenDuration().Seconds()),
	})
}

// Logout handles admin logout
func (h *Handler) Logout(c *gin.Context) {
	adminID := c.GetString("adminID")
	h.authService.LogAuditEvent(c, adminID, "logout", "", nil, nil, c.ClientIP())
	c.JSON(http.StatusOK, gin.H{"status": "ok"})
}

// GetCurrentAdmin returns the current admin user
func (h *Handler) GetCurrentAdmin(c *gin.Context) {
	adminID := c.GetString("adminID")

	user, err := h.authService.GetAdminUser(c, adminID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to get user"})
		return
	}

	c.JSON(http.StatusOK, user)
}

// ChangePassword handles admin password change
func (h *Handler) ChangePassword(c *gin.Context) {
	adminID := c.GetString("adminID")

	var req struct {
		CurrentPassword string `json:"currentPassword" binding:"required"`
		NewPassword     string `json:"newPassword" binding:"required,min=8"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid request body"})
		return
	}

	if err := h.authService.UpdateAdminPassword(c, adminID, req.CurrentPassword, req.NewPassword); err != nil {
		if err == ErrInvalidCredentials {
			c.JSON(http.StatusBadRequest, gin.H{"error": "current password is incorrect"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to update password"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"status": "ok"})
}

// GetDashboardStats returns dashboard statistics
func (h *Handler) GetDashboardStats(c *gin.Context) {
	stats, err := h.metrics.GetDashboardStats(c)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to get stats"})
		return
	}

	c.JSON(http.StatusOK, stats)
}

// GetSystemHealth returns system health metrics
func (h *Handler) GetSystemHealth(c *gin.Context) {
	health, err := h.metrics.GetSystemHealth(c)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to get health"})
		return
	}

	c.JSON(http.StatusOK, health)
}

// GetBandwidthHistory returns historical bandwidth data
func (h *Handler) GetBandwidthHistory(c *gin.Context) {
	period := c.DefaultQuery("period", "24h")

	history, err := h.metrics.GetBandwidthHistory(c, period)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to get bandwidth history"})
		return
	}

	c.JSON(http.StatusOK, history)
}

// GetUserGrowth returns user growth data
func (h *Handler) GetUserGrowth(c *gin.Context) {
	period := c.DefaultQuery("period", "30d")

	growth, err := h.metrics.GetUserGrowth(c, period)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to get user growth"})
		return
	}

	c.JSON(http.StatusOK, growth)
}

// ListUsers returns all users with pagination and filters
func (h *Handler) ListUsers(c *gin.Context) {
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "20"))
	search := c.Query("search")
	status := c.Query("status")
	plan := c.Query("plan")

	offset := (page - 1) * limit

	query := `
		SELECT u.id, u.email, u.created_at, u.last_login_at, u.deleted_at,
		       COALESCE(s.plan_id, 'none') as plan, COALESCE(s.status, 'none') as sub_status,
		       s.renewal_date
		FROM users u
		LEFT JOIN subscriptions s ON u.id = s.user_id
		WHERE 1=1
	`
	args := []interface{}{}
	argCount := 1

	if search != "" {
		query += " AND u.email ILIKE $" + strconv.Itoa(argCount)
		args = append(args, "%"+search+"%")
		argCount++
	}

	if status == "active" {
		query += " AND u.deleted_at IS NULL AND s.status = 'active'"
	} else if status == "inactive" {
		query += " AND (u.deleted_at IS NOT NULL OR s.status IS NULL OR s.status != 'active')"
	}

	if plan != "" && plan != "all" {
		query += " AND s.plan_id = $" + strconv.Itoa(argCount)
		args = append(args, plan)
		argCount++
	}

	// Get total count
	countQuery := strings.Replace(query, "SELECT u.id, u.email, u.created_at, u.last_login_at, u.deleted_at,\n\t\t       COALESCE(s.plan_id, 'none') as plan, COALESCE(s.status, 'none') as sub_status,\n\t\t       s.renewal_date", "SELECT COUNT(*)", 1)

	var total int
	h.db.QueryRowContext(c, countQuery, args...).Scan(&total)

	query += " ORDER BY u.created_at DESC LIMIT $" + strconv.Itoa(argCount) + " OFFSET $" + strconv.Itoa(argCount+1)
	args = append(args, limit, offset)

	rows, err := h.db.QueryContext(c, query, args...)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to fetch users"})
		return
	}
	defer rows.Close()

	var users []gin.H
	for rows.Next() {
		var id, email, plan, subStatus string
		var createdAt time.Time
		var lastLoginAt, deletedAt, renewalDate *time.Time

		if err := rows.Scan(&id, &email, &createdAt, &lastLoginAt, &deletedAt, &plan, &subStatus, &renewalDate); err != nil {
			continue
		}

		status := "active"
		if deletedAt != nil {
			status = "deleted"
		} else if subStatus != "active" {
			status = "inactive"
		}

		users = append(users, gin.H{
			"id":          id,
			"email":       email,
			"createdAt":   createdAt,
			"lastLoginAt": lastLoginAt,
			"plan":        plan,
			"status":      status,
			"renewalDate": renewalDate,
		})
	}

	c.JSON(http.StatusOK, gin.H{
		"users": users,
		"pagination": gin.H{
			"page":       page,
			"limit":      limit,
			"total":      total,
			"totalPages": (total + limit - 1) / limit,
		},
	})
}

// GetUser returns a single user's details
func (h *Handler) GetUser(c *gin.Context) {
	userID := c.Param("id")

	var user struct {
		ID          string
		Email       string
		CreatedAt   time.Time
		LastLoginAt *time.Time
		DeletedAt   *time.Time
	}

	err := h.db.QueryRowContext(c, `
		SELECT id, email, created_at, last_login_at, deleted_at
		FROM users WHERE id = $1
	`, userID).Scan(&user.ID, &user.Email, &user.CreatedAt, &user.LastLoginAt, &user.DeletedAt)

	if err == sql.ErrNoRows {
		c.JSON(http.StatusNotFound, gin.H{"error": "user not found"})
		return
	}
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to fetch user"})
		return
	}

	// Get subscription
	var sub struct {
		PlanID      string
		Status      string
		RenewalDate *time.Time
		StartDate   time.Time
	}
	h.db.QueryRowContext(c, `
		SELECT plan_id, status, renewal_date, start_date
		FROM subscriptions WHERE user_id = $1
	`, userID).Scan(&sub.PlanID, &sub.Status, &sub.RenewalDate, &sub.StartDate)

	// Log audit
	adminID := c.GetString("adminID")
	h.authService.LogAuditEvent(c, adminID, "user_view", "user", &userID, nil, c.ClientIP())

	c.JSON(http.StatusOK, gin.H{
		"id":          user.ID,
		"email":       user.Email,
		"createdAt":   user.CreatedAt,
		"lastLoginAt": user.LastLoginAt,
		"deletedAt":   user.DeletedAt,
		"subscription": gin.H{
			"plan":        sub.PlanID,
			"status":      sub.Status,
			"renewalDate": sub.RenewalDate,
			"startDate":   sub.StartDate,
		},
	})
}

// UpdateUser updates a user
func (h *Handler) UpdateUser(c *gin.Context) {
	userID := c.Param("id")
	adminID := c.GetString("adminID")

	var req struct {
		Email  string `json:"email"`
		Status string `json:"status"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid request body"})
		return
	}

	if req.Email != "" {
		_, err := h.db.ExecContext(c, `UPDATE users SET email = $1 WHERE id = $2`, req.Email, userID)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to update user"})
			return
		}
	}

	if req.Status == "deleted" {
		_, err := h.db.ExecContext(c, `UPDATE users SET deleted_at = NOW() WHERE id = $1`, userID)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to update user"})
			return
		}
	} else if req.Status == "active" {
		_, err := h.db.ExecContext(c, `UPDATE users SET deleted_at = NULL WHERE id = $1`, userID)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to update user"})
			return
		}
	}

	h.authService.LogAuditEvent(c, adminID, "user_update", "user", &userID, map[string]interface{}{"changes": req}, c.ClientIP())

	c.JSON(http.StatusOK, gin.H{"status": "ok"})
}

// DeleteUser soft-deletes a user
func (h *Handler) DeleteUser(c *gin.Context) {
	userID := c.Param("id")
	adminID := c.GetString("adminID")

	_, err := h.db.ExecContext(c, `UPDATE users SET deleted_at = NOW() WHERE id = $1`, userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to delete user"})
		return
	}

	// Cancel subscription if exists
	h.db.ExecContext(c, `UPDATE subscriptions SET status = 'cancelled', cancelled_at = NOW() WHERE user_id = $1`, userID)

	h.authService.LogAuditEvent(c, adminID, "user_delete", "user", &userID, nil, c.ClientIP())

	c.JSON(http.StatusOK, gin.H{"status": "ok"})
}

// ListSubscriptions returns all subscriptions
func (h *Handler) ListSubscriptions(c *gin.Context) {
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "20"))
	status := c.Query("status")
	plan := c.Query("plan")

	offset := (page - 1) * limit

	query := `
		SELECT s.id, s.user_id, u.email, s.plan_id, s.status, s.billing_period,
		       s.start_date, s.renewal_date, s.cancelled_at, s.stripe_subscription_id
		FROM subscriptions s
		JOIN users u ON s.user_id = u.id
		WHERE 1=1
	`
	args := []interface{}{}
	argCount := 1

	if status != "" && status != "all" {
		query += " AND s.status = $" + strconv.Itoa(argCount)
		args = append(args, status)
		argCount++
	}

	if plan != "" && plan != "all" {
		query += " AND s.plan_id = $" + strconv.Itoa(argCount)
		args = append(args, plan)
		argCount++
	}

	// Get total
	countQuery := strings.Replace(query, "SELECT s.id, s.user_id, u.email, s.plan_id, s.status, s.billing_period,\n\t\t       s.start_date, s.renewal_date, s.cancelled_at, s.stripe_subscription_id", "SELECT COUNT(*)", 1)
	var total int
	h.db.QueryRowContext(c, countQuery, args...).Scan(&total)

	query += " ORDER BY s.created_at DESC LIMIT $" + strconv.Itoa(argCount) + " OFFSET $" + strconv.Itoa(argCount+1)
	args = append(args, limit, offset)

	rows, err := h.db.QueryContext(c, query, args...)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to fetch subscriptions"})
		return
	}
	defer rows.Close()

	var subscriptions []gin.H
	for rows.Next() {
		var id, userID, email, planID, status, billingPeriod string
		var startDate time.Time
		var renewalDate, cancelledAt *time.Time
		var stripeSubID *string

		if err := rows.Scan(&id, &userID, &email, &planID, &status, &billingPeriod,
			&startDate, &renewalDate, &cancelledAt, &stripeSubID); err != nil {
			continue
		}

		subscriptions = append(subscriptions, gin.H{
			"id":            id,
			"userId":        userID,
			"email":         email,
			"plan":          planID,
			"status":        status,
			"billingPeriod": billingPeriod,
			"startDate":     startDate,
			"renewalDate":   renewalDate,
			"cancelledAt":   cancelledAt,
			"stripeId":      stripeSubID,
		})
	}

	c.JSON(http.StatusOK, gin.H{
		"subscriptions": subscriptions,
		"pagination": gin.H{
			"page":       page,
			"limit":      limit,
			"total":      total,
			"totalPages": (total + limit - 1) / limit,
		},
	})
}

// UpdateSubscription updates a subscription
func (h *Handler) UpdateSubscription(c *gin.Context) {
	subID := c.Param("id")
	adminID := c.GetString("adminID")

	var req struct {
		Status string `json:"status"`
		Plan   string `json:"plan"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid request body"})
		return
	}

	if req.Status != "" {
		_, err := h.db.ExecContext(c, `UPDATE subscriptions SET status = $1 WHERE id = $2`, req.Status, subID)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to update subscription"})
			return
		}
	}

	if req.Plan != "" {
		_, err := h.db.ExecContext(c, `UPDATE subscriptions SET plan_id = $1 WHERE id = $2`, req.Plan, subID)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to update subscription"})
			return
		}
	}

	h.authService.LogAuditEvent(c, adminID, "subscription_update", "subscription", &subID, map[string]interface{}{"changes": req}, c.ClientIP())

	c.JSON(http.StatusOK, gin.H{"status": "ok"})
}

// CancelSubscription cancels a subscription
func (h *Handler) CancelSubscription(c *gin.Context) {
	subID := c.Param("id")
	adminID := c.GetString("adminID")

	_, err := h.db.ExecContext(c, `
		UPDATE subscriptions SET status = 'cancelled', cancelled_at = NOW() WHERE id = $1
	`, subID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to cancel subscription"})
		return
	}

	h.authService.LogAuditEvent(c, adminID, "subscription_cancel", "subscription", &subID, nil, c.ClientIP())

	c.JSON(http.StatusOK, gin.H{"status": "ok"})
}

// ListServers returns all VPN servers
func (h *Handler) ListServers(c *gin.Context) {
	rows, err := h.db.QueryContext(c, `
		SELECT id, country, city, hostname, public_ip, status, capacity, current_load,
		       listen_port, created_at, updated_at
		FROM vpn_servers ORDER BY country, city
	`)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to fetch servers"})
		return
	}
	defer rows.Close()

	var servers []gin.H
	for rows.Next() {
		var id, country, city, hostname, publicIP, status string
		var capacity, currentLoad, listenPort int
		var createdAt, updatedAt time.Time

		if err := rows.Scan(&id, &country, &city, &hostname, &publicIP, &status,
			&capacity, &currentLoad, &listenPort, &createdAt, &updatedAt); err != nil {
			continue
		}

		// Get real-time metrics from Redis
		metrics := h.metrics.GetServerMetrics(c, id)

		servers = append(servers, gin.H{
			"id":          id,
			"country":     country,
			"city":        city,
			"hostname":    hostname,
			"ip":          publicIP,
			"status":      status,
			"capacity":    capacity,
			"currentLoad": currentLoad,
			"listenPort":  listenPort,
			"createdAt":   createdAt,
			"updatedAt":   updatedAt,
			"metrics":     metrics,
		})
	}

	c.JSON(http.StatusOK, gin.H{"servers": servers})
}

// UpdateServer updates a VPN server
func (h *Handler) UpdateServer(c *gin.Context) {
	serverID := c.Param("id")
	adminID := c.GetString("adminID")

	var req struct {
		Status   string `json:"status"`
		Capacity int    `json:"capacity"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid request body"})
		return
	}

	if req.Status != "" {
		_, err := h.db.ExecContext(c, `UPDATE vpn_servers SET status = $1 WHERE id = $2`, req.Status, serverID)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to update server"})
			return
		}
	}

	if req.Capacity > 0 {
		_, err := h.db.ExecContext(c, `UPDATE vpn_servers SET capacity = $1 WHERE id = $2`, req.Capacity, serverID)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to update server"})
			return
		}
	}

	h.authService.LogAuditEvent(c, adminID, "server_update", "server", &serverID, map[string]interface{}{"changes": req}, c.ClientIP())

	c.JSON(http.StatusOK, gin.H{"status": "ok"})
}

// GetAuditLogs returns admin audit logs
func (h *Handler) GetAuditLogs(c *gin.Context) {
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "50"))
	offset := (page - 1) * limit

	rows, err := h.db.QueryContext(c, `
		SELECT al.id, al.admin_user_id, au.username, al.action, al.target_type,
		       al.target_id, al.details, al.ip_address, al.created_at
		FROM admin_audit_logs al
		LEFT JOIN admin_users au ON al.admin_user_id = au.id
		ORDER BY al.created_at DESC
		LIMIT $1 OFFSET $2
	`, limit, offset)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to fetch audit logs"})
		return
	}
	defer rows.Close()

	var logs []gin.H
	for rows.Next() {
		var id, action string
		var adminID, username, targetType, targetID, ipAddress *string
		var details interface{}
		var createdAt time.Time

		if err := rows.Scan(&id, &adminID, &username, &action, &targetType,
			&targetID, &details, &ipAddress, &createdAt); err != nil {
			continue
		}

		logs = append(logs, gin.H{
			"id":         id,
			"adminId":    adminID,
			"username":   username,
			"action":     action,
			"targetType": targetType,
			"targetId":   targetID,
			"details":    details,
			"ipAddress":  ipAddress,
			"createdAt":  createdAt,
		})
	}

	var total int
	h.db.QueryRowContext(c, `SELECT COUNT(*) FROM admin_audit_logs`).Scan(&total)

	c.JSON(http.StatusOK, gin.H{
		"logs": logs,
		"pagination": gin.H{
			"page":       page,
			"limit":      limit,
			"total":      total,
			"totalPages": (total + limit - 1) / limit,
		},
	})
}

// GetRevenueStats returns revenue statistics
func (h *Handler) GetRevenueStats(c *gin.Context) {
	stats, err := h.metrics.GetRevenueStats(c)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to get revenue stats"})
		return
	}

	c.JSON(http.StatusOK, stats)
}

// ListPeers returns all WireGuard peers with platform info
func (h *Handler) ListPeers(c *gin.Context) {
	platform := c.Query("platform") // "desktop", "ios-relay", or empty for all

	query := `
		SELECT wk.id, wk.user_id, u.email, wk.public_key, wk.client_ip, wk.platform,
		       wk.created_at, wk.rotated_at,
		       CASE WHEN s.status = 'active' THEN true ELSE false END as active
		FROM wireguard_keys wk
		JOIN users u ON u.id = wk.user_id
		LEFT JOIN subscriptions s ON s.user_id = wk.user_id
		WHERE u.deleted_at IS NULL
	`
	args := []interface{}{}
	argCount := 1

	if platform != "" && platform != "all" {
		query += " AND wk.platform = $" + strconv.Itoa(argCount)
		args = append(args, platform)
		argCount++
	}

	query += " ORDER BY wk.created_at DESC"

	rows, err := h.db.QueryContext(c, query, args...)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to fetch peers"})
		return
	}
	defer rows.Close()

	var peers []gin.H
	for rows.Next() {
		var id, userID, email, publicKey, clientIP, peerPlatform string
		var createdAt time.Time
		var rotatedAt *time.Time
		var active bool

		if err := rows.Scan(&id, &userID, &email, &publicKey, &clientIP, &peerPlatform, &createdAt, &rotatedAt, &active); err != nil {
			continue
		}

		peers = append(peers, gin.H{
			"id":        id,
			"userId":    userID,
			"email":     email,
			"publicKey": publicKey,
			"clientIP":  clientIP,
			"platform":  peerPlatform,
			"createdAt": createdAt,
			"rotatedAt": rotatedAt,
			"active":    active,
		})
	}

	// Get stats
	var desktopCount, iosRelayCount int
	h.db.QueryRowContext(c, `SELECT COUNT(*) FROM wireguard_keys WHERE platform = 'desktop'`).Scan(&desktopCount)
	h.db.QueryRowContext(c, `SELECT COUNT(*) FROM wireguard_keys WHERE platform = 'ios-relay'`).Scan(&iosRelayCount)

	c.JSON(http.StatusOK, gin.H{
		"peers": peers,
		"stats": gin.H{
			"total":    len(peers),
			"desktop":  desktopCount,
			"iosRelay": iosRelayCount,
		},
	})
}

// GetPeer returns a single peer's details
func (h *Handler) GetPeer(c *gin.Context) {
	peerID := c.Param("id")

	var id, userID, email, publicKey, clientIP, platform string
	var createdAt time.Time
	var rotatedAt *time.Time
	var active bool

	err := h.db.QueryRowContext(c, `
		SELECT wk.id, wk.user_id, u.email, wk.public_key, wk.client_ip, wk.platform,
		       wk.created_at, wk.rotated_at,
		       CASE WHEN s.status = 'active' THEN true ELSE false END as active
		FROM wireguard_keys wk
		JOIN users u ON u.id = wk.user_id
		LEFT JOIN subscriptions s ON s.user_id = wk.user_id
		WHERE wk.id = $1 AND u.deleted_at IS NULL
	`, peerID).Scan(&id, &userID, &email, &publicKey, &clientIP, &platform, &createdAt, &rotatedAt, &active)

	if err == sql.ErrNoRows {
		c.JSON(http.StatusNotFound, gin.H{"error": "peer not found"})
		return
	}
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to fetch peer"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"id":        id,
		"userId":    userID,
		"email":     email,
		"publicKey": publicKey,
		"clientIP":  clientIP,
		"platform":  platform,
		"createdAt": createdAt,
		"rotatedAt": rotatedAt,
		"active":    active,
	})
}

// UpdatePeerPlatform updates a peer's platform setting
func (h *Handler) UpdatePeerPlatform(c *gin.Context) {
	peerID := c.Param("id")
	adminID := c.GetString("adminID")

	var req struct {
		Platform string `json:"platform" binding:"required"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid request body"})
		return
	}

	if req.Platform != "desktop" && req.Platform != "ios-relay" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid platform, must be 'desktop' or 'ios-relay'"})
		return
	}

	result, err := h.db.ExecContext(c, `
		UPDATE wireguard_keys SET platform = $1 WHERE id = $2
	`, req.Platform, peerID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to update peer"})
		return
	}

	rowsAffected, _ := result.RowsAffected()
	if rowsAffected == 0 {
		c.JSON(http.StatusNotFound, gin.H{"error": "peer not found"})
		return
	}

	// Log audit
	h.authService.LogAuditEvent(c, adminID, "user_update", "peer", &peerID, map[string]interface{}{"platform": req.Platform}, c.ClientIP())

	c.JSON(http.StatusOK, gin.H{"status": "ok", "platform": req.Platform})
}

// BulkUpdatePeerPlatform updates multiple peers' platform settings
func (h *Handler) BulkUpdatePeerPlatform(c *gin.Context) {
	adminID := c.GetString("adminID")

	var req struct {
		PeerIDs  []string `json:"peerIds" binding:"required"`
		Platform string   `json:"platform" binding:"required"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid request body"})
		return
	}

	if req.Platform != "desktop" && req.Platform != "ios-relay" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid platform, must be 'desktop' or 'ios-relay'"})
		return
	}

	if len(req.PeerIDs) == 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "no peer IDs provided"})
		return
	}

	// Build query with IN clause
	placeholders := make([]string, len(req.PeerIDs))
	args := make([]interface{}, len(req.PeerIDs)+1)
	args[0] = req.Platform
	for i, id := range req.PeerIDs {
		placeholders[i] = "$" + strconv.Itoa(i+2)
		args[i+1] = id
	}

	query := "UPDATE wireguard_keys SET platform = $1 WHERE id IN (" + strings.Join(placeholders, ",") + ")"
	result, err := h.db.ExecContext(c, query, args...)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to update peers"})
		return
	}

	rowsAffected, _ := result.RowsAffected()

	// Log audit
	h.authService.LogAuditEvent(c, adminID, "user_update", "peers", nil, map[string]interface{}{
		"peerIds":  req.PeerIDs,
		"platform": req.Platform,
		"count":    rowsAffected,
	}, c.ClientIP())

	c.JSON(http.StatusOK, gin.H{
		"status":  "ok",
		"updated": rowsAffected,
	})
}
