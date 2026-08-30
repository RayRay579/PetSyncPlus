import React from 'react';
import { View, Image, StyleSheet, Platform } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { C } from '../theme/colors';

const PETSYNC_BACKGROUND_IMAGE = require('../../assets/images/petsync-background.png');

export const PETSYNC_STARTUP_BACKGROUND = '#f6f8ff';

export const KEYBOARD_AVOIDING_BEHAVIOR =
  Platform.OS === 'ios' ? 'padding' : 'height';

export const resolveUiIconName = (label = '') => {
  const normalized = String(label || '').trim().toLowerCase();
  if (normalized.includes('profile')) return 'account-circle-outline';
  if (normalized.includes('family')) return 'account-group-outline';
  if (normalized.includes('my pets')) return 'paw';
  if (normalized.includes('reminder notifications')) return 'bell-outline';
  if (normalized.includes('reminder alerts')) return 'bell-outline';
  if (normalized.includes('pet sound alerts')) return 'volume-high';
  if (normalized.includes('push notifications')) return 'bell-ring-outline';
  if (normalized === 'pets') return 'paw';
  if (normalized.includes('health')) return 'heart-pulse';
  if (normalized.includes('care reminders')) return 'calendar-clock';
  if (normalized.includes('memories')) return 'camera-outline';
  if (normalized.includes('community posts')) return 'forum-outline';
  if (normalized.includes('recipes')) return 'book-open-variant';
  if (normalized.includes('comments')) return 'comment-outline';
  if (normalized.includes('lost pet alerts')) return 'alarm-light-outline';
  if (normalized.includes('export')) return 'backup-restore';
  if (normalized.includes('records')) return 'file-document-outline';
  if (normalized.includes('petsync+ premium')) return 'diamond-stone';
  if (normalized.includes('app name')) return 'information-outline';
  if (normalized.includes('version')) return 'information-outline';
  if (normalized.includes('supabase')) return 'database-outline';
  if (normalized.includes('help center')) return 'help-circle-outline';
  if (normalized.includes('rate petsync+')) return 'star-outline';
  if (normalized.includes('add pet')) return 'plus-circle-outline';
  if (normalized.includes('settings')) return 'cog-outline';
  if (normalized.includes('notifications')) return 'bell-outline';
  if (normalized.includes('log meal')) return 'silverware-fork-knife';
  if (normalized.includes('feed')) return 'silverware-fork-knife';
  if (normalized.includes('walk')) return 'walk';
  if (normalized.includes('trail ride')) return 'horse-human';
  if (normalized.includes('weight')) return 'scale-bathroom';
  if (normalized.includes('medication')) return 'pill';
  if (normalized.includes('groom')) return 'content-cut';
  if (normalized.includes('play')) return 'paw';
  if (normalized.includes('bath')) return 'shower';
  if (normalized.includes('photo')) return 'camera-outline';
  if (normalized.includes('cuddle')) return 'heart-outline';
  if (normalized.includes('nap')) return 'sleep';
  if (normalized.includes('fish')) return 'fish';
  if (normalized.includes('bird')) return 'bird';
  if (normalized.includes('rabbit')) return 'rabbit';
  if (normalized.includes('hamster')) return 'rodent';
  if (normalized.includes('reptile')) return 'snake';
  if (normalized.includes('ai vet')) return 'stethoscope';
  if (normalized.includes('lost pet')) return 'alarm-light';
  if (normalized.includes('contact owner')) return 'phone-outline';
  if (normalized.includes('share alert') || normalized.includes('share')) return 'share-variant-outline';
  if (normalized.includes('lost pet sos')) return 'alarm-light';
  return 'paw-outline';
};

export const resolveUiIconColor = (label = '', accent = false) => {
  const normalized = String(label || '').trim().toLowerCase();
  if (accent) return C.settingsAccent;
  if (normalized.includes('profile')) return '#7E57C2';
  if (normalized.includes('family')) return '#22C7B7';
  if (normalized.includes('reminder notifications') || normalized.includes('reminder alerts')) return '#FFB020';
  if (normalized.includes('push notifications') || normalized.includes('notifications')) return '#4C9AFF';
  if (normalized === 'pets' || normalized.includes('my pets')) return '#22C55E';
  if (normalized.includes('health')) return '#FF8A3D';
  if (normalized.includes('care reminders')) return '#8E5BFF';
  if (normalized.includes('memories')) return '#FF6B9A';
  if (normalized.includes('community posts')) return '#5B7CFA';
  if (normalized.includes('recipes')) return '#22C55E';
  if (normalized.includes('comments')) return '#4C9AFF';
  if (normalized.includes('lost pet alerts')) return '#FF5B5B';
  if (normalized.includes('export')) return '#FF8A3D';
  if (normalized.includes('premium')) return '#8E5BFF';
  if (normalized.includes('help')) return '#22C7B7';
  if (normalized.includes('rate')) return '#F5A524';
  if (normalized.includes('app name') || normalized.includes('version') || normalized.includes('supabase')) return '#8F97A6';
  if (normalized.includes('add pet')) return '#FF8A3D';
  if (normalized.includes('settings')) return '#8E5BFF';
  if (normalized.includes('logout')) return '#FF5B5B';
  return C.settingsMutedText;
};

export const resolvePetSpeciesIconName = (species = '') => {
  const normalized = String(species || '').trim().toLowerCase();
  if (normalized.includes('dog')) return 'dog';
  if (normalized.includes('cat')) return 'cat';
  if (normalized.includes('fish')) return 'fish';
  if (normalized.includes('bird')) return 'twitter';
  if (
    normalized.includes('reptile') ||
    normalized.includes('snake') ||
    normalized.includes('lizard') ||
    normalized.includes('turtle')
  ) return 'snake';
  if (normalized.includes('rabbit') || normalized.includes('bunny')) return 'rabbit';
  if (
    normalized.includes('hamster') ||
    normalized.includes('guinea') ||
    normalized.includes('gerbil')
  ) return 'paw';
  if (normalized.includes('horse') || normalized.includes('pony')) return 'horse';
  return 'paw';
};

export const resolvePetSpeciesAccentColor = (species = '') => {
  const normalized = String(species || '').trim().toLowerCase();
  if (normalized.includes('dog')) return '#FF8A3D';
  if (normalized.includes('cat')) return '#8E5BFF';
  if (normalized.includes('fish')) return '#2F80ED';
  if (normalized.includes('bird')) return '#22C7B7';
  if (
    normalized.includes('reptile') ||
    normalized.includes('snake') ||
    normalized.includes('lizard') ||
    normalized.includes('turtle')
  ) return '#57B65B';
  if (normalized.includes('rabbit') || normalized.includes('bunny')) return '#FF5B9F';
  if (
    normalized.includes('hamster') ||
    normalized.includes('guinea') ||
    normalized.includes('gerbil')
  ) return '#F5A524';
  if (normalized.includes('horse') || normalized.includes('pony')) return '#A66B3D';
  return C.primaryActionBg;
};

export const PetSpeciesIcon = ({ species, size = 18, color }) => {
  const iconName = resolvePetSpeciesIconName(species);

  return (
    <MaterialCommunityIcons
      name={iconName || 'paw'}
      size={size}
      color={color || C.primaryActionBg}
    />
  );
};

export const resolveMemoryIconName = (memory = {}) => {
  const title = String(
    memory?.title || memory?.caption || memory?.type || ''
  ).trim().toLowerCase();

  const mediaType = String(
    memory?.mediaType || memory?.mimeType || ''
  ).toLowerCase();

  if (mediaType.startsWith('video/')) return 'video-outline';
  if (memory?.milestone) return 'star-outline';
  if (title.includes('birthday')) return 'cake-variant-outline';
  if (title.includes('adoption')) return 'home-heart-outline';
  if (title.includes('groom')) return 'content-cut';
  if (title.includes('bath')) return 'shower';
  if (title.includes('walk') || title.includes('park') || title.includes('run')) return 'walk';
  if (title.includes('play')) return 'gamepad-variant-outline';
  return 'image-outline';
};

export const PetSyncBackground = ({ children, opacity = 0.12, style }) => (
  <View
    style={[
      { flex: 1, backgroundColor: PETSYNC_STARTUP_BACKGROUND },
      style,
    ]}
  >
    <Image
      source={PETSYNC_BACKGROUND_IMAGE}
      resizeMode="cover"
      pointerEvents="none"
      style={[
        StyleSheet.absoluteFillObject,
        {
          width: '100%',
          height: '100%',
          opacity,
        },
      ]}
    />

    <View style={{ flex: 1 }}>{children}</View>
  </View>
);
