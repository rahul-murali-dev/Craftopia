
import { useState } from 'react';

export default function ResetPasswordForm({ onSubmit, loading }) {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    if (newPassword.length < 8) {
      setError('Password must contain at least 8 characters.');
      return;
    }

    onSubmit(newPassword);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div>
        <label className="mb-2 block text-sm font-medium text-[#30231E]">
          New Password
        </label>
        <input
          type="password"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          placeholder="Enter new password"
          autoComplete="new-password"
          required
          className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-[#8B6248]"
        />
      </div>

      <div>
        <label className="mb-2 block text-sm font-medium text-[#30231E]">
          Confirm Password
        </label>
        <input
          type="password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          placeholder="Confirm new password"
          autoComplete="new-password"
          required
          className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-[#8B6248]"
        />
      </div>

      {error && (
        <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-lg bg-[#5C3A2E] px-4 py-3 font-medium text-white hover:bg-[#4A2E24] disabled:opacity-60"
      >
        {loading ? 'Resetting...' : 'Reset Password'}
      </button>
    </form>
  );
}
