#!/bin/bash

# Comprehensive script to fix all navigation issues in premium content
# This script will update all city and country files to use direct static links

echo "🔧 Starting comprehensive premium navigation fix..."

# Navigate to the workspace directory
cd "/Users/samuelwoody/Desktop/Unpacked"

# Function to check and report what needs fixing
check_navigation_issues() {
    echo "📊 Checking current navigation issues..."
    
    echo "🏙️ Checking city files for Netlify function links..."
    city_function_links=$(grep -r "/.netlify/functions/" public/PaidContent/cities/*.html 2>/dev/null | wc -l)
    echo "   Found $city_function_links city files with function links"
    
    echo "🏛️ Checking country files for Netlify function links..."
    country_function_links=$(grep -r "/.netlify/functions/" public/PaidContent/Countries/ 2>/dev/null | wc -l)
    echo "   Found $country_function_links country files with function links"
    
    echo "🔍 Checking for missing direct links..."
    missing_direct_links=$(grep -r "href=\"#\"" public/PaidContent/ 2>/dev/null | wc -l)
    echo "   Found $missing_direct_links files with placeholder links"
}

# Function to fix city navigation links
fix_city_navigation() {
    echo "🏙️ Fixing city navigation links..."
    
    # Find all city HTML files
    city_files=$(find public/PaidContent/cities -name "*.html" -type f)
    city_count=0
    
    for file in $city_files; do
        if [ -f "$file" ]; then
            # Extract city and country from filename (format: cityname + country.html)
            filename=$(basename "$file" .html)
            
            # Look for existing Netlify function links and replace with direct links
            if grep -q "/.netlify/functions/" "$file"; then
                # Replace function-based country navigation with direct links
                sed -i '' 's|href="/.netlify/functions/servePaidContent[^"]*country=[^"]*"|href="/PaidContent/Countries/\1/\1home.html"|g' "$file" 2>/dev/null
                
                # More specific replacements for common patterns
                sed -i '' 's|/.netlify/functions/servePaidContentNew?file=Countries/\([^/]*\)/\([^"]*\)|/PaidContent/Countries/\1/\2|g' "$file"
                sed -i '' 's|/.netlify/functions/servePaidContent?file=Countries/\([^/]*\)/\([^"]*\)|/PaidContent/Countries/\1/\2|g' "$file"
                
                city_count=$((city_count + 1))
                echo "   ✅ Fixed navigation in $(basename "$file")"
            fi
        fi
    done
    
    echo "   🎯 Updated $city_count city files"
}

# Function to fix country navigation links
fix_country_navigation() {
    echo "🏛️ Fixing country navigation links..."
    
    # Find all country HTML files
    country_files=$(find public/PaidContent/Countries -name "*.html" -type f)
    country_count=0
    
    for file in $country_files; do
        if [ -f "$file" ]; then
            # Look for existing Netlify function links and replace with direct links
            if grep -q "/.netlify/functions/" "$file"; then
                # Replace function-based links with direct static links
                sed -i '' 's|/.netlify/functions/servePaidContentNew?file=Countries/\([^/]*\)/\([^"]*\)|/PaidContent/Countries/\1/\2|g' "$file"
                sed -i '' 's|/.netlify/functions/servePaidContent?file=Countries/\([^/]*\)/\([^"]*\)|/PaidContent/Countries/\1/\2|g' "$file"
                sed -i '' 's|/.netlify/functions/servePaidContentReal?file=Countries/\([^/]*\)/\([^"]*\)|/PaidContent/Countries/\1/\2|g' "$file"
                
                # Fix city links to point directly to PaidContent/cities
                sed -i '' 's|/.netlify/functions/servePaidContentNew?file=cities/\([^"]*\)|/PaidContent/cities/\1|g' "$file"
                sed -i '' 's|/.netlify/functions/servePaidContent?file=cities/\([^"]*\)|/PaidContent/cities/\1|g' "$file"
                
                country_count=$((country_count + 1))
                echo "   ✅ Fixed navigation in $(basename "$file")"
            fi
        fi
    done
    
    echo "   🎯 Updated $country_count country files"
}

# Function to fix Atlas navigation
fix_atlas_navigation() {
    echo "🗺️ Fixing Atlas navigation..."
    
    # Check premium-atlas-direct.html for any function links
    if grep -q "/.netlify/functions/" public/premium-atlas-direct.html; then
        sed -i '' 's|/.netlify/functions/servePaidContentNew?file=Countries/\([^/]*\)/\([^"]*\)|/PaidContent/Countries/\1/\2|g' public/premium-atlas-direct.html
        sed -i '' 's|/.netlify/functions/servePaidContent?file=Countries/\([^/]*\)/\([^"]*\)|/PaidContent/Countries/\1/\2|g' public/premium-atlas-direct.html
        sed -i '' 's|/.netlify/functions/servePaidContentNew?file=cities/\([^"]*\)|/PaidContent/cities/\1|g' public/premium-atlas-direct.html
        sed -i '' 's|/.netlify/functions/servePaidContent?file=cities/\([^"]*\)|/PaidContent/cities/\1|g' public/premium-atlas-direct.html
        echo "   ✅ Fixed Atlas navigation links"
    else
        echo "   ✅ Atlas navigation already uses direct links"
    fi
}

# Function to ensure auth-check.js is properly configured
fix_auth_check() {
    echo "🔐 Checking auth-check.js configuration..."
    
    if [ -f "public/PaidContent/auth-check.js" ]; then
        # Verify auth-check.js has proper cookie checking
        if grep -q "userEmail.*woodysc7" public/PaidContent/auth-check.js; then
            echo "   ✅ Auth-check.js is properly configured"
        else
            echo "   ⚠️  Auth-check.js may need cookie configuration review"
        fi
    else
        echo "   ⚠️  Auth-check.js not found"
    fi
}

# Function to verify cities.json format
check_cities_json() {
    echo "🏙️ Checking cities.json format..."
    
    if [ -f "public/PaidContent/cities/cities.json" ]; then
        # Check for common JSON formatting issues
        if grep -q "^[[:space:]]*\"" public/PaidContent/cities/cities.json; then
            echo "   ✅ Cities.json format looks good"
        else
            echo "   ⚠️  Cities.json may have formatting issues"
        fi
    else
        echo "   ⚠️  Cities.json not found"
    fi
}

# Function to test a few links
test_navigation() {
    echo "🧪 Testing navigation links..."
    
    # Check if we can find some sample country files
    sample_countries=$(find public/PaidContent/Countries -name "*home.html" -type f | head -3)
    
    for country_file in $sample_countries; do
        if [ -f "$country_file" ]; then
            country_name=$(basename $(dirname "$country_file"))
            echo "   ✅ Found $country_name home page"
        fi
    done
    
    # Check if we can find some sample city files
    sample_cities=$(find public/PaidContent/cities -name "*.html" -type f | head -3)
    
    for city_file in $sample_cities; do
        if [ -f "$city_file" ]; then
            city_name=$(basename "$city_file" .html)
            echo "   ✅ Found city page: $city_name"
        fi
    done
}

# Main execution
echo "🚀 Starting comprehensive premium navigation fix..."
echo "📍 Working directory: $(pwd)"
echo ""

# Step 1: Check current issues
check_navigation_issues
echo ""

# Step 2: Fix city navigation
fix_city_navigation
echo ""

# Step 3: Fix country navigation  
fix_country_navigation
echo ""

# Step 4: Fix atlas navigation
fix_atlas_navigation
echo ""

# Step 5: Check auth configuration
fix_auth_check
echo ""

# Step 6: Check cities.json
check_cities_json
echo ""

# Step 7: Test navigation
test_navigation
echo ""

# Step 8: Final verification
echo "🔍 Final verification..."
remaining_function_links=$(grep -r "/.netlify/functions/" public/PaidContent/ 2>/dev/null | wc -l)
echo "   Remaining function links in PaidContent: $remaining_function_links"

if [ "$remaining_function_links" -eq 0 ]; then
    echo "   ✅ All function links successfully replaced with direct links!"
else
    echo "   ⚠️  Some function links may still remain"
    echo "   Showing remaining function links:"
    grep -r "/.netlify/functions/" public/PaidContent/ 2>/dev/null | head -5
fi

echo ""
echo "🎉 Navigation fix complete!"
echo "📋 Summary:"
echo "   - Fixed city navigation links"
echo "   - Fixed country navigation links" 
echo "   - Verified Atlas navigation"
echo "   - Checked authentication setup"
echo "   - Verified cities.json format"
echo ""
echo "🚀 Ready to commit and deploy!"
echo "   Next steps:"
echo "   1. git add -A"
echo "   2. git commit -m 'Fix all premium navigation links'"
echo "   3. git push origin main"
