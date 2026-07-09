// IVH (Intraventricular Hemorrhage / GMH-IVH) reference card.
// Ported from the prototype's ivh.jsx — static reference, no computation.
// Content preserved verbatim.

import { useState } from 'react';
import { Fragment } from 'react/jsx-runtime';
import { DisclaimerBanner } from '../../../components/Disclaimer';
import { warm, font } from '../../../theme/tokens';
import {
  AlgoStep,
  Criteria,
  InfoCard,
  Pearl,
  SectionLabel,
  TabStrip,
  TopicHero,
  TopicScreenShell,
} from '../topic/TopicHelpers';

type Tab = 'overview' | 'grading' | 'risk' | 'prevent';

export function IvhScreen({ onBack }: { onBack?: () => void }) {
  const [tab, setTab] = useState<Tab>('overview');

  return (
    <TopicScreenShell onBack={onBack}>
      <TopicHero
        chips={[
          { tone: 'terra', label: 'Papile · Volpe' },
          { tone: 'ochre', label: 'germinal matrix' },
        ]}
        title="Intraventricular"
        accent="Hemorrhage."
        subtitle="GMH-IVH ในทารกคลอดก่อนกำหนด · prevention is everything"
      />

      <TabStrip<Tab>
        tabs={[
          { k: 'overview', l: 'ภาพรวม' },
          { k: 'grading', l: 'Grading' },
          { k: 'risk', l: 'Risk factors' },
          { k: 'prevent', l: 'Prevention' },
        ]}
        active={tab}
        onChange={setTab}
      />

      <div style={{ flex: 1, overflowY: 'auto', padding: '14px 18px 16px' }}>
        <DisclaimerBanner compact />
        {tab === 'overview' && <IVHOverview />}
        {tab === 'grading' && <IVHGrading />}
        {tab === 'risk' && <IVHRisk />}
        {tab === 'prevent' && <IVHPrevent />}
      </div>
    </TopicScreenShell>
  );
}

function IVHOverview() {
  return (
    <Fragment>
      <SectionLabel>EPIDEMIOLOGY</SectionLabel>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 8, marginBottom: 14 }}>
        <InfoCard tone="highlight" title="ELBW · IVH any grade" accent="~25%" body="grade 3–4 ~10–15%" />
        <InfoCard title="Timing" accent="80% in 72h" body="50% within DOL 1" />
      </div>

      <SectionLabel>PATHOPHYSIOLOGY</SectionLabel>
      <div style={{ display: 'grid', gap: 6, marginBottom: 14 }}>
        <AlgoStep n={1} title="Germinal matrix · fragile vessels" body="Subependymal · highly vascular · immature endothelium" />
        <AlgoStep n={2} title="Pressure-passive cerebral flow" body="Lacks autoregulation < 32 wk · BP swings → bleed" highlight />
        <AlgoStep n={3} title="Trigger · fluctuating CBF" body="Hypoxia · hypercarbia · pneumothorax · seizure · pain" />
        <AlgoStep n={4} title="Extension to ventricle" body="Rupture into lateral ventricle → IVH ± obstructive hydroceph" />
        <AlgoStep n={5} title="PVHI · venous infarct" body={'Periventricular hemorrhagic infarction · NOT "grade IV"'} />
      </div>

      <SectionLabel>SCREENING · cranial US</SectionLabel>
      <Criteria
        rows={[
          { l: 'First HUS', v: 'DOL 3–7', t: 'all <32 wk' },
          { l: 'Repeat', v: 'DOL 10–14 + wk 4', t: 'all <32 wk' },
          { l: 'Term HUS', v: 'if HIE / seizure / sepsis', t: 'symptomatic' },
          { l: 'MRI · TEA', v: 'all <32 wk · routine', t: 'gold standard' },
        ]}
      />

      <Pearl tone="terra">
        Most GMH-IVH is <strong>clinically silent</strong> — screening HUS finds it.
        ทารก <strong>&lt;32 wk</strong> ทุกราย ต้อง screen, regardless of clinical course.
      </Pearl>
    </Fragment>
  );
}

function IVHGrading() {
  const grades = [
    { g: 'I', t: 'GMH only', body: 'Subependymal hemorrhage · germinal matrix · no IVH', tone: warm.sage, outcome: 'NDI ~same as no IVH' },
    { g: 'II', t: 'IVH no dilatation', body: 'Blood in ventricle · ventricle NOT dilated', tone: warm.sage, outcome: 'small ↑ NDI risk' },
    { g: 'III', t: 'IVH + ventriculomegaly', body: 'Blood + acute ventricular dilatation', tone: warm.ochre, outcome: '↑ NDI · PHVD risk' },
    { g: 'IV (obsolete)', t: 'PVHI (correct term)', body: 'Periventricular hemorrhagic infarction · venous infarct · NOT extension of bleed', tone: warm.warn, outcome: 'NDI 50–70%' },
  ];

  return (
    <Fragment>
      <SectionLabel>PAPILE CLASSIFICATION · 1978</SectionLabel>
      <div style={{ display: 'grid', gap: 8, marginBottom: 14 }}>
        {grades.map((r, i) => (
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
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 4 }}>
              <span style={{ fontFamily: font.head, fontSize: 16, fontWeight: 800, color: r.tone, letterSpacing: -0.3 }}>
                Grade {r.g}
              </span>
              <span style={{ fontSize: 12, fontWeight: 700, color: warm.ink }}>{r.t}</span>
            </div>
            <div style={{ fontSize: 11.5, color: warm.ink2, lineHeight: 1.45, marginBottom: 4 }}>{r.body}</div>
            <div style={{ fontSize: 10.5, color: warm.muted, fontFamily: font.mono }}>outcome · {r.outcome}</div>
          </div>
        ))}
      </div>

      <SectionLabel>POST-HEMORRHAGIC VENTRICULAR DILATION</SectionLabel>
      <Criteria
        rows={[
          { l: 'Vent Index (Levene)', v: '>4 mm above P97', t: 'PHVD' },
          { l: 'Ant Horn Width', v: '>6 mm', t: 'ventriculomegaly' },
          { l: 'Thalamo-Occip Dist', v: '>26 mm', t: 'dilated' },
          { l: 'Intervention', v: 'serial taps · reservoir', t: 'if symptomatic' },
        ]}
      />

      <Pearl tone="warn">
        "Grade IV" คำเก่า — มันไม่ใช่ extension จาก IVH แต่เป็น venous infarct ของ periventricular white
        matter. ใช้คำว่า <strong>PVHI</strong> ถูกต้องและสะท้อน mechanism ที่ต่างกัน.
      </Pearl>
    </Fragment>
  );
}

function IVHRisk() {
  return (
    <Fragment>
      <SectionLabel>NON-MODIFIABLE</SectionLabel>
      <Criteria
        rows={[
          { l: 'Gestational age', v: '<28 wk', t: 'highest risk' },
          { l: 'Birth weight', v: '<1000 g', t: 'inverse correlation' },
          { l: 'Male sex', v: 'slight ↑', t: 'OR ~1.3' },
          { l: 'Inborn vs outborn', v: 'outborn ↑', t: 'transport stress' },
        ]}
      />

      <SectionLabel>MODIFIABLE · target these</SectionLabel>
      <div style={{ display: 'grid', gap: 6, marginBottom: 14 }}>
        <AlgoStep n={1} title="Hemodynamic instability" body="BP swings · rapid volume boluses · hypotension" highlight />
        <AlgoStep n={2} title="Hypercarbia · hypocarbia" body="Both extremes ↑ IVH · target PCO₂ 45–55" />
        <AlgoStep n={3} title="Pneumothorax · barotrauma" body="↑ intrathoracic pressure → ↓ venous return → CBF surge" />
        <AlgoStep n={4} title="Painful procedures · agitation" body="Cluster care · sedation for procedures < 72h" />
        <AlgoStep n={5} title="Hypothermia at delivery" body="<36.5°C → coagulopathy · ↑ IVH" />
      </div>

      <Pearl tone="sage">
        First <strong>72 hours</strong> = critical window. Cluster care, minimize handling, head midline
        (avoid jugular venous obstruction), avoid Trendelenburg.
      </Pearl>
    </Fragment>
  );
}

function IVHPrevent() {
  return (
    <Fragment>
      <SectionLabel>PREVENTION BUNDLE</SectionLabel>
      <div style={{ display: 'grid', gap: 6, marginBottom: 14 }}>
        <AlgoStep n={1} title="Antenatal corticosteroids" body="↓ IVH all grades (Cochrane Grade 1A) · most important" highlight />
        <AlgoStep n={2} title="Delayed cord clamping ≥60s" body="↓ IVH, ↓ transfusion need · APTS 2017 trial" />
        <AlgoStep n={3} title="Avoid intubation when possible" body="CPAP first · ↓ pneumothorax · ↓ IVH" />
        <AlgoStep n={4} title="Gentle ventilation" body="Volume-targeted 4–6 mL/kg · avoid hypocarbia" />
        <AlgoStep n={5} title="Head midline · neutral first 72h" body="No Trendelenburg · minimize position changes" />
        <AlgoStep n={6} title="Indomethacin prophylaxis" body="0.1 mg/kg IV q24h × 3 doses · ↓ severe IVH (TIPP trial)" />
      </div>

      <SectionLabel>INDOMETHACIN PROPHYLAXIS · risk-benefit</SectionLabel>
      <div
        style={{
          background: warm.card,
          border: `1px solid ${warm.line}`,
          borderRadius: 10,
          padding: '10px 12px',
          fontSize: 12,
          color: warm.ink2,
          lineHeight: 1.5,
          marginBottom: 10,
        }}
      >
        <strong style={{ color: warm.sage }}>↓ Severe IVH</strong> (RR 0.66) · <strong>↓ PDA</strong> ·{' '}
        <strong>↓ pulmonary hemorrhage</strong>.
        <br />
        <strong style={{ color: warm.terra }}>BUT</strong>: no NDI benefit at 18 months (TIPP) · ↑ SIP if +
        hydrocortisone · ↓ renal perfusion.
        <br />
        ใช้ <strong>individualized</strong> ในศูนย์ที่ severe IVH สูง · ไม่ใช่ universal.
      </div>

      <Pearl tone="terra">
        "Quiet hour" first 72h: cluster care q3–4h, minimize handling, sucrose for procedures. Single
        biggest modifiable factor in this window = <strong>hemodynamic stability</strong>.
      </Pearl>

      <div style={{ fontSize: 10.5, color: warm.muted, marginTop: 12, lineHeight: 1.4, fontFamily: font.mono }}>
        อ้างอิง: Papile 1978 · Volpe 2009 · TIPP NEJM 2001 · de Vries 2004
      </div>
    </Fragment>
  );
}
