import os
import shutil
import re

PROJECT_DIR = os.path.dirname(os.path.abspath(__file__))
cities_folder = os.path.join(PROJECT_DIR, 'cities')
countries_folder = os.path.join(PROJECT_DIR, 'Countries')
os.makedirs(cities_folder, exist_ok=True)
os.makedirs(countries_folder, exist_ok=True)

# Helper to turn "côtedivoire" into "Côtedivoire", "unitedstates" -> "Unitedstates"
def country_folder_name(country_lower):
    # Special handling for known countries with spaces
    special_cases = {
        "côtedivoire": "Côtedivoire",
        "unitedstates": "Unitedstates",
        "unitedkingdom": "Unitedkingdom",
        "ivorycoast": "Ivorycoast",
        "dominicanrepublic": "Dominicanrepublic",
        "southafrica": "Southafrica",
        "newzealand": "Newzealand",
        "northkorea": "Northkorea",
        "southkorea": "Southkorea",
        "centralafricanrepublic": "Centralafricanrepublic",
        "saintbarthlemy": "Saintbarthlemy",
        # Add more as needed
    }
    return special_cases.get(country_lower, country_lower.capitalize())

for filename in os.listdir(PROJECT_DIR):
    # Only work on HTML files in the root
    if not filename.endswith(' ') or not os.path.isfile(os.path.join(PROJECT_DIR, filename)):
        continue

    # COUNTRY FILES: lowercase country at start, then Cityguide/More/Home 
    country_file_match = re.match(r'^([a-zà-ÿ\-]+)(Cityguide|More|Home)\ $', filename, re.IGNORECASE)
    if country_file_match and filename[0].islower():
        country = country_file_match.group(1).replace("-", "").replace(" ", "")
        folder_name = country_folder_name(country)
        dest_folder = os.path.join(countries_folder, folder_name)
        os.makedirs(dest_folder, exist_ok=True)
        shutil.move(os.path.join(PROJECT_DIR, filename), os.path.join(dest_folder, filename))
        print(f"Moved {filename} to Countries/{folder_name}/")
        continue

    # CITY FILES: must end in  , have at least one uppercase, and not start with lowercase country
    # Match: CityNameCountryName  (with possible spaces/hyphens)
    # Exclude: already sorted country files and files with only one capitalized word
    city_file_match = re.match(r'^(.+?)([A-Z][a-zA-Z \-]+)\ $', filename)
    if city_file_match and not filename[0].islower():
        shutil.move(os.path.join(PROJECT_DIR, filename), os.path.join(cities_folder, filename))
        print(f"Moved {filename} to cities/")
        continue

    # Otherwise, leave file in place

print("✅ File sorting complete!")