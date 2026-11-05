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
  const [darkMode, setDarkMode] = useState(true)

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
    <div className={`min-h-screen ${darkMode ? 'bg-arcade-bg text-white' : 'bg-slate-100 text-slate-900'}`}>
      <style>{`
        [data-app-theme="light"] {
          --arcade-background: #f1f5f9;
          --arcade-card: #ffffff;
        }
        [data-app-theme="light"] [class~="text-white"],
        [data-app-theme="light"] [class~="text-gray-100"],
        [data-app-theme="light"] [class~="text-slate-100"],
        [data-app-theme="light"] p { color: #1e293b !important; }
        [data-app-theme="light"] span { color: #1e293b !important; }
        [data-app-theme="light"] dt { color: #1e293b !important; }
        [data-app-theme="light"] [class~="bg-arcade-bg"],
        [data-app-theme="light"] [class~="bg-slate-900"],
        [data-app-theme="light"] [class~="bg-slate-800"],
        [data-app-theme="light"] [class~="bg-gray-900"],
        [data-app-theme="light"] [class~="bg-gray-800"],
        [data-app-theme="light"] [class~="bg-black"] { background-color: #f1f5f9 !important; }
        [data-app-theme="light"] [class~="border-slate-700"],
        [data-app-theme="light"] [class~="border-gray-700"] { border-color: #cbd5e1 !important; }
        [data-app-theme="light"] .btn-ghost {
          color: #334155 !important;
          border-color: #cbd5e1 !important;
        }
        [data-app-theme="light"] .btn-ghost:hover { background-color: #e2e8f0 !important; }
      `}</style>
      <div data-app-theme={darkMode ? 'dark' : 'light'} className="min-h-screen">
      <button
        type="button"
        onClick={() => setDarkMode((enabled) => !enabled)}
        aria-label={`Switch to ${darkMode ? 'light' : 'dark'} mode`}
        aria-pressed={!darkMode}
        className="fixed right-4 top-4 z-50 rounded-lg border border-slate-500 bg-slate-800 px-4 py-2 text-sm font-semibold text-white shadow"
      >
        {darkMode ? 'Light mode' : 'Dark mode'}
      </button>
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
    </div>
  )
}
