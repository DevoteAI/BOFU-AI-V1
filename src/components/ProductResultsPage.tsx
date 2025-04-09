import React from 'react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { supabase } from '../lib/supabase';
import { 
  saveResearchResults, 
  updateResearchResults, 
  ResearchResult, 
  saveApprovedProduct 
} from '../lib/research';
import { ProductCard } from './product/ProductCard';
import { PageHeader } from './product/PageHeader';
import { ProductAnalysis } from '../types/product';
import { Plus, Loader2 } from 'lucide-react';

interface ProductResultsPageProps {
  products: ProductAnalysis[];
  onStartNew: () => void;
  existingId?: string;
  showHistory?: boolean;
  setShowHistory?: (show: boolean) => void;
  forceHistoryView?: () => void;
  onHistorySave?: () => Promise<void>;
  onSaveComplete?: (newId: string) => void;
}

function ProductResultsPage({ 
  products, 
  onStartNew, 
  existingId,
  showHistory,
  setShowHistory,
  forceHistoryView,
  onHistorySave,
  onSaveComplete
}: ProductResultsPageProps) {
  const [editedProducts, setEditedProducts] = React.useState(products);
  const [isSaving, setIsSaving] = React.useState(false);
  const [savingProductIndex, setSavingProductIndex] = React.useState<number | null>(null);
  const [actionLoadingIndex, setActionLoadingIndex] = React.useState<number | null>(null);

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

  // --- Consolidated Save/Update Logic --- 
  const performSaveOrUpdate = async (productIndexToMarkLoading: number | null, updatedProductsData: ProductAnalysis[], isApprovalAction: boolean = false) => {
    if (productIndexToMarkLoading !== null) {
      setActionLoadingIndex(productIndexToMarkLoading);
    }
    setIsSaving(true); // Use general saving flag for simplicity or keep separate if needed
    
    try {
      // Determine title (using the first product usually)
      const title = `${updatedProductsData[0]?.companyName || 'Unknown'} - ${updatedProductsData[0]?.productDetails?.name || 'Product'}`;
      let operationPerformed: 'insert' | 'update' = 'update';
      let currentId = existingId;

      if (currentId) {
        // --- UPDATE --- 
        console.log(`[ProductResultsPage] Updating existing result ID: ${currentId}`);
        await updateResearchResults(currentId, updatedProductsData, title);
        toast.success(isApprovalAction ? 'Product approved successfully!' : 'Analysis updated successfully!');
      } else {
        // --- INSERT --- 
        console.log('[ProductResultsPage] No existing ID, saving as new result...');
        operationPerformed = 'insert';
        // Ensure is_draft is false if saving via approve
        const newId = await saveResearchResults(updatedProductsData, title, false);
        currentId = newId; // Store the new ID
        toast.success(isApprovalAction ? 'Product saved and approved successfully!' : 'Analysis saved successfully!');
        // IMPORTANT: Notify parent about the new ID
        if (onSaveComplete) {
          console.log(`[ProductResultsPage] Calling onSaveComplete with new ID: ${newId}`);
          onSaveComplete(newId);
        } else {
           console.warn('[ProductResultsPage] onSaveComplete callback is missing. Parent component will not know the new ID.');
        }
      }

      // Update local state AFTER successful DB operation
      setEditedProducts(updatedProductsData);

      // Refresh history list if callback provided
      if (onHistorySave) {
        await onHistorySave();
      }
      
      return { success: true, id: currentId, operation: operationPerformed };

    } catch (error: any) {
      console.error('Error saving/updating product:', error);
      toast.error(`Failed to ${existingId ? 'update' : 'save'} analysis: ${error.message}`);
      return { success: false };
    } finally {
      if (productIndexToMarkLoading !== null) {
        setActionLoadingIndex(null);
      }
       setIsSaving(false); 
    }
  };

  // --- Original Save Button Handler --- 
  const handleSaveProduct = async (product: ProductAnalysis, index: number) => {
    // Simply calls the consolidated function without approval flags
    await performSaveOrUpdate(index, editedProducts, false);
  };

  // --- Modified Approve Button Handler --- 
  const handleApproveProduct = async (productToApprove: ProductAnalysis, index: number) => {
    setActionLoadingIndex(index);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not logged in');
      
      console.log(`[ProductResultsPage] Approving product at index ${index}:`, 
        JSON.stringify(productToApprove.productDetails, null, 2));
      
      // First step: Create a clean product object without any previous approval data
      // This ensures we don't have old or conflicting approval metadata
      const cleanedProduct = {...productToApprove};
      delete cleanedProduct.isApproved;
      delete cleanedProduct.approvedBy;
      
      // Create the NEW data array with the product marked as approved
      const updatedProductsArray = editedProducts.map((p, i) => { 
        if (i === index) {
          // Make sure we explicitly set these properties at the top level of the product object
          return {
            ...cleanedProduct, // Use the cleaned product without old approval data
            isApproved: true, // Always ensure this is a boolean true
            approvedBy: user.id || 'unknown', // Fallback to 'unknown' if user ID is missing
            approvedAt: new Date().toISOString() // Add timestamp for when approval happened
          };
        }
        return p; // Return other products unmodified
      });
      
      console.log(`[ProductResultsPage] Updated product at index ${index} with approval:`, 
        JSON.stringify(updatedProductsArray[index], null, 2));

      // Call the consolidated save/update function with the modified data
      const result = await performSaveOrUpdate(index, updatedProductsArray, true);
      
      if (result.success) {
        console.log(`[ProductResultsPage] Successfully saved approved product with operation: ${result.operation}`);
        
        // Now also save to the dedicated approved_products table
        try {
          if (!result.id) {
            throw new Error('Failed to get research result ID');
          }
          
          // Add to the approved_products table
          await saveApprovedProduct(
            result.id, 
            updatedProductsArray[index], 
            index,
            user.id
          );
          
          console.log(`[ProductResultsPage] Successfully added product to approved_products table`);
        } catch (approvedError: any) {
          console.error('[ProductResultsPage] Error saving to approved_products table:', approvedError);
          // Continue even if this fails, as we've already updated the main table
          toast.error(`Product was approved but not added to admin dashboard: ${approvedError.message}. Please try again.`);
        }
        
        // Show more specific success message 
        const isReapproval = productToApprove.isApproved === true || !!productToApprove.approvedBy;
        toast.success(
          isReapproval 
            ? `Product "${productToApprove.productDetails?.name}" has been re-approved with changes` 
            : `Product "${productToApprove.productDetails?.name}" has been approved and will appear in the admin dashboard`
        );
      }
      
    } catch (error: any) {
      console.error('[ProductResultsPage] Error during approval preparation:', error);
      toast.error(`Failed to approve product: ${error.message}`);
      setActionLoadingIndex(null); // Ensure loading state is reset on error
    }
    // Loading state reset is handled in performSaveOrUpdate's finally block
  };

  // --- Update Section Handler --- 
  const updateProductSection = (productIndex: number, section: keyof ProductAnalysis, value: any) => {
    const newProducts = [...editedProducts];
    // Ensure nested properties are updated correctly (example for productDetails)
    if (section === 'productDetails') {
       newProducts[productIndex] = {
         ...newProducts[productIndex],
         productDetails: { ...newProducts[productIndex].productDetails, ...value }
       };
    } else {
       newProducts[productIndex] = {
         ...newProducts[productIndex],
         [section]: value
       };
    }
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
          {editedProducts.map((product, index) => {
            const isLoadingThis = actionLoadingIndex === index; // Check if this card is loading
            return (
              <ProductCard
                key={index}
                product={product}
                index={index}
                isActionLoading={isLoadingThis} // Pass the single loading state
                onSave={handleSaveProduct} 
                onApprove={handleApproveProduct} 
                onUpdateSection={updateProductSection}
                updateProduct={(updatedProduct) => { 
                  const newProducts = [...editedProducts];
                  newProducts[index] = updatedProduct;
                  setEditedProducts(newProducts);
                }}
                isMultipleProducts={editedProducts.length > 1}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
}

export { ProductResultsPage };