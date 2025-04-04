import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Package, Plus, X } from 'lucide-react';

interface ProductLineInputProps {
  onProductLinesChange: (productLines: string[]) => void;
}

export function ProductLineInput({ onProductLinesChange }: ProductLineInputProps) {
  const [productLines, setProductLines] = useState<string[]>([]);
  const [currentProduct, setCurrentProduct] = useState('');
  const [error, setError] = useState('');

  // Handle adding a new product line
  const addProductLine = () => {
    if (!currentProduct.trim()) {
      setError('Please enter a product name');
      return;
    }

    if (productLines.includes(currentProduct.trim())) {
      setError('This product has already been added');
      return;
    }

    const updatedLines = [...productLines, currentProduct.trim()];
    setProductLines(updatedLines);
    setCurrentProduct('');
    setError('');
    onProductLinesChange(updatedLines);
  };

  // Handle removing a product line
  const removeProductLine = (index: number) => {
    const updatedLines = productLines.filter((_, i) => i !== index);
    setProductLines(updatedLines);
    onProductLinesChange(updatedLines);
  };

  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (currentProduct.trim()) {
      addProductLine();
    }
  };

  return (
    <div>
      <label className="block text-lg font-medium text-primary-400 mb-2">Your Product Lines</label>
      <p className="text-sm text-gray-400 mb-4">
        Add the products or services you want to analyze and compare against the competition.
      </p>

      <form onSubmit={handleSubmit} className="mb-4">
        <div className="flex">
          <div className="relative flex-grow">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Package className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              value={currentProduct}
              onChange={(e) => {
                setCurrentProduct(e.target.value);
                if (error) setError('');
              }}
              placeholder="Enter product name (e.g., Enterprise CRM)"
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
        {productLines.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-4 space-y-2"
          >
            <div className="text-sm font-medium text-gray-400 mb-2">Added Products:</div>
            {productLines.map((product, index) => (
              <motion.div
                key={`${product}-${index}`}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.2 }}
                className="flex items-center p-2 bg-secondary-800 border border-primary-500/10 rounded-lg text-sm group"
              >
                <Package className="h-4 w-4 text-primary-400 mr-2 flex-shrink-0" />
                <span className="truncate text-gray-300 flex-grow">{product}</span>
                <button
                  type="button"
                  onClick={() => removeProductLine(index)}
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