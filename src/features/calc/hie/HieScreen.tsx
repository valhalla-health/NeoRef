// HIE (Hypoxic-Ischemic Encephalopathy) reference card.
// Ported from the prototype's hie.jsx — static reference, no computation
// (AUDIT: "Static reference, clinically sound"). Content preserved verbatim.
//
// AUDIT flag (hie.jsx:140, unresolved — needs clinician confirmation):
// "BE ≥-16" is ambiguous notation (base deficit ≥16 / BE ≤ -16). Ported
// as-is; do not reword without Praew's sign-off.

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

type Tab = 'overview' | 'sarnat' | 'cool' | 'outcome';

export function HieScreen({ onBack }: { onBack?: () => void }) {
  const [tab, setTab] = useState<Tab>('overview');

  return (
    <TopicScreenShell onBack={onBack}>
      <TopicHero
        chips={[
          { tone: 'terra', label: 'Sarnat staging' },
          { tone: 'ochre', label: 'cooling 33–34°C' },
          { tone: 'ink', label: '≥36 wk' },
        ]}
        title="Hypoxic-Ischemic"
        accent="Encephalopathy."
        subtitle="time-critical · cooling within 6 hours saves brain"
      />

      <TabStrip<Tab>
        tabs={[
          { k: 'overview', l: 'ภาพรวม' },
          { k: 'sarnat', l: 'Sarnat' },
          { k: 'cool', l: 'Cooling' },
          { k: 'outcome', l: 'Outcomes' },
        ]}
        active={tab}
        onChange={setTab}
      />

      <div style={{ flex: 1, overflowY: 'auto', padding: '14px 18px 16px' }}>
        <DisclaimerBanner compact />
        {tab === 'overview' && <HieOverview />}
        {tab === 'sarnat' && <HieSarnat />}
        {tab === 'cool' && <HieCooling />}
        {tab === 'outcome' && <HieOutcomes />}
      </div>
    </TopicScreenShell>
  );
}

function HieOverview() {
  return (
    <Fragment>
      <SectionLabel>EPIDEMIOLOGY</SectionLabel>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 8, marginBottom: 14 }}>
        <InfoCard tone="highlight" title="HIE · term" accent="1–3 / 1000" body="HIC · ~20/1000 LMIC" />
        <InfoCard title="Moderate–severe NDI" accent="30–50%" body="even with cooling" />
      </div>

      <SectionLabel>PATHOPHYSIOLOGY · biphasic injury</SectionLabel>
      <div style={{ display: 'grid', gap: 6, marginBottom: 14 }}>
        <AlgoStep n={1} title="Primary energy failure" body="At insult: ATP depletion · ionic gradients lost · cytotoxic edema · necrosis" />
        <AlgoStep n={2} title="Latent phase · 1–6 h" body="Partial recovery · OXPHOS resumes — therapeutic window for cooling" highlight />
        <AlgoStep n={3} title="Secondary energy failure" body="6–72 h: mitochondrial dysfunction · excitotoxicity · apoptosis · neurodegen" />
        <AlgoStep n={4} title="Tertiary injury" body="Days–weeks: inflammation · gliosis · epigenetic dysregulation · plasticity loss" />
      </div>

      <SectionLabel>SENTINEL EVENTS</SectionLabel>
      <Criteria
        rows={[
          { l: 'Cord prolapse', v: 'acute', t: '~30%' },
          { l: 'Placental abruption', v: 'acute', t: '~20%' },
          { l: 'Uterine rupture', v: 'acute', t: 'rare · severe' },
          { l: 'Shoulder dystocia', v: 'acute', t: 'prolonged' },
          { l: 'Maternal cardiac arrest', v: 'acute', t: 'rare' },
        ]}
      />

      <Pearl tone="warn">
        Cooling window closes at <strong>6 hours of life</strong>. ทุก minute counts. Outborn
        transfer: start passive cooling (turn off radiant warmer) immediately while arranging
        transport.
      </Pearl>
    </Fragment>
  );
}

function HieSarnat() {
  const stages = [
    {
      s: 'I · Mild',
      dur: '<24 h',
      body: 'Hyperalert · jittery · ↑ muscle tone · ↑ reflexes · sympathetic predominant · NO seizures',
      tone: 'sage' as const,
      cool: 'No cooling',
    },
    {
      s: 'II · Moderate',
      dur: '2–14 d',
      body: 'Lethargy · ↓ tone · weak suck · myoclonus · seizures common · pupil constricted',
      tone: 'ochre' as const,
      cool: 'COOL ≤6h',
    },
    {
      s: 'III · Severe',
      dur: 'days–wks',
      body: 'Stupor / coma · flaccid · absent reflexes · brainstem dysfunction · seizures',
      tone: 'warn' as const,
      cool: 'COOL ≤6h',
    },
  ];

  const toneColor = { sage: warm.sage, ochre: warm.ochre, warn: warm.warn } as const;

  return (
    <Fragment>
      <SectionLabel>SARNAT STAGING · modified</SectionLabel>
      <div style={{ display: 'grid', gap: 8, marginBottom: 14 }}>
        {stages.map((r, i) => {
          const color = toneColor[r.tone];
          return (
            <div
              key={i}
              style={{
                background: warm.card,
                borderLeft: `4px solid ${color}`,
                border: `1px solid ${warm.line}`,
                borderLeftWidth: 4,
                borderRadius: 8,
                padding: '10px 12px',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'baseline',
                  gap: 8,
                  marginBottom: 4,
                  justifyContent: 'space-between',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
                  <span style={{ fontFamily: font.head, fontSize: 15, fontWeight: 800, color, letterSpacing: -0.2 }}>
                    Stage {r.s}
                  </span>
                  <span style={{ fontSize: 10, color: warm.muted, fontFamily: font.mono }}>{r.dur}</span>
                </div>
                <span
                  style={{
                    fontSize: 9,
                    padding: '2px 6px',
                    borderRadius: 4,
                    fontFamily: font.mono,
                    fontWeight: 700,
                    letterSpacing: 0.6,
                    background: `${color}22`,
                    color,
                  }}
                >
                  {r.cool}
                </span>
              </div>
              <div style={{ fontSize: 11.5, color: warm.ink2, lineHeight: 1.45 }}>{r.body}</div>
            </div>
          );
        })}
      </div>

      <SectionLabel>aEEG · objective grading</SectionLabel>
      <Criteria
        rows={[
          { l: 'Normal voltage', v: '>10 µV', t: 'Sarnat I' },
          { l: 'Moderately abnormal', v: '5–10 µV', t: 'Sarnat II' },
          { l: 'Suppressed / burst-supp', v: '<5 µV', t: 'Sarnat III' },
          { l: 'Sleep-wake cycling', v: 'absent', t: 'severe HIE' },
        ]}
      />

      <Pearl tone="terra">
        aEEG ก่อน cooling = baseline · recurring cycle every 6 h ระหว่าง cooling. Burst-suppression
        &gt;36 h = poor prognosis sign. Seizures often subclinical — only aEEG/full-EEG detects.
      </Pearl>
    </Fragment>
  );
}

function HieCooling() {
  return (
    <Fragment>
      <SectionLabel>ELIGIBILITY · A + B + C</SectionLabel>
      <Criteria
        rows={[
          { l: 'A · Gestational age', v: '≥36 wk', t: '+ ≥1800 g' },
          { l: 'A · Age', v: '<6 h', t: 'critical window' },
          // AUDIT-flagged (hie.jsx:140): "BE ≥-16" notation is ambiguous —
          // ported verbatim pending clinician confirmation.
          { l: 'B · Acidosis', v: 'pH ≤7.0', t: 'OR BE ≥-16' },
          { l: 'B · OR Apgar', v: '≤5 at 10 min', t: 'OR PPV ≥10 min' },
          { l: 'C · HIE on exam', v: 'Sarnat II–III', t: 'within 6 h' },
          { l: 'C · OR seizures', v: 'present', t: 'within 6 h' },
        ]}
      />

      <Pearl tone="terra">
        <strong>2026 update</strong> — AAP Clinical Report (Zanelli et al, Pediatrics 2026;157(2):e2025073627)
        reaffirms ≥36 0/7 wk as the only formal indication and adds a systems-of-care mandate: every
        birth center needs an action plan for prompt HIE recognition + cooling initiation or transfer;
        cooling centers must run outreach/education with referring hospitals, since most HIE infants are
        born outborn. Off-label 35 wk cooling is rising in practice — US National Inpatient Sample
        2016–2022 (n=1.4M; Aly et al, J Perinatol 2026): 19.8% vs 22.4% treated at 36 wk (p&lt;0.001), no
        difference in <em>adjusted</em> in-hospital mortality (unadjusted mortality/coagulopathy were
        higher at 35 wk) — not yet a formal indication, prospective trials pending.
      </Pearl>

      <SectionLabel>PROTOCOL · TOBY / NICHD</SectionLabel>
      <div style={{ display: 'grid', gap: 6, marginBottom: 14 }}>
        <AlgoStep n={1} title="Target temp 33.5°C ± 0.5°C" body="Rectal or esophageal probe · servo-controlled blanket" highlight />
        <AlgoStep n={2} title="Duration · 72 hours" body="From start of cooling · NOT from time of birth" />
        <AlgoStep n={3} title="Rewarm · 0.5°C/hr × 6–10 h" body="Slow rewarming — rapid rewarm → rebound seizures" />
        <AlgoStep n={4} title="Continuous aEEG / EEG" body="Detect subclinical seizures · titrate sedation" />
        <AlgoStep n={5} title="MRI · day 7–10" body="Pattern + severity predicts outcome · DWI fades after 7d" />
      </div>

      <SectionLabel>MONITORING · during cooling</SectionLabel>
      <Criteria
        rows={[
          { l: 'HR', v: '80–100 bpm', t: 'expected ↓' },
          { l: 'BP', v: 'MAP ≥40', t: 'pressors PRN' },
          { l: 'Platelets', v: 'q12h', t: 'often ↓' },
          { l: 'Glucose', v: 'q4–6h', t: 'avoid hypo/hyper' },
          { l: 'Skin · sclerema', v: 'inspect q4h', t: 'fat necrosis risk' },
        ]}
      />

      <Pearl tone="warn">
        <strong>Sedation = mandatory</strong> — fentanyl drip · cooling without sedation = shivering ·
        ↑ metabolic demand defeats the purpose. ห้าม cool ใน &lt;36 wk · &lt;1800 g · sepsis-related
        encephalopathy · coagulopathy ที่รุนแรง.
      </Pearl>
    </Fragment>
  );
}

function HieOutcomes() {
  return (
    <Fragment>
      <SectionLabel>COOLING EVIDENCE · NNT</SectionLabel>
      <Criteria
        rows={[
          { l: 'Death or major disability', v: 'NNT 7', t: 'meta-analysis' },
          { l: 'Cerebral palsy', v: 'NNT 8', t: 'survival benefit' },
          { l: 'Severe NDI at 18 mo', v: 'RR 0.77', t: 'TOBY follow-up' },
          { l: 'IQ <70 at 6–7 y', v: 'RR 0.78', t: 'persistent' },
        ]}
      />

      <SectionLabel>OUTCOMES BY SARNAT</SectionLabel>
      <div style={{ display: 'grid', gap: 6, marginBottom: 14 }}>
        <InfoCard title="Stage I · Mild" accent="~100%" body="Normal outcome — but ~25% with mild cognitive/behavioral signs at school age" />
        <InfoCard tone="highlight" title="Stage II · Moderate · cooled" accent="~50–60%" body="Normal · CP 20% · cognitive impairment 25%" />
        <InfoCard tone="highlight" title="Stage III · Severe · cooled" accent="~30%" body="Survival with significant disability · death ~25%" />
      </div>

      <SectionLabel>MRI PREDICTORS · day 7–10</SectionLabel>
      <Criteria
        rows={[
          { l: 'Basal ganglia/thalamus', v: 'restricted DWI', t: 'severe outcome' },
          { l: 'Watershed/cortical', v: 'less severe', t: 'cognitive > motor' },
          { l: 'PLIC · absent signal', v: 'present', t: '> 90% adverse' },
          { l: 'Normal MRI', v: 'reassuring', t: '>90% normal outcome' },
        ]}
      />

      <Pearl tone="sage">
        Cooling ↓ moderate-severe NDI by ~25% in Sarnat II–III · benefits persist to school age
        (TOBY follow-up). But ทุกราย ต้อง <strong>long-term follow-up</strong> — มี outcome ที่ปรากฏหลัง
        2 ปี.
      </Pearl>

      <div style={{ fontSize: 10.5, color: warm.muted, marginTop: 12, lineHeight: 1.4, fontFamily: font.mono }}>
        อ้างอิง: Sarnat 1976 · CoolCap 2005 · NICHD 2005 · TOBY 2009 · Cochrane 2013 · AAP Clinical
        Report 2026 (Pediatrics 157:e2025073627) · Aly J Perinatol 2026
      </div>
    </Fragment>
  );
}
