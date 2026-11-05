
import React from "react";
import { BrowserRouter, Routes, Route,Navigate } from "react-router-dom";

// Customer Pages
import HomePage from "../pages/HomePage";
import LoginPage from "../pages/LoginPage";
import SignupPage from "../pages/SignupPage";
import OTPVerificationPage from "../pages/OTPVerificationPage";
import ForgotPasswordPage from "../pages/ForgotPasswordPage";
import ResetPasswordPage from "../pages/ResetPasswordPage";
import UserProfilePage from "../pages/UserProfilePage";
import EditProfilePage from "../pages/EditProfilePage";
import ChangePasswordPage from "../pages/ChangePasswordPage";
import AddressManagementPage from "../pages/AddressManagementPage";

// Artisan Pages
import ArtisanDashboardPage from "../pages/ArtisanDashboardPage";
import ArtisanProfilePage from "../pages/ArtisanProfilePage";
import ArtisanEditProfilePage from "../pages/ArtisanEditProfilePage";

// Admin Pages
import AdminLoginPage from "../pages/AdminLoginPage";
import AdminDashboardPage from "../pages/AdminDashboardPage";
import AdminUserManagementPage from "../pages/AdminUserManagementPage";
import AdminArtisanManagementPage from "../pages/AdminArtisanManagementPage";

// Shared Profile Component
import ChangeEmailForm from "../features/profile/ChangeEmailForm";

// Admin Layout
import AdminLayout from "../features/admin/AdminLayout";

export default function AppRoute() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/home" replace />} />
        {/* Customer Routes */}
        <Route path="/home" element={<HomePage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />
        <Route path="/verify-otp" element={<OTPVerificationPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />
        <Route path="/user-profile" element={<UserProfilePage />} />
        <Route path="/edit-profile" element={<EditProfilePage />} />
        <Route path="/change-password" element={<ChangePasswordPage />} />

        {/* Customer Email Change */}
        <Route
          path="/change-email"
          element={<ChangeEmailForm />}
        />

        <Route path="/manage-address" element={<AddressManagementPage />} />

        {/* Artisan Routes */}
        <Route
          path="/artisan-dashboard"
          element={<ArtisanDashboardPage />}
        />

        <Route
          path="/artisan/profile"
          element={<ArtisanProfilePage />}
        />

        <Route
          path="/artisan/profile/edit"
          element={<ArtisanEditProfilePage />}
        />

        {/* Artisan Email Change */}
        <Route
          path="/artisan/change-email"
          element={
            <ChangeEmailForm returnPath="/artisan/profile" />
          }
        />

        {/* Admin Login */}
        <Route
          path="/admin-login"
          element={<AdminLoginPage />}
        />

        {/* Admin Routes */}
        <Route path="/admin" element={<AdminLayout />}>

          <Route
            path="dashboard"
            element={<AdminDashboardPage />}
          />

          <Route
            path="users"
            element={<AdminUserManagementPage />}
          />

          <Route
            path="artisans"
            element={<AdminArtisanManagementPage />}
          />

        </Route>

      </Routes>
    </BrowserRouter>
  );
}
