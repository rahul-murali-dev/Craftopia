
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, Lock, Eye, EyeOff, ArrowRight, ShieldCheck } from 'lucide-react';

import api from '../../config/axiosInstance';

const AdminLoginForm = () => {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });

  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (loading) return;

    setLoading(true);

    try {
      const response = await api.post('/auth/admin/login/', {
        email: formData.email.trim(),
        password: formData.password,
      });

      const data = response.data;

      // Verify administrator role.
      if (data.user?.role !== 'admin') {
        alert('You do not have administrator permissions.');
        return;
      }

      // Save admin authentication tokens.
      if (!data.access || !data.refresh) {
        alert('Login response is missing authentication tokens.');
        return;
      }

      localStorage.setItem('access', data.access);
      localStorage.setItem('refresh', data.refresh);
      localStorage.setItem('userRole', 'admin');
      localStorage.setItem('adminUser', JSON.stringify(data.user));

      alert('Admin login successful.');

      navigate('/admin/dashboard');

    } catch (error) {
      const status = error.response?.status;

      if (status === 400) {
        alert('Please check your email and password.');
      } else if (status === 401) {
        alert('Invalid email or password.');
      } else if (status === 403) {
        alert('You do not have administrator permissions.');
      } else {
        alert('Admin login failed. Please try again.');
      }

      console.error(
        'Admin login error:',
        error.response?.data || error.message
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto">

      {/* Form heading */}
      <div className="text-center mb-8">
        <div className="w-14 h-14 mx-auto mb-4 rounded-full bg-[#F3E8E0] flex items-center justify-center">
          <ShieldCheck size={28} className="text-[#5C4033]" />
        </div>

        <h2 className="text-2xl font-serif font-bold text-[#30231E]">
          Admin Sign In
        </h2>

        <p className="text-sm text-gray-500 mt-2">
          Enter your administrator credentials to continue.
        </p>
      </div>

      {/* Login form */}
      <form onSubmit={handleSubmit} className="space-y-5">

        {/* Email */}
        <div>
          <label
            htmlFor="admin-email"
            className="block text-sm font-semibold text-gray-700 mb-2"
          >
            Email Address
          </label>

          <div className="relative">
            <Mail
              size={18}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            />

            <input
              id="admin-email"
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="admin@example.com"
              autoComplete="username"
              required
              className="w-full border border-[#E5E0D8] rounded-md py-3 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-[#8B6248] focus:border-transparent transition"
            />
          </div>
        </div>

        {/* Password */}
        <div>
          <label
            htmlFor="admin-password"
            className="block text-sm font-semibold text-gray-700 mb-2"
          >
            Password
          </label>

          <div className="relative">
            <Lock
              size={18}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            />

            <input
              id="admin-password"
              type={showPassword ? 'text' : 'password'}
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="Enter your password"
              autoComplete="current-password"
              required
              className="w-full border border-[#E5E0D8] rounded-md py-3 pl-10 pr-11 text-sm focus:outline-none focus:ring-2 focus:ring-[#8B6248] focus:border-transparent transition"
            />

            <button
              type="button"
              onClick={() => setShowPassword((prev) => !prev)}
              aria-label={showPassword ? 'Hide password' : 'Show password'}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-[#5C4033]"
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-[#5C4033] hover:bg-[#4A3329] text-white font-semibold py-3 rounded-md flex items-center justify-center gap-2 transition disabled:opacity-60 disabled:cursor-not-allowed shadow-md"
        >
          {loading ? 'Signing In...' : 'Sign In to Dashboard'}
          {!loading && <ArrowRight size={18} />}
        </button>

      </form>

      {/* Security note */}
      <div className="mt-7 flex items-center justify-center gap-2 text-xs text-gray-500">
        <Lock size={13} />
        Secure access for authorized administrators only.
      </div>

    </div>
  );
};

export default AdminLoginForm;
