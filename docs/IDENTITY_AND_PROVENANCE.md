# UNPACKED Geographic Identity and Provenance

This document outlines the finalized strategy for canonical identity, data provenance, and knowledge quality for the UNPACKED Travel Knowledge Base.

## 1. Identity Model

We distinguish between several forms of identity to ensure data stability, human readability, and accurate source tracking.

### 1.1. Canonical ID (`country_id`, `city_id`)

-   **Purpose:** A stable, machine-readable identifier that **must never change** once assigned.
-   **Format:** A SHA1 hash of the entity's most stable identifier, which is typically a combination of its name and geographic location.
-   **Example:** `sha1("Tokyo" + "Japan")`
-   **Rationale:** This approach ensures that the ID is deterministic and unique, and it is not tied to a human-readable name that might change over time.

### 1.2. Slug

-   **Purpose:** A human-readable, URL-friendly identifier.
-   **Format:** A lowercase, hyphenated string derived from the entity's name and country.
-   **Example:** `tokyo-japan`
-   **Rationale:** Slugs provide a clean, readable URL for users and SEO, and can be updated without affecting the underlying canonical ID.

### 1.3. Display Name

-   **Purpose:** The proper, human-readable name of the entity.
-   **Format:** A UTF-8 string.
-   **Example:** `São Paulo`

### 1.4. Aliases

-   **Purpose:** To store alternate spellings, transliterations, and common names.
-   **Format:** An array of strings.
-   **Example:** For `São Paulo`, aliases might include `Sao Paulo` and `Saopaulo`.

### 1.5. Source Identifier

-   **Purpose:** To preserve the original identifier from the source dataset.
-   **Format:** A string, preserved as-is from the source.
-   **Rationale:** This is crucial for tracing data back to its origin and for re-running extractions deterministically.

## 2. Provenance Model

All data in the knowledge base must be accompanied by provenance information.

-   **`source_type`:** One of `legacy_unpacked`, `official_source`, `personal_experience`, `live_research`, `live_api`.
-   **`source_id`:** A unique identifier for the source (e.g., the filename of the legacy HTML file).
-   **`confidence`:** `high`, `medium`, or `low`.
-   **`last_verified`:** An ISO 8601 timestamp, nullable if never verified. For all `legacy_unpacked` content, this will be `null` initially.

## 3. Knowledge Status

The `knowledge_status` field tracks the state of our data:

-   **`geographic_only`:** The city exists only as a geographic point.
-   **`legacy_content`:** The data was extracted from the legacy UNPACKED website and has not been verified.
-   **`partially_verified`:** Some fields have been verified.
-   **`verified`:** All fields have been verified against authoritative sources.

## 4. UNPACKED vs. Sam 2 Boundary

-   **UNPACKED:** A durable, travel-domain knowledge base.
-   **Sam 2:** A general-purpose personal memory system.
-   **Juan:** A reasoning and recommendation engine that sits on top of UNPACKED.
-   **Live APIs/Research:** For fetching real-time, volatile information (e.g., flight prices).