import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link2, Plus, Trash2, X } from 'lucide-react';

interface BlogLinkInputProps {
  onBlogLinksChange: (links: string[]) => void;
}

export function BlogLinkInput({ onBlogLinksChange }: BlogLinkInputProps) {
  const [links, setLinks] = useState<string[]>([]);
  const [currentLink, setCurrentLink] = useState('');
  const [error, setError] = useState('');

  // Handle adding a new link
  const addLink = () => {
    if (!currentLink.trim()) {
      setError('Please enter a valid URL');
      return;
    }

    // Simple URL validation
    try {
      new URL(currentLink);
    } catch (e) {
      setError('Please enter a valid URL including http:// or https://');
      return;
    }

    const updatedLinks = [...links, currentLink.trim()];
    setLinks(updatedLinks);
    setCurrentLink('');
    setError('');
    onBlogLinksChange(updatedLinks);
  };

  // Handle removing a link
  const removeLink = (index: number) => {
    const updatedLinks = links.filter((_, i) => i !== index);
    setLinks(updatedLinks);
    onBlogLinksChange(updatedLinks);
  };

  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (currentLink.trim()) {
      addLink();
    }
  };

  return (
    <div>
      <label className="block text-lg font-medium text-primary-400 mb-2">Blog URLs (Optional)</label>
      <p className="text-sm text-gray-400 mb-4">
        Add links to blog posts or articles that are relevant to your product research.
      </p>

      <form onSubmit={handleSubmit} className="mb-4">
        <div className="flex">
          <div className="relative flex-grow">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Link2 className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              value={currentLink}
              onChange={(e) => {
                setCurrentLink(e.target.value);
                if (error) setError('');
              }}
              placeholder="https://example.com/blog/article"
              className="w-full pl-10 pr-4 py-2 border-2 border-primary-500/20 bg-secondary-800 text-gray-200 
                rounded-l-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 placeholder-gray-500"
            />
          </div>
          <button
            type="submit"
            className="flex items-center gap-1 px-4 py-2 bg-primary-500 text-black font-medium rounded-r-lg hover:bg-primary-400 transition-colors"
          >
            <Plus className="h-5 w-5" />
            Add
          </button>
        </div>
        {error && <p className="mt-2 text-sm text-red-500">{error}</p>}
      </form>

      <AnimatePresence>
        {links.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-4 space-y-2"
          >
            <div className="text-sm font-medium text-gray-400 mb-2">Added URLs:</div>
            {links.map((link, index) => (
              <motion.div
                key={`${link}-${index}`}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.2 }}
                className="flex items-center p-2 bg-secondary-800 border border-primary-500/10 rounded-lg text-sm group"
              >
                <Link2 className="h-4 w-4 text-primary-400 mr-2 flex-shrink-0" />
                <span className="truncate text-gray-300 flex-grow">{link}</span>
                <button
                  type="button"
                  onClick={() => removeLink(index)}
                  className="p-1 text-gray-400 hover:text-primary-400 hover:bg-secondary-700 rounded transition-colors opacity-0 group-hover:opacity-100"
                >
                  <X className="h-4 w-4" />
                </button>
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}