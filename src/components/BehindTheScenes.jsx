import PipelineDiagram from './PipelineDiagram.jsx'

/**
 * Reusable BEHIND THE SCENES panel.
 * props: summary (plain-language, ~15 seconds), stages, activeIndex, live [{label,value}],
 * details {input, processing, model, decision, confidence, failure}, learnMore, children (extra visuals)
 */
export default function BehindTheScenes({ summary, stages, activeIndex, live = [], details = {}, learnMore, children }) {
  const questions = [
    ['What information is received?', details.input],
    ['What processing happens?', details.processing],
    ['Which model or algorithm is used?', details.model],
    ['What decision is made?', details.decision],
    ['How confident is the system?', details.confidence],
    ['What might make it fail?', details.failure],
  ].filter(([, answer]) => answer)
  return (
    <section aria-labelledby="bts-heading" className="arcade-card p-6 sm:p-8">
      <h2 id="bts-heading" className="text-2xl font-black tracking-wide text-georgian-light-blue sm:text-3xl">
        BEHIND THE SCENES
      </h2>
      {summary && <p className="mt-2 max-w-3xl text-lg text-white/90">{summary}</p>}
      <div className="mt-6 grid gap-8 lg:grid-cols-[minmax(0,320px)_1fr]">
        <PipelineDiagram stages={stages} activeIndex={activeIndex} />
        <div className="space-y-6">
          {live.length > 0 && (
            <dl className="grid grid-cols-2 gap-3 sm:grid-cols-3" aria-label="Live values">
              {live.map(({ label, value }) => (
                <div key={label} className="rounded-2xl bg-black/30 p-3">
                  <dt className="text-xs font-bold uppercase tracking-widest text-georgian-neutral">{label}</dt>
                  <dd className="break-words font-mono text-xl font-black text-georgian-yellow">{value}</dd>
                </div>
              ))}
            </dl>
          )}
          {children}
          {(questions.length > 0 || learnMore) && (
            <details className="rounded-2xl bg-black/30 p-4">
              <summary className="min-h-12 cursor-pointer py-2 text-lg font-black tracking-wide">LEARN MORE</summary>
              <dl className="mt-3 space-y-3">
                {questions.map(([question, answer]) => (
                  <div key={question}>
                    <dt className="font-bold text-georgian-light-blue">{question}</dt>
                    <dd className="text-white/90">{answer}</dd>
                  </div>
                ))}
              </dl>
              {learnMore && <p className="mt-4 text-white/90">{learnMore}</p>}
            </details>
          )}
        </div>
      </div>
    </section>
  )
}
