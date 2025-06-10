
import React from 'react';
import Header from './Header';
import Footer from './Footer';
import AIChat from './AIChat';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-900 text-gray-900 dark:text-gray-100 transition-colors">
      <Header />
      <main className="min-h-screen">
        {children}
      </main>
      <Footer />
      <AIChat />
    </div>
  );
};

export default Layout;
