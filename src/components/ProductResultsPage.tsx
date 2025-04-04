import React from 'react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { saveResearchResults, updateResearchResults } from '../lib/research';
import { ProductCard } from './product/ProductCard';
import { PageHeader } from './product/PageHeader';
import { ProductAnalysis } from '../types/product';
import { Plus } from 'lucide-react';

interface ProductResultsPageProps {
  products: ProductAnalysis[];
  onStartNew: () => void;
  existingId?: string;
  showHistory?: boolean;
  setShowHistory?: (show: boolean) => void;
  forceHistoryView?: () => void;
  onHistorySave?: () => Promise<void>;
}

function ProductResultsPage({ 
  products, 
  onStartNew, 
  existingId,
  showHistory,
  setShowHistory,
  forceHistoryView,
  onHistorySave
}: ProductResultsPageProps) {
  const [editedProducts, setEditedProducts] = React.useState(products);
  const [isSaving, setIsSaving] = React.useState(false);
  const [savingProductIndex, setSavingProductIndex] = React.useState<number | null>(null);

  // Add logging for component mounting and prop changes
  React.useEffect(() => {
    console.log("ProductResultsPage mounted or updated with props:", { 
      productsCount: products.length,
      showHistory,
      setShowHistoryType: typeof setShowHistory
    });
    
    return () => {
      console.log("ProductResultsPage unmounting");
    };
  }, [products, showHistory, setShowHistory]);

  // Fix products with missing details
  React.useEffect(() => {
    const fixedProducts = editedProducts.map(product => {
      if (!product.productDetails) {
        return {
          ...product,
          productDetails: {
            name: 'Unnamed Product',
            description: 'No description available'
          }
        };
      }
      return product;
    });
    
    if (JSON.stringify(fixedProducts) !== JSON.stringify(editedProducts)) {
      setEditedProducts(fixedProducts);
    }
  }, [editedProducts]);

  const handleSaveProduct = async (product: ProductAnalysis, index: number) => {
    setSavingProductIndex(index);
    setIsSaving(true);
    try {
      const title = `${product.companyName} - ${product.productDetails.name}`;
      
      if (existingId) {
        await updateResearchResults(existingId, [product], title);
      } else {
        await saveResearchResults([product], title);
      }
      
      toast.success(existingId ? 'Product updated successfully!' : 'Product saved successfully!');
      
      // After successful save, refresh the history in the background without redirecting
      if (onHistorySave) {
        await onHistorySave();
      }
    } catch (error) {
      console.error('Error saving product:', error);
      toast.error(existingId ? 'Failed to update product. Please try again.' : 'Failed to save product. Please try again.');
    } finally {
      setIsSaving(false);
      setSavingProductIndex(null);
    }
  };
  
  const updateProductSection = (productIndex: number, section: keyof ProductAnalysis, value: any) => {
    const newProducts = [...editedProducts];
    newProducts[productIndex] = {
      ...newProducts[productIndex],
      [section]: value
    };
    setEditedProducts(newProducts);
  };

  return (
    <div className="min-h-screen bg-gradient-dark bg-circuit-board">
      {/* Header Section */}
      <PageHeader 
        companyName={editedProducts[0]?.companyName} 
        productCount={editedProducts.length}
        onStartNew={onStartNew}
      />

      {/* Instructions Panel */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-8">
        <div className="bg-secondary-900/80 backdrop-blur-sm rounded-xl border-2 border-primary-500/20 shadow-glow p-6">
          <div className="flex items-start space-x-4">
            <div className="min-w-[24px] mt-1">
              <div className="w-6 h-6 rounded-full bg-secondary-800 border border-primary-500/30 flex items-center justify-center">
                <span className="text-sm font-semibold text-primary-400">i</span>
              </div>
            </div>
            <div className="flex-1">
              <h3 className="text-base font-semibold text-primary-400 mb-2">How to Complete Your Analysis</h3>
              <div className="space-y-3">
                <div className="flex items-center gap-3 text-sm text-gray-400">
                  <div className="flex-shrink-0 w-6 h-6 rounded-full bg-secondary-800 border border-primary-500/30 flex items-center justify-center">
                    <span className="text-xs font-medium text-primary-400">1</span>
                  </div>
                  <p>Click <span className="font-medium text-primary-400">Identify Competitors</span> to let AI automatically discover and analyze your competitors</p>
                </div>
                <div className="flex items-center gap-3 text-sm text-gray-400">
                  <div className="flex-shrink-0 w-6 h-6 rounded-full bg-secondary-800 border border-primary-500/30 flex items-center justify-center">
                    <span className="text-xs font-medium text-primary-400">2</span>
                  </div>
                  <p>Optionally, use <span className="font-medium text-primary-400">Add Competitor Manually</span> to include additional competitors you know</p>
                </div>
                <div className="flex items-center gap-3 text-sm text-gray-400">
                  <div className="flex-shrink-0 w-6 h-6 rounded-full bg-secondary-800 border border-primary-500/30 flex items-center justify-center">
                    <span className="text-xs font-medium text-primary-400">3</span>
                  </div>
                  <p>Click <span className="font-medium text-primary-400">Analyze Competitors</span> to generate a detailed competitive analysis report</p>
                </div>
                <div className="flex items-center gap-3 text-sm text-gray-400">
                  <div className="flex-shrink-0 w-6 h-6 rounded-full bg-secondary-800 border border-primary-500/30 flex items-center justify-center">
                    <span className="text-xs font-medium text-primary-400">4</span>
                  </div>
                  <p>Finally, click <span className="font-medium text-primary-500">Save Analysis</span> to preserve your results</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className={`grid grid-cols-1 ${editedProducts.length > 1 ? 'xl:grid-cols-2' : 'max-w-3xl mx-auto'} gap-8`}>
          {editedProducts.map((product, index) => (
            <ProductCard
              key={index}
              product={product}
              index={index}
              isSaving={isSaving}
              savingProductIndex={savingProductIndex}
              onSave={handleSaveProduct}
              onUpdateSection={updateProductSection}
              updateProduct={(updatedProduct) => {
                const newProducts = [...editedProducts];
                newProducts[index] = updatedProduct;
                setEditedProducts(newProducts);
              }}
              isMultipleProducts={editedProducts.length > 1}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

export { ProductResultsPage };