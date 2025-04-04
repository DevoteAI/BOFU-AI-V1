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
}

export function MainHeader({ 
  showHistory, 
  setShowHistory, 
  onStartNew, 
  user: propUser,
  forceHistoryView 
}: MainHeaderProps) {
  const [showAuthModal, setShowAuthModal] = React.useState(false);
  const [user, setUser] = React.useState(propUser);

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

  const handleSignOut = () => {
    // Implement sign out logic
    console.log("Signing out");
  };

  return (
    <header className="sticky top-0 z-50 backdrop-blur-xl bg-secondary-900/80 border-b border-primary-500/20">
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex">
            <div className="flex-shrink-0 flex items-center">
              <Link to="/" className="flex items-center gap-2">
                <Logo />
                <span className="text-xl font-bold text-primary-400">BOFU AI</span>
              </Link>
            </div>
          </div>
          <div className="flex items-center gap-4">
            {showHistory !== undefined && setShowHistory && (
              <button
                onClick={() => {
                  console.log("History button clicked in MainHeader");
                  setShowHistory(!showHistory);
                }}
                className={`px-4 py-2 rounded-lg transition-all flex items-center gap-2
                  ${showHistory 
                    ? 'bg-secondary-800 text-primary-400 border-2 border-primary-500/20 shadow-glow hover:shadow-glow-strong hover:border-primary-500/40' 
                    : 'text-gray-400 hover:text-primary-400 hover:bg-secondary-800'
                  }`}
              >
                <ClockIcon className="h-5 w-5" />
                History
              </button>
            )}
            {user ? (
              <Menu as="div" className="relative">
                <Menu.Button className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-secondary-800 text-gray-400 hover:text-primary-400">
                  <UserCircleIcon className="h-6 w-6" />
                  <span>{user.email}</span>
                </Menu.Button>
                <Transition
                  as={Fragment}
                  enter="transition ease-out duration-100"
                  enterFrom="transform opacity-0 scale-95"
                  enterTo="transform opacity-100 scale-100"
                  leave="transition ease-in duration-75"
                  leaveFrom="transform opacity-100 scale-100"
                  leaveTo="transform opacity-0 scale-95"
                >
                  <Menu.Items className="absolute right-0 mt-2 w-48 origin-top-right rounded-lg bg-secondary-800 border-2 border-primary-500/20 shadow-glow">
                    <div className="py-1">
                      <Menu.Item>
                        {({ active }: { active: boolean }) => (
                          <button
                            onClick={handleSignOut}
                            className={`${
                              active ? 'bg-secondary-700 text-primary-400' : 'text-gray-400'
                            } group flex w-full items-center px-4 py-2`}
                          >
                            Sign Out
                          </button>
                        )}
                      </Menu.Item>
                    </div>
                  </Menu.Items>
                </Transition>
              </Menu>
            ) : (
              <button
                onClick={onStartNew}
                className="px-4 py-2 bg-secondary-800 border-2 border-primary-500/20 text-primary-400 rounded-lg hover:bg-secondary-700 
                  transition-all shadow-glow hover:shadow-glow-strong hover:border-primary-500/40"
              >
                Sign In
              </button>
            )}
          </div>
        </div>
      </nav>
    </header>
  );
}