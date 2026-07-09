// NEC (Necrotizing Enterocolitis) reference card.
// Ported from the prototype's nec.jsx — static reference, no computation.
// Content preserved verbatim.
//
// AUDIT flag (nec.jsx:105, unresolved — needs clinician confirmation):
// "bowel wall > 2.6mm = NEC concern" oversimplifies; wall thinning/absent
// perfusion are more ominous. Ported as-is; do not reword without Praew's
// sign-off.

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

type Tab = 'overview' | 'dx' | 'stage' | 'mgmt';

export function NecScreen({ onBack }: { onBack?: () => void }) {
  const [tab, setTab] = useState<Tab>('overview');

  return (
    <TopicScreenShell onBack={onBack}>
      <TopicHero
        chips={[
          { tone: 'terra', label: 'Bell staging' },
          { tone: 'ochre', label: 'VLBW · ELBW' },
        ]}
        title="Necrotizing"
        accent="Enterocolitis."
        subtitle="surgical emergency in preterm gut · prevention is the only good treatment"
      />

      <TabStrip<Tab>
        tabs={[
          { k: 'overview', l: 'ภาพรวม' },
          { k: 'dx', l: 'Diagnosis' },
          { k: 'stage', l: 'Bell staging' },
          { k: 'mgmt', l: 'Management' },
        ]}
        active={tab}
        onChange={setTab}
      />

      <div style={{ flex: 1, overflowY: 'auto', padding: '14px 18px 16px' }}>
        <DisclaimerBanner compact />
        {tab === 'overview' && <NecOverview />}
        {tab === 'dx' && <NecDx />}
        {tab === 'stage' && <NecStage />}
        {tab === 'mgmt' && <NecMgmt />}
      </div>
    </TopicScreenShell>
  );
}

function NecOverview() {
  return (
    <Fragment>
      <SectionLabel>EPIDEMIOLOGY</SectionLabel>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 8, marginBottom: 14 }}>
        <InfoCard tone="highlight" title="VLBW · NEC" accent="5–12%" body="ELBW: 10–15%" />
        <InfoCard title="Mortality · surgical NEC" accent="30–50%" body="overall ~20–30%" />
      </div>

      <SectionLabel>PEAK ONSET</SectionLabel>
      <Criteria
        rows={[
          { l: 'GA <1000 g', v: 'wk 3–4', t: 'post-natal' },
          { l: 'GA <1500 g', v: 'wk 2–3', t: 'post-natal' },
          { l: 'Term · congenital heart', v: 'wk 1', t: 'low-flow gut' },
        ]}
      />

      <SectionLabel>RISK FACTORS</SectionLabel>
      <div style={{ display: 'grid', gap: 6, marginBottom: 14 }}>
        <AlgoStep n={1} title="Prematurity" body="Single strongest factor · immature gut · dysbiosis" highlight />
        <AlgoStep n={2} title="Formula feeding" body="Cow's milk-based · risk 6–10× vs exclusive human milk" />
        <AlgoStep n={3} title="Hypoxia / ischemia" body="Birth asphyxia · hsPDA · severe anemia · pressors" />
        <AlgoStep n={4} title="Antibiotic exposure" body="Prolonged empiric abx · ↓ microbiome diversity → ↑ NEC" />
        <AlgoStep n={5} title="H2 blockers · ranitidine" body="↑ gastric pH → bacterial overgrowth (Pediatrics 2006)" />
      </div>

      <Pearl tone="terra">
        Classic triad: feeding intolerance + abdominal distension + bloody stool.
        แต่ ELBW อาจมาด้วย <strong>nonspecific sepsis</strong> เท่านั้น — lethargy, apnea, temp instability.
      </Pearl>
    </Fragment>
  );
}

function NecDx() {
  return (
    <Fragment>
      <SectionLabel>CLINICAL · early signs</SectionLabel>
      <Criteria
        rows={[
          { l: 'Feeding intolerance', v: 'high residual · bilious', t: 'early' },
          { l: 'Abdominal distension', v: '+ tenderness', t: 'progressive' },
          { l: 'Bloody stool', v: 'gross / occult', t: '~25%' },
          { l: 'Systemic', v: 'apnea · temp · BP', t: 'sepsis-like' },
        ]}
      />

      <SectionLabel>RADIOLOGY · serial AXR q6h</SectionLabel>
      <div style={{ display: 'grid', gap: 6, marginBottom: 14 }}>
        <InfoCard tone="highlight" title="Pneumatosis intestinalis" body="Pathognomonic · intramural gas · curvilinear / bubbly · Bell IIa" />
        <InfoCard title="Portal venous gas" body="Linear branching gas over liver · Bell IIb · advanced" />
        <InfoCard tone="highlight" title="Free air · pneumoperitoneum" body="Football sign · Rigler's sign · Bell IIIb · SURGICAL" />
        <InfoCard title="Fixed bowel loop" body="Persistent on serial AXR ≥24h · necrotic segment" />
      </div>

      <SectionLabel>POCUS · adjunct</SectionLabel>
      <Criteria
        rows={[
          // AUDIT-flagged (nec.jsx:105, unresolved — needs clinician confirmation): "bowel wall > 2.6mm = NEC concern" oversimplifies; wall thinning/absent perfusion are more ominous. Do not reword without clinician sign-off.
          { l: 'Bowel wall thickness', v: '>2.6 mm', t: 'NEC concern' },
          { l: 'Absent Doppler flow', v: 'present', t: 'high surgical PPV' },
          { l: 'Free fluid · complex', v: 'present', t: 'perforation risk' },
          { l: 'Pneumatosis · US', v: 'detect earlier', t: 'before AXR' },
        ]}
      />

      <Pearl tone="sage">
        POCUS bowel ดีกว่า AXR ในการจับ early NEC + ประเมิน perfusion.
        Absent bowel wall vascularity + free fluid + clinical deterioration = surgical NEC.
      </Pearl>
    </Fragment>
  );
}

function NecStage() {
  const stages = [
    { s: 'IA', t: 'Suspected', body: 'Mild systemic signs · feeding intolerance · normal AXR', tone: warm.sage },
    { s: 'IB', t: 'Suspected + bloody stool', body: 'IA + grossly bloody stool · radiograph still normal', tone: warm.sage },
    { s: 'IIA', t: 'Definite · mild', body: 'Pneumatosis intestinalis · clinically stable', tone: warm.ochre },
    { s: 'IIB', t: 'Definite · moderate', body: 'Pneumatosis + portal venous gas · ± ascites', tone: warm.ochre },
    { s: 'IIIA', t: 'Advanced · intact', body: 'Critically ill · shock · DIC · neutropenia · NO perforation', tone: warm.terra },
    { s: 'IIIB', t: 'Advanced · perforation', body: 'Pneumoperitoneum · SURGICAL · highest mortality', tone: warm.warn },
  ];

  return (
    <Fragment>
      <SectionLabel>MODIFIED BELL STAGING</SectionLabel>
      <div style={{ display: 'grid', gap: 8, marginBottom: 14 }}>
        {stages.map((r, i) => (
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
              <span style={{ fontFamily: font.head, fontSize: 15, fontWeight: 800, color: r.tone, letterSpacing: -0.2 }}>
                {r.s}
              </span>
              <span style={{ fontSize: 12, fontWeight: 700, color: warm.ink }}>{r.t}</span>
            </div>
            <div style={{ fontSize: 11.5, color: warm.ink2, lineHeight: 1.45 }}>{r.body}</div>
          </div>
        ))}
      </div>

      <Pearl tone="warn">
        Stage <strong>IIIB</strong> ต้อง emergency surgery — peritoneal drain หรือ laparotomy ตาม weight + clinical course.
        Mortality up to <strong>50%</strong> · post-op short-bowel syndrome risk สูง.
      </Pearl>
    </Fragment>
  );
}

function NecMgmt() {
  return (
    <Fragment>
      <SectionLabel>BUNDLE · Stage II+</SectionLabel>
      <div style={{ display: 'grid', gap: 6, marginBottom: 14 }}>
        <AlgoStep n={1} title="NPO · bowel rest" body="Stop feeds · OG decompression · low-intermittent suction" highlight />
        <AlgoStep n={2} title="Antibiotics × 7–10 d" body="Amp + Gent ± Metronidazole (anaerobic cover ใน stage II+)" />
        <AlgoStep n={3} title="TPN + central line" body="Full nutrition support · monitor electrolytes · cholestasis risk" />
        <AlgoStep n={4} title="Surgical consult · early" body="ทุก stage II+ — preempt deterioration · serial exam" />
        <AlgoStep n={5} title="Hemodynamic support" body="Volume · platelets · FFP สำหรับ DIC · pressors PRN" />
      </div>

      <SectionLabel>PREVENTION · evidence-based</SectionLabel>
      <Criteria
        rows={[
          { l: 'Exclusive human milk', v: 'OR 0.40', t: 'strongest' },
          { l: 'Standardized feeding', v: '↓ NEC 50%', t: 'protocol-driven' },
          { l: 'Probiotics · select strains', v: 'meta-analysis', t: '↓ NEC, ↓ mortality' },
          { l: 'Avoid H2 blockers', v: 'no ranitidine', t: 'gut acidity' },
          { l: 'Avoid prolonged abx', v: '<48h empiric', t: 'preserve microbiome' },
        ]}
      />

      <Pearl tone="sage">
        Donor breast milk เมื่อ mother's milk ไม่พอ — <strong>NEC ↓ 70%</strong> vs preterm formula.
        Standardized feeding protocol อาจมีผลมากกว่า single intervention อื่นทั้งหมดรวมกัน.
      </Pearl>

      <div style={{ fontSize: 10.5, color: warm.muted, marginTop: 12, lineHeight: 1.4, fontFamily: font.mono }}>
        อ้างอิง: Bell 1978 (modified Walsh 1986) · Quigley Cochrane 2019 · Patel NEJM 2013
      </div>
    </Fragment>
  );
}
