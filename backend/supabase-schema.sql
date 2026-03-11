-- ============================================================
-- CITOYENS SANS FRONTIÈRES — Supabase SQL Schema
-- Run this in your Supabase SQL Editor (Project > SQL Editor)
-- ============================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- ENUMS
-- ============================================================

CREATE TYPE org_category AS ENUM ('ngo', 'association', 'foundation', 'collective', 'other');
CREATE TYPE org_member_role AS ENUM ('admin', 'manager', 'member');
CREATE TYPE enterprise_sector AS ENUM ('tech', 'finance', 'energy', 'health', 'education', 'agriculture', 'retail', 'manufacturing', 'services', 'other');
CREATE TYPE enterprise_size AS ENUM ('startup', 'sme', 'large', 'multinational');
CREATE TYPE actor_type AS ENUM ('user', 'organization', 'enterprise');
CREATE TYPE connection_status AS ENUM ('pending', 'accepted', 'rejected');

-- ============================================================
-- PROFILES TABLE
-- Extends Supabase auth.users with public profile data
-- ============================================================

CREATE TABLE public.profiles (
  id          UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email       TEXT UNIQUE NOT NULL,
  full_name   TEXT NOT NULL,
  bio         TEXT,
  location    TEXT,
  avatar_url  TEXT,
  phone       TEXT,
  website     TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at  TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Auto-create profile when user signs up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1))
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================================
-- ORGANIZATIONS TABLE
-- ============================================================

CREATE TABLE public.organizations (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name        TEXT NOT NULL,
  description TEXT NOT NULL,
  category    org_category DEFAULT 'other',
  location    TEXT,
  website     TEXT,
  logo_url    TEXT,
  created_by  UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
  created_at  TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at  TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- ============================================================
-- ORGANIZATION MEMBERS TABLE
-- Tracks who belongs to an organization and their role
-- ============================================================

CREATE TABLE public.organization_members (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  user_id         UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  role            org_member_role DEFAULT 'member' NOT NULL,
  joined_at       TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  UNIQUE (organization_id, user_id)
);

-- ============================================================
-- ENTERPRISES TABLE
-- ============================================================

CREATE TABLE public.enterprises (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name        TEXT NOT NULL,
  description TEXT NOT NULL,
  sector      enterprise_sector DEFAULT 'other',
  size        enterprise_size DEFAULT 'sme',
  location    TEXT,
  website     TEXT,
  logo_url    TEXT,
  created_by  UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
  created_at  TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at  TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- ============================================================
-- CONNECTIONS TABLE
-- Polymorphic — links any two actors (user, org, enterprise)
-- ============================================================

CREATE TABLE public.connections (
  id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  requester_type actor_type NOT NULL,
  requester_id   UUID NOT NULL,
  target_type    actor_type NOT NULL,
  target_id      UUID NOT NULL,
  status         connection_status DEFAULT 'pending' NOT NULL,
  created_at     TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at     TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  -- Prevent duplicate connections in either direction
  CONSTRAINT no_self_connection CHECK (requester_id <> target_id),
  CONSTRAINT unique_connection UNIQUE (requester_id, target_id)
);

-- ============================================================
-- UPDATED_AT TRIGGERS
-- ============================================================

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER organizations_updated_at
  BEFORE UPDATE ON public.organizations
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER enterprises_updated_at
  BEFORE UPDATE ON public.enterprises
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER connections_updated_at
  BEFORE UPDATE ON public.connections
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ============================================================
-- INDEXES (performance)
-- ============================================================

CREATE INDEX idx_profiles_email ON public.profiles(email);
CREATE INDEX idx_organizations_created_by ON public.organizations(created_by);
CREATE INDEX idx_organizations_category ON public.organizations(category);
CREATE INDEX idx_org_members_org_id ON public.organization_members(organization_id);
CREATE INDEX idx_org_members_user_id ON public.organization_members(user_id);
CREATE INDEX idx_enterprises_created_by ON public.enterprises(created_by);
CREATE INDEX idx_enterprises_sector ON public.enterprises(sector);
CREATE INDEX idx_connections_requester ON public.connections(requester_id);
CREATE INDEX idx_connections_target ON public.connections(target_id);
CREATE INDEX idx_connections_status ON public.connections(status);

-- ============================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organization_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.enterprises ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.connections ENABLE ROW LEVEL SECURITY;

-- ---- PROFILES ----
-- Anyone can view profiles (public platform)
CREATE POLICY "profiles_select_public"
  ON public.profiles FOR SELECT
  USING (true);

-- Only the owner can update their profile
CREATE POLICY "profiles_update_own"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

-- ---- ORGANIZATIONS ----
-- Anyone can view organizations
CREATE POLICY "orgs_select_public"
  ON public.organizations FOR SELECT
  USING (true);

-- Authenticated users can create organizations
CREATE POLICY "orgs_insert_authenticated"
  ON public.organizations FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL AND auth.uid() = created_by);

-- Only admin members can update their organization
CREATE POLICY "orgs_update_admin"
  ON public.organizations FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.organization_members
      WHERE organization_id = id
        AND user_id = auth.uid()
        AND role = 'admin'
    )
  );

-- Only admin members can delete their organization
CREATE POLICY "orgs_delete_admin"
  ON public.organizations FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.organization_members
      WHERE organization_id = id
        AND user_id = auth.uid()
        AND role = 'admin'
    )
  );

-- ---- ORGANIZATION MEMBERS ----
-- Anyone can view members
CREATE POLICY "org_members_select_public"
  ON public.organization_members FOR SELECT
  USING (true);

-- Admins can insert members
CREATE POLICY "org_members_insert_admin"
  ON public.organization_members FOR INSERT
  WITH CHECK (
    auth.uid() = user_id OR
    EXISTS (
      SELECT 1 FROM public.organization_members om
      WHERE om.organization_id = organization_id
        AND om.user_id = auth.uid()
        AND om.role = 'admin'
    )
  );

-- Admins can remove members
CREATE POLICY "org_members_delete_admin"
  ON public.organization_members FOR DELETE
  USING (
    auth.uid() = user_id OR
    EXISTS (
      SELECT 1 FROM public.organization_members om
      WHERE om.organization_id = organization_id
        AND om.user_id = auth.uid()
        AND om.role = 'admin'
    )
  );

-- ---- ENTERPRISES ----
-- Anyone can view enterprises
CREATE POLICY "enterprises_select_public"
  ON public.enterprises FOR SELECT
  USING (true);

-- Authenticated users can register an enterprise
CREATE POLICY "enterprises_insert_authenticated"
  ON public.enterprises FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL AND auth.uid() = created_by);

-- Only creator can update
CREATE POLICY "enterprises_update_owner"
  ON public.enterprises FOR UPDATE
  USING (auth.uid() = created_by);

-- Only creator can delete
CREATE POLICY "enterprises_delete_owner"
  ON public.enterprises FOR DELETE
  USING (auth.uid() = created_by);

-- ---- CONNECTIONS ----
-- Actors can see connections they're part of
CREATE POLICY "connections_select_participant"
  ON public.connections FOR SELECT
  USING (
    auth.uid() = requester_id OR auth.uid() = target_id
  );

-- Authenticated users can request connections
CREATE POLICY "connections_insert_authenticated"
  ON public.connections FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

-- Only participants can update (accept/reject)
CREATE POLICY "connections_update_participant"
  ON public.connections FOR UPDATE
  USING (auth.uid() = requester_id OR auth.uid() = target_id);

-- Only participants can delete (remove connection)
CREATE POLICY "connections_delete_participant"
  ON public.connections FOR DELETE
  USING (auth.uid() = requester_id OR auth.uid() = target_id);

-- ============================================================
-- DONE ✓
-- Schema is ready. Run this in Supabase SQL Editor.
-- ============================================================
