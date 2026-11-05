export const SOUND_CLASSES = [
  { id: 'clap', label: 'Clap', emoji: '👏', instruction: 'Clap your hands once or twice.' },
  { id: 'whistle', label: 'Whistle', emoji: '😗', instruction: 'Whistle a steady note.' },
  { id: 'snap', label: 'Snap', emoji: '🫰', instruction: 'Snap your fingers.' },
  { id: 'voice', label: 'Voice', emoji: '🗣', instruction: 'Say "hello" in a steady voice.' },
  { id: 'background', label: 'Background Noise', emoji: '🔈', instruction: 'Stay quiet and let room noise be heard.' },
]

export const UNKNOWN_CLASS = { id: 'unknown', label: 'Unknown', emoji: '❓', instruction: '' }
export const CHALLENGE_CLASSES = SOUND_CLASSES.filter((c) => c.id !== 'background')
export const CONFIDENCE_THRESHOLD = 0.5
export const EXAMPLES_PER_CLASS = 8
export const MODEL_BASE = 'models/sound-detective'
