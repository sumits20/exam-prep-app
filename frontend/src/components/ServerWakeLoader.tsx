import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import './ServerWakeLoader.css';

const APPEAR_DELAY_MS = 3000;
const COMPLETE_HOLD_MS = 400;
const TICK_MS = 200;

// Fake progress is deliberately front-loaded and then crawls, so it reads as
// "the server really is coming up" rather than a lie that finishes on its own —
// it can approach 100% but the real response is what snaps it there.
function incrementFor(progress: number) {
  if (progress < 70) return 3;
  if (progress < 90) return 1;
  return 0.2;
}

const MESSAGES = [
  { at: 0, text: 'Starting server…' },
  { at: 35, text: 'Waking up the backend…' },
  { at: 70, text: 'Almost there…' },
  { at: 90, text: 'Just a bit longer…' },
  { at: 98, text: 'Finishing up…' },
];

function messageFor(progress: number) {
  let text = MESSAGES[0].text;
  for (const m of MESSAGES) {
    if (progress >= m.at) text = m.text;
  }
  return text;
}

export function ServerWakeLoader({ isLoading }: { isLoading: boolean }) {
  const [visible, setVisible] = useState(false);
  const [progress, setProgress] = useState(0);
  const [settling, setSettling] = useState(false);
  const prefersReducedMotion = useReducedMotion();

  const visibleRef = useRef(visible);
  visibleRef.current = visible;

  // Only reveal the loader once loading has run past the appear delay — a
  // warm-server response that lands before this fires never shows anything.
  useEffect(() => {
    if (!isLoading) return;

    const appearTimer = window.setTimeout(() => setVisible(true), APPEAR_DELAY_MS);
    return () => window.clearTimeout(appearTimer);
  }, [isLoading]);

  useEffect(() => {
    if (isLoading) {
      setSettling(false);
      setProgress(0);
    }
  }, [isLoading]);

  // Loading just finished. If we were never shown, there's nothing to unwind.
  // If we were visible, snap to 100%, hold briefly, then unmount.
  useEffect(() => {
    if (isLoading || !visibleRef.current) return;

    setSettling(true);
    setProgress(100);
    const hideTimer = window.setTimeout(() => setVisible(false), COMPLETE_HOLD_MS);
    return () => window.clearTimeout(hideTimer);
  }, [isLoading]);

  useEffect(() => {
    if (!visible || settling) return;

    const tick = window.setInterval(() => {
      setProgress((p) => Math.min(p + incrementFor(p), 99));
    }, TICK_MS);
    return () => window.clearInterval(tick);
  }, [visible, settling]);

  if (!visible) return null;

  const message = messageFor(progress);
  const displayProgress = Math.round(progress);

  return (
    <div className="server-wake" role="status" aria-live="polite">
      <div
        className="server-wake__track"
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={displayProgress}
        aria-label="Server wake-up progress"
      >
        <motion.div
          className="server-wake__fill"
          animate={{ width: `${progress}%` }}
          transition={{ duration: prefersReducedMotion ? 0 : 0.35, ease: [0.19, 1, 0.22, 1] }}
        />
      </div>

      <div className="server-wake__meta">
        <AnimatePresence mode="wait">
          <motion.p
            key={message}
            className="server-wake__message"
            initial={prefersReducedMotion ? false : { opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={prefersReducedMotion ? undefined : { opacity: 0, y: -4 }}
            transition={{ duration: prefersReducedMotion ? 0 : 0.25 }}
          >
            {message}
          </motion.p>
        </AnimatePresence>
        <span className="server-wake__percent">{displayProgress}%</span>
      </div>

      <p className="server-wake__caption">
        First login can take up to a minute — free tier backend is waking up.
      </p>
    </div>
  );
}
