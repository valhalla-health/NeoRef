// PDA (Patent Ductus Arteriosus) reference card.
// Ported from the prototype's pda.jsx — static reference, no computation.
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

type Tab = 'overview' | 'echo' | 'treat' | 'drugs';

export function PdaScreen({ onBack }: { onBack?: () => void }) {
  const [tab, setTab] = useState<Tab>('overview');

  return (
    <TopicScreenShell onBack={onBack}>
      <TopicHero
        chips={[
          { tone: 'terra', label: 'AHA 2024' },
          { tone: 'ochre', label: 'BabyOSCAR' },
          { tone: 'ink', label: 'Piccolo device' },
        ]}
        title="Patent Ductus"
        accent="Arteriosus."
        subtitle="hemodynamically significant PDA · preterm focus"
      />

      <TabStrip<Tab>
        tabs={[
          { k: 'overview', l: 'ภาพรวม' },
          { k: 'echo', l: 'Echo' },
          { k: 'treat', l: 'Treatment' },
          { k: 'drugs', l: 'Drugs' },
        ]}
        active={tab}
        onChange={setTab}
      />

      <div style={{ flex: 1, overflowY: 'auto', padding: '14px 18px 16px' }}>
        <DisclaimerBanner compact />
        {tab === 'overview' && <PDAOverview />}
        {tab === 'echo' && <PDAEcho />}
        {tab === 'treat' && <PDATreat />}
        {tab === 'drugs' && <PDADrugs />}
      </div>
    </TopicScreenShell>
  );
}

function PDAOverview() {
  return (
    <Fragment>
      <SectionLabel>EPIDEMIOLOGY</SectionLabel>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 8, marginBottom: 14 }}>
        <InfoCard tone="highlight" title="<28 wk · PDA" accent="~70%" body="ที่ DOL 7 ยังไม่ปิด" />
        <InfoCard title="Spontaneous closure" accent="~73%" body="ก่อน hospital d/c ใน ELBW (Semin Perinatol 2018)" />
      </div>

      <SectionLabel>HEMODYNAMICS · L→R shunt</SectionLabel>
      <div style={{ display: 'grid', gap: 6, marginBottom: 14 }}>
        <AlgoStep n={1} title="Pulmonary overcirculation" body="↑ pulmonary blood flow · pulmonary edema · ↓ compliance" />
        <AlgoStep n={2} title="Systemic steal" body="Diastolic flow reversal · ↓ mesenteric & cerebral perfusion" highlight />
        <AlgoStep n={3} title="LV volume load" body="↑ LV end-diastolic volume → ↑ LA → ↑ PCWP → pulmonary edema" />
        <AlgoStep n={4} title="Possible sequelae" body="IVH · pulmonary hemorrhage · NEC · prolonged ventilation · BPD (associated, not causal in RCTs)" />
      </div>

      <SectionLabel>&quot;POP-OFF VALVE&quot; CONSIDERATION</SectionLabel>
      <div
        style={{
          background: warm.card,
          border: `1px solid ${warm.line}`,
          borderRadius: 10,
          padding: '10px 12px',
          fontSize: 12,
          color: warm.ink2,
          lineHeight: 1.5,
          marginBottom: 12,
        }}
      >
        ใน severe pulmonary hypertension PDA อาจทำหน้าที่{' '}
        <strong style={{ color: warm.terra }}>pop-off valve</strong> ลด RV afterload — ปิด PDA
        ในกรณีนี้อาจ precipitate RV failure.
      </div>

      <Pearl tone="terra">
        JAMA 2025 meta-analysis: PVL incidence <strong>สูงกว่า</strong> ในกลุ่ม active PDA
        treatment vs conservative — sign ว่า closure อาจลด cerebral blood flow ใน vulnerable
        infants.
      </Pearl>
    </Fragment>
  );
}

function PDAEcho() {
  const views = [
    { n: 'PLAX', body: 'LV size & function · LA/Ao ratio · MV · desc Ao for PDA' },
    { n: 'PSAX', body: 'Great-vessel level → PDA between PA bifurcation & desc Ao · ductal flow pattern' },
    { n: 'A4C', body: 'Biventricular function · MAPSE / TAPSE · RVSP from TR jet' },
    { n: 'Subcostal', body: 'IVC volume · hepatic veins · interatrial shunt' },
    { n: 'Suprasternal', body: 'Ductal arch · "magic window" view of PDA · color Doppler L→R' },
  ];

  return (
    <Fragment>
      <SectionLabel>hsPDA · DEFINITION CRITERIA</SectionLabel>
      <Criteria
        rows={[
          { l: 'PDA size (PSAX)', v: '>1.5 mm/kg', t: 'large shunt' },
          { l: 'LA / Ao ratio', v: '>1.4', t: 'volume overload' },
          { l: 'LPA diastolic flow', v: '>0.2 m/s', t: 'continuous L→R' },
          { l: 'Descending Ao flow', v: 'reversal', t: 'diastolic steal' },
          { l: 'LV dimension', v: 'enlarged', t: 'chronic load' },
        ]}
      />

      <SectionLabel>5 STANDARD VIEWS</SectionLabel>
      <div style={{ display: 'grid', gap: 6, marginBottom: 12 }}>
        {views.map((v, i) => (
          <div
            key={i}
            style={{
              background: warm.card,
              border: `1px solid ${warm.line}`,
              borderRadius: 10,
              padding: '8px 12px',
              display: 'flex',
              gap: 10,
              alignItems: 'flex-start',
            }}
          >
            <span
              style={{
                fontFamily: font.mono,
                fontSize: 11,
                fontWeight: 700,
                color: warm.terra,
                minWidth: 60,
              }}
            >
              {v.n}
            </span>
            <span style={{ fontSize: 11.5, color: warm.ink2, lineHeight: 1.45, flex: 1 }}>{v.body}</span>
          </div>
        ))}
      </div>

      <Pearl tone="sage">
        Acoustic window is excellent in preterm — fontanelles, sternal cartilage, thin chest wall.
        Use <span style={{ fontFamily: font.mono }}>5–8 MHz phased array</span> · light probe
        pressure.
      </Pearl>
    </Fragment>
  );
}

function PDATreat() {
  return (
    <Fragment>
      <SectionLabel>TREATMENT STRATEGY · 2024 paradigm</SectionLabel>
      <div style={{ display: 'grid', gap: 6, marginBottom: 14 }}>
        <AlgoStep
          n={1}
          title="Conservative · default"
          body="Fluid restriction (120–140 mL/kg/d) · diuretics PRN · permissive hypercapnia · optimize ventilator"
          highlight
        />
        <AlgoStep n={2} title="Pharmacologic closure" body="พิจารณาในกรณี hsPDA + clinical deterioration · ดู Drugs tab" />
        <AlgoStep n={3} title="Surgical / transcatheter" body="ถ้า medical failure + ongoing hsPDA · Piccolo device preferred ในศูนย์ experienced" />
      </div>

      <SectionLabel>TIMING DEBATE</SectionLabel>
      <div
        style={{
          background: warm.card,
          border: `1px solid ${warm.line}`,
          borderRadius: 10,
          padding: '10px 12px',
          fontSize: 12,
          color: warm.ink2,
          lineHeight: 1.5,
          marginBottom: 14,
        }}
      >
        <strong style={{ color: warm.ink }}>BabyOSCAR (2024):</strong> Early ibuprofen ไม่ปรับ
        outcome ใน &lt;29 wk vs expectant.
        <br />
        Modern approach: <strong style={{ color: warm.terra }}>watchful waiting</strong> ใน DOL
        1–7 · intervene เฉพาะ hsPDA ที่มี clinical impact.
      </div>

      <SectionLabel>TRANSCATHETER CLOSURE · Piccolo</SectionLabel>
      <Criteria
        rows={[
          { l: 'Weight threshold', v: '≥700 g', t: 'FDA approved' },
          { l: 'Procedural success', v: '~99%', t: 'in ≤2 kg' },
          { l: 'Major adverse event', v: '~5.5%', t: 'IMPACT registry' },
          { l: 'Embolization', v: '1.3%', t: 'retrieval needed' },
        ]}
      />

      <Pearl tone="warn">
        Surgical ligation: 7–17% recurrent laryngeal nerve palsy (vocal cord paralysis) ·
        long-term dysphonia + aspiration risk → favor transcatheter where feasible.
      </Pearl>
    </Fragment>
  );
}

function PDADrugs() {
  return (
    <Fragment>
      <SectionLabel>COX INHIBITORS · 1st line</SectionLabel>
      <DrugCard
        name="Ibuprofen"
        route="IV / PO"
        dose="10 → 5 → 5 mg/kg q24h × 3 doses"
        mech="Non-selective COX inhibitor · ↓ PGE₂ → ductal constriction"
        caution="Renal dysfunction · GI bleed · oliguria · displaces bilirubin"
      />
      <DrugCard
        name="Indomethacin"
        route="IV"
        dose="0.2 mg/kg q12h × 3 doses (age-adjusted)"
        mech="COX inhibitor · also prophylactic IVH reduction"
        caution="↓ Mesenteric & renal perfusion · ↑ SIP (spontaneous intestinal perforation) ถ้า + HC"
      />

      <SectionLabel>ALTERNATIVE · less GI/renal risk</SectionLabel>
      <DrugCard
        name="Paracetamol (Acetaminophen)"
        route="IV / PO"
        dose="15 mg/kg q6h × 3–7 d"
        mech="Peroxidase inhibitor of COX · ลด PGE₂ ductal level"
        caution="Hepatotoxicity (rare ใน short course) · monitor LFT ถ้า >5 d"
      />

      <SectionLabel>CONTRAINDICATIONS · all NSAIDs</SectionLabel>
      <div
        style={{
          background: '#F0CFC5',
          border: `1px solid ${warm.warn}55`,
          borderRadius: 10,
          padding: '10px 12px',
          fontSize: 11.5,
          color: warm.ink2,
          lineHeight: 1.6,
          marginBottom: 10,
        }}
      >
        ▸ Active bleeding · IVH grade 3–4 (active)
        <br />
        ▸ Cr &gt;1.6 mg/dL หรือ urine output &lt;1 mL/kg/h
        <br />
        ▸ Platelet &lt;50,000 · NEC
        <br />
        ▸ Duct-dependent CHD (always rule out!)
      </div>

      <Pearl tone="sage">
        Always exclude <strong>duct-dependent lesions</strong> (HLHS, IAA, critical CoA) on echo
        BEFORE closing a PDA in any infant with murmur + cyanosis.
      </Pearl>
    </Fragment>
  );
}
