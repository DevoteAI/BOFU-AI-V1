import React from 'react';
import { motion } from 'framer-motion';
import { Loader2, Sparkles } from 'lucide-react';

interface SubmitSectionProps {
  isDisabled: boolean;
  isSubmitting: boolean;
  onSubmit: () => void;
}

export function SubmitSection({ isDisabled, isSubmitting, onSubmit }: SubmitSectionProps) {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium text-primary-400 mb-2">Generate AI Research Analysis</h3>
        <p className="text-sm text-gray-400">
          Our AI will analyze your inputs to provide comprehensive bottom-of-funnel insights for your products.
        </p>
      </div>
      
      <motion.button
        onClick={onSubmit}
        disabled={isDisabled || isSubmitting}
        className={`w-full flex items-center justify-center gap-2 py-3 rounded-lg shadow-glow transition-all ${
          isDisabled || isSubmitting
            ? 'bg-secondary-800 text-gray-500 cursor-not-allowed border-2 border-primary-500/10'
            : 'bg-primary-500 text-black font-medium border-2 border-primary-500 hover:bg-primary-400 hover:shadow-glow-strong'
        }`}
        whileHover={!isDisabled && !isSubmitting ? { scale: 1.02 } : {}}
        whileTap={!isDisabled && !isSubmitting ? { scale: 0.98 } : {}}
      >
        {isSubmitting ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin" />
            Processing...
          </>
        ) : (
          <>
            <Sparkles className="w-5 h-5" />
            Generate Analysis
          </>
        )}
      </motion.button>
      
      <div className="text-xs text-gray-400 text-center">
        Processing may take 1-2 minutes depending on the amount of input data.
      </div>
    </div>
  );
}