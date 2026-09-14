/*
 * UNPACKED Knowledge Foundation Phase 2B Extraction Script
 *
 * Extracts destinations and activities from legacy UNPACKED city pages.
 */

const fs = require("fs");
const path = require("path");
const cheerio = require("cheerio");
const crypto = require("crypto");

const SCHEMA_VERSION = "1.0.0";
const EXTRACTION_DATE = new Date().toISOString();

const CONFIG = {
  baseDir: path.join(__dirname, ".."),
  publicDir: path.join(__dirname, ".."),
  paidContentDir: path.join(__dirname, "..", "public", "PaidContent"),
  citiesHtmlDir: path.join(__dirname, "..", "public", "PaidContent", "cities"),
  outputDir: path.join(__dirname, "..", "knowledge"),
  reviewDir: path.join(__dirname, "..", "knowledge", "review"),
  citiesJsonPath: path.join(__dirname, "..", "knowledge", "cities.json"),
  countriesJsonPath: path.join(__dirname, "..", "knowledge", "countries.json"),
};

function generateCanonicalId(text) {
  return crypto.createHash("sha1").update(text).digest("hex");
}

async function main() {
  console.log("🚀 Starting UNPACKED Knowledge Foundation Phase 2B Extraction");

  // Load existing knowledge
  const cities = JSON.parse(fs.readFileSync(CONFIG.citiesJsonPath, "utf-8"));
  const countries = JSON.parse(fs.readFileSync(CONFIG.countriesJsonPath, "utf-8"));

  // Create lookup maps
  const countryIdToSlug = new Map(countries.map(c => [c.country_id, c.slug]));
  const cityLookup = new Map();

  for (const city of cities) {
    const countrySlug = countryIdToSlug.get(city.country_id) || '';
    const normalizedCityName = (city.name || '').toLowerCase().replace(/[^a-z0-9]/g, '');
    const normalizedCountrySlug = (countrySlug || '').toLowerCase().replace(/[^a-z0-9]/g, '');
    const normalizedSlug = (city.slug || '').toLowerCase().replace(/[^a-z0-9-]/g, '');

    const key1 = `${normalizedCityName}${normalizedCountrySlug}`;
    if (key1 && !cityLookup.has(key1)) {
      cityLookup.set(key1, city.city_id);
    } else if (key1) {
        console.warn(`Ambiguous city key: ${key1}`);
    }

    if (normalizedSlug && !cityLookup.has(normalizedSlug)) {
        cityLookup.set(normalizedSlug, city.city_id);
    } else if (normalizedSlug) {
        // This can happen if different cities normalize to the same slug key
        console.warn(`Ambiguous city slug key: ${normalizedSlug}`);
    }
  }

  const destinations = [];
  const activities = [];
  const problematicRecords = {
    unmapped_entities: [],
    malformed_entities: [],
  };

  console.log("🏙️  Extracting destinations and activities from city pages...");

  const cityHtmlFiles = fs.readdirSync(CONFIG.citiesHtmlDir).filter(f => f.endsWith(".html"));

  for (const htmlFile of cityHtmlFiles) {
          const cityFileKey = htmlFile.replace(".html", "").toLowerCase().replace(/[-_\s]/g, '');
    const cityId = cityLookup.get(cityFileKey);

    if (!cityId) {
      problematicRecords.unmapped_entities.push({ 
        file: htmlFile, 
        reason: `No matching city found for file key: ${cityFileKey}` 
      });
      continue;
    }

    const cityInfo = cities.find(c => c.city_id === cityId);
    const citySlug = cityInfo.slug;

    const html = fs.readFileSync(path.join(CONFIG.citiesHtmlDir, htmlFile), "utf-8");
    const $ = cheerio.load(html);

    $(".slide").each((index, element) => {
      const slide = $(element);
      const captionText = slide.find(".slide-caption h4").text().trim();
      let name = '';
      let description = '';

      const numberingMatch = captionText.match(/^\d+\.\s*/);
      const titleText = numberingMatch ? captionText.substring(numberingMatch[0].length) : captionText;
      
      const firstColonIndex = titleText.indexOf(':');

      if (firstColonIndex !== -1) {
        name = titleText.substring(0, firstColonIndex).trim();
        description = titleText.substring(firstColonIndex + 1).trim();
      } else {
        name = titleText.trim();
      }

      if (name) {
        const activityId = generateCanonicalId(`${name}|${cityId}`);
        activities.push({
          activity_id: activityId,
          name: name,
          city_id: cityId,
          category: "sightseeing", // Default category
          description: description,
          knowledge_status: "legacy_content",
          provenance: [{
            source_type: "legacy_unpacked",
            source_id: `unpacked-${citySlug}-html`,
            confidence: "medium",
            date_added: process.env.UNPACKED_DETERMINISTIC_DATE || new Date().toISOString()
          }],
          freshness_tier: "legacy_unverified"
        });
      } else {
        problematicRecords.malformed_entities.push({
          file: htmlFile,
          entity_type: "activity",
          reason: "Missing name in slide caption.",
          slide_index: index
        });
      }
    });
  }


  // Deduplicate activities
  const uniqueActivities = new Map();
  for (const activity of activities) {
    const normalizedName = activity.name.toLowerCase().replace(/[^a-z0-9]/g, '');
    const key = `${activity.city_id}|${normalizedName}`;
    if (!uniqueActivities.has(key)) {
      uniqueActivities.set(key, activity);
    } else {
      // If duplicate found, prefer the one with the longer description
      const existing = uniqueActivities.get(key);
      if (activity.description.length > existing.description.length) {
        uniqueActivities.set(key, activity);
      }
    }
  }

  console.log("💾 Writing output files...");
const outputDir = process.env.UNPACKED_KNOWLEDGE_DIR || CONFIG.outputDir;
const reviewDir = process.env.UNPACKED_KNOWLEDGE_DIR ? path.join(process.env.UNPACKED_KNOWLEDGE_DIR, 'review') : CONFIG.reviewDir;
if (!fs.existsSync(reviewDir)) {
    fs.mkdirSync(reviewDir, { recursive: true });
  }

  fs.writeFileSync(
    path.join(outputDir, "activities.json"),
    JSON.stringify([...uniqueActivities.values()], null, 2)
  );

  const problematicRecordsPath = path.join(reviewDir, "problematic_records.json");
  let existingProblematicRecords = { unmatched_entities: [], malformed_entities: [] };
  if (fs.existsSync(problematicRecordsPath)) {
    existingProblematicRecords = JSON.parse(fs.readFileSync(problematicRecordsPath, "utf-8"));
  }

  const combinedProblematicRecords = {
    ...existingProblematicRecords,
    unmatched_entities: [...(existingProblematicRecords.unmatched_entities || []), ...problematicRecords.unmatched_entities],
    malformed_entities: [...(existingProblematicRecords.malformed_entities || []), ...problematicRecords.malformed_entities],
  };

  fs.writeFileSync(
    problematicRecordsPath,
    JSON.stringify(combinedProblematicRecords, null, 2)
  );

  console.log("\n🎉 Phase 2B Extraction Complete!");
}

main().catch(error => {
  console.error("❌ Fatal error during extraction:", error);
  process.exit(1);
});

