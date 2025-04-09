// Core product interfaces
export interface CompetitorItem {
  company_name: string;
  product_name: string;
  category: string;
}

export interface CompetitorsData {
  direct_competitors: CompetitorItem[];
  niche_competitors: CompetitorItem[];
  broader_competitors: CompetitorItem[];
}

export interface ProductAnalysis {
  companyName: string;
  competitorAnalysisUrl?: string;
  productDetails: {
    name: string;
    description: string;
  };
  usps: string[];
  businessOverview: {
    mission: string;
    industry: string;
    keyOperations: string;
  };
  painPoints: string[];
  features: string[];
  targetPersona: {
    primaryAudience: string;
    demographics: string;
    industrySegments: string;
    psychographics: string;
  };
  pricing: string;
  currentSolutions: {
    directCompetitors: string[];
    existingMethods: string[];
  };
  capabilities: Array<{
    title: string;
    description: string;
    content: string;
    images?: string[];
  }>;
  competitors?: CompetitorsData;
  isApproved?: boolean;
  approvedBy?: string;
}

// Default product template
export const defaultProduct: ProductAnalysis = {
  companyName: '',
  competitorAnalysisUrl: undefined,
  productDetails: {
    name: '',
    description: ''
  },
  usps: [],
  businessOverview: {
    mission: '',
    industry: '',
    keyOperations: ''
  },
  painPoints: [],
  features: [],
  targetPersona: {
    primaryAudience: '',
    demographics: '',
    industrySegments: '',
    psychographics: ''
  },
  pricing: '',
  currentSolutions: {
    directCompetitors: [],
    existingMethods: []
  },
  capabilities: [],
  competitors: {
    direct_competitors: [],
    niche_competitors: [],
    broader_competitors: []
  },
  isApproved: false,
  approvedBy: undefined
};