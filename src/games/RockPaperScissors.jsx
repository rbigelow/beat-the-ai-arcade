import { useCallback, useEffect, useRef, useState } from 'react'
import { Camera, CameraOff } from 'lucide-react'
import GameHeader from '../components/GameHeader.jsx'
import BehindTheScenes from '../components/BehindTheScenes.jsx'
import ErrorPanel from '../components/ErrorPanel.jsx'
import PrivacyGate from '../components/PrivacyGate.jsx'
import { playSfx } from '../utils/sfx.js'

const BASE = import.meta.env.BASE_URL
const REMOTE_MODEL = 'https://storage.googleapis.com/mediapipe-models/gesture_recognizer/gesture_recognizer/float16/1/gesture_recognizer.task'
const MOVES = {
  rock: { label: 'ROCK', emoji: '✊', beats: 'scissors' },
  paper: { label: 'PAPER', emoji: '✋', beats: 'rock' },
  scissors: { label: 'SCISSORS', emoji: '✌️', beats: 'paper' },
}
const GESTURE_TO_MOVE = { Closed_Fist: 'rock', Open_Palm: 'paper', Victory: 'scissors' }
const MIN_CONFIDENCE = 0.6
const COUNTDOWN = ['3', '2', '1', 'GO!']

async function localModelAvailable() {
  try {
    const response = await fetch(`${BASE}models/gesture_recognizer.task`, { method: 'HEAD' })
    return response.ok && !(response.headers.get('content-type') ?? '').includes('text/html')
  } catch {
    return false
  }
}

async function createRecognizer() {
  const { FilesetResolver, GestureRecognizer } = await import('@mediapipe/tasks-vision')
  const fileset = await FilesetResolver.forVisionTasks(`${BASE}mediapipe/wasm`)
  const modelAssetPath = (await localModelAvailable()) ? `${BASE}models/gesture_recognizer.task` : REMOTE_MODEL
  const options = (delegate) => ({ baseOptions: { modelAssetPath, delegate }, runningMode: 'VIDEO', numHands: 1 })
  try {
    return await GestureRecognizer.createFromOptions(fileset, options('GPU'))
  } catch {
    return GestureRecognizer.createFromOptions(fileset, options('CPU'))
  }
}

export default function RockPaperScissors({ game, onBack }) {
  const [phase, setPhase] = useState('intro') // intro | loading | ready | countdown | result | error
  const [error, setError] = useState(null)
  const [live, setLive] = useState({ gesture: null, move: null, confidence: 0, hands: 0 })
  const [countdown, setCountdown] = useState(null)
  const [round, setRound] = useState(null)
  const [score, setScore] = useState({ you: 0, ai: 0, ties: 0 })

  const videoRef = useRef(null)
  const canvasRef = useRef(null)
  const streamRef = useRef(null)
  const recognizerRef = useRef(null)
  const frameRef = useRef(0)
  const liveRef = useRef(live)
  const timers = useRef([])
  const lastVideoTime = useRef(-1)

  const stopCamera = useCallback(() => {
    cancelAnimationFrame(frameRef.current)
    timers.current.forEach(clearTimeout)
    timers.current = []
    streamRef.current?.getTracks().forEach((track) => track.stop())
    streamRef.current = null
    if (videoRef.current) videoRef.current.srcObject = null
    recognizerRef.current?.close()
    recognizerRef.current = null
  }, [])

  useEffect(() => stopCamera, [stopCamera])

  const drawLandmarks = (landmarks, connections) => {
    const canvas = canvasRef.current
    const video = videoRef.current
    if (!canvas || !video) return
    canvas.width = video.videoWidth
    canvas.height = video.videoHeight
    const ctx = canvas.getContext('2d')
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    if (!landmarks) return
    ctx.lineWidth = 3
    ctx.strokeStyle = '#77c5d5'
    connections.forEach(({ start, end }) => {
      ctx.beginPath()
      ctx.moveTo(landmarks[start].x * canvas.width, landmarks[start].y * canvas.height)
      ctx.lineTo(landmarks[end].x * canvas.width, landmarks[end].y * canvas.height)
      ctx.stroke()
    })
    ctx.fillStyle = '#f3d03e'
    landmarks.forEach((p) => {
      ctx.beginPath()
      ctx.arc(p.x * canvas.width, p.y * canvas.height, 4, 0, Math.PI * 2)
      ctx.fill()
    })
  }

  const detectLoop = useCallback((connections) => {
    const tick = () => {
      const video = videoRef.current
      const recognizer = recognizerRef.current
      if (!video || !recognizer) return
      if (video.readyState >= 2 && video.currentTime !== lastVideoTime.current) {
        lastVideoTime.current = video.currentTime
        try {
          const result = recognizer.recognizeForVideo(video, performance.now())
          const top = result.gestures?.[0]?.[0]
          const next = {
            gesture: top?.categoryName ?? null,
            move: top ? GESTURE_TO_MOVE[top.categoryName] ?? null : null,
            confidence: top?.score ?? 0,
            hands: result.landmarks?.length ?? 0,
          }
          liveRef.current = next
          setLive(next)
          drawLandmarks(result.landmarks?.[0], connections)
        } catch {
          // skip a bad frame
        }
      }
      frameRef.current = requestAnimationFrame(tick)
    }
    tick()
  }, [])

  const startCamera = async () => {
    setError(null)
    setPhase('loading')
    if (!navigator.mediaDevices?.getUserMedia) {
      setError({ what: 'This browser cannot access a camera.', fix: 'Use a recent Chrome, Edge, Firefox or Safari on https:// or localhost.' })
      setPhase('error')
      return
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user', width: 640, height: 480 }, audio: false })
      streamRef.current = stream
      videoRef.current.srcObject = stream
      await videoRef.current.play()
    } catch (err) {
      stopCamera()
      const denied = err?.name === 'NotAllowedError' || err?.name === 'SecurityError'
      setError({
        what: denied ? 'Camera permission was denied.' : 'No camera could be opened.',
        fix: denied ? 'Allow camera access in the browser address bar, then press Retry.' : 'Connect a camera, close other apps using it, then press Retry.',
      })
      setPhase('error')
      return
    }
    try {
      recognizerRef.current = await createRecognizer()
    } catch {
      stopCamera()
      setError({
        what: 'The MediaPipe gesture model could not be loaded.',
        fix: 'Check your connection, or save gesture_recognizer.task in public/models/ (see README) and press Retry.',
      })
      setPhase('error')
      return
    }
    const { GestureRecognizer } = await import('@mediapipe/tasks-vision')
    lastVideoTime.current = -1
    setPhase('ready')
    detectLoop(GestureRecognizer.HAND_CONNECTIONS)
  }

  const stopAndReset = () => {
    stopCamera()
    drawLandmarks(null)
    setLive({ gesture: null, move: null, confidence: 0, hands: 0 })
    setCountdown(null)
    setRound(null)
    setPhase('intro')
  }

  const startRound = () => {
    setRound(null)
    setPhase('countdown')
    COUNTDOWN.forEach((value, i) => {
      timers.current.push(setTimeout(() => {
        setCountdown(value)
        playSfx('countdown')
      }, i * 900))
    })
    timers.current.push(setTimeout(() => {
      const seen = liveRef.current
      setCountdown(null)
      if (!seen.move || seen.confidence < MIN_CONFIDENCE) {
        setRound({ unclear: true, seen })
        setPhase('result')
        return
      }
      const keys = Object.keys(MOVES)
      const aiMove = keys[Math.floor(Math.random() * keys.length)]
      const outcome = aiMove === seen.move ? 'tie' : MOVES[seen.move].beats === aiMove ? 'you' : 'ai'
      setScore((s) => ({ ...s, [outcome === 'tie' ? 'ties' : outcome]: s[outcome === 'tie' ? 'ties' : outcome] + 1 }))
      playSfx(outcome === 'you' ? 'correct' : outcome === 'ai' ? 'incorrect' : 'button')
      setRound({ you: seen.move, ai: aiMove, outcome, confidence: seen.confidence })
      setPhase('result')
    }, COUNTDOWN.length * 900 + 600))
  }

  const cameraOn = phase === 'ready' || phase === 'countdown' || phase === 'result'
  const moveInfo = live.move ? MOVES[live.move] : null
  const stages = [
    { label: 'WEBCAM', detail: 'Video frames, processed live', value: cameraOn ? 'Camera on' : 'Camera off' },
    { label: 'HAND DETECTION', detail: 'Finds a hand in the frame', value: cameraOn ? `${live.hands} hand(s)` : '' },
    { label: 'LANDMARKS', detail: '21 key points on the hand', value: live.hands ? '21 points' : '' },
    { label: 'GESTURE MODEL', detail: 'MediaPipe gesture classifier', value: live.gesture ?? '' },
    { label: 'PROBABILITIES', detail: 'Confidence in the top gesture', value: live.gesture ? `${Math.round(live.confidence * 100)}%` : '' },
    { label: 'ROCK / PAPER / SCISSORS', detail: 'Closed fist, open palm, victory sign', value: moveInfo ? moveInfo.label : 'No valid gesture' },
  ]
  const activeIndex = !cameraOn ? -1 : !live.hands ? 0 : moveInfo ? 5 : live.gesture ? 3 : 1

  return (
    <div className="space-y-8">
      <GameHeader game={game} onBack={onBack} badge={{ kind: 'live', title: 'LIVE AI MODEL', detail: 'MediaPipe Gesture Recognition' }} />
      {phase === 'intro' && (
        <PrivacyGate
          device="camera"
          message="Camera frames are processed live and are not saved or uploaded. No faces are identified. The camera stops when you leave this game."
          buttonLabel="START CAMERA"
          onContinue={startCamera}
        />
      )}
      {phase === 'error' && <ErrorPanel what={error.what} fix={error.fix} onRetry={startCamera} onBack={onBack} />}
      {phase === 'loading' && <p role="status" className="py-8 text-center text-2xl font-bold">Starting camera and loading the AI model...</p>}

      <div className={cameraOn || phase === 'loading' ? 'grid gap-6 lg:grid-cols-2' : 'hidden'}>
        <section className="arcade-card p-4 sm:p-6">
          <div className="relative mx-auto aspect-[4/3] w-full max-w-xl overflow-hidden rounded-2xl bg-black">
            <video ref={videoRef} playsInline muted aria-label="Mirrored webcam preview" className="h-full w-full -scale-x-100 object-cover" />
            <canvas ref={canvasRef} aria-hidden="true" className="pointer-events-none absolute inset-0 h-full w-full -scale-x-100 object-cover" />
            {countdown && <p className="absolute inset-0 flex items-center justify-center bg-black/40 text-8xl font-black text-georgian-yellow" aria-live="assertive">{countdown}</p>}
          </div>
          <p className="mt-3 text-sm text-georgian-neutral">Camera frames are processed live and are not saved or uploaded.</p>
          <div className="mt-4 flex flex-wrap gap-3">
            <button type="button" className="btn btn-primary" disabled={phase === 'countdown' || phase === 'loading'} onClick={startRound}>
              <Camera aria-hidden="true" size={22} /> {phase === 'result' ? 'PLAY AGAIN' : 'START ROUND'}
            </button>
            <button type="button" className="btn btn-ghost" onClick={stopAndReset}><CameraOff aria-hidden="true" size={22} /> STOP CAMERA</button>
            <button type="button" className="btn btn-ghost" onClick={() => setScore({ you: 0, ai: 0, ties: 0 })}>RESET SCORE</button>
          </div>
        </section>
        <section className="arcade-card p-6 sm:p-8" aria-live="polite">
          <h2 className="text-sm font-black tracking-widest text-georgian-light-blue">AI SEES</h2>
          <p className="mt-2 text-5xl font-black">{moveInfo ? `${moveInfo.emoji} ${moveInfo.label}` : live.hands ? `${live.gesture ?? 'Unknown'} (not a game move)` : 'No hand'}</p>
          <p className="mt-2 text-xl">Confidence: {live.hands ? `${Math.round(live.confidence * 100)}%` : '—'}</p>
          <dl className="mt-6 grid grid-cols-3 gap-3 text-center">
            <div className="rounded-2xl bg-black/30 p-3"><dt className="text-xs font-bold tracking-widest">YOU</dt><dd className="text-3xl font-black text-georgian-yellow">{score.you}</dd></div>
            <div className="rounded-2xl bg-black/30 p-3"><dt className="text-xs font-bold tracking-widest">AI</dt><dd className="text-3xl font-black text-georgian-yellow">{score.ai}</dd></div>
            <div className="rounded-2xl bg-black/30 p-3"><dt className="text-xs font-bold tracking-widest">TIES</dt><dd className="text-3xl font-black text-georgian-yellow">{score.ties}</dd></div>
          </dl>
          {phase === 'result' && round && (
            <div className="mt-6 rounded-2xl bg-black/30 p-5">
              {round.unclear ? (
                <p className="text-xl font-bold text-georgian-orange">Gesture not clear enough ({Math.round(round.seen.confidence * 100)}% confidence). Show a closed fist, open palm or victory sign and try again.</p>
              ) : (
                <>
                  <p className="text-xl">You: {MOVES[round.you].emoji} {MOVES[round.you].label} ({Math.round(round.confidence * 100)}%) &nbsp; AI: {MOVES[round.ai].emoji} {MOVES[round.ai].label}</p>
                  <p className="mt-2 text-3xl font-black">{round.outcome === 'you' ? '🏆 YOU WIN!' : round.outcome === 'ai' ? '🤖 AI WINS' : '🤝 TIE'}</p>
                </>
              )}
            </div>
          )}
        </section>
      </div>

      <BehindTheScenes
        summary="The camera image goes to a hand-tracking model that finds 21 landmarks, then a gesture model labels the hand pose. The AI's own move is chosen randomly."
        stages={stages}
        activeIndex={activeIndex}
        live={[
          { label: 'Gesture', value: live.gesture ?? '—' },
          { label: 'Confidence', value: live.hands ? `${Math.round(live.confidence * 100)}%` : '—' },
          { label: 'Hands', value: live.hands },
        ]}
        details={{
          input: 'Live webcam video frames (never saved or uploaded).',
          processing: 'MediaPipe detects the hand, tracks 21 landmarks, and classifies the pose.',
          model: 'MediaPipe Tasks Vision GestureRecognizer, running in your browser.',
          decision: 'Closed_Fist = Rock, Open_Palm = Paper, Victory = Scissors. Other poses are ignored.',
          confidence: `The model's score for its top gesture. Rounds below ${Math.round(MIN_CONFIDENCE * 100)}% are not counted.`,
          failure: 'Poor lighting, a hand partly out of frame, or an unusual angle can confuse it. The computer picks its move randomly, so it is not reading your mind.',
        }}
      />
    </div>
  )
}
