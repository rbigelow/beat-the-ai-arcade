import Logo from './Logo.jsx'

export default function ArcadeHeader({ children, compact = false }) {
  return (
    <header className="flex flex-wrap items-center justify-between gap-4">
      <div className="basis-full flex justify-center">
        <Logo />
      </div>
      <div className="flex items-center gap-5">

      </div> <div>
          <p className={`font-black tracking-wide text-white ${compact ? 'text-xl' : 'text-2xl sm:text-3xl'}`}>BEAT THE AI ARCADE</p>
          <p className="text-base text-georgian-light-blue">Can you beat the AI?</p>
      <p className="text-base text-georgian-light-blue">Learn how these technologies work in Applied AI.</p>
      <p className="text-base text-georgian-light-blue">
            Discover how AI sees, learns, searches, listens, predicts and sometimes gets things wrong.
          </p>
        </div>
      {children && <div className="flex flex-wrap items-center gap-3">{children}</div>}
    </header>
  )
}
