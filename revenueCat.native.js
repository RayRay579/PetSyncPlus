import { Platform } from 'react-native';
import Constants from 'expo-constants';
import Purchases from 'react-native-purchases';

let configuredApiKey = null;
let configuredUserId = null;

const getRevenueCatApiKey = () => {
  const extra = Constants?.expoConfig?.extra || {};
  const revenueCat = extra.revenueCat || {};

  return Platform.OS === 'ios'
    ? String(revenueCat.iosApiKey || extra.revenueCatIosApiKey || revenueCat.apiKey || extra.revenueCatApiKey || '').trim()
    : String(revenueCat.androidApiKey || extra.revenueCatAndroidApiKey || revenueCat.apiKey || extra.revenueCatApiKey || '').trim();
};

const getPremiumActive = (customerInfo) => Boolean(customerInfo?.entitlements?.active?.Premium);

const getOfferingsSnapshot = (offerings) => {
  const current = offerings?.current || null;
  const monthlyPackage = current?.monthly || current?.availablePackages?.find((item) => String(item?.packageType || '').toLowerCase().includes('monthly')) || null;
  const annualPackage = current?.annual || current?.availablePackages?.find((item) => String(item?.packageType || '').toLowerCase().includes('annual')) || null;

  return {
    offerings,
    currentOffering: current,
    monthlyPackage,
    annualPackage,
  };
};

const buildResult = (ready, customerInfo = null, error = null) => ({
  ready: Boolean(ready),
  customerInfo,
  premiumActive: getPremiumActive(customerInfo),
  error,
});

const buildExtendedResult = ({
  ready,
  customerInfo = null,
  offerings = null,
  error = null,
  cancelled = false,
}) => {
  const nextOfferings = offerings ? getOfferingsSnapshot(offerings) : {
    offerings: null,
    currentOffering: null,
    monthlyPackage: null,
    annualPackage: null,
  };

  return {
    ...buildResult(ready, customerInfo, error),
    cancelled: Boolean(cancelled),
    ...nextOfferings,
  };
};

const configurePurchases = () => {
  const apiKey = getRevenueCatApiKey();
  if (!apiKey) {
    console.log('RevenueCat configure skipped', {
      platform: Platform.OS,
      sdkKeyPresent: false,
    });
    return false;
  }

  if (configuredApiKey !== apiKey) {
    console.log('RevenueCat configure start', {
      platform: Platform.OS,
      sdkKeyPresent: true,
      sdkKeyPrefix: `${apiKey.slice(0, 6)}...`,
    });
    Purchases.configure({ apiKey });
    configuredApiKey = apiKey;
    configuredUserId = null;
    console.log('RevenueCat configure success');
  }

  return true;
};

export const initializeRevenueCatForUser = async (userId) => {
  try {
    const apiKey = getRevenueCatApiKey();
    console.log('RevenueCat init started', {
      platform: Platform.OS,
      userIdPresent: Boolean(userId),
      sdkKeyPresent: Boolean(apiKey),
      sdkKeyPrefix: apiKey ? `${apiKey.slice(0, 6)}...` : 'missing',
    });
    const configured = configurePurchases();
    if (!configured) {
      return buildExtendedResult({ ready: false, customerInfo: null, offerings: null, error: null });
    }

    if (userId) {
      if (configuredUserId !== userId) {
        await Purchases.logIn(userId);
        configuredUserId = userId;
      }
    } else if (configuredUserId) {
      await Purchases.logOut();
      configuredUserId = null;
    }

    console.log('RevenueCat getCustomerInfo start');
    const customerInfo = await Purchases.getCustomerInfo();
    console.log('RevenueCat getCustomerInfo success', {
      hasPremiumEntitlement: Boolean(customerInfo?.entitlements?.active?.Premium),
    });

    console.log('RevenueCat getOfferings start');
    const offerings = await Purchases.getOfferings();
    const currentOffering = offerings?.current || null;
    const monthlyPackage = currentOffering?.monthly || currentOffering?.availablePackages?.find((item) => String(item?.packageType || '').toLowerCase().includes('monthly')) || null;
    const annualPackage = currentOffering?.annual || currentOffering?.availablePackages?.find((item) => String(item?.packageType || '').toLowerCase().includes('annual')) || null;
    console.log('RevenueCat getOfferings success', {
      currentOfferingExists: Boolean(currentOffering),
      currentOfferingIdentifier: currentOffering?.identifier || null,
      monthlyPackageExists: Boolean(monthlyPackage),
      annualPackageExists: Boolean(annualPackage),
      availableOfferingIdentifiers: Object.keys(offerings?.all || {}),
      availablePackageIdentifiers: (currentOffering?.availablePackages || []).map((item) => item?.identifier || null).filter(Boolean),
    });
    return buildExtendedResult({ ready: true, customerInfo, offerings, error: null });
  } catch (error) {
    console.log('RevenueCat bootstrap error:', {
      message: error?.message || String(error),
      code: error?.code || null,
      userCancelled: Boolean(error?.userCancelled),
    });
    return buildExtendedResult({ ready: Boolean(configuredApiKey), customerInfo: null, offerings: null, error });
  }
};

export const restoreRevenueCatPurchases = async () => {
  try {
    const configured = configurePurchases();
    if (!configured) {
      return buildExtendedResult({ ready: false, customerInfo: null, offerings: null, error: null });
    }

    console.log('RevenueCat restorePurchases start');
    const customerInfo = await Purchases.restorePurchases();
    console.log('RevenueCat restorePurchases success', {
      hasPremiumEntitlement: Boolean(customerInfo?.entitlements?.active?.Premium),
    });
    const offerings = await Purchases.getOfferings();
    const currentOffering = offerings?.current || null;
    const monthlyPackage = currentOffering?.monthly || currentOffering?.availablePackages?.find((item) => String(item?.packageType || '').toLowerCase().includes('monthly')) || null;
    const annualPackage = currentOffering?.annual || currentOffering?.availablePackages?.find((item) => String(item?.packageType || '').toLowerCase().includes('annual')) || null;
    console.log('RevenueCat offerings after restore', {
      currentOfferingExists: Boolean(currentOffering),
      currentOfferingIdentifier: currentOffering?.identifier || null,
      monthlyPackageExists: Boolean(monthlyPackage),
      annualPackageExists: Boolean(annualPackage),
      availableOfferingIdentifiers: Object.keys(offerings?.all || {}),
      availablePackageIdentifiers: (currentOffering?.availablePackages || []).map((item) => item?.identifier || null).filter(Boolean),
    });
    return buildExtendedResult({ ready: true, customerInfo, offerings, error: null });
  } catch (error) {
    console.log('RevenueCat restore error:', {
      message: error?.message || String(error),
      code: error?.code || null,
      userCancelled: Boolean(error?.userCancelled),
    });
    return buildExtendedResult({ ready: Boolean(configuredApiKey), customerInfo: null, offerings: null, error });
  }
};

export const purchaseRevenueCatPackage = async (aPackage) => {
  try {
    const configured = configurePurchases();
    if (!configured || !aPackage) {
      return buildExtendedResult({ ready: false, customerInfo: null, offerings: null, error: null, cancelled: false });
    }

    console.log('RevenueCat purchasePackage start', {
      packageIdentifier: aPackage?.identifier || null,
      packageType: aPackage?.packageType || null,
      offeringIdentifier: aPackage?.offeringIdentifier || aPackage?.presentedOfferingContext?.offeringIdentifier || null,
    });
    const result = await Purchases.purchasePackage(aPackage);
    console.log('RevenueCat purchasePackage success', {
      hasPremiumEntitlement: Boolean(result?.customerInfo?.entitlements?.active?.Premium),
      productIdentifier: result?.productIdentifier || null,
    });
    return buildExtendedResult({
      ready: true,
      customerInfo: result?.customerInfo || null,
      offerings: null,
      error: null,
      cancelled: false,
    });
  } catch (error) {
    if (String(error?.code || '') === String(Purchases.PURCHASES_ERROR_CODE?.PURCHASE_CANCELLED_ERROR || '1')
      || error?.userCancelled) {
      console.log('RevenueCat purchase cancelled', {
        code: error?.code || null,
        userCancelled: Boolean(error?.userCancelled),
      });
      return buildExtendedResult({
        ready: Boolean(configuredApiKey),
        customerInfo: null,
        offerings: null,
        error: { ...error, cancelled: true },
        cancelled: true,
      });
    }

    console.log('RevenueCat purchase error:', {
      message: error?.message || String(error),
      code: error?.code || null,
      userCancelled: Boolean(error?.userCancelled),
    });
    return buildExtendedResult({
      ready: Boolean(configuredApiKey),
      customerInfo: null,
      offerings: null,
      error,
      cancelled: false,
    });
  }
};
