/*
 * UNPACKED Knowledge Foundation Phase 2B Tests
 *
 * Tests for data quality and determinism of the Phase 2B content enrichment.
 */

const fs = require("fs");
const path = require("path");
const assert = require("assert");
const { execSync } = require("child_process");
const os = require("os");
const Ajv = require("ajv");
const addFormats = require("ajv-formats");

const CONFIG = {
  knowledgeDir: path.join(__dirname, "..", "knowledge"),
  schemasDir: path.join(__dirname, "..", "schemas"),
  extractionScript: path.join(__dirname, "..", "scripts", "phase2b_extraction.js"),
};

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
  try {
    return JSON.parse(fs.readFileSync(filePath, "utf-8"));
  } catch (e) {
    if (e.code === 'ENOENT') {
        return []; // Return empty array if file doesn't exist
    }
    throw e;
  }
}

const cities = loadJson(path.join(CONFIG.knowledgeDir, "cities.json"));
const destinations = loadJson(path.join(CONFIG.knowledgeDir, "destinations.json"));
const activities = loadJson(path.join(CONFIG.knowledgeDir, "activities.json"));

const destinationSchema = loadJson(path.join(CONFIG.schemasDir, "destination.schema.json"));
const activitySchema = loadJson(path.join(CONFIG.schemasDir, "activity.schema.json"));
const sourceSchema = loadJson(path.join(CONFIG.schemasDir, "source.schema.json"));

ajv.addSchema(sourceSchema, "source.schema.json");

// --- Test Definitions ---
runTest("Schema Validation: Destinations", () => {
  const validate = ajv.compile(destinationSchema);
  for (const destination of destinations) {
    const valid = validate(destination);
    if (!valid) {
      console.error(ajv.errorsText(validate.errors));
      assert(valid, `Invalid destination: ${destination.name}`);
    }
  }
});

runTest("Schema Validation: Activities", () => {
  const validate = ajv.compile(activitySchema);
  for (const activity of activities) {
    const valid = validate(activity);
    if (!valid) {
      console.error(ajv.errorsText(validate.errors));
      assert(valid, `Invalid activity: ${activity.name}`);
    }
  }
});

runTest("Foreign Key Integrity: city_id", () => {
  const cityIds = new Set(cities.map(c => c.city_id));
  for (const entity of [...destinations, ...activities]) {
    assert(cityIds.has(entity.city_id), `Entity ${entity.name} has invalid city_id ${entity.city_id}`);
  }
});

runTest("Unique Destination IDs", () => {
  const ids = new Set();
  for (const destination of destinations) {
    assert(!ids.has(destination.destination_id), `Duplicate destination ID: ${destination.destination_id}`);
    ids.add(destination.destination_id);
  }
});

runTest("Unique Activity IDs", () => {
  const ids = new Set();
  for (const activity of activities) {
    assert(!ids.has(activity.activity_id), `Duplicate activity ID: ${activity.activity_id}`);
    ids.add(activity.activity_id);
  }
});

runTest("Activities JSON is not empty", () => {
    assert(activities.length > 0, "activities.json is empty");
});

runTest("Acapulco has activities", () => {
    const acapulco = cities.find(c => c.slug === "acapulcodejuarez-mexico");
    const acapulcoActivities = activities.filter(a => a.city_id === acapulco.city_id);
    assert(acapulcoActivities.length > 0, "Acapulco should have activities");
});

runTest("Description extraction works", () => {
    const activity = activities.find(a => a.name === "La Quebrada Cliff Divers");
    assert(activity.description === "Daring cliff diving performances into the ocean.", "Description for La Quebrada Cliff Divers is incorrect");
});

runTest("Numbered prefixes are removed", () => {
    const activity = activities.find(a => a.name === "Texas State Capitol");
    assert(activity, "Texas State Capitol activity not found");
});

runTest("Unnumbered activities work", () => {
    const activity = activities.find(a => a.name === "La Quebrada Cliff Divers");
    assert(activity, "La Quebrada Cliff Divers activity not found");
});

runTest("Only the FIRST colon is treated as the name/description separator", () => {
    const activity = activities.find(a => a.name === "National Museum of Death");
    assert.strictEqual(activity.description, "Exhibits on Mexican death culture and traditions.");
});

runTest("All activities have correct provenance", () => {
    for (const activity of activities) {
        assert(activity.provenance.every(p => p.source_type === "legacy_unpacked"), `Activity ${activity.name} has incorrect provenance`);
    }
});

runTest("All activities have correct knowledge_status", () => {
    for (const activity of activities) {
        assert(activity.knowledge_status === "legacy_content", `Activity ${activity.name} has incorrect knowledge_status`);
    }
});

runTest("All activities have correct freshness_tier", () => {
    for (const activity of activities) {
        assert(activity.freshness_tier === "legacy_unverified", `Activity ${activity.name} has incorrect freshness_tier`);
    }
});

runTest("No duplicate normalized activities within a city", () => {
    const activityKeys = new Set();
    for (const activity of activities) {
        const normalizedName = activity.name.toLowerCase().replace(/[^a-z0-9]/g, '');
        const key = `${activity.city_id}|${normalizedName}`;
        assert(!activityKeys.has(key), `Duplicate activity found in city ${activity.city_id}: ${activity.name}`);
        activityKeys.add(key);
    }
});

const deterministiExtractionTest = () => {
  const tempKnowledgeDir = fs.mkdtempSync(path.join(os.tmpdir(), 'phase2b-test-'));
  try {
    const command = `UNPACKED_KNOWLEDGE_DIR=${tempKnowledgeDir} node ${CONFIG.extractionScript}`;
    execSync(command);
    const tempActivities = loadJson(path.join(tempKnowledgeDir, 'activities.json'));

    const activitiesWithNullDates = activities.map(a => ({ ...a, provenance: a.provenance.map(p => ({ ...p, date_added: null })) }));
    const tempActivitiesWithNullDates = tempActivities.map(a => ({ ...a, provenance: a.provenance.map(p => ({ ...p, date_added: null })) }));

    assert.deepStrictEqual(activitiesWithNullDates, tempActivitiesWithNullDates, "Repeated activity extraction is not deterministic");
  } finally {
    fs.rmSync(tempKnowledgeDir, { recursive: true, force: true });
  }
};
runTest("Deterministic Repeated Extraction", () => {
  const tempKnowledgeDir = fs.mkdtempSync(path.join(os.tmpdir(), 'phase2b-test-'));
  try {
    const command = `UNPACKED_KNOWLEDGE_DIR=${tempKnowledgeDir} node ${CONFIG.extractionScript}`;
    execSync(command);
    const tempActivities = loadJson(path.join(tempKnowledgeDir, 'activities.json'));

    const activitiesWithNullDates = activities.map(a => ({ ...a, provenance: a.provenance.map(p => ({ ...p, date_added: null })) }));
    const tempActivitiesWithNullDates = tempActivities.map(a => ({ ...a, provenance: a.provenance.map(p => ({ ...p, date_added: null })) }));

    assert.deepStrictEqual(activitiesWithNullDates, tempActivitiesWithNullDates, "Repeated activity extraction is not deterministic");
  } finally {
    fs.rmSync(tempKnowledgeDir, { recursive: true, force: true });
  }
});

// --- Test Summary ---
console.log("\n📊 Test Results:");
console.log(`  Total: ${testResults.tests.length}`);
console.log(`  Passed: ${testResults.passed}`);
console.log(`  Failed: ${testResults.failed}`);

let existingTestResults = {tests: []};
if (fs.existsSync(path.join(CONFIG.knowledgeDir, "test_results.json"))) {
    existingTestResults = loadJson(path.join(CONFIG.knowledgeDir, "test_results.json"));
}

const combinedTestResults = {
    ...existingTestResults,
    tests: [...existingTestResults.tests, ...testResults.tests]
};

fs.writeFileSync(
  path.join(CONFIG.knowledgeDir, "test_results.json"),
  JSON.stringify(combinedTestResults, null, 2)
);

if (testResults.failed > 0) {
  console.error("\n🔥 Some tests failed. Please review the output.");
  process.exit(1);
}

console.log("\n🎉 All Phase 2B tests passed!");
