import { useEffect, useRef, useState } from 'react'
import { Pause, Play, RefreshCw, RotateCcw } from 'lucide-react'
import GameHeader from '../components/GameHeader.jsx'
import BehindTheScenes from '../components/BehindTheScenes.jsx'
import ErrorPanel from '../components/ErrorPanel.jsx'
import { ALGORITHMS, createSearch, generateMaze, keyOf } from '../ai/mazeAlgorithms.js'
import { playSfx } from '../utils/sfx.js'

const SIZES = [15, 21, 31, 64, 128]
const SPEEDS = [{ label: 'SLOW', steps: 0.25 }, { label: 'NORMAL', steps: 1 }, { label: 'FAST', steps: 3 }, { label: 'MAX', steps: 12 }]
const CANVAS_PX = 600
const COLORS = {
  start: '#004b87', goal: '#64a70b', wall: '#333f48', explored: '#77c5d5', frontier: '#f3d03e', current: '#e57200', path: '#64a70b', floor: '#0b2235',
}

function drawMaze(ctx, maze, search) {
  const cell = CANVAS_PX / maze.size
  const frontier = new Set(search.frontier.map((c) => keyOf(c.x, c.y)))
  const explored = new Set(search.explored.map((c) => keyOf(c.x, c.y)))
  const pathSet = new Set(search.path.map((c) => keyOf(c.x, c.y)))
  ctx.font = `bold ${Math.max(8, cell * 0.6)}px Arial`
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  for (let y = 0; y < maze.size; y += 1) {
    for (let x = 0; x < maze.size; x += 1) {
      const k = keyOf(x, y)
      const px = x * cell
      const py = y * cell
      let fill = COLORS.floor
      let symbol = ''
      if (maze.walls[y][x]) {
        fill = COLORS.wall
      } else if (pathSet.has(k)) {
        fill = COLORS.path
        symbol = '●'
      } else if (search.current && search.current.x === x && search.current.y === y) {
        fill = COLORS.current
        symbol = '◎'
      } else if (frontier.has(k)) {
        fill = COLORS.frontier
        symbol = '+'
      } else if (explored.has(k)) {
        fill = COLORS.explored
        symbol = '·'
      }
      ctx.fillStyle = fill
      ctx.fillRect(px, py, cell, cell)
      if (!maze.walls[y][x] && maze.cost[y][x] > 1) {
        ctx.strokeStyle = 'rgba(255,255,255,0.7)'
        ctx.lineWidth = 1
        ctx.beginPath()
        ctx.moveTo(px + 2, py + cell - 3)
        ctx.lineTo(px + cell - 2, py + 3)
        ctx.stroke()
      }
      if (maze.walls[y][x]) {
        ctx.strokeStyle = 'rgba(255,255,255,0.12)'
        ctx.strokeRect(px + 0.5, py + 0.5, cell - 1, cell - 1)
      }
      if (symbol) {
        ctx.fillStyle = fill === COLORS.frontier || fill === COLORS.explored ? '#061523' : '#fff'
        ctx.fillText(symbol, px + cell / 2, py + cell / 2)
      }
    }
  }
  const mark = (point, color, text) => {
    ctx.fillStyle = color
    ctx.fillRect(point.x * cell, point.y * cell, cell, cell)
    ctx.strokeStyle = '#fff'
    ctx.lineWidth = 2
    ctx.strokeRect(point.x * cell + 1, point.y * cell + 1, cell - 2, cell - 2)
    ctx.fillStyle = '#fff'
    ctx.fillText(text, point.x * cell + cell / 2, point.y * cell + cell / 2)
  }
  mark(maze.start, COLORS.start, 'S')
  mark(maze.goal, COLORS.goal, 'G')
}

function narrate(algorithmId, search) {
  if (search.found) return 'Goal found! Reconstructing route...'
  if (search.done) return 'No route exists.'
  if (algorithmId === 'astar') return 'A* is prioritizing cells closer to the goal.'
  if (algorithmId === 'bfs') return 'Breadth-First Search is exploring every cell at the current distance.'
  if (algorithmId === 'dijkstra') return 'Dijkstra is always expanding the cheapest known route first.'
  if (algorithmId === 'dfs') return 'Depth-First Search is following one corridor as deep as it can.'
  return 'Greedy Best-First is always heading for the cell that looks closest to the goal.'
}

const metricsOf = (algorithmId, run) => {
  const s = run.search
  const usesH = ALGORITHMS[algorithmId].usesHeuristic
  return {
    narration: narrate(algorithmId, s),
    current: s.current ? `(${s.current.x}, ${s.current.y})` : '—',
    frontier: s.frontierSize,
    explored: s.explored.length,
    g: s.current ? s.currentG : 0,
    h: usesH ? (s.current ? s.currentH : 0) : null,
    path: s.found ? s.path.length : 0,
    elapsed: run.elapsed,
    done: s.done,
    found: s.found,
    pathCost: s.pathCost,
  }
}

export default function AIMazeEscape({ game, onBack }) {
  const canvasRefs = [useRef(null), useRef(null)]
  const [size, setSize] = useState(21)
  const [algorithms, setAlgorithms] = useState(['bfs', 'astar'])
  const [sideBySide, setSideBySide] = useState(true)
  const [autoReplay, setAutoReplay] = useState(true)
  const [speedIndex, setSpeedIndex] = useState(1)
  const [paused, setPaused] = useState(false)
  const [seed, setSeed] = useState(() => Date.now())
  const [replay, setReplay] = useState(0)
  const [metrics, setMetrics] = useState([])
  const [error, setError] = useState(null)
  const pausedRef = useRef(false)
  const speedRef = useRef(1)
  const [allDone, setAllDone] = useState(false)

  const activeAlgorithms = sideBySide ? algorithms : [algorithms[0]]

  useEffect(() => {
    pausedRef.current = paused
    speedRef.current = SPEEDS[speedIndex].steps
  }, [paused, speedIndex])

  useEffect(() => {
    let maze
    try {
      maze = generateMaze(size, seed)
    } catch {
      const handle = requestAnimationFrame(() => setError('A solvable maze could not be generated.'))
      return () => cancelAnimationFrame(handle)
    }
    // Every algorithm gets the identical maze object.
    const runs = activeAlgorithms.map((id) => ({ id, search: createSearch(maze, id), elapsed: 0, carry: 0, announced: false }))
    let handle = 0
    let last = performance.now()
    const loop = (now) => {
      const delta = now - last
      last = now
      if (!pausedRef.current) {
        for (const run of runs) {
          if (run.search.done) continue
          run.elapsed += delta
          run.carry += speedRef.current
          while (run.carry >= 1 && !run.search.done) {
            run.search.step()
            run.carry -= 1
          }
          if (run.search.found && !run.announced) {
            run.announced = true
            playSfx('goal')
          }
        }
      }
      runs.forEach((run, i) => {
        const ctx = canvasRefs[i]?.current?.getContext('2d')
        if (ctx) drawMaze(ctx, maze, run.search)
      })
      setMetrics(runs.map((run) => ({ id: run.id, ...metricsOf(run.id, run) })))
      setAllDone(runs.every((run) => run.search.done))
      handle = requestAnimationFrame(loop)
    }
    handle = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(handle)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [size, seed, replay, sideBySide, algorithms[0], algorithms[1]])

  useEffect(() => {
    if (!allDone || paused || !autoReplay) return undefined
    const timer = setTimeout(() => {
      setAllDone(false)
      setSeed(Date.now())
    }, 4000)
    return () => clearTimeout(timer)
  }, [allDone, paused, autoReplay, seed, replay])

  const newMaze = () => {
    setError(null)
    setSeed(Date.now())
  }

  if (error) {
    return (
      <div className="space-y-8">
        <GameHeader game={game} onBack={onBack} />
        <ErrorPanel what={error} fix="Press Retry to generate a new maze." onRetry={newMaze} onBack={onBack} />
      </div>
    )
  }

  const lead = metrics[metrics.length - 1]
  const leadAlgo = lead ? ALGORITHMS[lead.id] : ALGORITHMS.astar
  const stageIndex = !lead ? 0 : lead.found ? 4 : lead.explored === 0 ? 0 : 2
  const stages = [
    { label: 'FRONTIER', detail: 'Cells discovered but not yet visited', value: lead ? lead.frontier : '' },
    { label: 'CURRENT NODE', detail: 'The cell being examined now', value: lead ? lead.current : '' },
    { label: 'EXPLORED', detail: 'Cells already checked', value: lead ? lead.explored : '' },
    { label: 'GOAL FOUND', detail: 'The goal cell is reached', value: lead?.found ? 'Yes' : '' },
    { label: 'RECONSTRUCT PATH', detail: 'Follow the parent links back to the start', value: lead?.found ? `${lead.path} cells` : '' },
  ]

  return (
    <div className="space-y-8">
      <GameHeader game={game} onBack={onBack} badge={{ kind: 'algo', title: 'LIVE SEARCH ALGORITHM', detail: 'No neural network is used.' }} />
      <section className="arcade-card p-4 sm:p-6">
        <div className="flex flex-wrap items-end gap-3">
          <button type="button" className="btn btn-blue" onClick={() => setPaused(!paused)}>{paused ? <><Play aria-hidden="true" size={22} /> RESUME</> : <><Pause aria-hidden="true" size={22} /> PAUSE</>}</button>
          <button type="button" className="btn btn-primary" onClick={newMaze}><RefreshCw aria-hidden="true" size={22} /> NEW MAZE</button>
          <button type="button" className="btn btn-ghost" onClick={() => setReplay((r) => r + 1)}><RotateCcw aria-hidden="true" size={22} /> REPLAY</button>
          <button type="button" className="btn btn-ghost" aria-pressed={sideBySide} onClick={() => setSideBySide(!sideBySide)}>SIDE-BY-SIDE: {sideBySide ? 'ON' : 'OFF'}</button>
          <button type="button" className="btn btn-ghost" aria-pressed={autoReplay} onClick={() => setAutoReplay(!autoReplay)}>AUTO REPLAY: {autoReplay ? 'ON' : 'OFF'}</button>
          <label className="text-sm font-bold">ALGORITHM {sideBySide ? 'LEFT' : ''}
            <select className="mt-1 block min-h-12 rounded-xl bg-white px-3 text-black" value={algorithms[0]} onChange={(e) => setAlgorithms([e.target.value, algorithms[1]])}>
              {Object.values(ALGORITHMS).map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
            </select>
          </label>
          {sideBySide && (
            <label className="text-sm font-bold">ALGORITHM RIGHT
              <select className="mt-1 block min-h-12 rounded-xl bg-white px-3 text-black" value={algorithms[1]} onChange={(e) => setAlgorithms([algorithms[0], e.target.value])}>
                {Object.values(ALGORITHMS).map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
              </select>
            </label>
          )}
          <label className="text-sm font-bold">SIZE
            <select className="mt-1 block min-h-12 rounded-xl bg-white px-3 text-black" value={size} onChange={(e) => setSize(Number(e.target.value))}>
              {SIZES.map((v) => <option key={v} value={v}>{v}×{v}</option>)}
            </select>
          </label>
          <label className="text-sm font-bold">SPEED
            <select className="mt-1 block min-h-12 rounded-xl bg-white px-3 text-black" value={speedIndex} onChange={(e) => setSpeedIndex(Number(e.target.value))}>
              {SPEEDS.map((v, i) => <option key={v.label} value={i}>{v.label}</option>)}
            </select>
          </label>
        </div>

        <div className={`mt-6 grid gap-6 ${sideBySide ? 'lg:grid-cols-2' : ''}`}>
          {activeAlgorithms.map((id, i) => {
            const m = metrics.find((x, idx) => idx === i)
            return (
              <div key={`${id}-${i}`}>
                <h2 className="text-xl font-black">{ALGORITHMS[id].name}</h2>
                <canvas ref={canvasRefs[i]} width={CANVAS_PX} height={CANVAS_PX} role="img" aria-label={`${ALGORITHMS[id].name} exploring the maze`} className="mt-2 w-full max-w-xl rounded-2xl" />
                {m && (
                  <>
                    <p className="mt-2 text-lg font-bold text-georgian-yellow" aria-live="polite">{m.narration}</p>
                    <dl className="mt-2 grid grid-cols-2 gap-2 text-sm sm:grid-cols-4">
                      {[['Current cell', m.current], ['Frontier size', m.frontier], ['Nodes explored', m.explored], ['Distance travelled', m.g],
                        ['Est. remaining', m.h ?? 'n/a'], ['Path length', m.found ? m.path : '—'], ['Elapsed', `${(m.elapsed / 1000).toFixed(2)} s`], ['Route cost', m.found ? m.pathCost : '—']].map(([k, v]) => (
                        <div key={k} className="rounded-xl bg-black/30 p-2"><dt className="text-xs font-bold uppercase tracking-wider text-georgian-neutral">{k}</dt><dd className="font-mono text-lg font-black">{v}</dd></div>
                      ))}
                    </dl>
                  </>
                )}
              </div>
            )
          })}
        </div>
        <ul className="mt-6 flex flex-wrap gap-x-6 gap-y-2 text-sm font-bold" aria-label="Legend">
          <li>S Start (blue)</li><li>G Goal (green)</li><li>█ Wall (dark grey)</li><li>· Explored (light blue)</li><li>+ Frontier (yellow)</li><li>◎ Current (orange)</li><li>● Final route (green)</li><li>╱ Mud: costs 5 instead of 1</li>
        </ul>
        {allDone && <p className="mt-3 text-georgian-neutral">Both searches finished. {autoReplay ? 'A new maze will start automatically.' : 'Auto replay is off.'}</p>}
      </section>
      <BehindTheScenes
        summary="The algorithm keeps a list of cells to visit (the frontier), picks the next one, and repeats until the goal is reached. Then it walks backwards to draw the route."
        stages={stages}
        activeIndex={stageIndex}
        live={lead ? [
          { label: 'Current cell', value: lead.current },
          { label: 'Frontier size', value: lead.frontier },
          { label: 'Nodes explored', value: lead.explored },
          { label: 'Distance travelled', value: lead.g },
          { label: 'Est. remaining', value: lead.h ?? 'n/a' },
          { label: 'Elapsed', value: `${(lead.elapsed / 1000).toFixed(2)} s` },
        ] : []}
        details={{
          input: 'A grid maze with walls, a start, a goal and some muddy cells.',
          processing: 'Cells are added to a frontier, expanded one at a time and marked explored.',
          model: `${leadAlgo.name}. No neural network or learning is involved. All algorithms in side-by-side mode solve the identical maze.`,
          decision: 'Which frontier cell to expand next, which differs by algorithm.',
          confidence: 'Not applicable. BFS finds the fewest steps; Dijkstra and A* find the lowest total cost (mud costs more).',
          failure: 'A bad heuristic makes A* slower or inaccurate. Huge mazes use a lot of memory.',
        }}
        learnMore="A*: f(n) = g(n) + h(n), where g = distance travelled, h = estimated distance remaining (Manhattan distance), f = estimated total cost. A* expands the cell with the smallest f."
      />
    </div>
  )
}
