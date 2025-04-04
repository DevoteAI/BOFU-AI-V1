import React from 'react';
import { motion } from 'framer-motion';

interface SkeletonLoaderProps {
  count?: number;
}

export function SkeletonLoader({ count = 3 }: SkeletonLoaderProps) {
  return (
    <div className="space-y-4">
      {Array.from({ length: count }).map((_, index) => (
        <motion.div
          key={index}
          className="bg-secondary-800/50 border-2 border-primary-500/10 rounded-xl p-4 animate-pulse"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: index * 0.1 }}
        >
          <div className="flex items-center justify-between">
            <div className="space-y-3 flex-1">
              <div className="h-4 w-1/3 bg-secondary-700 rounded" />
              <div className="h-3 w-1/2 bg-secondary-700/50 rounded" />
            </div>
            <div className="h-8 w-8 bg-secondary-700 rounded-full" />
          </div>
        </motion.div>
      ))}
    </div>
  );
}

export function HistorySkeletonLoader({ count = 3 }: SkeletonLoaderProps) {
  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: count }).map((_, index) => (
        <motion.div
          key={index}
          className="bg-secondary-800/50 border-2 border-primary-500/10 rounded-xl p-4 animate-pulse"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: index * 0.1 }}
        >
          <div className="space-y-3">
            <div className="h-5 w-2/3 bg-secondary-700 rounded" />
            <div className="h-4 w-1/2 bg-secondary-700/50 rounded" />
            <div className="flex items-center gap-2 mt-4">
              <div className="h-4 w-4 bg-secondary-700 rounded" />
              <div className="h-3 w-24 bg-secondary-700/50 rounded" />
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  );
} 