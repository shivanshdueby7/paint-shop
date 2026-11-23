import { useId, type ReactNode } from 'react';
import { darken, lighten, readableOn } from '../lib/color';
import type { PackKind } from '../lib/pack';

const INK = '#241B14';

function Txt({
  x = 110,
  y,
  size = 7,
  weight = 700,
  fill = INK,
  spacing = 1,
  opacity = 1,
  children,
}: {
  x?: number;
  y: number;
  size?: number;
  weight?: number;
  fill?: string;
  spacing?: number;
  opacity?: number;
  children: ReactNode;
}) {
  return (
    <text
      x={x}
      y={y}
      textAnchor="middle"
      fontSize={size}
      fontWeight={weight}
      letterSpacing={spacing}
      fill={fill}
      opacity={opacity}
      fontFamily="'Plus Jakarta Sans', sans-serif"
    >
      {children}
    </text>
  );
}

const up = (value: string, max = 18) => value.toUpperCase().slice(0, max);

/**
 * Every product gets a drawn pack in its own colour instead of the same white
 * studio photograph: a 4 L tin, a 20 L pail, a putty sack, a primer drum, a
 * texture bucket, a waterproofing jerry can, or the actual tool.
 */
export function PackShot({
  kind = 'tin',
  hex,
  brand = 'Rang Ghar',
  label = 'Paint',
  pack = '4 L',
  code,
  className = '',
  alt,
}: {
  kind?: PackKind;
  hex: string;
  brand?: string;
  label?: string;
  pack?: string;
  code?: string;
  className?: string;
  alt?: string;
}) {
  const uid = useId().replace(/[^a-zA-Z0-9]/g, '');
  const bodyId = `${uid}-body`;
  const metalId = `${uid}-metal`;
  const shineId = `${uid}-shine`;
  const on = readableOn(hex);
  const dark = darken(hex, 0.24);
  const light = lighten(hex, 0.42);
  const brandText = up(brand, 17);
  const labelText = up(label, 16);
  const packText = up(pack, 8);

  const defs = (
    <defs>
      <linearGradient id={bodyId} x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stopColor="#FFFFFF" />
        <stop offset="0.55" stopColor="#FFF9EF" />
        <stop offset="1" stopColor="#F0E2CC" />
      </linearGradient>
      <linearGradient id={metalId} x1="0" y1="0" x2="1" y2="0">
        <stop offset="0" stopColor="#CFC6B8" />
        <stop offset="0.45" stopColor="#F6F1E8" />
        <stop offset="1" stopColor="#B9AE9E" />
      </linearGradient>
      <linearGradient id={shineId} x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stopColor="#FFFFFF" stopOpacity="0.5" />
        <stop offset="0.5" stopColor="#FFFFFF" stopOpacity="0.04" />
        <stop offset="1" stopColor="#FFFFFF" stopOpacity="0.26" />
      </linearGradient>
    </defs>
  );

  const shadow = <ellipse cx="110" cy="223" rx="64" ry="9" fill={INK} opacity="0.12" />;

  let art: ReactNode = null;

  if (kind === 'tin') {
    art = (
      <g>
        <path d="M68 66 C68 34 152 34 152 66" fill="none" stroke={INK} strokeWidth="5" strokeLinecap="round" />
        <path d="M68 66 C68 42 152 42 152 66" fill="none" stroke="#9C9284" strokeWidth="2" strokeLinecap="round" />
        <rect x="44" y="56" width="132" height="26" rx="13" fill={`url(#${metalId})`} stroke={INK} strokeOpacity="0.25" strokeWidth="1.5" />
        <rect x="49" y="61" width="122" height="7" rx="3.5" fill="#FFFFFF" opacity="0.5" />
        <rect x="48" y="80" width="124" height="136" rx="13" fill={`url(#${bodyId})`} stroke={INK} strokeOpacity="0.18" strokeWidth="1.5" />
        <rect x="48" y="80" width="124" height="136" rx="13" fill={`url(#${shineId})`} opacity="0.5" />
        <rect x="48" y="92" width="124" height="3" fill={INK} opacity="0.08" />
        <rect x="48" y="203" width="124" height="4" fill={INK} opacity="0.08" />
        <rect x="48" y="106" width="124" height="82" fill={hex} />
        <rect x="48" y="106" width="124" height="82" fill={`url(#${shineId})`} opacity="0.3" />
        <Txt y={99} size={6.2} fill={INK} spacing={1.6}>
          {brandText}
        </Txt>
        <Txt y={133} size={11} weight={800} fill={on} spacing={0.2}>
          {labelText}
        </Txt>
        <Txt y={149} size={6.4} weight={600} fill={on} spacing={1.1} opacity={0.9}>
          {up(code ?? 'MIXED HERE', 16)}
        </Txt>
        <Txt y={179} size={8} weight={800} fill={on} spacing={1.4}>
          {packText}
        </Txt>
        <path d="M160 84 q5 9 1 15 q-7 -1 -7 -8 q0 -4 6 -7" fill={hex} stroke={INK} strokeOpacity="0.12" />
        <circle cx="156" cy="196" r="4" fill={dark} opacity="0.5" />
      </g>
    );
  } else if (kind === 'pail') {
    art = (
      <g>
        <path d="M70 70 C70 34 150 34 150 70" fill="none" stroke={INK} strokeWidth="5" strokeLinecap="round" />
        <path d="M70 70 C70 40 150 40 150 70" fill="none" stroke="#9C9284" strokeWidth="2" strokeLinecap="round" />
        <path
          d="M64 74 L156 74 L148 210 Q147 220 137 220 L83 220 Q73 220 72 210 Z"
          fill={`url(#${bodyId})`}
          stroke={INK}
          strokeOpacity="0.18"
          strokeWidth="1.5"
        />
        <path
          d="M64 74 L156 74 L148 210 Q147 220 137 220 L83 220 Q73 220 72 210 Z"
          fill={`url(#${shineId})`}
          opacity="0.45"
        />
        <ellipse cx="110" cy="74" rx="46" ry="11" fill={`url(#${metalId})`} stroke={INK} strokeOpacity="0.25" strokeWidth="1.5" />
        <ellipse cx="110" cy="74" rx="31" ry="5.5" fill="#FFFFFF" opacity="0.35" />
        <path d="M66 112 L154 112 L148 198 Q147 206 139 206 L81 206 Q73 206 72 198 Z" fill={hex} />
        <path d="M66 112 L154 112 L148 198 Q147 206 139 206 L81 206 Q73 206 72 198 Z" fill={`url(#${shineId})`} opacity="0.28" />
        <Txt y={104} size={6.2} fill={INK} spacing={1.5}>
          {brandText}
        </Txt>
        <Txt y={138} size={11} weight={800} fill={on} spacing={0.2}>
          {labelText}
        </Txt>
        <Txt y={154} size={6.4} weight={600} fill={on} spacing={1.1} opacity={0.9}>
          {up(code ?? 'MIXED HERE', 16)}
        </Txt>
        <Txt y={184} size={8} weight={800} fill={on} spacing={1.4}>
          {packText}
        </Txt>
        <path d="M84 186 h52" stroke={on} strokeWidth="2" strokeLinecap="round" opacity="0.5" />
        <rect x="138" y="150" width="8" height="26" rx="2" fill={on} opacity="0.25" />
      </g>
    );
  } else if (kind === 'can') {
    art = (
      <g>
        <path d="M82 92 C82 62 138 62 138 92" fill="none" stroke={INK} strokeWidth="4" strokeLinecap="round" />
        <rect x="62" y="92" width="96" height="112" rx="16" fill={`url(#${bodyId})`} stroke={INK} strokeOpacity="0.18" strokeWidth="1.5" />
        <rect x="62" y="92" width="96" height="112" rx="16" fill={`url(#${shineId})`} opacity="0.45" />
        <ellipse cx="110" cy="92" rx="48" ry="12" fill={`url(#${metalId})`} stroke={INK} strokeOpacity="0.25" strokeWidth="1.5" />
        <ellipse cx="110" cy="92" rx="33" ry="6" fill="#FFFFFF" opacity="0.35" />
        <rect x="66" y="112" width="88" height="70" rx="8" fill={hex} />
        <rect x="66" y="112" width="88" height="70" rx="8" fill={`url(#${shineId})`} opacity="0.25" />
        <Txt y={136} size={9.5} weight={800} fill={on} spacing={0.2}>
          {labelText}
        </Txt>
        <Txt y={151} size={6} weight={600} fill={on} spacing={1.1} opacity={0.9}>
          {up(code ?? brand, 16)}
        </Txt>
        <Txt y={175} size={7.4} weight={800} fill={on} spacing={1.4}>
          {packText}
        </Txt>
        <Txt y={196} size={6} weight={600} fill={INK} spacing={1.2} opacity={0.55}>
          ENAMEL &amp; WOOD
        </Txt>
      </g>
    );
  } else if (kind === 'drum') {
    art = (
      <g>
        <rect x="66" y="72" width="88" height="144" rx="10" fill={`url(#${bodyId})`} stroke={INK} strokeOpacity="0.18" strokeWidth="1.5" />
        <rect x="66" y="72" width="88" height="144" rx="10" fill={`url(#${shineId})`} opacity="0.4" />
        <ellipse cx="110" cy="72" rx="44" ry="10" fill={`url(#${metalId})`} stroke={INK} strokeOpacity="0.25" strokeWidth="1.5" />
        <ellipse cx="110" cy="216" rx="44" ry="10" fill={dark} opacity="0.2" />
        <rect x="66" y="98" width="88" height="4" fill={INK} opacity="0.09" />
        <rect x="66" y="188" width="88" height="4" fill={INK} opacity="0.09" />
        <rect x="66" y="116" width="88" height="64" fill={hex} />
        <rect x="66" y="116" width="88" height="64" fill={`url(#${shineId})`} opacity="0.25" />
        <circle cx="139" cy="66" r="8" fill={`url(#${metalId})`} stroke={INK} strokeOpacity="0.3" strokeWidth="1.5" />
        <Txt y={108} size={6} fill={INK} spacing={1.4}>
          {brandText}
        </Txt>
        <Txt y={140} size={10} weight={800} fill={on} spacing={0.2}>
          {labelText}
        </Txt>
        <Txt y={155} size={6} weight={600} fill={on} spacing={1.1} opacity={0.9}>
          {up(code ?? 'PRIMER', 16)}
        </Txt>
        <Txt y={172} size={7.4} weight={800} fill={on} spacing={1.4}>
          {packText}
        </Txt>
        <Txt y={202} size={5.8} weight={600} fill={INK} spacing={1.1} opacity={0.5}>
          FIRST COAT
        </Txt>
      </g>
    );
  } else if (kind === 'sack') {
    art = (
      <g>
        <path
          d="M72 62 L148 62 L157 90 L152 210 Q151 220 141 220 L79 220 Q69 220 68 210 L63 90 Z"
          fill={`url(#${bodyId})`}
          stroke={INK}
          strokeOpacity="0.18"
          strokeWidth="1.5"
        />
        <path d="M72 62 L148 62 L144 82 L76 82 Z" fill={light} stroke={INK} strokeOpacity="0.12" />
        <path d="M76 82 L144 82" stroke={INK} strokeOpacity="0.12" strokeWidth="1.5" />
        <path d="M68 198 Q78 186 68 174" fill="none" stroke={INK} strokeOpacity="0.1" strokeWidth="2" />
        <path d="M152 198 Q142 186 152 174" fill="none" stroke={INK} strokeOpacity="0.1" strokeWidth="2" />
        <rect x="82" y="104" width="56" height="80" rx="7" fill={hex} />
        <rect x="82" y="104" width="56" height="80" rx="7" fill={`url(#${shineId})`} opacity="0.25" />
        <Txt y={122} size={6.2} weight={800} fill={on} spacing={1.1}>
          {brandText}
        </Txt>
        <Txt y={142} size={9} weight={800} fill={on} spacing={0.1}>
          {labelText}
        </Txt>
        <Txt y={158} size={7.4} weight={800} fill={on} spacing={1.2}>
          {packText}
        </Txt>
        <Txt y={174} size={5.4} weight={600} fill={on} spacing={1.1} opacity={0.9}>
          WALL PUTTY
        </Txt>
        <Txt y={200} size={5.6} weight={600} fill={INK} spacing={1.2} opacity={0.5}>
          {up(code ?? 'LEVELLING COAT', 20)}
        </Txt>
      </g>
    );
  } else if (kind === 'jug') {
    art = (
      <g>
        <path d="M80 80 C80 46 140 46 140 80" fill="none" stroke={INK} strokeWidth="8" strokeLinecap="round" />
        <path d="M80 80 C80 52 140 52 140 80" fill="none" stroke="#9C9284" strokeWidth="2" strokeLinecap="round" />
        <rect x="96" y="42" width="28" height="16" rx="4" fill={`url(#${metalId})`} stroke={INK} strokeOpacity="0.3" strokeWidth="1.5" />
        <path
          d="M66 84 Q66 74 76 74 L144 74 Q154 74 154 84 L154 200 Q154 214 140 214 L80 214 Q66 214 66 200 Z"
          fill={`url(#${bodyId})`}
          stroke={INK}
          strokeOpacity="0.18"
          strokeWidth="1.5"
        />
        <path
          d="M66 84 Q66 74 76 74 L144 74 Q154 74 154 84 L154 200 Q154 214 140 214 L80 214 Q66 214 66 200 Z"
          fill={`url(#${shineId})`}
          opacity="0.45"
        />
        <rect x="74" y="112" width="72" height="70" rx="8" fill={hex} />
        <rect x="74" y="112" width="72" height="70" rx="8" fill={`url(#${shineId})`} opacity="0.25" />
        <Txt y={104} size={6} fill={INK} spacing={1.4}>
          {brandText}
        </Txt>
        <Txt y={136} size={9.5} weight={800} fill={on} spacing={0.2}>
          {labelText}
        </Txt>
        <Txt y={152} size={6} weight={600} fill={on} spacing={1.1} opacity={0.9}>
          {up(code ?? 'DAMP PROOF', 16)}
        </Txt>
        <Txt y={172} size={7.4} weight={800} fill={on} spacing={1.4}>
          {packText}
        </Txt>
        <path d="M74 196 h18 M118 196 h18" stroke={INK} strokeWidth="3" strokeLinecap="round" opacity="0.14" />
      </g>
    );
  } else if (kind === 'bucket') {
    art = (
      <g>
        <path d="M70 68 C70 38 150 38 150 68" fill="none" stroke={INK} strokeWidth="5" strokeLinecap="round" />
        <path
          d="M60 72 L160 72 L151 210 Q150 220 140 220 L80 220 Q70 220 69 210 Z"
          fill={`url(#${bodyId})`}
          stroke={INK}
          strokeOpacity="0.18"
          strokeWidth="1.5"
        />
        <path
          d="M60 72 L160 72 L151 210 Q150 220 140 220 L80 220 Q70 220 69 210 Z"
          fill={`url(#${shineId})`}
          opacity="0.4"
        />
        <ellipse cx="110" cy="72" rx="50" ry="11" fill={`url(#${metalId})`} stroke={INK} strokeOpacity="0.25" strokeWidth="1.5" />
        <path d="M63 112 L157 112 L150 198 Q149 206 141 206 L79 206 Q71 206 70 198 Z" fill={hex} />
        <path d="M63 112 L157 112 L150 198 Q149 206 141 206 L79 206 Q71 206 70 198 Z" fill={`url(#${shineId})`} opacity="0.25" />
        <Txt y={104} size={6.2} fill={INK} spacing={1.5}>
          {brandText}
        </Txt>
        <Txt y={136} size={10} weight={800} fill={on} spacing={0.2}>
          {labelText}
        </Txt>
        <Txt y={151} size={6} weight={600} fill={on} spacing={1.1} opacity={0.9}>
          {up(code ?? 'DESIGN TEXTURE', 18)}
        </Txt>
        <path d="M78 166 q8 -10 16 0 t16 0 t16 0 t16 0" fill="none" stroke={on} strokeWidth="2.2" strokeLinecap="round" opacity="0.5" />
        <Txt y={190} size={7.4} weight={800} fill={on} spacing={1.4}>
          {packText}
        </Txt>
      </g>
    );
  } else if (kind === 'roller') {
    art = (
      <g>
        <path d="M160 92 h14 v36 h-28" fill="none" stroke={INK} strokeWidth="7" strokeLinecap="round" strokeLinejoin="round" />
        <rect x="40" y="74" width="122" height="34" rx="17" fill={hex} stroke={INK} strokeOpacity="0.15" strokeWidth="1.5" />
        <rect x="40" y="74" width="122" height="12" rx="6" fill="#FFFFFF" opacity="0.32" />
        <rect x="40" y="94" width="122" height="6" rx="3" fill={dark} opacity="0.25" />
        <rect x="126" y="124" width="24" height="66" rx="12" fill={INK} />
        <rect x="130" y="132" width="6" height="44" rx="3" fill="#FFFFFF" opacity="0.18" />
        <path d="M52 108 q3 12 -1 20 q-6 -3 -5 -11 q1 -5 6 -9" fill={hex} />
        <Txt y={210} size={7} weight={800} fill={INK} spacing={1.5} opacity={0.55}>
          {up(label, 16)}
        </Txt>
      </g>
    );
  } else if (kind === 'brush') {
    art = (
      <g>
        <rect x="99" y="132" width="22" height="78" rx="11" fill="#C98B4B" stroke={INK} strokeOpacity="0.25" strokeWidth="1.5" />
        <rect x="103" y="140" width="6" height="52" rx="3" fill="#FFFFFF" opacity="0.28" />
        <rect x="92" y="102" width="36" height="32" rx="4" fill={`url(#${metalId})`} stroke={INK} strokeOpacity="0.3" strokeWidth="1.5" />
        <path d="M92 102 L128 102 L138 58 Q110 44 82 58 Z" fill={hex} stroke={INK} strokeOpacity="0.15" strokeWidth="1.5" />
        <path d="M88 96 L132 96" stroke={INK} strokeOpacity="0.15" strokeWidth="2" />
        <path d="M92 84 L128 84 M94 70 L126 70" stroke={on} strokeWidth="1.6" opacity="0.35" />
        <Txt y={206} size={7} weight={800} fill={INK} spacing={1.5} opacity={0.55}>
          {up(label, 16)}
        </Txt>
      </g>
    );
  } else if (kind === 'blade') {
    art = (
      <g>
        <path d="M70 144 L150 144 L135 214 Q110 222 85 214 Z" fill={`url(#${metalId})`} stroke={INK} strokeOpacity="0.3" strokeWidth="1.5" />
        <path d="M70 144 L150 144" stroke={INK} strokeOpacity="0.25" strokeWidth="2" />
        <rect x="98" y="88" width="24" height="60" rx="11" fill="#C98B4B" stroke={INK} strokeOpacity="0.25" strokeWidth="1.5" />
        <rect x="103" y="96" width="7" height="42" rx="3.5" fill="#FFFFFF" opacity="0.3" />
        <path d="M88 156 L132 156" stroke={hex} strokeWidth="5" strokeLinecap="round" opacity="0.6" />
        <Txt y={206} size={7} weight={800} fill={INK} spacing={1.5} opacity={0.55}>
          {up(label, 16)}
        </Txt>
      </g>
    );
  } else if (kind === 'sheet') {
    art = (
      <g transform="rotate(-5 110 150)">
        <rect x="66" y="112" width="92" height="104" rx="8" fill="#E9D8BC" stroke={INK} strokeOpacity="0.2" strokeWidth="1.5" />
        <rect x="58" y="104" width="96" height="108" rx="8" fill="#F3E7D2" stroke={INK} strokeOpacity="0.22" strokeWidth="1.5" />
        <rect x="58" y="104" width="96" height="22" rx="8" fill={hex} />
        <rect x="58" y="104" width="96" height="22" rx="8" fill={`url(#${shineId})`} opacity="0.3" />
        <Txt y={119} size={7} weight={800} fill={on} spacing={1.2}>
          {up(label, 16)}
        </Txt>
        <path d="M72 142 h68 M72 156 h68 M72 170 h68 M72 184 h44" stroke={INK} strokeWidth="3" strokeLinecap="round" opacity="0.12" />
        <circle cx="78" cy="198" r="2" fill={INK} opacity="0.18" />
        <circle cx="90" cy="198" r="2" fill={INK} opacity="0.18" />
        <circle cx="102" cy="198" r="2" fill={INK} opacity="0.18" />
      </g>
    );
  } else {
    art = (
      <g>
        <path d="M64 92 L156 92 L150 212 Q149 220 141 220 L79 220 Q71 220 70 212 Z" fill="#D8B98C" stroke={INK} strokeOpacity="0.2" strokeWidth="1.5" />
        <path d="M64 92 L110 74 L156 92 L110 110 Z" fill="#E7CDA8" stroke={INK} strokeOpacity="0.2" strokeWidth="1.5" />
        <path d="M110 74 V110" stroke={INK} strokeOpacity="0.15" strokeWidth="2" />
        <rect x="78" y="126" width="64" height="62" rx="7" fill={hex} />
        <rect x="78" y="126" width="64" height="62" rx="7" fill={`url(#${shineId})`} opacity="0.25" />
        <Txt y={150} size={8.5} weight={800} fill={on} spacing={0.2}>
          {labelText}
        </Txt>
        <Txt y={166} size={6} weight={600} fill={on} spacing={1.1} opacity={0.9}>
          {up(code ?? brand, 16)}
        </Txt>
        <Txt y={182} size={7} weight={800} fill={on} spacing={1.3}>
          {packText}
        </Txt>
        <path d="M110 92 V220" stroke="#FFFFFF" strokeWidth="10" opacity="0.18" />
      </g>
    );
  }

  return (
    <svg
      viewBox="0 0 220 240"
      role="img"
      aria-label={alt ?? `${label} ${pack} pack in ${hex}`}
      className={className}
    >
      {defs}
      {shadow}
      {art}
    </svg>
  );
}
