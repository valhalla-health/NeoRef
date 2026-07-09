// RDS (Respiratory Distress Syndrome) reference card.
// Ported from the prototype's rds.jsx — static reference, no computation.
// Content preserved verbatim.

import { useState } from 'react';
import { Fragment } from 'react/jsx-runtime';
import { DisclaimerBanner } from '../../../components/Disclaimer';
import { warm } from '../../../theme/tokens';
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

type Tab = 'overview' | 'antenatal' | 'surf' | 'cpap';

export function RdsScreen({ onBack }: { onBack?: () => void }) {
  const [tab, setTab] = useState<Tab>('overview');

  return (
    <TopicScreenShell onBack={onBack}>
      <TopicHero
        chips={[
          { tone: 'terra', label: 'AAP 2025' },
          { tone: 'ochre', label: 'EuroCG 2023' },
        ]}
        title="Respiratory"
        accent="Distress Synd."
        subtitle="hyaline membrane disease · surfactant deficiency · preterm"
      />

      <TabStrip<Tab>
        tabs={[
          { k: 'overview', l: 'ภาพรวม' },
          { k: 'antenatal', l: 'Antenatal' },
          { k: 'surf', l: 'Surfactant' },
          { k: 'cpap', l: 'CPAP / NIV' },
        ]}
        active={tab}
        onChange={setTab}
      />

      <div style={{ flex: 1, overflowY: 'auto', padding: '14px 18px 16px' }}>
        <DisclaimerBanner compact />
        {tab === 'overview' && <RDSOverview />}
        {tab === 'antenatal' && <RDSAntenatal />}
        {tab === 'surf' && <RDSSurfactant />}
        {tab === 'cpap' && <RDSCPAP />}
      </div>
    </TopicScreenShell>
  );
}

function RDSOverview() {
  return (
    <Fragment>
      <SectionLabel>EPIDEMIOLOGY</SectionLabel>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 8, marginBottom: 14 }}>
        <InfoCard tone="highlight" title="<28 wk · RDS" accent="~95%" body="ก่อน surfactant era" />
        <InfoCard title="34–36⁶/⁷ wk · RDS" accent="~10%" body="late preterm · ไม่ควรประมาท" />
      </div>

      <SectionLabel>PATHOPHYSIOLOGY</SectionLabel>
      <div style={{ display: 'grid', gap: 6, marginBottom: 14 }}>
        <AlgoStep n={1} title="Surfactant deficiency" body="Type II pneumocyte ยังไม่สมบูรณ์ · ↓ SP-A/B/C/D" />
        <AlgoStep n={2} title="↑ Surface tension" body="Alveolar collapse on expiration · ↓ FRC" highlight />
        <AlgoStep n={3} title="V/Q mismatch + atelectasis" body="↓ compliance · ↑ work of breathing · hypoxemia" />
        <AlgoStep n={4} title="Hyaline membrane" body="Plasma proteins + fibrin deposition · inhibit residual surfactant" />
      </div>

      <SectionLabel>CLINICAL · onset within 4–6 h</SectionLabel>
      <Criteria
        rows={[
          { l: 'Tachypnea', v: '>60/min', t: 'early' },
          { l: 'Retractions', v: 'intercostal · subcostal', t: 'WoB ↑' },
          { l: 'Grunting', v: 'expiratory', t: 'auto-PEEP attempt' },
          { l: 'Nasal flaring · cyanosis', v: 'progressive', t: 'severity marker' },
        ]}
      />

      <Pearl tone="terra">
        Differential ที่พลาดไม่ได้: TTN (resolves &lt;48h) · pneumonia/EOS · MAS · pneumothorax · congenital
        heart disease (duct-dependent). CXR ground-glass + air bronchograms = classic RDS.
      </Pearl>
    </Fragment>
  );
}

function RDSAntenatal() {
  return (
    <Fragment>
      <SectionLabel>ANTENATAL CORTICOSTEROIDS · ACS</SectionLabel>
      <DrugCard
        name="Betamethasone"
        route="IM"
        dose="12 mg q24h × 2 doses"
        mech="Accelerate type II pneumocyte maturation · ↑ SP-B production"
        caution="Optimal effect 24h–7d post-dose · benefit persists ≥14d"
      />
      <DrugCard
        name="Dexamethasone"
        route="IM"
        dose="6 mg q12h × 4 doses"
        mech="Equivalent to betamethasone for fetal lung maturation"
        caution="ใช้ในที่ที่ betamethasone ไม่มี · same indications"
      />

      <SectionLabel>INDICATIONS · 2025</SectionLabel>
      <Criteria
        rows={[
          { l: 'Threatened preterm', v: '24⁰–33⁶ wk', t: 'standard' },
          { l: 'Late preterm', v: '34⁰–36⁶ wk', t: 'if delivery imminent' },
          { l: 'Repeat course', v: '≥7d after first', t: 'if still <34 wk' },
          { l: 'Rescue course', v: '24⁰–32⁶ wk', t: 'individualized' },
        ]}
      />

      <SectionLabel>EVIDENCE</SectionLabel>
      <div
        style={{
          background: warm.card,
          border: `1px solid ${warm.line}`,
          borderRadius: 10,
          padding: '10px 12px',
          fontSize: 12,
          color: warm.ink2,
          lineHeight: 1.55,
          marginBottom: 10,
        }}
      >
        Roberts &amp; Dalziel Cochrane 2017 (n &gt;7000): ACS
        <br />
        ▸ ↓ Neonatal mortality <strong>(RR 0.69)</strong>
        <br />
        ▸ ↓ RDS <strong>(RR 0.66)</strong>
        <br />
        ▸ ↓ IVH · ↓ NEC
        <br />
        ▸ Grade <strong style={{ color: warm.terra }}>1A evidence</strong>
      </div>

      <Pearl tone="sage">
        ACS เป็น single intervention ที่มี evidence แข็งที่สุดในการลด neonatal mortality. แม้ delivery
        imminent — ทุก 1 dose ยังช่วย.
      </Pearl>
    </Fragment>
  );
}

function RDSSurfactant() {
  return (
    <Fragment>
      <SectionLabel>INDICATIONS · 2025 update</SectionLabel>
      <Criteria
        rows={[
          { l: 'Intubated · any reason', v: 'give surf', t: 'immediate' },
          { l: 'CPAP failure', v: 'FiO₂ ≥ 0.30', t: '<30 wk' },
          { l: 'CPAP failure', v: 'FiO₂ ≥ 0.40', t: '≥30 wk' },
          { l: 'Prophylactic', v: 'no role', t: 'CPAP first' },
        ]}
      />

      <SectionLabel>DRUGS · porcine vs bovine</SectionLabel>
      <DrugCard
        name="Poractant alfa (Curosurf)"
        route="ETT / LISA"
        dose="200 mg/kg initial · repeat 100 mg/kg q12h ถ้าต้อง"
        mech="Porcine-derived · concentrated · smaller volume"
        caution="Higher initial dose = better outcome (CURPAP)"
      />
      <DrugCard
        name="Beractant (Survanta)"
        route="ETT"
        dose="100 mg/kg (4 mL/kg) q6h · max 4 doses"
        mech="Bovine-derived · larger volume per dose"
        caution="ต้อง split into 4 aliquots · slow"
      />

      <SectionLabel>LISA · Less Invasive Surfactant Administration</SectionLabel>
      <div style={{ display: 'grid', gap: 6, marginBottom: 14 }}>
        <AlgoStep
          n={1}
          title="Maintain on CPAP · spontaneous breath"
          body="ไม่ต้อง intubation · awake or light sedation (caffeine pre-treat)"
        />
        <AlgoStep n={2} title="Pass thin catheter" body="Through vocal cords under direct laryngoscopy" highlight />
        <AlgoStep n={3} title="Administer surf over 30–120 s" body="Stay on CPAP ตลอด procedure" />
        <AlgoStep n={4} title="Remove catheter · continue CPAP" body="Avoid IPPV unless apnea" />
      </div>

      <Pearl tone="terra">
        LISA <strong>↓ BPD/death</strong> vs INSURE (Aldana-Aguirre 2017 meta-analysis). Preferred technique
        เมื่อทำได้. Atomized surfactant (next-gen) ยังอยู่ในงานวิจัย.
      </Pearl>
    </Fragment>
  );
}

function RDSCPAP() {
  return (
    <Fragment>
      <SectionLabel>CPAP · first-line for stable infants</SectionLabel>
      <Criteria
        rows={[
          { l: 'Initial PEEP', v: '5–7 cmH₂O', t: 'titrate to WoB' },
          { l: 'Max PEEP', v: '8 cmH₂O', t: 'before escalate' },
          { l: 'FiO₂ target', v: 'SpO₂ 90–95%', t: 'avoid hyperoxia' },
          { l: 'Failure trigger', v: 'FiO₂ ≥0.30 + apnea', t: '<30 wk' },
        ]}
      />

      <SectionLabel>NIV ESCALATION LADDER</SectionLabel>
      <div style={{ display: 'grid', gap: 6, marginBottom: 14 }}>
        <AlgoStep n={1} title="CPAP 5–7 cm" body="First-line · binasal prongs · seal critical" />
        <AlgoStep n={2} title="↑ PEEP to 8 · NIPPV" body="ถ้า apnea หรือ WoB เพิ่ม" highlight />
        <AlgoStep n={3} title="Consider LISA + surfactant" body="ถ้า FiO₂ ≥0.30 (<30 wk) หรือ ≥0.40 (≥30 wk)" />
        <AlgoStep n={4} title="Intubate · volume-targeted" body="VT 4–6 mL/kg · synchronized · short ventilation goal" />
      </div>

      <SectionLabel>CAFFEINE · adjunct for &lt;30 wk</SectionLabel>
      <DrugCard
        name="Caffeine citrate"
        route="IV / PO"
        dose="20 mg/kg load → 5–10 mg/kg/day"
        mech="Adenosine antagonist · ↑ respiratory drive · ↓ apnea"
        caution="Start early (<3d) · CAP trial: ↓ BPD, ↓ ROP, ↓ NDI at 5y"
      />

      <Pearl tone="sage">
        CPAP failure ที่แท้จริง = FiO₂ + WoB ที่เพิ่มต่อเนื่อง — ไม่ใช่ mild tachypnea. Avoid premature
        escalation; intubation มี cost (volutrauma + BPD).
      </Pearl>
    </Fragment>
  );
}
