-- ==============================================================================
-- Personalized Travel Itinerary Planner - Supabase Schema & Row Level Security
-- ==============================================================================

-- Enable UUID & pgcrypto extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ------------------------------------------------------------------------------
-- 1. PROFILES TABLE (Mirrors auth.users)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT UNIQUE NOT NULL,
    full_name TEXT,
    avatar_url TEXT,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()) NOT NULL
);

-- ------------------------------------------------------------------------------
-- 2. USER PREFERENCES TABLE
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.preferences (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID UNIQUE NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    interests TEXT[] DEFAULT ARRAY['sightseeing', 'food', 'culture']::TEXT[] NOT NULL,
    travel_style TEXT DEFAULT 'balanced' CHECK (travel_style IN ('relaxed', 'balanced', 'packed', 'adventure', 'luxury', 'backpacking')),
    pace TEXT DEFAULT 'moderate' CHECK (pace IN ('relaxed', 'moderate', 'fast')),
    budget_level TEXT DEFAULT 'mid' CHECK (budget_level IN ('budget', 'mid', 'premium', 'luxury')),
    accommodation_type TEXT DEFAULT 'hotel' CHECK (accommodation_type IN ('hostel', 'hotel', 'resort', 'homestay', 'heritage')),
    dietary_prefs TEXT[] DEFAULT ARRAY['any']::TEXT[] NOT NULL,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()) NOT NULL
);

-- ------------------------------------------------------------------------------
-- 3. TRIPS TABLE
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.trips (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    destination TEXT NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    budget NUMERIC(12, 2) NOT NULL CHECK (budget >= 0),
    currency TEXT DEFAULT 'INR' NOT NULL,
    group_size INT DEFAULT 1 NOT NULL CHECK (group_size >= 1),
    status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'planned', 'active', 'completed', 'archived')),
    interests TEXT[] DEFAULT ARRAY[]::TEXT[],
    travel_style TEXT DEFAULT 'balanced',
    pace TEXT DEFAULT 'moderate',
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()) NOT NULL
);

-- ------------------------------------------------------------------------------
-- 4. TRIP MEMBERS (Collaborative / Group Trips)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.trip_members (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    trip_id UUID NOT NULL REFERENCES public.trips(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    role TEXT DEFAULT 'viewer' CHECK (role IN ('owner', 'editor', 'viewer')),
    invited_email TEXT,
    joined_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
    UNIQUE(trip_id, user_id)
);

-- ------------------------------------------------------------------------------
-- 5. ITINERARY DAYS TABLE
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.itinerary_days (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    trip_id UUID NOT NULL REFERENCES public.trips(id) ON DELETE CASCADE,
    day_number INT NOT NULL CHECK (day_number >= 1),
    date DATE NOT NULL,
    summary TEXT,
    estimated_cost NUMERIC(10, 2) DEFAULT 0.00 CHECK (estimated_cost >= 0),
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
    UNIQUE(trip_id, day_number)
);

-- ------------------------------------------------------------------------------
-- 6. ITINERARY ITEMS TABLE (Activities, Dining, Stays, Transport)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.itinerary_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    day_id UUID NOT NULL REFERENCES public.itinerary_days(id) ON DELETE CASCADE,
    time_slot TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('attraction', 'dining', 'stay', 'transport')),
    title TEXT NOT NULL,
    description TEXT,
    location TEXT,
    lat DOUBLE PRECISION,
    lng DOUBLE PRECISION,
    cost NUMERIC(10, 2) DEFAULT 0.00 CHECK (cost >= 0),
    duration_min INT DEFAULT 60 CHECK (duration_min >= 0),
    order_index INT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()) NOT NULL
);

-- ------------------------------------------------------------------------------
-- 7. PERFORMANCE INDEXES
-- ------------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_preferences_user_id ON public.preferences(user_id);
CREATE INDEX IF NOT EXISTS idx_trips_user_id ON public.trips(user_id);
CREATE INDEX IF NOT EXISTS idx_trips_destination ON public.trips(destination);
CREATE INDEX IF NOT EXISTS idx_trip_members_trip_id ON public.trip_members(trip_id);
CREATE INDEX IF NOT EXISTS idx_trip_members_user_id ON public.trip_members(user_id);
CREATE INDEX IF NOT EXISTS idx_itinerary_days_trip_id ON public.itinerary_days(trip_id);
CREATE INDEX IF NOT EXISTS idx_itinerary_items_day_id ON public.itinerary_items(day_id);
CREATE INDEX IF NOT EXISTS idx_itinerary_items_order ON public.itinerary_items(day_id, order_index);

-- ------------------------------------------------------------------------------
-- 8. AUTO-UPDATE UPDATED_AT TRIGGER
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = TIMEZONE('utc', NOW());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER set_profiles_updated_at
BEFORE UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE OR REPLACE TRIGGER set_preferences_updated_at
BEFORE UPDATE ON public.preferences
FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE OR REPLACE TRIGGER set_trips_updated_at
BEFORE UPDATE ON public.trips
FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE OR REPLACE TRIGGER set_itinerary_days_updated_at
BEFORE UPDATE ON public.itinerary_days
FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE OR REPLACE TRIGGER set_itinerary_items_updated_at
BEFORE UPDATE ON public.itinerary_items
FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- ------------------------------------------------------------------------------
-- 9. USER SIGNUP PROFILE SYNC TRIGGER
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, email, full_name, avatar_url)
    VALUES (
        NEW.id,
        NEW.email,
        NEW.raw_user_meta_data->>'full_name',
        NEW.raw_user_meta_data->>'avatar_url'
    )
    ON CONFLICT (id) DO NOTHING;

    INSERT INTO public.preferences (user_id)
    VALUES (NEW.id)
    ON CONFLICT (user_id) DO NOTHING;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ------------------------------------------------------------------------------
-- 10. ROW LEVEL SECURITY (RLS) POLICIES
-- ------------------------------------------------------------------------------
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trips ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trip_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.itinerary_days ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.itinerary_items ENABLE ROW LEVEL SECURITY;

-- Profiles Policies
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can view own profile' AND tablename = 'profiles') THEN
        CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can update own profile' AND tablename = 'profiles') THEN
        CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);
    END IF;
END $$;

-- Preferences Policies
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can view own preferences' AND tablename = 'preferences') THEN
        CREATE POLICY "Users can view own preferences" ON public.preferences FOR SELECT USING (auth.uid() = user_id);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can insert own preferences' AND tablename = 'preferences') THEN
        CREATE POLICY "Users can insert own preferences" ON public.preferences FOR INSERT WITH CHECK (auth.uid() = user_id);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can update own preferences' AND tablename = 'preferences') THEN
        CREATE POLICY "Users can update own preferences" ON public.preferences FOR UPDATE USING (auth.uid() = user_id);
    END IF;
END $$;

-- Trips Policies
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can view own trips and member trips' AND tablename = 'trips') THEN
        CREATE POLICY "Users can view own trips and member trips" ON public.trips FOR SELECT
        USING (
            auth.uid() = user_id
            OR EXISTS (
                SELECT 1 FROM public.trip_members
                WHERE trip_members.trip_id = trips.id
                AND trip_members.user_id = auth.uid()
            )
        );
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can insert own trips' AND tablename = 'trips') THEN
        CREATE POLICY "Users can insert own trips" ON public.trips FOR INSERT WITH CHECK (auth.uid() = user_id);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Trip owners and editors can update trips' AND tablename = 'trips') THEN
        CREATE POLICY "Trip owners and editors can update trips" ON public.trips FOR UPDATE
        USING (
            auth.uid() = user_id
            OR EXISTS (
                SELECT 1 FROM public.trip_members
                WHERE trip_members.trip_id = trips.id
                AND trip_members.user_id = auth.uid()
                AND trip_members.role IN ('owner', 'editor')
            )
        );
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Only trip owner can delete trip' AND tablename = 'trips') THEN
        CREATE POLICY "Only trip owner can delete trip" ON public.trips FOR DELETE USING (auth.uid() = user_id);
    END IF;
END $$;

-- Trip Members Policies
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Members can view membership' AND tablename = 'trip_members') THEN
        CREATE POLICY "Members can view membership" ON public.trip_members FOR SELECT
        USING (
            auth.uid() = user_id
            OR EXISTS (
                SELECT 1 FROM public.trips
                WHERE trips.id = trip_members.trip_id
                AND trips.user_id = auth.uid()
            )
        );
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Trip owners can manage members' AND tablename = 'trip_members') THEN
        CREATE POLICY "Trip owners can manage members" ON public.trip_members FOR ALL
        USING (
            EXISTS (
                SELECT 1 FROM public.trips
                WHERE trips.id = trip_members.trip_id
                AND trips.user_id = auth.uid()
            )
        );
    END IF;
END $$;

-- Itinerary Days Policies
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Access days if member of trip' AND tablename = 'itinerary_days') THEN
        CREATE POLICY "Access days if member of trip" ON public.itinerary_days FOR SELECT
        USING (
            EXISTS (
                SELECT 1 FROM public.trips
                WHERE trips.id = itinerary_days.trip_id
                AND (
                    trips.user_id = auth.uid()
                    OR EXISTS (
                        SELECT 1 FROM public.trip_members
                        WHERE trip_members.trip_id = trips.id
                        AND trip_members.user_id = auth.uid()
                    )
                )
            )
        );
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Modify days if trip owner or editor' AND tablename = 'itinerary_days') THEN
        CREATE POLICY "Modify days if trip owner or editor" ON public.itinerary_days FOR ALL
        USING (
            EXISTS (
                SELECT 1 FROM public.trips
                WHERE trips.id = itinerary_days.trip_id
                AND (
                    trips.user_id = auth.uid()
                    OR EXISTS (
                        SELECT 1 FROM public.trip_members
                        WHERE trip_members.trip_id = trips.id
                        AND trip_members.user_id = auth.uid()
                        AND trip_members.role IN ('owner', 'editor')
                    )
                )
            )
        );
    END IF;
END $$;

-- Itinerary Items Policies
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Access items if member of trip' AND tablename = 'itinerary_items') THEN
        CREATE POLICY "Access items if member of trip" ON public.itinerary_items FOR SELECT
        USING (
            EXISTS (
                SELECT 1 FROM public.itinerary_days
                JOIN public.trips ON trips.id = itinerary_days.trip_id
                WHERE itinerary_days.id = itinerary_items.day_id
                AND (
                    trips.user_id = auth.uid()
                    OR EXISTS (
                        SELECT 1 FROM public.trip_members
                        WHERE trip_members.trip_id = trips.id
                        AND trip_members.user_id = auth.uid()
                    )
                )
            )
        );
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Modify items if trip owner or editor' AND tablename = 'itinerary_items') THEN
        CREATE POLICY "Modify items if trip owner or editor" ON public.itinerary_items FOR ALL
        USING (
            EXISTS (
                SELECT 1 FROM public.itinerary_days
                JOIN public.trips ON trips.id = itinerary_days.trip_id
                WHERE itinerary_days.id = itinerary_items.day_id
                AND (
                    trips.user_id = auth.uid()
                    OR EXISTS (
                        SELECT 1 FROM public.trip_members
                        WHERE trip_members.trip_id = trips.id
                        AND trip_members.user_id = auth.uid()
                        AND trip_members.role IN ('owner', 'editor')
                    )
                )
            )
        );
    END IF;
END $$;

-- ------------------------------------------------------------------------------
-- 11. SAMPLE SEED DATA (SAFE & IDEMPOTENT)
-- ------------------------------------------------------------------------------
DO $$
DECLARE
    demo_user_id UUID := '00000000-0000-0000-0000-000000000001';
    demo_trip_id UUID := '11111111-1111-1111-1111-111111111111';
    demo_day_1_id UUID := '22222222-2222-2222-2222-222222222221';
    demo_day_2_id UUID := '22222222-2222-2222-2222-222222222222';
BEGIN
    -- 1. Create demo auth user first if permitted
    BEGIN
        INSERT INTO auth.users (
            id,
            instance_id,
            aud,
            role,
            email,
            encrypted_password,
            email_confirmed_at,
            raw_app_meta_data,
            raw_user_meta_data,
            created_at,
            updated_at
        ) VALUES (
            demo_user_id,
            '00000000-0000-0000-0000-000000000000',
            'authenticated',
            'authenticated',
            'traveler@yatra.local',
            crypt('Traveler@123', gen_salt('bf')),
            NOW(),
            '{"provider":"email","providers":["email"]}'::jsonb,
            '{"full_name":"Aarav Sharma"}'::jsonb,
            NOW(),
            NOW()
        ) ON CONFLICT (id) DO NOTHING;
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE 'Could not insert into auth.users (permission restricted): %', SQLERRM;
    END;

    -- 2. Only insert profile and sample trip if demo user is present in auth.users
    IF EXISTS (SELECT 1 FROM auth.users WHERE id = demo_user_id) THEN
        INSERT INTO public.profiles (id, email, full_name, avatar_url)
        VALUES (demo_user_id, 'traveler@yatra.local', 'Aarav Sharma', 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150')
        ON CONFLICT (id) DO NOTHING;

        INSERT INTO public.preferences (user_id, interests, travel_style, pace, budget_level, accommodation_type, dietary_prefs)
        VALUES (
            demo_user_id,
            ARRAY['culture', 'food', 'sightseeing'],
            'balanced',
            'moderate',
            'mid',
            'hotel',
            ARRAY['vegetarian']
        )
        ON CONFLICT (user_id) DO NOTHING;

        IF NOT EXISTS (SELECT 1 FROM public.trips WHERE id = demo_trip_id) THEN
            INSERT INTO public.trips (id, user_id, title, destination, start_date, end_date, budget, currency, group_size, status)
            VALUES (
                demo_trip_id,
                demo_user_id,
                'Royal Rajasthan Heritage Experience',
                'Jaipur',
                CURRENT_DATE + INTERVAL '10 days',
                CURRENT_DATE + INTERVAL '12 days',
                35000.00,
                'INR',
                2,
                'planned'
            );

            INSERT INTO public.itinerary_days (id, trip_id, day_number, date, summary, estimated_cost)
            VALUES
            (demo_day_1_id, demo_trip_id, 1, CURRENT_DATE + INTERVAL '10 days', 'Arrival, City Palace, Jantar Mantar and Chokhi Dhani evening', 8500.00),
            (demo_day_2_id, demo_trip_id, 2, CURRENT_DATE + INTERVAL '11 days', 'Amber Fort, Jal Mahal views, and Hawa Mahal shopping', 7200.00)
            ON CONFLICT (id) DO NOTHING;

            INSERT INTO public.itinerary_items (day_id, time_slot, type, title, description, location, lat, lng, cost, duration_min, order_index)
            VALUES
            (demo_day_1_id, '09:30 - 12:30', 'attraction', 'City Palace & Museum', 'Explore courtyards, textiles gallery, and royal artifacts.', 'Gangori Bazaar, Jaipur', 26.9258, 75.8237, 700.00, 180, 0),
            (demo_day_1_id, '13:00 - 14:15', 'dining', 'Traditional Thali at LMB', 'Savor authentic Dal Baati Churma and Rajasthani sweets at Laxmi Misthan Bhandar.', 'Johari Bazaar', 26.9197, 75.8242, 900.00, 75, 1),
            (demo_day_1_id, '15:00 - 17:00', 'attraction', 'Jantar Mantar Observatory', 'UNESCO World Heritage astronomical monument with stone sundials.', 'Near City Palace', 26.9248, 75.8246, 200.00, 120, 2),
            (demo_day_1_id, '18:30 - 22:00', 'dining', 'Chokhi Dhani Ethnic Resort', 'Village fair ambiance, folk dance, camel rides, and grand Rajasthani dinner.', '12 Miles Tonk Road', 26.7663, 75.8362, 2200.00, 210, 3),

            (demo_day_2_id, '08:30 - 12:00', 'attraction', 'Amber Fort & Maota Lake', 'Grand hilltop fort featuring Sheesh Mahal (Mirror Palace) and elephant pathways.', 'Devisinghpura, Amer', 26.9855, 75.8513, 1000.00, 210, 0),
            (demo_day_2_id, '12:30 - 13:15', 'attraction', 'Jal Mahal Photo Stop', 'Mesmerizing palace standing in the center of Man Sagar Lake.', 'Amer Road', 26.9656, 75.8433, 0.00, 45, 1),
            (demo_day_2_id, '13:30 - 15:00', 'dining', '1135 AD Fine Dine Amber', 'Regal lunch inside historic ramparts with royal recipes.', 'Amber Fort premises', 26.9850, 75.8500, 2400.00, 90, 2),
            (demo_day_2_id, '15:30 - 17:30', 'attraction', 'Hawa Mahal & Bapu Bazaar', 'Iconic 953-window Palace of Winds followed by artisan textile shopping.', 'Hawa Mahal Rd', 26.9239, 75.8267, 1200.00, 120, 3)
            ON CONFLICT (id) DO NOTHING;
        END IF;
    END IF;
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Seed block skipped safely: %', SQLERRM;
END $$;
