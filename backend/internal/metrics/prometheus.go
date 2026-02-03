package metrics

import (
	"github.com/prometheus/client_golang/prometheus"
	"github.com/prometheus/client_golang/prometheus/promauto"
)

var (
	// HTTP metrics
	HTTPRequestsTotal = promauto.NewCounterVec(
		prometheus.CounterOpts{
			Name: "homelabvpn_http_requests_total",
			Help: "Total number of HTTP requests",
		},
		[]string{"method", "endpoint", "status"},
	)

	HTTPRequestDuration = promauto.NewHistogramVec(
		prometheus.HistogramOpts{
			Name:    "homelabvpn_http_request_duration_seconds",
			Help:    "HTTP request duration in seconds",
			Buckets: prometheus.DefBuckets,
		},
		[]string{"method", "endpoint"},
	)

	// VPN metrics
	ActiveConnections = promauto.NewGauge(
		prometheus.GaugeOpts{
			Name: "homelabvpn_active_connections",
			Help: "Number of active VPN connections",
		},
	)

	ConnectionsTotal = promauto.NewCounterVec(
		prometheus.CounterOpts{
			Name: "homelabvpn_connections_total",
			Help: "Total number of VPN connections",
		},
		[]string{"server", "status"},
	)

	BandwidthBytes = promauto.NewCounterVec(
		prometheus.CounterOpts{
			Name: "homelabvpn_bandwidth_bytes_total",
			Help: "Total bandwidth transferred in bytes",
		},
		[]string{"server", "direction"},
	)

	// Subscription metrics
	ActiveSubscriptions = promauto.NewGaugeVec(
		prometheus.GaugeOpts{
			Name: "homelabvpn_active_subscriptions",
			Help: "Number of active subscriptions",
		},
		[]string{"plan", "billing_period"},
	)

	SubscriptionEvents = promauto.NewCounterVec(
		prometheus.CounterOpts{
			Name: "homelabvpn_subscription_events_total",
			Help: "Total subscription events",
		},
		[]string{"event_type", "plan"},
	)

	// User metrics
	TotalUsers = promauto.NewGauge(
		prometheus.GaugeOpts{
			Name: "homelabvpn_total_users",
			Help: "Total number of registered users",
		},
	)

	UserRegistrations = promauto.NewCounter(
		prometheus.CounterOpts{
			Name: "homelabvpn_user_registrations_total",
			Help: "Total number of user registrations",
		},
	)

	// Server metrics
	ServerStatus = promauto.NewGaugeVec(
		prometheus.GaugeOpts{
			Name: "homelabvpn_server_status",
			Help: "VPN server status (1=active, 0=inactive)",
		},
		[]string{"server_id", "country", "city"},
	)

	ServerLoad = promauto.NewGaugeVec(
		prometheus.GaugeOpts{
			Name: "homelabvpn_server_load",
			Help: "VPN server load percentage",
		},
		[]string{"server_id"},
	)

	ServerConnections = promauto.NewGaugeVec(
		prometheus.GaugeOpts{
			Name: "homelabvpn_server_connections",
			Help: "Number of connections per server",
		},
		[]string{"server_id"},
	)

	// Auth metrics
	AuthAttempts = promauto.NewCounterVec(
		prometheus.CounterOpts{
			Name: "homelabvpn_auth_attempts_total",
			Help: "Total authentication attempts",
		},
		[]string{"type", "status"},
	)

	// Error metrics
	Errors = promauto.NewCounterVec(
		prometheus.CounterOpts{
			Name: "homelabvpn_errors_total",
			Help: "Total number of errors",
		},
		[]string{"type", "component"},
	)

	// Database metrics
	DBConnections = promauto.NewGauge(
		prometheus.GaugeOpts{
			Name: "homelabvpn_db_connections",
			Help: "Number of active database connections",
		},
	)

	DBQueryDuration = promauto.NewHistogramVec(
		prometheus.HistogramOpts{
			Name:    "homelabvpn_db_query_duration_seconds",
			Help:    "Database query duration in seconds",
			Buckets: prometheus.DefBuckets,
		},
		[]string{"operation"},
	)

	// Redis metrics
	RedisConnections = promauto.NewGauge(
		prometheus.GaugeOpts{
			Name: "homelabvpn_redis_connections",
			Help: "Number of active Redis connections",
		},
	)

	RedisOperations = promauto.NewCounterVec(
		prometheus.CounterOpts{
			Name: "homelabvpn_redis_operations_total",
			Help: "Total Redis operations",
		},
		[]string{"operation", "status"},
	)
)

// RecordHTTPRequest records an HTTP request metric
func RecordHTTPRequest(method, endpoint, status string) {
	HTTPRequestsTotal.WithLabelValues(method, endpoint, status).Inc()
}

// RecordConnection records a VPN connection event
func RecordConnection(server, status string) {
	ConnectionsTotal.WithLabelValues(server, status).Inc()
	if status == "connected" {
		ActiveConnections.Inc()
	} else if status == "disconnected" {
		ActiveConnections.Dec()
	}
}

// RecordBandwidth records bandwidth usage
func RecordBandwidth(server, direction string, bytes float64) {
	BandwidthBytes.WithLabelValues(server, direction).Add(bytes)
}

// RecordSubscription records a subscription event
func RecordSubscription(eventType, plan string) {
	SubscriptionEvents.WithLabelValues(eventType, plan).Inc()
}

// RecordAuth records an authentication attempt
func RecordAuth(authType, status string) {
	AuthAttempts.WithLabelValues(authType, status).Inc()
}

// RecordError records an error
func RecordError(errorType, component string) {
	Errors.WithLabelValues(errorType, component).Inc()
}

// UpdateServerMetrics updates server metrics
func UpdateServerMetrics(serverID, country, city string, status int, load float64, connections int) {
	ServerStatus.WithLabelValues(serverID, country, city).Set(float64(status))
	ServerLoad.WithLabelValues(serverID).Set(load)
	ServerConnections.WithLabelValues(serverID).Set(float64(connections))
}

// UpdateSubscriptionMetrics updates subscription counts
func UpdateSubscriptionMetrics(plan, billingPeriod string, count float64) {
	ActiveSubscriptions.WithLabelValues(plan, billingPeriod).Set(count)
}
