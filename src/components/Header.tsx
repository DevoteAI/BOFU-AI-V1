import React from 'react';
import { motion } from 'framer-motion';
import { Sparkles, Target, BarChart, LineChart, Brain } from 'lucide-react';

// Logo SVG component
const Logo = () => (
  <svg width="48" height="48" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect width="32" height="32" rx="8" fill="#FFE600" />
    <path d="M18.5 5L7 17.5H14L12.5 27L24 14.5H17L18.5 5Z" fill="#0A0A0A" stroke="#0A0A0A" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

export function Header() {
  return (
    <header className="w-full mb-8">
      <motion.div 
        className="max-w-3xl space-y-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <motion.div
          className="inline-block mb-4"
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ 
            type: "spring", 
            duration: 0.8,
            delay: 0.2
          }}
        >
          <Logo />
        </motion.div>
        
        <motion.h1
          className="text-4xl font-bold text-primary-400 mb-3"
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          BOFU AI Research Assistant
        </motion.h1>
        
        <motion.p
          className="mx-auto max-w-2xl text-gray-400 text-lg"
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.4 }}
        >
          Upload your research documents, add blog URLs, and specify your product lines to generate comprehensive bottom-of-funnel analysis.
        </motion.p>
      </motion.div>

      <motion.div 
        className="flex flex-wrap items-center gap-4 mt-8"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.2 }}
      >
        {[
          { icon: Sparkles, label: "Upload Sources", color: "primary", active: true },
          { icon: Target, label: "Define Products", color: "secondary", active: true },
          { icon: BarChart, label: "Get Insights", color: "neutral", active: false },
          { icon: LineChart, label: "Take Action", color: "neutral", active: false }
        ].map((item, index) => (
          <motion.div 
            key={index}
            className={`flex items-center bg-white px-4 py-2 rounded-full shadow-sm ${!item.active && 'opacity-60'}`}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.1 * (index + 3) }}
            whileHover={item.active ? { y: -2, boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)' } : {}}
          >
            <div className={`flex items-center justify-center h-8 w-8 rounded-full mr-2 bg-${item.color}-100 text-${item.color}-600`}>
              <item.icon size={16} />
            </div>
            <span className={`text-sm font-medium ${item.active ? 'text-neutral-800' : 'text-neutral-500'}`}>{item.label}</span>
          </motion.div>
        ))}
      </motion.div>
    </header>
  );
}