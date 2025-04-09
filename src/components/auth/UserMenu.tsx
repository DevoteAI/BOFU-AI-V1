import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { LogOut, Settings, User as UserIcon } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import toast from 'react-hot-toast';

interface UserMenuProps {
  user: {
    email: string;
    user_metadata: {
      company_name?: string;
      avatar_url?: string;
    };
  };
}

export function UserMenu({ user }: UserMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  
  // Helper function to get display name
  const getDisplayName = () => {
    // First check user_metadata.company_name
    if (user?.user_metadata?.company_name) {
      return user.user_metadata.company_name;
    }
    // Fallback to email
    return user?.email || 'User';
  };

  const handleSignOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      toast.success('Signed out successfully');
      // Use location.assign for a hard redirect that forces a complete navigation
      window.location.assign('/');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to sign out');
    }
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 p-2 rounded-lg hover:bg-gray-100 transition-colors"
      >
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary-500 to-secondary-500 flex items-center justify-center text-white">
          {user.user_metadata.avatar_url ? (
            <img
              src={user.user_metadata.avatar_url}
              alt={getDisplayName()}
              className="w-full h-full rounded-full object-cover"
            />
          ) : (
            <UserIcon size={16} />
          )}
        </div>
        <span className="text-sm font-medium">
          {getDisplayName()}
        </span>
      </button>

      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-30"
              onClick={() => setIsOpen(false)}
            />
            
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: -20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -20 }}
              className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden z-40"
            >
              <div className="p-2 space-y-1">
                <button
                  onClick={() => {
                    setIsOpen(false);
                    // Add settings handler
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <Settings size={16} />
                  Settings
                </button>
                <button
                  onClick={() => {
                    setIsOpen(false);
                    handleSignOut();
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                >
                  <LogOut size={16} />
                  Sign Out
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}