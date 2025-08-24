-- Eco-Points System Database Initialization
-- This script sets up the initial database structure and sample data

-- Create extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "postgis";

-- Create enum types
CREATE TYPE user_role AS ENUM ('tourist', 'moderator', 'council');
CREATE TYPE submission_status AS ENUM ('queued', 'auto_verified', 'needs_review', 'approved', 'rejected');
CREATE TYPE cashout_status AS ENUM ('pending', 'initiated', 'succeeded', 'failed', 'canceled');
CREATE TYPE payout_status AS ENUM ('initiated', 'processing', 'succeeded', 'failed');
CREATE TYPE event_type AS ENUM ('submission_created', 'submission_approved', 'submission_rejected', 'points_credited', 'cashout_requested', 'payout_initiated', 'payout_completed');

-- Create users table
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    role user_role NOT NULL DEFAULT 'tourist',
    kyc_status VARCHAR(50) DEFAULT 'pending',
    password_hash VARCHAR(255),
    refresh_token VARCHAR(500),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create user_wallets table
CREATE TABLE IF NOT EXISTS user_wallets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    points_balance INTEGER NOT NULL DEFAULT 0,
    cash_balance DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    locked_amount DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id)
);

-- Create bin_locations table
CREATE TABLE IF NOT EXISTS bin_locations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    lat DECIMAL(10,8) NOT NULL,
    lng DECIMAL(11,8) NOT NULL,
    radius_m INTEGER NOT NULL DEFAULT 50,
    active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create video_submissions table
CREATE TABLE IF NOT EXISTS video_submissions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    s3_key VARCHAR(500) NOT NULL,
    thumb_key VARCHAR(500),
    duration_s INTEGER,
    size_bytes BIGINT,
    device_hash VARCHAR(255),
    gps_lat DECIMAL(10,8) NOT NULL,
    gps_lng DECIMAL(11,8) NOT NULL,
    recorded_at TIMESTAMP WITH TIME ZONE NOT NULL,
    bin_id_guess UUID REFERENCES bin_locations(id),
    auto_score DECIMAL(3,2),
    status submission_status NOT NULL DEFAULT 'queued',
    rejection_reason TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create submission_events table (audit trail)
CREATE TABLE IF NOT EXISTS submission_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    submission_id UUID NOT NULL REFERENCES video_submissions(id) ON DELETE CASCADE,
    actor_id UUID REFERENCES users(id),
    event_type event_type NOT NULL,
    meta JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create cashout_requests table
CREATE TABLE IF NOT EXISTS cashout_requests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    points_used INTEGER NOT NULL,
    cash_amount DECIMAL(10,2) NOT NULL,
    method VARCHAR(50) NOT NULL,
    destination_ref VARCHAR(255) NOT NULL,
    status cashout_status NOT NULL DEFAULT 'pending',
    failure_reason TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create payout_transactions table
CREATE TABLE IF NOT EXISTS payout_transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    cashout_request_id UUID NOT NULL REFERENCES cashout_requests(id) ON DELETE CASCADE,
    gateway VARCHAR(50) NOT NULL,
    gateway_txn_id VARCHAR(255),
    status payout_status NOT NULL DEFAULT 'initiated',
    raw_webhook_json JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create reports_cache table
CREATE TABLE IF NOT EXISTS reports_cache (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    key VARCHAR(255) UNIQUE NOT NULL,
    json JSONB NOT NULL,
    generated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_submissions_user_id ON video_submissions(user_id);
CREATE INDEX IF NOT EXISTS idx_submissions_status ON video_submissions(status);
CREATE INDEX IF NOT EXISTS idx_submissions_created_at ON video_submissions(created_at);
CREATE INDEX IF NOT EXISTS idx_submissions_gps ON video_submissions USING GIST (ST_SetSRID(ST_MakePoint(gps_lng, gps_lat), 4326));
CREATE INDEX IF NOT EXISTS idx_cashouts_user_id ON cashout_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_cashouts_status ON cashout_requests(status);
CREATE INDEX IF NOT EXISTS idx_events_submission_id ON submission_events(submission_id);
CREATE INDEX IF NOT EXISTS idx_events_created_at ON submission_events(created_at);

-- Insert sample bin locations (London area)
INSERT INTO bin_locations (name, lat, lng, radius_m) VALUES
('Hyde Park - North Gate', 51.5074, -0.1657, 50),
('Hyde Park - South Gate', 51.5034, -0.1657, 50),
('Regent''s Park - Main Entrance', 51.5319, -0.1478, 50),
('Greenwich Park - Observatory', 51.4769, 0.0005, 50),
('Hampstead Heath - Parliament Hill', 51.5587, -0.1608, 50),
('Victoria Park - East End', 51.5389, -0.0396, 50),
('Battersea Park - Central', 51.4791, -0.1498, 50),
('Richmond Park - Sheen Gate', 51.4498, -0.2657, 50);

-- Insert sample moderator user
INSERT INTO users (email, name, role, password_hash) VALUES
('moderator@ecopoints.com', 'System Moderator', 'moderator', '$2b$10$dummy.hash.for.development');

-- Insert sample council user
INSERT INTO users (email, name, role, password_hash) VALUES
('council@ecopoints.com', 'City Council Admin', 'council', '$2b$10$dummy.hash.for.development');

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_user_wallets_updated_at BEFORE UPDATE ON user_wallets FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_video_submissions_updated_at BEFORE UPDATE ON video_submissions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_cashout_requests_updated_at BEFORE UPDATE ON cashout_requests FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_payout_transactions_updated_at BEFORE UPDATE ON payout_transactions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Grant permissions
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO eco_user;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO eco_user;