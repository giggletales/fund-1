/*
  # Automatic Challenge Account Creation System

  1. Changes
    - Add unique_user_id column to challenges table for 4-5 digit IDs
    - Create function to generate unique user IDs
    - Create trigger to automatically create challenge accounts after payment
    - Add RLS policies for challenges table
    - Update payment workflow to auto-create challenges

  2. Security
    - Users can view their own challenges
    - Admins can view all challenges
    - System automatically creates challenges on payment completion
*/

-- Add unique_user_id column to challenges if not exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'challenges' AND column_name = 'unique_user_id'
  ) THEN
    ALTER TABLE challenges ADD COLUMN unique_user_id VARCHAR(5);
  END IF;
END $$;

-- Drop and recreate function to generate unique 4-5 digit user ID
DROP FUNCTION IF EXISTS generate_unique_user_id();
CREATE FUNCTION generate_unique_user_id()
RETURNS VARCHAR(5) AS $$
DECLARE
  new_id VARCHAR(5);
  id_exists BOOLEAN;
BEGIN
  LOOP
    -- Generate random 4-5 digit number
    new_id := LPAD(FLOOR(RANDOM() * 90000 + 10000)::TEXT, 5, '0');
    
    -- Check if it already exists
    SELECT EXISTS(SELECT 1 FROM challenges WHERE unique_user_id = new_id) INTO id_exists;
    
    -- If unique, exit loop
    IF NOT id_exists THEN
      EXIT;
    END IF;
  END LOOP;
  
  RETURN new_id;
END;
$$ LANGUAGE plpgsql;

-- Function to create challenge account after payment
DROP FUNCTION IF EXISTS create_challenge_after_payment() CASCADE;
CREATE FUNCTION create_challenge_after_payment()
RETURNS TRIGGER AS $$
DECLARE
  account_size_val NUMERIC;
  challenge_type_val TEXT;
  unique_id VARCHAR(5);
BEGIN
  -- Only process completed payments
  IF NEW.status = 'completed' AND NEW.notes IS NOT NULL THEN
    
    -- Extract account size and challenge type from notes
    -- Format: "Account: $200,000, Challenge: Swing, Coupon: TEP100 (100% off), Free Access"
    account_size_val := CAST(
      REGEXP_REPLACE(
        SUBSTRING(NEW.notes FROM 'Account: \$([0-9,]+)'),
        ',', '', 'g'
      ) AS NUMERIC
    );
    
    challenge_type_val := TRIM(
      SUBSTRING(NEW.notes FROM 'Challenge: ([^,]+)')
    );
    
    -- Generate unique user ID
    unique_id := generate_unique_user_id();
    
    -- Create challenge account
    INSERT INTO challenges (
      user_id,
      unique_user_id,
      account_size,
      challenge_fee,
      phase,
      status,
      platform,
      current_balance,
      highest_balance,
      current_profit,
      profit_target,
      max_drawdown_percent,
      max_daily_loss_percent,
      current_drawdown_percent,
      trading_days_completed,
      trading_days_required,
      current_phase,
      notes
    ) VALUES (
      NEW.user_id,
      unique_id,
      account_size_val,
      NEW.amount,
      'pending_credentials',
      'pending',
      'MT5',
      account_size_val,
      account_size_val,
      0,
      account_size_val * 0.08, -- 8% profit target default
      10, -- 10% max drawdown default
      5, -- 5% max daily loss default
      0,
      0,
      5, -- 5 trading days required default
      1,
      'Created from payment: ' || NEW.transaction_id || '. Waiting for admin to assign MT5 credentials.'
    );
    
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for automatic challenge creation
DROP TRIGGER IF EXISTS trigger_create_challenge_after_payment ON payments;
CREATE TRIGGER trigger_create_challenge_after_payment
  AFTER INSERT ON payments
  FOR EACH ROW
  EXECUTE FUNCTION create_challenge_after_payment();

-- Enable RLS on challenges table
ALTER TABLE challenges ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view own challenges" ON challenges;
DROP POLICY IF EXISTS "Users can insert own challenges" ON challenges;
DROP POLICY IF EXISTS "System can create challenges" ON challenges;

-- Users can view their own challenges
CREATE POLICY "Users can view own challenges"
  ON challenges FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- System/triggers can create challenges (this allows the trigger to work)
CREATE POLICY "System can create challenges"
  ON challenges FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Function to get challenges with user info for admin
DROP FUNCTION IF EXISTS get_all_challenges_for_admin();
CREATE FUNCTION get_all_challenges_for_admin()
RETURNS TABLE (
  id UUID,
  user_id UUID,
  user_email TEXT,
  user_name TEXT,
  unique_user_id VARCHAR(5),
  account_size NUMERIC,
  challenge_fee NUMERIC,
  phase TEXT,
  status TEXT,
  platform TEXT,
  login_id TEXT,
  has_credentials BOOLEAN,
  current_balance NUMERIC,
  created_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    c.id,
    c.user_id,
    u.email::TEXT,
    (u.raw_user_meta_data->>'full_name')::TEXT,
    c.unique_user_id,
    c.account_size,
    c.challenge_fee,
    c.phase,
    c.status,
    c.platform,
    c.login_id,
    (c.login_id IS NOT NULL)::BOOLEAN,
    c.current_balance,
    c.created_at
  FROM challenges c
  JOIN auth.users u ON c.user_id = u.id
  ORDER BY c.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
