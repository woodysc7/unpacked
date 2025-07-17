#!/usr/bin/env python3
"""
Fix authentication for PaidContent country and city pages
by adding Firebase SDK before auth-check.js
"""

import os
import re
from pathlib import Path

# Firebase scripts to add
FIREBASE_SCRIPTS = '''<!-- Firebase SDK for enhanced authentication -->
<script src="https://www.gstatic.com/firebasejs/8.10.1/firebase-app.js"></script>
<script src="https://www.gstatic.com/firebasejs/8.10.1/firebase-auth.js"></script>
<script src="https://www.gstatic.com/firebasejs/8.10.1/firebase-firestore.js"></script>
<script src="/firebase.js"></script>
<script src="/firebase-auth-enhanced.js"></script>
<script src="/PaidContent/auth-check.js"></script>'''

def fix_auth_in_file(file_path):
    """Add Firebase SDK to a single HTML file"""
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()
        
        # Check if Firebase is already included
        if 'firebase-app.js' in content:
            print(f"   ✅ {file_path} already has Firebase SDK")
            return True
            
        # Check if auth-check.js exists
        if '/PaidContent/auth-check.js' not in content:
            print(f"   ⚠️  No auth-check.js found in {file_path}")
            return False
            
        # Replace auth-check.js with Firebase scripts + auth-check.js
        original_pattern = r'<script src="/PaidContent/auth-check\.js"></script>'
        new_content = re.sub(original_pattern, FIREBASE_SCRIPTS, content)
        
        if new_content != content:
            with open(file_path, 'w', encoding='utf-8') as f:
                f.write(new_content)
            print(f"   ✅ Added Firebase SDK to {file_path}")
            return True
        else:
            print(f"   ⚠️  Could not find pattern in {file_path}")
            return False
            
    except Exception as e:
        print(f"   ❌ Error processing {file_path}: {e}")
        return False

def main():
    print("🔥 Adding Firebase SDK to PaidContent pages...")
    
    base_dir = Path("public/PaidContent")
    
    # Process country pages
    print("📍 Processing country pages...")
    country_dir = base_dir / "Countries"
    country_files = list(country_dir.glob("**/*.html"))
    country_success = 0
    
    for file_path in country_files:
        if fix_auth_in_file(file_path):
            country_success += 1
    
    print(f"   📊 Country pages: {country_success}/{len(country_files)} processed successfully")
    
    # Process city pages
    print("🏙️  Processing city pages...")
    cities_dir = base_dir / "cities"
    city_files = list(cities_dir.glob("*.html"))
    city_success = 0
    
    for file_path in city_files:
        if fix_auth_in_file(file_path):
            city_success += 1
    
    print(f"   📊 City pages: {city_success}/{len(city_files)} processed successfully")
    
    total_success = country_success + city_success
    total_files = len(country_files) + len(city_files)
    
    print(f"\n🎉 Firebase SDK addition complete!")
    print(f"📊 Total: {total_success}/{total_files} files processed successfully")
    print(f"💡 Users should now be able to click on country/city polygons without authentication issues.")

if __name__ == "__main__":
    main()
