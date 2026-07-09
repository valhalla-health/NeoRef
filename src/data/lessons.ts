// Lesson index (Avery 11th ed.). Ported from the prototype's inline
// AVERY_LESSONS_EXT. Typed and centralised so Home and Learn read one source.
//
// NOTE (AUDIT D-1): the prototype also shipped an unused 365-entry
// lessons-data.json that diverged from this array. Reconciling the full 365 is
// tracked as follow-up; this slice carries the 20 that existed in production.

export interface Lesson {
  /** Curriculum day (1-based). */
  d: number;
  /** Textbook chapter. */
  ch: number;
  /** Title. */
  t: string;
  /** Author(s). */
  a: string;
  /** One-line didactic hook. */
  hook: string;
}

export const AVERY_LESSONS: Lesson[] = [
  { d: 1, ch: 1, t: 'Neonatal and Perinatal Epidemiology', a: "Paneth, Patel & O'Shea", hook: 'Before you can improve outcomes — measure them correctly.' },
  { d: 2, ch: 2, t: 'Ethics, Data, and Policy in NICU', a: 'Lagatta & Lantos', hook: 'Ethical layer behind every NICU decision tree.' },
  { d: 3, ch: 3, t: 'Development, Function & Pathology of Placenta', a: 'Maltepe & Penn', hook: 'First organ — understand it to understand the newborn.' },
  { d: 4, ch: 4, t: 'Abnormalities of Fetal Growth', a: 'Rebecca A. Simmons', hook: 'SGA · IUGR · LGA — causal cascades & outcomes differ.' },
  { d: 5, ch: 5, t: 'Multiple Gestations & ART', a: 'Komorowski & Jungheim', hook: 'IVF + multiples = majority of NICU census now.' },
  { d: 6, ch: 6, t: 'Prematurity & Stillbirth: Causes and Prevention', a: 'Julia Johnson & Maneesh Batra', hook: 'Preterm + stillbirth — failure-of-pregnancy spectrum.' },
  { d: 7, ch: 7, t: 'Nonimmune Hydrops Fetalis (NIHF)', a: 'Dalal K. Taha & Scott A. Lorch', hook: '≥90 etiologies — structured workup rescues.' },
  { d: 8, ch: 8, t: 'Infant of the Diabetic Mother', a: 'Fay, Simmons & Brown', hook: 'Macrosomia + hypoglycaemia + cardiomyopathy pattern.' },
  { d: 9, ch: 9, t: 'Maternal Medical Disorders of Fetal Significance', a: 'Ballas & Kelly', hook: 'Lupus · thyroid · IBD — change neonatal outcome.' },
  { d: 10, ch: 10, t: 'Hypertensive Complications of Pregnancy', a: 'Moore', hook: 'Preeclampsia spectrum dominates delivery decisions.' },
  { d: 11, ch: 11, t: 'Intrauterine Drug Exposure', a: 'Baer, Singh & Davis', hook: 'NAS + cannabinoids + amphetamines — stigma-free care.' },
  { d: 12, ch: 12, t: 'Assessment of Fetal Well-Being', a: 'Wallace', hook: 'NST · BPP · Doppler — read better than the OB.' },
  { d: 13, ch: 13, t: 'Complicated Deliveries', a: 'Hoppe & Bosse', hook: 'Mode + shoulder dystocia + cord accidents → sets up resus.' },
  { d: 14, ch: 14, t: 'Obstetric Analgesia & Anesthesia', a: 'Sharpe, Rosen & Rollins', hook: 'Maternal meds → neonatal CNS · BP · hypothermia.' },
  { d: 15, ch: 15, t: 'Perinatal Transition & Newborn Resuscitation', a: 'Noorjahan Ali & Taylor Sawyer', hook: '~10% need help · ~1% advanced — always prepared.' },
  { d: 16, ch: 16, t: 'Care of the Newborn', a: 'Gontasz, Keiser & Aucott', hook: 'Normal nursery — where rare disease slips in.' },
  { d: 17, ch: 17, t: 'Temperature Regulation', a: 'Janessa B. Law & W. Alan Hodson', hook: 'Cold stress = preventable mortality. Plastic wrap ELBW.' },
  { d: 18, ch: 18, t: 'Fluid and Electrolyte Management', a: 'Faustino & Baumgart', hook: 'Insensible loss · ELBW skin barrier · renal maturation.' },
  { d: 19, ch: 19, t: 'Acid-Base Balance', a: 'Brion & Satlin', hook: 'Read the ABG before the monitor tells you to look.' },
  { d: 20, ch: 20, t: 'Blood Gases: Technical & Clinical Aspects', a: 'Haymond', hook: 'Pre-ductal · post-ductal · which sample matters most.' },
];

/** Lesson for a given day, or the nearest earlier available lesson, else the first. */
export function lessonForDay(day: number): Lesson {
  const exact = AVERY_LESSONS.find((l) => l.d === day);
  if (exact) return exact;
  const earlier = [...AVERY_LESSONS].reverse().find((l) => l.d <= day);
  return earlier ?? AVERY_LESSONS[0];
}
