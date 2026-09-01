export const createPlaySosSound = ({ Audio, Vibration, require } = {}) => {
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
  return playSosSound;
};
