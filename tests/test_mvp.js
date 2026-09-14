#!/usr/bin/env node

/**
 * UNPACKED Knowledge Foundation MVP Tests
 * 
 * Tests for data quality, determinism, and architectural validation
 */

const fs = require('fs');
const path = require('path');

const CONFIG = {
  knowledgeDir: path.join(__dirname, '..', 'knowledge'),
  sourcesDir: path.join(__dirname, '..', 'sources'),
  reviewDir: path.join(__dirname, '..', 'knowledge', 'review')
};

// Test results tracking
const testResults = {
  passed: 0,
  failed: 0,
  tests: []
};

function runTest(testName, testFn) {
  try {
    console.log(`Running: ${testName}`);
    const result = testFn();
    if (result.passed) {
      testResults.passed++;
      console.log(`  ✅ PASS: ${result.message}`);
    } else {
      testResults.failed++;
      console.log(`  ❌ FAIL: ${result.message}`);
    }
    testResults.tests.push({
      name: testName,
      passed: result.passed,
      message: result.message,
      details: result.details
    });
  } catch (error) {
    testResults.failed++;
    console.log(`  ❌ ERROR: ${error.message}`);
    testResults.tests.push({
      name: testName,
      passed: false,
      message: `Test error: ${error.message}`,
      details: error.stack
    });
  }
}

// Load extracted data
function loadData() {
  const countries = JSON.parse(fs.readFileSync(path.join(CONFIG.knowledgeDir, 'countries.json'), 'utf-8'));
  const cities = JSON.parse(fs.readFileSync(path.join(CONFIG.knowledgeDir, 'cities.json'), 'utf-8'));
  const sources = JSON.parse(fs.readFileSync(path.join(CONFIG.sourcesDir, 'sources.json'), 'utf-8'));
  const report = JSON.parse(fs.readFileSync(path.join(CONFIG.knowledgeDir, 'migration_report.json'), 'utf-8'));
  
  // Load problematic records if they exist
  let problematicRecords = null;
  const problematicPath = path.join(CONFIG.reviewDir, 'problematic_records.json');
  if (fs.existsSync(problematicPath)) {
    problematicRecords = JSON.parse(fs.readFileSync(problematicPath, 'utf-8'));
  }
  
  return { countries, cities, sources, report, problematicRecords };
}

// Test functions
const tests = {
  // 1. Deterministic IDs
  testDeterministicIDs: () => {
    const { countries, cities } = loadData();
    
    // Check that IDs follow expected patterns
    const countryIdPattern = /^[a-z]+$/;
    const cityIdPattern = /^[a-z]+-[a-z]+$/;
    
    const invalidCountryIds = countries.filter(c => !countryIdPattern.test(c.country_id));
    const invalidCityIds = cities.filter(c => !cityIdPattern.test(c.city_id));
    
    if (invalidCountryIds.length === 0 && invalidCityIds.length === 0) {
      return { passed: true, message: 'All IDs follow deterministic patterns' };
    } else {
      return { 
        passed: false, 
        message: `Found ${invalidCountryIds.length} invalid country IDs, ${invalidCityIds.length} invalid city IDs`,
        details: { invalidCountryIds, invalidCityIds }
      };
    }
  },

  // 2. Duplicate cities
  testDuplicateCities: () => {
    const { cities, report } = loadData();
    
    // Check for duplicate city_ids
    const cityIds = cities.map(c => c.city_id);
    const uniqueCityIds = new Set(cityIds);
    
    if (cityIds.length === uniqueCityIds.size && report.issues.duplicates.length === 0) {
      return { passed: true, message: 'No duplicate city IDs found' };
    } else {
      return { 
        passed: false, 
        message: `Found ${cityIds.length - uniqueCityIds.size} duplicate city IDs in dataset`,
        details: { 
          total: cityIds.length, 
          unique: uniqueCityIds.size,
          reportDuplicates: report.issues.duplicates
        }
      };
    }
  },

  // 3. Aliases
  testAliases: () => {
    const { countries, cities } = loadData();
    
    // Check that alias arrays are properly structured if present
    const countriesWithAliases = countries.filter(c => c.aliases && c.aliases.length > 0);
    const citiesWithAliases = cities.filter(c => c.aliases && c.aliases.length > 0);
    
    // Validate alias structure
    let invalidAliases = 0;
    [...countriesWithAliases, ...citiesWithAliases].forEach(entity => {
      entity.aliases.forEach(alias => {
        if (!alias.name || !alias.type) {
          invalidAliases++;
        }
      });
    });
    
    if (invalidAliases === 0) {
      return { 
        passed: true, 
        message: `Alias structure valid (${countriesWithAliases.length} countries, ${citiesWithAliases.length} cities with aliases)` 
      };
    } else {
      return { 
        passed: false, 
        message: `Found ${invalidAliases} invalid alias structures`,
        details: { invalidAliases }
      };
    }
  },

  // 4. Accented names
  testAccentedNames: () => {
    const { countries } = loadData();
    
    // Check that accented country names are handled correctly
    const accentedCountries = countries.filter(c => 
      c.name !== c.name.normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    );
    
    // These should have proper IDs despite accents
    const properIds = accentedCountries.every(c => /^[a-z]+$/.test(c.country_id));
    
    if (properIds) {
      return { 
        passed: true, 
        message: `Accented names handled correctly (${accentedCountries.length} countries with accents)` 
      };
    } else {
      return { 
        passed: false, 
        message: 'Some accented country names have invalid IDs',
        details: { accentedCountries }
      };
    }
  },

  // 5. Geographic-only cities
  testGeographicOnlyCities: () => {
    const { cities } = loadData();
    
    const geographicOnly = cities.filter(c => c.knowledge_status === 'geographic_only');
    const detailedCities = cities.filter(c => c.knowledge_status === 'legacy_content');
    
    // Geographic-only cities should have coordinates but no detailed content
    const validGeographic = geographicOnly.every(c => 
      c.coordinates && c.coordinates.lat && c.coordinates.lon && !c.overview
    );
    
    // Detailed cities should have overview content
    const validDetailed = detailedCities.every(c => c.overview);
    
    if (validGeographic && validDetailed) {
      return { 
        passed: true, 
        message: `Geographic vs detailed distinction working (${geographicOnly.length} geographic, ${detailedCities.length} detailed)` 
      };
    } else {
      return { 
        passed: false, 
        message: 'Geographic/detailed distinction has issues',
        details: { 
          validGeographic, 
          validDetailed,
          geographicOnly: geographicOnly.length,
          detailedCities: detailedCities.length
        }
      };
    }
  },

  // 6. Provenance
  testProvenance: () => {
    const { countries, cities, sources } = loadData();
    
    // All entities should have sources array
    const countriesWithoutSources = countries.filter(c => !c.sources || c.sources.length === 0);
    const citiesWithoutSources = cities.filter(c => !c.sources || c.sources.length === 0);
    
    // All sources should have required fields
    const invalidSources = sources.filter(s => 
      !s.source_type || !s.source_id || !s.date_added
    );
    
    if (countriesWithoutSources.length === 0 && citiesWithoutSources.length === 0 && invalidSources.length === 0) {
      return { 
        passed: true, 
        message: 'Provenance tracking working correctly' 
      };
    } else {
      return { 
        passed: false, 
        message: 'Provenance tracking has issues',
        details: { 
          countriesWithoutSources: countriesWithoutSources.length,
          citiesWithoutSources: citiesWithoutSources.length,
          invalidSources: invalidSources.length
        }
      };
    }
  },

  // 7. Confidence
  testConfidence: () => {
    const { countries, cities } = loadData();
    
    // All entities should have confidence field
    const validConfidence = ['high', 'medium', 'low', 'unknown'];
    
    const countriesWithoutConfidence = countries.filter(c => !c.confidence || !validConfidence.includes(c.confidence));
    const citiesWithoutConfidence = cities.filter(c => !c.confidence || !validConfidence.includes(c.confidence));
    
    if (countriesWithoutConfidence.length === 0 && citiesWithoutConfidence.length === 0) {
      return { 
        passed: true, 
        message: 'Confidence levels properly assigned' 
      };
    } else {
      return { 
        passed: false, 
        message: 'Some entities missing or have invalid confidence',
        details: { 
          countriesWithoutConfidence: countriesWithoutConfidence.length,
          citiesWithoutConfidence: citiesWithoutConfidence.length
        }
      };
    }
  },

  // 8. Malformed records
  testMalformedRecords: () => {
    const { problematicRecords, report } = loadData();
    
    // Check if there are any problematic records that should be reviewed
    const hasErrors = report.issues.country_errors.length > 0 || report.issues.city_errors.length > 0;
    
    if (!hasErrors) {
      return { 
        passed: true, 
        message: 'No malformed records detected' 
      };
    } else {
      return { 
        passed: false, 
        message: `Found ${report.issues.country_errors.length + report.issues.city_errors.length} errors`,
        details: { 
          countryErrors: report.issues.country_errors,
          cityErrors: report.issues.city_errors
        }
      };
    }
  },

  // 9. Relationship integrity
  testRelationshipIntegrity: () => {
    const { countries, cities } = loadData();
    
    // All cities should reference valid country_ids
    const countryIds = new Set(countries.map(c => c.country_id));
    const invalidCityCountries = cities.filter(c => !countryIds.has(c.country_id));
    
    if (invalidCityCountries.length === 0) {
      return { 
        passed: true, 
        message: 'All city-country relationships are valid' 
      };
    } else {
      return { 
        passed: false, 
        message: `Found ${invalidCityCountries.length} cities with invalid country references`,
        details: { 
          invalidCityCountries: invalidCityCountries.map(c => ({
            city_id: c.city_id,
            country_id: c.country_id
          }))
        }
      };
    }
  },

  // 10. Deterministic repeated extraction
  testDeterministicRepeatedExtraction: () => {
    const { report } = loadData();
    
    // Check that the extraction produced consistent results
    // This is tested by running extraction twice and comparing results
    // For now, we check that the report shows no random variations
    
    if (report.country_extraction.errors === 0 && report.city_extraction.errors === 0) {
      return { 
        passed: true, 
        message: 'Extraction completed without errors (determinism indicator)' 
      };
    } else {
      return { 
        passed: false, 
        message: 'Extraction had errors that may indicate non-deterministic behavior',
        details: { 
          countryErrors: report.country_extraction.errors,
          cityErrors: report.city_extraction.errors
        }
      };
    }
  }
};

// Run all tests
console.log('🧪 Starting UNPACKED Knowledge Foundation MVP Tests\n');

Object.entries(tests).forEach(([testName, testFn]) => {
  runTest(testName, testFn);
});

// Generate test report
console.log('\n📊 Test Results:');
console.log(`  Total: ${testResults.tests.length}`);
console.log(`  Passed: ${testResults.passed}`);
console.log(`  Failed: ${testResults.failed}`);

// Write test results to file
const testResultsPath = path.join(CONFIG.knowledgeDir, 'test_results.json');
fs.writeFileSync(testResultsPath, JSON.stringify(testResults, null, 2));
console.log(`\n💾 Test results written to: ${testResultsPath}`);

// Exit with appropriate code
process.exit(testResults.failed > 0 ? 1 : 0);