-- =============================================================================
-- ETERNIA — Migration 005: Fix handle_new_user trigger robustness
-- =============================================================================
-- Problem: The handle_new_user() trigger calls log_audit_event() which internally
-- uses digest() from pgcrypto. If pgcrypto was not available when the trigger
-- ran, OR if any audit log error occurred, the entire user creation was aborted.
--
-- Fix: Wrap the audit log call in an EXCEPTION block so a logging failure
-- never prevents user account creation.
-- =============================================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, ''
AS $$
DECLARE
  v_username       TEXT;
  v_institution_id UUID;
  v_role           TEXT;
BEGIN
  -- Extract metadata passed during Supabase Auth signUp() / admin.createUser()
  v_username       := NEW.raw_user_meta_data ->> 'username';
  v_institution_id := (NEW.raw_user_meta_data ->> 'institution_id')::UUID;
  v_role           := UPPER(COALESCE(NEW.raw_user_meta_data ->> 'role', 'STUDENT'));

  -- Validate role — fall back to STUDENT for unrecognised values
  IF v_role NOT IN ('STUDENT', 'INTERN', 'EXPERT', 'SPOC', 'ADMIN') THEN
    v_role := 'STUDENT';
  END IF;

  -- Require a non-empty username
  IF v_username IS NULL OR trim(v_username) = '' THEN
    RAISE EXCEPTION 'handle_new_user: username is required in raw_user_meta_data. Auth uid: %', NEW.id;
  END IF;

  -- Insert the public.users skeleton row
  INSERT INTO public.users (
    id,
    institution_id,
    username,
    role,
    is_active,
    created_at
  )
  VALUES (
    NEW.id,
    v_institution_id,
    trim(v_username),
    v_role,
    TRUE,
    NOW()
  )
  ON CONFLICT (id) DO NOTHING;

  -- Attempt to write an audit log entry — wrapped in EXCEPTION so that
  -- a log failure NEVER rolls back the user creation above.
  BEGIN
    PERFORM public.log_audit_event(
      p_actor_id     => NEW.id,
      p_action_type  => 'USER_CREATED',
      p_target_table => 'users',
      p_target_id    => NEW.id,
      p_metadata     => jsonb_build_object(
                          'role',           v_role,
                          'institution_id', v_institution_id
                        )
    );
  EXCEPTION WHEN OTHERS THEN
    -- Silently skip audit log on error — user creation must not fail
    -- because of a logging issue. The error is visible in pg_log.
    NULL;
  END;

  RETURN NEW;
END;
$$;

COMMENT ON FUNCTION public.handle_new_user() IS
  'AFTER INSERT trigger on auth.users: creates the public.users skeleton row. Audit log is best-effort — failure does not abort user creation.';

-- Re-grant execute permission (idempotent)
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO supabase_auth_admin;

-- Re-create the trigger (idempotent)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();
