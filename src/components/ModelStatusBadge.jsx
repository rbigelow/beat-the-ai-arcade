const KINDS = {
  live: { icon: '●', style: 'border-georgian-green bg-georgian-green/15 text-georgian-green' },
  sim: { icon: '↻', style: 'border-georgian-light-blue bg-georgian-light-blue/15 text-georgian-light-blue' },
  algo: { icon: '◆', style: 'border-georgian-light-blue bg-georgian-teal/25 text-georgian-light-blue' },
  demo: { icon: '⚠', style: 'border-georgian-yellow bg-georgian-yellow/15 text-georgian-yellow' },
  info: { icon: 'ℹ', style: 'border-georgian-neutral bg-white/10 text-white' },
}

/** Transparency label: what kind of technology is really running. */
export default function ModelStatusBadge({ kind = 'info', title, detail }) {
  const { icon, style } = KINDS[kind]
  return (
    <div role="status" className={`rounded-2xl border-2 px-5 py-3 ${style}`}>
      <p className="text-sm font-black tracking-widest">
        <span aria-hidden="true">{icon}</span> {title}
      </p>
      {detail && <p className="text-base font-semibold text-white">{detail}</p>}
    </div>
  )
}
