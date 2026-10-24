-- ============================================================================
-- Migration: 0001_init_schema
-- Description: Initial database schema for Max it Partage guest invitation flow
-- Created: 2024
-- ============================================================================

-- Enable UUID extension for generating unique identifiers
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================================
-- TABLES
-- ============================================================================

-- profiles: User profiles linked to Supabase auth.users
-- Each authenticated user (including anonymous guests) has a profile
CREATE TABLE profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  prenom text NOT NULL CHECK (char_length(prenom) >= 2),
  nom text NOT NULL CHECK (char_length(nom) >= 2),
  phone text UNIQUE CHECK (phone ~ '^\+221[0-9]{9}$'),
  created_at timestamptz NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE profiles IS 'User profiles with identity information, linked to auth.users';
COMMENT ON COLUMN profiles.phone IS 'Phone number in E.164 format: +221XXXXXXXXX (Senegal). NULL for creators who authenticate anonymously and never claim an invite. Populated only via claim_invitation RPC when a guest claims their invitation.';

-- collectes: Money collection campaigns
CREATE TABLE collectes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL CHECK (char_length(title) >= 3),
  motif text NOT NULL CHECK (motif IN ('anniversaire', 'sortie', 'facture', 'cadeau', 'evenement', 'autre')),
  total int NOT NULL CHECK (total > 0),
  deadline date NULL,
  message text NULL,
  created_by uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  history jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamptz NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE collectes IS 'Money collection campaigns created by users';
COMMENT ON COLUMN collectes.motif IS 'Reason for the collection: anniversaire, sortie, facture, cadeau, evenement, autre';
COMMENT ON COLUMN collectes.total IS 'Total amount to collect in FCFA';
COMMENT ON COLUMN collectes.deadline IS 'Optional deadline date. Invitations expire after this date';
COMMENT ON COLUMN collectes.history IS 'JSONB array of history entries: [{text: string, at: timestamptz}]';

-- participants: Participants in a collection (invited or creator)
CREATE TABLE participants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  collecte_id uuid NOT NULL REFERENCES collectes(id) ON DELETE CASCADE,
  profile_id uuid NULL REFERENCES profiles(id) ON DELETE SET NULL,
  prenom text NOT NULL CHECK (char_length(prenom) >= 2),
  nom text NULL,
  phone text NULL CHECK (phone IS NULL OR phone ~ '^\+221[0-9]{9}$'),
  amount int NOT NULL CHECK (amount > 0),
  status text NOT NULL DEFAULT 'attente' CHECK (status IN ('attente', 'paye')),
  invite_token text UNIQUE NOT NULL,
  joined_at timestamptz NULL,
  created_at timestamptz NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE participants IS 'Participants in a collecte. profile_id is NULL until they claim their invitation';
COMMENT ON COLUMN participants.profile_id IS 'Linked profile after claiming invitation. NULL for unclaimed invitations';
COMMENT ON COLUMN participants.nom IS 'Last name. May be empty/minimal for creator participant row (displayed as "Vous"). Guest participants must provide >= 2 chars via claim_invitation RPC validation.';
COMMENT ON COLUMN participants.phone IS 'Phone number in E.164 format. NULL for creator and unclaimed invitations. Populated when guest claims invitation.';
COMMENT ON COLUMN participants.invite_token IS 'Unique token for invitation link /invite/:token';
COMMENT ON COLUMN participants.status IS 'Payment status: attente (pending) or paye (paid)';
COMMENT ON COLUMN participants.joined_at IS 'Timestamp when the participant claimed their invitation';

-- ============================================================================
-- INDEXES for query performance
-- ============================================================================

CREATE INDEX idx_collectes_created_by ON collectes(created_by);
CREATE INDEX idx_collectes_deadline ON collectes(deadline) WHERE deadline IS NOT NULL;
CREATE INDEX idx_participants_collecte ON participants(collecte_id);
CREATE INDEX idx_participants_profile ON participants(profile_id) WHERE profile_id IS NOT NULL;
CREATE INDEX idx_participants_token ON participants(invite_token);

-- ============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE collectes ENABLE ROW LEVEL SECURITY;
ALTER TABLE participants ENABLE ROW LEVEL SECURITY;

-- -----------------------------------------------------------------------------
-- profiles: Users can only see and update their own profile
-- -----------------------------------------------------------------------------

CREATE POLICY "profiles_select_own" ON profiles
  FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "profiles_update_own" ON profiles
  FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

COMMENT ON POLICY "profiles_select_own" ON profiles IS 'Users can only view their own profile';
COMMENT ON POLICY "profiles_update_own" ON profiles IS 'Users can only update their own profile';

-- -----------------------------------------------------------------------------
-- collectes: Users see collectes they created OR participate in
-- -----------------------------------------------------------------------------

CREATE POLICY "collectes_select_creator_or_participant" ON collectes
  FOR SELECT
  USING (
    created_by = auth.uid()
    OR EXISTS (
      SELECT 1 FROM participants p
      WHERE p.collecte_id = collectes.id
        AND p.profile_id = auth.uid()
    )
  );

CREATE POLICY "collectes_insert_own" ON collectes
  FOR INSERT
  WITH CHECK (created_by = auth.uid());

CREATE POLICY "collectes_update_own" ON collectes
  FOR UPDATE
  USING (created_by = auth.uid())
  WITH CHECK (created_by = auth.uid());

COMMENT ON POLICY "collectes_select_creator_or_participant" ON collectes IS 'Users see collectes they created or participate in';
COMMENT ON POLICY "collectes_insert_own" ON collectes IS 'Users can only create collectes as themselves';
COMMENT ON POLICY "collectes_update_own" ON collectes IS 'Only the creator can update a collecte';

-- -----------------------------------------------------------------------------
-- participants: Users see participants in collectes they can access
-- Only creators can insert participants (invite others)
-- Users can update their own participant record or creators can update their collecte participants
-- -----------------------------------------------------------------------------

CREATE POLICY "participants_select_same_collecte" ON participants
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM collectes c
      WHERE c.id = participants.collecte_id
        AND (
          c.created_by = auth.uid()
          OR EXISTS (
            SELECT 1 FROM participants p2
            WHERE p2.collecte_id = c.id
              AND p2.profile_id = auth.uid()
          )
        )
    )
  );

CREATE POLICY "participants_insert_if_creator" ON participants
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM collectes c
      WHERE c.id = participants.collecte_id
        AND c.created_by = auth.uid()
    )
  );

CREATE POLICY "participants_update_own_or_creator" ON participants
  FOR UPDATE
  USING (
    profile_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM collectes c
      WHERE c.id = participants.collecte_id
        AND c.created_by = auth.uid()
    )
  )
  WITH CHECK (
    profile_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM collectes c
      WHERE c.id = participants.collecte_id
        AND c.created_by = auth.uid()
    )
  );

COMMENT ON POLICY "participants_select_same_collecte" ON participants IS 'Users see participants in collectes they created or participate in';
COMMENT ON POLICY "participants_insert_if_creator" ON participants IS 'Only collecte creators can invite participants';
COMMENT ON POLICY "participants_update_own_or_creator" ON participants IS 'Users can update their own participant record or creator can update all';

-- ============================================================================
-- SECURITY DEFINER FUNCTIONS (RPCs)
-- ============================================================================

-- -----------------------------------------------------------------------------
-- get_invite_preview: Preview invitation details before claiming
-- Called by anonymous users to see collecte information from invite token
-- -----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION get_invite_preview(token_input TEXT)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_participant participants%ROWTYPE;
  v_collecte collectes%ROWTYPE;
  v_creator_name text;
  v_is_expired boolean;
  v_is_claimed boolean;
BEGIN
  -- Fetch participant by token
  SELECT * INTO v_participant
  FROM participants
  WHERE invite_token = token_input;

  IF NOT FOUND THEN
    RETURN json_build_object(
      'success', false,
      'error', 'invalid_token',
      'message', 'Lien d''invitation invalide'
    );
  END IF;

  -- Fetch collecte
  SELECT * INTO v_collecte
  FROM collectes
  WHERE id = v_participant.collecte_id;

  IF NOT FOUND THEN
    RETURN json_build_object(
      'success', false,
      'error', 'collecte_not_found',
      'message', 'Collecte introuvable'
    );
  END IF;

  -- Check if expired
  v_is_expired := (v_collecte.deadline IS NOT NULL AND v_collecte.deadline < CURRENT_DATE);

  IF v_is_expired THEN
    RETURN json_build_object(
      'success', false,
      'error', 'expired',
      'message', 'Ce lien d''invitation a expiré'
    );
  END IF;

  -- Check if already claimed
  v_is_claimed := (v_participant.profile_id IS NOT NULL);

  -- Get creator name
  SELECT prenom || ' ' || nom INTO v_creator_name
  FROM profiles
  WHERE id = v_collecte.created_by;

  -- Return preview
  RETURN json_build_object(
    'success', true,
    'collecte_id', v_collecte.id,
    'collecte_title', v_collecte.title,
    'motif', v_collecte.motif,
    'amount', v_participant.amount,
    'created_by_name', v_creator_name,
    'deadline', v_collecte.deadline,
    'is_expired', v_is_expired,
    'is_claimed', v_is_claimed
  );
END;
$$;

COMMENT ON FUNCTION get_invite_preview IS 'Preview invitation details for anonymous users. Returns collecte info or error if expired/invalid';

-- -----------------------------------------------------------------------------
-- claim_invitation: Claim an invitation and join a collecte
-- Links anonymous auth user to participant record after identity verification
-- -----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION claim_invitation(
  token_input TEXT,
  prenom_input TEXT,
  nom_input TEXT,
  phone_input TEXT
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_participant participants%ROWTYPE;
  v_collecte collectes%ROWTYPE;
  v_profile_id uuid;
  v_existing_profile profiles%ROWTYPE;
  v_history_entry jsonb;
BEGIN
  -- Validate inputs
  IF char_length(prenom_input) < 2 THEN
    RETURN json_build_object(
      'success', false,
      'error', 'invalid_prenom',
      'message', 'Le prénom doit contenir au moins 2 caractères'
    );
  END IF;

  IF char_length(nom_input) < 2 THEN
    RETURN json_build_object(
      'success', false,
      'error', 'invalid_nom',
      'message', 'Le nom doit contenir au moins 2 caractères'
    );
  END IF;

  IF phone_input !~ '^\+221[0-9]{9}$' THEN
    RETURN json_build_object(
      'success', false,
      'error', 'invalid_phone',
      'message', 'Le numéro de téléphone doit être au format +221XXXXXXXXX'
    );
  END IF;

  -- Get current user ID
  v_profile_id := auth.uid();
  
  IF v_profile_id IS NULL THEN
    RETURN json_build_object(
      'success', false,
      'error', 'not_authenticated',
      'message', 'Vous devez être authentifié'
    );
  END IF;

  -- Fetch participant by token
  SELECT * INTO v_participant
  FROM participants
  WHERE invite_token = token_input;

  IF NOT FOUND THEN
    RETURN json_build_object(
      'success', false,
      'error', 'invalid_token',
      'message', 'Lien d''invitation invalide'
    );
  END IF;

  -- Check if already claimed by a different user
  IF v_participant.profile_id IS NOT NULL AND v_participant.profile_id != v_profile_id THEN
    RETURN json_build_object(
      'success', false,
      'error', 'already_claimed',
      'message', 'Ce lien a déjà été utilisé par un autre utilisateur'
    );
  END IF;

  -- Idempotent: if already claimed by same user, return success
  IF v_participant.profile_id = v_profile_id THEN
    RETURN json_build_object(
      'success', true,
      'collecte_id', v_participant.collecte_id,
      'message', 'Vous avez déjà rejoint cette collecte'
    );
  END IF;

  -- Fetch collecte
  SELECT * INTO v_collecte
  FROM collectes
  WHERE id = v_participant.collecte_id;

  IF NOT FOUND THEN
    RETURN json_build_object(
      'success', false,
      'error', 'collecte_not_found',
      'message', 'Collecte introuvable'
    );
  END IF;

  -- Check if expired
  IF v_collecte.deadline IS NOT NULL AND v_collecte.deadline < CURRENT_DATE THEN
    RETURN json_build_object(
      'success', false,
      'error', 'expired',
      'message', 'Ce lien d''invitation a expiré'
    );
  END IF;

  -- Check if phone is already taken by a different user
  SELECT * INTO v_existing_profile
  FROM profiles
  WHERE phone = phone_input AND id != v_profile_id;

  IF FOUND THEN
    RETURN json_build_object(
      'success', false,
      'error', 'phone_taken',
      'message', 'Ce numéro de téléphone est déjà utilisé par un autre compte'
    );
  END IF;

  -- Upsert profile
  INSERT INTO profiles (id, prenom, nom, phone, created_at)
  VALUES (v_profile_id, prenom_input, nom_input, phone_input, NOW())
  ON CONFLICT (id) DO UPDATE
  SET prenom = EXCLUDED.prenom,
      nom = EXCLUDED.nom,
      phone = EXCLUDED.phone;

  -- Link participant to profile
  UPDATE participants
  SET profile_id = v_profile_id,
      prenom = prenom_input,
      nom = nom_input,
      phone = phone_input,
      joined_at = NOW()
  WHERE id = v_participant.id;

  -- Append history entry
  v_history_entry := json_build_object(
    'text', prenom_input || ' ' || nom_input || ' a rejoint la collecte',
    'at', NOW()
  )::jsonb;

  UPDATE collectes
  SET history = history || jsonb_build_array(v_history_entry)
  WHERE id = v_collecte.id;

  -- Return success
  RETURN json_build_object(
    'success', true,
    'collecte_id', v_collecte.id,
    'message', 'Bienvenue dans la collecte !'
  );
END;
$$;

COMMENT ON FUNCTION claim_invitation IS 'Claim an invitation by providing identity. Links participant to auth user and upserts profile';

-- -----------------------------------------------------------------------------
-- pay_participant: Mark a participant as paid and generate payment reference
-- Called when a user pays their contribution
-- -----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION pay_participant(
  collecte_id_input UUID,
  participant_id_input UUID
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_participant participants%ROWTYPE;
  v_collecte collectes%ROWTYPE;
  v_profile profiles%ROWTYPE;
  v_user_id uuid;
  v_is_authorized boolean;
  v_payment_ref text;
  v_history_entry jsonb;
BEGIN
  -- Get current user ID
  v_user_id := auth.uid();
  
  IF v_user_id IS NULL THEN
    RETURN json_build_object(
      'success', false,
      'error', 'not_authenticated',
      'message', 'Vous devez être authentifié'
    );
  END IF;

  -- Fetch participant
  SELECT * INTO v_participant
  FROM participants
  WHERE id = participant_id_input;

  IF NOT FOUND THEN
    RETURN json_build_object(
      'success', false,
      'error', 'participant_not_found',
      'message', 'Participant introuvable'
    );
  END IF;

  -- Verify collecte_id matches
  IF v_participant.collecte_id != collecte_id_input THEN
    RETURN json_build_object(
      'success', false,
      'error', 'collecte_mismatch',
      'message', 'Le participant n''appartient pas à cette collecte'
    );
  END IF;

  -- Fetch collecte
  SELECT * INTO v_collecte
  FROM collectes
  WHERE id = collecte_id_input;

  IF NOT FOUND THEN
    RETURN json_build_object(
      'success', false,
      'error', 'collecte_not_found',
      'message', 'Collecte introuvable'
    );
  END IF;

  -- Check authorization: user must be the participant or the collecte creator
  v_is_authorized := (v_participant.profile_id = v_user_id OR v_collecte.created_by = v_user_id);

  IF NOT v_is_authorized THEN
    RETURN json_build_object(
      'success', false,
      'error', 'forbidden',
      'message', 'Vous n''êtes pas autorisé à effectuer ce paiement'
    );
  END IF;

  -- Idempotent: if already paid, return existing ref (simulate by returning success)
  IF v_participant.status = 'paye' THEN
    RETURN json_build_object(
      'success', true,
      'ref', 'MXP-' || substring(v_participant.id::text from 1 for 8) || '-' || substring(v_participant.id::text from 9 for 2),
      'message', 'Ce paiement a déjà été effectué'
    );
  END IF;

  -- Generate payment reference: MXP-XXXXXXXX-XX (based on participant ID)
  v_payment_ref := 'MXP-' || upper(substring(v_participant.id::text from 1 for 8)) || '-' || upper(substring(v_participant.id::text from 9 for 2));

  -- Update participant status
  UPDATE participants
  SET status = 'paye'
  WHERE id = participant_id_input;

  -- Get profile for history entry
  SELECT * INTO v_profile
  FROM profiles
  WHERE id = v_participant.profile_id;

  -- Append history entry
  v_history_entry := json_build_object(
    'text', v_participant.prenom || ' ' || COALESCE(v_participant.nom, '') || ' a payé ' || v_participant.amount || ' FCFA',
    'at', NOW()
  )::jsonb;

  UPDATE collectes
  SET history = history || jsonb_build_array(v_history_entry)
  WHERE id = collecte_id_input;

  -- Return success with payment reference
  RETURN json_build_object(
    'success', true,
    'ref', v_payment_ref,
    'message', 'Paiement effectué avec succès'
  );
END;
$$;

COMMENT ON FUNCTION pay_participant IS 'Mark participant as paid and generate payment reference. Only the participant or collecte creator can execute';

-- ============================================================================
-- GRANT PERMISSIONS
-- ============================================================================

-- Anonymous users can preview invitations
GRANT EXECUTE ON FUNCTION get_invite_preview(TEXT) TO anon;
GRANT EXECUTE ON FUNCTION get_invite_preview(TEXT) TO authenticated;

-- Only authenticated users can claim invitations and pay
GRANT EXECUTE ON FUNCTION claim_invitation(TEXT, TEXT, TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION pay_participant(UUID, UUID) TO authenticated;

-- ============================================================================
-- END OF MIGRATION
-- ============================================================================
