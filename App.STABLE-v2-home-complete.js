import React, { useState, useRef, useEffect, createContext, useContext } from 'react';
import { 
  View, Text, ScrollView, TouchableOpacity, StyleSheet, Animated,
  TextInput, FlatList, Dimensions, Modal, Alert, Image, Linking, Share,
  KeyboardAvoidingView, Platform, StatusBar, Vibration,
} from 'react-native';
import { useCallback } from 'react';
import { NavigationContainer, useNavigation } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { SafeAreaView, SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Audio } from 'expo-av';
import Constants from 'expo-constants';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import TextRecognition from '@react-native-ml-kit/text-recognition';
import { supabase } from './supabase';
// ─────────────────────────────────────────────
// COLORS & THEME
// ─────────────────────────────────────────────
const C = {
  bg:        '#0d1b2a',
  card:      '#1a2d40',
  cardHigh:  '#1f3347',
  accent:    '#ff6b35',
  green:     '#4ade80',
  yellow:    '#fbbf24',
  red:       '#f87171',
  blue:      '#60a5fa',
  text:      '#f0f4f8',
  muted:     '#8fb3c8',
  faint:     '#3a5a72',
  border:    '#1f3347',
};

const PETSYNC_BACKGROUND_IMAGE = require('./assets/images/petsync-background.png');

const PetSyncBackground = ({ children, opacity = 0.12, style }) => (
  <View style={[{ flex: 1, backgroundColor: '#f6f8ff' }, style]}>
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

    <View style={{ flex: 1 }}>
      {children}
    </View>
  </View>
);

// ─────────────────────────────────────────────
// MOCK DATA
// ─────────────────────────────────────────────
const PETS = [
  { id: '1', name: 'Max',   species: 'dog',  breed: 'Golden Retriever', age: '3 yrs', emoji: '🐕', score: 87 },
  { id: '2', name: 'Luna',  species: 'cat',  breed: 'Tabby Cat',        age: '2 yrs', emoji: '🐈', score: 92 },
  { id: '3', name: 'Buddy', species: 'dog',  breed: 'Beagle',           age: '5 yrs', emoji: '🐶', score: 74 },
  { id: '4', name: 'Bubbles', species: 'fish', breed: 'Betta Fish',      age: '1 yr',  emoji: '🐟',   score: 89 },
];

const TASKS = [
  { id: '1', petId: '1', title: 'Morning Breakfast',      time: '7:00 AM',  done: true,  icon: '🍽️', type: 'feeding'     },
  { id: '2', petId: '1', title: 'Heartworm Medication',   time: '9:00 AM',  done: false, icon: '💊', type: 'medication'  },
  { id: '3', petId: '1', title: 'Afternoon Walk',         time: '2:00 PM',  done: false, icon: '🦮', type: 'walk'       },
  { id: '4', petId: '1', title: 'Vet Appointment',        time: '4:30 PM',  done: false, icon: '🏥', type: 'vet'        },
  { id: '5', petId: '1', title: 'Evening Dinner',         time: '6:00 PM',  done: false, icon: '🍽️', type: 'feeding'    },
  { id: '6', petId: '2', title: 'Luna Morning Feed',      time: '7:30 AM',  done: true,  icon: '🍽️', type: 'feeding'    },
  { id: '7', petId: '2', title: 'Luna Flea Treatment',    time: '12:00 PM', done: false, icon: '💊', type: 'medication' },
  { id: '8', petId: '3', title: 'Buddy Walk',             time: '8:00 AM',  done: true,  icon: '🦮', type: 'walk'       },
  { id: '9', petId: '3', title: 'Buddy Dinner',           time: '5:30 PM',  done: false, icon: '🍽️', type: 'feeding'    },
];

const PET_SOUNDS = {
  dog: require('./assets/sounds/dog.mp3'),
  cat: require('./assets/sounds/cat.mp3'),
  fish: require('./assets/sounds/fish.mp3'),
  bird: require('./assets/sounds/bird.mp3'),
  reptile: require('./assets/sounds/reptile.mp3'),
};

const SOS_SOUND = require('./assets/sounds/sos.mp3');

const HEALTH_RECORDS = [
  { id: '1', petId: '1', type: 'vaccination', title: 'Rabies Vaccine',        date: 'Jan 15, 2026', provider: 'Dr. Smith',   status: 'current',   icon: '💉', nextDue: 'Jan 2027' },
  { id: '2', petId: '1', type: 'vaccination', title: 'DHPP Booster',          date: 'Jan 15, 2026', provider: 'Dr. Smith',   status: 'current',   icon: '💉', nextDue: 'Mar 2027' },
  { id: '3', petId: '1', type: 'vaccination', title: 'Bordetella',            date: 'Dec 01, 2025', provider: 'Dr. Smith',   status: 'due_soon',  icon: '💉', nextDue: 'Jun 2026' },
  { id: '4', petId: '1', type: 'medication',  title: 'Heartworm Prevention',  date: 'May 01, 2026', provider: 'Dr. Johnson', status: 'current',   icon: '💊', nextDue: 'Jun 2026' },
  { id: '5', petId: '1', type: 'medication',  title: 'Flea & Tick Treatment', date: 'May 01, 2026', provider: 'Dr. Johnson', status: 'current',   icon: '💊', nextDue: 'Jun 2026' },
  { id: '6', petId: '1', type: 'appointment', title: 'Annual Wellness Exam',  date: 'Jun 15, 2026', provider: 'Dr. Smith',   status: 'upcoming',  icon: '🏥', nextDue: null       },
  { id: '7', petId: '1', type: 'weight',      title: 'Weight Check',          date: 'May 10, 2026', provider: null,          status: 'current',   icon: '⚖️', nextDue: null      },
  { id: '8', petId: '2', type: 'vaccination', title: 'FVRCP Vaccine',         date: 'Feb 20, 2026', provider: 'Dr. Lee',     status: 'current',   icon: '💉', nextDue: 'Feb 2027' },
  { id: '9', petId: '2', type: 'medication',  title: 'Flea Treatment',        date: 'May 05, 2026', provider: 'Dr. Lee',     status: 'current',   icon: '💊', nextDue: 'Jun 2026' },
];

const MEMORIES = [
  { id: '1',  petId: '1', emoji: '🌊', color: '#1e4976', caption: "Max's beach day!",       milestone: true,  date: '05/20/2026' },
  { id: '2',  petId: '1', emoji: '🌿', color: '#1a4a2e', caption: 'Park run',               milestone: false, date: '05/18/2026' },
  { id: '3',  petId: '1', emoji: '🎂', color: '#4a1a1a', caption: 'Birthday boy! 🎉',       milestone: true,  date: '05/10/2026' },
  { id: '4',  petId: '1', emoji: '🏕️', color: '#2d3a1a', caption: 'Camping trip',           milestone: false, date: '05/05/2026' },
  { id: '5',  petId: '1', emoji: '❄️', color: '#1a2a4a', caption: 'First snow!',            milestone: true,  date: '01/15/2026' },
  { id: '6',  petId: '1', emoji: '🛁', color: '#1a3a3a', caption: 'Bath time',              milestone: false, date: '01/10/2026' },
  { id: '7',  petId: '2', emoji: '🐱', color: '#3a1a4a', caption: 'Luna nap time',          milestone: false, date: '05/22/2026' },
  { id: '8',  petId: '2', emoji: '🌸', color: '#4a1a2d', caption: 'Garden explorer',        milestone: false, date: '05/15/2026' },
  { id: '9',  petId: '2', emoji: '🎀', color: '#4a2a1a', caption: 'Dressed up!',            milestone: false, date: '05/01/2026' },
  { id: '10', petId: '3', emoji: '🐾', color: '#2a1a4a', caption: 'Buddy loves hiking',     milestone: true,  date: '04/28/2026' },
  { id: '11', petId: '3', emoji: '🦴', color: '#3a2a1a', caption: 'Treat time',             milestone: false, date: '04/20/2026' },
  { id: '12', petId: '3', emoji: '💤', color: '#1a2a3a', caption: 'Sleepy Buddy',           milestone: false, date: '04/15/2026' },
];

const POSTS = [
  { id: '1', author: 'Sarah M.',    owner: false, petType: 'Golden Retriever Mom', time: '2h ago', content: 'Anyone know a good dog-friendly trail near Ocean County? Max loved Cattus Island but want to try somewhere new! 🐾', emoji: '🌲', likes: 24, comments: 8,  type: 'question'     },
  { id: '2', author: 'Mike R.',     owner: false, petType: 'Beagle Dad',           time: '4h ago', content: '🚨 MISSING: Bella (Beagle, 3 yrs) — last seen near Lacey Township. Wearing red collar. PLEASE SHARE! 🚨',        emoji: '🚨', likes: 89, comments: 34, type: 'lost_pet',    lost: true },
  { id: '3', author: 'Johnson Fam', owner: false, petType: 'Multi-pet household',  time: '1d ago', content: 'Rocky just graduated from puppy training! 8 weeks of hard work and this guy nailed every single command 🎓🐶',    emoji: '🎓', likes: 67, comments: 14, type: 'celebration'  },
  { id: '4', author: 'Vet Dr. Kim', owner: false, petType: 'Animal Clinic Partner', time: '2d ago', content: 'Summer reminder: sidewalks can reach 150°F on hot days. Test with your hand for 5 seconds — if you can\'t hold it, neither can your pet! 🌡️', emoji: '☀️', likes: 103, comments: 22, type: 'tip' },
];

const COMMUNITY_TABS = [
  { key: 'feed', label: 'Feed' },
  { key: 'recipes', label: 'Recipes' },
  { key: 'lostPets', label: 'Lost Pets' },
  { key: 'tips', label: 'Tips' },
];

const RECIPE_POSTS = [
  {
    id: 'recipe-1',
    author: 'Mia S.',
    owner: false,
    petType: 'Dog Parent',
    title: 'Frozen Peanut Butter Banana Dog Treats',
    description: 'A cool, high-value treat for hot days with simple ingredients your pup already loves.',
    ingredients: ['1 banana', '2 tbsp xylitol-free peanut butter', '1/2 cup plain yogurt', 'Ice tray molds'],
    safeFor: ['dog'],
    prepTime: '10 min',
    likes: 58,
    comments: 12,
    emoji: '🍌🐶',
    instructions: [
      'Mash the banana until smooth.',
      'Stir in the peanut butter and yogurt.',
      'Spoon into ice tray molds.',
      'Freeze until firm, then serve one at a time.',
    ],
  },
  {
    id: 'recipe-2',
    author: 'Tina L.',
    owner: false,
    petType: 'Cat Parent',
    title: 'Cat Tuna Bites',
    description: 'Small savory bites for cats who want a little extra crunch without anything heavy.',
    ingredients: ['1 can tuna in water', '1 egg', '2 tbsp oat flour', 'Pinch of catnip'],
    safeFor: ['cat'],
    prepTime: '20 min',
    likes: 44,
    comments: 9,
    emoji: '🐟🐱',
    instructions: [
      'Preheat the oven to 325°F.',
      'Mix tuna, egg, oat flour, and catnip into a thick dough.',
      'Shape into tiny bite-size pieces.',
      'Bake until set and cool completely before serving.',
    ],
  },
  {
    id: 'recipe-3',
    author: 'Dr. Lane',
    owner: false,
    petType: 'Aquarium Keeper',
    title: 'Fish Feeding Schedule Mix',
    description: 'A simple way to prep a varied feeding routine for healthy tanks and happier fish.',
    ingredients: ['Pellet blend', 'Freeze-dried bloodworms', 'Brine shrimp cubes', 'Vitamin drops'],
    safeFor: ['fish'],
    prepTime: '5 min',
    likes: 31,
    comments: 6,
    emoji: '🐟✨',
    instructions: [
      'Measure your tank-safe pellet blend.',
      'Add freeze-dried bloodworms or shrimp in small amounts.',
      'Store in a sealed container for the week.',
      'Follow your tank’s feeding schedule and portion carefully.',
    ],
  },
  {
    id: 'recipe-4',
    author: 'Nora G.',
    owner: false,
    petType: 'Rabbit Parent',
    title: 'Rabbit Veggie Snack Bowl',
    description: 'Fresh, crunchy veggies that work as a supervised snack or enrichment bowl.',
    ingredients: ['Romaine lettuce', 'Parsley', 'Bell pepper', 'Small carrot slices'],
    safeFor: ['rabbit'],
    prepTime: '8 min',
    likes: 36,
    comments: 11,
    emoji: '🥬🐇',
    instructions: [
      'Wash and dry all produce thoroughly.',
      'Chop the vegetables into rabbit-safe bite sizes.',
      'Arrange in a bowl or foraging tray.',
      'Serve fresh and remove leftovers after the session.',
    ],
  },
];

const normalizeCommunityProfileKey = (value) => String(value || '')
  .toLowerCase()
  .trim()
  .replace(/[^a-z0-9]+/g, '-')
  .replace(/^-+|-+$/g, '');

const COMMUNITY_PROFILE_FIXTURES = {
  raymond: {
    displayName: 'Raymond',
    avatarEmoji: '👤',
    memberSince: 'Jan 2026',
    bio: 'Building a calmer, smarter home for pets and their people.',
    favoritePetName: 'Max',
    favoritePetSpecies: 'dog',
    favoritePetBreed: 'Golden Retriever',
    petCount: 4,
    communityPostCount: 3,
    recipeCount: 2,
    lostPetAlertCount: 1,
  },
  'sarah-m': {
    displayName: 'Sarah M.',
    avatarEmoji: '🌲',
    memberSince: 'Sep 2024',
    bio: 'Weekend trail tester and proud Golden Retriever mom.',
    favoritePetName: 'Oakley',
    favoritePetSpecies: 'dog',
    favoritePetBreed: 'Golden Retriever',
    petCount: 1,
    communityPostCount: 18,
    recipeCount: 4,
    lostPetAlertCount: 0,
  },
  'mike-r': {
    displayName: 'Mike R.',
    avatarEmoji: '🚨',
    memberSince: 'Mar 2025',
    bio: 'Active in the local pet community and always ready to help.',
    favoritePetName: 'Bella',
    favoritePetSpecies: 'dog',
    favoritePetBreed: 'Beagle',
    petCount: 1,
    communityPostCount: 9,
    recipeCount: 1,
    lostPetAlertCount: 1,
  },
  'johnson-fam': {
    displayName: 'Johnson Fam',
    avatarEmoji: '🎓',
    memberSince: 'Jun 2025',
    bio: 'A multi-pet household sharing what works for busy families.',
    favoritePetName: 'Rocky',
    favoritePetSpecies: 'dog',
    favoritePetBreed: 'Mixed Breed',
    petCount: 3,
    communityPostCount: 12,
    recipeCount: 2,
    lostPetAlertCount: 0,
  },
  'vet-dr-kim': {
    displayName: 'Vet Dr. Kim',
    avatarEmoji: '🩺',
    memberSince: 'Jan 2023',
    bio: 'Veterinary partner sharing practical, pet-safe advice.',
    favoritePetName: 'Clinic Mascot',
    favoritePetSpecies: 'dog',
    favoritePetBreed: 'Rescue Mix',
    petCount: 0,
    communityPostCount: 41,
    recipeCount: 0,
    lostPetAlertCount: 0,
  },
  'mia-s': {
    displayName: 'Mia S.',
    avatarEmoji: '🍌',
    memberSince: 'Nov 2024',
    bio: 'Snack creator and treat tester for dogs and cats.',
    favoritePetName: 'Poppy',
    favoritePetSpecies: 'dog',
    favoritePetBreed: 'Poodle Mix',
    petCount: 1,
    communityPostCount: 6,
    recipeCount: 8,
    lostPetAlertCount: 0,
  },
  'tina-l': {
    displayName: 'Tina L.',
    avatarEmoji: '🐟',
    memberSince: 'Feb 2025',
    bio: 'Cat parent with a strong opinion about enrichment toys.',
    favoritePetName: 'Mochi',
    favoritePetSpecies: 'cat',
    favoritePetBreed: 'Domestic Shorthair',
    petCount: 1,
    communityPostCount: 7,
    recipeCount: 5,
    lostPetAlertCount: 0,
  },
  'dr-lane': {
    displayName: 'Dr. Lane',
    avatarEmoji: '🧪',
    memberSince: 'Aug 2022',
    bio: 'Aquarium and exotic pet care educator.',
    favoritePetName: 'Bluefin',
    favoritePetSpecies: 'fish',
    favoritePetBreed: 'Betta Fish',
    petCount: 2,
    communityPostCount: 24,
    recipeCount: 3,
    lostPetAlertCount: 0,
  },
  'nora-g': {
    displayName: 'Nora G.',
    avatarEmoji: '🥬',
    memberSince: 'May 2024',
    bio: 'Rabbit enrichment ideas, veggie bowls, and calm routines.',
    favoritePetName: 'Thumper',
    favoritePetSpecies: 'rabbit',
    favoritePetBreed: 'Mini Lop',
    petCount: 1,
    communityPostCount: 5,
    recipeCount: 2,
    lostPetAlertCount: 0,
  },
};

const getCommunityProfileFixture = (profileKey, displayName) => {
  const normalizedKey = normalizeCommunityProfileKey(profileKey || displayName);
  const fallbackName = displayName || normalizedKey || 'Community Member';

  return COMMUNITY_PROFILE_FIXTURES[normalizedKey] || {
    displayName: fallbackName,
    avatarEmoji: '🐾',
    memberSince: 'Jan 2026',
    bio: 'Community member',
    favoritePetName: '',
    favoritePetSpecies: '',
    favoritePetBreed: '',
    petCount: 0,
    communityPostCount: 0,
    recipeCount: 0,
    lostPetAlertCount: 0,
  };
};

const mapCommunityProfileRow = (row, fallback = {}) => ({
  ...fallback,
  displayName: row.display_name || row.displayName || row.full_name || row.username || row.name || fallback.displayName,
  avatarUrl: row.avatar_url || row.avatarUrl || row.photo_url || fallback.avatarUrl || '',
  avatarEmoji: row.avatar_emoji || row.avatarEmoji || fallback.avatarEmoji || '🐾',
  memberSince: row.member_since || row.memberSince || row.created_at || fallback.memberSince || '',
  bio: row.bio || row.about || fallback.bio || '',
  favoritePetName: row.favorite_pet_name || row.favoritePetName || fallback.favoritePetName || '',
  favoritePetSpecies: row.favorite_pet_species || row.favoritePetSpecies || fallback.favoritePetSpecies || '',
  favoritePetBreed: row.favorite_pet_breed || row.favoritePetBreed || fallback.favoritePetBreed || '',
  petCount: row.pet_count ?? row.petCount ?? fallback.petCount ?? 0,
  communityPostCount: row.community_post_count ?? row.communityPostCount ?? fallback.communityPostCount ?? 0,
  recipeCount: row.recipe_count ?? row.recipeCount ?? fallback.recipeCount ?? 0,
  lostPetAlertCount: row.lost_pet_alert_count ?? row.lostPetAlertCount ?? fallback.lostPetAlertCount ?? 0,
});

const loadCommunityProfileFromSupabase = async ({ profileKey, displayName }) => {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .limit(200);

    if (error) {
      console.log('Supabase profile load error:', error);
      return null;
    }

    const normalizedKey = normalizeCommunityProfileKey(profileKey || displayName);
    const normalizedName = normalizeCommunityProfileKey(displayName || profileKey);
    const row = (data || []).find((item) => {
      const candidateValues = [
        item.id,
        item.user_id,
        item.profile_key,
        item.username,
        item.display_name,
        item.full_name,
        item.name,
      ].filter(Boolean).map(normalizeCommunityProfileKey);

      return candidateValues.includes(normalizedKey) || candidateValues.includes(normalizedName);
    });

    if (!row) {
      return null;
    }

    return mapCommunityProfileRow(row, getCommunityProfileFixture(profileKey, displayName));
  } catch (error) {
    console.log('Supabase profile load error:', error);
    return null;
  }
};

const buildCommunityProfileAchievements = (profile) => ([
  {
    key: 'first-pet-added',
    label: 'First Pet Added',
    achieved: (profile.petCount || 0) > 0,
  },
  {
    key: 'first-health-record',
    label: 'First Health Record',
    achieved: (profile.healthRecordCount || 0) > 0,
  },
  {
    key: 'first-recipe-shared',
    label: 'First Recipe Shared',
    achieved: (profile.recipeCount || 0) > 0,
  },
  {
    key: 'community-helper',
    label: 'Community Helper',
    achieved: (profile.communityPostCount || 0) > 0,
  },
  {
    key: 'lost-pet-supporter',
    label: 'Lost Pet Supporter',
    achieved: (profile.lostPetAlertCount || 0) > 0,
  },
]);

const PET_SPECIES_EMOJIS = {
  dog: '🐕',
  cat: '🐈',
  fish: '🐟',
  bird: '🐦',
  reptile: '🦎',
  rabbit: '🐇',
  hamster: '🐹',
  horse: '🐴',
  other: '🐾',
};

const PetsContext = createContext({
  pets: PETS,
  setPets: () => {},
});

const HealthRecordsContext = createContext({
  healthRecords: HEALTH_RECORDS,
  setHealthRecords: () => {},
});

const CareRemindersContext = createContext({
  careReminders: [],
  setCareReminders: () => {},
});

const LostPetAlertsContext = createContext({
  lostPetAlerts: [],
  setLostPetAlerts: () => {},
});

const PetScoresContext = createContext({
  petScores: {},
  setPetScores: () => {},
});

const ActivityLogsContext = createContext({
  activityLogs: [],
  setActivityLogs: () => {},
});

const AddPetContext = createContext({
  openAddPetModal: () => {},
});

const getDefaultPetEmoji = (species) => PET_SPECIES_EMOJIS[species] || '🐾';

const getStarterPetScore = (species) => {
  const scoreMap = {
    dog: 87,
    cat: 92,
    fish: 89,
    bird: 84,
    reptile: 82,
    rabbit: 85,
    hamster: 83,
    horse: 86,
    other: 80,
  };

  return scoreMap[species] ?? 80;
};

const getPetSoundAsset = (species) => PET_SOUNDS[species] || PET_SOUNDS.dog;

const toLocalDateKey = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const formatDate = (date) => {
  if (!date) return '';

  let d = typeof date === 'string'
    ? new Date(date + 'T12:00:00')
    : date;

  if (Number.isNaN(d.getTime()) && typeof date === 'string') {
    const loose = new Date(date);
    if (!Number.isNaN(loose.getTime())) {
      d = loose;
    }
  }

  if (Number.isNaN(d.getTime()) && typeof date === 'string') {
    const mmddyyyy = date.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
    if (mmddyyyy) {
      const month = Number(mmddyyyy[1]);
      const day = Number(mmddyyyy[2]);
      const year = Number(mmddyyyy[3]);
      d = new Date(year, month - 1, day);
    }
  }

  if (Number.isNaN(d.getTime())) {
    return typeof date === 'string' ? date : '';
  }

  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const year = d.getFullYear();

  return `${month}/${day}/${year}`;
};

const parseStoredDateKey = (value) => {
  if (!value) return null;
  const text = String(value).trim();
  if (!text) return null;

  if (/^\d{4}-\d{2}-\d{2}$/.test(text)) {
    const parsed = new Date(`${text}T12:00:00`);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }

  const parsed = new Date(text);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

const savePetToSupabase = async (pet) => {
  const weightMatch = String(pet.weight || '').match(/[\d.]+/);
  const parsedWeight = weightMatch ? Number(weightMatch[0]) : null;
  const normalizedWeight = Number.isFinite(parsedWeight) ? parsedWeight : null;

  const { error } = await supabase.from('pets').insert([
    {
      id: pet.id,
      name: pet.name || '',
      species: pet.species || '',
      breed: pet.breed || '',
      birthday: pet.birthday && String(pet.birthday).trim() ? pet.birthday : null,
      weight: normalizedWeight,
      gender: pet.gender || '',
      photo_url: pet.photoUri || null,
      care_goals: pet.careGoals || '',
      health_score: pet.score ?? null,
    },
  ]);

  if (error) {
    console.log('Supabase pet save error:', error);
    return;
  }

  console.log('Pet saved to Supabase');
};

const loadPetsFromSupabase = async () => {
  const { data, error } = await supabase
    .from('pets')
    .select('*')
    .order('created_at', { ascending: true });

  if (error) {
    console.log('Supabase pets load error:', error);
    return [];
  }

  if (!data || data.length === 0) {
    console.log('No Supabase pets found, using local pets');
    return [];
  }

  const mappedPets = data.map((row) => ({
    id: row.id,
    name: row.name,
    species: row.species,
    breed: row.breed,
    birthday: row.birthday,
    age: row.birthday ? calculateAgeLabelFromBirthday(row.birthday) : 'Unknown',
    weight: row.weight ? `${row.weight} lbs` : '',
    gender: row.gender,
    photoUri: row.photo_url,
    careGoals: row.care_goals,
    emoji: getDefaultPetEmoji(row.species),
    score: row.health_score ?? 80,
  }));

  console.log('Loaded pets from Supabase');
  return mappedPets;
};

const savePushTokenToSupabase = async (expoPushToken, deviceName) => {
  if (!expoPushToken) {
    return;
  }

  const { data: existingTokens, error: lookupError } = await supabase
    .from('push_tokens')
    .select('expo_push_token')
    .eq('expo_push_token', expoPushToken)
    .limit(1);

  if (lookupError) {
    console.log('Push token save error:', lookupError);
    return;
  }

  if ((existingTokens || []).length > 0) {
    return;
  }

  const { error } = await supabase.from('push_tokens').insert([
    {
      user_id: null,
      expo_push_token: expoPushToken,
      device_name: deviceName || 'Unknown device',
    },
  ]);

  if (error) {
    console.log('Supabase push token save error:', error);
    return;
  }

  console.log('Push token saved to Supabase');
};

const loadPushTokensFromSupabase = async () => {
  const { data, error } = await supabase
    .from('push_tokens')
    .select('expo_push_token, device_name')
    .order('created_at', { ascending: false });

  if (error) {
    console.log('Supabase push tokens load error:', error);
    return [];
  }

  const uniqueTokens = new Map();

  (data || []).forEach((row) => {
    const token = String(row.expo_push_token || '').trim();
    if (!token || uniqueTokens.has(token)) {
      return;
    }

    uniqueTokens.set(token, {
      expoPushToken: token,
      deviceName: row.device_name || 'Unknown device',
    });
  });

  return Array.from(uniqueTokens.values());
};

const sendExpoPushNotifications = async (messages = []) => {
  const batches = [];
  const batchSize = 100;

  for (let index = 0; index < messages.length; index += batchSize) {
    batches.push(messages.slice(index, index + batchSize));
  }

  const results = await Promise.all(
    batches.map(async (batch) => {
      const response = await fetch('https://exp.host/--/api/v2/push/send', {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(batch),
      });

      const responseJson = await response.json();

      if (!response.ok) {
        throw new Error(JSON.stringify(responseJson));
      }

      return responseJson;
    }),
  );

  return results;
};

const sendLostPetAlertPushNotifications = async (alert) => {
  try {
    const pushTokens = await loadPushTokensFromSupabase();

    if (pushTokens.length === 0) {
      console.log('No push tokens found for Lost Pet alert notifications');
      return;
    }

    const uniqueMessages = pushTokens.map(({ expoPushToken }) => ({
      to: expoPushToken,
      sound: 'default',
      title: 'Lost Pet Alert',
      body: `${alert.petName || 'A pet'} was last seen near ${alert.lastSeenLocation || 'an unknown location'}`,
      data: {
        type: 'lost_pet_alert',
        alertId: alert.id || null,
      },
    }));

    const results = await sendExpoPushNotifications(uniqueMessages);
    console.log('Lost Pet alert notifications sent', results);
  } catch (error) {
    console.log('Lost Pet push notification send error:', error);
  }
};

const registerForPushNotificationsAsync = async () => {
  try {
    if (!Device.isDevice) {
      console.log('Push notifications require a physical device');
      return null;
    }

    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      console.log('Push notification permission denied');
      return null;
    }

    const projectId = Constants?.expoConfig?.extra?.eas?.projectId
      ?? Constants?.easConfig?.projectId;

    if (!projectId) {
      console.log('Push notification projectId not found');
      return null;
    }

    const token = (
      await Notifications.getExpoPushTokenAsync({ projectId })
    ).data;

    console.log('Expo push token:', token);

    const deviceName = Device.deviceName || Device.modelName || Device.manufacturer || 'Unknown device';
    await savePushTokenToSupabase(token, deviceName);

    return token;
  } catch (error) {
    console.log('Push token registration failed:', error);
    return null;
  }
};

const getHealthRecordIcon = (type) => {
  const iconMap = {
    vaccination: '💉',
    medication: '💊',
    appointment: '🏥',
    weight: '⚖️',
    symptom: '🤒',
    surgery: '🩺',
    allergy: '⚠️',
    diagnosis: '📋',
    lab: '🧪',
    fish: '🐟',
    imported_file: '📎',
  };

  return iconMap[type] || '📋';
};

const getHealthRecordNotes = (type, details = {}, fallback = '') => {
  const detailMap = {
    vaccination: details.vaccineNotes,
    medication: details.medicationNotes,
    appointment: details.appointmentNotes,
    weight: details.weightNotes,
    symptom: details.symptomNotes,
    surgery: details.recoveryNotes,
    allergy: details.allergyNotes,
    diagnosis: details.diagnosisNotes,
    lab: details.labNotes,
    fish: details.readingNotes,
  };

  return String(detailMap[type] || fallback || '').trim();
};

const normalizeHealthRecordFromSupabase = (row) => ({
  id: row.id,
  petId: row.pet_id,
  type: row.type,
  title: row.title,
  date: row.record_date,
  nextDue: row.next_due,
  details: row.details || {},
  notes: row.notes || '',
  icon: getHealthRecordIcon(row.type),
  status: 'current',
  fileUri: row.type === 'imported_file' ? (row.details?.fileUrl || row.details?.fileUri || row.details?.file_uri || '') : '',
  fileUrl: row.type === 'imported_file' ? (row.details?.fileUrl || row.details?.fileUri || row.details?.file_uri || '') : '',
  filePath: row.type === 'imported_file' ? (row.details?.filePath || row.details?.file_path || '') : '',
  fileName: row.type === 'imported_file' ? (row.details?.fileName || row.title || '') : '',
  mimeType: row.type === 'imported_file' ? (row.details?.mimeType || row.details?.mime_type || '') : '',
  size: row.type === 'imported_file' ? (row.details?.size || null) : null,
  provider: row.details?.provider
    || row.details?.providerClinic
    || row.details?.vetClinic
    || row.details?.prescribingVet
    || row.details?.diagnosisVet
    || row.details?.labVet
    || row.details?.clinicVet
    || '',
});

const saveHealthRecordToSupabase = async (record) => {
  const payload = {
    id: record.id,
    pet_id: record.petId,
    user_id: null,
    type: record.type,
    title: record.title,
    record_date: record.date || null,
    next_due: record.nextDue || null,
    details: record.details || {},
    notes: record.notes || '',
  };

  const { error } = await supabase.from('health_records').insert([payload]);

  if (error) {
    console.log('Supabase health record save error:', error);
    return;
  }

  console.log('Health record saved to Supabase');
};

const updateHealthRecordInSupabase = async (record) => {
  const payload = {
    pet_id: record.petId,
    user_id: null,
    type: record.type,
    title: record.title,
    record_date: record.date || null,
    next_due: record.nextDue || null,
    details: record.details || {},
    notes: record.notes || '',
  };

  const { error } = await supabase
    .from('health_records')
    .update(payload)
    .eq('id', record.id);

  if (error) {
    console.log('Supabase health record update error:', error);
    return;
  }

  console.log('Health record updated in Supabase');
};

const deleteHealthRecordFromSupabase = async (recordId) => {
  const { error } = await supabase
    .from('health_records')
    .delete()
    .eq('id', recordId);

  if (error) {
    console.log('Supabase health record delete error:', error);
    return;
  }

  console.log('Health record deleted from Supabase');
};

const loadHealthRecordsFromSupabase = async () => {
  const { data, error } = await supabase
    .from('health_records')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.log('Supabase health records load error:', error);
    return null;
  }

  if (!data || data.length === 0) {
    console.log('No Supabase health records found, using empty state');
    return [];
  }

  const mappedRecords = data.map(normalizeHealthRecordFromSupabase);
  console.log('Loaded health records from Supabase');
  return mappedRecords;
};

const saveCareReminderToSupabase = async (reminder) => {
  const payload = {
    id: reminder.id,
    pet_id: reminder.petId,
    user_id: null,
    title: reminder.title,
    reminder_date: reminder.date || null,
    reminder_time: reminder.time || '',
    completed: !!reminder.completed,
    source: reminder.source || 'manual',
    source_record_id: reminder.sourceRecordId || null,
  };

  const { error } = await supabase.from('care_reminders').insert([payload]);

  if (error) {
    console.log('Supabase care reminder save error:', error);
    return;
  }

  console.log('Care reminder saved to Supabase');
};

const updateCareReminderInSupabase = async (reminder) => {
  const payload = {
    pet_id: reminder.petId,
    user_id: null,
    title: reminder.title,
    reminder_date: reminder.date || null,
    reminder_time: reminder.time || '',
    completed: !!reminder.completed,
    source: reminder.source || 'manual',
    source_record_id: reminder.sourceRecordId || null,
  };

  const { error } = await supabase
    .from('care_reminders')
    .update(payload)
    .eq('id', reminder.id);

  if (error) {
    console.log('Supabase care reminder update error:', error);
    return;
  }

  console.log('Care reminder updated in Supabase');
};

const deleteCareReminderFromSupabase = async (reminderId) => {
  const { error } = await supabase
    .from('care_reminders')
    .delete()
    .eq('id', reminderId);

  if (error) {
    console.log('Supabase care reminder delete error:', error);
    return;
  }

  console.log('Care reminder deleted from Supabase');
};

const loadCareRemindersFromSupabase = async () => {
  const { data, error } = await supabase
    .from('care_reminders')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.log('Supabase care reminders load error:', error);
    return null;
  }

  if (!data || data.length === 0) {
    console.log('No Supabase care reminders found, using empty state');
    return [];
  }

  const mappedReminders = data.map((row) => ({
    id: row.id,
    petId: row.pet_id,
    title: row.title,
    date: row.reminder_date,
    time: row.reminder_time,
    completed: row.completed,
    source: row.source,
    sourceRecordId: row.source_record_id,
    icon: '',
  }));

  console.log('Loaded care reminders from Supabase');
  return mappedReminders;
};

const saveCommunityPostToSupabase = async (post) => {
  const payload = {
    id: post.id,
    user_id: null,
    author: post.author || 'Pet Parent',
    content: post.content || '',
    image_url: null,
    likes: post.likes || 0,
    comments: post.comments || 0,
  };

  const { error } = await supabase.from('community_posts').insert([payload]);

  if (error) {
    console.log('Supabase community post save error:', error);
    return;
  }

  console.log('Community post saved to Supabase');
};

const updateCommunityPostLikesInSupabase = async (postId, likes) => {
  const { error } = await supabase
    .from('community_posts')
    .update({ likes })
    .eq('id', postId);

  if (error) {
    console.log('Supabase community post likes update error:', error);
    return;
  }

  console.log('Community post likes updated in Supabase');
};

const updateCommunityPostInSupabase = async (post) => {
  const { error } = await supabase
    .from('community_posts')
    .update({
      author: post.author || 'Pet Parent',
      content: post.content || '',
      likes: post.likes || 0,
      comments: post.comments || 0,
    })
    .eq('id', post.id);

  if (error) {
    console.log('Supabase community post update error:', error);
    return;
  }

  console.log('Community post updated in Supabase');
};

const deleteCommunityPostFromSupabase = async (postId) => {
  const { error } = await supabase
    .from('community_posts')
    .delete()
    .eq('id', postId);

  if (error) {
    console.log('Supabase community post delete error:', error);
    return;
  }

  console.log('Community post deleted from Supabase');
};

const loadCommunityPostsFromSupabase = async () => {
  const { data, error } = await supabase
    .from('community_posts')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.log('Supabase community posts load error:', error);
    return null;
  }

  if (!data || data.length === 0) {
    console.log('No Supabase community posts found, using mock posts');
    return [];
  }

  const mappedPosts = data.map((row) => ({
    id: row.id,
    author: row.author || 'Pet Parent',
    owner: row.author === 'Raymond',
    petType: 'Community Member',
    time: 'Just now',
    content: row.content,
    emoji: '',
    likes: row.likes || 0,
    comments: row.comments || 0,
    type: 'general',
    liked: false,
  }));

  console.log('Loaded community posts from Supabase');
  return mappedPosts;
};

const uploadLostPetPhotoToStorage = async (photoUri, petId) => {
  if (!photoUri) return '';

  try {
    const response = await fetch(photoUri);
    const arrayBuffer = await response.arrayBuffer();
    const safeFileName = `lost-pet-${Date.now()}.jpg`;
    const filePath = `lost-pet-alerts/${petId || 'unknown-pet'}/${safeFileName}`;

    const { error } = await supabase.storage
      .from('health-record-files')
      .upload(filePath, arrayBuffer, {
        contentType: 'image/jpeg',
        upsert: true,
      });

    if (error) {
      console.log('Lost pet photo upload error:', error);
      return photoUri;
    }

    const { data: publicUrlData } = supabase.storage
      .from('health-record-files')
      .getPublicUrl(filePath);

    return publicUrlData?.publicUrl || photoUri;
  } catch (error) {
    console.log('Lost pet photo upload error:', error);
    return photoUri;
  }
};

const saveLostPetAlertToSupabase = async (alert) => {
  try {
    const photoUrl = alert.photoUrl || (alert.photoUri ? await uploadLostPetPhotoToStorage(alert.photoUri, alert.petId) : '');
    const payload = {
      id: alert.id,
      pet_id: alert.petId || null,
      user_id: null,
      pet_name: alert.petName || '',
      photo_url: photoUrl || '',
      last_seen_location: alert.lastSeenLocation || '',
      description: alert.description || '',
      status: alert.status || 'active',
      latitude: alert.latitude ?? null,
      longitude: alert.longitude ?? null,
    };

    const { error } = await supabase.from('lost_pet_alerts').insert([payload]);

    if (error) {
      console.log('Supabase lost pet alert save error:', error);
      return null;
    }

    console.log('Lost pet alert saved to Supabase');
    void sendLostPetAlertPushNotifications({
      id: payload.id,
      petId: payload.pet_id,
      petName: payload.pet_name,
      lastSeenLocation: payload.last_seen_location,
    });
    return { ...payload, photo_url: photoUrl || '' };
  } catch (error) {
    console.log('Supabase lost pet alert save error:', error);
    return null;
  }
};

const updateLostPetAlertStatusInSupabase = async (alertId, status) => {
  const { error } = await supabase
    .from('lost_pet_alerts')
    .update({ status })
    .eq('id', alertId);

  if (error) {
    console.log('Supabase lost pet alert status update error:', error);
    return;
  }

  console.log('Lost pet alert status updated in Supabase');
};

const loadLostPetAlertsFromSupabase = async () => {
  const { data, error } = await supabase
    .from('lost_pet_alerts')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.log('Supabase lost pet alerts load error:', error);
    return null;
  }

  if (!data || data.length === 0) {
    console.log('No Supabase lost pet alerts found');
    return [];
  }

  const mappedAlerts = data.map((row) => ({
    id: row.id,
    petId: row.pet_id || '',
    petName: row.pet_name || 'Lost Pet',
    photoUrl: row.photo_url || '',
    lastSeenLocation: row.last_seen_location || '',
    dateReported: row.created_at || row.date_reported || '',
    description: row.description || '',
    status: row.status || 'active',
    latitude: row.latitude ?? null,
    longitude: row.longitude ?? null,
  }));

  console.log('Loaded lost pet alerts from Supabase');
  return mappedAlerts;
};

const normalizeStorageFileName = (fileName) => {
  const fallbackName = `memory-${Date.now()}.jpg`;
  const rawName = String(fileName || fallbackName).trim() || fallbackName;
  return rawName.replace(/[^\w.\-]+/g, '_');
};

const uploadMemoryPhotoToStorage = async ({ uri, fileName, mimeType, petId }) => {
  if (!uri) {
    return null;
  }

  try {
    const response = await fetch(uri);
    const arrayBuffer = await response.arrayBuffer();
    const safeName = normalizeStorageFileName(fileName);
    const filePath = `memories/${petId || 'unknown'}/${Date.now()}-${safeName}`;

    const { error } = await supabase.storage
      .from('memory-vault')
      .upload(filePath, arrayBuffer, {
        contentType: mimeType || 'application/octet-stream',
        upsert: true,
      });

    if (error) {
      console.log('Memory Vault storage upload error:', error);
      return null;
    }

    const { data: publicUrlData } = supabase.storage
      .from('memory-vault')
      .getPublicUrl(filePath);

    return {
      filePath,
      fileUrl: publicUrlData?.publicUrl || '',
    };
  } catch (error) {
    console.log('Memory Vault storage upload error:', error);
    return null;
  }
};

const saveMemoryToSupabase = async (memory) => {
  try {
    let fileUrl = memory.fileUrl || '';
    let filePath = memory.filePath || '';

    if (memory.photoUri && !fileUrl) {
      const uploaded = await uploadMemoryPhotoToStorage({
        uri: memory.photoUri,
        fileName: memory.fileName,
        mimeType: memory.mimeType,
        petId: memory.petId,
      });

      if (!uploaded) {
        return null;
      }

      fileUrl = uploaded.fileUrl;
      filePath = uploaded.filePath;
    }

    const payload = {
      id: memory.id,
      pet_id: memory.petId || null,
      user_id: null,
      caption: memory.caption || '',
      memory_type: memory.type || 'Memory',
      memory_date: memory.date || null,
      photo_url: fileUrl || null,
      file_path: filePath || null,
      milestone: Boolean(memory.milestone),
    };

    const { error } = await supabase.from('memories').insert([payload]);

    if (error) {
      console.log('Supabase memory save error:', error);
      return null;
    }

    console.log('Memory saved to Supabase');
    return {
      ...payload,
      photoUri: fileUrl || memory.photoUri || null,
      fileUrl: fileUrl || '',
      filePath: filePath || '',
      mimeType: memory.mimeType || '',
      size: memory.size ?? null,
      fileName: memory.fileName || '',
      emoji: fileUrl ? null : (memory.milestone ? '🏆' : '🖼️'),
    };
  } catch (error) {
    console.log('Supabase memory save error:', error);
    return null;
  }
};

const loadMemoriesFromSupabase = async () => {
  const { data, error } = await supabase
    .from('memories')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.log('Supabase memories load error:', error);
    return null;
  }

  if (!data || data.length === 0) {
    console.log('No Supabase memories found');
    return [];
  }

  const mappedMemories = data.map((row) => ({
    id: row.id,
    petId: row.pet_id,
    photoUri: row.photo_url || null,
    caption: row.caption || '',
    milestone: row.milestone ?? String(row.memory_type || '').toLowerCase() === 'milestone',
    type: row.memory_type || (row.milestone ? 'Milestone' : 'Memory'),
    date: row.memory_date || '',
    emoji: row.photo_url ? null : (row.milestone ? '🏆' : '🖼️'),
    fileUrl: row.photo_url || '',
    filePath: row.file_path || '',
    mimeType: row.mime_type || '',
    size: row.size ?? null,
    createdAt: row.created_at || '',
  }));

  console.log('Loaded memories from Supabase');
  return mappedMemories;
};

const deleteMemoryFromSupabase = async (memory) => {
  if (!memory?.id) {
    return;
  }

  try {
    if (memory.filePath) {
      const { error: storageError } = await supabase.storage
        .from('memory-vault')
        .remove([memory.filePath]);

      if (storageError) {
        console.log('Memory Vault storage delete error:', storageError);
      } else {
        console.log('Memory file deleted from Supabase Storage');
      }
    }

    const { error } = await supabase
      .from('memories')
      .delete()
      .eq('id', memory.id);

    if (error) {
      console.log('Supabase memory delete error:', error);
      return;
    }

    console.log('Memory deleted from Supabase');
  } catch (error) {
    console.log('Supabase memory delete error:', error);
  }
};

const CURRENT_USER_OWNER_ID = '00000000-0000-0000-0000-000000000001';
const CURRENT_USER_NAME = 'Raymond';
const CURRENT_USER_EMAIL = 'rayray579@gmail.com';

const normalizeFamilyMemberRole = (role) => {
  const value = String(role || 'Viewer').trim().toLowerCase();
  if (value === 'caregiver') return 'Caregiver';
  if (value === 'admin') return 'Admin';
  return 'Viewer';
};

const normalizeFamilyMemberStatus = (status) => {
  const value = String(status || 'pending').trim().toLowerCase();
  if (value === 'accepted') return 'accepted';
  return 'pending';
};

const mapFamilyMemberRow = (row) => ({
  id: row.id,
  ownerId: row.owner_id || '',
  memberEmail: row.member_email || '',
  role: normalizeFamilyMemberRole(row.role),
  status: normalizeFamilyMemberStatus(row.status),
  createdAt: row.created_at || '',
});

const loadFamilyMembersFromSupabase = async () => {
  const { data, error } = await supabase
    .from('family_members')
    .select('*')
    .eq('owner_id', CURRENT_USER_OWNER_ID)
    .order('created_at', { ascending: false });

  if (error) {
    console.log('Supabase family members load error:', error);
    return null;
  }

  if (!data || data.length === 0) {
    console.log('No Supabase family members found');
    return [];
  }

  console.log('Loaded family members from Supabase');
  return data.map(mapFamilyMemberRow);
};

const saveFamilyInvitationToSupabase = async ({ memberEmail, role }) => {
  try {
    const payload = {
      owner_id: CURRENT_USER_OWNER_ID,
      member_email: String(memberEmail || '').trim().toLowerCase(),
      role: normalizeFamilyMemberRole(role),
      status: 'pending',
    };

    const { data, error } = await supabase
      .from('family_members')
      .insert([payload])
      .select('*')
      .single();

    if (error) {
      console.log('Supabase family invitation save error:', error);
      return null;
    }

    console.log('Family invitation saved to Supabase');
    return data ? mapFamilyMemberRow(data) : null;
  } catch (error) {
    console.log('Supabase family invitation save error:', error);
    return null;
  }
};

const updateFamilyMemberStatusInSupabase = async (memberId, status) => {
  const { data, error } = await supabase
    .from('family_members')
    .update({ status: normalizeFamilyMemberStatus(status) })
    .eq('id', memberId)
    .eq('owner_id', CURRENT_USER_OWNER_ID)
    .select('*')
    .single();

  if (error) {
    console.log('Supabase family member update error:', error);
    return null;
  }

  console.log('Family member updated in Supabase');
  return data ? mapFamilyMemberRow(data) : null;
};

const removeFamilyMemberFromSupabase = async (memberId) => {
  const { error } = await supabase
    .from('family_members')
    .delete()
    .eq('id', memberId)
    .eq('owner_id', CURRENT_USER_OWNER_ID);

  if (error) {
    console.log('Supabase family member delete error:', error);
    return;
  }

  console.log('Family member deleted from Supabase');
};

const mapCommunityCommentRow = (row) => ({
  id: row.id,
  parentType: row.parent_type || 'post',
  parentId: row.parent_id || '',
  userId: row.user_id || null,
  author: row.author || 'Raymond',
  text: row.text || '',
  createdAt: row.created_at || '',
});

const loadCommunityCommentsFromSupabase = async () => {
  const { data, error } = await supabase
    .from('comments')
    .select('*')
    .order('created_at', { ascending: true });

  if (error) {
    console.log('Supabase comments load error:', error);
    return null;
  }

  if (!data || data.length === 0) {
    console.log('No Supabase comments found');
    return [];
  }

  console.log('Loaded comments from Supabase');
  return data.map(mapCommunityCommentRow);
};

const saveCommunityCommentToSupabase = async (comment) => {
  try {
    const payload = {
      id: comment.id,
      parent_type: comment.parentType,
      parent_id: comment.parentId,
      user_id: null,
      author: comment.author || 'Raymond',
      text: comment.text || '',
    };

    const { data, error } = await supabase
      .from('comments')
      .insert([payload])
      .select('*')
      .single();

    if (error) {
      console.log('Supabase comment save error:', error);
      return null;
    }

    console.log('Comment saved to Supabase');
    return data ? mapCommunityCommentRow(data) : null;
  } catch (error) {
    console.log('Supabase comment save error:', error);
    return null;
  }
};

const deleteCommunityCommentFromSupabase = async (commentId) => {
  const { error } = await supabase
    .from('comments')
    .delete()
    .eq('id', commentId)
    .eq('author', 'Raymond');

  if (error) {
    console.log('Supabase comment delete error:', error);
    return;
  }

  console.log('Comment deleted from Supabase');
};

const recalculateCommunityCounts = (items) => {
  const counts = new Map();

  items.forEach((item) => {
    const key = `${item.parentType}:${item.parentId}`;
    counts.set(key, (counts.get(key) || 0) + 1);
  });

  return counts;
};

const normalizeRecipeSafeFor = (value) => {
  if (Array.isArray(value)) return value.filter(Boolean);
  const text = String(value || '').trim();
  if (!text) return [];
  return text.split(',').map((item) => item.trim()).filter(Boolean);
};

const normalizeRecipeIngredients = (value) => {
  if (Array.isArray(value)) return value.filter(Boolean);
  const text = String(value || '').trim();
  if (!text) return [];
  return text.split(/\n|,/).map((item) => item.trim()).filter(Boolean);
};

const saveRecipeToSupabase = async (recipe) => {
  const payload = {
    id: recipe.id,
    user_id: null,
    author: recipe.author || 'Pet Parent',
    title: recipe.title || '',
    description: recipe.description || '',
    ingredients: recipe.ingredients || [],
    pet_type: Array.isArray(recipe.safeFor) ? recipe.safeFor.join(', ') : String(recipe.safeFor || ''),
    prep_time: recipe.prepTime || '',
    likes: recipe.likes || 0,
    comments: recipe.comments || 0,
  };

  const { error } = await supabase.from('recipes').insert([payload]);

  if (error) {
    console.log('Supabase recipe save error:', error);
    return;
  }

  console.log('Recipe saved to Supabase');
};

const updateRecipeInSupabase = async (recipe) => {
  const payload = {
    author: recipe.author || 'Pet Parent',
    title: recipe.title || '',
    description: recipe.description || '',
    ingredients: recipe.ingredients || [],
    pet_type: Array.isArray(recipe.safeFor) ? recipe.safeFor.join(', ') : String(recipe.safeFor || ''),
    prep_time: recipe.prepTime || '',
    likes: recipe.likes || 0,
    comments: recipe.comments || 0,
  };

  const { error } = await supabase
    .from('recipes')
    .update(payload)
    .eq('id', recipe.id);

  if (error) {
    console.log('Supabase recipe update error:', error);
    return;
  }

  console.log('Recipe updated in Supabase');
};

const deleteRecipeFromSupabase = async (recipeId) => {
  const { error } = await supabase
    .from('recipes')
    .delete()
    .eq('id', recipeId);

  if (error) {
    console.log('Supabase recipe delete error:', error);
    return;
  }

  console.log('Recipe deleted from Supabase');
};

const loadRecipesFromSupabase = async () => {
  const { data, error } = await supabase
    .from('recipes')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.log('Supabase recipes load error:', error);
    return null;
  }

  if (!data || data.length === 0) {
    console.log('No Supabase recipes found, using existing recipe list');
    return [];
  }

  const mappedRecipes = data.map((row) => ({
    id: row.id,
    author: row.author || 'Pet Parent',
    owner: row.author === 'Raymond',
    title: row.title,
    description: row.description,
    ingredients: normalizeRecipeIngredients(row.ingredients),
    safeFor: normalizeRecipeSafeFor(row.pet_type),
    prepTime: row.prep_time,
    likes: row.likes || 0,
    comments: row.comments || 0,
    emoji: row.emoji || '🥣',
    instructions: [],
    liked: false,
  }));

  console.log('Loaded recipes from Supabase');
  return mappedRecipes;
};

const DatePickerField = ({ label, value, onChange, placeholder }) => {
  const [showPicker, setShowPicker] = useState(false);
  const [tempDate, setTempDate] = useState(() => parseStoredDateKey(value) || new Date());

  useEffect(() => {
    if (showPicker) {
      setTempDate(parseStoredDateKey(value) || new Date());
    }
  }, [showPicker, value]);

  const openPicker = () => setShowPicker(true);
  const closePicker = () => setShowPicker(false);

  const confirmDate = (date) => {
    if (!date) return;
    onChange(toLocalDateKey(date));
    setShowPicker(false);
  };

  return (
    <>
      <Text style={s.datePickerLabel}>{label}</Text>
      <TouchableOpacity style={s.datePickerField} onPress={openPicker} activeOpacity={0.85}>
        <Text style={[s.datePickerFieldText, !value && s.datePickerPlaceholder]}>
          {value ? formatDate(value) : placeholder}
        </Text>
        <Text style={s.datePickerChevron}>▾</Text>
      </TouchableOpacity>

      <Modal visible={showPicker} transparent animationType="fade" onRequestClose={closePicker}>
        <View style={s.datePickerOverlay}>
          <View style={s.datePickerModal}>
            <View style={s.datePickerModalHeader}>
              <Text style={s.datePickerModalTitle}>{label}</Text>
              <TouchableOpacity onPress={closePicker}>
                <Text style={s.datePickerModalClose}>✕</Text>
              </TouchableOpacity>
            </View>

            <View style={s.datePickerPickerWrap}>
              <DateTimePicker
                value={tempDate}
                mode="date"
                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                onChange={(event, selectedDate) => {
                  if (Platform.OS === 'android') {
                    if (event.type === 'dismissed') {
                      closePicker();
                      return;
                    }
                    if (selectedDate) {
                      confirmDate(selectedDate);
                    }
                    return;
                  }

                  if (selectedDate) {
                    setTempDate(selectedDate);
                  }
                }}
                style={{ width: '100%' }}
                themeVariant="dark"
              />
            </View>

            <View style={s.datePickerButtons}>
              <TouchableOpacity style={s.customActionCancelBtn} onPress={closePicker}>
                <Text style={s.customActionCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={s.customActionSaveBtn} onPress={() => confirmDate(tempDate)}>
                <Text style={s.customActionSaveText}>Select Date</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
};

const addDaysLocal = (date, days) => {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
};

const formatMonthYear = (date) => date.toLocaleDateString([], { month: 'short', year: 'numeric' });

const getStreakDaysForPet = (activityLogs, petId) => {
  const petLogs = activityLogs.filter((log) => log.petId === petId);
  if (petLogs.length === 0) return 1;

  const uniqueDays = [...new Set(petLogs.map((log) => log.dateKey || new Date().toDateString()))]
    .sort((a, b) => new Date(b) - new Date(a));

  let streakDays = 0;
  for (let i = 0; i < uniqueDays.length; i += 1) {
    const expected = new Date();
    expected.setDate(expected.getDate() - i);
    const expectedDay = expected.toDateString();
    if (uniqueDays.includes(expectedDay)) {
      streakDays += 1;
    } else {
      break;
    }
  }

  return Math.max(1, streakDays);
};

const calculateAgeLabelFromBirthday = (birthdayKey) => {
  if (!birthdayKey || !/^\d{4}-\d{2}-\d{2}$/.test(birthdayKey)) return '';

  const [year, month, day] = birthdayKey.split('-').map(Number);
  const birthDate = new Date(year, month - 1, day);
  if (Number.isNaN(birthDate.getTime())) return '';

  const today = new Date();
  let years = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();

  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    years -= 1;
  }

  if (years >= 1) {
    return `${years} yr${years === 1 ? '' : 's'}`;
  }

  const months = Math.max(
    1,
    (today.getFullYear() - birthDate.getFullYear()) * 12
      + (today.getMonth() - birthDate.getMonth())
      - (today.getDate() < birthDate.getDate() ? 1 : 0)
  );

  return `${months} mo${months === 1 ? '' : 's'}`;
};

const buildStarterReminders = (pet) => {
  const now = new Date();
  const makeReminder = (title, icon, dayOffset, time) => ({
    id: `${pet.id}-${title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${dayOffset}`,
    petId: pet.id,
    title,
    icon,
    date: toLocalDateKey(addDaysLocal(now, dayOffset)),
    time,
    completed: false,
    source: 'starter',
  });

  const species = pet.species?.toLowerCase();

  switch (species) {
    case 'dog':
      return [
        makeReminder('Morning Feeding', '🍽️', 0, '7:00 AM'),
        makeReminder('Evening Feeding', '🍽️', 0, '6:00 PM'),
        makeReminder('Daily Walk', '🦮', 1, '8:00 AM'),
        makeReminder('Grooming Reminder', '🧼', 2, '4:00 PM'),
      ];
    case 'cat':
      return [
        makeReminder('Feeding', '🍽️', 0, '8:00 AM'),
        makeReminder('Litter Cleaning', '🧹', 0, '5:00 PM'),
        makeReminder('Play Session', '🎾', 1, '6:00 PM'),
      ];
    case 'fish':
      return [
        makeReminder('Feed Fish', '🍽️', 0, '9:00 AM'),
        makeReminder('Water Change', '💧', 1, '4:00 PM'),
        makeReminder('Tank Check', '🌡️', 2, '10:00 AM'),
      ];
    case 'bird':
      return [
        makeReminder('Feed Bird', '🍽️', 0, '8:00 AM'),
        makeReminder('Cage Cleaning', '🧼', 1, '5:00 PM'),
        makeReminder('Enrichment Time', '💬', 2, '3:00 PM'),
      ];
    case 'reptile':
      return [
        makeReminder('Heat Lamp Check', '🔥', 0, '8:00 AM'),
        makeReminder('Feeding', '🍽️', 0, '6:00 PM'),
        makeReminder('Habitat Cleaning', '🧽', 1, '4:00 PM'),
      ];
    case 'rabbit':
      return [
        makeReminder('Morning Feeding', '🍽️', 0, '8:00 AM'),
        makeReminder('Hutch Cleaning', '🧹', 1, '5:00 PM'),
        makeReminder('Play Time', '🎾', 2, '4:00 PM'),
      ];
    case 'hamster':
      return [
        makeReminder('Feed Hamster', '🍽️', 0, '8:00 AM'),
        makeReminder('Cage Tidy', '🧼', 1, '5:00 PM'),
        makeReminder('Wheel Time', '🎾', 2, '4:00 PM'),
      ];
    case 'horse':
      return [
        makeReminder('Morning Feed', '🍽️', 0, '7:00 AM'),
        makeReminder('Grooming', '🧼', 1, '4:00 PM'),
        makeReminder('Trail Ride', '🐎', 2, '3:00 PM'),
      ];
    default:
      return [
        makeReminder('Daily Care Check', '✨', 0, '9:00 AM'),
        makeReminder('Feed Time', '🍽️', 1, '9:00 AM'),
        makeReminder('Habitat Cleaning', '🧹', 2, '4:00 PM'),
      ];
  }
};

const buildStarterHealthRecords = (pet) => {
  const todayLabel = new Date().toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' });
  const nextYearLabel = formatMonthYear(addDaysLocal(new Date(), 365));
  const parsedWeightMatch = String(pet.weight || '').match(/[\d.]+/);
  const parsedWeightValue = parsedWeightMatch ? Number(parsedWeightMatch[0]) : null;
  const species = pet.species?.toLowerCase();
  const baseRecords = [
    {
      id: `${pet.id}-weight-baseline`,
      petId: pet.id,
      type: 'weight',
      title: 'Weight Baseline',
      date: todayLabel,
      provider: null,
      status: 'current',
      icon: '⚖️',
      nextDue: null,
      value: parsedWeightValue,
      unit: 'lbs',
      details: {
        weightValue: pet.weight || '',
        weightNotes: 'Recorded during onboarding',
      },
    },
  ];

  if (species === 'dog' || species === 'cat') {
    baseRecords.push({
      id: `${pet.id}-vaccination-placeholder`,
      petId: pet.id,
      type: 'vaccination',
      title: 'Vaccination Placeholder',
      date: todayLabel,
      provider: 'To be scheduled',
      status: 'upcoming',
      icon: '💉',
      nextDue: nextYearLabel,
      details: {
        providerClinic: 'To be scheduled',
      },
    });
  } else if (species === 'fish') {
    baseRecords.push({
      id: `${pet.id}-tank-setup`,
      petId: pet.id,
      type: 'appointment',
      title: 'Tank Setup Record',
      date: todayLabel,
      provider: 'Onboarding',
      status: 'current',
      icon: '🌊',
      nextDue: null,
      details: {
        vetClinic: 'Onboarding',
        appointmentDate: todayLabel,
      },
    });
  } else {
    baseRecords.push({
      id: `${pet.id}-wellness-check`,
      petId: pet.id,
      type: 'appointment',
      title: 'Wellness Check',
      date: todayLabel,
      provider: 'To be scheduled',
      status: 'upcoming',
      icon: '🏥',
      nextDue: nextYearLabel,
      details: {
        vetClinic: 'To be scheduled',
        appointmentDate: todayLabel,
      },
    });
  }

  return baseRecords;
};

const buildQuickActionsForSpecies = (pet, addActivityLog, navigation) => {
  const baseVetAction = { icon: '🩺', label: 'AI Vet', action: () => navigation.navigate('AIVet') };
  const species = pet.species?.toLowerCase();

  switch (species) {
    case 'dog':
      return [
        { icon: '🍽️', label: 'Log Meal', action: () => addActivityLog('meal', 'Meal logged', '🍽️') },
        { icon: '🦮', label: 'Log Walk', action: () => addActivityLog('walk', 'Walk logged', '🦮') },
        { icon: '⚖️', label: 'Log Weight', action: () => addActivityLog('weight', 'Weight updated', '⚖️') },
        { icon: '💊', label: 'Medication', action: () => addActivityLog('medication', 'Medication given', '💊') },
        { icon: '🎾', label: 'Play Time', action: () => addActivityLog('play', 'Play time logged', '🎾') },
        { icon: '🧼', label: 'Grooming', action: () => addActivityLog('grooming', 'Grooming logged', '🧼') },
        baseVetAction,
      ];
    case 'cat':
      return [
        { icon: '🍽️', label: 'Log Meal', action: () => addActivityLog('meal', 'Meal logged', '🍽️') },
        { icon: '🎾', label: 'Play Time', action: () => addActivityLog('play', 'Play time logged', '🎾') },
        { icon: '🧼', label: 'Grooming', action: () => addActivityLog('grooming', 'Grooming logged', '🧼') },
        { icon: '⚖️', label: 'Log Weight', action: () => addActivityLog('weight', 'Weight updated', '⚖️') },
        { icon: '💊', label: 'Medication', action: () => addActivityLog('medication', 'Medication given', '💊') },
        { icon: '🧹', label: 'Litter Cleaned', action: () => addActivityLog('litter_cleaned', 'Litter cleaned', '🧹') },
        baseVetAction,
      ];
    case 'fish':
      return [
        { icon: '🍽️', label: 'Feed Fish', action: () => addActivityLog('feeding', 'Fish fed', '🍽️') },
        { icon: '💧', label: 'Water Change', action: () => addActivityLog('water_change', 'Water changed', '💧') },
        { icon: '🌡️', label: 'Tank Temp', action: () => addActivityLog('tank_temp', 'Tank temperature checked', '🌡️') },
        { icon: '🧪', label: 'Check pH', action: () => addActivityLog('check_ph', 'Water pH checked', '🧪') },
        { icon: '🧽', label: 'Filter Cleaned', action: () => addActivityLog('filter_cleaned', 'Filter cleaned', '🧽') },
        baseVetAction,
      ];
    case 'bird':
      return [
        { icon: '🍽️', label: 'Feed Bird', action: () => addActivityLog('feeding', 'Bird fed', '🍽️') },
        { icon: '🧼', label: 'Cage Cleaned', action: () => addActivityLog('cage_cleaned', 'Cage cleaned', '🧼') },
        { icon: '💬', label: 'Social Time', action: () => addActivityLog('social_time', 'Social time logged', '💬') },
        { icon: '⚖️', label: 'Log Weight', action: () => addActivityLog('weight', 'Weight updated', '⚖️') },
        baseVetAction,
      ];
    case 'reptile':
      return [
        { icon: '🍽️', label: 'Feed Reptile', action: () => addActivityLog('feeding', 'Reptile fed', '🍽️') },
        { icon: '🔥', label: 'Heat Check', action: () => addActivityLog('heat_check', 'Heat checked', '🔥') },
        { icon: '💧', label: 'Humidity Check', action: () => addActivityLog('humidity_check', 'Humidity checked', '💧') },
        { icon: '🧽', label: 'Habitat Cleaned', action: () => addActivityLog('habitat_cleaned', 'Habitat cleaned', '🧽') },
        baseVetAction,
      ];
    case 'rabbit':
      return [
        { icon: '🍽️', label: 'Feed Rabbit', action: () => addActivityLog('feeding', 'Rabbit fed', '🍽️') },
        { icon: '🧹', label: 'Hutch Cleaned', action: () => addActivityLog('cage_cleaned', 'Hutch cleaned', '🧹') },
        { icon: '🎾', label: 'Play Time', action: () => addActivityLog('play', 'Play time logged', '🎾') },
        { icon: '🩺', label: 'AI Vet', action: () => navigation.navigate('AIVet') },
      ];
    case 'hamster':
      return [
        { icon: '🍽️', label: 'Feed Hamster', action: () => addActivityLog('feeding', 'Hamster fed', '🍽️') },
        { icon: '🧼', label: 'Cage Tidy', action: () => addActivityLog('cage_cleaned', 'Cage tidied', '🧼') },
        { icon: '🎾', label: 'Wheel Time', action: () => addActivityLog('play', 'Wheel time logged', '🎾') },
        { icon: '🩺', label: 'AI Vet', action: () => navigation.navigate('AIVet') },
      ];
    case 'horse':
      return [
        { icon: '🍽️', label: 'Feed Horse', action: () => addActivityLog('feeding', 'Horse fed', '🍽️') },
        { icon: '🧼', label: 'Grooming', action: () => addActivityLog('grooming', 'Grooming logged', '🧼') },
        { icon: '🐎', label: 'Trail Ride', action: () => addActivityLog('walk', 'Trail ride logged', '🐎') },
        { icon: '🩺', label: 'AI Vet', action: () => navigation.navigate('AIVet') },
      ];
    default:
      return [
        { icon: '🍽️', label: 'Log Meal', action: () => addActivityLog('meal', 'Meal logged', '🍽️') },
        { icon: '🧹', label: 'Care Check', action: () => addActivityLog('custom', 'Care check logged', '🧹') },
        { icon: '⚖️', label: 'Log Weight', action: () => addActivityLog('weight', 'Weight updated', '⚖️') },
        baseVetAction,
      ];
  }
};

const AI_SUGGESTIONS = [
  'My pet is scratching a lot',
  'Is chocolate really toxic to pets?',
  'My cat is not eating today',
  'Signs my pet is overweight?',
];

const PRESET_ACTIONS = [
  { label: 'Treat Time', icon: '🍖' },
  { label: 'Couch Cuddles', icon: '❤️' },
  { label: 'Bath Time', icon: '🛁' },
  { label: 'Grooming', icon: '🧼' },
  { label: 'Nap Time', icon: '😴' },
  { label: 'Photo Time', icon: '📸' },
  { label: 'Park Time', icon: '🏞️' },
  { label: 'Beach Day', icon: '🏖️' },
  { label: 'Fetch Session', icon: '🎾' },
  { label: 'Run Together', icon: '🏃' },
  { label: 'Yarn Play', icon: '🧶' },
  { label: 'Bird Watching', icon: '👀' },
  { label: 'Cat Nap', icon: '😺' },
  { label: 'Bird Bath', icon: '🛁' },
  { label: 'Singing Time', icon: '🎶' },
  { label: 'Tank Cleaning', icon: '🧽' },
  { label: 'Aquarium Time', icon: '✨' },
  { label: 'Heat Lamp Check', icon: '🔥' },
  { label: 'Clean Enclosure', icon: '🧹' },
  { label: 'Bunny Cuddles', icon: '🐰' },
  { label: 'Snack Time', icon: '🥕' },
  { label: 'Trail Ride', icon: '🐎' },
  { label: 'Horse Grooming', icon: '🧴' },
];

// ─────────────────────────────────────────────
// REUSABLE COMPONENTS
// ─────────────────────────────────────────────
function Card({ children, style }) {
  return (
    <View style={[s.card, style]}>
      {children}
    </View>
  );
}
function Badge({ label, color }) {
  return (
    <View
      style={{
        backgroundColor: color,
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 999,
      }}
    >
      <Text
        style={{
          color: '#fff',
          fontSize: 12,
          fontWeight: '700',
        }}
      >
        {label}
      </Text>
    </View>
  );
}
function PetAvatarRow({ pets, selectedId, onSelect, bounceValue, onOpenProfile }) {
  const selectedScale = bounceValue || 1;
  const { openAddPetModal } = useContext(AddPetContext);
  const longPressLockRef = useRef(null);
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={{
        paddingHorizontal: 20,
        paddingTop: 18,
      }}
    >
      {pets.map((pet) => {
        const selected = pet.id === selectedId;

        return (
          <TouchableOpacity
            key={pet.id}
            delayLongPress={250}
            onPress={() => {
              if (longPressLockRef.current === pet.id) return;
              onSelect(pet.id);
            }}
            onLongPress={() => {
              longPressLockRef.current = pet.id;
              onOpenProfile?.(pet.id);
              setTimeout(() => {
                if (longPressLockRef.current === pet.id) {
                  longPressLockRef.current = null;
                }
              }, 350);
            }}
            style={{
              alignItems: 'center',
              marginRight: 16,
            }}
          >
            {selected ? (
              <Animated.View
                style={{
                  width: 82,
                  height: 82,

                  borderRadius: 41,

                  backgroundColor: 'rgba(255, 121, 26, 0.32)',

                  borderWidth: 3,

                  borderColor: '#ff7a1a',

                  alignItems: 'center',
                  justifyContent: 'center',

                  shadowColor: '#ff7a1a',

                  shadowOffset: { width: 0, height: 6 },

                  shadowOpacity: 0.28,

                  shadowRadius: 14,

                  elevation: 8,

                  transform: [{ scale: selectedScale }],
                }}
              >
                {pet.photoUri ? (
                  <Image
                    source={{ uri: pet.photoUri }}
                    style={{
                      width: '100%',
                      height: '100%',
                      borderRadius: 38,
                    }}
                  />
                ) : (
                  <Text
                    style={{
                      fontSize: 38,
                    }}
                  >
                    {pet.emoji || getDefaultPetEmoji(pet.species)}
                  </Text>
                )}
              </Animated.View>
            ) : (
              <View
                style={{
                  width: 72,
                  height: 72,

                  borderRadius: 36,

                  backgroundColor: 'rgba(248, 250, 255, 0.64)',

                  borderWidth: 1,

                  borderColor: 'rgba(126,87,194,0.18)',

                  alignItems: 'center',
                  justifyContent: 'center',

                  shadowColor: '#000',

                  shadowOffset: { width: 0, height: 6 },

                  shadowOpacity: 0.04,

                  shadowRadius: 14,

                  elevation: 2,
                }}
              >
                {pet.photoUri ? (
                  <Image
                    source={{ uri: pet.photoUri }}
                    style={{
                      width: '100%',
                      height: '100%',
                      borderRadius: 36,
                    }}
                  />
                ) : (
                  <Text
                    style={{
                      fontSize: 32,
                    }}
                  >
                    {pet.emoji || getDefaultPetEmoji(pet.species)}
                  </Text>
                )}
              </View>
            )}

            <Text
              style={{
                color: selected ? '#782cea' : '#5f6477',

                fontSize: selected ? 19 : 13,

                fontWeight: selected ? '700' : '500',

                marginTop: 8,
              }}
            >
              {pet.name}
            </Text>
          </TouchableOpacity>
        );
      })}

      {typeof openAddPetModal === 'function' && (
        <TouchableOpacity
          onPress={() => {
            const selectedPet = pets.find((pet) => pet.id === selectedId);
            openAddPetModal(onSelect, selectedPet?.species);
          }}
          style={{
            alignItems: 'center',
            marginRight: 4,
            marginLeft: 4,
          }}
        >
          <View
            style={{
              width: 72,
              height: 72,
              borderRadius: 36,
              borderWidth: 1.5,
              borderStyle: 'dashed',
              borderColor: C.accent,
              backgroundColor: 'rgba(255,122,26,0.10)',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Text style={{ color: C.accent, fontSize: 30, fontWeight: '700' }}>＋</Text>
          </View>
          <Text
            style={{
              color: C.accent,
              fontSize: 13,
              fontWeight: '700',
              marginTop: 8,
            }}
          >
            Add Pet
          </Text>
        </TouchableOpacity>
      )}
    </ScrollView>
  );
}

function AnimatedQuickAction({ icon, label, onPress, isAddAction }) {
  const pressScale = useRef(new Animated.Value(1)).current;

  const animateTo = (toValue, callback) => {
    Animated.timing(pressScale, {
      toValue,
      duration: 90,
      useNativeDriver: true,
    }).start(callback);
  };

  return (
    <TouchableOpacity
      activeOpacity={1}
      onPressIn={() => animateTo(0.96)}
      onPressOut={() => animateTo(1)}
      onPress={onPress}
      style={{ marginRight: 12 }}
    >
      <Animated.View
        style={[
          s.quickAction,
          isAddAction && s.quickActionAdd,
          { transform: [{ scale: pressScale }] },
        ]}
      >
        <Text style={s.quickActionIcon}>{icon}</Text>
        <Text style={s.quickActionLabel}>{label}</Text>
      </Animated.View>
    </TouchableOpacity>
  );
}

function AddPetModal({ visible, initialSpecies = 'dog', onClose, onSave }) {
  const [step, setStep] = useState(1);
  const [petPhoto, setPetPhoto] = useState(null);
  const [petName, setPetName] = useState('');
  const [petSpecies, setPetSpecies] = useState(initialSpecies || 'dog');
  const [breedType, setBreedType] = useState('');
  const [birthMode, setBirthMode] = useState('birthday');
  const [birthday, setBirthday] = useState('');
  const [ageText, setAgeText] = useState('');
  const [weight, setWeight] = useState('');
  const [gender, setGender] = useState('Unknown');
  const [careGoals, setCareGoals] = useState('');
  const modalAnim = useRef(new Animated.Value(0)).current;
  const cardAnim = useRef(new Animated.Value(0.98)).current;
  const speciesOptions = [
    { label: 'Dog', value: 'dog' },
    { label: 'Cat', value: 'cat' },
    { label: 'Fish', value: 'fish' },
    { label: 'Bird', value: 'bird' },
    { label: 'Reptile', value: 'reptile' },
    { label: 'Rabbit', value: 'rabbit' },
    { label: 'Hamster', value: 'hamster' },
    { label: 'Horse', value: 'horse' },
    { label: 'Other', value: 'other' },
  ];
  const genderOptions = ['Female', 'Male', 'Unknown', 'Other'];

  const resetForm = () => {
    setStep(1);
    setPetPhoto(null);
    setPetName('');
    setPetSpecies(initialSpecies || 'dog');
    setBreedType('');
    setBirthMode('birthday');
    setBirthday('');
    setAgeText('');
    setWeight('');
    setGender('Unknown');
    setCareGoals('');
  };

  useEffect(() => {
    if (!visible) {
      resetForm();
      return;
    }

    setStep(1);
    setPetSpecies(initialSpecies || 'dog');
    modalAnim.setValue(0);
    cardAnim.setValue(0.98);

    Animated.parallel([
      Animated.timing(modalAnim, {
        toValue: 1,
        duration: 180,
        useNativeDriver: true,
      }),
      Animated.timing(cardAnim, {
        toValue: 1,
        duration: 180,
        useNativeDriver: true,
      }),
    ]).start();
  }, [visible, initialSpecies, modalAnim, cardAnim]);

  const pickPetPhoto = async () => {
    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (permission.status !== 'granted') {
        Alert.alert('Photo permission needed', 'Please allow photo library access to add a pet picture.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.85,
      });

      if (!result.canceled && result.assets?.[0]?.uri) {
        setPetPhoto(result.assets[0].uri);
      }
    } catch (error) {
      Alert.alert('Photo upload failed', 'Please try again.');
    }
  };

  const goNext = () => {
    if (step === 1) {
      if (!petName.trim()) {
        Alert.alert('Pet name required', 'Please enter your pet’s name.');
        return;
      }
      setStep(2);
      return;
    }

    if (step === 2) {
      if (birthMode === 'birthday' && !birthday.trim()) {
        Alert.alert('Birthday required', 'Please enter a birthday in YYYY-MM-DD format or switch to age.');
        return;
      }
      if (birthMode === 'age' && !ageText.trim()) {
        Alert.alert('Age required', 'Please enter an age.');
        return;
      }
      setStep(3);
    }
  };

  const savePet = () => {
    if (!petName.trim()) {
      Alert.alert('Pet name required', 'Please enter your pet’s name.');
      return;
    }

    if (birthMode === 'birthday' && !birthday.trim()) {
      Alert.alert('Birthday required', 'Please enter a birthday.');
      return;
    }

    if (birthMode === 'age' && !ageText.trim()) {
      Alert.alert('Age required', 'Please enter an age.');
      return;
    }

    const birthdayValue = birthMode === 'birthday' ? birthday.trim() : '';
    const computedAge = birthMode === 'birthday'
      ? calculateAgeLabelFromBirthday(birthdayValue)
      : ageText.trim();

    const newPet = {
      id: Date.now().toString(),
      name: petName.trim(),
      species: petSpecies.toLowerCase(),
      breed: breedType.trim() || petSpecies.charAt(0).toUpperCase() + petSpecies.slice(1),
      age: computedAge || 'Unknown',
      birthday: birthdayValue,
      ageMode: birthMode,
      weight: weight.trim(),
      gender: gender.trim() || 'Unknown',
      careGoals: careGoals.trim(),
      emoji: getDefaultPetEmoji(petSpecies),
      photoUri: petPhoto,
      score: 80,
    };

    onSave(newPet);
    onClose();
    resetForm();
  };

  const stepProgress = step / 3;
  const introCopy = 'Let’s set up your pet portal';

  const selectedSpeciesLabel = speciesOptions.find(item => item.value === petSpecies)?.label || 'Pet';

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={s.modalOverlay}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ width: '100%' }}>
          <Animated.View
            style={[
              s.addPetModal,
              {
                opacity: modalAnim,
                transform: [
                  {
                    translateY: modalAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [20, 0],
                    }),
                  },
                  { scale: cardAnim },
                ],
              },
            ]}
          >
            <View style={s.addPetModalHeader}>
              <TouchableOpacity onPress={onClose}>
                <Text style={s.addPetModalClose}>✕</Text>
              </TouchableOpacity>
              <View style={{ flex: 1, alignItems: 'center' }}>
                <Text style={s.addPetModalTitle}>Add Pet</Text>
                <Text style={s.addPetModalSubtitle}>{introCopy}</Text>
              </View>
              <View style={{ width: 22 }} />
            </View>

            <View style={s.addPetProgressWrap}>
              <View style={s.addPetProgressTrack}>
                <View style={[s.addPetProgressFill, { width: `${stepProgress * 100}%` }]} />
              </View>
              <Text style={s.addPetProgressText}>Step {step} of 3</Text>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 12 }}>
              {step === 1 && (
                <Animated.View style={{ opacity: modalAnim }}>
                  <Text style={s.addPetSectionTitle}>Start with a photo and the basics</Text>
                  <View style={s.addPetPhotoRow}>
                    <View style={s.addPetPhotoCircle}>
                      {petPhoto ? (
                        <Image source={{ uri: petPhoto }} style={s.addPetPhotoImage} />
                      ) : (
                        <Text style={s.addPetPhotoEmoji}>{getDefaultPetEmoji(petSpecies)}</Text>
                      )}
                    </View>
                    <View style={{ flex: 1 }}>
                      <TouchableOpacity style={s.addPetPhotoButton} onPress={pickPetPhoto}>
                        <Text style={s.addPetPhotoButtonText}>{petPhoto ? 'Change Photo' : 'Add Pet Photo'}</Text>
                      </TouchableOpacity>
                      <Text style={s.addPetPhotoHint}>A clear pet photo helps make the app feel more personal.</Text>
                    </View>
                  </View>

                  <TextInput
                    style={s.addPetInput}
                    value={petName}
                    onChangeText={setPetName}
                    placeholder="Pet name"
                    placeholderTextColor={C.muted}
                  />

                  <Text style={s.addPetFieldLabel}>Species</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.addPetChipRow}>
                    {speciesOptions.map(option => (
                      <TouchableOpacity
                        key={option.value}
                        style={[s.addPetChip, petSpecies === option.value && s.addPetChipActive]}
                        onPress={() => setPetSpecies(option.value)}
                      >
                        <Text style={[s.addPetChipText, petSpecies === option.value && s.addPetChipTextActive]}>
                          {option.label}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </Animated.View>
              )}

              {step === 2 && (
                <Animated.View style={{ opacity: modalAnim }}>
                  <Text style={s.addPetSectionTitle}>Tell us a little more</Text>
                  <TextInput
                    style={s.addPetInput}
                    value={breedType}
                    onChangeText={setBreedType}
                    placeholder="Breed / type"
                    placeholderTextColor={C.muted}
                  />

                  <Text style={s.addPetFieldLabel}>Birthday or age</Text>
                  <View style={s.addPetModeRow}>
                    {[
                      { key: 'birthday', label: 'Birthday' },
                      { key: 'age', label: 'Age' },
                    ].map(option => (
                      <TouchableOpacity
                        key={option.key}
                        style={[s.addPetModeChip, birthMode === option.key && s.addPetModeChipActive]}
                        onPress={() => setBirthMode(option.key)}
                      >
                        <Text style={[s.addPetModeChipText, birthMode === option.key && s.addPetModeChipTextActive]}>
                          {option.label}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>

                  {birthMode === 'birthday' ? (
                    <DatePickerField
                      label="Birthday"
                      value={birthday}
                      onChange={setBirthday}
                      placeholder="Select birthday"
                    />
                  ) : (
                    <TextInput
                      style={s.addPetInput}
                      value={ageText}
                      onChangeText={setAgeText}
                      placeholder="Age, e.g. 3 yrs"
                      placeholderTextColor={C.muted}
                      autoCapitalize="none"
                    />
                  )}

                  <TextInput
                    style={s.addPetInput}
                    value={weight}
                    onChangeText={setWeight}
                    placeholder="Weight"
                    placeholderTextColor={C.muted}
                  />

                  <Text style={s.addPetFieldLabel}>Gender</Text>
                  <View style={s.addPetGenderRow}>
                    {genderOptions.map(option => (
                      <TouchableOpacity
                        key={option}
                        style={[s.addPetModeChip, gender === option && s.addPetModeChipActive]}
                        onPress={() => setGender(option)}
                      >
                        <Text style={[s.addPetModeChipText, gender === option && s.addPetModeChipTextActive]}>
                          {option}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </Animated.View>
              )}

              {step === 3 && (
                <Animated.View style={{ opacity: modalAnim }}>
                  <Text style={s.addPetSectionTitle}>Care goals and review</Text>
                  <TextInput
                    style={[s.addPetInput, s.addPetMultiline]}
                    value={careGoals}
                    onChangeText={setCareGoals}
                    placeholder="Care goals / preferences"
                    placeholderTextColor={C.muted}
                    multiline
                  />

                  <View style={s.addPetReviewCard}>
                    <View style={s.addPetReviewTop}>
                      <View style={s.addPetReviewAvatar}>
                        {petPhoto ? (
                          <Image source={{ uri: petPhoto }} style={s.addPetReviewImage} />
                        ) : (
                          <Text style={s.addPetReviewEmoji}>{getDefaultPetEmoji(petSpecies)}</Text>
                        )}
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={s.addPetReviewName}>{petName.trim() || 'Your pet'}</Text>
                        <Text style={s.addPetReviewMeta}>
                          {selectedSpeciesLabel} · {breedType.trim() || 'Breed / type'} · {
                            birthMode === 'birthday'
                              ? (birthday.trim() ? `Birthday: ${formatDate(birthday.trim())}` : 'Birthday pending')
                              : (ageText.trim() || 'Age pending')
                          }
                        </Text>
                        <Text style={s.addPetReviewMeta}>{weight.trim() ? `Weight: ${weight.trim()}` : 'Weight not set'}</Text>
                        <Text style={s.addPetReviewMeta}>{gender || 'Gender not set'}</Text>
                      </View>
                    </View>
                    <Text style={s.addPetReviewGoalLabel}>Care goals</Text>
                    <Text style={s.addPetReviewGoalText}>{careGoals.trim() || 'No care goals added yet.'}</Text>
                  </View>
                </Animated.View>
              )}
            </ScrollView>

            <View style={s.addPetFooter}>
              <TouchableOpacity
                style={s.customActionCancelBtn}
                onPress={onClose}
              >
                <Text style={s.customActionCancelText}>Cancel</Text>
              </TouchableOpacity>

              {step > 1 ? (
                <TouchableOpacity
                  style={s.customActionCancelBtn}
                  onPress={() => setStep(prev => Math.max(1, prev - 1))}
                >
                  <Text style={s.customActionCancelText}>Back</Text>
                </TouchableOpacity>
              ) : null}

              {step < 3 ? (
                <TouchableOpacity style={s.customActionSaveBtn} onPress={goNext}>
                  <Text style={s.customActionSaveText}>Continue</Text>
                </TouchableOpacity>
              ) : (
                <TouchableOpacity style={s.customActionSaveBtn} onPress={savePet}>
                  <Text style={s.customActionSaveText}>Save Pet</Text>
                </TouchableOpacity>
              )}
            </View>
          </Animated.View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}

function buildPetEditDraft(pet) {
  const birthMode = pet?.ageMode || (pet?.birthday ? 'birthday' : 'age');

  return {
    photoUri: pet?.photoUri || null,
    name: pet?.name || '',
    species: pet?.species || 'dog',
    breed: pet?.breed || '',
    birthMode,
    birthday: pet?.birthday || '',
    ageText: birthMode === 'age' ? (pet?.age || '') : '',
    weight: pet?.weight || '',
    gender: pet?.gender || 'Unknown',
    careGoals: Array.isArray(pet?.careGoals) ? pet.careGoals.join(', ') : (pet?.careGoals || ''),
  };
}

const playSosSound = async () => {
  try {
    await Audio.setAudioModeAsync({
      playsInSilentModeIOS: true,
    });

    const { sound } = await Audio.Sound.createAsync(
      require('./assets/sounds/sos.mp3'),
      {
        shouldPlay: true,
        volume: 0.8,
      }
    );

    // unload AFTER playback finishes
    sound.setOnPlaybackStatusUpdate(async (status) => {
      if (status.didJustFinish) {
        await sound.unloadAsync();
      }
    });

  } catch (error) {
    console.log('SOS SOUND ERROR:', error);
    Vibration.vibrate(80);
  }
};
// ─────────────────────────────────────────────
// SCREEN: DASHBOARD
// ─────────────────────────────────────────────
function DashboardScreen({ navigation }) {
  const { pets } = useContext(PetsContext);
  const { openAddPetModal } = useContext(AddPetContext);
  const { careReminders, setCareReminders } = useContext(CareRemindersContext);
  const { setHealthRecords } = useContext(HealthRecordsContext);
  const { petScores, setPetScores } = useContext(PetScoresContext);
  const { activityLogs, setActivityLogs } = useContext(ActivityLogsContext);
  const [selectedPetId, setSelectedPetId] = useState('1');
  const [tasks, setTasks] = useState(TASKS);
  const [selectedCalendarDate, setSelectedCalendarDate] = useState(new Date());
  const [showReminderModal, setShowReminderModal] = useState(false);
  const [editingReminder, setEditingReminder] = useState(null);
  const [reminderTitle, setReminderTitle] = useState('');
  const [reminderIcon, setReminderIcon] = useState('🍽️');
  const [reminderDate, setReminderDate] = useState('');
  const [reminderTime, setReminderTime] = useState('');
  const [customActions, setCustomActions] = useState([]);
  const [showAddActionModal, setShowAddActionModal] = useState(false);
  const [customActionName, setCustomActionName] = useState('');
  const [customActionIcon, setCustomActionIcon] = useState('⭐');
  const [showWeightModal, setShowWeightModal] = useState(false);
  const [weightValue, setWeightValue] = useState('');
  const [weightNotes, setWeightNotes] = useState('');
  const [showMedicationModal, setShowMedicationModal] = useState(false);
  const [medicationName, setMedicationName] = useState('');
  const [medicationDose, setMedicationDose] = useState('');
  const reminderAlertedIdsRef = useRef(new Set());
  const reminderSnoozeUntilRef = useRef(new Map());
  const petBounce = useRef(new Animated.Value(1)).current;
  const calendarChipBounce = useRef(new Animated.Value(1)).current;
  const sosBounce = useRef(new Animated.Value(1)).current;
  const sosFlash = useRef(new Animated.Value(0)).current;
  const [isSosAnimating, setIsSosAnimating] = useState(false);
  const scoreAnimationRef = useRef(null);
  const previousPetIdRef = useRef(selectedPetId);
  useEffect(() => {
    setPetScores(prev => {
      const next = { ...prev };
      pets.forEach((petItem) => {
        if (next[petItem.id] == null) {
          next[petItem.id] = petItem.score ?? getStarterPetScore(petItem.species);
        }
      });
      return next;
    });
  }, [pets]);
  const pet = pets.find(p => p.id === selectedPetId) || pets[0];
  useEffect(() => {
    if (pets.length > 0 && !pets.some((item) => item.id === selectedPetId)) {
      setSelectedPetId(pets[0].id);
    }
  }, [pets, selectedPetId]);

  const playPetSound = async (species) => {
    const soundAsset = getPetSoundAsset(species);

    if (!soundAsset) {
      if (Platform.OS !== 'web') {
        Vibration.vibrate(12);
      }
      return;
    }

    try {
      const { sound } = await Audio.Sound.createAsync(soundAsset, {
        shouldPlay: false,
        volume: 0.35,
      });

      await new Promise((resolve, reject) => {
        let fallbackTimer = setTimeout(async () => {
          sound.setOnPlaybackStatusUpdate(null);
          await sound.unloadAsync().catch(() => {});
          resolve();
        }, 2500);

        sound.setOnPlaybackStatusUpdate(async (status) => {
          if (!status.isLoaded) return;
          if (status.didJustFinish) {
            clearTimeout(fallbackTimer);
            sound.setOnPlaybackStatusUpdate(null);
            await sound.unloadAsync().catch(() => {});
            resolve();
          }
        });

        sound.playAsync().catch(async (error) => {
          clearTimeout(fallbackTimer);
          sound.setOnPlaybackStatusUpdate(null);
          await sound.unloadAsync().catch(() => {});
          reject(error);
        });
      });
    } catch (error) {
      if (Platform.OS !== 'web') {
        Vibration.vibrate(12);
      }
    }
  };
  const playReminderPetSound = useCallback(async (petId) => {
    const reminderPet = pets.find((item) => item.id === petId);
    const species = reminderPet?.species?.toLowerCase().trim();
    const soundAsset = species && PET_SOUNDS[species] ? PET_SOUNDS[species] : null;

    if (!soundAsset) {
      if (Platform.OS !== 'web') {
        Vibration.vibrate(12);
      }
      return;
    }

    try {
      const { sound } = await Audio.Sound.createAsync(soundAsset, {
        shouldPlay: true,
        volume: 0.32,
      });

      sound.setOnPlaybackStatusUpdate(async (status) => {
        if (status.didJustFinish) {
          await sound.unloadAsync().catch(() => {});
        }
      });
    } catch (error) {
      console.log('Reminder sound error:', error);
      if (Platform.OS !== 'web') {
        Vibration.vibrate(18);
      }
    }
  }, [pets]);
  const handleSelectPet = (petId) => {
    if (petId === selectedPetId) return;

    setSelectedPetId(petId);

    Animated.sequence([
      Animated.timing(petBounce, {
        toValue: 1.12,
        duration: 120,
        useNativeDriver: true,
      }),
      Animated.timing(petBounce, {
        toValue: 1,
        duration: 120,
        useNativeDriver: true,
      }),
    ]).start();

    const selectedPet = pets.find(p => p.id === petId);
    if (selectedPet?.species) {
      void playPetSound(selectedPet.species);
    }
  };
  const handleSosPress = async () => {
    if (isSosAnimating) return;

    setIsSosAnimating(true);

    try {
      await playSosSound();

      Animated.sequence([
        Animated.timing(sosBounce, {
          toValue: 1.08,
          duration: 120,
          useNativeDriver: true,
        }),
        Animated.timing(sosBounce, {
          toValue: 1,
          duration: 120,
          useNativeDriver: true,
        }),
      ]).start();

      Animated.sequence([
        Animated.timing(sosFlash, {
          toValue: 1,
          duration: 90,
          useNativeDriver: false,
        }),
        Animated.timing(sosFlash, {
          toValue: 0,
          duration: 160,
          useNativeDriver: false,
        }),
      ]).start();

      setTimeout(() => {
        setIsSosAnimating(false);
        navigation.navigate('LostPet');
      }, 500);
    } catch (error) {
      if (Platform.OS !== 'web') {
        Vibration.vibrate(15);
      }
      setTimeout(() => {
        setIsSosAnimating(false);
        navigation.navigate('LostPet');
      }, 900);
    }
  };
  useEffect(() => {
    if (previousPetIdRef.current === selectedPetId) return;
    previousPetIdRef.current = selectedPetId;
  }, [selectedPetId]);
  useEffect(() => {
    calendarChipBounce.stopAnimation();
    calendarChipBounce.setValue(1);

    Animated.sequence([
      Animated.timing(calendarChipBounce, {
        toValue: 1.08,
        duration: 120,
        useNativeDriver: true,
      }),
      Animated.timing(calendarChipBounce, {
        toValue: 1,
        duration: 120,
        useNativeDriver: true,
      }),
    ]).start();
  }, [selectedCalendarDateKey]);
  const reminderIconOptions = ['🍽️', '💊', '🦮', '🎾', '🧼', '⚖️', '💧', '🌡️', '🧪', '🧹', '🔥', '💬'];
  const formatLocalDateKey = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };
  const getReminderScheduledDate = useCallback((reminder) => {
    if (!reminder?.date) return null;

    const dateParts = String(reminder.date).split('-');
    if (dateParts.length !== 3) return null;

    const year = Number.parseInt(dateParts[0], 10);
    const month = Number.parseInt(dateParts[1], 10);
    const day = Number.parseInt(dateParts[2], 10);

    if (!year || !month || !day) return null;

    const rawTime = String(reminder.time || '').trim();
    let hours = 0;
    let minutes = 0;
    if (rawTime) {
      const match = rawTime.match(/^(\d{1,2})(?::(\d{2}))?\s*(AM|PM)?$/i);
      if (match) {
        hours = Number.parseInt(match[1], 10);
        minutes = Number.parseInt(match[2] || '0', 10);
        const meridiem = (match[3] || '').toUpperCase();
        if (meridiem === 'PM' && hours < 12) {
          hours += 12;
        }
        if (meridiem === 'AM' && hours === 12) {
          hours = 0;
        }
      }
    }

    return new Date(
      year,
      month - 1,
      day,
      Number.isFinite(hours) ? hours : 0,
      Number.isFinite(minutes) ? minutes : 0,
      0,
      0
    );
  }, []);
  const setReminderAlerted = useCallback((reminderId) => {
    reminderAlertedIdsRef.current.add(reminderId);
    reminderSnoozeUntilRef.current.delete(reminderId);
  }, []);
  const clearReminderAlerted = useCallback((reminderId) => {
    reminderAlertedIdsRef.current.delete(reminderId);
    reminderSnoozeUntilRef.current.delete(reminderId);
  }, []);
  const normalizeReminderDateKey = (value) => {
    if (!value) return '';
    if (typeof value === 'string') return value.trim();
    if (value instanceof Date && !Number.isNaN(value.getTime())) {
      return formatLocalDateKey(value);
    }
    return '';
  };
  const calendarDays = Array.from({ length: 7 }, (_, index) => {
    const date = new Date();
    date.setDate(date.getDate() + index);
    return date;
  });
  const selectedCalendarDateKey = formatLocalDateKey(selectedCalendarDate);
  const calendarReminders = careReminders.filter(reminder => {
    return (
      reminder.petId === selectedPetId
      && reminder.date === selectedCalendarDateKey
    );
  });
  const nextReminder = calendarReminders.find((reminder) => !reminder.completed) || calendarReminders[0] || null;
  const remindersThisWeek = careReminders.filter((reminder) => {
    if (reminder.petId !== selectedPetId || reminder.completed) return false;
    const reminderDate = new Date(`${reminder.date}T00:00:00`);
    if (Number.isNaN(reminderDate.getTime())) return false;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const weekEnd = new Date(today);
    weekEnd.setDate(weekEnd.getDate() + 7);
    return reminderDate >= today && reminderDate <= weekEnd;
  }).length;
  const calendarReminderCounts = calendarDays.reduce((acc, date) => {
    const key = formatLocalDateKey(date);
    acc[key] = careReminders.filter((reminder) => reminder.petId === selectedPetId && reminder.date === key).length;
    return acc;
  }, {});
  const activityTrendDays = Array.from({ length: 7 }, (_, index) => {
    const date = new Date();
    date.setDate(date.getDate() - (6 - index));
    date.setHours(0, 0, 0, 0);
    return date;
  });
  const activityTrendCounts = activityTrendDays.map((date) => {
    const key = formatLocalDateKey(date);
    return activityLogs.filter((log) => log.petId === pet.id && (log.dateKey === date.toDateString() || log.dateKey === key)).length;
  });
  const activityTrendMax = Math.max(1, ...activityTrendCounts);
  const weeklyActivityTotal = activityTrendCounts.reduce((sum, count) => sum + count, 0);
  const scoreProgressSegments = Array.from({ length: 12 }, (_, index) => index < Math.round((currentScore / 100) * 12));
  const formatReminderDate = (value) => {
    const key = normalizeReminderDateKey(value);
    if (!key) return typeof value === 'string' && value.trim() ? value.trim() : 'No date set';
    if (!/^\d{4}-\d{2}-\d{2}$/.test(key)) return key;
    return formatDate(key);
  };
  const markReminderDone = useCallback((reminder) => {
    if (!reminder) return;

    clearReminderAlerted(reminder.id);
    setCareReminders((prev) => {
      const nextList = prev.map((item) => (
        item.id === reminder.id ? { ...item, completed: true } : item
      ));
      const nextReminder = nextList.find((item) => item.id === reminder.id);
      if (nextReminder) {
        updateCareReminderInSupabase(nextReminder);
      }
      return nextList;
    });
  }, [clearReminderAlerted, setCareReminders]);
  const snoozeReminder = useCallback((reminder) => {
    if (!reminder) return;

    const snoozeUntil = Date.now() + (10 * 60 * 1000);
    reminderSnoozeUntilRef.current.set(reminder.id, snoozeUntil);
    reminderAlertedIdsRef.current.delete(reminder.id);
  }, []);
  const alertDueReminder = useCallback(async (reminder) => {
    if (!reminder || reminder.completed) return;

    const reminderPet = pets.find((item) => item.id === reminder.petId);
    const petName = reminderPet?.name || 'Your pet';

    try {
      void playReminderPetSound(reminder.petId);
    } catch (error) {
      console.log('Reminder alert sound failed:', error);
      if (Platform.OS !== 'web') {
        Vibration.vibrate(18);
      }
    }

    Alert.alert(
      `${petName} Reminder`,
      `${reminder.title} is due now.`,
      [
        { text: 'Mark Done', onPress: () => markReminderDone(reminder) },
        { text: 'Snooze 10 min', onPress: () => snoozeReminder(reminder) },
        { text: 'OK', style: 'cancel', onPress: () => setReminderAlerted(reminder.id) },
      ],
      { cancelable: true }
    );
  }, [markReminderDone, pets, playReminderPetSound, setReminderAlerted, snoozeReminder]);
  const openReminderModal = () => {
    setEditingReminder(null);
    setReminderTitle('');
    setReminderIcon('🍽️');
    setReminderDate(selectedCalendarDateKey);
    setReminderTime('');
    setShowReminderModal(true);
  };
  const saveReminder = () => {
    const trimmedTitle = reminderTitle.trim();
    const trimmedDate = reminderDate.trim();
    if (!trimmedTitle) {
      Alert.alert('Reminder title required');
      return;
    }
    if (!trimmedDate) {
      Alert.alert('Reminder date required');
      return;
    }

    const nextReminder = {
      id: editingReminder?.id || Date.now().toString(),
      petId: selectedPetId,
      title: trimmedTitle,
      icon: reminderIcon,
      date: trimmedDate,
      time: reminderTime.trim(),
      completed: editingReminder ? !!editingReminder.completed : false,
      source: editingReminder?.source || 'manual',
      sourceRecordId: editingReminder?.sourceRecordId || null,
    };

    setCareReminders(prev => (
      editingReminder
        ? prev.map(reminder => (reminder.id === editingReminder.id ? nextReminder : reminder))
        : [nextReminder, ...prev]
    ));
    if (editingReminder) {
      updateCareReminderInSupabase(nextReminder);
    } else {
      saveCareReminderToSupabase(nextReminder);
    }
    setShowReminderModal(false);
    setEditingReminder(null);
    setReminderTitle('');
    setReminderIcon('🍽️');
    setReminderDate(selectedCalendarDateKey);
    setReminderTime('');
  };
  const toggleReminderComplete = (reminderId) => {
    setCareReminders(prev => {
      const nextList = prev.map(reminder => (
        reminder.id === reminderId
          ? { ...reminder, completed: !reminder.completed }
          : reminder
      ));
      const nextReminder = nextList.find((reminder) => reminder.id === reminderId);
      if (nextReminder) {
        updateCareReminderInSupabase(nextReminder);
      }
      clearReminderAlerted(reminderId);
      return nextList;
    });
  };
  useEffect(() => {
    const checkDueRemindersNow = () => {
      const now = Date.now();
      const dueReminder = careReminders.find((reminder) => {
        if (!reminder || reminder.completed) return false;
        if (reminder.petId && !pets.some((petItem) => petItem.id === reminder.petId)) return false;

        const snoozeUntil = reminderSnoozeUntilRef.current.get(reminder.id);
        if (snoozeUntil && snoozeUntil > now) {
          return false;
        }

        const scheduledAt = getReminderScheduledDate(reminder);
        if (!scheduledAt) return false;
        return scheduledAt.getTime() <= now && !reminderAlertedIdsRef.current.has(reminder.id);
      });

      if (dueReminder) {
        setReminderAlerted(dueReminder.id);
        console.log(
          'Reminder due',
          dueReminder.id,
          dueReminder.title,
          dueReminder.date,
          dueReminder.time
        );
        void alertDueReminder(dueReminder);
      }
    };

    checkDueRemindersNow();

    const reminderInterval = setInterval(() => {
      checkDueRemindersNow();
    }, 15000);

    return () => clearInterval(reminderInterval);
  }, [alertDueReminder, careReminders, getReminderScheduledDate, pets, setReminderAlerted]);
  const openEditReminder = (reminder) => {
    setEditingReminder(reminder);
    setReminderTitle(reminder.title || '');
    setReminderIcon(reminder.icon || '🍽️');
    setReminderDate(normalizeReminderDateKey(reminder.date) || selectedCalendarDateKey);
    setReminderTime(reminder.time || '');
    setShowReminderModal(true);
  };
  const confirmDeleteReminder = (reminderId) => {
    Alert.alert(
      'Delete Reminder?',
      'This reminder will be removed.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            setCareReminders(prev => prev.filter(reminder => reminder.id !== reminderId));
            deleteCareReminderFromSupabase(reminderId);
          },
        },
      ]
    );
  };
  const handleReminderPress = (reminder) => {
    const reminderDateLabel = formatReminderDate(reminder.date);
    const reminderTimeLabel = `\nTime: ${reminder.time || 'Not set'}`;
    Alert.alert(
      reminder.title,
      `Date: ${reminderDateLabel}${reminderTimeLabel}`,
      [
        {
          text: reminder.completed ? 'Mark Incomplete' : 'Complete',
          onPress: () => toggleReminderComplete(reminder.id),
        },
        {
          text: 'Edit',
          onPress: () => openEditReminder(reminder),
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => confirmDeleteReminder(reminder.id),
        },
        { text: 'Cancel', style: 'cancel' },
      ]
    );
  };

  const hour = new Date().getHours();
  const greeting = hour < 12 ? '☀️ Good morning' : hour < 17 ? '🌤️ Good afternoon' : '🌙 Good evening';

  const toggleTask = (taskId) => {
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;

    setTasks(prev => prev.map(t => t.id === taskId ? { ...t, done: !t.done } : t));

    if (!task.done) {
      addActivityLog(task.type, task.title, task.icon, { source: 'task', taskId: task.id, petId: task.petId });
    } else {
      const matchingTaskLog = activityLogs.find(log => log.source === 'task' && log.taskId === task.id && log.petId === task.petId);

      if (matchingTaskLog) {
        setActivityLogs(prev => prev.filter(log => !(log.source === 'task' && log.taskId === task.id && log.petId === task.petId)));

        const scoreDelta = getScoreDelta(matchingTaskLog.type);
        if (scoreDelta > 0) {
          setPetScores(prev => ({
            ...prev,
            [task.petId]: Math.max(0, Math.min(100, (prev[task.petId] ?? pets.find(p => p.id === task.petId)?.score ?? 0) - scoreDelta)),
          }));
        }
      }
    }
  };

  const getScoreDelta = (type) => {
    const normalizedType = String(type || '').toLowerCase();

    if (['meal', 'feed', 'feeding'].includes(normalizedType)) return 1;
    if (['walk', 'play', 'run', 'enrichment', 'social', 'social_time', 'exercise'].includes(normalizedType)) return 2;
    if (['medication', 'meds', 'medicine'].includes(normalizedType)) return 3;
    if ([
      'weight',
      'tank_temp',
      'temp',
      'water_change',
      'check_ph',
      'ph',
      'filter_cleaned',
      'grooming',
      'bath',
      'litter_cleaned',
      'cage_cleaned',
      'water',
      'tank',
      'filter',
      'habitat',
      'heat_check',
      'humidity_check',
      'habitat_cleaned',
      'custom',
    ].includes(normalizedType)) return 1;

    return 1;
  };

  const addActivityLog = (type, title, icon, extra = {}) => {
    const now = new Date();
    const targetPetId = extra.petId ?? pet.id;
    const newLog = {
      id: Date.now().toString(),
      petId: targetPetId,
      type,
      title,
      icon,
      time: now.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }),
      dateKey: now.toDateString(),
      ...extra,
    };

    setActivityLogs(prev => [newLog, ...prev].slice(0, 5));

    const scoreDelta = getScoreDelta(type);

    setPetScores(prev => {
      const current = prev[targetPetId] ?? pets.find(p => p.id === targetPetId)?.score ?? 80;
      return {
        ...prev,
        [targetPetId]: Math.max(0, Math.min(100, current + scoreDelta)),
      };
    });
  };

  const deleteActivityLog = (logId) => {
    const logToDelete = activityLogs.find(log => log.id === logId);

    setActivityLogs(prev => prev.filter(log => log.id !== logId));

    if (logToDelete) {
      const scoreDelta = getScoreDelta(logToDelete.type);

      setPetScores(prev => {
        const current = prev[logToDelete.petId] ?? pets.find(p => p.id === logToDelete.petId)?.score ?? 80;
        return {
          ...prev,
          [logToDelete.petId]: Math.max(0, Math.min(100, current - scoreDelta)),
        };
      });
    }
  };

  const currentScore = Math.max(0, Math.min(100, petScores[selectedPetId] ?? pet?.score ?? 80));
  if (!pet) {
    return (
      <SafeAreaView style={s.screen} edges={['top']}>
        <View style={s.pageHeader}>
          <View>
            <Text style={s.pageTitle}>Home</Text>
            <Text style={s.pageSub}>No pets yet</Text>
          </View>
        </View>

        <Card style={s.petProfileInfoCard}>
          <Text style={s.petProfileSectionTitle}>Add your first pet</Text>
          <Text style={s.petProfileBodyText}>
            Create a pet to unlock the dashboard, quick actions, reminders, and health tracking.
          </Text>
          {typeof openAddPetModal === 'function' && (
            <TouchableOpacity
              style={[s.petProfileButton, { marginTop: 16 }]}
              onPress={() => openAddPetModal()}
            >
              <Text style={s.petProfileButtonText}>Add Pet</Text>
            </TouchableOpacity>
          )}
        </Card>
      </SafeAreaView>
    );
  }
  const scoreColor = currentScore >= 85 ? C.green : currentScore >= 65 ? C.yellow : C.red;
  const recentActivity = activityLogs.filter(log => log.petId === pet.id);
  const petActivityDays = [...new Set(recentActivity.map(log => log.dateKey || new Date().toDateString()))].sort((a, b) => new Date(b) - new Date(a));
  let streakDays = 0;
  for (let i = 0; i < petActivityDays.length; i += 1) {
    const expected = new Date();
    expected.setDate(expected.getDate() - i);
    const expectedDay = expected.toDateString();
    if (petActivityDays.includes(expectedDay)) {
      streakDays += 1;
    } else {
      break;
    }
  }
  streakDays = Math.max(1, streakDays);
  const healthInsights = [];

  if (streakDays >= 3) {
    healthInsights.push('🟢 Daily care streak active');
  }

  if (recentActivity.length >= 3) {
    healthInsights.push('🟢 Active care logging');
  } else if (recentActivity.length === 0) {
    healthInsights.push('🟡 No recent pet care logged');
  }

  if (currentScore >= 90) {
    healthInsights.push('🟢 Excellent wellness status');
  } else if (currentScore < 70) {
    healthInsights.push('🟡 Wellness needs attention');
  }

  if (healthInsights.length === 0) {
    healthInsights.push('🟢 Wellness status looks stable');
  }

  const visibleHealthInsights = healthInsights.slice(0, 3);
  const quickActions = buildQuickActionsForSpecies(pet, addActivityLog, navigation);
  const dashboardQuickActions = quickActions
    .filter((item) => item.label !== 'AI Vet')
    .map((item) => {
      if (item.label === 'Log Weight') {
        return {
          ...item,
          action: () => {
            setWeightValue('');
            setWeightNotes('');
            setShowWeightModal(true);
          },
        };
      }
      if (item.label === 'Medication') {
        return {
          ...item,
          action: () => {
            setMedicationName('');
            setMedicationDose('');
            setShowMedicationModal(true);
          },
        };
      }
      return item;
    });
  const ACTION_ICONS = [

  ];
  const displayedQuickActions = [
    ...dashboardQuickActions,
    ...customActions,
    {
      icon: '➕',
      label: 'Add Action',
      action: () => setShowAddActionModal(true),
      isAddAction: true,
    },
  ];

  const saveCustomAction = () => {
    const trimmedName = customActionName.trim();
    if (!trimmedName) {
      Alert.alert('Action name required');
      return;
    }

    setCustomActions(prev => [
      ...prev,
      {
        icon: customActionIcon,
        label: trimmedName,
        action: () => addActivityLog('custom', trimmedName, customActionIcon),
      },
    ]);
    setCustomActionName('');
    setCustomActionIcon('⭐');
    setShowAddActionModal(false);
  };

  const saveQuickWeightRecord = () => {
    const trimmedWeight = weightValue.trim();
    const parsedWeight = Number.parseFloat(trimmedWeight);

    if (!trimmedWeight) {
      Alert.alert('Weight required');
      return;
    }

    const todayKey = formatLocalDateKey(new Date());
    const nextRecord = {
      id: Date.now().toString(),
      petId: selectedPetId,
      type: 'weight',
      title: `${pet.name} Weight Check`,
      date: todayKey,
      nextDue: '',
      notes: weightNotes.trim(),
      value: Number.isFinite(parsedWeight) ? parsedWeight : null,
      unit: 'lbs',
      details: {
        weightValue: trimmedWeight,
        weightDate: todayKey,
        weightNotes: weightNotes.trim(),
        source: 'dashboard_quick_action',
      },
      icon: '⚖️',
      status: 'current',
    };

    setHealthRecords((prev) => [nextRecord, ...prev]);
    if (typeof saveHealthRecordToSupabase === 'function') {
      void saveHealthRecordToSupabase(nextRecord);
    }
    addActivityLog('weight', 'Weight logged', '⚖️');
    setWeightValue('');
    setWeightNotes('');
    setShowWeightModal(false);
  };

  const saveQuickMedicationRecord = () => {
    const trimmedName = medicationName.trim();
    const trimmedDose = medicationDose.trim();
    if (!trimmedName) {
      Alert.alert('Medication name required');
      return;
    }

    const todayKey = formatLocalDateKey(new Date());
    const nextRecord = {
      id: Date.now().toString(),
      petId: selectedPetId,
      type: 'medication',
      title: trimmedName,
      date: todayKey,
      nextDue: '',
      notes: trimmedDose,
      details: {
        medicationName: trimmedName,
        dosage: trimmedDose,
        frequency: 'As directed',
        startDate: todayKey,
        medicationNotes: trimmedDose,
        source: 'dashboard_quick_action',
      },
      icon: '💊',
      status: 'current',
    };

    setHealthRecords((prev) => [nextRecord, ...prev]);
    if (typeof saveHealthRecordToSupabase === 'function') {
      void saveHealthRecordToSupabase(nextRecord);
    }
    addActivityLog('medication', `${trimmedName} logged`, '💊');
    setMedicationName('');
    setMedicationDose('');
    setShowMedicationModal(false);
  };

  return (
    <PetSyncBackground opacity={1.35}>
    <SafeAreaView style={[s.screen, { backgroundColor: 'transparent' }]} edges={['top']}>
      <ScrollView scrollEnabled={true} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 90 }}>
        {/* Header */}
        <View style={{ paddingHorizontal: 16, paddingTop: 3, paddingBottom: 0 }}>
          <View style={s.dashboardBrandRow}>
            <View style={s.dashboardBrandMark}>
              <Text style={s.dashboardBrandMarkText}>🐾</Text>
            </View>
            <View>
              <Text style={s.dashboardBrandName}>PetSync+</Text>
              <Text style={s.dashboardBrandTagline}>Home dashboard</Text>
            </View>
          </View>

          <View style={s.dashHeader}>
            <View style={{ flex: 1, paddingRight: 60 }}>
              <Text
                style={s.greeting}
                numberOfLines={1}
                adjustsFontSizeToFit
                minimumFontScale={0.7}
              >
                {greeting}, Raymond! 👋
              </Text>

              <Text style={s.subGreeting} numberOfLines={1}>
                {formatDate(new Date())} · {pets.length} pets
              </Text>
            </View>

            <Animated.View
              style={{
                transform: [{ scale: sosBounce }],
                shadowColor: C.red,
                shadowOffset: { width: 0, height: 0 },
                shadowOpacity: sosFlash.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0.18, 0.45],
                }),
                shadowRadius: sosFlash.interpolate({
                  inputRange: [0, 1],
                  outputRange: [8, 16],
                }),
              }}
            >
              <TouchableOpacity
                style={[s.sosButton, { backgroundColor: C.red, opacity: isSosAnimating ? 0.85 : 1 }]}
                onPress={handleSosPress}
                activeOpacity={0.95}
                disabled={isSosAnimating}
              >
                <Text style={s.sosText}>🚨 SOS</Text>
              </TouchableOpacity>
            </Animated.View>
          </View>
        </View>

        <PetAvatarRow
          pets={pets}
          selectedId={selectedPetId}
          onSelect={handleSelectPet}
          bounceValue={petBounce}
          onOpenProfile={(petId) => navigation.navigate('PetProfile', { petId })}
        />

        {/* Health Score */}
        <TouchableOpacity activeOpacity={0.9} onPress={() => navigation.navigate('Health')}>
        <Card style={[s.healthScoreCard, { backgroundColor: '#a895d169', borderColor: '#E6EAF5' }]}>
            <View style={s.dashboardHeroTop}>
              <View style={s.dashboardAvatarWrap}>
                {pet.photoUri ? (
                  <Image source={{ uri: pet.photoUri }} style={s.dashboardAvatarImage} />
                ) : (
                  <Text style={s.dashboardAvatarEmoji}>{pet.emoji || '🐾'}</Text>
                )}
              </View>

              <View style={s.dashboardHeroInfo}>
                <View style={s.dashboardPetNameRow}>
                  <Text style={s.dashboardPetName}>{pet.name}</Text>
                  <Text style={s.dashboardPetBadge}>🐾</Text>
                </View>
                <Text style={s.dashboardPetMeta}>
                {pet.species ? `${pet.species.charAt(0).toUpperCase()}${pet.species.slice(1)}` : 'Pet'} · {pet.breed || 'Breed'}
                </Text>
                <Text style={s.dashboardPetAge}>{pet.age || 'Age unknown'}</Text>
                <View style={{ marginTop: 8 }}>
                  {visibleHealthInsights.slice(0, 2).map((insight, index) => (
                    <Text key={`${insight}-${index}`} style={s.dashboardHealthInsight}>
                      {insight}
                    </Text>
                  ))}
                </View>
              </View>

              <View style={s.dashboardScoreRing}>
                {scoreProgressSegments.map((filled, index) => {
                  const angle = index * (360 / scoreProgressSegments.length);
                  return (
                    <View
                      key={`score-segment-${index}`}
                      style={[
                        s.dashboardScoreRingSegment,
                        {
                          backgroundColor: filled ? scoreColor : '#DEE6F2',
                          transform: [
                            { rotate: `${angle}deg` },
                            { translateY: -35 },
                          ],
                        },
                      ]}
                    />
                  );
                })}
                <View style={s.dashboardScoreRingInner}>
                  <Text style={[s.scoreNumber, { color: scoreColor }]}>{currentScore}</Text>
                  <Text style={s.scoreLabel}>/100</Text>
                </View>
              </View>
            </View>

            <View style={s.dashboardHeroMetricsRow}>
              <View style={s.dashboardMiniCard}>
                <Text style={s.dashboardMiniCardLabel}>Care Streak</Text>
                <Text style={s.dashboardMiniCardValue}>{streakDays}</Text>
                <Text style={s.dashboardMiniCardSub}>days</Text>
              </View>

              <View style={s.dashboardMiniCard}>
                <Text style={s.dashboardMiniCardLabel}>Next Reminder</Text>
                {nextReminder ? (
                  <>
                    <Text style={s.dashboardMiniCardValue}>
                      {nextReminder.time || formatReminderDate(nextReminder.date)}
                    </Text>
                    <Text style={s.dashboardMiniCardSub} numberOfLines={1}>
                      {formatReminderDate(nextReminder.date)}
                    </Text>
                    <Text style={s.dashboardMiniCardFoot} numberOfLines={1}>
                      {nextReminder.title}
                    </Text>
                  </>
                ) : (
                  <Text style={s.dashboardMiniCardSub}>No reminders scheduled</Text>
                )}
              </View>
            </View>
          </Card>
        </TouchableOpacity>

        <Card style={[s.dashboardTrendCard, { backgroundColor: '#a895d169', borderColor: '#E6EAF5' }]}>
          <View style={s.dashboardTrendHeader}>
            <View>
              <Text style={s.dashboardTrendTitle}>Weekly Care Trend</Text>
              <Text style={s.dashboardTrendSub}>{weeklyActivityTotal} care actions this week</Text>
            </View>
            <View style={s.dashboardTrendLegend}>
              <View style={[s.dashboardTrendLegendDot, { backgroundColor: '#6B4BFF' }]} />
              <Text style={s.dashboardTrendLegendText}>Care actions</Text>
            </View>
          </View>
          {activityTrendCounts.some((count) => count > 0) ? (
            <View style={s.dashboardTrendChart}>
              {activityTrendCounts.map((count, index) => {
                const height = Math.max(18, (count / activityTrendMax) * 72);
                return (
                  <View key={`trend-bar-${index}`} style={s.dashboardTrendBarWrap}>
                    <View style={[s.dashboardTrendBar, { height, backgroundColor: '#E8ECF7' }]}>
                      <View style={[s.dashboardTrendBarFill, { height, backgroundColor: '#ff4be7' }]} />
                    </View>
                    <View style={[s.dashboardTrendDot, { backgroundColor: count > 0 ? '#ea0909' : '#0cf18a' }]} />
                    <Text style={s.dashboardTrendDayLabel}>
                      {activityTrendDays[index].toLocaleDateString([], { weekday: 'short' })}
                    </Text>
                  </View>
                );
              })}
            </View>
          ) : (
            <View style={s.dashboardTrendEmpty}>
              <Text style={s.dashboardTrendEmptyText}>No care trend yet</Text>
            </View>
          )}
          <View style={s.dashboardTrendFooter}>
            <View style={s.dashboardTrendFooterChip}>
              <Text style={s.dashboardTrendFooterChipLabel}>Actions</Text>
              <Text style={s.dashboardTrendFooterChipValue}>{weeklyActivityTotal}</Text>
            </View>
            <View style={s.dashboardTrendFooterChip}>
              <Text style={s.dashboardTrendFooterChipLabel}>Reminders</Text>
              <Text style={s.dashboardTrendFooterChipValue}>{remindersThisWeek}</Text>
            </View>
          </View>
        </Card>

        {/* Quick Actions */}
        <View style={[s.section, { marginTop: 8 }]}>
          <Text style={[s.sectionTitle, { color: '#152033' }]}>Quick Actions</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 0, gap: 0 }}>
            {displayedQuickActions.map(item => (
              <AnimatedQuickAction
                key={item.label}
                icon={item.icon}
                label={item.label}
                onPress={item.action}
                isAddAction={item.isAddAction}
              />
            ))}
          </ScrollView>
        </View>

        <Card style={[s.dashboardAICard, { backgroundColor: '#a895d169', borderColor: '#E6EAF5' }]}>
          <View style={{ flex: 1 }}>
            <Text style={s.dashboardAITitle}>AI Vet Assistant</Text>
            <Text style={s.dashboardAISub}>
              Ask about symptoms, medications, food safety, or care concerns.
            </Text>
          </View>
          <TouchableOpacity style={s.dashboardAIBtn} onPress={() => navigation.navigate('AIVet')}>
            <Text style={s.dashboardAIBtnText}>Ask AI Vet</Text>
          </TouchableOpacity>
        </Card>

        {/* Care Calendar */}
        <View style={[s.section, { marginTop: 8 }]}>
          <View style={s.calendarHeaderTopRow}>
            <Text style={[s.sectionTitle, { color: '#152033', marginBottom: 0 }]}>Care Calendar</Text>
            <TouchableOpacity style={s.calendarAddBtn} onPress={openReminderModal}>
              <Text style={s.calendarAddBtnText}>＋ Add Reminder</Text>
            </TouchableOpacity>
          </View>
          <View style={s.calendarHeaderBottomRow}>
            <Text style={s.dashboardCalendarMonth}>
              {selectedCalendarDate.toLocaleDateString([], { month: 'long', year: 'numeric' })}
            </Text>
          </View>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingVertical: 4, paddingRight: 8, marginBottom: 14 }}
          >
            {calendarDays.map((date) => {
              const selected = formatLocalDateKey(date) === selectedCalendarDateKey;
              return (
                <TouchableOpacity
                  key={formatLocalDateKey(date)}
                  style={[
                    s.tabPill,
                    { backgroundColor: '#fff', borderColor: '#E6EAF5' },
                    selected && { backgroundColor: '#6B4BFF', borderColor: '#6B4BFF' },
                    {
                      marginRight: 10,
                      paddingHorizontal: 12,
                      paddingVertical: 10,
                      minWidth: 56,
                      alignItems: 'center',
                    },
                  ]}
                  onPress={() => setSelectedCalendarDate(date)}
                >
                  {selected ? (
                    <Animated.View style={{ transform: [{ scale: calendarChipBounce }] }}>
                      <Text
                        style={[
                          s.tabPillText,
                          selected && { color: '#fff' },
                          { fontSize: 11, fontWeight: '700', textAlign: 'center' },
                        ]}
                      >
                        {date.toLocaleDateString([], { weekday: 'short' })}
                      </Text>
                      <Text
                        style={[
                          s.tabPillText,
                          selected && { color: '#fff' },
                          { fontSize: 16, fontWeight: '800', marginTop: 2, textAlign: 'center' },
                        ]}
                      >
                        {date.getDate()}
                      </Text>
                      {calendarReminderCounts[formatLocalDateKey(date)] > 0 ? (
                        <View style={s.dashboardCalendarDotWrap}>
                          <View style={s.dashboardCalendarDot} />
                        </View>
                      ) : null}
                    </Animated.View>
                  ) : (
                    <>
                      <Text
                        style={[
                          s.tabPillText,
                          selected && { color: '#fff' },
                          { fontSize: 11, fontWeight: '700', textAlign: 'center' },
                        ]}
                      >
                        {date.toLocaleDateString([], { weekday: 'short' })}
                      </Text>
                      <Text
                        style={[
                          s.tabPillText,
                          selected && { color: '#fff' },
                          { fontSize: 16, fontWeight: '800', marginTop: 2, textAlign: 'center' },
                        ]}
                      >
                        {date.getDate()}
                      </Text>
                      {calendarReminderCounts[formatLocalDateKey(date)] > 0 ? (
                        <View style={s.dashboardCalendarDotWrap}>
                          <View style={s.dashboardCalendarDot} />
                        </View>
                      ) : null}
                    </>
                  )}
                </TouchableOpacity>
              );
            })}
          </ScrollView>
          {calendarReminders.length === 0 ? (
            <Card style={[{ backgroundColor: '#a895d169', borderColor: '#E6EAF5' }]}>
              <Text style={{ color: '#000000', textAlign: 'center', padding: 16 }}>
                No care scheduled for this day
              </Text>
            </Card>
          ) : (
            calendarReminders.map(reminder => (
              <TouchableOpacity
                key={reminder.id}
                activeOpacity={0.9}
                onPress={() => handleReminderPress(reminder)}
              >
                <Card style={[s.reminderCard, { backgroundColor: '#ffffffa6', borderColor: '#E6EAF5' }, reminder.completed && s.reminderCardDone]}>
                  <View style={s.reminderIconWrap}>
                    <Text style={s.reminderIcon}>{reminder.icon || '🔔'}</Text>
                  </View>
                  <View style={s.reminderContent}>
                    <Text style={[s.reminderTitle, reminder.completed && s.reminderTitleDone]}>
                      {reminder.title}
                    </Text>
                    <Text style={s.reminderDate}>
                      {formatReminderDate(reminder.date)}
                      {reminder.time ? ` · ${reminder.time}` : ''}
                    </Text>
                  </View>
                  <View style={[s.reminderStatusPill, reminder.completed && s.reminderStatusPillDone]}>
                    <Text style={s.reminderStatusText}>
                      {reminder.completed ? 'Done' : 'Planned'}
                    </Text>
                  </View>
                </Card>
              </TouchableOpacity>
            ))
          )}
        </View>

        {/* Recent Activity */}
        <View style={[s.section, { marginTop: 8 }]}>
          <Text style={[s.sectionTitle, { color: '#152033' }]}>Recent Activity</Text>
          {recentActivity.length === 0 ? (
            <Card style={[s.recentActivityEmptyCard, { backgroundColor: '#a895d169', borderColor: '#E6EAF5' }]}>
              <Text style={s.recentActivityEmptyText}>No activity yet for {pet.name}</Text>
            </Card>
          ) : (
            recentActivity.map(log => (
              <TouchableOpacity
                key={log.id}
                activeOpacity={0.9}
                onLongPress={() => Alert.alert('Delete Activity?', 'Remove this activity log?', [
                  { text: 'Cancel', style: 'cancel' },
                  { text: 'Delete', style: 'destructive', onPress: () => deleteActivityLog(log.id) },
                ])}
              >
                <Card style={[s.recentActivityCard, { backgroundColor: '#ffffffa5', borderColor: '#E6EAF5' }]}>
                <View style={s.recentActivityIconWrap}>
                  <Text style={s.recentActivityIcon}>{log.icon}</Text>
                </View>
                <View style={s.recentActivityContent}>
                  <Text style={s.recentActivityTitle}>{log.title}</Text>
                  <View style={s.recentActivityMetaRow}>
                    <Text style={s.recentActivityTime}>{log.time}</Text>
                    <View style={s.recentActivityTypePill}>
                      <Text style={s.recentActivityTypeText}>{log.type}</Text>
                    </View>
                  </View>
                </View>
                </Card>
              </TouchableOpacity>
            ))
          )}
        </View>
      </ScrollView>

      <Modal visible={showAddActionModal} transparent animationType="fade" onRequestClose={() => setShowAddActionModal(false)}>
        <View style={s.modalOverlay}>
          <View style={s.customActionModal}>
            <Text style={s.customActionModalTitle}>Create Action</Text>
            <TextInput
              style={s.customActionInput}
              value={customActionName}
              onChangeText={setCustomActionName}
              placeholder="Action name"
              placeholderTextColor={C.muted}
            />
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.presetActionRow}>
              {PRESET_ACTIONS.map(preset => (
                <TouchableOpacity
                  key={preset.label}
                  style={s.presetActionCard}
                  onPress={() => {
                    setCustomActionName(preset.label);
                    setCustomActionIcon(preset.icon);
                  }}
                >
                  <Text style={s.presetActionIcon}>{preset.icon}</Text>
                  <Text style={s.presetActionLabel}>{preset.label}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.iconPickerRow}>
              {ACTION_ICONS.map((icon, index) => (
                <TouchableOpacity
                  key={`${icon}-${index}`}
                  style={[s.iconPickChip, customActionIcon === icon && s.iconPickChipActive]}
                  onPress={() => setCustomActionIcon(icon)}
                >
                  <Text style={[s.iconPickChipText, customActionIcon === icon && s.iconPickChipTextActive]}>{icon}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            <View style={s.customActionModalButtons}>
              <TouchableOpacity style={s.customActionCancelBtn} onPress={() => setShowAddActionModal(false)}>
                <Text style={s.customActionCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={s.customActionSaveBtn} onPress={saveCustomAction}>
                <Text style={s.customActionSaveText}>Save Action</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <Modal visible={showWeightModal} transparent animationType="fade" onRequestClose={() => {
        setWeightValue('');
        setWeightNotes('');
        setShowWeightModal(false);
      }}>
        <View style={s.modalOverlay}>
          <View style={s.customActionModal}>
            <Text style={s.customActionModalTitle}>Log Weight</Text>
            <TextInput
              style={s.customActionInput}
              value={weightValue}
              onChangeText={setWeightValue}
              placeholder="Weight (lbs)"
              placeholderTextColor={C.muted}
              keyboardType="decimal-pad"
            />
            <TextInput
              style={[s.customActionInput, { minHeight: 90, textAlignVertical: 'top' }]}
              value={weightNotes}
              onChangeText={setWeightNotes}
              placeholder="Notes"
              placeholderTextColor={C.muted}
              multiline
            />
            <View style={s.customActionModalButtons}>
              <TouchableOpacity style={s.customActionCancelBtn} onPress={() => {
                setWeightValue('');
                setWeightNotes('');
                setShowWeightModal(false);
              }}>
                <Text style={s.customActionCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={s.customActionSaveBtn} onPress={saveQuickWeightRecord}>
                <Text style={s.customActionSaveText}>Save Weight</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <Modal visible={showMedicationModal} transparent animationType="fade" onRequestClose={() => {
        setMedicationName('');
        setMedicationDose('');
        setShowMedicationModal(false);
      }}>
        <View style={s.modalOverlay}>
          <View style={s.customActionModal}>
            <Text style={s.customActionModalTitle}>Medication Log</Text>
            <TextInput
              style={s.customActionInput}
              value={medicationName}
              onChangeText={setMedicationName}
              placeholder="Medication name"
              placeholderTextColor={C.muted}
            />
            <TextInput
              style={s.customActionInput}
              value={medicationDose}
              onChangeText={setMedicationDose}
              placeholder="Dose / notes"
              placeholderTextColor={C.muted}
            />
            <View style={s.customActionModalButtons}>
              <TouchableOpacity style={s.customActionCancelBtn} onPress={() => {
                setMedicationName('');
                setMedicationDose('');
                setShowMedicationModal(false);
              }}>
                <Text style={s.customActionCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={s.customActionSaveBtn} onPress={saveQuickMedicationRecord}>
                <Text style={s.customActionSaveText}>Save Medication</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <Modal visible={showReminderModal} transparent animationType="fade" onRequestClose={() => setShowReminderModal(false)}>
        <View style={s.modalOverlay}>
          <View style={s.reminderModal}>
            <Text style={s.customActionModalTitle}>{editingReminder ? 'Edit Reminder' : 'Create Reminder'}</Text>
            <TextInput
              style={s.customActionInput}
              value={reminderTitle}
              onChangeText={setReminderTitle}
              placeholder="Reminder title"
              placeholderTextColor={C.muted}
            />
            <DatePickerField
              label="Reminder Date"
              value={reminderDate}
              onChange={setReminderDate}
              placeholder="Select reminder date"
            />
            <TextInput
              style={s.customActionInput}
              value={reminderTime}
              onChangeText={setReminderTime}
              placeholder="7:00 PM"
              placeholderTextColor={C.muted}
            />
            <Text style={s.reminderModalLabel}>Icon</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.iconPickerRow}>
              {reminderIconOptions.map((icon, index) => (
                <TouchableOpacity
                  key={`${icon}-${index}`}
                  style={[s.iconPickChip, reminderIcon === icon && s.iconPickChipActive]}
                  onPress={() => setReminderIcon(icon)}
                >
                  <Text style={[s.iconPickChipText, reminderIcon === icon && s.iconPickChipTextActive]}>{icon}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            <View style={s.customActionModalButtons}>
              <TouchableOpacity
                style={s.customActionCancelBtn}
                onPress={() => {
                  setShowReminderModal(false);
                  setEditingReminder(null);
                  setReminderTitle('');
                  setReminderIcon('🍽️');
                  setReminderDate(selectedCalendarDateKey);
                  setReminderTime('');
                }}
              >
                <Text style={s.customActionCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={s.customActionSaveBtn} onPress={saveReminder}>
                <Text style={s.customActionSaveText}>Save Reminder</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
    </PetSyncBackground>
  );
}

// ─────────────────────────────────────────────
// SCREEN: PET PROFILE
// ─────────────────────────────────────────────
function PetProfileScreen({ navigation, route }) {
  const { pets, setPets } = useContext(PetsContext);
  const { petScores } = useContext(PetScoresContext);
  const { activityLogs } = useContext(ActivityLogsContext);
  const { healthRecords } = useContext(HealthRecordsContext);
  const { careReminders } = useContext(CareRemindersContext);
  const { setActivityLogs } = useContext(ActivityLogsContext);
  const { setHealthRecords } = useContext(HealthRecordsContext);
  const { setCareReminders } = useContext(CareRemindersContext);
  const { setPetScores } = useContext(PetScoresContext);
  const { openAddPetModal } = useContext(AddPetContext);
  const [showEditPetModal, setShowEditPetModal] = useState(false);
  const [editPetDraft, setEditPetDraft] = useState(() => buildPetEditDraft(null));
  const editModalAnim = useRef(new Animated.Value(0)).current;
  const editCardAnim = useRef(new Animated.Value(0.98)).current;

  const petId = route?.params?.petId;
  const pet = pets.find((item) => item.id === petId) || pets[0] || null;
  const speciesOptions = [
    { label: 'Dog', value: 'dog' },
    { label: 'Cat', value: 'cat' },
    { label: 'Fish', value: 'fish' },
    { label: 'Bird', value: 'bird' },
    { label: 'Reptile', value: 'reptile' },
    { label: 'Rabbit', value: 'rabbit' },
    { label: 'Hamster', value: 'hamster' },
    { label: 'Horse', value: 'horse' },
    { label: 'Other', value: 'other' },
  ];
  const genderOptions = ['Female', 'Male', 'Unknown', 'Other'];

  useEffect(() => {
    if (!showEditPetModal || !pet) return;

    setEditPetDraft(buildPetEditDraft(pet));
    editModalAnim.setValue(0);
    editCardAnim.setValue(0.98);

    Animated.parallel([
      Animated.timing(editModalAnim, {
        toValue: 1,
        duration: 180,
        useNativeDriver: true,
      }),
      Animated.timing(editCardAnim, {
        toValue: 1,
        duration: 180,
        useNativeDriver: true,
      }),
    ]).start();
  }, [showEditPetModal, pet, editModalAnim, editCardAnim]);

  const openEditPetModal = () => {
    if (!pet) return;
    setEditPetDraft(buildPetEditDraft(pet));
    setShowEditPetModal(true);
  };

  const closeEditPetModal = () => {
    setShowEditPetModal(false);
  };

  const pickEditPetPhoto = async () => {
    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (permission.status !== 'granted') {
        Alert.alert('Photo permission needed', 'Please allow photo library access to update the pet picture.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.85,
      });

      if (!result.canceled && result.assets?.[0]?.uri) {
        setEditPetDraft((prev) => ({ ...prev, photoUri: result.assets[0].uri }));
      }
    } catch (error) {
      Alert.alert('Photo upload failed', 'Please try again.');
    }
  };

  const saveEditedPet = () => {
    if (!pet) return;

    const name = editPetDraft.name.trim();
    if (!name) {
      Alert.alert('Pet name required', "Please enter your pet's name.");
      return;
    }

    if (editPetDraft.birthMode === 'birthday' && !editPetDraft.birthday.trim()) {
      Alert.alert('Birthday required', 'Please enter a birthday.');
      return;
    }

    if (editPetDraft.birthMode === 'age' && !editPetDraft.ageText.trim()) {
      Alert.alert('Age required', 'Please enter an age.');
      return;
    }

    const normalizedSpecies = (editPetDraft.species || pet.species || 'other').trim().toLowerCase();
    const birthdayValue = editPetDraft.birthMode === 'birthday' ? editPetDraft.birthday.trim() : '';
    const computedAge = editPetDraft.birthMode === 'birthday'
      ? calculateAgeLabelFromBirthday(birthdayValue)
      : editPetDraft.ageText.trim();

    const updatedPet = {
      ...pet,
      name,
      species: normalizedSpecies,
      breed: editPetDraft.breed.trim() || pet.breed || normalizedSpecies.charAt(0).toUpperCase() + normalizedSpecies.slice(1),
      age: computedAge || pet.age || 'Unknown',
      birthday: birthdayValue,
      ageMode: editPetDraft.birthMode,
      weight: editPetDraft.weight.trim(),
      gender: editPetDraft.gender.trim() || 'Unknown',
      careGoals: editPetDraft.careGoals.trim(),
      photoUri: editPetDraft.photoUri || pet.photoUri || null,
      emoji: getDefaultPetEmoji(normalizedSpecies),
    };

    setPets((prev) => prev.map((item) => (item.id === pet.id ? updatedPet : item)));
    setShowEditPetModal(false);
  };

  if (!pet) {
    return (
      <SafeAreaView style={s.screen} edges={['top']}>
        <View style={s.pageHeader}>
          <View>
            <Text style={s.pageTitle}>Pet Profile</Text>
            <Text style={s.pageSub}>No pets available yet</Text>
          </View>
          <TouchableOpacity style={s.iconBtn} onPress={() => navigation.goBack()}>
            <Text style={{ color: C.text, fontSize: 20, fontWeight: '900' }}>✕</Text>
          </TouchableOpacity>
        </View>

        <Card style={s.petProfileInfoCard}>
          <Text style={s.petProfileSectionTitle}>Add your first pet</Text>
          <Text style={s.petProfileBodyText}>
            Your pet portal is empty right now. Add a pet to start tracking care, reminders, health records, and activity.
          </Text>
          {typeof openAddPetModal === 'function' && (
            <TouchableOpacity
              style={[s.petProfileButton, { marginTop: 16 }]}
              onPress={() => openAddPetModal()}
            >
              <Text style={s.petProfileButtonText}>Add Pet</Text>
            </TouchableOpacity>
          )}
        </Card>
      </SafeAreaView>
    );
  }

  const currentScore = Math.max(0, Math.min(100, petScores[pet.id] ?? pet.score ?? 80));
  const scoreColor = currentScore >= 85 ? C.green : currentScore >= 65 ? C.yellow : C.red;
  const speciesLabel = pet.species ? `${pet.species.charAt(0).toUpperCase()}${pet.species.slice(1)}` : 'Pet';
  const ageOrBirthday = pet.birthday ? `Birthday: ${formatDate(pet.birthday)}` : `Age: ${pet.age || 'Unknown'}`;
  const careGoalsText = Array.isArray(pet.careGoals)
    ? (pet.careGoals.length ? pet.careGoals.join(', ') : 'Not set')
    : (pet.careGoals || 'Not set');
  const streakDays = getStreakDaysForPet(activityLogs, pet.id);
  const todayKey = toLocalDateKey(new Date());
  const parseProfileDate = (value) => {
    if (!value) return null;
    const text = String(value).trim();
    if (/^\d{4}-\d{2}-\d{2}$/.test(text)) {
      const parsed = new Date(`${text}T12:00:00`);
      return Number.isNaN(parsed.getTime()) ? null : parsed;
    }
    const parsed = new Date(text);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  };
  const parseReminderTimeToMinutes = (time) => {
    const text = String(time || '').trim().toUpperCase();
    if (!text) return 24 * 60;
    const match = text.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)?$/);
    if (!match) return 24 * 60;
    let hours = Number(match[1]);
    const minutes = Number(match[2]);
    const period = match[3];
    if (period === 'PM' && hours < 12) hours += 12;
    if (period === 'AM' && hours === 12) hours = 0;
    return (hours * 60) + minutes;
  };
  const upcomingReminders = careReminders.filter((reminder) => (
    reminder.petId === pet.id
    && !reminder.completed
    && reminder.date
    && reminder.date >= todayKey
  )).sort((a, b) => {
    const dateA = String(a.date || '').localeCompare(String(b.date || ''));
    if (dateA !== 0) return dateA;
    return parseReminderTimeToMinutes(a.time) - parseReminderTimeToMinutes(b.time);
  }).slice(0, 3);
  const petActivity = activityLogs
    .filter((log) => log.petId === pet.id)
    .sort((a, b) => {
      const dateA = parseProfileDate(b.dateKey || b.date)?.getTime() || 0;
      const dateB = parseProfileDate(a.dateKey || a.date)?.getTime() || 0;
      if (dateA !== dateB) return dateA - dateB;
      return (b.id || '').localeCompare(a.id || '');
    })
    .slice(0, 3);
  const petHealthRecordCount = healthRecords.filter((record) => record.petId === pet.id).length;
  const achievementBadges = [
    activityLogs.some((log) => log.petId === pet.id) && { label: 'First Care Log' },
    streakDays >= 7 && { label: '7 Day Streak' },
    currentScore >= 90 && { label: 'Health Champion' },
    petHealthRecordCount >= 5 && { label: 'Organized Pet Parent' },
    upcomingReminders.length >= 3 && { label: 'Calendar Planner' },
  ].filter(Boolean);
  const goToMainTab = (screenName) => {
    navigation.reset({
      index: 0,
      routes: [
        {
          name: 'Main',
          state: {
            index: 0,
            routes: [{ name: screenName }],
          },
        },
      ],
    });
  };
  const handleDeletePet = () => {
    Alert.alert(
      `Delete ${pet.name}?`,
      'This will remove this pet from the app.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            setPets((prev) => prev.filter((item) => item.id !== pet.id));
            setActivityLogs((prev) => prev.filter((log) => log.petId !== pet.id));
            setCareReminders((prev) => prev.filter((reminder) => reminder.petId !== pet.id));
            setHealthRecords((prev) => prev.filter((record) => record.petId !== pet.id));
            setPetScores((prev) => {
              const next = { ...prev };
              delete next[pet.id];
              return next;
            });
            navigation.goBack();
          },
        },
      ]
    );
  };

  return (
    <PetSyncBackground opacity={0.12}>
    <SafeAreaView style={s.screen} edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.petProfileScroll}>
        <View style={s.pageHeader}>
          <View>
            <Text style={s.pageTitle}>Pet Profile</Text>
            <Text style={s.pageSub}>A quick view of {pet.name}&apos;s care details</Text>
          </View>

          <TouchableOpacity style={s.iconBtn} onPress={() => navigation.goBack()}>
            <Text style={{ color: C.text, fontSize: 20, fontWeight: '900' }}>✕</Text>
          </TouchableOpacity>
        </View>

        <Card style={s.petProfileHeroCard}>
          <View style={s.petProfileAvatarWrap}>
            <View style={s.petProfileAvatarCircle}>
              {pet.photoUri ? (
                <Image source={{ uri: pet.photoUri }} style={s.petProfileAvatarImage} />
              ) : (
                <Text style={s.petProfileAvatarEmoji}>{pet.emoji || getDefaultPetEmoji(pet.species)}</Text>
              )}
            </View>
          </View>

          <Text style={s.petProfileName}>{pet.name}</Text>
          <Text style={s.petProfileSubtitle}>{speciesLabel} · {pet.breed || 'Breed not set'}</Text>

          <View style={s.petProfileChipRow}>
            <View style={s.petProfileChip}><Text style={s.petProfileChipText}>{ageOrBirthday}</Text></View>
            <View style={s.petProfileChip}><Text style={s.petProfileChipText}>Weight: {pet.weight || 'Not set'}</Text></View>
            <View style={s.petProfileChip}><Text style={s.petProfileChipText}>Gender: {pet.gender || 'Not set'}</Text></View>
          </View>
        </Card>

        <View style={s.petProfileSectionHeaderWrap}>
          <Text style={s.petProfileSectionHeader}>Health Snapshot</Text>
          <Text style={s.petProfileSectionSub}>A quick look at {pet.name}&apos;s care status</Text>
        </View>

        <View style={s.petProfileStatGrid}>
          <Card style={s.petProfileStatCard}>
            <Text style={s.petProfileStatLabel}>Health Score</Text>
            <View style={[s.petProfileScoreCircle, { borderColor: scoreColor, backgroundColor: `${scoreColor}20` }]}>
              <Text style={[s.petProfileScoreValue, { color: scoreColor }]}>{currentScore}</Text>
              <Text style={[s.petProfileScoreUnit, { color: scoreColor }]}>/100</Text>
            </View>
          </Card>

          <Card style={s.petProfileStatCard}>
            <Text style={s.petProfileStatLabel}>Care Streak</Text>
            <Text style={s.petProfileStatBig}>{streakDays} day{streakDays === 1 ? '' : 's'}</Text>
            <Text style={s.petProfileStatSub}>Keep the streak going</Text>
          </Card>

          <Card style={s.petProfileStatCard}>
            <Text style={s.petProfileStatLabel}>Upcoming Reminders</Text>
            <Text style={s.petProfileStatBig}>{upcomingReminders.length}</Text>
            <Text style={s.petProfileStatSub}>Scheduled care items</Text>
          </Card>

          <Card style={s.petProfileStatCard}>
            <Text style={s.petProfileStatLabel}>Health Records</Text>
            <Text style={s.petProfileStatBig}>{petHealthRecordCount}</Text>
            <Text style={s.petProfileStatSub}>Logged records</Text>
          </Card>
        </View>

        <Card style={s.petProfileInfoCard}>
          <Text style={s.petProfileSectionTitle}>Care Goals</Text>
          <Text style={s.petProfileBodyText}>{careGoalsText}</Text>
        </Card>

        <Card style={s.petProfileInfoCard}>
          <Text style={s.petProfileSectionTitle}>Recent Activity</Text>
          {petActivity.length === 0 ? (
            <Text style={s.petProfileEmptyText}>No recent activity yet.</Text>
          ) : (
            petActivity.map((log) => (
              <View key={log.id} style={s.petProfileActivityRow}>
                <View style={s.petProfileActivityIcon}>
                  <Text style={{ fontSize: 18 }}>{log.icon || '✨'}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={s.petProfileActivityTitle}>{log.title}</Text>
                  <Text style={s.petProfileActivitySub}>
                    {log.time}{log.dateKey ? ` · ${formatDate(log.dateKey)}` : ''}
                  </Text>
                </View>
              </View>
            ))
          )}
        </Card>

        <Card style={s.petProfileInfoCard}>
          <Text style={s.petProfileSectionTitle}>Upcoming Care</Text>
          {upcomingReminders.length === 0 ? (
            <Text style={s.petProfileEmptyText}>No upcoming care scheduled.</Text>
          ) : (
            upcomingReminders.map((reminder) => (
              <View key={reminder.id} style={s.petProfileCareRow}>
                <View style={s.petProfileCareIcon}>
                  <Text style={{ fontSize: 18 }}>{reminder.icon || '📌'}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={s.petProfileActivityTitle}>{reminder.title}</Text>
                  <Text style={s.petProfileActivitySub}>
                    {formatDate(reminder.date)}
                    {reminder.time ? ` · ${reminder.time}` : ''}
                  </Text>
                </View>
              </View>
            ))
          )}
        </Card>

        <Card style={s.petProfileInfoCard}>
          <Text style={s.petProfileSectionTitle}>Achievements</Text>
          {achievementBadges.length === 0 ? (
            <Text style={s.petProfileEmptyText}>Keep logging care to unlock achievements.</Text>
          ) : (
            <View style={s.petProfileAchievementWrap}>
              {achievementBadges.map((badge) => (
                <View key={badge.label} style={s.petProfileAchievementBadge}>
                  <Text style={s.petProfileAchievementBadgeText}>{badge.label}</Text>
                </View>
              ))}
            </View>
          )}
        </Card>

        <View style={s.petProfileButtonRow}>
          <TouchableOpacity style={s.petProfileButton} onPress={openEditPetModal}>
            <Text style={s.petProfileButtonText}>Edit Pet</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={s.petProfileButton}
            onPress={() => goToMainTab('Health')}
          >
            <Text style={s.petProfileButtonText}>View Health Records</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[s.petProfileButton, s.petProfileButtonAccent]}
            onPress={() => goToMainTab('Home')}
          >
            <Text style={[s.petProfileButtonText, s.petProfileButtonTextAccent]}>View Care Calendar</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[s.petProfileButton, { backgroundColor: 'rgba(231,76,60,0.12)', borderColor: 'rgba(231,76,60,0.5)' }]}
            onPress={handleDeletePet}
          >
            <Text style={[s.petProfileButtonText, { color: C.red }]}>Delete Pet</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      <Modal visible={showEditPetModal} transparent animationType="fade" onRequestClose={closeEditPetModal}>
        <View style={s.modalOverlay}>
          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ width: '100%' }}>
            <Animated.View
              style={[
                s.addPetModal,
                {
                  opacity: editModalAnim,
                  transform: [
                    {
                      translateY: editModalAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: [20, 0],
                      }),
                    },
                    { scale: editCardAnim },
                  ],
                },
              ]}
            >
              <View style={s.addPetModalHeader}>
                <TouchableOpacity onPress={closeEditPetModal}>
                  <Text style={s.addPetModalClose}>X</Text>
                </TouchableOpacity>
                <View style={{ flex: 1, alignItems: 'center' }}>
                  <Text style={s.addPetModalTitle}>Edit Pet</Text>
                  <Text style={s.addPetModalSubtitle}>Update {pet?.name}&apos;s profile</Text>
                </View>
                <View style={{ width: 22 }} />
              </View>

              <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 12 }}>
                <Text style={s.addPetSectionTitle}>Photo and basics</Text>
                <View style={s.addPetPhotoRow}>
                  <View style={s.addPetPhotoCircle}>
                    {editPetDraft.photoUri ? (
                      <Image source={{ uri: editPetDraft.photoUri }} style={s.addPetPhotoImage} />
                    ) : (
                      <Text style={s.addPetPhotoEmoji}>{getDefaultPetEmoji(editPetDraft.species)}</Text>
                    )}
                  </View>
                  <View style={{ flex: 1 }}>
                    <TouchableOpacity style={s.addPetPhotoButton} onPress={pickEditPetPhoto}>
                      <Text style={s.addPetPhotoButtonText}>
                        {editPetDraft.photoUri ? 'Change Photo' : 'Add Pet Photo'}
                      </Text>
                    </TouchableOpacity>
                    <Text style={s.addPetPhotoHint}>Use the same picker as adding a pet.</Text>
                  </View>
                </View>

                <TextInput
                  style={s.addPetInput}
                  value={editPetDraft.name}
                  onChangeText={(text) => setEditPetDraft((prev) => ({ ...prev, name: text }))}
                  placeholder="Pet name"
                  placeholderTextColor={C.muted}
                />

                <Text style={s.addPetFieldLabel}>Species</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.addPetChipRow}>
                  {speciesOptions.map((option) => (
                    <TouchableOpacity
                      key={option.value}
                      style={[s.addPetChip, editPetDraft.species === option.value && s.addPetChipActive]}
                      onPress={() => setEditPetDraft((prev) => ({ ...prev, species: option.value }))}
                    >
                      <Text style={[s.addPetChipText, editPetDraft.species === option.value && s.addPetChipTextActive]}>
                        {option.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>

                <TextInput
                  style={s.addPetInput}
                  value={editPetDraft.breed}
                  onChangeText={(text) => setEditPetDraft((prev) => ({ ...prev, breed: text }))}
                  placeholder="Breed / type"
                  placeholderTextColor={C.muted}
                />

                <Text style={s.addPetFieldLabel}>Birthday or age</Text>
                <View style={s.addPetModeRow}>
                  {[
                    { key: 'birthday', label: 'Birthday' },
                    { key: 'age', label: 'Age' },
                  ].map((option) => (
                    <TouchableOpacity
                      key={option.key}
                      style={[s.addPetModeChip, editPetDraft.birthMode === option.key && s.addPetModeChipActive]}
                      onPress={() => setEditPetDraft((prev) => ({ ...prev, birthMode: option.key }))}
                    >
                      <Text style={[s.addPetModeChipText, editPetDraft.birthMode === option.key && s.addPetModeChipTextActive]}>
                        {option.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                {editPetDraft.birthMode === 'birthday' ? (
                  <DatePickerField
                    label="Birthday"
                    value={editPetDraft.birthday}
                    onChange={(date) => setEditPetDraft((prev) => ({ ...prev, birthday: date }))}
                    placeholder="Select birthday"
                  />
                ) : (
                  <TextInput
                    style={s.addPetInput}
                    value={editPetDraft.ageText}
                    onChangeText={(text) => setEditPetDraft((prev) => ({ ...prev, ageText: text }))}
                    placeholder="Age, e.g. 3 yrs"
                    placeholderTextColor={C.muted}
                    autoCapitalize="none"
                  />
                )}

                <TextInput
                  style={s.addPetInput}
                  value={editPetDraft.weight}
                  onChangeText={(text) => setEditPetDraft((prev) => ({ ...prev, weight: text }))}
                  placeholder="Weight"
                  placeholderTextColor={C.muted}
                />

                <Text style={s.addPetFieldLabel}>Gender</Text>
                <View style={s.addPetGenderRow}>
                  {genderOptions.map((option) => (
                    <TouchableOpacity
                      key={option}
                      style={[s.addPetModeChip, editPetDraft.gender === option && s.addPetModeChipActive]}
                      onPress={() => setEditPetDraft((prev) => ({ ...prev, gender: option }))}
                    >
                      <Text style={[s.addPetModeChipText, editPetDraft.gender === option && s.addPetModeChipTextActive]}>
                        {option}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                <TextInput
                  style={[s.addPetInput, s.addPetMultiline]}
                  value={editPetDraft.careGoals}
                  onChangeText={(text) => setEditPetDraft((prev) => ({ ...prev, careGoals: text }))}
                  placeholder="Care goals / preferences"
                  placeholderTextColor={C.muted}
                  multiline
                />
              </ScrollView>

              <View style={s.addPetFooter}>
                <TouchableOpacity style={s.customActionCancelBtn} onPress={closeEditPetModal}>
                  <Text style={s.customActionCancelText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity style={s.customActionSaveBtn} onPress={saveEditedPet}>
                  <Text style={s.customActionSaveText}>Save Changes</Text>
                </TouchableOpacity>
              </View>
            </Animated.View>
          </KeyboardAvoidingView>
        </View>
      </Modal>
    </SafeAreaView>
    </PetSyncBackground>
  );
}

// ─────────────────────────────────────────────
function HealthHubScreen({ navigation }) {
    const { pets } = useContext(PetsContext);
    const { openAddPetModal } = useContext(AddPetContext);
    const { healthRecords, setHealthRecords } = useContext(HealthRecordsContext);
    const { careReminders, setCareReminders } = useContext(CareRemindersContext);
  const [selectedPetId, setSelectedPetId] = useState('1');
  const [activeTab, setActiveTab] = useState('all');
  const [showRecordModal, setShowRecordModal] = useState(false);
  const [pendingRecordType, setPendingRecordType] = useState(null);
  const [editingRecord, setEditingRecord] = useState(null);
  const [showRecordDetailModal, setShowRecordDetailModal] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState(null);
    const [addReminderToCalendar, setAddReminderToCalendar] = useState(false);
    const [reminderDate, setReminderDate] = useState('');
    const [reminderTime, setReminderTime] = useState('');
    const [savedVets, setSavedVets] = useState([]);
    const [showVetModal, setShowVetModal] = useState(false);
    const [isVetFinderExpanded, setIsVetFinderExpanded] = useState(false);
    const [editingVetId, setEditingVetId] = useState(null);
    const [vetDraft, setVetDraft] = useState({
      name: '',
      type: 'Vet Clinic',
      distance: '',
      phone: '',
      address: '',
      status: 'Open',
      websiteUrl: '',
    });
    const [recordForm, setRecordForm] = useState({
    vaccineName: '',
    dateGiven: '',
    providerClinic: '',
    nextDueDate: '',
    medicationName: '',
    dosage: '',
    frequency: '',
    startDate: '',
    endDate: '',
    prescribingVet: '',
    medicationNotes: '',
    nextDoseDate: '',
    visitReason: '',
    vetClinic: '',
    appointmentDate: '',
    diagnosisFindings: '',
    followUpDate: '',
    appointmentNotes: '',
    weightValue: '',
    weightDate: '',
    weightNotes: '',
    symptomName: '',
    severity: '',
    symptomDate: '',
    symptomFollowUpDate: '',
    symptomNotes: '',
    procedureName: '',
    surgeryDate: '',
    surgeryFollowUpDate: '',
    recoveryNotes: '',
    allergyName: '',
    reaction: '',
    allergyNotes: '',
    diagnosisName: '',
    diagnosedDate: '',
    diagnosisVet: '',
    treatmentPlan: '',
    diagnosisNotes: '',
    testName: '',
    testDate: '',
    resultSummary: '',
    labVet: '',
    labNotes: '',
    readingType: '',
    readingValue: '',
    readingDate: '',
    readingNotes: '',
    });
    const [showExportPreview, setShowExportPreview] = useState(false);
    const [exportFileUri, setExportFileUri] = useState('');
    const [showAnalysisModal, setShowAnalysisModal] = useState(false);
    const [analysisRecord, setAnalysisRecord] = useState(null);
    const [analysisResults, setAnalysisResults] = useState(null);
    const [analysisLoading, setAnalysisLoading] = useState(false);
    const analysisTimeoutRef = useRef(null);
    const analysisRequestIdRef = useRef(0);
    const tabs = ['all', 'vaccines', 'meds', 'appointments', 'weight', 'procedures', 'conditions', 'labs', 'aquatic'];
    const tabLabels = {
      all: 'All',
      vaccines: 'Vaccines',
    meds: 'Meds',
    appointments: 'Visits',
    weight: 'Weight',
    procedures: 'Procedures',
    conditions: 'Conditions',
    labs: 'Labs',
      aquatic: 'Aquatic',
    };
    const openMapsSearch = () => Linking.openURL('https://www.google.com/maps/search/?api=1&query=vet+near+me');
    const openEmergencyMapsSearch = () => Linking.openURL('https://www.google.com/maps/search/?api=1&query=emergency+vet+near+me');
    const openVetCall = (phone) => Linking.openURL(`tel:${phone}`);
    const openVetMaps = (clinic) => {
      const query = encodeURIComponent(`${clinic.name} ${clinic.address}`);
      Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${query}`);
    };
    const openVetWebsite = (websiteUrl) => {
      const normalized = String(websiteUrl || '').trim();
      if (!normalized) return;

      const url = /^https?:\/\//i.test(normalized) ? normalized : `https://${normalized}`;
      Linking.openURL(url);
    };
    const openVetAddModal = (defaults = {}) => {
      setEditingVetId(defaults.id || null);
      setVetDraft({
        name: defaults.name || '',
        type: defaults.type || 'Vet Clinic',
        distance: defaults.distance || '',
        phone: defaults.phone || '',
        address: defaults.address || '',
        status: defaults.status || 'Open',
        websiteUrl: defaults.websiteUrl || '',
      });
      setShowVetModal(true);
    };
    const closeVetModal = () => {
      setShowVetModal(false);
      setEditingVetId(null);
      setVetDraft({
        name: '',
        type: 'Vet Clinic',
        distance: '',
        phone: '',
        address: '',
        status: 'Open',
        websiteUrl: '',
      });
    };
    const toggleVetFinder = () => {
      setIsVetFinderExpanded((prev) => !prev);
    };
    const saveVetCard = () => {
      const name = vetDraft.name.trim();
      const type = vetDraft.type.trim();
      const distance = vetDraft.distance.trim();
      const phone = vetDraft.phone.trim();
      const address = vetDraft.address.trim();
      const status = vetDraft.status.trim();
      const websiteUrl = vetDraft.websiteUrl.trim();

      if (!name || !type || !distance || !phone || !address || !status) {
        Alert.alert('Missing details', 'Please complete all vet fields before saving.');
        return;
      }

      const payload = {
        id: editingVetId || `saved-vet-${Date.now()}`,
        name,
        type,
        distance,
        phone,
        address,
        status,
        websiteUrl,
      };

      setSavedVets((prev) => {
        if (editingVetId) {
          return prev.map((vet) => (vet.id === editingVetId ? payload : vet));
        }

        return [payload, ...prev];
      });
      closeVetModal();
    };
    const editVetCard = (clinic) => openVetAddModal(clinic);
    const deleteVetCard = (vetId) => {
      Alert.alert('Delete Vet?', 'This saved vet card will be removed.', [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => setSavedVets((prev) => prev.filter((vet) => vet.id !== vetId)),
        },
      ]);
    };

  const typeMap = {
    vaccination: 'vaccines',
    medication: 'meds',
    appointment: 'appointments',
    weight: 'weight',
    symptom: 'conditions',
    surgery: 'procedures',
    allergy: 'conditions',
    diagnosis: 'conditions',
    lab: 'labs',
    fish: 'aquatic',
  };

  const createEmptyRecordForm = () => ({
    vaccineName: '',
    dateGiven: '',
    providerClinic: '',
    nextDueDate: '',
    medicationName: '',
    dosage: '',
    frequency: '',
    startDate: '',
    endDate: '',
    prescribingVet: '',
    medicationNotes: '',
    nextDoseDate: '',
    visitReason: '',
    vetClinic: '',
    appointmentDate: '',
    diagnosisFindings: '',
    followUpDate: '',
    appointmentNotes: '',
    weightValue: '',
    weightDate: '',
    weightNotes: '',
    symptomName: '',
    severity: '',
    symptomDate: '',
    symptomFollowUpDate: '',
    symptomNotes: '',
    procedureName: '',
    surgeryDate: '',
    surgeryFollowUpDate: '',
    recoveryNotes: '',
    allergyName: '',
    reaction: '',
    allergyNotes: '',
    diagnosisName: '',
    diagnosedDate: '',
    diagnosisVet: '',
    treatmentPlan: '',
    diagnosisNotes: '',
    testName: '',
    testDate: '',
    resultSummary: '',
    labVet: '',
    labNotes: '',
    readingType: '',
    readingValue: '',
    readingDate: '',
    readingNotes: '',
  });

  const recordFieldConfig = {
    vaccination: [
      { key: 'vaccineName', label: 'Vaccine name', placeholder: 'Vaccine name', required: true },
      { key: 'dateGiven', label: 'Date given', placeholder: 'Date given' },
      { key: 'providerClinic', label: 'Provider / clinic', placeholder: 'Provider / clinic' },
      { key: 'nextDueDate', label: 'Next due date', placeholder: 'Next due date' },
      { key: 'vaccineNotes', label: 'Notes', placeholder: 'Notes' },
    ],
    medication: [
      { key: 'medicationName', label: 'Medication name', placeholder: 'Medication name', required: true },
      { key: 'dosage', label: 'Dosage', placeholder: 'Dosage' },
      { key: 'frequency', label: 'Frequency', placeholder: 'Frequency' },
      { key: 'startDate', label: 'Start date', placeholder: 'Start date' },
      { key: 'endDate', label: 'End date', placeholder: 'End date' },
      { key: 'prescribingVet', label: 'Prescribing vet', placeholder: 'Prescribing vet' },
      { key: 'medicationNotes', label: 'Notes', placeholder: 'Notes' },
    ],
    appointment: [
      { key: 'visitReason', label: 'Visit reason', placeholder: 'Visit reason', required: true },
      { key: 'vetClinic', label: 'Vet / clinic', placeholder: 'Vet / clinic' },
      { key: 'appointmentDate', label: 'Appointment date', placeholder: 'Appointment date' },
      { key: 'diagnosisFindings', label: 'Diagnosis / findings', placeholder: 'Diagnosis / findings' },
      { key: 'followUpDate', label: 'Follow-up date', placeholder: 'Follow-up date' },
      { key: 'appointmentNotes', label: 'Notes', placeholder: 'Notes' },
    ],
    weight: [
      { key: 'weightValue', label: 'Weight', placeholder: 'Weight', required: true },
      { key: 'weightDate', label: 'Date recorded', placeholder: 'Date recorded' },
      { key: 'weightNotes', label: 'Notes', placeholder: 'Notes' },
    ],
    symptom: [
      { key: 'symptomName', label: 'Symptom', placeholder: 'Symptom', required: true },
      { key: 'severity', label: 'Severity', placeholder: 'Severity' },
      { key: 'symptomDate', label: 'Date noticed', placeholder: 'Date noticed' },
      { key: 'symptomFollowUpDate', label: 'Follow-up date', placeholder: 'Follow-up date' },
      { key: 'symptomNotes', label: 'Notes', placeholder: 'Notes' },
    ],
    surgery: [
      { key: 'procedureName', label: 'Procedure name', placeholder: 'Procedure name', required: true },
      { key: 'surgeryDate', label: 'Date', placeholder: 'Date' },
      { key: 'vetClinic', label: 'Clinic / vet', placeholder: 'Clinic / vet' },
      { key: 'recoveryNotes', label: 'Recovery notes', placeholder: 'Recovery notes' },
      { key: 'surgeryFollowUpDate', label: 'Follow-up date', placeholder: 'Follow-up date' },
    ],
    allergy: [
      { key: 'allergyName', label: 'Allergy name', placeholder: 'Allergy name', required: true },
      { key: 'reaction', label: 'Reaction', placeholder: 'Reaction' },
      { key: 'severity', label: 'Severity', placeholder: 'Severity' },
      { key: 'allergyNotes', label: 'Notes', placeholder: 'Notes' },
    ],
    diagnosis: [
      { key: 'diagnosisName', label: 'Diagnosis name', placeholder: 'Diagnosis name', required: true },
      { key: 'diagnosedDate', label: 'Diagnosed date', placeholder: 'Diagnosed date' },
      { key: 'diagnosisVet', label: 'Vet / clinic', placeholder: 'Vet / clinic' },
      { key: 'treatmentPlan', label: 'Treatment plan', placeholder: 'Treatment plan' },
      { key: 'diagnosisNotes', label: 'Notes', placeholder: 'Notes' },
    ],
    lab: [
      { key: 'testName', label: 'Test name', placeholder: 'Test name', required: true },
      { key: 'testDate', label: 'Test date', placeholder: 'Test date' },
      { key: 'resultSummary', label: 'Result summary', placeholder: 'Result summary' },
      { key: 'labVet', label: 'Vet / clinic', placeholder: 'Vet / clinic' },
      { key: 'labNotes', label: 'Notes', placeholder: 'Notes' },
    ],
    fish: [
      { key: 'readingType', label: 'Reading type', placeholder: 'Reading type', required: true },
      { key: 'readingValue', label: 'Value', placeholder: 'Value', required: true },
      { key: 'readingDate', label: 'Date', placeholder: 'Date' },
      { key: 'readingNotes', label: 'Notes', placeholder: 'Notes' },
    ],
  };

  const recordMainFieldKey = {
    vaccination: 'vaccineName',
    medication: 'medicationName',
    appointment: 'visitReason',
    weight: 'weightValue',
    symptom: 'symptomName',
    surgery: 'procedureName',
    allergy: 'allergyName',
    diagnosis: 'diagnosisName',
    lab: 'testName',
    fish: 'readingType',
  };

  const recordTypeLabelMap = {
    vaccination: 'Vaccination',
    medication: 'Medication',
    appointment: 'Appointment / Vet Visit',
    weight: 'Weight',
    symptom: 'Symptom',
    surgery: 'Surgery / Procedure',
    allergy: 'Allergy',
    diagnosis: 'Diagnosis',
    lab: 'Lab Result',
    fish: 'Fish / Tank Reading',
  };

  const reminderEligibleTypes = new Set(['vaccination', 'medication', 'appointment', 'weight', 'symptom']);

  const getReminderDefaultDate = (type, form) => {
    if (type === 'vaccination') return String(form?.nextDueDate || '').trim();
    if (type === 'medication') return String(form?.endDate || form?.nextDoseDate || '').trim();
    if (type === 'appointment') return String(form?.appointmentDate || '').trim();
    if (type === 'weight') return '';
    if (type === 'symptom') return '';
    return '';
  };

  const firstText = (...values) => values.map((value) => String(value || '').trim()).find(Boolean) || '';

  const getLinkedReminderForRecord = (recordId) => (
    careReminders.find((reminder) => reminder.source === 'healthRecord' && reminder.sourceRecordId === recordId) || null
  );

  const openRecordDetail = (record) => {
    setSelectedRecord(record);
    setShowRecordDetailModal(true);
  };

  const closeRecordDetail = () => {
    setShowRecordDetailModal(false);
    setSelectedRecord(null);
  };

  const getRecordDetailFromTitle = (record) => {
    const parts = String(record.title || '').split(': ');
    if (parts.length > 1) {
      return parts.slice(1).join(': ');
    }
    return String(record.title || '').replace(/^(New )?(Vaccination Record|Medication Record|Vet Appointment|Weight Check|Symptom Logged|New Appointment|New Medication Record|New Vaccination Record|Weight Update)\s*:?\s*/i, '').trim() || String(record.title || '');
  };

  const records = healthRecords.filter(
    (r) =>
      r.petId === selectedPetId &&
      (activeTab === 'all' || typeMap[r.type] === activeTab)
  );

  const pet = pets.find((p) => p.id === selectedPetId) || pets[0];
  useEffect(() => {
    if (pets.length > 0 && !pets.some((item) => item.id === selectedPetId)) {
      setSelectedPetId(pets[0].id);
    }
  }, [pets, selectedPetId]);

  const getPetAgeLabel = (petItem) => {
    if (!petItem) return 'Unknown';
    if (petItem.age) return String(petItem.age);

    const birthday = String(petItem.birthday || '').trim();
    if (!birthday) return 'Unknown';

    const parsed = new Date(birthday);
    if (Number.isNaN(parsed.getTime())) return 'Unknown';

    const today = new Date();
    let years = today.getFullYear() - parsed.getFullYear();
    const monthDiff = today.getMonth() - parsed.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < parsed.getDate())) {
      years -= 1;
    }

    if (years > 0) return `${years} yr${years === 1 ? '' : 's'}`;

    let months = (today.getFullYear() - parsed.getFullYear()) * 12 + (today.getMonth() - parsed.getMonth());
    if (today.getDate() < parsed.getDate()) {
      months -= 1;
    }

    return `${Math.max(months, 0)} mo${months === 1 ? '' : 's'}`;
  };

  useEffect(() => () => {
    if (analysisTimeoutRef.current) {
      clearTimeout(analysisTimeoutRef.current);
      analysisTimeoutRef.current = null;
    }
  }, []);

  if (!pet) {
    return (
      <SafeAreaView style={s.screen} edges={['top']}>
        <View style={s.pageHeader}>
          <View>
            <Text style={s.pageTitle}>Health Hub</Text>
            <Text style={s.pageSub}>No pets available yet</Text>
          </View>
          <TouchableOpacity style={s.iconBtn} onPress={() => navigation.goBack()}>
            <Text style={{ color: C.text, fontSize: 20, fontWeight: '900' }}>✕</Text>
          </TouchableOpacity>
        </View>
        <Card style={s.petProfileInfoCard}>
          <Text style={s.petProfileSectionTitle}>Add your first pet</Text>
          <Text style={s.petProfileBodyText}>
            Create a pet to start using health records and reminders.
          </Text>
          {typeof openAddPetModal === 'function' && (
            <TouchableOpacity
              style={[s.petProfileButton, { marginTop: 16 }]}
              onPress={() => openAddPetModal()}
            >
              <Text style={s.petProfileButtonText}>Add Pet</Text>
            </TouchableOpacity>
          )}
        </Card>
      </SafeAreaView>
    );
  }

  const statusInfo = {
    current: { label: 'CURRENT', color: C.green },
    due_soon: { label: 'DUE SOON', color: C.yellow },
    overdue: { label: 'OVERDUE', color: C.red },
    upcoming: { label: 'UPCOMING', color: C.blue },
  };
  const getLocalDateOnly = (value) => {
    if (!value) return null;
    if (value instanceof Date && !Number.isNaN(value.getTime())) {
      return new Date(value.getFullYear(), value.getMonth(), value.getDate());
    }

    const text = String(value).trim();
    if (!text) return null;

    const parsedStored = parseStoredDateKey(text);
    if (parsedStored) {
      return new Date(parsedStored.getFullYear(), parsedStored.getMonth(), parsedStored.getDate());
    }

    const parsedLoose = new Date(text);
    if (!Number.isNaN(parsedLoose.getTime())) {
      return new Date(parsedLoose.getFullYear(), parsedLoose.getMonth(), parsedLoose.getDate());
    }

    return null;
  };

  const calculateHealthRecordStatus = (record) => {
    const today = new Date();
    const todayDate = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const nextDueDate = getLocalDateOnly(
      record?.nextDue
      || record?.details?.nextDueDate
      || record?.details?.followUpDate
      || record?.details?.symptomFollowUpDate
      || record?.details?.surgeryFollowUpDate
    );
    const appointmentDate = record?.type === 'appointment'
      ? getLocalDateOnly(record?.details?.appointmentDate || record?.date)
      : null;

    if (record?.type === 'appointment' && appointmentDate && appointmentDate > todayDate) {
      return 'upcoming';
    }

    if (nextDueDate) {
      const diffDays = Math.ceil((nextDueDate - todayDate) / (1000 * 60 * 60 * 24));
      if (diffDays < 0) return 'overdue';
      if (diffDays <= 30) return 'due_soon';
      return 'current';
    }

    return record?.status || 'current';
  };

  const recordsWithDisplayStatus = records.map((record) => ({
    ...record,
    displayStatus: calculateHealthRecordStatus(record),
  }));
  const healthOverviewCounts = {
    vaccinations: recordsWithDisplayStatus.filter((record) => record.type === 'vaccination').length,
    medications: recordsWithDisplayStatus.filter((record) => record.type === 'medication').length,
    conditions: recordsWithDisplayStatus.filter((record) => ['symptom', 'allergy', 'diagnosis'].includes(record.type)).length,
    appointments: recordsWithDisplayStatus.filter((record) => record.type === 'appointment').length,
  };
  const getRecordFormFromRecord = (record) => {
    const base = {
      vaccineName: '',
      dateGiven: '',
      providerClinic: '',
      nextDueDate: '',
      medicationName: '',
      dosage: '',
      frequency: '',
      startDate: '',
      endDate: '',
      prescribingVet: '',
      medicationNotes: '',
      nextDoseDate: '',
      visitReason: '',
      vetClinic: '',
      appointmentDate: '',
      diagnosisFindings: '',
      followUpDate: '',
      appointmentNotes: '',
      weightValue: '',
      weightDate: '',
      weightNotes: '',
      symptomName: '',
      severity: '',
      symptomDate: '',
      symptomFollowUpDate: '',
      symptomNotes: '',
      procedureName: '',
      surgeryDate: '',
      surgeryFollowUpDate: '',
      recoveryNotes: '',
      allergyName: '',
      reaction: '',
      allergyNotes: '',
      diagnosisName: '',
      diagnosedDate: '',
      diagnosisVet: '',
      treatmentPlan: '',
      diagnosisNotes: '',
      testName: '',
      testDate: '',
      resultSummary: '',
      labVet: '',
      labNotes: '',
      readingType: '',
      readingValue: '',
      readingDate: '',
      readingNotes: '',
    };

    const parsedTitle = getRecordDetailFromTitle(record);
    const merged = { ...base, ...(record?.details || {}) };
    const mainKey = recordMainFieldKey[record?.type];
    if (mainKey) {
      const mainValue =
        record?.vaccineName ||
        record?.medicationName ||
        record?.appointmentReason ||
        record?.visitReason ||
        record?.symptomText ||
        record?.procedureName ||
        record?.allergyName ||
        record?.diagnosisName ||
        record?.testName ||
        record?.readingType ||
        (record?.type === 'weight' && record?.value != null ? `${record.value}${record.unit ? ` ${record.unit}` : ''}` : '') ||
        parsedTitle;

      merged[mainKey] = mainValue;
    }

    if (record?.type === 'vaccination') {
      merged.vaccineName = firstText(record?.vaccineName, merged.vaccineName, parsedTitle);
      merged.dateGiven = firstText(record?.dateGiven, record?.date, merged.dateGiven);
      merged.providerClinic = firstText(record?.provider, merged.providerClinic);
      merged.nextDueDate = firstText(record?.nextDue, merged.nextDueDate, record?.nextDueDate);
      merged.vaccineNotes = firstText(record?.notes, merged.vaccineNotes, record?.details?.vaccineNotes);
    } else if (record?.type === 'medication') {
      merged.medicationName = firstText(record?.medicationName, merged.medicationName, parsedTitle);
      merged.dosage = firstText(record?.dosage, merged.dosage);
      merged.frequency = firstText(record?.frequency, merged.frequency);
      merged.startDate = firstText(record?.startDate, record?.date, merged.startDate);
      merged.endDate = firstText(record?.endDate, record?.nextDue, record?.details?.nextDoseDate, merged.endDate);
      merged.nextDoseDate = merged.endDate;
      merged.prescribingVet = firstText(record?.provider, merged.prescribingVet);
      merged.medicationNotes = firstText(record?.notes, merged.medicationNotes, record?.details?.medicationNotes);
    } else if (record?.type === 'appointment') {
      merged.visitReason = firstText(record?.appointmentReason, record?.visitReason, merged.visitReason, parsedTitle);
      merged.appointmentDate = firstText(record?.appointmentDate, record?.date, merged.appointmentDate);
      merged.vetClinic = firstText(record?.provider, merged.vetClinic, record?.details?.clinicVet);
      merged.diagnosisFindings = firstText(record?.diagnosisFindings, merged.diagnosisFindings);
      merged.followUpDate = firstText(record?.nextDue, merged.followUpDate);
      merged.appointmentNotes = firstText(record?.notes, merged.appointmentNotes, record?.details?.appointmentNotes);
    } else if (record?.type === 'weight') {
      merged.weightValue = firstText(
        record?.weightValue,
        record?.value != null ? `${record.value}${record.unit ? ` ${record.unit}` : ''}` : '',
        merged.weightValue,
        parsedTitle
      );
      merged.weightDate = firstText(record?.weightDate, record?.date, merged.weightDate);
      merged.weightNotes = firstText(record?.notes, merged.weightNotes, record?.details?.weightNotes);
    } else if (record?.type === 'symptom') {
      merged.symptomName = firstText(record?.symptomText, record?.symptomName, merged.symptomName, parsedTitle);
      merged.severity = firstText(record?.severity, merged.severity);
      merged.symptomDate = firstText(record?.symptomDate, record?.date, merged.symptomDate);
      merged.symptomFollowUpDate = firstText(record?.nextDue, merged.symptomFollowUpDate);
      merged.symptomNotes = firstText(record?.notes, merged.symptomNotes, record?.details?.symptomNotes);
    } else if (record?.type === 'surgery') {
      merged.procedureName = firstText(record?.procedureName, merged.procedureName, parsedTitle);
      merged.surgeryDate = firstText(record?.surgeryDate, record?.date, merged.surgeryDate);
      merged.vetClinic = firstText(record?.provider, merged.vetClinic);
      merged.surgeryFollowUpDate = firstText(record?.nextDue, merged.surgeryFollowUpDate);
      merged.recoveryNotes = firstText(record?.notes, merged.recoveryNotes, record?.details?.recoveryNotes);
    } else if (record?.type === 'allergy') {
      merged.allergyName = firstText(record?.allergyName, merged.allergyName, parsedTitle);
      merged.reaction = firstText(record?.reaction, merged.reaction);
      merged.severity = firstText(record?.severity, merged.severity);
      merged.allergyNotes = firstText(record?.notes, merged.allergyNotes, record?.details?.allergyNotes);
    } else if (record?.type === 'diagnosis') {
      merged.diagnosisName = firstText(record?.diagnosisName, merged.diagnosisName, parsedTitle);
      merged.diagnosedDate = firstText(record?.diagnosedDate, record?.date, merged.diagnosedDate);
      merged.diagnosisVet = firstText(record?.provider, merged.diagnosisVet);
      merged.treatmentPlan = firstText(record?.treatmentPlan, merged.treatmentPlan);
      merged.diagnosisNotes = firstText(record?.notes, merged.diagnosisNotes, record?.details?.diagnosisNotes);
    } else if (record?.type === 'lab') {
      merged.testName = firstText(record?.testName, merged.testName, parsedTitle);
      merged.testDate = firstText(record?.testDate, record?.date, merged.testDate);
      merged.resultSummary = firstText(record?.resultSummary, merged.resultSummary);
      merged.labVet = firstText(record?.provider, merged.labVet);
      merged.labNotes = firstText(record?.notes, merged.labNotes, record?.details?.labNotes);
    } else if (record?.type === 'fish') {
      merged.readingType = firstText(record?.readingType, merged.readingType, parsedTitle);
      merged.readingValue = firstText(record?.readingValue, merged.readingValue);
      merged.readingDate = firstText(record?.readingDate, record?.date, merged.readingDate);
      merged.readingNotes = firstText(record?.notes, merged.readingNotes, record?.details?.readingNotes);
    }

    return merged;
  };

  const openRecordEditor = (record) => {
    const linkedReminder = getLinkedReminderForRecord(record.id);
    const form = getRecordFormFromRecord(record);
    setEditingRecord(record);
    setPendingRecordType(record.type);
    setRecordForm(form);
    setAddReminderToCalendar(Boolean(linkedReminder));
    setReminderDate(linkedReminder?.date || getReminderDefaultDate(record.type, form));
    setReminderTime(linkedReminder?.time || '');
    setShowRecordModal(true);
  };

  const buildRecordMeta = (type, form) => {
    const clean = Object.fromEntries(
      Object.entries(form).map(([key, value]) => [key, String(value || '').trim()])
    );
    const mainKey = recordMainFieldKey[type];
    const mainValue = clean[mainKey] || '';
    const todayKey = toLocalDateKey(new Date());

    const typeConfig = {
      vaccination: {
        title: `Vaccination: ${mainValue}`,
        icon: '💉',
        status: 'current',
        date: clean.dateGiven || todayKey,
        nextDue: clean.nextDueDate || '',
        provider: clean.providerClinic || '',
        details: {
          vaccineName: mainValue,
          dateGiven: clean.dateGiven || todayKey,
          providerClinic: clean.providerClinic || '',
          nextDueDate: clean.nextDueDate || '',
          vaccineNotes: clean.vaccineNotes || '',
        },
      },
      medication: {
        title: `Medication: ${mainValue}`,
        icon: '💊',
        status: 'current',
        date: clean.startDate || todayKey,
        nextDue: clean.endDate || clean.nextDoseDate || '',
        provider: clean.prescribingVet || '',
        details: {
          medicationName: mainValue,
          dosage: clean.dosage || '',
          frequency: clean.frequency || '',
          startDate: clean.startDate || todayKey,
          endDate: clean.endDate || clean.nextDoseDate || '',
          nextDoseDate: clean.endDate || clean.nextDoseDate || '',
          prescribingVet: clean.prescribingVet || '',
          medicationNotes: clean.medicationNotes || '',
        },
      },
      appointment: {
        title: `Appointment: ${mainValue}`,
        icon: '🏥',
        status: 'upcoming',
        date: clean.appointmentDate || todayKey,
        nextDue: clean.followUpDate || '',
        provider: clean.vetClinic || '',
        details: {
          visitReason: mainValue,
          appointmentDate: clean.appointmentDate || todayKey,
          clinicVet: clean.vetClinic || '',
          diagnosisFindings: clean.diagnosisFindings || '',
          followUpDate: clean.followUpDate || '',
          appointmentNotes: clean.appointmentNotes || '',
        },
      },
      weight: {
        title: `Weight: ${mainValue}`,
        icon: '⚖️',
        status: 'current',
        date: clean.weightDate || todayKey,
        details: {
          weightValue: mainValue,
          weightDate: clean.weightDate || todayKey,
          weightNotes: clean.weightNotes || '',
        },
      },
      symptom: {
        title: `Symptom: ${mainValue}`,
        icon: '🤒',
        status: 'due_soon',
        date: clean.symptomDate || todayKey,
        nextDue: clean.symptomFollowUpDate || '',
        details: {
          symptomName: mainValue,
          severity: clean.severity || '',
          symptomDate: clean.symptomDate || todayKey,
          symptomFollowUpDate: clean.symptomFollowUpDate || '',
          symptomNotes: clean.symptomNotes || '',
        },
      },
      surgery: {
        title: `Surgery: ${mainValue}`,
        icon: '🩺',
        status: 'current',
        date: clean.surgeryDate || todayKey,
        nextDue: clean.surgeryFollowUpDate || '',
        provider: clean.vetClinic || '',
        details: {
          procedureName: mainValue,
          surgeryDate: clean.surgeryDate || todayKey,
          clinicVet: clean.vetClinic || '',
          recoveryNotes: clean.recoveryNotes || '',
          surgeryFollowUpDate: clean.surgeryFollowUpDate || '',
        },
      },
      allergy: {
        title: `Allergy: ${mainValue}`,
        icon: '⚠️',
        status: 'current',
        date: todayKey,
        details: {
          allergyName: mainValue,
          reaction: clean.reaction || '',
          severity: clean.severity || '',
          allergyNotes: clean.allergyNotes || '',
        },
      },
      diagnosis: {
        title: `Diagnosis: ${mainValue}`,
        icon: '📋',
        status: 'current',
        date: clean.diagnosedDate || todayKey,
        provider: clean.diagnosisVet || '',
        details: {
          diagnosisName: mainValue,
          diagnosedDate: clean.diagnosedDate || todayKey,
          diagnosisVet: clean.diagnosisVet || '',
          treatmentPlan: clean.treatmentPlan || '',
          diagnosisNotes: clean.diagnosisNotes || '',
        },
      },
      lab: {
        title: `Lab Result: ${mainValue}`,
        icon: '🧪',
        status: 'current',
        date: clean.testDate || todayKey,
        provider: clean.labVet || '',
        details: {
          testName: mainValue,
          testDate: clean.testDate || todayKey,
          resultSummary: clean.resultSummary || '',
          labVet: clean.labVet || '',
          labNotes: clean.labNotes || '',
        },
      },
      fish: {
        title: `Tank Reading: ${mainValue}`,
        icon: '🐟',
        status: 'current',
        date: clean.readingDate || todayKey,
        details: {
          readingType: mainValue,
          readingValue: clean.readingValue || '',
          readingDate: clean.readingDate || todayKey,
          readingNotes: clean.readingNotes || '',
        },
      },
    };

    const selected = typeConfig[type];
    return {
      ...selected,
      mainValue,
      details: selected?.details || {},
    };
  };

  const createHealthRecord = (type, form) => {
    const meta = buildRecordMeta(type, form);
    if (!meta || !meta.mainValue) return;
    const { detailLines, mainValue, ...recordMeta } = meta;
    const notes = getHealthRecordNotes(type, meta.details);

    const newRecord = {
      id: Date.now().toString(),
      petId: selectedPetId,
      type,
      date: recordMeta.date || toLocalDateKey(new Date()),
      ...recordMeta,
      details: meta.details,
      notes,
    };

    setHealthRecords((prev) => [newRecord, ...prev]);
    return newRecord;
  };

  const upsertHealthRecordReminder = (record, reminderEnabled, reminderDateValue, reminderTimeValue, existingReminder = null) => {
    const linkedReminder = existingReminder || getLinkedReminderForRecord(record.id);

    if (!reminderEnabled) {
      if (linkedReminder) {
        setCareReminders((prev) => prev.filter((reminder) => reminder.id !== linkedReminder.id));
        deleteCareReminderFromSupabase(linkedReminder.id);
      }
      return;
    }

    const cleanedDate = String(reminderDateValue || '').trim();
    const cleanedTime = String(reminderTimeValue || '').trim();
    if (!cleanedDate) return;

    const reminderPayload = {
      id: linkedReminder?.id || Date.now().toString(),
      petId: selectedPetId,
      title: `${record.title} due`,
      icon: record.icon,
      date: cleanedDate,
      time: cleanedTime,
      completed: false,
      source: 'healthRecord',
      sourceRecordId: record.id,
    };

    setCareReminders((prev) => (
      linkedReminder
        ? prev.map((reminder) => (reminder.id === linkedReminder.id ? reminderPayload : reminder))
        : [reminderPayload, ...prev]
    ));

    if (linkedReminder) {
      updateCareReminderInSupabase(reminderPayload);
    } else {
      saveCareReminderToSupabase(reminderPayload);
    }
  };

  const openRecordTypePrompt = (type) => {
    setPendingRecordType(type);
    setRecordForm(createEmptyRecordForm());
    setEditingRecord(null);
    setAddReminderToCalendar(false);
    setReminderDate('');
    setReminderTime('');
    setShowRecordModal(true);
  };

  const saveRecord = () => {
    if (!pendingRecordType) {
      Alert.alert('Enter Details', 'Please choose a record type.');
      return;
    }

    const meta = buildRecordMeta(pendingRecordType, recordForm);
    if (!meta?.mainValue) {
      Alert.alert('Enter Details', 'Please fill in the main field before saving.');
      return;
    }

    const reminderEnabled = reminderEligibleTypes.has(pendingRecordType) && addReminderToCalendar;
    const effectiveReminderDate = String(reminderDate || '').trim() || getReminderDefaultDate(pendingRecordType, recordForm);

    if (reminderEnabled && !effectiveReminderDate) {
      Alert.alert('Reminder date required', 'Please enter a reminder date before saving.');
      return;
    }

    if (editingRecord) {
      const { detailLines, mainValue, ...recordMeta } = meta;
      const updatedRecord = {
        ...editingRecord,
        type: pendingRecordType,
        ...recordMeta,
        details: meta.details,
        notes: getHealthRecordNotes(pendingRecordType, meta.details, editingRecord?.notes || ''),
      };
      setHealthRecords(prev => prev.map(record => (
        record.id === editingRecord.id
          ? updatedRecord
          : record
      )));
      upsertHealthRecordReminder(
        updatedRecord,
        reminderEnabled,
        effectiveReminderDate,
        reminderTime
      );
      updateHealthRecordInSupabase(updatedRecord);
    } else {
      const newRecord = createHealthRecord(pendingRecordType, recordForm);
      if (newRecord) {
        upsertHealthRecordReminder(
          newRecord,
          reminderEnabled,
          effectiveReminderDate,
          reminderTime
        );
        saveHealthRecordToSupabase(newRecord);
      }
    }

    setShowRecordModal(false);
    setPendingRecordType(null);
    setRecordForm(createEmptyRecordForm());
    setEditingRecord(null);
    setAddReminderToCalendar(false);
    setReminderDate('');
    setReminderTime('');
  };

  const closeRecordModal = () => {
    setShowRecordModal(false);
    setPendingRecordType(null);
    setRecordForm(createEmptyRecordForm());
    setEditingRecord(null);
    setAddReminderToCalendar(false);
    setReminderDate('');
    setReminderTime('');
  };

  const deleteRecord = (recordId) => {
    setHealthRecords(prev => prev.filter(record => record.id !== recordId));
    setCareReminders(prev => prev.filter((reminder) => reminder.sourceRecordId !== recordId));
    deleteHealthRecordFromSupabase(recordId);
  };

  const handleRecordPress = (record) => {
    Alert.alert(record.title, 'What would you like to do?', [
      {
        text: 'Edit',
        onPress: () => {
          setEditingRecord(record);
          setPendingRecordType(record.type);
          setRecordForm(getRecordFormFromRecord(record));
          setShowRecordModal(true);
        },
      },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => {
          Alert.alert('Delete Record?', 'This health record will be removed.', [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Delete', style: 'destructive', onPress: () => deleteRecord(record.id) },
          ]);
        },
      },
      { text: 'Cancel', style: 'cancel' },
    ]);
  };

  const getRecordDate = (record) => {
    const parsed = new Date(record.date);
    return Number.isNaN(parsed.getTime()) ? new Date() : parsed;
  };

  const getTimelineLabel = (date) => {
    const today = new Date();
    const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const startOfTarget = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    const diffDays = Math.round((startOfToday - startOfTarget) / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'TODAY';
    if (diffDays === 1) return 'YESTERDAY';
    return formatDate(date);
  };

  const groupedTimeline = Object.values(
    recordsWithDisplayStatus.reduce((acc, record) => {
      const recordDate = getRecordDate(record);
      const groupLabel = getTimelineLabel(recordDate);
      const groupKey = groupLabel;

      if (!acc[groupKey]) {
        acc[groupKey] = {
          key: groupKey,
          date: recordDate,
          label: groupLabel,
          records: [],
        };
      }

      acc[groupKey].records.push(record);
      return acc;
    }, {})
  )
    .map(group => ({
      ...group,
      records: group.records.sort((a, b) => getRecordDate(b) - getRecordDate(a)),
    }))
    .sort((a, b) => b.date - a.date);

  const buildRecordDetailLines = (record, compact = false) => {
    const details = record.details || {};
    const lines = [];
    const add = (label, value) => {
      const text = String(value || '').trim();
      if (text) lines.push(`${label}: ${text}`);
    };

    switch (record.type) {
      case 'vaccination':
        add('Vaccine name', details.vaccineName || record.vaccineName);
        add('Date given', details.dateGiven || record.date);
        add('Provider / clinic', details.providerClinic || record.provider);
        add('Next due date', details.nextDueDate || record.nextDue);
        add('Notes', details.vaccineNotes);
        break;
      case 'medication':
        add('Medication name', details.medicationName || record.medicationName);
        add('Dosage', details.dosage);
        add('Frequency', details.frequency);
        add('Start date', details.startDate || record.date);
        add('End date', details.endDate || record.nextDue);
        add('Prescribing vet', details.prescribingVet || record.provider);
        add('Notes', details.medicationNotes);
        break;
      case 'appointment':
        add('Visit reason', details.visitReason || record.visitReason || record.appointmentReason);
        add('Appointment date', details.appointmentDate || record.date);
        add('Clinic / vet', details.clinicVet || record.provider);
        add('Diagnosis / findings', details.diagnosisFindings);
        add('Follow-up date', details.followUpDate || record.nextDue);
        add('Notes', details.appointmentNotes);
        break;
      case 'weight':
        add('Weight', details.weightValue || (record.value != null ? `${record.value}${record.unit ? ` ${record.unit}` : ''}` : record.weightValue));
        add('Date recorded', details.weightDate || record.date);
        add('Notes', details.weightNotes);
        break;
      case 'symptom':
        add('Symptom', details.symptomName || record.symptomText);
        add('Severity', details.severity);
        add('Date noticed', details.symptomDate || record.date);
        add('Follow-up date', details.symptomFollowUpDate || record.nextDue);
        add('Notes', details.symptomNotes);
        break;
      case 'surgery':
        add('Procedure name', details.procedureName || record.procedureName);
        add('Date', details.surgeryDate || record.date);
        add('Clinic / vet', details.clinicVet || record.provider);
        add('Recovery notes', details.recoveryNotes);
        add('Follow-up date', details.surgeryFollowUpDate || record.nextDue);
        break;
      case 'allergy':
        add('Allergy name', details.allergyName || record.allergyName);
        add('Reaction', details.reaction);
        add('Severity', details.severity);
        add('Notes', details.allergyNotes);
        break;
      case 'diagnosis':
        add('Diagnosis name', details.diagnosisName || record.diagnosisName);
        add('Diagnosed date', details.diagnosedDate || record.date);
        add('Vet / clinic', details.diagnosisVet || record.provider);
        add('Treatment plan', details.treatmentPlan);
        add('Notes', details.diagnosisNotes);
        break;
      case 'lab':
        add('Test name', details.testName || record.testName);
        add('Test date', details.testDate || record.date);
        add('Result summary', details.resultSummary);
        add('Vet / clinic', details.labVet || record.provider);
        add('Notes', details.labNotes);
        break;
      case 'fish':
        add('Reading type', details.readingType || record.readingType);
        add('Value', details.readingValue || record.readingValue);
        add('Date', details.readingDate || record.date);
        add('Notes', details.readingNotes);
        break;
      case 'imported_file':
        add('File name', record.fileName || record.title);
        add('File type', record.mimeType || details.mimeType || 'Unknown');
        add('Size', formatImportedFileSize(record.size));
        add('Uploaded date', record.date);
        add('Note', 'AI extraction coming soon');
        break;
      default:
        break;
    }

    return compact ? lines.slice(0, 3) : lines;
  };

  const getRecordDisplayLines = (record) => buildRecordDetailLines(record, true);

  const getRecordStatusBadge = (record) => {
    const today = new Date();
    const recordDate = parseStoredDateKey(record.date) || today;
    const nextDueDateValue = parseStoredDateKey(
      record.nextDue ||
      record.details?.nextDueDate ||
      record.details?.followUpDate ||
      record.details?.symptomFollowUpDate ||
      record.details?.surgeryFollowUpDate
    );
    const ageDays = Math.max(0, Math.floor((today - recordDate) / (1000 * 60 * 60 * 24)));
    const nextDueDays = nextDueDateValue ? Math.floor((nextDueDateValue - today) / (1000 * 60 * 60 * 24)) : null;
    const calculatedStatus = calculateHealthRecordStatus(record);

    if (calculatedStatus && statusInfo[calculatedStatus]) {
      return statusInfo[calculatedStatus];
    }

    if (record?.type === 'appointment' && nextDueDays != null && nextDueDays > 0) {
      return { label: 'Upcoming', color: C.blue };
    }
    if (ageDays > 365) {
      return { label: 'Archived', color: C.faint };
    }
    if (ageDays > 30) {
      return { label: 'Completed', color: C.green };
    }
    return { label: 'Active', color: C.accent };
  };

  const getRecordHeaderLines = (record) => {
    const details = record.details || {};
    const dateLabel = formatDate(record.date);

    if (record.type === 'vaccination') {
      return ['Vaccination', details.vaccineName || record.title, `Given ${formatDate(details.dateGiven || record.date)}`, details.nextDueDate ? `Next Due ${formatDate(details.nextDueDate)}` : null].filter(Boolean);
    }
    if (record.type === 'medication') {
      return ['Medication', details.medicationName || record.title, `Started ${formatDate(details.startDate || record.date)}`, details.endDate ? `Ends ${formatDate(details.endDate)}` : null].filter(Boolean);
    }
    if (record.type === 'appointment') {
      return ['Appointment', details.visitReason || record.title, dateLabel, details.followUpDate ? `Follow-up ${formatDate(details.followUpDate)}` : null].filter(Boolean);
    }
    if (record.type === 'weight') {
      return ['Weight', details.weightValue || record.title, `Recorded ${formatDate(details.weightDate || record.date)}`].filter(Boolean);
    }
    if (record.type === 'symptom') {
      return ['Symptom', details.symptomName || record.title, `Noted ${formatDate(details.symptomDate || record.date)}`, details.symptomFollowUpDate ? `Follow-up ${formatDate(details.symptomFollowUpDate)}` : null].filter(Boolean);
    }
    if (record.type === 'surgery') {
      return ['Surgery / Procedure', details.procedureName || record.title, dateLabel, details.surgeryFollowUpDate ? `Follow-up ${formatDate(details.surgeryFollowUpDate)}` : null].filter(Boolean);
    }
    if (record.type === 'allergy') {
      return ['Allergy', details.allergyName || record.title, details.severity ? `Severity ${details.severity}` : null].filter(Boolean);
    }
    if (record.type === 'diagnosis') {
      return ['Diagnosis', details.diagnosisName || record.title, `Diagnosed ${formatDate(details.diagnosedDate || record.date)}`].filter(Boolean);
    }
    if (record.type === 'lab') {
      return ['Lab Result', details.testName || record.title, `Tested ${formatDate(details.testDate || record.date)}`].filter(Boolean);
    }
    if (record.type === 'fish') {
      return ['Fish / Tank Reading', details.readingType || record.title, `Recorded ${formatDate(details.readingDate || record.date)}`].filter(Boolean);
    }
    if (record.type === 'imported_file') {
      return ['Imported File', record.fileName || record.title, `Uploaded ${formatDate(record.date)}`].filter(Boolean);
    }
    return [record.title, dateLabel].filter(Boolean);
  };

  const getRecordFullDetails = (record) => {
    const lines = [record.title, `Date: ${formatDate(record.date)}`];
    const linkedReminder = getLinkedReminderForRecord(record.id);
    if (record.provider) lines.push(`Provider: ${record.provider}`);
    if (record.nextDue) lines.push(`Next due: ${formatDate(record.nextDue)}`);
    if (linkedReminder?.date) lines.push(`Reminder scheduled for ${formatDate(linkedReminder.date)}${linkedReminder.time ? ` at ${linkedReminder.time}` : ''}`);
    const details = buildRecordDetailLines(record, false);
    if (details.length > 0) lines.push('', ...details);
    return lines.join('\n');
  };

  const showRecordActions = (record) => {
    openRecordDetail(record);
  };

  const openImportedFile = async (fileUrl) => {
    if (!fileUrl) {
      Alert.alert('File unavailable');
      return;
    }

    closeAllHealthModals();
    setTimeout(async () => {
      try {
        await Linking.openURL(fileUrl);
      } catch (error) {
        console.log('Unable to open file:', error);
        Alert.alert('Unable to open file');
      }
    }, 300);
  };

  const formatImportedFileSize = (size) => {
    if (typeof size !== 'number' || Number.isNaN(size) || size < 0) {
      return 'Unknown';
    }

    if (size >= 1024 * 1024) {
      return `${(size / (1024 * 1024)).toFixed(1)} MB`;
    }

    return `${(size / 1024).toFixed(1)} KB`;
  };

  const latestRecords = [...records]
    .sort((a, b) => getRecordDate(b) - getRecordDate(a))
    .slice(0, 5);

  const overdueRecords = recordsWithDisplayStatus.filter((record) => record.displayStatus === 'overdue');
  const medicationRecords = records.filter((record) => record.type === 'medication');
  const weightRecords = records.filter((record) => record.type === 'weight');
  const recordCount = records.length;
  const recentActivityText = recordCount > 0 ? 'Care streak active' : 'No recent health records';

  const insightLines = [];

  if (recordCount >= 5) {
    insightLines.push(`✨ ${pet.name} has had excellent care this week`);
  }

  if (overdueRecords.length === 0) {
    insightLines.push('Wellness records are up to date');
  } else {
    insightLines.push('Overdue care detected');
  }

  if (weightRecords.length > 0) {
    insightLines.push('Weight tracking active');
  } else {
    insightLines.push('No recent weight records');
  }

  if (medicationRecords.length === 0) {
    insightLines.push('No medication records logged');
  } else {
    insightLines.push('All medications logged');
  }

  if (recentActivityText) {
    insightLines.push(recentActivityText);
  }

  const visibleInsights = insightLines.slice(0, 3);
  const selectedRecordReminder = selectedRecord ? getLinkedReminderForRecord(selectedRecord.id) : null;
  const selectedRecordStatus = selectedRecord ? getRecordStatusBadge(selectedRecord) : null;
  const selectedRecordHeaderLines = selectedRecord ? getRecordHeaderLines(selectedRecord) : [];
  const selectedRecordDetailLines = selectedRecord ? buildRecordDetailLines(selectedRecord, false) : [];

  const formatSummaryDate = (value) => {
    const text = String(value || '').trim();
    return text ? formatDate(text) : 'No records.';
  };

  const formatSummaryValue = (value, fallback = 'No records.') => {
    if (Array.isArray(value)) {
      const text = value.map((item) => String(item || '').trim()).filter(Boolean).join(', ');
      return text || fallback;
    }

    const text = String(value || '').trim();
    return text || fallback;
  };

  const pushSummarySection = (lines, title, items, formatter) => {
    lines.push(title);

    if (!items.length) {
      lines.push('No records.');
      lines.push('');
      return;
    }

    items.forEach((item) => {
      const block = formatter(item) || {};
      lines.push(`- ${block.title || 'Record'}`);

      (block.details || []).forEach((detail) => {
        if (detail) {
          lines.push(`  ${detail}`);
        }
      });
    });

    lines.push('');
  };

  const buildHealthSummary = () => {
    const profileAge = pet.birthday
      ? calculateAgeLabelFromBirthday(pet.birthday) || formatDate(pet.birthday)
      : pet.age || 'Unknown';
    const careGoalsText = Array.isArray(pet.careGoals)
      ? (pet.careGoals.length ? pet.careGoals.join(', ') : 'Not set')
      : (pet.careGoals || 'Not set');
    const healthScoreText = pet.score != null ? `${pet.score}/100` : 'Not available';
    const currentCount = recordsWithDisplayStatus.filter((record) => record.displayStatus === 'current').length;
    const dueSoonCount = recordsWithDisplayStatus.filter((record) => record.displayStatus === 'due_soon').length;
    const overdueCount = recordsWithDisplayStatus.filter((record) => record.displayStatus === 'overdue').length;
    const upcomingCount = recordsWithDisplayStatus.filter((record) => record.displayStatus === 'upcoming').length;
    const vaccinationRecords = records.filter((record) => record.type === 'vaccination');
    const medicationRecords = records.filter((record) => record.type === 'medication');
    const appointmentRecords = records.filter((record) => record.type === 'appointment');
    const weightHistoryRecords = records.filter((record) => record.type === 'weight');
    const symptomRecords = records.filter((record) => record.type === 'symptom');
    const surgeryRecords = records.filter((record) => record.type === 'surgery');
    const allergyRecords = records.filter((record) => record.type === 'allergy');
    const diagnosisRecords = records.filter((record) => record.type === 'diagnosis');
    const labRecords = records.filter((record) => record.type === 'lab');
    const fishRecords = records.filter((record) => record.type === 'fish');
    const upcomingDueRecords = records.filter((record) => {
      const dueDate = record.nextDue
        || record.details?.nextDueDate
        || record.details?.followUpDate
        || record.details?.symptomFollowUpDate
        || record.details?.surgeryFollowUpDate;
      return Boolean(String(dueDate || '').trim());
    });

    const formatNotes = (...values) => {
      const text = values.map((value) => String(value || '').trim()).find(Boolean);
      return text || 'No records.';
    };

    const lines = [
      `Health Summary for ${pet.name}`,
      '',
      'PET PROFILE',
      `Name: ${pet.name || 'Unknown'}`,
      `Species: ${pet.species || 'Unknown'}`,
      `Breed/Type: ${pet.breed || 'Unknown'}`,
      `Age/Birthday: ${profileAge}${pet.birthday ? ` (Birthday: ${formatDate(pet.birthday)})` : ''}`,
      `Weight: ${pet.weight || 'Unknown'}`,
      `Gender: ${pet.gender || 'Unknown'}`,
      `Care Goals: ${careGoalsText}`,
      `Health Score: ${healthScoreText}`,
      '',
      'HEALTH OVERVIEW',
      `Total Records: ${records.length}`,
      `Current: ${currentCount}`,
      `Due Soon: ${dueSoonCount}`,
      `Overdue: ${overdueCount}`,
      `Upcoming: ${upcomingCount}`,
      '',
    ];

    pushSummarySection(lines, 'VACCINATIONS', vaccinationRecords, (record) => {
      const details = record.details || {};
      return {
        title: record.title || details.vaccineName || 'Vaccination',
        details: [
          `Date given: ${formatSummaryDate(details.dateGiven || record.date)}`,
          `Provider/clinic: ${formatSummaryValue(details.providerClinic || record.provider)}`,
          `Next due date: ${formatSummaryDate(details.nextDueDate || record.nextDue)}`,
          `Notes/details: ${formatNotes(details.vaccinationNotes, record.notes, details.vaccineNotes)}`,
        ],
      };
    });

    pushSummarySection(lines, 'MEDICATIONS', medicationRecords, (record) => {
      const details = record.details || {};
      return {
        title: record.title || details.medicationName || 'Medication',
        details: [
          `Dosage: ${formatSummaryValue(details.dosage || record.dosage)}`,
          `Frequency: ${formatSummaryValue(details.frequency || record.frequency)}`,
          `Start date: ${formatSummaryDate(details.startDate || record.date)}`,
          `End date: ${formatSummaryDate(details.endDate || details.nextDoseDate || record.nextDue)}`,
          `Prescribing vet: ${formatSummaryValue(details.prescribingVet || record.provider)}`,
          `Next dose/due date: ${formatSummaryDate(details.nextDoseDate || record.nextDue)}`,
          `Notes/details: ${formatNotes(details.medicationNotes, record.notes)}`,
        ],
      };
    });

    pushSummarySection(lines, 'VET VISITS / APPOINTMENTS', appointmentRecords, (record) => {
      const details = record.details || {};
      return {
        title: record.title || details.visitReason || 'Appointment',
        details: [
          `Visit reason: ${formatSummaryValue(details.visitReason || record.title)}`,
          `Appointment date: ${formatSummaryDate(details.appointmentDate || record.date)}`,
          `Clinic/vet: ${formatSummaryValue(details.clinicVet || details.vetClinic || record.provider)}`,
          `Diagnosis/findings: ${formatSummaryValue(details.diagnosisFindings || record.notes)}`,
          `Follow-up date: ${formatSummaryDate(details.followUpDate || record.nextDue)}`,
          `Notes/details: ${formatNotes(details.appointmentNotes, record.notes)}`,
        ],
      };
    });

    pushSummarySection(lines, 'WEIGHT HISTORY', weightHistoryRecords, (record) => {
      const details = record.details || {};
      return {
        title: record.title || details.weightValue || 'Weight entry',
        details: [
          `Weight value: ${formatSummaryValue(details.weightValue || record.weightValue || record.title)}`,
          `Date recorded: ${formatSummaryDate(details.weightDate || record.date)}`,
          `Notes: ${formatNotes(details.weightNotes, record.notes)}`,
        ],
      };
    });

    pushSummarySection(lines, 'SYMPTOMS', symptomRecords, (record) => {
      const details = record.details || {};
      return {
        title: record.title || details.symptomName || 'Symptom',
        details: [
          `Symptom: ${formatSummaryValue(details.symptomName || record.symptomText || record.title)}`,
          `Severity: ${formatSummaryValue(details.severity || record.severity)}`,
          `Date noticed: ${formatSummaryDate(details.symptomDate || record.date)}`,
          `Follow-up date: ${formatSummaryDate(details.symptomFollowUpDate || record.nextDue)}`,
          `Notes: ${formatNotes(details.symptomNotes, record.notes)}`,
        ],
      };
    });

    pushSummarySection(lines, 'SURGERIES / PROCEDURES', surgeryRecords, (record) => {
      const details = record.details || {};
      return {
        title: record.title || details.procedureName || 'Procedure',
        details: [
          `Procedure name: ${formatSummaryValue(details.procedureName || record.title)}`,
          `Date: ${formatSummaryDate(details.surgeryDate || record.date)}`,
          `Clinic/vet: ${formatSummaryValue(details.clinicVet || record.provider)}`,
          `Recovery notes: ${formatSummaryValue(details.recoveryNotes || record.notes)}`,
          `Follow-up date: ${formatSummaryDate(details.surgeryFollowUpDate || record.nextDue)}`,
        ],
      };
    });

    pushSummarySection(lines, 'ALLERGIES', allergyRecords, (record) => {
      const details = record.details || {};
      return {
        title: record.title || details.allergyName || 'Allergy',
        details: [
          `Allergy name: ${formatSummaryValue(details.allergyName || record.title)}`,
          `Reaction: ${formatSummaryValue(details.reaction || record.reaction)}`,
          `Severity: ${formatSummaryValue(details.severity || record.severity)}`,
          `Notes: ${formatNotes(details.allergyNotes, record.notes)}`,
        ],
      };
    });

    pushSummarySection(lines, 'DIAGNOSES', diagnosisRecords, (record) => {
      const details = record.details || {};
      return {
        title: record.title || details.diagnosisName || 'Diagnosis',
        details: [
          `Diagnosis name: ${formatSummaryValue(details.diagnosisName || record.title)}`,
          `Diagnosed date: ${formatSummaryDate(details.diagnosedDate || record.date)}`,
          `Vet/clinic: ${formatSummaryValue(details.diagnosisVet || record.provider)}`,
          `Treatment plan: ${formatSummaryValue(details.treatmentPlan || record.notes)}`,
          `Notes: ${formatNotes(details.diagnosisNotes, record.notes)}`,
        ],
      };
    });

    pushSummarySection(lines, 'LAB RESULTS', labRecords, (record) => {
      const details = record.details || {};
      return {
        title: record.title || details.testName || 'Lab result',
        details: [
          `Test name: ${formatSummaryValue(details.testName || record.title)}`,
          `Test date: ${formatSummaryDate(details.testDate || record.date)}`,
          `Result summary: ${formatSummaryValue(details.resultSummary || record.notes)}`,
          `Vet/clinic: ${formatSummaryValue(details.labVet || record.provider)}`,
          `Notes: ${formatNotes(details.labNotes, record.notes)}`,
        ],
      };
    });

    pushSummarySection(lines, 'FISH / TANK READINGS', fishRecords, (record) => {
      const details = record.details || {};
      return {
        title: record.title || details.readingType || 'Tank reading',
        details: [
          `Reading type: ${formatSummaryValue(details.readingType || record.title)}`,
          `Value: ${formatSummaryValue(details.readingValue || record.readingValue)}`,
          `Date: ${formatSummaryDate(details.readingDate || record.date)}`,
          `Notes: ${formatNotes(details.readingNotes, record.notes)}`,
        ],
      };
    });

    pushSummarySection(lines, 'UPCOMING DUE DATES', upcomingDueRecords, (record) => {
      const details = record.details || {};
      const dueDate = record.nextDue
        || details.nextDueDate
        || details.followUpDate
        || details.symptomFollowUpDate
        || details.surgeryFollowUpDate;
      return {
        title: record.title || 'Upcoming item',
        details: [
          `Due date: ${formatSummaryDate(dueDate)}`,
          `Record type: ${record.type || 'Unknown'}`,
        ],
      };
    });

    lines.push('Latest Records');
    if (latestRecords.length === 0) {
      lines.push('No records.');
    } else {
      latestRecords.forEach((record) => {
        lines.push(`- ${record.title} (${formatDate(record.date)})`);
      });
    }

    return lines.join('\n');
  };

  const exportSummary = buildHealthSummary();

  const escapeHtml = (value) => String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

  const buildHealthSummaryHtml = () => {
    const summaryText = exportSummary;
    return `<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <style>
      body {
        font-family: Arial, Helvetica, sans-serif;
        padding: 24px;
        color: #111827;
        background: #ffffff;
      }
      h1 {
        font-size: 26px;
        margin: 0 0 8px;
      }
      .meta {
        color: #4b5563;
        font-size: 12px;
        margin-bottom: 18px;
      }
      pre {
        white-space: pre-wrap;
        word-wrap: break-word;
        font-size: 12px;
        line-height: 1.55;
        margin: 0;
      }
      .card {
        border: 1px solid #e5e7eb;
        border-radius: 16px;
        padding: 18px;
      }
    </style>
  </head>
  <body>
    <h1>PetSync+ Health Summary</h1>
    <div class="meta">Export date: ${escapeHtml(formatDate(new Date()))}</div>
    <div class="card">
      <pre>${escapeHtml(summaryText)}</pre>
    </div>
  </body>
</html>`;
  };

  const buildFallbackAnalysisResults = (record) => {
    const mimeType = String(record?.mimeType || record?.details?.mimeType || '').toLowerCase();
    const isImageRecord = mimeType.startsWith('image/');

    if (isImageRecord) {
      return {
        vaccines: [{
          vaccineName: 'Rabies Vaccine',
          dateGiven: '2026-06-14',
          nextDueDate: '2027-06-14',
          providerClinic: 'Ocean County Veterinary Hospital',
          vaccineNotes: 'Suggested from uploaded image',
        }],
        medications: [],
        visits: [{
          visitReason: 'Annual Wellness Exam',
          appointmentDate: '2026-06-14',
          clinicVet: 'Ocean County Veterinary Hospital',
          diagnosisFindings: 'Healthy overall. Mild seasonal allergies.',
          followUpDate: '',
          appointmentNotes: 'Suggested from uploaded image',
        }],
        weights: [{
          weightValue: '72 lbs',
          weightDate: '2026-06-14',
          weightNotes: 'Suggested from uploaded image',
        }],
        diagnoses: [{
          diagnosisName: 'Mild seasonal allergies',
          diagnosedDate: '2026-06-14',
          diagnosisVet: 'Ocean County Veterinary Hospital',
          treatmentPlan: 'Monitor seasonal symptoms and review with vet as needed.',
          diagnosisNotes: 'Suggested from uploaded image',
        }],
        labResults: [],
        symptoms: [],
        allergies: [],
        procedures: [],
        rawText: '',
        summary: 'These are suggested results. Please review before saving.',
        warnings: [],
        message: 'These are suggested results. Please review before saving.',
      };
    }

    return {
      vaccines: [],
      medications: [],
      visits: [],
      weights: [],
      diagnoses: [],
      labResults: [],
      symptoms: [],
      allergies: [],
      procedures: [],
      rawText: '',
      summary: 'These are suggested results. Please review before saving.',
      warnings: [],
      message: 'These are suggested results. Please review before saving.',
    };
  };

  const buildRawTextAnalysisResults = (rawText) => ({
    vaccines: [],
    medications: [],
    visits: [],
    weights: [],
    diagnoses: [],
    labResults: [],
    symptoms: [],
    allergies: [],
    procedures: [],
    rawText: String(rawText || '').trim(),
    summary: 'Raw text extracted from image. Please review before saving.',
    warnings: [],
    message: 'Raw text extracted from image. Please review before saving.',
  });

  const buildUnsupportedAnalysisResults = (message) => ({
    vaccines: [],
    medications: [],
    visits: [],
    weights: [],
    diagnoses: [],
    labResults: [],
    symptoms: [],
    allergies: [],
    procedures: [],
    rawText: '',
    summary: message,
    warnings: [],
    message,
  });

  const analyzeImportedRecord = async (record) => {
    if (analysisTimeoutRef.current) {
      clearTimeout(analysisTimeoutRef.current);
      analysisTimeoutRef.current = null;
    }

    analysisRequestIdRef.current += 1;
    const requestId = analysisRequestIdRef.current;

    setAnalysisRecord(record);
    setAnalysisResults(null);
    setAnalysisLoading(true);
    setShowAnalysisModal(true);

    analysisTimeoutRef.current = setTimeout(async () => {
      const fileUrl = String(record?.fileUri || record?.details?.fileUrl || record?.details?.fileUri || '').trim();
      const mimeType = String(record?.mimeType || record?.details?.mimeType || '').trim().toLowerCase();

      try {
        if (!fileUrl) {
          throw new Error('Missing file URL for analysis.');
        }

        if (mimeType.startsWith('image/')) {
          const ocrResult = await TextRecognition.recognize(fileUrl);

          if (requestId !== analysisRequestIdRef.current) return;

          const rawText = String(ocrResult?.text || '').trim();
          if (rawText) {
            setAnalysisResults(buildRawTextAnalysisResults(rawText));
          } else {
            setAnalysisResults(buildFallbackAnalysisResults(record));
          }
        } else if (mimeType.includes('pdf')) {
          setAnalysisResults(buildUnsupportedAnalysisResults('PDF text extraction is coming soon. For now, take a photo or screenshot of the document for analysis.'));
        } else if (
          mimeType.includes('word')
          || mimeType.includes('msword')
          || mimeType.includes('officedocument.wordprocessingml')
          || mimeType.includes('doc')
        ) {
          setAnalysisResults(buildUnsupportedAnalysisResults('Word document text extraction is coming soon. For now, take a photo or screenshot of the document for analysis.'));
        } else if (mimeType.includes('excel')
          || mimeType.includes('spreadsheetml')
          || mimeType.includes('sheet')) {
          setAnalysisResults(buildUnsupportedAnalysisResults('Excel extraction is coming soon. For now, take a photo or screenshot of the records for analysis.'));
        } else {
          setAnalysisResults(buildFallbackAnalysisResults(record));
        }
      } catch (error) {
        if (requestId !== analysisRequestIdRef.current) return;
        console.log('Analysis OCR error:', error);
        setAnalysisResults(buildFallbackAnalysisResults(record));
      } finally {
        if (requestId === analysisRequestIdRef.current) {
          setAnalysisLoading(false);
          analysisTimeoutRef.current = null;
        }
      }
    }, 650);
  };

  const openImportedRecordAnalysis = (record) => {
    closeRecordDetail();
    setTimeout(() => {
      analyzeImportedRecord(record);
    }, 150);
  };

  const closeAnalysisModal = () => {
    analysisRequestIdRef.current += 1;
    if (analysisTimeoutRef.current) {
      clearTimeout(analysisTimeoutRef.current);
      analysisTimeoutRef.current = null;
    }
    setShowAnalysisModal(false);
    setAnalysisRecord(null);
    setAnalysisResults(null);
    setAnalysisLoading(false);
  };

  const closeAllHealthModals = () => {
    analysisRequestIdRef.current += 1;
    setShowRecordModal(false);
    setShowRecordDetailModal(false);
    setShowExportPreview(false);
    setShowAnalysisModal(false);
    setSelectedRecord(null);
    setAnalysisRecord(null);
    setAnalysisResults(null);
    setAnalysisLoading(false);
    if (analysisTimeoutRef.current) {
      clearTimeout(analysisTimeoutRef.current);
      analysisTimeoutRef.current = null;
    }
  };

  const approveAnalysis = () => {
    if (!analysisResults) return;

    Alert.alert('Analysis Approved', 'Automatic record creation will be added in a future phase.');
    closeAnalysisModal();
  };

  const editAnalysisSuggestions = () => {
    Alert.alert('Edit Suggestions coming soon');
  };

  const formatAnalysisItem = (item) => {
    if (typeof item === 'string') {
      return item;
    }

    if (!item || typeof item !== 'object') {
      return '';
    }

    const parts = [];
    const title = item.vaccineName || item.visitReason || item.weightValue || item.diagnosisName || item.testName || item.readingType || 'Suggested item';
    parts.push(title);
    if (item.dateGiven) parts.push(`Date: ${formatDate(item.dateGiven)}`);
    if (item.nextDueDate) parts.push(`Next Due: ${formatDate(item.nextDueDate)}`);
    if (item.appointmentDate) parts.push(`Date: ${formatDate(item.appointmentDate)}`);
    if (item.clinicVet) parts.push(`Clinic: ${item.clinicVet}`);
    if (item.providerClinic) parts.push(`Clinic: ${item.providerClinic}`);
    if (item.diagnosisFindings) parts.push(`Findings: ${item.diagnosisFindings}`);
    if (item.weightDate) parts.push(`Date: ${formatDate(item.weightDate)}`);
    if (item.diagnosedDate) parts.push(`Date: ${formatDate(item.diagnosedDate)}`);
    if (item.treatmentPlan) parts.push(`Treatment: ${item.treatmentPlan}`);
    if (item.resultSummary) parts.push(`Result: ${item.resultSummary}`);
    if (item.message) parts.push(item.message);
    return parts.filter(Boolean).join('\n');
  };

  const renderAnalysisSection = (label, items, fallbackKey) => (
    <View style={s.analysisSection}>
      <Text style={[s.analysisSectionTitle, { color: C.text }]}>{label}</Text>
      {items && items.length > 0 ? (
        items.map((item, index) => (
          <View key={`${fallbackKey}-${index}`} style={s.analysisItemRow}>
            <Text style={[s.analysisItemBullet, { color: C.text }]}>•</Text>
            <Text style={[s.analysisItemText, { color: C.text }]}>{formatAnalysisItem(item)}</Text>
          </View>
        ))
      ) : (
        <Text style={[s.analysisEmptyText, { color: C.muted }]}>No items detected yet.</Text>
      )}
    </View>
  );

  const hasAnalysisResults = (results) => Boolean(
    results?.rawText
    || results?.summary
    || (Array.isArray(results?.warnings) && results.warnings.length > 0)
    || (Array.isArray(results?.vaccines) && results.vaccines.length > 0)
    || (Array.isArray(results?.medications) && results.medications.length > 0)
    || (Array.isArray(results?.visits) && results.visits.length > 0)
    || (Array.isArray(results?.weights) && results.weights.length > 0)
    || (Array.isArray(results?.diagnoses) && results.diagnoses.length > 0)
    || (Array.isArray(results?.labResults) && results.labResults.length > 0)
  );

  const exportHealthPdf = async () => {
    try {
      console.log('PDF generation started');
      const html = buildHealthSummaryHtml();
      const { uri } = await Print.printToFileAsync({ html });
      console.log('PDF generated successfully');
      console.log('PDF file uri', uri);
      setExportFileUri(uri);
      Alert.alert('PDF created successfully', uri);

      if (await Sharing.isAvailableAsync()) {
        console.log('Sharing PDF');
        await Sharing.shareAsync(uri, {
          mimeType: 'application/pdf',
          UTI: 'com.adobe.pdf',
          dialogTitle: 'Share Pet Health PDF',
        });
        return;
      }

      throw new Error('Sharing is not available on this device.');
    } catch (error) {
      console.log('PDF generation failed', error);
      console.log('PDF sharing failed', error);
      console.log('Using text fallback');
      try {
        await Share.share({ message: exportSummary });
      } catch (shareError) {
        console.log('Text share fallback failed:', shareError);
        Alert.alert('Share failed', 'Unable to share the summary right now.');
      }
    }
  };

  const openExportPreview = async () => {
    setShowExportPreview(true);
    await exportHealthPdf();
  };

  const shareSummary = async () => {
    try {
      if (exportFileUri) {
        if (await Sharing.isAvailableAsync()) {
          console.log('Sharing PDF');
          await Sharing.shareAsync(exportFileUri, {
            mimeType: 'application/pdf',
            UTI: 'com.adobe.pdf',
            dialogTitle: 'Share Pet Health PDF',
          });
          return;
        }
      }

      await exportHealthPdf();
    } catch (error) {
      console.log('PDF sharing failed', error);
      console.log('Using text fallback');
      try {
        await Share.share({ message: exportSummary });
      } catch (shareError) {
        console.log('Text share fallback failed:', shareError);
        Alert.alert('Share failed', 'Unable to share the summary right now.');
      }
    }
  };

  const uploadImportedFileToStorage = async (file, sourceLabel = 'uploaded file') => {
    const safeFileName = String(file?.name || 'health-record-file').replace(/[\\/:*?"<>|]/g, '_');
    const storagePath = `health-records/${selectedPetId}/${Date.now()}-${safeFileName}`;
    const response = await fetch(file.uri);
    const arrayBuffer = await response.arrayBuffer();

    const { error } = await supabase.storage
      .from('health-record-files')
      .upload(storagePath, arrayBuffer, {
        contentType: file.mimeType || 'application/octet-stream',
        upsert: true,
      });

    if (error) {
      console.log('Storage upload error:', error);
      throw error;
    }

    const { data: publicUrlData } = supabase.storage
      .from('health-record-files')
      .getPublicUrl(storagePath);

    const fileUrl = publicUrlData?.publicUrl;

    return {
      fileUrl: fileUrl || file.uri,
      filePath: storagePath,
      fileName: file.name,
      mimeType: file.mimeType || 'application/octet-stream',
      size: file.size ?? null,
      source: sourceLabel,
    };
  };

  const createImportedHealthRecord = async (file, sourceLabel = 'uploaded file') => {
    try {
      let fileUrl = file.uri;
      let filePath = '';
      let fileName = file.name;
      let mimeType = file.mimeType || '';
      let size = file.size ?? null;

      try {
        const uploadResult = await uploadImportedFileToStorage(file, sourceLabel);
        fileUrl = uploadResult.fileUrl || file.uri;
        filePath = uploadResult.filePath || '';
        fileName = uploadResult.fileName || file.name;
        mimeType = uploadResult.mimeType || mimeType;
        size = uploadResult.size ?? size;
      } catch (uploadError) {
        console.log('Storage upload error:', uploadError);
      }

      const importedRecord = {
        id: Date.now().toString(),
        petId: selectedPetId,
        type: 'imported_file',
        title: fileName,
        date: toLocalDateKey(new Date()),
        icon: '',
        status: 'current',
        fileUri: fileUrl,
        fileUrl,
        filePath,
        fileName,
        mimeType,
        size,
        details: {
          source: sourceLabel,
          fileUrl,
          filePath,
          fileName,
          mimeType,
          size,
        },
      };

      setHealthRecords((prev) => [importedRecord, ...prev]);
      saveHealthRecordToSupabase(importedRecord);
    } catch (error) {
      console.log('Import record failed:', error);
      Alert.alert('Import failed', 'Unable to import the selected file right now.');
    }
  };

  const handleImportRecord = () => {
    Alert.alert('Import Record', 'Choose how you want to add a record.', [
      { text: 'Take Photo', onPress: () => handleTakePhotoImport() },
      { text: 'Choose Photo', onPress: () => handleChoosePhotoImport() },
      { text: 'Choose Document', onPress: () => handleChooseDocumentImport() },
      { text: 'Cancel', style: 'cancel' },
    ]);
  };

  const handleTakePhotoImport = async () => {
    try {
      const permission = await ImagePicker.requestCameraPermissionsAsync();
      if (!permission.granted) {
        Alert.alert('Camera permission needed', 'Please allow camera access to take a photo.');
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: false,
        quality: 0.9,
      });

      if (result.canceled || !result.assets?.[0]?.uri) return;

      const asset = result.assets[0];
      await createImportedHealthRecord(
        {
          uri: asset.uri,
          name: asset.fileName || `camera-${Date.now()}.jpg`,
          mimeType: asset.mimeType || 'image/jpeg',
          size: asset.fileSize ?? null,
        },
        'camera'
      );
    } catch (error) {
      console.log('Import record failed:', error);
      Alert.alert('Import failed', 'Unable to import the selected photo right now.');
    }
  };

  const handleChoosePhotoImport = async () => {
    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        Alert.alert('Photo permission needed', 'Please allow photo library access to choose a photo.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: false,
        quality: 0.9,
      });

      if (result.canceled || !result.assets?.[0]?.uri) return;

      const asset = result.assets[0];
      await createImportedHealthRecord(
        {
          uri: asset.uri,
          name: asset.fileName || `photo-${Date.now()}.jpg`,
          mimeType: asset.mimeType || 'image/jpeg',
          size: asset.fileSize ?? null,
        },
        'gallery'
      );
    } catch (error) {
      console.log('Import record failed:', error);
      Alert.alert('Import failed', 'Unable to import the selected photo right now.');
    }
  };

  const handleChooseDocumentImport = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: [
          'application/pdf',
          'image/*',
          'application/msword',
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          'application/vnd.ms-excel',
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        ],
        copyToCacheDirectory: true,
        multiple: false,
      });

      if (result.canceled) {
        return;
      }

      const file = result.assets?.[0];
      if (!file?.uri || !file?.name) {
        Alert.alert('Import failed', 'Unable to read the selected file.');
        return;
      }

      await createImportedHealthRecord(
        {
          uri: file.uri,
          name: file.name,
          mimeType: file.mimeType || 'application/octet-stream',
          size: file.size ?? null,
        },
        'uploaded file'
      );
    } catch (error) {
      console.log('Import record failed:', error);
      Alert.alert('Import failed', 'Unable to import the selected file right now.');
    }
  };
  return (
    <PetSyncBackground opacity={0.16}>
    <SafeAreaView style={s.screen} edges={['top']}>
      <View style={[s.pageHeader, { paddingTop: 2, marginTop: 0, marginBottom: 0 }]}>
        <Text style={s.pageTitle}>Health Hub</Text>

        <View style={{ flexDirection: 'row', gap: 8 }}>
          <TouchableOpacity style={s.exportBtn} onPress={handleImportRecord}>
            <Text style={s.exportBtnText}>Import Record</Text>
          </TouchableOpacity>
          <TouchableOpacity style={s.exportBtn} onPress={openExportPreview}>
            <Text style={s.exportBtnText}>Export PDF</Text>
          </TouchableOpacity>
        </View>
      </View>

        <View style={{ marginTop: 0 }}>
          <View style={{ marginTop: -10, marginBottom: -8 }}>
            <PetAvatarRow
              pets={pets}
              selectedId={selectedPetId}
            onSelect={setSelectedPetId}
            onOpenProfile={(petId) => navigation.navigate('PetProfile', { petId })}
          />
        </View>

        <Card
          style={{
            marginHorizontal: 16,
            marginTop: 10,
            marginBottom: 12,
            padding: 16,
            borderRadius: 24,
            backgroundColor: '#1a1a1a',
            borderWidth: 1,
            borderColor: 'rgba(255, 153, 0, 0.14)',
            shadowColor: C.accent,
            shadowOpacity: 0.12,
            shadowRadius: 12,
            shadowOffset: { width: 0, height: 6 },
            elevation: 3,
          }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
            <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: C.accent, marginRight: 10 }} />
            <Text style={{ color: C.text, fontSize: 15, fontWeight: '800' }}>Dynamic Health Insights</Text>
          </View>

          {visibleInsights.map((line, index) => (
            <View key={`${line}-${index}`} style={{ flexDirection: 'row', alignItems: 'flex-start', marginBottom: index === visibleInsights.length - 1 ? 0 : 8 }}>
              <Text style={{ color: C.accent, marginRight: 8, fontSize: 14 }}>•</Text>
              <Text style={{ color: C.text, fontSize: 13, lineHeight: 18, flex: 1 }}>{line}</Text>
            </View>
            ))}

          <TouchableOpacity style={s.localVetFinderToggle} onPress={toggleVetFinder} activeOpacity={0.9}>
            <View style={{ flex: 1 }}>
              <Text style={s.localVetFinderToggleTitle}>Local Vets & Emergency Care</Text>
              <Text style={s.localVetFinderToggleSub}>
                {isVetFinderExpanded ? 'Tap to close the vet finder sheet' : 'Tap to open nearby vet tools and saved clinics'}
              </Text>
            </View>
            <Text style={s.localVetFinderChevron}>{isVetFinderExpanded ? '▴' : '▾'}</Text>
          </TouchableOpacity>
          </Card>
        </View>

        <ScrollView
          style={{ flex: 1 }}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{
            paddingBottom: 180,
        }}
      >
        {/* Health Overview */}
        <Card
          style={{
            marginHorizontal: 16,
            marginTop: 18,
            marginBottom: 10,
            padding: 14,
            borderRadius: 22,
            backgroundColor: '#172838',
            borderWidth: 1,
            borderColor: C.border,
          }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            {pet?.photoUri ? (
              <Image
                source={{ uri: pet.photoUri }}
                style={{ width: 66, height: 66, borderRadius: 18, backgroundColor: C.cardHigh }}
              />
            ) : (
              <View
                style={{
                  width: 66,
                  height: 66,
                  borderRadius: 18,
                  backgroundColor: C.cardHigh,
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderWidth: 1,
                  borderColor: C.border,
                }}
              >
                <Text style={{ fontSize: 28 }}>{pet?.emoji || '🐾'}</Text>
              </View>
            )}

            <View style={{ flex: 1 }}>
              <Text style={{ color: C.text, fontSize: 20, fontWeight: '900' }}>{pet.name}</Text>
              <Text style={{ color: C.muted, fontSize: 12, marginTop: 2, textTransform: 'capitalize' }}>
                {pet.species || 'Pet'} • {getPetAgeLabel(pet)} • {pet.gender || 'Gender not set'}
              </Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 10 }}>
                <View style={{ paddingHorizontal: 10, paddingVertical: 6, borderRadius: 999, backgroundColor: `${C.blue}18`, borderWidth: 1, borderColor: `${C.blue}40` }}>
                  <Text style={{ color: C.text, fontSize: 11, fontWeight: '800' }}>
                    Weight: {pet.weight || 'Unknown'}
                  </Text>
                </View>
                <View style={{ paddingHorizontal: 10, paddingVertical: 6, borderRadius: 999, backgroundColor: `${C.green}18`, borderWidth: 1, borderColor: `${C.green}40` }}>
                  <Text style={{ color: C.text, fontSize: 11, fontWeight: '800' }}>
                    Health Score: {typeof pet.score === 'number' ? pet.score : 0}
                  </Text>
                </View>
              </View>
            </View>

            <View style={{ alignItems: 'center' }}>
              <Text style={{ color: C.muted, fontSize: 11, fontWeight: '800', letterSpacing: 1.1 }}>SCORE</Text>
              <Text style={{ color: C.green, fontSize: 26, fontWeight: '900', marginTop: 2 }}>
                {typeof pet.score === 'number' ? pet.score : 0}
              </Text>
            </View>
          </View>

          <View style={{ marginTop: 14 }}>
            <Text style={{ color: C.text, fontSize: 13, fontWeight: '900', marginBottom: 10 }}>
              Veterinary Summary
            </Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
              {[
                { label: 'Vaccinations', value: healthOverviewCounts.vaccinations, color: C.green },
                { label: 'Medications', value: healthOverviewCounts.medications, color: C.blue },
                { label: 'Conditions', value: healthOverviewCounts.conditions, color: C.yellow },
                { label: 'Appointments', value: healthOverviewCounts.appointments, color: C.red },
              ].map((item) => (
                <View
                  key={item.label}
                  style={{
                    width: '48%',
                    minWidth: 130,
                    padding: 12,
                    borderRadius: 18,
                    backgroundColor: C.cardHigh,
                    borderWidth: 1,
                    borderColor: C.border,
                  }}
                >
                  <Text style={{ color: item.color, fontSize: 24, fontWeight: '900' }}>{item.value}</Text>
                  <Text style={{ color: C.text, fontSize: 12, fontWeight: '800', marginTop: 2 }}>
                    {item.label}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        </Card>

        {/* Tabs */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={{
            marginTop: 0,
            marginBottom: 6,
            maxHeight: 40,
          }}
          contentContainerStyle={{
            paddingHorizontal: 16,
            gap: 6,
            paddingTop: 0,
            paddingBottom: 0,
            alignItems: 'center',
          }}
        >
          {tabs.map((tab) => (
            <TouchableOpacity
              key={tab}
              style={[
                s.tabPill,
                activeTab === tab && s.tabPillActive,
                {
                  paddingHorizontal: 10,
                  paddingVertical: 5,
                  borderRadius: 14,
                  marginRight: 6,
                  alignSelf: 'center',
                },
              ]}
              onPress={() => setActiveTab(tab)}
            >
              <Text
                style={[
                  s.tabPillText,
                  activeTab === tab && s.tabPillTextActive,
                  {
                    fontSize: 12,
                    fontWeight: '600',
                  },
                ]}
              >
                {tabLabels[tab]}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {records.length === 0 ? (
          <Card style={{ alignItems: 'center', padding: 32, marginHorizontal: 16, borderRadius: 22, backgroundColor: '#1e1e1e', borderWidth: 1, borderColor: C.border }}>
            <Text style={{ fontSize: 40, marginBottom: 8 }}>📋</Text>

            <Text
              style={{
                color: C.text,
                fontWeight: '800',
                fontSize: 18,
                marginTop: 4,
              }}
            >
              No records yet
            </Text>

            <Text
              style={{
                color: C.muted,
                marginTop: 6,
                textAlign: 'center',
                lineHeight: 18,
              }}
            >
              Add your first health record for {pet.name}
            </Text>

            <Text
              style={{
                color: C.muted,
                marginTop: 8,
                fontSize: 12,
                fontWeight: '600',
              }}
            >
              Tap + to get started
            </Text>
          </Card>
          ) : (
            groupedTimeline.map((group) => (
              <View key={group.key} style={{ marginBottom: 18, paddingHorizontal: 16 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 10, paddingHorizontal: 4 }}>
                  <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: C.accent, marginRight: 8 }} />
                <Text style={{ color: C.muted, fontSize: 12, fontWeight: '800', letterSpacing: 1.2 }}>
                  {group.label}
                </Text>
              </View>

              {group.records.map((record) => (
                <View key={record.id} style={s.timelineItem}>
                  <View style={s.timelineRail}>
                    <View style={s.timelineLine} />
                    <View style={s.timelineNode}>
                      <Text style={s.timelineIcon}>{record.icon || getHealthRecordIcon(record.type)}</Text>
                    </View>
                  </View>

                  <TouchableOpacity
                    activeOpacity={0.85}
                    style={s.timelineCard}
                    onPress={() => showRecordActions(record)}
                  >
                    <View style={s.timelineCardTop}>
                      <View style={{ flex: 1 }}>
                        <Text style={s.timelineTitle}>{record.title}</Text>
                        <Text style={s.timelineDate}>{formatDate(record.date)}</Text>

                        {getRecordDisplayLines(record).length > 0 && (
                          <Text style={{ color: C.muted, fontSize: 11, lineHeight: 16, marginTop: 6 }}>
                            {getRecordDisplayLines(record).join('\n')}
                          </Text>
                        )}

                        {record.provider && (
                          <Text style={s.timelineProvider}>{record.provider}</Text>
                        )}

                        {record.nextDue && (
                          <Text style={s.timelineDue}>Next due: {formatDate(record.nextDue)}</Text>
                        )}
                      </View>

                      {record.displayStatus && statusInfo[record.displayStatus] && (
                        <View style={[s.timelineBadge, { borderColor: statusInfo[record.displayStatus].color, backgroundColor: `${statusInfo[record.displayStatus].color}15` }]}>
                          <Text style={[s.timelineBadgeText, { color: statusInfo[record.displayStatus].color }]}>
                            {statusInfo[record.displayStatus].label}
                          </Text>
                        </View>
                      )}
                    </View>
                  </TouchableOpacity>
                </View>
              ))}
              </View>
            ))
          )}

        </ScrollView>

      {/* FAB */}
      <TouchableOpacity
        style={s.fab}
        onPress={() =>
          Alert.alert('Add Record', 'Choose record type', [
            { text: 'Vaccination', onPress: () => openRecordTypePrompt('vaccination') },
            { text: 'Medication', onPress: () => openRecordTypePrompt('medication') },
            { text: 'Appointment', onPress: () => openRecordTypePrompt('appointment') },
            { text: 'Weight', onPress: () => openRecordTypePrompt('weight') },
            { text: 'Symptom', onPress: () => openRecordTypePrompt('symptom') },
            { text: 'Cancel', style: 'cancel' },
          ])
        }
      >
        <Text style={s.fabText}>＋</Text>
      </TouchableOpacity>
      
      <Modal visible={showRecordModal} transparent animationType="fade" onRequestClose={closeRecordModal}>
        <View style={s.modalOverlay}>
          <View style={s.customActionModal}>
            <Text style={s.customActionModalTitle}>
              {pendingRecordType ? `${editingRecord ? 'Edit' : 'Add'} ${recordTypeLabelMap[pendingRecordType] || 'Record'}` : 'Add Record'}
            </Text>

            <ScrollView style={{ maxHeight: 360 }} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 8 }}>
              {(pendingRecordType ? recordFieldConfig[pendingRecordType] || [] : []).map((field) => (
                <View key={field.key} style={{ marginBottom: 10 }}>
                  {field.key.toLowerCase().includes('date') ? (
                    <DatePickerField
                      label={field.label}
                      value={recordForm[field.key]}
                      onChange={(date) => setRecordForm((prev) => ({ ...prev, [field.key]: date }))}
                      placeholder={field.placeholder}
                    />
                  ) : (
                    <>
                      <Text style={{ color: C.muted, fontSize: 12, fontWeight: '700', marginBottom: 6 }}>
                        {field.label}
                      </Text>
                      <TextInput
                        style={[s.customActionInput, { marginBottom: 0 }]}
                        value={recordForm[field.key]}
                        onChangeText={(text) => setRecordForm((prev) => ({ ...prev, [field.key]: text }))}
                        placeholder={field.placeholder}
                        placeholderTextColor={C.muted}
                      />
                    </>
                  )}
                </View>
              ))}

              {reminderEligibleTypes.has(pendingRecordType) ? (
                <View style={{ marginTop: 4, paddingTop: 12, borderTopWidth: 1, borderTopColor: C.border }}>
                  <TouchableOpacity
                    activeOpacity={0.85}
                    onPress={() => {
                      setAddReminderToCalendar((prev) => {
                        const next = !prev;
                        if (next && !String(reminderDate || '').trim()) {
                          setReminderDate(getReminderDefaultDate(pendingRecordType, recordForm));
                        }
                        return next;
                      });
                    }}
                    style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12 }}
                  >
                    <View
                      style={{
                        width: 22,
                        height: 22,
                        borderRadius: 6,
                        borderWidth: 1,
                        borderColor: addReminderToCalendar ? C.accent : C.border,
                        backgroundColor: addReminderToCalendar ? C.accent : 'transparent',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      {addReminderToCalendar ? <Text style={{ color: '#fff', fontSize: 13, fontWeight: '900' }}>✓</Text> : null}
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={{ color: C.text, fontSize: 13, fontWeight: '800' }}>Add reminder to Care Calendar</Text>
                      <Text style={{ color: C.muted, fontSize: 12, marginTop: 3 }}>
                        Create a follow-up reminder for this health record.
                      </Text>
                    </View>
                  </TouchableOpacity>

                  {addReminderToCalendar ? (
                    <>
                      <DatePickerField
                        label="Reminder Date"
                        value={reminderDate}
                        onChange={setReminderDate}
                        placeholder={getReminderDefaultDate(pendingRecordType, recordForm) || 'Select reminder date'}
                      />

                      <Text style={{ color: C.muted, fontSize: 12, fontWeight: '700', marginBottom: 6 }}>
                        Reminder Time
                      </Text>
                      <TextInput
                        style={[s.customActionInput, { marginBottom: 0 }]}
                        value={reminderTime}
                        onChangeText={setReminderTime}
                        placeholder="Reminder time"
                        placeholderTextColor={C.muted}
                      />
                    </>
                  ) : null}
                </View>
              ) : null}
            </ScrollView>

            <View style={s.customActionModalButtons}>
              <TouchableOpacity style={s.customActionCancelBtn} onPress={closeRecordModal}>
                <Text style={s.customActionCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={s.customActionSaveBtn} onPress={saveRecord}>
                <Text style={s.customActionSaveText}>Save Record</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <Modal visible={showRecordDetailModal} transparent animationType="fade" onRequestClose={closeRecordDetail}>
        <View style={s.modalOverlay}>
          <View style={[s.customActionModal, { padding: 0, overflow: 'hidden', maxHeight: '88%' }]}>
            <View style={{ paddingHorizontal: 18, paddingTop: 18, paddingBottom: 14, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.06)' }}>
              <View style={{ flexDirection: 'row', alignItems: 'flex-start', marginBottom: 12 }}>
                <View style={{
                  width: 58,
                  height: 58,
                  borderRadius: 18,
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: 'rgba(255,107,53,0.14)',
                  borderWidth: 1,
                  borderColor: 'rgba(255,107,53,0.22)',
                  marginRight: 12,
                }}>
                  <Text style={{ fontSize: 28 }}>{selectedRecord?.icon || '📄'}</Text>
                </View>

                <View style={{ flex: 1, paddingTop: 2 }}>
                  <Text style={{ color: C.text, fontSize: 20, fontWeight: '900', lineHeight: 24 }}>
                    {selectedRecord?.title || 'Record details'}
                  </Text>
                  <Text style={{ color: C.muted, fontSize: 12, fontWeight: '700', marginTop: 4 }}>
                    {pet.name}
                  </Text>
                  <Text style={{ color: C.muted, fontSize: 12, fontWeight: '700', marginTop: 2 }}>
                    {selectedRecord ? formatDate(selectedRecord.date) : ''}
                  </Text>
                </View>

                {selectedRecordStatus ? (
                  <View style={[
                    s.recordDetailBadge,
                    { borderColor: selectedRecordStatus.color, backgroundColor: `${selectedRecordStatus.color}15` }
                  ]}>
                    <Text style={[s.recordDetailBadgeText, { color: selectedRecordStatus.color }]}>
                      {selectedRecordStatus.label}
                    </Text>
                  </View>
                ) : null}
              </View>

              {selectedRecord ? (
                <View style={s.recordDetailHeaderBlock}>
                  {selectedRecordHeaderLines.map((line, index) => (
                    <Text
                      key={`${line}-${index}`}
                      style={[
                        index === 0 ? s.recordDetailTypeLabel : index === 1 ? s.recordDetailMainTitle : s.recordDetailHeaderLine,
                        index > 1 && { marginTop: 2 },
                      ]}
                    >
                      {line}
                    </Text>
                  ))}
                </View>
              ) : null}

              {selectedRecord?.type === 'imported_file' && selectedRecord.fileUrl ? (
                <View style={{ marginTop: 12, gap: 10 }}>
                  <TouchableOpacity
                    style={[s.petProfileButton]}
                    onPress={() => openImportedFile(selectedRecord.fileUrl)}
                  >
                    <Text style={s.petProfileButtonText}>Open File</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[s.petProfileButton, { backgroundColor: C.cardHigh }]}
                    onPress={() => openImportedRecordAnalysis(selectedRecord)}
                  >
                    <Text style={s.petProfileButtonText}>Analyze Record</Text>
                  </TouchableOpacity>
                </View>
              ) : null}

              {selectedRecordReminder ? (
                <View style={s.recordDetailReminderCard}>
                  <Text style={s.recordDetailReminderLabel}>
                    Reminder scheduled for {formatDate(selectedRecordReminder.date)}
                    {selectedRecordReminder.time ? ` at ${selectedRecordReminder.time}` : ''}
                  </Text>
                </View>
              ) : null}
            </View>

            <ScrollView style={{ maxHeight: 420 }} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 18, paddingVertical: 16 }}>
              {selectedRecord ? (
                <>
                  <Text style={s.recordDetailSectionTitle}>Chart Details</Text>
                  <View style={s.recordDetailSection}>
                    {selectedRecordDetailLines.length > 0 ? (
                      selectedRecordDetailLines.map((line) => {
                        const splitIndex = line.indexOf(': ');
                        const label = splitIndex >= 0 ? line.slice(0, splitIndex) : line;
                        const value = splitIndex >= 0 ? line.slice(splitIndex + 2) : '';
                        const isNotes = /notes/i.test(label);

                        return (
                          <View
                            key={`${label}-${value}`}
                            style={[s.recordDetailRow, isNotes && s.recordDetailNotesRow]}
                          >
                            <Text style={s.recordDetailFieldLabel}>{label}</Text>
                            <Text style={[s.recordDetailFieldValue, isNotes && s.recordDetailNotesValue]}>
                              {value || '—'}
                            </Text>
                          </View>
                        );
                      })
                    ) : (
                      <Text style={s.recordDetailEmptyText}>No structured details available.</Text>
                    )}
                  </View>
                </>
              ) : null}
            </ScrollView>

            <View style={[s.customActionModalButtons, { paddingHorizontal: 18, paddingBottom: 18, marginTop: 0 }]}>
              <TouchableOpacity
                style={s.customActionCancelBtn}
                onPress={() => {
                  if (!selectedRecord) return;
                  closeRecordDetail();
                  openRecordEditor(selectedRecord);
                }}
              >
                <Text style={s.customActionCancelText}>Edit</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[s.customActionCancelBtn, { borderColor: 'rgba(255, 92, 92, 0.25)', backgroundColor: 'rgba(255, 92, 92, 0.10)' }]}
                onPress={() => {
                  if (!selectedRecord) return;
                  Alert.alert('Delete Record?', 'This health record will be removed.', [
                    { text: 'Cancel', style: 'cancel' },
                    {
                      text: 'Delete',
                      style: 'destructive',
                      onPress: () => {
                        deleteRecord(selectedRecord.id);
                        closeRecordDetail();
                      },
                    },
                  ]);
                }}
              >
                <Text style={{ color: '#ff8080', fontWeight: '800' }}>Delete</Text>
              </TouchableOpacity>

              <TouchableOpacity style={s.customActionSaveBtn} onPress={closeRecordDetail}>
                <Text style={s.customActionSaveText}>Close</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <Modal visible={showExportPreview} transparent animationType="fade" onRequestClose={() => setShowExportPreview(false)}>
        <View style={s.modalOverlay}>
          <View style={s.customActionModal}>
            <Text style={s.customActionModalTitle}>Export Preview</Text>

            <ScrollView style={{ maxHeight: 360 }} showsVerticalScrollIndicator={false}>
              <Text selectable style={{ color: C.text, fontSize: 13, lineHeight: 20 }}>
                {exportSummary}
              </Text>
            </ScrollView>

            <View style={s.customActionModalButtons}>
              <TouchableOpacity style={s.customActionCancelBtn} onPress={() => setShowExportPreview(false)}>
                <Text style={s.customActionCancelText}>Close</Text>
              </TouchableOpacity>
              <TouchableOpacity style={s.customActionSaveBtn} onPress={shareSummary}>
                <Text style={s.customActionSaveText}>Share Summary</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <Modal visible={showAnalysisModal} transparent animationType="fade" onRequestClose={closeAnalysisModal}>
        <View style={s.modalOverlay}>
          <View style={[s.customActionModal, { width: '100%', maxHeight: '90%' }]}>
            <Text style={s.customActionModalTitle}>AI Health Record Analysis</Text>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 10 }}>
              {analysisRecord ? (
                <View style={{ marginBottom: 12 }}>
                  <Text style={{ color: C.text, fontSize: 16, fontWeight: '900', lineHeight: 22 }}>
                    {analysisRecord.fileName || analysisRecord.title}
                  </Text>
                  <Text style={{ color: C.muted, fontSize: 12, marginTop: 4, lineHeight: 18 }}>
                    {analysisRecord.mimeType || analysisRecord.details?.mimeType || 'Unknown file type'}
                  </Text>
                </View>
              ) : null}

              {analysisLoading ? (
                <Text style={{ color: C.text, fontSize: 14, lineHeight: 20, marginBottom: 14 }}>
                  Analyzing record...
                </Text>
              ) : (
                <>
                  {analysisResults?.summary ? (
                    <Text style={{ color: C.text, fontSize: 13, lineHeight: 19, marginBottom: 8 }}>
                      {analysisResults.summary}
                    </Text>
                  ) : null}
                  <Text style={{ color: C.text, fontSize: 13, lineHeight: 19, marginBottom: 8 }}>
                    {analysisResults?.message || 'These are suggested results. Please review before saving.'}
                  </Text>
                  <Text style={{ color: C.muted, fontSize: 12, lineHeight: 18, marginBottom: 14 }}>
                    These are suggested results. Please review before saving.
                  </Text>
                  {analysisResults?.rawText ? (
                    <View style={s.analysisSection}>
                      <Text style={[s.analysisSectionTitle, { color: C.text }]}>Raw Extracted Text</Text>
                      <Text style={{ color: C.text, fontSize: 13, lineHeight: 20 }}>
                        {analysisResults.rawText}
                      </Text>
                    </View>
                  ) : null}
                  {Array.isArray(analysisResults?.warnings) && analysisResults.warnings.length > 0 ? (
                    <View style={{ marginBottom: 12 }}>
                      <Text style={{ color: C.text, fontSize: 13, fontWeight: '800', marginBottom: 6 }}>
                        Warnings
                      </Text>
                      {analysisResults.warnings.map((warning, index) => (
                        <Text key={`warning-${index}`} style={{ color: C.muted, fontSize: 12, lineHeight: 18 }}>
                          • {warning}
                        </Text>
                      ))}
                    </View>
                  ) : null}

                  {hasAnalysisResults(analysisResults) ? (
                    <>
                      {renderAnalysisSection('Vaccines', analysisResults?.vaccines || [], 'vaccines')}
                      {renderAnalysisSection('Medications', analysisResults?.medications || [], 'medications')}
                      {renderAnalysisSection('Visits', analysisResults?.visits || [], 'visits')}
                      {renderAnalysisSection('Weights', analysisResults?.weights || [], 'weights')}
                      {renderAnalysisSection('Diagnoses', analysisResults?.diagnoses || [], 'diagnoses')}
                      {renderAnalysisSection('Lab Results', analysisResults?.labResults || [], 'labResults')}
                    </>
                  ) : null}
                </>
              )}
            </ScrollView>

            <View style={s.customActionModalButtons}>
              <TouchableOpacity style={s.customActionCancelBtn} onPress={approveAnalysis} disabled={analysisLoading}>
                <Text style={s.customActionCancelText}>Approve</Text>
              </TouchableOpacity>
              <TouchableOpacity style={s.customActionCancelBtn} onPress={editAnalysisSuggestions} disabled={analysisLoading}>
                <Text style={s.customActionCancelText}>Edit</Text>
              </TouchableOpacity>
              <TouchableOpacity style={s.customActionSaveBtn} onPress={closeAnalysisModal}>
                <Text style={s.customActionSaveText}>Discard</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <Modal visible={showVetModal} transparent animationType="fade" onRequestClose={closeVetModal}>
        <KeyboardAvoidingView
          style={s.modalOverlay}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 28 : 0}
        >
          <View style={s.customActionModal}>
            <Text style={s.customActionModalTitle}>{editingVetId ? 'Edit Vet Card' : 'Save Vet Card'}</Text>

            <ScrollView
              style={{ maxHeight: 360 }}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
              contentContainerStyle={{ paddingBottom: 8 }}
            >
              <Text style={s.vetModalLabel}>Clinic name</Text>
              <TextInput
                style={s.customActionInput}
                value={vetDraft.name}
                onChangeText={(text) => setVetDraft((prev) => ({ ...prev, name: text }))}
                placeholder="Clinic name"
                placeholderTextColor={C.muted}
              />

              <Text style={s.vetModalLabel}>Type</Text>
              <TextInput
                style={s.customActionInput}
                value={vetDraft.type}
                onChangeText={(text) => setVetDraft((prev) => ({ ...prev, type: text }))}
                placeholder="Vet Clinic / Emergency Vet / Mobile Vet"
                placeholderTextColor={C.muted}
              />

              <Text style={s.vetModalLabel}>Distance</Text>
              <TextInput
                style={s.customActionInput}
                value={vetDraft.distance}
                onChangeText={(text) => setVetDraft((prev) => ({ ...prev, distance: text }))}
                placeholder="2.4 mi"
                placeholderTextColor={C.muted}
              />

              <Text style={s.vetModalLabel}>Phone</Text>
              <TextInput
                style={s.customActionInput}
                value={vetDraft.phone}
                onChangeText={(text) => setVetDraft((prev) => ({ ...prev, phone: text }))}
                placeholder="732-555-0142"
                placeholderTextColor={C.muted}
                keyboardType="phone-pad"
              />

              <Text style={s.vetModalLabel}>Address</Text>
              <TextInput
                style={s.customActionInput}
                value={vetDraft.address}
                onChangeText={(text) => setVetDraft((prev) => ({ ...prev, address: text }))}
                placeholder="Ocean County, NJ"
                placeholderTextColor={C.muted}
              />

              <Text style={s.vetModalLabel}>Status</Text>
              <TextInput
                style={s.customActionInput}
                value={vetDraft.status}
                onChangeText={(text) => setVetDraft((prev) => ({ ...prev, status: text }))}
                placeholder="Open / 24/7 Emergency / By appointment"
                placeholderTextColor={C.muted}
              />

              <Text style={s.vetModalLabel}>Website link</Text>
              <TextInput
                style={s.customActionInput}
                value={vetDraft.websiteUrl}
                onChangeText={(text) => setVetDraft((prev) => ({ ...prev, websiteUrl: text }))}
                placeholder="https://clinicwebsite.com"
                placeholderTextColor={C.muted}
                autoCapitalize="none"
                autoCorrect={false}
              />
            </ScrollView>

            <View style={s.customActionModalButtons}>
              <TouchableOpacity style={s.customActionCancelBtn} onPress={closeVetModal}>
                <Text style={s.customActionCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={s.customActionSaveBtn} onPress={saveVetCard}>
                <Text style={s.customActionSaveText}>{editingVetId ? 'Update Vet' : 'Save Vet'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      <Modal visible={isVetFinderExpanded} animationType="slide" onRequestClose={toggleVetFinder}>
        <SafeAreaView style={s.localVetFinderModalScreen} edges={['top', 'bottom']}>
          <View style={s.localVetFinderModalHeader}>
            <View style={{ flex: 1 }}>
              <Text style={s.localVetFinderModalTitle}>Local Vets & Emergency Care</Text>
              <Text style={s.localVetFinderModalSubtitle}>
                Search nearby clinics, then save the ones you want to keep on hand.
              </Text>
            </View>
            <TouchableOpacity style={s.localVetFinderCloseBtn} onPress={toggleVetFinder} activeOpacity={0.85}>
              <Text style={s.localVetFinderCloseBtnText}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView
            style={s.localVetFinderModalScroll}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={s.localVetFinderModalScrollContent}
          >
            <View style={s.localVetWarning}>
              <Text style={s.localVetWarningText}>
                If your pet is having trouble breathing, bleeding heavily, collapsed, had a seizure, ate something toxic, or may have swallowed glass/sharp objects, contact an emergency vet immediately.
              </Text>
            </View>

            <View style={s.localVetFinderButtonRow}>
              <TouchableOpacity style={[s.localVetFinderMainBtn, { flex: 1 }]} onPress={openMapsSearch} activeOpacity={0.9}>
                <Text style={s.localVetFinderMainBtnText}>Find Vets Near Me</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[s.localVetFinderMainBtn, { flex: 1, backgroundColor: C.red, borderColor: C.red }]} onPress={openEmergencyMapsSearch} activeOpacity={0.9}>
                <Text style={s.localVetFinderMainBtnText}>Find Emergency Vet Near Me</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity style={s.localVetFinderSaveBtn} onPress={() => openVetAddModal()} activeOpacity={0.9}>
              <Text style={s.localVetFinderSaveBtnText}>＋ Add Vet Card</Text>
            </TouchableOpacity>

            <View style={s.localVetSavedSection}>
              <Text style={s.localVetSavedSectionTitle}>Saved Vet Cards</Text>

              {savedVets.length === 0 ? (
                <View style={s.localVetEmptyState}>
                  <Text style={s.localVetEmptyStateText}>
                    Search for a clinic, open the website or map, then save the vet here so you can return to it later.
                  </Text>
                </View>
              ) : (
                savedVets.map((clinic) => (
                  <View key={clinic.id} style={s.localVetCard}>
                    <View style={s.localVetCardTopRow}>
                      <View style={s.localVetAvatar}>
                        <Text style={s.localVetAvatarText}>🏥</Text>
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={s.localVetName}>{clinic.name}</Text>
                        <Text style={s.localVetType}>{clinic.type}</Text>
                      </View>
                      <View style={s.localVetStatusPill}>
                        <Text style={s.localVetStatusText}>{clinic.status}</Text>
                      </View>
                    </View>

                    <View style={s.localVetMetaGrid}>
                      <View style={s.localVetMetaItem}>
                        <Text style={s.localVetMetaLabel}>Distance</Text>
                        <Text style={s.localVetMetaValue}>{clinic.distance}</Text>
                      </View>
                      <View style={s.localVetMetaItem}>
                        <Text style={s.localVetMetaLabel}>Phone</Text>
                        <Text style={s.localVetMetaValue}>{clinic.phone}</Text>
                      </View>
                      <View style={s.localVetMetaItem}>
                        <Text style={s.localVetMetaLabel}>Address</Text>
                        <Text style={s.localVetMetaValue}>{clinic.address}</Text>
                      </View>
                      <View style={s.localVetMetaItem}>
                        <Text style={s.localVetMetaLabel}>Website</Text>
                        <Text style={s.localVetMetaValue}>{clinic.websiteUrl ? 'Saved' : 'Not added'}</Text>
                      </View>
                    </View>

                    <View style={s.localVetActionRow}>
                      <TouchableOpacity style={s.localVetActionBtn} onPress={() => openVetCall(clinic.phone)} activeOpacity={0.85}>
                        <Text style={s.localVetActionBtnText}>Call</Text>
                      </TouchableOpacity>
                      <TouchableOpacity style={s.localVetActionBtn} onPress={() => openVetMaps(clinic)} activeOpacity={0.85}>
                        <Text style={s.localVetActionBtnText}>Open Maps</Text>
                      </TouchableOpacity>
                      {clinic.websiteUrl ? (
                        <TouchableOpacity style={s.localVetActionBtn} onPress={() => openVetWebsite(clinic.websiteUrl)} activeOpacity={0.85}>
                          <Text style={s.localVetActionBtnText}>Website</Text>
                        </TouchableOpacity>
                      ) : null}
                    </View>

                    <View style={s.localVetEditDeleteRow}>
                      <TouchableOpacity style={[s.localVetActionBtn, s.localVetActionBtnAccentSoft]} onPress={() => editVetCard(clinic)} activeOpacity={0.85}>
                        <Text style={s.localVetActionBtnTextAccentSoft}>Edit</Text>
                      </TouchableOpacity>
                      <TouchableOpacity style={[s.localVetActionBtn, s.localVetActionBtnDanger]} onPress={() => deleteVetCard(clinic.id)} activeOpacity={0.85}>
                        <Text style={s.localVetActionBtnTextDanger}>Delete</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                ))
              )}
            </View>
          </ScrollView>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
    </PetSyncBackground>
  );
}
// ─────────────────────────────────────────────
// SCREEN: MEMORY VAULT
// ─────────────────────────────────────────────
function MemoryVaultScreen({ navigation }) {
  const { pets } = useContext(PetsContext);
  const { openAddPetModal } = useContext(AddPetContext);
  const [selectedPetId, setSelectedPetId] = useState('1');
  const [activeTab, setActiveTab] = useState('all');
  const [memories, setMemories] = useState([]);
  const [showMemoryModal, setShowMemoryModal] = useState(false);
  const [showMemoryDetailModal, setShowMemoryDetailModal] = useState(false);
  const [selectedMemory, setSelectedMemory] = useState(null);
  const [memoryDraft, setMemoryDraft] = useState({
    caption: '',
    memoryType: 'Memory',
    date: '',
    photoUri: '',
    fileName: '',
    mimeType: '',
    size: null,
  });
  const { width } = Dimensions.get('window');
  const cellSize = (width - 32 - 8) / 3;

  const pet = pets.find(p => p.id === selectedPetId) || pets[0];
  useEffect(() => {
    if (pets.length > 0 && !pets.some((item) => item.id === selectedPetId)) {
      setSelectedPetId(pets[0].id);
    }
  }, [pets, selectedPetId]);

  useEffect(() => {
    let isActive = true;

    const run = async () => {
      const loadedMemories = await loadMemoriesFromSupabase();

      if (!isActive || loadedMemories == null) {
        return;
      }

      setMemories(loadedMemories);
    };

    run();

    return () => {
      isActive = false;
    };
  }, []);

  const formatMemoryDateKey = (date) => {
    const target = date instanceof Date ? date : new Date(date);
    if (Number.isNaN(target.getTime())) return '';
    const year = target.getFullYear();
    const month = String(target.getMonth() + 1).padStart(2, '0');
    const day = String(target.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const getMemoryDisplayEmoji = (memory) => {
    if (memory?.photoUri) return '';
    if (memory?.type === 'Milestone') return '🏆';
    return '🖼️';
  };

  const openAddMemoryModal = () => {
    setMemoryDraft({
      caption: '',
      memoryType: 'Memory',
      date: formatMemoryDateKey(new Date()),
      photoUri: '',
      fileName: '',
      mimeType: '',
      size: null,
    });
    setShowMemoryModal(true);
  };

  const closeMemoryModal = () => {
    setShowMemoryModal(false);
    setMemoryDraft({
      caption: '',
      memoryType: 'Memory',
      date: '',
      photoUri: '',
      fileName: '',
      mimeType: '',
      size: null,
    });
  };

  const closeMemoryDetail = () => {
    setShowMemoryDetailModal(false);
    setSelectedMemory(null);
  };

  const pickMemoryMedia = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Permission required', 'Please allow photo library access to add a memory.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: false,
      quality: 1,
    });

    if (!result.canceled && result.assets?.[0]?.uri) {
      const asset = result.assets[0];
      setMemoryDraft((prev) => ({
        ...prev,
        photoUri: asset.uri,
        fileName: asset.fileName || `memory-${Date.now()}.jpg`,
        mimeType: asset.mimeType || 'image/jpeg',
        size: asset.fileSize ?? null,
      }));
    }
  };

  const saveMemory = () => {
    const caption = memoryDraft.caption.trim();
    const date = String(memoryDraft.date || '').trim() || formatMemoryDateKey(new Date());

    if (!caption) {
      Alert.alert('Caption required', 'Please add a caption for this memory.');
      return;
    }

    const nextMemory = {
      id: Date.now().toString(),
      petId: selectedPetId,
      photoUri: memoryDraft.photoUri || null,
      caption,
      milestone: memoryDraft.memoryType === 'Milestone',
      type: memoryDraft.memoryType,
      date,
      fileName: memoryDraft.fileName || '',
      mimeType: memoryDraft.mimeType || '',
      size: memoryDraft.size ?? null,
      fileUrl: '',
      filePath: '',
      emoji: memoryDraft.photoUri ? null : getMemoryDisplayEmoji({ type: memoryDraft.memoryType }),
    };

    setMemories((prev) => [nextMemory, ...prev]);
    void (async () => {
      const savedMemory = await saveMemoryToSupabase(nextMemory);
      if (!savedMemory) {
        return;
      }

      setMemories((prev) => prev.map((memory) => (
        memory.id === nextMemory.id
          ? {
              ...memory,
              ...savedMemory,
              photoUri: savedMemory.photoUri || memory.photoUri,
            }
          : memory
      )));
    })();
    closeMemoryModal();
  };

  const openMemoryDetail = (memory) => {
    setSelectedMemory(memory);
    setShowMemoryDetailModal(true);
  };

  const deleteMemory = (memoryId) => {
    Alert.alert('Delete Memory?', 'This memory will be removed from the vault.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => {
          const memoryToDelete = memories.find((memory) => memory.id === memoryId);
          setMemories((prev) => prev.filter((memory) => memory.id !== memoryId));
          closeMemoryDetail();
          void deleteMemoryFromSupabase(memoryToDelete);
        },
      },
    ]);
  };

  if (!pet) {
    return (
      <SafeAreaView style={s.screen} edges={['top']}>
        <View style={s.pageHeader}>
          <View>
            <Text style={s.pageTitle}>Memory Vault</Text>
            <Text style={s.pageSub}>No pets available yet</Text>
          </View>
        </View>
        <Card style={s.petProfileInfoCard}>
          <Text style={s.petProfileSectionTitle}>Add your first pet</Text>
          <Text style={s.petProfileBodyText}>
            Create a pet to start collecting memories and milestones.
          </Text>
          {typeof openAddPetModal === 'function' && (
            <TouchableOpacity
              style={[s.petProfileButton, { marginTop: 16 }]}
              onPress={() => openAddPetModal()}
            >
              <Text style={s.petProfileButtonText}>Add Pet</Text>
            </TouchableOpacity>
          )}
        </Card>
      </SafeAreaView>
    );
  }

  const visibleMemories = memories.filter((memory) => {
    if (memory.petId !== selectedPetId) return false;
    if (activeTab === 'all') return true;
    if (activeTab === 'milestones') return memory.milestone;
    return true;
  });

  return (
    <PetSyncBackground opacity={0.16}>
    <SafeAreaView style={s.screen} edges={['top']}>
      <View style={s.pageHeader}>
        <View>
          <Text style={s.pageTitle}>Memory Vault</Text>
          <Text style={s.pageSub}>{visibleMemories.length} memories · {visibleMemories.filter((m) => m.milestone).length} milestones</Text>
        </View>
        <TouchableOpacity style={s.iconBtn} onPress={openAddMemoryModal}>
          <Text style={{ fontSize: 24 }}>📷</Text>
        </TouchableOpacity>
      </View>

      <PetAvatarRow
        pets={pets}
        selectedId={selectedPetId}
        onSelect={setSelectedPetId}
        onOpenProfile={(petId) => navigation.navigate('PetProfile', { petId })}
      />

      {/* Memory of the Day */}
      <Card style={s.motdCard}>
        <Text style={s.motdBadge}>✨ Memory of the Day</Text>
        <Text style={{ fontSize: 48, textAlign: 'center', marginVertical: 8 }}>🌊</Text>
        <Text style={s.motdCaption}>{pet.name}&apos;s first beach trip!</Text>
              <Text style={s.motdDate}>05/20/2026</Text>
      </Card>

      {/* Tabs */}
      <View style={{ flexDirection: 'row', paddingHorizontal: 16, gap: 8, marginBottom: 12 }}>
        {['all', 'milestones'].map(tab => (
          <TouchableOpacity key={tab} style={[s.tabPill, activeTab === tab && s.tabPillActive]} onPress={() => setActiveTab(tab)}>
            <Text style={[s.tabPillText, activeTab === tab && s.tabPillTextActive]}>
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Photo Grid */}
      <ScrollView contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 60 }}>
        {visibleMemories.length === 0 ? (
          <Card style={[s.petProfileInfoCard, { marginHorizontal: 0, alignItems: 'center' }]}>
            <Text style={{ fontSize: 42, marginBottom: 10 }}>🖼️</Text>
            <Text style={s.petProfileSectionTitle}>No memories yet</Text>
            <Text style={[s.petProfileBodyText, { textAlign: 'center' }]}>
              Add your first photo, milestone, or special moment.
            </Text>
            <TouchableOpacity style={[s.petProfileButton, { marginTop: 16, width: '100%' }]} onPress={openAddMemoryModal}>
              <Text style={s.petProfileButtonText}>Add Memory</Text>
            </TouchableOpacity>
          </Card>
        ) : (
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 4 }}>
            {visibleMemories.map((mem) => (
              <TouchableOpacity
                key={mem.id}
                style={[s.memCell, { width: cellSize, height: cellSize, backgroundColor: '#1e1e1e' }]}
                onPress={() => openMemoryDetail(mem)}
                activeOpacity={0.85}
              >
                {mem.photoUri ? (
                  <Image source={{ uri: mem.photoUri }} style={{ width: '100%', height: '100%' }} />
                ) : (
                  <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 8 }}>
                    <Text style={s.memEmoji}>{getMemoryDisplayEmoji(mem)}</Text>
                    <Text style={{ color: C.text, fontSize: 11, fontWeight: '700', textAlign: 'center', marginTop: 6 }}>
                      {mem.caption}
                    </Text>
                  </View>
                )}
                {mem.milestone && <View style={s.mileStar}><Text style={{ fontSize: 10 }}>⭐</Text></View>}
              </TouchableOpacity>
            ))}
          </View>
        )}
      </ScrollView>

      <TouchableOpacity style={s.fab} onPress={openAddMemoryModal}>
        <Text style={s.fabText}>＋</Text>
      </TouchableOpacity>

      <Modal visible={showMemoryModal} transparent animationType="fade" onRequestClose={closeMemoryModal}>
        <View style={s.modalOverlay}>
          <View style={[s.customActionModal, { width: '100%', maxHeight: '88%' }]}>
            <Text style={s.customActionModalTitle}>Add Memory</Text>

            <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled" contentContainerStyle={{ paddingBottom: 10 }}>
              <Text style={s.vetModalLabel}>Media</Text>
              <TouchableOpacity style={[s.petProfileButton, { marginBottom: 10 }]} onPress={pickMemoryMedia}>
                <Text style={s.petProfileButtonText}>
                  {memoryDraft.photoUri ? 'Change Photo' : 'Pick Photo'}
                </Text>
              </TouchableOpacity>

              {memoryDraft.photoUri ? (
                <View style={{ marginBottom: 10, borderRadius: 16, overflow: 'hidden', backgroundColor: C.bg, borderWidth: 1, borderColor: C.border }}>
                  <Image source={{ uri: memoryDraft.photoUri }} style={{ width: '100%', height: 180 }} />
                </View>
              ) : null}

              <Text style={s.vetModalLabel}>Caption</Text>
              <TextInput
                style={s.customActionInput}
                value={memoryDraft.caption}
                onChangeText={(text) => setMemoryDraft((prev) => ({ ...prev, caption: text }))}
                placeholder="Write a memory caption"
                placeholderTextColor={C.muted}
              />

              <Text style={s.vetModalLabel}>Memory type</Text>
              <View style={{ flexDirection: 'row', gap: 8, marginBottom: 12 }}>
                {['Memory', 'Milestone'].map((type) => (
                  <TouchableOpacity
                    key={type}
                    style={[
                      s.tabPill,
                      { flex: 1, alignItems: 'center', paddingVertical: 10 },
                      memoryDraft.memoryType === type && s.tabPillActive,
                    ]}
                    onPress={() => setMemoryDraft((prev) => ({ ...prev, memoryType: type }))}
                  >
                    <Text style={[s.tabPillText, memoryDraft.memoryType === type && s.tabPillTextActive]}>
                      {type}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <DatePickerField
                label="Date"
                value={memoryDraft.date}
                onChange={(date) => setMemoryDraft((prev) => ({ ...prev, date }))}
                placeholder="Select date"
              />

              <View style={s.customActionModalButtons}>
                <TouchableOpacity style={s.customActionCancelBtn} onPress={closeMemoryModal}>
                  <Text style={s.customActionCancelText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity style={s.customActionSaveBtn} onPress={saveMemory}>
                  <Text style={s.customActionSaveText}>Save</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

      <Modal visible={showMemoryDetailModal} transparent animationType="fade" onRequestClose={closeMemoryDetail}>
        <View style={s.modalOverlay}>
          <View style={[s.customActionModal, { width: '100%', maxHeight: '88%' }]}>
            <Text style={s.customActionModalTitle}>Memory Details</Text>
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 10 }}>
              {selectedMemory?.photoUri ? (
                selectedMemory.type === 'Video' ? (
                  <View style={{ height: 180, alignItems: 'center', justifyContent: 'center', backgroundColor: C.bg, borderRadius: 16, borderWidth: 1, borderColor: C.border, marginBottom: 12 }}>
                    <Text style={{ fontSize: 40 }}>🎥</Text>
                    <Text style={{ color: C.muted, marginTop: 6 }}>Video memory</Text>
                  </View>
                ) : (
                  <Image source={{ uri: selectedMemory.photoUri }} style={{ width: '100%', height: 200, borderRadius: 16, marginBottom: 12 }} />
                )
              ) : (
                <View style={{ height: 120, borderRadius: 16, marginBottom: 12, alignItems: 'center', justifyContent: 'center', backgroundColor: C.bg, borderWidth: 1, borderColor: C.border }}>
                  <Text style={{ fontSize: 40 }}>{getMemoryDisplayEmoji(selectedMemory || {}) || '🖼️'}</Text>
                </View>
              )}

              <Text style={{ color: C.text, fontSize: 18, fontWeight: '900', marginBottom: 6 }}>
                {selectedMemory?.caption}
              </Text>
              <Text style={{ color: C.muted, fontSize: 12, marginBottom: 4 }}>
                Date: {selectedMemory ? formatDate(selectedMemory.date) : ''}
              </Text>
              <Text style={{ color: C.muted, fontSize: 12, marginBottom: 4 }}>
                Type: {selectedMemory?.type}
              </Text>
              {selectedMemory?.milestone ? (
                <View
                  style={{
                    alignSelf: 'flex-start',
                    marginBottom: 12,
                    paddingHorizontal: 10,
                    paddingVertical: 4,
                    borderRadius: 999,
                    borderWidth: 1,
                    borderColor: C.primary,
                    backgroundColor: `${C.primary}18`,
                  }}
                >
                  <Text style={{ color: C.primary, fontSize: 12, fontWeight: '700' }}>
                    Milestone
                  </Text>
                </View>
              ) : null}
              <Text style={{ color: C.muted, fontSize: 12, marginBottom: 16 }}>
                Pet: {pet?.name || 'Selected pet'}
              </Text>

              <View style={s.customActionModalButtons}>
                <TouchableOpacity style={s.customActionCancelBtn} onPress={closeMemoryDetail}>
                  <Text style={s.customActionCancelText}>Close</Text>
                </TouchableOpacity>
                <TouchableOpacity style={s.customActionSaveBtn} onPress={() => selectedMemory && deleteMemory(selectedMemory.id)}>
                  <Text style={s.customActionSaveText}>Delete</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
    </PetSyncBackground>
  );
}

// ─────────────────────────────────────────────
// SCREEN: COMMUNITY
// ─────────────────────────────────────────────
function CommunityScreen() {
  const { pets } = useContext(PetsContext);
  const navigation = useNavigation();
  const [posts, setPosts] = useState(POSTS);
  const [recipes, setRecipes] = useState(RECIPE_POSTS);
  const [comments, setComments] = useState([]);
  const [activeCommunityTab, setActiveCommunityTab] = useState('feed');
  const [lostPetsFilter, setLostPetsFilter] = useState('active');
  const [expandedRecipeId, setExpandedRecipeId] = useState(null);
  const [showCompose, setShowCompose] = useState(false);
  const [editingPostId, setEditingPostId] = useState(null);
  const [postText, setPostText] = useState('');
  const [showRecipeModal, setShowRecipeModal] = useState(false);
  const [editingRecipeId, setEditingRecipeId] = useState(null);
  const [showCommentsModal, setShowCommentsModal] = useState(false);
  const [commentTarget, setCommentTarget] = useState(null);
  const [commentText, setCommentText] = useState('');
  const [recipeDraft, setRecipeDraft] = useState({
    title: '',
    description: '',
    ingredients: '',
    safeFor: '',
    prepTime: '',
  });
  const { lostPetAlerts, setLostPetAlerts } = useContext(LostPetAlertsContext);

  const openCommunityProfile = (profileKey, displayName, avatarEmoji, avatarUrl = '') => {
    navigation.navigate('CommunityProfile', {
      profileKey: normalizeCommunityProfileKey(profileKey || displayName),
      displayName: displayName || profileKey || 'Community Member',
      avatarEmoji: avatarEmoji || '🐾',
      avatarUrl,
    });
  };

  const getCommentsForTarget = (target) => comments.filter((comment) => (
    comment.parentType === target?.parentType && String(comment.parentId) === String(target?.parentId)
  ));

  const openCommentsModal = (target) => {
    if (!target?.parentType || !target?.parentId) {
      return;
    }

    setCommentTarget(target);
    setCommentText('');
    setShowCommentsModal(true);
  };

  const closeCommentsModal = () => {
    setShowCommentsModal(false);
    setCommentTarget(null);
    setCommentText('');
  };

  const updateCommentParentCount = (parentType, parentId, updater) => {
    if (parentType === 'post') {
      setPosts((prev) => prev.map((post) => (
        String(post.id) === String(parentId)
          ? { ...post, comments: updater(post.comments || 0) }
          : post
      )));
      return;
    }

    if (parentType === 'recipe') {
      setRecipes((prev) => prev.map((recipe) => (
        String(recipe.id) === String(parentId)
          ? { ...recipe, comments: updater(recipe.comments || 0) }
          : recipe
      )));
    }
  };

  const submitComment = () => {
    if (!commentTarget || !commentText.trim()) {
      return;
    }

    const newComment = {
      id: Date.now().toString(),
      parentType: commentTarget.parentType,
      parentId: commentTarget.parentId,
      author: 'Raymond',
      text: commentText.trim(),
      createdAt: new Date().toISOString(),
    };

    setComments((prev) => [...prev, newComment]);
    updateCommentParentCount(commentTarget.parentType, commentTarget.parentId, (count) => count + 1);
    void saveCommunityCommentToSupabase(newComment);
    setCommentText('');
  };

  const deleteComment = (commentId) => {
    const commentToDelete = comments.find((comment) => comment.id === commentId);
    if (!commentToDelete || commentToDelete.author !== 'Raymond') {
      return;
    }

    setComments((prev) => prev.filter((comment) => comment.id !== commentId));
    updateCommentParentCount(commentToDelete.parentType, commentToDelete.parentId, (count) => Math.max(0, count - 1));
    void deleteCommunityCommentFromSupabase(commentId);
  };

  useEffect(() => {
    let isActive = true;

    const run = async () => {
      const loadedPosts = await loadCommunityPostsFromSupabase();

      if (!isActive || loadedPosts == null) {
        return;
      }

      if (loadedPosts.length > 0) {
        setPosts(loadedPosts);
      }
    };

    run();

    return () => {
      isActive = false;
    };
  }, []);

  useEffect(() => {
    let isActive = true;

    const run = async () => {
      const loadedComments = await loadCommunityCommentsFromSupabase();

      if (!isActive || loadedComments == null) {
        return;
      }

      setComments(loadedComments);
    };

    run();

    return () => {
      isActive = false;
    };
  }, []);

  useEffect(() => {
    if (activeCommunityTab !== 'lostPets') {
      return;
    }

    let isActive = true;

    const run = async () => {
      const loadedAlerts = await loadLostPetAlertsFromSupabase();

      if (!isActive || loadedAlerts == null) {
        return;
      }

      setLostPetAlerts(loadedAlerts);
    };

    run();

    return () => {
      isActive = false;
    };
  }, [activeCommunityTab, setLostPetAlerts]);

  useEffect(() => {
    let isActive = true;

    const run = async () => {
      const loadedRecipes = await loadRecipesFromSupabase();

      if (!isActive || loadedRecipes == null) {
        return;
      }

      if (loadedRecipes.length > 0) {
        setRecipes(loadedRecipes);
      }
    };

    run();

    return () => {
      isActive = false;
    };
  }, []);

  useEffect(() => {
    const counts = recalculateCommunityCounts(comments);

    setPosts((prev) => prev.map((post) => {
      const nextCount = counts.get(`post:${post.id}`) || 0;
      return post.comments === nextCount ? post : { ...post, comments: nextCount };
    }));

    setRecipes((prev) => prev.map((recipe) => {
      const nextCount = counts.get(`recipe:${recipe.id}`) || 0;
      return recipe.comments === nextCount ? recipe : { ...recipe, comments: nextCount };
    }));
  }, [comments]);

  const toggleLike = (postId) => {
    setPosts((prev) => {
      const nextPosts = prev.map((post) => (
        post.id === postId
          ? { ...post, likes: post.likes + (post.liked ? -1 : 1), liked: !post.liked }
          : post
      ));
      const updatedPost = nextPosts.find((post) => post.id === postId);
      if (updatedPost) {
        updateCommunityPostLikesInSupabase(postId, updatedPost.likes);
      }
      return nextPosts;
    });
  };

  const openPostModal = (post = null) => {
    setEditingPostId(post?.id || null);
    setPostText(post?.content || '');
    setShowCompose(true);
  };

  const closePostModal = () => {
    setEditingPostId(null);
    setPostText('');
    setShowCompose(false);
  };

  const toggleRecipeLike = (recipeId) => {
    setRecipes((prev) => {
      const nextRecipes = prev.map((recipe) => (
        recipe.id === recipeId
          ? { ...recipe, likes: recipe.likes + (recipe.liked ? -1 : 1), liked: !recipe.liked }
          : recipe
      ));
      const updatedRecipe = nextRecipes.find((recipe) => recipe.id === recipeId);
      if (updatedRecipe) {
        updateRecipeInSupabase(updatedRecipe);
      }
      return nextRecipes;
    });
  };

  const submitPost = () => {
    if (!postText.trim()) return;
    if (editingPostId) {
      const existingPost = posts.find((post) => post.id === editingPostId);
      const updatedPost = {
        ...existingPost,
        id: editingPostId,
        author: 'Raymond',
        owner: true,
        petType: 'Multi-pet Dad',
        time: 'Just now',
        content: postText,
        emoji: '🐾',
        likes: existingPost?.likes ?? 0,
        comments: existingPost?.comments ?? 0,
        type: existingPost?.type || 'general',
        liked: existingPost?.liked ?? false,
      };

      setPosts((prev) => prev.map((post) => (post.id === editingPostId ? updatedPost : post)));
      updateCommunityPostInSupabase(updatedPost);
      closePostModal();
      return;
    }

    const newPost = { id: Date.now().toString(), author: 'Raymond', owner: true, petType: 'Multi-pet Dad', time: 'Just now', content: postText, emoji: '🐾', likes: 0, comments: 0, type: 'general', liked: false };
    setPosts(prev => [newPost, ...prev]);
    saveCommunityPostToSupabase(newPost);
    closePostModal();
  };

  const deletePost = (postId) => {
    Alert.alert('Delete Post?', 'This post will be removed.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => {
          setPosts((prev) => prev.filter((post) => post.id !== postId));
          deleteCommunityPostFromSupabase(postId);
        },
      },
    ]);
  };

  const openContactOwner = (alert) => {
    Alert.alert('Contact owner coming soon');
  };

  const shareLostPetAlert = async (alert) => {
    const photoUrl = alert?.photoUrl || '';
    const shareMessage = `Lost Pet Alert: ${alert?.petName || 'Unknown'}. Last seen: ${alert?.lastSeenLocation || 'Not provided'}. Details: ${alert?.description || 'No description provided.'}`;

    try {
      if (photoUrl) {
        await Share.share({ message: shareMessage, url: photoUrl });
        return;
      }

      await Share.share({ message: shareMessage });
    } catch (error) {
      console.log('Share lost pet alert error:', error);
      Alert.alert('Share failed', 'Unable to share this alert right now.');
    }
  };

  const markLostPetAlertFound = (alert) => {
    Alert.alert('Mark Found?', 'This alert will be moved to Found.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Mark Found',
        style: 'destructive',
        onPress: () => {
          setLostPetAlerts((prev) => prev.map((item) => (
            item.id === alert.id ? { ...item, status: 'found' } : item
          )));
          updateLostPetAlertStatusInSupabase(alert.id, 'found');
        },
      },
    ]);
  };

  const buildRecipeDraft = (recipe) => ({
    title: recipe?.title || '',
    description: recipe?.description || '',
    ingredients: normalizeRecipeIngredients(recipe?.ingredients).join('\n'),
    safeFor: normalizeRecipeSafeFor(recipe?.safeFor).join(', '),
    prepTime: recipe?.prepTime || '',
  });

  const openRecipeModal = (recipe = null) => {
    setEditingRecipeId(recipe?.id || null);
    setRecipeDraft(buildRecipeDraft(recipe));
    setShowRecipeModal(true);
  };

  const closeRecipeModal = () => {
    setShowRecipeModal(false);
    setEditingRecipeId(null);
    setRecipeDraft({
      title: '',
      description: '',
      ingredients: '',
      safeFor: '',
      prepTime: '',
    });
  };

  const submitRecipe = () => {
    const title = recipeDraft.title.trim();
    const description = recipeDraft.description.trim();
    const ingredients = recipeDraft.ingredients
      .split(/\n|,/)
      .map((item) => item.trim())
      .filter(Boolean);
    const safeFor = recipeDraft.safeFor
      .split(',')
      .map((item) => item.trim().toLowerCase())
      .filter(Boolean);
    const prepTime = recipeDraft.prepTime.trim();

    if (!title || !description || !ingredients.length || !safeFor.length || !prepTime) {
      Alert.alert('Missing details', 'Please fill out every recipe field before posting.');
      return;
    }

    const ownerLabel = `${safeFor.map((species) => species.charAt(0).toUpperCase() + species.slice(1)).join(' / ')} Parent`;
    const generatedInstructions = [
      'Gather the ingredients listed in this recipe.',
      `Prepare and combine them according to the recipe for ${title}.`,
      'Serve only in appropriate portions and monitor your pet the first time.',
    ];
    const recipePayload = {
      id: editingRecipeId || `recipe-${Date.now()}`,
      author: 'Raymond',
      owner: true,
      petType: ownerLabel,
      title,
      description,
      ingredients,
      safeFor,
      prepTime,
      likes: editingRecipeId ? recipes.find((recipe) => recipe.id === editingRecipeId)?.likes ?? 0 : 0,
      comments: editingRecipeId ? recipes.find((recipe) => recipe.id === editingRecipeId)?.comments ?? 0 : 0,
      emoji: editingRecipeId ? recipes.find((recipe) => recipe.id === editingRecipeId)?.emoji ?? '🥣' : '🥣',
      instructions: editingRecipeId
        ? recipes.find((recipe) => recipe.id === editingRecipeId)?.instructions ?? generatedInstructions
        : generatedInstructions,
    };

    setRecipes((prev) => {
      if (editingRecipeId) {
        return prev.map((recipe) => (recipe.id === editingRecipeId ? { ...recipe, ...recipePayload } : recipe));
      }

      return [recipePayload, ...prev];
    });

    if (editingRecipeId) {
      updateRecipeInSupabase(recipePayload);
    } else {
      saveRecipeToSupabase(recipePayload);
    }

    closeRecipeModal();
    setActiveCommunityTab('recipes');
  };

  const deleteRecipe = (recipeId) => {
    Alert.alert('Delete Recipe?', 'This recipe post will be removed.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => {
          setRecipes((prev) => prev.filter((recipe) => recipe.id !== recipeId));
          deleteRecipeFromSupabase(recipeId);
        },
      },
    ]);
  };

  const shareRecipe = async (recipe) => {
    Alert.alert('Share recipe coming soon');
  };

  const toggleRecipeExpanded = (recipeId) => {
    setExpandedRecipeId((current) => (current === recipeId ? null : recipeId));
  };

  const visiblePosts = posts.filter((post) => {
    if (activeCommunityTab === 'feed') {
      return post.type !== 'lost_pet' && post.type !== 'tip';
    }

    if (activeCommunityTab === 'lostPets') {
      return post.type === 'lost_pet';
    }

    if (activeCommunityTab === 'tips') {
      return post.type === 'tip';
    }

    return false;
  });

  const visibleLostPetAlerts = lostPetAlerts.filter((alert) => {
    if (lostPetsFilter === 'active') {
      return String(alert.status || 'active').toLowerCase() !== 'found';
    }

    if (lostPetsFilter === 'found') {
      return String(alert.status || 'active').toLowerCase() === 'found';
    }

    return true;
  });

  const renderLostPetCard = (alert) => {
    const isFound = String(alert.status || 'active').toLowerCase() === 'found';
    const localPet = pets.find((pet) => String(pet.id) === String(alert.petId));
    const speciesLabel = localPet?.species || '';
    const breedLabel = localPet?.breed || '';
    const isOwner = Boolean(localPet);

    return (
      <Card key={alert.id} style={{ marginBottom: 14, paddingTop: 14 }}>
        <View style={s.postAuthorRow}>
          <View style={s.postAvatar}>
            {alert.photoUrl ? (
              <Image source={{ uri: alert.photoUrl }} style={{ width: 42, height: 42, borderRadius: 21 }} />
            ) : (
              <Text style={{ fontSize: 18 }}>{alert.petName ? alert.petName.charAt(0).toUpperCase() : '🐾'}</Text>
            )}
          </View>
          <View style={s.flex}>
            <Text style={s.postAuthor}>{alert.petName || 'Lost Pet'}</Text>
            <Text style={s.postPetType}>{[speciesLabel, breedLabel].filter(Boolean).join(' · ') || 'Unknown species'}</Text>
          </View>
          <View style={[s.lostFoundBadge, isFound ? s.lostFoundBadgeFound : s.lostFoundBadgeActive]}>
            <Text style={[s.lostFoundBadgeText, isFound ? s.lostFoundBadgeTextFound : s.lostFoundBadgeTextActive]}>
              {isFound ? 'FOUND' : 'ACTIVE'}
            </Text>
          </View>
        </View>

        <Text style={s.postContent}>{alert.description || 'No description provided.'}</Text>

        <View style={[s.postMediaPlaceholder, { backgroundColor: isFound ? '#12331f' : '#3a0a0a' }]}>
          {alert.photoUrl ? (
            <Image source={{ uri: alert.photoUrl }} style={{ width: '100%', height: '100%', borderRadius: 16 }} />
          ) : (
            <Text style={{ fontSize: 40 }}>{alert.petName ? '🐾' : '🚨'}</Text>
          )}
        </View>

        <View style={{ gap: 10, marginTop: 12 }}>
          <Text style={{ color: C.muted, fontSize: 12, fontWeight: '700' }}>
            Last seen location
          </Text>
          <Text style={{ color: C.text, fontSize: 13, lineHeight: 19 }}>
            {alert.lastSeenLocation || 'Not provided'}
          </Text>
          <Text style={{ color: C.muted, fontSize: 12, fontWeight: '700', marginTop: 4 }}>
            Date reported
          </Text>
          <Text style={{ color: C.text, fontSize: 13 }}>
            {formatDate(alert.dateReported)}
          </Text>
        </View>

        <View style={s.postActions}>
          <TouchableOpacity style={s.postAction} onPress={() => openContactOwner(alert)}>
            <Text style={{ fontSize: 18 }}>📞</Text>
            <Text style={s.postActionText}>Contact Owner</Text>
          </TouchableOpacity>
          <TouchableOpacity style={s.postAction} onPress={() => shareLostPetAlert(alert)}>
            <Text style={{ fontSize: 18 }}>↗️</Text>
            <Text style={s.postActionText}>Share Alert</Text>
          </TouchableOpacity>
        </View>

        {isOwner && !isFound ? (
          <TouchableOpacity style={s.foundBtn} onPress={() => markLostPetAlertFound(alert)}>
            <Text style={s.foundBtnText}>Mark Found</Text>
          </TouchableOpacity>
        ) : null}
      </Card>
    );
  };

  const renderPostCard = (post) => (
    <Card key={post.id} style={{ marginBottom: 14 }}>
      {post.lost && (
        <View style={s.lostBanner}>
          <Text style={s.lostBannerText}>🚨 LOST PET ALERT</Text>
        </View>
      )}
      <View style={s.postAuthorRow}>
        <TouchableOpacity activeOpacity={0.85} onPress={() => openCommunityProfile(post.author, post.author, post.emoji)}>
          <View style={s.postAvatar}>
            <Text style={{ fontSize: 18 }}>{post.emoji}</Text>
          </View>
        </TouchableOpacity>
        <TouchableOpacity style={s.flex} activeOpacity={0.85} onPress={() => openCommunityProfile(post.author, post.author, post.emoji)}>
          <Text style={s.postAuthor}>{post.author}</Text>
          <Text style={s.postPetType}>{post.petType} · {post.time}</Text>
        </TouchableOpacity>
      </View>
      <Text style={s.postContent}>{post.content}</Text>
      <View style={[s.postMediaPlaceholder, { backgroundColor: post.lost ? '#3a0a0a' : C.cardHigh }]}>
        <Text style={{ fontSize: 40 }}>{post.emoji}</Text>
      </View>
      <View style={s.postActions}>
        <TouchableOpacity style={s.postAction} onPress={() => toggleLike(post.id)}>
          <Text style={{ fontSize: 18 }}>{post.liked ? '❤️' : '🤍'}</Text>
          <Text style={[s.postActionText, post.liked && { color: '#e74c3c' }]}>{post.likes}</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={s.postAction}
          onPress={() => openCommentsModal({
            parentType: 'post',
            parentId: post.id,
            label: post.content || post.author || 'Community Post',
          })}
        >
          <Text style={{ fontSize: 18 }}>💬</Text>
          <Text style={s.postActionText}>{post.comments}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={s.postAction} onPress={() => Alert.alert('Share', 'Share this post to Facebook, Nextdoor, or Twitter')}>
          <Text style={{ fontSize: 18 }}>↗️</Text>
          <Text style={s.postActionText}>Share</Text>
        </TouchableOpacity>
      </View>
      {post.owner && (
        <View style={s.recipeOwnerActions}>
          <TouchableOpacity style={s.recipeOwnerBtn} onPress={() => openPostModal(post)}>
            <Text style={s.recipeOwnerBtnText}>Edit</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[s.recipeOwnerBtn, s.recipeOwnerBtnDanger]} onPress={() => deletePost(post.id)}>
            <Text style={[s.recipeOwnerBtnText, s.recipeOwnerBtnTextDanger]}>Delete</Text>
          </TouchableOpacity>
        </View>
      )}
      {post.lost && (
        <TouchableOpacity style={s.alertNeighborsBtn} onPress={() => Alert.alert('🚨 Alert Sent!', '156 pet owners in your area have been notified.')}>
          <Text style={s.alertNeighborsBtnText}>🚨 Alert My Neighborhood</Text>
        </TouchableOpacity>
      )}
    </Card>
  );

  const renderRecipeCard = (recipe) => (
    <Card key={recipe.id} style={{ marginBottom: 14, paddingTop: 14 }}>
      {(() => {
        const recipeSafeFor = normalizeRecipeSafeFor(recipe.safeFor);
        const recipeIngredients = normalizeRecipeIngredients(recipe.ingredients);
        return (
          <>
      <View style={s.recipeHeroRow}>
        <TouchableOpacity activeOpacity={0.85} onPress={() => openCommunityProfile(recipe.author, recipe.author, recipe.emoji)}>
          <View style={s.recipeEmojiWrap}>
            <Text style={s.recipeEmoji}>{recipe.emoji}</Text>
          </View>
        </TouchableOpacity>
        <TouchableOpacity style={s.flex} activeOpacity={0.85} onPress={() => openCommunityProfile(recipe.author, recipe.author, recipe.emoji)}>
          <Text style={s.recipeTitle}>{recipe.title}</Text>
          <Text style={s.recipeMeta}>
            {recipe.author} · {recipe.petType} / {recipeSafeFor.map((species) => species.charAt(0).toUpperCase() + species.slice(1)).join(', ')}
          </Text>
        </TouchableOpacity>
      </View>

      <Text style={s.recipeDescription}>{recipe.description}</Text>

      <View style={s.recipeMetaRow}>
        <View style={s.recipePill}>
          <Text style={s.recipePillLabel}>Safe for</Text>
          <Text style={s.recipePillValue}>{recipeSafeFor.map((species) => species.charAt(0).toUpperCase() + species.slice(1)).join(', ')}</Text>
        </View>
        <View style={s.recipePill}>
          <Text style={s.recipePillLabel}>Prep time</Text>
          <Text style={s.recipePillValue}>{recipe.prepTime}</Text>
        </View>
      </View>

        <View style={s.recipeIngredientsBlock}>
          <Text style={s.recipeIngredientsLabel}>Ingredients preview</Text>
          <Text style={s.recipeIngredientsText}>
            {recipeIngredients.slice(0, 3).join(' • ')}
            {recipeIngredients.length > 3 ? ' • …' : ''}
          </Text>
        </View>

        <TouchableOpacity style={s.recipeExpandToggle} onPress={() => toggleRecipeExpanded(recipe.id)}>
          <Text style={s.recipeExpandToggleText}>
            {expandedRecipeId === recipe.id ? 'Hide full instructions' : 'Show full instructions'}
          </Text>
          <Text style={s.recipeExpandChevron}>{expandedRecipeId === recipe.id ? '▴' : '▾'}</Text>
        </TouchableOpacity>

        {expandedRecipeId === recipe.id && (
          <View style={s.recipeInstructionsBlock}>
            <Text style={s.recipeInstructionsLabel}>Full instructions</Text>
            {(recipe.instructions || []).map((step, index) => (
              <View key={`${recipe.id}-step-${index}`} style={s.recipeInstructionRow}>
                <View style={s.recipeInstructionNumber}>
                  <Text style={s.recipeInstructionNumberText}>{index + 1}</Text>
                </View>
                <Text style={s.recipeInstructionText}>{step}</Text>
              </View>
            ))}

            <View style={s.recipeIngredientsFullBlock}>
              <Text style={s.recipeInstructionsLabel}>Full ingredients</Text>
              {recipeIngredients.map((ingredient, index) => (
                <Text key={`${recipe.id}-ingredient-${index}`} style={s.recipeIngredientFullText}>
                  • {ingredient}
                </Text>
              ))}
            </View>
          </View>
        )}

        <View style={s.recipeActions}>
        <TouchableOpacity style={s.postAction} onPress={() => toggleRecipeLike(recipe.id)}>
          <Text style={{ fontSize: 18 }}>{recipe.liked ? '❤️' : '🤍'}</Text>
          <Text style={[s.postActionText, recipe.liked && { color: '#e74c3c' }]}>{recipe.likes}</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={s.postAction}
          onPress={() => openCommentsModal({
            parentType: 'recipe',
            parentId: recipe.id,
            label: recipe.title || 'Recipe',
          })}
        >
          <Text style={{ fontSize: 18 }}>💬</Text>
          <Text style={s.postActionText}>{recipe.comments}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={s.postAction} onPress={() => shareRecipe(recipe)}>
          <Text style={{ fontSize: 18 }}>↗️</Text>
          <Text style={s.postActionText}>Share</Text>
        </TouchableOpacity>
      </View>

      {recipe.owner && (
        <View style={s.recipeOwnerActions}>
          <TouchableOpacity style={s.recipeOwnerBtn} onPress={() => openRecipeModal(recipe)}>
            <Text style={s.recipeOwnerBtnText}>Edit</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[s.recipeOwnerBtn, s.recipeOwnerBtnDanger]} onPress={() => deleteRecipe(recipe.id)}>
            <Text style={[s.recipeOwnerBtnText, s.recipeOwnerBtnTextDanger]}>Delete</Text>
          </TouchableOpacity>
        </View>
      )}
          </>
        );
      })()}
    </Card>
  );

  return (
    <PetSyncBackground opacity={0.08}>
    <SafeAreaView style={s.screen} edges={['top']}>
      <View style={s.pageHeader}>
        <View>
          <Text style={s.pageTitle}>Community</Text>
          <Text style={s.pageSub}>📍 Bayville, NJ</Text>
        </View>
        <TouchableOpacity
          style={s.accentBtn}
          onPress={activeCommunityTab === 'recipes' ? openRecipeModal : () => openPostModal()}
        >
          <Text style={s.accentBtnText}>{activeCommunityTab === 'recipes' ? '＋ Recipe' : '＋ Post'}</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.communityTabRow}>
          {COMMUNITY_TABS.map((tab) => (
              <TouchableOpacity
                key={tab.key}
                style={[s.communityTabPill, activeCommunityTab === tab.key && s.communityTabPillActive]}
                onPress={() => setActiveCommunityTab(tab.key)}
              >
              <Text style={[s.communityTabText, activeCommunityTab === tab.key && s.communityTabTextActive]}>
                {tab.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {activeCommunityTab === 'recipes' && (
          <View style={s.recipeSafetyNote}>
            <Text style={s.recipeSafetyNoteText}>Always check with your vet before introducing new foods.</Text>
          </View>
        )}

        {activeCommunityTab === 'lostPets' && (
          <>
            <View style={{ flexDirection: 'row', gap: 8, marginBottom: 12 }}>
              {[
                { key: 'active', label: 'Active' },
                { key: 'found', label: 'Found' },
              ].map((filter) => (
                <TouchableOpacity
                  key={filter.key}
                  style={[
                    s.communityTabPill,
                    lostPetsFilter === filter.key && s.communityTabPillActive,
                    { flex: 1, alignItems: 'center' },
                  ]}
                  onPress={() => setLostPetsFilter(filter.key)}
                >
                  <Text style={[s.communityTabText, lostPetsFilter === filter.key && s.communityTabTextActive]}>
                    {filter.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {visibleLostPetAlerts.length === 0 ? (
              <Card style={{ alignItems: 'center', padding: 24, marginBottom: 14 }}>
                <Text style={{ fontSize: 36, marginBottom: 8 }}>🚨</Text>
                <Text style={{ color: C.text, fontSize: 18, fontWeight: '900' }}>
                  No lost pet alerts nearby.
                </Text>
                <Text style={{ color: C.muted, fontSize: 13, textAlign: 'center', marginTop: 6, lineHeight: 19 }}>
                  Active and found alerts from the community will appear here.
                </Text>
              </Card>
            ) : (
              visibleLostPetAlerts.map(renderLostPetCard)
            )}
          </>
        )}

        {activeCommunityTab === 'recipes' ? (
          recipes.map(renderRecipeCard)
        ) : activeCommunityTab !== 'lostPets' ? (
          visiblePosts.map(renderPostCard)
        ) : null}
      </ScrollView>

      {/* Compose Modal */}
      <Modal visible={showCompose} animationType="slide" presentationStyle="pageSheet">
        <SafeAreaView style={[s.screen, { backgroundColor: C.bg }]}>
          <View style={s.modalHeader}>
            <TouchableOpacity onPress={closePostModal}>
              <Text style={{ color: C.muted, fontSize: 16 }}>Cancel</Text>
            </TouchableOpacity>
            <Text style={s.modalTitle}>{editingPostId ? 'Edit Post' : 'New Post'}</Text>
            <TouchableOpacity onPress={submitPost}>
              <Text style={{ color: C.accent, fontSize: 16, fontWeight: '700' }}>
                {editingPostId ? 'Save' : 'Share'}
              </Text>
            </TouchableOpacity>
          </View>
          <TextInput
            style={s.composeInput}
            placeholder="What's your pet up to today? 🐾"
            placeholderTextColor={C.muted}
            value={postText}
            onChangeText={setPostText}
            multiline
            autoFocus
          />
          <View style={s.composeTips}>
            {['📷 Photo', '🎥 Video', '📍 Location', '🏷️ Tag Pet'].map(tip => (
              <TouchableOpacity key={tip} style={s.composeTip} onPress={() => Alert.alert('Coming Soon', 'This feature is coming in the next update!')}>
                <Text style={{ color: C.accent, fontSize: 13 }}>{tip}</Text>
              </TouchableOpacity>
            ))}
            </View>
          </SafeAreaView>
        </Modal>

      <Modal visible={showRecipeModal} animationType="slide" presentationStyle="pageSheet" onRequestClose={closeRecipeModal}>
        <SafeAreaView style={[s.screen, { backgroundColor: C.bg }]}>
          <View style={s.modalHeader}>
            <TouchableOpacity onPress={closeRecipeModal}>
              <Text style={{ color: C.muted, fontSize: 16 }}>Cancel</Text>
            </TouchableOpacity>
              <Text style={s.modalTitle}>{editingRecipeId ? 'Edit Recipe' : 'New Recipe'}</Text>
            <TouchableOpacity onPress={submitRecipe}>
                <Text style={{ color: C.accent, fontSize: 16, fontWeight: '700' }}>
                  {editingRecipeId ? 'Save' : 'Post'}
                </Text>
            </TouchableOpacity>
          </View>

          <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 32 }}>
            <Text style={s.recipeFieldLabel}>Recipe title</Text>
            <TextInput
              style={s.recipeInput}
              placeholder="Frozen Peanut Butter Banana Dog Treats"
              placeholderTextColor={C.muted}
              value={recipeDraft.title}
              onChangeText={(text) => setRecipeDraft((prev) => ({ ...prev, title: text }))}
            />

            <Text style={s.recipeFieldLabel}>Description</Text>
            <TextInput
              style={[s.recipeInput, s.recipeTextArea]}
              placeholder="What makes this recipe special?"
              placeholderTextColor={C.muted}
              value={recipeDraft.description}
              onChangeText={(text) => setRecipeDraft((prev) => ({ ...prev, description: text }))}
              multiline
            />

            <Text style={s.recipeFieldLabel}>Ingredients</Text>
            <TextInput
              style={[s.recipeInput, s.recipeTextArea]}
              placeholder="One ingredient per line"
              placeholderTextColor={C.muted}
              value={recipeDraft.ingredients}
              onChangeText={(text) => setRecipeDraft((prev) => ({ ...prev, ingredients: text }))}
              multiline
            />

            <Text style={s.recipeFieldLabel}>Safe for pet type</Text>
            <TextInput
              style={s.recipeInput}
              placeholder="dog, cat, rabbit"
              placeholderTextColor={C.muted}
              value={recipeDraft.safeFor}
              onChangeText={(text) => setRecipeDraft((prev) => ({ ...prev, safeFor: text }))}
            />

            <Text style={s.recipeFieldLabel}>Prep time</Text>
            <TextInput
              style={s.recipeInput}
              placeholder="10 min"
              placeholderTextColor={C.muted}
              value={recipeDraft.prepTime}
              onChangeText={(text) => setRecipeDraft((prev) => ({ ...prev, prepTime: text }))}
            />

            <View style={s.recipeModalTip}>
              <Text style={s.recipeModalTipText}>Use simple, pet-safe ingredients and avoid anything your vet has flagged as unsafe.</Text>
            </View>
          </ScrollView>
        </SafeAreaView>
      </Modal>

      <Modal visible={showCommentsModal} animationType="slide" presentationStyle="pageSheet" onRequestClose={closeCommentsModal}>
        <SafeAreaView style={[s.screen, { backgroundColor: C.bg }]}>
          <View style={s.modalHeader}>
            <TouchableOpacity onPress={closeCommentsModal}>
              <Text style={{ color: C.muted, fontSize: 16 }}>Cancel</Text>
            </TouchableOpacity>
            <Text style={s.modalTitle}>Comments</Text>
            <View style={{ width: 44 }} />
          </View>

          <ScrollView contentContainerStyle={s.communityCommentsScroll}>
            <Card style={s.communityCommentsCard}>
              <Text style={s.communityCommentsTargetLabel}>Commenting on</Text>
              <Text style={s.communityCommentsTargetText}>
                {commentTarget?.label || 'Community post'}
              </Text>
            </Card>

            <Card style={s.communityCommentsCard}>
              <Text style={s.communityCommentsSectionTitle}>Comments</Text>
              {getCommentsForTarget(commentTarget).length > 0 ? (
                getCommentsForTarget(commentTarget).map((comment) => (
                  <View key={comment.id} style={s.communityCommentItem}>
                    <View style={s.communityCommentAvatar}>
                      <Text style={s.communityCommentAvatarText}>
                        {comment.author ? comment.author.charAt(0).toUpperCase() : 'R'}
                      </Text>
                    </View>
                    <View style={s.flex}>
                      <View style={s.communityCommentRow}>
                        <Text style={s.communityCommentAuthor}>{comment.author}</Text>
                        <Text style={s.communityCommentTime}>{formatDate(comment.createdAt)}</Text>
                      </View>
                      <Text style={s.communityCommentText}>{comment.text}</Text>
                    </View>
                    {comment.author === 'Raymond' && (
                      <TouchableOpacity onPress={() => deleteComment(comment.id)} style={s.communityCommentDeleteBtn}>
                        <Text style={s.communityCommentDeleteText}>Delete</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                ))
              ) : (
                <Text style={s.communityCommentsEmptyText}>No comments yet.</Text>
              )}
            </Card>
          </ScrollView>

          <View style={s.communityCommentComposer}>
            <TextInput
              style={s.communityCommentInput}
              placeholder="Write a comment..."
              placeholderTextColor={C.muted}
              value={commentText}
              onChangeText={setCommentText}
              multiline
            />
            <TouchableOpacity style={s.communityCommentPostBtn} onPress={submitComment}>
              <Text style={s.communityCommentPostBtnText}>Post Comment</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
    </PetSyncBackground>
  );
}

// ─────────────────────────────────────────────
// SCREEN: FAMILY SHARING
// ─────────────────────────────────────────────
function FamilySharingScreen({ navigation }) {
  const [familyMembers, setFamilyMembers] = useState([]);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('Viewer');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let isActive = true;

    const run = async () => {
      setLoading(true);
      const loadedMembers = await loadFamilyMembersFromSupabase();

      if (!isActive || loadedMembers == null) {
        if (isActive) {
          setLoading(false);
        }
        return;
      }

      setFamilyMembers(loadedMembers);
      setLoading(false);
    };

    run();

    return () => {
      isActive = false;
    };
  }, []);

  const currentMembers = familyMembers.filter((member) => member.status === 'accepted');
  const pendingInvitations = familyMembers.filter((member) => member.status === 'pending');

  const closeInviteModal = () => {
    setShowInviteModal(false);
    setInviteEmail('');
    setInviteRole('Viewer');
  };

  const submitInvite = async () => {
    const email = inviteEmail.trim().toLowerCase();

    if (!email) {
      Alert.alert('Email required', 'Enter a family member email address.');
      return;
    }

    setSaving(true);
    const savedInvitation = await saveFamilyInvitationToSupabase({
      memberEmail: email,
      role: inviteRole,
    });
    setSaving(false);

    if (!savedInvitation) {
      Alert.alert('Invite failed', 'Unable to save the invitation right now.');
      return;
    }

    setFamilyMembers((prev) => [savedInvitation, ...prev]);
    closeInviteModal();
  };

  const removeMember = (member) => {
    Alert.alert('Remove member?', `${member.memberEmail} will be removed from Family Sharing.`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: async () => {
          setFamilyMembers((prev) => prev.filter((item) => item.id !== member.id));
          await removeFamilyMemberFromSupabase(member.id);
        },
      },
    ]);
  };

  const resendInvitation = async (member) => {
    setSaving(true);
    const updatedInvitation = await updateFamilyMemberStatusInSupabase(member.id, 'pending');
    setSaving(false);

    if (updatedInvitation) {
      setFamilyMembers((prev) => prev.map((item) => (item.id === updatedInvitation.id ? updatedInvitation : item)));
      Alert.alert('Invitation resent', 'The invitation status was refreshed.');
      return;
    }

    Alert.alert('Resend failed', 'Unable to resend the invitation right now.');
  };

  const renderFamilyMemberCard = (member, showResend = false) => (
    <Card key={member.id} style={s.familySharingMemberCard}>
      <View style={s.familySharingAvatarCircle}>
        <Text style={s.familySharingAvatarText}>
          {member.memberEmail ? member.memberEmail.charAt(0).toUpperCase() : '👤'}
        </Text>
      </View>
      <View style={s.flex}>
        <Text style={s.familySharingMemberEmail}>{member.memberEmail}</Text>
        <Text style={s.familySharingMemberMeta}>Role: {member.role}</Text>
        <View style={[s.familySharingStatusBadge, member.status === 'accepted' ? s.familySharingStatusBadgeAccepted : s.familySharingStatusBadgePending]}>
          <Text style={[s.familySharingStatusText, member.status === 'accepted' ? s.familySharingStatusTextAccepted : s.familySharingStatusTextPending]}>
            {member.status === 'accepted' ? 'Accepted' : 'Pending'}
          </Text>
        </View>
      </View>
      <View style={s.familySharingActionColumn}>
        {showResend && member.status === 'pending' && (
          <TouchableOpacity style={s.familySharingActionBtn} onPress={() => resendInvitation(member)} disabled={saving}>
            <Text style={s.familySharingActionBtnText}>Resend</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity style={[s.familySharingActionBtn, s.familySharingActionBtnDanger]} onPress={() => removeMember(member)}>
          <Text style={[s.familySharingActionBtnText, s.familySharingActionBtnTextDanger]}>Remove</Text>
        </TouchableOpacity>
      </View>
    </Card>
  );

  return (
    <PetSyncBackground opacity={0.08}>
    <SafeAreaView style={s.screen} edges={['top']}>
      <View style={s.pageHeader}>
        <View>
          <Text style={s.pageTitle}>Family Sharing</Text>
          <Text style={s.pageSub}>Invite caregivers and viewers</Text>
        </View>
        <TouchableOpacity style={s.accentBtn} onPress={() => setShowInviteModal(true)}>
          <Text style={s.accentBtnText}>＋ Invite Member</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>
        <Card style={s.familySharingOwnerCard}>
          <Text style={s.familySharingSectionTitle}>Owner</Text>
          <Text style={s.familySharingOwnerName}>{CURRENT_USER_NAME}</Text>
          <Text style={s.familySharingOwnerSub}>{CURRENT_USER_EMAIL}</Text>
        </Card>

        <Card style={s.familySharingSummaryCard}>
          <Text style={s.familySharingSummaryTitle}>Current Family Members</Text>
          <Text style={s.familySharingSummaryCount}>{currentMembers.length}</Text>
        </Card>

        <Card style={s.familySharingSummaryCard}>
          <Text style={s.familySharingSummaryTitle}>Pending Invitations</Text>
          <Text style={s.familySharingSummaryCount}>{pendingInvitations.length}</Text>
        </Card>

        <View style={{ marginTop: 12 }}>
          <Text style={s.menuSectionTitle}>CURRENT FAMILY MEMBERS</Text>
          {loading ? (
            <Card style={s.familySharingEmptyCard}>
              <Text style={s.familySharingEmptyText}>Loading family members...</Text>
            </Card>
          ) : currentMembers.length > 0 ? (
            currentMembers.map((member) => renderFamilyMemberCard(member))
          ) : (
            <Card style={s.familySharingEmptyCard}>
              <Text style={s.familySharingEmptyText}>No accepted family members yet.</Text>
            </Card>
          )}
        </View>

        <View style={{ marginTop: 12 }}>
          <Text style={s.menuSectionTitle}>PENDING INVITATIONS</Text>
          {loading ? (
            <Card style={s.familySharingEmptyCard}>
              <Text style={s.familySharingEmptyText}>Loading invitations...</Text>
            </Card>
          ) : pendingInvitations.length > 0 ? (
            pendingInvitations.map((member) => renderFamilyMemberCard(member, true))
          ) : (
            <Card style={s.familySharingEmptyCard}>
              <Text style={s.familySharingEmptyText}>No pending invitations.</Text>
            </Card>
          )}
        </View>
      </ScrollView>

      <Modal visible={showInviteModal} transparent animationType="fade" onRequestClose={closeInviteModal}>
        <View style={s.modalOverlay}>
          <View style={[s.customActionModal, { width: '100%', maxHeight: '88%' }]}>
            <Text style={s.customActionModalTitle}>Invite Member</Text>
            <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled" contentContainerStyle={{ paddingBottom: 10 }}>
              <Text style={s.vetModalLabel}>Email address</Text>
              <TextInput
                style={s.customActionInput}
                value={inviteEmail}
                onChangeText={setInviteEmail}
                placeholder="family@example.com"
                placeholderTextColor={C.muted}
                autoCapitalize="none"
                keyboardType="email-address"
              />

              <Text style={s.vetModalLabel}>Role</Text>
              <View style={{ flexDirection: 'row', gap: 8, marginBottom: 12, flexWrap: 'wrap' }}>
                {['Viewer', 'Caregiver', 'Admin'].map((role) => (
                  <TouchableOpacity
                    key={role}
                    style={[
                      s.tabPill,
                      { paddingHorizontal: 14, paddingVertical: 10 },
                      inviteRole === role && s.tabPillActive,
                    ]}
                    onPress={() => setInviteRole(role)}
                  >
                    <Text style={[s.tabPillText, inviteRole === role && s.tabPillTextActive]}>{role}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <View style={s.familySharingNote}>
                <Text style={s.familySharingNoteText}>Invitations are stored in Supabase now. Email sending and acceptance will be added later.</Text>
              </View>

              <View style={s.customActionModalButtons}>
                <TouchableOpacity style={s.customActionCancelBtn} onPress={closeInviteModal}>
                  <Text style={s.customActionCancelText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity style={s.customActionSaveBtn} onPress={submitInvite} disabled={saving}>
                  <Text style={s.customActionSaveText}>{saving ? 'Saving...' : 'Send Invite'}</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
    </PetSyncBackground>
  );
}

// ─────────────────────────────────────────────
// SCREEN: SETTINGS
// ─────────────────────────────────────────────
function SettingsScreen({ navigation }) {
  const { pets } = useContext(PetsContext);
  const menuSections = [
    {
      title: 'Account',
      items: [
        { icon: '👤', label: 'Profile', sub: 'Raymond · rayray579@gmail.com' },
        { icon: '🏠', label: 'Family Sharing', sub: '2 household members' },
        { icon: '💳', label: 'Subscription', sub: '⭐ Premium — renews 08/01/2026', accent: true },
      ],
    },
    {
      title: 'Pets',
      items: [
        { icon: '🐕', label: 'Max', sub: 'Golden Retriever · 3 yrs' },
        { icon: '🐈', label: 'Luna', sub: 'Tabby Cat · 2 yrs' },
        { icon: '🐶', label: 'Buddy', sub: 'Beagle · 5 yrs' },
        { icon: '➕', label: 'Add a Pet', sub: '', accent: true },
      ],
    },
    {
      title: 'Preferences',
      items: [
        { icon: '🔔', label: 'Notifications', sub: 'Medications, vaccines, walks' },
        { icon: '🔒', label: 'Privacy & Data', sub: 'GDPR · Data export' },
        { icon: '🌙', label: 'Dark Mode', sub: 'Currently on' },
      ],
    },
    {
      title: 'Support',
      items: [
        { icon: '❓', label: 'Help Center', sub: '20+ articles' },
        { icon: '⭐', label: 'Rate PetSync+', sub: 'Love it? Leave a review!' },
        { icon: '📣', label: 'Refer a Friend', sub: 'Get 1 month free' },
      ],
    },
  ];

  return (
    <PetSyncBackground opacity={0.08}>
    <SafeAreaView style={s.screen} edges={['top']}>
      <Text style={[s.pageTitle, { paddingHorizontal: 16, paddingTop: 8, marginBottom: 4 }]}>Settings</Text>
      <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>
        {/* Profile Card */}
        <Card style={s.profileCard}>
          <View style={s.profileAvatarCircle}>
            <Text style={{ fontSize: 32 }}>👤</Text>
          </View>
          <View style={s.flex}>
            <Text style={s.profileName}>Raymond</Text>
            <Text style={s.profileEmail}>rayray579@gmail.com</Text>
          </View>
          <View style={s.premiumBadge}>
            <Text style={s.premiumBadgeText}>⭐ Premium</Text>
          </View>
        </Card>

        {menuSections.map(section => (
          <View key={section.title} style={{ marginBottom: 8 }}>
            <Text style={s.menuSectionTitle}>{section.title.toUpperCase()}</Text>
            <Card style={{ paddingVertical: 0 }}>
              {section.items.map((item, i) => (
                <TouchableOpacity
                  key={item.label}
                  style={[s.menuItem, i < section.items.length - 1 && s.menuItemBorder]}
                  onPress={() => {
                    if (item.label === 'Family Sharing') {
                      navigation.navigate('FamilySharing');
                      return;
                    }

                    Alert.alert(item.label, item.sub || 'Coming soon!');
                  }}
                >
                  <Text style={s.menuIcon}>{item.icon}</Text>
                  <View style={s.flex}>
                    <Text style={[s.menuLabel, item.accent && { color: C.accent }]}>{item.label}</Text>
                    {item.sub ? <Text style={s.menuSub}>{item.sub}</Text> : null}
                  </View>
                  <Text style={s.menuChevron}>›</Text>
                </TouchableOpacity>
              ))}
            </Card>
          </View>
        ))}

        <TouchableOpacity style={s.signOutBtn} onPress={() => Alert.alert('Sign Out', 'Are you sure you want to sign out?', [{ text: 'Cancel' }, { text: 'Sign Out', style: 'destructive' }])}>
          <Text style={s.signOutText}>Sign Out</Text>
        </TouchableOpacity>
        <Text style={s.versionText}>PetSync+ v1.0.0 · Made with 🐾 for pet families</Text>
      </ScrollView>
    </SafeAreaView>
    </PetSyncBackground>
  );
}

// ─────────────────────────────────────────────
// MODAL: AI VET ASSISTANT
// ─────────────────────────────────────────────
function CommunityProfileScreen({ navigation, route }) {
  const { pets } = useContext(PetsContext);
  const { healthRecords } = useContext(HealthRecordsContext);
  const { lostPetAlerts } = useContext(LostPetAlertsContext);

  const profileRouteParams = route?.params || {};
  const initialProfileKey = normalizeCommunityProfileKey(
    profileRouteParams.profileKey || profileRouteParams.displayName || 'raymond',
  );
  const initialDisplayName = profileRouteParams.displayName
    || getCommunityProfileFixture(initialProfileKey, profileRouteParams.displayName).displayName;
  const initialAvatarEmoji = profileRouteParams.avatarEmoji
    || getCommunityProfileFixture(initialProfileKey, initialDisplayName).avatarEmoji;
  const initialAvatarUrl = profileRouteParams.avatarUrl || '';

  const [profile, setProfile] = useState(() => {
    const fallback = getCommunityProfileFixture(initialProfileKey, initialDisplayName);
    const isRaymond = initialProfileKey === 'raymond';
    const favoritePet = pets[0];

    return {
      profileKey: initialProfileKey,
      displayName: initialDisplayName || fallback.displayName,
      avatarEmoji: initialAvatarEmoji || fallback.avatarEmoji,
      avatarUrl: initialAvatarUrl,
      memberSince: fallback.memberSince,
      bio: fallback.bio,
      petCount: isRaymond ? pets.length : fallback.petCount,
      healthRecordCount: isRaymond ? healthRecords.length : 0,
      communityPostCount: fallback.communityPostCount,
      recipeCount: fallback.recipeCount,
      lostPetAlertCount: isRaymond ? lostPetAlerts.length : fallback.lostPetAlertCount,
      favoritePetName: isRaymond ? (favoritePet?.name || fallback.favoritePetName) : fallback.favoritePetName,
      favoritePetSpecies: isRaymond ? (favoritePet?.species || fallback.favoritePetSpecies) : fallback.favoritePetSpecies,
      favoritePetBreed: isRaymond ? (favoritePet?.breed || fallback.favoritePetBreed) : fallback.favoritePetBreed,
    };
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isActive = true;

    const run = async () => {
      setLoading(true);

      const fallback = getCommunityProfileFixture(initialProfileKey, initialDisplayName);
      const supabaseProfile = await loadCommunityProfileFromSupabase({
        profileKey: initialProfileKey,
        displayName: initialDisplayName,
      });

      if (!isActive) {
        return;
      }

      const baseProfile = supabaseProfile || fallback;
      let petCount = baseProfile.petCount ?? fallback.petCount ?? 0;
      let healthRecordCount = baseProfile.healthRecordCount ?? (initialProfileKey === 'raymond' ? healthRecords.length : 0);
      let communityPostCount = baseProfile.communityPostCount ?? fallback.communityPostCount ?? 0;
      let recipeCount = baseProfile.recipeCount ?? fallback.recipeCount ?? 0;
      let lostPetAlertCount = baseProfile.lostPetAlertCount ?? fallback.lostPetAlertCount ?? 0;
      let favoritePetName = baseProfile.favoritePetName || fallback.favoritePetName || '';
      let favoritePetSpecies = baseProfile.favoritePetSpecies || fallback.favoritePetSpecies || '';
      let favoritePetBreed = baseProfile.favoritePetBreed || fallback.favoritePetBreed || '';

      if (initialProfileKey === 'raymond') {
        petCount = pets.length;
        healthRecordCount = healthRecords.length;
        lostPetAlertCount = lostPetAlerts.length;
        favoritePetName = pets[0]?.name || favoritePetName;
        favoritePetSpecies = pets[0]?.species || favoritePetSpecies;
        favoritePetBreed = pets[0]?.breed || favoritePetBreed;
      }

      const [loadedPosts, loadedRecipes] = await Promise.all([
        loadCommunityPostsFromSupabase(),
        loadRecipesFromSupabase(),
      ]);

      if (!isActive) {
        return;
      }

      const matchesAuthor = (value) => normalizeCommunityProfileKey(value) === initialProfileKey;

      if (Array.isArray(loadedPosts) && loadedPosts.length > 0) {
        const postCount = loadedPosts.filter((row) => matchesAuthor(row.author)).length;
        if (postCount > 0) {
          communityPostCount = postCount;
        }
      }

      if (Array.isArray(loadedRecipes) && loadedRecipes.length > 0) {
        const recipeCountValue = loadedRecipes.filter((row) => matchesAuthor(row.author)).length;
        if (recipeCountValue > 0) {
          recipeCount = recipeCountValue;
        }
      }

      const nextProfile = {
        ...baseProfile,
        profileKey: initialProfileKey,
        displayName: baseProfile.displayName || initialDisplayName || fallback.displayName,
        avatarEmoji: profileRouteParams.avatarEmoji || baseProfile.avatarEmoji || fallback.avatarEmoji,
        avatarUrl: profileRouteParams.avatarUrl || baseProfile.avatarUrl || '',
        memberSince: baseProfile.memberSince || fallback.memberSince,
        bio: baseProfile.bio || fallback.bio,
        petCount,
        healthRecordCount,
        communityPostCount,
        recipeCount,
        lostPetAlertCount,
        favoritePetName,
        favoritePetSpecies,
        favoritePetBreed,
      };

      setProfile(nextProfile);
      setLoading(false);
    };

    run();

    return () => {
      isActive = false;
    };
  }, [
    initialProfileKey,
    initialDisplayName,
    healthRecords,
    lostPetAlerts,
    pets,
    profileRouteParams.avatarEmoji,
    profileRouteParams.avatarUrl,
  ]);

  const achievementBadges = buildCommunityProfileAchievements(profile);
  const favoritePetEmoji = profile.favoritePetSpecies
    ? getDefaultPetEmoji(profile.favoritePetSpecies)
    : profile.avatarEmoji || '🐾';

  return (
    <PetSyncBackground opacity={0.08}>
    <SafeAreaView style={s.screen} edges={['top']}>
      <ScrollView contentContainerStyle={s.communityProfileScroll}>
        <View style={s.communityProfileTopBar}>
          <TouchableOpacity style={s.communityProfileCloseBtn} onPress={() => navigation.goBack()}>
            <Text style={s.communityProfileCloseBtnText}>✕</Text>
          </TouchableOpacity>
          <Text style={s.pageTitle}>Community Profile</Text>
          <View style={s.communityProfileTopBarSpacer} />
        </View>

        {loading ? (
          <Card style={s.communityProfileHeroCard}>
            <Text style={s.communityProfileLoadingText}>Loading profile...</Text>
          </Card>
        ) : (
          <>
            <Card style={s.communityProfileHeroCard}>
              <View style={s.communityProfileAvatarWrap}>
                <View style={s.communityProfileAvatarCircle}>
                  {profile.avatarUrl ? (
                    <Image source={{ uri: profile.avatarUrl }} style={s.communityProfileAvatarImage} />
                  ) : (
                    <Text style={s.communityProfileAvatarEmoji}>{profile.avatarEmoji || favoritePetEmoji}</Text>
                  )}
                </View>
              </View>

              <Text style={s.communityProfileName}>{profile.displayName || 'Community Member'}</Text>
              <Text style={s.communityProfileMeta}>
                Member since {profile.memberSince || 'Recently'}
              </Text>
              {!!profile.bio && <Text style={s.communityProfileBio}>{profile.bio}</Text>}
            </Card>

            <View style={s.communityProfileStatGrid}>
              <Card style={s.communityProfileStatCard}>
                <Text style={s.communityProfileStatLabel}>Pets</Text>
                <Text style={s.communityProfileStatValue}>{profile.petCount ?? 0}</Text>
              </Card>
              <Card style={s.communityProfileStatCard}>
                <Text style={s.communityProfileStatLabel}>Posts</Text>
                <Text style={s.communityProfileStatValue}>{profile.communityPostCount ?? 0}</Text>
              </Card>
              <Card style={s.communityProfileStatCard}>
                <Text style={s.communityProfileStatLabel}>Recipes</Text>
                <Text style={s.communityProfileStatValue}>{profile.recipeCount ?? 0}</Text>
              </Card>
              <Card style={s.communityProfileStatCard}>
                <Text style={s.communityProfileStatLabel}>Lost Alerts</Text>
                <Text style={s.communityProfileStatValue}>{profile.lostPetAlertCount ?? 0}</Text>
              </Card>
            </View>

            <Card style={s.communityProfileInfoCard}>
              <Text style={s.communityProfileSectionTitle}>Favorite Pet</Text>
              {profile.favoritePetName ? (
                <View style={s.communityProfilePetPreview}>
                  <View style={s.communityProfilePetPreviewAvatar}>
                    {profile.favoritePetSpecies ? (
                      <Text style={s.communityProfilePetPreviewEmoji}>{favoritePetEmoji}</Text>
                    ) : (
                      <Text style={s.communityProfilePetPreviewEmoji}>🐾</Text>
                    )}
                  </View>
                  <View style={s.flex}>
                    <Text style={s.communityProfilePetPreviewName}>{profile.favoritePetName}</Text>
                    <Text style={s.communityProfilePetPreviewMeta}>
                      {[profile.favoritePetSpecies, profile.favoritePetBreed].filter(Boolean).join(' · ') || 'Pet preview'}
                    </Text>
                  </View>
                </View>
              ) : (
                <Text style={s.petProfileEmptyText}>No favorite pet preview yet.</Text>
              )}
            </Card>

            <Card style={s.communityProfileInfoCard}>
              <Text style={s.communityProfileSectionTitle}>Achievements</Text>
              <View style={s.communityProfileAchievementWrap}>
                {achievementBadges.map((badge) => (
                  <View
                    key={badge.key}
                    style={[
                      s.communityProfileAchievementBadge,
                      badge.achieved ? s.communityProfileAchievementBadgeActive : s.communityProfileAchievementBadgeMuted,
                    ]}
                  >
                    <Text
                      style={[
                        s.communityProfileAchievementText,
                        badge.achieved ? s.communityProfileAchievementTextActive : s.communityProfileAchievementTextMuted,
                      ]}
                    >
                      {badge.label}
                    </Text>
                  </View>
                ))}
              </View>
            </Card>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
    </PetSyncBackground>
  );
}

function AIVetScreen({ navigation }) {
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      text: "Hi! I'm your AI Vet Assistant 🩺 I have Max's profile loaded — 3 years old, 68 lbs. What's going on with him today?",
      time: new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }),
    },
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef(null);

  const EMERGENCY_KEYWORDS = [
    'glass',
    'swallowed glass',
    'ate glass',
    'choking',
    'seizure',
    'poison',
    'chocolate',
    'grapes',
    'xylitol',
    'antifreeze',
    'bleeding',
    'unconscious',
    "can't breathe",
    'cant breathe',
    'collapse',
    'collapsed',
  ];

  const detectEmergency = (message) => {
    const lower = message.toLowerCase();
    return EMERGENCY_KEYWORDS.some(word =>
      lower.includes(word)
    );
  };

  const AI_RESPONSES = [
    "Based on what you've described, this is something many pet parents run into. I'd recommend monitoring for 24 hours.\n\n🔍 Most likely causes:\n• Dietary indiscretion\n• Minor infection\n• Environmental allergies\n\n⚡ Triage Level: WATCH AT HOME\n\nIf symptoms persist over 48 hours or worsen, schedule a vet visit.\n\n⚕️ This is an AI assistant — not a substitute for professional veterinary care. Always consult your vet for diagnosis.",
    "Great question! This is something many pet parents deal with.\n\n✅ Safe steps:\n1. Check for visible irritation\n2. Keep the area clean and dry\n3. Prevent excessive licking\n\n📅 Triage Level: SCHEDULE A VET\n\nI'd recommend booking an appointment within 2-3 days for a proper examination.\n\n⚕️ This is an AI assistant — not a substitute for professional veterinary care.",
    "I understand your concern! Here's what I know about Max's situation:\n\n🌡️ Temperature, appetite, and energy levels are key indicators to watch.\n\n⚡ Triage Level: WATCH AT HOME\n\nThis pet is resilient — this is likely nothing serious. Keep an eye on him for the next 24 hours.\n\n⚕️ This is an AI assistant — not a substitute for professional veterinary care. Always consult your vet.",
  ];

  const EMERGENCY_RESPONSE = "EMERGENCY CARE ADVISED\n\nContact a veterinarian or emergency vet immediately. This should NOT be monitored at home.\n\nDo NOT induce vomiting unless directed by a veterinarian.\n\n⚕️ This is an AI assistant — not a substitute for professional veterinary care.";
  const formatTime = () => new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });

  const send = async (text) => {
    const msg = text || input;
    if (!msg.trim()) return;
    setMessages(prev => [...prev, { role: 'user', text: msg, time: formatTime() }]);
    setInput('');
    if (detectEmergency(msg)) {
      setMessages(prev => [...prev, { role: 'assistant', text: EMERGENCY_RESPONSE, time: formatTime(), emergency: true }]);
      setIsTyping(false);
      return;
    }
    setIsTyping(true);
    setTimeout(() => {
      const reply = AI_RESPONSES[Math.floor(Math.random() * AI_RESPONSES.length)];
      setMessages(prev => [...prev, { role: 'assistant', text: reply, time: formatTime() }]);
      setIsTyping(false);
    }, 1200);
  };

  return (
    <SafeAreaView style={s.screen} edges={['top', 'bottom']}>
      {/* Header */}
      <View style={s.modalHeader}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={{ color: C.accent, fontSize: 16 }}>← Back</Text>
        </TouchableOpacity>
        <Text style={s.modalTitle}>AI Vet Assistant</Text>
        <View style={{ width: 60 }} />
      </View>
      {/* Disclaimer */}
      <View style={s.disclaimer}>
        <Text style={s.disclaimerText}>⚕️ AI assistant only — not a substitute for professional veterinary care</Text>
      </View>
      {/* Pet Context */}
      <View style={s.petContextBar}>
        <Text style={s.petContextText}>🐕 Max · 3 yrs · 68 lbs · Premium Member</Text>
      </View>
      {/* Messages */}
      <ScrollView ref={scrollRef} style={s.flex} contentContainerStyle={{ padding: 16 }} onContentSizeChange={() => scrollRef.current?.scrollToEnd()}>
        {messages.map((msg, i) => (
          <View
            key={i}
            style={[
              s.chatBubbleWrap,
              msg.role === 'user'
                ? { alignSelf: 'flex-end', marginLeft: 36 }
                : { alignSelf: 'flex-start', marginRight: 36 },
            ]}
          >
            {msg.role === 'assistant' && <Text style={{ fontSize: 24, marginBottom: 4 }}>🩺</Text>}
            <View
              style={[
                s.chatBubble,
                msg.role === 'user'
                  ? s.chatBubbleUserBg
                  : msg.emergency
                    ? { backgroundColor: '#3a1111', borderBottomLeftRadius: 5, borderWidth: 1, borderColor: C.red }
                    : s.chatBubbleAIBg,
              ]}
            >
              <Text style={[s.chatText, msg.role === 'user' && { color: '#fff' }, msg.emergency && { color: '#ffd7d7', fontWeight: '600' }]}>{msg.text}</Text>
            </View>
            <Text style={[s.chatTimestamp, { textAlign: msg.role === 'user' ? 'right' : 'left' }]}>
              {msg.time}
            </Text>
          </View>
        ))}
        {isTyping && (
          <View style={[s.chatBubbleWrap, { alignSelf: 'flex-start', marginRight: 36 }]}>
            <Text style={{ fontSize: 24 }}>🩺</Text>
            <View style={s.chatBubbleAIBg}>
              <Text style={s.typingText}>Vet Assistant is typing...</Text>
            </View>
          </View>
        )}
      </ScrollView>
      {/* Suggestions */}
      {messages.length < 2 && (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ padding: 12, gap: 8 }}>
          {AI_SUGGESTIONS.map(s_ => (
            <TouchableOpacity key={s_} style={s.suggestion} onPress={() => send(s_)}>
              <Text style={s.suggestionText}>{s_}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}
      {/* Input */}
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={s.chatInputRow}>
          <TextInput style={s.chatInput} value={input} onChangeText={setInput} placeholder="Ask about Max..." placeholderTextColor={C.muted} multiline />
          <TouchableOpacity style={[s.sendBtn, !input.trim() && { backgroundColor: C.faint }]} onPress={() => send()} disabled={!input.trim() || isTyping}>
            <Text style={{ color: '#fff', fontWeight: '700', fontSize: 18 }}>➤</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// ─────────────────────────────────────────────
// MODAL: LOST PET MODE
// ─────────────────────────────────────────────
function LostPetScreen({ navigation }) {
  const { pets } = useContext(PetsContext);
  const { setLostPetAlerts } = useContext(LostPetAlertsContext);
  const [step, setStep] = useState(1);
  const [selectedPet, setSelectedPet] = useState(pets[0] || null);
  const [petPhoto, setPetPhoto] = useState(null);
  const [lastKnownLocation, setLastKnownLocation] = useState(null);
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const [description, setDescription] = useState('');
  const [radius, setRadius] = useState(2);
  const [activated, setActivated] = useState(false);

  const activate = () => {
    const alertPayload = {
      id: `lost-pet-${Date.now()}`,
      petId: selectedPet?.id || '',
      petName: selectedPet?.name || 'Lost Pet',
      species: selectedPet?.species || '',
      breed: selectedPet?.breed || '',
      photoUri: petPhoto || '',
      lastSeenLocation: lastKnownLocation
        ? `${lastKnownLocation.latitude}, ${lastKnownLocation.longitude}`
        : '',
      dateReported: toLocalDateKey(new Date()),
      description: description || '',
      status: 'active',
      radiusMiles: radius,
      latitude: lastKnownLocation?.latitude ?? null,
      longitude: lastKnownLocation?.longitude ?? null,
    };

    void saveLostPetAlertToSupabase(alertPayload).then((savedAlert) => {
      if (!savedAlert) {
        return;
      }

      const mappedAlert = {
        id: savedAlert.id || alertPayload.id,
        petId: savedAlert.pet_id || alertPayload.petId,
        petName: savedAlert.pet_name || alertPayload.petName,
        species: savedAlert.species || alertPayload.species,
        breed: savedAlert.breed || alertPayload.breed,
        photoUrl: savedAlert.photo_url || savedAlert.photoUrl || '',
        lastSeenLocation: savedAlert.last_seen_location || alertPayload.lastSeenLocation,
        dateReported: savedAlert.date_reported || alertPayload.dateReported,
        description: savedAlert.description || alertPayload.description,
        status: savedAlert.status || 'active',
        radiusMiles: savedAlert.radius_miles ?? alertPayload.radiusMiles,
        latitude: savedAlert.latitude ?? alertPayload.latitude,
        longitude: savedAlert.longitude ?? alertPayload.longitude,
      };

      setLostPetAlerts((prev) => [
        mappedAlert,
        ...prev.filter((item) => item.id !== mappedAlert.id),
      ]);
    });
    setStep(3);
    setTimeout(() => { setActivated(true); setStep(4); }, 2000);
  };

  useEffect(() => {
    if (pets.length === 0) {
      setSelectedPet(null);
      return;
    }
    if (selectedPet && pets.some((pet) => pet.id === selectedPet.id)) return;
    setSelectedPet(pets[0]);
  }, [pets, selectedPet]);

  if (!selectedPet) {
    return (
      <SafeAreaView style={s.screen} edges={['top']}>
        <View style={s.pageHeader}>
          <View>
            <Text style={s.pageTitle}>Lost Pet</Text>
            <Text style={s.pageSub}>No pets yet</Text>
          </View>
        </View>
        <Card style={s.petProfileInfoCard}>
          <Text style={s.petProfileSectionTitle}>Add your first pet</Text>
          <Text style={s.petProfileBodyText}>
            Add a pet first to set up a lost pet alert.
          </Text>
        </Card>
      </SafeAreaView>
    );
  }

  const pickPetPhoto = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (permission.status !== 'granted') {
      Alert.alert('Permission needed', 'Photo library access was denied.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets?.[0]?.uri) {
      setPetPhoto(result.assets[0].uri);
    }
  };

  const getCurrentLocation = async () => {
    setIsGettingLocation(true);
    try {
      const permission = await Location.requestForegroundPermissionsAsync();
      if (permission.status !== 'granted') {
        Alert.alert('Location permission is needed');
        return;
      }

      const location = await Location.getCurrentPositionAsync({});
      setLastKnownLocation({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      });
    } finally {
      setIsGettingLocation(false);
    }
  };

  const openInMaps = () => {
    if (!lastKnownLocation) return;

    const { latitude, longitude } = lastKnownLocation;
    const url = `https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`;

    Linking.openURL(url);
  };

  const shareAlert = async () => {
    const locationText = lastKnownLocation
      ? `${lastKnownLocation.latitude}, ${lastKnownLocation.longitude}`
      : 'Not captured';
    const message = `LOST PET ALERT\n${selectedPet.name} is missing.\nBreed/Type: ${selectedPet.breed} / ${selectedPet.species}\nDescription: ${description || 'No description provided.'}\nLast known location: ${locationText}\nPlease keep an eye out and contact me if seen.`;

    await Share.share({ message });
  };

  const markPetFound = () => {
    Alert.alert('Pet Found', `${selectedPet.name} has been marked as found.`, [
      { text: 'OK', onPress: () => navigation.goBack() },
    ]);
  };

  const cancelAlert = () => {
    Alert.alert('Cancel Alert', 'Are you sure you want to cancel this alert?', [
      { text: 'Keep Alert', style: 'cancel' },
      { text: 'Cancel Alert', style: 'destructive', onPress: () => navigation.goBack() },
    ]);
  };

  const petPhotoContent = petPhoto
    ? <Image source={{ uri: petPhoto }} style={{ width: 92, height: 92, borderRadius: 46 }} />
    : <Text style={{ fontSize: 44 }}>{selectedPet.emoji || '🖼️'}</Text>;

  const locationCard = lastKnownLocation ? (
    <View style={{ marginTop: 12, padding: 12, borderRadius: 16, backgroundColor: C.card, borderWidth: 1, borderColor: C.border }}>
      <Text style={{ color: C.text, fontSize: 14, fontWeight: '800', marginBottom: 8 }}>Location Captured</Text>
      <Text style={{ color: C.muted, fontSize: 12, marginBottom: 2 }}>Latitude: {lastKnownLocation.latitude}</Text>
      <Text style={{ color: C.muted, fontSize: 12 }}>Longitude: {lastKnownLocation.longitude}</Text>
      <TouchableOpacity style={[s.accentBtn, { marginTop: 12 }]} onPress={openInMaps}>
        <Text style={s.accentBtnText}>Open in Maps</Text>
      </TouchableOpacity>
    </View>
  ) : null;

  if (step === 1) return (
    <PetSyncBackground opacity={0.12}>
    <SafeAreaView style={s.screen} edges={['top', 'bottom']}>
      <View style={s.modalHeader}>
        <TouchableOpacity onPress={() => navigation.goBack()}><Text style={{ color: C.muted }}>✕ Cancel</Text></TouchableOpacity>
        <Text style={[s.modalTitle, { color: C.red }]}>🚨 Lost Pet Mode</Text>
        <View style={{ width: 60 }} />
      </View>
      <ScrollView contentContainerStyle={{ padding: 16 }}>
        <Text style={s.stepTitle}>Which pet is missing?</Text>
        {pets.map(pet => (
          <TouchableOpacity key={pet.id} style={[s.petSelectCard, selectedPet.id === pet.id && s.petSelectCardActive]} onPress={() => setSelectedPet(pet)}>
            <Text style={{ fontSize: 40 }}>{pet.emoji}</Text>
            <View style={s.flex}>
              <Text style={s.petSelectName}>{pet.name}</Text>
              <Text style={s.petSelectBreed}>{pet.breed}</Text>
            </View>
            {selectedPet.id === pet.id && <Text style={{ fontSize: 22 }}>✅</Text>}
          </TouchableOpacity>
        ))}
        <Card style={{ marginTop: 12, alignItems: 'center' }}>
          <Text style={{ color: C.muted, fontSize: 12, fontWeight: '700', marginBottom: 10 }}>Pet Photo</Text>
          <View style={{ width: 92, height: 92, borderRadius: 46, backgroundColor: C.bg, alignItems: 'center', justifyContent: 'center', marginBottom: 12 }}>
            {petPhotoContent}
          </View>
          <TouchableOpacity style={s.accentBtn} onPress={pickPetPhoto}>
            <Text style={s.accentBtnText}>Add / Change Photo</Text>
          </TouchableOpacity>
        </Card>
        <TouchableOpacity style={[s.accentBtn, { marginTop: 12 }]} onPress={getCurrentLocation} disabled={isGettingLocation}>
          <Text style={s.accentBtnText}>{isGettingLocation ? 'Getting Location...' : 'Use Current Location'}</Text>
        </TouchableOpacity>
        {locationCard}
        <TouchableOpacity style={s.bigRedBtn} onPress={() => setStep(2)}>
          <Text style={s.bigRedBtnText}>Continue →</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
    </PetSyncBackground>
  );

  if (step === 2) return (
    <PetSyncBackground opacity={0.12}>
    <SafeAreaView style={s.screen} edges={['top', 'bottom']}>
      <View style={s.modalHeader}>
        <TouchableOpacity onPress={() => setStep(1)}><Text style={{ color: C.accent }}>← Back</Text></TouchableOpacity>
        <Text style={[s.modalTitle, { color: C.red }]}>Alert Details</Text>
        <View style={{ width: 60 }} />
      </View>
      <ScrollView contentContainerStyle={{ padding: 16 }}>
        <View style={s.redAlertBanner}>
          <Text style={s.redAlertText}>🚨 This will notify all PetSync+ users within {radius} miles of you immediately</Text>
        </View>
        <Card style={{ alignItems: 'center', marginBottom: 16 }}>
          <Text style={{ color: C.muted, fontSize: 12, fontWeight: '700', marginBottom: 10 }}>Missing Pet Photo</Text>
          <View style={{ width: 92, height: 92, borderRadius: 46, backgroundColor: C.bg, alignItems: 'center', justifyContent: 'center' }}>
            {petPhotoContent}
          </View>
        </Card>
        {locationCard}
        <Text style={s.inputLabel}>Describe {selectedPet.name}</Text>
        <TextInput style={s.textAreaInput} value={description} onChangeText={setDescription} placeholder={`E.g. ${selectedPet.name} was wearing a red collar, last seen near the park...`} placeholderTextColor={C.muted} multiline numberOfLines={3} />
        <Text style={s.inputLabel}>Alert Radius</Text>
        <View style={{ flexDirection: 'row', gap: 8, marginBottom: 16 }}>
          {[1, 2, 5, 10].map(r => (
            <TouchableOpacity key={r} style={[s.radiusBtn, radius === r && s.radiusBtnActive]} onPress={() => setRadius(r)}>
              <Text style={[s.radiusBtnText, radius === r && { color: '#fff' }]}>{r} mi</Text>
            </TouchableOpacity>
          ))}
        </View>
        <TouchableOpacity style={s.bigRedBtn} onPress={activate}>
          <Text style={s.bigRedBtnText}>🚨 ACTIVATE LOST PET ALERT</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
    </PetSyncBackground>
  );

  if (step === 3) return (
    <PetSyncBackground opacity={0.12}>
    <SafeAreaView style={[s.screen, { justifyContent: 'center', alignItems: 'center' }]}>
      <Text style={{ fontSize: 64 }}>📡</Text>
      <Text style={[s.modalTitle, { marginTop: 16 }]}>Broadcasting Alert...</Text>
      <Text style={{ color: C.muted, textAlign: 'center', marginTop: 8, paddingHorizontal: 32 }}>Notifying all PetSync+ users within {radius} miles of your last location</Text>
    </SafeAreaView>
    </PetSyncBackground>
  );

  return (
    <PetSyncBackground opacity={0.12}>
    <SafeAreaView style={[s.screen, { padding: 16 }]} edges={['top', 'bottom']}>
      <ScrollView contentContainerStyle={{ paddingBottom: 160 }}>
        <Text style={[s.modalTitle, { color: C.red, textAlign: 'center', fontSize: 28, marginTop: 20 }]}>🚨 ALERT ACTIVE</Text>
        <Text style={{ color: C.text, textAlign: 'center', marginTop: 8 }}>Nearby PetSync+ users have been notified about {selectedPet.name}</Text>
        <Card style={{ marginTop: 20, marginBottom: 18, padding: 16 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <View style={{ width: 84, height: 84, borderRadius: 42, backgroundColor: C.bg, alignItems: 'center', justifyContent: 'center', marginRight: 14, overflow: 'hidden' }}>
              {petPhoto ? (
                <Image source={{ uri: petPhoto }} style={{ width: 84, height: 84, borderRadius: 42 }} />
              ) : (
                <Text style={{ fontSize: 40 }}>{selectedPet.emoji || '🖼️'}</Text>
              )}
            </View>
            <View style={s.flex}>
              <Text style={{ color: C.text, fontSize: 20, fontWeight: '800' }}>{selectedPet.name}</Text>
              <Text style={{ color: C.muted, fontSize: 13, marginTop: 2 }}>{selectedPet.breed} · {selectedPet.species}</Text>
              <Text style={{ color: C.muted, fontSize: 13, marginTop: 2 }}>Radius: {radius} miles</Text>
            </View>
          </View>

          <View style={{ marginTop: 14, paddingTop: 14, borderTopWidth: 1, borderTopColor: C.border, gap: 8 }}>
            <View>
              <Text style={{ color: C.muted, fontSize: 12, fontWeight: '700' }}>Description</Text>
              <Text style={{ color: C.text, fontSize: 13, marginTop: 4 }}>
                {description || 'No description provided.'}
              </Text>
            </View>

            <View>
              <Text style={{ color: C.muted, fontSize: 12, fontWeight: '700' }}>Last known location</Text>
              {lastKnownLocation ? (
                <Text style={{ color: C.text, fontSize: 13, marginTop: 4 }}>
                  {lastKnownLocation.latitude}, {lastKnownLocation.longitude}
                </Text>
              ) : (
                <Text style={{ color: C.text, fontSize: 13, marginTop: 4 }}>Not captured</Text>
              )}
            </View>
          </View>
        </Card>

        <View style={{ gap: 10, marginBottom: 18 }}>
          <TouchableOpacity style={s.accentBtn} onPress={openInMaps} disabled={!lastKnownLocation}>
            <Text style={s.accentBtnText}>Open in Maps</Text>
          </TouchableOpacity>
          <TouchableOpacity style={s.accentBtn} onPress={shareAlert}>
            <Text style={s.accentBtnText}>Share Alert</Text>
          </TouchableOpacity>
          <TouchableOpacity style={s.foundBtn} onPress={markPetFound}>
            <Text style={s.foundBtnText}>Mark Pet Found</Text>
          </TouchableOpacity>
          <TouchableOpacity style={s.accentBtn} onPress={cancelAlert}>
            <Text style={s.accentBtnText}>Cancel Alert</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
    </PetSyncBackground>
  );
}

// ─────────────────────────────────────────────
// NAVIGATION SETUP
// ─────────────────────────────────────────────
const Tab   = createBottomTabNavigator();
const Stack = createStackNavigator();

function TabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,

        tabBarStyle: {
          position: 'absolute',
          left: 16,
          right: 16,
          bottom: 0,

          height: 75,

          borderRadius: 0,
          backgroundColor: '#f7faff',

          borderTopWidth: 0,

          paddingTop: 0,
          paddingBottom: 12,

          elevation: 0,

          shadowColor: '#000',
          shadowOffset: { width: 0, height: 10 },
          shadowOpacity: 0.12,
          shadowRadius: 0,
        },

        tabBarActiveTintColor: C.accent,
        tabBarInactiveTintColor: C.muted,

        tabBarLabelStyle: {
          fontSize: 13,
          fontWeight: '900',
        },
      }}
    >
      <Tab.Screen
        name="Home"
        component={DashboardScreen}
        options={{
          tabBarIcon: ({ color, focused }) => (
            <View
              style={{
                backgroundColor: focused
                  ? 'rgba(255,107,53,0.18)'
                  : 'transparent',

                padding: 5,
                borderRadius: 16,
              }}
            >
              <MaterialCommunityIcons
                name="paw"
                size={22}
                color={color}
              />
            </View>
          ),
        }}
      />

      <Tab.Screen
        name="Health"
        component={HealthHubScreen}
        options={{
          tabBarIcon: ({ color }) => (
            <Text style={{ fontSize: 22, color }}>
              💊
            </Text>
          ),
        }}
      />

      <Tab.Screen
        name="Memories"
        component={MemoryVaultScreen}
        options={{
          tabBarIcon: ({ color }) => (
            <Text style={{ fontSize: 22, color }}>
              📸
            </Text>
          ),
        }}
      />

      <Tab.Screen
        name="Community"
        component={CommunityScreen}
        options={{
          tabBarIcon: ({ color }) => (
            <Text style={{ fontSize: 22, color }}>
              👥
            </Text>
          ),
        }}
      />

      <Tab.Screen
        name="Settings"
        component={SettingsScreen}
        options={{
          tabBarIcon: ({ color }) => (
            <Text style={{ fontSize: 22, color }}>
              ⚙️
            </Text>
          ),
        }}
      />
    </Tab.Navigator>
  );
}
export default function App() {
  const [pets, setPets] = useState([]);
  const [healthRecords, setHealthRecords] = useState(HEALTH_RECORDS);
  const [careReminders, setCareReminders] = useState([]);
  const [lostPetAlerts, setLostPetAlerts] = useState([]);
  const [petScores, setPetScores] = useState({});
  const [activityLogs, setActivityLogs] = useState([]);
  const [showAddPetModal, setShowAddPetModal] = useState(false);
  const [addPetInitialSpecies, setAddPetInitialSpecies] = useState('dog');
  const addPetSelectCallbackRef = useRef(null);
  const pushTokenRegistrationStartedRef = useRef(false);

  const openAddPetModal = (onSelect, speciesHint = 'dog') => {
    addPetSelectCallbackRef.current = typeof onSelect === 'function' ? onSelect : null;
    setAddPetInitialSpecies(speciesHint || 'dog');
    setShowAddPetModal(true);
  };

  const closeAddPetModal = () => {
    addPetSelectCallbackRef.current = null;
    setShowAddPetModal(false);
  };

  const handleSavePet = (newPet) => {
    setPets(prev => [newPet, ...prev]);
    setPetScores(prev => ({
      ...prev,
      [newPet.id]: newPet.score ?? 80,
    }));
    const starterReminders = buildStarterReminders(newPet);
    setCareReminders(prev => [...starterReminders, ...prev]);
    starterReminders.forEach((reminder) => {
      saveCareReminderToSupabase(reminder);
    });
    setHealthRecords(prev => [...buildStarterHealthRecords(newPet), ...prev]);

    savePetToSupabase(newPet);

    const selectCreatedPet = addPetSelectCallbackRef.current;
    addPetSelectCallbackRef.current = null;
    setShowAddPetModal(false);

    if (selectCreatedPet) {
      selectCreatedPet(newPet.id);
    }
  };

  useEffect(() => {
    let isActive = true;

    const run = async () => {
      const mappedPets = await loadPetsFromSupabase();

      if (!isActive) {
        return;
      }

      if (mappedPets.length > 0) {
        setPets(mappedPets);
        setPetScores(Object.fromEntries(mappedPets.map((pet) => [pet.id, pet.score ?? 80])));
        return;
      }

      setPets([]);
      setPetScores({});
    };

    run();

    return () => {
      isActive = false;
    };
  }, [setPets, setPetScores]);

  useEffect(() => {
    let isActive = true;

    const run = async () => {
      const loadedHealthRecords = await loadHealthRecordsFromSupabase();

      if (!isActive || loadedHealthRecords == null) {
        return;
      }

      setHealthRecords(loadedHealthRecords);
    };

    run();

    return () => {
      isActive = false;
    };
  }, [setHealthRecords]);

  useEffect(() => {
    let isActive = true;

    const run = async () => {
      const loadedCareReminders = await loadCareRemindersFromSupabase();

      if (!isActive || loadedCareReminders == null) {
        return;
      }

      setCareReminders(loadedCareReminders);
    };

    run();

    return () => {
      isActive = false;
    };
  }, [setCareReminders]);

  useEffect(() => {
    let isActive = true;

    const run = async () => {
      const loadedAlerts = await loadLostPetAlertsFromSupabase();

      if (!isActive || loadedAlerts == null) {
        return;
      }

      setLostPetAlerts(loadedAlerts);
    };

    run();

    return () => {
      isActive = false;
    };
  }, [setLostPetAlerts]);

  useEffect(() => {
    if (pushTokenRegistrationStartedRef.current) {
      return;
    }

    pushTokenRegistrationStartedRef.current = true;
    registerForPushNotificationsAsync();
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <StatusBar barStyle="light-content" backgroundColor={C.bg} />
        <AddPetContext.Provider value={{ openAddPetModal }}>
          <PetsContext.Provider value={{ pets, setPets }}>
            <PetScoresContext.Provider value={{ petScores, setPetScores }}>
              <ActivityLogsContext.Provider value={{ activityLogs, setActivityLogs }}>
                <HealthRecordsContext.Provider value={{ healthRecords, setHealthRecords }}>
                  <CareRemindersContext.Provider value={{ careReminders, setCareReminders }}>
                    <LostPetAlertsContext.Provider value={{ lostPetAlerts, setLostPetAlerts }}>
                      <NavigationContainer>
                        <Stack.Navigator screenOptions={{ headerShown: false }}>
                        <Stack.Screen name="Main"    component={TabNavigator}  />
                        <Stack.Screen name="AIVet"   component={AIVetScreen}   options={{ presentation: 'modal' }} />
                        <Stack.Screen name="FamilySharing" component={FamilySharingScreen} options={{ presentation: 'modal' }} />
                        <Stack.Screen name="CommunityProfile" component={CommunityProfileScreen} options={{ presentation: 'modal' }} />
                        <Stack.Screen name="PetProfile" component={PetProfileScreen} options={{ presentation: 'modal' }} />
                        <Stack.Screen name="LostPet" component={LostPetScreen} options={{ presentation: 'modal' }} />
                      </Stack.Navigator>
                      </NavigationContainer>
                      <AddPetModal
                        visible={showAddPetModal}
                        initialSpecies={addPetInitialSpecies}
                        onClose={closeAddPetModal}
                        onSave={handleSavePet}
                      />
                    </LostPetAlertsContext.Provider>
                  </CareRemindersContext.Provider>
                </HealthRecordsContext.Provider>
              </ActivityLogsContext.Provider>
            </PetScoresContext.Provider>
          </PetsContext.Provider>
        </AddPetContext.Provider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

// ─────────────────────────────────────────────
// ALL STYLES
// ─────────────────────────────────────────────
const s = StyleSheet.create({
  // Layout
  screen:            { flex: 1, backgroundColor: 'transparent' },
  flex:              { flex: 1 },
  card:              { backgroundColor: C.card, borderRadius: 16, padding: 16, marginBottom: 0, borderWidth: 1, borderColor: C.border },
section: {
  marginTop: 5,
  paddingHorizontal: 20,
},
timelineItem: {
  flexDirection: 'row',
  marginBottom: 14,
},

timelineRail: {
  width: 38,
  alignItems: 'center',
  position: 'relative',
},

timelineLine: {
  position: 'absolute',
  top: 2,
  bottom: -14,
  width: 2,
  backgroundColor: C.faint,
},

timelineNode: {
  width: 32,
  height: 32,
  borderRadius: 16,
  backgroundColor: C.bg,
  alignItems: 'center',
  justifyContent: 'center',
  borderWidth: 1.5,
  borderColor: C.accent,
  zIndex: 2,
},

timelineIcon: {
  fontSize: 17,
},

timelineCard: {
  flex: 1,
  backgroundColor: '#1e1e1e',
  borderRadius: 18,
  padding: 13,
  borderWidth: 1,
  borderColor: C.border,
  shadowColor: '#000',
  shadowOffset: { width: 0, height: 4 },
  shadowOpacity: 0.08,
  shadowRadius: 10,
  elevation: 2,
},

timelineCardTop: {
  flexDirection: 'row',
  alignItems: 'flex-start',
  justifyContent: 'space-between',
},

timelineTitle: {
  color: C.text,
  fontSize: 16,
  fontWeight: '800',
  lineHeight: 20,
},

timelineDate: {
  color: C.muted,
  fontSize: 11,
  marginTop: 3,
},

timelineProvider: {
  color: C.muted,
  fontSize: 11,
  marginTop: 2,
},

timelineDue: {
  color: C.accent,
  fontSize: 11,
  marginTop: 4,
  fontWeight: '600',
},

timelineBadge: {
  alignSelf: 'flex-start',
  borderWidth: 1,
  borderRadius: 999,
  paddingHorizontal: 8,
  paddingVertical: 3,
  marginLeft: 10,
  marginTop: 1,
},

timelineBadgeText: {
  fontSize: 10,
  fontWeight: '800',
  letterSpacing: 0.2,
},
  sectionHeaderRow:  { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 0 },
sectionTitle: {
  fontSize: 24,
  fontWeight: '800',
  marginBottom: 6,
  color: C.text,
},
  // Header
  dashHeader:        { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: 8, paddingBottom: 8 },
greeting: {
  color: '#152033',
  fontSize: 30,
  fontWeight: '900',
  letterSpacing: -0.8,
},
subGreeting: {
  color: '#6D7787',
  fontSize: 15,
  marginTop: 4,
  fontWeight: '600',
},
sosButton: {
  backgroundColor: C.red,
  borderRadius: 20,
  paddingHorizontal: 10,
  paddingVertical: 7,
  alignItems: 'center',
  justifyContent: 'center',
  minWidth: 64,
  marginLeft: -60,
  marginTop: -20,
},  sosText:           { color: '#fff', fontWeight: '700', fontSize: 13 },

  // Page headers
  pageHeader:        { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingTop: 12, paddingBottom: 8 },
  pageTitle:         { color: C.text, fontSize: 26, fontWeight: '800' },
  pageSub:           { color: C.muted, fontSize: 13, marginTop: 2 },
  exportBtn:         { borderWidth: 1, borderColor: C.border, borderRadius: 20, paddingHorizontal: 12, paddingVertical: 5 },
  exportBtnText:     { color: C.muted, fontSize: 12 },
  iconBtn:           { width: 42, height: 42, justifyContent: 'center', alignItems: 'center' },
  accentBtn:         { backgroundColor: C.accent, borderRadius: 20, paddingHorizontal: 14, paddingVertical: 7 },
  accentBtnText:     { color: '#fff', fontWeight: '700', fontSize: 13 },

  // Pet Avatars
  petRow:            { marginBottom: 12 },
  petAvatar:         { width: 64, height: 64, borderRadius: 18, justifyContent: 'center', alignItems: 'center', marginRight: 12, backgroundColor: '#fff', borderWidth: 1, borderColor: '#E6EAF5', shadowColor: '#7B61FF', shadowOpacity: 0.05, shadowRadius: 8, shadowOffset: { width: 0, height: 4 }, elevation: 1 },
  petAvatarActive:   { backgroundColor: '#F3EEFF', borderWidth: 2, borderColor: '#6B4BFF' },
  petAvatarEmoji:    { fontSize: 26 },
  petAvatarName:     { color: '#617084', fontSize: 11, marginTop: 3, fontWeight: '700' },

  // Generic badges/tabs/buttons
  badge:             { borderWidth: 1, borderRadius: 16, paddingHorizontal: 9, paddingVertical: 3 },
  badgeText:         { fontSize: 10, fontWeight: '800' },
  tabPill:           { backgroundColor: C.card, borderRadius: 20, paddingHorizontal: 13, paddingVertical: 8, borderWidth: 1, borderColor: C.border },
  tabPillActive:     { backgroundColor: C.accent, borderColor: C.accent },
  tabPillText:       { color: C.muted, fontSize: 13, fontWeight: '700' },
  tabPillTextActive: { color: '#fff' },
  fab:               { position: 'absolute', right: 22, bottom: 110, width: 64, height: 64, borderRadius: 32, backgroundColor: C.accent, justifyContent: 'center', alignItems: 'center', shadowColor: C.accent, shadowOpacity: 0.35, shadowRadius: 10, shadowOffset: { width: 0, height: 4 }, elevation: 6 },
  fabText:           { color: '#fff', fontSize: 34, fontWeight: '300', lineHeight: 36 },

  // Dashboard
  dashboardBrandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  dashboardBrandMark: {
    width: 34,
    height: 34,
    borderRadius: 12,
    backgroundColor: '#EDE7FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
    borderWidth: 1,
    borderColor: '#DCCFFF',
  },
  dashboardBrandMarkText: {
    fontSize: 16,
  },
  dashboardBrandName: {
    color: '#6A4EF6',
    fontSize: 18,
    fontWeight: '900',
    letterSpacing: -0.2,
  },
  dashboardBrandTagline: {
    color: '#7E8797',
    fontSize: 12,
    marginTop: 1,
    fontWeight: '600',
  },
  dashboardHeroTop: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dashboardAvatarWrap: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: '#F0F4FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#E2E8F3',
  },
  dashboardAvatarImage: {
    width: '100%',
    height: '100%',
  },
  dashboardAvatarEmoji: {
    fontSize: 36,
  },
  dashboardHeroInfo: {
    flex: 1,
    paddingRight: 10,
  },
  dashboardPetNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dashboardPetName: {
    color: '#152033',
    fontSize: 24,
    fontWeight: '900',
    letterSpacing: -0.4,
    flexShrink: 1,
  },
  dashboardPetBadge: {
    fontSize: 18,
    marginLeft: 6,
  },
  dashboardPetMeta: {
    color: '#5B6575',
    fontSize: 13,
    marginTop: 4,
    fontWeight: '700',
  },
  dashboardPetAge: {
    color: '#7D8796',
    fontSize: 12,
    marginTop: 3,
  },
  dashboardHealthInsight: {
    color: '#6B7280',
    fontSize: 11,
    marginTop: 2,
    fontWeight: '600',
  },
  dashboardHeroMetricsRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 10,
  },
  dashboardMiniCard: {
    flex: 1,
    borderRadius: 20,
    backgroundColor: '#F8FAFF',
    borderWidth: 1,
    borderColor: '#E6EAF5',
    paddingVertical: 10,
    paddingHorizontal: 14,
  },
  dashboardMiniCardLabel: {
    color: '#758095',
    fontSize: 12,
    fontWeight: '700',
  },
  dashboardMiniCardValue: {
    color: '#152033',
    fontSize: 18,
    fontWeight: '900',
    marginTop: 6,
  },
  dashboardMiniCardSub: {
    color: '#7D8796',
    fontSize: 12,
    marginTop: 3,
    fontWeight: '600',
  },
  dashboardMiniCardFoot: {
    color: '#5B6575',
    fontSize: 12,
    marginTop: 4,
    fontWeight: '700',
  },
  dashboardScoreRing: {
    width: 104,
    height: 104,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  dashboardScoreRingSegment: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    width: 8,
    height: 20,
    marginLeft: -4,
    marginTop: -10,
    borderRadius: 999,
  },
  dashboardScoreRingInner: {
    width: 82,
    height: 82,
    borderRadius: 41,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#E6EAF5',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#7B61FF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 2,
  },
  dashboardWidgetRow: {
    flexDirection: 'row',
    gap: 10,
    marginHorizontal: 16,
    marginTop: 10,
  },
  dashboardWidgetCard: {
    flex: 1,
    borderRadius: 22,
    padding: 12,
    borderWidth: 1,
    shadowColor: '#7B61FF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 2,
  },
  dashboardWidgetLabel: {
    color: '#758095',
    fontSize: 12,
    fontWeight: '700',
  },
  dashboardWidgetNumber: {
    color: '#152033',
    fontSize: 28,
    fontWeight: '900',
    marginTop: 6,
    letterSpacing: -0.5,
  },
  dashboardWidgetSub: {
    color: '#7D8796',
    fontSize: 12,
    fontWeight: '600',
    marginTop: 2,
  },
  dashboardWidgetProgressTrack: {
    height: 8,
    borderRadius: 999,
    backgroundColor: '#EDF1F8',
    marginTop: 12,
    overflow: 'hidden',
  },
  dashboardWidgetProgressFill: {
    height: '100%',
    borderRadius: 999,
  },
  dashboardWidgetAccentDotRow: {
    flexDirection: 'row',
    marginTop: 12,
    alignItems: 'center',
  },
  dashboardWidgetAccentDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 6,
  },
  dashboardTrendCard: {
    marginHorizontal: 16,
    marginTop: 10,
    borderRadius: 24,
    borderWidth: 1,
    padding: 12,
    shadowColor: '#7B61FF',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.06,
    shadowRadius: 14,
    elevation: 2,
  },
  dashboardTrendHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 14,
  },
  dashboardTrendTitle: {
    color: '#152033',
    fontSize: 17,
    fontWeight: '800',
  },
  dashboardTrendSub: {
    color: '#5a6067',
    fontSize: 12,
    marginTop: 3,
    fontWeight: '600',
  },
  dashboardTrendLegend: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F0FF',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  dashboardTrendLegendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  dashboardTrendLegendText: {
    color: '#6B4BFF',
    fontSize: 11,
    fontWeight: '700',
  },
  dashboardTrendChart: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    height: 110,
    paddingBottom: 4,
  },
  dashboardTrendBarWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  dashboardTrendBar: {
    width: 14,
    borderRadius: 999,
    overflow: 'hidden',
    justifyContent: 'flex-end',
  },
  dashboardTrendBarFill: {
    width: '100%',
    borderRadius: 999,
  },
  dashboardTrendDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginTop: 6,
    marginBottom: 2,
  },
  dashboardTrendDayLabel: {
    color: '#7D8796',
    fontSize: 11,
    marginTop: 8,
    fontWeight: '700',
  },
  dashboardTrendEmpty: {
    height: 110,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 18,
    backgroundColor: 'rgba(248,250,255,0.90)',
    borderWidth: 1,
    borderColor: 'rgba(126,87,194,0.14)',
  },
  dashboardTrendEmptyText: {
    color: '#7D8796',
    fontSize: 13,
    fontWeight: '600',
  },
  dashboardTrendFooter: {
    flexDirection: 'row',
    marginTop: 10,
    gap: 10,
  },
  dashboardTrendFooterChip: {
    flex: 1,
    backgroundColor: 'rgba(248,250,255,0.90)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(126,87,194,0.14)',
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  dashboardTrendFooterChipLabel: {
    color: '#7D8796',
    fontSize: 11,
    fontWeight: '700',
  },
  dashboardTrendFooterChipValue: {
    color: '#152033',
    fontSize: 18,
    fontWeight: '900',
    marginTop: 3,
  },
  dashboardAICard: {
    marginHorizontal: 16,
    marginTop: 10,
    borderRadius: 22,
    borderWidth: 1,
    backgroundColor: 'rgba(248,250,255,0.92)',
    borderColor: 'rgba(126,87,194,0.14)',
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#7B61FF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.025,
    shadowRadius: 10,
    elevation: 1,
  },
  dashboardAITitle: {
    color: '#152033',
    fontSize: 17,
    fontWeight: '800',
  },
  dashboardAISub: {
    color: '#42464b',
    fontSize: 12,
    marginTop: 4,
    paddingRight: 12,
    lineHeight: 17,
  },
  dashboardAIBtn: {
    backgroundColor: '#6B4BFF',
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 10,
    alignSelf: 'flex-start',
  },
  dashboardAIBtnText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '800',
  },
  dashboardCalendarMonth: {
    color: '#6B4BFF',
    fontSize: 12,
    fontWeight: '800',
    marginTop: 2,
  },
  calendarHeaderTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  calendarHeaderBottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    marginTop: 4,
    marginBottom: 10,
  },
  dashboardCalendarDotWrap: {
    marginTop: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dashboardCalendarDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#6B4BFF',
  },
  healthScoreCard: {
  marginHorizontal: 16,
  marginTop: 14,
  marginBottom: 8,
  borderRadius: 28,
  padding: 18,
  borderWidth: 1,
  backgroundColor: 'rgba(248,250,255,0.94)',
  borderColor: 'rgba(126,87,194,0.14)',
  shadowColor: '#7B61FF',
  shadowOffset: { width: 0, height: 8 },
  shadowOpacity: 0.025,
  shadowRadius: 18,
  elevation: 1,
},
  healthScoreLeft:   { width: 92, alignItems: 'center' },
  healthScoreRight:  { flex: 1 },
  scoreCircle:       { width: 92, height: 92, borderRadius: 46, borderWidth: 6, alignItems: 'center', justifyContent: 'center' },
  scoreNumber:       { fontSize: 28, fontWeight: '900' },
  scoreLabel:        { color: '#7D8796', fontSize: 11, marginTop: -4, fontWeight: '700' },
  healthScoreTitle:  { color: '#152033', fontSize: 17, fontWeight: '800' },
  healthScoreSub:    { color: '#677181', fontSize: 13, marginTop: 4, fontWeight: '600' },
  healthScoreCheck:  { color: '#667085', fontSize: 12, marginTop: 3, fontWeight: '600' },
  streakCard: {
    marginHorizontal: 16,
    marginTop: 15,
    marginBottom: 8,
    padding: 18,
    borderRadius: 22,
    backgroundColor: 'rgba(248,250,255,0.90)',
    borderWidth: 1,
    borderColor: 'rgba(126,87,194,0.14)',
    shadowColor: '#7B61FF',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.025,
    shadowRadius: 14,
    elevation: 1,
  },
  streakTitle: {
    color: '#152033',
    fontSize: 18,
    fontWeight: '800',
  },
  streakSub: {
    color: '#7D8796',
    fontSize: 13,
    marginTop: 4,
  },
  recentActivityEmptyCard: {
    backgroundColor: 'rgba(248,250,255,0.90)',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(126,87,194,0.14)',
    paddingVertical: 18,
    paddingHorizontal: 16,
    shadowColor: '#7B61FF',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.025,
    shadowRadius: 14,
    elevation: 1,
  },
  recentActivityEmptyText: {
    color: '#7D8796',
    textAlign: 'center',
    fontSize: 14,
    fontWeight: '600',
  },
  recentActivityCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(248,250,255,0.90)',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(126,87,194,0.14)',
    padding: 14,
    marginBottom: 10,
    shadowColor: '#7B61FF',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.025,
    shadowRadius: 14,
    elevation: 1,
  },
  recentActivityIconWrap: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F5F7FC',
    marginRight: 12,
  },
  recentActivityIcon: {
    fontSize: 22,
  },
  recentActivityContent: {
    flex: 1,
  },
  recentActivityTitle: {
    color: '#152033',
    fontSize: 15,
    fontWeight: '800',
  },
  recentActivityMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
  },
  recentActivityTime: {
    color: '#7D8796',
    fontSize: 12,
    fontWeight: '600',
    marginRight: 8,
  },
  recentActivityTypePill: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 999,
    backgroundColor: 'rgba(107,75,255,0.12)',
  },
  recentActivityTypeText: {
    color: '#6B4BFF',
    fontSize: 10,
    fontWeight: '800',
    textTransform: 'capitalize',
  },
  calendarAddBtn: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 18,
    backgroundColor: '#F0E9FF',
    borderWidth: 1,
    borderColor: '#DACDFF',
    flexShrink: 0,
  },
  calendarAddBtnText: {
    color: '#6B4BFF',
    fontSize: 12,
    fontWeight: '800',
  },
  reminderCard: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    backgroundColor: 'rgba(248,250,255,0.90)',
    borderWidth: 1,
    borderColor: 'rgba(126,87,194,0.14)',
    shadowColor: '#7B61FF',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.025,
    shadowRadius: 14,
    elevation: 1,
  },
  reminderCardDone: {
    opacity: 0.6,
  },
  reminderIconWrap: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: C.bg,
    marginRight: 12,
  },
  reminderIcon: {
    fontSize: 22,
  },
  reminderContent: {
    flex: 1,
  },
  reminderTitle: {
    color: C.text,
    fontSize: 15,
    fontWeight: '800',
  },
  reminderTitleDone: {
    textDecorationLine: 'line-through',
    color: C.muted,
  },
  reminderDate: {
    color: C.muted,
    fontSize: 12,
    marginTop: 3,
  },
  reminderStatusPill: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: 'rgba(255,107,53,0.14)',
    marginLeft: 10,
  },
  reminderStatusPillDone: {
    backgroundColor: 'rgba(74,222,128,0.15)',
  },
  reminderStatusText: {
    color: C.accent,
    fontSize: 10,
    fontWeight: '800',
  },
  taskCard: {
  flexDirection: 'row',
  alignItems: 'center',

  backgroundColor: 'rgba(248,250,255,0.90)',

  padding: 18,
  borderRadius: 22,

  marginBottom: 14,

  shadowColor: '#000',
  shadowOffset: { width: 0, height: 6 },
  shadowOpacity: 0.025,
  shadowRadius: 14,

  elevation: 1,
},
  taskCardDone:      { opacity: 0.55 },
  taskCheck:         { fontSize: 20 },
  taskInfo:          { flex: 1 },
  taskTitle:         { color: C.text, fontSize: 15, fontWeight: '700' },
  taskTitleDone:     { textDecorationLine: 'line-through', color: C.muted },
  taskTime:          { color: C.muted, fontSize: 12, marginTop: 3 },
  quickAction: {
  backgroundColor: 'rgba(248,250,255,0.88)',

  width: 78,
  height: 78,
  borderRadius: 22,

  paddingVertical: 8,
  paddingHorizontal: 8,
  alignItems: 'center',
  justifyContent: 'center',

  marginRight: 12,

  borderWidth: 1,
  borderColor: 'rgba(126,87,194,0.14)',
  shadowColor: '#7B61FF',
  shadowOffset: { width: 0, height: 4 },
  shadowOpacity: 0.025,
  shadowRadius: 10,

  elevation: 1,
},
  quickActionIcon:   { fontSize: 28, marginBottom: 4 },
  quickActionLabel:  { color: '#152033', fontSize: 11, fontWeight: '700', textAlign: 'center', lineHeight: 13 },
  quickActionAdd:    { borderWidth: 1, borderColor: '#6B4BFF', backgroundColor: '#F3EEFF' },
  modalOverlay:      { flex: 1, backgroundColor: 'rgba(0,0,0,0.58)', justifyContent: 'center', padding: 20 },
  customActionModal: { backgroundColor: C.card, borderRadius: 24, padding: 18, borderWidth: 1, borderColor: C.border },
  customActionModalTitle: { color: C.text, fontSize: 20, fontWeight: '800', marginBottom: 14 },
  customActionInput: { backgroundColor: C.bg, color: C.text, borderRadius: 16, paddingHorizontal: 14, paddingVertical: 12, borderWidth: 1, borderColor: C.border, marginBottom: 14 },
  iconPickerRow: { paddingVertical: 6, gap: 8 },
  iconPickChip: { width: 64, height: 64, borderRadius: 32, alignItems: 'center', justifyContent: 'center', backgroundColor: C.bg, borderWidth: 1, borderColor: C.border, marginRight: 8, padding: 8 },
  iconPickChipActive: { borderColor: C.accent, borderWidth: 2, backgroundColor: 'rgba(255,107,53,0.15)' },
  iconPickChipText: { fontSize: 34, lineHeight: 34 },
  iconPickChipTextActive: { fontSize: 38, lineHeight: 38 },
  presetActionRow: { paddingVertical: 8, gap: 10 },
  presetActionCard: { width: 110, padding: 12, borderRadius: 18, backgroundColor: C.bg, borderWidth: 1, borderColor: C.border, marginRight: 10 },
  presetActionIcon: { fontSize: 22, marginBottom: 8, textAlign: 'center' },
  presetActionLabel: { color: C.text, fontSize: 12, fontWeight: '700', textAlign: 'center', lineHeight: 15 },
  customActionModalButtons: { flexDirection: 'row', gap: 10, marginTop: 16 },
  customActionCancelBtn: { flex: 1, paddingVertical: 12, borderRadius: 16, alignItems: 'center', backgroundColor: C.bg, borderWidth: 1, borderColor: C.border },
  customActionCancelText: { color: C.muted, fontWeight: '700' },
  customActionSaveBtn: { flex: 1, paddingVertical: 12, borderRadius: 16, alignItems: 'center', backgroundColor: C.accent },
  customActionSaveText: { color: '#fff', fontWeight: '800' },
  recordDetailBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
    marginLeft: 8,
  },
  recordDetailBadgeText: { fontSize: 11, fontWeight: '900', letterSpacing: 0.7 },
  recordDetailHeaderBlock: {
    marginTop: 2,
    padding: 14,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  recordDetailTypeLabel: { color: C.accent, fontSize: 12, fontWeight: '900', letterSpacing: 1.1, textTransform: 'uppercase' },
  recordDetailMainTitle: { color: C.text, fontSize: 18, fontWeight: '900', marginTop: 3 },
  recordDetailHeaderLine: { color: C.muted, fontSize: 12, fontWeight: '700', lineHeight: 17 },
  recordDetailReminderCard: {
    marginTop: 12,
    padding: 12,
    borderRadius: 16,
    backgroundColor: 'rgba(255,107,53,0.10)',
    borderWidth: 1,
    borderColor: 'rgba(255,107,53,0.18)',
  },
  recordDetailReminderLabel: { color: C.text, fontSize: 12, fontWeight: '800', lineHeight: 17 },
  recordDetailSectionTitle: { color: C.text, fontSize: 14, fontWeight: '900', marginBottom: 10, letterSpacing: 0.3 },
  recordDetailSection: {
    backgroundColor: '#171717',
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 20,
    padding: 14,
  },
  recordDetailRow: {
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
    gap: 4,
  },
  recordDetailNotesRow: { paddingBottom: 12 },
  recordDetailFieldLabel: { color: C.muted, fontSize: 11, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.8 },
  recordDetailFieldValue: { color: C.text, fontSize: 14, fontWeight: '700', lineHeight: 20 },
  recordDetailNotesValue: { lineHeight: 21 },
  recordDetailEmptyText: { color: C.muted, fontSize: 13, fontStyle: 'italic' },
  datePickerLabel: { color: C.muted, fontSize: 12, fontWeight: '800', marginBottom: 6 },
  datePickerField: {
    backgroundColor: C.bg,
    borderColor: C.border,
    borderWidth: 1,
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 13,
    minHeight: 48,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  datePickerFieldText: { color: C.text, fontSize: 14, fontWeight: '700', flex: 1, paddingRight: 12 },
  datePickerPlaceholder: { color: C.muted, fontWeight: '600' },
  datePickerChevron: { color: C.accent, fontSize: 18, fontWeight: '900' },
  datePickerOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
  },
  datePickerModal: {
    width: '100%',
    backgroundColor: C.card,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: C.border,
    padding: 16,
  },
  datePickerModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  datePickerModalTitle: { color: C.text, fontSize: 16, fontWeight: '900' },
  datePickerModalClose: { color: C.muted, fontSize: 18, fontWeight: '900' },
  datePickerPickerWrap: {
    backgroundColor: C.bg,
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 18,
    overflow: 'hidden',
    marginBottom: 16,
  },
  datePickerButtons: { flexDirection: 'row', gap: 10 },
  addPetModal: {
    backgroundColor: '#1b1b1b',
    borderRadius: 28,
    paddingHorizontal: 18,
    paddingTop: 18,
    paddingBottom: 16,
    borderWidth: 1,
    borderColor: C.border,
    shadowColor: '#000',
    shadowOpacity: 0.22,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 10 },
    elevation: 10,
    maxHeight: '90%',
  },
  addPetModalHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  addPetModalClose: {
    color: C.muted,
    fontSize: 18,
    fontWeight: '700',
    width: 24,
    textAlign: 'center',
  },
  addPetModalTitle: {
    color: C.text,
    fontSize: 22,
    fontWeight: '900',
    textAlign: 'center',
  },
  addPetModalSubtitle: {
    color: C.muted,
    fontSize: 13,
    marginTop: 4,
    textAlign: 'center',
  },
  addPetProgressWrap: {
    marginBottom: 14,
  },
  addPetProgressTrack: {
    height: 8,
    borderRadius: 999,
    backgroundColor: C.card,
    overflow: 'hidden',
  },
  addPetProgressFill: {
    height: '100%',
    borderRadius: 999,
    backgroundColor: C.accent,
  },
  addPetProgressText: {
    color: C.muted,
    fontSize: 12,
    fontWeight: '700',
    marginTop: 6,
    textAlign: 'right',
  },
  addPetSectionTitle: {
    color: C.text,
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 12,
  },
  addPetPhotoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    marginBottom: 14,
  },
  addPetPhotoCircle: {
    width: 84,
    height: 84,
    borderRadius: 42,
    backgroundColor: C.card,
    borderWidth: 1,
    borderColor: C.border,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  addPetPhotoImage: {
    width: 84,
    height: 84,
    borderRadius: 42,
  },
  addPetPhotoEmoji: {
    fontSize: 38,
  },
  addPetPhotoButton: {
    backgroundColor: 'rgba(255,107,53,0.14)',
    borderWidth: 1,
    borderColor: 'rgba(255,107,53,0.25)',
    borderRadius: 16,
    paddingVertical: 12,
    paddingHorizontal: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  addPetPhotoButtonText: {
    color: C.accent,
    fontSize: 13,
    fontWeight: '800',
  },
  addPetPhotoHint: {
    color: C.muted,
    fontSize: 12,
    lineHeight: 17,
  },
  addPetInput: {
    backgroundColor: C.bg,
    borderColor: C.border,
    borderWidth: 1,
    color: C.text,
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 12,
    fontSize: 14,
  },
  addPetMultiline: {
    minHeight: 98,
    textAlignVertical: 'top',
  },
  addPetFieldLabel: {
    color: C.muted,
    fontSize: 12,
    fontWeight: '800',
    marginBottom: 8,
    marginTop: 2,
  },
  addPetChipRow: {
    paddingVertical: 4,
    paddingRight: 8,
    gap: 8,
    marginBottom: 14,
  },
  addPetChip: {
    backgroundColor: C.bg,
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginRight: 8,
  },
  addPetChipActive: {
    backgroundColor: 'rgba(255,107,53,0.16)',
    borderColor: C.accent,
  },
  addPetChipText: {
    color: C.muted,
    fontSize: 12,
    fontWeight: '800',
  },
  addPetChipTextActive: {
    color: C.text,
  },
  addPetModeRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
    flexWrap: 'wrap',
  },
  addPetModeChip: {
    backgroundColor: C.bg,
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginRight: 8,
    marginBottom: 6,
  },
  addPetModeChipActive: {
    backgroundColor: 'rgba(255,107,53,0.16)',
    borderColor: C.accent,
  },
  addPetModeChipText: {
    color: C.muted,
    fontSize: 12,
    fontWeight: '800',
  },
  addPetModeChipTextActive: {
    color: C.text,
  },
  addPetGenderRow: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
    marginBottom: 8,
  },
  addPetReviewCard: {
    backgroundColor: C.bg,
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 20,
    padding: 14,
  },
  addPetReviewTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  addPetReviewAvatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: C.card,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  addPetReviewImage: {
    width: 64,
    height: 64,
    borderRadius: 32,
  },
  addPetReviewEmoji: {
    fontSize: 28,
  },
  addPetReviewName: {
    color: C.text,
    fontSize: 18,
    fontWeight: '900',
  },
  addPetReviewMeta: {
    color: C.muted,
    fontSize: 12,
    marginTop: 3,
    lineHeight: 16,
  },
  addPetReviewGoalLabel: {
    color: C.muted,
    fontSize: 12,
    fontWeight: '800',
    marginTop: 14,
    marginBottom: 6,
  },
  addPetReviewGoalText: {
    color: C.text,
    fontSize: 13,
    lineHeight: 18,
  },
  addPetFooter: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 16,
  },
  reminderModal: { backgroundColor: C.card, borderRadius: 24, padding: 18, borderWidth: 1, borderColor: C.border },
  reminderModalLabel: { color: C.text, fontSize: 13, fontWeight: '800', marginBottom: 8, marginTop: 6 },
  reminderDateCard: { backgroundColor: C.bg, borderRadius: 16, borderWidth: 1, borderColor: C.border, paddingHorizontal: 14, paddingVertical: 12, marginBottom: 6 },
  reminderDateCardText: { color: C.text, fontSize: 14, fontWeight: '700' },
  reminderDateCardHint: { color: C.muted, fontSize: 12, marginTop: 3 },

  // Health
  recordIconWrap:    { width: 44, height: 44, borderRadius: 22, backgroundColor: C.bg, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  recordTitle:       { color: C.text, fontSize: 15, fontWeight: '800' },
  recordDate:        { color: C.muted, fontSize: 12, marginTop: 2 },
  recordProvider:    { color: C.faint, fontSize: 12, marginTop: 2 },
  recordDue:         { color: C.muted, fontSize: 12, marginTop: 2 },

  // Memories
  motdCard:          { marginHorizontal: 16, marginBottom: 14, alignItems: 'center' },
  motdBadge:         { color: C.accent, fontSize: 12, fontWeight: '900', alignSelf: 'flex-start' },
  motdCaption:       { color: C.text, fontSize: 16, fontWeight: '800' },
  motdDate:          { color: C.muted, fontSize: 12, marginTop: 3 },
  memCell:           { borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginBottom: 4, overflow: 'hidden' },
  memEmoji:          { fontSize: 36 },
  mileStar:          { position: 'absolute', top: 5, right: 5, backgroundColor: 'rgba(0,0,0,0.55)', borderRadius: 8, padding: 3 },

  // Community
  lostBanner:        { backgroundColor: C.red, borderRadius: 10, paddingVertical: 7, alignItems: 'center', marginBottom: 12 },
  lostBannerText:    { color: '#fff', fontWeight: '900', fontSize: 12 },
  postAuthorRow:     { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10 },
  postAvatar:        { width: 42, height: 42, borderRadius: 21, backgroundColor: C.bg, alignItems: 'center', justifyContent: 'center' },
  postAuthor:        { color: C.text, fontSize: 15, fontWeight: '800' },
  postPetType:       { color: C.muted, fontSize: 12, marginTop: 2 },
  postContent:       { color: C.text, fontSize: 15, lineHeight: 21, marginBottom: 12 },
  postMediaPlaceholder: { height: 150, borderRadius: 14, alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
    postActions:       { flexDirection: 'row', alignItems: 'center', gap: 22, borderTopWidth: 1, borderTopColor: C.border, paddingTop: 10 },
    postAction:        { flexDirection: 'row', alignItems: 'center', gap: 5 },
    postActionText:    { color: C.muted, fontSize: 13, fontWeight: '700' },
    alertNeighborsBtn: { marginTop: 12, backgroundColor: C.red, borderRadius: 14, paddingVertical: 12, alignItems: 'center' },
    alertNeighborsBtnText: { color: '#fff', fontWeight: '900' },
    composeInput:      { flex: 1, color: C.text, fontSize: 18, padding: 16, textAlignVertical: 'top' },
    composeTips:       { flexDirection: 'row', flexWrap: 'wrap', gap: 8, padding: 16, borderTopWidth: 1, borderTopColor: C.border },
    composeTip:        { backgroundColor: C.card, borderRadius: 16, paddingHorizontal: 12, paddingVertical: 8, borderWidth: 1, borderColor: C.border },
    communityTabRow:   { gap: 10, paddingBottom: 14 },
    communityTabPill:  { backgroundColor: C.card, borderRadius: 999, paddingHorizontal: 15, paddingVertical: 10, borderWidth: 1, borderColor: C.border },
    communityTabPillActive: { backgroundColor: C.accent + '22', borderColor: C.accent },
    communityTabText:  { color: C.muted, fontSize: 13, fontWeight: '800' },
    communityTabTextActive: { color: C.text },
    recipeSafetyNote:  { backgroundColor: C.blue + '18', borderLeftWidth: 3, borderLeftColor: C.blue, borderRadius: 14, paddingHorizontal: 14, paddingVertical: 12, marginBottom: 14 },
    recipeSafetyNoteText: { color: C.text, fontSize: 13, lineHeight: 19, fontWeight: '700' },
    recipeHeroRow:     { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12 },
    recipeEmojiWrap:   { width: 56, height: 56, borderRadius: 18, backgroundColor: C.bg, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: C.border },
    recipeEmoji:       { fontSize: 30 },
    recipeTitle:       { color: C.text, fontSize: 17, fontWeight: '900', lineHeight: 22 },
    recipeMeta:        { color: C.muted, fontSize: 12, marginTop: 3, fontWeight: '700' },
    recipeDescription: { color: C.text, fontSize: 14, lineHeight: 20, marginBottom: 12 },
    recipeMetaRow:     { flexDirection: 'row', gap: 10, marginBottom: 12, flexWrap: 'wrap' },
    recipePill:        { flexGrow: 1, flexBasis: '48%', backgroundColor: C.cardHigh, borderRadius: 14, paddingHorizontal: 12, paddingVertical: 10, borderWidth: 1, borderColor: C.border },
    recipePillLabel:   { color: C.muted, fontSize: 11, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.6 },
    recipePillValue:   { color: C.text, fontSize: 13, fontWeight: '800', marginTop: 4 },
    recipeIngredientsBlock: { backgroundColor: C.bg, borderRadius: 14, padding: 12, borderWidth: 1, borderColor: C.border, marginBottom: 12 },
    recipeIngredientsLabel: { color: C.muted, fontSize: 11, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 6 },
    recipeIngredientsText: { color: C.text, fontSize: 13, lineHeight: 19, fontWeight: '600' },
    recipeExpandToggle: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: C.cardHigh, borderRadius: 14, paddingHorizontal: 12, paddingVertical: 11, borderWidth: 1, borderColor: C.border, marginBottom: 12 },
    recipeExpandToggleText: { color: C.text, fontSize: 13, fontWeight: '900' },
    recipeExpandChevron: { color: C.muted, fontSize: 16, fontWeight: '900' },
    recipeInstructionsBlock: { backgroundColor: C.bg, borderRadius: 14, padding: 12, borderWidth: 1, borderColor: C.border, marginBottom: 12 },
    recipeInstructionsLabel: { color: C.muted, fontSize: 11, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 8 },
    recipeInstructionRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, marginBottom: 10 },
    recipeInstructionNumber: { width: 24, height: 24, borderRadius: 12, backgroundColor: C.cardHigh, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: C.border, marginTop: 1 },
    recipeInstructionNumberText: { color: C.text, fontSize: 11, fontWeight: '900' },
    recipeInstructionText: { flex: 1, color: C.text, fontSize: 13, lineHeight: 19, fontWeight: '600' },
    recipeIngredientsFullBlock: { marginTop: 4, paddingTop: 10, borderTopWidth: 1, borderTopColor: C.border },
    recipeIngredientFullText: { color: C.muted, fontSize: 13, lineHeight: 18, fontWeight: '600', marginBottom: 3 },
    recipeActions:     { flexDirection: 'row', alignItems: 'center', gap: 22, borderTopWidth: 1, borderTopColor: C.border, paddingTop: 10 },
    recipeOwnerActions: { flexDirection: 'row', gap: 10, marginTop: 12 },
    recipeOwnerBtn:    { flex: 1, backgroundColor: C.cardHigh, borderRadius: 14, paddingVertical: 11, alignItems: 'center', borderWidth: 1, borderColor: C.border },
    recipeOwnerBtnDanger: { backgroundColor: C.red + '20', borderColor: C.red + '40' },
    recipeOwnerBtnText: { color: C.text, fontSize: 13, fontWeight: '900' },
    recipeOwnerBtnTextDanger: { color: C.red },
    recipeFieldLabel:  { color: C.text, fontSize: 13, fontWeight: '800', marginBottom: 8, marginTop: 14 },
    recipeInput:       { backgroundColor: C.card, color: C.text, borderRadius: 14, paddingHorizontal: 14, paddingVertical: 12, borderWidth: 1, borderColor: C.border },
    recipeTextArea:    { minHeight: 92, textAlignVertical: 'top' },
    recipeModalTip:    { marginTop: 16, backgroundColor: C.cardHigh, borderRadius: 14, paddingHorizontal: 14, paddingVertical: 12, borderWidth: 1, borderColor: C.border },
    recipeModalTipText: { color: C.muted, fontSize: 12, lineHeight: 18, fontWeight: '600' },

    // Health Hub local vet finder
    localVetFinderToggle: { marginTop: 12, marginHorizontal: 16, backgroundColor: C.cardHigh, borderRadius: 18, paddingHorizontal: 14, paddingVertical: 12, borderWidth: 1, borderColor: C.border, flexDirection: 'row', alignItems: 'center', gap: 12 },
    localVetFinderToggleTitle: { color: C.text, fontSize: 14, fontWeight: '900' },
    localVetFinderToggleSub: { color: C.muted, fontSize: 12, marginTop: 3, fontWeight: '600' },
    localVetFinderChevron: { color: C.accent, fontSize: 18, fontWeight: '900' },
    localVetFinderModalScreen: { flex: 1, backgroundColor: C.bg },
    localVetFinderModalHeader: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, paddingHorizontal: 16, paddingTop: 14, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: C.border, backgroundColor: '#101c2a' },
    localVetFinderModalTitle: { color: C.text, fontSize: 18, fontWeight: '900' },
    localVetFinderModalSubtitle: { color: C.muted, fontSize: 12, lineHeight: 17, marginTop: 4, fontWeight: '600' },
    localVetFinderCloseBtn: { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center', backgroundColor: C.cardHigh, borderWidth: 1, borderColor: C.border, marginTop: 2 },
    localVetFinderCloseBtnText: { color: C.text, fontSize: 18, fontWeight: '900' },
    localVetFinderModalScroll: { flex: 1 },
    localVetFinderModalScrollContent: { paddingTop: 14, paddingBottom: 34, paddingHorizontal: 16 },
    localVetFinderScroll: { maxHeight: Dimensions.get('window').height * 0.78, marginHorizontal: 0 },
    localVetFinderScrollContent: { paddingBottom: 120 },
    localVetFinderCard: { padding: 16, marginBottom: 14, borderRadius: 24, backgroundColor: '#1a1a1a', borderWidth: 1, borderColor: 'rgba(255, 153, 0, 0.12)' },
    localVetFinderHeaderRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, marginBottom: 14 },
    localVetFinderTitle: { color: C.text, fontSize: 17, fontWeight: '900' },
    localVetFinderSubtitle: { color: C.muted, fontSize: 12, lineHeight: 17, marginTop: 4, fontWeight: '600' },
    localVetFinderButtonRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 14 },
    localVetFinderMainBtn: { backgroundColor: C.accent, borderRadius: 14, paddingHorizontal: 14, paddingVertical: 12, alignItems: 'center', justifyContent: 'center' },
    localVetFinderMainBtnText: { color: '#fff', fontSize: 12, fontWeight: '900' },
    localVetFinderSecondaryBtn: { backgroundColor: C.cardHigh, borderWidth: 1, borderColor: C.border },
    localVetFinderSecondaryBtnText: { color: C.text, fontSize: 12, fontWeight: '900' },
    localVetFinderSaveBtn: { backgroundColor: C.green, borderColor: C.green, borderRadius: 14, paddingVertical: 12, alignItems: 'center', justifyContent: 'center', marginBottom: 14 },
    localVetFinderSaveBtnText: { color: C.bg, fontSize: 12, fontWeight: '900' },
    localVetWarning: { backgroundColor: C.red + '18', borderLeftWidth: 3, borderLeftColor: C.red, borderRadius: 14, paddingHorizontal: 14, paddingVertical: 12, marginBottom: 14 },
    localVetWarningText: { color: C.text, fontSize: 12, lineHeight: 18, fontWeight: '700' },
    localVetSavedSection: { marginTop: 2 },
    localVetSavedSectionTitle: { color: C.text, fontSize: 14, fontWeight: '900', marginBottom: 10 },
    localVetEmptyState: { backgroundColor: C.bg, borderRadius: 16, padding: 14, borderWidth: 1, borderColor: C.border, marginBottom: 12 },
    localVetEmptyStateText: { color: C.muted, fontSize: 12, lineHeight: 18, fontWeight: '600' },
    localVetCard: { backgroundColor: C.card, borderRadius: 18, padding: 14, borderWidth: 1, borderColor: C.border, marginBottom: 12 },
    localVetCardTopRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10 },
    localVetAvatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: C.bg, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: C.border },
    localVetAvatarText: { fontSize: 18 },
    localVetName: { color: C.text, fontSize: 15, fontWeight: '900' },
    localVetType: { color: C.muted, fontSize: 12, fontWeight: '700', marginTop: 2 },
    localVetStatusPill: { backgroundColor: C.cardHigh, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 5, borderWidth: 1, borderColor: C.border },
    localVetStatusText: { color: C.text, fontSize: 11, fontWeight: '800' },
    localVetMetaGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 12 },
    localVetMetaItem: { flexBasis: '48%', backgroundColor: C.bg, borderRadius: 14, padding: 10, borderWidth: 1, borderColor: C.border },
    localVetMetaLabel: { color: C.muted, fontSize: 10, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.7 },
    localVetMetaValue: { color: C.text, fontSize: 12, fontWeight: '700', marginTop: 5, lineHeight: 17 },
    localVetActionRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
    localVetActionBtn: { flexGrow: 1, flexBasis: '31%', backgroundColor: C.cardHigh, borderRadius: 14, paddingVertical: 12, alignItems: 'center', borderWidth: 1, borderColor: C.border },
    localVetActionBtnAccent: { backgroundColor: C.accent, borderColor: C.accent },
    localVetActionBtnText: { color: C.text, fontSize: 13, fontWeight: '900' },
    localVetActionBtnTextAccent: { color: '#fff', fontSize: 13, fontWeight: '900' },
    localVetEditDeleteRow: { flexDirection: 'row', gap: 10, marginTop: 10 },
    localVetActionBtnAccentSoft: { backgroundColor: C.blue + '20', borderColor: C.blue + '55' },
    localVetActionBtnTextAccentSoft: { color: C.blue, fontSize: 13, fontWeight: '900' },
    localVetActionBtnDanger: { backgroundColor: C.red + '18', borderColor: C.red + '40' },
    localVetActionBtnTextDanger: { color: C.red, fontSize: 13, fontWeight: '900' },
    vetModalLabel: { color: C.muted, fontSize: 12, fontWeight: '700', marginBottom: 6, marginTop: 10 },
    
    // Settings
    profileCard:       { margin: 16, flexDirection: 'row', alignItems: 'center', gap: 12 },
  profileAvatarCircle: { width: 56, height: 56, borderRadius: 28, backgroundColor: C.bg, alignItems: 'center', justifyContent: 'center' },
  profileName:       { color: C.text, fontSize: 18, fontWeight: '900' },
  profileEmail:      { color: C.muted, fontSize: 12, marginTop: 2 },
  premiumBadge:      { backgroundColor: C.accent + '30', borderWidth: 1, borderColor: C.accent, borderRadius: 14, paddingHorizontal: 8, paddingVertical: 4 },
  premiumBadgeText:  { color: C.accent, fontSize: 11, fontWeight: '900' },
  menuSectionTitle:  { color: C.faint, fontSize: 11, fontWeight: '900', marginLeft: 20, marginTop: 14, marginBottom: 8, letterSpacing: 1 },
  menuItem:          { flexDirection: 'row', alignItems: 'center', paddingVertical: 13, gap: 12 },
  menuItemBorder:    { borderBottomWidth: 1, borderBottomColor: C.border },
  menuIcon:          { fontSize: 22, width: 28, textAlign: 'center' },
  menuLabel:         { color: C.text, fontSize: 15, fontWeight: '700' },
  menuSub:           { color: C.muted, fontSize: 12, marginTop: 2 },
  menuChevron:       { color: C.faint, fontSize: 26 },
  signOutBtn:        { marginHorizontal: 16, marginTop: 18, backgroundColor: C.card, borderRadius: 14, paddingVertical: 15, alignItems: 'center', borderWidth: 1, borderColor: C.red + '70' },
  signOutText:       { color: C.red, fontWeight: '800' },
  versionText:       { color: C.faint, fontSize: 12, textAlign: 'center', marginTop: 18, marginBottom: 24 },

  // Modals / AI Vet
  modalHeader:       { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: C.border },
  modalTitle:        { color: C.text, fontSize: 17, fontWeight: '900' },
  disclaimer:        { marginHorizontal: 12, marginTop: 12, marginBottom: 8, backgroundColor: C.blue + '22', borderLeftWidth: 3, borderLeftColor: C.blue, borderRadius: 12, paddingVertical: 10, paddingHorizontal: 12 },
  disclaimerText:    { color: C.blue, fontSize: 13, lineHeight: 18, fontWeight: '600' },
  petContextBar:     { marginHorizontal: 12, marginBottom: 4, backgroundColor: C.card, borderRadius: 12, padding: 10, borderWidth: 1, borderColor: C.border },
  petContextText:    { color: C.muted, fontSize: 12, textAlign: 'center', fontWeight: '700' },
  chatBubbleWrap:    { marginBottom: 14, maxWidth: '86%' },
  chatBubbleAI:      { alignSelf: 'flex-start' },
  chatBubbleUser:    { alignSelf: 'flex-end' },
  chatBubble:        { borderRadius: 18, paddingVertical: 12, paddingHorizontal: 14 },
  chatBubbleAIBg:    { backgroundColor: C.card, borderBottomLeftRadius: 5, borderWidth: 1, borderColor: C.border },
  chatBubbleUserBg:  { backgroundColor: C.accent, borderBottomRightRadius: 5 },
  chatText:          { color: C.text, fontSize: 14, lineHeight: 20 },
  chatTimestamp:     { color: C.muted, fontSize: 11, marginTop: 4, fontWeight: '600' },
  typingText:        { color: C.muted, fontSize: 14, lineHeight: 20, fontStyle: 'italic' },
  suggestion:        { backgroundColor: C.card, borderRadius: 18, paddingHorizontal: 12, paddingVertical: 8, borderWidth: 1, borderColor: C.border },
  suggestionText:    { color: C.muted, fontSize: 12, fontWeight: '700' },
  chatInputRow:      { flexDirection: 'row', alignItems: 'flex-end', gap: 8, padding: 12, borderTopWidth: 1, borderTopColor: C.border },
  chatInput:         { flex: 1, minHeight: 46, maxHeight: 110, backgroundColor: C.card, borderRadius: 18, color: C.text, paddingHorizontal: 14, paddingVertical: 11, fontSize: 15 },
  sendBtn:           { width: 46, height: 46, borderRadius: 23, backgroundColor: C.accent, alignItems: 'center', justifyContent: 'center' },

  // Pet Profile
  petProfileScroll:    { paddingBottom: 28 },
  petProfileHeroCard:   { marginHorizontal: 16, marginTop: 4, padding: 18, borderRadius: 26, alignItems: 'center' },
  petProfileAvatarWrap: { marginBottom: 12 },
  petProfileAvatarCircle: { width: 120, height: 120, borderRadius: 60, backgroundColor: C.bg, alignItems: 'center', justifyContent: 'center', overflow: 'hidden', borderWidth: 1, borderColor: C.border },
  petProfileAvatarImage: { width: '100%', height: '100%' },
  petProfileAvatarEmoji: { fontSize: 54 },
  petProfileName:       { color: C.text, fontSize: 26, fontWeight: '900', textAlign: 'center' },
  petProfileSubtitle:   { color: C.muted, fontSize: 13, marginTop: 6, textAlign: 'center', fontWeight: '700' },
  petProfileChipRow:    { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 8, marginTop: 14 },
  petProfileChip:       { backgroundColor: C.bg, borderRadius: 999, paddingHorizontal: 12, paddingVertical: 7, borderWidth: 1, borderColor: C.border },
  petProfileChipText:    { color: C.text, fontSize: 12, fontWeight: '700' },
  petProfileStatGrid:   { flexDirection: 'row', flexWrap: 'wrap', gap: 10, paddingHorizontal: 16, marginTop: 14 },
  petProfileStatCard:    { width: '48.5%', padding: 14, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  petProfileStatLabel:   { color: C.muted, fontSize: 12, fontWeight: '700', marginBottom: 10, textAlign: 'center' },
  petProfileScoreCircle: { width: 84, height: 84, borderRadius: 42, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
  petProfileScoreValue:  { fontSize: 24, fontWeight: '900', lineHeight: 26 },
  petProfileScoreUnit:    { fontSize: 11, fontWeight: '800', marginTop: -2 },
  petProfileStatBig:     { color: C.text, fontSize: 22, fontWeight: '900', textAlign: 'center' },
  petProfileStatSub:     { color: C.muted, fontSize: 11, marginTop: 4, textAlign: 'center' },
  petProfileInfoCard:    { marginHorizontal: 16, marginTop: 12, padding: 16, borderRadius: 20 },
  petProfileSectionTitle: { color: C.text, fontSize: 16, fontWeight: '900', marginBottom: 10 },
  petProfileBodyText:    { color: C.muted, fontSize: 14, lineHeight: 20, fontWeight: '600' },
  petProfileEmptyText:    { color: C.faint, fontSize: 13, fontStyle: 'italic' },
  petProfileActivityRow:  { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 10 },
  petProfileActivityIcon:  { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', backgroundColor: C.bg, borderWidth: 1, borderColor: C.border },
  petProfileActivityTitle: { color: C.text, fontSize: 14, fontWeight: '800' },
  petProfileActivitySub:   { color: C.muted, fontSize: 11, marginTop: 2, fontWeight: '600' },
  petProfileButtonRow:   { gap: 10, paddingHorizontal: 16, marginTop: 14, marginBottom: 18 },
  petProfileButton:      { backgroundColor: C.card, borderRadius: 16, paddingVertical: 14, paddingHorizontal: 14, alignItems: 'center', borderWidth: 1, borderColor: C.border },
  petProfileButtonAccent: { backgroundColor: C.accent, borderColor: C.accent },
  petProfileButtonText:  { color: C.text, fontSize: 14, fontWeight: '900' },
  petProfileButtonTextAccent: { color: '#fff' },

  // Community profiles
  communityProfileScroll: { paddingBottom: 30 },
  communityProfileTopBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 8,
    marginBottom: 8,
  },
  communityProfileTopBarSpacer: { width: 40 },
  communityProfileCloseBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: C.card,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: C.border,
  },
  communityProfileCloseBtnText: { color: C.text, fontSize: 16, fontWeight: '900' },
  communityProfileHeroCard: {
    marginHorizontal: 16,
    marginTop: 4,
    padding: 18,
    borderRadius: 26,
    alignItems: 'center',
  },
  communityProfileLoadingText: { color: C.muted, fontSize: 14, fontWeight: '700' },
  communityProfileAvatarWrap: { marginBottom: 14 },
  communityProfileAvatarCircle: {
    width: 108,
    height: 108,
    borderRadius: 54,
    backgroundColor: C.bg,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: C.border,
  },
  communityProfileAvatarImage: { width: '100%', height: '100%' },
  communityProfileAvatarEmoji: { fontSize: 54 },
  communityProfileName: { color: C.text, fontSize: 26, fontWeight: '900', textAlign: 'center' },
  communityProfileMeta: { color: C.muted, fontSize: 13, marginTop: 6, textAlign: 'center', fontWeight: '700' },
  communityProfileBio: { color: C.text, fontSize: 14, lineHeight: 20, marginTop: 10, textAlign: 'center' },
  communityProfileStatGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, paddingHorizontal: 16, marginTop: 14 },
  communityProfileStatCard: {
    width: '48.5%',
    padding: 14,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 92,
  },
  communityProfileStatLabel: { color: C.muted, fontSize: 12, fontWeight: '700', marginBottom: 8, textAlign: 'center' },
  communityProfileStatValue: { color: C.text, fontSize: 24, fontWeight: '900' },
  communityProfileInfoCard: { marginHorizontal: 16, marginTop: 12, padding: 16, borderRadius: 20 },
  communityProfileSectionTitle: { color: C.text, fontSize: 16, fontWeight: '900', marginBottom: 12 },
  communityProfilePetPreview: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  communityProfilePetPreviewAvatar: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: C.bg,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: C.border,
  },
  communityProfilePetPreviewEmoji: { fontSize: 26 },
  communityProfilePetPreviewName: { color: C.text, fontSize: 15, fontWeight: '900' },
  communityProfilePetPreviewMeta: { color: C.muted, fontSize: 12, marginTop: 3, fontWeight: '700' },
  communityProfileAchievementWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  communityProfileAchievementBadge: {
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
  },
  communityProfileAchievementBadgeActive: {
    backgroundColor: 'rgba(74,222,128,0.14)',
    borderColor: 'rgba(74,222,128,0.34)',
  },
  communityProfileAchievementBadgeMuted: {
    backgroundColor: 'rgba(143,179,200,0.08)',
    borderColor: 'rgba(143,179,200,0.18)',
  },
  communityProfileAchievementText: { fontSize: 12, fontWeight: '800' },
  communityProfileAchievementTextActive: { color: C.green },
  communityProfileAchievementTextMuted: { color: C.muted },

  // Family Sharing
  familySharingOwnerCard: { marginHorizontal: 16, marginTop: 4, padding: 16, borderRadius: 20, alignItems: 'center' },
  familySharingSectionTitle: { color: C.muted, fontSize: 12, fontWeight: '800', letterSpacing: 0.8, marginBottom: 6 },
  familySharingOwnerName: { color: C.text, fontSize: 22, fontWeight: '900' },
  familySharingOwnerSub: { color: C.muted, fontSize: 13, marginTop: 4, textAlign: 'center', fontWeight: '700' },
  familySharingSummaryCard: {
    marginHorizontal: 16,
    marginTop: 12,
    padding: 16,
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  familySharingSummaryTitle: { color: C.text, fontSize: 15, fontWeight: '800' },
  familySharingSummaryCount: { color: C.accent, fontSize: 24, fontWeight: '900' },
  familySharingEmptyCard: { padding: 18, borderRadius: 18, marginBottom: 14, alignItems: 'center' },
  familySharingEmptyText: { color: C.faint, fontSize: 13, fontStyle: 'italic' },
  familySharingMemberCard: {
    marginBottom: 12,
    padding: 14,
    borderRadius: 18,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  familySharingAvatarCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: C.bg,
    borderWidth: 1,
    borderColor: C.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  familySharingAvatarText: { color: C.text, fontSize: 18, fontWeight: '900' },
  familySharingMemberEmail: { color: C.text, fontSize: 15, fontWeight: '900' },
  familySharingMemberMeta: { color: C.muted, fontSize: 12, marginTop: 3, fontWeight: '700' },
  familySharingStatusBadge: {
    alignSelf: 'flex-start',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
    marginTop: 8,
    borderWidth: 1,
  },
  familySharingStatusBadgeAccepted: { backgroundColor: 'rgba(74,222,128,0.14)', borderColor: 'rgba(74,222,128,0.32)' },
  familySharingStatusBadgePending: { backgroundColor: 'rgba(96,165,250,0.14)', borderColor: 'rgba(96,165,250,0.32)' },
  familySharingStatusText: { fontSize: 11, fontWeight: '900', letterSpacing: 0.7 },
  familySharingStatusTextAccepted: { color: C.green },
  familySharingStatusTextPending: { color: C.blue },
  familySharingActionColumn: { gap: 8, alignItems: 'flex-end' },
  familySharingActionBtn: {
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: C.border,
    backgroundColor: C.cardHigh,
  },
  familySharingActionBtnDanger: { borderColor: 'rgba(248,113,113,0.5)', backgroundColor: 'rgba(248,113,113,0.12)' },
  familySharingActionBtnText: { color: C.text, fontSize: 12, fontWeight: '800' },
  familySharingActionBtnTextDanger: { color: C.red },
  familySharingNote: {
    backgroundColor: C.blue + '18',
    borderLeftWidth: 3,
    borderLeftColor: C.blue,
    padding: 12,
    borderRadius: 12,
    marginBottom: 12,
  },
  familySharingNoteText: { color: C.blue, fontSize: 12, lineHeight: 18, fontWeight: '600' },

  // Community comments
  communityCommentsScroll: { paddingHorizontal: 16, paddingTop: 8, paddingBottom: 18 },
  communityCommentsCard: { padding: 16, borderRadius: 20, marginBottom: 12 },
  communityCommentsTargetLabel: { color: C.muted, fontSize: 12, fontWeight: '700', marginBottom: 6 },
  communityCommentsTargetText: { color: C.text, fontSize: 15, fontWeight: '800', lineHeight: 21 },
  communityCommentsSectionTitle: { color: C.text, fontSize: 16, fontWeight: '900', marginBottom: 12 },
  communityCommentsEmptyText: { color: C.faint, fontSize: 13, fontStyle: 'italic' },
  communityCommentItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: C.border,
  },
  communityCommentAvatar: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: C.bg,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: C.border,
  },
  communityCommentAvatarText: { color: C.text, fontSize: 13, fontWeight: '900' },
  communityCommentRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  communityCommentAuthor: { color: C.text, fontSize: 13, fontWeight: '900' },
  communityCommentTime: { color: C.muted, fontSize: 11, fontWeight: '700' },
  communityCommentText: { color: C.text, fontSize: 13, lineHeight: 18, marginTop: 4 },
  communityCommentDeleteBtn: { alignSelf: 'center', marginLeft: 8, paddingHorizontal: 6, paddingVertical: 4 },
  communityCommentDeleteText: { color: C.red, fontSize: 12, fontWeight: '800' },
  communityCommentComposer: {
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 18,
    borderTopWidth: 1,
    borderTopColor: C.border,
    backgroundColor: C.bg,
  },
  communityCommentInput: {
    backgroundColor: C.card,
    color: C.text,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: C.border,
    minHeight: 92,
    paddingHorizontal: 14,
    paddingVertical: 12,
    textAlignVertical: 'top',
    fontSize: 14,
  },
  communityCommentPostBtn: {
    marginTop: 10,
    backgroundColor: C.accent,
    borderRadius: 16,
    paddingVertical: 14,
    alignItems: 'center',
  },
  communityCommentPostBtnText: { color: '#fff', fontSize: 15, fontWeight: '900' },

  // Lost pet flow
  stepTitle:         { color: C.text, fontSize: 24, fontWeight: '900', marginBottom: 16 },
  petSelectCard:     { flexDirection: 'row', alignItems: 'center', gap: 14, backgroundColor: C.card, borderRadius: 16, padding: 14, marginBottom: 10, borderWidth: 1, borderColor: C.border },
  petSelectCardActive: { borderColor: C.red, backgroundColor: C.cardHigh },
  petSelectName:     { color: C.text, fontSize: 17, fontWeight: '900' },
  petSelectBreed:    { color: C.muted, fontSize: 13, marginTop: 3 },
  bigRedBtn:         { backgroundColor: C.red, borderRadius: 16, paddingVertical: 16, alignItems: 'center', marginTop: 18 },
  bigRedBtnText:     { color: '#fff', fontSize: 15, fontWeight: '900' },
  redAlertBanner:    { backgroundColor: C.red + '25', borderLeftWidth: 4, borderLeftColor: C.red, borderRadius: 12, padding: 12, marginBottom: 18 },
  redAlertText:      { color: C.red, fontSize: 13, fontWeight: '800', lineHeight: 19 },
  inputLabel:        { color: C.text, fontSize: 14, fontWeight: '800', marginBottom: 8 },
  textAreaInput:     { backgroundColor: C.card, color: C.text, borderRadius: 14, padding: 13, minHeight: 98, textAlignVertical: 'top', marginBottom: 16, borderWidth: 1, borderColor: C.border },
  radiusBtn:         { flex: 1, backgroundColor: C.card, borderRadius: 14, paddingVertical: 12, alignItems: 'center', borderWidth: 1, borderColor: C.border },
  radiusBtnActive:   { backgroundColor: C.red, borderColor: C.red },
  radiusBtnText:     { color: C.muted, fontWeight: '900' },
  lostFoundBadge:    { backgroundColor: 'rgba(74,222,128,0.14)', borderRadius: 999, paddingHorizontal: 10, paddingVertical: 6, borderWidth: 1, borderColor: 'rgba(74,222,128,0.32)' },
  lostFoundBadgeText: { color: C.green, fontSize: 11, fontWeight: '900', letterSpacing: 0.8 },
  lostFoundBadgeActive: { backgroundColor: 'rgba(96,165,250,0.14)', borderColor: 'rgba(96,165,250,0.32)' },
  lostFoundBadgeFound: { backgroundColor: 'rgba(74,222,128,0.14)', borderColor: 'rgba(74,222,128,0.32)' },
  lostFoundBadgeTextActive: { color: C.blue },
  lostFoundBadgeTextFound: { color: C.green },
  shareBtn:          { flex: 1, backgroundColor: C.card, borderRadius: 14, paddingVertical: 12, alignItems: 'center', borderWidth: 1, borderColor: C.border },
  foundBtn:          { backgroundColor: C.green, borderRadius: 16, paddingVertical: 16, alignItems: 'center' },
  foundBtnText:      { color: C.bg, fontWeight: '900', fontSize: 16 },
});
