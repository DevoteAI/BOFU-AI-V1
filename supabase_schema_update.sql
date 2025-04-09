-- Update SQL schema - simplified for the current approach

-- Since we're storing isApproved inside the JSONB data array, we don't need
-- separate columns for is_approved and approved_by at the table level

-- Optional: Create an index to help with filtering approved items
-- This helps PostgreSQL find products with isApproved=true inside the JSONB data array
CREATE INDEX idx_research_results_approved_products ON public.research_results 
USING GIN ((data));

-- Optional: If you plan to query research_results for a specific user's approved products often,
-- you might want to add this index too
CREATE INDEX idx_research_results_user_id ON public.research_results (user_id); 

-- Create a dedicated table for approved products that will be shown in the admin dashboard
CREATE TABLE public.approved_products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  research_result_id UUID NOT NULL REFERENCES public.research_results(id) ON DELETE CASCADE,
  product_index INTEGER NOT NULL, -- Index of the product in the research_results data array
  product_name TEXT NOT NULL,
  product_description TEXT,
  company_name TEXT,
  approved_by UUID REFERENCES auth.users(id),
  approved_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  reviewed_status TEXT DEFAULT 'pending', -- 'pending', 'reviewed', 'rejected'
  reviewer_id UUID REFERENCES auth.users(id),
  reviewer_comments TEXT,
  reviewed_at TIMESTAMP WITH TIME ZONE,
  product_data JSONB NOT NULL, -- Store the complete product data
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create indexes for the approved_products table
CREATE INDEX idx_approved_products_research_result_id ON public.approved_products(research_result_id);
CREATE INDEX idx_approved_products_approved_by ON public.approved_products(approved_by);
CREATE INDEX idx_approved_products_reviewed_status ON public.approved_products(reviewed_status);

-- Create a trigger to update the updated_at column
CREATE OR REPLACE FUNCTION update_approved_products_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_approved_products_updated_at
BEFORE UPDATE ON public.approved_products
FOR EACH ROW
EXECUTE FUNCTION update_approved_products_updated_at(); 