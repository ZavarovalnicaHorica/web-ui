import type { PhotoScene as Scene } from '../core/mock/mock-documents';

/** Simple drawings that stand in for damage photos in mock mode. */
export function PhotoScene({ scene, caption }: { scene: Scene; caption: string }) {
  return (
    <svg viewBox="0 0 400 260" role="img" aria-label={caption}>
      {scene === 'rear-bumper' && (
        <>
          <rect width="400" height="260" fill="#6f747b" />
          <rect x="0" y="200" width="400" height="60" fill="#55595f" />
          <line x1="0" y1="232" x2="400" y2="232" stroke="#e9e3c9" strokeWidth="4" strokeDasharray="30 18" />
          <path d="M70 70 Q80 40 120 38 L280 38 Q320 40 330 70 L340 160 L60 160 Z" fill="#9aa1a8" />
          <rect x="90" y="52" width="220" height="50" rx="6" fill="#3d4a57" />
          <rect x="70" y="108" width="48" height="22" rx="4" fill="#b8312f" />
          <rect x="282" y="108" width="48" height="22" rx="4" fill="#b8312f" />
          <path d="M80 110 L100 128 L88 122 Z" fill="#e2e2e2" />
          <rect x="168" y="118" width="64" height="16" rx="2" fill="#f2f2f2" />
          <rect x="50" y="156" width="300" height="34" rx="10" fill="#80878e" />
          <path d="M70 162 Q95 178 120 166 Q135 182 150 168" fill="none" stroke="#3b3f44" strokeWidth="5" />
          <path d="M72 172 L140 184 M80 166 L150 176 M90 160 L130 170" stroke="#d9dcdf" strokeWidth="1.5" />
        </>
      )}
      {scene === 'front' && (
        <>
          <rect width="400" height="260" fill="#1f2630" />
          <rect x="0" y="190" width="400" height="70" fill="#2f343a" />
          <path d="M60 180 L70 110 Q80 90 110 86 L290 86 Q320 90 330 110 L340 180 Z" fill="#8c2f2a" />
          <path d="M110 86 L150 60 L250 60 L290 86 Z" fill="#33414f" />
          <path d="M110 110 L150 98 L180 116 L215 96 L250 118 L290 104" fill="none" stroke="#4f1c19" strokeWidth="6" />
          <path d="M150 140 L250 140 L240 175 L160 175 Z" fill="#26292d" />
          <path d="M160 150 L240 160 M170 170 L230 145" stroke="#5a5f66" strokeWidth="3" />
          <circle cx="100" cy="148" r="16" fill="#f4e7b0" />
          <path d="M285 140 l18 -6 l6 16 l-14 12 z" fill="#c9c2a0" />
          <rect x="56" y="176" width="288" height="18" rx="6" fill="#45484d" />
          <path d="M80 182 L120 190 L100 176 M300 180 L270 192" stroke="#8e9399" strokeWidth="2" />
        </>
      )}
      {scene === 'windscreen' && (
        <>
          <rect width="400" height="260" fill="#202833" />
          <path d="M40 220 L80 40 L320 40 L360 220 Z" fill="#7fa3bf" />
          <path d="M80 40 L320 40 L300 60 L100 60 Z" fill="#9dbcd3" opacity="0.6" />
          <circle cx="250" cy="150" r="6" fill="#f2f6f9" />
          <path d="M250 150 L230 138 L205 140 M250 150 L262 132" fill="none" stroke="#f2f6f9" strokeWidth="2" />
          <rect x="0" y="220" width="400" height="40" fill="#171c22" />
        </>
      )}
      {scene === 'window' && (
        <>
          <rect width="400" height="260" fill="#d9d4c7" />
          <rect x="100" y="30" width="200" height="200" fill="#f4f1ea" />
          <rect x="112" y="42" width="176" height="176" fill="#6b8aa3" />
          <line x1="200" y1="42" x2="200" y2="218" stroke="#f4f1ea" strokeWidth="8" />
          <path
            d="M150 100 L130 70 M150 100 L175 60 M150 100 L118 120 M150 100 L170 150 L160 190 M150 100 L190 110"
            fill="none"
            stroke="#f2f6f9"
            strokeWidth="2"
          />
          <path d="M140 92 L160 94 L158 110 L142 108 Z" fill="#4a6275" />
          <rect x="90" y="228" width="220" height="10" fill="#bfb8a8" />
          <path d="M120 238 l10 6 l-14 3 z M260 240 l12 4 l-10 4 z" fill="#c8d7e2" />
        </>
      )}
    </svg>
  );
}
