import React, { useState, useRef, useEffect } from 'react';
import { 
  View, Text, ScrollView, TouchableOpacity, StyleSheet, Animated,
  TextInput, FlatList, Dimensions, Modal, Alert, Image, Linking, Share,
  KeyboardAvoidingView, Platform, StatusBar, Vibration,
} from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { SafeAreaView, SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Audio } from 'expo-av';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
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
  { id: '1',  petId: '1', emoji: '🌊', color: '#1e4976', caption: "Max's beach day!",       milestone: true,  date: 'May 20' },
  { id: '2',  petId: '1', emoji: '🌿', color: '#1a4a2e', caption: 'Park run',               milestone: false, date: 'May 18' },
  { id: '3',  petId: '1', emoji: '🎂', color: '#4a1a1a', caption: 'Birthday boy! 🎉',       milestone: true,  date: 'May 10' },
  { id: '4',  petId: '1', emoji: '🏕️', color: '#2d3a1a', caption: 'Camping trip',           milestone: false, date: 'May 05' },
  { id: '5',  petId: '1', emoji: '❄️', color: '#1a2a4a', caption: 'First snow!',            milestone: true,  date: 'Jan 15' },
  { id: '6',  petId: '1', emoji: '🛁', color: '#1a3a3a', caption: 'Bath time',              milestone: false, date: 'Jan 10' },
  { id: '7',  petId: '2', emoji: '🐱', color: '#3a1a4a', caption: 'Luna nap time',          milestone: false, date: 'May 22' },
  { id: '8',  petId: '2', emoji: '🌸', color: '#4a1a2d', caption: 'Garden explorer',        milestone: false, date: 'May 15' },
  { id: '9',  petId: '2', emoji: '🎀', color: '#4a2a1a', caption: 'Dressed up!',            milestone: false, date: 'May 01' },
  { id: '10', petId: '3', emoji: '🐾', color: '#2a1a4a', caption: 'Buddy loves hiking',     milestone: true,  date: 'Apr 28' },
  { id: '11', petId: '3', emoji: '🦴', color: '#3a2a1a', caption: 'Treat time',             milestone: false, date: 'Apr 20' },
  { id: '12', petId: '3', emoji: '💤', color: '#1a2a3a', caption: 'Sleepy Buddy',           milestone: false, date: 'Apr 15' },
];

const POSTS = [
  { id: '1', author: 'Sarah M.',    petType: 'Golden Retriever Mom', time: '2h ago', content: 'Anyone know a good dog-friendly trail near Ocean County? Max loved Cattus Island but want to try somewhere new! 🐾', emoji: '🌲', likes: 24, comments: 8,  type: 'question'     },
  { id: '2', author: 'Mike R.',     petType: 'Beagle Dad',           time: '4h ago', content: '🚨 MISSING: Bella (Beagle, 3 yrs) — last seen near Lacey Township. Wearing red collar. PLEASE SHARE! 🚨',        emoji: '🚨', likes: 89, comments: 34, type: 'lost_pet',    lost: true },
  { id: '3', author: 'Johnson Fam', petType: 'Multi-pet household',  time: '1d ago', content: 'Rocky just graduated from puppy training! 8 weeks of hard work and this guy nailed every single command 🎓🐶',    emoji: '🎓', likes: 67, comments: 14, type: 'celebration'  },
  { id: '4', author: 'Vet Dr. Kim', petType: 'Animal Clinic Partner', time: '2d ago', content: 'Summer reminder: sidewalks can reach 150°F on hot days. Test with your hand for 5 seconds — if you can\'t hold it, neither can your pet! 🌡️', emoji: '☀️', likes: 103, comments: 22, type: 'tip' },
];

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
function PetAvatarRow({ pets, selectedId, onSelect, bounceValue }) {
  const selectedScale = bounceValue || 1;
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
            onPress={() => onSelect(pet.id)}
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

                  backgroundColor: 'rgba(255,122,26,0.16)',

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
                <Text
                  style={{
                    fontSize: 38,
                  }}
                >
                  {pet.emoji}
                </Text>
              </Animated.View>
            ) : (
              <View
                style={{
                  width: 72,
                  height: 72,

                  borderRadius: 36,

                  backgroundColor: '#1e1e1e',

                  borderWidth: 0,

                  borderColor: '#ff7a1a',

                  alignItems: 'center',
                  justifyContent: 'center',

                  shadowColor: '#000',

                  shadowOffset: { width: 0, height: 6 },

                  shadowOpacity: 0.08,

                  shadowRadius: 14,

                  elevation: 2,
                }}
              >
                <Text
                  style={{
                    fontSize: 32,
                  }}
                >
                  {pet.emoji}
                </Text>
              </View>
            )}

            <Text
              style={{
                color: selected ? '#fff' : '#a1a1aa',

                fontSize: selected ? 15 : 13,

                fontWeight: selected ? '700' : '500',

                marginTop: 8,
              }}
            >
              {pet.name}
            </Text>
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
}
// ─────────────────────────────────────────────
// SCREEN: DASHBOARD
// ─────────────────────────────────────────────
function DashboardScreen({ navigation }) {
  const [selectedPetId, setSelectedPetId] = useState('1');
  const [tasks, setTasks] = useState(TASKS);
  const [careReminders, setCareReminders] = useState([]);
  const [selectedCalendarDate, setSelectedCalendarDate] = useState(new Date());
  const [showReminderModal, setShowReminderModal] = useState(false);
  const [editingReminder, setEditingReminder] = useState(null);
  const [reminderTitle, setReminderTitle] = useState('');
  const [reminderIcon, setReminderIcon] = useState('🍽️');
  const [reminderDate, setReminderDate] = useState('');
  const [reminderTime, setReminderTime] = useState('');
  const [activityLogs, setActivityLogs] = useState([]);
  const [customActions, setCustomActions] = useState([]);
  const [showAddActionModal, setShowAddActionModal] = useState(false);
  const [customActionName, setCustomActionName] = useState('');
  const [customActionIcon, setCustomActionIcon] = useState('⭐');
  const [petScores, setPetScores] = useState(
    Object.fromEntries(PETS.map(p => [p.id, p.score]))
  );
  const petBounce = useRef(new Animated.Value(1)).current;
  const previousPetIdRef = useRef(selectedPetId);
  const pet = PETS.find(p => p.id === selectedPetId);
  const playPetSound = async (species) => {
    const soundAsset = PET_SOUNDS[species];

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

    const selectedPet = PETS.find(p => p.id === petId);
    if (selectedPet?.species) {
      void playPetSound(selectedPet.species);
    }
  };
  useEffect(() => {
    if (previousPetIdRef.current === selectedPetId) return;
    previousPetIdRef.current = selectedPetId;
  }, [selectedPetId]);
  const reminderIconOptions = ['🍽️', '💊', '🦮', '🎾', '🧼', '⚖️', '💧', '🌡️', '🧪', '🧹', '🔥', '💬'];
  const formatLocalDateKey = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };
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
  const formatReminderDate = (value) => {
    const key = normalizeReminderDateKey(value);
    if (!key) return typeof value === 'string' && value.trim() ? value.trim() : 'No date set';
    if (!/^\d{4}-\d{2}-\d{2}$/.test(key)) return key;
    const [year, month, day] = key.split('-').map(Number);
    const date = new Date(year, month - 1, day);
    return date.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
  };
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
      source: 'manual',
    };

    setCareReminders(prev => (
      editingReminder
        ? prev.map(reminder => (reminder.id === editingReminder.id ? nextReminder : reminder))
        : [nextReminder, ...prev]
    ));
    setShowReminderModal(false);
    setEditingReminder(null);
    setReminderTitle('');
    setReminderIcon('🍽️');
    setReminderDate(selectedCalendarDateKey);
    setReminderTime('');
  };
  const toggleReminderComplete = (reminderId) => {
    setCareReminders(prev => prev.map(reminder => (
      reminder.id === reminderId
        ? { ...reminder, completed: !reminder.completed }
        : reminder
    )));
  };
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
            [task.petId]: Math.max(0, Math.min(100, (prev[task.petId] ?? PETS.find(p => p.id === task.petId)?.score ?? 0) - scoreDelta)),
          }));
        }
      }
    }
  };

  const getScoreDelta = (type) => (
    type === 'meal' || type === 'feeding'
      ? 1
      : type === 'walk' || type === 'play' || type === 'social_time'
        ? 2
        : type === 'medication'
          ? 3
          : type === 'weight' || type === 'tank_temp' || type === 'water_change' || type === 'check_ph' || type === 'filter_cleaned' || type === 'grooming' || type === 'litter_cleaned' || type === 'cage_cleaned' || type === 'heat_check' || type === 'humidity_check' || type === 'habitat_cleaned' || type === 'custom'
            ? 1
            : 0
  );

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

    if (scoreDelta > 0) {
      setPetScores(prev => ({
        ...prev,
        [targetPetId]: Math.max(0, Math.min(100, (prev[targetPetId] ?? PETS.find(p => p.id === targetPetId)?.score ?? 0) + scoreDelta)),
      }));
    }
  };

  const deleteActivityLog = (logId) => {
    const logToDelete = activityLogs.find(log => log.id === logId);

    setActivityLogs(prev => prev.filter(log => log.id !== logId));

    if (logToDelete) {
      const scoreDelta = getScoreDelta(logToDelete.type);

      if (scoreDelta > 0) {
        setPetScores(prev => ({
          ...prev,
          [logToDelete.petId]: Math.max(0, Math.min(100, (prev[logToDelete.petId] ?? PETS.find(p => p.id === logToDelete.petId)?.score ?? 0) - scoreDelta)),
        }));
      }
    }
  };

  const currentScore = petScores[selectedPetId] ?? pet.score;
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
  const quickActions = pet.species === 'fish'
    ? [
        { icon: '🍽️', label: 'Feed Fish', action: () => addActivityLog('feeding', 'Fish fed', '🍽️') },
        { icon: '💧', label: 'Water Change', action: () => addActivityLog('water_change', 'Water changed', '💧') },
        { icon: '🌡️', label: 'Tank Temp', action: () => addActivityLog('tank_temp', 'Tank temperature checked', '🌡️') },
        { icon: '🧪', label: 'Check pH', action: () => addActivityLog('check_ph', 'Water pH checked', '🧪') },
        { icon: '🧽', label: 'Filter Cleaned', action: () => addActivityLog('filter_cleaned', 'Filter cleaned', '🧽') },
        { icon: '🩺', label: 'AI Vet', action: () => navigation.navigate('AIVet') },
      ]
    : pet.species === 'bird'
      ? [
          { icon: '🍽️', label: 'Feed Bird', action: () => addActivityLog('feeding', 'Bird fed', '🍽️') },
          { icon: '🧼', label: 'Cage Cleaned', action: () => addActivityLog('cage_cleaned', 'Cage cleaned', '🧼') },
          { icon: '💬', label: 'Social Time', action: () => addActivityLog('social_time', 'Social time logged', '💬') },
          { icon: '⚖️', label: 'Log Weight', action: () => addActivityLog('weight', 'Weight updated', '⚖️') },
          { icon: '🩺', label: 'AI Vet', action: () => navigation.navigate('AIVet') },
        ]
      : pet.species === 'reptile'
        ? [
            { icon: '🍽️', label: 'Feed Reptile', action: () => addActivityLog('feeding', 'Reptile fed', '🍽️') },
            { icon: '🔥', label: 'Heat Check', action: () => addActivityLog('heat_check', 'Heat checked', '🔥') },
            { icon: '💧', label: 'Humidity Check', action: () => addActivityLog('humidity_check', 'Humidity checked', '💧') },
            { icon: '🧽', label: 'Habitat Cleaned', action: () => addActivityLog('habitat_cleaned', 'Habitat cleaned', '🧽') },
            { icon: '🩺', label: 'AI Vet', action: () => navigation.navigate('AIVet') },
          ]
        : pet.species === 'cat'
          ? [
              { icon: '🍽️', label: 'Log Meal', action: () => addActivityLog('meal', 'Meal logged', '🍽️') },
              { icon: '🎾', label: 'Play Time', action: () => addActivityLog('play', 'Play time logged', '🎾') },
              { icon: '🧼', label: 'Grooming', action: () => addActivityLog('grooming', 'Grooming logged', '🧼') },
              { icon: '⚖️', label: 'Log Weight', action: () => addActivityLog('weight', 'Weight updated', '⚖️') },
              { icon: '💊', label: 'Medication', action: () => addActivityLog('medication', 'Medication given', '💊') },
              { icon: '🧹', label: 'Litter Cleaned', action: () => addActivityLog('litter_cleaned', 'Litter cleaned', '🧹') },
              { icon: '🩺', label: 'AI Vet', action: () => navigation.navigate('AIVet') },
            ]
          : [
              { icon: '🍽️', label: 'Log Meal', action: () => addActivityLog('meal', 'Meal logged', '🍽️') },
              { icon: '🦮', label: 'Log Walk', action: () => addActivityLog('walk', 'Walk logged', '🦮') },
              { icon: '⚖️', label: 'Log Weight', action: () => addActivityLog('weight', 'Weight updated', '⚖️') },
              { icon: '💊', label: 'Medication', action: () => addActivityLog('medication', 'Medication given', '💊') },
              { icon: '🎾', label: 'Play Time', action: () => addActivityLog('play', 'Play time logged', '🎾') },
              { icon: '🧼', label: 'Grooming', action: () => addActivityLog('grooming', 'Grooming logged', '🧼') },
              { icon: '🩺', label: 'AI Vet', action: () => navigation.navigate('AIVet') },
            ];
const ACTION_ICONS = [

];  const displayedQuickActions = [
    ...quickActions,
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

  return (
    <SafeAreaView style={s.screen} edges={['top']}>
      {/* Header */}
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
      Monday, May 25 · {PETS.length} pets
    </Text>
  </View>

  <TouchableOpacity style={s.sosButton} onPress={() => navigation.navigate('LostPet')}>
    <Text style={s.sosText}>🚨 SOS</Text>
  </TouchableOpacity>
</View>
      <PetAvatarRow
        pets={PETS}
        selectedId={selectedPetId}
        onSelect={handleSelectPet}
        bounceValue={petBounce}
      />

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Health Score */}
        <TouchableOpacity activeOpacity={0.9} onPress={() => navigation.navigate('Health')}>
          <Card style={s.healthScoreCard}>
            <View style={s.healthScoreLeft}>
              <View style={[s.scoreCircle, { borderColor: scoreColor }]}>
                <Text style={[s.scoreNumber, { color: scoreColor }]}>{currentScore}</Text>
                <Text style={s.scoreLabel}>/100</Text>
              </View>
            </View>
            <View style={s.healthScoreRight}>
              <Text style={s.healthScoreTitle}>{pet.name}'s Health Score</Text>
              <Text style={s.healthScoreSub}>🐾 {pet.breed} · {pet.age}</Text>
              <View style={{ marginTop: 8 }}>
                {visibleHealthInsights.map((insight, index) => (
                  <Text key={`${insight}-${index}`} style={s.healthScoreCheck}>{insight}</Text>
                ))}
              </View>
            </View>
          </Card>
        </TouchableOpacity>

        {/* Quick Actions */}
        <View style={s.section}>
          <Text style={s.sectionTitle}>Quick Actions</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 0, gap: 0 }}>
            {displayedQuickActions.map(item => (
              <TouchableOpacity key={item.label} style={[s.quickAction, item.isAddAction && s.quickActionAdd]} onPress={item.action}>
                <Text style={s.quickActionIcon}>{item.icon}</Text>
                <Text style={s.quickActionLabel}>{item.label}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Streak */}
        <Card style={s.streakCard}>
          {recentActivity.length === 0 ? (
            <View>
              <Text style={s.streakTitle}>Start your first care streak</Text>
              <Text style={s.streakSub}>Log a care action to begin building momentum for {pet.name}.</Text>
            </View>
          ) : (
            <View>
              <Text style={s.streakTitle}>{streakDays} Day Care Streak</Text>
              <Text style={s.streakSub}>Keep caring for {pet.name} every day.</Text>
            </View>
          )}
        </Card>

        {/* Recent Activity */}
        <View style={s.section}>
          <Text style={s.sectionTitle}>Recent Activity</Text>
          {recentActivity.length === 0 ? (
            <Card style={s.recentActivityEmptyCard}>
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
                <Card style={s.recentActivityCard}>
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

        {/* Care Calendar */}
        <View style={s.section}>
          <View style={s.sectionHeaderRow}>
            <Text style={s.sectionTitle}>Care Calendar</Text>
            <TouchableOpacity style={s.calendarAddBtn} onPress={openReminderModal}>
              <Text style={s.calendarAddBtnText}>＋ Add Reminder</Text>
            </TouchableOpacity>
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
                    selected && s.tabPillActive,
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
                  <Text
                    style={[
                      s.tabPillText,
                      selected && s.tabPillTextActive,
                      { fontSize: 11, fontWeight: '700', textAlign: 'center' },
                    ]}
                  >
                    {date.toLocaleDateString([], { weekday: 'short' })}
                  </Text>
                  <Text
                    style={[
                      s.tabPillText,
                      selected && s.tabPillTextActive,
                      { fontSize: 16, fontWeight: '800', marginTop: 2, textAlign: 'center' },
                    ]}
                  >
                    {date.getDate()}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
          {calendarReminders.length === 0 ? (
            <Card>
              <Text style={{ color: C.muted, textAlign: 'center', padding: 16 }}>
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
                <Card style={[s.reminderCard, reminder.completed && s.reminderCardDone]}>
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

        <View style={{ height: 130 }} />
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
            <TextInput
              style={s.customActionInput}
              value={reminderDate}
              onChangeText={setReminderDate}
              placeholder="YYYY-MM-DD"
              placeholderTextColor={C.muted}
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
  );
}

// ─────────────────────────────────────────────
function HealthHubScreen() {
  const [selectedPetId, setSelectedPetId] = useState('1');
  const [activeTab, setActiveTab] = useState('all');
  const [healthRecords, setHealthRecords] = useState(HEALTH_RECORDS);
  const [showRecordModal, setShowRecordModal] = useState(false);
  const [pendingRecordType, setPendingRecordType] = useState(null);
  const [editingRecord, setEditingRecord] = useState(null);
  const [recordForm, setRecordForm] = useState({
    vaccineName: '',
    providerClinic: '',
    nextDueDate: '',
    medicationName: '',
    dosage: '',
    nextDoseDate: '',
    appointmentReason: '',
    vetClinic: '',
    appointmentDate: '',
    weightValue: '',
    weightNotes: '',
    symptomName: '',
    severity: '',
    symptomNotes: '',
  });
  const [showExportPreview, setShowExportPreview] = useState(false);
  const tabs = ['all', 'vaccines', 'meds', 'appointments', 'weight'];
  const tabLabels = {
    all: '📋 All',
    vaccines: '💉 Vaccines',
    meds: '💊 Meds',
    appointments: '🏥 Visits',
    weight: '⚖️ Weight',
  };

  const typeMap = {
    vaccination: 'vaccines',
    medication: 'meds',
    appointment: 'appointments',
    weight: 'weight',
  };

  const createEmptyRecordForm = () => ({
    vaccineName: '',
    providerClinic: '',
    nextDueDate: '',
    medicationName: '',
    dosage: '',
    nextDoseDate: '',
    appointmentReason: '',
    vetClinic: '',
    appointmentDate: '',
    weightValue: '',
    weightNotes: '',
    symptomName: '',
    severity: '',
    symptomNotes: '',
  });

  const recordFieldConfig = {
    vaccination: [
      { key: 'vaccineName', label: 'Vaccine name', placeholder: 'Vaccine name', required: true },
      { key: 'providerClinic', label: 'Provider / clinic', placeholder: 'Provider / clinic' },
      { key: 'nextDueDate', label: 'Next due date', placeholder: 'Next due date' },
    ],
    medication: [
      { key: 'medicationName', label: 'Medication name', placeholder: 'Medication name', required: true },
      { key: 'dosage', label: 'Dosage', placeholder: 'Dosage' },
      { key: 'nextDoseDate', label: 'Next dose / due date', placeholder: 'Next dose / due date' },
    ],
    appointment: [
      { key: 'appointmentReason', label: 'Reason', placeholder: 'Reason', required: true },
      { key: 'vetClinic', label: 'Vet / clinic', placeholder: 'Vet / clinic' },
      { key: 'appointmentDate', label: 'Appointment date', placeholder: 'Appointment date' },
    ],
    weight: [
      { key: 'weightValue', label: 'Weight', placeholder: 'Weight', required: true },
      { key: 'weightNotes', label: 'Notes', placeholder: 'Notes' },
    ],
    symptom: [
      { key: 'symptomName', label: 'Symptom', placeholder: 'Symptom', required: true },
      { key: 'severity', label: 'Severity', placeholder: 'Severity' },
      { key: 'symptomNotes', label: 'Notes', placeholder: 'Notes' },
    ],
  };

  const recordMainFieldKey = {
    vaccination: 'vaccineName',
    medication: 'medicationName',
    appointment: 'appointmentReason',
    weight: 'weightValue',
    symptom: 'symptomName',
  };

  const recordTypeLabelMap = {
    vaccination: 'Vaccination',
    medication: 'Medication',
    appointment: 'Appointment',
    weight: 'Weight',
    symptom: 'Symptom',
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

  const pet = PETS.find((p) => p.id === selectedPetId);

  const statusInfo = {
    current: { label: 'CURRENT', color: C.green },
    due_soon: { label: 'DUE SOON', color: C.yellow },
    overdue: { label: 'OVERDUE', color: C.red },
    upcoming: { label: 'UPCOMING', color: C.blue },
  };
  const getRecordFormFromRecord = (record) => {
    const base = {
      vaccineName: '',
      providerClinic: '',
      nextDueDate: '',
      medicationName: '',
      dosage: '',
      nextDoseDate: '',
      appointmentReason: '',
      vetClinic: '',
      appointmentDate: '',
      weightValue: '',
      weightNotes: '',
      symptomName: '',
      severity: '',
      symptomNotes: '',
    };

    if (record?.details) {
      return { ...base, ...record.details };
    }

    const parsedTitle = getRecordDetailFromTitle(record);
    const mainKey = recordMainFieldKey[record?.type];
    if (mainKey) return { ...base, [mainKey]: parsedTitle };
    return base;
  };

  const buildRecordMeta = (type, form) => {
    const clean = Object.fromEntries(
      Object.entries(form).map(([key, value]) => [key, String(value || '').trim()])
    );
    const mainKey = recordMainFieldKey[type];
    const mainValue = clean[mainKey] || '';

    const typeConfig = {
      vaccination: {
        title: `Vaccination: ${mainValue}`,
        icon: '💉',
        status: 'current',
        detailLines: [
          clean.providerClinic ? `Provider / clinic: ${clean.providerClinic}` : null,
          clean.nextDueDate ? `Next due date: ${clean.nextDueDate}` : null,
        ].filter(Boolean),
      },
      medication: {
        title: `Medication: ${mainValue}`,
        icon: '💊',
        status: 'current',
        detailLines: [
          clean.dosage ? `Dosage: ${clean.dosage}` : null,
          clean.nextDoseDate ? `Next dose / due date: ${clean.nextDoseDate}` : null,
        ].filter(Boolean),
      },
      appointment: {
        title: `Appointment: ${mainValue}`,
        icon: '🏥',
        status: 'upcoming',
        detailLines: [
          clean.vetClinic ? `Vet / clinic: ${clean.vetClinic}` : null,
          clean.appointmentDate ? `Appointment date: ${clean.appointmentDate}` : null,
        ].filter(Boolean),
      },
      weight: {
        title: `Weight: ${mainValue}`,
        icon: '⚖️',
        status: 'current',
        detailLines: [clean.weightNotes ? `Notes: ${clean.weightNotes}` : null].filter(Boolean),
      },
      symptom: {
        title: `Symptom: ${mainValue}`,
        icon: '🤒',
        status: 'due_soon',
        detailLines: [
          clean.severity ? `Severity: ${clean.severity}` : null,
          clean.symptomNotes ? `Notes: ${clean.symptomNotes}` : null,
        ].filter(Boolean),
      },
    };

    return { ...typeConfig[type], mainValue, details: clean };
  };

  const createHealthRecord = (type, form) => {
    const meta = buildRecordMeta(type, form);
    if (!meta || !meta.mainValue) return;

    const newRecord = {
      id: Date.now().toString(),
      petId: selectedPetId,
      type,
      title: meta.title,
      date: new Date().toLocaleDateString(),
      provider: null,
      status: meta.status,
      icon: meta.icon,
      nextDue: null,
      details: meta.details,
    };

    setHealthRecords((prev) => [newRecord, ...prev]);
  };

  const openRecordTypePrompt = (type) => {
    setPendingRecordType(type);
    setRecordForm(createEmptyRecordForm());
    setEditingRecord(null);
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

    if (editingRecord) {
      setHealthRecords(prev => prev.map(record => (
        record.id === editingRecord.id
          ? {
              ...record,
              type: pendingRecordType,
              title: meta.title,
              details: meta.details,
            }
          : record
      )));
    } else {
      createHealthRecord(pendingRecordType, recordForm);
    }

    setShowRecordModal(false);
    setPendingRecordType(null);
    setRecordForm(createEmptyRecordForm());
    setEditingRecord(null);
  };

  const closeRecordModal = () => {
    setShowRecordModal(false);
    setPendingRecordType(null);
    setRecordForm(createEmptyRecordForm());
    setEditingRecord(null);
  };

  const deleteRecord = (recordId) => {
    setHealthRecords(prev => prev.filter(record => record.id !== recordId));
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
    return date.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' }).toUpperCase();
  };

  const groupedTimeline = Object.values(
    records.reduce((acc, record) => {
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

  const getRecordDisplayLines = (record) => {
    const details = record.details || {};

    if (record.type === 'vaccination') {
      return [
        details.providerClinic ? `Provider / clinic: ${details.providerClinic}` : null,
        details.nextDueDate ? `Next due date: ${details.nextDueDate}` : null,
      ].filter(Boolean);
    }

    if (record.type === 'medication') {
      return [
        details.dosage ? `Dosage: ${details.dosage}` : null,
        details.nextDoseDate ? `Next dose / due date: ${details.nextDoseDate}` : null,
      ].filter(Boolean);
    }

    if (record.type === 'appointment') {
      return [
        details.vetClinic ? `Vet / clinic: ${details.vetClinic}` : null,
        details.appointmentDate ? `Appointment date: ${details.appointmentDate}` : null,
      ].filter(Boolean);
    }

    if (record.type === 'weight') {
      return [details.weightNotes ? `Notes: ${details.weightNotes}` : null].filter(Boolean);
    }

    if (record.type === 'symptom') {
      return [
        details.severity ? `Severity: ${details.severity}` : null,
        details.symptomNotes ? `Notes: ${details.symptomNotes}` : null,
      ].filter(Boolean);
    }

    return [];
  };

  const getRecordAlertSummary = (record) => {
    const lines = [record.title];

    if (record.date) lines.push(`Date: ${record.date}`);
    if (record.provider) lines.push(`Provider: ${record.provider}`);
    if (record.nextDue) lines.push(`Next due: ${record.nextDue}`);

    const details = getRecordDisplayLines(record);
    if (details.length > 0) {
      lines.push('', ...details);
    }

    return lines.join('\n');
  };

  const getRecordFullDetails = (record) => {
    const details = record.details || {};
    const parts = [record.title, `Date: ${record.date}`];

    if (record.provider) parts.push(`Provider: ${record.provider}`);
    if (record.nextDue) parts.push(`Next due: ${record.nextDue}`);

    if (record.type === 'vaccination') {
      if (details.providerClinic) parts.push(`Provider / clinic: ${details.providerClinic}`);
      if (details.nextDueDate) parts.push(`Next due date: ${details.nextDueDate}`);
    }

    if (record.type === 'medication') {
      if (details.dosage) parts.push(`Dosage: ${details.dosage}`);
      if (details.nextDoseDate) parts.push(`Next dose / due date: ${details.nextDoseDate}`);
    }

    if (record.type === 'appointment') {
      if (details.vetClinic) parts.push(`Vet / clinic: ${details.vetClinic}`);
      if (details.appointmentDate) parts.push(`Appointment date: ${details.appointmentDate}`);
    }

    if (record.type === 'weight') {
      if (record.value != null) parts.push(`Value: ${record.value}${record.unit ? ` ${record.unit}` : ''}`);
      if (details.weightNotes) parts.push(`Notes: ${details.weightNotes}`);
    }

    if (record.type === 'symptom') {
      if (details.severity) parts.push(`Severity: ${details.severity}`);
      if (details.symptomNotes) parts.push(`Notes: ${details.symptomNotes}`);
    }

    return parts.filter(Boolean).join('\n');
  };

  const showRecordActions = (record) => {
    Alert.alert(
      record.title,
      getRecordAlertSummary(record),
      [
        { text: 'View', onPress: () => Alert.alert(record.title, getRecordFullDetails(record)) },
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
      ]
    );
  };

  const currentScore = PETS.find((p) => p.id === selectedPetId)?.score ?? 0;
  const streakDays = Math.max(1, records.length ? new Set(records.map((record) => record.date)).size : 1);
  const latestRecords = [...records]
    .sort((a, b) => getRecordDate(b) - getRecordDate(a))
    .slice(0, 5);

  const overdueRecords = records.filter((record) => record.status === 'overdue');
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

  const buildHealthSummary = () => {
    const lines = [
      `Health Summary for ${pet.name}`,
      `Species/Breed: ${pet.species || 'Unknown'} · ${pet.breed || 'Unknown'}`,
      `Current Health Score: ${currentScore}/100`,
      `Total Health Records: ${records.length}`,
      `Current Streak: ${streakDays} day${streakDays === 1 ? '' : 's'}`,
      '',
      'Latest Records:',
      ...latestRecords.map((record) => `- ${record.title} (${record.date})`),
    ];

    return lines.join('\n');
  };

  const openExportPreview = () => {
    setShowExportPreview(true);
  };

  const shareSummary = async () => {
    const summary = buildHealthSummary();
    try {
      await Share.share({ message: summary });
    } catch (error) {
      Alert.alert('Share failed', 'Unable to share the summary right now.');
    }
  };
  return (
    <SafeAreaView style={s.screen} edges={['top']}>
      <View style={[s.pageHeader, { paddingTop: 2, marginTop: 0, marginBottom: 0 }]}>
        <Text style={s.pageTitle}>Health Hub</Text>

        <TouchableOpacity style={s.exportBtn} onPress={openExportPreview}>
          <Text style={s.exportBtnText}>Export PDF</Text>
        </TouchableOpacity>
      </View>

      <View style={{ marginTop: 0 }}>
        <View style={{ marginTop: -10, marginBottom: -8 }}>
          <PetAvatarRow
            pets={PETS}
            selectedId={selectedPetId}
            onSelect={setSelectedPetId}
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
        </Card>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingBottom: 180,
        }}
      >
        {/* Summary Card */}
        <Card
          style={{
            marginHorizontal: 16,
            marginTop: 20,
            marginBottom: 6,
            paddingVertical: 10,
            flexDirection: 'row',
            justifyContent: 'space-around',
          }}
        >
          {[
            {
              num: records.filter((r) => r.status === 'current').length,
              label: 'Current',
              color: C.green,
            },
            {
              num: records.filter((r) => r.status === 'due_soon').length,
              label: 'Due Soon',
              color: C.yellow,
            },
            {
              num: records.filter((r) => r.status === 'overdue').length,
              label: 'Overdue',
              color: C.red,
            },
          ].map((item) => (
            <View key={item.label} style={{ alignItems: 'center' }}>
              <Text
                style={{
                  color: item.color,
                  fontSize: 24,
                  fontWeight: '800',
                }}
              >
                {item.num}
              </Text>

              <Text
                style={{
                  color: C.muted,
                  fontSize: 11,
                }}
              >
                {item.label}
              </Text>
            </View>
          ))}
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
                      <Text style={s.timelineIcon}>{record.icon}</Text>
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
                        <Text style={s.timelineDate}>{record.date}</Text>

                        {getRecordDisplayLines(record).length > 0 && (
                          <Text style={{ color: C.muted, fontSize: 11, lineHeight: 16, marginTop: 6 }}>
                            {getRecordDisplayLines(record).join('\n')}
                          </Text>
                        )}

                        {record.provider && (
                          <Text style={s.timelineProvider}>{record.provider}</Text>
                        )}

                        {record.nextDue && (
                          <Text style={s.timelineDue}>Next: {record.nextDue}</Text>
                        )}
                      </View>

                      {record.status && statusInfo[record.status] && (
                        <View style={[s.timelineBadge, { borderColor: statusInfo[record.status].color, backgroundColor: `${statusInfo[record.status].color}15` }]}>
                          <Text style={[s.timelineBadgeText, { color: statusInfo[record.status].color }]}>
                            {statusInfo[record.status].label}
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
                </View>
              ))}
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

      <Modal visible={showExportPreview} transparent animationType="fade" onRequestClose={() => setShowExportPreview(false)}>
        <View style={s.modalOverlay}>
          <View style={s.customActionModal}>
            <Text style={s.customActionModalTitle}>Export Preview</Text>

            <ScrollView style={{ maxHeight: 360 }} showsVerticalScrollIndicator={false}>
              <Text style={{ color: C.text, fontWeight: '800', fontSize: 16, marginBottom: 10 }}>
                {pet.name}
              </Text>
              <Text style={{ color: C.muted, marginBottom: 6 }}>
                Species/Breed: {pet.species || 'Unknown'} · {pet.breed || 'Unknown'}
              </Text>
              <Text style={{ color: C.muted, marginBottom: 6 }}>
                Current Health Score: {currentScore}/100
              </Text>
              <Text style={{ color: C.muted, marginBottom: 6 }}>
                Total Health Records: {records.length}
              </Text>
              <Text style={{ color: C.muted, marginBottom: 12 }}>
                Current Streak: {streakDays} day{streakDays === 1 ? '' : 's'}
              </Text>

              <Text style={{ color: C.text, fontWeight: '700', marginBottom: 8 }}>
                Latest 5 Records
              </Text>
              {latestRecords.length === 0 ? (
                <Text style={{ color: C.muted }}>No records yet.</Text>
              ) : (
                latestRecords.map((record) => (
                  <Text key={record.id} style={{ color: C.muted, marginBottom: 6 }}>
                    • {record.title}
                  </Text>
                ))
              )}
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
    </SafeAreaView>
  );
}
// ─────────────────────────────────────────────
// SCREEN: MEMORY VAULT
// ─────────────────────────────────────────────
function MemoryVaultScreen() {
  const [selectedPetId, setSelectedPetId] = useState('1');
  const [activeTab, setActiveTab] = useState('all');
  const { width } = Dimensions.get('window');
  const cellSize = (width - 32 - 8) / 3;

  const memories = MEMORIES.filter(m =>
    m.petId === selectedPetId && (activeTab === 'all' || (activeTab === 'milestones' && m.milestone))
  );

  const pet = PETS.find(p => p.id === selectedPetId);

  return (
    <SafeAreaView style={s.screen} edges={['top']}>
      <View style={s.pageHeader}>
        <View>
          <Text style={s.pageTitle}>Memory Vault</Text>
          <Text style={s.pageSub}>{memories.length} memories · {memories.filter(m => m.milestone).length} milestones</Text>
        </View>
        <TouchableOpacity style={s.iconBtn} onPress={() => Alert.alert('Add Memory', 'Choose an option:\n📷 Take Photo\n🖼️ From Library\n🎥 Record Video')}>
          <Text style={{ fontSize: 24 }}>📷</Text>
        </TouchableOpacity>
      </View>

      <PetAvatarRow pets={PETS} selectedId={selectedPetId} onSelect={setSelectedPetId} />

      {/* Memory of the Day */}
      <Card style={s.motdCard}>
        <Text style={s.motdBadge}>✨ Memory of the Day</Text>
        <Text style={{ fontSize: 48, textAlign: 'center', marginVertical: 8 }}>🌊</Text>
        <Text style={s.motdCaption}>{pet.name}'s first beach trip!</Text>
        <Text style={s.motdDate}>May 2026</Text>
      </Card>

      {/* Tabs */}
      <View style={{ flexDirection: 'row', paddingHorizontal: 16, gap: 8, marginBottom: 12 }}>
        {['all', 'milestones', 'videos'].map(tab => (
          <TouchableOpacity key={tab} style={[s.tabPill, activeTab === tab && s.tabPillActive]} onPress={() => setActiveTab(tab)}>
            <Text style={[s.tabPillText, activeTab === tab && s.tabPillTextActive]}>
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Photo Grid */}
      <ScrollView contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 60 }}>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 4 }}>
          {memories.map(mem => (
            <TouchableOpacity
              key={mem.id}
              style={[s.memCell, { width: cellSize, height: cellSize, backgroundColor: mem.color }]}
              onPress={() => Alert.alert(mem.caption, `📅 ${mem.date}${mem.milestone ? '\n⭐ Milestone' : ''}`)}
            >
              <Text style={s.memEmoji}>{mem.emoji}</Text>
              {mem.milestone && <View style={s.mileStar}><Text style={{ fontSize: 10 }}>⭐</Text></View>}
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>

      <TouchableOpacity style={s.fab} onPress={() => Alert.alert('Add Memory', '📷 Open camera to capture a new memory for ' + pet.name)}>
        <Text style={s.fabText}>＋</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

// ─────────────────────────────────────────────
// SCREEN: COMMUNITY
// ─────────────────────────────────────────────
function CommunityScreen() {
  const [posts, setPosts] = useState(POSTS);
  const [showCompose, setShowCompose] = useState(false);
  const [postText, setPostText] = useState('');

  const toggleLike = (postId) => {
    setPosts(prev => prev.map(p => p.id === postId ? { ...p, likes: p.likes + (p.liked ? -1 : 1), liked: !p.liked } : p));
  };

  const submitPost = () => {
    if (!postText.trim()) return;
    const newPost = { id: Date.now().toString(), author: 'Raymond', petType: 'Multi-pet Dad', time: 'Just now', content: postText, emoji: '🐾', likes: 0, comments: 0, type: 'general' };
    setPosts(prev => [newPost, ...prev]);
    setPostText('');
    setShowCompose(false);
  };

  return (
    <SafeAreaView style={s.screen} edges={['top']}>
      <View style={s.pageHeader}>
        <View>
          <Text style={s.pageTitle}>Community</Text>
          <Text style={s.pageSub}>📍 Bayville, NJ</Text>
        </View>
        <TouchableOpacity style={s.accentBtn} onPress={() => setShowCompose(true)}>
          <Text style={s.accentBtnText}>＋ Post</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>
        {posts.map(post => (
          <Card key={post.id} style={{ marginBottom: 14 }}>
            {/* Lost pet special header */}
            {post.lost && (
              <View style={s.lostBanner}>
                <Text style={s.lostBannerText}>🚨 LOST PET ALERT</Text>
              </View>
            )}
            {/* Author */}
            <View style={s.postAuthorRow}>
              <View style={s.postAvatar}>
                <Text style={{ fontSize: 18 }}>{post.emoji}</Text>
              </View>
              <View style={s.flex}>
                <Text style={s.postAuthor}>{post.author}</Text>
                <Text style={s.postPetType}>{post.petType} · {post.time}</Text>
              </View>
            </View>
            {/* Content */}
            <Text style={s.postContent}>{post.content}</Text>
            {/* Media placeholder */}
            <View style={[s.postMediaPlaceholder, { backgroundColor: post.lost ? '#3a0a0a' : C.cardHigh }]}>
              <Text style={{ fontSize: 40 }}>{post.emoji}</Text>
            </View>
            {/* Actions */}
            <View style={s.postActions}>
              <TouchableOpacity style={s.postAction} onPress={() => toggleLike(post.id)}>
                <Text style={{ fontSize: 18 }}>{post.liked ? '❤️' : '🤍'}</Text>
                <Text style={[s.postActionText, post.liked && { color: '#e74c3c' }]}>{post.likes}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={s.postAction} onPress={() => Alert.alert('Comments', `${post.comments} people commented on this post.`)}>
                <Text style={{ fontSize: 18 }}>💬</Text>
                <Text style={s.postActionText}>{post.comments}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={s.postAction} onPress={() => Alert.alert('Share', 'Share this post to Facebook, Nextdoor, or Twitter')}>
                <Text style={{ fontSize: 18 }}>↗️</Text>
                <Text style={s.postActionText}>Share</Text>
              </TouchableOpacity>
            </View>
            {post.lost && (
              <TouchableOpacity style={s.alertNeighborsBtn} onPress={() => Alert.alert('🚨 Alert Sent!', '156 pet owners in your area have been notified.')}>
                <Text style={s.alertNeighborsBtnText}>🚨 Alert My Neighborhood</Text>
              </TouchableOpacity>
            )}
          </Card>
        ))}
      </ScrollView>

      {/* Compose Modal */}
      <Modal visible={showCompose} animationType="slide" presentationStyle="pageSheet">
        <SafeAreaView style={[s.screen, { backgroundColor: C.bg }]}>
          <View style={s.modalHeader}>
            <TouchableOpacity onPress={() => { setShowCompose(false); setPostText(''); }}>
              <Text style={{ color: C.muted, fontSize: 16 }}>Cancel</Text>
            </TouchableOpacity>
            <Text style={s.modalTitle}>New Post</Text>
            <TouchableOpacity onPress={submitPost}>
              <Text style={{ color: C.accent, fontSize: 16, fontWeight: '700' }}>Share</Text>
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
    </SafeAreaView>
  );
}

// ─────────────────────────────────────────────
// SCREEN: SETTINGS
// ─────────────────────────────────────────────
function SettingsScreen({ navigation }) {
  const menuSections = [
    {
      title: 'Account',
      items: [
        { icon: '👤', label: 'Profile', sub: 'Raymond · rayray579@gmail.com' },
        { icon: '🏠', label: 'Family Sharing', sub: '2 household members' },
        { icon: '💳', label: 'Subscription', sub: '⭐ Premium — renews Aug 2026', accent: true },
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
                  onPress={() => Alert.alert(item.label, item.sub || 'Coming soon!')}
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
  );
}

// ─────────────────────────────────────────────
// MODAL: AI VET ASSISTANT
// ─────────────────────────────────────────────
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
  const [step, setStep] = useState(1);
  const [selectedPet, setSelectedPet] = useState(PETS[0]);
  const [petPhoto, setPetPhoto] = useState(null);
  const [lastKnownLocation, setLastKnownLocation] = useState(null);
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const [description, setDescription] = useState('');
  const [radius, setRadius] = useState(2);
  const [activated, setActivated] = useState(false);

  const activate = () => {
    setStep(3);
    setTimeout(() => { setActivated(true); setStep(4); }, 2000);
  };

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
    <SafeAreaView style={s.screen} edges={['top', 'bottom']}>
      <View style={s.modalHeader}>
        <TouchableOpacity onPress={() => navigation.goBack()}><Text style={{ color: C.muted }}>✕ Cancel</Text></TouchableOpacity>
        <Text style={[s.modalTitle, { color: C.red }]}>🚨 Lost Pet Mode</Text>
        <View style={{ width: 60 }} />
      </View>
      <ScrollView contentContainerStyle={{ padding: 16 }}>
        <Text style={s.stepTitle}>Which pet is missing?</Text>
        {PETS.map(pet => (
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
  );

  if (step === 2) return (
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
  );

  if (step === 3) return (
    <SafeAreaView style={[s.screen, { justifyContent: 'center', alignItems: 'center' }]}>
      <Text style={{ fontSize: 64 }}>📡</Text>
      <Text style={[s.modalTitle, { marginTop: 16 }]}>Broadcasting Alert...</Text>
      <Text style={{ color: C.muted, textAlign: 'center', marginTop: 8, paddingHorizontal: 32 }}>Notifying all PetSync+ users within {radius} miles of your last location</Text>
    </SafeAreaView>
  );

  return (
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
          bottom: 18,

          height: 82,

          borderRadius: 28,
          backgroundColor: '#1e1e1e',

          borderTopWidth: 0,

          paddingTop: 6,
          paddingBottom: 12,

          elevation: 0,

          shadowColor: '#000',
          shadowOffset: { width: 0, height: 10 },
          shadowOpacity: 0.12,
          shadowRadius: 20,
        },

        tabBarActiveTintColor: C.accent,
        tabBarInactiveTintColor: C.muted,

        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
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
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <StatusBar barStyle="light-content" backgroundColor={C.bg} />
        <NavigationContainer>
          <Stack.Navigator screenOptions={{ headerShown: false }}>
            <Stack.Screen name="Main"    component={TabNavigator}  />
            <Stack.Screen name="AIVet"   component={AIVetScreen}   options={{ presentation: 'modal' }} />
            <Stack.Screen name="LostPet" component={LostPetScreen} options={{ presentation: 'modal' }} />
          </Stack.Navigator>
        </NavigationContainer>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

// ─────────────────────────────────────────────
// ALL STYLES
// ─────────────────────────────────────────────
const s = StyleSheet.create({
  // Layout
  screen:            { flex: 1, backgroundColor: C.bg },
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
  dashHeader:        { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingTop: 12, paddingBottom: 8 },
greeting: {
  color: C.text,
  fontSize: 30,
  fontWeight: '800',
  letterSpacing: -0.6,
},
subGreeting: {
  color: C.muted,
  fontSize: 15,
  marginTop: 4,
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
  petAvatar:         { width: 64, height: 64, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginRight: 12, backgroundColor: C.card },
  petAvatarActive:   { backgroundColor: C.cardHigh, borderWidth: 2, borderColor: C.accent },
  petAvatarEmoji:    { fontSize: 26 },
  petAvatarName:     { color: C.muted, fontSize: 11, marginTop: 3, fontWeight: '700' },

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
healthScoreCard: {
  marginHorizontal: 16,
  marginTop: 18,
  marginBottom: 8,
  flexDirection: 'row',
  alignItems: 'center',
  gap: 16,
},
  healthScoreLeft:   { width: 92, alignItems: 'center' },
  healthScoreRight:  { flex: 1 },
  scoreCircle:       { width: 84, height: 84, borderRadius: 42, borderWidth: 5, alignItems: 'center', justifyContent: 'center' },
  scoreNumber:       { fontSize: 28, fontWeight: '900' },
  scoreLabel:        { color: C.muted, fontSize: 11, marginTop: -4 },
  healthScoreTitle:  { color: C.text, fontSize: 17, fontWeight: '800' },
  healthScoreSub:    { color: C.muted, fontSize: 13, marginTop: 4 },
  healthScoreCheck:  { color: C.muted, fontSize: 12, marginTop: 2 },
  streakCard: {
    marginHorizontal: 16,
    marginTop: 15,
    marginBottom: 8,
    padding: 18,
    borderRadius: 22,
    backgroundColor: '#1e1e1e',
    borderWidth: 1,
    borderColor: C.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 2,
  },
  streakTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '800',
  },
  streakSub: {
    color: C.muted,
    fontSize: 13,
    marginTop: 4,
  },
  recentActivityEmptyCard: {
    backgroundColor: '#1e1e1e',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: C.border,
    paddingVertical: 18,
    paddingHorizontal: 16,
  },
  recentActivityEmptyText: {
    color: C.muted,
    textAlign: 'center',
    fontSize: 14,
    fontWeight: '600',
  },
  recentActivityCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1e1e1e',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: C.border,
    padding: 14,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 2,
  },
  recentActivityIconWrap: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: C.bg,
    marginRight: 12,
  },
  recentActivityIcon: {
    fontSize: 22,
  },
  recentActivityContent: {
    flex: 1,
  },
  recentActivityTitle: {
    color: C.text,
    fontSize: 15,
    fontWeight: '800',
  },
  recentActivityMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
  },
  recentActivityTime: {
    color: C.muted,
    fontSize: 12,
    fontWeight: '600',
    marginRight: 8,
  },
  recentActivityTypePill: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 999,
    backgroundColor: 'rgba(255,107,53,0.12)',
  },
  recentActivityTypeText: {
    color: C.accent,
    fontSize: 10,
    fontWeight: '800',
    textTransform: 'capitalize',
  },
  calendarAddBtn: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: 'rgba(255,107,53,0.14)',
    borderWidth: 1,
    borderColor: 'rgba(255,107,53,0.35)',
  },
  calendarAddBtnText: {
    color: C.accent,
    fontSize: 12,
    fontWeight: '800',
  },
  reminderCard: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    backgroundColor: '#1e1e1e',
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

  backgroundColor: '#1e1e1e',

  padding: 18,
  borderRadius: 22,

  marginBottom: 14,

  shadowColor: '#000',
  shadowOffset: { width: 0, height: 6 },
  shadowOpacity: 0.08,
  shadowRadius: 14,

  elevation: 3,
},
  taskCardDone:      { opacity: 0.55 },
  taskCheck:         { fontSize: 20 },
  taskInfo:          { flex: 1 },
  taskTitle:         { color: C.text, fontSize: 15, fontWeight: '700' },
  taskTitleDone:     { textDecorationLine: 'line-through', color: C.muted },
  taskTime:          { color: C.muted, fontSize: 12, marginTop: 3 },
  quickAction: {
  backgroundColor: '#1e1e1e',

  width: 82,
  height: 86,
  borderRadius: 22,

  paddingVertical: 10,
  paddingHorizontal: 8,
  alignItems: 'center',
  justifyContent: 'center',

  marginRight: 12,

  shadowColor: '#000',
  shadowOffset: { width: 0, height: 4 },
  shadowOpacity: 0.08,
  shadowRadius: 10,

  elevation: 2,
},
  quickActionIcon:   { fontSize: 30, marginBottom: 4 },
  quickActionLabel:  { color: C.muted, fontSize: 11, fontWeight: '700', textAlign: 'center', lineHeight: 13 },
  quickActionAdd:    { borderWidth: 1, borderColor: C.accent },
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
  shareBtn:          { flex: 1, backgroundColor: C.card, borderRadius: 14, paddingVertical: 12, alignItems: 'center', borderWidth: 1, borderColor: C.border },
  foundBtn:          { backgroundColor: C.green, borderRadius: 16, paddingVertical: 16, alignItems: 'center' },
  foundBtnText:      { color: C.bg, fontWeight: '900', fontSize: 16 },
});
