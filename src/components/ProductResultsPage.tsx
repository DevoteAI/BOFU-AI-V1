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
}

function ProductResultsPage({ 
  products, 
  onStartNew, 
  existingId,
  showHistory,
  setShowHistory,
  forceHistoryView
}: ProductResultsPageProps) {
  const [editedProducts, setEditedProducts] = React.useState(products);
  const [isSaving, setIsSaving] = React.useState(false);

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
    setIsSaving(true);
    try {
      const title = `${product.companyName} - ${product.productDetails.name}`;
      
      if (existingId) {
        await updateResearchResults(existingId, [product], title);
      } else {
        await saveResearchResults([product], title);
      }
      
      toast.success(existingId ? 'Product updated successfully!' : 'Product saved successfully!');
    } catch (error) {
      console.error('Error saving product:', error);
      toast.error(existingId ? 'Failed to update product. Please try again.' : 'Failed to save product. Please try again.');
    } finally {
      setIsSaving(false);
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
    <div className="min-h-screen bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-50 via-blue-50 to-indigo-50">
      {/* Header Section */}
      <PageHeader 
        companyName={editedProducts[0]?.companyName} 
        productCount={editedProducts.length}
        onStartNew={onStartNew}
      />

      {/* Instructions Panel */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-8">
        <div className="bg-gradient-to-r from-secondary-50/50 to-white rounded-xl border border-secondary-100 p-6">
          <div className="flex items-start space-x-4">
            <div className="min-w-[24px] mt-1">
              <div className="w-6 h-6 rounded-full bg-secondary-100 flex items-center justify-center">
                <span className="text-sm font-semibold text-secondary-700">i</span>
              </div>
            </div>
            <div className="flex-1">
              <h3 className="text-base font-semibold text-gray-900 mb-2">How to Complete Your Analysis</h3>
              <div className="space-y-3">
                <div className="flex items-center gap-3 text-sm text-gray-600">
                  <div className="flex-shrink-0 w-6 h-6 rounded-full bg-secondary-100 flex items-center justify-center">
                    <span className="text-xs font-medium text-secondary-700">1</span>
                  </div>
                  <p>Click <span className="font-medium text-primary-600">Identify Competitors</span> to let AI automatically discover and analyze your competitors</p>
                </div>
                <div className="flex items-center gap-3 text-sm text-gray-600">
                  <div className="flex-shrink-0 w-6 h-6 rounded-full bg-secondary-100 flex items-center justify-center">
                    <span className="text-xs font-medium text-secondary-700">2</span>
                  </div>
                  <p>Optionally, use <span className="font-medium text-primary-600">Add Competitor Manually</span> to include additional competitors you know</p>
                </div>
                <div className="flex items-center gap-3 text-sm text-gray-600">
                  <div className="flex-shrink-0 w-6 h-6 rounded-full bg-secondary-100 flex items-center justify-center">
                    <span className="text-xs font-medium text-secondary-700">3</span>
                  </div>
                  <p>Click <span className="font-medium text-primary-600">Analyze Competitors</span> to generate a detailed competitive analysis report</p>
                </div>
                <div className="flex items-center gap-3 text-sm text-gray-600">
                  <div className="flex-shrink-0 w-6 h-6 rounded-full bg-secondary-100 flex items-center justify-center">
                    <span className="text-xs font-medium text-secondary-700">4</span>
                  </div>
                  <p>Finally, click <span className="font-medium text-success-600">Save Analysis</span> to preserve your results</p>
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