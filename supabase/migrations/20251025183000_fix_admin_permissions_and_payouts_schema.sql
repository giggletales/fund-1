-- Grant admin read access to user_profiles
CREATE POLICY "Admins can read all user profiles"
  ON user_profiles FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_roles
      WHERE admin_roles.user_id = auth.uid()
      AND admin_roles.role = 'admin'
    )
  );

-- Re-create foreign key on payouts_affiliate to refresh schema cache
ALTER TABLE payouts_affiliate
DROP CONSTRAINT IF EXISTS payouts_affiliate_affiliate_id_fkey,
ADD CONSTRAINT payouts_affiliate_affiliate_id_fkey
  FOREIGN KEY (affiliate_id)
  REFERENCES affiliates(id)
  ON DELETE CASCADE;
