export function IconSliders() {
  return (
    <svg width="40" height="40" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M4 15h4v2H4v-2zm0-8h8v2H4V7zm0 4h12v2H4v-2zm16 5v2H4v-2h16z" fill="currentColor" />
    </svg>
  );
}

export function IconOneDPicker() {
  return (
    <svg width="40" height="40" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M5,10 L12,10 L12,14 L5,14 Q3,14 3,12 Q3,10 5,10 Z" fill="white" />
      <path d="M12,10 L19,10 Q21,10 21,12 Q21,14 19,14 L12,14 Z" fill="currentColor" />
      <rect
        x="3"
        y="10"
        width="18"
        height="4"
        rx="2"
        stroke="currentColor"
        strokeWidth="1.5"
        fill="none"
      />
      <line
        x1="12"
        y1="7"
        x2="12"
        y2="17"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function IconCIE() {
  return (
    <svg width="40" height="40" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M6,21 Q2,10 4,4 Q8,2 12,6 Q17,9 20,15"
        stroke="currentColor"
        strokeWidth="1.5"
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <line
        x1="6"
        y1="21"
        x2="20"
        y2="15"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <polygon points="18,14 10,8 6,20" stroke="currentColor" strokeWidth="0.8" fill="none" />
      <circle cx="11" cy="14" r="1.5" fill="currentColor" />
    </svg>
  );
}

export function IconPalette() {
  return (
    <svg width="40" height="40" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M12 3c-4.97 0-9 4.03-9 9s4.03 9 9 9c.83 0 1.5-.67 1.5-1.5 0-.39-.15-.74-.39-1.01-.23-.26-.38-.61-.38-.99 0-.83.67-1.5 1.5-1.5H16c2.76 0 5-2.24 5-5 0-4.42-4.03-8-9-8zm-5.5 9c-.83 0-1.5-.67-1.5-1.5S5.67 9 6.5 9s1.5.67 1.5 1.5S7.33 12 6.5 12zm3-4C8.67 8 8 7.33 8 6.5S8.67 5 9.5 5s1.5.67 1.5 1.5S10.33 8 9.5 8zm5 0c-.83 0-1.5-.67-1.5-1.5S13.67 5 14.5 5s1.5.67 1.5 1.5S15.33 8 14.5 8zm3 4c-.83 0-1.5-.67-1.5-1.5S16.67 9 17.5 9s1.5.67 1.5 1.5-.67 1.5-1.5 1.5z"
        fill="currentColor"
      />
    </svg>
  );
}

export function IconHarmony() {
  return (
    <svg width="40" height="40" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"
        fill="currentColor"
      />
    </svg>
  );
}

export function IconHistory() {
  return (
    <svg width="40" height="40" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M13 3a9 9 0 0 0-9 9H1l3.89 3.89.07.14L9 12H6c0-3.87 3.13-7 7-7s7 3.13 7 7-3.13 7-7 7c-1.93 0-3.68-.79-4.94-2.06l-1.42 1.42A8.954 8.954 0 0 0 13 21a9 9 0 0 0 0-18zm-1 5v5l4.28 2.54.72-1.21-3.5-2.08V8H12z"
        fill="currentColor"
      />
    </svg>
  );
}

export function IconLabLch() {
  return (
    <svg width="40" height="40" viewBox="0 0 24 24" fill="none" aria-hidden>
      {/* L* axis — vertical */}
      <line x1="12" y1="3" x2="12" y2="13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <polyline points="10,5.5 12,3 14,5.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      {/* a* axis — horizontal */}
      <line x1="12" y1="13" x2="21" y2="13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <polyline points="18.5,11 21,13 18.5,15" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      {/* b* axis — diagonal */}
      <line x1="12" y1="13" x2="5" y2="20" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <polyline points="4.5,17.5 5,20 7.5,19.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      {/* Origin */}
      <circle cx="12" cy="13" r="2" fill="currentColor" />
    </svg>
  );
}

export function IconOkLab() {
  return (
    <svg width="40" height="40" viewBox="0 0 24 24" fill="none" aria-hidden>
      {/* L axis — vertical */}
      <line x1="12" y1="3" x2="12" y2="13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <polyline points="10,5.5 12,3 14,5.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      {/* a axis — horizontal */}
      <line x1="12" y1="13" x2="21" y2="13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <polyline points="18.5,11 21,13 18.5,15" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      {/* b axis — diagonal */}
      <line x1="12" y1="13" x2="5" y2="20" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <polyline points="4.5,17.5 5,20 7.5,19.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      {/* Origin dot — filled circle to distinguish from IconLabLch */}
      <circle cx="12" cy="13" r="2" fill="currentColor" />
      {/* "Ok" label — small arc to suggest "Ok" branding */}
      <path d="M15 6 Q18 3 21 6" stroke="currentColor" strokeWidth="1.2" fill="none" strokeLinecap="round" />
    </svg>
  );
}

export function IconSearch() {
  return (
    <svg width="40" height="40" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M15.5 14h-.79l-.28-.27A6.471 6.471 0 0 0 16 9.5 6.5 6.5 0 1 0 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"
        fill="currentColor"
      />
    </svg>
  );
}
