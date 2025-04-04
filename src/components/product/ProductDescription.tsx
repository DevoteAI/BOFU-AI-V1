import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { EditableText } from '../ui/EditableText';

interface ProductDescriptionProps {
  description: string;
  onUpdate: (description: string) => void;
  isExpanded: boolean;
  toggleExpanded: () => void;
}

export function ProductDescription({ 
  description, 
  onUpdate, 
  isExpanded, 
  toggleExpanded 
}: ProductDescriptionProps) {
  return (
    <div className="bg-secondary-900/80 backdrop-blur-sm rounded-xl border border-primary-500/20 p-4 hover:shadow-glow transition-all group">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-lg font-semibold text-primary-400">Product Description</h3>
        <button
          onClick={toggleExpanded}
          className="p-1.5 hover:bg-secondary-800 rounded-lg transition-colors"
          aria-expanded={isExpanded}
          aria-label={isExpanded ? "Collapse section" : "Expand section"}
        >
          {isExpanded ? 
            <ChevronUp className="text-gray-400" /> : 
            <ChevronDown className="text-gray-400" />
          }
        </button>
      </div>
      <AnimatePresence>
        {isExpanded ? (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden"
          >
            <EditableText 
              value={description} 
              onUpdate={onUpdate}
              multiline={true}
            />
          </motion.div>
        ) : (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="overflow-hidden"
          >
            <p className="text-gray-300 line-clamp-2">{description}</p>
            <button
              onClick={toggleExpanded}
              className="mt-1 text-xs text-primary-400 hover:text-primary-300 flex items-center"
            >
              View full description
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
} 