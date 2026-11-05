import { useEffect, useRef, useState } from 'react'
import GameHeader from '../components/GameHeader.jsx'
import BehindTheScenes from '../components/BehindTheScenes.jsx'
import { AI, HUMAN, findBestMove, isFull, winnerOf } from '../ai/minimax.js'
import { playSfx } from '../utils/sfx.js'

const EMPTY = Array(9).fill(null)

export default function TicTacAI({ game, onBack, onScore }) {
  const [board, setBoard] = useState(EMPTY)
  const [thinking, setThinking] = useState(false)
  const [search, setSearch] = useState(null)
  const [record, setRecord] = useState({ ai: 0, ties: 0 })
  const timer = useRef(null)

  const result = winnerOf(board)
  const tie = !result && isFull(board)
  const over = !!result || tie

  useEffect(() => () => clearTimeout(timer.current), [])

  const finish = (nextBoard) => {
    const outcome = winnerOf(nextBoard)
    if (outcome) {
      playSfx('incorrect')
      setRecord((r) => ({ ...r, ai: r.ai + 1 }))
    } else if (isFull(nextBoard)) {
      playSfx('correct')
      setRecord((r) => ({ ...r, ties: r.ties + 1 }))
      onScore?.(1, 1)
    }
  }

  const play = (index) => {
    if (board[index] || thinking || over) return
    playSfx('button')
    const afterHuman = board.slice()
    afterHuman[index] = HUMAN
    setBoard(afterHuman)
    if (winnerOf(afterHuman) || isFull(afterHuman)) {
      finish(afterHuman)
      return
    }
    setThinking(true)
    timer.current = setTimeout(() => {
      const started = performance.now()
      const found = findBestMove(afterHuman)
      const elapsed = performance.now() - started
      setSearch({ ...found, elapsed, board: afterHuman })
      const afterAi = afterHuman.slice()
      afterAi[found.move] = AI
      setBoard(afterAi)
      setThinking(false)
      finish(afterAi)
    }, 600)
  }

  const reset = () => {
    clearTimeout(timer.current)
    setBoard(EMPTY)
    setThinking(false)
    setSearch(null)
  }

  const status = result ? (result.player === AI ? 'AI WINS' : 'YOU WIN') : tie ? 'TIE GAME' : thinking ? 'AI THINKING...' : 'YOUR TURN'
  const stages = [
    { label: 'CURRENT BOARD', detail: 'The positions of X and O', value: search ? search.board.map((c) => c ?? '·').join('') : '' },
    { label: 'POSSIBLE MOVES', detail: 'Every empty square', value: search ? search.options.length : '' },
    { label: 'FUTURE BOARDS', detail: 'Plays every possible game to the end', value: search ? search.boardsEvaluated.toLocaleString() : '' },
    { label: 'WIN / LOSS / TIE SCORES', detail: 'AI win +10, loss -10, tie 0 (faster wins score higher)', value: search ? search.options.map((o) => `${o.move + 1}:${o.score}`).join('  ') : '' },
    { label: 'BEST MOVE', detail: 'The move with the highest score', value: search ? `Square ${search.move + 1}` : '' },
  ]

  return (
    <div className="space-y-8">
      <GameHeader game={game} onBack={onBack} badge={{ kind: 'algo', title: 'SEARCH ALGORITHM', detail: 'Minimax' }} />
      <section className="arcade-card mx-auto max-w-xl p-6 text-center sm:p-8">
        <p className="text-sm font-bold tracking-widest text-georgian-neutral">YOU = X &nbsp;|&nbsp; AI = O</p>
        <p className="my-3 text-3xl font-black text-georgian-yellow" role="status" aria-live="polite">{status}</p>
        <div className="mx-auto grid max-w-sm grid-cols-3 gap-3" role="grid" aria-label="Tic-tac-toe board">
          {board.map((cell, i) => {
            const winning = result?.line.includes(i)
            return (
              <button
                key={i}
                type="button"
                role="gridcell"
                onClick={() => play(i)}
                disabled={!!cell || thinking || over}
                aria-label={`Square ${i + 1}: ${cell ?? 'empty'}`}
                className={`aspect-square min-h-24 rounded-2xl border-2 text-6xl font-black ${winning ? 'border-georgian-yellow bg-georgian-yellow/20' : 'border-georgian-light-blue/40 bg-black/30'} ${cell === HUMAN ? 'text-georgian-light-blue' : 'text-georgian-orange'}`}
              >
                {cell}
              </button>
            )
          })}
        </div>
        <p className="mt-5 text-lg">AI wins: <strong>{record.ai}</strong> &nbsp; Ties: <strong>{record.ties}</strong></p>
        <p className="mt-1 text-sm text-georgian-neutral">Minimax plays perfectly, so the best you can do is tie.</p>
        <button type="button" className="btn btn-primary mt-4" onClick={reset}>{over ? 'PLAY AGAIN' : 'RESTART'}</button>
      </section>
      <BehindTheScenes
        summary="Minimax imagines every possible future game, scores the endings, and picks the move that leads to the best guaranteed result. It is a search algorithm, not a neural network."
        stages={stages}
        activeIndex={thinking ? 2 : search ? 4 : 0}
        live={[
          { label: 'Boards evaluated', value: search ? search.boardsEvaluated.toLocaleString() : '—' },
          { label: 'Search depth', value: search ? search.maxDepth : '—' },
          { label: 'Decision time', value: search ? `${search.elapsed.toFixed(1)} ms` : '—' },
        ]}
        details={{
          input: 'The current 3×3 board.',
          processing: 'The AI tries each empty square, then each reply, and so on until every game ends.',
          model: 'Minimax search. The AI maximises its score and assumes you minimise it. No learning or neural network.',
          decision: 'It chooses the square with the best score.',
          confidence: 'Not probabilistic. Minimax is exact for this small game and cannot be beaten.',
          failure: 'It only works because tic-tac-toe is tiny. Games like chess are too large to search completely.',
        }}
      />
    </div>
  )
}
