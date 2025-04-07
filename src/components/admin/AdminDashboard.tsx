import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';

interface AdminDashboardProps {
  onLogout: () => void;
}

export function AdminDashboard({ onLogout }: AdminDashboardProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalResearches: 0,
  });

  useEffect(() => {
    const fetchStats = async () => {
      setIsLoading(true);
      try {
        // In a real implementation, you would fetch statistics from Supabase
        // This is a placeholder for demonstration purposes
        const { count: userCount } = await supabase
          .from('profiles')
          .select('*', { count: 'exact', head: true });

        const { count: researchCount } = await supabase
          .from('research_results')
          .select('*', { count: 'exact', head: true });

        setStats({
          totalUsers: userCount || 0,
          totalResearches: researchCount || 0,
        });
      } catch (error) {
        console.error('Error fetching admin stats:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchStats();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    onLogout();
  };

  return (
    <div className="min-h-screen bg-secondary-900 text-white p-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-2xl font-bold text-primary-400">Admin Dashboard</h1>
          <button
            onClick={handleLogout}
            className="px-4 py-2 bg-secondary-800 text-primary-400 rounded-md hover:bg-secondary-700 transition-colors"
          >
            Logout
          </button>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-12">
            <svg className="animate-spin h-10 w-10 text-primary-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
          </div>
        )}

        {/* Placeholder for more admin features */}
        <div className="mt-8 bg-secondary-800 p-6 rounded-lg border-2 border-primary-500/20 shadow-glow">
          <h2 className="text-xl font-semibold text-primary-400 mb-4">Admin Controls</h2>
          <p className="text-gray-400">This section will contain additional admin controls and features.</p>
        </div>
      </div>
    </div>
  );
} 