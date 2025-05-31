
-- ========= USER ACCOUNT =========
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);


-- ========= HOSTS =========
CREATE TABLE hosts (
    id TEXT PRIMARY KEY, -- Using Airbnb's Host ID 'RGVtYW5kVXNlcjozNDk3ODQ0NjM='
    user_id TEXT NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE, -- Ensure one-to-one
    name TEXT NOT NULL,
    email TEXT, -- can be same as user
    phone TEXT,
    superhost BOOLEAN,
    photo TEXT,
    review_count INTEGER,
    rating NUMERIC(3, 2), -- e.g., 4.95
    years_hosting INTEGER,
    about TEXT, -- URL
    highlights TEXT[], -- Array of strings ['Lives in Gordona, Italy']
    details TEXT[], -- Array of strings ['Response rate: 100%', 'Responds within an hour']
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);


-- ========= SITES =========
CREATE TABLE sites (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    host_id TEXT NOT NULL REFERENCES hosts(id) ON DELETE CASCADE,
    cohosts JSONB, -- JSONB object [{"id": "RGVtYW5kVXNlcjo1NDQxMzcyNA==","name": "Vanesa","photo": "photo_url"}]
    type TEXT NOT NULL CHECK (type IN ('single', 'multi')), -- single or multiple property listings site
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    domain TEXT UNIQUE, -- if hosted on domain (e.g., 'jane-single-property.com')
    description TEXT,
    theme TEXT, -- e.g., 'modern', 'classic'
    settings JSONB, -- Custom settings (e.g., logo, colors)
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);
CREATE INDEX IF NOT EXISTS idx_sites_host_id ON sites(host_id);


-- ========= LISTINGS =========
CREATE TABLE listings (
    id TEXT PRIMARY KEY, -- Using Airbnb's Listing ID '44517879'
    site_id UUID NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
    url TEXT,
    type TEXT, -- 'apartment'
    privacy TEXT, -- 'entire_home'
    title TEXT,
    subtitle TEXT,
    description TEXT,
    highlights JSONB, -- JSONB object [{"title": "Self check-in", "subtitle": "Check yourself by keypad."}]
    hero TEXT, -- '1696883311' (references photos table later, or just stores the ID)
    intro_title TEXT,
    intro_text TEXT,
    average_daily_rate NUMERIC(10, 5),
    min_nights INTEGER DEFAULT 1,
    capacity_summary TEXT[], -- Array-like ['2 guests', 'Studio', '1 bed', '1 bath']
    house_rules_summary TEXT[], -- Array-like ["Check-in: 3:00 PM - 12:00 AM", "Checkout before 10:00 AM", "4 guests maximum"]
    safety_features_summary TEXT[], -- Array-like ["No smoke alarm", "Nearby lake, river, other body of water"]
    sleeping JSONB, -- JSONB object [{"title": "Bedroom 1", "subtitle": "1 queen bed", "photos": ["1678135503"]}]    
    pets BOOLEAN, -- True if pets are allowed
    tags TEXT[],

    -- Location Data (Embedded for simplicity as it's 1:1)
    city TEXT,
    state TEXT,
    country TEXT,
    latitude FLOAT,
    longitude FLOAT,
    location_disclaimer TEXT,

    -- Category Ratings
    ratings JSONB,

    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);
CREATE INDEX IF NOT EXISTS idx_listings_site_id ON listings(site_id);


-- ========= LOCATION DETAILS (e.g., Getting around) =========
CREATE TABLE location_details (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    listing_id TEXT NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
    title TEXT,
    content TEXT,

    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);
CREATE INDEX IF NOT EXISTS idx_location_details_listing_id ON location_details(listing_id);


-- ========= AMENITIES =========
CREATE TABLE amenities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    listing_id TEXT NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
    category TEXT, -- e.g., 'Scenic views', 'Bathroom', 'Not included'
    title TEXT NOT NULL, -- e.g., 'Mountain view', 'Hair dryer', 'Wifi'
    subtitle TEXT,
    top BOOLEAN, -- Should it be designated on the front page
    icon TEXT, -- e.g., 'SYSTEM_VIEW_MOUNTAIN'
    available BOOLEAN
);
CREATE INDEX IF NOT EXISTS idx_amenities_listing_id ON amenities(listing_id);


-- ========= PHOTOS =========
CREATE TABLE photos (
    id TEXT PRIMARY KEY, -- Using Airbnb's Photo ID '1696883311'
    listing_id TEXT NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
    url TEXT NOT NULL, -- basUrl on https://a0.muscache.com/im/pictures/miso/ hosting
    aspect_ratio NUMERIC(10, 8),
    orientation TEXT, -- 'LANDSCAPE', 'PORTRAIT'
    accessibility_label TEXT,
    caption TEXT,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);
CREATE INDEX IF NOT EXISTS idx_photos_listing_id ON photos(listing_id);

-- ========= TOUR =========
CREATE TABLE tour (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    listing_id TEXT NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
    title TEXT NOT NULL, -- e.g., 'Living room'
    photos TEXT[], -- Array of image IDs ['1426890249', '1618559671']
    highlights TEXT[], -- Array of strings ['Sofa bed']
    position INTEGER NOT NULL -- Preserves original order as in the page   
);
CREATE INDEX IF NOT EXISTS idx_tour_listing_id ON tour(listing_id);

-- ========= AVAILABILITY =========
CREATE TABLE availability (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    listing_id TEXT NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    checkin BOOLEAN, -- is check-in blocked
    checkout BOOLEAN -- is checkout blocked
);
CREATE INDEX IF NOT EXISTS idx_availability_listing_id ON availability(listing_id);
CREATE INDEX IF NOT EXISTS idx_availability_dates ON availability(start_date, end_date);


-- ========= HOUSE RULES =========
CREATE TABLE house_rules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    listing_id TEXT NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
    section TEXT,
    title TEXT,
    subtitle TEXT,
    html TEXT
);
CREATE INDEX IF NOT EXISTS idx_house_rules_listing_id ON house_rules(listing_id);

-- ========= SAFETY & PROPERTY =========
CREATE TABLE safety_property (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    listing_id TEXT NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
    section TEXT,
    title TEXT,
    subtitle TEXT,
    html TEXT
);
CREATE INDEX IF NOT EXISTS idx_safety_property_listing_id ON safety_property(listing_id);

-- ========= REVIEWS =========
CREATE TABLE reviews (
    id TEXT PRIMARY KEY, -- Using Airbnb's Review ID '1281813760414937447'
    reviewer_id TEXT, -- Using Airbnb's Reviewer ID '418090453'
    listing_id TEXT NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
    name TEXT,
    photo TEXT, -- url
    language TEXT, -- 'it', 'de', 'en'
    comments TEXT,
    rating INTEGER,
    highlight TEXT, -- Specific highlight mentioned in review
    period TEXT, -- 'November 2024'
    response TEXT, -- host response optional
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);
CREATE INDEX IF NOT EXISTS idx_reviews_listing_id ON reviews(listing_id);

-- ========= Attractions (Points of Interest) =========
CREATE TABLE attractions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    listing_id TEXT NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
    name TEXT,
    types TEXT[],
    location JSONB,
    description TEXT,
    photos TEXT[],
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);
CREATE INDEX IF NOT EXISTS idx_attractions_listing_id ON attractions(listing_id);

-- ========= Accessibility =========
CREATE TABLE accessibility (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    listing_id TEXT NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
    type TEXT,
    title TEXT,
    subtitle TEXT,
    available BOOLEAN,
    images TEXT[],
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);
CREATE INDEX IF NOT EXISTS idx_accessibility_listing_id ON accessibility(listing_id);


-- ========= TRIGGERS ===============================================================================
-- Enforce single-property sites can only have one listing
CREATE OR REPLACE FUNCTION enforce_single_site_listing_limit()
RETURNS TRIGGER AS $$
BEGIN
    IF (SELECT site_type FROM sites WHERE id = NEW.site_id) = 'single' THEN
        IF (SELECT COUNT(*) FROM site_listings WHERE site_id = NEW.site_id) >= 1 THEN
            RAISE EXCEPTION 'Single-property sites can only have one listing';
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER check_single_site_listing
BEFORE INSERT ON site_listings
FOR EACH ROW
EXECUTE FUNCTION enforce_single_site_listing_limit();