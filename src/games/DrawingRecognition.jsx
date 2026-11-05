import { useEffect, useRef, useState } from 'react'
import GameHeader from '../components/GameHeader.jsx'
import BehindTheScenes from '../components/BehindTheScenes.jsx'
import ConfidenceBars from '../components/ConfidenceBars.jsx'
import { DRAWING_PROMPTS } from '../data/drawingPrompts.js'
import {
  DRAWING_INPUT_SIZES, DRAWING_MODEL_DOWNLOADS, QUICKDRAW_BITMAP_URL, QUICKDRAW_DATASET_URL,
  createDemoClassifier, isCanvasEmpty, loadDrawingClassifier, preprocessDrawing,
} from '../ai/drawingClassifier.js'
import { playSfx } from '../utils/sfx.js'

const CANVAS_SIZE = 480

export default function DrawingRecognition({ game, onBack }) {
  const canvasRef = useRef(null)
  const previewRef = useRef(null)
  const drawing = useRef(false)
  const last = useRef(null)
  const classifierRef = useRef(null)
  const [promptIndex, setPromptIndex] = useState(0)
  const [retryCount, setRetryCount] = useState(0)
  const [demoMode, setDemoMode] = useState(true)
  const [inputSize, setInputSize] = useState(28)
  const [loaded, setLoaded] = useState(null)
  const [results, setResults] = useState(null)
  const [message, setMessage] = useState('')
  const [stage, setStage] = useState(-1)
  const [canvasSupported, setCanvasSupported] = useState(true)

  const prompt = DRAWING_PROMPTS[promptIndex]

  useEffect(() => {
    const ctx = canvasRef.current?.getContext('2d')
    if (!ctx) {
      setCanvasSupported(false)
      return undefined
    }
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'
    ctx.lineWidth = 14
    ctx.strokeStyle = '#000000'
    return undefined
  }, [])

  const modelKey = `${inputSize}`
  useEffect(() => {
    if (demoMode) return undefined
    let cancelled = false
    let active = null
    loadDrawingClassifier(inputSize).then(({ classifier, source }) => {
      if (cancelled) {
        classifier.dispose?.()
        return
      }
      active = classifier
      classifierRef.current = classifier
      setLoaded({ key: modelKey, source, error: '' })
    }).catch((error) => {
      if (!cancelled) setLoaded({ key: modelKey, source: '', error: error.message })
    })
    return () => {
      cancelled = true
      active?.dispose?.()
      if (classifierRef.current === active) classifierRef.current = null
    }
  }, [demoMode, inputSize, modelKey, retryCount])

  const resetOutput = () => {
    setResults(null)
    setStage(-1)
    setMessage('')
  }
  const changeDemoMode = (value) => {
    setDemoMode(value)
    resetOutput()
  }
  const changeInputSize = (value) => {
    setInputSize(value)
    resetOutput()
  }
  const hasCurrent = loaded?.key === modelKey
  const classifierMode = demoMode ? 'demo' : !hasCurrent ? 'loading' : loaded.error ? 'error' : 'model'
  const modelSource = hasCurrent ? loaded.source : ''
  const loadError = hasCurrent ? loaded.error : ''

  const pointFor = (event) => {
    const rect = canvasRef.current.getBoundingClientRect()
    return { x: ((event.clientX - rect.left) / rect.width) * CANVAS_SIZE, y: ((event.clientY - rect.top) / rect.height) * CANVAS_SIZE }
  }

  const onDown = (event) => {
    event.currentTarget.setPointerCapture?.(event.pointerId)
    drawing.current = true
    last.current = pointFor(event)
    const ctx = canvasRef.current.getContext('2d')
    ctx.beginPath()
    ctx.arc(last.current.x, last.current.y, 7, 0, Math.PI * 2)
    ctx.fillStyle = '#000'
    ctx.fill()
    setMessage('')
  }
  const onMove = (event) => {
    if (!drawing.current) return
    const ctx = canvasRef.current.getContext('2d')
    const point = pointFor(event)
    ctx.beginPath()
    ctx.moveTo(last.current.x, last.current.y)
    ctx.lineTo(point.x, point.y)
    ctx.stroke()
    last.current = point
  }
  const onUp = () => {
    drawing.current = false
  }

  const clear = () => {
    const ctx = canvasRef.current.getContext('2d')
    ctx.clearRect(0, 0, CANVAS_SIZE, CANVAS_SIZE)
    setResults(null)
    setStage(-1)
    setMessage('')
  }

  const nextObject = () => {
    clear()
    setPromptIndex((i) => (i + 1) % DRAWING_PROMPTS.length)
    playSfx('button')
  }

  const recognize = () => {
    const canvas = canvasRef.current
    if (isCanvasEmpty(canvas)) {
      setMessage('The canvas is empty. Draw something first, then press Recognize.')
      return
    }
    const classifier = demoMode ? createDemoClassifier() : classifierRef.current
    if (!classifier) {
      setMessage('No model is loaded, so there is nothing to recognize with. Turn demo mode on or install a model (see below).')
      return
    }
    const { pixels, preview } = preprocessDrawing(canvas, inputSize)
    const previewCtx = previewRef.current?.getContext('2d')
    if (previewCtx) {
      previewCtx.imageSmoothingEnabled = false
      previewCtx.clearRect(0, 0, 112, 112)
      previewCtx.drawImage(preview, 0, 0, 112, 112)
    }
    setStage(0)
    ;[1, 2, 3].forEach((s) => setTimeout(() => setStage(s), s * 250))
    setTimeout(() => {
      const predictions = classifier.classify(pixels)
      setResults({ predictions: predictions.slice(0, 5), inkPixels: pixels.filter((p) => p > 0.1).length, mode: classifier.mode })
      setStage(5)
      playSfx(predictions[0].id === prompt.id ? 'correct' : 'button')
    }, 900)
  }

  const demo = demoMode
  const sizeLabel = `${inputSize}×${inputSize}`
  const download = DRAWING_MODEL_DOWNLOADS[inputSize]
  const top = results?.predictions[0]
  const stages = [
    { label: 'DRAWING', detail: 'Your strokes on the canvas', value: results ? `${CANVAS_SIZE}×${CANVAS_SIZE} px` : '' },
    { label: 'RESIZE', detail: 'Shrunk to the model input size', value: results ? `${sizeLabel} px` : '' },
    { label: 'NORMALIZE', detail: 'Pixels become numbers 0 (blank) to 1 (ink)', value: results ? `${results.inkPixels} ink pixels` : '' },
    { label: 'IMAGE MODEL', detail: demo ? 'DEMO: simulated, no trained model' : classifierMode === 'model' ? 'TensorFlow.js image classifier' : 'No model loaded', value: '' },
    { label: 'PROBABILITIES', detail: 'One score per object', value: top ? `${Math.round(top.probability * 100)}% top` : '' },
    { label: 'PREDICTION', detail: 'Highest probability', value: top ? top.label : '' },
  ]

  if (!canvasSupported) {
    return (
      <div className="space-y-8">
        <GameHeader game={game} onBack={onBack} />
        <p role="alert" className="arcade-card p-8 text-xl">What happened: this browser does not support the drawing canvas. How to fix it: use a recent browser, then return to the Arcade and try again.</p>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <GameHeader
        game={game}
        onBack={onBack}
        badge={demo ? { kind: 'demo', title: 'DEMO MODE', detail: 'Recognition is simulated.' } : classifierMode === 'model' ? { kind: 'live', title: 'LIVE AI MODEL', detail: 'TensorFlow.js image classifier' } : { kind: 'demo', title: 'NO MODEL LOADED', detail: 'Nothing is being simulated.' }}
      />
      <section className="arcade-card flex flex-wrap items-center gap-4 p-4" aria-label="Recognition settings">
        <button
          type="button"
          role="switch"
          aria-checked={demoMode}
          className={`btn ${demoMode ? 'btn-primary' : 'btn-ghost'}`}
          onClick={() => changeDemoMode(!demoMode)}
        >
          DEMO MODE: {demoMode ? 'ON' : 'OFF'}
        </button>
        <label className="flex items-center gap-2 text-lg font-bold">
          Model input size
          <select
            className="min-h-12 rounded-xl bg-white px-3 text-lg font-bold text-georgian-dark-grey"
            value={inputSize}
            onChange={(event) => changeInputSize(Number(event.target.value))}
          >
            {DRAWING_INPUT_SIZES.map((size) => <option key={size} value={size}>{size}×{size}</option>)}
          </select>
        </label>
        {classifierMode === 'loading' && <p role="status" className="font-bold">Loading model…</p>}
        {classifierMode === 'model' && <p role="status" className="font-bold text-georgian-light-blue">Model loaded ({modelSource}).</p>}
      </section>
      {demo && (
        <p className="arcade-card border-georgian-yellow p-4 text-lg" role="note">
          <strong>DEMO MODE: Recognition is simulated.</strong> Predictions below come from a placeholder, not real AI. The preprocessing steps shown are real. Turn demo mode off to use a real TensorFlow.js model.
        </p>
      )}
      {classifierMode === 'error' && (
        <div role="alert" className="arcade-card border-georgian-orange p-4 text-lg space-y-2">
          <p><strong>What happened:</strong> demo mode is off but no {sizeLabel} drawing model could be loaded. Nothing is being simulated.</p>
          <p><strong>How to fix it:</strong> download a Quick, Draw! TensorFlow.js model (<code>model.json</code>, <code>*.bin</code> files and a <code>metadata.json</code> like <code>{`{"classes":["cat","car",...]}`}</code>) and put it in <code>{download.localPath}</code>, or set <code>{download.remoteEnv}</code> to a hosted <code>model.json</code> URL and rebuild.</p>
          <p>
            Downloads:{' '}
            <a className="underline" href={QUICKDRAW_DATASET_URL} target="_blank" rel="noreferrer">Google Quick, Draw! dataset and tools</a>{' · '}
            <a className="underline" href={QUICKDRAW_BITMAP_URL} target="_blank" rel="noreferrer">28×28 bitmap training data</a>
          </p>
          <p className="text-sm text-georgian-neutral">{loadError}</p>
          <button type="button" className="btn btn-primary" onClick={() => { setLoaded(null); setRetryCount((n) => n + 1) }}>RETRY</button>
          <button type="button" className="btn btn-ghost" onClick={() => changeDemoMode(true)}>USE DEMO MODE</button>
        </div>
      )}
      <div className="grid gap-6 lg:grid-cols-[1fr_380px]">
        <section className="arcade-card p-6">
          <p className="text-2xl font-black">Draw a <span className="text-georgian-yellow">{prompt.emoji} {prompt.label.toUpperCase()}</span></p>
          <canvas
            ref={canvasRef}
            width={CANVAS_SIZE}
            height={CANVAS_SIZE}
            aria-label={`Drawing canvas. Draw a ${prompt.label} using mouse, touch or stylus.`}
            className="mt-4 aspect-square w-full max-w-lg cursor-crosshair rounded-2xl bg-white"
            onPointerDown={onDown}
            onPointerMove={onMove}
            onPointerUp={onUp}
            onPointerLeave={onUp}
            onPointerCancel={onUp}
          />
          <div className="mt-4 flex flex-wrap gap-3">
            <button type="button" className="btn btn-primary" onClick={recognize} disabled={classifierMode === 'loading' || classifierMode === 'error'}>RECOGNIZE</button>
            <button type="button" className="btn btn-ghost" onClick={clear}>CLEAR</button>
            <button type="button" className="btn btn-blue" onClick={nextObject}>NEXT OBJECT</button>
          </div>
          {message && <p role="alert" className="mt-3 font-bold text-georgian-orange">{message}</p>}
        </section>
        <section className="arcade-card p-6" aria-live="polite">
          <h2 className="text-xl font-black">{demo ? 'SIMULATED PREDICTIONS' : 'TOP PREDICTIONS'}</h2>
          <canvas ref={previewRef} width={112} height={112} aria-label={`${inputSize} by ${inputSize} pixel version of your drawing`} className="mt-3 rounded-lg bg-white" />
          <p className="mb-4 text-sm text-georgian-neutral">What the model receives ({sizeLabel})</p>
          {results ? (
            <ConfidenceBars items={results.predictions} highlightId={top.id} />
          ) : (
            <p className="text-lg text-georgian-neutral">Draw, then press RECOGNIZE.</p>
          )}
          {results && demo && <p className="mt-3 font-bold text-georgian-yellow">DEMO MODE: these numbers are simulated.</p>}
        </section>
      </div>
      <BehindTheScenes
        summary={`Your drawing is shrunk to ${sizeLabel} pixels and turned into numbers. An image model would turn those numbers into one probability per object.`}
        stages={stages}
        activeIndex={stage}
        live={[{ label: 'Mode', value: demo ? 'DEMO' : classifierMode === 'model' ? 'LIVE MODEL' : 'NO MODEL' }, { label: 'Input size', value: sizeLabel }, { label: 'Ink pixels', value: results ? results.inkPixels : '—' }]}
        details={{
          input: 'The pixels you drew on the canvas (mouse, touch or stylus).',
          processing: `Resize to ${sizeLabel}, convert to greyscale values from 0 to 1.`,
          model: demo ? 'None. Predictions are simulated placeholders so the layout can be shown. Turn demo mode off to use a real TensorFlow.js model (see README).' : `A TensorFlow.js image classification model loaded from ${modelSource || 'a local or remote'} source (${download.localPath}).`,
          decision: 'The object with the highest probability is the prediction.',
          confidence: demo ? 'Simulated. Do not treat as real.' : 'Probabilities from the model output.',
          failure: 'Unusual drawing styles, tiny drawings, or objects the model was never trained on.',
        }}
      />
    </div>
  )
}
