/**
 * Logo component — inline SVG so it scales sharply at any size.
 * variant: "default" (rounded square w/ gradient), "flat" (transparent bg)
 */
export default function Logo({ size = 36, className = '', variant = 'default' }) {
  const uid = `lg-${variant}-${size}`;
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 64 64"
      width={size}
      height={size}
      className={className}
      role="img"
      aria-label="منصة السيارات المفقودة"
    >
      <defs>
        <linearGradient id={`${uid}-bg`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#3b82f6" />
          <stop offset="55%" stopColor="#2563eb" />
          <stop offset="100%" stopColor="#1e3a8a" />
        </linearGradient>
        <linearGradient id={`${uid}-glass`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#fde68a" />
          <stop offset="100%" stopColor="#f59e0b" />
        </linearGradient>
        <linearGradient id={`${uid}-shine`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.35" />
          <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
        </linearGradient>
      </defs>

      {variant === 'default' && (
        <>
          {/* Rounded square background */}
          <rect x="2" y="2" width="60" height="60" rx="16" fill={`url(#${uid}-bg)`} />
          {/* Top-edge highlight for depth */}
          <rect x="2" y="2" width="60" height="30" rx="16" fill={`url(#${uid}-shine)`} />
        </>
      )}

      {/* Car silhouette (white) */}
      <g fill="#ffffff" fillRule="evenodd" clipRule="evenodd">
        {/* Body - roof + lower body merged */}
        <path d="M16 36 L18.5 27 C19 25.3 20.5 24 22.3 24 L38.5 24 C40.3 24 41.7 25.1 42.4 26.7 L46 36 L46 42 C46 43.1 45.1 44 44 44 L42 44 L42 46 C42 47.1 41.1 48 40 48 L38 48 C36.9 48 36 47.1 36 46 L36 44 L24 44 L24 46 C24 47.1 23.1 48 22 48 L20 48 C18.9 48 18 47.1 18 46 L18 44 L17 44 C15.3 44 14 42.7 14 41 L14 38 C14 37 14.7 36.2 16 36 Z" />
      </g>

      {/* Windshield/windows (lighter blue glass effect) */}
      <path
        d="M21 35 L23 28.5 C23.3 27.6 24.2 27 25.1 27 L36 27 C36.9 27 37.7 27.5 38.1 28.3 L41 35 Z"
        fill="#bfdbfe"
        opacity="0.95"
      />
      {/* Window divider */}
      <line x1="31" y1="27" x2="31" y2="35" stroke="#2563eb" strokeWidth="0.7" opacity="0.6" />

      {/* Wheels */}
      <g>
        <circle cx="23" cy="44" r="3.8" fill="#0f172a" />
        <circle cx="23" cy="44" r="1.6" fill="#cbd5e1" />
        <circle cx="39" cy="44" r="3.8" fill="#0f172a" />
        <circle cx="39" cy="44" r="1.6" fill="#cbd5e1" />
      </g>

      {/* Headlight (front-right in RTL view) */}
      <circle cx="17" cy="38" r="1.2" fill="#fde047" />

      {/* Magnifying glass badge - top-right corner */}
      <g>
        {/* White outer ring for depth */}
        <circle cx="47" cy="17" r="9" fill="#ffffff" />
        {/* Glass body */}
        <circle cx="47" cy="17" r="7" fill={`url(#${uid}-glass)`} />
        {/* Inner glass reflection */}
        <circle cx="44.5" cy="14.5" r="2.5" fill="#ffffff" opacity="0.55" />
        {/* Handle */}
        <rect
          x="51.5"
          y="20.5"
          width="3"
          height="8"
          rx="1.5"
          fill="#f59e0b"
          transform="rotate(-45 53 24.5)"
        />
      </g>
    </svg>
  );
}
