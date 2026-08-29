# PetSync+

PetSync+ is an Expo / React Native pet-care application backed by Supabase. The recovered main application uses the classic Expo `App.js` entry point and runs on iOS/Expo Go and web.

## Current recovered baseline

- Recovery branch: `petsync-recovery-2026-08-29`
- Resume development branch: `petsync-resume-build-1`
- Entry point: `node_modules/expo/AppEntry.js` -> `App.js`
- Backend: Supabase
- Subscriptions: RevenueCat integration
- Platforms: Expo / React Native, iOS, Android development builds, web

## Major features already present

- Authentication and profiles
- Multi-pet support
- Pet profiles and species-aware care actions
- Health Hub and health records
- OCR-assisted health record import
- Weight and vet-visit analytics
- Care reminders and push-notification foundation
- Memory Vault
- Family Sharing
- Lost Pet SOS and community alerts
- Community
- Discover directory
- Businesses, shelters/rescues, adoptable pets, events, promotions, favorites
- Partner applications and moderation
- PetSync+ Control Center
- RevenueCat premium/subscription plumbing

## Development rule

The recovered branch is a safety checkpoint. New work should happen on a dedicated development branch and should not reset or overwrite the recovery branch.

## Run locally

```bash
npm install
npx expo start --clear
```

Use Expo Go for supported mobile testing. Push notifications and some native subscription behavior require a development build.

For web, press `w` after Expo starts or run:

```bash
npm run web
```

## Architecture note

The active recovered app is the classic `App.js` application. Old Expo Router starter-template files were removed from the resume branch because they were not the active application and caused confusion in web startup/SSR behavior.

## Next product direction

A separate PetSyncPlusV3 experiment contains the newer PetSync intelligence architecture (Coach, Knowledge, Memory, Observation, Health Intelligence, Daily Care, Care Profile, and Voice). That work should be migrated deliberately into the recovered main app rather than copied wholesale.
