import { useMemo, useState } from 'react'
import GameHeader from '../components/GameHeader.jsx'
import GameComplete from '../components/GameComplete.jsx'
import BehindTheScenes from '../components/BehindTheScenes.jsx'
import { CYBER_ROUNDS } from '../data/cyberData.js'
import { analyzeMessage, RISK_THRESHOLD } from '../ai/securitySignals.js'
import { playSfx } from '../utils/sfx.js'

const TOTAL = CYBER_ROUNDS.length

export default function CyberDetective({ game, onBack, onScore }) {
  const [round, setRound] = useState(0)
  const [answer, setAnswer] = useState(null)
  const [score, setScore] = useState(0)
  const [finished, setFinished] = useState(false)

  const message = CYBER_ROUNDS[round]
  const analysis = useMemo(() => analyzeMessage(message), [message])
  const correct = answer && (answer === 'phishing') === message.isPhishing

  const choose = (value) => {
    if (answer) return
    setAnswer(value)
    const isRight = (value === 'phishing') === message.isPhishing
    playSfx(isRight ? 'correct' : 'incorrect')
    if (isRight) setScore((s) => s + 1)
  }

  const next = () => {
    if (round + 1 >= TOTAL) {
      setFinished(true)
      onScore?.(score, TOTAL)
    } else {
      setRound(round + 1)
      setAnswer(null)
    }
  }

  const restart = () => {
    setRound(0)
    setAnswer(null)
    setScore(0)
    setFinished(false)
  }

  const stages = [
    { label: 'MESSAGE', detail: 'Sender, subject and body text', value: answer ? 'Received' : '' },
    { label: 'SECURITY SIGNALS', detail: 'Pattern rules look for warning signs', value: answer ? `${analysis.signals.length} found` : '' },
    { label: 'RISK SCORE', detail: `Rule weights add up. Phishing if ≥ ${RISK_THRESHOLD}`, value: answer ? `${analysis.riskScore} / 100` : '' },
    { label: 'CLASSIFICATION', detail: 'Compared with the threshold', value: answer ? analysis.classification.toUpperCase() : '' },
  ]

  return (
    <div className="space-y-8">
      <GameHeader game={game} onBack={onBack} badge={{ kind: 'demo', title: 'RULE-BASED DEMO', detail: 'Hand-written rules, not a trained model' }} />
      {finished ? (
        <GameComplete title="CASE CLOSED" score={score} outOf={TOTAL} onPlayAgain={restart} onBack={onBack}>
          <p>Real security tools combine rules like these with trained models. Always check the sender and never share passwords by message.</p>
        </GameComplete>
      ) : (
        <section className="arcade-card p-6 sm:p-8" aria-live="polite">
          <div className="flex justify-between text-xl font-black">
            <p>Message {round + 1} / {TOTAL}</p>
            <p className="text-georgian-yellow">Score: {score}</p>
          </div>
          <article className="mt-4 rounded-3xl bg-white p-6 text-georgian-dark-grey">
            <p className="text-sm"><strong>From:</strong> {message.from}</p>
            <p className="mt-1 text-xl font-black">{message.subject}</p>
            <p className="mt-3 text-lg">{message.body}</p>
            <p className="mt-3 text-xs text-georgian-dark-grey/70">Fictional message created for this exhibit. Links do not work.</p>
          </article>
          <div className="mt-6 flex flex-wrap gap-4">
            <button type="button" className="btn btn-danger" disabled={!!answer} onClick={() => choose('phishing')}>🚨 PHISHING</button>
            <button type="button" className="btn btn-primary" disabled={!!answer} onClick={() => choose('legitimate')}>✓ LEGITIMATE</button>
          </div>
          {answer && (
            <div className="mt-6 rounded-3xl bg-black/30 p-6">
              <p className={`text-3xl font-black ${correct ? 'text-georgian-green' : 'text-georgian-orange'}`}>{correct ? '✓ CORRECT!' : '✗ NOT THIS TIME'}</p>
              <p className="mt-1 text-lg">This message was <strong>{message.isPhishing ? 'PHISHING' : 'LEGITIMATE'}</strong>. The rule-based demo scored it {analysis.riskScore}/100 → {analysis.classification.toUpperCase()}.</p>
              {analysis.signals.length > 0 ? (
                <ul className="mt-3 space-y-1 text-lg">
                  {analysis.signals.map((s) => <li key={s.id}>⚠ {s.label}</li>)}
                </ul>
              ) : (
                <p className="mt-3 text-lg">No warning signals were found.</p>
              )}
              <button type="button" className="btn btn-primary mt-4" onClick={next}>{round + 1 >= TOTAL ? 'SEE RESULTS' : 'NEXT MESSAGE'}</button>
            </div>
          )}
        </section>
      )}
      <BehindTheScenes
        summary="The demo scans the message for warning signs, adds up a risk score from fixed rule weights, and compares it with a threshold."
        stages={stages}
        activeIndex={answer ? 3 : 0}
        live={[
          { label: 'Signals found', value: answer ? analysis.signals.length : '—' },
          { label: 'Risk score', value: answer ? analysis.riskScore : '—' },
          { label: 'Threshold', value: RISK_THRESHOLD },
        ]}
        details={{
          input: 'The sender, subject and body of one fictional message.',
          processing: 'Regular-expression rules look for urgency, credential requests, suspicious links, too-good-to-be-true offers and excessive punctuation.',
          model: 'A rule-based scoring system with fixed weights. It does not learn and is not a machine-learning model.',
          decision: 'If the total risk score reaches the threshold the message is classed as phishing.',
          confidence: 'The risk score (0–100) shows how many warning signs were found. It is not a probability.',
          failure: 'Clever attackers avoid trigger words, and genuine urgent emails can trigger rules (false alarms).',
        }}
      />
    </div>
  )
}
