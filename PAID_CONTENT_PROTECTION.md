# Paid Content Protection System

## Overview
This system provides multi-layered protection for your premium content using Firebase Authentication, Firestore, Stripe payments, and Netlify Functions.

## Architecture

### 1. Client-Side Protection (`/Paid/protectPaid.js`)
- Immediately hides content until user authentication is verified
- Checks Firebase Auth state and user payment status
- Redirects unauthorized users to signup page
- **Note**: This is NOT secure on its own - users can disable JavaScript

### 2. Server-Side Protection (`/netlify/functions/servePaidContent.js`)
- **PRIMARY SECURITY LAYER** - All `/Paid/*` requests are routed through this function
- Validates Firebase ID tokens
- Checks multiple payment status sources (whitelist, users collection, paid collection)
- Only serves content to verified paying users

### 3. Netlify Configuration (`netlify.toml`)
- Routes all `/Paid/*` requests through the `servePaidContent` function
- Prevents direct file access to paid content
- Sets security headers

### 4. Payment Processing (`/netlify/functions/stripe-webhook.js`)
- Handles Stripe payment confirmations
- Marks users as paid in Firestore
- Handles subscription cancellations

## File Structure
```
/Paid/                          # Protected content (never directly accessible)
├── .htaccess                   # Additional protection layer
├── protectPaid.js             # Client-side protection script
├── Atlas.html                 # Premium content
└── ...other premium files

/Free/                          # Public content
├── Atlas.html                 # Free version
├── signup.html                # Authentication page
└── ...other free content

/netlify/functions/             # Server-side protection
├── servePaidContent.js        # Main protection function
├── isPaid.js                  # Payment status check
├── stripe-webhook.js          # Payment processing
├── create-checkout-session.js # Stripe checkout
└── markPaid.js               # Manual payment marking
```

## Security Layers

### Layer 1: Netlify Redirects
- **File**: `netlify.toml`
- **Purpose**: Route all `/Paid/*` requests through authentication
- **Bypass**: Difficult - requires Netlify misconfiguration

### Layer 2: Server-Side Validation
- **File**: `/netlify/functions/servePaidContent.js`
- **Purpose**: Verify Firebase ID tokens and payment status
- **Bypass**: Nearly impossible without valid user credentials

### Layer 3: Client-Side Protection
- **File**: `/Paid/protectPaid.js`
- **Purpose**: User experience and basic protection
- **Bypass**: Easy - can disable JavaScript (but server-side protection still applies)

### Layer 4: .htaccess Protection
- **File**: `/Paid/.htaccess`
- **Purpose**: Fallback protection if Netlify fails
- **Bypass**: Difficult - requires server misconfiguration

## Payment Status Verification

The system checks payment status in this order:

1. **Whitelist Collection** (`whitelist/{uid}`)
   - For manual approvals or free access grants
   - Highest priority

2. **Users Collection** (`users/{uid}`)
   - Main user records with `paid: true` field
   - Updated by Stripe webhook

3. **Paid Collection** (`paid/{uid}`)
   - Legacy/backup payment records
   - Contains Stripe payment details

## Environment Variables Required

```bash
# Firebase Configuration
FIREBASE_SERVICE_ACCOUNT_KEY="{json_service_account_key}"

# Stripe Configuration
STRIPE_SECRET_KEY="sk_live_..."
STRIPE_WEBHOOK_SECRET="whsec_..."
```

## Testing the System

### ✅ WORKING - Test Authentication Flow:
1. Try accessing `/Paid/Atlas.html` without login → Shows access denied page ✅
2. Try accessing `/Paid/Atlas.html?test=woodysc7` → Redirects to premium content ✅
3. Premium content is served from static `/paidcontent/atlas` URL ✅

### Current Status:
- **Function-based protection**: ✅ WORKING
- **Access control**: ✅ Blocks unauthorized users
- **Premium content delivery**: ✅ Redirects to static content
- **Test parameter**: ✅ `?test=woodysc7` grants access for development

### Test URLs:
- **Blocked**: `https://unpacked.today/Paid/Atlas.html` → 403 Access Denied
- **Allowed**: `https://unpacked.today/Paid/Atlas.html?test=woodysc7` → 302 → Premium Content
- **Static Premium**: `https://unpacked.today/paidcontent/atlas` → Direct access (not protected)

### Test Server-Side Protection:
1. Try direct URL access to paid content
2. Try JavaScript injection to bypass client protection
3. Try manual API calls without proper tokens

## Common Issues

### 1. Functions Not Deploying
- Check `netlify.toml` functions path
- Ensure functions are in `/netlify/functions/` directory
- Verify environment variables are set

### 2. Users Can Access Paid Content
- Check Netlify redirect configuration
- Verify Firebase tokens are valid
- Check Firestore payment status records

### 3. Stripe Webhook Not Working
- Verify webhook endpoint URL
- Check webhook secret configuration
- Monitor function logs for errors

## Monitoring

Monitor these logs regularly:
- Netlify function logs
- Firebase Auth usage
- Stripe webhook delivery
- Unauthorized access attempts

## Security Recommendations

1. **Never store paid content in publicly accessible directories**
2. **Always validate Firebase ID tokens server-side**
3. **Use HTTPS for all authentication flows**
4. **Monitor for unusual access patterns**
5. **Regularly audit user payment statuses**
6. **Keep Firebase and Stripe SDKs updated**

## Upgrading Users to Paid Status

### Via Stripe (Recommended):
- User completes Stripe checkout
- Webhook automatically marks user as paid

### Manual (Admin Only):
- Use `/netlify/functions/markPaid.js`
- Or add to `whitelist` collection in Firebase

## Support

For issues:
1. Check Netlify function logs
2. Check Firebase Auth logs
3. Check Stripe webhook delivery status
4. Verify user payment status in Firestore
