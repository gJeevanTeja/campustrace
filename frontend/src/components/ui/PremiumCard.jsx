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
        "glass-card bg-white/70 dark:bg-card/70 hover:bg-white/90 dark:hover:bg-card/90 transition-all duration-300",
        hover && "hover:shadow-premium-hover hover:border-primary/20 dark:hover:border-primary/40",
        className
      )}
    >
      {children}
    </motion.div>
  );
};

export default PremiumCard;
