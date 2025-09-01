const soundUrls = {
  click: 'https://cdn.pixabay.com/audio/2022/03/15/audio_50b97f5950.mp3',
  placeBet: 'https://cdn.pixabay.com/audio/2022/03/10/audio_a890291931.mp3',
  win: 'https://cdn.pixabay.com/audio/2022/03/23/audio_73ed8c1137.mp3',
  lose: 'https://cdn.pixabay.com/audio/2022/03/10/audio_c632821540.mp3',
};

type SoundType = keyof typeof soundUrls;

const audioCache: { [key in SoundType]?: HTMLAudioElement } = {};
const MUTE_KEY = 'chadflip_muted';

export const isMuted = (): boolean => {
    try {
        return localStorage.getItem(MUTE_KEY) === 'true';
    } catch (e) {
        return false;
    }
};

export const toggleMute = (): boolean => {
    const currentlyMuted = isMuted();
    try {
        localStorage.setItem(MUTE_KEY, String(!currentlyMuted));
    } catch (e) {
        // Ignore localStorage errors
    }
    return !currentlyMuted;
};

export const preloadSounds = () => {
    (Object.keys(soundUrls) as SoundType[]).forEach(key => {
        if (!audioCache[key]) {
            const audio = new Audio(soundUrls[key]);
            audio.preload = 'auto';
            audioCache[key] = audio;
        }
    });
};

export const playSound = (type: SoundType) => {
  if (isMuted()) return;

  try {
    const audio = audioCache[type];
    if (audio) {
      audio.currentTime = 0;
      audio.play().catch(error => {
        console.warn(`Could not play sound (${type}):`, error);
      });
    }
  } catch (e) {
    console.error(`Error playing sound (${type}):`, e);
  }
};
