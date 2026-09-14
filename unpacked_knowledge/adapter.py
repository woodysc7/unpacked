#!/usr/bin/env python
# -*- coding: utf-8 -*-

"""A minimal, read-only Python adapter for the UNPACKED knowledge base."""

import json
from pathlib import Path

class KnowledgeAdapter:
    """A read-only adapter for the UNPACKED knowledge base."""

    def __init__(self, base_dir=None):
        """Initializes the adapter by loading and indexing the knowledge data."""
        if base_dir:
            self.base_dir = Path(base_dir)
        else:
            # Default to the parent directory of this file's location
            self.base_dir = Path(__file__).parent.parent

        self.knowledge_dir = self.base_dir / "knowledge"
        self._load_data()
        self._build_indexes()

    def _load_data(self):
        """Loads the core knowledge data from JSON files."""
        self.countries = self._load_json(self.knowledge_dir / "countries.json")
        self.cities = self._load_json(self.knowledge_dir / "cities.json")
        self.activities = self._load_json(self.knowledge_dir / "activities.json")

    def _load_json(self, path):
        """Helper to load a JSON file from a given path."""
        if not path.exists():
            return []
        with open(path, "r", encoding="utf-8") as f:
            return json.load(f)

    def _build_indexes(self):
        """Builds in-memory dictionaries for direct ID lookups."""
        self._countries_by_id = {c["country_id"]: c for c in self.countries}
        self._cities_by_id = {c["city_id"]: c for c in self.cities}
        self._activities_by_id = {a["activity_id"]: a for a in self.activities}

    def get_country(self, country_id):
        """Retrieves a single country by its exact country_id."""
        return self._countries_by_id.get(country_id)

    def get_city(self, city_id):
        """Retrieves a single city by its exact city_id."""
        return self._cities_by_id.get(city_id)

    def get_activity(self, activity_id):
        """Retrieves a single activity by its exact activity_id."""
        return self._activities_by_id.get(activity_id)

    def list_cities(self, country_id=None):
        """Lists all cities, optionally filtered by an exact country_id."""
        if country_id:
            return [c for c in self.cities if c.get("country_id") == country_id]
        return self.cities

    def list_activities(self, city_id=None):
        """Lists all activities, optionally filtered by an exact city_id."""
        if city_id:
            return [a for a in self.activities if a.get("city_id") == city_id]
        return self.activities
