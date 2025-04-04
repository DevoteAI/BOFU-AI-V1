import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Target, FileText, ExternalLink, Plus, X, Edit, Check, ChevronDown, ChevronUp, BarChart, Loader2 } from 'lucide-react';
import { ProductAnalysis, CompetitorItem, CompetitorsData } from '../../types/product/types';
import { CompetitorAnalysisButton } from '../CompetitorAnalysisButton';
import toast from 'react-hot-toast';

interface CompetitorAnalysisProps {
  product: ProductAnalysis;
  onUpdate: (url: string) => void;
  onUpdateCompetitors?: (competitors: CompetitorsData) => void;
}

type CompetitorType = 'direct_competitors' | 'niche_competitors' | 'broader_competitors';

export function CompetitorAnalysis({ product, onUpdate, onUpdateCompetitors }: CompetitorAnalysisProps) {
  const [newCompetitor, setNewCompetitor] = useState<{
    type: CompetitorType;
    company_name: string;
    product_name: string;
    category: string;
  }>({
    type: 'direct_competitors',
    company_name: '',
    product_name: '',
    category: ''
  });
  const [showForm, setShowForm] = useState(false);
  const [expandedSections, setExpandedSections] = useState<Record<CompetitorType, boolean>>({
    direct_competitors: true,
    niche_competitors: true,
    broader_competitors: true
  });
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  useEffect(() => {
    // Debug: Log the full product object
    console.log("CompetitorAnalysis full product object:", JSON.stringify(product));
    
    // Log the current state of the product and competitors
    console.log("CompetitorAnalysis rendering with product:", product);
    
    if (product.competitors) {
      console.log("Current competitors in product:", product.competitors);
      // Deep-check the structure of competitors arrays
      console.log("Direct competitors is array?", Array.isArray(product.competitors.direct_competitors));
      console.log("Direct competitors length:", product.competitors.direct_competitors?.length);
      console.log("Niche competitors is array?", Array.isArray(product.competitors.niche_competitors));
      console.log("Niche competitors length:", product.competitors.niche_competitors?.length);
      console.log("Broader competitors is array?", Array.isArray(product.competitors.broader_competitors));
      console.log("Broader competitors length:", product.competitors.broader_competitors?.length);
    } else {
      console.log("No competitors in product");
      
      // Check if competitorAnalysisUrl contains JSON with competitor data
      if (product.competitorAnalysisUrl) {
        console.log("Product has competitorAnalysisUrl:", product.competitorAnalysisUrl);
        try {
          const urlData = JSON.parse(product.competitorAnalysisUrl);
          console.log("Parsed competitorAnalysisUrl:", urlData);
          if (urlData.competitors) {
            console.log("Found competitors in URL data:", urlData.competitors);
            
            // Update competitors if needed
            if (!product.competitors && onUpdateCompetitors) {
              const competitors = {
                direct_competitors: Array.isArray(urlData.competitors.direct_competitors) 
                  ? urlData.competitors.direct_competitors : [],
                niche_competitors: Array.isArray(urlData.competitors.niche_competitors) 
                  ? urlData.competitors.niche_competitors : [],
                broader_competitors: Array.isArray(urlData.competitors.broader_competitors) 
                  ? urlData.competitors.broader_competitors : []
              };
              console.log("Updating competitors from URL data:", competitors);
              onUpdateCompetitors(competitors);
            }
          }
        } catch (e) {
          console.log("competitorAnalysisUrl is not valid JSON:", e);
        }
      }
    }
  }, [product, onUpdateCompetitors]);

  const handleAddCompetitor = () => {
    if (!newCompetitor.company_name || !newCompetitor.product_name || !newCompetitor.category) {
      return;
    }

    // Initialize competitors if it doesn't exist
    const updatedCompetitors = product.competitors ? { ...product.competitors } : {
      direct_competitors: [],
      niche_competitors: [],
      broader_competitors: []
    };
    
    // Check if the selected category already has 3 competitors
    if (updatedCompetitors[newCompetitor.type].length >= 3) {
      toast.error(`Maximum limit of 3 ${newCompetitor.type.replace('_', ' ')} reached`);
      return;
    }

    updatedCompetitors[newCompetitor.type] = [
      ...updatedCompetitors[newCompetitor.type],
      {
        company_name: newCompetitor.company_name,
        product_name: newCompetitor.product_name,
        category: newCompetitor.category
      }
    ];

    onUpdateCompetitors?.(updatedCompetitors);
    
    setNewCompetitor({
      type: 'direct_competitors',
      company_name: '',
      product_name: '',
      category: ''
    });
    setShowForm(false);
  };

  const handleRemoveCompetitor = (type: CompetitorType, index: number) => {
    if (!product.competitors) return;
    
    const updatedCompetitors = { ...product.competitors };
    updatedCompetitors[type] = updatedCompetitors[type].filter((_, i) => i !== index);

    onUpdateCompetitors?.(updatedCompetitors);
  };

  const toggleSection = (section: CompetitorType) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const handleUpdateCompetitors = (competitors: any) => {
    console.log("Updating competitors:", competitors);
    if (competitors) {
      // Ensure the structure is as expected and create a completely new object
      // Limit each category to 3 competitors
      const processedCompetitors = {
        direct_competitors: Array.isArray(competitors.direct_competitors) 
          ? [...competitors.direct_competitors].slice(0, 3) : [],
        niche_competitors: Array.isArray(competitors.niche_competitors)
          ? [...competitors.niche_competitors].slice(0, 3) : [],
        broader_competitors: Array.isArray(competitors.broader_competitors)
          ? [...competitors.broader_competitors].slice(0, 3) : []
      };
      console.log("Processed competitors for update:", processedCompetitors);
      onUpdateCompetitors?.(processedCompetitors);
    }
  };

  const handleAnalyzeCompetitors = async () => {
    // Check if there are competitors to analyze
    if (!product.competitors || (
      !product.competitors.direct_competitors.length &&
      !product.competitors.niche_competitors.length &&
      !product.competitors.broader_competitors.length
    )) {
      toast.error('Please identify at least one competitor before analyzing');
      return;
    }

    setIsAnalyzing(true);
    
    // Show the beautiful notification about report generation
    toast.custom(
      (t) => (
        <div
          className={`${
            t.visible ? 'animate-enter' : 'animate-leave'
          } max-w-md w-full bg-white shadow-lg rounded-lg pointer-events-auto flex ring-1 ring-black ring-opacity-5`}
        >
          <div className="flex-1 w-0 p-4">
            <div className="flex items-start">
              <div className="flex-shrink-0 pt-0.5">
                <div className="h-10 w-10 rounded-full bg-secondary-100 flex items-center justify-center">
                  <FileText className="h-6 w-6 text-secondary-600" />
                </div>
              </div>
              <div className="ml-3 flex-1">
                <p className="text-sm font-medium text-gray-900">
                  Competitor Analysis Report
                </p>
                <p className="mt-1 text-sm text-gray-500">
                  Your report is being generated. You'll receive a Google Doc link within a few minutes.
                </p>
              </div>
            </div>
          </div>
          <div className="flex border-l border-gray-200">
            <button
              onClick={() => toast.dismiss(t.id)}
              className="w-full border border-transparent rounded-none rounded-r-lg p-4 flex items-center justify-center text-sm font-medium text-secondary-600 hover:text-secondary-500 focus:outline-none"
            >
              Close
            </button>
          </div>
        </div>
      ),
      { duration: 6000 } // Show for 6 seconds
    );

    try {
      // Prepare the data to send to the webhook
      const data = {
        product: {
          companyName: product.companyName,
          productName: product.productDetails?.name,
          description: product.productDetails?.description,
          usps: product.usps,
          businessOverview: product.businessOverview,
          painPoints: product.painPoints,
          features: product.features,
          targetPersona: product.targetPersona,
          pricing: product.pricing,
          currentSolutions: product.currentSolutions,
          capabilities: product.capabilities
        },
        competitors: product.competitors,
        requestType: 'analyze_competitors',
        uniqueId: crypto.randomUUID()
      };

      console.log('Sending competitor analysis request:', data);

      // Send the data to the webhook
      const response = await fetch('https://hook.us2.make.com/qjbyl0g1d1ailgmnn2p9pjmcu888xe43', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
      });

      if (!response.ok) {
        throw new Error(`Failed to analyze competitors: ${response.status} ${response.statusText}`);
      }

      // Check response content type
      const contentType = response.headers.get('content-type');
      
      if (contentType && contentType.includes('application/json')) {
        // Parse as JSON
        const responseData = await response.json();
        console.log('Received competitor analysis response:', responseData);

        // Update the product with the analysis result if needed
        if (responseData.analysisUrl) {
          onUpdate(responseData.analysisUrl);
        } else if (responseData.documentUrl) {
          onUpdate(responseData.documentUrl);
        } else if (typeof responseData === 'string') {
          onUpdate(responseData);
        }
      } else {
        // Handle as text
        const textResponse = await response.text();
        console.log('Received text response from analysis:', textResponse);
        
        // Try to parse as JSON first
        try {
          const jsonData = JSON.parse(textResponse);
          console.log('Parsed text response as JSON:', jsonData);
          
          if (jsonData.analysisUrl) {
            onUpdate(jsonData.analysisUrl);
          } else if (jsonData.documentUrl) {
            onUpdate(jsonData.documentUrl);
          } else {
            onUpdate(textResponse);
          }
        } catch (e) {
          // If not valid JSON, use the text as is
          console.log('Text response is not valid JSON, using as URL:', e);
          onUpdate(textResponse);
        }
      }
    } catch (error) {
      console.error('Error analyzing competitors:', error);
      toast.error(`Failed to analyze competitors: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const renderCompetitorSection = (title: string, type: CompetitorType, competitors: CompetitorItem[]) => {
    const isExpanded = expandedSections[type];
    const competitorList = Array.isArray(competitors) ? competitors : [];
    
    console.log(`Rendering ${title} with ${competitorList.length} items:`, competitorList);
    
    return (
      <div className="mb-3">
        <div
          className="flex justify-between items-center p-2 bg-secondary-50 rounded-lg cursor-pointer"
          onClick={() => toggleSection(type)}
        >
          <h4 className="font-medium text-gray-800">{title}</h4>
          {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </div>
        
        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              {competitorList.length > 0 ? (
                <div className="mt-2 space-y-2">
                  {competitorList.map((competitor, index) => (
                    <div 
                      key={`${type}-${index}`}
                      className="p-3 bg-white rounded-lg border border-secondary-100 flex justify-between items-start"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-sm text-gray-900">{competitor.company_name}</span>
                          <span className="text-xs px-2 py-0.5 bg-secondary-100 text-secondary-700 rounded-full">
                            {competitor.product_name}
                          </span>
                        </div>
                        <p className="text-xs text-gray-500 mt-1">{competitor.category}</p>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRemoveCompetitor(type, index);
                        }}
                        className="text-gray-400 hover:text-red-500 p-1"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-500 italic mt-2 px-2">
                  No {title.toLowerCase()} identified yet.
                </p>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  };

  return (
    <motion.div 
      className="bg-secondary-900/80 backdrop-blur-sm rounded-xl border border-primary-500/20 p-4 hover:shadow-glow transition-all"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-primary-400 flex items-center gap-2">
          <Target className="text-primary-400" size={20} />
          Competitor Analysis
        </h3>
        <CompetitorAnalysisButton 
          product={product} 
          onAnalysisComplete={onUpdate}
          onCompetitorsReceived={handleUpdateCompetitors}
        />
      </div>
      
      {/* Competitors Section */}
      {(product.competitors || true) &&
        <div>
          {/* Manual competitor entry */}
          {!showForm ? (
            <button
              onClick={() => setShowForm(true)}
              className="flex items-center gap-1 mb-3 px-3 py-1.5 text-xs rounded-lg bg-primary-500/10 text-primary-400 hover:bg-primary-500/20 transition-colors"
            >
              <Plus size={14} />
              Add Competitor Manually
            </button>
          ) : (
            <motion.div 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mb-4 bg-secondary-800 rounded-lg border border-primary-500/20 p-3"
            >
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-sm font-medium text-primary-400">Add New Competitor</h4>
                <button 
                  onClick={() => setShowForm(false)}
                  className="p-1 text-gray-400 hover:text-gray-300 rounded-full hover:bg-secondary-700"
                >
                  <X size={14} />
                </button>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
                <div>
                  <label className="block text-xs text-gray-400 mb-1">Competitor Type</label>
                  <select 
                    value={newCompetitor.type}
                    onChange={(e) => setNewCompetitor({...newCompetitor, type: e.target.value as CompetitorType})}
                    className="w-full px-3 py-1.5 text-sm bg-secondary-900 border border-primary-500/30 text-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  >
                    <option value="direct_competitors">Direct Competitor</option>
                    <option value="niche_competitors">Niche Competitor</option>
                    <option value="broader_competitors">Broader Competitor</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-xs text-gray-400 mb-1">Category/Segment</label>
                  <input
                    type="text"
                    value={newCompetitor.category}
                    onChange={(e) => setNewCompetitor({...newCompetitor, category: e.target.value})}
                    placeholder="e.g. Enterprise, SMB, Consumer"
                    className="w-full px-3 py-1.5 text-sm bg-secondary-900 border border-primary-500/30 text-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
                <div>
                  <label className="block text-xs text-gray-400 mb-1">Company Name</label>
                  <input
                    type="text"
                    value={newCompetitor.company_name}
                    onChange={(e) => setNewCompetitor({...newCompetitor, company_name: e.target.value})}
                    placeholder="e.g. Acme Inc."
                    className="w-full px-3 py-1.5 text-sm bg-secondary-900 border border-primary-500/30 text-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  />
                </div>
                
                <div>
                  <label className="block text-xs text-gray-400 mb-1">Product Name</label>
                  <input
                    type="text"
                    value={newCompetitor.product_name}
                    onChange={(e) => setNewCompetitor({...newCompetitor, product_name: e.target.value})}
                    placeholder="e.g. Acme Pro"
                    className="w-full px-3 py-1.5 text-sm bg-secondary-900 border border-primary-500/30 text-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  />
                </div>
              </div>
              
              <div className="flex justify-end">
                <button
                  onClick={handleAddCompetitor}
                  disabled={!newCompetitor.company_name || !newCompetitor.product_name}
                  className="px-3 py-1.5 text-xs bg-primary-500 text-secondary-900 font-medium rounded-lg hover:bg-primary-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
                >
                  <Plus size={14} />
                  Add
                </button>
              </div>
            </motion.div>
          )}

          <div className="bg-secondary-800 rounded-lg border border-primary-500/20 p-3">
            {renderCompetitorSection('Direct Competitors', 'direct_competitors', 
              Array.isArray(product.competitors?.direct_competitors) ? product.competitors.direct_competitors : [])}
            {renderCompetitorSection('Niche Competitors', 'niche_competitors', 
              Array.isArray(product.competitors?.niche_competitors) ? product.competitors.niche_competitors : [])}
            {renderCompetitorSection('Broader Competitors', 'broader_competitors', 
              Array.isArray(product.competitors?.broader_competitors) ? product.competitors.broader_competitors : [])}
            
            {/* Analyze Competitors Button */}
            <div className="mt-4">
              <div className="text-xs text-gray-400 text-center mb-2">
                Click below to perform deep analysis on all identified competitors.
              </div>
              <div className="flex justify-center">
                <button
                  onClick={handleAnalyzeCompetitors}
                  disabled={isAnalyzing || 
                    (!product.competitors?.direct_competitors?.length && 
                     !product.competitors?.niche_competitors?.length && 
                     !product.competitors?.broader_competitors?.length)}
                  className="w-full sm:w-auto px-4 py-2 bg-primary-500 text-secondary-900 font-medium rounded-lg hover:bg-primary-400 transition-colors shadow-glow hover:shadow-glow-strong flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-primary-500 disabled:hover:shadow-none"
                >
                  {isAnalyzing ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Analyzing...
                    </>
                  ) : (
                    <>
                      <BarChart className="w-4 h-4" />
                      Analyze Competitors
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      }
      
      {product.competitorAnalysisUrl && (
        <div className="bg-secondary-800 rounded-lg border border-primary-500/20 p-3 flex items-center justify-between mt-4">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-secondary-900 border border-primary-500/20 flex items-center justify-center">
              <FileText size={16} className="text-primary-400" />
            </div>
            <div className="truncate">
              <p className="text-sm font-medium text-primary-400 truncate">
                Competitor Analysis Report
              </p>
              <a
                href={product.competitorAnalysisUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-primary-300 hover:text-primary-200 flex items-center w-fit"
              >
                View Report <ExternalLink size={10} className="ml-1" />
              </a>
            </div>
          </div>
        </div>
      )}
      
      {!product.competitors && !product.competitorAnalysisUrl && (
        <p className="text-sm text-gray-400 italic">
          No competitor analysis available yet. Click the button above to generate one.
        </p>
      )}
    </motion.div>
  );
} 