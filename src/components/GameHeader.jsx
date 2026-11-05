import { ArrowLeft } from 'lucide-react'
import ArcadeHeader from './ArcadeHeader.jsx'
import ModelStatusBadge from './ModelStatusBadge.jsx'
import { playSfx } from '../utils/sfx.js'

export default function GameHeader({ game, onBack, badge, extraControls }) {
  return (
    <div className="space-y-6">
      <ArcadeHeader compact>
        {extraControls}
        <button type="button" className="btn btn-blue" onClick={() => { playSfx('button'); onBack() }}>
          <ArrowLeft aria-hidden="true" size={22} /> Back to Arcade
        </button>
      </ArcadeHeader>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-3xl font-black sm:text-5xl">
          <span aria-hidden="true">{game.icon}</span> {game.title.toUpperCase()}
        </h1>
        {badge && <ModelStatusBadge {...badge} />}
      </div>
      <p className="text-lg text-georgian-neutral">{game.tagline}</p>
    </div>
  )
}
