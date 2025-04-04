import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Toaster, toast } from 'react-hot-toast';
import { AuthModal } from './components/auth/AuthModal';
import { supabase } from './lib/supabase';
import { MainHeader } from './components/MainHeader';
import { Header } from './components/Header';
import { ResearchHistory } from './components/ResearchHistory';
import { DocumentUploader, ProcessedDocument } from './components/DocumentUploader';
import { BlogLinkInput } from './components/BlogLinkInput';
import { ProductLineInput } from './components/ProductLineInput';
import { SubmitSection } from './components/SubmitSection';
import { ProductResultsPage } from './components/ProductResultsPage';
import { ProductAnalysis, parseWebhookResponse } from './types/product';
import { ProcessingModal } from './components/ProcessingModal';
import { ResearchResult, getResearchResults, deleteResearchResult } from './lib/research';

export default function App() {
  console.log('App rendering started');
  
  const [user, setUser] = React.useState<any>(null);
  const [showAuthModal, setShowAuthModal] = React.useState(true);
  const [showHistory, setShowHistory] = React.useState(false);
  const [researchHistory, setResearchHistory] = React.useState<ResearchResult[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  // Define state variables
  const [activeStep, setActiveStep] = useState(1);
  const [documents, setDocuments] = useState<ProcessedDocument[]>([]);
  const [blogLinks, setBlogLinks] = useState<string[]>([]);
  const [productLines, setProductLines] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [analysisResults, setAnalysisResults] = useState<ProductAnalysis[]>([]);
  // Add a view state to control which view is displayed
  const [currentView, setCurrentView] = useState<'auth' | 'main' | 'history' | 'results'>('main');
  
  console.log('App state initialized', { currentView, user: !!user, showAuthModal });
  
  // Function to force update to history view
  const forceHistoryView = () => {
    console.log("🔄 Forcing history view - current state:", { 
      showHistory, 
      currentView, 
      activeStep,
      hasResults: analysisResults.length > 0,
      historyCount: researchHistory.length
    });
    
    // First update the state
    setShowHistory(true);
    setCurrentView('history');
    
    // Add a timeout to ensure data is refreshed before view is changed
    setTimeout(() => {
      // Force a refresh of the history data
      loadHistory().then(() => {
        console.log("✅ History data refreshed after force view change");
      });
      
      // Log the state after the update
      console.log("🔄 After forceHistoryView - state is now:", { 
        showHistory: true, 
        currentView: 'history',
        historyCount: researchHistory.length
      });
    }, 200);
  };

  // Auth effect
  useEffect(() => {
    console.log('Auth effect running');
    
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      console.log('Auth session retrieved', { hasSession: !!session });
      setUser(session?.user ?? null);
      setShowAuthModal(!session?.user);
    }).catch(error => {
      console.error('Error getting auth session:', error);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      console.log('Auth state changed', { event: _event, hasSession: !!session });
      setUser(session?.user ?? null);
      setShowAuthModal(!session?.user);
    });

    return () => {
      console.log('Auth effect cleanup');
      subscription.unsubscribe();
    };
  }, []);

  // Load research history when component mounts
  useEffect(() => {
    console.log('History effect running', { user: !!user });
    
    if (user) {
      loadHistory();
    } else {
      console.log('Skipping history load - no user');
    }
  }, [user]);

  // Create a loadHistory function that can be called from anywhere in the component
  const loadHistory = async () => {
    console.log('🔄 loadHistory function called');
    
    try {
      console.log('📊 Loading research history from database');
      const results = await getResearchResults();
      
      console.log('✅ Research history loaded successfully', { 
        count: results.length,
        items: results.map(r => ({ id: r.id, title: r.title }))
      });
      
      setResearchHistory(results);
      console.log('⚛️ State updated with new research history');
      
    } catch (error) {
      console.error('❌ Error loading research history:', error);
      toast.error('Failed to load research history');
    } finally {
      setIsLoading(false);
    }
  };

  // State update handlers
  const handleDocumentsProcessed = (docs: ProcessedDocument[]) => {
    setDocuments(docs);
  };

  const handleBlogLinksChange = (links: string[]) => {
    setBlogLinks(links);
  };

  const handleProductLinesChange = (lines: string[]) => {
    setProductLines(lines);
  };

  // Form validation
  const isFormValid = () => {
    return (documents.length > 0 || blogLinks.length > 0) && productLines.length > 0;
  };

  // Handle form submission
  const handleSubmit = async () => {
    if (!isFormValid()) return;

    setIsSubmitting(true);

    try {
      // Prepare the payload for the webhook - limit content size for large documents
      const payload = {
        documents: documents.map(doc => ({
          name: doc.name,
          // Strictly limit document content to 50KB to prevent processing errors
          content: doc.content.length > 50000 ? doc.content.substring(0, 50000) + "... (content truncated)" : doc.content,
          type: doc.type
        })),
        // Limit the number of inputs to prevent processing errors
        blogLinks: blogLinks.slice(0, 10), 
        productLines: productLines.slice(0, 10)
      };

      // Send data to webhook
      const response = await fetch('https://hook.us2.make.com/dmgxx97dencaquxi9vr9khxrr71kotpm', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        throw new Error(`Server responded with status: ${response.status}`);
      }

      // Get the response as text first to inspect it
      const responseText = await response.text();
      
      // Split the response by the separator line
      const jsonObjects = responseText.split('------------------------');
      console.log(`Found ${jsonObjects.length} JSON objects separated by delimiter`);
      
      // Process each JSON object separately
      const validObjects = jsonObjects
        .map(jsonStr => {
          try {
            // Clean up the JSON string
            const cleaned = jsonStr
              .replace(/```json/g, '') // Remove JSON code block markers
              .replace(/```/g, '')     // Remove remaining code block markers
              .trim();
            
            return JSON.parse(cleaned);
          } catch (e) {
            console.warn('Failed to parse JSON object:', e);
            return null;
          }
        })
        .filter(Boolean);
      
      if (validObjects.length === 0) {
        throw new Error('No valid JSON objects found in response');
      }
      
      console.log(`Successfully parsed ${validObjects.length} JSON objects`);

      // Parse the response data using our updated, safer parser
      const parsedResults = parseWebhookResponse(validObjects);
      
      // Even if parsing returns empty array, our enhanced parser will provide a default product
      setAnalysisResults(parsedResults);
      setActiveStep(4); // Move to results page
      toast.success('Analysis completed successfully!');
    } catch (error) {
      console.error("Submission error:", error);
      let errorMessage = 'An unexpected error occurred';
      
      if (error instanceof Error) {
        // Provide more user-friendly error messages
        if (error.message.includes('JSON')) {
          errorMessage = 'The response format was invalid. Our system attempted to recover what it could.';
        } else if (error.message.includes('status: 429')) {
          errorMessage = 'The service is temporarily busy. Please wait a moment and try again.';
        } else {
          errorMessage = `Error: ${error.message}`;
        }
      }
      
      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Reset the form to start over
  const handleStartNew = () => {
    setActiveStep(1);
    setDocuments([]);
    setBlogLinks([]);
    setProductLines([]);
    setAnalysisResults([]);
  };

  const handleSelectHistoryItem = (result: ResearchResult) => {
    setAnalysisResults(result.data);
    setActiveStep(4);
    setShowHistory(false);
    setCurrentView('results');
  };

  const handleDeleteResult = async (id: string) => {
    try {
      await deleteResearchResult(id);
      setResearchHistory(prevHistory => prevHistory.filter(result => result.id !== id));
      toast.success('Research result deleted successfully');
    } catch (error) {
      console.error('Error deleting research result:', error);
      toast.error('Failed to delete research result');
    }
  };

  // Update currentView based on state changes
  useEffect(() => {
    console.log('View state effect running', { user: !!user, showHistory, activeStep, hasResults: analysisResults.length > 0 });
    
    let newView: 'auth' | 'main' | 'history' | 'results' = 'main';
    
    if (!user) {
      newView = 'auth';
    } else if (showHistory) {
      newView = 'history';
    } else if (activeStep === 4 && analysisResults.length > 0) {
      newView = 'results';
    } else {
      newView = 'main';
    }
    
    console.log('Setting new view', { oldView: currentView, newView });
    setCurrentView(newView);
  }, [user, showHistory, activeStep, analysisResults]);

  // Update the ProductResultsPage render
  const renderResultsPage = () => {
    return (
      <div className="min-h-screen bg-gradient-dark bg-circuit-board">
        <MainHeader 
          showHistory={showHistory} 
          setShowHistory={(value) => {
            console.log("Setting showHistory to:", value);
            setShowHistory(value);
            if (value) {
              setCurrentView('history');
            }
          }} 
          onStartNew={handleStartNew}
          user={user}
          forceHistoryView={forceHistoryView}
        />
        <ProductResultsPage 
          products={analysisResults} 
          onStartNew={handleStartNew}
          showHistory={showHistory}
          setShowHistory={(value) => {
            console.log("ProductResultsPage setting showHistory to:", value);
            setShowHistory(value);
            if (value) {
              setCurrentView('history');
            }
          }}
          forceHistoryView={forceHistoryView}
          existingId={researchHistory.find(r =>
            JSON.stringify(r.data.map(d => d.companyName).sort()) === 
            JSON.stringify(analysisResults.map(a => a.companyName).sort())
          )?.id}
          onHistorySave={loadHistory}
        />
      </div>
    );
  };

  // Render based on currentView
  const renderView = () => {
    console.log('Rendering view', { currentView });
    
    switch (currentView) {
      case 'auth':
        return (
          <div className="min-h-screen bg-gradient-dark bg-circuit-board">
            <Toaster position="top-right" />
            <MainHeader />
            <AuthModal 
              isOpen={showAuthModal} 
              onClose={() => setShowAuthModal(false)} 
            />
          </div>
        );
      
      case 'history':
        return (
          <div className="min-h-screen bg-gradient-dark bg-circuit-board">
            <Toaster position="top-right" />
            <MainHeader 
              showHistory={showHistory} 
              setShowHistory={(value) => {
                console.log("History page setting showHistory to:", value);
                setShowHistory(value);
                if (!value) {
                  setCurrentView('main');
                }
              }}
              onStartNew={handleStartNew}
              user={user}
              forceHistoryView={forceHistoryView}
            />
            <motion.div 
              className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <div className="flex items-center justify-between mb-8">
                <div className="space-y-1">
                  <motion.h1 
                    className="text-3xl font-bold text-primary-400"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.5, delay: 0.1 }}
                  >
                    Research History
                  </motion.h1>
                  <motion.p 
                    className="text-gray-400"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.5, delay: 0.2 }}
                  >
                    View and manage your past research results
                  </motion.p>
                </div>
                <motion.button
                  onClick={() => {
                    console.log("Back to Research button clicked");
                    setShowHistory(false);
                    setCurrentView('main');
                  }}
                  className="px-4 py-2 bg-secondary-800 border-2 border-primary-500/20 text-primary-400 rounded-lg hover:bg-secondary-700 
                    transition-all shadow-glow hover:shadow-glow-strong hover:border-primary-500/40 flex items-center gap-2"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.5, delay: 0.3 }}
                >
                  Back to Research
                </motion.button>
              </div>
              <ResearchHistory
                results={researchHistory}
                onSelect={handleSelectHistoryItem}
                onDelete={handleDeleteResult}
                isLoading={isLoading}
                onStartNew={handleStartNew}
              />
            </motion.div>
          </div>
        );
        
      case 'results':
        console.log('Rendering results view');
        return renderResultsPage();
        
      default: // 'main'
        console.log('Rendering main view');
        return (
          <div className="min-h-screen bg-gradient-dark bg-circuit-board">
            <Toaster position="top-right" />
            <MainHeader 
              showHistory={showHistory} 
              setShowHistory={(value) => {
                console.log("Main view setting showHistory to:", value);
                setShowHistory(value);
                if (value) {
                  setCurrentView('history');
                }
              }}
              user={user}
              forceHistoryView={forceHistoryView}
            />
            <ProcessingModal isOpen={isSubmitting} />
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 relative pt-8 pb-16">
              <Header />
              <div className="mt-10 space-y-12">
                <motion.div 
                  className="bg-gradient-to-b from-secondary-900 to-secondary-800 border-2 border-primary-500/30 p-10 rounded-2xl shadow-glow-lg relative overflow-hidden"
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6 }}
                >
                  {/* Decorative elements */}
                  <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-primary-500/10 to-transparent rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 pointer-events-none" />
                  <div className="absolute bottom-0 left-0 w-64 h-64 bg-gradient-to-tr from-blue-500/10 to-transparent rounded-full blur-3xl translate-y-1/2 -translate-x-1/3 pointer-events-none" />
                  
                  <motion.h2 
                    className="text-2xl font-bold mb-2 bg-gradient-to-r from-primary-400 to-yellow-400 bg-clip-text text-transparent inline-block"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.5, delay: 0.2 }}
                  >
                    Upload Your Research Sources
                  </motion.h2>
                  
                  <motion.p 
                    className="text-gray-400 mb-8"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.5, delay: 0.3 }}
                  >
                    Add your documents, blog links, and product information for comprehensive analysis
                  </motion.p>
                  
                  <div className="space-y-12 relative z-10">
                    <DocumentUploader onDocumentsProcessed={handleDocumentsProcessed} />
                    
                    <div className="border-t border-secondary-700/50 pt-10">
                      <BlogLinkInput onBlogLinksChange={handleBlogLinksChange} />
                    </div>
                    
                    <div className="border-t border-secondary-700/50 pt-10">
                      <ProductLineInput onProductLinesChange={handleProductLinesChange} />
                    </div>
                    
                    <div className="border-t border-secondary-700/50 pt-10">
                      <SubmitSection 
                        isDisabled={!isFormValid()} 
                        isSubmitting={isSubmitting} 
                        onSubmit={handleSubmit} 
                      />
                    </div>
                  </div>
                </motion.div>
              </div>
            </div>
          </div>
        );
    }
  };
  
  console.log('About to return main component');
  return (
    <div className="relative">
      <Toaster position="top-right" />
      
      {showAuthModal && !user && (
        <AuthModal 
          isOpen={showAuthModal}
          onClose={() => setShowAuthModal(false)}
        />
      )}

      {isSubmitting && <ProcessingModal isOpen={isSubmitting} />}

      <AnimatePresence mode="wait">
        {currentView === 'main' && (
          <motion.div key="main" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            {renderView()}
          </motion.div>
        )}
        {currentView === 'history' && (
          <motion.div key="history" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            {renderView()}
          </motion.div>
        )}
        {currentView === 'results' && (
          <motion.div key="results" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            {renderView()}
          </motion.div>
        )}
        {currentView === 'auth' && (
          <motion.div key="auth" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            {renderView()}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}