import React from 'react';
import { motion } from 'framer-motion';
import { Target, Loader2, ExternalLink } from 'lucide-react';
import toast from 'react-hot-toast';
import { ProductAnalysis, CompetitorsData } from '../types/product/types';

interface CompetitorAnalysisButtonProps {
  onAnalysisComplete: (documentUrl: string) => void;
  onCompetitorsReceived?: (competitors: CompetitorsData) => void;
  product: {
    companyName: string;
    productDetails: {
      name: string;
      description: string;
    };
    usps: string[];
    features: string[];
    capabilities: Array<{
      title: string;
      description: string;
      content: string;
    }>;
  };
}

export function CompetitorAnalysisButton({ product, onAnalysisComplete, onCompetitorsReceived }: CompetitorAnalysisButtonProps) {
  const [isLoading, setIsLoading] = React.useState(false);

  const handleCompetitorAnalysis = async () => {
    setIsLoading(true);
    const loadingToast = toast.loading('Requesting competitor analysis...');

    try {
      console.log("Sending request to webhook with product:", product);
      
      const response = await fetch('https://hook.us2.make.com/n4kuyrqovr1ndwj9nsodio7th70wbm6i', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          product: {
            companyName: product.companyName,
            productName: product.productDetails.name,
            description: product.productDetails.description,
            usps: product.usps,
            features: product.features,
            capabilities: product.capabilities.map(cap => ({
              title: cap.title,
              description: cap.description,
              content: cap.content
            }))
          },
          requestType: 'competitor_analysis'
        })
      });

      if (!response.ok) {
        throw new Error('Failed to request competitor analysis');
      }
      
      // Check if response is JSON or plain text
      const contentType = response.headers.get('content-type');
      let data;
      
      if (contentType && contentType.includes('application/json')) {
        data = await response.json();
        
        console.log("Received webhook data:", data);
        
        // Create a competitors structure regardless of response format
        // This ensures we always initialize the UI with at least empty arrays
        let competitors: CompetitorsData = {
          direct_competitors: [],
          niche_competitors: [],
          broader_competitors: []
        };
        
        // Try to extract from the exact JSON format shown in the example
        if (data && typeof data === 'object') {
          // Special case for exact format: { company, product, competitors }
          if (data.company && data.product && data.competitors) {
            console.log("Found company/product/competitors format in response");
            
            if (typeof data.competitors === 'object') {
              if (Array.isArray(data.competitors.direct_competitors)) {
                competitors.direct_competitors = [...data.competitors.direct_competitors];
              }
              if (Array.isArray(data.competitors.niche_competitors)) {
                competitors.niche_competitors = [...data.competitors.niche_competitors];
              }
              if (Array.isArray(data.competitors.broader_competitors)) {
                competitors.broader_competitors = [...data.competitors.broader_competitors];
              }
            }
          } 
          // Check for any other format that might have competitors
          else if (data.competitors && typeof data.competitors === 'object') {
            console.log("Found competitors object in response");
            
            if (Array.isArray(data.competitors.direct_competitors)) {
              competitors.direct_competitors = [...data.competitors.direct_competitors];
            }
            if (Array.isArray(data.competitors.niche_competitors)) {
              competitors.niche_competitors = [...data.competitors.niche_competitors];
            }
            if (Array.isArray(data.competitors.broader_competitors)) {
              competitors.broader_competitors = [...data.competitors.broader_competitors];
            }
          }
          
          // If we have documentUrl that contains a JSON string with competitor data
          if (data.documentUrl && typeof data.documentUrl === 'string') {
            try {
              // Try to parse it as JSON first
              const docUrlData = JSON.parse(data.documentUrl);
              console.log("Parsed documentUrl as JSON:", docUrlData);
              
              if (docUrlData.competitors && typeof docUrlData.competitors === 'object') {
                if (Array.isArray(docUrlData.competitors.direct_competitors)) {
                  competitors.direct_competitors = [...docUrlData.competitors.direct_competitors];
                }
                if (Array.isArray(docUrlData.competitors.niche_competitors)) {
                  competitors.niche_competitors = [...docUrlData.competitors.niche_competitors];
                }
                if (Array.isArray(docUrlData.competitors.broader_competitors)) {
                  competitors.broader_competitors = [...docUrlData.competitors.broader_competitors];
                }
                console.log("Extracted competitors from documentUrl:", competitors);
              }
            } catch (e) {
              console.log("documentUrl is not a valid JSON string:", e);
            }
          }
          
          // Always call onCompetitorsReceived with our competitors structure
          console.log("Sending competitors to UI:", competitors);
          onCompetitorsReceived?.(competitors);
        }
        
        // Handle document URL separately
        if (data.documentUrl) {
          onAnalysisComplete(data.documentUrl);
        }
      } else {
        // Try to parse plain text response as JSON first, it might be JSON without proper content-type
        const textResponse = await response.text();
        try {
          const jsonData = JSON.parse(textResponse);
          console.log("Parsed text response as JSON:", jsonData);
          
          // Extract competitors if available
          let competitors: CompetitorsData = {
            direct_competitors: [],
            niche_competitors: [],
            broader_competitors: []
          };
          
          if (jsonData.competitors && typeof jsonData.competitors === 'object') {
            if (Array.isArray(jsonData.competitors.direct_competitors)) {
              competitors.direct_competitors = [...jsonData.competitors.direct_competitors];
            }
            if (Array.isArray(jsonData.competitors.niche_competitors)) {
              competitors.niche_competitors = [...jsonData.competitors.niche_competitors];
            }
            if (Array.isArray(jsonData.competitors.broader_competitors)) {
              competitors.broader_competitors = [...jsonData.competitors.broader_competitors];
            }
            console.log("Extracted competitors from text response:", competitors);
            onCompetitorsReceived?.(competitors);
          }
          
          // Handle document URL if available
          if (jsonData.documentUrl) {
            onAnalysisComplete(jsonData.documentUrl);
          } else {
            // Use the entire response as the document URL if no specific URL is provided
            onAnalysisComplete(textResponse);
          }
        } catch (e) {
          console.log("Text response is not valid JSON, using as-is:", e);
          onAnalysisComplete(textResponse);
        }
      }
      
      toast.success('Competitor analysis request sent successfully!', { id: loadingToast });
    } catch (error) {
      console.error('Error requesting competitor analysis:', error);
      toast.error('Failed to request competitor analysis. Please try again.', { id: loadingToast });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <motion.button
      onClick={handleCompetitorAnalysis}
      disabled={isLoading}
      className="flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all duration-300 shadow-sm
        bg-gradient-to-r from-secondary-600 to-secondary-500 text-white hover:shadow-md hover:shadow-secondary-100/50
        disabled:bg-gray-100 disabled:text-gray-500 disabled:cursor-not-allowed"
      whileHover={!isLoading ? { scale: 1.02 } : {}}
      whileTap={!isLoading ? { scale: 0.98 } : {}}
    >
      {isLoading ? (
        <>
          <Loader2 className="w-5 h-5 animate-spin" />
          Processing...
        </>
      ) : (
        <>
          <Target className="w-4 h-4" />
          Identify Competitors
        </>
      )}
    </motion.button>
  );
}