import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../config/axiosInstance';

const OTP_LENGTH = 6;
const COUNTDOWN_SECONDS = 300; // 5 minutes

const OTPVerificationForm = ({ email }) => {
  const navigate = useNavigate();
  const [otp, setOtp] = useState(Array(OTP_LENGTH).fill(''));
  const [timeLeft, setTimeLeft] = useState(COUNTDOWN_SECONDS);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);

  
const inputRefs = useRef([]);


  
  // Countdown using recursive setTimeout (self-cleaning, easy to restart)
  useEffect(() => {
    if (timeLeft <= 0) return;
    const id = setTimeout(() => {
      setTimeLeft((prev) => prev - 1);
    }, 1000);
    return () => clearTimeout(id);
  }, [timeLeft]);

  // Auto-focus first input on mount
  useEffect(() => {
    inputRefs.current[0]?.focus();
  }, []);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  const isOtpComplete = otp.every((digit) => digit !== '');
  const isCountdownActive = timeLeft > 0;

  const displayEmail =
    email && typeof email === 'string' && email.trim() !== ''
      ? email
      : 'your email address';

  const handleChange = (index, value) => {
    const digit = value.replace(/\D/g, '').slice(-1);
    const newOtp = [...otp];
    newOtp[index] = digit;
    setOtp(newOtp);

    // Clear message when user is actively editing
    if (message.type) setMessage({ type: '', text: '' });

    if (digit && index < OTP_LENGTH - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace') {
      if (!otp[index] && index > 0) {
        e.preventDefault();
        const newOtp = [...otp];
        newOtp[index - 1] = '';
        setOtp(newOtp);
        inputRefs.current[index - 1]?.focus();
      }
    } else if (e.key === 'ArrowLeft' && index > 0) {
      e.preventDefault();
      inputRefs.current[index - 1]?.focus();
    } else if (e.key === 'ArrowRight' && index < OTP_LENGTH - 1) {
      e.preventDefault();
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pasted = e.clipboardData
      .getData('text')
      .replace(/\D/g, '')
      .slice(0, OTP_LENGTH);

    if (!pasted.length) return;

    const newOtp = [...otp];
    for (let i = 0; i < pasted.length; i++) {
      newOtp[i] = pasted[i];
    }
    setOtp(newOtp);
    if (message.type) setMessage({ type: '', text: '' });

    const nextIndex = Math.min(pasted.length, OTP_LENGTH - 1);
    inputRefs.current[nextIndex]?.focus();
  };

  const handleFocus = (index) => {
    inputRefs.current[index]?.select();
  };

  const handleVerify = async () => {
  if (!isOtpComplete) {
    setMessage({
      type: 'error',
      text: 'Please enter the complete 6-digit verification code.',
    });
    return;
  }

  if (!email) {
    setMessage({
      type: 'error',
      text: 'Email address is missing. Please register again.',
    });
    return;
  }

  setIsSubmitting(true);
  setMessage({ type: '', text: '' });

  try {
    const response = await api.post('/auth/verify-otp/', {
      email: email.trim(),
      otp: otp.join(''),
    });

    setMessage({
      type: 'success',
      text: response.data.message || 'Email verified successfully.',
    });

    setTimeout(() => {
      navigate('/login', {
        state: {
          message: 'Email verified successfully. You can now log in.',
        },
      });
    }, 1000);
  } catch (err) {
    const data = err.response?.data;

    let errorMessage = 'OTP verification failed. Please try again.';

    if (data && typeof data === 'object') {
      const firstError = Object.values(data).flat()[0];

      if (typeof firstError === 'string') {
        errorMessage = firstError;
      }
    }

    setMessage({
      type: 'error',
      text: errorMessage,
    });
  } finally {
    setIsSubmitting(false);
  }
};
  
const handleResend = async () => {
  if (isCountdownActive || !email || isSubmitting) return;

  setIsSubmitting(true);
  setMessage({ type: '', text: '' });

  try {
    const response = await api.post('/auth/resend-otp/', {
      email: email.trim(),
    });

    setOtp(Array(OTP_LENGTH).fill(''));
    setTimeLeft(COUNTDOWN_SECONDS);

    setMessage({
      type: 'success',
      text: response.data.message || 'A new OTP has been sent to your email.',
    });

    inputRefs.current[0]?.focus();
  } catch (err) {
    const data = err.response?.data;
    let errorMessage = 'Unable to resend OTP. Please try again.';

    if (data && typeof data === 'object') {
      const firstError = Object.values(data).flat()[0];

      if (typeof firstError === 'string') {
        errorMessage = firstError;
      }
    }

    setMessage({
      type: 'error',
      text: errorMessage,
    });
  } finally {
    setIsSubmitting(false);
  }
};


  const handleBackToLogin = (e) => {
    e.preventDefault();
    // Navigation hook will be wired here later (e.g., react-router navigate('/login'))
  };

  const messageStyles = {
    error: 'bg-red-50 text-red-700 border border-red-200',
    success: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
    info: 'bg-amber-50 text-amber-800 border border-amber-200',
  };

  return (
    <div>
      {/* Email Display */}
      <div className="rounded-xl px-4 py-3 mb-6 text-center bg-[#F8F4ED]">
        <p className="text-xs uppercase tracking-wider mb-1 text-[#8B6248]">
          Sending to
        </p>
        <p className="text-sm sm:text-base font-medium truncate text-[#5C3A2E]">
          {displayEmail}
        </p>
      </div>

      {/* OTP Inputs */}
      <div className="flex justify-center gap-2 sm:gap-3 mb-6">
        {otp.map((digit, index) => (
          <input
            key={index}
            ref={(element) => {
              inputRefs.current[index] = element;
                }}
            type="text"
            inputMode="numeric"
            autoComplete="one-time-code"
            maxLength={1}
            value={digit}
            onChange={(e) => handleChange(index, e.target.value)}
            onKeyDown={(e) => handleKeyDown(index, e)}
            onPaste={index === 0 ? handlePaste : undefined}
            onFocus={() => handleFocus(index)}
            aria-label={`Digit ${index + 1} of verification code`}
            className={[
              'text-center text-lg sm:text-xl font-semibold rounded-xl',
              'border-2 outline-none transition-all duration-200',
              'focus:ring-2 focus:ring-[#B87552] focus:ring-offset-1',
            ].join(' ')}
            style={{
              width: 'clamp(2.75rem, 10vw, 3.25rem)',
              height: 'clamp(3.25rem, 12vw, 3.75rem)',
              backgroundColor: '#FFFFFF',
              borderColor: digit ? '#5C3A2E' : '#E7E0D6',
              color: '#30231E',
            }}
          />
        ))}
      </div>

      {/* Countdown */}
      <div className="flex justify-center mb-6">
        <div className="flex items-center gap-2 text-sm text-[#8B6248]">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-4 w-4"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <circle cx="12" cy="12" r="10" />
            <polyline points="12 6 12 12 16 14" />
          </svg>
          <span className="font-medium tabular-nums">
            Code expires in {formatTime(timeLeft)}
          </span>
        </div>
      </div>

      {/* Message Area */}
      {message.text && (
        <div
          className={`rounded-xl px-4 py-3 mb-5 text-sm text-center ${messageStyles[message.type]}`}
          role="status"
          aria-live="polite"
        >
          {message.text}
        </div>
      )}

      {/* Verify Button */}
      <button
        type="button"
        onClick={handleVerify}
        disabled={!isOtpComplete || isSubmitting}
        className={[
          'w-full py-3.5 rounded-xl font-medium text-white text-sm sm:text-base',
          'transition-all duration-200 shadow-sm',
          'focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#B87552]',
          'disabled:opacity-50 disabled:cursor-not-allowed',
          'hover:shadow-md active:scale-[0.99]',
        ].join(' ')}
        style={{ backgroundColor: '#5C3A2E' }}
        aria-label="Verify OTP"
      >
        {isSubmitting ? 'Verifying...' : 'Verify OTP'}
      </button>

      {/* Resend OTP */}

      <div className="text-center mt-5">
        <p className="text-sm text-[#8B6248]">
          Didn't receive the code?{' '}
          <button
            type="button"
            onClick={handleResend}
            disabled={isCountdownActive || isSubmitting || !email}
            className={[
              'font-medium transition-colors duration-200 underline-offset-4',
              'focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#B87552] rounded',
              'disabled:opacity-50 disabled:cursor-not-allowed disabled:no-underline',
            ].join(' ')}
            style={{
              color: isCountdownActive ? '#8B6248' : '#B87552',
              textDecoration: isCountdownActive ? 'none' : 'underline',
            }}
            aria-label="Resend verification code"
          >
            Resend OTP
          </button>
        </p>
      </div>

      {/* Divider */}
      <div className="my-6 border-t border-stone-100" />

      {/* Back to Login */}
      <div className="text-center">
        <button
          type="button"
          onClick={handleBackToLogin}
          className={[
            'inline-flex items-center gap-1.5 text-sm font-medium transition-colors duration-200',
            'focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#B87552] rounded',
          ].join(' ')}
          style={{ color: '#5C3A2E' }}
          aria-label="Go back to login"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-4 w-4"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <line x1="19" y1="12" x2="5" y2="12" />
            <polyline points="12 19 5 12 12 5" />
          </svg>
          Back to Login
        </button>
      </div>
    </div>
  );
};

export default OTPVerificationForm;