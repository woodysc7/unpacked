#!/usr/bin/env node

/**
 * UNPACKED Knowledge Foundation Phase 2A Extraction Script
 *
 * Extracts and corrects a representative sample of countries and cities from legacy UNPACKED
 * to validate the corrected knowledge base architecture before full migration.
 */

const fs = require("fs");
const path = require("path");
const cheerio = require("cheerio");
const crypto = require("crypto");

// Configuration
const CONFIG = {
  sampleCountries: [
    "japan", "france", "unitedstates", "brazil", "egypt",
    "australia", "india", "mexico", "thailand", "southafrica",
  ],
  sampleCities: [
    "tokyojapan", "parisfrance", "newyorkcityunitedstates", "riodejaneirobrazil",
    "cairoegypt", "sydneyaustralia", "delhiindia", "mexicocitymexico",
    "bangkokthailand", "capetownsouthafrica",
  ],
  baseDir: path.join(__dirname, ".."),
  publicDir: path.join(__dirname, ".."),
  paidContentDir: path.join(__dirname, "..", "public", "PaidContent"),
  citiesJsonPath: path.join(
    __dirname,
    "..",
    "public",
    "PaidContent",
    "cities",
    "cities.json"
  ),
  outputDir: path.join(__dirname, "..", "knowledge"),
  sourcesDir: path.join(__dirname, "..", "sources"),
  reviewDir: path.join(__dirname, "..", "knowledge", "review"),
};

// --- Utility functions ---

function generateCanonicalId(text) {
  return crypto.createHash("sha1").update(text).digest("hex");
}

function generateSlug(name) {
  return name.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
}

function normalizeCityName(name) {
  return name.replace(/([a-z])([A-Z])/g, "$1 $2");
}

function generateAliases(name) {
  const aliases = new Set();
  const normalized = name.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  if (name !== normalized) {
    aliases.add(normalized);
  }
  return [...aliases];
}

function getCurrentTimestamp() {
  return new Date().toISOString();
}

// --- Main Extraction Logic ---

async function main() {
  console.log("🚀 Starting UNPACKED Knowledge Foundation Phase 2A Extraction");

  // In-memory data stores
  const countries = new Map();
  const cities = new Map();
  const problematicRecords = {
    unresolved_duplicates: [],
    normalization_issues: [],
    missing_source_identifiers: [],
  };

  // --- 1. Extract and Merge Geographic Cities ---
  console.log("\n🏙️  Extracting and merging cities from geographic database...");
  const citiesData = JSON.parse(fs.readFileSync(CONFIG.citiesJsonPath, "utf-8"));

  for (const cityData of citiesData) {
    const countryName = cityData.country.toLowerCase();
    if (!CONFIG.sampleCountries.includes(countryName)) continue;

    const displayName = normalizeCityName(cityData.name);
    const canonicalId = generateCanonicalId(`${displayName}|${countryName}`);

    if (cities.has(canonicalId)) {
      // This is a duplicate within the geographic source file itself.
      problematicRecords.unresolved_duplicates.push({
        type: "geographic",
        id: canonicalId,
        name: displayName,
        country: countryName,
        existing: cities.get(canonicalId),
        new: cityData,
      });
    }

    cities.set(canonicalId, {
      city_id: canonicalId,
      name: displayName,
      slug: generateSlug(`${displayName} ${countryName}`),
      country_id: generateCanonicalId(countryName),
      aliases: generateAliases(displayName),
      coordinates: { lat: cityData.lat, lon: cityData.lon },
      knowledge_status: "geographic_only",
      sources: [
        {
          source_type: "legacy_unpacked",
          source_id: "unpacked-cities-json",
          source_identifier: cityData.slug,
          confidence: "high",
          last_verified: null,
          date_added: getCurrentTimestamp(),
        },
      ],
      confidence: "high",
      date_added: getCurrentTimestamp(),
      last_verified: null,
    });
  }

  // --- 2. Extract and Merge Detailed City Content ---
  console.log("\n📖 Extracting and merging detailed city guides...");
  for (const cityFilename of CONFIG.sampleCities) {
    const cityHtmlPath = path.join(
      CONFIG.paidContentDir,
      "cities",
      `${cityFilename}.html`
    );
    if (!fs.existsSync(cityHtmlPath)) continue;

    const html = fs.readFileSync(cityHtmlPath, "utf-8");
    const $ = cheerio.load(html);
    const title = $("title").text().split("-")[0].trim();
    const countryName = cityFilename.replace(title.toLowerCase().replace(/\s/g, ""), "");

    const displayName = normalizeCityName(title);
    const canonicalId = generateCanonicalId(`${displayName}|${countryName}`);

    const city = cities.get(canonicalId) || {
      city_id: canonicalId,
      name: displayName,
      slug: generateSlug(`${displayName} ${countryName}`),
      country_id: generateCanonicalId(countryName),
      aliases: generateAliases(displayName),
      coordinates: null,
      sources: [],
      date_added: getCurrentTimestamp(),
      last_verified: null,
      confidence: "medium",
    };

    city.knowledge_status = "legacy_content";
    city.overview = $("h3:contains(\"About\")").next("p").text().trim();
    city.tourscore = parseInt($(".tourscore-value").text().match(/([\d.]+)/)?.[1]) || null;
    city.sources.push({
      source_type: "legacy_unpacked",
      source_id: `unpacked-${cityFilename}-html`,
      confidence: "medium",
      last_verified: null,
      date_added: getCurrentTimestamp(),
    });

    cities.set(canonicalId, city);
  }

  // --- 3. Extract Country Information ---
  console.log("\n🌍 Extracting countries...");
  for (const countryName of CONFIG.sampleCountries) {
    const canonicalId = generateCanonicalId(countryName);
    countries.set(canonicalId, {
      country_id: canonicalId,
      name: normalizeCityName(countryName.charAt(0).toUpperCase() + countryName.slice(1)),
      slug: generateSlug(countryName),
      aliases: generateAliases(countryName),
      knowledge_status: "legacy_content",
      sources: [
        {
          source_type: "legacy_unpacked",
          source_id: `unpacked-${countryName}-home-html`,
          confidence: "medium",
          last_verified: null,
          date_added: getCurrentTimestamp(),
        },
      ],
      confidence: "medium",
      date_added: getCurrentTimestamp(),
      last_verified: null,
    });
  }

  // --- 4. Write Output Files ---
  console.log("\n💾 Writing output files...");
  fs.writeFileSync(
    path.join(CONFIG.outputDir, "countries.json"),
    JSON.stringify([...countries.values()], null, 2)
  );
  fs.writeFileSync(
    path.join(CONFIG.outputDir, "cities.json"),
    JSON.stringify([...cities.values()], null, 2)
  );
  fs.writeFileSync(
    path.join(CONFIG.reviewDir, "problematic_records.json"),
    JSON.stringify(problematicRecords, null, 2)
  );

  console.log("\n🎉 Phase 2A Extraction Complete!");
}

main().catch((error) => {
  console.error("❌ Fatal error during extraction:", error);
  process.exit(1);
});
