import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Activity } from 'lucide-react';

const Splash = ({ onComplete }) => {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    // Show for exactly 2 seconds
    const timer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(onComplete, 700); // Wait for exit animation to finish
    }, 2000);

    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-white overflow-hidden"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0, filter: 'blur(6px)' }}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
        >
          {/* Barely-there ambient field — depth, not decoration */}
          <div
            className="pointer-events-none absolute inset-0"
            style={{
              background:
                'radial-gradient(circle at 50% 42%, rgba(37,99,235,0.06) 0%, rgba(37,99,235,0) 60%)',
            }}
          />
          <div
            className="pointer-events-none absolute inset-0 opacity-[0.03]"
            style={{
              backgroundImage:
                'radial-gradient(rgba(15,23,42,0.6) 1px, transparent 1px)',
              backgroundSize: '28px 28px',
            }}
          />

          <motion.div
            initial={{ scale: 0.92, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            className="relative flex flex-col items-center"
          >
            <div className="relative mb-7">
              {/* Soft glow ring behind the mark */}
              <div
                className="absolute inset-0 -m-3 rounded-[32px] blur-xl"
                style={{ background: 'rgba(37,99,235,0.18)' }}
              />
              <div className="relative flex h-20 w-20 items-center justify-center rounded-[22px] bg-slate-900 shadow-[0_16px_40px_-12px_rgba(15,23,42,0.45)]">
                <Activity className="h-9 w-9 text-white" strokeWidth={2.25} />
              </div>
            </div>

            <motion.h1
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.28, duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
              className="text-[28px] font-semibold tracking-tight text-slate-900"
            >
              Clinova
            </motion.h1>

            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5, duration: 0.45 }}
              className="mt-1.5 text-[13px] font-medium tracking-wide text-slate-400"
            >
              Transforming Healthcare Digitally.
            </motion.p>

            {/* Intentional loading beat — not spinner theatre, a quiet line filling once */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.7, duration: 0.3 }}
              className="mt-8 h-[3px] w-28 overflow-hidden rounded-full bg-slate-100"
            >
              <motion.div
                className="h-full rounded-full bg-primary-600"
                initial={{ x: '-100%' }}
                animate={{ x: '0%' }}
                transition={{ delay: 0.75, duration: 1.05, ease: [0.65, 0, 0.35, 1] }}
              />
            </motion.div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default Splash;