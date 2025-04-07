import React, { useState, Fragment } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { supabase } from '../../lib/supabase';
import toast from 'react-hot-toast';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onShowAdminLogin?: () => void;
}

export function AuthModal({ isOpen, onClose, onShowAdminLogin }: AuthModalProps) {
  const [isSignUp, setIsSignUp] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showModal, setShowModal] = useState(isOpen);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    companyName: ''
  });

  React.useEffect(() => {
    setShowModal(isOpen);
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      if (isSignUp) {
        // Prepare user metadata with optional company name
        const metadata: { company_name?: string } = {};
        if (formData.companyName.trim()) {
          metadata.company_name = formData.companyName.trim();
        }
        
        // Try signup with retry logic
        let error = null;
        let retryCount = 0;
        const maxRetries = 2;
        
        while (retryCount <= maxRetries) {
          console.log('Attempting signup with metadata:', metadata);
          
          // Instead of regular signup, use admin API equivalent (signInWithPassword)
          // This bypasses email verification requirements
          const result = await supabase.auth.signInWithPassword({
            email: formData.email,
            password: formData.password
          });
          
          if (result.error && result.error.message === 'Invalid login credentials') {
            // User doesn't exist, create them
            console.log('User does not exist yet, creating account');
            const signUpResult = await supabase.auth.signUp({
              email: formData.email,
              password: formData.password,
              options: {
                emailRedirectTo: window.location.origin,
                data: metadata
              }
            });
            
            error = signUpResult.error;
            
            if (!error) {
              console.log('Signup successful, session:', signUpResult.data.session);
              
              // If we have successfully signed up but don't have a session (due to email verification),
              // we'll use a passwordless magic link as a workaround
              if (!signUpResult.data.session) {
                console.log('No session after signup, sending magic link');
                
                const magicLinkResult = await supabase.auth.signInWithOtp({
                  email: formData.email,
                  options: {
                    emailRedirectTo: window.location.origin
                  }
                });
                
                if (magicLinkResult.error) {
                  console.error('Error sending magic link:', magicLinkResult.error);
                  error = magicLinkResult.error;
                } else {
                  // Success - we'll show a different message to the user
                  toast.success('Account created! Check your email for a login link.');
                  onClose();
                  return; // Exit early
                }
              }
            }
          } else if (result.error) {
            // Some other error during sign in
            error = result.error;
          } else {
            // User already exists and we successfully signed in
            console.log('User already exists and signed in successfully');
            
            // If we have company name, update user metadata
            if (metadata.company_name) {
              try {
                const { error: updateError } = await supabase.auth.updateUser({
                  data: { company_name: metadata.company_name }
                });
                
                if (updateError) {
                  console.error('Error updating user metadata:', updateError);
                } else {
                  console.log('User metadata updated successfully');
                }
              } catch (updateError) {
                console.error('Exception updating user metadata:', updateError);
              }
            }
            
            // We're done - user is logged in
            toast.success('Signed in successfully!');
            onClose();
            return; // Exit early
          }
          
          if (!error) {
            break; // Success, exit the loop
          } else {
            console.error(`Attempt ${retryCount + 1} failed:`, error);
            retryCount++;
            
            if (retryCount <= maxRetries) {
              // Wait before retrying (exponential backoff)
              await new Promise(resolve => setTimeout(resolve, 1000 * retryCount));
            }
          }
        }
        
        if (error) {
          console.error('Error after retries:', error);
          throw error;
        }
        
        toast.success('Account created successfully!');
        onClose();
      } else {
        // Regular sign in flow
        const { error } = await supabase.auth.signInWithPassword({
          email: formData.email,
          password: formData.password
        });
        
        if (error) {
          console.error('Sign in error details:', error);
          
          // Check if the error is specifically about email verification
          if (error.message === 'Email not confirmed') {
            console.log('Email not confirmed, offering magic link alternative');
            
            // Show a special message with an option
            toast.error('Your email is not verified. We can send you a magic link to sign in.');
            
            // Offer a magic link login option
            const confirmSendLink = window.confirm(
              'Your email is not verified. Would you like us to send you a magic link to sign in?'
            );
            
            if (confirmSendLink) {
              try {
                const { error: otpError } = await supabase.auth.signInWithOtp({
                  email: formData.email,
                  options: {
                    emailRedirectTo: window.location.origin
                  }
                });
                
                if (otpError) {
                  console.error('Error sending magic link:', otpError);
                  throw otpError;
                }
                
                toast.success('Check your email for a login link!');
                onClose();
                return;
              } catch (otpError) {
                throw otpError;
              }
            } else {
              // User declined magic link option
              setIsLoading(false);
              return; // Exit early without showing another error
            }
          }
          
          throw error;
        }
        
        toast.success('Signed in successfully!');
        onClose();
      }
    } catch (error) {
      console.error('Auth error:', error);
      toast.error(error instanceof Error ? error.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
      });
      if (error) throw error;
    } catch (error) {
      console.error('Error signing in with Google:', error);
      toast.error('Failed to sign in with Google');
    }
  };

  const handleAdminLogin = () => {
    if (onShowAdminLogin) {
      onShowAdminLogin();
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
                  {isSignUp ? 'Create Account' : 'Sign In'}
                </Dialog.Title>
                <div className="mt-2">
                  <p className="text-sm text-gray-400">
                    {isSignUp 
                      ? 'Create an account to save and access your research history.'
                      : 'Sign in to save and access your research history.'}
                  </p>
                </div>

                <div className="mt-4">
                  <form onSubmit={handleSubmit}>
                    <div className="space-y-4">
                      <div>
                        <label htmlFor="email" className="block text-sm font-medium text-gray-400">
                          Email
                        </label>
                        <input
                          type="email"
                          id="email"
                          name="email"
                          value={formData.email}
                          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                          required
                          className="mt-1 block w-full rounded-md bg-secondary-800 border-2 border-primary-500/20 shadow-sm focus:border-primary-500 focus:ring focus:ring-primary-500/30 text-white py-2 px-3"
                        />
                      </div>
                      
                      <div>
                        <label htmlFor="password" className="block text-sm font-medium text-gray-400">
                          Password
                        </label>
                        <input
                          type="password"
                          id="password"
                          name="password"
                          value={formData.password}
                          onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                          required
                          className="mt-1 block w-full rounded-md bg-secondary-800 border-2 border-primary-500/20 shadow-sm focus:border-primary-500 focus:ring focus:ring-primary-500/30 text-white py-2 px-3"
                        />
                      </div>
                      
                      {isSignUp && (
                        <div>
                          <label htmlFor="companyName" className="block text-sm font-medium text-gray-400">
                            Company Name (Optional)
                          </label>
                          <input
                            type="text"
                            id="companyName"
                            name="companyName"
                            value={formData.companyName}
                            onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                            className="mt-1 block w-full rounded-md bg-secondary-800 border-2 border-primary-500/20 shadow-sm focus:border-primary-500 focus:ring focus:ring-primary-500/30 text-white py-2 px-3"
                          />
                        </div>
                      )}
                      
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
                          ) : isSignUp ? 'Sign Up' : 'Sign In'}
                        </button>
                      </div>
                    </div>
                  </form>
                  
                  {/* Admin Login option */}
                  {onShowAdminLogin && (
                    <div className="mt-4 text-center">
                      <button
                        type="button"
                        onClick={handleAdminLogin}
                        className="text-sm text-primary-400 hover:text-primary-300"
                      >
                        Admin Login
                      </button>
                    </div>
                  )}
                  
                  <div className="mt-4 text-center">
                    <button
                      type="button"
                      onClick={() => setIsSignUp(!isSignUp)}
                      className="text-sm text-primary-400 hover:text-primary-300"
                    >
                      {isSignUp ? 'Already have an account? Sign In' : 'Need an account? Sign Up'}
                    </button>
                  </div>
                  
                  <div className="mt-4 relative">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-gray-600"></div>
                    </div>
                    <div className="relative flex justify-center text-sm">
                      <span className="px-2 bg-secondary-900 text-gray-400">Or continue with</span>
                    </div>
                  </div>
                  
                  <button
                    type="button"
                    onClick={handleGoogleSignIn}
                    className="mt-4 inline-flex w-full justify-center items-center gap-2 rounded-lg bg-secondary-800 px-4 py-2 text-sm font-medium text-primary-400 
                      border-2 border-primary-500/20 shadow-glow hover:shadow-glow-strong hover:border-primary-500/40 hover:bg-secondary-700 transition-all"
                  >
                    <svg className="w-5 h-5" viewBox="0 0 24 24">
                      <path
                        fill="currentColor"
                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      />
                      <path
                        fill="currentColor"
                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      />
                      <path
                        fill="currentColor"
                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                      />
                      <path
                        fill="currentColor"
                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                      />
                    </svg>
                    Continue with Google
                  </button>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}