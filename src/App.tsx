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
import { ProductAnalysis, parseWebhookResponse } from './types/product/index';
import { ProcessingModal } from './components/ProcessingModal';
import { ResearchResult, getResearchResults, deleteResearchResult, getResearchResultById } from './lib/research';
import { AdminAuthModal } from './components/admin/AdminAuthModal';
import { AdminDashboard } from './components/admin/AdminDashboard';

// Create a type for the history item in case it's different from what the ResearchResult type expects
interface HistoryItem {
  title: string;
  timestamp: string;
  input: {
    documents: Array<{
      name: string;
      type: string;
    }>;
    blogLinks: string[];
    productLines: string[];
  };
  results: ProductAnalysis[];
}

export default function App() {
  console.log('App rendering started');
  
  const [user, setUser] = React.useState<any>(null);
  const [showAuthModal, setShowAuthModal] = React.useState(true);
  const [showAdminAuthModal, setShowAdminAuthModal] = React.useState(false);
  const [isAdmin, setIsAdmin] = React.useState(false);
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
  const [currentResearchId, setCurrentResearchId] = useState<string | undefined>(undefined);
  // Add a view state to control which view is displayed - default to 'auth' instead of 'main'
  const [currentView, setCurrentView] = useState<'auth' | 'main' | 'history' | 'results' | 'admin'>('auth');
  
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

  // Function to handle showing the auth modal
  const handleShowAuthModal = () => {
    console.log("Showing auth modal");
    setShowAuthModal(true);
  };

  // Function to handle showing the admin auth modal
  const handleShowAdminAuthModal = () => {
    setShowAuthModal(false);
    setShowAdminAuthModal(true);
  };

  // Function to handle admin authentication
  const handleAdminAuthenticated = () => {
    setIsAdmin(true);
    setCurrentView('admin');
    // Make sure to close all auth modals
    setShowAuthModal(false);
    setShowAdminAuthModal(false);
  };

  // Auth effect
  useEffect(() => {
    console.log('Auth effect running');
    
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      console.log('Auth session retrieved', { hasSession: !!session });
      if (session?.user) {
        setUser(session.user);
        
        // Check if the user is an admin
        const userData = session.user.user_metadata;
        if (userData && (userData.is_admin === true || userData.role === 'admin')) {
          setIsAdmin(true);
          setCurrentView('admin');
        } else {
          setShowAuthModal(false); // Don't show auth modal if user is logged in
          setCurrentView('main'); // Set to main view for authenticated non-admin users
        }
      } else {
        setUser(null);
        setShowAuthModal(true);
        setCurrentView('auth'); // Ensure auth view is set for unauthenticated users
      }
    }).catch(error => {
      console.error('Error getting auth session:', error);
      setShowAuthModal(true);
      setCurrentView('auth');
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      console.log('Auth state changed', { event: _event, hasSession: !!session });
      
      if (session?.user) {
        setUser(session.user);
        
        // Check if the user is an admin
        const userData = session.user.user_metadata;
        if (userData && (userData.is_admin === true || userData.role === 'admin')) {
          setIsAdmin(true);
          setCurrentView('admin');
          // Close all auth modals for admin users
          setShowAuthModal(false);
          setShowAdminAuthModal(false);
        } else {
          setShowAuthModal(false);
          setCurrentView('main');
        }
      } else {
        // User logged out or session expired
        setUser(null);
        setIsAdmin(false);
        setShowAuthModal(true);
        // Reset view to auth when logged out - ensure this runs before any redirects
        setCurrentView('auth');
        // Reset other state as needed
        setShowHistory(false);
        setResearchHistory([]);
        
        // If we're handling a logout event (not just a session expiration), 
        // make sure the UI state is updated before any redirects happen
        if (_event === 'SIGNED_OUT') {
          console.log('User signed out - resetting app state');
        }
      }
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

  // --- Callback for when ProductResultsPage saves a NEW analysis --- 
  const handleSaveComplete = (newId: string) => {
    console.log(`[App] Received new research ID from ProductResultsPage: ${newId}`);
    // Just store the ID, do nothing else
    setCurrentResearchId(newId);
    // NO view changes or history navigation
  };

  const handleSelectHistoryItem = async (result: ResearchResult) => {
    console.log('[App] Selecting history item:', result.id);
    console.log('[App] Item data array length:', result.data.length, 'items');
    setIsLoading(true);
    try {
      // Fetch the full data again in case it was truncated or needs refresh
      const fullResult = await getResearchResultById(result.id);
      if (fullResult) {
        console.log('[App] Loaded full result, contains', fullResult.data.length, 'products');
        setAnalysisResults(fullResult.data || []);
        setCurrentResearchId(fullResult.id);
        setCurrentView('results');
        setShowHistory(false); 
      } else {
        toast.error('Could not load the selected research details.');
      }
    } catch (error) {
      console.error('Error loading selected research item:', error);
      toast.error('Failed to load details.');
    } finally {
      setIsLoading(false);
    }
  };
  
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
      const results: ProductAnalysis[] = [];

      for (const jsonStr of jsonObjects) {
          try {
            // Clean up the JSON string
            const cleaned = jsonStr
              .replace(/```json/g, '') // Remove JSON code block markers
              .replace(/```/g, '')     // Remove remaining code block markers
            .trim();                 // Remove extra whitespace
          
          // Only attempt to parse if we have content
          if (cleaned.length === 0) continue;
          
          // Parse and handle any response formatting issues
          const parsedResults = parseWebhookResponse(cleaned);
          if (parsedResults && parsedResults.length > 0) {
            results.push(...parsedResults);
          }
        } catch (err) {
          console.error('Failed to parse result item:', err, jsonStr);
        }
      }
      
      // Set the results
      setAnalysisResults(results);
      setCurrentResearchId(undefined); // Clear previous ID when starting new analysis
      setCurrentView('results');
      
      // Remove automatic saving of entire collection
      // Users should explicitly save what they want through the Save button on cards
      // This prevents duplicate entries in history
      
      console.log('Analysis completed - results ready for review. User can now save individual products.');
    } catch (error) {
      console.error('Error submitting form:', error);
      toast.error('An error occurred while analyzing the product data.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleStartNew = () => {
    // Reset form state
    setDocuments([]);
    setBlogLinks([]);
    setProductLines([]);
    setAnalysisResults([]);
    setActiveStep(1);
    setCurrentResearchId(undefined); // Clear ID when starting new
    setCurrentView('main');
  };

  const handleDeleteResult = async (id: string) => {
    try {
      // First, update the UI to give immediate feedback
      setResearchHistory(prev => prev.filter(item => item.id !== id));
      
      // Then actually delete from the database
      await deleteResearchResult(id);
      toast.success('Research item deleted');
    } catch (error) {
      console.error('Error deleting result:', error);
      toast.error('An error occurred while deleting');
      // Refresh the history to revert UI changes if there was an error
      loadHistory();
    }
  };

  // Handle admin logout
  const handleAdminLogout = () => {
    setIsAdmin(false);
    setCurrentView('main');
  };

  // Render the results page
  const renderResultsPage = () => {
    return (
      <div className="flex flex-col min-h-screen">
        <MainHeader 
          user={user}
          showHistory={showHistory} 
          setShowHistory={(value) => {
            setShowHistory(value);
            if (value) {
              setCurrentView('history');
            }
          }} 
          onStartNew={handleStartNew}
          forceHistoryView={forceHistoryView}
          onShowAuthModal={handleShowAuthModal}
        />
        <ProductResultsPage 
          products={analysisResults} 
          onStartNew={handleStartNew}
          showHistory={showHistory}
          setShowHistory={(value) => {
            setShowHistory(value);
            if (value) {
              setCurrentView('history');
            } else {
              // Optional: Go back to main if history is closed from results?
              // setCurrentView('main'); 
            }
          }}
          forceHistoryView={forceHistoryView}
          existingId={currentResearchId}
          onHistorySave={loadHistory}
          onSaveComplete={handleSaveComplete}
        />
      </div>
    );
  };

  // Render the main view based on the current state
  const renderView = () => {
    // For unauthenticated users, show auth view
    if (currentView === 'auth' || !user) {
      return (
        <div className="flex flex-col min-h-screen">
          <header className="sticky top-0 z-50 backdrop-blur-xl bg-gradient-to-r from-secondary-900/95 to-secondary-800/95 border-b border-primary-500/30 shadow-lg">
            <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex justify-between h-16">
                <div className="flex">
                  <div className="flex-shrink-0 flex items-center">
                    <div className="flex items-center gap-3 group">
                      <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <rect width="32" height="32" rx="8" fill="#FFE600" />
                        <path d="M18.5 5L7 17.5H14L12.5 27L24 14.5H17L18.5 5Z" fill="#0A0A0A" stroke="#0A0A0A" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                      <span className="text-xl font-bold bg-gradient-to-r from-yellow-400 to-primary-400 bg-clip-text text-transparent">BOFU AI</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center">
                  <button
                    onClick={handleShowAuthModal}
                    className="px-5 py-2 bg-gradient-to-r from-primary-500/80 to-yellow-500/80 text-secondary-900 font-medium rounded-lg 
                      transition-all shadow-md hover:shadow-glow-strong hover:from-primary-500 hover:to-yellow-500"
                  >
                    Sign In
                  </button>
                </div>
              </div>
            </nav>
          </header>
          <div className="container max-w-6xl mx-auto px-4 py-16 flex-grow flex items-center justify-center">
            <div className="text-center">
              <h1 className="text-4xl md:text-5xl font-bold mb-6 bg-gradient-to-r from-yellow-400 to-primary-400 bg-clip-text text-transparent">
                BOFU AI Research Assistant
              </h1>
              <p className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto">
                Upload your research documents, add blog URLs, and specify your product lines to generate comprehensive bottom-of-funnel analysis.
              </p>
              <button
                onClick={handleShowAuthModal}
                className="px-6 py-3 bg-gradient-to-r from-primary-500 to-yellow-500 text-secondary-900 font-medium rounded-lg 
                  transition-all shadow-md hover:shadow-glow-strong text-lg"
              >
                Sign In to Get Started
              </button>
            </div>
          </div>
        </div>
      );
    }

    if (currentView === 'admin' && isAdmin) {
      return <AdminDashboard onLogout={handleAdminLogout} />;
    }
    
    if (currentView === 'results') {
      return renderResultsPage();
    }

    if (currentView === 'history') {
        return (
        <div className="flex flex-col min-h-screen">
            <MainHeader 
            user={user}
              showHistory={showHistory} 
              setShowHistory={(value) => {
                setShowHistory(value);
                if (!value) {
                  setCurrentView('main');
                }
              }}
              onStartNew={handleStartNew}
              forceHistoryView={forceHistoryView}
            onShowAuthModal={handleShowAuthModal}
          />
            <div className="flex-1 bg-gradient-dark bg-circuit-board">
              <ResearchHistory
                results={researchHistory}
                isLoading={isLoading}
                onSelect={handleSelectHistoryItem}
                onDelete={handleDeleteResult}
                onStartNew={handleStartNew}
              />
            </div>
          </div>
        );
    }

    // Main form view
        return (
      <div className="flex flex-col min-h-screen">
            <MainHeader 
          user={user}
              showHistory={showHistory} 
              setShowHistory={(value) => {
                setShowHistory(value);
                if (value) {
                  setCurrentView('history');
                }
              }}
          onStartNew={handleStartNew}
              forceHistoryView={forceHistoryView}
          onShowAuthModal={handleShowAuthModal}
        />
        <div className="container max-w-6xl mx-auto px-4 py-6 flex-grow">
          <Header />
          
          <div className="space-y-6 mt-6">
            {/* Step 1: Document Upload */}
            <DocumentUploader 
              onDocumentsProcessed={handleDocumentsProcessed} 
            />
            
            {/* Step 2: Blog Link Input */}
            <BlogLinkInput 
              onBlogLinksChange={handleBlogLinksChange}
            />
            
            {/* Step 3: Product Line Input */}
            <ProductLineInput 
              onProductLinesChange={handleProductLinesChange}
            />
            
            {/* Submit Section */}
                      <SubmitSection 
                        isDisabled={!isFormValid()} 
              onSubmit={handleSubmit}
                        isSubmitting={isSubmitting} 
                      />
              </div>
            </div>
          </div>
        );
  };
  
  // Add a global navigation handler to detect when the user manually tries to go to the home page
  // This helps catch redirects from logout actions
  useEffect(() => {
    const handleBeforeUnload = () => {
      // When navigating away, check if we're logging out
      if (document.location.pathname === '/' && user) {
        console.log('Navigation detected - clearing local session data');
        // Force clear any session data to prevent getting stuck
        localStorage.removeItem('supabase.auth.token');
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [user]);
  
  return (
    <div className="bg-secondary-900 text-white">
      <Toaster position="top-right" />
      
      {/* Authentication Modal */}
        <AuthModal 
          isOpen={showAuthModal}
          onClose={() => setShowAuthModal(false)}
        onShowAdminLogin={handleShowAdminAuthModal}
      />
      
      {/* Admin Authentication Modal */}
      <AdminAuthModal
        isOpen={showAdminAuthModal}
        onClose={() => {
          setShowAdminAuthModal(false);
          setShowAuthModal(true);
        }}
        onAdminAuthenticated={handleAdminAuthenticated}
      />
      
      {/* Processing Modal */}
      <ProcessingModal isOpen={isSubmitting} />
      
      {/* Main Content */}
            {renderView()}
    </div>
  );
}