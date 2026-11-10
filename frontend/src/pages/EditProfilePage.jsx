
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../config/axiosInstance";
import { ArrowLeft, UserRound, Camera } from "lucide-react";

export default function EditProfilePage() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    first_name: "",
    last_name: "",
    phone: "",
  });

  const [profileImage, setProfileImage] = useState(null);
  const [removeProfileImage, setRemoveProfileImage] = useState(false);
  const [imagePreview, setImagePreview] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await api.get("/auth/profile/");

        setFormData({
          first_name: response.data.first_name || "",
          last_name: response.data.last_name || "",
          phone: response.data.phone || "",
        });

        setImagePreview(response.data.profile_image || "");
      } catch (err) {
        setError("Unable to load profile details.");
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;

    // Phone number: digits only, maximum 10 digits
    if (name === "phone" && !/^\d{0,10}$/.test(value)) {
      return;
    }

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];

    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setError("Please select a valid image.");
      return;
    }

    setProfileImage(file);
    setRemoveProfileImage(false);
    setImagePreview(URL.createObjectURL(file));
    setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validate phone number before API request
    const phone = formData.phone.trim();

    if (!/^\d{10}$/.test(phone)) {
      setError("Phone number must contain exactly 10 digits.");
      return;
    }

    setSaving(true);
    setError("");
    setSuccess("");

    try {
      const data = new FormData();

      data.append("first_name", formData.first_name);
      data.append("last_name", formData.last_name);
      data.append("phone", phone);

      if (profileImage) {
        data.append("profile_image", profileImage);
      } else if (removeProfileImage) {
        data.append("remove_profile_image", "true");
      }

      const response = await api.patch("/auth/profile/", data);

      setSuccess("Profile updated successfully.");

      if (response.data.user?.profile_image) {
        setImagePreview(response.data.user.profile_image);
      }

      setTimeout(() => {
        navigate("/user-profile");
      }, 1200);

    } catch (err) {
      setError(
        err.response?.data?.detail ||
        "Unable to update profile. Please try again."
      );
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#F8F4ED]">
        Loading profile...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8F4ED] px-4 py-8">
      <div className="mx-auto max-w-2xl">

        <button
          onClick={() => navigate("/user-profile")}
          className="mb-6 flex items-center gap-2 text-sm font-medium text-[#5C3A2E] hover:underline"
        >
          <ArrowLeft size={18} />
          Back to Profile
        </button>

        <div className="overflow-hidden rounded-2xl bg-white shadow-sm">

          <div className="bg-[#5C3A2E] px-6 py-8 text-center">
            <h1 className="font-serif text-2xl font-bold text-white">
              Edit Profile
            </h1>

            <p className="mt-2 text-sm text-white/80">
              Update your personal information
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6 p-6">

            <div className="flex flex-col items-center">
              <div className="relative flex h-28 w-28 items-center justify-center overflow-hidden rounded-full bg-[#F8F4ED]">
                {imagePreview ? (
                  <img
                    src={imagePreview}
                    alt="Profile"
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <UserRound size={48} className="text-[#5C3A2E]" />
                )}

                <label
                  htmlFor="profile_image"
                  className="absolute bottom-0 right-0 cursor-pointer rounded-full bg-[#5C3A2E] p-2 text-white"
                >
                  <Camera size={17} />
                </label>
              </div>

              {imagePreview && (
                <button
                  type="button"
                  onClick={() => {
                    setProfileImage(null);
                    setImagePreview("");
                    setRemoveProfileImage(true);
                    setError("");
                  }}
                  className="mt-2 text-sm font-medium text-red-600 hover:underline"
                >
                  Remove Profile Photo
                </button>
              )}

              <input
                id="profile_image"
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                className="hidden"
              />

              <p className="mt-3 text-sm text-gray-500">
                Change profile photo
              </p>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-[#30231E]">
                First Name
              </label>

              <input
                type="text"
                name="first_name"
                value={formData.first_name}
                onChange={handleChange}
                className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-[#8B6248]"
                required
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-[#30231E]">
                Last Name
              </label>

              <input
                type="text"
                name="last_name"
                value={formData.last_name}
                onChange={handleChange}
                className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-[#8B6248]"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-[#30231E]">
                Phone Number
              </label>

              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                maxLength={10}
                placeholder="Enter 10-digit phone number"
                className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-[#8B6248]"
              />
            </div>

            {error && (
              <p className="rounded-lg bg-red-50 p-3 text-sm text-red-600">
                {error}
              </p>
            )}

            {success && (
              <p className="rounded-lg bg-green-50 p-3 text-sm text-green-700">
                {success}
              </p>
            )}

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => navigate("/user-profile")}
                className="flex-1 rounded-lg border border-[#5C3A2E] px-4 py-3 font-medium text-[#5C3A2E] hover:bg-[#F8F4ED]"
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={saving}
                className="flex-1 rounded-lg bg-[#5C3A2E] px-4 py-3 font-medium text-white hover:bg-[#43291F] disabled:opacity-60"
              >
                {saving ? "Saving..." : "Save Changes"}
              </button>
            </div>

          </form>
        </div>
      </div>
    </div>
  );
}
