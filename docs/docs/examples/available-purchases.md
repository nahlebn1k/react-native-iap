---
title: Available Purchases
sidebar_label: Available Purchases
sidebar_position: 3
---

import AdFitTopFixed from "@site/src/uis/AdFitTopFixed";

# Available Purchases & Status

<AdFitTopFixed />

List prior purchases and check subscription status using `useIAP`.

## Prerequisites

- Ensure products/subscriptions are configured in stores
- Users must be signed in to the device stores

## Core Pattern

```tsx
import {useEffect, useCallback} from 'react';
import {useIAP} from 'react-native-iap';

const SUB_IDS = ['your.premium'];

export function AvailablePurchasesExample() {
  const {
    connected,
    subscriptions,
    availablePurchases,
    activeSubscriptions,
    fetchProducts,
    getAvailablePurchases,
    getActiveSubscriptions,
    finishTransaction,
  } = useIAP({
    onPurchaseSuccess: async (purchase) => {
      await finishTransaction({purchase, isConsumable: false});
      setTimeout(() => getActiveSubscriptions(), 1000);
    },
  });

  const load = useCallback(async () => {
    if (!connected) return;
    fetchProducts({skus: SUB_IDS, type: 'subs'});
    await getAvailablePurchases();
  }, [connected, fetchProducts, getAvailablePurchases]);

  useEffect(() => {
    load();
  }, [load]);

  return null;
}
```

## Notes

- Use `getAvailablePurchases()` to restore and list prior purchases.
- After successful purchases, refresh `activeSubscriptions` to reflect status.
- Use `deepLinkToSubscriptions()` to open system subscription settings.

## Using `getAvailablePurchases()` Effectively

- When to call:
  - On first launch after connection to restore entitlements
  - On user action (e.g., “Restore Purchases” button)
  - After a successful purchase to reflect immediately in UI
- De-duplication:
  - Some stores may return multiple records. Prefer de-duplicating by `productId` and most recent `transactionDate`.
  - Keep latest record per product to decide ownership (non-consumables) or show history.
- Ownership logic:
  - Non-consumables: if a purchase exists for a given `productId`, mark as owned and adjust UI (disable purchase, show badge). Avoid silently hiding.
  - Consumables: do not treat available purchases as ownership; they’re historical

### Example: Restore Button

```tsx
function RestoreButton() {
  const {connected, getAvailablePurchases} = useIAP();
  const onRestore = async () => {
    if (!connected) return;
    try {
      await getAvailablePurchases();
    } catch (e) {
      // present user-friendly error
    }
  };
  return <Button title="Restore Purchases" onPress={onRestore} />;
}
```

### Example: Check Non-Consumable Ownership (don’t hide)

```tsx
type MinimalPurchase = {productId?: string};

function buildOwnedNonConsumables(purchases: MinimalPurchase[]) {
  const owned = new Set<string>();
  for (const p of purchases) {
    if (p.productId) owned.add(p.productId);
  }
  return owned;
}

function ProductList({products}: {products: {id: string; title: string}[]}) {
  const {availablePurchases} = useIAP();
  const owned = React.useMemo(
    () => buildOwnedNonConsumables(availablePurchases),
    [availablePurchases],
  );

  return (
    <>
      {products.map((p) => {
        const isOwned = owned.has(p.id);
        return (
          <View key={p.id} style={{padding: 12}}>
            <Text>{p.title}</Text>
            {isOwned ? (
              <Text style={{color: 'green'}}>Owned</Text>
            ) : (
              <Button title="Buy" onPress={() => handleBuy(p.id)} />
            )}
          </View>
        );
      })}
    </>
  );
}
```

## Testing Checklist

- Confirm available purchases populate after sign-in and initial fetch
- Validate that restored purchases match server-side entitlements
- Check that `activeSubscriptions` reflects real status after refresh

## Troubleshooting

- Empty list: ensure the device account owns purchases and is signed in
- Duplicates: de-duplicate by `productId` and latest `transactionDate`
- Errors: wrap calls in try/catch and present user-friendly messages

## Source

- AvailablePurchases.tsx: https://github.com/hyochan/react-native-iap/blob/main/example/screens/AvailablePurchases.tsx
