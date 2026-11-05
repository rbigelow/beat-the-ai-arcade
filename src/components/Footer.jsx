import Logo from './Logo.jsx'

// Set VITE_PROGRAM_URL (e.g. in .env.local) to an authorised program URL; none is invented here.
const PROGRAM_URL = import.meta.env.VITE_PROGRAM_URL

export default function Footer() {
  return (
    <footer className="mt-16 flex flex-col items-center gap-5 border-t border-white/15 pt-10 text-center">
      <Logo />
      <p className="text-2xl font-black tracking-wide">CAN YOU BEAT THE AI?</p>
      <p className="max-w-xl text-lg text-georgian-neutral">Learn how the technology behind these challenges works in Applied AI.</p>
      <div className="flex h-36 w-36 items-center justify-center rounded-2xl border-2 border-dashed border-georgian-neutral/60 p-3 text-center text-xs font-bold tracking-widest text-georgian-neutral" role="img" aria-label="Program QR code placeholder">
        PROGRAM QR CODE PLACEHOLDER
      </div>
      {PROGRAM_URL && <a className="text-georgian-light-blue underline" href={PROGRAM_URL}>{PROGRAM_URL}</a>}
    </footer>
  )
}
