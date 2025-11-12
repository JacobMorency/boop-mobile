# In-App Purchase Setup Guide

This guide will help you set up In-App Purchases (IAP) for your Boop app in both the App Store and Google Play Console.

## Product IDs

The app uses the following product IDs (defined in `lib/purchaseService.ts`):

### Themes (Non-Consumable)
- `theme_blue` - Ocean theme ($0.99)
- `theme_green` - Forest theme ($0.99)
- `theme_pink` - Rose theme ($0.99)
- `theme_orange` - Sunset theme ($0.99)
- `theme_purple` - Amethyst theme ($0.99)

### Donations (Consumable)
- `donate_small` - Small donation ($2.99)
- `donate_medium` - Medium donation ($4.99)
- `donate_large` - Large donation ($9.99)

## iOS Setup (App Store Connect)

1. **Log in to App Store Connect**
   - Go to [appstoreconnect.apple.com](https://appstoreconnect.apple.com)
   - Select your app

2. **Create In-App Purchase Products**
   - Navigate to **Features** → **In-App Purchases**
   - Click the **+** button to create a new product

3. **For Each Theme (Non-Consumable)**:
   - **Type**: Non-Consumable
   - **Product ID**: `theme_blue`, `theme_green`, `theme_pink`, `theme_orange`, `theme_purple`
   - **Price**: $0.99 (or your preferred price)
   - **Display Name**: "Ocean Theme", "Forest Theme", etc.
   - **Description**: "Unlock the [Theme Name] color theme for Boop"

4. **For Each Donation (Consumable)**:
   - **Type**: Consumable
   - **Product ID**: `donate_small`, `donate_medium`, `donate_large`
   - **Price**: $2.99, $4.99, $9.99 respectively
   - **Display Name**: "Small Donation", "Medium Donation", "Large Donation"
   - **Description**: "Support the development of Boop"

5. **Submit for Review**
   - All IAP products must be submitted for review along with your app
   - Make sure product IDs match exactly what's in the code

## Android Setup (Google Play Console)

1. **Log in to Google Play Console**
   - Go to [play.google.com/console](https://play.google.com/console)
   - Select your app

2. **Create In-App Products**
   - Navigate to **Monetize** → **Products** → **In-app products**
   - Click **Create product**

3. **For Each Theme (Managed Product)**:
   - **Product ID**: `theme_blue`, `theme_green`, `theme_pink`, `theme_orange`, `theme_purple`
   - **Name**: "Ocean Theme", "Forest Theme", etc.
   - **Description**: "Unlock the [Theme Name] color theme for Boop"
   - **Price**: Set to $0.99 (or your preferred price)
   - **Status**: Active

4. **For Each Donation (Managed Product)**:
   - **Product ID**: `donate_small`, `donate_medium`, `donate_large`
   - **Name**: "Small Donation", "Medium Donation", "Large Donation"
   - **Description**: "Support the development of Boop"
   - **Price**: $2.99, $4.99, $9.99 respectively
   - **Status**: Active

## Testing

### iOS Testing
1. Create a **Sandbox Tester** account in App Store Connect
2. Sign out of your regular Apple ID on the test device
3. When prompted during purchase, use the sandbox tester account
4. Test purchases won't charge real money

### Android Testing
1. Add test accounts in **Settings** → **License testing**
2. Use a test account on your device
3. Test purchases won't charge real money

## Important Notes

- **Product IDs must match exactly** between your code and the store configurations
- **Themes are Non-Consumable** - users purchase once and own forever
- **Donations are Consumable** - users can donate multiple times
- All products must be **submitted for review** before they work in production
- The app includes **purchase restoration** for users who reinstall

## Troubleshooting

- **"Product not found"**: Check that product IDs match exactly
- **"Purchase failed"**: Ensure products are approved in the store
- **"Not available"**: Make sure IAP is enabled in your app's capabilities/settings

## Next Steps

1. Set up products in both stores
2. Test purchases in sandbox/test environment
3. Submit app and IAP products for review
4. Once approved, purchases will work in production!

