
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Upload, Save, Trash2 } from "lucide-react";
import api from "../../config/axiosInstance";

const ArtisanEditProfileForm = ({ profile }) => {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: "",
    business_name: "",
    craft_type: "",
    phone: "",
    location: "",
    bio: "",
  });

  const [image, setImage] = useState(null);
  const [preview, setPreview] = useState("");
  const [removeImage, setRemoveImage] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    setFormData({
      name: profile.name || "",
      business_name: profile.business_name || "",
      craft_type: profile.craft_type || "",
      phone: profile.phone || "",
      location: profile.location || "",
      bio: profile.bio || "",
    });

    setPreview(profile.profile_image || "");
    setImage(null);
    setRemoveImage(false);
  }, [profile]);

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleImageChange = (e) => {
    const selectedImage = e.target.files[0];

    if (selectedImage) {
      setImage(selectedImage);
      setRemoveImage(false);
      setPreview(URL.createObjectURL(selectedImage));
    }
  };

  const handleRemoveImage = () => {
    setImage(null);
    setPreview("");
    setRemoveImage(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError("");

    try {
      const data = new FormData();

      Object.entries(formData).forEach(([key, value]) => {
        data.append(key, value);
      });

      if (image) {
        data.append("profile_image", image);
      }

      if (removeImage) {
        data.append("remove_profile_image", "true");
      }

      const response = await api.patch("/artisans/me/", data);

      console.log("Profile update response:", response.data);

      navigate("/artisan/profile");
    } catch (err) {
      console.error(
        "Profile update failed:",
        err.response?.data || err
      );

      setError(
        err.response?.data?.detail ||
        "Unable to update profile. Please try again."
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">

      {/* Profile Picture */}
      <div className="flex flex-col items-center gap-3">
        <div className="h-28 w-28 overflow-hidden rounded-full border-2 border-[#E5E0D8] bg-[#F8F4ED]">
          {preview ? (
            <img
              src={preview}
              alt="Profile preview"
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center font-serif text-4xl text-[#5C3A2E]">
              {formData.name?.charAt(0)?.toUpperCase() || "A"}
            </div>
          )}
        </div>

        <div className="flex flex-wrap items-center justify-center gap-3">
          <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-[#8B6248] px-4 py-2 text-sm font-medium text-[#5C3A2E] hover:bg-[#F8F4ED]">
            <Upload size={16} />
            Change Profile Picture

            <input
              type="file"
              accept="image/*"
              onChange={handleImageChange}
              className="hidden"
            />
          </label>

          {preview && (
            <button
              type="button"
              onClick={handleRemoveImage}
              className="flex items-center gap-2 rounded-lg border border-red-300 px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50"
            >
              <Trash2 size={16} />
              Remove Profile Picture
            </button>
          )}
        </div>
      </div>

      {/* Profile Details */}
      <div className="grid gap-5 sm:grid-cols-2">

        <div>
          <label className="mb-2 block text-sm font-medium">
            Artisan Name
          </label>
          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleChange}
            required
            className="w-full rounded-lg border border-[#E5E0D8] px-4 py-3 outline-none focus:border-[#8B6248]"
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium">
            Business Name
          </label>
          <input
            type="text"
            name="business_name"
            value={formData.business_name}
            onChange={handleChange}
            required
            className="w-full rounded-lg border border-[#E5E0D8] px-4 py-3 outline-none focus:border-[#8B6248]"
          />
        </div>

        {/* Email with Change Button */}
        <div>
          <label className="mb-2 block text-sm font-medium">
            Email
          </label>

          <div className="flex gap-2">
            <input
              type="email"
              value={profile.email || ""}
              disabled
              className="min-w-0 flex-1 cursor-not-allowed rounded-lg border border-[#E5E0D8] bg-gray-100 px-4 py-3 text-gray-500"
            />

            <button
              type="button"
              onClick={() => navigate("/artisan/change-email")}
              className="shrink-0 rounded-lg bg-[#5C3A2E] px-3 py-2 text-sm font-medium text-white hover:bg-[#30231E]"
            >
              Change
            </button>
          </div>

          <p className="mt-1 text-xs text-gray-500">
            Email changes require OTP verification.
          </p>
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium">
            Phone Number
          </label>
          <input
            type="tel"
            name="phone"
            value={formData.phone}
            onChange={handleChange}
            required
            className="w-full rounded-lg border border-[#E5E0D8] px-4 py-3 outline-none focus:border-[#8B6248]"
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium">
            Craft Type
          </label>
          <input
            type="text"
            name="craft_type"
            value={formData.craft_type}
            onChange={handleChange}
            placeholder="Enter your craft type"
            required
            className="w-full rounded-lg border border-[#E5E0D8] px-4 py-3 outline-none focus:border-[#8B6248]"
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium">
            Location
          </label>
          <input
            type="text"
            name="location"
            value={formData.location}
            onChange={handleChange}
            className="w-full rounded-lg border border-[#E5E0D8] px-4 py-3 outline-none focus:border-[#8B6248]"
          />
        </div>
      </div>

      {/* Bio */}
      <div>
        <label className="mb-2 block text-sm font-medium">
          Bio
        </label>
        <textarea
          name="bio"
          value={formData.bio}
          onChange={handleChange}
          rows={4}
          className="w-full resize-y rounded-lg border border-[#E5E0D8] px-4 py-3 outline-none focus:border-[#8B6248]"
        />
      </div>

      {/* Error Message */}
      {error && (
        <p className="rounded-lg bg-red-50 p-3 text-sm text-red-600">
          {error}
        </p>
      )}

      {/* Action Buttons */}
      <div className="flex flex-wrap justify-end gap-3 border-t border-[#E5E0D8] pt-5">

        <button
          type="button"
          onClick={() => navigate("/artisan/profile")}
          className="rounded-lg border border-[#8B6248] px-5 py-3 text-sm font-medium text-[#5C3A2E] hover:bg-[#F8F4ED]"
        >
          Cancel
        </button>

        <button
          type="submit"
          disabled={saving}
          className="flex items-center gap-2 rounded-lg bg-[#5C3A2E] px-5 py-3 text-sm font-medium text-white hover:bg-[#30231E] disabled:cursor-not-allowed disabled:opacity-60"
        >
          <Save size={16} />
          {saving ? "Saving..." : "Save Changes"}
        </button>

      </div>
    </form>
  );
};

export default ArtisanEditProfileForm;
