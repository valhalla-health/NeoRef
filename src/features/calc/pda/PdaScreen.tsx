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
          { tone: 'ochre', label: 'SMART-PDA 2026' },
          { tone: 'sage', label: 'CNN CER 2026' },
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

      <SectionLabel>TIMING &amp; SELECTION · evidence timeline</SectionLabel>
      <div
        style={{
          background: warm.card,
          border: `1px solid ${warm.line}`,
          borderRadius: 10,
          padding: '10px 12px',
          fontSize: 12,
          color: warm.ink2,
          lineHeight: 1.6,
          marginBottom: 12,
        }}
      >
        <strong style={{ color: warm.ink }}>BeNeDuctus (2022) / BabyOSCAR (2024):</strong> Early
        routine ibuprofen ไม่ปรับ outcome ใน &lt;28–29 wk vs expectant management → shift ไปทาง
        watchful waiting.
        <br />
        <br />
        <strong style={{ color: warm.terra }}>
          SMART-PDA pilot RCT (2026, Mitra et al. · 7 NICU · n=104, &lt;26 wk GA):
        </strong>{' '}
        ทดสอบ echo-based <em>selective</em> treatment ภายใน watchful-waiting framework — screen
        echo ใน 72 ชม.แรก แล้วรักษาเฉพาะ moderate–severe shunt ใน DOL 1–7 (median onset DOL 2). 24%
        ของ SMART arm ไม่ต้องรักษาเลย. Win ratio 1.34 (85% probability of benefit) แต่ 95% CrI
        0.73–2.5 — feasibility signal, ยังไม่ powered พอสำหรับ efficacy.
        <br />
        <br />
        <strong style={{ color: warm.terra }}>
          CNN comparative-effectiveness cohort (2026 · 19 NICU · n=1356):
        </strong>{' '}
        ไม่ว่าเลือก regimen ใด primary pharmacotherapy failure ~42% เท่า ๆ กัน — คำถาม “which drug”
        อาจสำคัญน้อยกว่า “who/when to treat” · สนับสนุนแนวทาง SMART-PDA มากกว่าการเลือกยา.
      </div>

      <SectionLabel>SMART-PDA 2026 · pilot RCT snapshot</SectionLabel>
      <Criteria
        rows={[
          { l: 'Eligible infants enrolled', v: '63%', t: '95% CI 56–70%' },
          { l: 'Randomized (mean GA · BW)', v: '24.3 wk · 714 g', t: 'n=104' },
          { l: 'SMART arm never treated', v: '24%', t: 'shunt not mod-severe' },
          { l: 'Median tx onset', v: 'DOL 2', t: 'IQR 1–2.5 d' },
          { l: 'Win ratio vs control', v: '1.34', t: '85% prob. benefit' },
        ]}
      />
      <Pearl tone="warn">
        SMART-PDA is a <strong>feasibility pilot</strong>, not powered for efficacy — the win
        ratio&apos;s 95% credible interval (0.73–2.5) crosses 1. Hypothesis-generating, not yet
        practice-changing.
      </Pearl>
      <Pearl tone="terra">
        Bottom line: default ยังเป็น watchful waiting DOL 1–7. ถ้า intervene, เลือกผู้ป่วยจาก echo
        shunt-severity grading (SMART-PDA framework) มากกว่าการเลือก drug regimen — CNN CER พบว่า
        4 regimens ล้มเหลวพอ ๆ กัน (~42%).
      </Pearl>

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

      <Pearl tone="terra">
        <strong>CNN CER (2026, n=1356):</strong> Standard-dose ibuprofen, adjustable-dose
        ibuprofen, indomethacin &amp; paracetamol had statistically similar failure rates —
        ~42.3% ต้อง rescue therapy ไม่ว่าจะเลือก regimen ไหน. Treated vs untreated: lower
        mortality (aOR 0.35) but higher BPD (aOR 1.91) &amp; NEC (aOR 2.15) — authors flag
        confounding by indication/survival bias, ไม่ใช่ causal signal against treatment.
      </Pearl>

      <Pearl tone="sage">
        Always exclude <strong>duct-dependent lesions</strong> (HLHS, IAA, critical CoA) on echo
        BEFORE closing a PDA in any infant with murmur + cyanosis.
      </Pearl>
    </Fragment>
  );
}
