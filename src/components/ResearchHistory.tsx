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
  
  // Log when results change
  React.useEffect(() => {
    console.log('📜 ResearchHistory component received updated results:', { 
      count: results.length,
      items: results.map(r => ({ id: r.id, title: r.title }))
    });
  }, [results]);
  
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
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 pt-8 md:pt-12">
      {/* Search and filter bar */}
      {results.length > 0 && !isLoading && (
        <motion.div 
          className="mb-8 bg-secondary-900/80 backdrop-blur-sm rounded-xl border-2 border-primary-500/20 shadow-glow p-4"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
            <div className="relative w-full md:max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search by company or product name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-secondary-800 border border-primary-500/30 text-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              />
            </div>
            <div className="flex items-center gap-3">
              <span className="text-sm text-gray-400">Sort:</span>
              <button
                onClick={() => setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc')}
                className="flex items-center gap-1 px-3 py-1.5 bg-secondary-800 border border-primary-500/30 text-gray-300 rounded-lg hover:bg-secondary-700 transition-colors"
              >
                {sortOrder === 'desc' ? (
                  <>
                    <SortDesc className="w-4 h-4" /> Newest
                  </>
                ) : (
                  <>
                    <SortAsc className="w-4 h-4" /> Oldest
                  </>
                )}
              </button>
            </div>
          </div>
        </motion.div>
      )}

      {/* Results count indicator */}
      {results.length > 0 && !isLoading && (
        <motion.div
          className="mb-4 flex items-center gap-2 text-sm text-gray-400"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <div className="w-2 h-2 rounded-full bg-primary-500"></div>
          <span>
            {sortedResults.length === results.length 
              ? `Showing all ${results.length} saved research ${results.length === 1 ? 'item' : 'items'}`
              : `Showing ${sortedResults.length} of ${results.length} research items`}
          </span>
        </motion.div>
      )}

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
          className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 space-y-0"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
        >
          {sortedResults.map((result, index) => (
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
              {/* Show badge for multiple products */}
              {result.data.length > 1 && (
                <div className="absolute -top-2 -right-2 bg-primary-500 text-secondary-900 text-xs font-bold px-2 py-1 rounded-lg">
                  {result.data.length} Products
                </div>
              )}
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-lg font-medium text-primary-400">
                    {result.data[0]?.companyName || 'Unknown Company'}
                  </h3>
                  <p className="mt-1 text-sm text-gray-400">
                    {result.data[0]?.productDetails?.name || 'Unknown Product'}
                  </p>
                  {/* Show type indicator - single vs collection */}
                  <div className="mt-2 flex items-center gap-1.5">
                    <div className={`w-2 h-2 rounded-full ${result.data.length === 1 ? 'bg-green-500' : 'bg-amber-500'}`}></div>
                    <span className="text-xs text-gray-400">
                      {result.data.length === 1 ? 'Single Product' : 'Product Collection'}
                    </span>
                  </div>
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