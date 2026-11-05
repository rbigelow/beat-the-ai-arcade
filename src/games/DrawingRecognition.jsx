import { useEffect, useRef, useState } from 'react'
import GameHeader from '../components/GameHeader.jsx'
import BehindTheScenes from '../components/BehindTheScenes.jsx'
import ConfidenceBars from '../components/ConfidenceBars.jsx'
import { DRAWING_PROMPTS } from '../data/drawingPrompts.js'
import { createDemoClassifier, isCanvasEmpty, loadDrawingClassifier, preprocessDrawing } from '../ai/drawingClassifier.js'
import { playSfx } from '../utils/sfx.js'

const CANVAS_SIZE = 480

export default function DrawingRecognition({ game, onBack }) {
  const canvasRef = useRef(null)
  const previewRef = useRef(null)
  const drawing = useRef(false)
  const last = useRef(null)
  const classifierRef = useRef(null)
  const [promptIndex, setPromptIndex] = useState(0)
  const [classifierMode, setClassifierMode] = useState('loading')
  const [results, setResults] = useState(null)
  const [message, setMessage] = useState('')
  const [stage, setStage] = useState(-1)
  const [canvasSupported, setCanvasSupported] = useState(true)

  const prompt = DRAWING_PROMPTS[promptIndex]

  useEffect(() => {
    let cancelled = false
    const ctx = canvasRef.current?.getContext('2d')
    if (!ctx) {
      setCanvasSupported(false)
      return undefined
    }
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'
    ctx.lineWidth = 14
    ctx.strokeStyle = '#000000'
    loadDrawingClassifier().then((classifier) => {
      if (cancelled) {
        classifier.dispose?.()
        return
      }
      classifierRef.current = classifier
      setClassifierMode(classifier.mode)
    })
    return () => {
      cancelled = true
      classifierRef.current?.dispose?.()
    }
  }, [])

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
    const classifier = classifierRef.current ?? createDemoClassifier()
    const { pixels, preview } = preprocessDrawing(canvas)
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

  const demo = classifierMode !== 'model'
  const top = results?.predictions[0]
  const stages = [
    { label: 'DRAWING', detail: 'Your strokes on the canvas', value: results ? `${CANVAS_SIZE}×${CANVAS_SIZE} px` : '' },
    { label: 'RESIZE', detail: 'Shrunk to the model input size', value: results ? '28×28 px' : '' },
    { label: 'NORMALIZE', detail: 'Pixels become numbers 0 (blank) to 1 (ink)', value: results ? `${results.inkPixels} ink pixels` : '' },
    { label: 'IMAGE MODEL', detail: demo ? 'DEMO: simulated, no trained model' : 'TensorFlow.js image classifier', value: '' },
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
        badge={demo ? { kind: 'demo', title: 'DEMO MODE', detail: 'Recognition is simulated.' } : { kind: 'live', title: 'LIVE AI MODEL', detail: 'TensorFlow.js image classifier' }}
      />
      {demo && classifierMode !== 'loading' && (
        <p className="arcade-card border-georgian-yellow p-4 text-lg" role="note">
          <strong>DEMO MODE: Recognition is simulated.</strong> No trained drawing model was found in <code>public/models/drawing/</code>, so predictions below come from a placeholder, not real AI. The preprocessing steps shown are real.
        </p>
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
            <button type="button" className="btn btn-primary" onClick={recognize}>RECOGNIZE</button>
            <button type="button" className="btn btn-ghost" onClick={clear}>CLEAR</button>
            <button type="button" className="btn btn-blue" onClick={nextObject}>NEXT OBJECT</button>
          </div>
          {message && <p role="alert" className="mt-3 font-bold text-georgian-orange">{message}</p>}
        </section>
        <section className="arcade-card p-6" aria-live="polite">
          <h2 className="text-xl font-black">{demo ? 'SIMULATED PREDICTIONS' : 'TOP PREDICTIONS'}</h2>
          <canvas ref={previewRef} width={112} height={112} aria-label="28 by 28 pixel version of your drawing" className="mt-3 rounded-lg bg-white" />
          <p className="mb-4 text-sm text-georgian-neutral">What the model receives (28×28)</p>
          {results ? (
            <ConfidenceBars items={results.predictions} highlightId={top.id} />
          ) : (
            <p className="text-lg text-georgian-neutral">Draw, then press RECOGNIZE.</p>
          )}
          {results && demo && <p className="mt-3 font-bold text-georgian-yellow">DEMO MODE: these numbers are simulated.</p>}
        </section>
      </div>
      <BehindTheScenes
        summary="Your drawing is shrunk to 28×28 pixels and turned into numbers. An image model would turn those numbers into one probability per object."
        stages={stages}
        activeIndex={stage}
        live={[{ label: 'Mode', value: demo ? 'DEMO' : 'LIVE MODEL' }, { label: 'Input size', value: '28×28' }, { label: 'Ink pixels', value: results ? results.inkPixels : '—' }]}
        details={{
          input: 'The pixels you drew on the canvas (mouse, touch or stylus).',
          processing: 'Resize to 28×28, convert to greyscale values from 0 to 1.',
          model: demo ? 'None. Predictions are simulated placeholders so the layout can be shown. A TensorFlow.js model can replace them (see README).' : 'A TensorFlow.js image classification model loaded from public/models/drawing/.',
          decision: 'The object with the highest probability is the prediction.',
          confidence: demo ? 'Simulated. Do not treat as real.' : 'Probabilities from the model output.',
          failure: 'Unusual drawing styles, tiny drawings, or objects the model was never trained on.',
        }}
      />
    </div>
  )
}
