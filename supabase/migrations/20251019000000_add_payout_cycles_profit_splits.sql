-- Add new table for payout cycle configurations
CREATE TABLE payout_cycles (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    percentage INT NOT NULL,
    description TEXT,
    recommended BOOLEAN DEFAULT false,
    frequency TEXT,
    min_days INT
);

-- Insert the different payout cycles
INSERT INTO payout_cycles (name, percentage, description, recommended, frequency, min_days) VALUES
('Bi-Monthly', 100, 'Twice per month (1st and 15th)', true, 'Every 2 weeks', 15),
('Monthly', 95, 'Once per month (1st of month)', false, 'Monthly', 30),
('Bi-Weekly', 85, 'Every 2 weeks (Mondays)', false, 'Every 2 weeks', 14),
('Weekly', 75, 'Every week (Mondays)', false, 'Weekly', 7);

-- Add payout_cycle_id to user_challenges table
ALTER TABLE user_challenges
ADD COLUMN payout_cycle_id INT REFERENCES payout_cycles(id);

-- Update existing challenges to have a default payout cycle
UPDATE user_challenges
SET payout_cycle_id = (SELECT id FROM payout_cycles WHERE recommended = true LIMIT 1)
WHERE payout_cycle_id IS NULL;
