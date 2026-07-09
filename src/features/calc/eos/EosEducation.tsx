// EOS educational screen (repositioned — see eos-content.ts).
// Keeps the prototype's input pills; replaces the invented risk number and
// antibiotic ladder with a didactic factor breakdown and a link to the real tool.

import { useState } from 'react';
import { warm, font } from '../../../theme/tokens';
import { Chip, Field, PillButton } from '../../../components/ui';
import { DisclaimerBanner } from '../../../components/Disclaimer';
import {
  eosFactors,
  KAISER_EOS_URL,
  type EosInputs,
  type Direction,
  type Exam,
  type Gbs,
  type Iap,
  type Magnitude,
} from './eos-content';

const dirGlyph: Record<Direction, string> = {
  increases: '↑',
  decreases: '↓',
  neutral: '→',
};

const dirColor: Record<Direction, string> = {
  increases: warm.warn,
  decreases: warm.sage,
  neutral: warm.muted,
};

const magLabel: Record<Magnitude, string> = {
  minor: 'minor',
  moderate: 'moderate',
  major: 'major',
};

export function EosEducation({ onBack }: { onBack?: () => void }) {
  const [gaWeeks, setGa] = useState(38);
  const [matTempC, setMatT] = useState(37.5);
  const [romHours, setRom] = useState(8);
  const [gbs, setGbs] = useState<Gbs>('neg');
  const [iap, setIap] = useState<Iap>('none');
  const [exam, setExam] = useState<Exam>('well');

  const inputs: EosInputs = { gaWeeks, matTempC, romHours, gbs, iap, exam };
  // Trivially cheap pure computation — no memoization needed.
  const factors = eosFactors(inputs);

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
          }}
        >
          ‹ เครื่องมือ
        </button>
        <span style={{ fontSize: 11, fontFamily: font.mono, color: warm.muted }}>
          Educational · Kaiser factors
        </span>
      </div>

      <div style={{ padding: '2px 22px 6px' }}>
        <div style={{ display: 'flex', gap: 6, marginBottom: 6 }}>
          <Chip tone="terra">EOS · ≥34 wk</Chip>
        </div>
        <div
          style={{
            fontFamily: font.head,
            fontSize: 24,
            lineHeight: 1.1,
            fontWeight: 800,
            letterSpacing: -0.4,
          }}
        >
          Early-Onset
          <br />
          <span style={{ color: warm.terra }}>Sepsis factors.</span>
        </div>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '6px 18px 16px' }}>
        <DisclaimerBanner compact />

        <Field label="Gestational Age" value={`${gaWeeks} wk`}>
          <div style={{ display: 'flex', gap: 4 }}>
            {[34, 35, 36, 37, 38, 39, 40, 41].map((v) => (
              <PillButton key={v} active={gaWeeks === v} onClick={() => setGa(v)}>
                {v}
              </PillButton>
            ))}
          </div>
        </Field>

        <Field label="Highest Maternal Temp" value={`${matTempC.toFixed(1)} °C`}>
          <input
            type="range"
            min={36.5}
            max={40}
            step={0.1}
            value={matTempC}
            aria-label="Highest maternal temperature in Celsius"
            onChange={(e) => setMatT(Number(e.target.value))}
            style={{ width: '100%', accentColor: warm.terra }}
          />
        </Field>

        <Field label="ROM Duration" value={`${romHours} h`}>
          <input
            type="range"
            min={0}
            max={72}
            step={1}
            value={romHours}
            aria-label="Rupture of membranes duration in hours"
            onChange={(e) => setRom(Number(e.target.value))}
            style={{ width: '100%', accentColor: warm.terra }}
          />
        </Field>

        <Field label="GBS status">
          <div style={{ display: 'flex', gap: 4 }}>
            {(
              [
                { k: 'neg', l: 'Negative' },
                { k: 'pos', l: 'Positive' },
                { k: 'unk', l: 'Unknown' },
              ] as const
            ).map((o) => (
              <PillButton
                key={o.k}
                active={gbs === o.k}
                onClick={() => setGbs(o.k)}
                style={{ fontSize: 11 }}
              >
                {o.l}
              </PillButton>
            ))}
          </div>
        </Field>

        <Field label="Intrapartum Antibiotics">
          <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
            {(
              [
                { k: 'none', l: 'None' },
                { k: 'broad', l: 'Broad' },
                { k: 'gbs', l: 'GBS spec' },
                { k: 'inad', l: 'Inadequate' },
              ] as const
            ).map((o) => (
              <PillButton
                key={o.k}
                active={iap === o.k}
                onClick={() => setIap(o.k)}
                style={{ minWidth: 60, fontSize: 11 }}
              >
                {o.l}
              </PillButton>
            ))}
          </div>
        </Field>

        <Field label="Clinical exam (post-birth)">
          <div style={{ display: 'flex', gap: 4 }}>
            {(
              [
                { k: 'well', l: 'Well' },
                { k: 'equiv', l: 'Equivocal' },
                { k: 'ill', l: 'Ill' },
              ] as const
            ).map((o) => (
              <PillButton
                key={o.k}
                active={exam === o.k}
                onClick={() => setExam(o.k)}
                style={{ fontSize: 11 }}
              >
                {o.l}
              </PillButton>
            ))}
          </div>
        </Field>

        {/* Educational factor breakdown — no score, no recommendation */}
        <div
          style={{
            background: warm.card,
            border: `1px solid ${warm.line}`,
            borderRadius: 14,
            padding: '12px 14px',
            marginTop: 8,
          }}
        >
          <div
            style={{
              fontSize: 10.5,
              fontWeight: 700,
              letterSpacing: 1,
              textTransform: 'uppercase',
              color: warm.muted,
              marginBottom: 8,
            }}
          >
            How each factor moves risk
          </div>

          {factors.map((f) => (
            <div key={f.key} style={{ padding: '8px 0', borderTop: `1px solid ${warm.line}` }}>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
                <span
                  aria-hidden
                  style={{ color: dirColor[f.direction], fontSize: 16, fontWeight: 800, width: 16 }}
                >
                  {dirGlyph[f.direction]}
                </span>
                <span style={{ flex: 1, fontSize: 13, fontWeight: 700 }}>{f.label}</span>
                <span style={{ fontFamily: font.mono, fontSize: 11, color: warm.muted }}>
                  {f.value}
                </span>
              </div>
              <div style={{ display: 'flex', gap: 8, marginLeft: 24, marginTop: 2 }}>
                <span
                  style={{
                    fontSize: 10,
                    fontWeight: 700,
                    color: dirColor[f.direction],
                    textTransform: 'uppercase',
                    letterSpacing: 0.5,
                  }}
                >
                  {f.direction === 'neutral' ? 'neutral' : `${magLabel[f.magnitude]} ${f.direction}`}
                </span>
              </div>
              <div style={{ fontSize: 11.5, color: warm.ink2, marginLeft: 24, marginTop: 3, lineHeight: 1.45 }}>
                {f.note}
              </div>
            </div>
          ))}
        </div>

        <a
          href={KAISER_EOS_URL}
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
          Open the official Kaiser EOS calculator →
        </a>

        <div
          style={{
            fontSize: 10.5,
            color: warm.muted,
            marginTop: 10,
            lineHeight: 1.4,
            fontFamily: font.mono,
          }}
        >
          This screen teaches which factors raise or lower EOS risk. It does not compute a
          patient-specific probability. For an actual quantitative estimate, use the published Kaiser
          Permanente calculator above.
        </div>
      </div>
    </div>
  );
}
