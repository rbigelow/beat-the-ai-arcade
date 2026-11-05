import { ShieldCheck } from 'lucide-react'

/** Privacy explanation shown BEFORE a camera/microphone permission request. */
export default function PrivacyGate({ device, message, buttonLabel, onContinue, secondary }) {
  return (
    <div className="arcade-card mx-auto max-w-2xl p-8 text-center">
      <ShieldCheck aria-hidden="true" className="mx-auto text-georgian-green" size={56} />
      <h2 className="mt-3 text-2xl font-black">PRIVACY FIRST: {device.toUpperCase()}</h2>
      <p className="mt-3 text-lg">{message}</p>
      <div className="mt-6 flex flex-wrap justify-center gap-4">
        <button type="button" className="btn btn-primary" onClick={onContinue}>{buttonLabel}</button>
        {secondary}
      </div>
    </div>
  )
}
