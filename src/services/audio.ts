import { Audio } from 'expo-av';

import { useSettingsStore } from '@/store/settingsStore';

const soundAssets = {
  buttonTap: require('../../assets/sounds/button-tap.mp3'),
  coinDrop: require('../../assets/sounds/coin-drop.mp3'),
  successChime: require('../../assets/sounds/success-chime.mp3'),
  victory: require('../../assets/sounds/victory.mp3'),
  alert: require('../../assets/sounds/alert.mp3'),
  unlock: require('../../assets/sounds/unlock.mp3'),
  navigation: require('../../assets/sounds/navigation.mp3'),
  error: require('../../assets/sounds/error.mp3'),
  modal: require('../../assets/sounds/modal.mp3'),
  achievement: require('../../assets/sounds/achievement.mp3'),
  celebration: require('../../assets/sounds/celebration.mp3'),
  save: require('../../assets/sounds/save.mp3'),
  delete: require('../../assets/sounds/delete.mp3'),
  // Нові звуки для кіберпанк-атмосфери та механіки розшуку
  wantedLevelUp: require('../../assets/sounds/wanted-level-up.mp3'),
  cyberSwipe: require('../../assets/sounds/cyber-swipe.mp3'),
} as const;

type UiSoundEvent = keyof typeof soundAssets;

let audioPrepared = false;

const isSoundEnabled = (): boolean => useSettingsStore.getState().soundEnabled;

const ensureAudioMode = async (): Promise<void> => {
  if (audioPrepared) {
    return;
  }

  try {
    await Audio.setAudioModeAsync({
      playsInSilentModeIOS: true,
      staysActiveInBackground: false,
      shouldDuckAndroid: true,
      playThroughEarpieceAndroid: false,
    });
    audioPrepared = true;
  } catch {
    audioPrepared = false;
  }
};

export const playUiSound = async (event: UiSoundEvent): Promise<void> => {
  if (!isSoundEnabled()) {
    return;
  }

  let sound: Audio.Sound | null = null;

  try {
    await ensureAudioMode();
    const { sound: createdSound } = await Audio.Sound.createAsync(
      soundAssets[event],
      { shouldPlay: true, volume: 0.55 }
    );
    sound = createdSound;
    sound.setOnPlaybackStatusUpdate((status) => {
      if (!status.isLoaded) {
        return;
      }

      if (status.didJustFinish) {
        sound?.unloadAsync().catch(() => undefined);
      }
    });
  } catch (error) {
    console.error(`Помилка відтворення звуку ${event}:`, error);
    await sound?.unloadAsync().catch(() => undefined);
  }
};

export const playButtonTapSound = async (): Promise<void> => playUiSound('buttonTap');
export const playCoinDropSound = async (): Promise<void> => playUiSound('coinDrop');
export const playSuccessChimeSound = async (): Promise<void> => playUiSound('successChime');
export const playVictorySound = async (): Promise<void> => playUiSound('victory');
export const playAlertSound = async (): Promise<void> => playUiSound('alert');
export const playUnlockSound = async (): Promise<void> => playUiSound('unlock');
export const playNavigationSound = async (): Promise<void> => playUiSound('navigation');
export const playErrorSound = async (): Promise<void> => playUiSound('error');
export const playModalSound = async (): Promise<void> => playUiSound('modal');
export const playAchievementSound = async (): Promise<void> => playUiSound('achievement');
export const playCelebrationSound = async (): Promise<void> => playUiSound('celebration');
export const playSaveSound = async (): Promise<void> => playUiSound('save');
export const playDeleteSound = async (): Promise<void> => playUiSound('delete');

// Нові експорти
export const playWantedLevelUpSound = async (): Promise<void> => playUiSound('wantedLevelUp');
export const playCyberSwipeSound = async (): Promise<void> => playUiSound('cyberSwipe');
