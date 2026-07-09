import { useState } from 'react';
import { warm } from './theme/tokens';
import { BottomNav, type Tab } from './components/BottomNav';
import { ErrorBoundary } from './components/ErrorBoundary';
import { HomeScreen } from './features/home/HomeScreen';
import { CalcHub } from './features/calc/CalcHub';
import { CALC_SCREENS } from './features/calc/registry';
import { LearnScreen } from './features/learn/LearnScreen';
import { LessonDetail } from './features/learn/LessonDetail';
import { GamifyScreen } from './features/gamify/GamifyScreen';
import { recordToolOpen } from './lib/storage';

// Simple state-based navigation (no router needed for a 3-tab PWA).
// Sub-navigation within the Tools tab is a single `calcId` (null = hub);
// within the Learn tab it's a single `lessonDay` (null = list).
export function App() {
  const [tab, setTab] = useState<Tab>('home');
  const [calcId, setCalcId] = useState<string | null>(null);
  const [lessonDay, setLessonDay] = useState<number | null>(null);

  function switchTab(t: Tab) {
    setTab(t);
    setCalcId(null); // reset sub-nav on tab switch
    setLessonDay(null);
  }

  function openCalc(id: string) {
    recordToolOpen(id); // first open per tool counts toward gamification XP/badges
    setTab('calc');
    setCalcId(id);
  }

  function selectCalc(id: string) {
    recordToolOpen(id);
    setCalcId(id);
  }

  function openLesson(day: number) {
    setTab('learn');
    setLessonDay(day);
  }

  const CONTENT_H = 'calc(100% - 60px)';

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%', background: warm.paper }}>
      <div style={{ position: 'absolute', inset: 0, height: CONTENT_H, overflow: 'hidden' }}>
        <ErrorBoundary>
          {tab === 'home' && (
            <HomeScreen
              onOpenCalc={openCalc}
              onOpenLearn={() => switchTab('learn')}
              onOpenLesson={openLesson}
              onOpenProgress={() => switchTab('progress')}
            />
          )}

          {tab === 'calc' &&
            (() => {
              const Screen = calcId ? CALC_SCREENS[calcId] : undefined;
              return Screen ? (
                <Screen onBack={() => setCalcId(null)} />
              ) : (
                <CalcHub onSelect={selectCalc} />
              );
            })()}

          {tab === 'learn' &&
            (lessonDay !== null ? (
              <LessonDetail day={lessonDay} onBack={() => setLessonDay(null)} />
            ) : (
              <LearnScreen onOpenLesson={setLessonDay} />
            ))}

          {tab === 'progress' && <GamifyScreen />}
        </ErrorBoundary>
      </div>

      <BottomNav active={tab} onChange={switchTab} />
    </div>
  );
}
