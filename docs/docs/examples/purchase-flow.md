---
title: Purchase Flow
sidebar_label: Purchase Flow
sidebar_position: 1
---

import AdFitTopFixed from "@site/src/uis/AdFitTopFixed";

# Purchase Flow (Products)

<AdFitTopFixed />

An end-to-end in-app purchase flow using the `useIAP` hook. This mirrors the example screen used in the app.

## Highlights

- Product loading via `fetchProducts`
- Purchase via `requestPurchase`
- Handle results in `onPurchaseSuccess` / `onPurchaseError`
- Always call `finishTransaction`
- iOS app transaction check with `getAppTransactionIOS`

## Flow Overview

1. initConnection: Established automatically by `useIAP` on mount; wait for `connected === true`.
2. fetchProducts: Load your products once connected.
3. requestPurchase: Trigger a purchase for the selected product.
4. Server validation: Validate `purchase.purchaseToken` on your backend.
5. finishTransaction: Only after successful validation, complete the transaction.
6. Optional: Refresh prior purchases via `getAvailablePurchases()` to update UI.

## Prerequisites

- Configure products in App Store Connect and Google Play Console
- Decide consumable vs non-consumable behavior
- Prepare a backend endpoint to validate `purchaseToken`

## Minimal Pattern

```tsx
import {useIAP, requestPurchase, getAppTransactionIOS} from 'react-native-iap';

const PRODUCT_IDS = ['your.consumable', 'your.nonconsumable'];

export function PurchaseFlowExample() {
  const {connected, products, fetchProducts, finishTransaction} = useIAP({
    onPurchaseSuccess: async (purchase) => {
      // 4) Validate on your server first, then finish
      const ok = await validateReceiptOnServer(purchase);
      if (ok) {
        await finishTransaction({purchase, isConsumable: true});
      }
    },
    onPurchaseError: (e) => {
      // optional: show a toast/alert
      console.warn('Purchase failed', e);
    },
  });

  useEffect(() => {
    // 1) initConnection happens automatically in the hook
    // 2) Once connected, fetch products
    if (connected) fetchProducts({skus: PRODUCT_IDS, type: 'in-app'});
  }, [connected, fetchProducts]);

  const buy = async (productId: string) => {
    // 3) Request purchase; result comes via onPurchaseSuccess/onPurchaseError
    await requestPurchase({
      request: {
        ios: {sku: productId},
        android: {skus: [productId]},
      },
      type: 'in-app',
    });
  };

  return null;
}
```

## iOS App Transaction

```ts
const tx = await getAppTransactionIOS();
```

## Notes

- Validate receipts server-side using `purchase.purchaseToken`.
- Call `finishTransaction` for every successful purchase.
- Results arrive through listeners (via the hook callbacks), not the return value of `requestPurchase`.

### Example server validation

```ts
async function validateReceiptOnServer(purchase: {
  purchaseToken: string;
  productId?: string;
}) {
  const res = await fetch('https://your.server/validate', {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify({
      platform: Platform.OS,
      productId: purchase.productId,
      purchaseToken: purchase.purchaseToken,
    }),
  });
  const json = await res.json();
  return Boolean(json?.isValid);
}
```

## Testing Checklist

- Use sandbox/test accounts on both platforms
- Verify your server receives `purchaseToken` and productId
- Confirm `finishTransaction` clears pending transactions

## Troubleshooting

- Purchase not delivered: ensure `onPurchaseSuccess` fires and `finishTransaction` is called after validation
- iOS cancelled: `E_USER_CANCELLED` — no action required
- Non-consumables: hide already-owned items based on available purchases

## Source

- PurchaseFlow.tsx: https://github.com/hyochan/react-native-iap/blob/main/example/screens/PurchaseFlow.tsx
