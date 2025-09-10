import React, { useState, useEffect } from 'react';
import type { View, User } from '../types';
import { GearIcon } from './icons/GearIcon';
import { UserIcon } from './icons/UserIcon';

interface HeaderProps {
  user: User | null;
  onLogin: (user: User) => void;
  onLogout: () => void;
  onNavigate: (view: View) => void;
  currentView: View;
  isLoginOpen: boolean;
  setIsLoginOpen: (isOpen: boolean) => void;
}

export const Header: React.FC<HeaderProps> = ({ user, onLogin, onLogout, onNavigate, currentView, isLoginOpen, setIsLoginOpen }) => {
  const [formState, setFormState] = useState({ firstName: '', lastName: '', email: '' });

  useEffect(() => {
    // Reset form when modal closes
    if (!isLoginOpen) {
      setFormState({ firstName: '', lastName: '', email: '' });
    }
  }, [isLoginOpen]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormState(prev => ({ ...prev, [e.target.name]: e.target.value }));
  }

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formState.email && formState.firstName && formState.lastName) {
      onLogin({
        firstName: formState.firstName,
        lastName: formState.lastName,
        email: formState.email,
      });
    }
  };

  const NavButton: React.FC<{ view: View, children: React.ReactNode }> = ({ view, children }) => (
    <button
      onClick={() => onNavigate(view)}
      className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
        currentView === view
          ? 'bg-primary text-background'
          : 'text-textPrimary/75 hover:bg-divider hover:text-textPrimary'
      }`}
    >
      {children}
    </button>
  );

  return (
    <header className="bg-secondary/50 backdrop-blur-sm border-b border-divider sticky top-0 z-10">
      <nav className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center space-x-6">
            <div className="flex items-center text-textPrimary text-xl font-bold cursor-pointer" onClick={() => onNavigate('form')}>
              <GearIcon className="w-8 h-8 mr-2 text-primary" />
              <span>TunedUp</span>
            </div>
            <div className="flex items-baseline space-x-2">
              <NavButton view='form'>Performance Estimator</NavButton>
            </div>
          </div>
          <div className="flex items-center">
            {user ? (
              <div className="flex items-center space-x-4">
                 <button 
                  onClick={() => onNavigate('profile')} 
                  className="w-9 h-9 rounded-full bg-divider flex items-center justify-center overflow-hidden border-2 border-divider hover:border-primary transition-colors"
                  aria-label="View Profile"
                >
                  {user.profilePictureUrl ? (
                    <img src={user.profilePictureUrl} alt="Profile" className="w-full h-full object-cover" />
                  ) : (
                    <UserIcon className="w-5 h-5 text-textSecondary" />
                  )}
                </button>
                <button
                  onClick={onLogout}
                  className="px-3 py-2 text-sm font-medium text-textSecondary bg-divider rounded-md hover:bg-error hover:text-textPrimary transition-colors"
                >
                  Logout
                </button>
              </div>
            ) : (
              <div className="relative">
                <button
                  onClick={() => setIsLoginOpen(!isLoginOpen)}
                  className="px-3 py-2 text-sm font-medium text-background bg-primary rounded-md hover:bg-primary/90 transition-colors"
                >
                  Login
                </button>
                {isLoginOpen && (
                  <div className="absolute right-0 mt-2 w-72 bg-secondary border border-divider rounded-lg shadow-xl p-4 z-20">
                    <div className="flex justify-between items-center mb-2">
                      <h3 className="text-textPrimary font-semibold">Login or Sign Up</h3>
                      <button onClick={() => setIsLoginOpen(false)} className="text-textSecondary hover:text-textPrimary">&times;</button>
                    </div>
                    <p className="text-xs text-textSecondary mb-4">Enter your details to save and manage builds.</p>
                    <form onSubmit={handleLoginSubmit} className="space-y-3">
                       <input
                        type="text"
                        name="firstName"
                        value={formState.firstName}
                        onChange={handleChange}
                        placeholder="First Name"
                        className="w-full px-3 py-2 bg-background border border-divider text-textPrimary rounded-md focus:outline-none focus:ring-2 focus:ring-primary text-sm"
                        required
                      />
                       <input
                        type="text"
                        name="lastName"
                        value={formState.lastName}
                        onChange={handleChange}
                        placeholder="Last Name"
                        className="w-full px-3 py-2 bg-background border border-divider text-textPrimary rounded-md focus:outline-none focus:ring-2 focus:ring-primary text-sm"
                        required
                      />
                      <input
                        type="email"
                        name="email"
                        value={formState.email}
                        onChange={handleChange}
                        placeholder="user@example.com"
                        className="w-full px-3 py-2 bg-background border border-divider text-textPrimary rounded-md focus:outline-none focus:ring-2 focus:ring-primary text-sm"
                        required
                      />
                      <button type="submit" className="w-full mt-3 px-3 py-2 text-sm font-medium text-background bg-primary rounded-md hover:bg-primary/90 transition-colors">
                        Sign In
                      </button>
                    </form>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </nav>
    </header>
  );
};