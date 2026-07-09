// POCUS (Point-of-care ultrasound) bedside reference card.
// Ported from the prototype's pocus.jsx — tabbed atlas: Heart · Brain ·
// Lung/Bowel · Procedures. Static reference, no computation. Content
// preserved verbatim.
//
// AUDIT flag (pocus.jsx:46, unresolved — needs clinician confirmation):
// "bowel wall > 2.6mm = NEC concern" oversimplifies wall-thickness as the
// key sonographic sign; wall thinning and absent perfusion are more
// ominous. Ported as-is; do not reword without Praew's sign-off.

import { useState } from 'react';
import { Fragment } from 'react/jsx-runtime';
import { DisclaimerBanner } from '../../../components/Disclaimer';
import { warm, font } from '../../../theme/tokens';
import {
  Criteria,
  Pearl,
  SectionLabel,
  TabStrip,
  TopicHero,
  TopicScreenShell,
} from '../topic/TopicHelpers';

type Tab = 'heart' | 'brain' | 'body' | 'proc';

interface PocusView {
  n: string;
  name: string;
  long: string;
  body: string;
}

interface PocusMeasure {
  l: string;
  v: string;
  t: string;
}

interface PocusTabData {
  title: string;
  sub: string;
  views: PocusView[];
  measures: PocusMeasure[];
}

const POCUS_DATA: Record<Tab, PocusTabData> = {
  heart: {
    title: 'Bedside Echo',
    sub: 'preterm probe · 5–8 MHz phased array',
    views: [
      { n: '01', name: 'PLAX', long: 'Parasternal long-axis', body: 'LV size & function · LA / Ao ratio · MV · descending Ao for PDA' },
      { n: '02', name: 'PSAX', long: 'Parasternal short-axis', body: 'Great-vessel level → PDA between PA bifurcation & desc Ao · mid-vent → septal shape' },
      { n: '03', name: 'A4C', long: 'Apical 4-chamber', body: 'Biventricular function · MAPSE / TAPSE · AV valves · RVSP from TR jet' },
      { n: '04', name: 'Subcostal', long: 'Subxiphoid', body: 'IVC volume · hepatic veins · interatrial shunt · UVC tip' },
      { n: '05', name: 'Suprasternal', long: 'Aortic arch', body: 'Aortic arch · ductal arch · exclude IAA · LPA flow' },
    ],
    measures: [
      { l: 'LA / Ao', v: '>1.4', t: 'hsPDA' },
      { l: 'LPA diastolic v', v: '>0.2 m/s', t: 'L→R shunt' },
      { l: 'PDA size', v: '>1.5 mm', t: 'mod–large' },
    ],
  },
  brain: {
    title: 'Cranial US',
    sub: 'anterior fontanelle · 7–10 MHz',
    views: [
      { n: '01', name: 'Coronal', long: '6 planes anterior→posterior', body: 'Frontal → caudothalamic notch (IVH site) → posterior horn → occipital' },
      { n: '02', name: 'Sagittal midline', long: 'Midline structures', body: 'Corpus callosum · 3rd ventricle · aqueduct · 4th ventricle · vermis' },
      { n: '03', name: 'Parasagittal L/R', long: 'Bilateral', body: 'PV white matter echogenicity · lateral ventricles · choroid vs GMH' },
    ],
    measures: [
      { l: 'Vent Index (Levene)', v: '>P97 + 4 mm', t: 'PHVD' },
      { l: 'Ant Horn Width', v: '>6 mm', t: 'ventriculomegaly' },
      { l: 'Thalamo-Occip Dist', v: '>26 mm', t: 'dilated' },
    ],
  },
  body: {
    title: 'Lung & Bowel',
    sub: 'linear high-freq probe',
    views: [
      { n: '01', name: 'Lung A-lines', long: 'Anterior + lateral', body: 'Horizontal reverb · normal aeration · pleural slide present' },
      { n: '02', name: 'Lung B-lines', long: '"Wet lung"', body: '≥3 B-lines / field → interstitial syndrome · TTN, edema, early RDS' },
      { n: '03', name: 'Pneumothorax', long: 'Anterior superior', body: 'Absent pleural slide · lung point = pathognomonic' },
      { n: '04', name: 'Bowel · NEC', long: 'Curvilinear / linear', body: 'Pneumatosis · portal venous gas · free fluid · absent peristalsis · absent Doppler flow' },
    ],
    measures: [
      { l: 'B-lines per field', v: '≥3', t: 'interstitial' },
      // AUDIT-flagged (pocus.jsx:46, unresolved — needs clinician confirmation): "bowel wall > 2.6mm = NEC concern" oversimplifies; wall thinning/absent perfusion are more ominous. Do not reword without clinician sign-off.
      { l: 'Bowel wall thickness', v: '>2.6 mm', t: 'NEC concern' },
      { l: 'Free fluid · complex', v: 'present', t: 'perforation risk' },
    ],
  },
  proc: {
    title: 'Procedural',
    sub: 'real-time guidance',
    views: [
      { n: '01', name: 'UVC tip', long: 'Subcostal', body: 'Agitated saline → bubbles in RA = too high · withdraw 0.5 cm steps' },
      { n: '02', name: 'Pleurocentesis', long: 'Mark deepest pocket', body: 'Confirm effusion · mark site · real-time needle guidance · post re-expansion' },
      { n: '03', name: 'Paracentesis', long: 'Avoid bowel/vessels', body: 'Confirm ascites · mark deepest pocket · live needle tip view' },
      { n: '04', name: 'Suprapubic tap', long: 'Bladder full?', body: 'Confirm bladder filled before tap · prevents dry tap & false negatives' },
    ],
    measures: [],
  },
};

export function PocusScreen({ onBack }: { onBack?: () => void }) {
  const [tab, setTab] = useState<Tab>('heart');
  const d = POCUS_DATA[tab];

  return (
    <TopicScreenShell onBack={onBack}>
      <TopicHero
        chips={[
          { tone: 'sage', label: 'bedside atlas' },
          { tone: 'ink', label: 'imaging' },
        ]}
        title="POCUS"
        accent="in NICU"
        subtitle="probe quick-reference · point-of-care ultrasound for neonates"
      />

      <TabStrip<Tab>
        tabs={[
          { k: 'heart', l: 'Heart' },
          { k: 'brain', l: 'Brain' },
          { k: 'body', l: 'Lung/Bowel' },
          { k: 'proc', l: 'Procedural' },
        ]}
        active={tab}
        onChange={setTab}
      />

      <div style={{ flex: 1, overflowY: 'auto', padding: '14px 18px 16px' }}>
        <DisclaimerBanner compact />

        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 4, marginTop: 12 }}>
          <div style={{ fontFamily: font.head, fontSize: 16, fontWeight: 700, letterSpacing: -0.2, color: warm.ink }}>
            {d.title}
          </div>
          <div style={{ fontSize: 10.5, color: warm.muted, fontFamily: font.mono }}>{d.sub}</div>
        </div>

        <SectionLabel mb={6}>STANDARD VIEWS</SectionLabel>
        <div style={{ display: 'grid', gap: 6, marginBottom: 14 }}>
          {d.views.map((v, i) => (
            <div
              key={i}
              style={{
                background: warm.card,
                border: `1px solid ${warm.line}`,
                borderRadius: 10,
                padding: '10px 12px',
                display: 'flex',
                gap: 12,
                alignItems: 'flex-start',
              }}
            >
              <div
                style={{
                  fontFamily: font.mono,
                  fontSize: 16,
                  fontWeight: 700,
                  color: warm.terra,
                  lineHeight: 1,
                  paddingTop: 2,
                  minWidth: 24,
                }}
              >
                {v.n}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, flexWrap: 'wrap' }}>
                  <span style={{ fontSize: 13.5, fontWeight: 700, color: warm.ink }}>{v.name}</span>
                  <span style={{ fontSize: 10.5, color: warm.muted, fontFamily: font.mono }}>{v.long}</span>
                </div>
                <div style={{ fontSize: 11.5, color: warm.ink2, lineHeight: 1.45, marginTop: 3 }}>{v.body}</div>
              </div>
            </div>
          ))}
        </div>

        {d.measures.length > 0 && (
          <Fragment>
            <SectionLabel mb={6}>KEY THRESHOLDS</SectionLabel>
            <Criteria rows={d.measures} />
          </Fragment>
        )}

        {tab === 'heart' && (
          <Pearl tone="sage">
            Acoustic window is excellent in preterm — fontanelles, sternum cartilage, thin chest
            wall. Don&apos;t over-pressure the probe; light contact.
          </Pearl>
        )}
      </div>
    </TopicScreenShell>
  );
}
