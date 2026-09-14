# UNPACKED Phase 1.5 Review - Architecture & Data Model

**Date:** 2026-09-13  
**Purpose:** Deep dive into data model, identity strategy, and migration architecture before Phase 2 implementation  
**Status:** Planning/Review - NO IMPLEMENTATION YET

---

## 1. DATA MODEL - Canonical Schemas

### 1.1 Country Schema

```json
{
  "country_id": "string (required)",           // Deterministic ID (see section 4)
  "name": "string (required)",                // Common name
  "name_official": "string (optional)",       // Official country name
  "iso2": "string (optional)",                // ISO 3166-1 alpha-2
  "iso3": "string (optional)",                // ISO 3166-1 alpha-3
  "capital_city_id": "string (optional)",     // Reference to city_id
  "region": "string (optional)",              // Geographic region
  "subregion": "string (optional)",           // Geographic subregion
  "overview": "string (optional)",            // Description text
  "tourscore": "integer (optional)",          // 0-100 rating
  "price_level": "string (optional)",         // "Affordable" | "Moderate" | "Expensive"
  "safety_level": "string (optional)",        // "Very Safe" | "Safe" | "Risky" | "Dangerous"
  "weather_summary": "string (optional)",     // General weather description
  "primary_language": "string (optional)",    // Main language(s)
  "accessibility_note": "string (optional)",  // "Should I bring Grandma?" assessment
  "coordinates": {
    "lat": "float (optional)",
    "lon": "float (optional)"
  },
  "currency": "string (optional)",            // ISO 4217 currency code
  "population": "integer (optional)",         // Estimated population
  "sources": ["Source (required)"],           // Provenance tracking
  "confidence": "string (required)",          // "high" | "medium" | "low" | "unknown"
  "last_verified": "timestamp (optional)"     // When data was last verified
}
```

**Field Analysis:**
- **Derived fields:** region, subregion (can be derived from ISO codes)
- **Directly sourced:** overview, tourscore, price_level, safety_level (from HTML)
- **Provenance required:** All fields from legacy HTML must include source_type
- **Confidence required:** Subjective ratings (tourscore, safety) require confidence tags

### 1.2 City Schema

```json
{
  "city_id": "string (required)",            // Deterministic ID (see section 4)
  "name": "string (required)",               // City name
  "country_id": "string (required)",         // Reference to country_id
  "coordinates": {
    "lat": "float (required)",
    "lon": "float (required)"
  },
  "overview": "string (optional)",           // Description text
  "tourscore": "float (optional)",           // 0-100 rating
  "has_detailed_content": "boolean (required)", // Distinguishes 1,741 vs 7,001 cities
  "population": "integer (optional)",        // Estimated population
  "time_zone": "string (optional)",         // IANA time zone
  "sources": ["Source (required)"],         // Provenance tracking
  "confidence": "string (required)",        // "high" | "medium" | "low" | "unknown"
  "last_verified": "timestamp (optional)"
}
```

**Field Analysis:**
- **Derived fields:** None required
- **Directly sourced:** All fields from cities.json or HTML
- **Critical distinction:** `has_detailed_content` flag separates 1,741 full guides from 7,001 geographic entries
- **Provenance required:** Geographic data vs detailed content have different sources

### 1.3 Destination Schema

```json
{
  "destination_id": "string (required)",     // Deterministic ID
  "name": "string (required)",               // Destination name
  "type": "string (required)",              // "country" | "region" | "city_group"
  "parent_destination_id": "string (optional)", // For hierarchical destinations
  "overview": "string (optional)",           // Marketing/description text
  "best_time_to_visit": "string (optional)", // Seasonal recommendations
  "typical_duration": "string (optional)",   // "3-5 days" | "1-2 weeks"
  "sources": ["Source (required)"],
  "confidence": "string (required)",
  "last_verified": "timestamp (optional)"
}
```

**Field Analysis:**
- **Derived fields:** None
- **Directly sourced:** Primarily derived from country content, could be enhanced
- **Use case:** Higher-level travel planning beyond individual countries/cities

### 1.4 Activity Schema

```json
{
  "activity_id": "string (required)",        // Deterministic ID
  "name": "string (required)",               // Attraction/activity name
  "city_id": "string (required)",            // Reference to city_id
  "type": "string (required)",              // "sightseeing" | "cultural" | "adventure" | "entertainment"
  "description": "string (optional)",        // Detailed description
  "image_url": "string (optional)",          // Primary image
  "image_captions": ["string (optional)"],   // Multiple captions if slideshow
  "best_time_to_visit": "string (optional)", // Timing recommendations
  "cost_estimate": "string (optional)",      // "Free" | "$$" | "$$$"
  "duration_estimate": "string (optional)",  // "2-3 hours"
  "tips": ["string (optional)"],             // Practical advice
  "external_links": [{
    "url": "string (required)",
    "title": "string (required)",
    "type": "string (required)"             // "learn_more" | "tickets" | "official"
  }],
  "sources": ["Source (required)"],
  "confidence": "string (required)",
  "last_verified": "timestamp (optional)"
}
```

**Field Analysis:**
- **Derived fields:** None
- **Directly sourced:** From city slideshow captions and descriptions
- **Time-sensitive:** cost_estimate, opening hours (if added later) need verification timestamps

### 1.5 Restaurant Schema

```json
{
  "restaurant_id": "string (required)",      // Deterministic ID
  "name": "string (required)",               // Restaurant name
  "city_id": "string (required)",            // Reference to city_id
  "cuisine_type": "string (optional)",       // "Japanese" | "Italian" | "Fusion"
  "price_range": "string (optional)",        // "Budget" | "Mid-range" | "Luxury"
  "description": "string (optional)",        // Detailed description
  "signature_dishes": ["string (optional)"], // Recommended dishes
  "area": "string (optional)",               // Neighborhood/area within city
  "atmosphere": "string (optional)",         // "Casual" | "Fine dining" | "Trendy"
  "status": "string (required)",             // "open" | "closed" | "unknown"
  "last_status_check": "timestamp (optional)", // When business status was verified
  "sources": ["Source (required)"],
  "confidence": "string (required)",
  "last_verified": "timestamp (optional)"
}
```

**Field Analysis:**
- **Derived fields:** cuisine_type (can be derived from description text)
- **Directly sourced:** Most fields from restaurant popups
- **Highly time-sensitive:** status, operating hours, menu items require regular verification

### 1.6 Hotel/Lodging Schema

```json
{
  "lodging_id": "string (required)",         // Deterministic ID
  "name": "string (required)",               // Property name
  "city_id": "string (required)",            // Reference to city_id
  "type": "string (required)",              // "hotel" | "hostel" | "apartment" | "resort"
  "price_range": "string (optional)",        // "Budget" | "Mid-range" | "Luxury"
  "description": "string (optional)",        // Detailed description
  "amenities": ["string (optional)"],       // "WiFi" | "Breakfast" | "Pool" | "Spa"
  "area": "string (optional)",               // Neighborhood/area
  "proximity_to_attractions": ["string (optional)"], // Nearby attractions
  "status": "string (required)",             // "open" | "closed" | "under_construction" | "unknown"
  "last_status_check": "timestamp (optional)",
  "sources": ["Source (required)"],
  "confidence": "string (required)",
  "last_verified": "timestamp (optional)"
}
```

**Field Analysis:**
- **Derived fields:** amenities (can be extracted from description)
- **Directly sourced:** From accommodations popups
- **Highly time-sensitive:** status, pricing, amenities change frequently

### 1.7 Transportation Schema

```json
{
  "transportation_id": "string (required)",  // Deterministic ID
  "location_id": "string (required)",       // Reference to city_id or country_id
  "location_type": "string (required)",     // "city" | "country"
  "type": "string (required)",              // "public_transit" | "rideshare" | "rental_car" | "walking" | "cycling"
  "description": "string (optional)",        // General description
  "options": ["string (optional)"],         // Specific options ["Buses", "Metro", "Trains"]
  "cost_level": "string (optional)",         // "Free" | "Affordable" | "Moderate" | "Expensive"
  "coverage": "string (optional)",          // "City-wide" | "Limited" | "Tourist areas only"
  "tips": ["string (optional)"],             // Practical advice
  "status": "string (required)",             // "current" | "disrupted" | "unknown"
  "last_status_check": "timestamp (optional)",
  "sources": ["Source (required)"],
  "confidence": "string (required)",
  "last_verified": "timestamp (optional)"
}
```

**Field Analysis:**
- **Derived fields:** None
- **Directly sourced:** From transportation popups
- **Highly time-sensitive:** routes, schedules, pricing, service disruptions

### 1.8 Trip Schema

```json
{
  "trip_id": "string (required)",            // Deterministic ID
  "user_id": "string (required)",            // Sam's user identifier
  "name": "string (optional)",               // Trip name/label
  "start_date": "date (required)",           // Trip start date
  "end_date": "date (required)",             // Trip end date
  "destinations": ["string (required)"],     // List of location_ids
  "purpose": "string (optional)",            // "leisure" | "business" | "study" | "family"
  "budget": {
    "planned": "float (optional)",
    "actual": "float (optional)"
  },
  "highlights": ["string (optional)"],       // Best experiences
  "challenges": ["string (optional)"],       // Issues encountered
  "overall_rating": "integer (optional)",    // 1-5 rating
  "would_return": "boolean (optional)",
  "notes": "string (optional)",              // General thoughts
  "sources": ["Source (required)"],
  "confidence": "string (required)",
  "created_at": "timestamp (required)"
}
```

**Field Analysis:**
- **Derived fields:** None
- **Directly sourced:** Personal input (not in current dataset)
- **Personal data:** Requires user authentication and privacy controls

### 1.9 Experience Schema

```json
{
  "experience_id": "string (required)",     // Deterministic ID
  "user_id": "string (required)",            // Sam's user identifier
  "trip_id": "string (optional)",            // Link to trip if applicable
  "location_id": "string (required)",        // Where experience occurred
  "date": "date (required)",                 // When experience occurred
  "type": "string (required)",              // "visit" | "stay" | "dining" | "activity" | "transit"
  "rating": "integer (optional)",            // 1-5 personal rating
  "relationship": ["string (optional)"],     // "VISITED" | "LIVED" | "STUDIED" | "ATE" | "LOVED" | "DISLIKED" | "WANT_TO_VISIT"
  "notes": "string (optional)",              // Personal thoughts
  "photos": ["string (optional)"],           // Photo references
  "cost": "float (optional)",                // Actual cost paid
  "companions": ["string (optional)"],       // Who was there
  "would_recommend": "boolean (optional)",
  "sources": ["Source (required)"],
  "confidence": "string (required)",
  "created_at": "timestamp (required)"
}
```

**Field Analysis:**
- **Derived fields:** None
- **Directly sourced:** Personal input (not in current dataset)
- **Travel-specific:** Designed for travel relationships, not general memory

### 1.10 TravelHistory Schema

```json
{
  "history_id": "string (required)",         // Deterministic ID
  "user_id": "string (required)",            // Sam's user identifier
  "location_id": "string (required)",        // Reference to city_id or country_id
  "location_type": "string (required)",      // "city" | "country"
  "relationship_type": "string (required)",  // "VISITED" | "LIVED" | "STUDIED" | "WANT_TO_VISIT" | "WOULD_RETURN"
  "first_visit": "date (optional)",          // Earliest visit
  "last_visit": "date (optional)",           // Most recent visit
  "visit_count": "integer (optional)",        // Number of visits
  "notes": "string (optional)",              // General thoughts about location
  "sources": ["Source (required)"],
  "confidence": "string (required)",
  "last_updated": "timestamp (required)"
}
```

**Field Analysis:**
- **Derived fields:** visit_count (can be derived from Experience records)
- **Directly sourced:** Personal input (not in current dataset)
- **Aggregate view:** Summarizes personal relationship with locations

### 1.11 Recommendation Schema

```json
{
  "recommendation_id": "string (required)",  // Deterministic ID
  "location_id": "string (required)",       // Reference to city_id or country_id
  "location_type": "string (required)",      // "city" | "country"
  "recommendation_type": "string (required)", // "general" | "safety" | "accessibility" | "seasonal"
  "rating": "string (optional)",            // "Highly Recommended" | "Recommended" | "Not Recommended"
  "tourscore": "integer (optional)",        // 0-100 numerical rating
  "reasoning": "string (optional)",          // Why this recommendation
  "target_audience": ["string (optional)"],  // ["General travelers", "Families", "Backpackers"]
  "accessibility_note": "string (optional)", // Specific accessibility guidance
  "best_seasons": ["string (optional)"],     // ["Spring", "Fall"]
  "sources": ["Source (required)"],
  "confidence": "string (required)",
  "last_verified": "timestamp (optional)"
}
```

**Field Analysis:**
- **Derived fields:** tourscore (from country/city data)
- **Directly sourced:** From atlas travel tips and country assessments
- **Mixed provenance:** Some from Sam's expertise, some from extracted data

### 1.12 Source Schema

```json
{
  "source_id": "string (required)",          // Deterministic ID
  "source_type": "string (required)",        // "legacy_unpacked" | "official_source" | "external_source" | "personal_experience" | "user_input" | "agent_research"
  "name": "string (required)",               // Source name
  "description": "string (optional)",        // Source description
  "url": "string (optional)",               // Source URL if applicable
  "author": "string (optional)",             // Who created this source
  "created_date": "date (optional)",         // When source was created
  "last_updated": "timestamp (optional)",    // When source was last updated
  "reliability_score": "integer (optional)", // 1-10 reliability assessment
  "coverage": ["string (optional)"],         // What this source covers
  "notes": "string (optional)"               // Additional context
}
```

**Field Analysis:**
- **Derived fields:** None
- **Directly sourced:** Metadata about data sources
- **Critical for:** Provenance tracking and confidence assessment

---

## 2. 1,741 vs 7,001 CITIES STRATEGY

### 2.1 Problem Analysis

**1,741 Cities with Detailed Content:**
- Full HTML pages with accommodations, restaurants, activities, etc.
- High-quality, manually curated travel information
- Located in: `public/PaidContent/cities/{cityname}.html`
- Example: `tokyojapan.html`, `parisfrance.html`, `abudhabiunitedarabemirates.html`

**7,001 Cities in Geographic Database:**
- Basic geographic coordinates only
- Located in: `public/PaidContent/cities/cities.json`
- Structure: `{"name":"tokyo","lat":35.6828387,"lon":139.7594549,"country":"japan","slug":"tokyo"}`
- Used for mapping and geographic reference

**Overlap Issue:**
- Some cities exist in both datasets (e.g., Tokyo, Paris)
- Some cities only exist in geographic database
- Geographic database has duplicate city names (e.g., Hyderabad in India and Pakistan)

### 2.2 Canonical Representation Strategy

**Single City Entity with Content Level Flag:**

```json
{
  "city_id": "tokyo-japan",
  "name": "Tokyo",
  "country_id": "japan",
  "coordinates": {"lat": 35.6828387, "lon": 139.7594549},
  "has_detailed_content": true,              // KEY DISTINCTION
  "content_level": "full",                  // "full" | "geographic_only"
  "overview": "Tokyo, a city where tradition meets innovation...",
  "tourscore": 90.0,
  "accommodations": [...],                  // Only if has_detailed_content = true
  "restaurants": [...],                      // Only if has_detailed_content = true
  "activities": [...],                       // Only if has_detailed_content = true
  "sources": [
    {
      "source_type": "legacy_unpacked",
      "source_id": "unpacked-tokyo-html",
      "confidence": "high"
    },
    {
      "source_type": "legacy_unpacked", 
      "source_id": "unpacked-cities-json",
      "confidence": "high"
    }
  ]
}
```

**Geographic-Only City Example:**

```json
{
  "city_id": "hyderabad-india",
  "name": "Hyderabad",
  "country_id": "india", 
  "coordinates": {"lat": 17.360589, "lon": 78.4740613},
  "has_detailed_content": false,
  "content_level": "geographic_only",
  "sources": [
    {
      "source_type": "legacy_unpacked",
      "source_id": "unpacked-cities-json",
      "confidence": "medium"
    }
  ]
}
```

### 2.3 Merge Strategy

1. **Primary Key:** `city_id` (deterministic, see section 4)
2. **Start with geographic database** as base (7,001 cities)
3. **Enhance with detailed content** where available (1,741 cities)
4. **Flag content level** to distinguish full vs geographic-only
5. **Maintain provenance** for both data sources

**Benefits:**
- Single source of truth for city entities
- Clear distinction between content quality levels
- Preserves all geographic data while adding rich content where available
- Enables queries like "cities near Tokyo with full travel guides"

---

## 3. LEGACY CONTENT PROVENANCE STRATEGY

### 3.1 Source Type Taxonomy

**source_type values:**
- `legacy_unpacked` - Content from original UNPACKED website
- `official_source` - Official government/tourism board sources
- `external_source` - Third-party travel websites, APIs
- `personal_experience` - Sam's personal travel experiences
- `user_input` - User-contributed content (future)
- `agent_research` - AI agent research (future)

### 3.2 Confidence Levels

**confidence values:**
- `high` - Verified, reliable, current data
- `medium` - Generally reliable but may need verification
- `low` - Unverified, potentially outdated, or incomplete
- `unknown` - Confidence cannot be determined

### 3.3 Legacy Content Provenance Rules

**All legacy UNPACKED content MUST:**
1. Include `source_type: "legacy_unpacked"`
2. Include specific source identifier (e.g., HTML filename)
3. Include confidence assessment based on content type
4. Include extraction timestamp
5. Never be treated as automatically authoritative

**Confidence Assignment for Legacy Content:**
- **Geographic coordinates:** `high` (stable, verifiable)
- **Country names/ISO codes:** `high` (standardized)
- **Hotel/restaurant names:** `medium` (businesses close/change)
- **Descriptions/overviews:** `medium` (subjective but stable)
- **Price information:** `low` (highly time-sensitive)
- **Safety assessments:** `medium` (can change but generally stable)
- **Transportation details:** `low` (routes/schedules change frequently)

### 3.4 Provenance Metadata Structure

```json
{
  "sources": [
    {
      "source_type": "legacy_unpacked",
      "source_id": "unpacked-france-francehome-html",
      "extraction_date": "2026-09-13T00:00:00Z",
      "extraction_method": "automated_html_parser",
      "confidence": "medium",
      "fields_provided": ["overview", "tourscore", "safety_level"],
      "notes": "Extracted from country home page"
    }
  ]
}
```

### 3.5 Authority Prevention

**Rules to prevent legacy content from becoming silently authoritative:**

1. **Never auto-merge** legacy content with newer sources without review
2. **Always display source** when showing legacy data to users
3. **Flag time-sensitive data** with verification requirements
4. **Require explicit confirmation** before using legacy data for critical decisions
5. **Maintain separation** between legacy and current data where possible

---

## 4. DUPLICATES / IDENTITY STRATEGY

### 4.1 Deterministic ID Generation

**City ID Format:** `{city_name}-{country_iso2}`

Examples:
- `tokyo-jp` (Tokyo, Japan)
- `paris-fr` (Paris, France)  
- `london-gb` (London, United Kingdom)
- `hyderabad-in` (Hyderabad, India)
- `hyderabad-pk` (Hyderabad, Pakistan)

**Country ID Format:** `{country_name_normalized}`

Examples:
- `japan`
- `france`
- `united-states`
- `united-kingdom`

**Normalization Rules:**
- Lowercase
- Replace spaces with hyphens
- Remove special characters
- Use ISO2 codes for country disambiguation
- Handle alternate spellings with alias table

### 4.2 Duplicate Handling Strategy

**City Name Conflicts:**
1. **Use country context** for disambiguation (primary strategy)
2. **Use administrative divisions** for further disambiguation if needed
3. **Maintain alias table** for alternate names/historical names
4. **Geographic coordinates** as final disambiguation method

**Example: Hyderabad Conflict Resolution**
```json
{
  "city_id": "hyderabad-in",
  "name": "Hyderabad",
  "country_id": "india",
  "coordinates": {"lat": 17.360589, "lon": 78.4740613},
  "aliases": ["Hyderabad, India", "Hyderabad (Telangana)"]
},
{
  "city_id": "hyderabad-pk", 
  "name": "Hyderabad",
  "country_id": "pakistan",
  "coordinates": {"lat": 25.3765, "lon": 68.3689},
  "aliases": ["Hyderabad, Pakistan"]
}
```

**Country Name Variations:**
```json
{
  "country_id": "united-states",
  "name": "United States",
  "name_official": "United States of America",
  "iso2": "US",
  "iso3": "USA",
  "aliases": ["USA", "United States of America", "America"]
}
```

### 4.3 Alias System

**Purpose:** Handle alternate spellings, historical names, common abbreviations

**Structure:**
```json
{
  "entity_id": "tokyo-jp",
  "entity_type": "city",
  "primary_name": "Tokyo",
  "aliases": [
    {"name": "Tōkyō", "type": "alternate_spelling"},
    {"name": "Tokyo City", "type": "variant"},
    {"name": "東京都", "type": "native_name"}
  ]
}
```

### 4.4 Identity Resolution Process

**When importing new data:**
1. **Normalize** the name using standard rules
2. **Check for existing IDs** with same normalized name
3. **If conflict found:**
   - Check geographic coordinates (within reasonable distance?)
   - Check country context
   - Check aliases
   - If truly different entity, create new ID with disambiguation
4. **If same entity:** merge with provenance tracking

---

## 5. CONTENT EXTRACTION CONFIDENCE ANALYSIS

### 5.1 Extraction Confidence Table

| Content Type | Extraction Confidence | Automation Level | Review Required | Notes |
|--------------|----------------------|-----------------|-----------------|-------|
| **Country Names** | High | Fully automated | No | Standardized, consistent |
| **Country Overviews** | Medium | Semi-automated | Yes | HTML parsing, may need manual review |
| **Tourscore Ratings** | High | Fully automated | No | Consistent numeric format |
| **Safety Levels** | Medium | Fully automated | No | Text categories, consistent |
| **Price Levels** | Medium | Fully automated | No | Text categories, consistent |
| **Weather Info** | Low | Semi-automated | Yes | Free text, variable formats |
| **Language Data** | High | Fully automated | No | Consistent format |
| **Accessibility Notes** | Medium | Fully automated | No | "Should I bring Grandma" text |
| **City Names** | High | Fully automated | No | From filenames, consistent |
| **City Coordinates** | High | Fully automated | No | From JSON, precise numeric |
| **City Overviews** | Medium | Semi-automated | Yes | HTML parsing, variable quality |
| **Hotel Names** | Medium | Semi-automated | Yes | Embedded in HTML text |
| **Hotel Descriptions** | Low | Manual | Yes | Free text, marketing language |
| **Hotel Amenities** | Low | Manual | Yes | Embedded in descriptions |
| **Restaurant Names** | Medium | Semi-automated | Yes | Embedded in HTML text |
| **Restaurant Cuisine** | Low | Manual | Yes | Inferred from descriptions |
| **Restaurant Descriptions** | Low | Manual | Yes | Free text, subjective |
| **Transportation Info** | Medium | Semi-automated | Yes | Structured popup content |
| **Activity Names** | Medium | Semi-automated | Yes | From slideshow captions |
| **Activity Descriptions** | Medium | Semi-automated | Yes | From slideshow captions |
| **Image URLs** | High | Fully automated | No | Direct URLs in HTML |
| **Image Captions** | Medium | Semi-automated | Yes | From slideshow captions |
| **Blog Links** | High | Fully automated | No | Direct URLs in HTML |
| **Weekly Itineraries** | Low | Manual | Yes | Free text, day-by-day format |
| **Nightlife Venues** | Medium | Semi-automated | Yes | Structured popup content |
| **Bar Names** | Medium | Semi-automated | Yes | Embedded in HTML text |
| **Club Names** | Medium | Semi-automated | Yes | Embedded in HTML text |

### 5.2 Representative Sample Analysis

**Country Page (Japan):**
- **Structure:** Consistent across all countries
- **Reliable fields:** Tourscore, price, safety, language, accessibility
- **Variable fields:** Weather description, overview text quality
- **Extraction confidence:** High for structured data, medium for text

**City Page (Tokyo):**
- **Structure:** Consistent template across cities
- **Reliable fields:** Overview, tourscore, basic info
- **Complex fields:** Popup content (accommodations, restaurants, etc.)
- **Extraction confidence:** High for basic info, medium for popup content

**Accommodations Popup:**
- **Format:** Numbered list with descriptions
- **Challenges:** Hotel names embedded in text, amenities mixed with descriptions
- **Extraction confidence:** Medium for names, low for amenities/details

**Transportation Popup:**
- **Format:** Paragraph describing options
- **Challenges:** Unstructured text, variable detail levels
- **Extraction confidence:** Medium for general info, low for specifics

**Restaurant Popup:**
- **Format:** Numbered list with descriptions
- **Challenges:** Cuisine types not explicitly stated, signature dishes embedded
- **Extraction confidence:** Medium for names, low for cuisine/dishes

**Activities (Slideshow):**
- **Format:** Image + caption
- **Challenges:** Captions vary in detail, some just names
- **Extraction confidence:** High for names/images, medium for descriptions

### 5.3 Automation Recommendations

**Fully Automated (High Confidence):**
- Geographic coordinates
- Country/city names and ISO codes
- Tourscore numeric values
- Image URLs
- External blog links
- Basic categorization (safety level, price level)

**Semi-Automated (Medium Confidence):**
- Overview/description text (HTML parsing with validation)
- Hotel/restaurant names (regex extraction with manual review)
- Activity names and descriptions
- Transportation general information
- Weekly itineraries (structure extraction)

**Manual Review Required (Low Confidence):**
- Hotel amenities (extract from descriptions)
- Restaurant cuisine types (infer from descriptions)
- Signature dishes (extract from descriptions)
- Detailed service information
- Business status verification

---

## 6. STALE INFORMATION STRATEGY

### 6.1 Time-Sensitive Field Classification

**A. Static Knowledge (Rarely Changes)**
- Geographic coordinates
- Country names and ISO codes
- City names and basic geography
- Historical information
- Cultural overviews
- General climate descriptions
- Language information

**B. Periodically Verified Knowledge (Changes Occasionally)**
- Safety assessments (verify every 6-12 months)
- General price levels (verify annually)
- Transportation infrastructure (verify annually)
- Major attractions (verify every 1-2 years)
- Hotel/restaurant existence (verify annually)

**C. Live API/Research Data (Changes Frequently)**
- Hotel prices and availability
- Restaurant hours and menus
- Transportation schedules and routes
- Visa requirements
- Current events/seasonal closures
- Airline routes and prices
- Business operating status
- Real-time weather

### 6.2 Timestamp Strategy

**All time-sensitive data MUST include:**
```json
{
  "data_field": "current_value",
  "last_verified": "2026-09-13T00:00:00Z",
  "verification_method": "automated_check | manual_review | api_call",
  "expiry_date": "2027-03-13T00:00:00Z",  // When data should be re-verified
  "stale_warning": true  // Flag if past expiry
}
```

### 6.3 Data Freshness Tiers

**Tier 1: Static (No expiration)**
- Geographic data
- Historical/cultural information
- General overviews

**Tier 2: Stable (1-2 year validity)**
- Safety assessments
- Price level categories
- Major attractions
- Transportation infrastructure

**Tier 3: Dynamic (6-month validity)**
- Business status (open/closed)
- Operating hours
- Specific pricing
- Current events

**Tier 4: Live (API/research required)**
- Real-time availability
- Current pricing
- Live schedules
- Weather conditions

### 6.4 Verification Triggers

**Automatic verification triggers:**
- Data older than expiry date
- User reports inconsistency
- External API indicates change
- Scheduled periodic verification

**Manual verification requirements:**
- Critical safety information
- High-profile destinations
- User-reported issues
- Significant world events

---

## 7. PERSONAL TRAVEL KNOWLEDGE STRATEGY

### 7.1 Travel-Specific Relationship Types

**Primary Relationships:**
- `VISITED` - Has been to location
- `LIVED` - Has resided in location (extended stay)
- `STUDIED` - Has studied at location (educational)
- `WANT_TO_VISIT` - Wants to visit in future
- `WOULD_RETURN` - Would visit again
- `RECOMMEND` - Recommends to others

**Experience-Level Relationships:**
- `ATE` - Dined at restaurant
- `STAYED` - Stayed at hotel/lodging
- `LOVED` - Particularly enjoyed experience
- `DISLIKED` - Did not enjoy experience

### 7.2 Personal Knowledge Schema Integration

**Personal data coexists with global knowledge:**

```json
{
  "city_id": "tokyo-jp",
  "name": "Tokyo",
  "country_id": "japan",
  // Global knowledge (available to all)
  "global_data": {
    "overview": "Tokyo, a city where tradition meets innovation...",
    "tourscore": 90.0,
    "restaurants": [...],
    "hotels": [...]
  },
  // Personal knowledge (Sam's only)
  "personal_data": {
    "user_id": "sam-woodysc7",
    "relationships": ["VISITED", "WOULD_RETURN"],
    "experiences": [
      {
        "date": "2024-03-15",
        "type": "dining",
        "restaurant_id": "kyubey-ginza",
        "rating": 5,
        "notes": "Best omakase ever"
      }
    ],
    "recommendations": {
      "skip": ["Tourist traps in Shibuya"],
      "must_do": ["Visit Golden Gai at night"]
    }
  }
}
```

### 7.3 Privacy and Access Control

**Personal data rules:**
- Personal knowledge NEVER exposed in global queries
- Requires authentication to access
- Stored separately from global knowledge
- Can be selectively shared (e.g., recommendations)
- Subject to user deletion/modification

**Access levels:**
- `global_only` - Public travel knowledge
- `personal_only` - Sam's private experiences
- `shared_recommendations` - Sam's public recommendations
- `full_access` - All data (Sam only)

### 7.4 Travel-Specific Design Principles

**NOT a general memory system:**
- No storage of non-travel personal information
- No general life events, relationships, etc.
- Focused exclusively on travel domain
- Relationships are travel-specific (VISITED, ATE, STAYED)

**Travel-focused features:**
- Trip planning integration
- Travel history tracking
- Personal recommendations based on experiences
- "Want to visit" wishlist
- Travel compatibility analysis

---

## 8. JUAN WHEY QUERY INTERFACE

### 8.1 Core Query Functions

#### get_country(country_id)
```javascript
get_country("japan")
// Returns: Country object with global knowledge
// Inputs: country_id (deterministic ID)
// Outputs: Full country schema
// Filters: None (single entity)
// Provenance: Included in response
// Confidence: Included in response
// Data type: Static knowledge
```

#### get_city(city_id)
```javascript
get_city("tokyo-jp")
// Returns: City object with global knowledge
// Inputs: city_id (deterministic ID)
// Outputs: Full city schema
// Filters: None (single entity)
// Provenance: Included in response
// Confidence: Included in response
// Data type: Static knowledge + content level flag
```

#### search_destinations(query, filters)
```javascript
search_destinations("safe asian countries", {min_tourscore: 80, max_price: "Moderate"})
// Returns: Array of matching destinations
// Inputs: search query, optional filters
// Outputs: Array of country/city objects
// Filters: tourscore, price_level, safety, region, etc.
// Provenance: Included for each result
// Confidence: Included for each result
// Data type: Static knowledge
```

#### get_transportation(location_id, location_type)
```javascript
get_transportation("tokyo-jp", "city")
// Returns: Transportation options for location
// Inputs: location_id, location_type ("city" | "country")
// Outputs: Array of transportation records
// Filters: type, cost_level, coverage
// Provenance: Included
// Confidence: Included + last_verified
// Data type: Static knowledge with verification timestamps
```

#### get_lodging(city_id, filters)
```javascript
get_lodging("tokyo-jp", {type: "hotel", price_range: "luxury"})
// Returns: Accommodation options
// Inputs: city_id, optional filters
// Outputs: Array of lodging records
// Filters: type, price_range, amenities
// Provenance: Included
// Confidence: Included + last_verified + status
// Data type: Static knowledge with business status checks
```

#### get_activities(city_id, filters)
```javascript
get_activities("tokyo-jp", {type: "cultural"})
// Returns: Activities/attractions
// Inputs: city_id, optional filters
// Outputs: Array of activity records
// Filters: type, cost_estimate, duration
// Provenance: Included
// Confidence: Included
// Data type: Static knowledge
```

#### get_restaurants(city_id, filters)
```javascript
get_restaurants("tokyo-jp", {cuisine_type: "japanese"})
// Returns: Restaurant options
// Inputs: city_id, optional filters
// Outputs: Array of restaurant records
// Filters: cuisine_type, price_range, atmosphere
// Provenance: Included
// Confidence: Included + last_verified + status
// Data type: Static knowledge with business status checks
```

#### get_personal_experiences(user_id, filters)
```javascript
get_personal_experiences("sam-woodysc7", {location_id: "tokyo-jp"})
// Returns: Personal travel experiences
// Inputs: user_id, optional filters
// Outputs: Array of experience records
// Filters: location_id, relationship_type, date_range
// Provenance: personal_experience source type
// Confidence: high (personal data)
// Data type: Personal knowledge (authenticated only)
```

#### get_travel_history(user_id, filters)
```javascript
get_travel_history("sam-woodysc7", {relationship: "VISITED"})
// Returns: Personal travel history summary
// Inputs: user_id, optional filters
// Outputs: Travel history records
// Filters: relationship_type, date_range, location_type
// Provenance: personal_experience source type
// Confidence: high (personal data)
// Data type: Personal knowledge (authenticated only)
```

#### get_recommendations(location_id, filters)
```javascript
get_recommendations("japan", {type: "general"})
// Returns: Recommendations for location
// Inputs: location_id, optional filters
// Outputs: Recommendation records
// Filters: type, target_audience, rating
// Provenance: Mixed (legacy + personal)
// Confidence: Varies by source
// Data type: Static knowledge + personal recommendations
```

### 8.2 Response Format Standard

**All responses include:**
```json
{
  "data": { /* requested data */ },
  "provenance": {
    "source_type": "legacy_unpacked",
    "source_id": "unpacked-japan-html",
    "confidence": "medium",
    "last_verified": "2026-09-13T00:00:00Z"
  },
  "metadata": {
    "content_level": "full",  // for cities
    "data_freshness": "current",
    "requires_verification": false
  }
}
```

### 8.3 Live Data Integration

**For time-sensitive data, interface supports:**
```javascript
get_lodging("tokyo-jp", {include_live_pricing: true})
// Returns static data + live pricing from external API
get_restaurants("paris-fr", {include_live_hours: true})
// Returns static data + live hours from external API
```

---

## 9. MIGRATION ORDER RECOMMENDATION

### 9.1 Recommended Migration Sequence

**Phase 2A: Foundation (Geographic Core)**
1. Countries (254) - Basic geographic and metadata
2. Cities (7,001) - Geographic database with content level flags
3. Country-City relationships - Link cities to countries
4. Source system - Implement provenance tracking
5. ID generation system - Deterministic IDs

**Phase 2B: Content Enrichment (Detailed Travel Knowledge)**
1. Activities/Attractions - From city slideshows (1,741 cities)
2. Transportation - From city transportation popups
3. Lodging - From city accommodation popups  
4. Restaurants - From city restaurant popups
5. Image metadata - URLs and captions

**Phase 2C: Practical Information (Travel Planning)**
1. Recommendations - From travel tips and tourscores
2. Safety assessments - Country and city safety data
3. Accessibility information - "Should I bring Grandma" data
4. Seasonal information - Best time to visit
5. Travel tips - From atlas content

**Phase 2D: Personal Knowledge (Sam's Data)**
1. User authentication system
2. Personal experience schema
3. Travel history tracking
4. Personal recommendations
5. Privacy controls

**Phase 2E: Query Interface (Juan)**
1. Core query functions implementation
2. Filtering and search
3. Provenance and confidence reporting
4. Live data integration hooks
5. Performance optimization

### 9.2 Rationale for Sequence

**Why geographic first:**
- Foundation for all other entities
- Lowest complexity and risk
- Enables relationship building
- Required for content enrichment

**Why content second:**
- Builds on geographic foundation
- Most valuable travel knowledge
- Medium complexity
- Can be done incrementally

**Why practical info third:**
- Requires content as foundation
- Enhances planning capabilities
- Lower priority than core content

**Why personal knowledge fourth:**
- Requires authentication infrastructure
- Separate from global knowledge
- Can be developed independently

**Why query interface last:**
- Requires data to be complete
- Performance depends on data structure
- Can be tested against complete dataset

---

## 10. WHAT NOT TO MIGRATE

### 10.1 Explicit Exclusions

**Authentication & Payment Systems:**
- Firebase authentication configuration
- Stripe payment processing
- User subscription management
- Payment webhook handlers
- Access control functions
- Whitelist management systems

**Admin & Debug Tools:**
- Admin HTML interfaces (`admin-*.html`)
- Debug HTML pages (`debug-*.html`)
- Debug Netlify functions
- User management scripts
- Whitelist management scripts

**Website Infrastructure:**
- Navigation and routing logic
- Netlify redirect configuration
- Website theming and styling
- Responsive design breakpoints
- Client-side authentication scripts
- Firebase SDK integration

**Temporary Development Artifacts:**
- Fix scripts (`fix_*.sh`, `fix_*.py`)
- Backup files (`*.bak`, `*.backup.*`)
- Node modules (can be regenerated)
- System files (`.DS_Store`)
- Test parameters and debug flags

**Obsolete Content:**
- Duplicate atlas versions
- Outdated HTML templates
- Unused Netlify functions
- Legacy authentication flows
- Old redirect patterns

**Generated/Mechanical Content:**
- Repetitive HTML structures
- Boilerplate navigation code
- Template-based content without unique knowledge
- Auto-generated sitemaps (can be regenerated)

### 10.2 Archive vs Delete

**Archive (keep for reference):**
- Documentation files
- Configuration examples
- Legacy website structure samples
- Implementation notes
- Historical development artifacts

**Delete (no future value):**
- Temporary fix scripts
- Backup files
- Debug tools
- Node modules
- System files
- Development artifacts

---

## 11. PHASE 2 MINIMUM VIABLE SCOPE

### 11.1 MVP Definition

**Scope: Prove architecture works with representative sample**

**Sample Size:**
- **10 countries** (diverse regions, content quality)
- **25-50 cities** (mix of full content and geographic-only)
- **Geographic-only cities** (prove 1,741 vs 7,001 strategy)
- **30-50 activities** (from city slideshows)
- **10-15 transportation records** (from city popups)
- **15-20 lodging records** (from city popups)
- **15-20 restaurant records** (from city popups)

### 11.2 Sample Selection

**Countries (10):**
1. Japan (Asia, high content quality)
2. France (Europe, high content quality)
3. United States (North America, high content quality)
4. Brazil (South America, medium content quality)
5. Egypt (Africa, medium content quality)
6. Australia (Oceania, high content quality)
7. India (Asia, high content quality)
8. Mexico (North America, medium content quality)
9. Thailand (Asia, high content quality)
10. South Africa (Africa, medium content quality)

**Cities (25-50):**
- **15 cities with full content:** Tokyo, Paris, New York, Rio de Janeiro, Cairo, Sydney, Delhi, Mexico City, Bangkok, Cape Town, etc.
- **10-35 geographic-only cities:** Smaller cities from JSON without HTML pages

### 11.3 MVP Success Criteria

**Technical Validation:**
- ✅ Stable ID generation works correctly
- ✅ No duplicate entities created
- ✅ Geographic-only vs full content distinction works
- ✅ Provenance tracking functional
- ✅ Confidence levels assigned correctly
- ✅ Relationships (city→country) work
- ✅ Source system operational

**Data Quality:**
- ✅ All required fields populated
- ✅ No data loss during extraction
- ✅ Consistent naming conventions
- ✅ Valid geographic coordinates
- ✅ Schema compliance

**Architecture Validation:**
- ✅ Query interface returns correct data
- ✅ Filters work as expected
- ✅ Provenance included in responses
- ✅ Confidence reporting functional
- ✅ Performance acceptable

### 11.4 MVP Deliverables

1. **Extracted dataset** (JSON files) for sample
2. **ID generation logs** showing deterministic process
3. **Provenance records** for all extracted data
4. **Validation report** showing data quality
5. **Query interface prototype** for basic operations
6. **Performance metrics** for sample queries
7. **Migration documentation** for scaling to full dataset

### 11.5 MVP Risks and Mitigations

**Risk:** HTML parsing inconsistencies  
**Mitigation:** Manual review of sample extraction, refine parsing rules

**Risk:** ID collisions in sample  
**Mitigation:** Test ID generation on diverse sample, refine normalization

**Risk:** Provenance tracking complexity  
**Mitigation:** Simplify for MVP, enhance in full migration

**Risk:** Performance issues with query interface  
**Mitigation:** Test on sample, optimize before full migration

---

## 12. UNRESOLVED DECISIONS & RISKS

### 12.1 Decisions Requiring Sam's Approval

**Critical Path Decisions:**

1. **Data Model Approval**
   - Do the canonical schemas meet your needs?
   - Are any required fields missing?
   - Are any optional fields should be required?

2. **1,741 vs 7,001 Strategy**
   - Do you agree with single city entity approach?
   - Is the `has_detailed_content` flag sufficient?
   - Should we keep geographic-only cities in main dataset?

3. **Provenance Strategy**
   - Are the confidence levels appropriate?
   - Should legacy content have lower default confidence?
   - Do you agree with source type taxonomy?

4. **ID Generation Strategy**
   - Is `{city_name}-{country_iso2}` format acceptable?
   - Should we use different format for countries?
   - Are alias system requirements sufficient?

5. **Stale Data Strategy**
   - Do you agree with the 3-tier freshness classification?
   - Should any fields have different verification requirements?
   - Is the timestamp strategy too complex?

6. **Personal Knowledge Design**
   - Are the travel-specific relationship types sufficient?
   - Should we add any other relationship types?
   - Is the privacy model appropriate?

7. **Juan Query Interface**
   - Are the proposed query functions sufficient?
   - Should any functions be added or removed?
   - Is the response format appropriate?

8. **Migration Sequence**
   - Do you agree with the 5-phase approach?
   - Should any phases be reordered?
   - Is there anything missing from the sequence?

9. **MVP Scope**
   - Is the sample size (10 countries, 25-50 cities) appropriate?
   - Should the sample countries be different?
   - Are the success criteria comprehensive?

10. **Exclusions**
    - Do you agree with what should NOT be migrated?
    - Should anything currently excluded be included?
    - Should anything currently included be excluded?

### 12.2 Technical Risks

**High Priority Risks:**

1. **HTML Parsing Complexity**
   - Risk: Inconsistent HTML structure breaks extraction
   - Impact: Data loss or corruption
   - Mitigation: Extensive testing, manual review of sample

2. **ID Collision**
   - Risk: Duplicate names create ID conflicts
   - Risk: Geographic coordinates insufficient for disambiguation
   - Impact: Data integrity issues
   - Mitigation: Robust normalization, alias system, manual review

3. **Provenance Tracking Overhead**
   - Risk: Complex provenance requirements slow migration
   - Risk: Provenance data becomes unwieldy
   - Impact: Migration timeline, query performance
   - Mitigation: Simplify for MVP, iterate on complexity

4. **Performance Issues**
   - Risk: Large dataset (7,001 cities) causes query performance issues
   - Risk: Complex relationships slow down queries
   - Impact: User experience, system viability
   - Mitigation: Index optimization, query testing on sample

5. **Data Quality Variance**
   - Risk: Legacy content quality varies significantly
   - Risk: Outdated information presented as current
   - Impact: User trust, recommendation quality
   - Mitigation: Confidence levels, verification timestamps, user feedback

**Medium Priority Risks:**

6. **Legacy Content Authority**
   - Risk: Legacy content accidentally treated as authoritative
   - Risk: Users don't understand source limitations
   - Impact: Misinformation, user confusion
   - Mitigation: Clear provenance display, confidence warnings

7. **Personal Knowledge Privacy**
   - Risk: Personal data accidentally exposed
   - Risk: Insufficient access controls
   - Impact: Privacy violation, security issue
   - Mitigation: Strict access controls, data separation, audit logs

8. **Migration Timeline**
   - Risk: Full migration takes longer than expected
   - Risk: Complex extractions require manual intervention
   - Impact: Project delay, resource constraints
   - Mitigation: MVP approach, iterative migration, scope management

### 12.3 Open Questions

**Architecture Questions:**

1. Should we implement a separate "geographic-only" collection or use flags?
2. How should we handle cities that appear in both datasets with different coordinates?
3. Should we maintain the original HTML structure for reference?
4. How should we handle country territories and disputed regions?
5. Should we implement a hierarchical destination system (region → country → city)?

**Data Questions:**

6. What confidence level should default for legacy UNPACKED content?
7. How often should time-sensitive data be verified?
8. Should we implement automated data freshness checks?
9. How should we handle conflicting information from different sources?
10. Should we preserve the original "tourscore" system or develop new rating system?

**Technical Questions:**

11. What database technology should we use for the knowledge base?
12. Should we implement a GraphQL or REST API for Juan?
13. How should we handle image storage and hosting?
14. Should we implement full-text search capabilities?
15. How should we handle data backups and versioning?

**Process Questions:**

16. Who should review extracted data before it goes live?
17. What is the process for updating outdated information?
18. How should we handle user corrections to legacy data?
19. What is the process for adding new data sources?
20. How should we measure knowledge base quality over time?

---

## SUMMARY

This Phase 1.5 review establishes:

1. **Canonical data schemas** for all major entities with field-level requirements
2. **Identity strategy** using deterministic IDs with disambiguation rules
3. **Provenance system** to prevent legacy content from becoming silently authoritative
4. **Stale data strategy** with 3-tier freshness classification and verification requirements
5. **1,741 vs 7,001 city strategy** using single entities with content level flags
6. **Personal knowledge design** that is travel-specific and privacy-conscious
7. **Juan query interface** with provenance and confidence reporting
8. **Migration sequence** in 5 phases from geographic foundation to query interface
9. **Explicit exclusions** to prevent migrating non-travel knowledge
10. **MVP scope** to validate architecture before full migration

**Next Step:** Sam review and approval of decisions before Phase 2 implementation begins.