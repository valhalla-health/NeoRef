// Late-Onset Sepsis (LOS) reference card.
// Ported from the prototype's los.jsx — static reference, tabbed content.
// Content preserved verbatim.

import { useState } from 'react';
import { Fragment } from 'react/jsx-runtime';
import { DisclaimerBanner } from '../../../components/Disclaimer';
import { warm, font } from '../../../theme/tokens';
import {
  AlgoStep,
  Criteria,
  DrugCard,
  InfoCard,
  Pearl,
  SectionLabel,
  TabStrip,
  TopicHero,
  TopicScreenShell,
} from '../topic/TopicHelpers';

type Tab = 'overview' | 'org' | 'wu' | 'rx';

export function LosScreen({ onBack }: { onBack?: () => void }) {
  const [tab, setTab] = useState<Tab>('overview');

  return (
    <TopicScreenShell onBack={onBack}>
      <TopicHero
        chips={[
          { tone: 'terra', label: '>72 h of life' },
          { tone: 'ochre', label: 'CONS · GBS-LOS' },
        ]}
        title="Late-Onset"
        accent="Sepsis."
        subtitle="LOS · nosocomial + late-presenting community organisms"
      />

      <TabStrip<Tab>
        tabs={[
          { k: 'overview', l: 'ภาพรวม' },
          { k: 'org', l: 'Pathogens' },
          { k: 'wu', l: 'Workup' },
          { k: 'rx', l: 'Treatment' },
        ]}
        active={tab}
        onChange={setTab}
      />

      <div style={{ flex: 1, overflowY: 'auto', padding: '14px 18px 16px' }}>
        <DisclaimerBanner compact />
        {tab === 'overview' && <LosOverview />}
        {tab === 'org' && <LosPathogens />}
        {tab === 'wu' && <LosWorkup />}
        {tab === 'rx' && <LosTreatment />}
      </div>
    </TopicScreenShell>
  );
}

function LosOverview() {
  return (
    <Fragment>
      <SectionLabel>EPIDEMIOLOGY</SectionLabel>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 8, marginBottom: 14 }}>
        <InfoCard tone="highlight" title="VLBW · LOS" accent="~20%" body="↑ ในศูนย์ที่ central line นาน" />
        <InfoCard title="Mortality · culture+" accent="11–19%" body="↑ NDI ใน survivors" />
      </div>

      <SectionLabel>DEFINITIONS</SectionLabel>
      <Criteria
        rows={[
          { l: 'Late-onset sepsis', v: '>72 h', t: 'classic cutoff' },
          { l: 'Very late-onset', v: '>7 d', t: 'some authors' },
          { l: 'Healthcare-assoc', v: 'after admission', t: 'hospital-acquired' },
          { l: 'Community LOS', v: '<28 d total', t: 'often viral / GBS' },
        ]}
      />

      <SectionLabel>RISK FACTORS</SectionLabel>
      <div style={{ display: 'grid', gap: 6, marginBottom: 14 }}>
        <AlgoStep n={1} title="Prematurity · low BW" body="Highest risk <1000 g · immature immunity · skin barrier" highlight />
        <AlgoStep n={2} title="Central lines · CLABSI risk" body="PICC · UVC ≥10 d · double-lumen · TPN dependency" />
        <AlgoStep n={3} title="Mechanical ventilation" body="ETT-related pneumonia · VAP organisms" />
        <AlgoStep n={4} title="Prolonged TPN" body="Cholestasis · Candida overgrowth · gut translocation" />
        <AlgoStep n={5} title="H2 blockers · PPI" body="↑ gastric pH → bacterial overgrowth · ↑ Candida" />
      </div>

      <Pearl tone="terra">
        Presentation often <strong>nonspecific</strong> — temperature instability, apnea, lethargy, feeding
        intolerance, color change. Don't wait for hypotension; threshold for septic workup should be low in
        preterm.
      </Pearl>
    </Fragment>
  );
}

function LosPathogens() {
  const bacteria = [
    { o: 'CONS', long: 'Coag-neg Staph', pct: '~50%', body: 'S. epidermidis dominant · indolent · CLABSI · contaminant risk', tone: warm.ochre },
    { o: 'S. aureus', long: 'incl. MRSA', pct: '~10%', body: 'Skin/soft tissue · pneumonia · endocarditis · scaled-skin', tone: warm.terra },
    { o: 'GBS', long: 'late-onset', pct: '~5%', body: 'Meningitis common · 1 wk – 3 mo · vertical or environmental', tone: warm.warn },
    { o: 'E. coli', long: 'Gram-neg', pct: '~10%', body: 'Bacteremia · UTI · meningitis · ↑ resistance', tone: warm.terra },
    { o: 'Klebsiella · Pseudomonas', long: 'Gram-neg HAI', pct: '~15%', body: 'ICU-acquired · multidrug resistance · pneumonia', tone: warm.warn },
  ];

  return (
    <Fragment>
      <SectionLabel>BACTERIAL · top 5</SectionLabel>
      <div style={{ display: 'grid', gap: 8, marginBottom: 14 }}>
        {bacteria.map((r, i) => (
          <div
            key={i}
            style={{
              background: warm.card,
              borderLeft: `4px solid ${r.tone}`,
              border: `1px solid ${warm.line}`,
              borderLeftWidth: 4,
              borderRadius: 8,
              padding: '10px 12px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 4 }}>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
                <span style={{ fontFamily: font.head, fontSize: 14, fontWeight: 800, color: warm.ink, letterSpacing: -0.2 }}>
                  {r.o}
                </span>
                <span style={{ fontSize: 10, color: warm.muted, fontFamily: font.mono }}>{r.long}</span>
              </div>
              <span style={{ fontFamily: font.head, fontSize: 14, fontWeight: 800, color: r.tone, letterSpacing: -0.2 }}>
                {r.pct}
              </span>
            </div>
            <div style={{ fontSize: 11.5, color: warm.ink2, lineHeight: 1.45 }}>{r.body}</div>
          </div>
        ))}
      </div>

      <SectionLabel>FUNGAL · think after wk 2</SectionLabel>
      <InfoCard
        tone="highlight"
        title="Candida species · ~5–10%"
        body="ELBW + prolonged TPN/abx/CVL · mortality 25–40% · meningitis 50% — always LP if blood culture+"
      />

      <Pearl tone="warn">
        Single positive CONS blood culture from a CVL ≠ contamination in a sick preterm. Repeat culture +
        clinical correlation. Two positives or persistent positives = real CLABSI.
      </Pearl>
    </Fragment>
  );
}

function LosWorkup() {
  return (
    <Fragment>
      <SectionLabel>SEPTIC WORKUP · full panel</SectionLabel>
      <div style={{ display: 'grid', gap: 6, marginBottom: 14 }}>
        <AlgoStep n={1} title="Blood culture × 2" body="Peripheral + CVL if present · ≥1 mL each · aerobic + anaerobic" highlight />
        <AlgoStep n={2} title="CBC + diff + platelets" body="Neutropenia · I:T ratio >0.2 · platelet drop" />
        <AlgoStep n={3} title="CRP + procalcitonin" body="Trend over 24–48 h · single value low sensitivity" />
        <AlgoStep n={4} title="Lumbar puncture" body="ทุกรายที่มี culture+ · suspected meningitis · seizure" />
        <AlgoStep n={5} title="Urine culture" body="Catheter or suprapubic · NOT bag · esp. UTI work-up" />
        <AlgoStep n={6} title="CXR · ETT culture" body="ถ้า respiratory symptoms / VAP suspicion" />
      </div>

      <SectionLabel>BIOMARKERS · interpret with caution</SectionLabel>
      <Criteria
        rows={[
          { l: 'CRP', v: '>10 mg/L', t: 'rise 6–8 h' },
          { l: 'PCT', v: '>2 ng/mL', t: 'rise 2–4 h' },
          { l: 'IL-6 / IL-8', v: 'research', t: 'earlier rise' },
          { l: 'I:T ratio', v: '>0.2', t: 'left-shift' },
          { l: 'Platelets', v: '<150 K', t: 'late sign' },
        ]}
      />

      <Pearl tone="sage">
        <strong>Two normal CRPs ~24 h apart + negative culture = stop antibiotics.</strong> Trend &gt; single
        value · prolonged empiric abx = ↑ Candida + NEC + LOS recurrence.
      </Pearl>
    </Fragment>
  );
}

function LosTreatment() {
  return (
    <Fragment>
      <SectionLabel>EMPIRIC REGIMEN · adjust per unit antibiogram</SectionLabel>
      <DrugCard
        name="Vancomycin"
        route="IV"
        dose="15 mg/kg q12h (adjust by SCr) · target trough 10–20"
        mech="Cell wall · MRSA + CONS coverage"
        caution="Renal monitoring · ototoxicity · red-man if rapid"
      />
      <DrugCard
        name="Gentamicin (or Amikacin)"
        route="IV"
        dose="4–5 mg/kg q24–36h · GA-adjusted"
        mech="Gram-neg coverage · aminoglycoside"
        caution="Nephro + ototoxicity · level monitoring · peak/trough"
      />
      <DrugCard
        name="Cefepime · alternative"
        route="IV"
        dose="50 mg/kg q12h"
        mech="4th-gen cephalosporin · Pseudomonas + Enterobacter cover"
        caution="ใช้เมื่อ aminoglycoside resistance สูง · CNS penetration ดี"
      />

      <SectionLabel>DURATION · culture-guided</SectionLabel>
      <Criteria
        rows={[
          { l: 'Culture negative + well', v: '48–72 h', t: 'stop' },
          { l: 'Bacteremia', v: '10–14 d', t: 'after first neg' },
          { l: 'Meningitis · GBS', v: '14–21 d', t: 'IT level' },
          { l: 'Meningitis · GNB', v: '21 d minimum', t: '+ neg CSF cx' },
          { l: 'Candidemia', v: '14 d min', t: 'after neg cx' },
        ]}
      />

      <SectionLabel>ANTIFUNGAL · if Candida</SectionLabel>
      <DrugCard
        name="Amphotericin B (conventional)"
        route="IV"
        dose="0.5–1 mg/kg/day"
        mech="Polyene · binds ergosterol"
        caution="Renal toxicity · electrolyte loss · liposomal preferred"
      />

      <Pearl tone="warn">
        <strong>Remove the line</strong> ถ้า persistent candidemia, S. aureus, Pseudomonas, or repeated CONS+.
        Source control = the single most powerful intervention.
      </Pearl>
    </Fragment>
  );
}
