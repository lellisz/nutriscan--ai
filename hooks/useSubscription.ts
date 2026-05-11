import { useState, useEffect, useCallback } from 'react';
import Purchases, { CustomerInfo } from 'react-native-purchases';

function hasActivePremium(info: CustomerInfo): boolean {
  return Object.keys(info.entitlements.active).length > 0;
}

export function useSubscription() {
  const [isPremium, setIsPremium] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const checkPremium = useCallback(async () => {
    try {
      const info = await Purchases.getCustomerInfo();
      setIsPremium(hasActivePremium(info));
    } catch {
      setIsPremium(false);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    checkPremium();

    const listener = (info: CustomerInfo) => {
      setIsPremium(hasActivePremium(info));
    };

    Purchases.addCustomerInfoUpdateListener(listener);

    return () => {
      Purchases.removeCustomerInfoUpdateListener(listener);
    };
  }, [checkPremium]);

  const recheckPremium = useCallback(async () => {
    setIsLoading(true);
    await checkPremium();
  }, [checkPremium]);

  return { isPremium, isLoading, recheckPremium };
}
