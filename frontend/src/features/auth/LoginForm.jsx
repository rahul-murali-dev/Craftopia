
import React, { useState } from 'react';
import {
  User,
  Star,
  Mail,
  Lock,
  ArrowRight,
  LockIcon,
  Eye,
  EyeOff,
} from 'lucide-react';

import FormInput from '../../components/ui/FormInput';
import CustomAlert from '../../components/ui/CustomAlert';
import api from '../../config/axiosInstance';
import { useNavigate } from 'react-router-dom';

const LoginForm = () => {
  const navigate = useNavigate();

  const [accountType, setAccountType] = useState('Customer');

  const [formData, setFormData] = useState({
    email: '',
    password: '',
    rememberMe: false,
  });

  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const [popup, setPopup] = useState({
    isOpen: false,
    type: 'info',
    title: '',
    message: '',
    onConfirm: null,
  });

  const showPopup = (type, title, message, onConfirm = null) => {
    setPopup({
      isOpen: true,
      type,
      title,
      message,
      onConfirm,
    });
  };

  const closePopup = () => {
    setPopup({
      isOpen: false,
      type: 'info',
      title: '',
      message: '',
      onConfirm: null,
    });
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (loading) return;

    setLoading(true);

    try {
      const endpoint =
        accountType === 'Artisan'
          ? '/auth/artisan/login/'
          : '/auth/login/';

      const response = await api.post(
        endpoint,
        {
          email: formData.email.trim(),
          password: formData.password,
        },
        {
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      const data = response.data;

      // Check artisan permissions.
      if (
        accountType === 'Artisan' &&
        data.user?.role !== 'artisan'
      ) {
        showPopup(
          'error',
          'Permission Denied',
          'This account does not have artisan permissions.'
        );
        return;
      }

      // Save JWT tokens.
      if (data.access) {
        localStorage.setItem('access', data.access);
      }

      if (data.refresh) {
        localStorage.setItem('refresh', data.refresh);
      }

      localStorage.setItem('userRole', data.user.role);

      console.log(`${accountType} login successful:`, data);

      if (accountType === 'Customer') {
        showPopup(
          'success',
          'Login Successful',
          'Customer login successful.',
          () => navigate('/home')
        );
      } else if (accountType === 'Artisan') {
        showPopup(
          'success',
          'Login Successful',
          'Artisan login successful.',
          () => navigate('/artisan-dashboard')
        );
      }
    } catch (error) {
      const status = error.response?.status;
      const responseData = error.response?.data;

      if (status === 400) {
        showPopup(
          'error',
          'Invalid Details',
          'Please check your login details.'
        );
      } else if (status === 401) {
        showPopup(
          'error',
          'Login Failed',
          'Invalid email or password.'
        );
      } else if (status === 403) {
        showPopup(
          'error',
          'Access Denied',
          accountType === 'Artisan'
            ? 'Your artisan account may not be approved, or you do not have artisan permissions.'
            : 'You do not have permission to log in.'
        );
      } else {
        showPopup(
          'error',
          'Login Failed',
          'Login failed. Please try again.'
        );
      }

      console.error(
        'Login failed:',
        responseData || error.message
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="w-full max-w-md mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h2 className="text-3xl font-serif font-bold text-[#2D2D2D] mb-2">
            Welcome to Craftopia
          </h2>

          <p className="text-sm text-gray-500">
            Your journey into handmade treasures begins here.
          </p>
        </div>

        {/* Account Type Selector */}
        <div className="mb-6">
          <label className="text-xs font-bold text-gray-700 uppercase tracking-wider mb-3 block">
            Select Account Type
          </label>

          <div className="flex p-1 bg-[#F3E8E0] rounded-lg">
            {[
              { id: 'Customer', icon: User },
              { id: 'Artisan', icon: Star },
            ].map((type) => (
              <button
                key={type.id}
                type="button"
                onClick={() => setAccountType(type.id)}
                className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-md text-sm font-medium transition-all ${
                  accountType === type.id
                    ? 'bg-[#5C4033] text-white shadow-sm'
                    : 'text-[#5C4033] hover:bg-white/50'
                }`}
              >
                <type.icon size={14} />
                {type.id}
              </button>
            ))}
          </div>
        </div>

        {/* Info Banner */}
        <div className="mb-6 px-4 py-3 bg-white border border-gray-200 rounded-md text-xs text-gray-600 flex items-start gap-2 shadow-sm">
          <span className="w-1.5 h-1.5 rounded-full bg-red-500 mt-1 flex-shrink-0" />

          <span>
            {accountType === 'Customer'
              ? 'Sign in to purchase and track handmade orders.'
              : 'Sign in to manage your artisan account and creations.'}
          </span>
        </div>

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Email */}
          <FormInput
            label="Email Address"
            name="email"
            type="email"
            placeholder="name@craftopia.com"
            icon={Mail}
            value={formData.email}
            onChange={handleChange}
          />

          {/* Password */}
          <div className="mb-4">
            <div className="flex justify-between items-center mb-1.5">
              <label
                htmlFor="login-password"
                className="text-sm font-semibold text-gray-800"
              >
                Password
              </label>

              <button
                type="button"
                onClick={() => navigate('/forgot-password')}
                className="text-sm text-[#5C4033] hover:underline"
              >
                Forgot password?
              </button>
            </div>

            <div className="relative">
              <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                <Lock size={18} />
              </div>

              <input
                id="login-password"
                type={showPassword ? 'text' : 'password'}
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="Enter your password"
                autoComplete="current-password"
                required
                className="w-full bg-white border border-[#E5E0D8] rounded-md py-2.5 pl-10 pr-10 text-sm text-gray-700 focus:outline-none focus:border-[#5C4033] focus:ring-1 focus:ring-[#5C4033] transition-all"
              />

              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                aria-label={
                  showPassword ? 'Hide password' : 'Show password'
                }
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showPassword ? (
                  <EyeOff size={18} />
                ) : (
                  <Eye size={18} />
                )}
              </button>
            </div>
          </div>

          {/* Remember Me */}
          <div className="flex justify-between items-center text-xs">
            <label className="flex items-center gap-2 cursor-pointer text-gray-600">
              <input
                type="checkbox"
                name="rememberMe"
                checked={formData.rememberMe}
                onChange={handleChange}
                className="w-4 h-4 rounded border-gray-300 text-[#5C4033] focus:ring-[#5C4033]"
              />

              Keep me logged in for 30 days
            </label>

            <div className="flex items-center gap-1 text-gray-500">
              <LockIcon size={12} />
              Secure connection
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#5C4033] hover:bg-[#4A3329] text-white font-medium py-3 rounded-md transition-colors flex items-center justify-center gap-2 shadow-md mt-2 disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {loading
              ? 'Signing In...'
              : accountType === 'Customer'
                ? 'Login as Customer'
                : 'Login as Artisan'}

            <ArrowRight size={18} />
          </button>
        </form>

        {/* Divider */}
        <div className="relative my-8">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-200" />
          </div>

          <div className="relative flex justify-center text-xs">
            <span className="px-4 bg-[#FDFBF9] text-gray-400">
              or continue with
            </span>
          </div>
        </div>

        {/* Google Login - UI only */}
        <button
          type="button"
          onClick={() =>
            showPopup(
              'info',
              'Google Login',
              'Google login is not connected yet.'
            )
          }
          className="w-full bg-white border border-gray-200 text-gray-700 font-medium py-3 rounded-md hover:bg-gray-50 transition flex items-center justify-center gap-3 shadow-sm"
        >
          Continue with Google
        </button>

        {/* Customer Sign-up Link */}
        <div className="mt-8 text-center text-sm text-gray-600">
          Don't have an account?{' '}
          <a
            href="/signup"
            className="text-[#8C4632] font-semibold hover:underline"
          >
            Sign up
          </a>{' '}
          as Customer
        </div>

        {/* Artisan Registration */}
        <div className="mt-8 p-5 bg-[#FDFBF9] border border-[#E5E0D8] rounded-lg flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h4 className="font-bold text-sm text-gray-800">
              Are you an artisan? Join Craftopia.
            </h4>

            <p className="text-xs text-gray-500 mt-1">
              Showcase your handmade creations on Craftopia.
            </p>
          </div>

          <button
            type="button"
            onClick={() => {
              window.location.href = '/signup';
            }}
            className="whitespace-nowrap px-4 py-2 bg-[#F3E8E0] text-[#5C4033] text-sm font-medium rounded-md hover:bg-[#E5D5C5] transition flex items-center gap-1"
          >
            Register as an Artisan
            <ArrowRight size={14} />
          </button>
        </div>
      </div>

      {/* Custom Popup */}
      <CustomAlert
        isOpen={popup.isOpen}
        type={popup.type}
        title={popup.title}
        message={popup.message}
        onClose={closePopup}
        onConfirm={popup.onConfirm}
        confirmText="Continue"
      />
    </>
  );
};

export default LoginForm;
