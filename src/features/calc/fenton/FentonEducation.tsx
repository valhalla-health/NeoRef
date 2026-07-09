// Fenton growth-band educational screen (repositioned — see fenton-content.ts).
// Keeps the prototype's sex/GA/weight inputs; replaces the false-precision
// interpolated percentile ("P52") with a percentile BAND and SGA/AGA/LGA
// category, plus a link to the official PediTools Fenton calculator.

import { useState } from 'react';
import { warm, font } from '../../../theme/tokens';
import { Field, PillButton } from '../../../components/ui';
import { DisclaimerBanner } from '../../../components/Disclaimer';
import { fentonBand, PEDITOOLS_FENTON_URL, type Sex } from './fenton-content';

const categoryLabel: Record<'SGA' | 'AGA' | 'LGA', string> = {
  SGA: 'SGA · Small for GA',
  AGA: 'AGA · Appropriate for GA',
  LGA: 'LGA · Large for GA',
};

const categoryTone: Record<'SGA' | 'AGA' | 'LGA', string> = {
  SGA: warm.terra,
  AGA: warm.sage,
  LGA: warm.ochre,
};

export function FentonEducation({ onBack }: { onBack?: () => void }) {
  const [gaWeeks, setGa] = useState(34);
  const [sex, setSex] = useState<Sex>('M');
  const [weightStr, setWeightStr] = useState('');

  const parsed = parseFloat(weightStr);
  const hasWeight = !isNaN(parsed) && parsed > 0;
  const weightGrams = hasWeight ? Math.round(parsed < 10 ? parsed * 1000 : parsed) : null;
  const band = weightGrams !== null ? fentonBand(weightGrams, gaWeeks, sex) : null;

  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        background: warm.paper,
        color: warm.ink,
        fontFamily: font.ui,
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '12px 18px 8px',
        }}
      >
        <button
          type="button"
          onClick={onBack}
          style={{
            border: 'none',
            background: 'none',
            color: warm.terra,
            fontSize: 14,
            fontWeight: 600,
            cursor: 'pointer',
            padding: 0,
          }}
        >
          ‹ เครื่องมือ
        </button>
        <span style={{ fontSize: 11, fontFamily: font.mono, color: warm.muted }}>
          Educational · Fenton 2013
        </span>
      </div>

      <div style={{ padding: '2px 22px 6px' }}>
        <div style={{ display: 'flex', gap: 6, marginBottom: 6 }}>
          <span
            style={{
              display: 'inline-flex',
              background: '#DEE4D5',
              color: warm.sage,
              padding: '3px 8px',
              borderRadius: 999,
              fontSize: 11,
              fontWeight: 600,
              fontFamily: font.ui,
            }}
          >
            growth · preterm
          </span>
        </div>
        <div style={{ fontFamily: font.head, fontSize: 24, lineHeight: 1.1, fontWeight: 800, letterSpacing: -0.4 }}>
          Fenton
          <br />
          <span style={{ color: warm.terra }}>growth band.</span>
        </div>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '6px 18px 16px' }}>
        <DisclaimerBanner compact />

        <Field label="Sex">
          <div style={{ display: 'flex', gap: 4 }}>
            {(
              [
                { k: 'M', l: 'Male' },
                { k: 'F', l: 'Female' },
              ] as const
            ).map((o) => (
              <PillButton key={o.k} active={sex === o.k} onClick={() => setSex(o.k)} style={{ flex: 1 }}>
                {o.l}
              </PillButton>
            ))}
          </div>
        </Field>

        <Field label="Gestational Age" value={`${gaWeeks} wk`}>
          <input
            type="range"
            min={22}
            max={42}
            step={1}
            value={gaWeeks}
            aria-label="Gestational age in completed weeks"
            onChange={(e) => setGa(Number(e.target.value))}
            style={{ width: '100%', accentColor: warm.terra }}
          />
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              fontSize: 9.5,
              color: warm.muted,
              fontFamily: font.mono,
              marginTop: -4,
            }}
          >
            <span>22w</span>
            <span>42w</span>
          </div>
        </Field>

        <div
          style={{
            background: warm.card,
            border: `1px solid ${warm.line}`,
            borderRadius: 12,
            padding: '12px 14px',
            marginBottom: 12,
            display: 'flex',
            alignItems: 'center',
            gap: 12,
          }}
        >
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 13, fontWeight: 600 }}>Birth Weight</div>
            <div style={{ fontSize: 11, color: warm.muted }}>กรอกเป็นกรัม (หรือกิโลกรัม)</div>
          </div>
          <div
            style={{
              display: 'flex',
              alignItems: 'baseline',
              gap: 6,
              background: warm.paperDeep,
              padding: '6px 12px',
              borderRadius: 8,
              border: `1px solid ${warm.line}`,
            }}
          >
            <input
              type="number"
              step="10"
              min="0"
              placeholder="—"
              value={weightStr}
              aria-label="Birth weight"
              onChange={(e) => setWeightStr(e.target.value)}
              style={{
                width: 70,
                border: 'none',
                background: 'transparent',
                outline: 'none',
                fontFamily: font.head,
                fontSize: 20,
                fontWeight: 800,
                color: warm.ink,
                textAlign: 'right',
              }}
            />
            <span style={{ fontSize: 11, color: warm.muted, fontFamily: font.mono }}>
              {hasWeight && parsed < 10 ? 'kg' : 'g'}
            </span>
          </div>
        </div>

        {hasWeight && band ? (
          <div
            style={{
              background: '#FBEFE3',
              border: `1px solid ${categoryTone[band.category]}`,
              borderRadius: 14,
              padding: '14px 16px',
            }}
          >
            <div
              style={{
                fontSize: 10.5,
                fontWeight: 700,
                letterSpacing: 1,
                textTransform: 'uppercase',
                color: categoryTone[band.category],
              }}
            >
              {categoryLabel[band.category]}
            </div>
            <div
              style={{
                fontFamily: font.head,
                fontSize: 28,
                fontWeight: 800,
                letterSpacing: -0.6,
                lineHeight: 1.15,
                marginTop: 4,
              }}
            >
              {band.label}
            </div>
            <div style={{ fontSize: 11, color: warm.muted, marginTop: 2, fontFamily: font.mono }}>
              {weightGrams} g at {gaWeeks} wk
            </div>

            <div
              style={{
                marginTop: 12,
                padding: '8px 10px',
                background: '#FFF8EA',
                borderRadius: 8,
                fontSize: 11.5,
                color: warm.ink2,
                lineHeight: 1.5,
              }}
            >
              <span style={{ fontFamily: font.mono, fontSize: 10.5 }}>
                Reference anchors — P10 {band.p10} g · P50 {band.p50} g · P90 {band.p90} g
              </span>
            </div>
          </div>
        ) : (
          <div
            style={{
              background: warm.card,
              border: `1px dashed ${warm.line}`,
              borderRadius: 14,
              padding: '14px 16px',
              fontSize: 12,
              color: warm.muted,
              lineHeight: 1.5,
            }}
          >
            กรอกน้ำหนักเพื่อดู percentile band
            <br />
            <span style={{ fontFamily: font.mono, fontSize: 10.5 }}>
              SGA &lt;P10 · AGA P10–P90 · LGA &gt;P90
            </span>
          </div>
        )}

        <a
          href={PEDITOOLS_FENTON_URL}
          target="_blank"
          rel="noreferrer noopener"
          style={{
            display: 'block',
            textAlign: 'center',
            marginTop: 12,
            padding: '11px 14px',
            borderRadius: 10,
            background: warm.terra,
            color: '#fff',
            fontWeight: 700,
            fontSize: 13,
            textDecoration: 'none',
          }}
        >
          Open the official PediTools Fenton calculator →
        </a>

        <div style={{ fontSize: 10.5, color: warm.muted, marginTop: 10, lineHeight: 1.4, fontFamily: font.mono }}>
          This screen shows which percentile band a weight falls into (SGA / AGA / LGA), not a
          precise interpolated percentile. For an exact percentile, use the official PediTools
          calculator above. อ้างอิง: Fenton TR, Kim JH. BMC Pediatr 2013 · weight only.
        </div>
      </div>
    </div>
  );
}
