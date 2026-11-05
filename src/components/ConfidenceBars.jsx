/** Horizontal probability bars. `probability` is 0..1. */
export default function ConfidenceBars({ items, highlightId, label = 'Prediction probabilities' }) {
  return (
    <ul className="space-y-2" aria-label={label}>
      {items.map((item) => {
        const percent = Math.round(item.probability * 1000) / 10
        const highlighted = item.id === highlightId
        return (
          <li key={item.id}>
            <div className="flex justify-between text-base font-bold">
              <span>
                {item.emoji && <span aria-hidden="true">{item.emoji} </span>}
                {item.label}
                {highlighted && ' ◀'}
              </span>
              <span className="font-mono">{percent.toFixed(1)}%</span>
            </div>
            <div className="h-4 overflow-hidden rounded-full bg-white/10" role="progressbar" aria-label={item.label} aria-valuenow={Math.round(percent)} aria-valuemin={0} aria-valuemax={100}>
              <div
                className={`h-full rounded-full transition-all duration-300 ${highlighted ? 'bg-georgian-green' : 'bg-georgian-teal'}`}
                style={{ width: `${percent}%` }}
              />
            </div>
          </li>
        )
      })}
    </ul>
  )
}
