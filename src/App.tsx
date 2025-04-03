import React, { useState } from 'react';
import { motion } from 'framer-motion';
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

function App() {
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
  
  // Function to force update to history view
  const forceHistoryView = () => {
    console.log("Forcing history view - current state:", { 
      showHistory, 
      currentView, 
      activeStep,
      hasResults: analysisResults.length > 0
    });
    
    setShowHistory(true);
    setCurrentView('history');
    
    // Add a timeout to log the state after the update
    setTimeout(() => {
      console.log("After forceHistoryView - state is now:", { 
        showHistory: true, 
        currentView: 'history'
      });
    }, 100);
  };

  React.useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setShowAuthModal(!session?.user);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      setShowAuthModal(!session?.user);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Load research history when component mounts
  React.useEffect(() => {
    const loadHistory = async () => {
      try {
        const results = await getResearchResults();
        setResearchHistory(results);
      } catch (error) {
        console.error('Error loading research history:', error);
        toast.error('Failed to load research history');
      } finally {
        setIsLoading(false);
      }
    };

    if (user) {
      loadHistory();
    }
  }, [user]);

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
  React.useEffect(() => {
    if (!user) {
      setCurrentView('auth');
    } else if (showHistory) {
      setCurrentView('history');
    } else if (activeStep === 4 && analysisResults.length > 0) {
      setCurrentView('results');
    } else {
      setCurrentView('main');
    }
  }, [user, showHistory, activeStep, analysisResults]);

  // Update the ProductResultsPage render
  const renderResultsPage = () => {
    return (
      <div className="min-h-screen bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-50 via-blue-50 to-indigo-50">
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
            r.data[0]?.companyName === analysisResults[0]?.companyName && 
            r.data[0]?.productDetails?.name === analysisResults[0]?.productDetails?.name
          )?.id}
        />
      </div>
    );
  };

  // Render based on currentView
  const renderView = () => {
    switch (currentView) {
      case 'auth':
        return (
          <div className="min-h-screen bg-gradient-to-b from-slate-50 to-blue-50">
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
          <div className="min-h-screen bg-gradient-to-b from-slate-50 via-blue-50 to-indigo-50">
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
                    className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary-600 via-secondary-600 to-primary-600"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.5, delay: 0.1 }}
                  >
                    Research History
                  </motion.h1>
                  <motion.p 
                    className="text-gray-500"
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
                  className="px-4 py-2 bg-white border-2 border-primary-200 text-primary-700 rounded-lg hover:bg-primary-50 
                    transition-all shadow-sm hover:shadow-lg hover:shadow-primary-100/50 flex items-center gap-2"
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
        return renderResultsPage();
        
      default: // 'main'
        return (
          <div className="min-h-screen bg-gradient-to-b from-slate-50 to-blue-50">
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
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 relative pt-8">
              <Header />
              <div className="mt-8 space-y-12">
                <div className="bg-white p-8 rounded-xl shadow-soft">
                  <h2 className="text-2xl font-bold mb-8">Upload Your Research Sources</h2>
                  
                  <div className="space-y-10">
                    <DocumentUploader onDocumentsProcessed={handleDocumentsProcessed} />
                    
                    <div className="border-t border-gray-100 pt-8">
                      <BlogLinkInput onBlogLinksChange={handleBlogLinksChange} />
                    </div>
                    
                    <div className="border-t border-gray-100 pt-8">
                      <ProductLineInput onProductLinesChange={handleProductLinesChange} />
                    </div>
                    
                    <div className="border-t border-gray-100 pt-8">
                      <SubmitSection 
                        isDisabled={!isFormValid()} 
                        isSubmitting={isSubmitting} 
                        onSubmit={handleSubmit} 
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
    }
  };
  
  return (
    <>
      <Toaster position="top-right" />
      {renderView()}
    </>
  );
}

export default App;