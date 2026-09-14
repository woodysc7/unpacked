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
  return process.env.UNPACKED_DETERMINISTIC_DATE || new Date().toISOString();
}
function loadJson(filePath) {
  if (!fs.existsSync(filePath)) {
    return [];
  }
  return JSON.parse(fs.readFileSync(filePath, "utf-8"));
}


// --- Main Extraction Logic ---

async function main() {
  console.log("🚀 Starting UNPACKED Knowledge Foundation Phase 2A Extraction");

  // In-memory data stores
  const countries = new Map();
  const cities = new Map();

  // Load existing data to preserve timestamps
  const problematicRecords = {
    unresolved_duplicates: [],
    normalization_issues: [],
    missing_source_identifiers: [],
  };
  try {
    loadJson(path.join(CONFIG.outputDir, "cities.json")).forEach(c => cities.set(c.city_id, c));
    loadJson(path.join(CONFIG.outputDir, "countries.json")).forEach(c => countries.set(c.country_id, c));
  } catch (e) {
    // Ignore if files don't exist yet
  }

  // --- 1. Extract and Merge Geographic Cities ---
  console.log("\n🏙️  Extracting and merging cities from geographic database...");
  const citiesData = JSON.parse(fs.readFileSync(CONFIG.citiesJsonPath, "utf-8"));

  for (const cityData of citiesData) {
    const countryName = cityData.country.toLowerCase();
    if (!CONFIG.sampleCountries.includes(countryName)) continue;

    const displayName = normalizeCityName(cityData.name);
    const canonicalId = generateCanonicalId(`${displayName}|${countryName}`);

    const existingCity = existingCities.get(canonicalId);
      if (existingCity) {
        cities.set(canonicalId, existingCity);
      } else {
        const now = getCurrentTimestamp();
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
              date_added: now,
            },
          ],
          confidence: "high",
          date_added: now,
          last_verified: null,
        });
      } else {
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

    const city = cities.get(canonicalId);
    if (city) {
      city.knowledge_status = "legacy_content";
      city.overview = $("h3:contains('About')").next("p").text().trim();
      city.tourscore = parseInt($(".tourscore-value").text().match(/([\d.]+)/)?.[1]) || null;

      // Add new source but preserve original date_added for the main record
      const newSource = {
        source_type: "legacy_unpacked",
        source_id: `unpacked-${cityFilename}-html`,
        confidence: "medium",
        last_verified: null,
        date_added: getCurrentTimestamp(),
      };

      if (!city.sources) city.sources = [];
      // Avoid adding duplicate sources
      if (!city.sources.some(s => s.source_id === newSource.source_id)) {
          city.sources.push(newSource);
      }
    } else {
      // This case should ideally not be hit if the geo DB is comprehensive
      problematicRecords.normalization_issues.push({ file: cityFilename, reason: "City found in HTML but not in geographic DB." });
    }
  }

  // --- 3. Extract Country Information ---
  console.log("\n🌍 Extracting countries...");
  for (const countryName of CONFIG.sampleCountries) {
    const canonicalId = generateCanonicalId(countryName);
    if (!countries.has(canonicalId)) {
      const now = getCurrentTimestamp();
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
            date_added: now,
          },
        ],
        confidence: "medium",
        date_added: now,
        last_verified: null,
      });
    }
  }

  // --- 4. Write Output Files ---
  console.log("\n💾 Writing output files...");
const outputDir = process.env.UNPACKED_KNOWLEDGE_DIR || CONFIG.outputDir;
  const reviewDir = process.env.UNPACKED_KNOWLEDGE_DIR ? path.join(process.env.UNPACKED_KNOWLEDGE_DIR, 'review') : CONFIG.reviewDir;

  if (!fs.existsSync(reviewDir)) {
    fs.mkdirSync(reviewDir, { recursive: true });
  }

  fs.writeFileSync(
    path.join(outputDir, "countries.json"),
    JSON.stringify([...countries.values()], null, 2)
  );
  fs.writeFileSync(
    path.join(outputDir, "cities.json"),
    JSON.stringify([...cities.values()], null, 2)
  );
  fs.writeFileSync(
    path.join(reviewDir, "problematic_records.json"),
    JSON.stringify(problematicRecords, null, 2)
  );

  console.log("\n🎉 Phase 2A Extraction Complete!");
}

main().catch((error) => {
  console.error("❌ Fatal error during extraction:", error);
  process.exit(1);
});
