
import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { LockKeyhole } from 'lucide-react';
import api from '../config/axiosInstance';
import ResetPasswordForm from '../features/auth/ResetPasswordForm';

export default function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const uid = searchParams.get('uid');
  const token = searchParams.get('token');

  console.log('ResetPasswordPage - uid:', uid, 'token:', token);

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handleResetPassword = async (newPassword) => {
    setLoading(true);
    setMessage('');
    setError('');

    try {
      const response = await api.post('/auth/reset-password/', {
        uid,
        token,
        new_password: newPassword,
      });

      setMessage(
        response.data.message || 'Password reset successfully.'
      );
    } catch (err) {
  console.log("RESET PASSWORD ERROR:", err.response?.data);

  setError(
    err.response?.data?.error ||
    err.response?.data?.message ||
    'Unable to reset password. The link may be invalid or expired.'
  );
}
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#F8F4ED] px-4 py-8">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-lg">
        <div className="mb-6 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-[#F8F4ED]">
            <LockKeyhole size={26} className="text-[#5C3A2E]" />
          </div>

          <h1 className="text-2xl font-bold text-[#30231E]">
            Reset Password
          </h1>

          <p className="mt-2 text-sm text-gray-600">
            Create a new password for your Craftopia account.
          </p>
        </div>

        {!uid || !token ? (
          <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700">
            Invalid or missing reset link. Please request a new link.
          </p>
        ) : (
          <ResetPasswordForm
            onSubmit={handleResetPassword}
            loading={loading}
          />
        )}

        {error && (
          <p className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">
            {error}
          </p>
        )}

        {message && (
          <div className="mt-4 space-y-3">
            <p className="rounded-lg bg-green-50 p-3 text-sm text-green-700">
              {message}
            </p>
            <button
              type="button"
              onClick={() => navigate('/login')}
              className="w-full rounded-lg bg-[#5C3A2E] px-4 py-3 font-medium text-white hover:bg-[#4A2E24]"
            >
              Back to Login
            </button>
          </div>
        )}

        {!message && (
          <button
            type="button"
            onClick={() => navigate('/login')}
            className="mt-5 w-full text-sm text-[#5C3A2E] hover:underline"
          >
            Back to Login
          </button>
        )}
      </div>
    </div>
  );
}
