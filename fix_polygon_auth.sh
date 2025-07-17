#!/bin/bash

# Script to add Firebase SDK to all PaidContent country and city pages
# This fixes the authentication issues with polygon clicks

FIREBASE_SCRIPTS='
<!-- Firebase SDK for enhanced authentication -->
<script src="https://www.gstatic.com/firebasejs/8.10.1/firebase-app.js"></script>
<script src="https://www.gstatic.com/firebasejs/8.10.1/firebase-auth.js"></script>
<script src="https://www.gstatic.com/firebasejs/8.10.1/firebase-firestore.js"></script>
<script src="/firebase.js"></script>
<script src="/firebase-auth-enhanced.js"></script>'

echo "🔥 Adding Firebase SDK to PaidContent pages..."

# Function to add Firebase scripts to a file
add_firebase_to_file() {
    local file="$1"
    
    # Check if Firebase is already included
    if grep -q "firebase-app.js" "$file"; then
        echo "   ✅ $file already has Firebase SDK"
        return 0
    fi
    
    # Check if auth-check.js exists in the file
    if grep -q "auth-check.js" "$file"; then
        # Add Firebase scripts before auth-check.js
        sed -i.backup "s|<script src=\"/PaidContent/auth-check.js\"></script>|$FIREBASE_SCRIPTS\n<script src=\"/PaidContent/auth-check.js\"></script>|" "$file"
        echo "   ✅ Added Firebase SDK to $file"
        # Remove backup file
        rm "${file}.backup" 2>/dev/null
    else
        echo "   ⚠️  No auth-check.js found in $file"
    fi
}

# Process all country pages
echo "📍 Processing country pages..."
find public/PaidContent/Countries -name "*.html" | while read file; do
    add_firebase_to_file "$file"
done

# Process all city pages
echo "🏙️  Processing city pages..."
find public/PaidContent/cities -name "*.html" | while read file; do
    add_firebase_to_file "$file"
done

echo "🎉 Firebase SDK addition complete!"
echo "💡 Users should now be able to click on country/city polygons without authentication issues."
