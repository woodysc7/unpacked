#!/usr/bin/env python
# -*- coding: utf-8 -*-

"""Tests for the minimal, read-only Python knowledge adapter."""

import unittest
import os
from unpacked_knowledge.adapter import KnowledgeAdapter

class TestKnowledgeAdapter(unittest.TestCase):

    @classmethod
    def setUpClass(cls):
        """Initialize the KnowledgeAdapter and load dynamic IDs for tests."""
        cls.adapter = KnowledgeAdapter(base_dir=os.getcwd())

        # Dynamically find the IDs to avoid issues with data regeneration
        cls.france_id = None
        for country in cls.adapter.countries:
            if country["name"] == "France":
                cls.france_id = country["country_id"]
                break
        assert cls.france_id is not None, "Could not find country: France"

        cls.paris_id = None
        for city in cls.adapter.cities:
            if city["name"] == "paris" and city["country_id"] == cls.france_id:
                cls.paris_id = city["city_id"]
                break
        assert cls.paris_id is not None, "Could not find city: Paris"

        cls.eiffel_tower_id = None
        for activity in cls.adapter.activities:
            if activity["name"] == "Eiffel Tower":
                cls.eiffel_tower_id = activity["activity_id"]
                break
        assert cls.eiffel_tower_id is not None, "Could not find activity: Eiffel Tower"

    def test_get_country_valid(self):
        """1. Test valid country lookup."""
        country = self.adapter.get_country(self.france_id)
        self.assertIsNotNone(country)
        self.assertEqual(country["name"], "France")

    def test_get_country_missing(self):
        """2. Test missing country lookup."""
        country = self.adapter.get_country("fake-id")
        self.assertIsNone(country)

    def test_get_city_valid(self):
        """3. Test valid city lookup."""
        city = self.adapter.get_city(self.paris_id)
        self.assertIsNotNone(city)
        self.assertEqual(city["name"], "paris")

    def test_get_city_missing(self):
        """4. Test missing city lookup."""
        city = self.adapter.get_city("fake-id")
        self.assertIsNone(city)

    def test_get_activity_valid(self):
        """5. Test valid activity lookup."""
        activity = self.adapter.get_activity(self.eiffel_tower_id)
        self.assertIsNotNone(activity)
        self.assertEqual(activity["name"], "Eiffel Tower")

    def test_get_activity_missing(self):
        """6. Test missing activity lookup."""
        activity = self.adapter.get_activity("fake-id")
        self.assertIsNone(activity)

    def test_list_cities_by_country(self):
        """7. Test city filtering by country_id."""
        cities_in_france = self.adapter.list_cities(country_id=self.france_id)
        self.assertTrue(len(cities_in_france) > 0)
        # Check if Paris is in the list
        self.assertIn(self.paris_id, [c["city_id"] for c in cities_in_france])
        # Check that a city from another country is not in the list
        tokyo_id = "829cf75f35908d40682504e0a96c6aa8dd7d022f"
        self.assertNotIn(tokyo_id, [c["city_id"] for c in cities_in_france])

    def test_list_activities_by_city(self):
        """8. Test activity filtering by city_id."""
        activities_in_paris = self.adapter.list_activities(city_id=self.paris_id)
        self.assertTrue(len(activities_in_paris) > 0)
        # Check if the Eiffel Tower is in the list
        self.assertIn(self.eiffel_tower_id, [a["activity_id"] for a in activities_in_paris])
        # Check that an activity from another city is not in the list
        la_quebrada_id = "1535df1d07578078b3dedeb579b199727c0e25e9"
        self.assertNotIn(la_quebrada_id, [a["activity_id"] for a in activities_in_paris])

if __name__ == '__main__':
    unittest.main()