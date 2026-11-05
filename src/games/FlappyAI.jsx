import { useCallback, useEffect, useRef, useState } from 'react'
import { Pause, Play, RotateCcw } from 'lucide-react'
import GameHeader from '../components/GameHeader.jsx'
import BehindTheScenes from '../components/BehindTheScenes.jsx'
import ErrorPanel from '../components/ErrorPanel.jsx'
import {
  FITNESS, INPUT_LABELS, LAYER_SIZES, TRANSITION_STAGES, WORLD,
  createSimulation, simulationStats, stepSimulation, transitionStageIndex,
} from '../ai/flappyEnvironment.js'
import { playSfx } from '../utils/sfx.js'

const SPEEDS = [1, 2, 5, 10]
const POPULATION = 40

function drawWorld(ctx, sim) {
  ctx.fillStyle = '#0b2235'
  ctx.fillRect(0, 0, WORLD.width, WORLD.height)
  ctx.fillStyle = '#00778b'
  sim.gates.forEach((gate) => {
    const top = gate.gapCentre - WORLD.gapSize / 2
    const bottom = gate.gapCentre + WORLD.gapSize / 2
    ctx.fillRect(gate.x, 0, WORLD.gateWidth, top)
    ctx.fillRect(gate.x, bottom, WORLD.gateWidth, WORLD.height - bottom)
    ctx.fillStyle = '#77c5d5'
    ctx.fillRect(gate.x - 3, top - 8, WORLD.gateWidth + 6, 8)
    ctx.fillRect(gate.x - 3, bottom, WORLD.gateWidth + 6, 8)
    ctx.fillStyle = '#00778b'
  })
  const leader = simulationStats(sim).leader
  sim.agents.forEach((agent) => {
    if (!agent.alive) return
    ctx.beginPath()
    ctx.arc(WORLD.agentX, agent.y, WORLD.agentRadius, 0, Math.PI * 2)
    ctx.fillStyle = agent === leader ? '#f3d03e' : 'rgba(229,114,0,0.55)'
    ctx.fill()
    if (agent === leader) {
      ctx.strokeStyle = '#fff'
      ctx.lineWidth = 2
      ctx.stroke()
    }
  })
}

function NetworkDiagram({ activations }) {
  const width = 360
  const height = 220
  const columns = LAYER_SIZES.map((count, layer) => {
    const x = 50 + (layer * (width - 100)) / (LAYER_SIZES.length - 1)
    return Array.from({ length: count }, (_, i) => ({ x, y: ((i + 1) * height) / (count + 1), value: activations?.[layer]?.[i] ?? 0 }))
  })
  return (
    <svg viewBox={`0 0 ${width} ${height}`} role="img" aria-label="Neural network of the current leading agent: 5 input neurons, 6 hidden neurons, 1 output neuron" className="w-full max-w-md">
      {columns.slice(0, -1).map((col, l) => col.flatMap((a, i) => columns[l + 1].map((b, j) => (
        <line key={`${l}-${i}-${j}`} x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke="#77c5d5" strokeOpacity="0.2" />
      ))))}
      {columns.flat().map((n, i) => (
        <circle key={i} cx={n.x} cy={n.y} r="11" fill="#061523" stroke={Math.abs(n.value) > 0.5 ? '#f3d03e' : '#77c5d5'} strokeWidth="3" style={{ fillOpacity: 1 }}>
          <title>{n.value.toFixed(2)}</title>
        </circle>
      ))}
      {columns.flat().map((n, i) => (
        <circle key={`v${i}`} cx={n.x} cy={n.y} r={3 + Math.min(1, Math.abs(n.value)) * 6} fill={n.value >= 0 ? '#64a70b' : '#e57200'} />
      ))}
    </svg>
  )
}

export default function FlappyAI({ game, onBack }) {
  const canvasRef = useRef(null)
  const simRef = useRef(null)
  const [paused, setPaused] = useState(false)
  const [speed, setSpeed] = useState(2)
  const [snapshot, setSnapshot] = useState(null)
  const [failure, setFailure] = useState(null)
  const pausedRef = useRef(false)
  const speedRef = useRef(2)
  const lastGeneration = useRef(1)

  const publish = useCallback(() => {
    const sim = simRef.current
    const stats = simulationStats(sim)
    setSnapshot({
      ...stats,
      phase: sim.phase,
      transitionStage: sim.phase === 'transition' ? transitionStageIndex(sim) : -1,
      sensors: stats.leader.sensors,
      flapProbability: stats.leader.flapProbability,
      activations: stats.leader.activations,
      lastStats: sim.lastStats,
    })
  }, [])

  const restart = useCallback(() => {
    try {
      simRef.current = createSimulation({ populationSize: POPULATION })
      lastGeneration.current = 1
      setFailure(null)
      publish()
    } catch {
      setFailure('The learning simulation could not create a valid population.')
    }
  }, [publish])

  useEffect(() => {
    if (failure) return undefined
    let handle = 0
    let frame = 0
    const loop = () => {
      if (!simRef.current) restart()
      const sim = simRef.current
      try {
        if (sim && !pausedRef.current) {
          for (let i = 0; i < speedRef.current; i += 1) stepSimulation(sim)
          if (sim.generation !== lastGeneration.current) {
            lastGeneration.current = sim.generation
            playSfx('generation')
          }
        }
        if (sim) {
          const ctx = canvasRef.current?.getContext('2d')
          if (ctx) drawWorld(ctx, sim)
          frame += 1
          if (frame % 4 === 0) publish()
        }
      } catch {
        setFailure('The simulation produced invalid fitness values.')
        return
      }
      handle = requestAnimationFrame(loop)
    }
    handle = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(handle)
  }, [failure, publish, restart])

  const togglePause = () => {
    pausedRef.current = !pausedRef.current
    setPaused(pausedRef.current)
  }
  const chooseSpeed = (value) => {
    speedRef.current = value
    setSpeed(value)
  }

  if (failure) {
    return (
      <div className="space-y-8">
        <GameHeader game={game} onBack={onBack} />
        <ErrorPanel what={failure} fix="Press Retry to start a new population." onRetry={restart} onBack={onBack} />
      </div>
    )
  }

  const s = snapshot
  const transition = s?.phase === 'transition'
  const stages = [
    { label: 'SENSORS', detail: 'What the bird measures', value: s ? s.sensors.map((v) => v.toFixed(2)).join(', ') : '' },
    { label: 'INPUT NEURONS', detail: INPUT_LABELS.join(' · ') },
    { label: 'HIDDEN LAYER', detail: `${LAYER_SIZES[1]} neurons (tanh)` },
    { label: 'OUTPUT', detail: 'One neuron (sigmoid) = chance to flap', value: s ? `${(s.flapProbability * 100).toFixed(0)}%` : '' },
    { label: 'FLAP / DON\'T FLAP', detail: 'Flap if the output is above 50%', value: s ? (s.flapProbability > 0.5 ? 'FLAP' : 'DO NOT FLAP') : '' },
  ]

  return (
    <div className="space-y-8">
      <GameHeader game={game} onBack={onBack} badge={{ kind: 'sim', title: 'LIVE LEARNING SIMULATION', detail: 'Genetic Algorithm / Neuroevolution' }} />
      <section className="arcade-card p-4 sm:p-6">
        <div className="relative mx-auto max-w-3xl">
          <canvas ref={canvasRef} width={WORLD.width} height={WORLD.height} role="img" aria-label="Flying agents learning to pass gates" className="w-full rounded-2xl" />
          {transition && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 rounded-2xl bg-black/60 p-4 text-center" aria-live="polite">
              <p className="text-xl font-black text-georgian-light-blue">GENERATION {s.generation} COMPLETE</p>
              <ol className="flex flex-wrap justify-center gap-2 text-sm font-black sm:text-lg">
                {TRANSITION_STAGES.map((label, i) => (
                  <li key={label} className={`rounded-full border-2 px-3 py-1 ${i === s.transitionStage ? 'border-georgian-yellow bg-georgian-yellow text-black' : 'border-white/30'}`}>{i < s.transitionStage ? '✓ ' : ''}{label}</li>
                ))}
              </ol>
            </div>
          )}
        </div>
        <div className="mt-4 flex flex-wrap items-center justify-center gap-3">
          <button type="button" className="btn btn-blue" onClick={togglePause}>{paused ? <><Play aria-hidden="true" size={22} /> RESUME</> : <><Pause aria-hidden="true" size={22} /> PAUSE</>}</button>
          <button type="button" className="btn btn-ghost" onClick={restart}><RotateCcw aria-hidden="true" size={22} /> RESTART</button>
          <div role="group" aria-label="Simulation speed" className="flex gap-2">
            {SPEEDS.map((v) => (
              <button key={v} type="button" aria-pressed={speed === v} className={`btn ${speed === v ? 'btn-primary' : 'btn-ghost'}`} onClick={() => chooseSpeed(v)}>{v}×</button>
            ))}
          </div>
        </div>
        <p className="mt-3 text-center text-sm text-georgian-neutral">Yellow = current leader. Orange = other agents. No human play needed: the AI learns by itself.</p>
      </section>
      <BehindTheScenes
        summary="Each bird has a tiny neural network that decides when to flap. The best birds in each generation are copied, mixed and mutated to make the next, slightly better generation."
        stages={stages}
        activeIndex={transition ? -1 : 3}
        live={s ? [
          { label: 'Flap probability', value: `${(s.flapProbability * 100).toFixed(0)}%` },
          { label: 'Generation', value: s.generation },
          { label: 'Population', value: s.population },
          { label: 'Agents alive', value: s.alive },
          { label: 'Best fitness', value: Math.round(s.bestFitness) },
          { label: 'Average fitness', value: Math.round(s.averageFitness) },
          { label: 'Gates passed', value: s.gatesPassed },
          { label: 'Mutation rate', value: `${Math.round(s.mutationRate * 100)}%` },
          { label: 'Last gen best', value: s.lastStats ? Math.round(s.lastStats.best) : '—' },
        ] : []}
        details={{
          input: `Five sensor values: ${INPUT_LABELS.join(', ').toLowerCase()}.`,
          processing: `Sensors feed a ${LAYER_SIZES.join('→')} neural network.`,
          model: 'Neuroevolution: a genetic algorithm (selection, crossover, mutation) evolves the neural network weights. Nothing is trained with backpropagation.',
          decision: 'If the output neuron is above 50% the bird flaps.',
          confidence: 'The output value is the flap probability-like score shown live.',
          failure: 'Early generations crash a lot. Evolution is random search guided by fitness, so progress can stall.',
        }}
        learnMore={`Fitness: +${FITNESS.survive} for each step survived, +${FITNESS.passGate} for passing a gate, ${FITNESS.collision} for a collision. Each generation, the 2 best agents are copied unchanged, and the rest are children of tournament-selected parents.`}
      >
        <div>
          <h3 className="mb-2 text-sm font-black tracking-widest text-georgian-neutral">LEADER&apos;S NEURAL NETWORK (green = positive, orange = negative)</h3>
          <NetworkDiagram activations={s?.activations} />
          <p className="text-sm text-georgian-neutral">Inputs: {INPUT_LABELS.join(' · ')}</p>
        </div>
      </BehindTheScenes>
    </div>
  )
}
