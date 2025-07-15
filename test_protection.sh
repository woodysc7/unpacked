#!/bin/bash

# Paid Content Protection Test Script
# Run this script to test your paid content protection system

echo "🔒 Testing Paid Content Protection System"
echo "=========================================="

BASE_URL="https://unpacked.today"  # Update this to your domain
if [ "$1" != "" ]; then
    BASE_URL="$1"
fi

echo "Testing against: $BASE_URL"
echo ""

# Test 1: Direct access to paid content (should fail)
echo "Test 1: Direct access to paid content (should redirect/block)"
echo "Requesting: $BASE_URL/Paid/Atlas.html"
response=$(curl -s -w "%{http_code}" -o /dev/null "$BASE_URL/Paid/Atlas.html")
if [ "$response" = "200" ]; then
    echo "❌ SECURITY ISSUE: Direct access to paid content returned 200"
else
    echo "✅ GOOD: Direct access blocked (HTTP $response)"
fi
echo ""

# Test 2: Check if Netlify function is working
echo "Test 2: Netlify function endpoint"
echo "Requesting: $BASE_URL/.netlify/functions/servePaidContent?page=Atlas"
response=$(curl -s -w "%{http_code}" -o /dev/null "$BASE_URL/.netlify/functions/servePaidContent?page=Atlas")
if [ "$response" = "401" ] || [ "$response" = "403" ]; then
    echo "✅ GOOD: Function properly blocks unauthorized access (HTTP $response)"
else
    echo "⚠️  WARNING: Function returned HTTP $response (check authentication)"
fi
echo ""

# Test 3: Check isPaid function
echo "Test 3: isPaid function without auth"
echo "Requesting: $BASE_URL/.netlify/functions/isPaid"
response=$(curl -s "$BASE_URL/.netlify/functions/isPaid")
echo "Response: $response"
if [[ $response == *"Missing uid"* ]] || [[ $response == *"paid\":false"* ]]; then
    echo "✅ GOOD: isPaid function working correctly"
else
    echo "⚠️  Check isPaid function implementation"
fi
echo ""

# Test 4: Free content access (should work)
echo "Test 4: Free content access"
echo "Requesting: $BASE_URL/Free/Atlas.html"
response=$(curl -s -w "%{http_code}" -o /dev/null "$BASE_URL/Free/Atlas.html")
if [ "$response" = "200" ]; then
    echo "✅ GOOD: Free content accessible (HTTP $response)"
else
    echo "❌ ISSUE: Free content not accessible (HTTP $response)"
fi
echo ""

# Test 5: Check for common bypass attempts
echo "Test 5: Directory traversal protection"
echo "Requesting: $BASE_URL/.netlify/functions/servePaidContent?page=../Free/Atlas"
response=$(curl -s -w "%{http_code}" -o /dev/null "$BASE_URL/.netlify/functions/servePaidContent?page=../Free/Atlas")
if [ "$response" = "403" ] || [ "$response" = "400" ]; then
    echo "✅ GOOD: Directory traversal blocked (HTTP $response)"
else
    echo "❌ SECURITY ISSUE: Directory traversal not properly blocked (HTTP $response)"
fi
echo ""

echo "🔍 Manual Tests to Perform:"
echo "1. Open browser to $BASE_URL/Paid/Atlas.html"
echo "2. Verify you're redirected to authentication"
echo "3. Login with non-paying account - should see access denied"
echo "4. Login with paying account - should see content"
echo "5. Try disabling JavaScript - should still be blocked by server"
echo ""

echo "📊 Check these in your admin panels:"
echo "1. Netlify Functions logs for any errors"
echo "2. Firebase Auth for user authentication"
echo "3. Firestore for payment status records"
echo "4. Stripe webhook delivery status"
