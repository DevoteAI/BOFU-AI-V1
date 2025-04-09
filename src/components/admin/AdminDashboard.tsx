import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { ProductAnalysis } from '../../types/product/types';
import { ResearchResult, getApprovedProducts, updateApprovedProductStatus, getResearchResultById } from '../../lib/research';
import { User } from '@supabase/supabase-js';
import { toast } from 'react-hot-toast';
import { Eye, CheckCircle, XCircle, Loader2, RefreshCw, UserCircle, ArrowLeft } from 'lucide-react';
import { ProductCard } from '../product/ProductCard';

interface AdminDashboardProps {
  onLogout: () => void;
}

// Interface for approved products
interface ApprovedProduct {
  id: string;
  research_result_id: string;
  product_index: number;
  product_name: string;
  product_description: string;
  company_name: string;
  approved_by: string;
  approved_at: string;
  reviewed_status: 'pending' | 'reviewed' | 'rejected';
  reviewer_id: string | null;
  reviewer_comments: string | null;
  reviewed_at: string | null;
  product_data: ProductAnalysis;
  created_at: string;
  updated_at: string;
}

// Interface for user profile
interface UserProfile {
  id: string;
  email: string;
  company_name: string;
  avatar_url?: string;
  created_at: string;
  updated_at: string;
}

// Simplified component - no complex grouping by approver
export function AdminDashboard({ onLogout }: AdminDashboardProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingApproved, setIsLoadingApproved] = useState(true);
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalResearches: 0,
    totalApproved: 0,
    pendingReview: 0,
  });
  const [approvedProducts, setApprovedProducts] = useState<ApprovedProduct[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<ApprovedProduct | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [refreshCounter, setRefreshCounter] = useState(0);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState<string | null>(null);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
  const [userProducts, setUserProducts] = useState<ApprovedProduct[]>([]);
  const [isEditMode, setIsEditMode] = useState(false);
  const [actionLoadingIndex, setActionLoadingIndex] = useState<number | null>(null);

  const refreshData = () => {
    console.log('[AdminDashboard] Manually refreshing data...');
    setRefreshCounter(prev => prev + 1);
  };

  const debugDatabase = async () => {
    console.log('[AdminDashboard] Debugging database tables...');
    try {
      // Directly test if we can query the user_profiles table instead of checking pg_tables
      console.log('[AdminDashboard] Testing database connection...');
      
      // Let's directly query the user_profiles table to see if it exists
      const { data: userProfilesData, error: userProfilesError } = await supabase
        .from('user_profiles')
        .select('*')
        .limit(1);
        
      if (userProfilesError) {
        console.error('[AdminDashboard] Error accessing user_profiles table:', userProfilesError);
        toast.error(`Database error: ${userProfilesError.message}`);
        
        // If we get a "relation does not exist" error, suggest running migrations
        if (userProfilesError.code === '42P01') {
          toast.error('The user_profiles table does not exist. Please run the database migrations.');
          console.log('[AdminDashboard] Migration needed. Follow these steps:');
          console.log('1. Go to the Supabase dashboard SQL Editor');
          console.log('2. Run the migration in supabase/migrations/20250615000000_separate_users_admins.sql');
          console.log('3. Run the migration in supabase_schema_update.sql');
        }
        return;
      }
      
      console.log('[AdminDashboard] Successfully accessed user_profiles table:', userProfilesData);
      
      // Check if we can access other required tables
      const tables = ['admin_profiles', 'research_results', 'approved_products'];
      let allTablesExist = true;
      
      for (const table of tables) {
        const { error } = await supabase.from(table).select('*').limit(1);
        if (error) {
          console.error(`[AdminDashboard] Error accessing ${table}:`, error);
          toast.error(`Table ${table} does not exist or is inaccessible`);
          allTablesExist = false;
        } else {
          console.log(`[AdminDashboard] Successfully accessed ${table}`);
        }
      }
      
      if (allTablesExist) {
        toast.success('All required database tables exist and are accessible!');
        // Refresh the data
        refreshData();
      }
    } catch (error) {
      console.error('[AdminDashboard] Debug error:', error);
      toast.error(`Debug error occurred: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const checkRLSPolicies = async () => {
    console.log('[AdminDashboard] Checking RLS policies...');
    try {
      toast.loading('Checking Supabase RLS policies...');
      
      // Test querying user_profiles with some debugging info
      const { data: userData, error: userError } = await supabase
        .from('user_profiles')
        .select('*')
        .limit(10);
        
      if (userError) {
        console.error('[AdminDashboard] Error accessing user_profiles:', userError);
        toast.error(`Policy error: ${userError.message}`);
      } else {
        console.log('[AdminDashboard] User profiles access successful:', userData);
        toast.success(`Successfully accessed user_profiles table. Found ${userData.length} records.`);
      }
      
      // Check if current user is admin
      const { data: { user } } = await supabase.auth.getUser();
      console.log('[AdminDashboard] Current user:', user);
      
      if (user) {
        const { data: adminData, error: adminError } = await supabase
          .from('admin_profiles')
          .select('*')
          .eq('id', user.id)
          .single();
          
        if (adminError && adminError.code !== 'PGRST116') {
          console.error('[AdminDashboard] Error checking admin status:', adminError);
        } else {
          console.log('[AdminDashboard] Admin check:', adminData ? 'User is admin' : 'User is not admin');
        }
      }
    } catch (error) {
      console.error('[AdminDashboard] RLS check error:', error);
      toast.error(`RLS check failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  useEffect(() => {
    // Fetch basic stats 
    const fetchStats = async () => {
      setIsLoading(true);
      try {
        const { count: userCount } = await supabase
          .from('user_profiles')  // Changed from 'profiles' to 'user_profiles'
          .select('*', { count: 'exact', head: true });

        const { count: researchCount } = await supabase
          .from('research_results')
          .select('*', { count: 'exact', head: true });
          
        const { count: approvedCount } = await supabase
          .from('approved_products')
          .select('*', { count: 'exact', head: true });
          
        const { count: pendingCount } = await supabase
          .from('approved_products')
          .select('*', { count: 'exact', head: true })
          .eq('reviewed_status', 'pending');

        setStats({
          totalUsers: userCount || 0,
          totalResearches: researchCount || 0,
          totalApproved: approvedCount || 0,
          pendingReview: pendingCount || 0,
        });
      } catch (error) {
        console.error('Error fetching admin stats:', error);
      } finally {
        setIsLoading(false);
      }
    };

    // Fetch approved products from the dedicated table
    const fetchApprovedProducts = async () => {
      setIsLoadingApproved(true);
      try {
        console.log('[AdminDashboard] Fetching approved products...');
        
        // Use the dedicated function to get approved products
        const approvedData = await getApprovedProducts();
        
        console.log(`[AdminDashboard] Fetched ${approvedData.length} approved products`);
        
        if (approvedData.length === 0) {
          console.log('[AdminDashboard] No approved products found');
          setApprovedProducts([]);
          return;
        }
        
        // Set the approved products directly
        setApprovedProducts(approvedData);
        
      } catch (error) {
        console.error('[AdminDashboard] Error fetching approved products:', error);
        toast.error('Failed to load approved products');
      } finally {
        setIsLoadingApproved(false);
      }
    };

    // Fetch all non-admin users
    const fetchUsers = async () => {
      try {
        console.log('[AdminDashboard] Fetching users from user_profiles table...');
        
        // Basic query without count first to check access
        const { data, error } = await supabase
          .from('user_profiles')
          .select('*');

        if (error) {
          console.error('[AdminDashboard] Error accessing user_profiles:', error);
          toast.error(`Database error: ${error.message}`);
          
          // Check if it's a permissions issue
          if (error.message.includes('permission') || error.code === '42501') {
            console.log('[AdminDashboard] This appears to be a permissions issue. Make sure your Supabase policies allow access to user_profiles.');
            toast.error('Permission denied. Check your Supabase RLS policies.');
          }
          return;
        }
        
        console.log('[AdminDashboard] Successfully fetched user_profiles:', data);
        console.log('[AdminDashboard] Users count:', data?.length || 0);
        
        // Set users only if we got data
        if (data && Array.isArray(data)) {
          setUsers(data);
        } else {
          console.error('[AdminDashboard] Unexpected data format:', data);
          setUsers([]);
        }
      } catch (error) {
        console.error('[AdminDashboard] Error fetching users:', error);
        toast.error(`Failed to load users: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    };

    fetchStats();
    fetchApprovedProducts();
    fetchUsers();
    
    // Set up a refresh interval (every 30 seconds)
    const refreshInterval = setInterval(() => {
      console.log('[AdminDashboard] Auto-refreshing data...');
      fetchApprovedProducts();
      fetchUsers();
    }, 30000);
    
    return () => {
      clearInterval(refreshInterval);
    };
  }, [refreshCounter]); // Dependency on refreshCounter to allow manual refresh

  const handleLogout = async () => {
    await supabase.auth.signOut();
    // Redirect to home page after logout
    window.location.href = '/';
    // Also call the onLogout prop to update parent component state
    onLogout();
  };

  // Open the product detail modal
  const handleViewDetails = (product: ApprovedProduct) => {
    setSelectedProduct(product);
    setIsDetailModalOpen(true);
  };

  // Close the detail modal
  const closeDetailModal = () => {
    // Refresh the data to ensure we have the latest version
    refreshData();
    setIsDetailModalOpen(false);
    setSelectedProduct(null);
  };
  
  // Handle marking a product as reviewed
  const handleMarkReviewed = async (productId: string) => {
    setIsUpdatingStatus(productId);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not logged in');
      
      await updateApprovedProductStatus(
        productId,
        'reviewed',
        user.id,
        'Approved by admin'
      );
      
      toast.success('Product marked as reviewed');
      
      // Refresh the data
      refreshData();
      
    } catch (error: any) {
      console.error('Error updating status:', error);
      toast.error(`Failed to update status: ${error.message}`);
    } finally {
      setIsUpdatingStatus(null);
    }
  };
  
  // Handle rejecting a product
  const handleRejectProduct = async (productId: string) => {
    setIsUpdatingStatus(productId);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not logged in');
      
      await updateApprovedProductStatus(
        productId,
        'rejected',
        user.id,
        'Rejected by admin'
      );
      
      toast.success('Product rejected');
      
      // Refresh the data
      refreshData();
      
    } catch (error: any) {
      console.error('Error updating status:', error);
      toast.error(`Failed to update status: ${error.message}`);
    } finally {
      setIsUpdatingStatus(null);
    }
  };

  // Handle selecting a user
  const handleSelectUser = async (user: UserProfile) => {
    setSelectedUser(user);
    setIsLoadingApproved(true);
    
    try {
      // Fetch approved products for the selected user
      const { data, error } = await supabase
        .from('approved_products')
        .select('*')
        .eq('approved_by', user.id)
        .order('approved_at', { ascending: false });

      if (error) throw error;
      setUserProducts(data || []);
    } catch (error) {
      console.error('Error fetching user products:', error);
      toast.error('Failed to load user products');
    } finally {
      setIsLoadingApproved(false);
    }
  };

  // Return to user list
  const handleBackToUsers = () => {
    setSelectedUser(null);
    setUserProducts([]);
    setIsEditMode(false);
  };

  // Product card handlers for editing
  const handleSaveProduct = async (product: ProductAnalysis, index: number) => {
    setActionLoadingIndex(index);
    try {
      const currentProduct = userProducts[index];
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not logged in');
      
      // Update the product data in the approved_products table
      const { error } = await supabase
        .from('approved_products')
        .update({
          product_data: product,
          updated_at: new Date().toISOString()
        })
        .eq('id', currentProduct.id);

      if (error) throw error;
      
      // Also update the product in the research_results table
      const researchResult = await getResearchResultById(currentProduct.research_result_id);
      if (researchResult) {
        const updatedData = [...researchResult.data];
        updatedData[currentProduct.product_index] = product;
        
        const { error: updateError } = await supabase
          .from('research_results')
          .update({
            data: updatedData,
            updated_at: new Date().toISOString()
          })
          .eq('id', currentProduct.research_result_id);
          
        if (updateError) throw updateError;
      }
      
      toast.success('Product updated successfully');
      
      // Update the local state
      const updatedProducts = [...userProducts];
      updatedProducts[index] = {
        ...currentProduct,
        product_data: product
      };
      setUserProducts(updatedProducts);
      
    } catch (error: any) {
      console.error('Error updating product:', error);
      toast.error(`Failed to update product: ${error.message}`);
    } finally {
      setActionLoadingIndex(null);
    }
  };

  const handleApproveProduct = async (product: ProductAnalysis, index: number) => {
    // Already approved, just save
    await handleSaveProduct(product, index);
  };

  const updateProductSection = (productIndex: number, section: keyof ProductAnalysis, value: any) => {
    const updatedProducts = [...userProducts];
    const currentProduct = updatedProducts[productIndex];
    
    // Update the section in the product_data
    currentProduct.product_data = {
      ...currentProduct.product_data,
      [section]: value
    };
    
    setUserProducts(updatedProducts);
  };

  const updateProduct = (index: number, updatedProduct: ProductAnalysis) => {
    const updatedProducts = [...userProducts];
    updatedProducts[index] = {
      ...updatedProducts[index],
      product_data: updatedProduct
    };
    setUserProducts(updatedProducts);
  };

  return (
    <div className="min-h-screen bg-secondary-900 text-white p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-2xl font-bold text-primary-400">Admin Dashboard</h1>
          <div className="flex space-x-3">
            <button
              onClick={refreshData}
              className="px-4 py-2 bg-primary-500/80 text-white rounded-md hover:bg-primary-400 transition-colors flex items-center gap-2"
            >
              <RefreshCw size={16} className={isLoadingApproved ? "animate-spin" : ""} />
              Refresh Data
            </button>
            <button
              onClick={handleLogout}
              className="px-4 py-2 bg-secondary-800 text-primary-400 rounded-md hover:bg-secondary-700 transition-colors"
            >
              Logout
            </button>
          </div>
        </div>

        {/* Stats Section */}
        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="animate-spin h-10 w-10 text-primary-400" />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-secondary-800 p-6 rounded-lg border-2 border-primary-500/20 shadow-glow">
              <h2 className="text-xl font-semibold text-primary-400 mb-4">User Statistics</h2>
              <div className="text-4xl font-bold text-white">{stats.totalUsers}</div>
              <p className="text-gray-400 mt-2">Total registered users</p>
            </div>
            
            <div className="bg-secondary-800 p-6 rounded-lg border-2 border-primary-500/20 shadow-glow">
              <h2 className="text-xl font-semibold text-primary-400 mb-4">Research Analytics</h2>
              <div className="text-4xl font-bold text-white">{stats.totalResearches}</div>
              <p className="text-gray-400 mt-2">Total research analyses</p>
            </div>
            
            <div className="bg-secondary-800 p-6 rounded-lg border-2 border-primary-500/20 shadow-glow">
              <h2 className="text-xl font-semibold text-primary-400 mb-4">Approved Products</h2>
              <div className="text-4xl font-bold text-white">{stats.totalApproved}</div>
              <p className="text-gray-400 mt-2">Total approved products</p>
            </div>
            
            <div className="bg-secondary-800 p-6 rounded-lg border-2 border-primary-500/20 shadow-glow">
              <h2 className="text-xl font-semibold text-primary-400 mb-4">Pending Review</h2>
              <div className="text-4xl font-bold text-white">{stats.pendingReview}</div>
              <p className="text-gray-400 mt-2">Products awaiting review</p>
            </div>
          </div>
        )}

        {/* Main Content Area - Show users or user products */}
        {selectedUser ? (
          // Selected User View with Products
          <div>
            <div className="flex justify-between items-center mb-6">
              <div className="flex items-center space-x-3">
                <button 
                  onClick={handleBackToUsers}
                  className="flex items-center space-x-2 text-primary-400 hover:text-primary-300"
                >
                  <ArrowLeft size={20} />
                  <span>Back to Users</span>
                </button>
                <h2 className="text-xl font-semibold">
                  {selectedUser.company_name || selectedUser.email}'s Products
                </h2>
              </div>
              <div className="flex space-x-3">
                <button
                  onClick={() => setIsEditMode(!isEditMode)}
                  className={`px-4 py-2 rounded-md transition-colors ${
                    isEditMode 
                      ? 'bg-primary-600 text-white hover:bg-primary-500' 
                      : 'bg-secondary-800 text-primary-400 hover:bg-secondary-700'
                  }`}
                >
                  {isEditMode ? 'Exit Edit Mode' : 'Enter Edit Mode'}
                </button>
              </div>
            </div>
          
          {isLoadingApproved ? (
              <div className="flex justify-center py-12">
                <Loader2 className="animate-spin h-10 w-10 text-primary-400" />
              </div>
            ) : userProducts.length === 0 ? (
              <div className="text-center py-12 bg-secondary-800 rounded-lg border border-secondary-700">
                <p className="text-gray-400">No approved products found for this user.</p>
            </div>
          ) : (
            <div className="space-y-6">
                {isEditMode ? (
                  // Edit Mode - Show Product Cards with editing capabilities
                  <div className="space-y-8">
                    {userProducts.map((product, index) => (
                      <ProductCard
                        key={product.id}
                        product={product.product_data}
                        index={index}
                        isActionLoading={actionLoadingIndex === index}
                        onSave={(updatedProduct) => handleSaveProduct(updatedProduct, index)}
                        onApprove={(updatedProduct) => handleApproveProduct(updatedProduct, index)}
                        onUpdateSection={(productIndex, section, value) => updateProductSection(productIndex, section, value)}
                        updateProduct={(updatedProduct) => {
                          const productIndex = userProducts.findIndex(p => p.id === selectedProduct!.id);
                          if (productIndex !== -1 && selectedProduct) {
                            updateProduct(productIndex, updatedProduct);
                            
                            // Also update the selectedProduct to keep the modal in sync
                            setSelectedProduct({
                              ...selectedProduct,
                              product_data: updatedProduct
                            });
                          }
                        }}
                        isMultipleProducts={userProducts.length > 1}
                      />
                    ))}
                  </div>
                ) : (
                  // View Mode - Show Product List
                  <div className="grid gap-4">
                    {userProducts.map((product) => (
                  <div 
                    key={product.id}
                        className="bg-secondary-800 p-4 rounded-lg border border-secondary-700 flex justify-between items-center hover:bg-secondary-750 transition-colors"
                      >
                        <div>
                          <h3 className="font-semibold text-white">{product.product_name}</h3>
                          <p className="text-sm text-gray-400 mt-1 line-clamp-1">{product.product_description}</p>
                          <div className="flex items-center mt-2">
                            <span className={`text-xs px-2 py-1 rounded-full ${
                              product.reviewed_status === 'reviewed' 
                                ? 'bg-green-900/30 text-green-400' 
                                : product.reviewed_status === 'rejected'
                                ? 'bg-red-900/30 text-red-400'
                                : 'bg-yellow-900/30 text-yellow-400'
                            }`}>
                              {product.reviewed_status === 'reviewed' 
                                ? 'Reviewed' 
                                : product.reviewed_status === 'rejected'
                                ? 'Rejected'
                                : 'Pending'}
                            </span>
                            <span className="text-xs text-gray-500 ml-3">
                              {new Date(product.approved_at).toLocaleDateString()}
                            </span>
                          </div>
                      </div>
                        <div className="flex space-x-2">
                      <button
                        onClick={() => handleViewDetails(product)}
                            className="p-2 bg-secondary-700 rounded-full hover:bg-secondary-600 transition-colors"
                            title="View Details"
                      >
                            <Eye size={16} className="text-primary-400" />
                      </button>
                          {product.reviewed_status === 'pending' && (
                            <>
                      <button
                        onClick={() => handleMarkReviewed(product.id)}
                        disabled={isUpdatingStatus === product.id}
                                className="p-2 bg-green-900/40 rounded-full hover:bg-green-800/60 transition-colors"
                                title="Mark as Reviewed"
                      >
                        {isUpdatingStatus === product.id ? (
                                  <Loader2 size={16} className="text-green-400 animate-spin" />
                        ) : (
                                  <CheckCircle size={16} className="text-green-400" />
                        )}
                      </button>
                      <button
                        onClick={() => handleRejectProduct(product.id)}
                        disabled={isUpdatingStatus === product.id}
                                className="p-2 bg-red-900/40 rounded-full hover:bg-red-800/60 transition-colors"
                                title="Reject"
                              >
                                <XCircle size={16} className="text-red-400" />
                              </button>
                            </>
                          )}
                    </div>
                  </div>
                ))}
            </div>
          )}
        </div>
            )}
          </div>
        ) : (
          // User List View
          <div>
            <h2 className="text-xl font-semibold mb-6">Registered Users</h2>
            {users.length === 0 ? (
              <div className="text-center py-12 bg-secondary-800 rounded-lg border border-secondary-700">
                <p className="text-gray-400">No registered users found.</p>
            </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {users.map((user) => (
                  <div 
                    key={user.id}
                    onClick={() => handleSelectUser(user)}
                    className="bg-secondary-800 p-6 rounded-lg border-2 border-primary-500/20 shadow-glow hover:shadow-glow-strong cursor-pointer transition-all"
                  >
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 rounded-full bg-primary-500/20 flex items-center justify-center">
                        {user.avatar_url ? (
                          <img 
                            src={user.avatar_url} 
                            alt={user.company_name || user.email} 
                            className="w-12 h-12 rounded-full"
                          />
                        ) : (
                          <UserCircle size={24} className="text-primary-400" />
                        )}
                      </div>
                      <div>
                        <h3 className="font-semibold text-white">{user.company_name || 'Company not specified'}</h3>
                        <p className="text-sm text-gray-400">{user.email}</p>
                        <p className="text-xs text-gray-500 mt-1">Joined {new Date(user.created_at).toLocaleDateString()}</p>
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          )}
        </div>
        )}

        {/* Product Detail Modal */}
        {isDetailModalOpen && selectedProduct && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-auto">
            <div className="bg-secondary-800/90 rounded-xl w-full max-w-5xl max-h-[90vh] overflow-y-auto mb-8">
              <div className="sticky top-0 bg-secondary-800 p-6 border-b border-secondary-700 z-10 flex justify-between items-center">
                <h2 className="text-xl font-bold text-primary-400">{selectedProduct!.product_name}</h2>
                <button 
                  onClick={closeDetailModal}
                  className="text-gray-400 hover:text-white"
                >
                  ✕
                </button>
              </div>
              <div className="p-6">
                {/* Full detailed product card with all editable sections */}
                <ProductCard
                  product={selectedProduct!.product_data}
                  index={0}
                  isActionLoading={false}
                  onSave={handleSaveProduct}
                  onApprove={handleApproveProduct}
                  onUpdateSection={updateProductSection}
                  updateProduct={(updatedProduct) => {
                    // Find the product index
                    const index = userProducts.findIndex(p => p.id === selectedProduct!.id);
                    if (index !== -1) {
                      updateProduct(index, updatedProduct);
                    }
                  }}
                  isMultipleProducts={false}
                />
                
                <div className="flex justify-end mt-8 space-x-3">
                  {selectedProduct!.reviewed_status === 'pending' && (
                    <>
                      <button 
                        onClick={() => {
                          handleMarkReviewed(selectedProduct!.id);
                          closeDetailModal();
                        }}
                        disabled={isUpdatingStatus === selectedProduct!.id}
                        className="px-4 py-2 bg-green-600/80 text-white rounded-md hover:bg-green-500 transition-colors flex items-center gap-2"
                      >
                        {isUpdatingStatus === selectedProduct!.id ? (
                          <Loader2 size={16} className="animate-spin" />
                        ) : (
                          <CheckCircle size={16} />
                        )}
                        Approve
                      </button>
                      <button 
                        onClick={() => {
                          handleRejectProduct(selectedProduct!.id);
                          closeDetailModal();
                        }}
                        disabled={isUpdatingStatus === selectedProduct!.id}
                        className="px-4 py-2 bg-red-600/80 text-white rounded-md hover:bg-red-500 transition-colors flex items-center gap-2"
                      >
                        <XCircle size={16} />
                        Reject
                      </button>
                    </>
                  )}
                  <button 
                    onClick={closeDetailModal}
                    className="px-4 py-2 bg-secondary-700 text-gray-300 rounded-md hover:bg-secondary-600 transition-colors"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}