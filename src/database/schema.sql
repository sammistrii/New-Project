-- Eco-Points System Database Schema
-- PostgreSQL 14+

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "postgis";

-- Create custom types
CREATE TYPE user_role AS ENUM ('tourist', 'moderator', 'council');
CREATE TYPE submission_status AS ENUM ('queued', 'auto_verified', 'needs_review', 'approved', 'rejected');
CREATE TYPE cashout_status AS ENUM ('pending', 'initiated', 'succeeded', 'failed', 'canceled');
CREATE TYPE payout_status AS ENUM ('pending', 'processing', 'succeeded', 'failed', 'canceled');
CREATE TYPE event_type AS ENUM ('submission_created', 'submission_approved', 'submission_rejected', 'points_credited', 'cashout_requested', 'payout_initiated', 'payout_completed', 'payout_failed');

-- Users table
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    role user_role NOT NULL DEFAULT 'tourist',
    kyc_status VARCHAR(50) DEFAULT 'pending',
    phone VARCHAR(20),
    avatar_url TEXT,
    is_active BOOLEAN DEFAULT true,
    email_verified BOOLEAN DEFAULT false,
    phone_verified BOOLEAN DEFAULT false,
    last_login_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User wallets table
CREATE TABLE user_wallets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    points_balance INTEGER DEFAULT 0 CHECK (points_balance >= 0),
    cash_balance DECIMAL(10,2) DEFAULT 0.00 CHECK (cash_balance >= 0),
    locked_amount DECIMAL(10,2) DEFAULT 0.00 CHECK (locked_amount >= 0),
    total_points_earned INTEGER DEFAULT 0,
    total_cash_earned DECIMAL(10,2) DEFAULT 0.00,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id)
);

-- Bin locations table
CREATE TABLE bin_locations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    lat DECIMAL(10,8) NOT NULL,
    lng DECIMAL(11,8) NOT NULL,
    radius_m INTEGER NOT NULL DEFAULT 100,
    active BOOLEAN DEFAULT true,
    ward VARCHAR(100),
    zone VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Video submissions table
CREATE TABLE video_submissions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    s3_key VARCHAR(500) NOT NULL,
    thumb_key VARCHAR(500),
    duration_s INTEGER,
    size_bytes BIGINT,
    device_hash VARCHAR(255),
    gps_lat DECIMAL(10,8),
    gps_lng DECIMAL(11,8),
    gps_accuracy_m INTEGER,
    recorded_at TIMESTAMP WITH TIME ZONE NOT NULL,
    bin_id_guess UUID REFERENCES bin_locations(id),
    auto_score INTEGER CHECK (auto_score >= 0 AND auto_score <= 100),
    status submission_status DEFAULT 'queued',
    rejection_reason TEXT,
    fraud_flags JSONB DEFAULT '{}',
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Submission events (audit trail)
CREATE TABLE submission_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    submission_id UUID NOT NULL REFERENCES video_submissions(id) ON DELETE CASCADE,
    actor_id UUID REFERENCES users(id),
    event_type event_type NOT NULL,
    meta JSONB DEFAULT '{}',
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Cash-out requests table
CREATE TABLE cashout_requests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    points_used INTEGER NOT NULL CHECK (points_used > 0),
    cash_amount DECIMAL(10,2) NOT NULL CHECK (cash_amount > 0),
    method VARCHAR(50) NOT NULL, -- 'stripe', 'paypal', 'bank_transfer'
    destination_ref TEXT NOT NULL, -- account ID, email, etc.
    status cashout_status DEFAULT 'pending',
    failure_reason TEXT,
    processed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Payout transactions table
CREATE TABLE payout_transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    cashout_request_id UUID NOT NULL REFERENCES cashout_requests(id) ON DELETE CASCADE,
    gateway VARCHAR(50) NOT NULL, -- 'stripe', 'paypal'
    gateway_txn_id VARCHAR(255),
    status payout_status DEFAULT 'pending',
    amount DECIMAL(10,2) NOT NULL,
    fees DECIMAL(10,2) DEFAULT 0.00,
    raw_webhook_json JSONB,
    processed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Reports cache table
CREATE TABLE reports_cache (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    key VARCHAR(255) UNIQUE NOT NULL,
    json JSONB NOT NULL,
    generated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL
);

-- User sessions table (for JWT refresh tokens)
CREATE TABLE user_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    refresh_token_hash VARCHAR(255) NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_created_at ON users(created_at);

CREATE INDEX idx_user_wallets_user_id ON user_wallets(user_id);

CREATE INDEX idx_bin_locations_active ON bin_locations(active);
CREATE INDEX idx_bin_locations_location ON bin_locations USING GIST (ST_SetSRID(ST_MakePoint(lng, lat), 4326));

CREATE INDEX idx_video_submissions_user_id ON video_submissions(user_id);
CREATE INDEX idx_video_submissions_status ON video_submissions(status);
CREATE INDEX idx_video_submissions_created_at ON video_submissions(created_at);
CREATE INDEX idx_video_submissions_location ON video_submissions USING GIST (ST_SetSRID(ST_MakePoint(gps_lng, gps_lat), 4326));
CREATE INDEX idx_video_submissions_device_hash ON video_submissions(device_hash);
CREATE INDEX idx_video_submissions_auto_score ON video_submissions(auto_score);

CREATE INDEX idx_submission_events_submission_id ON submission_events(submission_id);
CREATE INDEX idx_submission_events_event_type ON submission_events(event_type);
CREATE INDEX idx_submission_events_created_at ON submission_events(created_at);

CREATE INDEX idx_cashout_requests_user_id ON cashout_requests(user_id);
CREATE INDEX idx_cashout_requests_status ON cashout_requests(status);
CREATE INDEX idx_cashout_requests_created_at ON cashout_requests(created_at);

CREATE INDEX idx_payout_transactions_cashout_id ON payout_transactions(cashout_request_id);
CREATE INDEX idx_payout_transactions_gateway ON payout_transactions(gateway);
CREATE INDEX idx_payout_transactions_status ON payout_transactions(status);

CREATE INDEX idx_reports_cache_key ON reports_cache(key);
CREATE INDEX idx_reports_cache_expires_at ON reports_cache(expires_at);

CREATE INDEX idx_user_sessions_user_id ON user_sessions(user_id);
CREATE INDEX idx_user_sessions_refresh_token_hash ON user_sessions(refresh_token_hash);
CREATE INDEX idx_user_sessions_expires_at ON user_sessions(expires_at);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply updated_at triggers
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_user_wallets_updated_at BEFORE UPDATE ON user_wallets FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_bin_locations_updated_at BEFORE UPDATE ON bin_locations FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_video_submissions_updated_at BEFORE UPDATE ON video_submissions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_cashout_requests_updated_at BEFORE UPDATE ON cashout_requests FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_payout_transactions_updated_at BEFORE UPDATE ON payout_transactions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Row Level Security (RLS) policies
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE video_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE submission_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE cashout_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE payout_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE reports_cache ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_sessions ENABLE ROW LEVEL SECURITY;

-- Users can only see their own data
CREATE POLICY users_own_data ON users FOR ALL USING (id = current_setting('app.current_user_id')::UUID);
CREATE POLICY user_wallets_own_data ON user_wallets FOR ALL USING (user_id = current_setting('app.current_user_id')::UUID);
CREATE POLICY video_submissions_own_data ON video_submissions FOR ALL USING (user_id = current_setting('app.current_user_id')::UUID);
CREATE POLICY cashout_requests_own_data ON cashout_requests FOR ALL USING (user_id = current_setting('app.current_user_id')::UUID);

-- Moderators can see all submissions and events
CREATE POLICY moderators_all_submissions ON video_submissions FOR ALL USING (
    EXISTS (
        SELECT 1 FROM users 
        WHERE id = current_setting('app.current_user_id')::UUID 
        AND role IN ('moderator', 'council')
    )
);

CREATE POLICY moderators_all_events ON submission_events FOR ALL USING (
    EXISTS (
        SELECT 1 FROM users 
        WHERE id = current_setting('app.current_user_id')::UUID 
        AND role IN ('moderator', 'council')
    )
);

-- Council can see all data for reporting
CREATE POLICY council_all_data ON users FOR ALL USING (
    EXISTS (
        SELECT 1 FROM users 
        WHERE id = current_setting('app.current_user_id')::UUID 
        AND role = 'council'
    )
);

-- Public data (bin locations)
CREATE POLICY bin_locations_public ON bin_locations FOR SELECT USING (active = true);

-- Insert initial admin user (password: admin123)
INSERT INTO users (id, email, name, role, email_verified, is_active) 
VALUES (
    '00000000-0000-0000-0000-000000000001',
    'admin@ecopoints.com',
    'System Administrator',
    'moderator',
    true,
    true
);

-- Insert initial wallet for admin
INSERT INTO user_wallets (user_id, points_balance, cash_balance)
VALUES ('00000000-0000-0000-0000-000000000001', 0, 0.00);

-- Insert sample bin locations
INSERT INTO bin_locations (name, description, lat, lng, radius_m, ward, zone) VALUES
('Central Park Bin A', 'Main recycling bin in Central Park', 40.7829, -73.9654, 150, 'Manhattan', 'Central'),
('Downtown Bin B', 'Recycling center downtown', 40.7589, -73.9851, 200, 'Manhattan', 'Downtown'),
('Brooklyn Bridge Bin', 'Bin near Brooklyn Bridge entrance', 40.7061, -73.9969, 120, 'Brooklyn', 'DUMBO');