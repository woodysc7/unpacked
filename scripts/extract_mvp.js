#!/usr/bin/env node

/**
 * UNPACKED Knowledge Foundation MVP Extraction Script
 * 
 * Extracts a representative sample of countries and cities from legacy UNPACKED
 * to validate the knowledge base architecture before full migration.
 */

const fs = require('fs');
const path = require('path');
const cheerio = require('cheerio');

// Configuration
const CONFIG = {
  sampleCountries: [
    'japan', 'france', 'unitedstates', 'brazil', 'egypt',
    'australia', 'india', 'mexico', 'thailand', 'southafrica'
  ],
  sampleCities: [
    // Cities with full content (mapped to our sample countries)
    'tokyojapan', 'parisfrance', 'newyorkcityunitedstates', 'riodejaneirobrazil',
    'cairoegypt', 'sydneyaustralia', 'delhiindia', 'mexicocitymexico',
    'bangkokthailand', 'capetownsouthafrica'
  ],
  baseDir: path.join(__dirname, '..'),
  publicDir: path.join(__dirname, '..', 'public'),
  paidContentDir: path.join(__dirname, '..', 'public', 'PaidContent'),
  citiesJsonPath: path.join(__dirname, '..', 'public', 'PaidContent', 'cities', 'cities.json'),
  outputDir: path.join(__dirname, '..', 'knowledge'),
  sourcesDir: path.join(__dirname, '..', 'sources'),
  reviewDir: path.join(__dirname, '..', 'knowledge', 'review')
};

// Create output directories
[CONFIG.outputDir, CONFIG.sourcesDir, CONFIG.reviewDir].forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

// Utility functions
function generateCountryId(countryName) {
  // Normalize: lowercase, replace spaces/hyphens, remove special chars
  return countryName
    .toLowerCase()
    .replace(/[\s\-_]+/g, '')
    .replace(/[^a-z0-9]/g, '');
}

function generateCityId(cityName, countryId) {
  // Use existing slug from source if available, otherwise normalize
  const normalizedName = cityName
    .toLowerCase()
    .replace(/[\s\-_]+/g, '')
    .replace(/[^a-z0-9]/g, '');
  return `${normalizedName}-${countryId}`;
}

function getCurrentTimestamp() {
  return new Date().toISOString();
}

function validateCoordinates(lat, lon) {
  if (typeof lat !== 'number' || typeof lon !== 'number') {
    return false;
  }
  if (lat < -90 || lat > 90 || lon < -180 || lon > 180) {
    return false;
  }
  return true;
}

// Source management
const sourceRegistry = new Map();

function registerSource(sourceType, sourceId, additionalData = {}) {
  const key = `${sourceType}:${sourceId}`;
  if (!sourceRegistry.has(key)) {
    const source = {
      source_type: sourceType,
      source_id: sourceId,
      date_added: getCurrentTimestamp(),
      confidence: 'medium', // Default for legacy content
      ...additionalData
    };
    sourceRegistry.set(key, source);
  }
  return sourceRegistry.get(key);
}

// Data extraction
class CountryExtractor {
  constructor() {
    this.countries = [];
    this.errors = [];
    this.warnings = [];
  }

  extractFromHtml(countryName) {
    const countryDir = path.join(CONFIG.paidContentDir, 'Countries', countryName);
    const homeHtmlPath = path.join(countryDir, `${countryName}home.html`);

    if (!fs.existsSync(homeHtmlPath)) {
      this.warnings.push(`Country HTML not found: ${homeHtmlPath}`);
      return null;
    }

    try {
      const html = fs.readFileSync(homeHtmlPath, 'utf-8');
      const $ = cheerio.load(html);

      const countryId = generateCountryId(countryName);
      
      // Extract basic metadata
      const title = $('title').text().replace(/\s*\|\s*World Atlas/, '').trim();
      const aboutText = $('.about-section').text().replace(/About\s+\w+/, '').trim();
      
      // Extract stats
      const tourscore = this.extractStatValue($, 'Tourscore');
      const priceLevel = this.extractStatValue($, 'Price');
      const safetyLevel = this.extractStatValue($, 'Safety');
      const weather = this.extractStatValue($, 'Weather');
      const language = this.extractStatValue($, 'Language');
      const accessibility = this.extractStatValue($, 'Should I bring Grandma?');

      const source = registerSource('legacy_unpacked', `unpacked-${countryName}-home-html`, {
        name: `UNPACKED Country Home: ${countryName}`,
        extraction_method: 'automated_html_parser',
        extraction_date: getCurrentTimestamp(),
        fields_provided: ['name', 'overview', 'tourscore', 'price_level', 'safety_level', 'weather', 'language', 'accessibility_note']
      });

      const country = {
        country_id: countryId,
        name: countryName.charAt(0).toUpperCase() + countryName.slice(1), // Capitalize first letter
        overview: aboutText || null,
        tourscore: tourscore ? parseInt(tourscore) : null,
        price_level: priceLevel || null,
        safety_level: safetyLevel || null,
        weather_summary: weather || null,
        primary_language: language || null,
        accessibility_note: accessibility || null,
        sources: [source],
        confidence: 'medium', // Legacy content gets medium confidence
        knowledge_status: 'legacy_content',
        date_added: getCurrentTimestamp()
      };

      this.countries.push(country);
      return country;

    } catch (error) {
      this.errors.push(`Error extracting country ${countryName}: ${error.message}`);
      return null;
    }
  }

  extractStatValue($, statLabel) {
    const statLabelLower = statLabel.toLowerCase();
    let value = null;
    
    $('.stat-row').each((i, el) => {
      const label = $(el).find('.stat-label').text().toLowerCase();
      if (label.includes(statLabelLower)) {
        value = $(el).find('.stat-value').text().trim();
        return false; // Break
      }
    });
    
    return value;
  }

  getResults() {
    return {
      countries: this.countries,
      errors: this.errors,
      warnings: this.warnings,
      stats: {
        total: this.countries.length,
        errors: this.errors.length,
        warnings: this.warnings.length
      }
    };
  }
}

class CityExtractor {
  constructor(countriesMap) {
    this.cities = [];
    this.geographicCities = [];
    this.errors = [];
    this.warnings = [];
    this.duplicates = [];
    this.countriesMap = countriesMap; // Map of country names to country_ids
  }

  extractFromJson() {
    try {
      const jsonContent = fs.readFileSync(CONFIG.citiesJsonPath, 'utf-8');
      const citiesData = JSON.parse(jsonContent);

      // Only extract cities from our sample countries to keep MVP focused
      const sampleCountryIds = new Set(CONFIG.sampleCountries.map(c => generateCountryId(c)));

      citiesData.forEach((cityData, index) => {
        try {
          const countryName = cityData.country;
          const countryId = this.countriesMap.get(countryName) || generateCountryId(countryName);
          
          // Skip cities not in our sample countries
          if (!sampleCountryIds.has(countryId)) {
            return;
          }
          
          const cityId = generateCityId(cityData.name, countryId);
          
          // Check for duplicates
          const duplicate = this.geographicCities.find(c => c.city_id === cityId);
          if (duplicate) {
            this.duplicates.push({
              city_id: cityId,
              existing: { name: duplicate.name, country: duplicate.country_id },
              new: { name: cityData.name, country: countryId, lat: cityData.lat, lon: cityData.lon }
            });
            // Add disambiguation
            cityData.name = `${cityData.name}-${countryId}`;
          }

          // Validate coordinates
          if (!validateCoordinates(cityData.lat, cityData.lon)) {
            this.errors.push(`Invalid coordinates for ${cityData.name}: lat=${cityData.lat}, lon=${cityData.lon}`);
            return;
          }

          const source = registerSource('legacy_unpacked', 'unpacked-cities-json', {
            name: 'UNPACKED Cities Geographic Database',
            source_identifier: cityData.slug,
            extraction_method: 'json_parse',
            extraction_date: getCurrentTimestamp(),
            fields_provided: ['name', 'coordinates', 'country']
          });

          const city = {
            city_id: cityId,
            name: cityData.name.charAt(0).toUpperCase() + cityData.name.slice(1),
            country_id: countryId,
            coordinates: {
              lat: cityData.lat,
              lon: cityData.lon
            },
            knowledge_status: 'geographic_only',
            sources: [source],
            confidence: 'high', // Geographic coordinates are reliable
            date_added: getCurrentTimestamp()
          };

          this.geographicCities.push(city);

        } catch (error) {
          this.errors.push(`Error processing city at index ${index}: ${error.message}`);
        }
      });

    } catch (error) {
      this.errors.push(`Error reading cities.json: ${error.message}`);
    }
  }

  extractFromHtml(cityFilename, countryId) {
    const cityHtmlPath = path.join(CONFIG.paidContentDir, 'cities', `${cityFilename}.html`);

    if (!fs.existsSync(cityHtmlPath)) {
      this.warnings.push(`City HTML not found: ${cityHtmlPath}`);
      return null;
    }

    try {
      const html = fs.readFileSync(cityHtmlPath, 'utf-8');
      const $ = cheerio.load(html);

      const title = $('title').text().replace(/\s*\-\s*.+/, '').trim();
      const cityName = title.split(' - ')[0] || title;
      
      // Extract tourscore if present
      let tourscore = null;
      $('.tourscore-value').each((i, el) => {
        const text = $(el).text().trim();
        const match = text.match(/([\d.]+)/);
        if (match) {
          tourscore = parseFloat(match[1]);
        }
      });

      // Extract overview
      let overview = null;
      $('h3').each((i, el) => {
        if ($(el).text().includes('About')) {
          overview = $(el).next('p').text().trim();
          return false;
        }
      });

      const source = registerSource('legacy_unpacked', `unpacked-${cityFilename}-html`, {
        name: `UNPACKED City Guide: ${cityFilename}`,
        extraction_method: 'automated_html_parser',
        extraction_date: getCurrentTimestamp(),
        fields_provided: ['name', 'overview', 'tourscore']
      });

      const cityId = generateCityId(cityName.toLowerCase(), countryId);

      const city = {
        city_id: cityId,
        name: cityName,
        country_id: countryId,
        overview: overview,
        tourscore: tourscore,
        knowledge_status: 'legacy_content',
        sources: [source],
        confidence: 'medium',
        date_added: getCurrentTimestamp()
      };

      this.cities.push(city);
      return city;

    } catch (error) {
      this.errors.push(`Error extracting city ${cityFilename}: ${error.message}`);
      return null;
    }
  }

  getResults() {
    return {
      cities: this.cities,
      geographicCities: this.geographicCities,
      errors: this.errors,
      warnings: this.warnings,
      duplicates: this.duplicates,
      stats: {
        detailed: this.cities.length,
        geographic: this.geographicCities.length,
        total: this.cities.length + this.geographicCities.length,
        errors: this.errors.length,
        warnings: this.warnings.length,
        duplicates: this.duplicates.length
      }
    };
  }
}

// Report generation
function generateMigrationReport(countryResults, cityResults) {
  const report = {
    migration_timestamp: getCurrentTimestamp(),
    config: CONFIG,
    country_extraction: countryResults.stats,
    city_extraction: cityResults.stats,
    sources: Array.from(sourceRegistry.values()),
    quality_metrics: {
      determinism_test: 'PENDING',
      duplicate_handling: cityResults.duplicates.length > 0 ? 'DETECTED' : 'NONE',
      coordinate_validation: 'PENDING',
      relationship_integrity: 'PENDING'
    },
    issues: {
      country_errors: countryResults.errors,
      city_errors: cityResults.errors,
      country_warnings: countryResults.warnings,
      city_warnings: cityResults.warnings,
      duplicates: cityResults.duplicates
    },
    recommendations: []
  };

  // Add recommendations based on issues
  if (cityResults.duplicates.length > 0) {
    report.recommendations.push('Review duplicate city handling strategy');
  }
  if (countryResults.errors.length > 0 || cityResults.errors.length > 0) {
    report.recommendations.push('Review and fix extraction errors');
  }
  if (countryResults.warnings.length > 0 || cityResults.warnings.length > 0) {
    report.recommendations.push('Review extraction warnings for data quality');
  }

  return report;
}

// Main execution
async function main() {
  console.log('🚀 Starting UNPACKED Knowledge Foundation MVP Extraction');
  console.log(`📅 Timestamp: ${getCurrentTimestamp()}`);
  console.log(`📁 Base directory: ${CONFIG.baseDir}`);

  // Extract countries
  console.log('\n🌍 Extracting countries...');
  const countryExtractor = new CountryExtractor();
  CONFIG.sampleCountries.forEach(countryName => {
    console.log(`  Processing: ${countryName}`);
    countryExtractor.extractFromHtml(countryName);
  });
  const countryResults = countryExtractor.getResults();
  console.log(`  ✅ Countries extracted: ${countryResults.stats.total}`);
  console.log(`  ⚠️  Warnings: ${countryResults.stats.warnings}`);
  console.log(`  ❌ Errors: ${countryResults.stats.errors}`);

  // Build country map for city extraction
  const countriesMap = new Map();
  countryResults.countries.forEach(country => {
    countriesMap.set(country.name.toLowerCase(), country.country_id);
  });

  // Extract cities from JSON (geographic database)
  console.log('\n🏙️  Extracting cities from geographic database...');
  const cityExtractor = new CityExtractor(countriesMap);
  cityExtractor.extractFromJson();
  console.log(`  ✅ Geographic cities extracted: ${cityExtractor.geographicCities.length}`);

  // Extract detailed cities from HTML
  console.log('\n📖 Extracting detailed city guides...');
  CONFIG.sampleCities.forEach(cityFilename => {
    // Map city filenames to their actual countries
    const cityToCountryMap = {
      'tokyojapan': 'japan',
      'parisfrance': 'france', 
      'newyorkcityunitedstates': 'unitedstates',
      'riodejaneirobrazil': 'brazil',
      'cairoegypt': 'egypt',
      'sydneyaustralia': 'australia',
      'delhiindia': 'india',
      'mexicocitymexico': 'mexico',
      'bangkokthailand': 'thailand',
      'capetownsouthafrica': 'southafrica'
    };
    
    const countryName = cityToCountryMap[cityFilename];
    if (!countryName) {
      console.log(`  ⚠️  Skipping ${cityFilename} - no country mapping`);
      return;
    }
    
    const countryId = countriesMap.get(countryName) || generateCountryId(countryName);
    console.log(`  Processing: ${cityFilename} (country: ${countryId})`);
    cityExtractor.extractFromHtml(cityFilename, countryId);
  });
  const cityResults = cityExtractor.getResults();
  console.log(`  ✅ Detailed cities extracted: ${cityResults.stats.detailed}`);
  console.log(`  ⚠️  Warnings: ${cityResults.stats.warnings}`);
  console.log(`  ❌ Errors: ${cityResults.stats.errors}`);
  console.log(`  🔀 Duplicates detected: ${cityResults.stats.duplicates}`);

  // Write output files
  console.log('\n💾 Writing output files...');

  // Write countries
  fs.writeFileSync(
    path.join(CONFIG.outputDir, 'countries.json'),
    JSON.stringify(countryResults.countries, null, 2)
  );
  console.log(`  ✅ countries.json (${countryResults.countries.length} records)`);

  // Write cities (merged detailed + geographic)
  const allCities = [...cityResults.cities, ...cityResults.geographicCities];
  fs.writeFileSync(
    path.join(CONFIG.outputDir, 'cities.json'),
    JSON.stringify(allCities, null, 2)
  );
  console.log(`  ✅ cities.json (${allCities.length} records)`);

  // Write sources
  fs.writeFileSync(
    path.join(CONFIG.sourcesDir, 'sources.json'),
    JSON.stringify(Array.from(sourceRegistry.values()), null, 2)
  );
  console.log(`  ✅ sources.json (${sourceRegistry.size} records)`);

  // Write problematic records for review
  const problematicRecords = {
    country_errors: countryResults.errors,
    city_errors: cityResults.errors,
    duplicates: cityResults.duplicates
  };
  fs.writeFileSync(
    path.join(CONFIG.reviewDir, 'problematic_records.json'),
    JSON.stringify(problematicRecords, null, 2)
  );
  console.log(`  ✅ review/problematic_records.json`);

  // Generate and write migration report
  const migrationReport = generateMigrationReport(countryResults, cityResults);
  fs.writeFileSync(
    path.join(CONFIG.outputDir, 'migration_report.json'),
    JSON.stringify(migrationReport, null, 2)
  );
  console.log(`  ✅ migration_report.json`);

  console.log('\n🎉 MVP Extraction Complete!');
  console.log('\n📊 Summary:');
  console.log(`  Countries: ${countryResults.stats.total}`);
  console.log(`  Cities (total): ${cityResults.stats.total}`);
  console.log(`  - Detailed: ${cityResults.stats.detailed}`);
  console.log(`  - Geographic: ${cityResults.stats.geographic}`);
  console.log(`  Sources: ${sourceRegistry.size}`);
  console.log(`  Errors: ${countryResults.stats.errors + cityResults.stats.errors}`);
  console.log(`  Warnings: ${countryResults.stats.warnings + cityResults.stats.warnings}`);
  console.log(`  Duplicates: ${cityResults.stats.duplicates}`);

  if (countryResults.errors.length > 0 || cityResults.errors.length > 0) {
    console.log('\n⚠️  Extraction completed with errors. Review problematic_records.json');
    process.exit(1);
  }
}

// Run the extraction
main().catch(error => {
  console.error('❌ Fatal error during extraction:', error);
  process.exit(1);
});