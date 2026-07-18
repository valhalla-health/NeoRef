import { useState } from 'react';
import { warm, font } from '../../theme/tokens';
import { DisclaimerBanner } from '../../components/Disclaimer';
import { myCurriculumDay, CURRICULUM_LENGTH } from '../../lib/today';
import { getProgress } from '../../lib/storage';
import { lessonForDay } from '../../data/lessons';
import { CALCS } from '../../data/calcs';
import { useMyStats } from '../gamify/useMyStats';
import { useAuth } from '../auth/AuthContext';

function NameEditor() {
  const { user, updateName } = useAuth();
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(user?.name ?? '');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!user) return null;

  if (!editing) {
    return (
      <button
        type="button"
        onClick={() => {
          setDraft(user.name || '');
          setError(null);
          setEditing(true);
        }}
        title="Tap to edit your name"
        style={{
          border: 'none',
          background: 'none',
          cursor: 'pointer',
          padding: 0,
          fontFamily: font.head,
          fontSize: 20,
          fontWeight: 800,
          letterSpacing: -0.4,
          color: warm.terra,
          whiteSpace: 'nowrap',
        }}
      >
        {user.name || user.email} <span style={{ fontSize: 13 }}>✏️</span>
      </button>
    );
  }

  async function save() {
    const name = draft.trim();
    if (!name) {
      setError('กรุณากรอกชื่อ');
      return;
    }
    setBusy(true);
    setError(null);
    const err = await updateName(name);
    setBusy(false);
    if (err) setError(err);
    else setEditing(false);
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
      <div style={{ display: 'flex', gap: 6 }}>
        <input
          autoFocus
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') void save();
            if (e.key === 'Escape') setEditing(false);
          }}
          disabled={busy}
          style={{
            width: 130,
            border: `1.5px solid ${warm.line}`,
            borderRadius: 8,
            padding: '4px 8px',
            fontSize: 13,
            fontFamily: font.ui,
            background: warm.card,
            color: warm.ink,
          }}
        />
        <button
          type="button"
          onClick={() => void save()}
          disabled={busy}
          style={{
            border: 'none',
            borderRadius: 8,
            background: warm.terra,
            color: '#fff',
            fontSize: 12,
            fontWeight: 700,
            padding: '4px 10px',
            cursor: busy ? 'default' : 'pointer',
            opacity: busy ? 0.7 : 1,
          }}
        >
          {busy ? '…' : 'Save'}
        </button>
        <button
          type="button"
          onClick={() => setEditing(false)}
          disabled={busy}
          style={{ border: 'none', background: 'none', color: warm.muted, fontSize: 12, cursor: 'pointer' }}
        >
          Cancel
        </button>
      </div>
      {error && <div style={{ fontSize: 11, color: warm.warn }}>{error}</div>}
    </div>
  );
}

function PasswordChanger() {
  const { user, changePassword } = useAuth();
  const [open, setOpen] = useState(false);
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  if (!user?.hasPassword) return null;

  function reset() {
    setOpen(false);
    setOldPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setError(null);
    setDone(false);
  }

  async function save() {
    if (newPassword.length < 6) {
      setError('รหัสผ่านใหม่ต้องมีอย่างน้อย 6 ตัวอักษร');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('รหัสผ่านใหม่ทั้งสองช่องไม่ตรงกัน');
      return;
    }
    setBusy(true);
    setError(null);
    const err = await changePassword(oldPassword, newPassword);
    setBusy(false);
    if (err) setError(err);
    else setDone(true);
  }

  return (
    <div style={{ position: 'relative' }}>
      <button
        type="button"
        onClick={() => setOpen(true)}
        title="Change password"
        aria-label="Change password"
        style={{
          border: 'none',
          background: 'none',
          cursor: 'pointer',
          padding: 4,
          fontSize: 15,
          lineHeight: 1,
          color: warm.muted,
        }}
      >
        🔑
      </button>
      {open && <PasswordChangerPanel onClose={reset} onSave={save} state={{ oldPassword, newPassword, confirmPassword, busy, error, done }} setters={{ setOldPassword, setNewPassword, setConfirmPassword }} />}
    </div>
  );
}

function PasswordChangerPanel({
  onClose,
  onSave,
  state,
  setters,
}: {
  onClose: () => void;
  onSave: () => void;
  state: {
    oldPassword: string;
    newPassword: string;
    confirmPassword: string;
    busy: boolean;
    error: string | null;
    done: boolean;
  };
  setters: {
    setOldPassword: (v: string) => void;
    setNewPassword: (v: string) => void;
    setConfirmPassword: (v: string) => void;
  };
}) {
  const { oldPassword, newPassword, confirmPassword, busy, error, done } = state;
  const { setOldPassword, setNewPassword, setConfirmPassword } = setters;
  return (
    <div
      style={{
        position: 'absolute',
        top: '110%',
        right: 0,
        width: 240,
        zIndex: 20,
        background: warm.card,
        border: `1.5px solid ${warm.line}`,
        borderRadius: 12,
        padding: 14,
        boxShadow: '0 4px 16px rgba(0,0,0,0.12)',
        fontFamily: font.ui,
      }}
    >
      <div style={{ fontSize: 13, fontWeight: 700, color: warm.ink, marginBottom: 10 }}>เปลี่ยนรหัสผ่าน</div>
      {done ? (
        <>
          <div style={{ fontSize: 12.5, color: warm.sage, marginBottom: 10 }}>เปลี่ยนรหัสผ่านเรียบร้อยแล้ว</div>
          <button
            type="button"
            onClick={onClose}
            style={{
              border: 'none',
              borderRadius: 8,
              background: warm.terra,
              color: '#fff',
              fontSize: 12,
              fontWeight: 700,
              padding: '6px 12px',
              cursor: 'pointer',
            }}
          >
            ปิด
          </button>
        </>
      ) : (
        <>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 10 }}>
            <input
              type="password"
              placeholder="รหัสผ่านเดิม"
              value={oldPassword}
              onChange={(e) => setOldPassword(e.target.value)}
              disabled={busy}
              style={inputStyle}
            />
            <input
              type="password"
              placeholder="รหัสผ่านใหม่ (อย่างน้อย 6 ตัวอักษร)"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              disabled={busy}
              style={inputStyle}
            />
            <input
              type="password"
              placeholder="ยืนยันรหัสผ่านใหม่"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && void onSave()}
              disabled={busy}
              style={inputStyle}
            />
          </div>
          {error && <div style={{ fontSize: 11, color: warm.warn, marginBottom: 10 }}>{error}</div>}
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              type="button"
              onClick={() => void onSave()}
              disabled={busy}
              style={{
                border: 'none',
                borderRadius: 8,
                background: warm.terra,
                color: '#fff',
                fontSize: 12,
                fontWeight: 700,
                padding: '6px 14px',
                cursor: busy ? 'default' : 'pointer',
                opacity: busy ? 0.7 : 1,
              }}
            >
              {busy ? '…' : 'บันทึก'}
            </button>
            <button
              type="button"
              onClick={onClose}
              disabled={busy}
              style={{ border: 'none', background: 'none', color: warm.muted, fontSize: 12, cursor: 'pointer' }}
            >
              ยกเลิก
            </button>
          </div>
        </>
      )}
    </div>
  );
}

const inputStyle = {
  border: `1.5px solid ${warm.line}`,
  borderRadius: 8,
  padding: '8px 10px',
  fontSize: 13,
  fontFamily: font.ui,
  background: warm.paper,
  color: warm.ink,
};

export function HomeScreen({
  onOpenCalc,
  onOpenLearn,
  onOpenLesson,
}: {
  onOpenCalc: (id: string) => void;
  onOpenLearn: () => void;
  onOpenLesson: (day: number) => void;
}) {
  const today = myCurriculumDay(); // real clock, anchored to this device's own start date — fixes C-1
  const progress = getProgress();
  const doneCount = Object.keys(progress).length;
  const pct = Math.round((doneCount / CURRICULUM_LENGTH) * 100);
  const lesson = lessonForDay(today);
  const lessonDone = Boolean(progress[String(lesson.day)]);
  const quickCalcs = CALCS.slice(0, 6);
  const stats = useMyStats();
  const { logout } = useAuth();

  return (
    <div style={{ width: '100%', height: '100%', background: warm.paper, overflowY: 'auto', overflowX: 'hidden' }}>
      <div style={{ padding: '16px 20px 8px' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontFamily: font.head, fontSize: 22, fontWeight: 800, letterSpacing: -0.4, color: warm.ink }}>
              Newborn <span style={{ color: warm.terra }}>In-Hand</span>
            </div>
            <div style={{ fontSize: 12.5, color: warm.muted, marginBottom: 12 }}>
              KCMH · Thai CPG
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 4 }}>
            <NameEditor />
            <PasswordChanger />
            <button
              type="button"
              onClick={() => {
                if (window.confirm('ออกจากระบบ?')) logout();
              }}
              title="Log out"
              aria-label="Log out"
              style={{
                border: 'none',
                background: 'none',
                cursor: 'pointer',
                padding: 4,
                fontSize: 17,
                lineHeight: 1,
                color: warm.muted,
              }}
            >
              🚪
            </button>
          </div>
        </div>

        {/* Today's lesson */}
        <div style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: warm.muted, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>
            Today · Day {today}
          </div>
          <button
            type="button"
            onClick={() => onOpenLesson(lesson.day)}
            style={{
              display: 'block',
              width: '100%',
              textAlign: 'left',
              background: lessonDone ? '#EBF5E6' : warm.card,
              border: `1.5px solid ${lessonDone ? warm.sage : warm.line}`,
              borderRadius: 16,
              padding: '14px 16px',
              cursor: 'pointer',
              fontFamily: font.ui,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
              <span style={{ fontFamily: font.mono, fontSize: 11, color: warm.muted }}>
                Ch {lesson.chapter} · {lesson.book}
              </span>
              {lessonDone && (
                <span style={{ background: warm.sage, color: '#fff', fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 999 }}>
                  ✓ Done
                </span>
              )}
            </div>
            <div style={{ fontSize: 14.5, fontWeight: 700, color: warm.ink, lineHeight: 1.3, marginBottom: 6 }}>
              {lesson.title}
            </div>
            <div style={{ fontSize: 12, color: warm.muted, fontStyle: 'italic' }}>{lesson.authors}</div>
          </button>
          <button
            type="button"
            onClick={onOpenLearn}
            style={{
              display: 'block',
              width: '100%',
              textAlign: 'right',
              border: 'none',
              background: 'none',
              color: warm.terra,
              fontSize: 12,
              fontWeight: 600,
              cursor: 'pointer',
              padding: '6px 2px 0',
              fontFamily: font.ui,
            }}
          >
            See all lessons →
          </button>
        </div>

        {/* Progress */}
        <div style={{ marginBottom: 18, background: warm.card, border: `1px solid ${warm.line}`, borderRadius: 12, padding: '10px 14px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 6 }}>
            <span style={{ fontSize: 12.5, fontWeight: 700, color: warm.ink }}>Curriculum progress</span>
            <span style={{ fontFamily: font.mono, fontSize: 11, color: warm.muted }}>
              {doneCount}/{CURRICULUM_LENGTH} · {pct}%
            </span>
          </div>
          <div style={{ height: 5, background: warm.line, borderRadius: 99 }}>
            <div style={{ height: '100%', borderRadius: 99, background: warm.sage, width: `${pct}%` }} />
          </div>
        </div>

        {/* Streak / points */}
        {stats && (
          <div style={{ display: 'flex', gap: 8, marginBottom: 18 }}>
            <div
              style={{
                flex: 1,
                background: warm.card,
                border: `1px solid ${warm.line}`,
                borderRadius: 12,
                padding: '8px 12px',
                textAlign: 'center',
              }}
            >
              <div style={{ fontSize: 16, fontWeight: 800, color: warm.terra, fontFamily: font.mono }}>
                🔥 {stats.streak}
              </div>
              <div style={{ fontSize: 10, color: warm.muted, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                day streak
              </div>
            </div>
            <div
              style={{
                flex: 1,
                background: warm.card,
                border: `1px solid ${warm.line}`,
                borderRadius: 12,
                padding: '8px 12px',
                textAlign: 'center',
              }}
            >
              <div style={{ fontSize: 16, fontWeight: 800, color: warm.sage, fontFamily: font.mono }}>
                {stats.points} pts
              </div>
              <div style={{ fontSize: 10, color: warm.muted, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                points
              </div>
            </div>
          </div>
        )}

        {/* Quick tools */}
        <div style={{ marginBottom: 24 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: warm.muted, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>
            Quick Tools
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
            {quickCalcs.map((c) => (
              <button
                key={c.id}
                type="button"
                disabled={!c.ported}
                onClick={() => c.ported && onOpenCalc(c.id)}
                style={{
                  background: warm.card,
                  border: `1.5px solid ${warm.line}`,
                  borderRadius: 12,
                  padding: '10px 8px',
                  textAlign: 'center',
                  cursor: c.ported ? 'pointer' : 'default',
                  opacity: c.ported ? 1 : 0.55,
                  fontFamily: font.ui,
                }}
              >
                <div style={{ fontSize: 20, marginBottom: 4 }} aria-hidden>
                  {c.emoji}
                </div>
                <div style={{ fontSize: 11, fontWeight: 700, color: warm.ink, lineHeight: 1.2 }}>{c.label}</div>
              </button>
            ))}
          </div>
        </div>

        <DisclaimerBanner subtle />

        <div style={{ textAlign: 'center', padding: '0 0 24px', color: warm.muted, fontSize: 11, fontFamily: font.mono }}>
          Newborn In-Hand · v2.0 · 2026
        </div>
      </div>
    </div>
  );
}
