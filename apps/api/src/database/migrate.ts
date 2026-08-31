import { pool, connectDatabase } from './connection';
import { logger } from '../config/logger';

const MIGRATIONS: { name: string; sql: string }[] = [
  {
    name: '001_extensions',
    sql: `
      CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
      CREATE EXTENSION IF NOT EXISTS "pg_trgm";
    `,
  },
  {
    name: '002_users_auth',
    sql: `
      CREATE TYPE user_status AS ENUM ('ACTIVE', 'SUSPENDED', 'DEACTIVATED');
      CREATE TYPE user_role AS ENUM ('USER', 'ADMIN', 'SUPER_ADMIN');

      CREATE TABLE users (
        id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        name          VARCHAR(100) NOT NULL,
        email         VARCHAR(255) UNIQUE NOT NULL,
        phone         VARCHAR(15),
        password_hash TEXT,
        avatar_url    TEXT,
        google_id     VARCHAR(255) UNIQUE,
        status        user_status NOT NULL DEFAULT 'ACTIVE',
        email_verified_at TIMESTAMPTZ,
        created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        deleted_at    TIMESTAMPTZ
      );

      CREATE INDEX idx_users_email ON users(email);
      CREATE INDEX idx_users_status ON users(status);
      CREATE INDEX idx_users_created_at ON users(created_at);
      CREATE INDEX idx_users_deleted_at ON users(deleted_at) WHERE deleted_at IS NULL;

      CREATE TABLE roles (
        id          SERIAL PRIMARY KEY,
        name        user_role UNIQUE NOT NULL,
        description TEXT
      );

      INSERT INTO roles (name, description) VALUES
        ('USER', 'Regular platform user'),
        ('ADMIN', 'Platform administrator'),
        ('SUPER_ADMIN', 'Super administrator with full access');

      CREATE TABLE user_roles (
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        role_id INTEGER NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
        assigned_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        PRIMARY KEY (user_id, role_id)
      );

      CREATE TABLE refresh_tokens (
        id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        token_hash  VARCHAR(255) UNIQUE NOT NULL,
        device_info TEXT,
        ip_address  INET,
        expires_at  TIMESTAMPTZ NOT NULL,
        revoked_at  TIMESTAMPTZ,
        created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      CREATE INDEX idx_refresh_tokens_user_id ON refresh_tokens(user_id);
      CREATE INDEX idx_refresh_tokens_token_hash ON refresh_tokens(token_hash);

      CREATE TABLE password_resets (
        id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        token_hash  VARCHAR(255) UNIQUE NOT NULL,
        expires_at  TIMESTAMPTZ NOT NULL,
        used_at     TIMESTAMPTZ,
        created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      CREATE INDEX idx_password_resets_token_hash ON password_resets(token_hash);
      CREATE INDEX idx_password_resets_user_id ON password_resets(user_id);
    `,
  },
  {
    name: '003_property_categories',
    sql: `
      CREATE TABLE property_categories (
        id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        name       VARCHAR(100) NOT NULL,
        slug       VARCHAR(100) UNIQUE NOT NULL,
        icon       VARCHAR(100),
        sort_order INTEGER NOT NULL DEFAULT 0,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      CREATE TABLE property_amenities (
        id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        name       VARCHAR(100) NOT NULL,
        icon       VARCHAR(100),
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `,
  },
  {
    name: '004_properties',
    sql: `
      CREATE TYPE listing_type AS ENUM ('SELL', 'RENT', 'LEASE');
      CREATE TYPE property_status AS ENUM (
        'DRAFT', 'PENDING_REVIEW', 'PUBLISHED', 'REJECTED', 'SOLD', 'RENTED', 'ARCHIVED'
      );
      CREATE TYPE furnished_status AS ENUM ('UNFURNISHED', 'SEMI_FURNISHED', 'FULLY_FURNISHED');
      CREATE TYPE construction_status AS ENUM ('READY_TO_MOVE', 'UNDER_CONSTRUCTION', 'NEW_LAUNCH');
      CREATE TYPE area_unit AS ENUM ('SQ_FT', 'SQ_MT', 'ACRE', 'BIGHA', 'HECTARE', 'MARLA', 'KANAL');
      CREATE TYPE created_by_role AS ENUM ('USER', 'ADMIN');

      CREATE TABLE properties (
        id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        slug                VARCHAR(300) UNIQUE NOT NULL,
        title               VARCHAR(200) NOT NULL,
        description         TEXT NOT NULL,
        price               NUMERIC(15,2) NOT NULL,
        listing_type        listing_type NOT NULL,
        category_id         UUID NOT NULL REFERENCES property_categories(id),
        owner_id            UUID NOT NULL REFERENCES users(id),
        created_by          UUID NOT NULL REFERENCES users(id),
        created_by_role     created_by_role NOT NULL DEFAULT 'USER',
        city                VARCHAR(100) NOT NULL,
        state               VARCHAR(100) NOT NULL,
        country             VARCHAR(100) NOT NULL DEFAULT 'India',
        address             TEXT,
        pincode             VARCHAR(10),
        latitude            DOUBLE PRECISION,
        longitude           DOUBLE PRECISION,
        area                NUMERIC(12,2),
        area_unit           area_unit,
        bedrooms            INTEGER,
        bathrooms           INTEGER,
        parking             INTEGER,
        furnished_status    furnished_status,
        construction_status construction_status,
        status              property_status NOT NULL DEFAULT 'PENDING_REVIEW',
        is_popular          BOOLEAN NOT NULL DEFAULT FALSE,
        popular_rank        INTEGER,
        rejection_reason    TEXT,
        published_at        TIMESTAMPTZ,
        custom_amenities    TEXT[] DEFAULT '{}',
        video_url           VARCHAR(500),
        created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        deleted_at          TIMESTAMPTZ
      );

      CREATE INDEX idx_properties_slug ON properties(slug);
      CREATE INDEX idx_properties_owner_id ON properties(owner_id);
      CREATE INDEX idx_properties_status ON properties(status);
      CREATE INDEX idx_properties_listing_type ON properties(listing_type);
      CREATE INDEX idx_properties_category_id ON properties(category_id);
      CREATE INDEX idx_properties_city ON properties(city);
      CREATE INDEX idx_properties_price ON properties(price);
      CREATE INDEX idx_properties_created_at ON properties(created_at DESC);
      CREATE INDEX idx_properties_is_popular ON properties(is_popular, popular_rank);
      CREATE INDEX idx_properties_deleted_at ON properties(deleted_at) WHERE deleted_at IS NULL;
      CREATE INDEX idx_properties_fts ON properties
        USING GIN(to_tsvector('english', title || ' ' || COALESCE(description, '') || ' ' || city || ' ' || state));

      ALTER TABLE properties ADD COLUMN IF NOT EXISTS video_url VARCHAR(500);

      CREATE TABLE property_images (
        id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        property_id  UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
        storage_key  TEXT NOT NULL,
        url          TEXT NOT NULL,
        width        INTEGER,
        height       INTEGER,
        size         BIGINT,
        mime_type    VARCHAR(50),
        sort_order   INTEGER NOT NULL DEFAULT 0,
        created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      CREATE INDEX idx_property_images_property_id ON property_images(property_id);

      CREATE TABLE property_amenity_mapping (
        property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
        amenity_id  UUID NOT NULL REFERENCES property_amenities(id) ON DELETE CASCADE,
        PRIMARY KEY (property_id, amenity_id)
      );

      CREATE TABLE favorites (
        user_id      UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        property_id  UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
        created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        PRIMARY KEY (user_id, property_id)
      );

      CREATE INDEX idx_favorites_user_id ON favorites(user_id);
      CREATE INDEX idx_favorites_property_id ON favorites(property_id);
    `,
  },
  {
    name: '005_projects',
    sql: `
      CREATE TYPE project_status AS ENUM ('UPCOMING', 'ONGOING', 'COMPLETED');
      CREATE TYPE plot_status AS ENUM ('AVAILABLE', 'RESERVED', 'SOLD', 'BLOCKED');
      CREATE TYPE plot_facing AS ENUM (
        'NORTH', 'SOUTH', 'EAST', 'WEST',
        'NORTH_EAST', 'NORTH_WEST', 'SOUTH_EAST', 'SOUTH_WEST'
      );

      CREATE TABLE projects (
        id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        slug        VARCHAR(300) UNIQUE NOT NULL,
        name        VARCHAR(200) NOT NULL,
        description TEXT,
        developer   VARCHAR(200),
        city        VARCHAR(100) NOT NULL,
        state       VARCHAR(100) NOT NULL,
        country     VARCHAR(100) NOT NULL DEFAULT 'India',
        address     TEXT,
        latitude    DOUBLE PRECISION,
        longitude   DOUBLE PRECISION,
        total_area  NUMERIC(12,2),
        total_plots INTEGER NOT NULL DEFAULT 0,
        status      project_status NOT NULL DEFAULT 'UPCOMING',
        created_by  UUID REFERENCES users(id),
        created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        deleted_at  TIMESTAMPTZ
      );

      CREATE INDEX idx_projects_slug ON projects(slug);
      CREATE INDEX idx_projects_status ON projects(status);
      CREATE INDEX idx_projects_city ON projects(city);

      CREATE TABLE project_images (
        id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        project_id  UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
        storage_key TEXT NOT NULL,
        url         TEXT NOT NULL,
        sort_order  INTEGER NOT NULL DEFAULT 0,
        created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      CREATE TABLE project_amenity_mapping (
        project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
        amenity_id UUID NOT NULL REFERENCES property_amenities(id) ON DELETE CASCADE,
        PRIMARY KEY (project_id, amenity_id)
      );

      CREATE TABLE project_plots (
        id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        project_id       UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
        plot_number      VARCHAR(50) NOT NULL,
        area             NUMERIC(12,2) NOT NULL,
        area_unit        area_unit NOT NULL DEFAULT 'SQ_FT',
        price            NUMERIC(15,2) NOT NULL,
        facing           plot_facing,
        status           plot_status NOT NULL DEFAULT 'AVAILABLE',
        coordinates      JSONB,
        polygon_geometry JSONB,
        created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        UNIQUE (project_id, plot_number)
      );

      CREATE INDEX idx_project_plots_project_id ON project_plots(project_id);
      CREATE INDEX idx_project_plots_status ON project_plots(status);
    `,
  },
  {
    name: '006_blogs',
    sql: `
      CREATE TYPE blog_status AS ENUM ('DRAFT', 'PUBLISHED', 'ARCHIVED');

      CREATE TABLE blog_categories (
        id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        name       VARCHAR(100) NOT NULL,
        slug       VARCHAR(100) UNIQUE NOT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      CREATE TABLE blogs (
        id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        slug              VARCHAR(300) UNIQUE NOT NULL,
        title             VARCHAR(300) NOT NULL,
        excerpt           TEXT,
        content           TEXT NOT NULL,
        featured_image_url TEXT,
        author_id         UUID NOT NULL REFERENCES users(id),
        category_id       UUID REFERENCES blog_categories(id),
        tags              TEXT[] NOT NULL DEFAULT '{}',
        meta_title        VARCHAR(70),
        meta_description  VARCHAR(160),
        canonical_url     TEXT,
        og_title          VARCHAR(70),
        og_description    VARCHAR(200),
        og_image_url      TEXT,
        schema_data       JSONB,
        status            blog_status NOT NULL DEFAULT 'DRAFT',
        published_at      TIMESTAMPTZ,
        created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        deleted_at        TIMESTAMPTZ
      );

      CREATE INDEX idx_blogs_slug ON blogs(slug);
      CREATE INDEX idx_blogs_status ON blogs(status);
      CREATE INDEX idx_blogs_author_id ON blogs(author_id);
      CREATE INDEX idx_blogs_published_at ON blogs(published_at DESC);
      CREATE INDEX idx_blogs_category_id ON blogs(category_id);
    `,
  },
  {
    name: '007_conversations',
    sql: `
      CREATE TYPE message_type AS ENUM ('TEXT', 'IMAGE', 'SYSTEM');

      CREATE TABLE conversations (
        id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      CREATE TABLE conversation_members (
        conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
        user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        last_read_at    TIMESTAMPTZ,
        joined_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        PRIMARY KEY (conversation_id, user_id)
      );

      CREATE INDEX idx_conversation_members_user_id ON conversation_members(user_id);

      CREATE TABLE messages (
        id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        conversation_id     UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
        sender_id           UUID NOT NULL REFERENCES users(id),
        message_type        message_type NOT NULL DEFAULT 'TEXT',
        content             TEXT,
        is_read             BOOLEAN DEFAULT false,
        reply_to_message_id UUID REFERENCES messages(id),
        created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        edited_at           TIMESTAMPTZ,
        deleted_at          TIMESTAMPTZ
      );

      CREATE INDEX idx_messages_conversation_id ON messages(conversation_id);
      CREATE INDEX idx_messages_created_at ON messages(created_at);
      CREATE INDEX idx_messages_sender_id ON messages(sender_id);

      CREATE TABLE message_attachments (
        id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        message_id  UUID NOT NULL REFERENCES messages(id) ON DELETE CASCADE,
        url         TEXT NOT NULL,
        storage_key TEXT NOT NULL,
        mime_type   VARCHAR(50),
        size        BIGINT,
        created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      CREATE TABLE message_reactions (
        id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        message_id UUID NOT NULL REFERENCES messages(id) ON DELETE CASCADE,
        user_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        emoji      VARCHAR(10) NOT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        UNIQUE (message_id, user_id, emoji)
      );
    `,
  },
  {
    name: '008_notifications',
    sql: `
      CREATE TYPE notification_type AS ENUM (
        'PROPERTY_PUBLISHED',
        'PROPERTY_STATUS_CHANGED',
        'PROPERTY_FAVORITED',
        'NEW_MESSAGE',
        'PLOT_AVAILABLE',
        'SYSTEM'
      );

      CREATE TABLE notifications (
        id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        user_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        type       notification_type NOT NULL,
        title      VARCHAR(200) NOT NULL,
        message    TEXT NOT NULL,
        data       JSONB,
        read_at    TIMESTAMPTZ,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      CREATE INDEX idx_notifications_user_id ON notifications(user_id);
      CREATE INDEX idx_notifications_read_at ON notifications(read_at) WHERE read_at IS NULL;
      CREATE INDEX idx_notifications_created_at ON notifications(created_at DESC);

      CREATE TABLE notification_preferences (
        user_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        type       notification_type NOT NULL,
        enabled    BOOLEAN NOT NULL DEFAULT TRUE,
        PRIMARY KEY (user_id, type)
      );

      CREATE TABLE push_subscriptions (
        id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        user_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        endpoint   TEXT UNIQUE NOT NULL,
        p256dh     TEXT NOT NULL,
        auth       TEXT NOT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      CREATE INDEX idx_push_subscriptions_user_id ON push_subscriptions(user_id);
    `,
  },
  {
    name: '009_groups',
    sql: `
      CREATE TYPE group_member_role AS ENUM ('MEMBER', 'ADMIN');

      CREATE TABLE groups (
        id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        name        VARCHAR(100) NOT NULL,
        description TEXT,
        avatar_url  TEXT,
        created_by  UUID NOT NULL REFERENCES users(id),
        created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        deleted_at  TIMESTAMPTZ
      );

      CREATE TABLE group_members (
        group_id   UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
        user_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        role       group_member_role NOT NULL DEFAULT 'MEMBER',
        joined_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        PRIMARY KEY (group_id, user_id)
      );

      CREATE INDEX idx_group_members_user_id ON group_members(user_id);

      CREATE TABLE group_messages (
        id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        group_id     UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
        sender_id    UUID NOT NULL REFERENCES users(id),
        content      TEXT,
        message_type message_type NOT NULL DEFAULT 'TEXT',
        created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        deleted_at   TIMESTAMPTZ
      );

      CREATE INDEX idx_group_messages_group_id ON group_messages(group_id);
      CREATE INDEX idx_group_messages_created_at ON group_messages(created_at);
    `,
  },
  {
    name: '010_calls',
    sql: `
      CREATE TYPE call_type AS ENUM ('AUDIO', 'VIDEO');
      CREATE TYPE call_status AS ENUM ('RINGING', 'ACCEPTED', 'REJECTED', 'MISSED', 'ENDED', 'FAILED');

      CREATE TABLE calls (
        id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        caller_id   UUID NOT NULL REFERENCES users(id),
        receiver_id UUID NOT NULL REFERENCES users(id),
        call_type   call_type NOT NULL,
        status      call_status NOT NULL DEFAULT 'RINGING',
        started_at  TIMESTAMPTZ,
        ended_at    TIMESTAMPTZ,
        duration    INTEGER,
        created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      CREATE INDEX idx_calls_caller_id ON calls(caller_id);
      CREATE INDEX idx_calls_receiver_id ON calls(receiver_id);
      CREATE INDEX idx_calls_created_at ON calls(created_at DESC);

      CREATE TABLE call_participants (
        call_id    UUID NOT NULL REFERENCES calls(id) ON DELETE CASCADE,
        user_id    UUID NOT NULL REFERENCES users(id),
        joined_at  TIMESTAMPTZ,
        left_at    TIMESTAMPTZ,
        PRIMARY KEY (call_id, user_id)
      );
    `,
  },
  {
    name: '011_media_assets',
    sql: `
      CREATE TABLE media_assets (
        id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        entity_type VARCHAR(50) NOT NULL,
        entity_id   UUID,
        storage_key TEXT NOT NULL,
        url         TEXT NOT NULL,
        size        BIGINT,
        mime_type   VARCHAR(50),
        created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      CREATE INDEX idx_media_assets_entity ON media_assets(entity_type, entity_id);
    `,
  },
  {
    name: '012_audit_logs',
    sql: `
      CREATE TABLE audit_logs (
        id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        actor_id      UUID REFERENCES users(id),
        action        VARCHAR(100) NOT NULL,
        resource_type VARCHAR(100) NOT NULL,
        resource_id   UUID,
        before_data   JSONB,
        after_data    JSONB,
        ip            INET,
        created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      CREATE INDEX idx_audit_logs_actor_id ON audit_logs(actor_id);
      CREATE INDEX idx_audit_logs_resource ON audit_logs(resource_type, resource_id);
      CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at DESC);
    `,
  },
  {
    name: '013_update_triggers',
    sql: `
      CREATE OR REPLACE FUNCTION set_updated_at()
      RETURNS TRIGGER AS $$
      BEGIN
        NEW.updated_at = NOW();
        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql;

      CREATE TRIGGER trg_users_updated_at
        BEFORE UPDATE ON users
        FOR EACH ROW EXECUTE FUNCTION set_updated_at();

      CREATE TRIGGER trg_properties_updated_at
        BEFORE UPDATE ON properties
        FOR EACH ROW EXECUTE FUNCTION set_updated_at();

      CREATE TRIGGER trg_projects_updated_at
        BEFORE UPDATE ON projects
        FOR EACH ROW EXECUTE FUNCTION set_updated_at();

      CREATE TRIGGER trg_project_plots_updated_at
        BEFORE UPDATE ON project_plots
        FOR EACH ROW EXECUTE FUNCTION set_updated_at();

      CREATE TRIGGER trg_blogs_updated_at
        BEFORE UPDATE ON blogs
        FOR EACH ROW EXECUTE FUNCTION set_updated_at();

      CREATE TRIGGER trg_groups_updated_at
        BEFORE UPDATE ON groups
        FOR EACH ROW EXECUTE FUNCTION set_updated_at();
    `,
  },
  {
    name: '014_project_map_system',
    sql: `
      -- Step 1: Convert status column to TEXT to safely drop old enum
      ALTER TABLE project_plots ALTER COLUMN status TYPE TEXT;

      -- Step 2: Migrate RESERVED → HOLD
      UPDATE project_plots SET status = 'HOLD' WHERE status = 'RESERVED';

      -- Step 3: Drop old plot_status enum
      DROP TYPE IF EXISTS plot_status CASCADE;

      -- Step 4: Create new plot_status enum
      CREATE TYPE plot_status AS ENUM ('AVAILABLE', 'HOLD', 'BOOKED', 'SOLD', 'BLOCKED');

      -- Step 5: Cast status column back to new enum
      ALTER TABLE project_plots ALTER COLUMN status TYPE plot_status USING status::plot_status;

      -- Map object types
      CREATE TYPE map_object_type AS ENUM (
        'PROJECT_BOUNDARY', 'LAND_PARCEL', 'ROAD', 'GARDEN', 'PARK',
        'WATER', 'COMMERCIAL_AREA', 'AMENITY', 'PARKING', 'OTHER', 'LABEL'
      );

      -- Map version status
      CREATE TYPE map_version_status AS ENUM ('DRAFT', 'PUBLISHED');

      -- Phase status
      CREATE TYPE phase_status AS ENUM ('PLANNED', 'ACTIVE', 'COMPLETED');

      -- ─── Project Phases ──────────────────────────────────────────────────────
      CREATE TABLE project_phases (
        id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        project_id  UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
        name        VARCHAR(200) NOT NULL,
        description TEXT,
        order_index INTEGER NOT NULL DEFAULT 0,
        status      phase_status NOT NULL DEFAULT 'PLANNED',
        created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      CREATE INDEX idx_project_phases_project_id ON project_phases(project_id);

      -- ─── Plot Clusters ───────────────────────────────────────────────────────
      CREATE TABLE plot_clusters (
        id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        project_id  UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
        phase_id    UUID REFERENCES project_phases(id) ON DELETE SET NULL,
        name        VARCHAR(200) NOT NULL,
        description TEXT,
        color       VARCHAR(20),
        created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      CREATE INDEX idx_plot_clusters_project_id ON plot_clusters(project_id);

      -- ─── Map Objects (roads, gardens, boundaries, etc.) ─────────────────────
      CREATE TABLE map_objects (
        id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        project_id    UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
        phase_id      UUID REFERENCES project_phases(id) ON DELETE SET NULL,
        type          map_object_type NOT NULL,
        name          VARCHAR(200),
        geometry      JSONB NOT NULL,
        display_style JSONB,
        metadata      JSONB,
        created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      CREATE INDEX idx_map_objects_project_id ON map_objects(project_id);
      CREATE INDEX idx_map_objects_phase_id ON map_objects(phase_id);
      CREATE INDEX idx_map_objects_type ON map_objects(type);

      -- ─── Upgrade project_plots ───────────────────────────────────────────────
      ALTER TABLE project_plots
        ADD COLUMN IF NOT EXISTS phase_id      UUID REFERENCES project_phases(id) ON DELETE SET NULL,
        ADD COLUMN IF NOT EXISTS cluster_id    UUID REFERENCES plot_clusters(id) ON DELETE SET NULL,
        ADD COLUMN IF NOT EXISTS width         NUMERIC(10,2),
        ADD COLUMN IF NOT EXISTS length        NUMERIC(10,2),
        ADD COLUMN IF NOT EXISTS price_type    VARCHAR(50) DEFAULT 'FIXED',
        ADD COLUMN IF NOT EXISTS display_color VARCHAR(20),
        ADD COLUMN IF NOT EXISTS description   TEXT;

      CREATE INDEX IF NOT EXISTS idx_project_plots_phase_id ON project_plots(phase_id);
      CREATE INDEX IF NOT EXISTS idx_project_plots_cluster_id ON project_plots(cluster_id);

      -- ─── Map Versions ────────────────────────────────────────────────────────
      CREATE TABLE project_map_versions (
        id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        project_id     UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
        version_number INTEGER NOT NULL DEFAULT 1,
        status         map_version_status NOT NULL DEFAULT 'DRAFT',
        snapshot       JSONB,
        published_by   UUID REFERENCES users(id),
        published_at   TIMESTAMPTZ,
        created_by     UUID REFERENCES users(id),
        created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        UNIQUE (project_id, version_number)
      );

      CREATE INDEX idx_project_map_versions_project_id ON project_map_versions(project_id);

      -- Triggers for updated_at
      CREATE TRIGGER trg_project_phases_updated_at
        BEFORE UPDATE ON project_phases
        FOR EACH ROW EXECUTE FUNCTION set_updated_at();

      CREATE TRIGGER trg_plot_clusters_updated_at
        BEFORE UPDATE ON plot_clusters
        FOR EACH ROW EXECUTE FUNCTION set_updated_at();

      CREATE TRIGGER trg_map_objects_updated_at
        BEFORE UPDATE ON map_objects
        FOR EACH ROW EXECUTE FUNCTION set_updated_at();
    `,
  },
  {
    name: '015_add_google_maps_link_to_projects',
    sql: `
      ALTER TABLE projects ADD COLUMN IF NOT EXISTS google_maps_link TEXT;
    `,
  },
  {
    name: '016_blog_seo_enhancements',
    sql: `
      ALTER TABLE blogs 
        ADD COLUMN IF NOT EXISTS schema_type VARCHAR(100) DEFAULT 'BlogPosting',
        ADD COLUMN IF NOT EXISTS no_index BOOLEAN DEFAULT FALSE,
        ADD COLUMN IF NOT EXISTS no_follow BOOLEAN DEFAULT FALSE;
    `,
  },
  {
    name: '017_update_user_status_enum',
    sql: `
      ALTER TYPE user_status ADD VALUE IF NOT EXISTS 'PENDING';
      ALTER TYPE user_status ADD VALUE IF NOT EXISTS 'BLOCKED';
    `,
  },
  {
    name: '018_extended_property_system',
    sql: `
      DO $$ BEGIN
        CREATE TYPE listing_purpose_enum AS ENUM ('SALE', 'RENT', 'LEASE', 'PG', 'COMMERCIAL_LEASE');
      EXCEPTION WHEN duplicate_object THEN null; END $$;

      DO $$ BEGIN
        CREATE TYPE property_category_enum AS ENUM ('RESIDENTIAL', 'COMMERCIAL', 'LAND', 'SPECIAL');
      EXCEPTION WHEN duplicate_object THEN null; END $$;

      DO $$ BEGIN
        CREATE TYPE property_type_enum AS ENUM (
          'HOUSE', 'APARTMENT', 'VILLA', 'FARMHOUSE', 'ROOM', 'PG', 'HOSTEL', 'BUILDER_FLOOR', 'STUDIO',
          'SHOP', 'OFFICE', 'SHOWROOM', 'WAREHOUSE', 'GODOWN', 'COMMERCIAL_BUILDING', 'CO_WORKING', 'COMMERCIAL_SPACE', 'INDUSTRIAL_PROPERTY',
          'RESIDENTIAL_PLOT', 'COMMERCIAL_PLOT', 'AGRICULTURAL_LAND', 'FARM_LAND', 'INDUSTRIAL_LAND', 'LAND_PARCEL',
          'HALL', 'MARRIAGE_HALL', 'BANQUET_HALL', 'COMMUNITY_HALL', 'GUEST_HOUSE', 'HOTEL', 'SCHOOL', 'HOSPITAL', 'OTHER'
        );
      EXCEPTION WHEN duplicate_object THEN null; END $$;

      DO $$ BEGIN
        CREATE TYPE price_type_enum AS ENUM (
          'TOTAL_PRICE', 'RENT', 'LEASE_RENT', 'PG_RENT', 'COMMERCIAL_LEASE_RENT', 'PER_HOUR', 'PER_DAY', 'PER_EVENT', 'MONTHLY'
        );
      EXCEPTION WHEN duplicate_object THEN null; END $$;

      ALTER TABLE properties
        ADD COLUMN IF NOT EXISTS listing_purpose listing_purpose_enum DEFAULT 'SALE',
        ADD COLUMN IF NOT EXISTS category_type property_category_enum DEFAULT 'RESIDENTIAL',
        ADD COLUMN IF NOT EXISTS property_type property_type_enum DEFAULT 'HOUSE',
        ADD COLUMN IF NOT EXISTS price_amount NUMERIC(15,2),
        ADD COLUMN IF NOT EXISTS price_type price_type_enum DEFAULT 'TOTAL_PRICE',
        ADD COLUMN IF NOT EXISTS billing_period VARCHAR(50),
        ADD COLUMN IF NOT EXISTS is_price_negotiable BOOLEAN DEFAULT FALSE,
        ADD COLUMN IF NOT EXISTS price_per_sqft NUMERIC(12,2),
        ADD COLUMN IF NOT EXISTS videos TEXT[] DEFAULT '{}';

      CREATE TABLE IF NOT EXISTS property_locations (
        property_id UUID PRIMARY KEY REFERENCES properties(id) ON DELETE CASCADE,
        address     TEXT,
        locality    VARCHAR(200),
        city        VARCHAR(100) NOT NULL,
        district    VARCHAR(100),
        state       VARCHAR(100) NOT NULL,
        country     VARCHAR(100) DEFAULT 'India',
        pincode     VARCHAR(10),
        latitude    DOUBLE PRECISION,
        longitude   DOUBLE PRECISION
      );

      CREATE TABLE IF NOT EXISTS property_residential_details (
        property_id        UUID PRIMARY KEY REFERENCES properties(id) ON DELETE CASCADE,
        bedrooms           INTEGER,
        bathrooms          INTEGER,
        balconies          INTEGER,
        built_up_area      NUMERIC(12,2),
        carpet_area        NUMERIC(12,2),
        plot_area          NUMERIC(12,2),
        property_age       INTEGER,
        floor              INTEGER,
        total_floors       INTEGER,
        furnished_status   VARCHAR(50),
        parking            INTEGER,
        facing             VARCHAR(50),
        water_supply       VARCHAR(100),
        possession_status  VARCHAR(100),
        road_width         NUMERIC(10,2),
        tenant_preference  VARCHAR(50)
      );

      CREATE TABLE IF NOT EXISTS property_commercial_details (
        property_id       UUID PRIMARY KEY REFERENCES properties(id) ON DELETE CASCADE,
        carpet_area       NUMERIC(12,2),
        built_up_area     NUMERIC(12,2),
        frontage          NUMERIC(10,2),
        depth             NUMERIC(10,2),
        floor             INTEGER,
        total_floors      INTEGER,
        washrooms         INTEGER,
        parking           INTEGER,
        lift              BOOLEAN DEFAULT FALSE,
        power_backup      BOOLEAN DEFAULT FALSE,
        air_conditioning  BOOLEAN DEFAULT FALSE,
        main_road_facing  BOOLEAN DEFAULT FALSE,
        corner_property   BOOLEAN DEFAULT FALSE,
        road_width        NUMERIC(10,2)
      );

      CREATE TABLE IF NOT EXISTS property_land_details (
        property_id            UUID PRIMARY KEY REFERENCES properties(id) ON DELETE CASCADE,
        total_land_area        NUMERIC(14,2) NOT NULL,
        area_unit              VARCHAR(20) NOT NULL,
        land_type              VARCHAR(100),
        irrigation_available   BOOLEAN DEFAULT FALSE,
        water_source           VARCHAR(100),
        borewell               BOOLEAN DEFAULT FALSE,
        tube_well              BOOLEAN DEFAULT FALSE,
        canal                  BOOLEAN DEFAULT FALSE,
        river_access           BOOLEAN DEFAULT FALSE,
        electricity_connection BOOLEAN DEFAULT FALSE,
        road_access            BOOLEAN DEFAULT FALSE,
        soil_type              VARCHAR(100),
        current_crop           VARCHAR(100),
        fencing                BOOLEAN DEFAULT FALSE,
        farm_house             BOOLEAN DEFAULT FALSE,
        nearest_road_distance  VARCHAR(100),
        nearest_village        VARCHAR(100),
        nearest_city           VARCHAR(100),
        plot_length            NUMERIC(10,2),
        plot_width             NUMERIC(10,2)
      );

      CREATE TABLE IF NOT EXISTS property_pg_details (
        property_id           UUID PRIMARY KEY REFERENCES properties(id) ON DELETE CASCADE,
        pg_name               VARCHAR(200),
        room_type             VARCHAR(50) NOT NULL,
        occupancy             VARCHAR(50),
        gender_preference     VARCHAR(20) NOT NULL DEFAULT 'ANY',
        available_from        TIMESTAMPTZ,
        monthly_rent          NUMERIC(12,2) NOT NULL,
        security_deposit      NUMERIC(12,2),
        food_charges          NUMERIC(12,2),
        electricity_charges   NUMERIC(12,2),
        maintenance_charges   NUMERIC(12,2),
        food_available        BOOLEAN DEFAULT FALSE,
        meal_plan             VARCHAR(50),
        smoking_allowed       BOOLEAN DEFAULT FALSE,
        alcohol_allowed       BOOLEAN DEFAULT FALSE,
        visitors_allowed      BOOLEAN DEFAULT FALSE,
        pets_allowed          BOOLEAN DEFAULT FALSE,
        curfew_time           VARCHAR(50),
        minimum_stay_months   INTEGER,
        notice_period_days    INTEGER
      );

      CREATE TABLE IF NOT EXISTS property_lease_details (
        property_id                UUID PRIMARY KEY REFERENCES properties(id) ON DELETE CASCADE,
        lease_amount               NUMERIC(15,2) NOT NULL,
        lease_payment_type         VARCHAR(50) NOT NULL,
        security_deposit           NUMERIC(15,2),
        lease_duration_years       INTEGER,
        lock_in_period_months      INTEGER,
        notice_period_days         INTEGER,
        available_from             TIMESTAMPTZ,
        maintenance_responsibility VARCHAR(100),
        electricity_responsibility VARCHAR(100),
        water_responsibility       VARCHAR(100),
        renewal_option             BOOLEAN DEFAULT TRUE,
        terms_conditions           TEXT
      );

      CREATE TABLE IF NOT EXISTS property_commercial_lease_details (
        property_id                UUID PRIMARY KEY REFERENCES properties(id) ON DELETE CASCADE,
        monthly_lease_rent         NUMERIC(15,2) NOT NULL,
        security_deposit           NUMERIC(15,2),
        lease_duration_years       INTEGER,
        lock_in_period_months      INTEGER,
        notice_period_days         INTEGER,
        maintenance_cost           NUMERIC(12,2),
        cam_cost                   NUMERIC(12,2),
        electricity_cost           NUMERIC(12,2),
        water_cost                 NUMERIC(12,2),
        parking_spaces             INTEGER,
        available_from             TIMESTAMPTZ,
        renewal_terms              TEXT,
        rent_escalation_percentage NUMERIC(5,2),
        escalation_period_months   INTEGER,
        allowed_business_types     TEXT[] DEFAULT '{}',
        fire_safety_certified      BOOLEAN DEFAULT FALSE,
        power_load_kw              NUMERIC(10,2),
        loading_unloading_facility BOOLEAN DEFAULT FALSE
      );

      CREATE TABLE IF NOT EXISTS property_hall_details (
        property_id                 UUID PRIMARY KEY REFERENCES properties(id) ON DELETE CASCADE,
        hall_type                   VARCHAR(100),
        capacity_people             INTEGER,
        seating_capacity            INTEGER,
        hall_area_sqft              NUMERIC(12,2),
        parking_capacity_vehicles   INTEGER,
        ac_available                BOOLEAN DEFAULT FALSE,
        kitchen_available           BOOLEAN DEFAULT FALSE,
        stage_available             BOOLEAN DEFAULT FALSE,
        dining_area_available       BOOLEAN DEFAULT FALSE,
        washrooms_count             INTEGER,
        sound_system_available      BOOLEAN DEFAULT FALSE,
        generator_backup_available  BOOLEAN DEFAULT FALSE,
        catering_available          BOOLEAN DEFAULT FALSE,
        pricing_type                VARCHAR(50) NOT NULL,
        price_rate                  NUMERIC(12,2) NOT NULL,
        security_deposit            NUMERIC(12,2)
      );

      ALTER TABLE properties ALTER COLUMN category_id DROP NOT NULL;
    `,
  },
  {
    name: '016_add_google_maps_link_to_properties',
    sql: `
      ALTER TABLE property_locations ADD COLUMN IF NOT EXISTS google_maps_link TEXT;
    `,
  },
  {
    name: '017_add_username_bio',
    sql: `
      ALTER TABLE users ADD COLUMN IF NOT EXISTS username VARCHAR(50) UNIQUE;
      ALTER TABLE users ADD COLUMN IF NOT EXISTS bio TEXT;
      CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
    `,
  },
  {
    name: '018_add_user_otps',
    sql: `
      CREATE TABLE IF NOT EXISTS user_otps (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        email VARCHAR(255) NOT NULL,
        otp VARCHAR(6) NOT NULL,
        expires_at TIMESTAMPTZ NOT NULL,
        used_at TIMESTAMPTZ,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
      CREATE INDEX IF NOT EXISTS idx_user_otps_email ON user_otps(email);
    `,
  },
  {
    name: '019_blog_cms_upgrade',
    sql: `
      -- ─── Upgrade blog_categories with SEO fields ───────────────────────────────
      ALTER TABLE blog_categories
        ADD COLUMN IF NOT EXISTS description TEXT,
        ADD COLUMN IF NOT EXISTS seo_title VARCHAR(70),
        ADD COLUMN IF NOT EXISTS seo_description VARCHAR(160),
        ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();

      -- ─── Proper relational tags (replaces TEXT[] array) ────────────────────────
      CREATE TABLE IF NOT EXISTS blog_tags (
        id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        name       VARCHAR(100) NOT NULL,
        slug       VARCHAR(100) UNIQUE NOT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      CREATE INDEX IF NOT EXISTS idx_blog_tags_slug ON blog_tags(slug);

      CREATE TABLE IF NOT EXISTS blog_tag_mapping (
        blog_id UUID NOT NULL REFERENCES blogs(id) ON DELETE CASCADE,
        tag_id  UUID NOT NULL REFERENCES blog_tags(id) ON DELETE CASCADE,
        PRIMARY KEY (blog_id, tag_id)
      );

      CREATE INDEX IF NOT EXISTS idx_blog_tag_mapping_blog_id ON blog_tag_mapping(blog_id);
      CREATE INDEX IF NOT EXISTS idx_blog_tag_mapping_tag_id ON blog_tag_mapping(tag_id);

      -- ─── FAQ table ─────────────────────────────────────────────────────────────
      CREATE TABLE IF NOT EXISTS blog_faq (
        id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        blog_id    UUID NOT NULL REFERENCES blogs(id) ON DELETE CASCADE,
        question   TEXT NOT NULL,
        answer     TEXT NOT NULL,
        sort_order INTEGER NOT NULL DEFAULT 0,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      CREATE INDEX IF NOT EXISTS idx_blog_faq_blog_id ON blog_faq(blog_id, sort_order);

      -- ─── Language enum ─────────────────────────────────────────────────────────
      DO $$ BEGIN
        CREATE TYPE blog_language AS ENUM ('en', 'hi', 'hinglish');
      EXCEPTION WHEN duplicate_object THEN null; END $$;

      -- ─── Upgrade blogs table with new columns ──────────────────────────────────
      ALTER TABLE blogs
        ADD COLUMN IF NOT EXISTS content_json            JSONB,
        ADD COLUMN IF NOT EXISTS content_html            TEXT,
        ADD COLUMN IF NOT EXISTS language                blog_language NOT NULL DEFAULT 'en',
        ADD COLUMN IF NOT EXISTS translation_group_id    UUID,
        ADD COLUMN IF NOT EXISTS slug_custom             BOOLEAN NOT NULL DEFAULT FALSE,
        ADD COLUMN IF NOT EXISTS seo_title               VARCHAR(70),
        ADD COLUMN IF NOT EXISTS seo_description         VARCHAR(160),
        ADD COLUMN IF NOT EXISTS focus_keyword           VARCHAR(100),
        ADD COLUMN IF NOT EXISTS secondary_keywords      TEXT[] DEFAULT '{}',
        ADD COLUMN IF NOT EXISTS featured_image_alt      TEXT,
        ADD COLUMN IF NOT EXISTS featured_image_caption  TEXT,
        ADD COLUMN IF NOT EXISTS og_image_alt            TEXT,
        ADD COLUMN IF NOT EXISTS twitter_card            VARCHAR(50) DEFAULT 'summary_large_image',
        ADD COLUMN IF NOT EXISTS twitter_title           VARCHAR(70),
        ADD COLUMN IF NOT EXISTS twitter_description     VARCHAR(200),
        ADD COLUMN IF NOT EXISTS twitter_image_url       TEXT,
        ADD COLUMN IF NOT EXISTS allow_index             BOOLEAN NOT NULL DEFAULT TRUE,
        ADD COLUMN IF NOT EXISTS allow_follow            BOOLEAN NOT NULL DEFAULT TRUE,
        ADD COLUMN IF NOT EXISTS generate_toc            BOOLEAN NOT NULL DEFAULT FALSE,
        ADD COLUMN IF NOT EXISTS reading_time            INTEGER;

      -- ─── Backfill allow_index/allow_follow from no_index/no_follow ────────────
      UPDATE blogs SET
        allow_index = NOT COALESCE(no_index, FALSE),
        allow_follow = NOT COALESCE(no_follow, FALSE)
      WHERE no_index IS NOT NULL OR no_follow IS NOT NULL;

      -- ─── Indexes ───────────────────────────────────────────────────────────────
      CREATE INDEX IF NOT EXISTS idx_blogs_translation_group ON blogs(translation_group_id);
      CREATE INDEX IF NOT EXISTS idx_blogs_language ON blogs(language);

      -- ─── Trigger for blog_faq updated_at ─────────────────────────────────────
      CREATE TRIGGER trg_blog_faq_updated_at
        BEFORE UPDATE ON blog_faq
        FOR EACH ROW EXECUTE FUNCTION set_updated_at();

      -- ─── Trigger for blog_categories updated_at ───────────────────────────────
      CREATE TRIGGER trg_blog_categories_updated_at
        BEFORE UPDATE ON blog_categories
        FOR EACH ROW EXECUTE FUNCTION set_updated_at();
    `,
  },
  {
    name: '020_add_plot_length_width',
    sql: `
      ALTER TABLE property_land_details ADD COLUMN IF NOT EXISTS plot_length NUMERIC(10,2);
      ALTER TABLE property_land_details ADD COLUMN IF NOT EXISTS plot_width NUMERIC(10,2);
    `,
  },
  {
    name: '021_project_seo_and_image',
    sql: `
      ALTER TABLE projects
        ADD COLUMN IF NOT EXISTS featured_image_url TEXT,
        ADD COLUMN IF NOT EXISTS featured_image_key TEXT,
        ADD COLUMN IF NOT EXISTS seo_title VARCHAR(70),
        ADD COLUMN IF NOT EXISTS seo_description VARCHAR(160),
        ADD COLUMN IF NOT EXISTS schema_data JSONB,
        ADD COLUMN IF NOT EXISTS og_title VARCHAR(70),
        ADD COLUMN IF NOT EXISTS og_description VARCHAR(200),
        ADD COLUMN IF NOT EXISTS og_image_url TEXT;
    `,
  },
  {
    name: '022_remove_redundant_project_seo_fields',
    sql: `
      ALTER TABLE projects
        DROP COLUMN IF EXISTS seo_title,
        DROP COLUMN IF EXISTS seo_description,
        DROP COLUMN IF EXISTS og_title,
        DROP COLUMN IF EXISTS og_description,
        DROP COLUMN IF EXISTS og_image_url;
    `,
  },
  {
    name: '023_add_last_login_to_users',
    sql: `
      ALTER TABLE users
        ADD COLUMN IF NOT EXISTS last_login_at TIMESTAMPTZ;
    `,
  },
  {
    name: '024_add_video_url_to_properties',
    sql: `ALTER TABLE properties ADD COLUMN IF NOT EXISTS video_url VARCHAR(500);`
  },
  {
    name: '025_advanced_chat_moderation',
    sql: `
      CREATE TABLE IF NOT EXISTS system_settings (
        key VARCHAR(100) PRIMARY KEY,
        value JSONB NOT NULL,
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      INSERT INTO system_settings (key, value)
      VALUES ('auto_approve_p2p_chat', '{"enabled": false}'::jsonb)
      ON CONFLICT (key) DO NOTHING;

      ALTER TABLE conversations
        ADD COLUMN IF NOT EXISTS type VARCHAR(20) NOT NULL DEFAULT 'SUPPORT',
        ADD COLUMN IF NOT EXISTS initiator_id UUID REFERENCES users(id) ON DELETE SET NULL,
        ADD COLUMN IF NOT EXISTS recipient_id UUID REFERENCES users(id) ON DELETE SET NULL,
        ADD COLUMN IF NOT EXISTS is_approved_for_recipient BOOLEAN NOT NULL DEFAULT FALSE,
        ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();

      CREATE INDEX IF NOT EXISTS idx_conversations_type ON conversations(type);
      CREATE INDEX IF NOT EXISTS idx_conversations_initiator ON conversations(initiator_id);
      CREATE INDEX IF NOT EXISTS idx_conversations_recipient ON conversations(recipient_id);

      ALTER TABLE messages
        ADD COLUMN IF NOT EXISTS actual_sender_id UUID REFERENCES users(id) ON DELETE SET NULL,
        ADD COLUMN IF NOT EXISTS is_admin_override BOOLEAN NOT NULL DEFAULT FALSE;
    `
  },
  {
    name: '026_populate_null_chat_initiators',
    sql: `
      UPDATE conversations c
      SET initiator_id = (
        SELECT user_id 
        FROM conversation_members 
        WHERE conversation_id = c.id 
        LIMIT 1
      )
      WHERE c.type = 'SUPPORT' AND c.initiator_id IS NULL;
    `
  },
  {
    name: '027_sync_all_conversation_members',
    sql: `
      -- Ensure all SUPPORT conversations have their initiator in conversation_members
      INSERT INTO conversation_members (conversation_id, user_id)
      SELECT c.id, c.initiator_id
      FROM conversations c
      WHERE c.initiator_id IS NOT NULL
      ON CONFLICT DO NOTHING;

      -- Ensure all DIRECT conversations have both initiator and recipient in conversation_members
      INSERT INTO conversation_members (conversation_id, user_id)
      SELECT c.id, c.initiator_id
      FROM conversations c
      WHERE c.type = 'DIRECT' AND c.initiator_id IS NOT NULL
      ON CONFLICT DO NOTHING;

      INSERT INTO conversation_members (conversation_id, user_id)
      SELECT c.id, c.recipient_id
      FROM conversations c
      WHERE c.type = 'DIRECT' AND c.recipient_id IS NOT NULL
      ON CONFLICT DO NOTHING;
    `
  },
  {
    name: '028_add_is_read_to_messages',
    sql: `
      ALTER TABLE messages
        ADD COLUMN IF NOT EXISTS is_read BOOLEAN DEFAULT false;
    `
  },
  {
    name: '029_fix_amenities_dedup_and_property_columns',
    sql: `
      -- 1. Deduplicate property_amenities and re-map references
      DO $$
      BEGIN
        IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'property_amenity_mapping') THEN
          WITH ranked_amenities AS (
            SELECT id, name, ROW_NUMBER() OVER (PARTITION BY name ORDER BY created_at ASC, id ASC) as rn
            FROM property_amenities
          ),
          duplicates AS (
            SELECT id, name FROM ranked_amenities WHERE rn > 1
          ),
          primaries AS (
            SELECT id, name FROM ranked_amenities WHERE rn = 1
          )
          UPDATE property_amenity_mapping pam
          SET amenity_id = p.id
          FROM duplicates d
          JOIN primaries p ON p.name = d.name
          WHERE pam.amenity_id = d.id;
        END IF;
      END $$;

      -- Remove duplicate amenities
      WITH ranked_amenities AS (
        SELECT id, ROW_NUMBER() OVER (PARTITION BY name ORDER BY created_at ASC, id ASC) as rn
        FROM property_amenities
      )
      DELETE FROM property_amenities
      WHERE id IN (SELECT id FROM ranked_amenities WHERE rn > 1);

      -- Add unique constraint on name if not exists
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_constraint WHERE conname = 'property_amenities_name_key'
        ) THEN
          ALTER TABLE property_amenities ADD CONSTRAINT property_amenities_name_key UNIQUE (name);
        END IF;
      END $$;

      -- 2. Add missing property columns safely
      ALTER TABLE property_residential_details ADD COLUMN IF NOT EXISTS tenant_preference VARCHAR(50);
      ALTER TABLE property_locations ADD COLUMN IF NOT EXISTS google_maps_link TEXT;
      ALTER TABLE properties ADD COLUMN IF NOT EXISTS video_url TEXT;
      ALTER TABLE properties ADD COLUMN IF NOT EXISTS custom_amenities TEXT[] DEFAULT '{}';
    `
  },
  {
    name: '030_posters_and_communication',
    sql: `
      CREATE TABLE IF NOT EXISTS posters (
        id                 UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        title              VARCHAR(150),
        image_url          TEXT NOT NULL,
        storage_key        VARCHAR(500) NOT NULL,
        mobile_image_url   TEXT,
        mobile_storage_key VARCHAR(500),
        redirect_url       TEXT,
        sort_order         INTEGER NOT NULL DEFAULT 0,
        is_active          BOOLEAN NOT NULL DEFAULT TRUE,
        created_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at         TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      CREATE INDEX IF NOT EXISTS idx_posters_sort_order ON posters(sort_order);
      CREATE INDEX IF NOT EXISTS idx_posters_is_active ON posters(is_active);

      CREATE TABLE IF NOT EXISTS company_communications (
        id                   VARCHAR(50) PRIMARY KEY DEFAULT 'default',
        whatsapp_number      VARCHAR(20) DEFAULT '+919999999999',
        whatsapp_message     TEXT DEFAULT 'Namaste, I would like to inquire about properties on Rewa Bhoomi.',
        instagram_url        VARCHAR(500) DEFAULT '',
        twitter_url          VARCHAR(500) DEFAULT '',
        youtube_url          VARCHAR(500) DEFAULT '',
        facebook_url         VARCHAR(500) DEFAULT '',
        linkedin_url         VARCHAR(500) DEFAULT '',
        contact_phone        VARCHAR(20) DEFAULT '+919999999999',
        contact_email        VARCHAR(255) DEFAULT 'contact@rewabhoomi.com',
        office_address       TEXT DEFAULT 'Rewa, Madhya Pradesh, India',
        updated_at           TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      INSERT INTO company_communications (id)
      VALUES ('default')
      ON CONFLICT (id) DO NOTHING;
    `
  },
  {
    name: '031_poster_mobile_and_desktop',
    sql: `
      ALTER TABLE posters ADD COLUMN IF NOT EXISTS mobile_image_url TEXT;
      ALTER TABLE posters ALTER COLUMN mobile_storage_key DROP NOT NULL;
    `
  },
  {
    name: '032_poster_video_url',
    sql: `
      ALTER TABLE posters ADD COLUMN IF NOT EXISTS video_url TEXT;
      ALTER TABLE posters ALTER COLUMN image_url DROP NOT NULL;
      ALTER TABLE posters ALTER COLUMN storage_key DROP NOT NULL;
    `
  }
];



// ─── Migration runner ────────────────────────────────────────────────────────────

export async function runMigrations(closePool: boolean = true) {
  await connectDatabase();
  
  const client = await pool.connect();
  try {
    // Create migrations tracking table
    await client.query(`
      CREATE TABLE IF NOT EXISTS schema_migrations (
        id         SERIAL PRIMARY KEY,
        name       VARCHAR(255) UNIQUE NOT NULL,
        applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);

    for (const migration of MIGRATIONS) {
      const existing = await client.query(
        'SELECT id FROM schema_migrations WHERE name = $1',
        [migration.name],
      );

      if (existing.rows.length > 0) {
        logger.info(`⏭  Skipping migration: ${migration.name}`);
        continue;
      }

      logger.info(`▶  Running migration: ${migration.name}`);
      await client.query('BEGIN');
      try {
        await client.query(migration.sql);
        await client.query(
          'INSERT INTO schema_migrations (name) VALUES ($1)',
          [migration.name],
        );
        await client.query('COMMIT');
        logger.info(`✅ Migration applied: ${migration.name}`);
      } catch (err) {
        await client.query('ROLLBACK');
        logger.error({ err, migration: migration.name }, '❌ Migration failed');
        process.exit(1);
      }
    }

    logger.info('🎉 All migrations applied successfully');
  } finally {
    client.release();
    if (closePool) {
      await pool.end();
    }
  }
}

// Run immediately if this file is executed directly as a script
const isDirectRun = require.main === module || 
  (process.argv[1] && (process.argv[1].endsWith('migrate.ts') || process.argv[1].endsWith('migrate.js')));

if (isDirectRun) {
  runMigrations().catch((err) => {
    logger.error({ err }, 'Migration runner failed');
    process.exit(1);
  });
}
