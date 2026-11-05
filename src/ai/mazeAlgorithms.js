// Maze generation and step-by-step pathfinding (BFS, Dijkstra, A*, DFS, Greedy).

export const ALGORITHMS = {
  bfs: { id: 'bfs', name: 'Breadth-First Search', short: 'BFS', usesCost: false, usesHeuristic: false },
  dijkstra: { id: 'dijkstra', name: 'Dijkstra', short: 'Dijkstra', usesCost: true, usesHeuristic: false },
  astar: { id: 'astar', name: 'A*', short: 'A*', usesCost: true, usesHeuristic: true },
  dfs: { id: 'dfs', name: 'Depth-First Search', short: 'DFS', usesCost: false, usesHeuristic: false },
  greedy: { id: 'greedy', name: 'Greedy Best-First', short: 'Greedy', usesCost: false, usesHeuristic: true },
}

export function mulberry32(seed) {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

const DIRECTIONS = [[0, -1], [1, 0], [0, 1], [-1, 0]]
export const keyOf = (x, y) => `${x},${y}`

/**
 * Generates a perfect maze (recursive backtracker) on an odd-sized grid, then opens a few
 * extra walls so there are several routes, and scatters weighted "mud" terrain (cost 5).
 */
export function generateMaze(size, seed = Date.now()) {
  const rng = mulberry32(seed)
  const n = size % 2 === 0 ? size + 1 : size
  const walls = Array.from({ length: n }, () => Array(n).fill(true))
  const stack = [[1, 1]]
  walls[1][1] = false
  while (stack.length) {
    const [x, y] = stack[stack.length - 1]
    const options = DIRECTIONS.map(([dx, dy]) => [x + dx * 2, y + dy * 2, dx, dy])
      .filter(([nx, ny]) => nx > 0 && ny > 0 && nx < n - 1 && ny < n - 1 && walls[ny][nx])
    if (options.length === 0) {
      stack.pop()
      continue
    }
    const [nx, ny, dx, dy] = options[Math.floor(rng() * options.length)]
    walls[y + dy][x + dx] = false
    walls[ny][nx] = false
    stack.push([nx, ny])
  }
  const loops = Math.floor(n * 0.6)
  for (let i = 0; i < loops; i += 1) {
    const x = 1 + Math.floor(rng() * (n - 2))
    const y = 1 + Math.floor(rng() * (n - 2))
    const horizontal = walls[y][x] && !walls[y][x - 1] && !walls[y][x + 1] && walls[y - 1]?.[x] && walls[y + 1]?.[x]
    const vertical = walls[y][x] && !walls[y - 1]?.[x] && !walls[y + 1]?.[x] && walls[y][x - 1] && walls[y][x + 1]
    if (horizontal || vertical) walls[y][x] = false
  }
  const start = { x: 1, y: 1 }
  const goal = { x: n - 2, y: n - 2 }
  const cost = Array.from({ length: n }, (_, y) =>
    Array.from({ length: n }, (_, x) => {
      const isEnd = (x === start.x && y === start.y) || (x === goal.x && y === goal.y)
      return !walls[y][x] && !isEnd && rng() < 0.12 ? 5 : 1
    }),
  )
  const maze = { size: n, walls, cost, start, goal, seed }
  if (!isSolvable(maze)) throw new Error('Maze generation failed: no route from start to goal.')
  return maze
}

export function neighborsOf(maze, x, y) {
  const result = []
  for (const [dx, dy] of DIRECTIONS) {
    const nx = x + dx
    const ny = y + dy
    if (nx >= 0 && ny >= 0 && nx < maze.size && ny < maze.size && !maze.walls[ny][nx]) result.push({ x: nx, y: ny })
  }
  return result
}

export function isSolvable(maze) {
  const seen = new Set([keyOf(maze.start.x, maze.start.y)])
  const queue = [maze.start]
  while (queue.length) {
    const { x, y } = queue.shift()
    if (x === maze.goal.x && y === maze.goal.y) return true
    for (const next of neighborsOf(maze, x, y)) {
      const k = keyOf(next.x, next.y)
      if (!seen.has(k)) {
        seen.add(k)
        queue.push(next)
      }
    }
  }
  return false
}

export const manhattan = (a, b) => Math.abs(a.x - b.x) + Math.abs(a.y - b.y)

/** A simple binary-heap-free priority list; mazes are small so a sorted insert is fine. */
class PriorityList {
  constructor() { this.items = [] }
  get size() { return this.items.length }
  push(item, priority) {
    this.seq = (this.seq ?? 0) + 1
    const entry = { item, priority, seq: this.seq }
    let i = this.items.length
    while (i > 0 && (this.items[i - 1].priority < priority)) i -= 1
    this.items.splice(i, 0, entry)
  }
  pop() { return this.items.pop().item }
  toArray() { return this.items.map((e) => e.item) }
}

/**
 * Creates a search that advances one node at a time via step().
 * State exposed: explored, frontier (arrays of cells), current, done, found, path,
 * plus live metrics (g, h, f for the current node).
 */
export function createSearch(maze, algorithmId) {
  const algorithm = ALGORITHMS[algorithmId]
  if (!algorithm) throw new Error(`Unknown algorithm: ${algorithmId}`)
  const { start, goal } = maze
  const startKey = keyOf(start.x, start.y)
  const gScore = new Map([[startKey, 0]])
  const cameFrom = new Map()
  const closed = new Set()
  const queued = new Set([startKey])
  const order = []
  const heuristic = (cell) => manhattan(cell, goal)
  const priorityOf = (cell, g) => {
    if (algorithmId === 'astar') return g + heuristic(cell)
    if (algorithmId === 'dijkstra') return g
    if (algorithmId === 'greedy') return heuristic(cell)
    return 0
  }
  const queue = algorithmId === 'dfs' || algorithmId === 'bfs' ? [] : new PriorityList()
  if (Array.isArray(queue)) queue.push(start)
  else queue.push(start, priorityOf(start, 0))

  const search = {
    algorithm, explored: [], current: null, done: false, found: false, path: [], steps: 0,
    currentG: 0, currentH: heuristic(start), pathCost: 0,
    get frontier() {
      const cells = Array.isArray(queue) ? queue.slice() : queue.toArray()
      return cells.filter((cell) => !closed.has(keyOf(cell.x, cell.y)))
    },
    get frontierSize() { return search.frontier.length },
    step() {
      if (search.done) return search
      const empty = Array.isArray(queue) ? queue.length === 0 : queue.size === 0
      if (empty) {
        search.done = true
        search.current = null
        return search
      }
      let cell
      if (algorithmId === 'dfs') cell = queue.pop()
      else if (algorithmId === 'bfs') cell = queue.shift()
      else cell = queue.pop()
      const key = keyOf(cell.x, cell.y)
      queued.delete(key)
      if (closed.has(key)) return search
      closed.add(key)
      order.push(cell)
      search.explored = order
      search.current = cell
      search.steps += 1
      search.currentG = gScore.get(key)
      search.currentH = heuristic(cell)
      if (cell.x === goal.x && cell.y === goal.y) {
        search.found = true
        search.done = true
        let walker = key
        const path = []
        while (walker) {
          const [px, py] = walker.split(',').map(Number)
          path.unshift({ x: px, y: py })
          walker = cameFrom.get(walker)
        }
        search.path = path
        search.pathCost = gScore.get(key)
        return search
      }
      for (const next of neighborsOf(maze, cell.x, cell.y)) {
        const nk = keyOf(next.x, next.y)
        if (closed.has(nk)) continue
        const stepCost = algorithm.usesCost ? maze.cost[next.y][next.x] : 1
        const tentative = gScore.get(key) + stepCost
        if (algorithm.usesCost) {
          if (gScore.has(nk) && tentative >= gScore.get(nk)) continue
          gScore.set(nk, tentative)
          cameFrom.set(nk, key)
          queue.push(next, priorityOf(next, tentative))
          queued.add(nk)
        } else if (!queued.has(nk)) {
          gScore.set(nk, tentative)
          cameFrom.set(nk, key)
          queued.add(nk)
          if (algorithmId === 'greedy') queue.push(next, priorityOf(next, tentative))
          else queue.push(next)
        }
      }
      return search
    },
  }
  return search
}

export function solveMaze(maze, algorithmId) {
  const search = createSearch(maze, algorithmId)
  while (!search.done) search.step()
  return search
}
