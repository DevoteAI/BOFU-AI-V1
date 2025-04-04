import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { History, Trash2, Edit, Eye, Clock, Save, Search, SortAsc, SortDesc, Filter } from 'lucide-react';
import { format, isToday, isYesterday } from 'date-fns';
import { ResearchResult } from '../lib/research';
import toast from 'react-hot-toast';
import { EmptyHistoryState } from './EmptyHistoryState';
import { HistorySkeletonLoader } from './SkeletonLoader';
import { ClipboardIcon, CalendarIcon } from '@heroicons/react/24/outline';
import { TrashIcon } from '@heroicons/react/24/outline';

interface ResearchHistoryProps {
  results: ResearchResult[];
  onSelect: (result: ResearchResult) => void;
  onDelete: (id: string) => Promise<void>;
  isLoading?: boolean;
  onStartNew?: () => void;
}

export function ResearchHistory({ 
  results, 
  onSelect, 
  onDelete, 
  isLoading = false,
  onStartNew 
}: ResearchHistoryProps) {
  const [searchTerm, setSearchTerm] = React.useState('');
  const [sortOrder, setSortOrder] = React.useState<'asc' | 'desc'>('desc');
  
  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent triggering the parent onClick
    
    try {
      await onDelete(id);
      toast.success('Research result deleted successfully');
    } catch (error) {
      toast.error('Failed to delete research result');
    }
  };
  
  const filteredResults = React.useMemo(() => {
    if (!searchTerm.trim()) return results;
    
    const term = searchTerm.toLowerCase().trim();
    return results.filter(result => {
      const companyName = result.data[0]?.companyName || '';
      const productName = result.data[0]?.productDetails?.name || '';
      return companyName.toLowerCase().includes(term) || productName.toLowerCase().includes(term);
    });
  }, [results, searchTerm]);
  
  const sortedResults = React.useMemo(() => {
    return [...filteredResults].sort((a, b) => {
      const dateA = new Date(a.created_at).getTime();
      const dateB = new Date(b.created_at).getTime();
      return sortOrder === 'desc' ? dateB - dateA : dateA - dateB;
    });
  }, [filteredResults, sortOrder]);
  
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    if (isToday(date)) {
      return `Today at ${format(date, 'h:mm a')}`;
    } else if (isYesterday(date)) {
      return `Yesterday at ${format(date, 'h:mm a')}`;
    } else {
      return format(date, 'MMM d, yyyy');
    }
  };

  return (
    <div className="space-y-6">
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-12">
          <motion.div
            className="w-12 h-12 rounded-full border-4 border-primary-500/20"
            animate={{
              rotate: 360,
              borderTopColor: 'rgb(var(--color-primary-400))',
            }}
            transition={{
              duration: 1,
              repeat: Infinity,
              ease: 'linear',
            }}
          />
          <p className="mt-4 text-gray-400">Loading research history...</p>
        </div>
      ) : results.length === 0 ? (
        <div className="text-center py-12">
          <div className="flex justify-center">
            <div className="p-4 rounded-full bg-secondary-800 border-2 border-primary-500/20 shadow-glow">
              <ClipboardIcon className="w-8 h-8 text-primary-400" />
            </div>
          </div>
          <h3 className="mt-4 text-lg font-medium text-primary-400">No Research History</h3>
          <p className="mt-2 text-sm text-gray-400">
            Start your first research to begin building your history.
          </p>
          <button
            onClick={onStartNew}
            className="mt-6 px-4 py-2 bg-secondary-800 border-2 border-primary-500/20 text-primary-400 rounded-lg hover:bg-secondary-700 
              transition-all shadow-glow hover:shadow-glow-strong hover:border-primary-500/40"
          >
            Start New Research
          </button>
        </div>
      ) : (
        <motion.div
          className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
        >
          {results.map((result, index) => (
            <motion.div
              key={result.id}
              className="group relative bg-secondary-900 border-2 border-primary-500/20 rounded-xl p-4 shadow-glow hover:shadow-glow-strong 
                hover:border-primary-500/40 transition-all cursor-pointer"
              onClick={() => onSelect(result)}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-lg font-medium text-primary-400">
                    {result.data[0]?.companyName || 'Unknown Company'}
                  </h3>
                  <p className="mt-1 text-sm text-gray-400">
                    {result.data[0]?.productDetails?.name || 'Unknown Product'}
                  </p>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete(result.id);
                  }}
                  className="p-1.5 rounded-lg text-gray-400 hover:text-primary-400 hover:bg-secondary-800 transition-colors"
                >
                  <TrashIcon className="w-5 h-5" />
                </button>
              </div>
              <div className="mt-4 flex items-center gap-2 text-xs text-gray-400">
                <CalendarIcon className="w-4 h-4" />
                <span>
                  {new Date(result.created_at).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric',
                  })}
                </span>
              </div>
            </motion.div>
          ))}
        </motion.div>
      )}
    </div>
  );
}