-- Sample data for property-listing-extractor database
-- This script inserts one row of fake data into each table following all schema rules

-- ========= USER ACCOUNT =========
INSERT INTO users (
    id, 
    email, 
    password,
    main_url,
    status, 
    retries, 
    comment, 
    created_at, 
    updated_at
) VALUES (
    '898017173185586261', -- Airbnb property listing ID
    'john.doe@example.com',
    '$2a$12$1234567890123456789012uGfTkQjgpIQCKZKLWxbCu2vT9c/1Kz.', -- bcrypt hash
    'https://www.airbnb.com/rooms/44517879',
    'active',
    0,
    'Test user account',
    NOW(),
    NOW()
);

-- ========= HOSTS =========
INSERT INTO hosts (
    id, 
    user_id, 
    name, 
    email, 
    phone, 
    superhost, 
    photo, 
    review_count, 
    rating, 
    years_hosting, 
    about, 
    highlights, 
    details, 
    created_at, 
    updated_at
) VALUES (
    'RGVtYW5kVXNlcjozNDk3ODQ0NjM=', -- Airbnb Host ID
    '898017173185586261', -- References users.id
    'John Doe',
    'host.john@example.com',
    '+1-555-123-4567',
    TRUE,
    'https://example.com/photos/john.jpg',
    127,
    4.95,
    3,
    'https://www.airbnb.com/users/show/34978463',
    ARRAY['Lives in Barcelona, Spain', 'Speaks English, Spanish'],
    ARRAY['Response rate: 100%', 'Response time: within an hour'],
    NOW(),
    NOW()
);

-- ========= SITES =========
INSERT INTO sites (
    id, 
    host_id, 
    cohosts, 
    type, 
    name, 
    slug, 
    domain, 
    description, 
    theme, 
    settings, 
    created_at, 
    updated_at
) VALUES (
    'f47ac10b-58cc-4372-a567-0e02b2c3d479', -- UUID generated manually for this example
    'RGVtYW5kVXNlcjozNDk3ODQ0NjM=', -- References hosts.id
    '[{"id": "RGVtYW5kVXNlcjo1NDQxMzcyNA==", "name": "Maria", "photo": "https://example.com/photos/maria.jpg"}]'::jsonb,
    'single', -- single property site
    'Barcelona Beach Villa',
    'barcelona-beach-villa',
    'barcelona-beach-villa.com',
    'A beautiful villa located near the beach in Barcelona',
    'modern',
    '{"logo": "https://example.com/logo.png", "primaryColor": "#3498db", "secondaryColor": "#2ecc71"}'::jsonb,
    NOW(),
    NOW()
);

-- ========= LISTINGS =========
INSERT INTO listings (
    id, 
    site_id, 
    url, 
    type, 
    privacy, 
    title, 
    subtitle, 
    description, 
    highlights, 
    hero, 
    intro_title, 
    intro_text, 
    average_daily_rate, 
    min_nights, 
    capacity_summary, 
    house_rules_summary, 
    safety_features_summary, 
    sleeping, 
    pets, 
    tags, 
    city, 
    state, 
    country, 
    latitude, 
    longitude, 
    location_disclaimer, 
    ratings, 
    created_at, 
    updated_at
) VALUES (
    '44517879', -- Airbnb Listing ID
    'f47ac10b-58cc-4372-a567-0e02b2c3d479', -- References sites.id
    'https://www.airbnb.com/rooms/44517879',
    'apartment',
    'entire_home',
    'Luxury Beach Apartment with Sea View',
    'Stunning 2-bedroom apartment with panoramic sea views',
    'Experience the beauty of Barcelona from this luxury apartment. Wake up to the sound of waves and enjoy panoramic sea views from your private balcony. This recently renovated space offers modern amenities while maintaining its classic charm.',
    '[{"title": "Self check-in", "subtitle": "Check yourself in with the keypad"}, {"title": "Great location", "subtitle": "95% of recent guests gave the location a 5-star rating"}]'::jsonb,
    '1696883311', -- Photo ID
    'Welcome to Your Barcelona Home',
    'This stunning apartment offers the perfect blend of comfort and luxury for your stay in Barcelona.',
    150.00,
    2,
    ARRAY['4 guests', '2 bedrooms', '3 beds', '2 baths'],
    ARRAY['Check-in: 3:00 PM - 8:00 PM', 'Checkout before 11:00 AM', 'No smoking', 'No parties or events'],
    ARRAY['Smoke alarm', 'Carbon monoxide alarm', 'Fire extinguisher'],
    '[{"title": "Bedroom 1", "subtitle": "1 queen bed", "photos": ["1678135503"]}, {"title": "Bedroom 2", "subtitle": "2 single beds", "photos": ["1678135504"]}]'::jsonb,
    TRUE, -- Pets allowed
    ARRAY['beach', 'sea view', 'family-friendly', 'modern'],
    'Barcelona',
    'Catalonia',
    'Spain',
    41.3851,
    2.1734,
    'Exact location provided after booking',
    '{"cleanliness": 4.9, "accuracy": 4.8, "communication": 5.0, "location": 4.9, "check_in": 4.7, "value": 4.6}'::jsonb,
    NOW(),
    NOW()
);

-- ========= LOCATION DETAILS =========
INSERT INTO location_details (
    id,
    listing_id,
    title,
    content,
    created_at,
    updated_at
) VALUES (
    'a1b2c3d4-e5f6-4a5b-8c7d-9e0f1a2b3c4d', -- UUID generated manually for this example
    '44517879', -- References listings.id
    'Getting around',
    'The apartment is just a 5-minute walk from the beach and a 10-minute walk to the nearest metro station. Taxis are readily available in the area, and there''s a bus stop right outside the building.',
    NOW(),
    NOW()
);

-- ========= AMENITIES =========
INSERT INTO amenities (
    id,
    listing_id,
    category,
    title,
    subtitle,
    top,
    icon,
    available
) VALUES (
    'b2c3d4e5-f6a7-5b6c-9d0e-1f2a3b4c5d6e', -- UUID generated manually for this example
    '44517879', -- References listings.id
    'essentials',
    'Wifi',
    'High-speed internet',
    TRUE,
    'SYSTEM_WIFI',
    TRUE
);

-- Add another amenity
INSERT INTO amenities (
    id,
    listing_id,
    category,
    title,
    subtitle,
    top,
    icon,
    available
) VALUES (
    'c3d4e5f6-a7b8-4c9d-8e0f-1a2b3c4d5e6f', -- UUID generated manually for this example
    '44517879', -- References listings.id
    'kitchen',
    'Kitchen',
    'Full kitchen with modern appliances',
    TRUE,
    'SYSTEM_KITCHEN',
    TRUE
);

-- ========= ACCESSIBILITY =========
INSERT INTO accessibility (
    id,
    listing_id,
    type,
    title,
    subtitle,
    available,
    images,
    created_at,
    updated_at
) VALUES (
    'c3d4e5f6-a7b8-6c7d-0e1f-2a3b4c5d6e7f', -- UUID generated manually for this example
    '44517879', -- References listings.id
    'entrance',
    'Guest entrance and parking',
    'Step-free path to entrance',
    TRUE,
    ARRAY['1678135510', '1678135511'],
    NOW(),
    NOW()
);

-- ========= PHOTOS =========
INSERT INTO photos (
    id,
    listing_id,
    url,
    aspect_ratio,
    orientation,
    accessibility_label,
    caption,
    created_at,
    updated_at
) VALUES (
    '1696883311', -- Airbnb Photo ID (hero image from listings table)
    '44517879', -- References listings.id
    'https://a0.muscache.com/im/pictures/miso/1696883311/original.jpg',
    1.5, -- 3:2 aspect ratio
    'LANDSCAPE',
    'Living room with sea view',
    'Spacious living room with panoramic sea views',
    NOW(),
    NOW()
);

-- Add another photo
INSERT INTO photos (
    id,
    listing_id,
    url,
    aspect_ratio,
    orientation,
    accessibility_label,
    caption,
    created_at,
    updated_at
) VALUES (
    '1678135503', -- Referenced in sleeping JSONB in listings table
    '44517879', -- References listings.id
    'https://a0.muscache.com/im/pictures/miso/1678135503/original.jpg',
    1.5, -- 3:2 aspect ratio
    'LANDSCAPE',
    'Master bedroom with queen bed',
    'Comfortable master bedroom with premium linens',
    NOW(),
    NOW()
);

-- ========= TOUR =========
INSERT INTO tour (
    id,
    listing_id,
    title,
    photos,
    highlights,
    position
) VALUES (
    'd4e5f6a7-b8c9-4d0e-9f2a-3b4c5d6e7f8f', -- UUID generated manually for this example
    '44517879', -- References listings.id
    'Living room',
    ARRAY['1696883311', '1678135504'],
    ARRAY['Comfortable sofa', 'Smart TV', 'Sea view'],
    1
);

-- ========= AVAILABILITY =========
INSERT INTO availability (
    id,
    listing_id,
    start_date,
    end_date,
    checkin,
    checkout
) VALUES (
    'e5f6a7b8-c9d0-4e1f-8a3b-4c5d6e7f8a9b', -- UUID generated manually for this example
    '44517879', -- References listings.id
    '2025-07-01', -- Start date
    '2025-07-15', -- End date
    FALSE, -- Check-in not blocked
    FALSE  -- Checkout not blocked
);

-- ========= HOUSE RULES =========
INSERT INTO house_rules (
    id,
    listing_id,
    section,
    title,
    subtitle,
    html
) VALUES (
    'f6a7b8c9-d0e1-4f2a-9b4c-5d6e7f8a9b0c', -- UUID generated manually for this example
    '44517879', -- References listings.id
    'general',
    'House Rules',
    'Please follow these guidelines during your stay',
    '<ul><li>Check-in: 3:00 PM - 8:00 PM</li><li>Checkout: before 11:00 AM</li><li>No smoking</li><li>No parties or events</li><li>Pets are allowed</li></ul>'
);

-- ========= SAFETY & PROPERTY =========
INSERT INTO safety_property (
    id,
    listing_id,
    section,
    title,
    subtitle,
    html
) VALUES (
    'a7b8c9d0-e1f2-4a3b-8c5d-6e7f8a9b0c1d', -- UUID generated manually for this example
    '44517879', -- References listings.id
    'safety',
    'Safety & Property',
    'Important safety information',
    '<ul><li>Pool or hot tub without a gate or lock</li><li>Nearby lake, river, or other body of water</li><li>Carbon monoxide alarm</li><li>Smoke alarm</li><li>Security camera/recording device</li></ul>'
);

-- ========= REVIEWS =========
INSERT INTO reviews (
    id,
    reviewer_id,
    listing_id,
    name,
    photo,
    language,
    comments,
    rating,
    highlight,
    period,
    response,
    created_at,
    updated_at
) VALUES (
    '1281813760414937447', -- Airbnb Review ID
    '418090453', -- Airbnb Reviewer ID
    '44517879', -- References listings.id
    'Maria',
    'https://a0.muscache.com/im/pictures/user/418090453/profile_pic/original.jpg',
    'en',
    'This apartment was absolutely stunning! The views were even better than in the photos, and everything was spotlessly clean. John was a fantastic host, very responsive and helpful. Would definitely stay here again!',
    5,
    'Stunning views and immaculate apartment',
    'May 2025',
    'Thank you for your wonderful review, Maria! It was a pleasure hosting you and we look forward to welcoming you back soon.',
    NOW(),
    NOW()
);

-- ========= ATTRACTIONS =========
INSERT INTO attractions (
    id,
    listing_id,
    name,
    types,
    location,
    description,
    photos,
    created_at,
    updated_at
) VALUES (
    'b8c9d0e1-f2a3-4b4c-9d6e-7f8a9b0c1d2e', -- UUID generated manually for this example
    '44517879', -- References listings.id
    'Sagrada Familia',
    ARRAY['landmark', 'architecture', 'tourist_attraction'],
    '{"latitude": 41.4036, "longitude": 2.1744, "distance": 2.5}'::jsonb,
    'Antoni Gaudí''s famous unfinished basilica, a UNESCO World Heritage site and Barcelona''s most visited landmark.',
    ARRAY['sagrada_familia_1', 'sagrada_familia_2'],
    NOW(),
    NOW()
);
