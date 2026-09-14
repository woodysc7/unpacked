# UNPACKED Knowledge Base Content Mapping

**Purpose:** Map existing travel website content to future knowledge base architecture

## Future Architecture Target

```
UNPACKED Knowledge Base
├── destinations          # Travel destinations (countries, regions)
├── countries             # Country-level information  
├── cities                # City-level detailed information
├── transportation        # Getting around, logistics
├── lodging               # Hotels, hostels, accommodations
├── activities            # Things to do, attractions
├── food                  # Restaurants, cuisine, dining
├── personal experiences  # Sam's travel experiences
├── travel history        # Historical travel data
└── recommendations       # Curated recommendations
```

---

## Content Mapping: Current → Future

### 📍 DESTINATIONS ← Current: Countries + Context

**Source Data:**
- `public/PaidContent/Countries/{country}/{country}home.html`
- Country metadata and overview information

**Mapping Fields:**
- **Destination Name:** Country name from HTML title/content
- **Overview:** "About {Country}" section content
- **Tourscore:** Stats bar tourscore value (0-100)
- **Price Level:** Stats bar price category (Affordable/Moderate/Expensive)
- **Safety Rating:** Stats bar safety assessment
- **Best Time to Visit:** Weather information from stats
- **Language:** Primary language(s) from stats
- **Accessibility:** "Should I bring Grandma?" rating
- **Region:** Geographic region (derive from country)
- **Coordinates:** From territory_coords.json

**Example Extraction (France):**
```json
{
  "destination_type": "country",
  "name": "France",
  "overview": "Embark on a sensory journey through France, where every cobblestone street tells a story...",
  "tourscore": 85,
  "price_level": "Moderate",
  "safety": "Safe",
  "weather": "Varied climate with distinct seasons",
  "language": "French",
  "accessibility_rating": "Suitable for most travelers",
  "coordinates": { "lat": 46.2276, "lon": 2.2137 }
}
```

---

### 🏛️ COUNTRIES ← Current: Country Detail Pages

**Source Data:**
- `public/PaidContent/Countries/{country}/{country}more.html`
- `public/PaidContent/Countries/{country}/{country}cityguide.html`

**Mapping Fields:**
- **Country Name:** Standardized country name
- **ISO Codes:** Derive from country name (ISO2, ISO3)
- **Capital City:** Extract from cityguide or external data
- **Population:** Extract if available in content
- **Currency:** Derive from country or add manually
- **Major Cities:** List from cityguide page
- **Transportation Overview:** From more.html transportation sections
- **Cultural Notes:** From descriptive content
- **Historical Context:** From about sections
- **Bordering Countries:** Derive from geographic data

**Example Structure:**
```json
{
  "country_id": "france",
  "name": "France",
  "iso2": "FR",
  "iso3": "FRA",
  "capital": "Paris",
  "population": 67000000,
  "currency": "EUR",
  "major_cities": ["Paris", "Lyon", "Marseille", "Nice"],
  "transportation": {
    "overview": "Extensive rail network, international airports",
    "rail_network": "TGV high-speed trains connect major cities",
    "airports": ["CDG", "ORY", "NCE"]
  },
  "culture": {
    "language": "French",
    "cuisine": "Known for wine, cheese, pastries",
    "customs": "Meal times, dining etiquette"
  }
}
```

---

### 🏙️ CITIES ← Current: City HTML Files

**Source Data:**
- `public/PaidContent/cities/{cityname}.html` (1,741 files)
- `public/PaidContent/cities/cities.json` (7,001 entries)

**Mapping Fields:**
- **City Name:** From HTML title and filename
- **Country:** Parent country (derive from filename or content)
- **Coordinates:** From cities.json or parse from filename
- **Overview:** "About {City}" section content
- **Tourscore:** From tourscore tag in city page
- **Weather:** Current weather display data
- **Accommodations:** Extract from accommodations popup
- **Transportation:** Extract from transportation popup  
- **Restaurants:** Extract from restaurants popup
- **Nightlife:** Extract from evenings popup (bars, nightlife, weekly)
- **Attractions:** From slideshow captions
- **Blog References:** External blog links
- **Photo Gallery:** Image URLs and captions from slideshow

**Example Extraction (Abu Dhabi):**
```json
{
  "city_id": "abu-dhabi-united-arab-emirates",
  "name": "Abu Dhabi",
  "country": "United Arab Emirates",
  "coordinates": { "lat": 24.4539, "lon": 54.3773 },
  "overview": "Abu Dhabi, the capital of the UAE, seamlessly blends modern luxury with rich cultural heritage...",
  "tourscore": 85.0,
  "accommodations": {
    "hotels": [
      {
        "name": "Emirates Palace",
        "description": "This iconic luxury hotel is known for its grand architecture, exquisite Arabian decor..."
      },
      {
        "name": "The St. Regis Abu Dhabi", 
        "description": "Situated on the vibrant Corniche waterfront, this sophisticated hotel..."
      }
    ],
    "hostels": [
      {
        "name": "Oriental Hotel Apartments",
        "description": "Located in the heart of Abu Dhabi, this hostel offers affordable accommodation..."
      }
    ]
  },
  "transportation": {
    "overview": "The best ways for a visitor to get around Abu Dhabi include taking advantage of the efficient public transportation system...",
    "options": ["Public buses", "Metro", "Walking", "Rideshare (Uber, Careem)"]
  },
  "restaurants": [
    {
      "name": "Emirates Palace BBQ Al Qasr",
      "description": "Located within the luxurious Emirates Palace hotel, this restaurant is known for its delicious Arabic barbecue dishes..."
    }
  ],
  "nightlife": {
    "bars": [
      {
        "name": "Ray's Bar",
        "description": "Located on the 62nd floor of Jumeirah at Etihad Towers, this chic rooftop bar offers stunning panoramic views..."
      }
    ],
    "clubs": [
      {
        "name": "MAD on Yas Island",
        "description": "A popular nightclub situated in the heart of Yas Island, known for its lively ambiance..."
      }
    ],
    "weekly_itinerary": {
      "monday": "Start your week with a visit to the Sheikh Zayed Grand Mosque...",
      "tuesday": "Explore the Louvre Abu Dhabi...",
      "wednesday": "Enjoy a leisurely stroll along the Corniche waterfront promenade..."
    }
  },
  "attractions": [
    {
      "name": "Sheikh Zayed Grand Mosque",
      "description": "Stunning white marble mosque with intricate design",
      "image_url": "https://images.unsplash.com/photo-1628005926648-89d119e48b52..."
    },
    {
      "name": "Louvre Abu Dhabi", 
      "description": "Art museum featuring global masterpieces and cultural exhibitions",
      "image_url": "https://images.unsplash.com/photo-1728848808387-fcdf6974329e..."
    }
  ],
  "blogs": [
    {
      "title": "Dubai Travel Guide: Planning Your First Trip to Dubai",
      "url": "https://thesophisticatedlife.com/blog/dubai-travel-guide-first-time-visitors/"
    }
  ]
}
```

---

### 🚗 TRANSPORTATION ← Current: City Transportation Sections

**Source Data:**
- Transportation popups in city HTML files
- Country transportation overviews

**Mapping Fields:**
- **City/Country ID:** Parent location
- **Transport Type:** Public transit, rideshare, walking, etc.
- **Cost Estimates:** Price information if available
- **Tips & Recommendations:** Practical advice
- **Coverage Areas:** Where transportation is available
- **Reliability:** Quality assessments

**Example Structure:**
```json
{
  "transportation_id": "abu-dhabi-public-transit",
  "location_id": "abu-dhabi-united-arab-emirates",
  "type": "public_transit",
  "description": "Efficient public transportation system with buses and modern metro",
  "options": ["Buses", "Metro", "Walking"],
  "cost_level": "Affordable",
  "coverage": "City-wide with good coverage of major attractions",
  "tips": "Use rideshare apps like Uber and Careem for convenient point-to-point travel"
}
```

---

### 🏨 LODGING ← Current: Accommodations Data

**Source Data:**
- Accommodations popups in city HTML files
- Hotel and hostel recommendations

**Mapping Fields:**
- **Property Name:** Hotel/hostel name
- **Location ID:** Parent city
- **Type:** Hotel, hostel, apartment, etc.
- **Price Range:** Budget/Mid-range/Luxury (derive from descriptions)
- **Description:** Detailed property description
- **Amenities:** Extract from descriptions (WiFi, breakfast, etc.)
- **Location Context:** Area of city, proximity to attractions
- **Rating:** Tourscore or quality indicators

**Example Structure:**
```json
{
  "lodging_id": "emirates-palace-abu-dhabi",
  "name": "Emirates Palace",
  "location_id": "abu-dhabi-united-arab-emirates",
  "type": "luxury_hotel",
  "price_range": "Luxury",
  "description": "This iconic luxury hotel is known for its grand architecture, exquisite Arabian decor, and impeccable service...",
  "amenities": ["Private beach", "Award-winning restaurants", "Lavish spa", "Opulent rooms"],
  "area": "Corniche waterfront",
  "proximity_to_attractions": ["Sheikh Zayed Grand Mosque", "City center"]
}
```

---

### 🎯 ACTIVITIES ← Current: Attractions & Slideshows

**Source Data:**
- Slideshow captions in city HTML files
- Attraction descriptions
- Tour score data

**Mapping Fields:**
- **Activity Name:** Attraction or activity name
- **Location ID:** Parent city
- **Type:** Sightseeing, cultural, adventure, etc.
- **Description:** Detailed description
- **Image URL:** Photo from slideshow
- **Best Time to Visit:** If mentioned
- **Cost:** Price information if available
- **Duration:** Time needed if mentioned
- **Tips:** Practical advice

**Example Structure:**
```json
{
  "activity_id": "sheikh-zayed-grand-mosque",
  "name": "Sheikh Zayed Grand Mosque",
  "location_id": "abu-dhabi-united-arab-emirates", 
  "type": "cultural_sightseeing",
  "description": "Stunning white marble mosque with intricate design",
  "image_url": "https://images.unsplash.com/photo-1628005926648-89d119e48b52...",
  "best_time_to_visit": "Early morning or late afternoon for best lighting",
  "cost": "Free",
  "duration": "2-3 hours",
  "tips": "Dress modestly, respect prayer times"
}
```

---

### 🍽️ FOOD ← Current: Restaurant Data

**Source Data:**
- Restaurant popups in city HTML files
- Dining recommendations

**Mapping Fields:**
- **Restaurant Name:** Establishment name
- **Location ID:** Parent city
- **Cuisine Type:** Derive from description
- **Price Range:** Budget/Mid-range/Luxury
- **Description:** Food and ambiance description
- **Signature Dishes:** Specific menu items mentioned
- **Area:** Neighborhood or location within city
- **Atmosphere:** Casual, fine dining, etc.

**Example Structure:**
```json
{
  "restaurant_id": "emirates-palace-bbq-al-qasr",
  "name": "Emirates Palace BBQ Al Qasr",
  "location_id": "abu-dhabi-united-arab-emirates",
  "cuisine_type": "Arabic BBQ",
  "price_range": "Luxury",
  "description": "Located within the luxurious Emirates Palace hotel, this restaurant is known for its delicious Arabic barbecue dishes...",
  "signature_dishes": ["Lamb chops", "Kebabs", "Kofta"],
  "area": "Emirates Palace grounds",
  "atmosphere": "Elegant with palace grounds views"
}
```

---

### 📝 PERSONAL EXPERIENCES ← Current: To Be Added

**Source Data:** 
- Currently not present in repository
- Will need to be added by Sam

**Mapping Fields:**
- **Experience ID:** Unique identifier
- **Date:** Travel date
- **Location ID:** Where experience occurred
- **Experience Type:** Visit, stay, activity, etc.
- **Rating:** Personal rating (1-5)
- **Notes:** Personal thoughts and recommendations
- **Photos:** Personal photos if available
- **Cost:** Actual cost paid
- **Companions:** Who traveled with

**Example Structure:**
```json
{
  "experience_id": "sam-france-2024-06",
  "date": "2024-06-15",
  "location_id": "paris-france",
  "experience_type": "city_visit",
  "rating": 5,
  "notes": "Amazing time in Paris, loved the Montmartre neighborhood...",
  "photos": ["photo1.jpg", "photo2.jpg"],
  "cost": 2500,
  "companions": ["friend1", "friend2"]
}
```

---

### 📅 TRAVEL HISTORY ← Current: To Be Added

**Source Data:**
- Currently not present in repository
- Will need to be added by Sam

**Mapping Fields:**
- **Trip ID:** Unique identifier
- **Start Date:** Trip start
- **End Date:** Trip end
- **Destinations:** List of location IDs
- **Purpose:** Leisure, business, etc.
- **Budget:** Planned vs actual
- **Highlights:** Best experiences
- **Challenges:** Issues encountered
- **Recommendations:** Would/wouldn't recommend

**Example Structure:**
```json
{
  "trip_id": "europe-2024-summer",
  "start_date": "2024-06-01",
  "end_date": "2024-06-15",
  "destinations": ["paris-france", "nice-france", "monaco"],
  "purpose": "leisure",
  "budget": { "planned": 5000, "actual": 4800 },
  "highlights": ["Louvre visit", "Montmartre exploration"],
  "challenges": ["Train strike delayed travel"],
  "recommendations": "Would definitely return to French Riviera"
}
```

---

### ⭐ RECOMMENDATIONS ← Current: Tourscore + Tips

**Source Data:**
- Tourscore ratings from country/city pages
- Travel tips from Atlas.html
- "Should I bring Grandma?" accessibility ratings

**Mapping Fields:**
- **Recommendation ID:** Unique identifier
- **Location ID:** Related location
- **Type:** General, accessibility, safety, etc.
- **Rating:** Numerical score or category
- **Reasoning:** Why this recommendation
- **Target Audience:** Who this is for
- **Date:** When recommendation was made

**Example Structure:**
```json
{
  "recommendation_id": "france-general-recommendation",
  "location_id": "france",
  "type": "general",
  "rating": "Highly Recommended",
  "tourscore": 85,
  "reasoning": "Excellent culture, food, and transportation infrastructure",
  "target_audience": "General travelers",
  "accessibility_note": "Suitable for most travelers, good infrastructure"
}
```

---

## Data Extraction Priorities

### Phase 1: Core Geographic Data (High Priority)
1. **Countries:** Extract basic country metadata from all 254 countries
2. **Cities:** Extract city coordinates and basic info from 7,001 cities in JSON
3. **Relationships:** Link cities to countries

### Phase 2: Detailed Content (Medium Priority)  
1. **City Details:** Extract accommodations, transportation, restaurants from 1,741 city pages
2. **Country Details:** Extract transportation, cultural info from country pages
3. **Attractions:** Extract slideshow data and attraction descriptions

### Phase 3: Enhanced Features (Lower Priority)
1. **Blog References:** Extract external blog links
2. **Photo Metadata:** Organize image URLs and captions
3. **Tourscore Analysis:** Normalize tourscore data across locations

---

## Technical Extraction Strategy

### HTML Parsing Approach
1. **Use Cheerio or similar** for HTML parsing
2. **Target specific CSS classes** for consistent extraction
3. **Handle inconsistent formatting** with regex fallbacks
4. **Validate extracted data** against expected schemas

### Data Normalization
1. **Country names:** Standardize to common names (ISO3166)
2. **City names:** Handle duplicates with country context
3. **Coordinates:** Validate lat/lon ranges
4. **Currency:** Standardize to ISO 4217 codes
5. **Languages:** Use ISO 639 codes

### Relationship Mapping
1. **City → Country:** Use filename patterns and content links
2. **Attractions → Cities:** From page structure
3. **Restaurants → Cities:** From page structure
4. **Hotels → Cities:** From page structure

---

## Quality Assurance

### Validation Checks
- **Completeness:** All countries have required fields
- **Consistency:** Naming conventions followed
- **Accuracy:** Coordinates within valid ranges
- **Relationships:** All links resolve to valid IDs
- **Duplicates:** Identify and handle duplicate entries

### Sample Testing
- **Test extraction** on 10 countries, 50 cities
- **Validate data quality** against known correct values
- **Test relationships** between entities
- **Verify schema compliance**

---

## Migration Success Criteria

### Data Completeness
- ✅ All 254 countries extracted with core data
- ✅ All 1,741 detailed cities extracted with full content
- ✅ All 7,001 geographic cities extracted with coordinates
- ✅ Relationships established between all entities

### Data Quality
- ✅ No data loss during extraction
- ✅ Consistent naming conventions
- ✅ Valid geographic coordinates
- ✅ Complete relationship mapping

### Schema Compliance
- ✅ All data conforms to knowledge base schema
- ✅ Required fields populated for all entities
- ✅ Optional fields handled gracefully
- ✅ Data types validated

---

## Next Steps

1. **Review this mapping** with Sam for approval
2. **Create extraction scripts** for each content type
3. **Set up development environment** for testing
4. **Run extraction on sample data**
5. **Validate and refine extraction process**
6. **Execute full extraction**
7. **Load data into knowledge base structure**
8. **Validate final results**