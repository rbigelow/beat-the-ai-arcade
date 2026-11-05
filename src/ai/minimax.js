// Genuine Minimax for Tic-Tac-Toe. Board is an array of 9 cells: 'X', 'O' or null.
export const HUMAN = 'X'
export const AI = 'O'
const LINES = [[0, 1, 2], [3, 4, 5], [6, 7, 8], [0, 3, 6], [1, 4, 7], [2, 5, 8], [0, 4, 8], [2, 4, 6]]

export function winnerOf(board) {
  for (const [a, b, c] of LINES) {
    if (board[a] && board[a] === board[b] && board[a] === board[c]) return { player: board[a], line: [a, b, c] }
  }
  return null
}

export const isFull = (board) => board.every(Boolean)
export const emptyCells = (board) => board.flatMap((cell, i) => (cell ? [] : [i]))

/** Score from the AI's view: +10 - depth for AI win (faster is better), depth - 10 for loss, 0 tie. */
function minimax(board, player, depth, stats) {
  stats.boardsEvaluated += 1
  stats.maxDepth = Math.max(stats.maxDepth, depth)
  const result = winnerOf(board)
  if (result) return result.player === AI ? 10 - depth : depth - 10
  if (isFull(board)) return 0
  const maximizing = player === AI
  let best = maximizing ? -Infinity : Infinity
  for (const move of emptyCells(board)) {
    board[move] = player
    const score = minimax(board, maximizing ? HUMAN : AI, depth + 1, stats)
    board[move] = null
    best = maximizing ? Math.max(best, score) : Math.min(best, score)
  }
  return best
}

/** Returns the best move for the AI plus the score of every candidate move and search statistics. */
export function findBestMove(board) {
  const stats = { boardsEvaluated: 0, maxDepth: 0 }
  const working = board.slice()
  const options = emptyCells(working).map((move) => {
    working[move] = AI
    const score = minimax(working, HUMAN, 1, stats)
    working[move] = null
    return { move, score }
  })
  if (options.length === 0) return { move: null, options, ...stats }
  const best = options.reduce((top, o) => (o.score > top.score ? o : top), options[0])
  return { move: best.move, options, ...stats }
}
