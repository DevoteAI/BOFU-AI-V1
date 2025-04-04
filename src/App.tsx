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
    
    if (!user && activeStep === 1) {
      newView = 'auth';
    } else if (showHistory) {
      newView = 'history';
    } else if (analysisResults.length > 0 || activeStep === 4) {
      newView = 'results';
    } else {
      newView = 'main';
    }
    
    if (newView !== currentView) {
      setCurrentView(newView);
    }
  }, [user, showHistory, activeStep, analysisResults]);

  const renderMainContent = () => {
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

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <Header activeStep={activeStep} />

          {/* Step 1: Document Upload */}
          {activeStep === 1 && (
            <div className="mt-10">
              <DocumentUploader onDocumentsProcessed={handleDocumentsProcessed} documents={documents} />
            </div>
          )}

          {/* Step 2: Blog Link Input */}
          {activeStep === 2 && (
            <div className="mt-10">
              <BlogLinkInput onBlogLinksChange={handleBlogLinksChange} blogLinks={blogLinks} />
            </div>
          )}

          {/* Step 3: Product Line Input */}
          {activeStep === 3 && (
            <div className="mt-10">
              <ProductLineInput onProductLinesChange={handleProductLinesChange} productLines={productLines} />
            </div>
          )}

          {/* Next/Previous/Submit Navigation */}
          <SubmitSection
            activeStep={activeStep}
            setActiveStep={setActiveStep}
            isFormValid={isFormValid}
            onSubmit={handleSubmit}
            isSubmitting={isSubmitting}
            documents={documents}
            blogLinks={blogLinks}
            productLines={productLines}
          />
        </div>
      </div>
    );
  };

  const renderHistoryView = () => {
    return (
      <div className="min-h-screen bg-gradient-dark bg-circuit-board">
        <MainHeader 
          showHistory={showHistory} 
          setShowHistory={(value) => {
            console.log("Setting showHistory to:", value);
            setShowHistory(value);
            if (!value) {
              // If hiding history, go back to previous view
              if (analysisResults.length > 0) {
                setCurrentView('results');
              } else {
                setCurrentView('main');
              }
            }
          }} 
          onStartNew={handleStartNew}
          user={user}
          forceHistoryView={forceHistoryView}
        />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <h2 className="text-3xl font-bold text-primary-400 mb-8">Your Research History</h2>
          <ResearchHistory 
            results={researchHistory} 
            onSelect={handleSelectHistoryItem} 
            onDelete={handleDeleteResult}
            isLoading={isLoading}
            onStartNew={handleStartNew}
          />
        </div>
      </div>
    );
  };

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

  return (
    <div className="relative">
      <Toaster position="top-center" />
      
      {showAuthModal && !user && (
        <AuthModal 
          onClose={() => setShowAuthModal(false)}
          onSuccess={() => loadHistory()}
        />
      )}

      {isSubmitting && <ProcessingModal />}

      <AnimatePresence mode="wait">
        {currentView === 'main' && renderMainContent()}
        {currentView === 'history' && renderHistoryView()}
        {currentView === 'results' && renderResultsPage()}
        {currentView === 'auth' && user === null && (
          <div className="min-h-screen flex items-center justify-center bg-gradient-dark bg-circuit-board">
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
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}