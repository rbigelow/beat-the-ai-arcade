import { Suspense, useCallback, useState } from 'react'
import ArcadeHome from './components/ArcadeHome.jsx'
import ErrorBoundary from './components/ErrorBoundary.jsx'
import IdleReset from './components/IdleReset.jsx'
import { GAMES } from './data/gameRegistry.js'
import { useIdleReset } from './hooks/useIdleReset.js'
import { closeSfx, setSfxEnabled } from './utils/sfx.js'

const EMPTY_STATS = { gamesPlayed: 0, best: null }
const IDLE_MS = 90_000
const WARN_SECONDS = 10

export default function App() {
  const [gameId, setGameId] = useState(null)
  const [runKey, setRunKey] = useState(0)
  const [stats, setStats] = useState(EMPTY_STATS)
  const [kioskMode, setKioskMode] = useState(true)
  const [soundOn, setSoundOn] = useState(false)

  const openGame = useCallback((id) => {
    setStats((s) => ({ ...s, gamesPlayed: s.gamesPlayed + 1 }))
    setRunKey((k) => k + 1)
    setGameId(id)
  }, [])

  // Unmounting the game runs its cleanup (camera, microphone, AudioContext, timers, animation frames).
  const goHome = useCallback(() => setGameId(null), [])

  const reportScore = useCallback((score, outOf) => {
    setStats((s) => (!s.best || score / outOf > s.best.score / s.best.outOf ? { ...s, best: { score, outOf } } : s))
  }, [])

  const resetEverything = useCallback(() => {
    setGameId(null)
    setRunKey((k) => k + 1)
    setStats(EMPTY_STATS)
    closeSfx()
  }, [])

  const toggleSound = () => {
    setSfxEnabled(!soundOn)
    setSoundOn(!soundOn)
  }

  const idle = useIdleReset({ enabled: kioskMode, idleMs: IDLE_MS, warnSeconds: WARN_SECONDS, onTimeout: resetEverything })
  const game = GAMES.find((g) => g.id === gameId)

  return (
    <div className="min-h-screen bg-arcade-bg text-white">
      {game ? (
        <div className="mx-auto max-w-7xl px-5 py-8 sm:px-8">
          <ErrorBoundary key={`${game.id}-${runKey}`} onBack={goHome}>
            <Suspense fallback={<p role="status" className="py-24 text-center text-2xl font-bold">Loading challenge...</p>}>
              <game.component game={game} onBack={goHome} onScore={reportScore} />
            </Suspense>
          </ErrorBoundary>
        </div>
      ) : (
        <ArcadeHome
          games={GAMES}
          onSelect={openGame}
          stats={stats}
          kioskMode={kioskMode}
          onToggleKiosk={() => setKioskMode((k) => !k)}
          soundOn={soundOn}
          onToggleSound={toggleSound}
        />
      )}
      {idle.warning && <IdleReset secondsLeft={idle.secondsLeft} onStay={idle.stay} />}
    </div>
  )
}
