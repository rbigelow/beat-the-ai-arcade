// A small fully-connected feed-forward neural network (tanh hidden layers, sigmoid output).

function randomWeight(rng) {
  return rng() * 2 - 1
}

export function createNetwork(layerSizes, rng = Math.random) {
  const layers = []
  for (let i = 1; i < layerSizes.length; i += 1) {
    const inputCount = layerSizes[i - 1]
    const outputCount = layerSizes[i]
    layers.push({
      weights: Array.from({ length: outputCount }, () =>
        Array.from({ length: inputCount }, () => randomWeight(rng)),
      ),
      biases: Array.from({ length: outputCount }, () => randomWeight(rng)),
    })
  }
  return { layerSizes: [...layerSizes], layers }
}

const sigmoid = (x) => 1 / (1 + Math.exp(-x))

/** Returns every layer's activations (input first) so they can be visualised. */
export function forward(network, inputs) {
  const activations = [inputs.slice()]
  let current = inputs
  network.layers.forEach((layer, layerIndex) => {
    const isOutput = layerIndex === network.layers.length - 1
    current = layer.weights.map((row, neuron) => {
      let sum = layer.biases[neuron]
      for (let i = 0; i < row.length; i += 1) sum += row[i] * current[i]
      return isOutput ? sigmoid(sum) : Math.tanh(sum)
    })
    activations.push(current)
  })
  return { activations, output: current }
}

export function cloneNetwork(network) {
  return {
    layerSizes: [...network.layerSizes],
    layers: network.layers.map((layer) => ({
      weights: layer.weights.map((row) => row.slice()),
      biases: layer.biases.slice(),
    })),
  }
}

/** Each weight has `rate` probability of being nudged by a random amount up to `strength`. */
export function mutateNetwork(network, rate, strength, rng = Math.random) {
  const child = cloneNetwork(network)
  child.layers.forEach((layer) => {
    layer.weights.forEach((row) => {
      for (let i = 0; i < row.length; i += 1) {
        if (rng() < rate) row[i] += (rng() * 2 - 1) * strength
      }
    })
    for (let i = 0; i < layer.biases.length; i += 1) {
      if (rng() < rate) layer.biases[i] += (rng() * 2 - 1) * strength
    }
  })
  return child
}

/** Uniform crossover: each weight is taken from one parent at random. */
export function crossoverNetworks(parentA, parentB, rng = Math.random) {
  const child = cloneNetwork(parentA)
  child.layers.forEach((layer, l) => {
    layer.weights.forEach((row, n) => {
      for (let i = 0; i < row.length; i += 1) {
        if (rng() < 0.5) row[i] = parentB.layers[l].weights[n][i]
      }
    })
    for (let i = 0; i < layer.biases.length; i += 1) {
      if (rng() < 0.5) layer.biases[i] = parentB.layers[l].biases[i]
    }
  })
  return child
}
