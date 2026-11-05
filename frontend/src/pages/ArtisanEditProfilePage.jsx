import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import api from "../config/axiosInstance";
import ArtisanEditProfileForm from "../features/artisan/ArtisanEditProfileForm";

const ArtisanEditProfilePage = () => {
  const navigate = useNavigate();

  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await api.get("/artisans/me/");
        setProfile(response.data);
      } catch (err) {
        console.error("Failed to fetch artisan profile:", err);
        setError("Unable to load profile details.");
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, []);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#F8F4ED]">
        <p className="text-[#8B6248]">Loading profile...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#F8F4ED]">
        <p className="text-red-600">{error}</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8F4ED] font-sans text-[#30231E]">
      <header className="border-b border-[#E5E0D8] bg-white">
        <div className="mx-auto flex max-w-5xl items-center px-4 py-5 sm:px-6">
          <button
            type="button"
            onClick={() => navigate("/artisan/profile")}
            className="flex items-center gap-2 text-sm font-medium text-[#5C3A2E] hover:text-[#30231E]"
          >
            <ArrowLeft size={18} />
            Back to Profile
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
        <div className="mb-6">
          <h1 className="font-serif text-3xl font-bold text-[#30231E]">
            Edit Artisan Profile
          </h1>
          <p className="mt-2 text-sm text-[#8B6248]">
            Update your personal and business information.
          </p>
        </div>

        <div className="rounded-2xl border border-[#E5E0D8] bg-white p-6 shadow-sm sm:p-8">
          <ArtisanEditProfileForm profile={profile} />
        </div>
      </main>
    </div>
  );
};

export default ArtisanEditProfilePage;