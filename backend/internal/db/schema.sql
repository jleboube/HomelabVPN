-- HomelabVPN Database Schema
-- Privacy-focused: Minimal data retention

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table (minimal data - privacy focused)
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    google_id VARCHAR(255) UNIQUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    last_login_at TIMESTAMP WITH TIME ZONE,
    deleted_at TIMESTAMP WITH TIME ZONE,

    -- Indexes
    CONSTRAINT users_email_check CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$')
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_google_id ON users(google_id);
CREATE INDEX IF NOT EXISTS idx_users_deleted_at ON users(deleted_at) WHERE deleted_at IS NULL;

-- WireGuard keys table
CREATE TABLE IF NOT EXISTS wireguard_keys (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    private_key_encrypted VARCHAR(512) NOT NULL,
    public_key VARCHAR(255) NOT NULL,
    client_ip INET NOT NULL UNIQUE,
    platform VARCHAR(50) NOT NULL DEFAULT 'desktop' CHECK (platform IN ('desktop', 'ios-relay')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    rotated_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX IF NOT EXISTS idx_wireguard_keys_user_id ON wireguard_keys(user_id);
CREATE INDEX IF NOT EXISTS idx_wireguard_keys_public_key ON wireguard_keys(public_key);
CREATE INDEX IF NOT EXISTS idx_wireguard_keys_platform ON wireguard_keys(platform);

-- Subscriptions table
CREATE TABLE IF NOT EXISTS subscriptions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    plan_id VARCHAR(50) NOT NULL CHECK (plan_id IN ('basic', 'pro')),
    status VARCHAR(50) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'cancelled', 'expired', 'past_due')),
    stripe_customer_id VARCHAR(255) UNIQUE,
    stripe_subscription_id VARCHAR(255) UNIQUE,
    billing_period VARCHAR(50) CHECK (billing_period IN ('daily', 'monthly', 'yearly')),
    start_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    renewal_date TIMESTAMP WITH TIME ZONE,
    cancelled_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_stripe_customer_id ON subscriptions(stripe_customer_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_subscriptions_renewal_date ON subscriptions(renewal_date);

-- VPN servers table (for admin management)
CREATE TABLE IF NOT EXISTS vpn_servers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    country VARCHAR(100) NOT NULL,
    city VARCHAR(100) NOT NULL,
    public_ip INET NOT NULL UNIQUE,
    hostname VARCHAR(255) NOT NULL UNIQUE,
    wg_private_key_encrypted VARCHAR(512) NOT NULL,
    wg_public_key VARCHAR(255) NOT NULL,
    listen_port INTEGER DEFAULT 51820,
    available_ips CIDR NOT NULL,
    status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('active', 'maintenance', 'offline')),
    capacity INTEGER DEFAULT 1000,
    current_load INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_vpn_servers_status ON vpn_servers(status);
CREATE INDEX IF NOT EXISTS idx_vpn_servers_country_city ON vpn_servers(country, city);

-- Sessions table (for Redis backup / audit)
CREATE TABLE IF NOT EXISTS sessions (
    id VARCHAR(255) PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token_hash VARCHAR(512) NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    ip_address INET,
    user_agent VARCHAR(512)
);

CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_expires_at ON sessions(expires_at);

-- Audit logs (minimal - for security purposes only)
-- Note: We do NOT log VPN activity, only auth events
CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    event_type VARCHAR(100) NOT NULL CHECK (event_type IN (
        'login', 'logout', 'key_regenerate', 'subscription_create',
        'subscription_cancel', 'account_delete'
    )),
    ip_address INET,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Partition audit logs by month for easy cleanup
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_event_type ON audit_logs(event_type);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for updated_at
CREATE TRIGGER update_subscriptions_updated_at
    BEFORE UPDATE ON subscriptions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_vpn_servers_updated_at
    BEFORE UPDATE ON vpn_servers
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Data retention: Auto-delete old audit logs (90 days)
-- This should be run as a scheduled job
CREATE OR REPLACE FUNCTION cleanup_old_audit_logs()
RETURNS void AS $$
BEGIN
    DELETE FROM audit_logs WHERE created_at < NOW() - INTERVAL '90 days';
END;
$$ LANGUAGE plpgsql;

-- Admin users table (separate from regular users)
CREATE TABLE IF NOT EXISTS admin_users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    username VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(512) NOT NULL,
    role VARCHAR(50) DEFAULT 'admin' CHECK (role IN ('super_admin', 'admin', 'viewer')),
    is_active BOOLEAN DEFAULT true,
    last_login_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_by UUID REFERENCES admin_users(id),

    CONSTRAINT admin_users_email_check CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$')
);

CREATE INDEX IF NOT EXISTS idx_admin_users_email ON admin_users(email);
CREATE INDEX IF NOT EXISTS idx_admin_users_username ON admin_users(username);

CREATE TRIGGER update_admin_users_updated_at
    BEFORE UPDATE ON admin_users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Admin sessions table
CREATE TABLE IF NOT EXISTS admin_sessions (
    id VARCHAR(255) PRIMARY KEY,
    admin_user_id UUID NOT NULL REFERENCES admin_users(id) ON DELETE CASCADE,
    token_hash VARCHAR(512) NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    ip_address INET,
    user_agent VARCHAR(512)
);

CREATE INDEX IF NOT EXISTS idx_admin_sessions_admin_user_id ON admin_sessions(admin_user_id);
CREATE INDEX IF NOT EXISTS idx_admin_sessions_expires_at ON admin_sessions(expires_at);

-- Admin audit logs (separate from user audit logs)
CREATE TABLE IF NOT EXISTS admin_audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    admin_user_id UUID REFERENCES admin_users(id) ON DELETE SET NULL,
    action VARCHAR(100) NOT NULL CHECK (action IN (
        'login', 'logout', 'user_view', 'user_update', 'user_delete',
        'subscription_view', 'subscription_update', 'subscription_cancel',
        'server_view', 'server_update', 'server_maintenance',
        'settings_view', 'settings_update', 'admin_create', 'admin_update'
    )),
    target_type VARCHAR(50), -- 'user', 'subscription', 'server', 'settings', 'admin'
    target_id UUID,
    details JSONB,
    ip_address INET,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_admin_audit_logs_admin_user_id ON admin_audit_logs(admin_user_id);
CREATE INDEX IF NOT EXISTS idx_admin_audit_logs_action ON admin_audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_admin_audit_logs_created_at ON admin_audit_logs(created_at);

-- Metrics snapshots table (for historical data)
CREATE TABLE IF NOT EXISTS metrics_snapshots (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    metric_type VARCHAR(50) NOT NULL CHECK (metric_type IN (
        'active_connections', 'total_users', 'bandwidth_in', 'bandwidth_out',
        'cpu_usage', 'memory_usage', 'disk_usage', 'server_load'
    )),
    server_id UUID REFERENCES vpn_servers(id) ON DELETE SET NULL,
    value DECIMAL(20, 4) NOT NULL,
    recorded_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_metrics_snapshots_type ON metrics_snapshots(metric_type);
CREATE INDEX IF NOT EXISTS idx_metrics_snapshots_recorded_at ON metrics_snapshots(recorded_at);
CREATE INDEX IF NOT EXISTS idx_metrics_snapshots_server_id ON metrics_snapshots(server_id);

-- Partition metrics by day for easy cleanup
-- This should be handled by a scheduled job

-- Function to cleanup old metrics (keep 90 days)
CREATE OR REPLACE FUNCTION cleanup_old_metrics()
RETURNS void AS $$
BEGIN
    DELETE FROM metrics_snapshots WHERE recorded_at < NOW() - INTERVAL '90 days';
END;
$$ LANGUAGE plpgsql;

-- Insert default admin user (password: admin123 - CHANGE IN PRODUCTION!)
-- Password hash generated with bcrypt cost 12
INSERT INTO admin_users (id, email, username, password_hash, role)
VALUES (
    uuid_generate_v4(),
    'admin@vpn.z-q.me',
    'admin',
    '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/AQKRuHQEF6Hx0V9.q', -- admin123
    'super_admin'
) ON CONFLICT DO NOTHING;

-- Insert default VPN servers (example data)
INSERT INTO vpn_servers (country, city, public_ip, hostname, wg_private_key_encrypted, wg_public_key, available_ips)
VALUES
    ('United States', 'New York', '203.0.113.1', 'us-east.vpn.z-q.me', 'encrypted_key_1', 'public_key_1', '10.1.0.0/16'),
    ('United States', 'Los Angeles', '203.0.113.2', 'us-west.vpn.z-q.me', 'encrypted_key_2', 'public_key_2', '10.2.0.0/16'),
    ('United Kingdom', 'London', '203.0.113.3', 'uk.vpn.z-q.me', 'encrypted_key_3', 'public_key_3', '10.3.0.0/16'),
    ('Germany', 'Frankfurt', '203.0.113.4', 'de.vpn.z-q.me', 'encrypted_key_4', 'public_key_4', '10.4.0.0/16'),
    ('Netherlands', 'Amsterdam', '203.0.113.5', 'nl.vpn.z-q.me', 'encrypted_key_5', 'public_key_5', '10.5.0.0/16'),
    ('Japan', 'Tokyo', '203.0.113.6', 'jp.vpn.z-q.me', 'encrypted_key_6', 'public_key_6', '10.6.0.0/16'),
    ('Singapore', 'Singapore', '203.0.113.7', 'sg.vpn.z-q.me', 'encrypted_key_7', 'public_key_7', '10.7.0.0/16'),
    ('Australia', 'Sydney', '203.0.113.8', 'au.vpn.z-q.me', 'encrypted_key_8', 'public_key_8', '10.8.0.0/16'),
    ('Canada', 'Toronto', '203.0.113.9', 'ca.vpn.z-q.me', 'encrypted_key_9', 'public_key_9', '10.9.0.0/16'),
    ('France', 'Paris', '203.0.113.10', 'fr.vpn.z-q.me', 'encrypted_key_10', 'public_key_10', '10.10.0.0/16')
ON CONFLICT DO NOTHING;

-- Relay servers table (for iOS relay VPS instances)
CREATE TABLE IF NOT EXISTS relay_servers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    public_ip INET NOT NULL UNIQUE,
    public_key VARCHAR(255) NOT NULL,
    region VARCHAR(50) NOT NULL,
    type VARCHAR(50) NOT NULL DEFAULT 'ios-relay' CHECK (type IN ('ios-relay', 'standard', 'backup')),
    status VARCHAR(50) NOT NULL DEFAULT 'online' CHECK (status IN ('online', 'offline', 'maintenance')),
    last_seen TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_relay_servers_public_ip ON relay_servers(public_ip);
CREATE INDEX IF NOT EXISTS idx_relay_servers_status ON relay_servers(status);
CREATE INDEX IF NOT EXISTS idx_relay_servers_region ON relay_servers(region);
