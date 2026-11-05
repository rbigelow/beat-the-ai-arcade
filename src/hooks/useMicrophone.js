import { useCallback, useEffect, useRef, useState } from 'react'
import { resampleTo } from '../ai/audioFeatures.js'

const WORKLET_SOURCE = `
class CaptureProcessor extends AudioWorkletProcessor {
  process(inputs) {
    const channel = inputs[0] && inputs[0][0]
    if (channel) this.port.postMessage(channel.slice())
    return true
  }
}
registerProcessor('capture-processor', CaptureProcessor)
`
const BUFFER_SECONDS = 3

/**
 * Microphone access + live capture. Audio stays in memory only (a short ring buffer) and
 * everything (tracks, nodes, AudioContext) is released by stop() and on unmount.
 */
export function useMicrophone() {
  const [status, setStatus] = useState('idle')
  const [error, setError] = useState(null)
  const [analyser, setAnalyser] = useState(null)
  const resources = useRef({ stream: null, context: null, nodes: [], ring: null, writeIndex: 0, rate: 48000 })

  const stop = useCallback(() => {
    const r = resources.current
    r.stream?.getTracks().forEach((track) => track.stop())
    r.nodes.forEach((node) => {
      try {
        node.disconnect()
        if (node.port) node.port.onmessage = null
      } catch {
        // already disconnected
      }
    })
    r.context?.close().catch(() => {})
    resources.current = { stream: null, context: null, nodes: [], ring: null, writeIndex: 0, rate: 48000 }
    setAnalyser(null)
    setStatus('idle')
  }, [])

  const start = useCallback(async () => {
    setError(null)
    if (!navigator.mediaDevices?.getUserMedia || !(window.AudioContext || window.webkitAudioContext)) {
      setError({ what: 'This browser does not support microphone audio.', fix: 'Try a recent version of Chrome, Edge, Firefox or Safari, or use Sample Sound Mode.' })
      setStatus('error')
      return false
    }
    setStatus('requesting')
    let stream
    try {
      stream = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: false, noiseSuppression: false, autoGainControl: false },
      })
    } catch (err) {
      const denied = err?.name === 'NotAllowedError' || err?.name === 'SecurityError'
      setError({
        what: denied ? 'Microphone permission was denied.' : 'No microphone could be opened.',
        fix: denied ? 'Allow microphone access in the browser address bar, then press Retry. Or use Sample Sound Mode.' : 'Connect a microphone and press Retry, or use Sample Sound Mode.',
      })
      setStatus('error')
      return false
    }
    try {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext
      const context = new AudioContextClass()
      await context.resume()
      const source = context.createMediaStreamSource(stream)
      const analyserNode = context.createAnalyser()
      analyserNode.fftSize = 2048
      source.connect(analyserNode)
      const nodes = [source, analyserNode]
      const ring = new Float32Array(Math.floor(context.sampleRate * BUFFER_SECONDS))
      resources.current = { stream, context, nodes, ring, writeIndex: 0, rate: context.sampleRate }
      if (!context.audioWorklet) throw new Error('AudioWorklet unsupported')
      const url = URL.createObjectURL(new Blob([WORKLET_SOURCE], { type: 'application/javascript' }))
      try {
        await context.audioWorklet.addModule(url)
      } finally {
        URL.revokeObjectURL(url)
      }
      const worklet = new AudioWorkletNode(context, 'capture-processor')
      worklet.port.onmessage = (event) => {
        const r = resources.current
        if (!r.ring) return
        const block = event.data
        for (let i = 0; i < block.length; i += 1) {
          r.ring[r.writeIndex] = block[i]
          r.writeIndex = (r.writeIndex + 1) % r.ring.length
        }
      }
      source.connect(worklet)
      nodes.push(worklet)
      setAnalyser(analyserNode)
      setStatus('listening')
      return true
    } catch {
      stream.getTracks().forEach((track) => track.stop())
      resources.current.context?.close().catch(() => {})
      resources.current = { stream: null, context: null, nodes: [], ring: null, writeIndex: 0, rate: 48000 }
      setError({ what: 'The microphone started but audio could not be processed.', fix: 'Reload the page with a recent browser, or use Sample Sound Mode.' })
      setStatus('error')
      return false
    }
  }, [])

  /** The most recent `seconds` of audio, resampled to the model rate. */
  const getRecentSamples = useCallback((seconds, targetRate) => {
    const r = resources.current
    if (!r.ring) return new Float32Array(0)
    const count = Math.min(r.ring.length, Math.floor(seconds * r.rate))
    const out = new Float32Array(count)
    for (let i = 0; i < count; i += 1) {
      out[i] = r.ring[(r.writeIndex - count + i + r.ring.length * 2) % r.ring.length]
    }
    return targetRate ? resampleTo(out, r.rate, targetRate) : out
  }, [])

  useEffect(() => stop, [stop])

  return { status, error, analyser, start, stop, getRecentSamples }
}
