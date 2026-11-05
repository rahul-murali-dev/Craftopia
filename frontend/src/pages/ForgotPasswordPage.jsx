
import { useState } from 'react';
import { Mail, ArrowLeft, LoaderCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '../config/axiosInstance.js';

const ForgotPasswordPage = () => {
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (loading) return;

    setLoading(true);
    setMessage('');
    setError('');

    try {
      const response = await api.post('/auth/forgot-password/', {
        email: email.trim(),
      });

      setMessage(
        response.data?.message ||
          'If your account is eligible, password reset instructions will be sent to your email.'
      );
    } catch (err) {
      const data = err.response?.data;

      const errorMessage =
        data?.message ||
        data?.email?.[0] ||
        data?.detail ||
        data?.error ||
        'Unable to process the request. Please try again.';

      setError(
        typeof errorMessage === 'string'
          ? errorMessage
          : 'Unable to process the request. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#F8F4ED] px-4">
      <div className="w-full max-w-md rounded-xl border border-[#E5E0D8] bg-white p-8 shadow-sm">
        <button
          type="button"
          onClick={() => navigate('/login')}
          className="mb-6 flex items-center gap-2 text-sm text-[#8B6248] hover:text-[#5C3A2E]"
        >
          <ArrowLeft size={16} />
          Back to Login
        </button>

        <div className="mb-7">
          <h1 className="mb-2 font-serif text-3xl font-bold text-[#30231E]">
            Forgot Password?
          </h1>

          <p className="text-sm leading-6 text-gray-500">
            Enter your registered email address to receive a password reset link.
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          <label
            htmlFor="forgot-password-email"
            className="mb-2 block text-sm font-medium text-[#30231E]"
          >
            Email Address
          </label>

          <div className="relative mb-6">
            <Mail
              size={18}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            />

            <input
              id="forgot-password-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your registered email"
              autoComplete="email"
              required
              disabled={loading}
              className="w-full rounded-md border border-[#E5E0D8] bg-white py-2.5 pl-10 pr-4 text-sm text-gray-700 transition-all focus:border-[#5C4033] focus:outline-none focus:ring-1 focus:ring-[#5C4033] disabled:opacity-60"
            />
          </div>

          {message && (
            <p
              role="status"
              className="mb-4 rounded-md bg-green-50 p-3 text-sm text-green-800"
            >
              {message}
            </p>
          )}

          {error && (
            <p
              role="alert"
              className="mb-4 rounded-md bg-red-50 p-3 text-sm text-red-700"
            >
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="flex w-full items-center justify-center gap-2 rounded-md bg-[#5C4033] py-3 text-sm font-medium text-white transition-colors hover:bg-[#4A3228] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading && <LoaderCircle size={16} className="animate-spin" />}
            {loading ? 'Sending...' : 'Send Reset Link'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default ForgotPasswordPage;
