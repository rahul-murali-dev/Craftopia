import React from 'react';
import OTPVerificationForm from '../features/auth/OTPVerificationForm';
import { useLocation } from 'react-router-dom';

const OTPVerificationPage = () => {
  const location = useLocation();
  const email = location.state?.email || '';
  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center px-4 py-10 sm:py-12 bg-[#F8F4ED]">
      <div className="w-full max-w-md">
        {/* Verification Card */}
        <div className="bg-white rounded-2xl shadow-sm border border-stone-100 px-6 py-8 sm:px-10 sm:py-10">
          {/* Brand Mark */}
          <div className="flex flex-col items-center text-center mb-8">
            <div className="flex items-center justify-center w-14 h-14 rounded-2xl mb-4 bg-[#F8F4ED]">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-7 w-7"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#5C3A2E"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M12 2L3 7l9 5 9-5-9-5z" />
                <path d="M3 17l9 5 9-5" />
                <path d="M3 12l9 5 9-5" />
              </svg>
            </div>
            <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-[#30231E]">
              Craftopia
            </h1>
            <p className="text-xs tracking-[0.2em] uppercase mt-1 text-[#8B6248]">
              Handmade from Kerala
            </p>
          </div>

          {/* Heading + Description */}
          <div className="text-center mb-6">
            <h2 className="text-xl sm:text-2xl font-semibold mb-2 text-[#30231E]">
              Verify Your Email
            </h2>
            <p className="text-sm sm:text-base leading-relaxed text-[#8B6248]">
              We have sent a 6-digit verification code to your email address.
            </p>
          </div>

          {/* Form */}
          <OTPVerificationForm email={email} />
        </div>

        {/* Security Footer */}
        <div className="mt-6 px-4 text-center">
          <div className="inline-flex items-center gap-2 text-xs text-[#8B6248]">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-3.5 w-3.5 flex-shrink-0"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
              <path d="M7 11V7a5 5 0 0 1 10 0v4" />
            </svg>
            <span>Never share your verification code with anyone.</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OTPVerificationPage;