import React, { useState, Fragment } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { supabase } from '../../lib/supabase';
import toast from 'react-hot-toast';

interface AdminAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdminAuthenticated: () => void;
}

export function AdminAuthModal({ isOpen, onClose, onAdminAuthenticated }: AdminAuthModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Check if credentials match the admin credentials
      if (formData.email === 'lashay@bofu.ai' && formData.password === 'ProTECTEDStrATEgists!!!1') {
        // Sign in with Supabase
        const { error } = await supabase.auth.signInWithPassword({
          email: formData.email,
          password: formData.password,
        });

        if (error) {
          // If the user doesn't exist, create an account (only for the admin)
          if (error.message.includes('Invalid login credentials')) {
            const { error: signUpError } = await supabase.auth.signUp({
              email: formData.email,
              password: formData.password,
              options: {
                data: { 
                  role: 'admin',
                  is_admin: true
                }
              }
            });

            if (signUpError) {
              throw signUpError;
            }

            toast.success('Admin account created and signed in!');
          } else {
            throw error;
          }
        }

        // Add admin role to user metadata (if not already present)
        const { error: updateError } = await supabase.auth.updateUser({
          data: { 
            role: 'admin',
            is_admin: true
          }
        });

        if (updateError) {
          console.error('Error updating admin role:', updateError);
        }

        // Success - redirect to admin dashboard
        toast.success('Admin authenticated!');
        onAdminAuthenticated();
        onClose();
      } else {
        // If credentials don't match, show error
        toast.error('Invalid admin credentials');
      }
    } catch (error) {
      console.error('Admin auth error:', error);
      toast.error(error instanceof Error ? error.message : 'Authentication failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4 text-center">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-secondary-900 border-2 border-primary-500/20 p-6 text-left align-middle shadow-glow transition-all">
                <Dialog.Title
                  as="h3"
                  className="text-lg font-medium leading-6 text-primary-400"
                >
                  Admin Login
                </Dialog.Title>
                <div className="mt-2">
                  <p className="text-sm text-gray-400">
                    Please enter your admin credentials to access the dashboard.
                  </p>
                </div>

                <div className="mt-4">
                  <form onSubmit={handleSubmit}>
                    <div className="space-y-4">
                      <div>
                        <label htmlFor="admin-email" className="block text-sm font-medium text-gray-400">
                          Email
                        </label>
                        <input
                          type="email"
                          id="admin-email"
                          name="email"
                          value={formData.email}
                          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                          required
                          className="mt-1 block w-full rounded-md bg-secondary-800 border-2 border-primary-500/20 shadow-sm focus:border-primary-500 focus:ring focus:ring-primary-500/30 text-white py-2 px-3"
                        />
                      </div>
                      
                      <div>
                        <label htmlFor="admin-password" className="block text-sm font-medium text-gray-400">
                          Password
                        </label>
                        <input
                          type="password"
                          id="admin-password"
                          name="password"
                          value={formData.password}
                          onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                          required
                          className="mt-1 block w-full rounded-md bg-secondary-800 border-2 border-primary-500/20 shadow-sm focus:border-primary-500 focus:ring focus:ring-primary-500/30 text-white py-2 px-3"
                        />
                      </div>
                      
                      <div>
                        <button
                          type="submit"
                          disabled={isLoading}
                          className="w-full inline-flex justify-center items-center rounded-md border-2 border-primary-500/20 shadow-glow bg-secondary-800 py-2 px-4 text-sm font-medium text-primary-400 hover:bg-secondary-700 hover:shadow-glow-strong hover:border-primary-500/40 transition-all"
                        >
                          {isLoading ? (
                            <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-primary-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                          ) : 'Login as Admin'}
                        </button>
                      </div>
                    </div>
                  </form>
                  
                  <div className="mt-4 text-center">
                    <button
                      type="button"
                      onClick={onClose}
                      className="text-sm text-primary-400 hover:text-primary-300"
                    >
                      Back to regular login
                    </button>
                  </div>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
} 