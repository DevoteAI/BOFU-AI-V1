import React from 'react';
import { motion } from 'framer-motion';
import { Plus } from 'lucide-react';

interface PageHeaderProps {
  companyName?: string;
  productCount: number;
  onStartNew: () => void;
}

export function PageHeader({ companyName, productCount, onStartNew }: PageHeaderProps) {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="py-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <motion.div 
          className="mb-0"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h2 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary-400 via-primary-500 to-primary-600">
            {companyName || 'Research Results'}
          </h2>
          <p className="text-sm text-gray-400">
            {productCount} {productCount === 1 ? 'product' : 'products'} analyzed
          </p>
        </motion.div>
        
        <motion.div 
          className="flex items-center gap-3"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <motion.button
            onClick={onStartNew}
            className="px-4 py-2.5 bg-primary-500 text-secondary-900 rounded-lg hover:bg-primary-400 transition-all 
              shadow-glow hover:shadow-glow-strong flex items-center gap-2 font-medium"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <Plus size={18} />
            New Research
          </motion.button>
        </motion.div>
      </div>
    </div>
  );
} 