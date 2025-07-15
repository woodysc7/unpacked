#!/bin/bash

# Remove problematic territories from map logic completely
# These territories cause issues and should not appear on the map

echo "🗺️  Removing problematic territories from map logic..."

cd "/Users/samuelwoody/Desktop/Unpacked"

# List of problematic territory names to exclude
PROBLEMATIC_TERRITORIES=(
    "Akrotiri Sovereign Base Area"
    "Ashmore And Cartier Islands"
    "Bajo Nuevo Bank (Petrel Is.)"
    "Baykonur Cosmodrome"
    "Bir Tawil"
    "Brazilian Island"
    "Clipperton Island"
    "Coral Sea Islands"
    "Cyprus No Mans Area"
    "Dhekelia Sovereign Base Area"
    "Indian Ocean Territories"
    "Kosovo"
    "Northern Cyprus"
    "Scarborough Reef"
    "Serranilla Bank"
    "Siachen Glacier"
    "Somaliland"
    "Southern Patagonian Ice Field"
    "Spratly Islands"
    "US Naval Base Guantanamo Bay"
)

# Convert territory names to potential slugs (multiple formats to catch variations)
get_territory_slugs() {
    local name="$1"
    echo "$name" | tr '[:upper:]' '[:lower:]' | sed 's/[^a-z0-9]//g'
    echo "$name" | tr '[:upper:]' '[:lower:]' | sed 's/[^a-z0-9]//_/g' | sed 's/__*/_/g' | sed 's/^_//; s/_$//'
    echo "$name" | tr '[:upper:]' '[:lower:]' | sed 's/[^a-z0-9]/-/g' | sed 's/--*/-/g' | sed 's/^-//; s/-$//'
    echo "$name" | tr '[:upper:]' '[:lower:]' | sed 's/ //g'
}

echo "📊 Scanning for problematic territory folders..."

# Check for and remove any matching territory folders
territories_found=0
for territory in "${PROBLEMATIC_TERRITORIES[@]}"; do
    echo "🔍 Checking for: $territory"
    
    # Generate possible slug variations
    slugs=($(get_territory_slugs "$territory"))
    
    for slug in "${slugs[@]}"; do
        if [ -d "public/PaidContent/Countries/$slug" ]; then
            echo "   🗑️  Found and removing: public/PaidContent/Countries/$slug"
            rm -rf "public/PaidContent/Countries/$slug"
            territories_found=$((territories_found + 1))
        fi
    done
    
    # Also check for common variations
    case "$territory" in
        "Kosovo")
            if [ -d "public/PaidContent/Countries/kosovo" ]; then
                echo "   🗑️  Found and removing: public/PaidContent/Countries/kosovo"
                rm -rf "public/PaidContent/Countries/kosovo"
                territories_found=$((territories_found + 1))
            fi
            ;;
        "Northern Cyprus")
            for dir in "northerncyprus" "cyprusnorth" "turkishcyprus"; do
                if [ -d "public/PaidContent/Countries/$dir" ]; then
                    echo "   🗑️  Found and removing: public/PaidContent/Countries/$dir"
                    rm -rf "public/PaidContent/Countries/$dir"
                    territories_found=$((territories_found + 1))
                fi
            done
            ;;
        "Somaliland")
            if [ -d "public/PaidContent/Countries/somaliland" ]; then
                echo "   🗑️  Found and removing: public/PaidContent/Countries/somaliland"
                rm -rf "public/PaidContent/Countries/somaliland"
                territories_found=$((territories_found + 1))
            fi
            ;;
    esac
done

echo ""
echo "📋 Summary of folder cleanup:"
echo "   - Removed $territories_found problematic territory folders"

echo ""
echo "🗺️  Now updating map logic to exclude these territories..."

# Create a backup of the atlas files
cp "public/premium-atlas-direct.html" "public/premium-atlas-direct.html.backup.$(date +%Y%m%d_%H%M%S)"
cp "public/Atlas/Free/Atlas.html" "public/Atlas/Free/Atlas.html.backup.$(date +%Y%m%d_%H%M%S)"

# Function to update atlas file with territory exclusions
update_atlas_file() {
    local file="$1"
    echo "🔧 Updating $file to exclude problematic territories..."
    
    # Create a temporary file for the updated content
    temp_file=$(mktemp)
    
    # Read the file and add territory exclusion logic
    cat "$file" > "$temp_file"
    
    # Look for the onEachFeature function and add exclusion logic
    if grep -q "onEachFeature.*function" "$temp_file"; then
        # Add exclusion logic before the existing onEachFeature logic
        sed -i '' '/onEachFeature: function(feature, layer) {/a\
            // Exclude problematic territories\
            const problematicTerritories = [\
              "Akrotiri Sovereign Base Area", "Ashmore And Cartier Islands",\
              "Bajo Nuevo Bank (Petrel Is.)", "Baykonur Cosmodrome", "Bir Tawil",\
              "Brazilian Island", "Clipperton Island", "Coral Sea Islands",\
              "Cyprus No Mans Area", "Dhekelia Sovereign Base Area",\
              "Indian Ocean Territories", "Kosovo", "Northern Cyprus",\
              "Scarborough Reef", "Serranilla Bank", "Siachen Glacier",\
              "Somaliland", "Southern Patagonian Ice Field", "Spratly Islands",\
              "US Naval Base Guantanamo Bay"\
            ];\
            const name = feature.properties.name;\
            if (problematicTerritories.includes(name)) {\
              return; // Skip this territory completely\
            }
' "$temp_file"
    fi
    
    # Replace the original file
    mv "$temp_file" "$file"
    echo "   ✅ Updated $file with territory exclusions"
}

# Update both atlas files
update_atlas_file "public/premium-atlas-direct.html"
update_atlas_file "public/Atlas/Free/Atlas.html"

echo ""
echo "🧹 Cleaning up any city references to problematic territories..."

# Remove any city files that might reference these territories
cities_cleaned=0
for territory in "${PROBLEMATIC_TERRITORIES[@]}"; do
    # Convert to potential country names in city filenames
    territory_lower=$(echo "$territory" | tr '[:upper:]' '[:lower:]' | sed 's/[^a-z0-9]//g')
    
    # Check for city files that might reference this territory
    if ls public/PaidContent/cities/*${territory_lower}.html 2>/dev/null | grep -q .; then
        echo "🗑️  Removing city files referencing $territory"
        rm -f public/PaidContent/cities/*${territory_lower}.html
        cities_cleaned=$((cities_cleaned + 1))
    fi
done

echo ""
echo "🧪 Verifying cleanup..."

# Check if any problematic territory folders still exist
remaining_folders=0
for territory in "${PROBLEMATIC_TERRITORIES[@]}"; do
    slugs=($(get_territory_slugs "$territory"))
    for slug in "${slugs[@]}"; do
        if [ -d "public/PaidContent/Countries/$slug" ]; then
            echo "⚠️  Still found: public/PaidContent/Countries/$slug"
            remaining_folders=$((remaining_folders + 1))
        fi
    done
done

if [ "$remaining_folders" -eq 0 ]; then
    echo "✅ All problematic territory folders have been removed!"
else
    echo "⚠️  Still found $remaining_folders problematic territory folders"
fi

echo ""
echo "🎉 Problematic territory cleanup complete!"
echo "📋 Summary:"
echo "   - Removed $territories_found territory folders"
echo "   - Cleaned $cities_cleaned city references"
echo "   - Updated atlas files to exclude territories from map logic"
echo "   - Created backups of atlas files with timestamp"
echo ""
echo "✨ These territories will no longer appear on your map or cause navigation issues!"
echo ""
echo "🚀 Ready to test and deploy!"
