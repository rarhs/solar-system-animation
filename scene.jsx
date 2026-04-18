// Solar system scene
// - Sun at center, 8 planets on elliptical orbits
// - Orbital periods in *seconds* here are compressed vs reality but keep
//   the correct order (Mercury fastest → Neptune slowest)
// - Earth gets a moon; Saturn gets a ring
// - Labels follow each planet, offset above

const CENTER_X = 960;
const CENTER_Y = 540;

// Orbit definitions. `a` = semi-major axis (px), `e` = eccentricity,
// `period` = seconds per full orbit (compressed), `phase` = starting angle offset.
// Semi-major axes sized so Neptune's orbit (a=500) fits inside 1080-tall canvas
// with generous margin. Max extent ≈ 500px from center → 40px margin top/bottom.
const PLANETS = [
  { name: 'Mercury', a:  85, e: 0.20, tilt: -0.10, period:   4.0,  phase: 0.1, r: 4,  color: '#9a9a9a' },
  { name: 'Venus',   a: 125, e: 0.01, tilt:  0.05, period:   7.2,  phase: 1.7, r: 7,  color: '#e8d29a' },
  { name: 'Earth',   a: 170, e: 0.03, tilt: -0.02, period:  10.0,  phase: 3.2, r: 8,  color: '#4a8fd6', moon: true },
  { name: 'Mars',    a: 215, e: 0.09, tilt:  0.08, period:  14.6,  phase: 2.1, r: 6,  color: '#c4583a' },
  { name: 'Jupiter', a: 285, e: 0.04, tilt: -0.04, period:  24.0,  phase: 4.8, r: 20, color: '#d9b88a', bands: true },
  { name: 'Saturn',  a: 360, e: 0.05, tilt:  0.06, period:  34.0,  phase: 0.9, r: 16, color: '#e4c98b', ring: true },
  { name: 'Uranus',  a: 430, e: 0.04, tilt: -0.07, period:  44.0,  phase: 5.4, r: 12, color: '#a8dadf' },
  { name: 'Neptune', a: 500, e: 0.01, tilt:  0.03, period:  54.0,  phase: 2.9, r: 11, color: '#3b5f9e' },
];

function orbitPos(a, e, tilt, angle) {
  const b = a * Math.sqrt(1 - e * e);
  const x0 = a * Math.cos(angle) - a * e;
  const y0 = b * Math.sin(angle);
  const cs = Math.cos(tilt);
  const sn = Math.sin(tilt);
  return {
    x: x0 * cs - y0 * sn,
    y: x0 * sn + y0 * cs,
  };
}

// ── Starfield (generated once) ──────────────────────────────────────────────
function mulberry32(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6D2B79F5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const STARS = (() => {
  const rnd = mulberry32(1337);
  const stars = [];
  const count = 260;
  for (let i = 0; i < count; i++) {
    const isHero = rnd() < 0.12;
    const r = isHero
      ? 1.4 + Math.pow(rnd(), 0.6) * 1.8
      : 0.3 + Math.pow(rnd(), 2.2) * 1.0;

    const base = isHero
      ? 0.70 + rnd() * 0.25
      : 0.25 + rnd() * 0.45;

    const amp = isHero ? 0.15 + rnd() * 0.15 : 0.08 + rnd() * 0.14;

    stars.push({
      x: rnd() * 1920,
      y: rnd() * 1080,
      r,
      base,
      amp,
      phase: rnd() * Math.PI * 2,
      speed: 0.4 + rnd() * 2.2,
      hero: isHero,
      hue: (() => {
        const c = rnd();
        if (c < 0.15) return '#ffe6c2';
        if (c < 0.28) return '#cfe0ff';
        return '#ffffff';
      })(),
    });
  }
  return stars;
})();

function Starfield() {
  const time = useTime();
  return (
    <svg
      width="1920" height="1080"
      style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}
    >
      {STARS.map((s, i) => {
        const tw = Math.max(0, Math.min(1,
          s.base + s.amp * Math.sin(time * s.speed + s.phase)
        ));
        if (s.hero) {
          return (
            <g key={i}>
              <circle cx={s.x} cy={s.y} r={s.r * 2.6}
                fill={s.hue} opacity={tw * 0.18}/>
              <circle cx={s.x} cy={s.y} r={s.r}
                fill={s.hue} opacity={tw}/>
            </g>
          );
        }
        return (
          <circle
            key={i}
            cx={s.x} cy={s.y} r={s.r}
            fill={s.hue}
            opacity={tw}
          />
        );
      })}
    </svg>
  );
}

// ── Sun with pulsing glow ───────────────────────────────────────────────────
function Sun() {
  const time = useTime();
  const pulse = 0.5 + 0.5 * Math.sin(time * 0.9);
  const glowR = 95 + pulse * 14;
  const glowOpacity = 0.35 + pulse * 0.15;
  const outerR = 160 + pulse * 10;

  return (
    <svg
      width="1920" height="1080"
      style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}
    >
      <defs>
        <radialGradient id="sunGlow" cx="50%" cy="50%" r="50%">
          <stop offset="0%"  stopColor="#fff2c6" stopOpacity="1"/>
          <stop offset="35%" stopColor="#ffcf6b" stopOpacity="0.55"/>
          <stop offset="70%" stopColor="#ff9a3c" stopOpacity="0.15"/>
          <stop offset="100%" stopColor="#ff7a1a" stopOpacity="0"/>
        </radialGradient>
        <radialGradient id="sunCore" cx="45%" cy="42%" r="55%">
          <stop offset="0%"  stopColor="#fff4d1"/>
          <stop offset="55%" stopColor="#ffc15a"/>
          <stop offset="100%" stopColor="#ef8a1f"/>
        </radialGradient>
      </defs>

      <circle cx={CENTER_X} cy={CENTER_Y} r={outerR}
        fill="url(#sunGlow)" opacity={glowOpacity * 0.6}/>
      <circle cx={CENTER_X} cy={CENTER_Y} r={glowR + 30}
        fill="url(#sunGlow)" opacity={glowOpacity}/>
      <circle cx={CENTER_X} cy={CENTER_Y} r={36}
        fill="url(#sunCore)"/>
      <circle cx={CENTER_X - 8} cy={CENTER_Y - 10} r={11}
        fill="#fffbe8" opacity={0.45}/>
    </svg>
  );
}

// ── Orbit paths ─────────────────────────────────────────────────────────────
function OrbitPaths() {
  return (
    <svg
      width="1920" height="1080"
      style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}
    >
      {PLANETS.map((p, i) => {
        const b = p.a * Math.sqrt(1 - p.e * p.e);
        const cx = CENTER_X - p.a * p.e * Math.cos(p.tilt);
        const cy = CENTER_Y - p.a * p.e * Math.sin(p.tilt);
        const rot = (p.tilt * 180) / Math.PI;
        return (
          <ellipse
            key={p.name}
            cx={cx} cy={cy}
            rx={p.a} ry={b}
            transform={`rotate(${rot} ${cx} ${cy})`}
            fill="none"
            stroke="rgba(255,255,255,0.14)"
            strokeWidth="1"
            strokeDasharray="3 6"
          />
        );
      })}
    </svg>
  );
}

// ── A single planet with label (and optional ring / moon / bands) ───────────
function Planet({ planet }) {
  const time = useTime();
  const [hovered, setHovered] = React.useState(false);
  const angle = (time / planet.period) * Math.PI * 2 + planet.phase;
  const { x: dx, y: dy } = orbitPos(planet.a, planet.e, planet.tilt, angle);
  const x = CENTER_X + dx;
  const y = CENTER_Y + dy;

  const dist = Math.hypot(dx, dy) || 1;
  const ux = dx / dist;
  const uy = dy / dist;
  const labelGap = planet.r + 14;
  const labelEnd = planet.r + 28;
  const lineStartX = x + ux * (planet.r + 4);
  const lineStartY = y + uy * (planet.r + 4);
  const lineEndX = x + ux * labelGap;
  const lineEndY = y + uy * labelGap;
  const labelX = x + ux * labelEnd;
  const labelY = y + uy * labelEnd;

  return (
    <>
      <svg
        width="1920" height="1080"
        style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}
      >
        <defs>
          <radialGradient id={`grad-${planet.name}`} cx="35%" cy="35%" r="70%">
            <stop offset="0%"  stopColor="#ffffff" stopOpacity="0.35"/>
            <stop offset="35%" stopColor={planet.color} stopOpacity="1"/>
            <stop offset="100%" stopColor={planet.color} stopOpacity="1"/>
          </radialGradient>
          {planet.bands && (
            <linearGradient id={`bands-${planet.name}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%"  stopColor={planet.color} stopOpacity="0"/>
              <stop offset="30%" stopColor="#b89368" stopOpacity="0.45"/>
              <stop offset="50%" stopColor={planet.color} stopOpacity="0"/>
              <stop offset="70%" stopColor="#b89368" stopOpacity="0.35"/>
              <stop offset="100%" stopColor={planet.color} stopOpacity="0"/>
            </linearGradient>
          )}
        </defs>

        {planet.ring && (
          <g transform={`translate(${x} ${y}) rotate(-18)`}>
            <ellipse
              cx={0} cy={0}
              rx={planet.r * 2.0} ry={planet.r * 0.55}
              fill="none"
              stroke="#e8d4a0"
              strokeWidth="1.5"
              opacity="0.85"
            />
            <ellipse
              cx={0} cy={0}
              rx={planet.r * 2.35} ry={planet.r * 0.65}
              fill="none"
              stroke="#c9b078"
              strokeWidth="0.8"
              opacity="0.55"
            />
          </g>
        )}

        <circle cx={x} cy={y} r={planet.r} fill={`url(#grad-${planet.name})`}/>

        <circle
          cx={x} cy={y} r={Math.max(planet.r + 10, 16)}
          fill="transparent"
          style={{ pointerEvents: 'all', cursor: 'pointer' }}
          onMouseEnter={() => setHovered(true)}
          onMouseLeave={() => setHovered(false)}
        />

        {hovered && (
          <line
            x1={lineStartX} y1={lineStartY}
            x2={lineEndX} y2={lineEndY}
            stroke="rgba(255,255,255,0.55)"
            strokeWidth="0.75"
          />
        )}

        {planet.bands && (
          <>
            <clipPath id={`clip-${planet.name}`}>
              <circle cx={x} cy={y} r={planet.r}/>
            </clipPath>
            <rect
              x={x - planet.r} y={y - planet.r}
              width={planet.r * 2} height={planet.r * 2}
              fill={`url(#bands-${planet.name})`}
              clipPath={`url(#clip-${planet.name})`}
            />
          </>
        )}

        {planet.moon && (() => {
          const moonAngle = time * 4.0 + 0.5;
          const mr = 18;
          const mx = x + Math.cos(moonAngle) * mr;
          const my = y + Math.sin(moonAngle) * mr * 0.7;
          return (
            <circle cx={mx} cy={my} r={2.2} fill="#f0f0f0"/>
          );
        })()}
      </svg>

      <div style={{
        position: 'absolute',
        left: labelX,
        top: labelY,
        transform: `translate(${ux < -0.3 ? '-100%' : ux > 0.3 ? '0%' : '-50%'}, ${uy < -0.3 ? '-100%' : uy > 0.3 ? '0%' : '-50%'})`,
        fontFamily: 'Inter, system-ui, sans-serif',
        fontSize: 11,
        fontWeight: 300,
        letterSpacing: '0.22em',
        fontVariant: 'small-caps',
        color: hovered ? 'rgba(255,255,255,0.95)' : 'rgba(255,255,255,0.32)',
        whiteSpace: 'nowrap',
        pointerEvents: 'none',
        textShadow: '0 1px 6px rgba(0,0,0,0.9)',
        transition: 'color 220ms ease, opacity 220ms ease',
        padding: '2px 4px',
      }}>
        {planet.name.toLowerCase()}
      </div>
    </>
  );
}

function SolarScene() {
  const time = useTime();
  React.useEffect(() => {
    const root = document.querySelector('[data-scene-root]');
    if (root) {
      root.setAttribute('data-screen-label', `t=${Math.floor(time)}s`);
    }
  }, [Math.floor(time)]);

  return (
    <div data-scene-root style={{ position: 'absolute', inset: 0 }}>
      <div style={{
        position: 'absolute', inset: 0,
        background:
          'radial-gradient(ellipse at 50% 50%, #0d1222 0%, #06080f 55%, #03040a 100%)',
      }}/>

      <Starfield />
      <OrbitPaths />
      <Sun />
      {PLANETS.map((p) => (
        <Planet key={p.name} planet={p} />
      ))}
    </div>
  );
}

Object.assign(window, { SolarScene });
