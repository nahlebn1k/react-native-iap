---
sidebar_position: 2
---

import AdFitTopFixed from "@site/src/uis/AdFitTopFixed";

# Installation

<AdFitTopFixed />

This guide will help you install and configure React Native IAP in your React Native or Expo project.

:::warning Compatibility (Nitro 14.x)

- `react-native-iap@14.x` is Nitro-based and requires **React Native 0.79+**.
- If you must stay on **RN 0.75.x or lower**, install the last pre‑Nitro version: `npm i react-native-iap@13.1.0`.
- Hitting Swift 6 C++ interop errors in Nitro (e.g. `AnyMap.swift` using `cppPart.pointee.*`)? Pin Swift 5.10 for the `NitroModules` pod (see snippet below) as a temporary workaround.
- Recommended path: Upgrade to RN 0.79+, update `react-native-nitro-modules` and `nitro-codegen` to latest, then `pod install` and do a clean build.
- Easier alternative: Consider Expo IAP; installing `expo-modules-core` first usually smooths setup. Docs: [expo-iap installation](https://expo-iap.hyo.dev/docs/installation)

If issues persist after upgrading or applying the Swift pin, please share a minimal repro (fresh app + `package.json` + `Podfile`). :::

## Prerequisites

Before installing React Native IAP, make sure you have:

- For `react-native-iap@14.x` (Nitro): **React Native 0.79+** (Expo SDK aligned with RN 0.79)
- For older RN (0.75.x or lower): use `react-native-iap@13.1.0` (pre‑Nitro)
- Node.js 16 or later
- iOS 15+ for iOS apps (StoreKit 2 requirement)
- Android API level 21+ for Android apps

## Package Installation

Install the package using your favorite package manager:

```bash
npm install react-native-iap react-native-nitro-modules
```

## Platform Configuration

### For React Native CLI Projects

If you're using React Native CLI projects, you'll need to install expo-modules-core first:

```bash
npx install-expo-modules@latest
```

Learn more about [installing Expo modules in existing React Native projects](https://docs.expo.dev/bare/installing-expo-modules/).

Then install the native dependencies:

#### iOS

For detailed iOS setup instructions, see [iOS Configuration](https://www.openiap.dev/docs/ios-setup).

#### Android

For detailed Android setup instructions, see [Android Configuration](https://www.openiap.dev/docs/android-setup).

### Optional for Expo Managed Workflow

If you're using Expo managed workflow, you'll need to create a [custom development client](https://docs.expo.dev/development/create-development-builds/) since in-app purchases require native modules that aren't available in Expo Go.

1. **Install EAS CLI** (if not already installed):

   ```bash
   npm install -g eas-cli
   ```

2. **Create a development build**:
   ```bash
   eas build --platform ios --profile development
   eas build --platform android --profile development
   ```

## Configuration

### App Store Connect (iOS)

Before you can use in-app purchases on iOS, you need to set up your products in App Store Connect:

1. Sign in to [App Store Connect](https://appstoreconnect.apple.com/)
2. Navigate to your app
3. Go to "Features" > "In-App Purchases"
4. Create your products with unique product IDs

### Google Play Console (Android)

For Android, set up your products in Google Play Console:

1. Sign in to [Google Play Console](https://play.google.com/console/)
2. Navigate to your app
3. Go to "Monetize" > "Products" > "In-app products"
4. Create your products with unique product IDs

## Verification

To verify that React Native IAP is properly installed, create a simple test:

```tsx
import {useIAP} from 'react-native-iap';

function TestComponent() {
  const {connected} = useIAP();

  console.log('IAP Connection status:', connected);

  return null;
}
```

If everything is set up correctly, you should see the connection status logged in your console.

## Next Steps

Now that you have React Native IAP installed, you can:

- [Set up iOS configuration](./getting-started/setup-ios)
- [Set up Android configuration](./getting-started/setup-android)
- [Learn basic usage](./examples/purchase-flow)

## Troubleshooting

If you encounter issues during installation:

1. **Clear node_modules and reinstall**:

   ```bash
   rm -rf node_modules
   npm install
   ```

2. **For iOS, clean and rebuild pods**:

   ```bash
   cd ios
   rm -rf Pods Podfile.lock
   pod install
   ```

   **For Expo projects**, use prebuild instead:

   ```bash
   npx expo prebuild --clean
   ```

3. **For React Native, reset Metro cache**:
   ```bash
   npx react-native start --reset-cache
   ```

For more help, check our [Troubleshooting Guide](./guides/troubleshooting) or [open an issue](https://github.com/hyochan/react-native-iap/issues) on GitHub.
