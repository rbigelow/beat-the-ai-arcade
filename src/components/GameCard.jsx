import { motion } from 'framer-motion'
import { playSfx } from '../utils/sfx.js'

export default function GameCard({ game, onSelect }) {
  return (
    <motion.button
      type="button"
      whileHover={{ y: -6 }}
      whileTap={{ scale: 0.98 }}
      transition={{ duration: 0.2 }}
      onClick={() => { playSfx('button'); onSelect(game.id) }}
      className="arcade-card flex min-h-56 w-full cursor-pointer flex-col items-start gap-3 p-7 text-left hover:border-georgian-green"
      aria-label={`${game.title}. ${game.tagline} Category: ${game.category}`}
    >
      <span className="text-5xl" aria-hidden="true">{game.icon}</span>
      <span className="text-2xl font-black tracking-wide">{game.title.toUpperCase()}</span>
      <span className="text-lg text-white/85">{game.tagline}</span>
      <span className="mt-auto rounded-full border-2 border-georgian-light-blue px-4 py-1 text-sm font-black tracking-widest text-georgian-light-blue">
        {game.category.toUpperCase()}
      </span>
    </motion.button>
  )
}
