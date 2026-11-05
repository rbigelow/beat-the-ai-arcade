// Real audio analysis helpers: FFT, spectrogram, signal quality, and model features.

export const SAMPLE_RATE = 16000
export const FFT_SIZE = 512
export const HOP_SIZE = 256
export const FEATURE_FRAMES = 16
export const FEATURE_BANDS = 32
export const FEATURE_SIZE = FEATURE_FRAMES * FEATURE_BANDS

/** In-place radix-2 FFT; returns magnitude spectrum (first half). */
export function fftMagnitudes(samples) {
  const n = samples.length
  const real = Float64Array.from(samples)
  const imag = new Float64Array(n)
  for (let i = 1, j = 0; i < n; i += 1) {
    let bit = n >> 1
    for (; j & bit; bit >>= 1) j ^= bit
    j ^= bit
    if (i < j) [real[i], real[j]] = [real[j], real[i]]
  }
  for (let len = 2; len <= n; len <<= 1) {
    const angle = (-2 * Math.PI) / len
    const wr = Math.cos(angle)
    const wi = Math.sin(angle)
    for (let i = 0; i < n; i += len) {
      let cr = 1
      let ci = 0
      for (let k = 0; k < len / 2; k += 1) {
        const a = i + k
        const b = a + len / 2
        const tr = real[b] * cr - imag[b] * ci
        const ti = real[b] * ci + imag[b] * cr
        real[b] = real[a] - tr
        imag[b] = imag[a] - ti
        real[a] += tr
        imag[a] += ti
        const next = cr * wr - ci * wi
        ci = cr * wi + ci * wr
        cr = next
      }
    }
  }
  const mags = new Float32Array(n / 2)
  for (let i = 0; i < n / 2; i += 1) mags[i] = Math.hypot(real[i], imag[i]) / n
  return mags
}

/** Short-time Fourier transform: array of magnitude frames (time x frequency). */
export function computeSpectrogram(samples, fftSize = FFT_SIZE, hop = HOP_SIZE) {
  const frames = []
  const window = Float32Array.from({ length: fftSize }, (_, i) => 0.5 - 0.5 * Math.cos((2 * Math.PI * i) / (fftSize - 1)))
  for (let start = 0; start + fftSize <= samples.length; start += hop) {
    const chunk = new Float32Array(fftSize)
    for (let i = 0; i < fftSize; i += 1) chunk[i] = samples[start + i] * window[i]
    frames.push(fftMagnitudes(chunk))
  }
  return frames
}

/** Signal quality from raw samples (-1..1): RMS level, peak, clipping and a simple verdict. */
export function analyzeSignalQuality(samples) {
  if (!samples || samples.length === 0) return { rms: 0, peak: 0, clippedRatio: 0, status: 'quiet', label: 'No signal' }
  let sumSquares = 0
  let peak = 0
  let clipped = 0
  for (let i = 0; i < samples.length; i += 1) {
    const v = Math.abs(samples[i])
    sumSquares += v * v
    if (v > peak) peak = v
    if (v >= 0.98) clipped += 1
  }
  const rms = Math.sqrt(sumSquares / samples.length)
  const clippedRatio = clipped / samples.length
  let status = 'good'
  let label = 'Good level'
  if (clippedRatio > 0.002 || peak >= 0.99) {
    status = 'loud'
    label = 'Too loud (clipping)'
  } else if (peak < 0.04) {
    status = 'quiet'
    label = 'Too quiet'
  } else if (rms < 0.004) {
    status = 'noisy'
    label = 'Very low level'
  }
  return { rms, peak, clippedRatio, status, label }
}

/** Index of the loudest window in the signal so a short event is centred. */
export function findLoudestOffset(samples, windowSize) {
  if (samples.length <= windowSize) return 0
  const step = Math.max(1, Math.floor(windowSize / 8))
  let bestStart = 0
  let bestEnergy = -1
  for (let start = 0; start + windowSize <= samples.length; start += step) {
    let energy = 0
    for (let i = start; i < start + windowSize; i += 4) energy += samples[i] * samples[i]
    if (energy > bestEnergy) {
      bestEnergy = energy
      bestStart = start
    }
  }
  return bestStart
}

/**
 * Converts audio samples into the model's input: FEATURE_FRAMES x FEATURE_BANDS log-magnitude
 * values (frequency bands pooled from the spectrogram), scaled to roughly 0..1.
 */
export function extractFeatures(samples) {
  const needed = FFT_SIZE + HOP_SIZE * (FEATURE_FRAMES - 1)
  const offset = findLoudestOffset(samples, needed)
  const segment = new Float32Array(needed)
  segment.set(samples.subarray(offset, offset + needed))
  const frames = computeSpectrogram(segment)
  const features = new Float32Array(FEATURE_SIZE)
  const binsPerBand = frames[0].length / FEATURE_BANDS
  for (let t = 0; t < FEATURE_FRAMES; t += 1) {
    for (let b = 0; b < FEATURE_BANDS; b += 1) {
      let sum = 0
      const from = Math.floor(b * binsPerBand)
      const to = Math.floor((b + 1) * binsPerBand)
      for (let k = from; k < to; k += 1) sum += frames[t][k]
      const mean = sum / Math.max(1, to - from)
      features[t * FEATURE_BANDS + b] = Math.min(1, Math.max(0, (Math.log10(mean + 1e-6) + 6) / 6))
    }
  }
  return features
}

/** Resamples by averaging/linear interpolation to the model's sample rate. */
export function resampleTo(samples, fromRate, toRate = SAMPLE_RATE) {
  if (fromRate === toRate) return Float32Array.from(samples)
  const ratio = fromRate / toRate
  const length = Math.floor(samples.length / ratio)
  const out = new Float32Array(length)
  for (let i = 0; i < length; i += 1) {
    const position = i * ratio
    const lower = Math.floor(position)
    const upper = Math.min(samples.length - 1, lower + 1)
    const fraction = position - lower
    out[i] = samples[lower] * (1 - fraction) + samples[upper] * fraction
  }
  return out
}
