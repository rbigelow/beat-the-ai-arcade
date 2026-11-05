import { AlertTriangle } from 'lucide-react'

/** Friendly error: what happened, how to fix it, retry/back. */
export default function ErrorPanel({ what, fix, onRetry, onBack }) {
  return (
    <div role="alert" className="arcade-card mx-auto max-w-2xl border-georgian-orange p-8 text-center">
      <AlertTriangle aria-hidden="true" className="mx-auto text-georgian-orange" size={56} />
      <h2 className="mt-3 text-2xl font-black">SOMETHING WENT WRONG</h2>
      <p className="mt-4 text-lg"><strong>What happened:</strong> {what}</p>
      <p className="mt-2 text-lg"><strong>How to fix it:</strong> {fix}</p>
      <div className="mt-6 flex flex-wrap justify-center gap-4">
        {onRetry && <button type="button" className="btn btn-primary" onClick={onRetry}>RETRY</button>}
        {onBack && <button type="button" className="btn btn-blue" onClick={onBack}>BACK TO ARCADE</button>}
      </div>
    </div>
  )
}
