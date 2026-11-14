interface BarucLogoProps {
  showWordmark?: boolean
  className?: string
}

export const BarucMonogram = ({ className = '' }: { className?: string }) => (
  <span
    aria-hidden="true"
    className={`relative flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-baruc-gold/40 bg-baruc-green shadow-inner sm:h-12 sm:w-12 ${className}`}
  >
    <span className="relative block h-7 w-8 font-serif font-bold leading-none text-baruc-gold sm:h-8 sm:w-9">
      <span className="absolute left-0 top-1/2 -translate-y-1/2 text-[26px] sm:text-[30px]">B</span>
      <span className="absolute right-0 top-1/2 -translate-y-1/2 text-[26px] text-baruc-goldDark sm:text-[30px]">C</span>
    </span>
  </span>
)

export const BarucLogo = ({ showWordmark = true, className = '' }: BarucLogoProps) => (
  <span className={`flex items-center gap-3 ${className}`} aria-label="BARUC - Loja Masculina" role="img">
    <BarucMonogram />
    {showWordmark && (
      <span className="flex flex-col" aria-hidden="true">
        <span className="font-serif text-2xl font-semibold leading-none tracking-[0.18em] text-baruc-gold sm:text-3xl">
          BARUC
        </span>
        <span className="mt-1 font-sans text-[9px] uppercase tracking-[0.38em] text-baruc-gold/90 sm:text-[10px]">
          <span className="font-normal">Loja </span>
          <span className="font-bold">Masculina</span>
        </span>
      </span>
    )}
  </span>
)
