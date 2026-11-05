import { useCallback, useEffect, useRef, useState } from 'react'
import { Mic, Volume2 } from 'lucide-react'
import GameHeader from '../components/GameHeader.jsx'
import GameComplete from '../components/GameComplete.jsx'
import BehindTheScenes from '../components/BehindTheScenes.jsx'
import ConfidenceBars from '../components/ConfidenceBars.jsx'
import ErrorPanel from '../components/ErrorPanel.jsx'
import PrivacyGate from '../components/PrivacyGate.jsx'
import { useMicrophone } from '../hooks/useMicrophone.js'
import { useWebAudioAnalyser } from '../hooks/useWebAudioAnalyser.js'
import { loadPretrainedClassifier, trainClassifier } from '../ai/audioClassifier.js'
import { SAMPLE_RATE, analyzeSignalQuality, computeSpectrogram, extractFeatures } from '../ai/audioFeatures.js'
import { synthesizeSample } from '../ai/audioSamples.js'
import { CHALLENGE_CLASSES, CONFIDENCE_THRESHOLD, EXAMPLES_PER_CLASS, MODEL_BASE, SOUND_CLASSES, UNKNOWN_CLASS } from '../data/soundClasses.js'
import { playSfx, setSfxSuppressed } from '../utils/sfx.js'

const TOTAL_ROUNDS = 5
const CANVAS_W = 480
const CANVAS_H = 120
const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms))
const classById = (id) => [...SOUND_CLASSES, UNKNOWN_CLASS].find((c) => c.id === id) ?? UNKNOWN_CLASS

function pickTargets() {
  const pool = [...CHALLENGE_CLASSES].sort(() => Math.random() - 0.5)
  return [...pool, pool[Math.floor(Math.random() * pool.length)]].slice(0, TOTAL_ROUNDS)
}

function drawWaveform(canvas, samples) {
  const ctx = canvas?.getContext('2d')
  if (!ctx) return
  ctx.fillStyle = '#061523'
  ctx.fillRect(0, 0, CANVAS_W, CANVAS_H)
  ctx.strokeStyle = 'rgba(255,255,255,0.2)'
  ctx.beginPath()
  ctx.moveTo(0, CANVAS_H / 2)
  ctx.lineTo(CANVAS_W, CANVAS_H / 2)
  ctx.stroke()
  if (!samples?.length) return
  ctx.strokeStyle = '#77c5d5'
  ctx.lineWidth = 1.5
  ctx.beginPath()
  const perPixel = samples.length / CANVAS_W
  for (let x = 0; x < CANVAS_W; x += 1) {
    let min = 1
    let max = -1
    for (let i = Math.floor(x * perPixel); i < Math.floor((x + 1) * perPixel); i += 1) {
      if (samples[i] < min) min = samples[i]
      if (samples[i] > max) max = samples[i]
    }
    ctx.moveTo(x, CANVAS_H / 2 - max * (CANVAS_H / 2))
    ctx.lineTo(x, CANVAS_H / 2 - min * (CANVAS_H / 2))
  }
  ctx.stroke()
}

function heatColor(v) {
  const t = Math.max(0, Math.min(1, v))
  return [Math.round(255 * Math.min(1, t * 2)), Math.round(255 * Math.max(0, t * 2 - 0.6)), Math.round(120 * (1 - t) + 40)]
}

function drawSpectrogram(canvas, samples) {
  const ctx = canvas?.getContext('2d')
  if (!ctx) return
  ctx.fillStyle = '#061523'
  ctx.fillRect(0, 0, CANVAS_W, CANVAS_H)
  if (!samples?.length) return
  const frames = computeSpectrogram(samples)
  if (!frames.length) return
  const image = ctx.createImageData(CANVAS_W, CANVAS_H)
  const bins = frames[0].length
  for (let x = 0; x < CANVAS_W; x += 1) {
    const frame = frames[Math.min(frames.length - 1, Math.floor((x / CANVAS_W) * frames.length))]
    for (let y = 0; y < CANVAS_H; y += 1) {
      const bin = Math.min(bins - 1, Math.floor(((CANVAS_H - 1 - y) / CANVAS_H) * bins))
      const [r, g, b] = heatColor((Math.log10(frame[bin] + 1e-6) + 5) / 3.5)
      const o = (y * CANVAS_W + x) * 4
      image.data[o] = r
      image.data[o + 1] = g
      image.data[o + 2] = b
      image.data[o + 3] = 255
    }
  }
  ctx.putImageData(image, 0, 0)
}

function scrollSpectrogram(canvas, freqData) {
  const ctx = canvas?.getContext('2d')
  if (!ctx) return
  ctx.drawImage(canvas, -2, 0)
  for (let y = 0; y < CANVAS_H; y += 1) {
    const bin = Math.floor(((CANVAS_H - 1 - y) / CANVAS_H) * freqData.length * 0.5)
    const [r, g, b] = heatColor(freqData[bin] / 255)
    ctx.fillStyle = `rgb(${r},${g},${b})`
    ctx.fillRect(CANVAS_W - 2, y, 2, 1)
  }
}

export default function AISoundDetective({ game, onBack, onScore }) {
  const mic = useMicrophone()
  const [source, setSource] = useState(null) // null | 'mic' | 'sample'
  const [classifier, setClassifier] = useState(null)
  const [modelNote, setModelNote] = useState('')
  const [examples, setExamples] = useState({})
  const [trainMessage, setTrainMessage] = useState('')
  const [trainProgress, setTrainProgress] = useState(null)
  const [busy, setBusy] = useState(null)
  const [view, setView] = useState('freeplay')
  const [challenge, setChallenge] = useState(null)
  const [prediction, setPrediction] = useState(null)
  const [quality, setQuality] = useState(null)
  const [caption, setCaption] = useState('Choose how to provide sound.')
  const [stage, setStage] = useState(-1)

  const waveRef = useRef(null)
  const specRef = useRef(null)
  const frozenRef = useRef(false)
  const runRef = useRef(0)
  const classifierRef = useRef(null)
  const playbackRef = useRef(null)
  const frameCount = useRef(0)

  const micActive = mic.status === 'listening'

  useEffect(() => {
    drawWaveform(waveRef.current, null)
    drawSpectrogram(specRef.current, null)
  }, [source])

  // Look for a custom model in public/models/sound-detective/.
  useEffect(() => {
    let cancelled = false
    loadPretrainedClassifier(`${import.meta.env.BASE_URL}${MODEL_BASE}`).then(({ classifier: loaded, error }) => {
      if (cancelled) {
        loaded?.dispose()
        return
      }
      if (loaded) {
        classifierRef.current = loaded
        setClassifier(loaded)
      } else {
        setModelNote(error)
      }
    })
    return () => {
      cancelled = true
    }
  }, [])

  // Privacy cleanup: stop everything on exit. The microphone hook stops its own tracks and AudioContext.
  useEffect(() => () => {
    runRef.current += 1
    classifierRef.current?.dispose()
    playbackRef.current?.close().catch(() => {})
    setSfxSuppressed(false)
  }, [])

  useEffect(() => {
    setSfxSuppressed(micActive)
  }, [micActive])

  useWebAudioAnalyser(mic.analyser, ({ timeData, freqData }) => {
    if (frozenRef.current) return
    drawWaveform(waveRef.current, timeData)
    scrollSpectrogram(specRef.current, freqData)
    frameCount.current += 1
    if (frameCount.current % 8 === 0) setQuality(analyzeSignalQuality(timeData))
  })

  const freeze = (samples) => {
    frozenRef.current = true
    drawWaveform(waveRef.current, samples)
    drawSpectrogram(specRef.current, samples)
    setQuality(analyzeSignalQuality(samples))
  }
  const unfreeze = () => {
    frozenRef.current = false
  }

  const classify = useCallback((samples) => {
    const preds = classifierRef.current
      .predict(extractFeatures(samples))
      .map((p) => ({ ...classById(p.id), probability: p.probability }))
      .sort((a, b) => b.probability - a.probability)
    const top = preds[0]
    return { preds, top, unknown: top.probability < CONFIDENCE_THRESHOLD }
  }, [])

  // Live predictions while the microphone is open (free play).
  useEffect(() => {
    if (!(micActive && classifier && view === 'freeplay' && !busy)) return undefined
    const timer = setInterval(() => {
      if (frozenRef.current) return
      const samples = mic.getRecentSamples(1, SAMPLE_RATE)
      if (samples.length < SAMPLE_RATE * 0.5) return
      const result = classify(samples)
      setPrediction({ ...result })
      setCaption(`Strongest match: ${(result.unknown ? UNKNOWN_CLASS : result.top).label.toUpperCase()}`)
    }, 400)
    return () => clearInterval(timer)
  }, [micActive, classifier, view, busy, mic, classify])

  const chooseMic = async () => {
    setSource('mic')
    setCaption('Starting microphone...')
    const ok = await mic.start()
    setCaption(ok ? 'Microphone ready.' : 'Microphone unavailable.')
  }

  const chooseSample = () => {
    mic.stop()
    setSource('sample')
    setCaption('Sample Sound Mode: sounds are generated by the app and played through your speakers.')
  }

  const playSamples = (samples) => new Promise((resolve) => {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext
    if (!AudioContextClass) {
      resolve()
      return
    }
    const context = new AudioContextClass()
    playbackRef.current = context
    const buffer = context.createBuffer(1, samples.length, SAMPLE_RATE)
    buffer.copyToChannel(samples, 0)
    const node = context.createBufferSource()
    node.buffer = buffer
    node.connect(context.destination)
    node.onended = () => {
      context.close().catch(() => {})
      playbackRef.current = null
      resolve()
    }
    node.start()
  })

  const showResult = (samples) => {
    freeze(samples)
    const result = classify(samples)
    setPrediction(result)
    setCaption(`Strongest match: ${(result.unknown ? UNKNOWN_CLASS : result.top).label.toUpperCase()}`)
    return result
  }

  const runThinking = async (id) => {
    for (const [index, text] of ['Capturing sound...', 'Separating sound into frequencies...', 'Comparing patterns...'].entries()) {
      setCaption(text)
      setStage(index + 1)
      await wait(500)
      if (runRef.current !== id) return false
    }
    return true
  }

  // ---- Training -------------------------------------------------------------
  const recordExamples = async (classId, count) => {
    const id = ++runRef.current
    setBusy('recording')
    setTrainMessage('')
    unfreeze()
    let done = 0
    let failures = 0
    while (done < count && failures < 4) {
      setCaption(`Recording ${classById(classId).label.toUpperCase()} example ${done + 1}/${count}: make the sound NOW`)
      await wait(1300)
      if (runRef.current !== id) return
      const samples = mic.getRecentSamples(1.3, SAMPLE_RATE)
      const check = analyzeSignalQuality(samples)
      if (classId !== 'background' && check.status === 'quiet') {
        failures += 1
        setTrainMessage('Too quiet. Make the sound louder or closer to the microphone.')
        continue
      }
      if (check.status === 'loud') setTrainMessage('Warning: the sound is clipping (too loud). Move back a little.')
      const features = extractFeatures(samples)
      setExamples((previous) => ({ ...previous, [classId]: [...(previous[classId] ?? []), features] }))
      freeze(samples)
      done += 1
      await wait(300)
      unfreeze()
    }
    setBusy(null)
    setCaption('Recording finished.')
  }

  const trainModel = async (data) => {
    setBusy('training')
    setTrainMessage('')
    setTrainProgress({ epoch: 0, epochs: 60 })
    try {
      const trained = await trainClassifier(data, (p) => setTrainProgress(p))
      classifierRef.current = trained
      setClassifier(trained)
    } catch (err) {
      setTrainMessage(`Training failed: ${err.message}`)
    }
    setBusy(null)
  }

  const trainOnSamples = () => {
    const rng = Math.random
    const data = {}
    for (const c of SOUND_CLASSES) {
      data[c.id] = Array.from({ length: 12 }, () => extractFeatures(synthesizeSample(c.id, rng)))
    }
    return trainModel(data)
  }

  const resetTraining = () => {
    runRef.current += 1
    if (classifierRef.current?.kind !== 'pretrained') {
      classifierRef.current?.dispose()
      classifierRef.current = null
      setClassifier(null)
    }
    setExamples({})
    setTrainProgress(null)
    setTrainMessage('')
    setPrediction(null)
    setBusy(null)
    setChallenge(null)
    unfreeze()
  }

  // ---- Free play (sample mode) and challenge --------------------------------------
  const playSampleOf = async (classId) => {
    const id = ++runRef.current
    setBusy('playing')
    unfreeze()
    const samples = synthesizeSample(classId)
    setCaption(`Playing a ${classById(classId).label} sample...`)
    await playSamples(samples)
    if (runRef.current !== id) return
    if (await runThinking(id)) {
      const result = showResult(samples)
      setStage(5)
      playSfx(result.top.id === classId ? 'correct' : 'button')
    }
    setBusy(null)
  }

  const startChallenge = () => {
    setChallenge({ targets: pickTargets(), round: 0, score: 0, phase: 'idle', count: null, result: null })
    setView('challenge')
    setPrediction(null)
    unfreeze()
  }

  const runRound = async () => {
    const id = ++runRef.current
    const target = challenge.targets[challenge.round]
    setBusy('round')
    setPrediction(null)
    unfreeze()
    for (const count of [3, 2, 1]) {
      setChallenge((c) => ({ ...c, phase: 'countdown', count, result: null }))
      setCaption(`Get ready to make a ${target.label} sound: ${count}`)
      await wait(900)
      if (runRef.current !== id) return
    }
    setChallenge((c) => ({ ...c, phase: 'listening', count: null }))
    setStage(0)
    let samples
    if (source === 'mic') {
      setCaption('LISTENING...')
      await wait(1600)
      if (runRef.current !== id) return
      samples = mic.getRecentSamples(1.5, SAMPLE_RATE)
    } else {
      samples = synthesizeSample(target.id)
      setCaption('PLAYING SAMPLE...')
      await playSamples(samples)
      if (runRef.current !== id) return
    }
    setChallenge((c) => ({ ...c, phase: 'thinking' }))
    if (!(await runThinking(id))) return
    const check = analyzeSignalQuality(samples)
    if (source === 'mic' && check.status === 'quiet') {
      freeze(samples)
      setStage(0)
      setChallenge((c) => ({ ...c, phase: 'result', result: { tooQuiet: true, target } }))
      setCaption('Too quiet. Try again closer to the microphone.')
      setBusy(null)
      return
    }
    const result = showResult(samples)
    setStage(5)
    const correct = !result.unknown && result.top.id === target.id
    playSfx(correct ? 'correct' : 'incorrect')
    setChallenge((c) => ({ ...c, phase: 'result', score: c.score + (correct ? 1 : 0), result: { ...result, target, correct, clipping: check.status === 'loud' } }))
    setBusy(null)
  }

  const nextRound = () => {
    if (challenge.round + 1 >= TOTAL_ROUNDS) {
      onScore?.(challenge.score, TOTAL_ROUNDS)
      setChallenge((c) => ({ ...c, phase: 'done' }))
      return
    }
    setChallenge((c) => ({ ...c, round: c.round + 1, phase: 'idle', result: null }))
    setPrediction(null)
    setStage(-1)
    unfreeze()
  }

  const backToFreePlay = () => {
    runRef.current += 1
    setView('freeplay')
    setChallenge(null)
    setBusy(null)
    setPrediction(null)
    unfreeze()
  }

  const retryMic = () => chooseMic()
  const ready = !!classifier
  const counts = Object.fromEntries(SOUND_CLASSES.map((c) => [c.id, examples[c.id]?.length ?? 0]))
  const allRecorded = SOUND_CLASSES.every((c) => counts[c.id] >= EXAMPLES_PER_CLASS)
  const trainedKind = classifier?.kind
  const badge = ready
    ? { kind: 'live', title: 'LIVE AI MODEL', detail: `TensorFlow.js Audio Classification (${trainedKind === 'pretrained' ? 'custom model from public/models' : source === 'mic' ? 'trained in this browser from your examples' : 'trained in this browser on generated sample sounds'})` }
    : { kind: 'demo', title: 'AUDIO SIGNAL DEMO', detail: 'This is not a trained AI classifier.' }

  const stages = [
    { label: 'MICROPHONE', detail: source === 'sample' ? 'Generated sample sound' : 'Live microphone audio', value: quality ? quality.label : '' },
    { label: 'WAVEFORM', detail: 'Air pressure over time', value: quality ? `peak ${quality.peak.toFixed(2)}, level ${quality.rms.toFixed(3)}` : '' },
    { label: 'SPECTROGRAM', detail: 'Which frequencies over time', value: '' },
    { label: 'AUDIO MODEL', detail: ready ? 'TensorFlow.js dense network' : 'No model yet', value: '' },
    { label: 'PROBABILITIES', detail: 'One score per sound', value: prediction ? `${(prediction.top.probability * 100).toFixed(0)}% top` : '' },
    { label: 'PREDICTION', detail: 'Strongest match', value: prediction ? (prediction.unknown ? 'UNKNOWN' : prediction.top.label.toUpperCase()) : '' },
  ]

  const target = challenge?.targets?.[challenge.round]
  const qualityColour = quality?.status === 'good' ? 'text-georgian-green' : 'text-georgian-yellow'

  return (
    <div className="space-y-8">
      <GameHeader game={game} onBack={onBack} badge={badge} />

      {!source && (
        <PrivacyGate
          device="microphone"
          message="Audio is processed live in your browser and is not saved or uploaded. The microphone and audio system are switched off when you leave this game."
          buttonLabel="USE MICROPHONE"
          onContinue={chooseMic}
          secondary={<button type="button" className="btn btn-blue" onClick={chooseSample}><Volume2 aria-hidden="true" size={22} /> SAMPLE SOUND MODE</button>}
        />
      )}

      {source === 'mic' && mic.status === 'error' && (
        <ErrorPanel what={mic.error.what} fix={mic.error.fix} onRetry={retryMic} onBack={onBack} />
      )}
      {source === 'mic' && mic.status === 'error' && (
        <p className="text-center"><button type="button" className="btn btn-blue" onClick={chooseSample}>USE SAMPLE SOUND MODE</button></p>
      )}

      {source && (source === 'sample' || micActive) && !ready && (
        <section className="arcade-card p-6 sm:p-8">
          <h2 className="text-2xl font-black">GUIDED TRAINING MODE</h2>
          <p className="mt-2 text-lg">
            {modelNote ? <>{modelNote} </> : null}
            The AI needs a sound classifier. {source === 'mic'
              ? `Record about ${EXAMPLES_PER_CLASS} short examples of each sound, then train a small TensorFlow.js model right here in your browser.`
              : 'In Sample Sound Mode a small TensorFlow.js model is trained in your browser on sounds generated by the app.'}
          </p>
          {source === 'mic' ? (
            <ul className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {SOUND_CLASSES.map((c) => (
                <li key={c.id} className="rounded-2xl bg-black/30 p-4">
                  <p className="text-xl font-black"><span aria-hidden="true">{c.emoji}</span> {c.label}: {counts[c.id]}/{EXAMPLES_PER_CLASS}</p>
                  <p className="text-sm text-georgian-neutral">{c.instruction}</p>
                  <button type="button" className="btn btn-blue mt-2" disabled={!!busy || counts[c.id] >= EXAMPLES_PER_CLASS} onClick={() => recordExamples(c.id, EXAMPLES_PER_CLASS - counts[c.id])}>
                    <Mic aria-hidden="true" size={20} /> RECORD {EXAMPLES_PER_CLASS - counts[c.id] > 0 ? EXAMPLES_PER_CLASS - counts[c.id] : ''}
                  </button>
                </li>
              ))}
            </ul>
          ) : null}
          <div className="mt-4 flex flex-wrap gap-3">
            <button type="button" className="btn btn-primary" disabled={!!busy || (source === 'mic' && !allRecorded)} onClick={() => (source === 'mic' ? trainModel(examples) : trainOnSamples())}>
              {source === 'mic' ? 'TRAIN THE AI' : 'TRAIN ON SAMPLE SOUNDS'}
            </button>
            <button type="button" className="btn btn-ghost" onClick={resetTraining}>RESET TRAINING</button>
          </div>
          {trainProgress && (
            <p className="mt-3 font-mono" role="status">Training epoch {trainProgress.epoch}/{trainProgress.epochs}{trainProgress.loss != null ? `, loss ${trainProgress.loss.toFixed(3)}, accuracy ${Math.round((trainProgress.accuracy ?? 0) * 100)}%` : ''}</p>
          )}
          {trainMessage && <p role="alert" className="mt-3 font-bold text-georgian-orange">{trainMessage}</p>}
        </section>
      )}

      {source && (source === 'sample' || micActive) && (
        <section className="arcade-card p-6 sm:p-8" aria-live="polite">
          {view === 'freeplay' && ready && (
            <>
              <h2 className="text-2xl font-black">TRY A SOUND</h2>
              {source === 'mic' ? (
                <p className="mt-2 text-lg">Make a sound near the microphone. The AI listens continuously.</p>
              ) : (
                <div className="mt-3 flex flex-wrap gap-3">
                  {SOUND_CLASSES.map((c) => <button key={c.id} type="button" className="btn btn-blue" disabled={!!busy} onClick={() => playSampleOf(c.id)}>{c.emoji} PLAY {c.label.toUpperCase()}</button>)}
                </div>
              )}
              <div className="mt-4 flex flex-wrap gap-3">
                <button type="button" className="btn btn-primary" onClick={startChallenge} disabled={!!busy}>START CHALLENGE</button>
                {trainedKind !== 'pretrained' && <button type="button" className="btn btn-ghost" onClick={resetTraining}>RESET TRAINING</button>}
              </div>
            </>
          )}

          {view === 'challenge' && challenge && challenge.phase !== 'done' && target && (
            <div className="text-center">
              <p className="text-lg font-black">Round {challenge.round + 1} / {TOTAL_ROUNDS} &nbsp; <span className="text-georgian-yellow">Score: {challenge.score}</span></p>
              <p className="mt-2 text-sm font-black tracking-widest text-georgian-light-blue">{source === 'mic' ? 'MAKE THIS SOUND' : 'THE APP WILL PLAY THIS SOUND'}</p>
              <p className="text-6xl font-black"><span aria-hidden="true">{target.emoji}</span> {target.label.toUpperCase()}</p>
              {challenge.phase === 'idle' && <button type="button" className="btn btn-primary mt-4" onClick={runRound}>{source === 'mic' ? 'START LISTENING' : 'PLAY SAMPLE'}</button>}
              {challenge.phase === 'countdown' && <p className="mt-4 text-8xl font-black text-georgian-yellow">{challenge.count}</p>}
              {challenge.phase === 'listening' && <p className="mt-4 text-4xl font-black">{source === 'mic' ? 'LISTENING...' : 'PLAYING SAMPLE...'}</p>}
              {challenge.phase === 'thinking' && <p className="mt-4 text-4xl font-black">AI THINKS...</p>}
              {challenge.phase === 'result' && challenge.result?.tooQuiet && (
                <div className="mt-4"><p className="text-2xl font-black text-georgian-orange">Too quiet to analyse.</p><button type="button" className="btn btn-primary mt-3" onClick={runRound}>TRY AGAIN</button></div>
              )}
              {challenge.phase === 'result' && !challenge.result?.tooQuiet && (
                <div className="mt-4">
                  <p className="text-3xl font-black">AI THINKS: {challenge.result.unknown ? '❓ UNKNOWN' : `${challenge.result.top.emoji} ${challenge.result.top.label.toUpperCase()}`}</p>
                  <p className="text-xl">Confidence: {(challenge.result.top.probability * 100).toFixed(0)}%{challenge.result.unknown ? ` (below ${CONFIDENCE_THRESHOLD * 100}%, so Unknown)` : ''}</p>
                  {challenge.result.clipping && <p className="text-georgian-yellow">Your sound was clipping (too loud), which can confuse the AI.</p>}
                  <p className={`mt-2 text-3xl font-black ${challenge.result.correct ? 'text-georgian-green' : 'text-georgian-orange'}`}>{challenge.result.correct ? '✓ CORRECT!' : '✗ NOT THIS TIME'}</p>
                  <button type="button" className="btn btn-primary mt-3" onClick={nextRound}>{challenge.round + 1 >= TOTAL_ROUNDS ? 'SEE RESULTS' : 'NEXT ROUND'}</button>
                </div>
              )}
            </div>
          )}
          {view === 'challenge' && challenge?.phase === 'done' && (
            <GameComplete title="SOUND CHALLENGE COMPLETE" score={challenge.score} outOf={TOTAL_ROUNDS} onPlayAgain={startChallenge} onBack={onBack}>
              <button type="button" className="btn btn-ghost" onClick={backToFreePlay}>TRY SOUNDS FREELY</button>
            </GameComplete>
          )}
          {!ready && <p className="text-lg text-georgian-neutral">Waveform and spectrogram below are real audio data. No predictions are made until a model is ready.</p>}
        </section>
      )}

      <BehindTheScenes
        summary="The microphone signal becomes a waveform, then a spectrogram (frequencies over time). A trained model compares that picture with patterns it learned."
        stages={stages}
        activeIndex={stage >= 0 ? stage : micActive ? 0 : -1}
        live={[
          { label: 'Input level', value: quality ? quality.rms.toFixed(3) : '—' },
          { label: 'Peak', value: quality ? quality.peak.toFixed(2) : '—' },
          { label: 'Signal quality', value: quality ? quality.label : '—' },
        ]}
        details={{
          input: source === 'sample' ? 'Short sounds generated by this app and played through the speaker.' : 'Short snippets of live microphone audio, kept only in memory.',
          processing: 'A Fast Fourier Transform turns sound into a spectrogram. It is pooled into a 16×32 grid of numbers for the model.',
          model: ready ? 'A small TensorFlow.js neural network (dense layers) that outputs a probability for each sound class.' : 'None yet. Either place a custom model in public/models/sound-detective/ or use Guided Training Mode.',
          decision: `The class with the highest probability wins. Below ${CONFIDENCE_THRESHOLD * 100}% confidence the answer is Unknown.`,
          confidence: 'The softmax probabilities from the model output. They are real model outputs, not random numbers.',
          failure: 'Background noise, clipping, very quiet sounds, a different microphone than in training, or sounds the model was never taught.',
        }}
      >
        <div className="space-y-4">
          <p role="status" aria-live="polite" className="rounded-2xl bg-black/30 p-3 text-lg font-bold">{caption}</p>
          {quality && <p className={`font-bold ${qualityColour}`}>Signal quality: {quality.label}{quality.status === 'good' ? ' ✓' : ' ⚠'}</p>}
          <div>
            <h3 className="text-sm font-black tracking-widest text-georgian-neutral">MICROPHONE HEARS: AMPLITUDE OVER TIME</h3>
            <canvas ref={waveRef} width={CANVAS_W} height={CANVAS_H} role="img" aria-label="Waveform: amplitude over time" className="w-full rounded-xl" />
          </div>
          <div>
            <h3 className="text-sm font-black tracking-widest text-georgian-neutral">AI SEES: SPECTROGRAM (↑ FREQUENCY, → TIME)</h3>
            <canvas ref={specRef} width={CANVAS_W} height={CANVAS_H} role="img" aria-label="Spectrogram: frequency over time" className="w-full rounded-xl" />
          </div>
          <div>
            <h3 className="mb-2 text-sm font-black tracking-widest text-georgian-neutral">AI PREDICTS</h3>
            {prediction ? (
              <ConfidenceBars items={prediction.preds} highlightId={prediction.unknown ? null : prediction.top.id} />
            ) : (
              <p className="text-georgian-neutral">{ready ? 'Waiting for a sound...' : 'No model is loaded, so there are no predictions.'}</p>
            )}
          </div>
        </div>
      </BehindTheScenes>
    </div>
  )
}
