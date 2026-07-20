import { useState } from 'react';
import { warm } from './theme/tokens';
import { BottomNav, type Tab } from './components/BottomNav';
import { ErrorBoundary } from './components/ErrorBoundary';
import { HomeScreen } from './features/home/HomeScreen';
import { CalcHub } from './features/calc/CalcHub';
import { CALC_SCREENS } from './features/calc/registry';
import { KcmhScreen } from './features/calc/kcmh/KcmhScreen';
import { LearnScreen } from './features/learn/LearnScreen';
import { LessonDetail } from './features/learn/LessonDetail';
import { LeaderboardScreen } from './features/gamify/LeaderboardScreen';
import { GamifyScreen } from './features/gamify/GamifyScreen';
import { useAuth } from './features/auth/AuthContext';
import { LoginScreen } from './features/auth/LoginScreen';
import { recordToolOpen, recordActivity } from './lib/storage';

// Simple state-based navigation (no router needed for a 5-tab PWA).
// Sub-navigation within the Tools tab is a single `calcId` (null = hub);
// within the Learn tab it's a single `lessonDay` (null = list).
export function App() {
  const { status } = useAuth();
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
    recordActivity(); // using a tool keeps the streak alive, even without a lesson done today
    setTab('calc');
    setCalcId(id);
  }

  function selectCalc(id: string) {
    recordToolOpen(id);
    recordActivity();
    setCalcId(id);
  }

  function openLesson(day: number) {
    setTab('learn');
    setLessonDay(day);
  }

  if (status === 'signed-out') {
    return (
      <div style={{ position: 'relative', width: '100%', height: '100%', background: warm.paper }}>
        <ErrorBoundary>
          <LoginScreen />
        </ErrorBoundary>
      </div>
    );
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
              onOpenTools={() => switchTab('calc')}
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

          {tab === 'kcmh' && <KcmhScreen />}

          {tab === 'learn' &&
            (lessonDay !== null ? (
              <LessonDetail day={lessonDay} onBack={() => setLessonDay(null)} />
            ) : (
              <LearnScreen onOpenLesson={setLessonDay} />
            ))}

          {tab === 'progress' && <GamifyScreen />}

          {tab === 'leaderboard' && <LeaderboardScreen />}
        </ErrorBoundary>
      </div>

      <BottomNav active={tab} onChange={switchTab} />
    </div>
  );
}
