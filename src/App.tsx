import { useEffect, useRef, useState } from 'react';
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

type NavState = { tab: Tab; calcId: string | null; lessonDay: number | null };

// Simple state-based navigation (no router needed for a 5-tab PWA).
// Sub-navigation within the Tools tab is a single `calcId` (null = hub);
// within the Learn tab it's a single `lessonDay` (null = list).
//
// Every state change here also pushes a browser history entry, and the
// on-screen "back" affordances call history.back() instead of setting state
// directly. Without this, the app has no history for the Android/PWA
// hardware back button to pop, so it closes the app straight from the first
// press instead of stepping back through screens.
export function App() {
  const { status } = useAuth();
  const [tab, setTab] = useState<Tab>('home');
  const [calcId, setCalcId] = useState<string | null>(null);
  const [lessonDay, setLessonDay] = useState<number | null>(null);
  const restoringFromHistory = useRef(false);
  const isFirstRender = useRef(true);

  useEffect(() => {
    window.history.replaceState({ tab: 'home', calcId: null, lessonDay: null } satisfies NavState, '');

    function onPopState(event: PopStateEvent) {
      const state = event.state as NavState | null;
      if (!state) return; // nothing left to restore — let the platform close the app
      restoringFromHistory.current = true;
      setTab(state.tab);
      setCalcId(state.calcId);
      setLessonDay(state.lessonDay);
    }

    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, []);

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    if (restoringFromHistory.current) {
      restoringFromHistory.current = false;
      return;
    }
    window.history.pushState({ tab, calcId, lessonDay } satisfies NavState, '');
  }, [tab, calcId, lessonDay]);

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

  function goBack() {
    window.history.back();
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
                <Screen onBack={goBack} />
              ) : (
                <CalcHub onSelect={selectCalc} />
              );
            })()}

          {tab === 'kcmh' && <KcmhScreen />}

          {tab === 'learn' &&
            (lessonDay !== null ? (
              <LessonDetail day={lessonDay} onBack={goBack} />
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
