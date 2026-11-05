import { createNetwork, crossoverNetworks, mutateNetwork } from './neuralNetwork.js'

export function createPopulation(size, layerSizes, rng = Math.random) {
  if (!Number.isInteger(size) || size < 2) throw new Error('Population size must be an integer of at least 2.')
  return Array.from({ length: size }, () => createNetwork(layerSizes, rng))
}

function tournamentSelect(scored, rng, tournamentSize = 3) {
  let best = null
  for (let i = 0; i < tournamentSize; i += 1) {
    const candidate = scored[Math.floor(rng() * scored.length)]
    if (!best || candidate.fitness > best.fitness) best = candidate
  }
  return best
}

export function summarizeFitness(scored) {
  const values = scored.map((agent) => agent.fitness)
  if (values.length === 0 || values.some((v) => !Number.isFinite(v))) {
    throw new Error('Invalid fitness values in population.')
  }
  const total = values.reduce((sum, v) => sum + v, 0)
  return { best: Math.max(...values), average: total / values.length, worst: Math.min(...values) }
}

/**
 * Builds the next generation from agents scored as { brain, fitness }.
 * Elites are copied unchanged; the rest come from tournament selection,
 * crossover and mutation.
 */
export function evolvePopulation(scored, options = {}) {
  const { eliteCount = 2, mutationRate = 0.1, mutationStrength = 0.5, rng = Math.random } = options
  const stats = summarizeFitness(scored)
  const ranked = [...scored].sort((a, b) => b.fitness - a.fitness)
  const next = ranked.slice(0, eliteCount).map((agent) => agent.brain)
  while (next.length < scored.length) {
    const parentA = tournamentSelect(ranked, rng)
    const parentB = tournamentSelect(ranked, rng)
    const child = crossoverNetworks(parentA.brain, parentB.brain, rng)
    next.push(mutateNetwork(child, mutationRate, mutationStrength, rng))
  }
  return { brains: next, stats }
}
