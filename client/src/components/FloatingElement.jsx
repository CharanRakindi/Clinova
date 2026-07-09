import React from 'react';
import { motion } from 'framer-motion';

export const FloatingElement = ({ children, className = '', delay = 0, yOffset = 15, duration = 4 }) => {
  return (
    <motion.div
      animate={{ y: [0, -yOffset, 0] }}
      transition={{
        duration,
        repeat: Infinity,
        repeatType: "reverse",
        ease: "easeInOut",
        delay,
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
};
