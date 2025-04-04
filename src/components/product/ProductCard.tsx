import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ProductAnalysis, CompetitorsData } from '../../types/product/types';
import { ProductHeader } from './ProductHeader';
import { ProductSection } from './ProductSection';
import { CompetitorAnalysis } from './CompetitorAnalysis';
import { ProductDescription } from './ProductDescription';
import { TargetPersona } from './TargetPersona';
import { Capabilities } from './Capabilities';
import { Loader2, Save } from 'lucide-react';

interface ProductCardProps {
  product: ProductAnalysis;
  index: number;
  isSaving: boolean;
  onSave: (product: ProductAnalysis, index: number) => Promise<void>;
  onUpdateSection: (productIndex: number, section: keyof ProductAnalysis, value: any) => void;
  updateProduct: (product: ProductAnalysis) => void;
  isMultipleProducts: boolean;
}

function ProductCard({
  product,
  index,
  isSaving,
  onSave,
  onUpdateSection,
  updateProduct,
  isMultipleProducts
}: ProductCardProps) {
  const [expandedSections, setExpandedSections] = React.useState<Record<string, boolean>>({});
  
  // Each section is collapsed by default
  React.useEffect(() => {
    if (product.productDetails?.name && Object.keys(expandedSections).length === 0) {
      const initialExpanded: Record<string, boolean> = {
        [`${product.productDetails.name}-description`]: true, // Only description expanded by default
        [`${product.productDetails.name}-usps`]: false,
        [`${product.productDetails.name}-painPoints`]: false,
        [`${product.productDetails.name}-features`]: false,
        [`${product.productDetails.name}-persona`]: false,
        [`${product.productDetails.name}-capabilities`]: false,
      };
      setExpandedSections(initialExpanded);
    }
  }, [product.productDetails?.name, expandedSections]);

  const toggleSection = (section: string) => {
    const productName = product.productDetails?.name || `Product-${index}`;
    const sectionKey = `${productName}-${section}`;
    setExpandedSections(prev => ({
      ...prev,
      [sectionKey]: !prev[sectionKey]
    }));
  };

  const isSectionExpanded = (section: string) => {
    const productName = product.productDetails?.name || `Product-${index}`;
    const sectionKey = `${productName}-${section}`;
    return expandedSections[sectionKey] || false;
  };

  // Helper for updating nested properties
  const updateNestedProperty = (obj: any, path: string[], value: any) => {
    const newObj = { ...obj };
    let current = newObj;
    
    for (let i = 0; i < path.length - 1; i++) {
      if (!current[path[i]]) {
        current[path[i]] = {};
      }
      current = current[path[i]];
    }
    
    current[path[path.length - 1]] = value;
    return newObj;
  };

  return (
    <motion.article
      key={index}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
      className={`bg-secondary-900/90 backdrop-blur-sm rounded-2xl shadow-glow overflow-hidden border border-primary-500/20 hover:shadow-glow-strong transition-all duration-500 ${
        !isMultipleProducts ? 'mx-auto w-full' : ''
      }`}
    >
      <ProductHeader 
        product={product}
        index={index}
        updateProduct={(updatedProduct) => updateProduct(updatedProduct)}
      />

      {/* Product Analysis Results Title */}
      <div className="relative">
        <div className="absolute inset-0 bg-gradient-to-r from-primary-600/30 to-primary-500/10 backdrop-blur-sm"></div>
        <div className="relative px-6 py-4">
          <h1 className="text-2xl font-bold text-primary-400">Competitor Analysis Results</h1>
          <p className="text-sm text-gray-400 mt-1">Comprehensive analysis of your product's market position</p>
        </div>
      </div>

      {/* Product Content */}
      <div className="p-6 space-y-6 relative">
        <ProductDescription
          description={product.productDetails?.description || 'No description available'}
          onUpdate={(description) => {
            const updatedProduct = updateNestedProperty(
              product, 
              ['productDetails', 'description'], 
              description
            );
            updateProduct(updatedProduct);
          }}
          isExpanded={isSectionExpanded('description')}
          toggleExpanded={() => toggleSection('description')}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 relative">
          <ProductSection
            title="Unique Selling Points"
            items={product.usps || []}
            onUpdate={(items) => onUpdateSection(index, 'usps', items)}
            isExpanded={isSectionExpanded('usps')}
            toggleExpanded={() => toggleSection('usps')}
            sectionType="usps"
          />

          <ProductSection
            title="Pain Points Solved"
            items={product.painPoints || []}
            onUpdate={(items) => onUpdateSection(index, 'painPoints', items)}
            isExpanded={isSectionExpanded('painPoints')}
            toggleExpanded={() => toggleSection('painPoints')}
            sectionType="painPoints"
          />
        </div>

        <ProductSection
          title="Features"
          items={product.features || []}
          onUpdate={(items) => onUpdateSection(index, 'features', items)}
          isExpanded={isSectionExpanded('features')}
          toggleExpanded={() => toggleSection('features')}
          sectionType="features"
        />

        <TargetPersona
          persona={product.targetPersona}
          onUpdate={(persona) => onUpdateSection(index, 'targetPersona', persona)}
          isExpanded={isSectionExpanded('persona')}
          toggleExpanded={() => toggleSection('persona')}
        />

        <Capabilities
          capabilities={product.capabilities || []}
          onUpdate={(capabilities) => onUpdateSection(index, 'capabilities', capabilities)}
          isExpanded={isSectionExpanded('capabilities')}
          toggleExpanded={() => toggleSection('capabilities')}
        />

        <CompetitorAnalysis 
          product={product}
          onUpdate={(url) => {
            console.log("Received competitorAnalysisUrl update:", url);
            
            // First, try to parse the URL as JSON to see if it contains competitor data
            try {
              const jsonData = JSON.parse(url);
              console.log("Successfully parsed competitorAnalysisUrl as JSON:", jsonData);
              
              // Check if it contains competitor data
              if (jsonData.competitors && typeof jsonData.competitors === 'object') {
                console.log("Found competitors in the URL JSON:", jsonData.competitors);
                
                // Create a new product with both the URL and the competitors
                const updatedProduct = { 
                  ...product, 
                  competitorAnalysisUrl: url,
                  competitors: {
                    direct_competitors: Array.isArray(jsonData.competitors.direct_competitors) 
                      ? [...jsonData.competitors.direct_competitors] : [],
                    niche_competitors: Array.isArray(jsonData.competitors.niche_competitors)
                      ? [...jsonData.competitors.niche_competitors] : [],
                    broader_competitors: Array.isArray(jsonData.competitors.broader_competitors)
                      ? [...jsonData.competitors.broader_competitors] : []
                  }
                };
                
                console.log("Updating product with both URL and competitors:", updatedProduct);
                updateProduct(JSON.parse(JSON.stringify(updatedProduct)));
                return;
              }
            } catch (e) {
              console.log("competitorAnalysisUrl is not a valid JSON string:", e);
            }
            
            // If not a JSON string or doesn't contain competitors, just update the URL
            const updatedProduct = { ...product, competitorAnalysisUrl: url };
            console.log("Updating product with just URL:", updatedProduct);
            updateProduct(updatedProduct);
          }}
          onUpdateCompetitors={(competitors) => {
            const updatedProduct = { ...product, competitors };
            updateProduct(updatedProduct);
          }}
        />

        {/* Save Button */}
        <div className="flex justify-end mt-6">
          <motion.button
            onClick={() => onSave(product, index)}
            disabled={isSaving}
            className="flex items-center gap-2 px-4 py-2 bg-primary-500 text-secondary-900 font-medium rounded-lg hover:bg-primary-400 transition-all
              shadow-glow hover:shadow-glow-strong disabled:bg-gray-700 disabled:text-gray-500 disabled:cursor-not-allowed"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            {isSaving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                Save Analysis
              </>
            )}
          </motion.button>
        </div>
      </div>
    </motion.article>
  );
}

export { ProductCard };