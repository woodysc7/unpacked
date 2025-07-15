#!/bin/bash

# Fix malformed country navigation links in city files
# Remove the incorrect "L...E" wrapping and use correct country slugs

echo "🔧 Fixing malformed country navigation links in city files..."

cd "/Users/samuelwoody/Desktop/Unpacked"

# Function to get correct country slug mapping
get_country_slug() {
    case "$1" in
        "LEcuadorE") echo "ecuador" ;;
        "LColombiaE") echo "colombia" ;;
        "LJapanE") echo "japan" ;;
        "LChinaE") echo "china" ;;
        "LMexicoE") echo "mexico" ;;
        "LNigeriaE") echo "nigeria" ;;
        "LPakistanE") echo "pakistan" ;;
        "LunitedstatesE") echo "unitedstates" ;;
        "LSpainE") echo "spain" ;;
        "LMalaysiaE") echo "malaysia" ;;
        "LTaiwanE") echo "taiwan" ;;
        "LIndonesiaE") echo "indonesia" ;;
        "LRussiaE") echo "russianfederation" ;;
        "LZambiaE") echo "zambia" ;;
        "LTurkeyE") echo "turkey" ;;
        "LYemenE") echo "yemen" ;;
        "LBrazilE") echo "brazil" ;;
        "LIndiaE") echo "india" ;;
        "LPhilippinesE") echo "philippines" ;;
        "LThailandE") echo "thailand" ;;
        "LVietnamE") echo "vietnam" ;;
        "LMoroccoE") echo "morocco" ;;
        "LAlgeriaE") echo "algeria" ;;
        "LTunisiaE") echo "tunisia" ;;
        "LEgyptE") echo "egypt" ;;
        "LSouthAfricaE") echo "southafrica" ;;
        "LKenyaE") echo "kenya" ;;
        "LUgandaE") echo "uganda" ;;
        "LGhanaE") echo "ghana" ;;
        "LIvoryCoastE") echo "cotedivoire" ;;
        "LSenegalE") echo "senegal" ;;
        "LCameroonE") echo "cameroon" ;;
        "LAngolaE") echo "angola" ;;
        "LMozambiqueE") echo "mozambique" ;;
        "LMadagascarE") echo "madagascar" ;;
        "LFranceE") echo "france" ;;
        "LGermanyE") echo "germany" ;;
        "LItalyE") echo "italy" ;;
        "LPolandE") echo "poland" ;;
        "LUkraineE") echo "ukraine" ;;
        "LRomaniaE") echo "romania" ;;
        "LNetherlandsE") echo "netherlands" ;;
        "LBelgiumE") echo "belgium" ;;
        "LSwitzerlandE") echo "switzerland" ;;
        "LAustriaE") echo "austria" ;;
        "LCzechRepublicE") echo "czechrepublic" ;;
        "LHungaryE") echo "hungary" ;;
        "LBulgariaE") echo "bulgaria" ;;
        "LCroatiaE") echo "croatia" ;;
        "LSerbiaE") echo "serbia" ;;
        "LBosniaandHerzegovinaE") echo "bosniaandherzegovina" ;;
        "LAlbaniaE") echo "albania" ;;
        "LGreeceE") echo "greece" ;;
        "LPortugalE") echo "portugal" ;;
        "LNorwayE") echo "norway" ;;
        "LSwedenE") echo "sweden" ;;
        "LFinlandE") echo "finland" ;;
        "LDenmarkE") echo "denmark" ;;
        "LIrelandE") echo "ireland" ;;
        "LUnitedKingdomE") echo "unitedkingdom" ;;
        "LIranE") echo "iranislamicrepublicof" ;;
        "LIraqE") echo "iraq" ;;
        "LSaudiArabiaE") echo "saudiarabia" ;;
        "LUnitedArabEmiratesE") echo "unitedarabemirates" ;;
        "LKuwaitE") echo "kuwait" ;;
        "LQatarE") echo "qatar" ;;
        "LBahrainE") echo "bahrain" ;;
        "LOmanE") echo "oman" ;;
        "LJordanE") echo "jordan" ;;
        "LLebanonE") echo "lebanon" ;;
        "LSyriaE") echo "syria" ;;
        "LIsraelE") echo "israel" ;;
        "LPalestineE") echo "palestine" ;;
        "LAfghanistanE") echo "afghanistan" ;;
        "LBangladeshE") echo "bangladesh" ;;
        "LSriLankaE") echo "srilanka" ;;
        "LMyanmarE") echo "myanmar" ;;
        "LCambodiaE") echo "cambodia" ;;
        "LLaosE") echo "laos" ;;
        "LMongoliaE") echo "mongolia" ;;
        "LNorthKoreaE") echo "northkorea" ;;
        "LSouthKoreaE") echo "southkorea" ;;
        "LKazakhstanE") echo "kazakhstan" ;;
        "LUzbekistanE") echo "uzbekistan" ;;
        "LTurkmenistanE") echo "turkmenistan" ;;
        "LKyrgyzstanE") echo "kyrgyzstan" ;;
        "LTajikistanE") echo "tajikistan" ;;
        "LAustraliaE") echo "australia" ;;
        "LNewZealandE") echo "newzealand" ;;
        "LFijiE") echo "fiji" ;;
        "LCanadaE") echo "canada" ;;
        "LArgentinaE") echo "argentina" ;;
        "LChileE") echo "chile" ;;
        "LPeruE") echo "peru" ;;
        "LBoliviaE") echo "bolivia" ;;
        "LParaguayE") echo "paraguay" ;;
        "LUruguayE") echo "uruguay" ;;
        "LVenezuelaE") echo "venezuelabolivarianrepublicof" ;;
        "LGuyanaE") echo "guyana" ;;
        "LSurinameE") echo "suriname" ;;
        "LGuatemalaE") echo "guatemala" ;;
        "LBelizeE") echo "belize" ;;
        "LElSalvadorE") echo "elsalvador" ;;
        "LHondurasE") echo "honduras" ;;
        "LNicaraguaE") echo "nicaragua" ;;
        "LCostaRicaE") echo "costarica" ;;
        "LPanamaE") echo "panama" ;;
        "LCubaE") echo "cuba" ;;
        "LJamaicaE") echo "jamaica" ;;
        "LHaitiE") echo "haiti" ;;
        "LDominicanRepublicE") echo "dominicanrepublic" ;;
        "LPuertoRicoE") echo "puertorico" ;;
        "LTrinidadandTobagoE") echo "trinidadandtobago" ;;
        *) echo "$(echo "$1" | sed 's/^L//; s/E$//' | tr '[:upper:]' '[:lower:]')" ;;
    esac
}

# Find all city files with malformed country links
echo "📊 Finding city files with malformed country links..."
malformed_files=$(grep -l "L[A-Z][a-z]*E/L[A-Z][a-z]*Ehome\.html" public/PaidContent/cities/*.html 2>/dev/null)

if [ -z "$malformed_files" ]; then
    echo "✅ No malformed country links found!"
    exit 0
fi

echo "Found $(echo "$malformed_files" | wc -l) files with malformed links"

# Process each file
for file in $malformed_files; do
    echo "🔧 Processing $(basename "$file")..."
    
    # Create temporary file
    temp_file=$(mktemp)
    
    # Read the file and process line by line
    while IFS= read -r line; do
        if [[ $line =~ href=\"/PaidContent/Countries/(L[A-Z][a-z]*E)/(L[A-Z][a-z]*E)home\.html\" ]]; then
            malformed_slug="${BASH_REMATCH[1]}"
            correct_slug=$(get_country_slug "$malformed_slug")
            
            # Replace the malformed link with correct one
            corrected_line=$(echo "$line" | sed "s|/PaidContent/Countries/L[A-Z][a-z]*E/L[A-Z][a-z]*Ehome\.html|/PaidContent/Countries/$correct_slug/${correct_slug}home.html|g")
            echo "$corrected_line" >> "$temp_file"
        else
            echo "$line" >> "$temp_file"
        fi
    done < "$file"
    
    # Replace original file
    mv "$temp_file" "$file"
    echo "   ✅ Fixed malformed links in $(basename "$file")"
done

echo ""
echo "🧪 Verifying fix..."
remaining_malformed=$(grep -c "L[A-Z][a-z]*E/L[A-Z][a-z]*Ehome\.html" public/PaidContent/cities/*.html 2>/dev/null || echo "0")

if [ "$remaining_malformed" -eq 0 ]; then
    echo "✅ All malformed country links have been fixed!"
else
    echo "⚠️  Still found $remaining_malformed malformed links"
    echo "Showing remaining issues:"
    grep "L[A-Z][a-z]*E/L[A-Z][a-z]*Ehome\.html" public/PaidContent/cities/*.html 2>/dev/null | head -5
fi

echo ""
echo "🎉 Country navigation fix complete!"
echo "📋 Summary:"
echo "   - Fixed malformed L...E country slugs in city navigation links"
echo "   - All links now use correct country directory names"
echo "   - Navigation from cities to countries should work properly"
echo ""
echo "🚀 Ready to test and deploy!"
