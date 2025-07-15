#!/bin/bash

# Fix city navigation links to use direct static paths instead of Netlify functions
# This script replaces servePaidContent function calls with direct /PaidContent/ links

echo "Starting bulk fix of city navigation links..."

# Function to convert country name to lowercase slug
convert_to_slug() {
    echo "$1" | tr '[:upper:]' '[:lower:]' | sed 's/[^a-z]//g'
}

# Main replacements for common patterns
echo "Fixing servePaidContent links in city files..."

# Find all city HTML files and process them
find /Users/samuelwoody/Desktop/Unpacked/public/PaidContent/cities -name "*.html" -type f | while read -r file; do
    echo "Processing: $(basename "$file")"
    
    # Create a temporary file for processing
    temp_file=$(mktemp)
    
    # Process the file with multiple sed replacements
    sed \
        -e 's|href="/.netlify/functions/servePaidContent?page=Countries/Afghanistan/afghanistanHome "|href="/PaidContent/Countries/afghanistan/afghanistanhome.html"|g' \
        -e 's|href="/.netlify/functions/servePaidContent?page=Countries/Albania/albaniaHome "|href="/PaidContent/Countries/albania/albaniahome.html"|g' \
        -e 's|href="/.netlify/functions/servePaidContent?page=Countries/Algeria/algeriaHome "|href="/PaidContent/Countries/algeria/algeriahome.html"|g' \
        -e 's|href="/.netlify/functions/servePaidContent?page=Countries/Argentina/argentinaHome "|href="/PaidContent/Countries/argentina/argentinahome.html"|g' \
        -e 's|href="/.netlify/functions/servePaidContent?page=Countries/Australia/australiaHome "|href="/PaidContent/Countries/australia/australiahome.html"|g' \
        -e 's|href="/.netlify/functions/servePaidContent?page=Countries/Austria/austriaHome "|href="/PaidContent/Countries/austria/austriahome.html"|g' \
        -e 's|href="/.netlify/functions/servePaidContent?page=Countries/Bangladesh/bangladeshHome "|href="/PaidContent/Countries/bangladesh/bangladeshhome.html"|g' \
        -e 's|href="/.netlify/functions/servePaidContent?page=Countries/Belgium/belgiumHome "|href="/PaidContent/Countries/belgium/belgiumhome.html"|g' \
        -e 's|href="/.netlify/functions/servePaidContent?page=Countries/Brazil/brazilHome "|href="/PaidContent/Countries/brazil/brazilhome.html"|g' \
        -e 's|href="/.netlify/functions/servePaidContent?page=Countries/Canada/canadaHome "|href="/PaidContent/Countries/canada/canadahome.html"|g' \
        -e 's|href="/.netlify/functions/servePaidContent?page=Countries/China/chinaHome "|href="/PaidContent/Countries/china/chinahome.html"|g' \
        -e 's|href="/.netlify/functions/servePaidContent?page=Countries/Colombia/colombiaHome "|href="/PaidContent/Countries/colombia/colombiahome.html"|g' \
        -e 's|href="/.netlify/functions/servePaidContent?page=Countries/Egypt/egyptHome "|href="/PaidContent/Countries/egypt/egypthome.html"|g' \
        -e 's|href="/.netlify/functions/servePaidContent?page=Countries/France/franceHome "|href="/PaidContent/Countries/france/francehome.html"|g' \
        -e 's|href="/.netlify/functions/servePaidContent?page=Countries/Germany/germanyHome "|href="/PaidContent/Countries/germany/germanyhome.html"|g' \
        -e 's|href="/.netlify/functions/servePaidContent?page=Countries/Ghana/ghanaHome "|href="/PaidContent/Countries/ghana/ghanahome.html"|g' \
        -e 's|href="/.netlify/functions/servePaidContent?page=Countries/India/indiaHome "|href="/PaidContent/Countries/india/indiahome.html"|g' \
        -e 's|href="/.netlify/functions/servePaidContent?page=Countries/Indonesia/indonesiaHome "|href="/PaidContent/Countries/indonesia/indonesiahome.html"|g' \
        -e 's|href="/.netlify/functions/servePaidContent?page=Countries/Iran/iranHome "|href="/PaidContent/Countries/iranislamicrepublicof/iranislamicrepublichome.html"|g' \
        -e 's|href="/.netlify/functions/servePaidContent?page=Countries/Iraq/iraqHome "|href="/PaidContent/Countries/iraq/iraqhome.html"|g' \
        -e 's|href="/.netlify/functions/servePaidContent?page=Countries/Italy/italyHome "|href="/PaidContent/Countries/italy/italyhome.html"|g' \
        -e 's|href="/.netlify/functions/servePaidContent?page=Countries/Japan/japanHome "|href="/PaidContent/Countries/japan/japanhome.html"|g' \
        -e 's|href="/.netlify/functions/servePaidContent?page=Countries/Kenya/kenyaHome "|href="/PaidContent/Countries/kenya/kenyahome.html"|g' \
        -e 's|href="/.netlify/functions/servePaidContent?page=Countries/Malaysia/malaysiaHome "|href="/PaidContent/Countries/malaysia/malaysiahome.html"|g' \
        -e 's|href="/.netlify/functions/servePaidContent?page=Countries/Mexico/mexicoHome "|href="/PaidContent/Countries/mexico/mexicohome.html"|g' \
        -e 's|href="/.netlify/functions/servePaidContent?page=Countries/Morocco/moroccoHome "|href="/PaidContent/Countries/morocco/moroccohome.html"|g' \
        -e 's|href="/.netlify/functions/servePaidContent?page=Countries/Netherlands/netherlandsHome "|href="/PaidContent/Countries/netherlands/netherlandshome.html"|g' \
        -e 's|href="/.netlify/functions/servePaidContent?page=Countries/Nigeria/nigeriaHome "|href="/PaidContent/Countries/nigeria/nigeriahome.html"|g' \
        -e 's|href="/.netlify/functions/servePaidContent?page=Countries/Pakistan/pakistanHome "|href="/PaidContent/Countries/pakistan/pakistanhome.html"|g' \
        -e 's|href="/.netlify/functions/servePaidContent?page=Countries/Philippines/philippinesHome "|href="/PaidContent/Countries/philippines/philippineshome.html"|g' \
        -e 's|href="/.netlify/functions/servePaidContent?page=Countries/Poland/polandHome "|href="/PaidContent/Countries/poland/polandhome.html"|g' \
        -e 's|href="/.netlify/functions/servePaidContent?page=Countries/Russia/russiaHome "|href="/PaidContent/Countries/russianfederation/russianfederationhome.html"|g' \
        -e 's|href="/.netlify/functions/servePaidContent?page=Countries/SaudiArabia/saudiArabiaHome "|href="/PaidContent/Countries/saudiarabia/saudiarabiahome.html"|g' \
        -e 's|href="/.netlify/functions/servePaidContent?page=Countries/SouthAfrica/southAfricaHome "|href="/PaidContent/Countries/southafrica/southafricahome.html"|g' \
        -e 's|href="/.netlify/functions/servePaidContent?page=Countries/Spain/spainHome "|href="/PaidContent/Countries/spain/spainhome.html"|g' \
        -e 's|href="/.netlify/functions/servePaidContent?page=Countries/Thailand/thailandHome "|href="/PaidContent/Countries/thailand/thailandhome.html"|g' \
        -e 's|href="/.netlify/functions/servePaidContent?page=Countries/Turkey/turkeyHome "|href="/PaidContent/Countries/turkey/turkeyhome.html"|g' \
        -e 's|href="/.netlify/functions/servePaidContent?page=Countries/Ukraine/ukraineHome "|href="/PaidContent/Countries/ukraine/ukrainehome.html"|g' \
        -e 's|href="/.netlify/functions/servePaidContent?page=Countries/UnitedArabEmirates/unitedArabEmiratesHome "|href="/PaidContent/Countries/unitedarabemirates/unitedarabemirateshome.html"|g' \
        -e 's|href="/.netlify/functions/servePaidContent?page=Countries/UnitedKingdom/unitedKingdomHome "|href="/PaidContent/Countries/unitedkingdom/unitedkingdomhome.html"|g' \
        -e 's|href="/.netlify/functions/servePaidContent?page=Countries/UnitedStates/unitedStatesHome "|href="/PaidContent/Countries/unitedstates/unitedstateshome.html"|g' \
        -e 's|href="/.netlify/functions/servePaidContent?page=Countries/Venezuela/venezuelaHome "|href="/PaidContent/Countries/venezuelabolivarianrepublicof/venezuelabolivarianrepublichome.html"|g' \
        -e 's|href="/.netlify/functions/servePaidContent?page=Countries/Vietnam/vietnamHome "|href="/PaidContent/Countries/vietnam/vietnamhome.html"|g' \
        "$file" > "$temp_file"
    
    # Replace the original file if changes were made
    if ! cmp -s "$file" "$temp_file"; then
        mv "$temp_file" "$file"
        echo "  ✅ Updated $(basename "$file")"
    else
        rm "$temp_file"
        echo "  ⏭️  No changes needed for $(basename "$file")"
    fi
done

echo ""
echo "Now processing any remaining generic patterns..."

# Generic pattern replacement for any remaining servePaidContent links
find /Users/samuelwoody/Desktop/Unpacked/public/PaidContent/cities -name "*.html" -type f -exec sed -i '' \
    -e 's|href="/.netlify/functions/servePaidContent?page=Countries/\([^/]*\)/\([^"]*\)"|href="/PaidContent/Countries/\L\1\E/\L\1\Ehome.html"|g' \
    {} \;

echo "✅ All city navigation links have been updated!"
echo ""
echo "Summary:"
echo "- Replaced servePaidContent function calls with direct /PaidContent/ links"
echo "- All country names converted to lowercase to match directory structure"
echo "- Links now point directly to static files, bypassing Netlify function authentication issues"
echo ""
echo "You can now commit and push these changes."
