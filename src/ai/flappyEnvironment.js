import { forward } from './neuralNetwork.js'
import { createPopulation, evolvePopulation } from './geneticAlgorithm.js'

export const WORLD = {
  width: 600,
  height: 400,
  agentX: 120,
  agentRadius: 11,
  gravity: 0.45,
  flapVelocity: -6.8,
  gateSpeed: 3,
  gateWidth: 56,
  gateSpacing: 200,
  gapSize: 105,
  maxTicks: 3000,
}
export const FITNESS = { survive: 1, passGate: 25, collision: -100 }
export const LAYER_SIZES = [5, 6, 1]
export const INPUT_LABELS = ['Vertical position', 'Vertical speed', 'Distance to gate', 'Gap centre', 'Diff from gap centre']
export const MUTATION = { rate: 0.12, strength: 0.6 }
export const TRANSITION_STAGES = ['EVALUATE', 'SELECT', 'COPY', 'MUTATE', 'TRY AGAIN']
const TICKS_PER_TRANSITION_STAGE = 18

function createGate(x, rng) {
  const margin = 25
  const gapCentre = margin + WORLD.gapSize / 2 + rng() * (WORLD.height - 2 * margin - WORLD.gapSize)
  return { x, gapCentre, passed: false }
}

function createGates(rng) {
  const gates = []
  for (let i = 0; i < 4; i += 1) gates.push(createGate(WORLD.width + i * WORLD.gateSpacing, rng))
  return gates
}

export function nextGateFor(gates) {
  return gates.find((gate) => gate.x + WORLD.gateWidth > WORLD.agentX - WORLD.agentRadius)
}

export function sensorsFor(agent, gate) {
  const distance = Math.max(0, gate.x - WORLD.agentX)
  return [
    agent.y / WORLD.height,
    Math.max(-1, Math.min(1, agent.vy / 10)),
    distance / WORLD.width,
    gate.gapCentre / WORLD.height,
    (agent.y - gate.gapCentre) / WORLD.height,
  ]
}

function createAgents(brains) {
  return brains.map((brain, id) => ({
    id, brain, y: WORLD.height / 2, vy: 0, alive: true, fitness: 0, gates: 0, flapProbability: 0, sensors: [0, 0, 0, 0, 0], activations: null,
  }))
}

export function createSimulation({ populationSize = 40, rng = Math.random } = {}) {
  const brains = createPopulation(populationSize, LAYER_SIZES, rng)
  return {
    rng, populationSize, generation: 1, tick: 0, phase: 'running', transitionTick: 0,
    gates: createGates(rng), agents: createAgents(brains),
    history: [], bestEver: 0, lastStats: null, pendingBrains: null,
    mutationRate: MUTATION.rate,
  }
}

function stepRunning(sim) {
  const gate = nextGateFor(sim.gates)
  sim.tick += 1
  for (const agent of sim.agents) {
    if (!agent.alive) continue
    agent.sensors = sensorsFor(agent, gate)
    const result = forward(agent.brain, agent.sensors)
    agent.flapProbability = result.output[0]
    agent.activations = result.activations
    if (agent.flapProbability > 0.5) agent.vy = WORLD.flapVelocity
    agent.vy += WORLD.gravity
    agent.y += agent.vy
    agent.fitness += FITNESS.survive

    const outOfBounds = agent.y < WORLD.agentRadius || agent.y > WORLD.height - WORLD.agentRadius
    const inGateColumn =
      WORLD.agentX + WORLD.agentRadius > gate.x && WORLD.agentX - WORLD.agentRadius < gate.x + WORLD.gateWidth
    const hitsPipe = inGateColumn && Math.abs(agent.y - gate.gapCentre) > WORLD.gapSize / 2 - WORLD.agentRadius
    if (outOfBounds || hitsPipe) {
      agent.alive = false
      agent.fitness += FITNESS.collision
    }
  }

  for (const g of sim.gates) g.x -= WORLD.gateSpeed
  for (const g of sim.gates) {
    if (!g.passed && g.x + WORLD.gateWidth < WORLD.agentX - WORLD.agentRadius) {
      g.passed = true
      for (const agent of sim.agents) {
        if (agent.alive) {
          agent.gates += 1
          agent.fitness += FITNESS.passGate
        }
      }
    }
  }
  while (sim.gates[0].x + WORLD.gateWidth < 0) {
    sim.gates.shift()
    const last = sim.gates[sim.gates.length - 1]
    sim.gates.push(createGate(last.x + WORLD.gateSpacing, sim.rng))
  }

  const aliveCount = sim.agents.filter((a) => a.alive).length
  if (aliveCount === 0 || sim.tick >= WORLD.maxTicks) beginTransition(sim)
}

function beginTransition(sim) {
  const scored = sim.agents.map((agent) => ({ brain: agent.brain, fitness: agent.fitness }))
  const { brains, stats } = evolvePopulation(scored, {
    eliteCount: 2, mutationRate: sim.mutationRate, mutationStrength: MUTATION.strength, rng: sim.rng,
  })
  const maxGates = Math.max(...sim.agents.map((a) => a.gates))
  sim.lastStats = { ...stats, gates: maxGates }
  sim.bestEver = Math.max(sim.bestEver, stats.best)
  sim.history.push({ generation: sim.generation, best: stats.best, average: stats.average })
  if (sim.history.length > 60) sim.history.shift()
  sim.pendingBrains = brains
  sim.phase = 'transition'
  sim.transitionTick = 0
}

function startNextGeneration(sim) {
  sim.generation += 1
  sim.tick = 0
  sim.gates = createGates(sim.rng)
  sim.agents = createAgents(sim.pendingBrains)
  sim.pendingBrains = null
  sim.phase = 'running'
}

export function stepSimulation(sim) {
  if (sim.phase === 'transition') {
    sim.transitionTick += 1
    if (sim.transitionTick >= TRANSITION_STAGES.length * TICKS_PER_TRANSITION_STAGE) startNextGeneration(sim)
    return
  }
  stepRunning(sim)
}

export function transitionStageIndex(sim) {
  return Math.min(TRANSITION_STAGES.length - 1, Math.floor(sim.transitionTick / TICKS_PER_TRANSITION_STAGE))
}

export function simulationStats(sim) {
  const alive = sim.agents.filter((a) => a.alive)
  const fitnessValues = sim.agents.map((a) => a.fitness)
  const best = sim.agents.reduce((top, a) => (a.fitness > top.fitness ? a : top), sim.agents[0])
  return {
    generation: sim.generation,
    population: sim.populationSize,
    alive: alive.length,
    bestFitness: Math.max(...fitnessValues),
    averageFitness: fitnessValues.reduce((s, v) => s + v, 0) / fitnessValues.length,
    gatesPassed: Math.max(...sim.agents.map((a) => a.gates)),
    mutationRate: sim.mutationRate,
    leader: alive.length ? alive.reduce((top, a) => (a.fitness > top.fitness ? a : top), alive[0]) : best,
  }
}
