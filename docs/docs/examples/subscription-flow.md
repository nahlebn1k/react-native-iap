---
title: Subscription Flow
sidebar_label: Subscriptions
sidebar_position: 2
---

import AdFitTopFixed from "@site/src/uis/AdFitTopFixed";

# Subscription Flow

<AdFitTopFixed />

A focused subscription experience built with the `useIAP` hook.

## Prerequisites

- Configure subscription base plans (Android) and subscription groups (iOS)
- Ensure test users are added to each console
- Decide initial products and offers to present

## Core Pattern

```tsx
import {useEffect} from 'react';
import {
  useIAP,
  requestPurchase,
  deepLinkToSubscriptions,
} from 'react-native-iap';

const SUB_IDS = ['your.monthly', 'your.yearly'];

export function SubscriptionFlowExample() {
  const {
    connected,
    subscriptions,
    activeSubscriptions,
    fetchProducts,
    getActiveSubscriptions,
    finishTransaction,
  } = useIAP({
    onPurchaseSuccess: async (purchase) => {
      // 4) Validate on server, then finish
      const ok = await validateSubscriptionOnServer(purchase);
      if (ok) {
        await finishTransaction({purchase, isConsumable: false});
      }
      await getActiveSubscriptions();
    },
  });

  useEffect(() => {
    // 1) initConnection via hook. 2) Fetch subscriptions once connected
    if (connected) {
      fetchProducts({skus: SUB_IDS, type: 'subs'});
      // Optionally load current status at start
      getActiveSubscriptions();
    }
  }, [connected, fetchProducts, getActiveSubscriptions]);

  const subscribe = async (productId: string) => {
    const product = subscriptions.find((p) => p.id === productId);
    // 3) Request purchase; result via onPurchaseSuccess/onPurchaseError
    await requestPurchase({
      request: {
        ios: {sku: productId},
        android: {
          skus: [productId],
          subscriptionOffers:
            product?.subscriptionOfferDetails?.map((o) => ({
              sku: productId,
              offerToken: o.offerToken,
            })) || [],
        },
      },
      type: 'subs',
    });
  };

  const manage = () => deepLinkToSubscriptions();

  return null;
}
```

## Notes

- Use `activeSubscriptions` or `getActiveSubscriptions()` to determine status.
- Always finish subscription transactions with `isConsumable: false`.
- On Android, pass `subscriptionOffers` when available.

## Flow Overview

1. initConnection: Hook initializes on mount; check `connected`.
2. fetchProducts: Fetch subscriptions after connection is ready.
3. requestPurchase: Initiate subscription purchase.
4. Server validation: Validate subscription on server with `purchaseToken`.
5. finishTransaction: Complete the transaction only after validation.
6. Refresh status: Call `getActiveSubscriptions()` to update UI.

### Example server validation

```ts
async function validateSubscriptionOnServer(purchase: {
  purchaseToken: string;
  productId?: string;
}) {
  const res = await fetch('https://your.server/validate-subscription', {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify({
      platform: Platform.OS,
      productId: purchase.productId,
      purchaseToken: purchase.purchaseToken,
    }),
  });
  const json = await res.json();
  return Boolean(json?.isActive);
}
```

## Checking Subscription Status

### Using `getAvailablePurchases()`

- Purpose: Restore/sync past purchases recorded in the store. Does not guarantee that a subscription is currently active; use it to display history or trigger re-validation.
- When to call:
  - Once after initial screen load when `connected` becomes true
  - When the user taps “Restore Purchases”
  - Right after a successful subscription purchase to refresh UI
- Note: Always confirm the current active status using `getActiveSubscriptions()` or your server.

```tsx
function RestoreSubscriptions() {
  const {
    connected,
    getAvailablePurchases,
    availablePurchases,
    getActiveSubscriptions,
  } = useIAP();

  const onRestore = async () => {
    if (!connected) return;
    await getAvailablePurchases();
    // After restore, sync actual active status
    await getActiveSubscriptions();
  };

  return (
    <View>
      <Button title="Restore Purchases" onPress={onRestore} />
      {availablePurchases.map((p, i) => (
        <Text key={p.productId + i}>{p.productId}</Text>
      ))}
    </View>
  );
}
```

### Using `getActiveSubscriptions()` and `hasActiveSubscriptions()`

- When to call:
  - On app/startup after connection to hydrate UI
  - After a successful purchase or restore
  - Before gating premium features
- `activeSubscriptions` state vs method:
  - `activeSubscriptions` is kept in state and updates after `getActiveSubscriptions()` calls
  - `getActiveSubscriptions(ids?)` returns fresh data and also updates the state
  - `hasActiveSubscriptions(ids?)` is a fast boolean helper for gating
- Filtering by tiers/ids:
  - Pass a subset `ids` to check a specific plan or tier
- UI gating pattern:

```tsx
function PremiumGate({children}: {children: React.ReactNode}) {
  const {connected, hasActiveSubscriptions, getActiveSubscriptions} = useIAP();
  const [allowed, setAllowed] = useState(false);

  useEffect(() => {
    if (!connected) return;
    (async () => {
      await getActiveSubscriptions(); // hydrate
      const ok = await hasActiveSubscriptions();
      setAllowed(ok);
    })();
  }, [connected, getActiveSubscriptions, hasActiveSubscriptions]);

  if (!allowed) return <Paywall />;
  return <>{children}</>;
}
```

#### Check specific plan

```ts
const hasYearly = await hasActiveSubscriptions(['com.app.yearly']);
```

### Status Semantics

- iOS: `expirationDateIOS` indicates expiry; use server receipt validation for source of truth
- Android: `autoRenewingAndroid` can be false for canceled renewals; also validate on server

## Testing Checklist

- Verify active status updates after purchase/restoration
- Test upgrade/downgrade scenarios on Android with offers
- Validate status on app launch using `getActiveSubscriptions()`

## Troubleshooting

- Subscription not active: ensure `finishTransaction` was called and server validation succeeds
- Cannot purchase: check if user already has an active subscription in that group
- Manage link not opening: confirm `deepLinkToSubscriptions()` usage and device supports it

## Source

- SubscriptionFlow.tsx: https://github.com/hyochan/react-native-iap/blob/main/example/screens/SubscriptionFlow.tsx
