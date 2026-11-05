import React from 'react';
import { Shield, Star, CheckCircle2, ArrowRight } from 'lucide-react';
import LoginForm from '../features/auth/LoginForm';

const LoginPage = () => {
  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-[#FDFBF9] font-sans text-[#2D2D2D]">
      
      {/* LEFT SIDE: Image & Branding (Hidden on mobile) */}
      <div className="hidden lg:flex lg:w-1/2 relative bg-[#2D2D2D]">
        {/* Background Image */}
        <img 
          src="https://images.unsplash.com/photo-1610701596007-11502861dcfa?q=80&w=2070&auto=format&fit=crop" 
          alt="Artisan working on pottery" 
          className="absolute inset-0 w-full h-full object-cover opacity-80"
        />
        {/* Dark Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent"></div>

        {/* Content Overlay */}
        <div className="relative z-10 flex flex-col justify-between h-full p-12 text-white">
          
          {/* Top Nav */}
          <div className="flex justify-between items-start">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center text-[#8C4632]">
                <span className="font-bold text-lg">🏺</span>
              </div>
              <div>
                <h1 className="text-xl font-serif font-bold tracking-wide">Craftopia</h1>
                <p className="text-[10px] uppercase tracking-widest opacity-80">Artisan Marketplace</p>
              </div>
            </div>
            <button className="flex items-center gap-2 px-4 py-2 rounded-full border border-white/30 bg-white/10 backdrop-blur-sm text-sm hover:bg-white/20 transition">
              Explore Shop <ArrowRight size={14} />
            </button>
          </div>

          {/* Bottom Content */}
          <div className="space-y-6 max-w-lg">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-xs uppercase tracking-wider">
              <span className="w-1.5 h-1.5 rounded-full bg-[#8C4632]"></span>
              Certified Guild & Independent Creators
            </div>
            
            <h2 className="text-5xl font-serif font-bold leading-tight">
              "Handmade with Love, <br/> Made to Last."
            </h2>
            
            <p className="text-gray-300 text-sm leading-relaxed">
              Discover unique creations crafted by talented local artisans. Every piece tells an authentic story of dedication, tactile skill, and timeless craft.
            </p>

            <div className="flex items-center gap-8 pt-4 text-sm">
              <div className="flex items-center gap-2">
                <Star size={16} className="text-[#D4A373] fill-[#D4A373]" />
                <span>4,800+ Independent Makers</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 size={16} className="text-[#D4A373]" />
                <span>100% Verified Ethical</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* RIGHT SIDE: Login Form Area */}
      <div className="w-full lg:w-1/2 flex flex-col p-6 md:p-12 lg:p-16 overflow-y-auto">
        
        {/* Top Links */}
        <div className="flex justify-between items-center text-xs text-gray-500 mb-12">
          <div className="flex items-center gap-1 cursor-pointer hover:text-[#8C4632]">
            <Shield size={12} /> Admin Gateway
          </div>
          <div className="cursor-pointer hover:text-[#8C4632]">
            Need assistance? <span className="font-medium text-gray-700">Artisan Concierge</span>
          </div>
        </div>

        {/* Main Form Content */}
        <div className="flex-grow">
          <LoginForm />
        </div>

        {/* Footer */}
        <div className="mt-12 pt-8 border-t border-gray-100 flex flex-col md:flex-row justify-between items-center text-[10px] text-gray-400 gap-4">
          <div className="flex items-center gap-4">
            <span>© 2025 Craftopia Artisans Inc.</span>
            <span>•</span>
            <a href="#" className="hover:text-gray-600">Privacy</a>
            <span>•</span>
            <a href="#" className="hover:text-gray-600">Terms of Guild</a>
          </div>
          <div className="flex items-center gap-4">
            <a href="#" className="text-[#8C4632] font-medium">Admin Portal Access</a>
            <span>•</span>
            <span>Fair Trade Guaranteed</span>
          </div>
        </div>

      </div>
    </div>
  );
};

export default LoginPage;