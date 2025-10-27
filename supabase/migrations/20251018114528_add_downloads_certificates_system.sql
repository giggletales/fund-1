/*
  # Downloads & Certificates System

  1. New Tables
    - `downloads`
      - Certificates and documents
      - Welcome certificates, challenge passed, payout receipts
      - PDF storage and download tracking
    
  2. Security
    - RLS enabled
    - Users can only view their own downloads
    - Admins can view all

  3. Features
    - Auto-generation triggers
    - Download tracking
    - Social sharing
    - Document verification
*/

-- Create downloads table
CREATE TABLE IF NOT EXISTS downloads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  challenge_id uuid REFERENCES user_challenges(id) ON DELETE SET NULL,
  transaction_id uuid REFERENCES transactions(id) ON DELETE SET NULL,
  
  -- Document Type
  document_type text NOT NULL CHECK (document_type IN (
    'WELCOME_CERTIFICATE',
    'CHALLENGE_PASSED_CERTIFICATE',
    'FUNDED_CERTIFICATE',
    'PAYOUT_RECEIPT',
    'INVOICE',
    'TAX_STATEMENT',
    'TRADING_REPORT',
    'CONTRACT'
  )),
  
  -- Document Details
  title text NOT NULL,
  description text,
  document_number text UNIQUE,
  issue_date timestamptz DEFAULT now(),
  valid_until timestamptz,
  
  -- File Information
  file_name text,
  file_url text,
  file_size integer,
  file_format text DEFAULT 'PDF',
  thumbnail_url text,
  
  -- Certificate Specific Data
  achievement_type text,
  achievement_date timestamptz,
  challenge_type text,
  account_size numeric,
  profit_earned numeric,
  profit_percentage numeric,
  
  -- Trading Stats (for certificates)
  total_trades integer,
  win_rate numeric,
  profit_factor numeric,
  max_drawdown numeric,
  average_win numeric,
  average_loss numeric,
  
  -- Certificate Metadata
  certificate_number text,
  signed_by text DEFAULT 'Fund8r Management',
  
  -- Payout Receipt Data
  payout_amount numeric,
  payout_date timestamptz,
  payout_method text,
  payout_reference text,
  period_start timestamptz,
  period_end timestamptz,
  
  -- Generation Status
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'generating', 'ready', 'failed')),
  generation_error text,
  
  -- Auto-generation
  auto_generated boolean DEFAULT true,
  generated_at timestamptz,
  
  -- Download Tracking
  download_count integer DEFAULT 0,
  last_downloaded_at timestamptz,
  share_count integer DEFAULT 0,
  
  -- Timestamps
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE downloads ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own downloads"
  ON downloads
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own download stats"
  ON downloads
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "System can insert downloads"
  ON downloads
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all downloads"
  ON downloads
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND auth.users.raw_user_meta_data->>'role' = 'admin'
    )
  );

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_downloads_user_id ON downloads(user_id);
CREATE INDEX IF NOT EXISTS idx_downloads_type ON downloads(document_type);
CREATE INDEX IF NOT EXISTS idx_downloads_status ON downloads(status);
CREATE INDEX IF NOT EXISTS idx_downloads_created ON downloads(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_downloads_document_number ON downloads(document_number);

-- Function to generate certificate number
CREATE OR REPLACE FUNCTION generate_certificate_number(cert_type text, user_id_val uuid)
RETURNS text
LANGUAGE plpgsql
AS $$
DECLARE
  prefix text;
  random_suffix text;
BEGIN
  prefix := CASE cert_type
    WHEN 'WELCOME_CERTIFICATE' THEN 'WEL'
    WHEN 'CHALLENGE_PASSED_CERTIFICATE' THEN 'PASS'
    WHEN 'FUNDED_CERTIFICATE' THEN 'FUND'
    ELSE 'CERT'
  END;
  
  random_suffix := upper(substring(md5(user_id_val::text || now()::text) from 1 for 6));
  
  RETURN prefix || '-' || to_char(now(), 'YYYY') || '-' || random_suffix;
END;
$$;

-- Trigger to auto-generate document/certificate numbers
CREATE OR REPLACE FUNCTION set_download_numbers()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.document_number IS NULL THEN
    IF NEW.document_type LIKE '%CERTIFICATE%' THEN
      NEW.certificate_number := generate_certificate_number(NEW.document_type, NEW.user_id);
      NEW.document_number := NEW.certificate_number;
    ELSIF NEW.document_type = 'PAYOUT_RECEIPT' THEN
      NEW.document_number := 'RCPT-' || to_char(now(), 'YYYYMMDD') || '-' || substr(md5(random()::text), 1, 6);
    ELSE
      NEW.document_number := 'DOC-' || to_char(now(), 'YYYYMMDD') || '-' || substr(md5(random()::text), 1, 6);
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_download_numbers_trigger
  BEFORE INSERT ON downloads
  FOR EACH ROW
  EXECUTE FUNCTION set_download_numbers();

-- Update trigger
CREATE TRIGGER update_downloads_timestamp
  BEFORE UPDATE ON downloads
  FOR EACH ROW
  EXECUTE FUNCTION update_contract_timestamp();

-- Function to track download
CREATE OR REPLACE FUNCTION track_download(p_download_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE downloads
  SET 
    download_count = download_count + 1,
    last_downloaded_at = now()
  WHERE id = p_download_id;
END;
$$;

-- Function to get user downloads
CREATE OR REPLACE FUNCTION get_user_downloads(p_user_id uuid, p_document_type text DEFAULT NULL)
RETURNS TABLE (
  id uuid,
  document_type text,
  title text,
  document_number text,
  issue_date timestamptz,
  file_url text,
  status text,
  download_count integer
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF p_document_type IS NULL THEN
    RETURN QUERY
    SELECT 
      d.id,
      d.document_type,
      d.title,
      d.document_number,
      d.issue_date,
      d.file_url,
      d.status,
      d.download_count
    FROM downloads d
    WHERE d.user_id = p_user_id
    AND d.status = 'ready'
    ORDER BY d.created_at DESC;
  ELSE
    RETURN QUERY
    SELECT 
      d.id,
      d.document_type,
      d.title,
      d.document_number,
      d.issue_date,
      d.file_url,
      d.status,
      d.download_count
    FROM downloads d
    WHERE d.user_id = p_user_id
    AND d.document_type = p_document_type
    AND d.status = 'ready'
    ORDER BY d.created_at DESC;
  END IF;
END;
$$;

-- Function to auto-generate welcome certificate
CREATE OR REPLACE FUNCTION auto_generate_welcome_certificate()
RETURNS TRIGGER AS $$
BEGIN
  -- Generate welcome certificate for new user
  INSERT INTO downloads (
    user_id,
    document_type,
    title,
    description,
    achievement_type,
    achievement_date,
    status
  ) VALUES (
    NEW.id,
    'WELCOME_CERTIFICATE',
    'Welcome to Fund8r Certificate',
    'Official welcome certificate for joining Fund8r',
    'WELCOME',
    now(),
    'ready'
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-generate welcome certificate on user creation
-- Note: This will be handled in application code since we can't directly trigger on auth.users
