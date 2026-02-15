#!/bin/bash

# SEO Verification Script for Facemaxify
# Run this after deployment to verify all SEO elements are working

echo "🔍 Facemaxify SEO Verification Script"
echo "======================================"
echo ""

# Check if URL is provided
if [ -z "$1" ]; then
    URL="https://facemaxify.com"
    echo "⚠️  No URL provided, using default: $URL"
else
    URL="$1"
fi

echo "Testing URL: $URL"
echo ""

# Test 1: Check if site is accessible
echo "1️⃣  Testing site accessibility..."
if curl -s --head "$URL" | grep "200 OK" > /dev/null; then
    echo "   ✅ Site is accessible"
else
    echo "   ❌ Site is not accessible or returned an error"
fi
echo ""

# Test 2: Check for meta description
echo "2️⃣  Checking meta description..."
if curl -s "$URL" | grep -q 'meta name="description"'; then
    echo "   ✅ Meta description found"
    curl -s "$URL" | grep 'meta name="description"' | head -1
else
    echo "   ❌ Meta description not found"
fi
echo ""

# Test 3: Check for Open Graph tags
echo "3️⃣  Checking Open Graph tags..."
if curl -s "$URL" | grep -q 'property="og:title"'; then
    echo "   ✅ Open Graph tags found"
else
    echo "   ❌ Open Graph tags not found"
fi
echo ""

# Test 4: Check for Twitter Card tags
echo "4️⃣  Checking Twitter Card tags..."
if curl -s "$URL" | grep -q 'name="twitter:card"'; then
    echo "   ✅ Twitter Card tags found"
else
    echo "   ❌ Twitter Card tags not found"
fi
echo ""

# Test 5: Check robots.txt
echo "5️⃣  Checking robots.txt..."
if curl -s "$URL/robots.txt" | grep -q "Sitemap:"; then
    echo "   ✅ robots.txt found and contains sitemap reference"
    echo "   Content:"
    curl -s "$URL/robots.txt"
else
    echo "   ❌ robots.txt not found or missing sitemap"
fi
echo ""

# Test 6: Check sitemap.xml
echo "6️⃣  Checking sitemap.xml..."
if curl -s "$URL/sitemap.xml" | grep -q "<urlset"; then
    echo "   ✅ sitemap.xml found and valid"
    echo "   URLs in sitemap:"
    curl -s "$URL/sitemap.xml" | grep "<loc>" | sed 's/.*<loc>\(.*\)<\/loc>.*/   - \1/'
else
    echo "   ❌ sitemap.xml not found or invalid"
fi
echo ""

# Test 7: Check for structured data
echo "7️⃣  Checking structured data (JSON-LD)..."
if curl -s "$URL" | grep -q 'application/ld+json'; then
    echo "   ✅ Structured data found"
else
    echo "   ❌ Structured data not found"
fi
echo ""

# Test 8: Check canonical URL
echo "8️⃣  Checking canonical URL..."
if curl -s "$URL" | grep -q 'rel="canonical"'; then
    echo "   ✅ Canonical URL found"
    curl -s "$URL" | grep 'rel="canonical"' | head -1
else
    echo "   ❌ Canonical URL not found"
fi
echo ""

# Test 9: Check page speed (basic)
echo "9️⃣  Testing page load time..."
START_TIME=$(date +%s%N)
curl -s "$URL" > /dev/null
END_TIME=$(date +%s%N)
LOAD_TIME=$(( ($END_TIME - $START_TIME) / 1000000 ))
echo "   ⏱️  Page loaded in ${LOAD_TIME}ms"
if [ $LOAD_TIME -lt 3000 ]; then
    echo "   ✅ Good load time (< 3 seconds)"
else
    echo "   ⚠️  Slow load time (> 3 seconds) - consider optimization"
fi
echo ""

# Test 10: Check social images
echo "🔟 Checking social sharing images..."
if curl -s --head "$URL/og-image.png" | grep "200 OK" > /dev/null; then
    echo "   ✅ og-image.png found"
else
    echo "   ❌ og-image.png not found"
fi

if curl -s --head "$URL/twitter-image.png" | grep "200 OK" > /dev/null; then
    echo "   ✅ twitter-image.png found"
else
    echo "   ❌ twitter-image.png not found"
fi
echo ""

# Summary
echo "======================================"
echo "📊 SEO Verification Complete!"
echo ""
echo "📝 Next Steps:"
echo "   1. Fix any ❌ issues above"
echo "   2. Test meta tags at: https://metatags.io/"
echo "   3. Test social sharing at: https://www.opengraph.xyz/"
echo "   4. Submit sitemap to Google Search Console"
echo "   5. Set up Google Analytics"
echo ""
echo "🔗 Useful Links:"
echo "   - Google Search Console: https://search.google.com/search-console"
echo "   - Meta Tags Tester: https://metatags.io/"
echo "   - Open Graph Tester: https://www.opengraph.xyz/"
echo "   - Twitter Card Validator: https://cards-dev.twitter.com/validator"
echo "   - PageSpeed Insights: https://pagespeed.web.dev/"
echo ""
echo "Good luck! 🚀"
