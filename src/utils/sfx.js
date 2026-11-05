// Optional arcade sound effects generated with the Web Audio API. Default: OFF.
let enabled = false
let suppressed = false
let context = null

const EFFECTS = {
  button: [[520, 0.06]],
  countdown: [[440, 0.1]],
  correct: [[523, 0.1], [659, 0.1], [784, 0.15]],
  incorrect: [[220, 0.15], [165, 0.25]],
  victory: [[523, 0.1], [659, 0.1], [784, 0.1], [1047, 0.3]],
  generation: [[392, 0.08], [523, 0.12]],
  goal: [[660, 0.1], [880, 0.1], [1100, 0.2]],
}

export function setSfxEnabled(value) {
  enabled = value
  if (!value) closeSfx()
}
export const isSfxEnabled = () => enabled
export function setSfxSuppressed(value) {
  suppressed = value
  if (value) closeSfx()
}

export function closeSfx() {
  if (context) {
    context.close().catch(() => {})
    context = null
  }
}

export function playSfx(name) {
  if (!enabled || suppressed) return
  const notes = EFFECTS[name]
  const AudioContextClass = window.AudioContext || window.webkitAudioContext
  if (!notes || !AudioContextClass) return
  try {
    context ??= new AudioContextClass()
    let time = context.currentTime
    for (const [frequency, duration] of notes) {
      const oscillator = context.createOscillator()
      const gain = context.createGain()
      oscillator.type = 'triangle'
      oscillator.frequency.value = frequency
      gain.gain.setValueAtTime(0.12, time)
      gain.gain.exponentialRampToValueAtTime(0.001, time + duration)
      oscillator.connect(gain).connect(context.destination)
      oscillator.start(time)
      oscillator.stop(time + duration)
      time += duration
    }
  } catch {
    // Sound effects are optional; ignore failures.
  }
}
