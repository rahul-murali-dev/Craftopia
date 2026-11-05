
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Mail, ShieldCheck } from "lucide-react";
import api from "../../config/axiosInstance";

export default function ChangeEmailForm({
  returnPath = "/user-profile",
}) {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  // Send OTP
  const handleSendOTP = async (e) => {
    e.preventDefault();

    setError("");
    setMessage("");
    setLoading(true);

    try {
      const response = await api.post("/auth/change-email/", {
        email: email,
      });

      setOtpSent(true);
      setMessage(response.data.message);
    } catch (err) {
      setError(
        err.response?.data?.error ||
        err.response?.data?.detail ||
        "Unable to send OTP. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  // Verify OTP
  const handleVerifyOTP = async (e) => {
    e.preventDefault();

    setError("");
    setMessage("");
    setLoading(true);

    try {
      const response = await api.post(
        "/auth/verify-change-email-otp/",
        { otp: otp }
      );

      setMessage(response.data.message);

      setEmail(response.data.email || email);
      setOtp("");
      setOtpSent(false);

      // Return to the relevant profile after successful verification
      navigate(returnPath);
    } catch (err) {
      setError(
        err.response?.data?.error ||
        err.response?.data?.detail ||
        err.response?.data?.otp?.[0] ||
        "Invalid or expired OTP. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8F4ED] px-4 py-10">
      <div className="mx-auto max-w-md">

        {/* Back Button */}
        <button
          type="button"
          onClick={() => navigate(returnPath)}
          className="mb-6 flex items-center gap-2 text-sm font-medium text-[#5C3A2E] hover:underline"
        >
          <ArrowLeft size={18} />
          Back to Profile
        </button>

        <div className="rounded-2xl bg-white p-6 shadow-sm sm:p-8">

          {/* Header */}
          <div className="mb-6 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[#F8F4ED]">
              <Mail size={28} className="text-[#5C3A2E]" />
            </div>

            <h1 className="mt-4 font-serif text-2xl font-bold text-[#30231E]">
              Change Email
            </h1>

            <p className="mt-2 text-sm text-gray-500">
              Update your Craftopia account email address.
            </p>
          </div>

          {/* Send OTP Form */}
          {!otpSent && (
            <form onSubmit={handleSendOTP}>

              <label className="mb-2 block text-sm font-medium text-[#30231E]">
                New Email Address
              </label>

              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your new email"
                required
                className="w-full rounded-xl border border-gray-300 px-4 py-3 outline-none transition focus:border-[#8B6248] focus:ring-2 focus:ring-[#8B6248]/20"
              />

              <button
                type="submit"
                disabled={loading}
                className="mt-5 w-full rounded-xl bg-[#5C3A2E] px-4 py-3 font-semibold text-white transition hover:bg-[#43291F] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? "Sending OTP..." : "Send OTP"}
              </button>

            </form>
          )}

          {/* OTP Verification Form */}
          {otpSent && (
            <form onSubmit={handleVerifyOTP}>

              <div className="mb-5 rounded-xl bg-[#F8F4ED] p-4">
                <div className="flex items-center gap-2 text-[#5C3A2E]">
                  <ShieldCheck size={20} />

                  <p className="text-sm font-semibold">
                    OTP Sent Successfully
                  </p>
                </div>

                <p className="mt-2 text-sm text-gray-600">
                  Enter the 6-digit OTP sent to:
                </p>

                <p className="mt-1 break-all font-semibold text-[#30231E]">
                  {email}
                </p>
              </div>

              <label className="mb-2 block text-sm font-medium text-[#30231E]">
                Enter OTP
              </label>

              <input
                type="text"
                value={otp}
                onChange={(e) =>
                  setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))
                }
                placeholder="Enter 6-digit OTP"
                maxLength={6}
                inputMode="numeric"
                required
                className="w-full rounded-xl border border-gray-300 px-4 py-3 text-center text-lg tracking-[0.5em] outline-none transition focus:border-[#8B6248] focus:ring-2 focus:ring-[#8B6248]/20"
              />

              <button
                type="submit"
                disabled={loading || otp.length !== 6}
                className="mt-5 w-full rounded-xl bg-[#5C3A2E] px-4 py-3 font-semibold text-white transition hover:bg-[#43291F] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? "Verifying..." : "Verify OTP"}
              </button>

              <button
                type="button"
                onClick={() => {
                  setOtpSent(false);
                  setOtp("");
                  setError("");
                  setMessage("");
                }}
                className="mt-3 w-full py-2 text-sm font-medium text-[#8B6248] hover:underline"
              >
                Change Email Address
              </button>

            </form>
          )}

          {/* Success Message */}
          {message && (
            <div className="mt-5 rounded-xl bg-green-50 p-3 text-sm text-green-700">
              {message}
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="mt-5 rounded-xl bg-red-50 p-3 text-sm text-red-600">
              {error}
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
