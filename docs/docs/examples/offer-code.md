---
title: Offer Code Redemption
sidebar_label: Offer Codes
sidebar_position: 4
---

import AdFitTopFixed from "@site/src/uis/AdFitTopFixed";

# Offer Code Redemption

<AdFitTopFixed />

How to redeem offer/promo codes on iOS and Android.

## Prerequisites

- iOS: Configure Offer Codes in App Store Connect
- Android: Generate promo codes in Google Play Console

## iOS

Use the native redemption sheet:

```ts
import {presentCodeRedemptionSheetIOS} from 'react-native-iap';

await presentCodeRedemptionSheetIOS();
```

After redemption, the purchase appears in purchase history. Use `getAvailablePurchases()` to refresh your UI.

## Android

Redeem promo codes in Google Play Store (no direct API to open the screen). Guide users:

1. Open Google Play Store
2. Profile → Payments & subscriptions
3. Redeem code
4. Return to app and refresh purchases

## Testing

- iOS: Generate codes in App Store Connect, test on real devices or TestFlight.
- Android: Generate promo codes in Google Play Console; test with your Google account.

## Troubleshooting

- iOS sheet not appearing: ensure device is signed into App Store and app is eligible for Offer Codes
- Android confusion: make it explicit that redemption occurs in the Play Store, not in-app

## Source

- OfferCode.tsx: https://github.com/hyochan/react-native-iap/blob/main/example/screens/OfferCode.tsx
