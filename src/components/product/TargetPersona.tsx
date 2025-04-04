import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { EditableText } from '../ui/EditableText';

interface TargetPersonaProps {
  persona: {
    primaryAudience: string;
    demographics: string;
    industrySegments: string;
    psychographics: string;
  } | undefined;
  onUpdate: (persona: any) => void;
  isExpanded: boolean;
  toggleExpanded: () => void;
}

export function TargetPersona({ 
  persona, 
  onUpdate, 
  isExpanded, 
  toggleExpanded 
}: TargetPersonaProps) {
  
  const defaultPersona = {
    primaryAudience: 'Not specified',
    demographics: 'Not specified',
    industrySegments: 'Not specified',
    psychographics: 'Not specified'
  };
  
  const safePersona = persona || defaultPersona;
  
  const updateField = (field: string, value: string) => {
    onUpdate({
      ...safePersona,
      [field]: value
    });
  };

  return (
    <div className="bg-secondary-900/80 backdrop-blur-sm rounded-xl border border-primary-500/20 p-4 hover:shadow-glow transition-all group hover:bg-primary-500/10">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-lg font-semibold text-primary-400">Target Persona</h3>
        <button
          onClick={toggleExpanded}
          className="p-1 hover:bg-secondary-800 rounded-lg transition-colors"
          aria-expanded={isExpanded}
          aria-label={isExpanded ? "Collapse target persona" : "Expand target persona"}
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
            className="grid grid-cols-1 md:grid-cols-2 gap-4 overflow-hidden"
          >
            <div className="space-y-4">
              <EditableText
                value={safePersona.primaryAudience}
                onUpdate={(value) => updateField('primaryAudience', value)}
                label="Primary Audience"
              />
              <EditableText
                value={safePersona.demographics}
                onUpdate={(value) => updateField('demographics', value)}
                label="Demographics"
              />
            </div>
            <div className="space-y-4">
              <EditableText
                value={safePersona.industrySegments}
                onUpdate={(value) => updateField('industrySegments', value)}
                label="Industry Segments"
              />
              <EditableText
                value={safePersona.psychographics}
                onUpdate={(value) => updateField('psychographics', value)}
                label="Psychographics"
              />
            </div>
          </motion.div>
        ) : (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mt-1"
          >
            <p className="text-sm text-gray-500 line-clamp-1">
              Primary audience: {safePersona.primaryAudience}
            </p>
            <button
              onClick={toggleExpanded}
              className="mt-1 text-xs text-primary-400 hover:text-primary-300 flex items-center"
            >
              View all details
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
} 