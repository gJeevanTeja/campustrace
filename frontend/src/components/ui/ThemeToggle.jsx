import React from 'react';
import { Sun, Moon } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '../../context/ThemeContext';

const ThemeToggle = () => {
  const { darkMode, setDarkMode } = useTheme();

  return (
    <motion.button
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      onClick={() => setDarkMode(!darkMode)}
      className="p-2.5 rounded-2xl bg-white dark:bg-slate-800 shadow-sm border border-slate-100 dark:border-slate-700 relative group transition-all hover:border-primary/20 dark:hover:border-primary/40 flex items-center justify-center overflow-hidden"
      aria-label="Toggle Theme"
    >
      <AnimatePresence mode="wait" initial={false}>
        {darkMode ? (
          <motion.div
            key="moon"
            initial={{ y: 20, opacity: 0, rotate: 45 }}
            animate={{ y: 0, opacity: 1, rotate: 0 }}
            exit={{ y: -20, opacity: 0, rotate: -45 }}
            transition={{ duration: 0.2 }}
          >
            <Moon size={20} className="text-primary group-hover:text-primary-light" />
          </motion.div>
        ) : (
          <motion.div
            key="sun"
            initial={{ y: 20, opacity: 0, rotate: -45 }}
            animate={{ y: 0, opacity: 1, rotate: 0 }}
            exit={{ y: -20, opacity: 0, rotate: 45 }}
            transition={{ duration: 0.2 }}
          >
            <Sun size={20} className="text-warning group-hover:text-warning/80" />
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Subtle background glow when dark */}
      {darkMode && (
        <span className="absolute inset-0 bg-primary/10 blur-xl opacity-50 group-hover:opacity-100 transition-opacity" />
      )}
    </motion.button>
  );
};

export default ThemeToggle;
