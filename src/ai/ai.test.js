import test from 'node:test'
import assert from 'node:assert/strict'
import { findBestMove, winnerOf, emptyCells, AI, HUMAN } from './minimax.js'
import { generateMaze, solveMaze, isSolvable, ALGORITHMS, mulberry32 } from './mazeAlgorithms.js'
import { createSimulation, stepSimulation, simulationStats } from './flappyEnvironment.js'
import { createNetwork, forward, mutateNetwork } from './neuralNetwork.js'
import { computeSpectrogram, analyzeSignalQuality, extractFeatures, FEATURE_SIZE, SAMPLE_RATE } from './audioFeatures.js'
import { synthesizeSample } from './audioSamples.js'

test('minimax AI never loses against any sequence of human moves', () => {
  function explore(board, humanTurn) {
    const result = winnerOf(board)
    if (result) {
      assert.equal(result.player, AI, 'human must never win')
      return
    }
    if (board.every(Boolean)) return
    if (humanTurn) {
      for (const move of emptyCells(board)) {
        const next = board.slice()
        next[move] = HUMAN
        explore(next, false)
      }
    } else {
      const next = board.slice()
      next[findBestMove(board).move] = AI
      explore(next, true)
    }
  }
  explore(Array(9).fill(null), true)
})

test('minimax takes an immediate win and blocks', () => {
  assert.equal(findBestMove(['O', 'O', null, 'X', 'X', null, null, null, null]).move, 2)
  assert.equal(findBestMove(['X', 'X', null, null, 'O', null, null, null, null]).move, 2)
})

test('mazes are solvable for all sizes and all algorithms find a route', () => {
  for (const size of [15, 21, 31]) {
    for (let seed = 1; seed <= 5; seed += 1) {
      const maze = generateMaze(size, seed)
      assert.ok(isSolvable(maze))
      for (const id of Object.keys(ALGORITHMS)) {
        const result = solveMaze(maze, id)
        assert.ok(result.found, `${id} found route`)
        assert.deepEqual(result.path[0], maze.start)
      }
    }
  }
})

test('A* and Dijkstra find equal optimal cost; A* explores no more than Dijkstra', () => {
  const maze = generateMaze(21, 42)
  const dijkstra = solveMaze(maze, 'dijkstra')
  const astar = solveMaze(maze, 'astar')
  assert.equal(astar.pathCost, dijkstra.pathCost)
  assert.ok(astar.explored.length <= dijkstra.explored.length)
  assert.ok(solveMaze(maze, 'bfs').path.length <= dijkstra.path.length)
})

test('neural network output is a probability and mutation changes weights', () => {
  const rng = mulberry32(1)
  const net = createNetwork([5, 6, 1], rng)
  const { output } = forward(net, [0.1, 0.2, 0.3, 0.4, 0.5])
  assert.ok(output[0] > 0 && output[0] < 1)
  assert.notDeepEqual(mutateNetwork(net, 1, 0.5, rng).layers, net.layers)
})

test('flappy simulation advances generations with real fitness values', () => {
  const sim = createSimulation({ populationSize: 20, rng: mulberry32(7) })
  for (let i = 0; i < 20000 && sim.generation < 3; i += 1) stepSimulation(sim)
  assert.ok(sim.generation >= 3)
  const stats = simulationStats(sim)
  assert.ok(Number.isFinite(stats.bestFitness))
  assert.ok(sim.history.length >= 2)
})

test('audio features: spectrogram peaks at tone frequency and quality detects clipping', () => {
  const tone = new Float32Array(SAMPLE_RATE).map((_, i) => 0.5 * Math.sin((2 * Math.PI * 2000 * i) / SAMPLE_RATE))
  const frame = computeSpectrogram(tone)[3]
  const peakBin = frame.indexOf(Math.max(...frame))
  assert.ok(Math.abs(peakBin * (SAMPLE_RATE / 512) - 2000) < 100)
  assert.equal(analyzeSignalQuality(new Float32Array(100).fill(1)).status, 'loud')
  assert.equal(analyzeSignalQuality(new Float32Array(100).fill(0.001)).status, 'quiet')
  assert.equal(analyzeSignalQuality(tone).status, 'good')
  assert.equal(extractFeatures(synthesizeSample('clap', mulberry32(3))).length, FEATURE_SIZE)
})
