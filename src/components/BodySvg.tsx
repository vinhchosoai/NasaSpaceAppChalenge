import { motion } from 'framer-motion';
import { BODY_REGIONS } from '../domain/hrpData';
import type { BodyRegionAssessment, BodyRegionId, Status } from '../domain/types';

interface Props {
  regionStatuses: Record<BodyRegionId, BodyRegionAssessment>;
  selectedRegion: BodyRegionId;
  onSelectRegion: (id: BodyRegionId) => void;
  highlightedRegions: BodyRegionId[] | null;
  simulatedGravityG: number;
}

const STATUS_COLOR: Record<Status, string> = {
  ok: '#10b981',
  warn: '#f59e0b',
  alert: '#ef4444',
};

export function BodySvg({
  regionStatuses,
  selectedRegion,
  onSelectRegion,
  highlightedRegions,
  simulatedGravityG,
}: Props) {
  const getStyle = (id: BodyRegionId) => {
    const status = regionStatuses[id]?.status ?? 'ok';
    const isSelected = selectedRegion === id;
    const isDimmed = highlightedRegions !== null && !highlightedRegions.includes(id);
    const color = STATUS_COLOR[status];
    return {
      fill: color,
      fillOpacity: isDimmed ? 0.14 : isSelected ? 0.55 : 0.3,
      stroke: isSelected ? '#ffffff' : color,
      strokeWidth: isSelected ? 2.8 : 1.7,
      opacity: isDimmed ? 0.32 : 1,
      cursor: 'pointer',
      transition: 'all 0.2s ease',
    };
  };

  // Visual headward fluid shift intensity: highest at 0g, lowest at 1g
  const headwardShiftOpacity = Math.max(0.04, (1 - simulatedGravityG) * 0.42);
  const lowerShiftOpacity = Math.max(0.05, simulatedGravityG * 0.35);

  const renderHotspot = (id: BodyRegionId, shape: JSX.Element) => {
    const status = regionStatuses[id]?.status ?? 'ok';
    return (
      <g
        key={id}
        data-region={id}
        role="button"
        tabIndex={0}
        aria-label={`${BODY_REGIONS[id].name}: ${status}`}
        onClick={() => onSelectRegion(id)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            onSelectRegion(id);
          }
        }}
      >
        {shape}
        {status === 'alert' && (
          <motion.circle
            cx={0}
            cy={0}
            r={0}
            initial={{ opacity: 0.7 }}
            animate={{ opacity: [0.2, 0.9, 0.2] }}
            transition={{ repeat: Infinity, duration: 1.8 }}
          />
        )}
      </g>
    );
  };

  // Spine stretches visibly as gravity drops toward 0g (up to ~3% NASA elongation)
  const spineStretchY = 1 + (1 - simulatedGravityG) * 0.04;

  return (
    <svg
      viewBox="0 0 500 410"
      width="100%"
      style={{ maxHeight: 480, display: 'block', margin: '0 auto' }}
      aria-label="Interactive Front and Back Astronaut Anatomy Map"
    >
      <defs>
        <linearGradient id="fluidShiftGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#38bdf8" stopOpacity={headwardShiftOpacity} />
          <stop offset="45%" stopColor="#0ea5e9" stopOpacity={headwardShiftOpacity * 0.35} />
          <stop offset="100%" stopColor="#10b981" stopOpacity={lowerShiftOpacity} />
        </linearGradient>
      </defs>

      {/* Subtle Telemetry Grid */}
      <g stroke="rgba(148,163,184,0.08)" strokeWidth="1">
        {[80, 160, 240, 320].map((y) => (
          <line key={y} x1="12" y1={y} x2="488" y2={y} />
        ))}
        <line x1="250" y1="16" x2="250" y2="395" strokeDasharray="4 4" />
      </g>

      <text x="125" y="24" textAnchor="middle" fill="#94a3b8" fontSize="11" fontWeight="700">
        ANTERIOR (FRONT)
      </text>
      <text x="375" y="24" textAnchor="middle" fill="#94a3b8" fontSize="11" fontWeight="700">
        POSTERIOR (BACK)
      </text>

      {/* ================= FRONT SILHOUETTE (cx = 125) ================= */}
      <g>
        {/* Silhouette contour */}
        <path
          d="M125 38 C108 38 98 51 98 68 C98 83 107 95 114 98 L112 108 L74 120 C65 123 61 132 60 144 L54 222 C53 231 63 233 66 225 L78 152 L85 152 L82 228 L88 378 C88 386 104 386 106 378 L120 250 L130 250 L144 378 C146 386 162 386 162 378 L168 228 L165 152 L172 152 L184 225 C187 233 197 231 196 222 L190 144 C189 132 185 123 176 120 L138 108 L136 98 C143 95 152 83 152 68 C152 51 142 38 125 38 Z"
          fill="url(#fluidShiftGrad)"
          stroke="rgba(148,163,184,0.4)"
          strokeWidth="1.6"
        />

        {/* Brain */}
        {renderHotspot(
          'brain',
          <ellipse cx="125" cy="56" rx="18" ry="13" style={getStyle('brain')} />
        )}

        {/* Eyes (SANS) */}
        {renderHotspot(
          'eyes',
          <g style={getStyle('eyes')}>
            <circle cx="116" cy="72" r="5.5" />
            <circle cx="134" cy="72" r="5.5" />
          </g>
        )}

        {/* Inner Ear / Vestibular */}
        {renderHotspot(
          'innerEar',
          <g style={getStyle('innerEar')}>
            <ellipse cx="99" cy="72" rx="4.2" ry="7" />
            <ellipse cx="151" cy="72" rx="4.2" ry="7" />
          </g>
        )}

        {/* Jugular & Vascular */}
        {renderHotspot(
          'vessels',
          <g style={getStyle('vessels')}>
            <path d="M117 92 L117 122 M133 92 L133 122 M116 255 L112 335 M134 255 L138 335" strokeWidth="5" strokeLinecap="round" />
          </g>
        )}

        {/* Lungs */}
        {renderHotspot(
          'lungs',
          <g style={getStyle('lungs')}>
            <path d="M96 125 C92 140 92 162 98 172 L120 172 L120 124 Z" />
            <path d="M154 125 C158 140 158 162 152 172 L130 172 L130 124 Z" />
          </g>
        )}

        {/* Heart */}
        {renderHotspot(
          'heart',
          <path
            d="M126 140 C122 132 111 135 113 147 C115 157 129 166 132 167 C135 166 144 156 142 145 C140 135 130 133 126 140 Z"
            style={getStyle('heart')}
          />
        )}

        {/* Gut & Nutrition */}
        {renderHotspot(
          'gut',
          <rect x="103" y="180" width="44" height="36" rx="11" style={getStyle('gut')} />
        )}

        {/* Weight-Bearing Bones (Pelvis & Femurs) */}
        {renderHotspot(
          'bones',
          <g style={getStyle('bones')}>
            <path d="M93 220 L157 220 L149 246 L101 246 Z" />
            <rect x="97" y="252" width="12" height="75" rx="5" />
            <rect x="141" y="252" width="12" height="75" rx="5" />
          </g>
        )}

        {/* Skeletal Muscles (Arms & Quads) */}
        {renderHotspot(
          'muscles',
          <g style={getStyle('muscles')}>
            <rect x="65" y="132" width="14" height="60" rx="7" transform="rotate(8 72 160)" />
            <rect x="171" y="132" width="14" height="60" rx="7" transform="rotate(-8 178 160)" />
          </g>
        )}

        {/* Immune & Skin (Forearm / Lymph Nodes) */}
        {renderHotspot(
          'immuneSkin',
          <g style={getStyle('immuneSkin')}>
            <circle cx="62" cy="204" r="9" />
            <circle cx="188" cy="204" r="9" />
            <circle cx="125" cy="112" r="7" />
          </g>
        )}
      </g>

      {/* ================= BACK SILHOUETTE (cx = 375) ================= */}
      <g>
        <path
          d="M375 38 C358 38 348 51 348 68 C348 83 357 95 364 98 L362 108 L324 120 C315 123 311 132 310 144 L304 222 C303 231 313 233 316 225 L328 152 L335 152 L332 228 L338 378 C338 386 354 386 356 378 L370 250 L380 250 L394 378 C396 386 412 386 412 378 L418 228 L415 152 L422 152 L434 225 C437 233 447 231 446 222 L440 144 C439 132 435 123 426 120 L388 108 L386 98 C393 95 402 83 402 68 C402 51 392 38 375 38 Z"
          fill="url(#fluidShiftGrad)"
          stroke="rgba(148,163,184,0.4)"
          strokeWidth="1.6"
        />

        {/* Posterior Brain / Occipital */}
        {renderHotspot(
          'brain',
          <ellipse cx="375" cy="63" rx="18" ry="16" style={getStyle('brain')} />
        )}

        {/* Spine (Elongates up to 3% in microgravity) */}
        {renderHotspot(
          'spine',
          <g transform={`translate(375, 110) scale(1, ${spineStretchY}) translate(-375, -110)`} style={getStyle('spine')}>
            <rect x="368" y="106" width="14" height="114" rx="6" />
            {[116, 132, 148, 164, 180, 196, 210].map((y) => (
              <line key={y} x1="369" y1={y} x2="381" y2={y} stroke="#050912" strokeWidth="1.5" />
            ))}
          </g>
        )}

        {/* Posterior Back/Glute/Hamstring Muscles */}
        {renderHotspot(
          'muscles',
          <g style={getStyle('muscles')}>
            <path d="M338 124 L364 124 L362 178 L338 164 Z" />
            <path d="M386 124 L412 124 L412 164 L388 178 Z" />
            <rect x="342" y="256" width="18" height="72" rx="8" />
            <rect x="390" y="256" width="18" height="72" rx="8" />
          </g>
        )}

        {/* Posterior Pelvis / Hips */}
        {renderHotspot(
          'bones',
          <rect x="343" y="222" width="64" height="24" rx="10" style={getStyle('bones')} />
        )}
      </g>

      {/* Fluid shift & spine caption */}
      <text x="125" y="402" textAnchor="middle" fill="#7dd3fc" fontSize="10" className="mono">
        {simulatedGravityG <= 0.05
          ? '0 g CEPHALAD FLUID SHIFT ACTIVE'
          : `${simulatedGravityG.toFixed(2)} g PARTIAL/EARTH LOAD`}
      </text>
      <text x="375" y="402" textAnchor="middle" fill="#94a3b8" fontSize="10" className="mono">
        SPINE EXTENSION FACTOR: +{((1 - simulatedGravityG) * 3).toFixed(1)}%
      </text>
    </svg>
  );
}
