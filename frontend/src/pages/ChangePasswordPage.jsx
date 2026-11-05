
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  LockKeyhole,
  Eye,
  EyeOff,
  CheckCircle,
} from "lucide-react";
import api from "../config/axiosInstance";

export default function ChangePasswordPage() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    current_password: "",
    new_password: "",
    confirm_password: "",
  });

  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false,
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    setError("");
  };

  const togglePassword = (field) => {
    setShowPasswords((prev) => ({
      ...prev,
      [field]: !prev[field],
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    setError("");
    setSuccess("");

    if (
      !formData.current_password ||
      !formData.new_password ||
      !formData.confirm_password
    ) {
      setError("Please fill in all fields.");
      return;
    }

    if (formData.new_password !== formData.confirm_password) {
      setError("New password and confirm password do not match.");
      return;
    }

    if (formData.new_password.length < 8) {
      setError("New password must contain at least 8 characters.");
      return;
    }

    setLoading(true);

    try {
      const response = await api.post(
        "/auth/change-password/",
        formData
      );

      setSuccess(
        response.data.message || "Password changed successfully."
      );

      setFormData({
        current_password: "",
        new_password: "",
        confirm_password: "",
      });

    } catch (err) {
      const responseData = err.response?.data;

      const errorMessage =
        responseData?.current_password?.[0] ||
        responseData?.new_password?.[0] ||
        responseData?.confirm_password?.[0] ||
        responseData?.detail ||
        responseData?.non_field_errors?.[0] ||
        "Unable to change password. Please try again.";

      setError(errorMessage);

    } finally {
      setLoading(false);
    }
  };

  const renderPasswordField = (label, name, field) => (
    <div>
      <label
        htmlFor={name}
        className="mb-2 block text-sm font-medium text-[#30231E]"
      >
        {label}
      </label>

      <div className="relative">
        <input
          id={name}
          type={showPasswords[field] ? "text" : "password"}
          name={name}
          value={formData[name]}
          onChange={handleChange}
          placeholder={`Enter ${label.toLowerCase()}`}
          autoComplete="new-password"
          className="w-full rounded-lg border border-[#5C3A2E]/20 bg-white px-4 py-3 pr-12 text-[#30231E] outline-none transition focus:border-[#5C3A2E] focus:ring-2 focus:ring-[#5C3A2E]/10"
        />

        <button
          type="button"
          onClick={() => togglePassword(field)}
          className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-[#5C3A2E]"
          aria-label={showPasswords[field] ? "Hide password" : "Show password"}
        >
          {showPasswords[field] ? (
            <EyeOff size={19} />
          ) : (
            <Eye size={19} />
          )}
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#F8F4ED] px-4 py-8">

      <div className="mx-auto max-w-xl">

        {/* Back Button */}
        <button
          type="button"
          onClick={() => navigate("/user-profile")}
          className="mb-6 flex items-center gap-2 text-sm font-medium text-[#5C3A2E] hover:underline"
        >
          <ArrowLeft size={18} />
          Back to Profile
        </button>

        {/* Main Card */}
        <div className="overflow-hidden rounded-2xl bg-white shadow-sm">

          {/* Header */}
          <div className="bg-[#5C3A2E] px-6 py-8 text-center">

            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-white/15">
              <LockKeyhole size={30} className="text-white" />
            </div>

            <h1 className="mt-4 font-serif text-2xl font-bold text-white">
              Change Password
            </h1>

            <p className="mt-2 text-sm text-white/80">
              Keep your Craftopia account secure
            </p>

          </div>

          {/* Form */}
          <form
            onSubmit={handleSubmit}
            className="space-y-5 p-6 sm:p-8"
          >

            {renderPasswordField(
              "Current Password",
              "current_password",
              "current"
            )}

            {renderPasswordField(
              "New Password",
              "new_password",
              "new"
            )}

            {renderPasswordField(
              "Confirm New Password",
              "confirm_password",
              "confirm"
            )}

            {/* Password Hint */}
            <p className="text-xs text-gray-500">
              New password must contain at least 8 characters.
            </p>

            {/* Error Message */}
            {error && (
              <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-600">
                {error}
              </div>
            )}

            {/* Success Message */}
            {success && (
              <div className="flex items-center gap-2 rounded-lg border border-green-200 bg-green-50 p-3 text-sm text-green-700">
                <CheckCircle size={18} />
                {success}
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg bg-[#5C3A2E] px-4 py-3 font-semibold text-white transition hover:bg-[#43291F] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? "Updating Password..." : "Update Password"}
            </button>

            {/* Cancel */}
            <button
              type="button"
              onClick={() => navigate("/user-profile")}
              className="w-full rounded-lg border border-[#5C3A2E]/20 px-4 py-3 font-medium text-[#5C3A2E] transition hover:bg-[#F8F4ED]"
            >
              Cancel
            </button>

          </form>

        </div>
      </div>
    </div>
  );
}
