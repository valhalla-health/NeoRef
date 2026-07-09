// BPD (Bronchopulmonary Dysplasia) reference card.
// Ported from the prototype's bpd.jsx — static reference, tabs: Overview /
// Prevention / Treatment / Furosemide. Content preserved verbatim.
//
// AUDIT flag (bpd.jsx:66, unresolved — needs clinician confirmation):
// "Grade 3A = death" may mislabel the Jensen 2019 BPD grading (death is a
// separate outcome, not a grade). Ported as-is; do not reword without
// Praew's sign-off.

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

type Tab = 'overview' | 'prevent' | 'treat' | 'furo';

export function BpdScreen({ onBack }: { onBack?: () => void }) {
  const [tab, setTab] = useState<Tab>('overview');

  return (
    <TopicScreenShell onBack={onBack}>
      <TopicHero
        chips={[
          { tone: 'terra', label: 'NICHD 2018' },
          { tone: 'ochre', label: 'Jensen 2019' },
        ]}
        title="Bronchopulmonary"
        accent="Dysplasia."
        subtitle="โรคปอดเรื้อรังของทารกคลอดก่อนกำหนด · last reviewed 14 พ.ค. 2569"
      />

      <TabStrip<Tab>
        tabs={[
          { k: 'overview', l: 'ภาพรวม' },
          { k: 'prevent', l: 'Prevention' },
          { k: 'treat', l: 'Treatment' },
          { k: 'furo', l: 'Furosemide' },
        ]}
        active={tab}
        onChange={setTab}
      />

      <div style={{ flex: 1, overflowY: 'auto', padding: '14px 18px 16px' }}>
        <DisclaimerBanner compact />
        {tab === 'overview' && <BpdOverview />}
        {tab === 'prevent' && <BpdPrevent />}
        {tab === 'treat' && <BpdTreat />}
        {tab === 'furo' && <BpdFuro />}
      </div>
    </TopicScreenShell>
  );
}

function BpdOverview() {
  const grades = [
    { g: 'Grade 1', s: 'Nasal cannula ≤2 LPM', tone: 'sage' as const },
    { g: 'Grade 2', s: 'NC >2 LPM · NIV / CPAP', tone: 'ochre' as const },
    { g: 'Grade 3', s: 'Invasive ventilation (ETT) ที่ 36 wk', tone: 'terra' as const },
    // AUDIT-flagged (bpd.jsx:66, unresolved — needs clinician confirmation): "Grade 3A = death" may mislabel Jensen 2019 grading; do not reword without clinician sign-off.
    { g: 'Grade 3A', s: 'Death from respiratory cause', tone: 'warn' as const },
  ];

  const toneColor = { sage: warm.sage, ochre: warm.ochre, terra: warm.terra, warn: warm.warn } as const;

  return (
    <Fragment>
      <SectionLabel>EPIDEMIOLOGY</SectionLabel>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 8, marginBottom: 14 }}>
        <InfoCard tone="highlight" title="Incidence" accent="~40%" body="ในทารก extremely preterm (<28 wk · ELBW)" />
        <InfoCard title="Onset" body="Diagnosed at 36 wk PMA หรือ DOL 28 ในทารก <32 wk" />
      </div>

      <SectionLabel>NICHD 2018 · Severity (Jensen)</SectionLabel>
      <div style={{ display: 'grid', gap: 6, marginBottom: 14 }}>
        {grades.map((r, i) => (
          <div
            key={i}
            style={{
              display: 'flex',
              gap: 12,
              alignItems: 'center',
              background: warm.card,
              border: `1px solid ${warm.line}`,
              borderRadius: 8,
              padding: '8px 12px',
            }}
          >
            <span
              style={{
                fontFamily: font.mono,
                fontSize: 11,
                fontWeight: 700,
                color: toneColor[r.tone],
                minWidth: 60,
              }}
            >
              {r.g}
            </span>
            <span style={{ fontSize: 12, color: warm.ink2 }}>{r.s}</span>
          </div>
        ))}
      </div>

      <SectionLabel>&quot;PARADOX OF PROGRESS&quot;</SectionLabel>
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
        แม้ survival ของ extremely preterm จะดีขึ้นต่อเนื่อง แต่{' '}
        <strong style={{ color: warm.terra }}>incidence ของ BPD ไม่ลดลง</strong> — ทารกที่รอดในขีดจำกัดมีปอดที่ยังพัฒนาไม่เต็มที่
      </div>

      <Pearl tone="terra">
        BPD ใหม่ (post-surfactant era) = arrested alveolarization + dysmorphic vasculature.
        กลไกหลัก: hyperoxia + volutrauma + inflammation + nutrition deficit.
      </Pearl>
    </Fragment>
  );
}

function BpdPrevent() {
  return (
    <Fragment>
      <SectionLabel>PREVENTION BUNDLE · Evidence-based</SectionLabel>
      <div style={{ display: 'grid', gap: 6, marginBottom: 14 }}>
        <AlgoStep n={1} title="Antenatal corticosteroids" body="Single course 24–34 wk · ↓ RDS, ↓ mortality. Grade 1A" />
        <AlgoStep n={2} title="DR stabilization · CPAP first" body="หลีกเลี่ยง intubation routine · SpO₂ target 90–95% หลัง 10 min" highlight />
        <AlgoStep n={3} title="Early caffeine" body="Loading 20 mg/kg → maintenance 5–10 mg/kg/day · ลด BPD, ลด apnea (CAP trial)" />
        <AlgoStep n={4} title="Volume-targeted ventilation" body="Target 4–6 mL/kg · ↓ pneumothorax, ↓ IVH gr 3–4, ↓ BPD vs pressure-limited" />
        <AlgoStep n={5} title="Vitamin A" body="5000 IU IM × 3/wk × 4 wk · ↓ BPD modest (Tyson NEJM 1999)" />
        <AlgoStep n={6} title="Avoid late hyperoxia" body="SpO₂ 90–95% · ปิด PDA / fluid restriction ตามข้อบ่งชี้" />
      </div>

      <SectionLabel>HYDROCORTISONE PROPHYLAXIS · PREMILOC</SectionLabel>
      <div
        style={{
          background: '#FBEFE3',
          border: `1px solid ${warm.ochre}55`,
          borderRadius: 10,
          padding: '10px 12px',
          marginBottom: 10,
        }}
      >
        <div style={{ fontFamily: font.head, fontSize: 14, fontWeight: 800, color: warm.terraDeep, marginBottom: 4 }}>
          HC 1 mg/kg/day × 7d → 0.5 mg/kg/day × 3d
        </div>
        <div style={{ fontSize: 11.5, color: warm.ink2, lineHeight: 1.45 }}>
          ทารก <span style={{ fontFamily: font.mono }}>&lt;28 wk</span> ภายใน 24h หลังเกิด · เพิ่ม BPD-free survival (PREMILOC 2016)
        </div>
      </div>

      <Pearl tone="warn">
        Dexamethasone postnatal early (&lt;7d) มี neurodevelopmental risk — ใช้เฉพาะกรณี severe BPD
        course ที่ ventilator dependence ต่อเนื่อง.
      </Pearl>
    </Fragment>
  );
}

function BpdTreat() {
  return (
    <Fragment>
      <SectionLabel>RESPIRATORY SUPPORT · ตามระดับ</SectionLabel>
      <div style={{ display: 'grid', gap: 6, marginBottom: 14 }}>
        <InfoCard title="Mild BPD · Grade 1" body="HFNC หรือ low-flow NC · SpO₂ 90–95% · ค่อย wean ตาม weight gain" />
        <InfoCard title="Moderate · Grade 2" body="NIV / CPAP 5–7 cm · monitor work of breathing · diuretics PRN" tone="highlight" />
        <InfoCard title="Severe · Grade 3" body="Invasive ventilation · consider tracheostomy ถ้า ≥3 mo ETT-dependent" tone="highlight" />
      </div>

      <SectionLabel>PHARMACOLOGIC ADJUNCTS</SectionLabel>
      <DrugCard
        name="Inhaled budesonide"
        route="INH"
        dose="400 µg BID × 14 d trial"
        mech="Local anti-inflammatory · NEUROSIS trial: ↓ BPD แต่ ↑ mortality late"
        caution="ใช้ประเมินแบบ individualized · ไม่ใช่ routine"
      />
      <DrugCard
        name="Dexamethasone (late)"
        route="IV/PO"
        dose="DART regimen 0.89 mg/kg over 10d (taper)"
        mech="Strong anti-inflammatory · facilitate extubation"
        caution="หลัง 7 DOL ในกรณี ventilator-dependent · ลด dose, สั้นที่สุด"
      />
      <DrugCard
        name="Sildenafil"
        route="PO"
        dose="0.5–2 mg/kg/dose q6–8h"
        mech="PDE-5 inhibitor · BPD-associated pulmonary hypertension"
        caution="Confirm PH on echo ก่อน · monitor systemic BP"
      />

      <Pearl tone="sage">
        Nutrition is treatment: target 120–140 kcal/kg/day, protein 3.5–4 g/kg/day, restrict fluid
        120–140 mL/kg/day หากมี edema.
      </Pearl>
    </Fragment>
  );
}

function BpdFuro() {
  return (
    <Fragment>
      <SectionLabel>FUROSEMIDE IN BPD · evidence overview</SectionLabel>
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
        Short-term: ↓ pulmonary edema, ↑ compliance, ↑ oxygenation.
        <br />
        Long-term: <strong style={{ color: warm.terra }}>NO evidence</strong> ของ ↓ mortality หรือ ↓
        BPD progression. ใช้แบบ trial-based เมื่อมี clinical edema หรือ ventilator escalation.
      </div>

      <DrugCard
        name="Furosemide"
        route="IV / PO"
        dose="1 mg/kg/dose IV q12–24h · PO 2 mg/kg/dose"
        mech="Loop diuretic · ↓ preload, ↑ pulmonary compliance"
        caution="Nephrocalcinosis · ototoxicity · K⁺/Cl⁻/Ca²⁺ loss · metabolic alkalosis"
      />

      <SectionLabel>MONITORING · ทุก 3–5 วัน</SectionLabel>
      <Criteria
        rows={[
          { l: 'Na · K · Cl · HCO₃', v: 'q 3–5 d', t: 'replace as needed' },
          { l: 'Urine Ca/Cr ratio', v: '>0.2', t: 'nephrocalcinosis risk' },
          { l: 'Renal US', v: 'q 4 wk', t: 'if >4 wk Rx' },
          { l: 'OAE / ABR', v: 'before d/c', t: 'ototoxicity screen' },
        ]}
      />

      <Pearl tone="warn">
        จำกัด chronic use &gt; 2 wk continuous — alternate-day regimen หรือ chlorothiazide combo
        ลดผลข้างเคียง. Discontinue ถ้าไม่มี clinical improvement หลัง 3-day trial.
      </Pearl>

      <div style={{ fontSize: 10.5, color: warm.muted, marginTop: 12, lineHeight: 1.4, fontFamily: font.mono }}>
        อ้างอิง: Cochrane 2011 (Stewart) · Brion 2002 · Furosemide in BPD infant — Ramathibodi
      </div>
    </Fragment>
  );
}
