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
        <motion.h1
          className="text-5xl font-bold bg-gradient-to-r from-yellow-400 via-amber-300 to-yellow-500 bg-clip-text text-transparent mb-3"
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          BOFU AI Research Assistant
        </motion.h1>
        
        <motion.div 
          className="h-1 w-24 bg-gradient-to-r from-primary-500 to-yellow-400 rounded-full mb-4"
          initial={{ width: 0 }}
          animate={{ width: 120 }}
          transition={{ duration: 1, delay: 0.5 }}
        />
        
        <motion.p
          className="mx-auto max-w-2xl text-gray-300 text-lg leading-relaxed"
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.4 }}
        >
          Upload your research documents, add blog URLs, and specify your product lines to 
          generate comprehensive bottom-of-funnel analysis.
        </motion.p>
      </motion.div>

      <motion.div 
        className="flex flex-wrap items-center gap-4 mt-10"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.2 }}
      >
        {[
          { icon: Sparkles, label: "Upload Sources", color: "from-primary-500 to-yellow-500", active: true },
          { icon: Target, label: "Define Products", color: "from-blue-500 to-cyan-400", active: true },
          { icon: BarChart, label: "Get Insights", color: "from-gray-500 to-gray-400", active: false },
          { icon: LineChart, label: "Take Action", color: "from-gray-500 to-gray-400", active: false }
        ].map((item, index) => (
          <motion.div 
            key={index}
            className={`flex items-center ${item.active 
              ? 'bg-gradient-to-r from-secondary-800 to-secondary-700 border border-primary-500/20 shadow-glow' 
              : 'bg-secondary-800/60 border border-secondary-700/40'} 
              px-5 py-3 rounded-lg ${!item.active && 'opacity-60'}`}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.1 * (index + 3) }}
            whileHover={item.active ? { y: -2, boxShadow: '0 8px 20px rgba(0, 0, 0, 0.2)' } : {}}
          >
            <div className={`flex items-center justify-center h-10 w-10 rounded-full mr-3 bg-gradient-to-br ${item.color}`}>
              <item.icon size={18} className="text-secondary-900" />
            </div>
            <span className={`text-sm font-medium ${item.active ? 'text-primary-300' : 'text-gray-400'}`}>{item.label}</span>
          </motion.div>
        ))}
      </motion.div>
    </header>
  );
}