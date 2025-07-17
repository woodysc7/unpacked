#!/bin/bash

# Whitelist Helper Script
# Usage: ./add-to-whitelist.sh email@example.com "reason"

if [ $# -lt 1 ]; then
    echo "Usage: $0 <email> [reason]"
    echo "Example: $0 newuser@example.com 'Admin approved access'"
    exit 1
fi

EMAIL="$1"
REASON="${2:-Manual whitelist addition}"
ADMIN_KEY="admin_fix_2024"

echo "Adding $EMAIL to whitelist..."

curl -X POST https://unpacked.today/.netlify/functions/addToWhitelist \
  -H "Content-Type: application/json" \
  -d "{
    \"email\": \"$EMAIL\",
    \"reason\": \"$REASON\",
    \"adminKey\": \"$ADMIN_KEY\"
  }" \
  | jq '.'

echo "Done!"
