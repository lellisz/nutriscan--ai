import { Platform } from 'react-native';
import Purchases, { LOG_LEVEL, PurchasesPackage, PURCHASES_ERROR_CODE } from 'react-native-purchases';

export type SubscriptionPlan = 'monthly' | 'annual';

export async function initRevenueCat(): Promise<void> {
  const iosKey = process.env.EXPO_PUBLIC_REVENUECAT_IOS_KEY ?? '';
  const androidKey = process.env.EXPO_PUBLIC_REVENUECAT_ANDROID_KEY ?? '';

  const apiKey = Platform.OS === 'ios' ? iosKey : androidKey;

  if (!apiKey) {
    console.warn('[RevenueCat] API key not configured for', Platform.OS);
    return;
  }

  Purchases.setLogLevel(LOG_LEVEL.ERROR);
  await Purchases.configure({ apiKey });
}

export async function checkPremium(): Promise<boolean> {
  try {
    const info = await Purchases.getCustomerInfo();
    return Object.keys(info.entitlements.active).length > 0;
  } catch {
    return false;
  }
}

export async function purchaseSubscription(plan: SubscriptionPlan): Promise<boolean> {
  try {
    const offerings = await Purchases.getOfferings();
    const pkg: PurchasesPackage | null | undefined =
      plan === 'annual' ? offerings.current?.annual : offerings.current?.monthly;

    if (!pkg) {
      return false;
    }

    await Purchases.purchasePackage(pkg);
    return true;
  } catch (error: unknown) {
    if (
      error !== null &&
      typeof error === 'object' &&
      'code' in error &&
      error.code === PURCHASES_ERROR_CODE.PURCHASE_CANCELLED_ERROR
    ) {
      return false;
    }
    throw error;
  }
}

export async function restorePurchases(): Promise<boolean> {
  try {
    await Purchases.restorePurchases();
    return checkPremium();
  } catch {
    return false;
  }
}
