#!/usr/bin/env node

/**
 * UNPACKED Knowledge Foundation Phase 2A Tests
 *
 * Tests for data quality, determinism, and architectural validation of the corrected MVP.
 */

const fs = require("fs");
const path = require("path");
const assert = require("assert");
const { execSync } = require("child_process");
const os = require("os");

const CONFIG = {
  knowledgeDir: path.join(__dirname, "..", "knowledge"),
  schemasDir: path.join(__dirname, "..", "schemas"),
  reviewDir: path.join(__dirname, "..", "knowledge", "review"),
  extractionScript: path.join(__dirname, "..", "scripts", "phase2a_extraction.js"),
};

const Ajv = require("ajv");
const addFormats = require("ajv-formats");
const ajv = new Ajv({ allErrors: true });
addFormats(ajv);

// --- Test Runner ---

const testResults = { passed: 0, failed: 0, tests: [] };

function runTest(name, testFn) {
  try {
    testFn();
    testResults.passed++;
    testResults.tests.push({ name, passed: true, message: "OK" });
    console.log(`✅ PASS: ${name}`);
  } catch (error) {
    testResults.failed++;
    testResults.tests.push({ name, passed: false, message: error.message });
    console.error(`❌ FAIL: ${name}`);
    console.error(error);
  }
}

// --- Load Data and Schemas ---

function loadJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf-8"));
}

const countries = loadJson(path.join(CONFIG.knowledgeDir, "countries.json"));
const cities = loadJson(path.join(CONFIG.knowledgeDir, "cities.json"));
const problematicRecords = loadJson(path.join(CONFIG.reviewDir, "problematic_records.json"));

const countrySchema = loadJson(path.join(CONFIG.schemasDir, "country.schema.json"));
const citySchema = loadJson(path.join(CONFIG.schemasDir, "city.schema.json"));
const sourceSchema = loadJson(path.join(CONFIG.schemasDir, "source.schema.json"));

ajv.addSchema(sourceSchema, "source.schema.json");

// --- Test Definitions ---

runTest("Schema Validation: Countries", () => {
  const validate = ajv.compile(countrySchema);
  for (const country of countries) {
    const valid = validate(country);
    if (!valid) {
        console.error(ajv.errorsText(validate.errors));
        assert(valid, `Invalid country: ${country.name}`);
    }
  }
});

runTest("Schema Validation: Cities", () => {
  const validate = ajv.compile(citySchema);
  for (const city of cities) {
    const valid = validate(city);
    if (!valid) {
        console.error(ajv.errorsText(validate.errors));
        assert(valid, `Invalid city: ${city.name}`);
    }
  }
});

runTest("Unique Country IDs", () => {
  const ids = new Set();
  for (const country of countries) {
    assert(!ids.has(country.country_id), `Duplicate country ID: ${country.country_id}`);
    ids.add(country.country_id);
  }
});

runTest("Unique City IDs", () => {
  const ids = new Set();
  for (const city of cities) {
    assert(!ids.has(city.city_id), `Duplicate city ID: ${city.city_id}`);
    ids.add(city.city_id);
  }
});

runTest("No Duplicate City Names within a Country", () => {
    const names = new Set();
    for (const city of cities) {
        const key = `${city.name}|${city.country_id}`;
        assert(!names.has(key), `Duplicate city name in country: ${city.name}`);
        names.add(key);
    }
});

runTest("Slug and Canonical ID Separation", () => {
  for (const entity of [...countries, ...cities]) {
    assert(entity.slug !== entity.country_id && entity.slug !== entity.city_id, `Slug is the same as canonical ID for ${entity.name}`);
  }
});

runTest("Provenance and Knowledge Status", () => {
    for (const entity of [...countries, ...cities]) {
        assert(entity.knowledge_status, `Missing knowledge status for ${entity.name}`);
        assert(entity.sources.every(s => s.source_type === 'legacy_unpacked'), `Incorrect source type for ${entity.name}`);
        assert(entity.sources.every(s => s.last_verified === null), `last_verified should be null for legacy content in ${entity.name}`);
    }
});

runTest("Source Identifier Correctness", () => {
    for (const city of cities) {
        for (const source of city.sources) {
            if (source.source_id === 'unpacked-cities-json') {
                assert(source.source_identifier, `Missing source_identifier for city ${city.name}`);
                assert(source.source_identifier === city.name.toLowerCase(), `Incorrect source_identifier for city ${city.name}`);
            }
        }
    }
});

runTest("Relationship Integrity", () => {
    const countryIds = new Set(countries.map(c => c.country_id));
    for (const city of cities) {
        assert(countryIds.has(city.country_id), `City ${city.name} has invalid country_id ${city.country_id}`);
    }
});

runTest("Problematic Records Preservation", () => {
    assert(problematicRecords.unresolved_duplicates.length === 0, "No duplicates should be present in the final data");
});
const deterministiExtractionTest = () => {
  const tempKnowledgeDir = fs.mkdtempSync(path.join(os.tmpdir(), 'phase2a-test-'));
  try {
    const command = `UNPACKED_KNOWLEDGE_DIR=${tempKnowledgeDir} node ${CONFIG.extractionScript}`;
    execSync(command);
    const tempCities = loadJson(path.join(tempKnowledgeDir, 'cities.json'));
    const tempCountries = loadJson(path.join(tempKnowledgeDir, 'countries.json'));

    const citiesWithNullDates = cities.map(c => ({ ...c, date_added: null, sources: c.sources.map(s => ({ ...s, date_added: null })) }));
    const tempCitiesWithNullDates = tempCities.map(c => ({ ...c, date_added: null, sources: c.sources.map(s => ({ ...s, date_added: null })) }));

    const countriesWithNullDates = countries.map(c => ({ ...c, date_added: null, sources: c.sources.map(s => ({ ...s, date_added: null })) }));
    const tempCountriesWithNullDates = tempCountries.map(c => ({ ...c, date_added: null, sources: c.sources.map(s => ({ ...s, date_added: null })) }));

    assert.deepStrictEqual(citiesWithNullDates, tempCitiesWithNullDates, "Repeated city extraction is not deterministic");
    assert.deepStrictEqual(countriesWithNullDates, tempCountriesWithNullDates, "Repeated country extraction is not deterministic");
  } finally {
    fs.rmSync(tempKnowledgeDir, { recursive: true, force: true });
  }
};

runTest("Deterministic Repeated Extraction", deterministiExtractionTest);


// --- Test Summary ---

console.log("\n📊 Test Results:");
console.log(`  Total: ${testResults.tests.length}`);
console.log(`  Passed: ${testResults.passed}`);
console.log(`  Failed: ${testResults.failed}`);

fs.writeFileSync(
  path.join(CONFIG.knowledgeDir, "test_results.json"),
  JSON.stringify(testResults, null, 2)
);

if (testResults.failed > 0) {
  console.error("\n🔥 Some tests failed. Please review the output.");
  process.exit(1);
}

console.log("\n🎉 All tests passed!");
