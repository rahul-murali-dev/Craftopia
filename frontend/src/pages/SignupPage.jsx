import React from 'react';
import SignupForm from '../features/auth/SignupForm';
import { ShieldCheck } from 'lucide-react';

const SignupPage = () => {
  return (
    <div className="min-h-screen bg-[#FDFBF9] flex flex-col font-sans">
      
      {/* Top Navigation / Logo Area */}
      <header className="w-full py-6 flex justify-center">
        <div className="flex items-center gap-2 text-[#2D2D2D]">
          <div className="w-6 h-6 bg-[#F3E8E0] rounded flex items-center justify-center text-[#8C4632]">
             <span className="text-xs font-bold">📦</span>
          </div>
          <h1 className="text-xl font-serif font-bold tracking-tight">Craftopia</h1>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-grow flex items-center justify-center px-4 pb-12">
        {/* Decorative background blob (optional, matches the soft glow in image) */}
        <div className="absolute top-20 left-1/4 w-72 h-72 bg-[#FCECE6] rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob"></div>
        <div className="absolute top-40 right-1/4 w-72 h-72 bg-[#FDFBF9] rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-2000"></div>
        
        <SignupForm />
      </main>

      {/* Footer */}
      <footer className="w-full py-6 px-8 flex flex-col md:flex-row justify-between items-center text-xs text-gray-500 border-t border-gray-100 bg-white/50">
        <div className="flex items-center gap-2 mb-4 md:mb-0">
          <ShieldCheck size={14} className="text-[#8C4632]" />
          <span>Encrypted & Verified Artisan Directory</span>
        </div>
        
        <div className="mb-4 md:mb-0">
          © 2025 Craftopia Atelier Co. Handcrafted with reverence.
        </div>

        <div className="flex gap-6">
          <a href="#" className="hover:text-[#8C4632] transition-colors">Terms</a>
          <a href="#" className="hover:text-[#8C4632] transition-colors">Privacy</a>
          <a href="#" className="hover:text-[#8C4632] transition-colors">Standards</a>
        </div>
      </footer>
    </div>
  );
};

export default SignupPage;