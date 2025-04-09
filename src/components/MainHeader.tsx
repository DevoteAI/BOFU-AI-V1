import React, { Fragment, useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Brain, LogIn, History, Home, Book } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { AuthModal } from './auth/AuthModal';
import { UserMenu } from './auth/UserMenu';
import { Link } from 'react-router-dom';
import { Menu, Transition } from '@headlessui/react';
import { UserCircleIcon, ClockIcon } from '@heroicons/react/24/outline';

// Logo SVG component
const Logo = () => (
  <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect width="32" height="32" rx="8" fill="#FFE600" />
    <path d="M18.5 5L7 17.5H14L12.5 27L24 14.5H17L18.5 5Z" fill="#0A0A0A" stroke="#0A0A0A" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

interface MainHeaderProps {
  showHistory?: boolean;
  setShowHistory?: (value: boolean) => void;
  onStartNew?: () => void;
  user?: any;
  forceHistoryView?: () => void;
  onShowAuthModal?: () => void;
}

export function MainHeader({ 
  showHistory, 
  setShowHistory, 
  onStartNew, 
  user: propUser,
  forceHistoryView,
  onShowAuthModal
}: MainHeaderProps) {
  const [showAuthModal, setShowAuthModal] = React.useState(false);
  const [user, setUser] = React.useState(propUser);

  // Helper function to get display name
  const getDisplayName = (userData: any) => {
    // First check user_metadata.company_name
    if (userData?.user_metadata?.company_name) {
      return userData.user_metadata.company_name;
    }
    // If no company_name in user_metadata, check app_metadata.company_name (used in some Supabase setups)
    if (userData?.app_metadata?.company_name) {
      return userData.app_metadata.company_name;
    }
    // Fallback to email
    return userData?.email || 'User';
  };

  React.useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleSignOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      console.log("Signed out successfully");
      // Force a page refresh for consistent behavior across the app
      window.location.href = '/';
      // Also call other necessary state updates
      if (onShowAuthModal) {
        onShowAuthModal();
      }
      if (setShowHistory) {
        setShowHistory(false);
      }
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  return (
    <header className="sticky top-0 z-50 backdrop-blur-xl bg-gradient-to-r from-secondary-900/95 to-secondary-800/95 border-b border-primary-500/30 shadow-lg">
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex">
            <motion.div 
              className="flex-shrink-0 flex items-center"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.4 }}
            >
              <Link to="/" className="flex items-center gap-3 group">
                <motion.div
                  whileHover={{ rotate: 15, scale: 1.1 }}
                  transition={{ type: "spring", stiffness: 300 }}
                >
                  <Logo />
                </motion.div>
                <span className="text-xl font-bold bg-gradient-to-r from-yellow-400 to-primary-400 bg-clip-text text-transparent group-hover:from-yellow-300 group-hover:to-primary-300 transition-all">BOFU AI</span>
              </Link>
            </motion.div>
          </div>
          <div className="flex items-center gap-4">
            {showHistory !== undefined && setShowHistory && (
              <motion.button
                onClick={() => {
                  console.log("History button clicked in MainHeader");
                  setShowHistory(!showHistory);
                }}
                className={`px-4 py-2 rounded-lg transition-all flex items-center gap-2
                  ${showHistory 
                    ? 'bg-gradient-to-r from-secondary-800 to-secondary-700 text-primary-300 border border-primary-500/30 shadow-glow hover:shadow-glow-strong' 
                    : 'text-gray-300 hover:text-primary-300 hover:bg-secondary-800/70'
                  }`}
                whileHover={{ y: -1 }}
                whileTap={{ y: 1 }}
              >
                <ClockIcon className="h-5 w-5" />
                History
              </motion.button>
            )}
            {user ? (
              <Menu as="div" className="relative">
                <Menu.Button className="flex items-center gap-2 px-4 py-2 rounded-lg hover:bg-secondary-800/70 text-gray-300 hover:text-primary-300 border border-transparent hover:border-primary-500/20 transition-all">
                  <UserCircleIcon className="h-6 w-6" />
                  <span className="max-w-[150px] truncate">
                    {getDisplayName(user)}
                  </span>
                </Menu.Button>
                <Transition
                  as={Fragment}
                  enter="transition ease-out duration-200"
                  enterFrom="transform opacity-0 scale-95"
                  enterTo="transform opacity-100 scale-100"
                  leave="transition ease-in duration-150"
                  leaveFrom="transform opacity-100 scale-100"
                  leaveTo="transform opacity-0 scale-95"
                >
                  <Menu.Items className="absolute right-0 mt-2 w-48 origin-top-right rounded-lg bg-gradient-to-b from-secondary-800 to-secondary-700 border border-primary-500/30 shadow-glow overflow-hidden">
                    <div className="py-1">
                      <Menu.Item>
                        {({ active }: { active: boolean }) => (
                          <button
                            onClick={handleSignOut}
                            className={`${
                              active ? 'bg-secondary-600/30 text-primary-300' : 'text-gray-300'
                            } group flex w-full items-center gap-2 px-4 py-3 text-sm transition-colors`}
                          >
                            <LogIn size={16} className="opacity-70" />
                            Sign Out
                          </button>
                        )}
                      </Menu.Item>
                    </div>
                  </Menu.Items>
                </Transition>
              </Menu>
            ) : (
              <motion.button
                onClick={() => onShowAuthModal ? onShowAuthModal() : setShowAuthModal(true)}
                className="px-5 py-2 bg-gradient-to-r from-primary-500/80 to-yellow-500/80 text-secondary-900 font-medium rounded-lg 
                  transition-all shadow-md hover:shadow-glow-strong hover:from-primary-500 hover:to-yellow-500"
                whileHover={{ y: -1, scale: 1.02 }}
                whileTap={{ y: 1, scale: 0.98 }}
              >
                Sign In
              </motion.button>
            )}
          </div>
        </div>
      </nav>
      <AuthModal isOpen={showAuthModal} onClose={() => setShowAuthModal(false)} />
    </header>
  );
}