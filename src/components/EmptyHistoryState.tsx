import React from 'react';
import { motion } from 'framer-motion';
import { ClipboardIcon } from '@heroicons/react/24/outline';

interface EmptyHistoryStateProps {
  onStartNew: () => void;
}

export function EmptyHistoryState({ onStartNew }: EmptyHistoryStateProps) {
  return (
    <motion.div
      className="text-center py-12"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div className="flex justify-center">
        <motion.div
          className="p-4 rounded-full bg-secondary-800 border-2 border-primary-500/20 shadow-glow"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <ClipboardIcon className="w-8 h-8 text-primary-400" />
        </motion.div>
      </div>
      <h3 className="mt-4 text-lg font-medium text-primary-400">No Research History</h3>
      <p className="mt-2 text-sm text-gray-400">
        Start your first research to begin building your history.
      </p>
      <motion.button
        onClick={onStartNew}
        className="mt-6 px-4 py-2 bg-secondary-800 border-2 border-primary-500/20 text-primary-400 rounded-lg hover:bg-secondary-700 
          transition-all shadow-glow hover:shadow-glow-strong hover:border-primary-500/40"
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
      >
        Start New Research
      </motion.button>
    </motion.div>
  );
} 