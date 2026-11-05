import { useEffect, useRef } from 'react'

export default function IdleReset({ secondsLeft, onStay }) {
  const buttonRef = useRef(null)
  useEffect(() => {
    buttonRef.current?.focus()
  }, [])
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-6" role="alertdialog" aria-modal="true" aria-labelledby="idle-title" aria-describedby="idle-desc">
      <div className="arcade-card max-w-xl p-10 text-center">
        <h2 id="idle-title" className="text-4xl font-black text-georgian-yellow">STILL THERE?</h2>
        <p id="idle-desc" className="mt-4 text-xl">Returning to the Arcade in {secondsLeft} seconds...</p>
        <button ref={buttonRef} type="button" className="btn btn-primary mt-8 text-2xl" onClick={onStay}>I&apos;M STILL HERE</button>
      </div>
    </div>
  )
}
