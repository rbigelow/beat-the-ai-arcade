import { motion } from 'framer-motion'
import { useEffect } from 'react'
import { playSfx } from '../utils/sfx.js'

export default function GameComplete({ title = 'CHALLENGE COMPLETE', score, outOf, message, heading, onPlayAgain, onBack, children }) {
  useEffect(() => {
    playSfx('victory')
  }, [])
  const praise = message ?? (outOf && score / outOf >= 0.8 ? 'NICE WORK!' : 'GOOD TRY!')
  return (
    <motion.section initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }} className="arcade-card mx-auto max-w-2xl p-8 text-center sm:p-12" aria-live="polite">
      <p className="text-7xl" aria-hidden="true">🏆</p>
      {heading && <p className="mt-2 text-xl font-black tracking-widest text-georgian-light-blue">{heading}</p>}
      <h2 className="mt-2 text-3xl font-black sm:text-4xl">{title}</h2>
      {score != null && (
        <p className="mt-4 text-5xl font-black text-georgian-yellow">
          {outOf ? `${score} / ${outOf}` : score}
        </p>
      )}
      <p className="mt-2 text-2xl font-bold">{praise}</p>
      {children && <div className="mt-4 text-lg text-white/90">{children}</div>}
      <div className="mt-8 flex flex-wrap justify-center gap-4">
        <button type="button" className="btn btn-primary" onClick={onPlayAgain}>PLAY AGAIN</button>
        <button type="button" className="btn btn-blue" onClick={onBack}>BACK TO ARCADE</button>
      </div>
    </motion.section>
  )
}
