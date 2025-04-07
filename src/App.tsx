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
import { ResearchResult, getResearchResults, deleteResearchResult } from './lib/research';
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
  // Add a view state to control which view is displayed
  const [currentView, setCurrentView] = useState<'auth' | 'main' | 'history' | 'results' | 'admin'>('main');
  
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
          setShowAuthModal(!session.user);
        }
      } else {
        setUser(null);
        setShowAuthModal(true);
      }
    }).catch(error => {
      console.error('Error getting auth session:', error);
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
        }
      } else {
        setUser(null);
        setIsAdmin(false);
        setShowAuthModal(true);
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
      
      // Save to history
      if (user && results.length > 0) {
        try {
          // Create a title from the product lines
          const title = productLines.join(", ").substring(0, 100) + 
            (productLines.join(", ").length > 100 ? "..." : "");
          
          // Save to Supabase directly with the format it expects
          const { error } = await supabase
            .from('research_results')
            .insert([{ 
              user_id: user.id,
              title,
              data: results,  // Just pass the results directly as ProductAnalysis[]
              is_draft: false
            }]);
          
          if (error) {
            console.error('Error saving to history:', error);
        } else {
            console.log('Successfully saved to history');
          }
        } catch (historyError) {
          console.error('Failed to save to history:', historyError);
        }
      }
      
      // Show the results view
      setCurrentView('results');
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
    setCurrentView('main');
  };

  const handleSelectHistoryItem = (result: ResearchResult) => {
    console.log('Selected history item:', result);
    // ResearchResult.data is already ProductAnalysis[]
    setAnalysisResults(result.data);
    setCurrentView('results');
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
            }
          }}
          forceHistoryView={forceHistoryView}
          existingId={undefined}
          onHistorySave={loadHistory}
        />
      </div>
    );
  };

  // Render the main view based on the current state
  const renderView = () => {
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
              <ResearchHistory
                results={researchHistory}
            isLoading={isLoading}
                onSelect={handleSelectHistoryItem}
                onDelete={handleDeleteResult}
                onStartNew={handleStartNew}
              />
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