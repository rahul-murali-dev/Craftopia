
import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import {
  UserRound,
  MapPin,
  LockKeyhole,
  Mail,
  LogOut,
  ChevronRight,
  ArrowLeft,
} from "lucide-react";
import api from "../config/axiosInstance";

export default function UserProfilePage() {
  const navigate = useNavigate();

  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  // Fetch user profile from backend
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await api.get("/auth/profile/");
        setProfile(response.data);
      } catch (error) {
        console.error("Failed to fetch profile:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, []);

  // Logout
  const handleLogout = async () => {
    try {
      await api.post("/auth/logout/");
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      localStorage.removeItem("access");
      localStorage.removeItem("refresh");
      navigate("/login");
    }
  };

  const profileOptions = [
    {
      title: "Edit Profile",
      description: "Update your personal information",
      icon: UserRound,
      onClick: () => navigate("/edit-profile"),
    },
    {
      title: "Manage Addresses",
      description: "Manage your delivery addresses",
      icon: MapPin,
      onClick: () => navigate("/manage-address"),
    },
    {
      title: "Change Password",
      description: "Keep your account secure",
      icon: LockKeyhole,
      onClick: () => navigate("/change-password"),
    },
    {
      title: "Change Email",
      description: "Update your email address",
      icon: Mail,
      onClick: () => navigate("/change-email"),
    },
  ];

  return (
    <div className="min-h-screen bg-[#F8F4ED] px-4 py-8">
      <div className="mx-auto max-w-2xl">

        {/* Back to Home */}
        <button
          onClick={() => navigate("/home")}
          className="mb-6 flex items-center gap-2 text-sm font-medium text-[#5C3A2E] hover:underline"
        >
          <ArrowLeft size={18} />
          Back to Home
        </button>

        <div className="overflow-hidden rounded-2xl bg-white shadow-sm">

          {/* Profile Header */}
          <div className="bg-[#5C3A2E] px-6 py-8 text-center">

            {/* Profile Image */}
            <div className="mx-auto flex h-20 w-20 items-center justify-center overflow-hidden rounded-full bg-[#F8F4ED]">

              {loading ? (
                <div className="h-full w-full animate-pulse bg-gray-200" />
              ) : profile?.profile_image ? (
                <img
                  src={profile.profile_image}
                  alt="Profile"
                  className="h-full w-full object-cover"
                />
              ) : (
                <UserRound
                  size={36}
                  className="text-[#5C3A2E]"
                />
              )}

            </div>

            <h1 className="mt-4 font-serif text-2xl font-bold text-white">
              My Profile
            </h1>

            <p className="mt-2 text-sm text-white/80">
              Manage your Craftopia account
            </p>

          </div>

          {/* Account Settings */}
          <div className="p-5 sm:p-6">

            <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-[#8B6248]">
              Account Settings
            </h2>

            <div className="space-y-3">

              {profileOptions.map((option) => {
                const Icon = option.icon;

                return (
                  <button
                    key={option.title}
                    onClick={option.onClick}
                    className="flex w-full items-center gap-4 rounded-xl border border-[#5C3A2E]/10 p-4 text-left transition hover:bg-[#F8F4ED]"
                  >
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#F8F4ED]">
                      <Icon
                        size={21}
                        className="text-[#5C3A2E]"
                      />
                    </div>

                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-[#30231E]">
                        {option.title}
                      </p>

                      <p className="mt-1 text-sm text-gray-500">
                        {option.description}
                      </p>
                    </div>

                    <ChevronRight
                      size={20}
                      className="shrink-0 text-[#8B6248]"
                    />
                  </button>
                );
              })}

            </div>

            <div className="my-6 border-t border-gray-100" />

            {/* Logout Button */}
            <button
              onClick={() => setShowLogoutConfirm(true)}
              className="flex w-full items-center gap-4 rounded-xl border border-red-100 p-4 text-left transition hover:bg-red-50"
            >
              <div className="flex h-11 w-11 items-center justify-center rounded-full bg-red-50">
                <LogOut
                  size={21}
                  className="text-red-600"
                />
              </div>

              <div className="flex-1">
                <p className="font-semibold text-red-600">
                  Logout
                </p>

                <p className="mt-1 text-sm text-gray-500">
                  Sign out of your Craftopia account
                </p>
              </div>

              <ChevronRight
                size={20}
                className="text-red-400"
              />
            </button>

          </div>
        </div>
      </div>

      {/* Logout Confirmation Popup */}
      {showLogoutConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="logout-title"
            className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl"
          >

            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-[#5C3A2E]/10">
              <LogOut
                size={28}
                className="text-[#5C3A2E]"
              />
            </div>

            <h2
              id="logout-title"
              className="text-center text-xl font-semibold text-[#30231E]"
            >
              Ready to leave?
            </h2>

            <p className="mt-2 text-center text-sm leading-6 text-gray-600">
              Are you sure you want to log out of your Craftopia account?
            </p>

            <div className="mt-6 flex gap-3">

              <button
                onClick={() => setShowLogoutConfirm(false)}
                className="flex-1 rounded-xl border border-gray-300 px-4 py-3 font-medium text-gray-700 transition hover:bg-gray-50"
              >
                Cancel
              </button>

              <button
                onClick={handleLogout}
                className="flex-1 rounded-xl bg-[#5C3A2E] px-4 py-3 font-medium text-white transition hover:bg-[#43291F]"
              >
                Yes, Log Out
              </button>

            </div>
          </div>
        </div>
      )}

    </div>
  );
}
