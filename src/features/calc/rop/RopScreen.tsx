// ROP (Retinopathy of Prematurity) reference card.
// Ported from the prototype's rop.jsx — static reference with tabs, no
// computation. Content preserved verbatim.

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

type Tab = 'overview' | 'screen' | 'stage' | 'rx';

export function RopScreen({ onBack }: { onBack?: () => void }) {
  const [tab, setTab] = useState<Tab>('overview');

  return (
    <TopicScreenShell onBack={onBack}>
      <TopicHero
        chips={[
          { tone: 'terra', label: 'ICROP-3 · 2021' },
          { tone: 'ochre', label: 'anti-VEGF era' },
        ]}
        title="Retinopathy of"
        accent="Prematurity."
        subtitle="phase 1 vaso-obliteration + phase 2 neovascularization"
      />

      <TabStrip<Tab>
        tabs={[
          { k: 'overview', l: 'ภาพรวม' },
          { k: 'screen', l: 'Screening' },
          { k: 'stage', l: 'ICROP staging' },
          { k: 'rx', l: 'Treatment' },
        ]}
        active={tab}
        onChange={setTab}
      />

      <div style={{ flex: 1, overflowY: 'auto', padding: '14px 18px 16px' }}>
        <DisclaimerBanner compact />
        {tab === 'overview' && <RopOverview />}
        {tab === 'screen' && <RopScreening />}
        {tab === 'stage' && <RopStage />}
        {tab === 'rx' && <RopRx />}
      </div>
    </TopicScreenShell>
  );
}

function RopOverview() {
  return (
    <Fragment>
      <SectionLabel>EPIDEMIOLOGY</SectionLabel>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 8, marginBottom: 14 }}>
        <InfoCard tone="highlight" title="ELBW · any ROP" accent="~70%" body="severe (type 1) ~10–20%" />
        <InfoCard title="Blind from ROP · global" accent="~30K/yr" body={'LMIC · "ROP epidemic"'} />
      </div>

      <SectionLabel>PATHOPHYSIOLOGY · biphasic</SectionLabel>
      <div style={{ display: 'grid', gap: 6, marginBottom: 14 }}>
        <AlgoStep n={1} title="Phase 1 · vaso-obliteration" body="Birth → 30–32 wk PMA · hyperoxia ↓ VEGF · existing retinal vessels regress" highlight />
        <AlgoStep n={2} title="Avascular peripheral retina" body="Becomes hypoxic as metabolic demand ↑ with growth" />
        <AlgoStep n={3} title="Phase 2 · neovascularization" body="32–34+ wk PMA · hypoxia ↑↑ VEGF · abnormal vessels grow at vascular-avascular junction" />
        <AlgoStep n={4} title="Retinal traction · detachment" body="Fibrovascular proliferation · contraction → traction → stage 4–5" />
      </div>

      <SectionLabel>OXYGEN — the double-edged sword</SectionLabel>
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
        <strong>SUPPORT / BOOST-II:</strong> Target SpO₂ 91–95% ในสัปดาห์แรก
        <br />
        SpO₂ 85–89%: ↓ severe ROP <span style={{ fontFamily: font.mono }}>BUT</span> ↑ mortality (NeOProM meta).
        <br />
        SpO₂ 91–95%: balanced approach · standard of care.
      </div>

      <Pearl tone="terra">
        <strong>Aggressive ROP (A-ROP)</strong> ใน ICROP-3 — เร็ว, severe, plus disease, ใน zone I/II posterior.
        ELBW + sepsis + fluctuating SpO₂ = highest risk. Critical to identify early.
      </Pearl>
    </Fragment>
  );
}

function RopScreening() {
  const timing = [
    { ga: 'GA 22–27 wk', when: 'PNA 31 wk · whichever later', n: 'every 1–2 wk' },
    { ga: 'GA 28 wk', when: 'PNA 32 wk', n: 'every 1–2 wk' },
    { ga: 'GA 29 wk', when: 'PNA 33 wk', n: 'every 1–2 wk' },
    { ga: 'GA 30 wk', when: 'PNA 34 wk', n: 'every 1–2 wk' },
  ];

  return (
    <Fragment>
      <SectionLabel>SCREENING CRITERIA · AAP 2023</SectionLabel>
      <Criteria
        rows={[
          { l: 'GA at birth', v: '≤30 wk', t: 'all screen' },
          { l: 'Birth weight', v: '≤1500 g', t: 'all screen' },
          { l: 'GA 30–32 wk', v: '+ unstable course', t: 'selected' },
          { l: 'GA 32–34 wk', v: '+ high O₂ need', t: 'selected' },
        ]}
      />

      <SectionLabel>TIMING · first exam</SectionLabel>
      <div style={{ display: 'grid', gap: 8, marginBottom: 14 }}>
        {timing.map((r, i) => (
          <div
            key={i}
            style={{
              background: warm.card,
              border: `1px solid ${warm.line}`,
              borderRadius: 8,
              padding: '8px 12px',
              display: 'flex',
              alignItems: 'center',
              gap: 10,
            }}
          >
            <span style={{ fontFamily: font.mono, fontSize: 10, fontWeight: 700, color: warm.muted, letterSpacing: 0.6, minWidth: 70 }}>
              {r.ga}
            </span>
            <span style={{ fontSize: 12, color: warm.ink, fontWeight: 600, flex: 1 }}>start {r.when}</span>
            <span style={{ fontSize: 10, color: warm.terra, fontFamily: font.mono }}>{r.n}</span>
          </div>
        ))}
      </div>

      <SectionLabel>EXAM TECHNIQUE</SectionLabel>
      <div style={{ display: 'grid', gap: 6, marginBottom: 14 }}>
        <AlgoStep n={1} title="Dilation" body="Phenylephrine 1% + tropicamide 0.5% · 1 drop × 2 (30 min apart)" />
        <AlgoStep n={2} title="Indirect ophthalmoscopy" body="Scleral depression for periphery · or wide-field digital imaging (RetCam)" highlight />
        <AlgoStep n={3} title="Monitor for apnea / bradycardia" body="HR + SpO₂ during exam · pain control (sucrose · swaddling)" />
        <AlgoStep n={4} title="Document zone + stage + plus" body="Standardized terminology · clock-hour notation · photograph if possible" />
      </div>

      <Pearl tone="sage">
        Telemedicine ROP screening (digital imaging + remote read) — non-inferior to in-person in ETROP & e-ROP studies.
        ใช้ในศูนย์ที่ไม่มี ophtho on-site.
      </Pearl>
    </Fragment>
  );
}

function RopStage() {
  const stages = [
    { s: '1', t: 'Demarcation line', body: 'Flat white line separating avascular from vascular retina', tone: warm.sage },
    { s: '2', t: 'Ridge', body: 'Line has height/width · pink color · ± popcorn lesions', tone: warm.sage },
    { s: '3', t: 'Extraretinal neovascularization', body: 'Fibrovascular tissue extending from ridge into vitreous', tone: warm.ochre },
    { s: '4', t: 'Partial retinal detachment', body: '4A (extrafoveal) · 4B (involves fovea)', tone: warm.terra },
    { s: '5', t: 'Total retinal detachment', body: 'Funnel configuration · 5A open · 5B closed', tone: warm.warn },
  ];

  return (
    <Fragment>
      <SectionLabel>ICROP-3 · ZONES</SectionLabel>
      <div style={{ display: 'grid', gap: 6, marginBottom: 14 }}>
        <InfoCard tone="highlight" title="Zone I" body="Posterior · circle radius = 2× disc-fovea distance · most worrisome" />
        <InfoCard title="Zone II" body="Concentric ring from Zone I to nasal ora serrata" />
        <InfoCard title="Zone III" body="Crescent of temporal periphery · lowest risk" />
        <InfoCard title="Posterior Zone II" body="ICROP-3 new — 2 disc diameters from Zone I border · treat like Zone I" />
      </div>

      <SectionLabel>STAGES · ICROP-3</SectionLabel>
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
                Stage {r.s}
              </span>
              <span style={{ fontSize: 12, fontWeight: 700, color: warm.ink }}>{r.t}</span>
            </div>
            <div style={{ fontSize: 11.5, color: warm.ink2, lineHeight: 1.45 }}>{r.body}</div>
          </div>
        ))}
      </div>

      <SectionLabel>PLUS DISEASE · AGGRESSIVE ROP</SectionLabel>
      <Criteria
        rows={[
          { l: 'Plus disease', v: 'venous dilation + arterial tortuosity', t: '≥2 quadrants' },
          { l: 'Pre-plus', v: 'less than full plus', t: 'monitor close' },
          { l: 'Aggressive ROP (A-ROP)', v: 'rapid · severe · zone I/II', t: 'urgent Rx' },
        ]}
      />

      <Pearl tone="warn">
        <strong>&quot;Plus&quot; trumps stage</strong> — Zone I + plus → Type 1 ROP → treatment regardless of stage.
        A-ROP can progress to Stage 5 within days. Re-exam in 24–48 h if you see plus.
      </Pearl>
    </Fragment>
  );
}

function RopRx() {
  return (
    <Fragment>
      <SectionLabel>TYPE 1 ROP · treat ≤72 h</SectionLabel>
      <Criteria
        rows={[
          { l: 'Zone I', v: 'any stage + plus', t: 'TREAT' },
          { l: 'Zone I', v: 'stage 3 ± plus', t: 'TREAT' },
          { l: 'Zone II', v: 'stage 2 or 3 + plus', t: 'TREAT' },
          { l: 'A-ROP', v: 'any zone', t: 'TREAT urgent' },
        ]}
      />

      <SectionLabel>OPTIONS</SectionLabel>
      <DrugCard
        name="Bevacizumab (anti-VEGF)"
        route="Intravitreal"
        dose="0.625 mg (BEAT-ROP) or 0.25 mg (RAINBOW lower-dose)"
        mech="Anti-VEGF monoclonal antibody · regresses neovascularization"
        caution="Systemic absorption · NDI signal in some studies · ongoing long-term f/u"
      />
      <DrugCard
        name="Aflibercept · ranibizumab"
        route="Intravitreal"
        dose="Aflibercept 0.4 mg · ranibizumab 0.2 mg"
        mech="VEGF trap (aflibercept) · shorter half-life (ranibizumab)"
        caution="Less systemic effect · costlier · evolving evidence"
      />

      <SectionLabel>LASER PHOTOCOAGULATION · gold standard for periphery</SectionLabel>
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
        Diode laser to entire avascular retina · usually OR + general anesthesia.
        <br />
        <strong style={{ color: warm.terra }}>Drawback:</strong> peripheral visual field loss · myopia · post-op edema.
        <br />
        <strong style={{ color: warm.sage }}>Anti-VEGF advantage:</strong> preserves peripheral vision · allows continued vascularization · but needs longer f/u (recurrence risk).
      </div>

      <SectionLabel>SURGICAL · stage 4–5</SectionLabel>
      <InfoCard tone="highlight" title="Vitrectomy ± scleral buckle" body="Pediatric vitreoretinal surgeon · poor functional outcome in stage 5 even with anatomical success" />

      <Pearl tone="sage">
        Post-treatment f/u: anti-VEGF needs weekly exams to ≥55 wk PMA (recurrence can happen up to 70 wk).
        Laser: 1-week post-op, then monthly until vascularization completes.
      </Pearl>

      <div style={{ fontSize: 10.5, color: warm.muted, marginTop: 12, lineHeight: 1.4, fontFamily: font.mono }}>
        อ้างอิง: ICROP-3 (2021) · ETROP · BEAT-ROP · RAINBOW · AAP screening 2023
      </div>
    </Fragment>
  );
}
