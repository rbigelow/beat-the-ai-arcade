import { Volume2, VolumeX } from 'lucide-react'
import ArcadeHeader from './ArcadeHeader.jsx'
import GameCard from './GameCard.jsx'
import Footer from './Footer.jsx'

export default function ArcadeHome({ games, onSelect, stats, kioskMode, onToggleKiosk, soundOn, onToggleSound }) {
  return (
    <div className="mx-auto max-w-7xl px-5 py-8 sm:px-8">
      <ArcadeHeader>
        <button type="button" className="btn btn-ghost" aria-pressed={kioskMode} onClick={onToggleKiosk}>
          KIOSK MODE: {kioskMode ? 'ON' : 'OFF'}
        </button>
        <button type="button" className="btn btn-ghost" aria-pressed={soundOn} aria-label={soundOn ? 'Sound on. Press to mute' : 'Sound off. Press to turn on'} onClick={onToggleSound}>
          {soundOn ? <Volume2 aria-hidden="true" /> : <VolumeX aria-hidden="true" />} {soundOn ? '🔊' : '🔇'}
        </button>
      </ArcadeHeader>

      <main className="mt-12">
        <section className="text-center">
          

          <dl className="mt-8 flex flex-wrap justify-center gap-4" aria-label="Session statistics">
            <div className="arcade-card px-8 py-3"><dt className="text-xs font-black tracking-widest text-georgian-neutral">GAMES PLAYED</dt><dd className="text-3xl font-black text-georgian-yellow">{stats.gamesPlayed}</dd></div>
            <div className="arcade-card px-8 py-3"><dt className="text-xs font-black tracking-widest text-georgian-neutral">BEST SCORE</dt><dd className="text-3xl font-black text-georgian-yellow">{stats.best ? `${stats.best.score}/${stats.best.outOf}` : '—'}</dd></div>
          </dl>
        </section>

        <h2 className="mb-6 mt-14 text-center text-2xl font-black tracking-[0.2em] text-georgian-light-blue">CHOOSE YOUR CHALLENGE</h2>
        <ul className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
          {games.map((game) => (
            <li key={game.id} className="flex"><GameCard game={game} onSelect={onSelect} /></li>
          ))}
        </ul>
      </main>
      <Footer />
    </div>
  )
}
