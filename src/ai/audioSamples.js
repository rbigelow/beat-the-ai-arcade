// Original synthetic sound samples generated in code (no third-party audio, so no licensing issues).
import { SAMPLE_RATE } from './audioFeatures.js'

const SECONDS = 1

function noise(rng) {
  return rng() * 2 - 1
}

export function synthesizeSample(classId, rng = Math.random) {
  const length = SAMPLE_RATE * SECONDS
  const out = new Float32Array(length)
  const startAt = Math.floor(length * (0.15 + rng() * 0.4))
  const addAt = (i, v) => {
    if (i >= 0 && i < length) out[i] += v
  }
  if (classId === 'clap') {
    const bursts = 1 + Math.floor(rng() * 2)
    const decay = 0.012 + rng() * 0.015
    for (let b = 0; b < bursts; b += 1) {
      const burstStart = startAt + b * Math.floor(SAMPLE_RATE * (0.18 + rng() * 0.1))
      let previous = 0
      for (let i = 0; i < SAMPLE_RATE * 0.12; i += 1) {
        const raw = noise(rng)
        const highPassed = raw - 0.5 * previous
        previous = raw
        addAt(burstStart + i, highPassed * Math.exp(-i / (SAMPLE_RATE * decay)) * 0.7)
      }
    }
  } else if (classId === 'whistle') {
    const base = 1800 + rng() * 1400
    const duration = SAMPLE_RATE * (0.35 + rng() * 0.3)
    let phase = 0
    for (let i = 0; i < duration; i += 1) {
      const vibrato = 1 + 0.01 * Math.sin((2 * Math.PI * 6 * i) / SAMPLE_RATE)
      phase += (2 * Math.PI * base * vibrato) / SAMPLE_RATE
      const envelope = Math.sin((Math.PI * i) / duration)
      addAt(startAt + i, Math.sin(phase) * envelope * 0.55 + noise(rng) * 0.01)
    }
  } else if (classId === 'snap') {
    const ring = 2500 + rng() * 2000
    for (let i = 0; i < SAMPLE_RATE * 0.04; i += 1) {
      const envelope = Math.exp(-i / (SAMPLE_RATE * 0.004))
      addAt(startAt + i, (Math.sin((2 * Math.PI * ring * i) / SAMPLE_RATE) * 0.6 + noise(rng) * 0.3) * envelope)
    }
  } else if (classId === 'voice') {
    const fundamental = 100 + rng() * 150
    const formant = 500 + rng() * 900
    const duration = SAMPLE_RATE * (0.4 + rng() * 0.3)
    for (let i = 0; i < duration; i += 1) {
      const t = i / SAMPLE_RATE
      let value = 0
      for (let h = 1; h <= 20; h += 1) {
        const frequency = fundamental * h
        const gain = Math.exp(-Math.pow((frequency - formant) / 500, 2)) / h
        value += gain * Math.sin(2 * Math.PI * frequency * t)
      }
      const envelope = Math.sin((Math.PI * i) / duration)
      addAt(startAt + i, value * envelope * 0.25)
    }
  } else {
    const level = 0.004 + rng() * 0.02
    let brown = 0
    for (let i = 0; i < length; i += 1) {
      brown = (brown + noise(rng) * 0.1) * 0.98
      out[i] = (brown * 3 + noise(rng) * 0.3) * level * 5
    }
  }
  for (let i = 0; i < length; i += 1) out[i] = Math.max(-1, Math.min(1, out[i]))
  return out
}
