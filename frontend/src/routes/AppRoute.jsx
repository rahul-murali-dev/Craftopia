
import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

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
import ProductListPage from "../pages/ProductListPage";
import ProductDetailPage from "../pages/ProductDetailPage";
import CartPage from "../pages/CartPage";
import WishlistPage from "../pages/WishlistPage";
import PublicArtisanProfilePage from "../pages/PublicArtisanProfilePage";
import ArtisanListPage from "../pages/ArtisanListPage";
import CheckoutPage from "../pages/CheckoutPage";
import OrderConfirmationPage from "../pages/OrderConfirmationPage";
import MyOrdersPage from "../pages/MyOrdersPage";
import OrderDetailPage from "../pages/OrderDetailPage";

// Artisan Pages
import ArtisanDashboardPage from "../pages/ArtisanDashboardPage";
import ArtisanProfilePage from "../pages/ArtisanProfilePage";
import ArtisanEditProfilePage from "../pages/ArtisanEditProfilePage";
import ProductManagementPage from "../pages/ProductManagementPage";
import MyProductsPage from "../pages/MyProductsPage";
import ArtisanOrderRequestsPage from "../pages/ArtisanOrderRequestsPage";

// Admin Pages
import AdminLoginPage from "../pages/AdminLoginPage";
import AdminDashboardPage from "../pages/AdminDashboardPage";
import AdminUserManagementPage from "../pages/AdminUserManagementPage";
import AdminArtisanManagementPage from "../pages/AdminArtisanManagementPage";
import CategoryManagementPage from "../pages/CategoryManagementPage";
import AdminProductManagementPage from "../pages/AdminProductManagementPage";
import AdminOrdersPage from "../pages/AdminOrdersPage";
import AdminOrderDetailPage from "../pages/AdminOrderDetailPage";
import AdminReturnsPage from "../pages/AdminReturnsPage";
import AdminStockPage from "../pages/AdminStockPage";
import AdminPaymentsPage from "../pages/AdminPaymentsPage";
import AdminCouponManagementPage from "../pages/AdminCouponManagementPage";

// Shared Profile Component
import ChangeEmailForm from "../features/profile/ChangeEmailForm";

// Admin Layout
import AdminLayout from "../features/admin/AdminLayout";

// Redirect logged-in users away from Login and Signup pages
function GuestOnlyRoute({ children }) {
  const accessToken = localStorage.getItem("access");
  const userRole = localStorage.getItem("userRole")?.toLowerCase();

  if (accessToken && userRole === "customer") {
    return <Navigate to="/home" replace />;
  }

  if (accessToken && userRole === "artisan") {
    return <Navigate to="/artisan-dashboard" replace />;
  }

  if (accessToken && userRole === "admin") {
    return <Navigate to="/admin/dashboard" replace />;
  }

  return children;
}

export default function AppRoute() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/home" replace />} />

        {/* Customer Routes */}
        <Route path="/home" element={<HomePage />} />
        <Route
          path="/login"
          element={
            <GuestOnlyRoute>
              <LoginPage />
            </GuestOnlyRoute>
          }
        />
        <Route
          path="/signup"
          element={
            <GuestOnlyRoute>
              <SignupPage />
            </GuestOnlyRoute>
          }
        />
        <Route path="/verify-otp" element={<OTPVerificationPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />
        <Route path="/user-profile" element={<UserProfilePage />} />
        <Route path="/edit-profile" element={<EditProfilePage />} />
        <Route path="/change-password" element={<ChangePasswordPage />} />
        <Route path="/change-email" element={<ChangeEmailForm />} />
        <Route path="/manage-address" element={<AddressManagementPage />} />
        <Route path="/products" element={<ProductListPage />} />
        <Route path="/products/:id" element={<ProductDetailPage />} />
        <Route path="/cart" element={<CartPage />} />
        <Route path="/wishlist" element={<WishlistPage />} />
        <Route path="/artisans/:id" element={<PublicArtisanProfilePage />} />
        <Route path="/artisans" element={<ArtisanListPage />} />
        <Route path="/checkout" element={<CheckoutPage />} />
        <Route
          path="/order-confirmation"
          element={<OrderConfirmationPage />}
        />
        <Route path="/my-orders" element={<MyOrdersPage />} />
        <Route path="/my-orders/:id" element={<OrderDetailPage />} />

        {/* Artisan Routes */}
        <Route
          path="/artisan-dashboard"
          element={<ArtisanDashboardPage />}
        />
        <Route path="/artisan/profile" element={<ArtisanProfilePage />} />
        <Route
          path="/artisan/profile/edit"
          element={<ArtisanEditProfilePage />}
        />
        <Route
          path="/artisan/change-email"
          element={<ChangeEmailForm returnPath="/artisan/profile" />}
        />
        <Route
          path="/artisan/products/add"
          element={<ProductManagementPage />}
        />
        <Route path="/artisan/products" element={<MyProductsPage />} />
        <Route
          path="/artisan/products/:id/edit"
          element={<ProductManagementPage />}
        />
        <Route
          path="/artisan/orders"
          element={<ArtisanOrderRequestsPage />}
        />

        {/* Admin Login */}
        <Route path="/admin-login" element={<AdminLoginPage />} />

        {/* Admin Routes */}
        <Route path="/admin" element={<AdminLayout />}>
          <Route path="dashboard" element={<AdminDashboardPage />} />
          <Route path="users" element={<AdminUserManagementPage />} />
          <Route path="artisans" element={<AdminArtisanManagementPage />} />
          <Route path="categories" element={<CategoryManagementPage />} />
          <Route path="products" element={<AdminProductManagementPage />} />
          <Route path="orders" element={<AdminOrdersPage />} />
          <Route path="orders/:id" element={<AdminOrderDetailPage />} />
          <Route path="returns" element={<AdminReturnsPage />} />
          <Route path="stock" element={<AdminStockPage />} />
          <Route path="payments" element={<AdminPaymentsPage />} />
          <Route path="coupons" element={<AdminCouponManagementPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
