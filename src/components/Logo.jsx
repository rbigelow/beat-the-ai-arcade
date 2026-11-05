import { useState } from 'react'

const LOGO_URL = `${import.meta.env.BASE_URL}logo.png`

/** Shows the authorised /logo.png, or a neutral same-size placeholder if it is missing. */
export default function Logo({ className = 'h-75' }) {
  const [missing, setMissing] = useState(false)
  if (missing) {
    return (
      <div
        role="img"
        aria-label="Logo placeholder"
        className={`${className} flex items-center justify-center rounded-xl border-2 border-dashed border-georgian-neutral/60 bg-white/5 text-xs font-bold tracking-widest text-georgian-neutral`}
      >
        LOGO
      </div>
    )
  }
  return <img src={LOGO_URL} alt="Georgian College logo" className={`${className} object-contain`} onError={() => setMissing(true)} />
}
