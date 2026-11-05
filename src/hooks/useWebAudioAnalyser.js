import { useEffect, useRef } from 'react'

/** Runs requestAnimationFrame while an AnalyserNode is available and passes real time/frequency data to onFrame. */
export function useWebAudioAnalyser(analyser, onFrame) {
  const frameCallback = useRef(onFrame)
  useEffect(() => {
    frameCallback.current = onFrame
  }, [onFrame])

  useEffect(() => {
    if (!analyser) return undefined
    const timeData = new Float32Array(analyser.fftSize)
    const freqData = new Uint8Array(analyser.frequencyBinCount)
    let handle = 0
    const loop = () => {
      analyser.getFloatTimeDomainData(timeData)
      analyser.getByteFrequencyData(freqData)
      frameCallback.current?.({ timeData, freqData })
      handle = requestAnimationFrame(loop)
    }
    handle = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(handle)
  }, [analyser])
}
