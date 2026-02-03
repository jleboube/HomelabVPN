package admin

import (
	"context"
	"crypto/rand"
	"database/sql"
	"encoding/base64"
	"errors"
	"time"

	"github.com/golang-jwt/jwt/v5"
	"golang.org/x/crypto/bcrypt"
)

var (
	ErrInvalidCredentials = errors.New("invalid email or password")
	ErrUserNotFound       = errors.New("admin user not found")
	ErrUserInactive       = errors.New("admin account is inactive")
	ErrInvalidToken       = errors.New("invalid or expired token")
)

// AdminUser represents an admin user
type AdminUser struct {
	ID          string     `json:"id"`
	Email       string     `json:"email"`
	Username    string     `json:"username"`
	Role        string     `json:"role"`
	IsActive    bool       `json:"isActive"`
	LastLoginAt *time.Time `json:"lastLoginAt,omitempty"`
	CreatedAt   time.Time  `json:"createdAt"`
}

// AdminClaims represents JWT claims for admin tokens
type AdminClaims struct {
	AdminID  string `json:"adminId"`
	Email    string `json:"email"`
	Username string `json:"username"`
	Role     string `json:"role"`
	jwt.RegisteredClaims
}

// AuthService handles admin authentication
type AuthService struct {
	db            *sql.DB
	jwtSecret     []byte
	tokenDuration time.Duration
}

// NewAuthService creates a new admin auth service
func NewAuthService(db *sql.DB, jwtSecret string) *AuthService {
	return &AuthService{
		db:            db,
		jwtSecret:     []byte(jwtSecret),
		tokenDuration: 8 * time.Hour, // Admin sessions last 8 hours
	}
}

// Login authenticates an admin user
func (s *AuthService) Login(ctx context.Context, email, password string) (*AdminUser, string, string, error) {
	var user AdminUser
	var passwordHash string

	err := s.db.QueryRowContext(ctx, `
		SELECT id, email, username, password_hash, role, is_active, last_login_at, created_at
		FROM admin_users
		WHERE email = $1 OR username = $1
	`, email).Scan(
		&user.ID, &user.Email, &user.Username, &passwordHash,
		&user.Role, &user.IsActive, &user.LastLoginAt, &user.CreatedAt,
	)

	if err == sql.ErrNoRows {
		return nil, "", "", ErrInvalidCredentials
	}
	if err != nil {
		return nil, "", "", err
	}

	if !user.IsActive {
		return nil, "", "", ErrUserInactive
	}

	// Verify password
	if err := bcrypt.CompareHashAndPassword([]byte(passwordHash), []byte(password)); err != nil {
		return nil, "", "", ErrInvalidCredentials
	}

	// Update last login
	_, err = s.db.ExecContext(ctx, `
		UPDATE admin_users SET last_login_at = NOW() WHERE id = $1
	`, user.ID)
	if err != nil {
		return nil, "", "", err
	}

	// Generate tokens
	accessToken, err := s.generateToken(&user)
	if err != nil {
		return nil, "", "", err
	}

	refreshToken, err := s.generateRefreshToken(&user)
	if err != nil {
		return nil, "", "", err
	}

	return &user, accessToken, refreshToken, nil
}

// VerifyToken verifies an admin JWT token
func (s *AuthService) VerifyToken(tokenString string) (*AdminClaims, error) {
	token, err := jwt.ParseWithClaims(tokenString, &AdminClaims{}, func(token *jwt.Token) (interface{}, error) {
		return s.jwtSecret, nil
	})

	if err != nil {
		return nil, ErrInvalidToken
	}

	claims, ok := token.Claims.(*AdminClaims)
	if !ok || !token.Valid {
		return nil, ErrInvalidToken
	}

	return claims, nil
}

// RefreshAccessToken generates a new access token from a refresh token
func (s *AuthService) RefreshAccessToken(ctx context.Context, refreshToken string) (string, error) {
	claims, err := s.VerifyToken(refreshToken)
	if err != nil {
		return "", err
	}

	// Verify user still exists and is active
	var isActive bool
	err = s.db.QueryRowContext(ctx, `
		SELECT is_active FROM admin_users WHERE id = $1
	`, claims.AdminID).Scan(&isActive)

	if err == sql.ErrNoRows {
		return "", ErrUserNotFound
	}
	if err != nil {
		return "", err
	}
	if !isActive {
		return "", ErrUserInactive
	}

	// Generate new access token
	user := &AdminUser{
		ID:       claims.AdminID,
		Email:    claims.Email,
		Username: claims.Username,
		Role:     claims.Role,
	}

	return s.generateToken(user)
}

// CreateAdminUser creates a new admin user
func (s *AuthService) CreateAdminUser(ctx context.Context, email, username, password, role, createdBy string) (*AdminUser, error) {
	// Hash password
	hash, err := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)
	if err != nil {
		return nil, err
	}

	var user AdminUser
	err = s.db.QueryRowContext(ctx, `
		INSERT INTO admin_users (email, username, password_hash, role, created_by)
		VALUES ($1, $2, $3, $4, $5)
		RETURNING id, email, username, role, is_active, created_at
	`, email, username, string(hash), role, createdBy).Scan(
		&user.ID, &user.Email, &user.Username, &user.Role, &user.IsActive, &user.CreatedAt,
	)

	if err != nil {
		return nil, err
	}

	return &user, nil
}

// UpdateAdminPassword updates an admin user's password
func (s *AuthService) UpdateAdminPassword(ctx context.Context, adminID, currentPassword, newPassword string) error {
	var passwordHash string
	err := s.db.QueryRowContext(ctx, `
		SELECT password_hash FROM admin_users WHERE id = $1
	`, adminID).Scan(&passwordHash)

	if err == sql.ErrNoRows {
		return ErrUserNotFound
	}
	if err != nil {
		return err
	}

	// Verify current password
	if err := bcrypt.CompareHashAndPassword([]byte(passwordHash), []byte(currentPassword)); err != nil {
		return ErrInvalidCredentials
	}

	// Hash new password
	newHash, err := bcrypt.GenerateFromPassword([]byte(newPassword), bcrypt.DefaultCost)
	if err != nil {
		return err
	}

	_, err = s.db.ExecContext(ctx, `
		UPDATE admin_users SET password_hash = $1, updated_at = NOW() WHERE id = $2
	`, string(newHash), adminID)

	return err
}

// GetAdminUser retrieves an admin user by ID
func (s *AuthService) GetAdminUser(ctx context.Context, adminID string) (*AdminUser, error) {
	var user AdminUser
	err := s.db.QueryRowContext(ctx, `
		SELECT id, email, username, role, is_active, last_login_at, created_at
		FROM admin_users WHERE id = $1
	`, adminID).Scan(
		&user.ID, &user.Email, &user.Username, &user.Role,
		&user.IsActive, &user.LastLoginAt, &user.CreatedAt,
	)

	if err == sql.ErrNoRows {
		return nil, ErrUserNotFound
	}
	if err != nil {
		return nil, err
	}

	return &user, nil
}

// ListAdminUsers lists all admin users
func (s *AuthService) ListAdminUsers(ctx context.Context) ([]AdminUser, error) {
	rows, err := s.db.QueryContext(ctx, `
		SELECT id, email, username, role, is_active, last_login_at, created_at
		FROM admin_users ORDER BY created_at DESC
	`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var users []AdminUser
	for rows.Next() {
		var user AdminUser
		if err := rows.Scan(
			&user.ID, &user.Email, &user.Username, &user.Role,
			&user.IsActive, &user.LastLoginAt, &user.CreatedAt,
		); err != nil {
			return nil, err
		}
		users = append(users, user)
	}

	return users, rows.Err()
}

// LogAuditEvent logs an admin action
func (s *AuthService) LogAuditEvent(ctx context.Context, adminID, action, targetType string, targetID *string, details map[string]interface{}, ipAddress string) error {
	_, err := s.db.ExecContext(ctx, `
		INSERT INTO admin_audit_logs (admin_user_id, action, target_type, target_id, details, ip_address)
		VALUES ($1, $2, $3, $4, $5, $6)
	`, adminID, action, targetType, targetID, details, ipAddress)
	return err
}

// Helper methods

func (s *AuthService) generateToken(user *AdminUser) (string, error) {
	claims := &AdminClaims{
		AdminID:  user.ID,
		Email:    user.Email,
		Username: user.Username,
		Role:     user.Role,
		RegisteredClaims: jwt.RegisteredClaims{
			ExpiresAt: jwt.NewNumericDate(time.Now().Add(s.tokenDuration)),
			IssuedAt:  jwt.NewNumericDate(time.Now()),
			Issuer:    "homelabvpn-admin",
		},
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	return token.SignedString(s.jwtSecret)
}

func (s *AuthService) generateRefreshToken(user *AdminUser) (string, error) {
	claims := &AdminClaims{
		AdminID:  user.ID,
		Email:    user.Email,
		Username: user.Username,
		Role:     user.Role,
		RegisteredClaims: jwt.RegisteredClaims{
			ExpiresAt: jwt.NewNumericDate(time.Now().Add(7 * 24 * time.Hour)), // 7 days
			IssuedAt:  jwt.NewNumericDate(time.Now()),
			Issuer:    "homelabvpn-admin-refresh",
		},
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	return token.SignedString(s.jwtSecret)
}

func (s *AuthService) GetTokenDuration() time.Duration {
	return s.tokenDuration
}

// GenerateSecureToken generates a secure random token
func GenerateSecureToken() (string, error) {
	b := make([]byte, 32)
	if _, err := rand.Read(b); err != nil {
		return "", err
	}
	return base64.URLEncoding.EncodeToString(b), nil
}
