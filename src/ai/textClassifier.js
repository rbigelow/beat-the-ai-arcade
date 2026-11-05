// Multinomial Naive Bayes over word counts. Small, transparent, and trained entirely in the browser.
export const CATEGORIES = [
  { id: 'positive', label: 'Positive', emoji: '😀' },
  { id: 'neutral', label: 'Neutral', emoji: '😐' },
  { id: 'negative', label: 'Negative', emoji: '😡' },
]

export function tokenize(text) {
  return (text.toLowerCase().match(/[a-z']+/g) ?? []).filter((w) => w.length > 1)
}

export function trainNaiveBayes(examples) {
  const labelsPresent = new Set(examples.map((e) => e.label))
  if (examples.length === 0 || labelsPresent.size < 2) {
    throw new Error('Add examples for at least two categories before training.')
  }
  const wordCounts = {}
  const totals = {}
  const docs = {}
  const vocabulary = new Set()
  for (const { text, label } of examples) {
    wordCounts[label] ??= {}
    totals[label] ??= 0
    docs[label] = (docs[label] ?? 0) + 1
    for (const word of tokenize(text)) {
      wordCounts[label][word] = (wordCounts[label][word] ?? 0) + 1
      totals[label] += 1
      vocabulary.add(word)
    }
  }
  return { labels: [...labelsPresent], wordCounts, totals, docs, vocabulary, exampleCount: examples.length }
}

/** Returns { scores: [{label, probability}], words: [{word, known}] } sorted by probability. */
export function predictNaiveBayes(model, text) {
  const words = tokenize(text)
  const vocabSize = Math.max(1, model.vocabulary.size)
  const logScores = model.labels.map((label) => {
    let score = Math.log(model.docs[label] / model.exampleCount)
    for (const word of words) {
      score += Math.log(((model.wordCounts[label][word] ?? 0) + 1) / (model.totals[label] + vocabSize))
    }
    return score
  })
  const maxLog = Math.max(...logScores)
  const exps = logScores.map((s) => Math.exp(s - maxLog))
  const sum = exps.reduce((a, b) => a + b, 0)
  const scores = model.labels
    .map((label, i) => ({ label, probability: exps[i] / sum, logScore: logScores[i] }))
    .sort((a, b) => b.probability - a.probability)
  return { scores, words: words.map((word) => ({ word, known: model.vocabulary.has(word) })) }
}
