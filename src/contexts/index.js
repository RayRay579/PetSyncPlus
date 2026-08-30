import { createContext } from 'react';

export const PetsContext = createContext({
  pets: [],
  setPets: () => {},
});

export const HealthRecordsContext = createContext({
  healthRecords: [],
  setHealthRecords: () => {},
});

export const CareRemindersContext = createContext({
  careReminders: [],
  setCareReminders: () => {},
});

export const LostPetAlertsContext = createContext({
  lostPetAlerts: [],
  setLostPetAlerts: () => {},
});

export const PetScoresContext = createContext({
  petScores: {},
  setPetScores: () => {},
});

export const ActivityLogsContext = createContext({
  activityLogs: [],
  setActivityLogs: () => {},
});

export const AddPetContext = createContext({
  openAddPetModal: () => {},
});

export const VetFinderContext = createContext({
  isVetFinderExpanded: false,
  openVetFinder: () => {},
  closeVetFinder: () => {},
  toggleVetFinder: () => {},
});

export const AuthContext = createContext({
  authUser: null,
  authProfile: null,
  authReady: false,
  signOut: async () => {},
  setAuthProfile: () => {},
});

export const RevenueCatContext = createContext({
  revenueCatReady: false,
  revenueCatCustomerInfo: null,
  revenueCatPremiumActive: false,
  revenueCatOfferings: null,
  revenueCatMonthlyPackage: null,
  revenueCatYearlyPackage: null,
  restoreRevenueCatPurchases: async () => ({ ready: false, customerInfo: null, premiumActive: false }),
  purchaseRevenueCatPackage: async () => ({ ready: false, customerInfo: null, premiumActive: false, error: null, cancelled: false }),
});

export const FeatureGateContext = createContext({
  lockedFeature: null,
  openLockedFeature: () => {},
  closeLockedFeature: () => {},
});
