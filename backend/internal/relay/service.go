package relay

import (
	"context"
	"database/sql"
	"fmt"
	"time"

	"github.com/google/uuid"
	"github.com/redis/go-redis/v9"
)

// Service handles relay server operations
type Service struct {
	db    *sql.DB
	redis *redis.Client
}

// RelayServer represents a registered relay server
type RelayServer struct {
	ID        string    `json:"id"`
	Name      string    `json:"name"`
	PublicIP  string    `json:"publicIP"`
	PublicKey string    `json:"publicKey"`
	Region    string    `json:"region"`
	Type      string    `json:"type"` // "ios-relay", "standard"
	Status    string    `json:"status"`
	LastSeen  time.Time `json:"lastSeen"`
	CreatedAt time.Time `json:"createdAt"`
}

// Peer represents a WireGuard peer configuration
type Peer struct {
	UserID    string `json:"userId"`
	PublicKey string `json:"publicKey"`
	ClientIP  string `json:"clientIP"`
	Email     string `json:"email,omitempty"`
	Platform  string `json:"platform"` // "desktop" or "ios-relay"
	Active    bool   `json:"active"`
}

// NewService creates a new relay service
func NewService(db *sql.DB, redis *redis.Client) *Service {
	return &Service{
		db:    db,
		redis: redis,
	}
}

// RegisterRelay registers a new relay server or updates existing
func (s *Service) RegisterRelay(ctx context.Context, name, publicIP, publicKey, region, relayType string) (*RelayServer, error) {
	relay := &RelayServer{
		ID:        uuid.New().String(),
		Name:      name,
		PublicIP:  publicIP,
		PublicKey: publicKey,
		Region:    region,
		Type:      relayType,
		Status:    "online",
		LastSeen:  time.Now(),
		CreatedAt: time.Now(),
	}

	_, err := s.db.ExecContext(ctx, `
		INSERT INTO relay_servers (id, name, public_ip, public_key, region, type, status, last_seen, created_at)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
		ON CONFLICT (public_ip) DO UPDATE SET
			name = EXCLUDED.name,
			public_key = EXCLUDED.public_key,
			status = 'online',
			last_seen = NOW()
		RETURNING id, created_at
	`, relay.ID, relay.Name, relay.PublicIP, relay.PublicKey, relay.Region, relay.Type, relay.Status, relay.LastSeen, relay.CreatedAt)

	if err != nil {
		return nil, err
	}

	// Store relay info in Redis for quick access
	s.redis.Set(ctx, "relay:"+relay.PublicIP, relay.ID, 5*time.Minute)

	return relay, nil
}

// Heartbeat updates relay's last seen time
func (s *Service) Heartbeat(ctx context.Context, relayIP string, stats map[string]interface{}) error {
	_, err := s.db.ExecContext(ctx, `
		UPDATE relay_servers
		SET last_seen = NOW(), status = 'online'
		WHERE public_ip = $1
	`, relayIP)

	if err != nil {
		return err
	}

	// Extend Redis TTL
	s.redis.Expire(ctx, "relay:"+relayIP, 5*time.Minute)

	return nil
}

// GetPeers returns all active iOS relay peers for a relay to sync
func (s *Service) GetPeers(ctx context.Context) ([]Peer, error) {
	return s.GetPeersByPlatform(ctx, "ios-relay")
}

// GetPeersByPlatform returns peers filtered by platform type
func (s *Service) GetPeersByPlatform(ctx context.Context, platform string) ([]Peer, error) {
	rows, err := s.db.QueryContext(ctx, `
		SELECT
			wk.user_id,
			wk.public_key,
			wk.client_ip,
			u.email,
			wk.platform,
			CASE WHEN s.status = 'active' THEN true ELSE false END as active
		FROM wireguard_keys wk
		JOIN users u ON u.id = wk.user_id
		LEFT JOIN subscriptions s ON s.user_id = wk.user_id
		WHERE u.deleted_at IS NULL
		AND wk.platform = $1
	`, platform)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var peers []Peer
	for rows.Next() {
		var peer Peer
		var email sql.NullString
		var active sql.NullBool

		if err := rows.Scan(&peer.UserID, &peer.PublicKey, &peer.ClientIP, &email, &peer.Platform, &active); err != nil {
			continue
		}

		if email.Valid {
			peer.Email = email.String
		}
		peer.Active = active.Valid && active.Bool

		peers = append(peers, peer)
	}

	return peers, nil
}

// GetAllPeers returns all peers regardless of platform (for admin use)
func (s *Service) GetAllPeers(ctx context.Context) ([]Peer, error) {
	rows, err := s.db.QueryContext(ctx, `
		SELECT
			wk.user_id,
			wk.public_key,
			wk.client_ip,
			u.email,
			wk.platform,
			CASE WHEN s.status = 'active' THEN true ELSE false END as active
		FROM wireguard_keys wk
		JOIN users u ON u.id = wk.user_id
		LEFT JOIN subscriptions s ON s.user_id = wk.user_id
		WHERE u.deleted_at IS NULL
		ORDER BY wk.created_at DESC
	`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var peers []Peer
	for rows.Next() {
		var peer Peer
		var email sql.NullString
		var active sql.NullBool

		if err := rows.Scan(&peer.UserID, &peer.PublicKey, &peer.ClientIP, &email, &peer.Platform, &active); err != nil {
			continue
		}

		if email.Valid {
			peer.Email = email.String
		}
		peer.Active = active.Valid && active.Bool

		peers = append(peers, peer)
	}

	return peers, nil
}

// GetRelayServers returns all registered relay servers
func (s *Service) GetRelayServers(ctx context.Context) ([]RelayServer, error) {
	rows, err := s.db.QueryContext(ctx, `
		SELECT id, name, public_ip, public_key, region, type, status, last_seen, created_at
		FROM relay_servers
		ORDER BY region, name
	`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var servers []RelayServer
	for rows.Next() {
		var server RelayServer
		if err := rows.Scan(
			&server.ID, &server.Name, &server.PublicIP, &server.PublicKey,
			&server.Region, &server.Type, &server.Status, &server.LastSeen, &server.CreatedAt,
		); err != nil {
			continue
		}
		servers = append(servers, server)
	}

	return servers, nil
}

// MarkOfflineRelays marks relays that haven't sent heartbeat as offline
func (s *Service) MarkOfflineRelays(ctx context.Context) error {
	_, err := s.db.ExecContext(ctx, `
		UPDATE relay_servers
		SET status = 'offline'
		WHERE last_seen < NOW() - INTERVAL '5 minutes'
		AND status = 'online'
	`)
	return err
}

// UpdatePeerPlatform changes a user's platform setting
func (s *Service) UpdatePeerPlatform(ctx context.Context, userID string, platform string) error {
	if platform != "desktop" && platform != "ios-relay" {
		return fmt.Errorf("invalid platform: %s", platform)
	}

	result, err := s.db.ExecContext(ctx, `
		UPDATE wireguard_keys
		SET platform = $1
		WHERE user_id = $2
	`, platform, userID)
	if err != nil {
		return err
	}

	rowsAffected, err := result.RowsAffected()
	if err != nil {
		return err
	}
	if rowsAffected == 0 {
		return fmt.Errorf("peer not found for user: %s", userID)
	}

	return nil
}

// GetPeerStats returns statistics about peers by platform
func (s *Service) GetPeerStats(ctx context.Context) (map[string]int, error) {
	rows, err := s.db.QueryContext(ctx, `
		SELECT platform, COUNT(*) as count
		FROM wireguard_keys wk
		JOIN users u ON u.id = wk.user_id
		WHERE u.deleted_at IS NULL
		GROUP BY platform
	`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	stats := make(map[string]int)
	for rows.Next() {
		var platform string
		var count int
		if err := rows.Scan(&platform, &count); err != nil {
			continue
		}
		stats[platform] = count
	}

	return stats, nil
}
