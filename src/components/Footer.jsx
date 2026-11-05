import Logo from './Logo.jsx'

// Set VITE_PROGRAM_URL (e.g. in .env.local) to an authorised program URL; none is invented here.
const PROGRAM_URL = import.meta.env.VITE_PROGRAM_URL

export default function Footer() {
  return (
    <footer className="mt-16 flex flex-col items-center gap-5 border-t border-white/15 pt-10 text-center">

    
      {PROGRAM_URL && <a className="text-georgian-light-blue underline" href={PROGRAM_URL}>{PROGRAM_URL}</a>}
    </footer>
  )
}
