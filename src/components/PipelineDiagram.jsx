import { motion } from 'framer-motion'
import { useReducedMotion } from '../hooks/useReducedMotion.js'

/** Vertical flow of stages. The active stage is highlighted with a border, glow and "ACTIVE" text. */
export default function PipelineDiagram({ stages, activeIndex = -1 }) {
  const reduced = useReducedMotion()
  return (
    <ol className="flex flex-col items-stretch" aria-label="Processing pipeline">
      {stages.map((stage, index) => {
        const active = index === activeIndex
        const done = activeIndex > index
        return (
          <li key={stage.label} className="flex flex-col items-center" aria-current={active ? 'step' : undefined}>
            <motion.div
              animate={reduced ? undefined : { scale: active ? 1.03 : 1 }}
              transition={{ duration: 0.25 }}
              className={`w-full rounded-2xl border-2 px-4 py-3 text-center ${
                active ? 'border-georgian-yellow bg-georgian-yellow/15 shadow-[0_0_18px_rgba(243,208,62,0.35)]' : done ? 'border-georgian-green/70 bg-georgian-green/10' : 'border-white/20 bg-white/5'
              }`}
            >
              <p className="text-sm font-black tracking-widest">
                {done && <span aria-label="completed">✓ </span>}
                {stage.label}
                {active && <span className="ml-2 rounded bg-georgian-yellow px-2 py-0.5 text-xs text-black">ACTIVE</span>}
              </p>
              {stage.detail && <p className="mt-1 text-sm text-georgian-neutral">{stage.detail}</p>}
              {stage.value != null && <p className="mt-1 break-words font-mono text-base font-bold text-georgian-light-blue">{stage.value}</p>}
            </motion.div>
            {index < stages.length - 1 && (
              <div className="relative h-6 w-1 bg-white/20" aria-hidden="true">
                {(active || done) && <span className="flow-dot absolute -left-1 h-3 w-3 rounded-full bg-georgian-light-blue" />}
                <span className="absolute -bottom-2 -left-2 text-white/50">▼</span>
              </div>
            )}
          </li>
        )
      })}
    </ol>
  )
}
