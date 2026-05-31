/** Cannabis-leaf SVG. Pure decoration — themable via currentColor. */
export function LeafIcon({ size = 24, className }: { size?: number; className?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden
    >
      <path d="M32 60 V36" />
      {/* center top leaf */}
      <path
        d="M32 36 C30 28 31 18 32 6 C33 18 34 28 32 36 Z"
        fill="currentColor"
        fillOpacity="0.18"
      />
      {/* upper side leaves */}
      <path
        d="M32 34 C24 30 16 22 8 14 C18 18 26 24 32 34 Z"
        fill="currentColor"
        fillOpacity="0.18"
      />
      <path
        d="M32 34 C40 30 48 22 56 14 C46 18 38 24 32 34 Z"
        fill="currentColor"
        fillOpacity="0.18"
      />
      {/* mid leaves */}
      <path
        d="M32 38 C22 38 12 34 4 28 C14 34 24 38 32 40 Z"
        fill="currentColor"
        fillOpacity="0.14"
      />
      <path
        d="M32 38 C42 38 52 34 60 28 C50 34 40 38 32 40 Z"
        fill="currentColor"
        fillOpacity="0.14"
      />
      {/* lower leaves */}
      <path
        d="M32 42 C26 44 18 48 12 52 C20 48 28 46 32 44 Z"
        fill="currentColor"
        fillOpacity="0.14"
      />
      <path
        d="M32 42 C38 44 46 48 52 52 C44 48 36 46 32 44 Z"
        fill="currentColor"
        fillOpacity="0.14"
      />
    </svg>
  );
}
