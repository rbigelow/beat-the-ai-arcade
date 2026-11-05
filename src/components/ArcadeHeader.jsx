import Logo from './Logo.jsx'

export default function ArcadeHeader({ children, compact = false }) {
  return (
    <header className="flex flex-wrap items-center justify-between gap-4">
      <div className="flex items-center gap-5">
        <Logo />
        <div>
          <p className={`font-black tracking-wide text-white ${compact ? 'text-xl' : 'text-2xl sm:text-3xl'}`}>BEAT THE AI ARCADE</p>
          <p className="text-base text-georgian-light-blue">Can you beat the AI?</p>
        </div>
      </div>
      {children && <div className="flex flex-wrap items-center gap-3">{children}</div>}
    </header>
  )
}
