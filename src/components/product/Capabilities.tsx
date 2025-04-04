import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, ChevronUp, Plus, Sparkles } from 'lucide-react';
import { CapabilityEditor } from '../CapabilityEditor';

interface Capability {
  title: string;
  description: string;
  content: string;
  images?: string[];
}

interface CapabilitiesProps {
  capabilities: Capability[];
  onUpdate: (capabilities: Capability[]) => void;
  isExpanded: boolean;
  toggleExpanded: () => void;
}

export function Capabilities({ 
  capabilities, 
  onUpdate, 
  isExpanded, 
  toggleExpanded 
}: CapabilitiesProps) {
  const addCapability = () => {
    onUpdate([
      ...capabilities,
      {
        title: 'New Capability',
        description: 'Add a description for this capability',
        content: '<p>Add detailed content about this capability</p>',
        images: []
      }
    ]);
  };

  return (
    <div className="bg-secondary-900/80 backdrop-blur-sm rounded-xl border border-primary-500/20 p-4 hover:shadow-glow transition-all group hover:bg-primary-500/10">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <h3 className="text-lg font-semibold text-primary-400">Capabilities</h3>
          {isExpanded && (
            <button
              onClick={addCapability}
              className="p-1.5 text-primary-400 hover:bg-primary-500/20 rounded-lg transition-colors flex items-center gap-1 text-sm"
            >
              <Plus size={16} /> Add
            </button>
          )}
        </div>
        <button
          onClick={toggleExpanded}
          className="p-1 hover:bg-secondary-800 rounded-lg transition-colors"
          aria-expanded={isExpanded}
          aria-label={isExpanded ? "Collapse capabilities" : "Expand capabilities"}
        >
          {isExpanded ? 
            <ChevronUp className="text-gray-400" /> : 
            <ChevronDown className="text-gray-400" />
          }
        </button>
      </div>
      
      <AnimatePresence mode="wait">
        {isExpanded ? (
          <motion.div
            key="expanded"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            className="space-y-4 overflow-hidden"
          >
            {capabilities.length === 0 ? (
              <motion.div
                className="text-center py-8"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
              >
                <Sparkles className="w-12 h-12 text-primary-500/30 mx-auto mb-3" />
                <p className="text-gray-400">No capabilities added yet.</p>
                <p className="text-sm text-gray-500">Click "Add" to get started.</p>
              </motion.div>
            ) : (
              <div className="grid gap-4 relative">
                {capabilities.map((capability, capIndex) => (
                  <CapabilityEditor
                    key={capIndex}
                    capability={capability}
                    onUpdate={(updatedCapability) => {
                      const newCapabilities = [...capabilities];
                      newCapabilities[capIndex] = updatedCapability;
                      onUpdate(newCapabilities);
                    }}
                    onDelete={() => {
                      const newCapabilities = [...capabilities];
                      newCapabilities.splice(capIndex, 1);
                      onUpdate(newCapabilities);
                    }}
                  />
                ))}
              </div>
            )}
          </motion.div>
        ) : (
          <motion.div 
            key="collapsed"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="mt-1"
          >
            <p className="text-sm text-gray-500">
              {capabilities.length} {capabilities.length === 1 ? 'capability' : 'capabilities'} defined
            </p>
            <button
              onClick={toggleExpanded}
              className="mt-1 text-xs text-primary-400 hover:text-primary-300 flex items-center"
            >
              {capabilities.length > 0 ? 'View capabilities' : 'Add capabilities'}
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
} 