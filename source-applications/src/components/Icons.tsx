export function ArrowRight({ className = 'btn__arrow' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path d="M1 8h13M9 3l5 5-5 5" stroke="currentColor" strokeWidth="1.3" />
    </svg>
  );
}

export function ArrowDown({ className = '' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path d="M8 1v13M3 9l5 5 5-5" stroke="currentColor" strokeWidth="1.3" />
    </svg>
  );
}

/** Site mark: an anion and a cation orbit meeting at a resolved peak (original artwork). */
export function BrandMark({ className = 'brand__mark' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 32 32" fill="none" aria-hidden="true">
      <circle cx="11" cy="16" r="8.5" stroke="#63d3ff" strokeOpacity="0.7" />
      <circle cx="21" cy="16" r="8.5" stroke="#c39bff" strokeOpacity="0.7" />
      <path d="M8.5 20.5h3.2c1 0 1.4-.4 1.9-2 .8-2.6 1.3-7.5 2.4-7.5s1.6 4.9 2.4 7.5c.5 1.6.9 2 1.9 2h3.2" stroke="#e9eef4" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}
