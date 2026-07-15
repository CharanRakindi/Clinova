import { useEffect, useState } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import BrandMark from './BrandMark';

/**
 * Product splash — brand moment using About section atmosphere
 * (slate-950 + sky/emerald light, quiet typography).
 */

const EASE = [0.16, 1, 0.3, 1];

const Splash = ({ onComplete }) => {
  const [isVisible, setIsVisible] = useState(true);
  const reducedMotion = useReducedMotion();

  useEffect(() => {
    const holdMs = reducedMotion ? 700 : 1750;
    const exitMs = reducedMotion ? 180 : 420;

    const timer = window.setTimeout(() => {
      setIsVisible(false);
      window.setTimeout(onComplete, exitMs);
    }, holdMs);

    return () => window.clearTimeout(timer);
  }, [onComplete, reducedMotion]);

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          className="bg-about-dark fixed inset-0 z-[100] flex items-center justify-center overflow-hidden"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: reducedMotion ? 0.18 : 0.42, ease: EASE }}
          role="status"
          aria-live="polite"
          aria-label="Loading Clinova"
        >
          <div className="relative flex w-full max-w-sm -translate-y-[3%] flex-col items-center px-8">
            <div className="flex flex-col items-center">
              <motion.div
                initial={reducedMotion ? false : { opacity: 0, scale: 0.94 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.55, ease: EASE }}
              >
                <BrandMark size="xl" tone="light" showWordmark={false} />
              </motion.div>

              <motion.div
                initial={reducedMotion ? false : { opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: reducedMotion ? 0 : 0.14, duration: 0.5, ease: EASE }}
                className="mt-5"
              >
                <BrandMark size="xl" tone="light" showIcon={false} />
              </motion.div>
            </div>

            <motion.p
              initial={reducedMotion ? false : { opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: reducedMotion ? 0 : 0.32, duration: 0.45, ease: EASE }}
              className="mt-4 text-center text-[13px] font-normal tracking-[-0.01em] text-white/45"
            >
              Clinical operations
            </motion.p>

            <motion.div
              initial={reducedMotion ? false : { opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: reducedMotion ? 0 : 0.4, duration: 0.3 }}
              className="mt-10 h-px w-16 overflow-hidden bg-white/[0.1]"
              aria-hidden
            >
              <motion.div
                className="h-full origin-left bg-gradient-to-r from-sky-400 via-cyan-300 to-emerald-300/90"
                initial={{ scaleX: 0 }}
                animate={{ scaleX: 1 }}
                transition={{
                  delay: reducedMotion ? 0 : 0.45,
                  duration: reducedMotion ? 0.35 : 1.05,
                  ease: [0.65, 0, 0.35, 1],
                }}
              />
            </motion.div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default Splash;
