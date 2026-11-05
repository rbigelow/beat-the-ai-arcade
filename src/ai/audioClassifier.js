// TensorFlow.js audio classifier: loads a custom model from public/models/sound-detective/
// or trains a small dense network in the browser from labelled examples.
import { FEATURE_SIZE } from './audioFeatures.js'

let tfPromise = null
export function loadTensorFlow() {
  if (!tfPromise) tfPromise = import('@tensorflow/tfjs')
  return tfPromise
}

function buildPredictor(tf, model, classIds, kind) {
  return {
    kind,
    classIds,
    predict(features) {
      return tf.tidy(() => {
        const input = tf.tensor2d([Array.from(features)], [1, FEATURE_SIZE])
        const output = model.predict(input)
        const probabilities = Array.from(output.dataSync())
        return classIds.map((id, i) => ({ id, probability: probabilities[i] ?? 0 }))
      })
    },
    dispose() {
      model.dispose()
    },
  }
}

/**
 * Tries to load a pre-trained model. Returns { classifier } or { error } with a plain-language
 * explanation. Expected files: model.json (+ weights *.bin) and metadata.json with
 * { "classes": ["clap", ...], "inputSize": 512 }.
 */
export async function loadPretrainedClassifier(baseUrl) {
  let metadata
  try {
    const response = await fetch(`${baseUrl}/metadata.json`)
    if (!response.ok) throw new Error(`HTTP ${response.status}`)
    metadata = await response.json()
  } catch {
    return { error: 'No custom sound model found at public/models/sound-detective/ (metadata.json / model.json missing).' }
  }
  try {
    const tf = await loadTensorFlow()
    const model = await tf.loadLayersModel(`${baseUrl}/model.json`)
    const inputShape = model.inputs[0].shape
    const inputSize = inputShape.slice(1).reduce((a, b) => a * b, 1)
    const outputSize = model.outputs[0].shape[1]
    const classes = metadata.classes
    if (inputShape.length !== 2 || inputSize !== FEATURE_SIZE || !Array.isArray(classes) || classes.length !== outputSize) {
      model.dispose()
      return { error: `Audio model mismatch: expected input [${FEATURE_SIZE}] and one output per class listed in metadata.json.` }
    }
    return { classifier: buildPredictor(tf, model, classes, 'pretrained') }
  } catch {
    return { error: 'The sound model files could not be loaded or are not a valid TensorFlow.js layers model.' }
  }
}

/**
 * Trains a small network on { classId: [Float32Array features, ...] }.
 * Reports real loss/accuracy per epoch through onProgress.
 */
export async function trainClassifier(examplesByClass, onProgress = () => {}, epochs = 60) {
  const classIds = Object.keys(examplesByClass).filter((id) => examplesByClass[id].length > 0)
  if (classIds.length < 2) throw new Error('Record examples for at least two sound classes before training.')
  const tf = await loadTensorFlow()
  const inputs = []
  const labels = []
  classIds.forEach((id, classIndex) => {
    examplesByClass[id].forEach((features) => {
      inputs.push(Array.from(features))
      labels.push(classIndex)
    })
  })
  const xs = tf.tensor2d(inputs, [inputs.length, FEATURE_SIZE])
  const ys = tf.oneHot(tf.tensor1d(labels, 'int32'), classIds.length)
  const model = tf.sequential()
  model.add(tf.layers.dense({ inputShape: [FEATURE_SIZE], units: 32, activation: 'relu' }))
  model.add(tf.layers.dropout({ rate: 0.2 }))
  model.add(tf.layers.dense({ units: classIds.length, activation: 'softmax' }))
  model.compile({ optimizer: tf.train.adam(0.01), loss: 'categoricalCrossentropy', metrics: ['accuracy'] })
  try {
    await model.fit(xs, ys, {
      epochs,
      batchSize: 16,
      shuffle: true,
      callbacks: {
        onEpochEnd: (epoch, logs) => onProgress({ epoch: epoch + 1, epochs, loss: logs.loss, accuracy: logs.acc ?? logs.accuracy }),
      },
    })
  } finally {
    xs.dispose()
    ys.dispose()
  }
  return buildPredictor(tf, model, classIds, 'trained')
}
