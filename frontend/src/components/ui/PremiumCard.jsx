import React from 'react';
import { motion } from 'framer-motion';
import { twMerge } from 'tailwind-merge';

const PremiumCard = ({ children, className, hover = true, delay = 0 }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: delay }}
      whileHover={hover ? { scale: 1.02, y: -5 } : {}}
      className={twMerge(
        "glass-card bg-white/70 dark:bg-slate-900/40 hover:bg-white/90 dark:hover:bg-slate-800/60 transition-all duration-300 border border-slate-100 dark:border-slate-800/50",
        hover && "hover:shadow-premium-hover hover:border-primary/20 dark:hover:border-primary/40",
        className
      )}
    >
      {children}
    </motion.div>
  );
};

export default PremiumCard;
