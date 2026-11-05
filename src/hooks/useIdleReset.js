import { useCallback, useEffect, useRef, useState } from 'react'

const ACTIVITY_EVENTS = ['pointerdown', 'pointermove', 'mousemove', 'touchstart', 'keydown', 'wheel']

/**
 * After `idleMs` of no activity, shows a warning for `warnSeconds`, then calls onTimeout.
 */
export function useIdleReset({ enabled, idleMs = 90000, warnSeconds = 10, onTimeout }) {
  const [secondsLeft, setSecondsLeft] = useState(null)
  const lastActivity = useRef(0)
  const timeoutRef = useRef(onTimeout)

  useEffect(() => {
    timeoutRef.current = onTimeout
  }, [onTimeout])

  const stay = useCallback(() => {
    lastActivity.current = Date.now()
    document.body.dataset.idleWarning = 'false'
    setSecondsLeft(null)
  }, [])

  useEffect(() => {
    if (!enabled) return undefined
    lastActivity.current = Date.now()
    const onActivity = () => {
      // While the warning is showing, only the explicit button dismisses it.
      if (document.body.dataset.idleWarning !== 'true') lastActivity.current = Date.now()
    }
    ACTIVITY_EVENTS.forEach((name) => window.addEventListener(name, onActivity, { passive: true }))
    const timer = setInterval(() => {
      const idleFor = Date.now() - lastActivity.current
      if (idleFor >= idleMs + warnSeconds * 1000) {
        document.body.dataset.idleWarning = 'false'
        lastActivity.current = Date.now()
        setSecondsLeft(null)
        timeoutRef.current?.()
      } else if (idleFor >= idleMs) {
        document.body.dataset.idleWarning = 'true'
        setSecondsLeft(Math.max(1, Math.ceil((idleMs + warnSeconds * 1000 - idleFor) / 1000)))
      }
    }, 500)
    return () => {
      clearInterval(timer)
      document.body.dataset.idleWarning = 'false'
      ACTIVITY_EVENTS.forEach((name) => window.removeEventListener(name, onActivity))
    }
  }, [enabled, idleMs, warnSeconds])

  return { warning: enabled && secondsLeft !== null, secondsLeft, stay }
}
