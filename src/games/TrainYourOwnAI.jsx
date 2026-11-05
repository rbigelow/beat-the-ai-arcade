import { useEffect, useRef, useState } from 'react'
import GameHeader from '../components/GameHeader.jsx'
import BehindTheScenes from '../components/BehindTheScenes.jsx'
import ConfidenceBars from '../components/ConfidenceBars.jsx'
import { CATEGORIES, predictNaiveBayes, trainNaiveBayes } from '../ai/textClassifier.js'
import { playSfx } from '../utils/sfx.js'

const STARTERS = [
  ['I love this, it is wonderful', 'positive'],
  ['What a great and happy day', 'positive'],
  ['The meeting is at noon', 'neutral'],
  ['The bus arrives at the station', 'neutral'],
  ['This is terrible and I hate it', 'negative'],
  ['What an awful, angry mess', 'negative'],
]

export default function TrainYourOwnAI({ game, onBack }) {
  const [examples, setExamples] = useState([])
  const [text, setText] = useState('')
  const [label, setLabel] = useState('positive')
  const [model, setModel] = useState(null)
  const [progress, setProgress] = useState(null)
  const [testText, setTestText] = useState('')
  const [prediction, setPrediction] = useState(null)
  const [message, setMessage] = useState('')
  const timer = useRef(null)

  useEffect(() => () => clearInterval(timer.current), [])

  const addExample = (event) => {
    event.preventDefault()
    if (!text.trim()) {
      setMessage('Type a sentence first, then choose a label.')
      return
    }
    playSfx('button')
    setExamples((list) => [...list, { text: text.trim(), label }])
    setText('')
    setMessage('')
    setModel(null)
    setPrediction(null)
  }

  const addStarters = () => {
    setExamples((list) => [...list, ...STARTERS.map(([t, l]) => ({ text: t, label: l }))])
    setModel(null)
    setPrediction(null)
  }

  const reset = () => {
    clearInterval(timer.current)
    setExamples([])
    setModel(null)
    setProgress(null)
    setPrediction(null)
    setMessage('')
  }

  const train = () => {
    try {
      const trained = trainNaiveBayes(examples)
      setMessage('')
      setPrediction(null)
      setModel(null)
      let seen = 0
      setProgress({ seen: 0, total: examples.length })
      clearInterval(timer.current)
      timer.current = setInterval(() => {
        seen += 1
        setProgress({ seen, total: examples.length })
        if (seen >= examples.length) {
          clearInterval(timer.current)
          setModel(trained)
          playSfx('correct')
        }
      }, Math.max(60, Math.min(250, 2000 / examples.length)))
    } catch (err) {
      setMessage(err.message)
    }
  }

  const test = (event) => {
    event.preventDefault()
    if (!model) return
    if (!testText.trim()) {
      setMessage('Type a new sentence to test.')
      return
    }
    setMessage('')
    setPrediction(predictNaiveBayes(model, testText))
  }

  const training = progress && !model && progress.seen < progress.total
  const counts = Object.fromEntries(CATEGORIES.map((c) => [c.id, examples.filter((e) => e.label === c.id).length]))
  const top = prediction?.scores[0]
  const stageIndex = prediction ? 4 : model ? 3 : training ? 2 : examples.length ? 1 : 0
  const categoryOf = (id) => CATEGORIES.find((c) => c.id === id)

  const stages = [
    { label: 'TRAINING DATA', detail: 'Sentences you typed', value: `${examples.length} examples` },
    { label: 'LABELS', detail: 'The category you chose for each', value: CATEGORIES.map((c) => `${c.emoji}${counts[c.id]}`).join(' ') },
    { label: 'FEATURES', detail: 'Words counted per category', value: model ? `${model.vocabulary.size} unique words` : '' },
    { label: 'CATEGORY SCORES', detail: 'Word-count probabilities multiplied together', value: top ? prediction.scores.map((s) => `${s.label}: ${s.logScore.toFixed(1)}`).join(' | ') : '' },
    { label: 'PREDICTION', detail: 'The highest scoring category', value: top ? `${categoryOf(top.label).emoji} ${categoryOf(top.label).label}` : '' },
  ]

  return (
    <div className="space-y-8">
      <GameHeader game={game} onBack={onBack} badge={{ kind: 'demo', title: 'EDUCATIONAL CLASSIFIER', detail: 'Naive Bayes word counting. Not a neural network.' }} />
      <div className="grid gap-6 lg:grid-cols-2">
        <section className="arcade-card p-6 sm:p-8">
          <h2 className="text-2xl font-black">1. ADD TRAINING EXAMPLES</h2>
          <form onSubmit={addExample} className="mt-4 space-y-4">
            <label className="block text-lg font-bold" htmlFor="train-text">Example sentence</label>
            <input id="train-text" value={text} onChange={(e) => setText(e.target.value)} className="min-h-14 w-full rounded-2xl bg-white px-4 text-lg text-black" placeholder="e.g. This pizza is delicious" />
            <fieldset>
              <legend className="mb-2 text-lg font-bold">Label</legend>
              <div className="flex flex-wrap gap-3">
                {CATEGORIES.map((c) => (
                  <label key={c.id} className={`flex min-h-14 cursor-pointer items-center gap-2 rounded-full border-2 px-5 text-lg font-bold ${label === c.id ? 'border-georgian-yellow bg-georgian-yellow/15' : 'border-white/30'}`}>
                    <input type="radio" name="label" value={c.id} checked={label === c.id} onChange={() => setLabel(c.id)} className="h-5 w-5" />
                    <span aria-hidden="true">{c.emoji}</span> {c.label}
                  </label>
                ))}
              </div>
            </fieldset>
            <div className="flex flex-wrap gap-3">
              <button type="submit" className="btn btn-blue">ADD EXAMPLE</button>
              <button type="button" className="btn btn-ghost" onClick={addStarters}>ADD STARTER EXAMPLES</button>
              <button type="button" className="btn btn-ghost" onClick={reset}>RESET</button>
            </div>
          </form>
          <ul className="mt-5 max-h-56 space-y-2 overflow-auto" aria-label="Training examples">
            {examples.map((e, i) => (
              <li key={i} className="rounded-xl bg-black/30 px-4 py-2">{categoryOf(e.label).emoji} {e.text}</li>
            ))}
            {examples.length === 0 && <li className="text-georgian-neutral">No examples yet. Add at least two categories.</li>}
          </ul>
        </section>

        <section className="arcade-card p-6 sm:p-8">
          <h2 className="text-2xl font-black">2. TRAIN</h2>
          <button type="button" className="btn btn-primary mt-4" onClick={train} disabled={training || examples.length === 0}>TRAIN THE AI</button>
          {progress && (
            <div className="mt-4" role="status" aria-live="polite">
              <div className="h-5 overflow-hidden rounded-full bg-white/10" role="progressbar" aria-label="Training progress" aria-valuemin={0} aria-valuemax={progress.total} aria-valuenow={progress.seen}>
                <div className="h-full bg-georgian-green transition-all duration-200" style={{ width: `${(progress.seen / progress.total) * 100}%` }} />
              </div>
              <p className="mt-2">{training ? `Learning from example ${progress.seen} of ${progress.total}...` : `Trained on ${progress.total} examples. Vocabulary: ${model?.vocabulary.size} words.`}</p>
            </div>
          )}
          <h2 className="mt-8 text-2xl font-black">3. TEST A NEW SENTENCE</h2>
          <form onSubmit={test} className="mt-4 space-y-4">
            <label className="block text-lg font-bold" htmlFor="test-text">New sentence</label>
            <input id="test-text" value={testText} onChange={(e) => setTestText(e.target.value)} disabled={!model} className="min-h-14 w-full rounded-2xl bg-white px-4 text-lg text-black disabled:opacity-50" placeholder={model ? 'Type something new' : 'Train the AI first'} />
            <button type="submit" className="btn btn-blue" disabled={!model}>PREDICT</button>
          </form>
          {message && <p role="alert" className="mt-3 font-bold text-georgian-orange">{message}</p>}
          {prediction && (
            <div className="mt-5" aria-live="polite">
              <p className="text-2xl font-black">AI THINKS: {categoryOf(top.label).emoji} {categoryOf(top.label).label} ({(top.probability * 100).toFixed(0)}%)</p>
              <div className="mt-3">
                <ConfidenceBars items={prediction.scores.map((s) => ({ id: s.label, label: categoryOf(s.label).label, emoji: categoryOf(s.label).emoji, probability: s.probability }))} highlightId={top.label} />
              </div>
              {prediction.words.some((w) => !w.known) && <p className="mt-2 text-georgian-yellow">Words the AI never saw in training are ignored: {prediction.words.filter((w) => !w.known).map((w) => w.word).join(', ')}</p>}
            </div>
          )}
        </section>
      </div>
      <BehindTheScenes
        summary="The classifier counts which words appeared in each category, then scores your new sentence by how well its words match each category."
        stages={stages}
        activeIndex={stageIndex}
        live={[
          { label: 'Examples', value: examples.length },
          { label: 'Unique words', value: model ? model.vocabulary.size : '—' },
          { label: 'Top confidence', value: top ? `${(top.probability * 100).toFixed(0)}%` : '—' },
        ]}
        details={{
          input: 'Sentences and labels that you provide.',
          processing: 'Text is lower-cased and split into words, then words are counted for each category.',
          model: 'Multinomial Naive Bayes with add-one smoothing. It is a real (simple) machine-learning method, trained in your browser, and not a neural network.',
          decision: 'The category with the highest combined score wins.',
          confidence: 'The scores are converted into percentages. With very few examples they can be overconfident.',
          failure: 'It ignores word order and meaning ("not good" looks like "good"), and cannot judge words it never saw.',
        }}
      />
    </div>
  )
}
