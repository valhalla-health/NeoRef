// Neonatal Seizures reference card.
// Ported from the prototype's seizures.jsx — static reference, tabbed.
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

type Tab = 'overview' | 'rec' | 'eeg' | 'rx';

export function SeizuresScreen({ onBack }: { onBack?: () => void }) {
  const [tab, setTab] = useState<Tab>('overview');

  return (
    <TopicScreenShell onBack={onBack}>
      <TopicHero
        chips={[
          { tone: 'terra', label: 'ILAE 2021' },
          { tone: 'ochre', label: 'EEG-confirmed' },
        ]}
        title="Neonatal"
        accent="Seizures."
        subtitle="most are subclinical · EEG confirmation is mandatory"
      />

      <TabStrip<Tab>
        tabs={[
          { k: 'overview', l: 'ภาพรวม' },
          { k: 'rec', l: 'Recognition' },
          { k: 'eeg', l: 'EEG / aEEG' },
          { k: 'rx', l: 'Treatment' },
        ]}
        active={tab}
        onChange={setTab}
      />

      <div style={{ flex: 1, overflowY: 'auto', padding: '14px 18px 16px' }}>
        <DisclaimerBanner compact />
        {tab === 'overview' && <SzOverview />}
        {tab === 'rec' && <SzRec />}
        {tab === 'eeg' && <SzEEG />}
        {tab === 'rx' && <SzRx />}
      </div>
    </TopicScreenShell>
  );
}

function SzOverview() {
  const etiologies = [
    { e: 'HIE', pct: '~40%', body: 'Most common · 24–48 h onset · global cortical', tone: warm.warn },
    { e: 'Stroke · ICH', pct: '~20%', body: 'Arterial · venous · IVH · focal seizures', tone: warm.terra },
    { e: 'Infection', pct: '~10–15%', body: 'Meningitis · encephalitis · viral (HSV) · always LP', tone: warm.terra },
    { e: 'Metabolic', pct: '~5–10%', body: 'Hypoglycemia · hypoCa · hypoNa · pyridoxine-dependent', tone: warm.ochre },
    { e: 'Structural · genetic', pct: '~5%', body: 'Malformations · KCNQ2/3 · SCN2A · epileptic encephalopathies', tone: warm.sage },
  ];

  return (
    <Fragment>
      <SectionLabel>EPIDEMIOLOGY</SectionLabel>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 8, marginBottom: 14 }}>
        <InfoCard tone="highlight" title="Term · incidence" accent="1–3 / 1000" body="↑ ใน preterm · ↑↑ ใน HIE" />
        <InfoCard title="Subclinical · % of total" accent="~60–80%" body="electrographic only · EEG required" />
      </div>

      <SectionLabel>ETIOLOGIES · top 5</SectionLabel>
      <div style={{ display: 'grid', gap: 8, marginBottom: 14 }}>
        {etiologies.map((r, i) => (
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
              <span style={{ fontFamily: font.head, fontSize: 14, fontWeight: 800, color: warm.ink, letterSpacing: -0.2 }}>
                {r.e}
              </span>
              <span style={{ fontFamily: font.head, fontSize: 14, fontWeight: 800, color: r.tone, letterSpacing: -0.2 }}>
                {r.pct}
              </span>
            </div>
            <div style={{ fontSize: 11.5, color: warm.ink2, lineHeight: 1.45 }}>{r.body}</div>
          </div>
        ))}
      </div>

      <Pearl tone="terra">
        <strong>Pyridoxine challenge</strong> ใน refractory seizure without clear cause — 100 mg IV under EEG.
        Response within minutes = pyridoxine-dependent epilepsy (ALDH7A1). Lifelong B6.
      </Pearl>
    </Fragment>
  );
}

function SzRec() {
  const semiology = [
    { t: 'Subtle (most common)', body: 'Eye deviation · staring · cycling · pedaling · oral-buccal-lingual · autonomic (BP, HR, apnea)', tone: warm.terra, n: '~50%' },
    { t: 'Clonic', body: 'Rhythmic jerking · focal or multifocal · NOT suppressed by holding · EEG-correlated', tone: warm.sage, n: '~20–25%' },
    { t: 'Tonic', body: 'Sustained posturing · focal (often EEG+) vs generalized (often non-epileptic)', tone: warm.ochre, n: '~5%' },
    { t: 'Myoclonic', body: 'Single quick jerks · focal · multifocal · generalized · variable EEG correlation', tone: warm.sage, n: '~5%' },
    { t: 'Sequential', body: 'Multiple semiologies in succession · highly EEG-correlated · think etiology', tone: warm.terra, n: '~10%' },
  ];

  return (
    <Fragment>
      <SectionLabel>SEMIOLOGY · ILAE 2021 classification</SectionLabel>
      <div style={{ display: 'grid', gap: 8, marginBottom: 14 }}>
        {semiology.map((r, i) => (
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
              <span style={{ fontSize: 13, fontWeight: 700, color: warm.ink }}>{r.t}</span>
              <span style={{ fontFamily: font.mono, fontSize: 11, color: r.tone, fontWeight: 700 }}>{r.n}</span>
            </div>
            <div style={{ fontSize: 11.5, color: warm.ink2, lineHeight: 1.45 }}>{r.body}</div>
          </div>
        ))}
      </div>

      <SectionLabel>MIMICKERS · NOT seizures</SectionLabel>
      <Criteria
        rows={[
          { l: 'Jitteriness', v: 'stimulus-evoked', t: 'suppressible' },
          { l: 'Benign sleep myoclonus', v: 'sleep only', t: 'normal EEG' },
          { l: 'Hyperekplexia', v: 'startle disorder', t: 'GLRA1 gene' },
          { l: 'Apnea of prematurity', v: 'no EEG change', t: 'physiologic' },
        ]}
      />

      <Pearl tone="sage">
        Test: <strong>can you suppress it by gentle restraint?</strong> Jitteriness yes, seizure no.
        Eye involvement (deviation, nystagmus) and autonomic change → suspect seizure → EEG.
      </Pearl>
    </Fragment>
  );
}

function SzEEG() {
  return (
    <Fragment>
      <SectionLabel>WHY EEG IS MANDATORY</SectionLabel>
      <div
        style={{
          background: warm.card,
          border: `1px solid ${warm.line}`,
          borderRadius: 10,
          padding: '10px 12px',
          fontSize: 12,
          color: warm.ink2,
          lineHeight: 1.55,
          marginBottom: 12,
        }}
      >
        Up to <strong style={{ color: warm.terra }}>80%</strong> ของ EEG-confirmed seizures are clinically silent.
        <br />
        Up to <strong style={{ color: warm.terra }}>50%</strong> ของ clinical events are NOT seizures.
        <br />
        EEG/aEEG <strong>essential</strong> for diagnosis + treatment titration.
      </div>

      <SectionLabel>aEEG · bedside monitoring</SectionLabel>
      <Criteria
        rows={[
          { l: 'Normal background', v: '>10 µV cont', t: 'good prognosis' },
          { l: 'Discontinuous', v: 'gaps · burst pattern', t: 'mod abnormal' },
          { l: 'Burst-suppression', v: 'flat between bursts', t: 'severe HIE' },
          { l: 'Seizure', v: 'abrupt rise + fall', t: 'sawtooth pattern' },
          { l: 'Sleep-wake cycling', v: 'present by 36 wk', t: 'reassuring' },
        ]}
      />

      <SectionLabel>FULL EEG · gold standard</SectionLabel>
      <div style={{ display: 'grid', gap: 6, marginBottom: 14 }}>
        <AlgoStep n={1} title="Continuous video-EEG" body="Min 24 h · longer ถ้า ongoing seizures · neonatal montage (9–11 leads)" highlight />
        <AlgoStep n={2} title="Seizure definition" body="Rhythmic activity ≥10 sec · evolution in frequency/amplitude/morphology" />
        <AlgoStep n={3} title="Status epilepticus" body="Single seizure >30 min OR seizure burden >50% of recording" />
      </div>

      <Pearl tone="warn">
        aEEG misses up to <strong>50%</strong> of focal/short seizures vs full EEG. Use as <strong>screening</strong>, not as definitive.
        Always interpret aEEG with raw trace + clinical exam.
      </Pearl>
    </Fragment>
  );
}

function SzRx() {
  return (
    <Fragment>
      <SectionLabel>FIRST-LINE · ILAE / NeoLEV2 2024</SectionLabel>
      <DrugCard
        name="Phenobarbital"
        route="IV"
        dose="20 mg/kg load → 5 mg/kg/day maintenance · may repeat 10 mg/kg × 2"
        mech="GABA-A enhancement · sedation · still 1st-line"
        caution="Sedation · respiratory depression · neurodevelopmental concerns · effective only 40–50%"
      />

      <SectionLabel>SECOND-LINE · evolving</SectionLabel>
      <DrugCard
        name="Levetiracetam"
        route="IV"
        dose="40 mg/kg load → 20 mg/kg/dose q12h"
        mech="SV2A modulation · favorable safety · NeoLEV2: phenobarb still superior to LEV alone"
        caution="Not yet superior to phenobarb in RCTs · used as add-on or 1st-line in some centers"
      />
      <DrugCard
        name="Phenytoin · fosphenytoin"
        route="IV"
        dose="20 mg PE/kg load · 5 mg/kg/day maintenance"
        mech="Na-channel blocker · second-line after phenobarb"
        caution="Bradycardia · purple-glove · narrow TI · level monitoring"
      />

      <SectionLabel>REFRACTORY · 3rd-line</SectionLabel>
      <DrugCard
        name="Midazolam infusion"
        route="IV"
        dose="0.15 mg/kg bolus → 1 µg/kg/min titrate ↑ q15 min"
        mech="GABA-A enhancer · short half-life · titratable"
        caution="Sedation · hypotension · tolerance with prolonged use"
      />
      <DrugCard
        name="Lidocaine"
        route="IV"
        dose="2 mg/kg bolus → infusion (preterm-adjusted)"
        mech="Na-channel blocker · effective in refractory cases · monitor level"
        caution="ห้าม ถ้าเคยได้ phenytoin · cardiac arrhythmia · level monitoring critical"
      />

      <SectionLabel>STOP TREATMENT · when</SectionLabel>
      <Criteria
        rows={[
          { l: 'Acute symptomatic', v: 'after 72 h seizure-free', t: 'most cases' },
          { l: 'Normal exam + EEG', v: 'before discharge', t: 'usually safe' },
          { l: 'Abnormal MRI', v: 'continue 1–3 mo', t: 'individualize' },
          { l: 'Epileptic encephalopathy', v: 'continue', t: 'specialist input' },
        ]}
      />

      <Pearl tone="sage">
        Treat <strong>electrographic seizures</strong> — not just clinical events.
        Excess phenobarbital is neurotoxic · taper as soon as seizure-free + good background returns.
      </Pearl>

      <div style={{ fontSize: 10.5, color: warm.muted, marginTop: 12, lineHeight: 1.4, fontFamily: font.mono }}>
        อ้างอิง: ILAE 2021 · NeoLEV2 NEJM 2020 · WHO neonatal seizure 2023 · Pressler 2017 (Lancet Neurol)
      </div>
    </Fragment>
  );
}
