-- Create a function to get user email from auth.users
-- This allows us to query auth.users from API routes with service role key

CREATE OR REPLACE FUNCTION get_user_email(user_id UUID)
RETURNS TABLE (email TEXT) AS $$
BEGIN
  RETURN QUERY
  SELECT au.email::TEXT
  FROM auth.users au
  WHERE au.id = user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
