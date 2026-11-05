
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Pencil,
  MapPin,
  Phone,
  Store,
  Palette,
} from "lucide-react";
import api from "../config/axiosInstance";

const ArtisanProfilePage = () => {
  const navigate = useNavigate();

  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await api.get("/artisans/me/");
        setProfile(response.data);
      } catch (error) {
        console.error("Failed to fetch artisan profile:", error);
        setError("Unable to load profile.");
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

  const Detail = ({ icon: Icon, label, value }) => (
    <div className="flex items-start gap-3">
      <div className="rounded-lg bg-[#F8F4ED] p-2 text-[#8B6248]">
        <Icon size={19} />
      </div>

      <div>
        <p className="text-xs font-semibold uppercase tracking-wider text-[#8B6248]">
          {label}
        </p>

        <p className="mt-1 text-base text-[#30231E]">
          {value || "Not provided"}
        </p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#F8F4ED] font-sans text-[#30231E]">

      {/* Header */}
      <header className="border-b border-[#E5E0D8] bg-white">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-5 sm:px-6">

          <button
            type="button"
            onClick={() => navigate("/artisan-dashboard")}
            className="flex items-center gap-2 text-sm font-medium text-[#5C3A2E] hover:text-[#30231E]"
          >
            <ArrowLeft size={18} />
            Back to Dashboard
          </button>

          <button
            type="button"
            onClick={() => navigate("/artisan/profile/edit")}
            className="flex items-center gap-2 rounded-lg bg-[#5C3A2E] px-4 py-2 text-sm font-medium text-white transition hover:bg-[#30231E]"
          >
            <Pencil size={16} />
            Edit Profile
          </button>

        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
        <div className="rounded-2xl border border-[#E5E0D8] bg-white p-6 shadow-sm sm:p-8">

          {/* Profile Header */}
          <div className="mb-8 flex flex-wrap items-center gap-5">

            {profile.profile_image ? (
              <img
                src={profile.profile_image}
                alt="Artisan Profile"
                className="h-24 w-24 rounded-full border-2 border-[#E5E0D8] object-cover"
              />
            ) : (
              <div className="flex h-24 w-24 items-center justify-center rounded-full bg-[#5C3A2E] font-serif text-3xl text-white">
                {profile.name?.charAt(0)?.toUpperCase() || "A"}
              </div>
            )}

            <div>
              <h1 className="font-serif text-3xl font-bold text-[#30231E]">
                {profile.name || "Artisan"}
              </h1>

              <p className="mt-1 text-sm text-[#8B6248]">
                {profile.email}
              </p>

              {/* Change Email Button */}
              <button
                type="button"
                onClick={() => navigate("/artisan/change-email")}
                className="mt-2 text-sm font-semibold text-[#8B6248] hover:underline"
              >
                Change Email
              </button>

              <div>
                <span className="mt-3 inline-block rounded-full bg-green-50 px-3 py-1 text-xs font-semibold text-green-700">
                  {profile.status}
                </span>
              </div>
            </div>

          </div>

          <div className="mb-6 border-t border-[#E5E0D8]" />

          {/* Business Details */}
          <h2 className="mb-5 font-serif text-xl font-bold">
            Business Information
          </h2>

          <div className="grid gap-6 sm:grid-cols-2">

            <Detail
              icon={Store}
              label="Business Name"
              value={profile.business_name}
            />

            <Detail
              icon={Palette}
              label="Craft Type"
              value={profile.craft_type}
            />

            <Detail
              icon={Phone}
              label="Phone Number"
              value={profile.phone}
            />

            <Detail
              icon={MapPin}
              label="Location"
              value={profile.location}
            />

          </div>

          {/* Bio */}
          <div className="mt-8 border-t border-[#E5E0D8] pt-6">
            <h2 className="mb-3 font-serif text-xl font-bold">
              About Artisan
            </h2>

            <p className="whitespace-pre-wrap text-sm leading-7 text-[#5C3A2E]">
              {profile.bio || "No bio added yet."}
            </p>
          </div>

        </div>
      </main>
    </div>
  );
};

export default ArtisanProfilePage;
