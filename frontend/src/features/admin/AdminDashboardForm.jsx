
import React, { useEffect, useState } from "react";
import { NavLink } from "react-router-dom";

import {
  LayoutDashboard,
  Users,
  Store,
  Package,
  Tags,
  ShoppingBag,
  CreditCard,
  TrendingUp,
  CalendarDays,
  ArrowRight,
  UserPlus,
  IndianRupee,
  RefreshCw,
} from "lucide-react";

import api from "../../config/axiosInstance";

/* ----------------------------------
   Admin Navigation Items
---------------------------------- */

export const NAV_ITEMS = [
  { label: "Dashboard", icon: LayoutDashboard, path: "/admin/dashboard" },
  { label: "User Management", icon: Users, path: "/admin/users" },
  { label: "Artisan Management", icon: Store, path: "/admin/artisans" },
  { label: "Product Management", icon: Package, path: "/admin/products" },
  { label: "Category Management", icon: Tags, path: "/admin/categories" },
  { label: "Order Management", icon: ShoppingBag, path: "/admin/orders" },
  { label: "Payment Management", icon: CreditCard, path: "/admin/payments" },
  { label: "Stock Management", icon: Package, path: "/admin/stock"},
  {label: "Returns Management",icon: RefreshCw, path: "/admin/returns"},
  
  
];

/* ----------------------------------
   Helpers
---------------------------------- */

const formatDate = (date) => {
  if (!date) return "-";

  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(date));
};

const formatPrice = (price) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(Number(price || 0));

const getFullName = (firstName, lastName, fallback = "User") => {
  const name = `${firstName || ""} ${lastName || ""}`.trim();
  return name || fallback;
};

/* ----------------------------------
   Status Styles
---------------------------------- */

const STATUS_STYLES = {
  Active: "bg-green-50 text-green-700 border-green-200",
  Blocked: "bg-red-50 text-red-700 border-red-200",
  Verified: "bg-green-50 text-green-700 border-green-200",
  Unverified: "bg-amber-50 text-amber-700 border-amber-200",
  APPROVED: "bg-green-50 text-green-700 border-green-200",
  PENDING: "bg-amber-50 text-amber-700 border-amber-200",
  REJECTED: "bg-red-50 text-red-700 border-red-200",
  Published: "bg-green-50 text-green-700 border-green-200",
  Unpublished: "bg-gray-50 text-gray-600 border-gray-200",
};

const ROLE_STYLES = {
  Customer: "bg-[#F8F4ED] text-[#5C3A2E] border-[#5C3A2E]/20",
  Artisan: "bg-[#F8F4ED] text-[#8B6248] border-[#8B6248]/30",
};

/* ----------------------------------
   Helper Components
---------------------------------- */

export const Avatar = ({ name = "Admin", size = "md" }) => {
  const initials = name
    .split(" ")
    .filter(Boolean)
    .map((part) => part[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  const sizeClass =
    size === "sm" ? "h-8 w-8 text-[10px]" : "h-10 w-10 text-sm";

  return (
    <div
      className={`${sizeClass} flex shrink-0 items-center justify-center rounded-full bg-[#5C3A2E] font-semibold text-white`}
    >
      {initials || "U"}
    </div>
  );
};

const StatCard = ({ icon: Icon, title, value, description }) => (
  <div className="rounded-xl border border-[#5C3A2E]/10 bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:shadow-md">
    <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-full bg-[#B87552]/15">
      <Icon className="h-5 w-5 text-[#5C3A2E]" strokeWidth={1.8} />
    </div>

    <p className="mb-1 text-sm text-[#5C3A2E]/70">{title}</p>

    <p className="text-2xl font-bold tracking-tight text-[#30231E]">
      {value ?? 0}
    </p>

    <p className="mt-3 text-xs text-[#8B6248]">{description}</p>
  </div>
);

const StatusBadge = ({ status }) => (
  <span
    className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border px-2.5 py-1 text-xs font-medium ${
      STATUS_STYLES[status] ||
      "border-gray-200 bg-gray-50 text-gray-600"
    }`}
  >
    <span className="h-1.5 w-1.5 rounded-full bg-current" />
    {status}
  </span>
);

/* ----------------------------------
   Main Dashboard Content
---------------------------------- */

const AdminDashboardForm = () => {
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchDashboard = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await api.get("/auth/admin/dashboard/");

      setDashboardData(response.data);
    } catch (err) {
      console.error("Admin dashboard error:", err);

      setError(
        err.response?.data?.detail ||
          err.response?.data?.error ||
          "Unable to load dashboard data. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  const currentDate = new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date());

  const stats = dashboardData?.stats;
  const recentUsers = dashboardData?.recent_users || [];
  const recentArtisans = dashboardData?.recent_artisans || [];
  const recentProducts = dashboardData?.recent_products || [];

  const statCards = stats
    ? [
        {
          icon: Users,
          title: "Total Users",
          value: stats.total_users,
          description: `${stats.active_users} active · ${stats.blocked_users} blocked`,
        },
        {
          icon: Store,
          title: "Total Artisans",
          value: stats.total_artisans,
          description: `${stats.approved_artisans} approved · ${stats.pending_artisans} pending`,
        },
        {
          icon: Package,
          title: "Total Products",
          value: stats.total_products,
          description: `${stats.published_products} published · ${stats.unpublished_products} unpublished`,
        },
        {
          icon: Tags,
          title: "Total Categories",
          value: stats.total_categories,
          description: "Available marketplace categories",
        },
        {
          icon: UserPlus,
          title: "Unverified Users",
          value: stats.unverified_users,
          description: "Users pending email verification",
        },
      ]
    : [];

  return (
    <div className="min-h-screen bg-[#F8F4ED]">
      <main className="space-y-8 px-4 py-6 sm:px-6 lg:px-10 lg:py-8">

        {/* Welcome Section */}

        <section className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-[#B87552]">
              Dashboard
            </p>

            <h1 className="font-serif text-3xl font-bold text-[#30231E] md:text-4xl">
              Welcome, Admin
            </h1>

            <p className="mt-2 text-sm text-[#8B6248]">
              Here's what's happening with your marketplace today.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-3 rounded-lg border border-[#5C3A2E]/10 bg-white px-4 py-3 shadow-sm">
              <CalendarDays className="h-5 w-5 text-[#5C3A2E]" />

              <div>
                <p className="text-sm font-medium text-[#30231E]">
                  Today
                </p>
                <p className="text-xs text-[#8B6248]">{currentDate}</p>
              </div>
            </div>

            <button
              onClick={fetchDashboard}
              disabled={loading}
              className="flex items-center gap-2 rounded-lg border border-[#5C3A2E]/15 bg-white px-4 py-3 text-sm font-medium text-[#5C3A2E] transition hover:bg-[#F8F4ED] disabled:opacity-50"
            >
              <RefreshCw
                className={`h-4 w-4 ${loading ? "animate-spin" : ""}`}
              />
              Refresh
            </button>
          </div>
        </section>

        {/* Loading */}

        {loading && (
          <div className="rounded-xl border border-[#5C3A2E]/10 bg-white p-10 text-center shadow-sm">
            <RefreshCw className="mx-auto mb-3 h-7 w-7 animate-spin text-[#8B6248]" />
            <p className="text-sm text-[#8B6248]">
              Loading dashboard data...
            </p>
          </div>
        )}

        {/* Error */}

        {!loading && error && (
          <div className="rounded-xl border border-red-200 bg-red-50 p-5">
            <p className="font-medium text-red-700">{error}</p>
            <button
              onClick={fetchDashboard}
              className="mt-3 text-sm font-semibold text-red-700 underline"
            >
              Try Again
            </button>
          </div>
        )}

        {/* Dashboard Data */}

        {!loading && !error && dashboardData && (
          <>
            {/* Statistics Cards */}

            <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
              {statCards.map((stat) => (
                <StatCard key={stat.title} {...stat} />
              ))}
            </section>

            {/* Additional Statistics */}

            <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div className="rounded-xl border border-[#5C3A2E]/10 bg-white p-5 shadow-sm">
                <p className="text-sm text-[#8B6248]">Active Users</p>
                <p className="mt-2 text-2xl font-bold text-[#30231E]">
                  {stats.active_users}
                </p>
              </div>

              <div className="rounded-xl border border-[#5C3A2E]/10 bg-white p-5 shadow-sm">
                <p className="text-sm text-[#8B6248]">Blocked Users</p>
                <p className="mt-2 text-2xl font-bold text-[#30231E]">
                  {stats.blocked_users}
                </p>
              </div>

              <div className="rounded-xl border border-[#5C3A2E]/10 bg-white p-5 shadow-sm">
                <p className="text-sm text-[#8B6248]">Pending Artisans</p>
                <p className="mt-2 text-2xl font-bold text-[#30231E]">
                  {stats.pending_artisans}
                </p>
              </div>

              <div className="rounded-xl border border-[#5C3A2E]/10 bg-white p-5 shadow-sm">
                <p className="text-sm text-[#8B6248]">Rejected Artisans</p>
                <p className="mt-2 text-2xl font-bold text-[#30231E]">
                  {stats.rejected_artisans}
                </p>
              </div>
            </section>

            {/* Recent Activity */}

            <section className="grid grid-cols-1 gap-6 2xl:grid-cols-2">

              {/* Recent Users */}

              <div className="min-w-0 rounded-xl border border-[#5C3A2E]/10 bg-white p-4 shadow-sm sm:p-6">
                <div className="mb-5 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <Users className="h-5 w-5 text-[#5C3A2E]" />
                    <h2 className="font-serif text-lg font-semibold text-[#30231E]">
                      Recent User Registrations
                    </h2>
                  </div>

                  <NavLink
                    to="/admin/users"
                    className="flex shrink-0 items-center gap-1 text-xs font-medium text-[#B87552] hover:text-[#5C3A2E]"
                  >
                    View All
                    <ArrowRight className="h-3.5 w-3.5" />
                  </NavLink>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full min-w-[580px] text-sm">
                    <thead>
                      <tr className="border-b border-[#5C3A2E]/10 text-left text-xs text-[#8B6248]">
                        <th className="pb-3 font-medium">ID</th>
                        <th className="pb-3 font-medium">Name</th>
                        <th className="hidden pb-3 font-medium md:table-cell">Email</th>
                        <th className="pb-3 font-medium">Date</th>
                        <th className="pb-3 font-medium">Status</th>
                      </tr>
                    </thead>

                    <tbody className="divide-y divide-[#5C3A2E]/5">
                      {recentUsers.length > 0 ? (
                        recentUsers.map((user) => {
                          const name = getFullName(
                            user.first_name,
                            user.last_name,
                            user.username
                          );

                          return (
                            <tr key={user.id} className="transition hover:bg-[#F8F4ED]/60">
                              <td className="py-3 font-mono text-xs text-[#8B6248]">
                                {user.id}
                              </td>

                              <td className="py-3">
                                <div className="flex items-center gap-2">
                                  <Avatar name={name} size="sm" />
                                  <span className="font-medium text-[#30231E]">
                                    {name}
                                  </span>
                                </div>
                              </td>

                              <td className="hidden py-3 text-xs text-[#8B6248] md:table-cell">
                                {user.email}
                              </td>

                              <td className="py-3 text-xs text-[#8B6248]">
                                {formatDate(user.date_joined)}
                              </td>

                              <td className="py-3">
                                <StatusBadge
                                  status={
                                    user.is_active ? "Active" : "Blocked"
                                  }
                                />
                              </td>
                            </tr>
                          );
                        })
                      ) : (
                        <tr>
                          <td colSpan="5" className="py-6 text-center text-sm text-[#8B6248]">
                            No recent users found.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Recent Artisans */}

              <div className="min-w-0 rounded-xl border border-[#5C3A2E]/10 bg-white p-4 shadow-sm sm:p-6">
                <div className="mb-5 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <Store className="h-5 w-5 text-[#5C3A2E]" />
                    <h2 className="font-serif text-lg font-semibold text-[#30231E]">
                      Recent Artisans
                    </h2>
                  </div>

                  <NavLink
                    to="/admin/artisans"
                    className="flex shrink-0 items-center gap-1 text-xs font-medium text-[#B87552] hover:text-[#5C3A2E]"
                  >
                    View All
                    <ArrowRight className="h-3.5 w-3.5" />
                  </NavLink>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full min-w-[480px] text-sm">
                    <thead>
                      <tr className="border-b border-[#5C3A2E]/10 text-left text-xs text-[#8B6248]">
                        <th className="pb-3 font-medium">Business</th>
                        <th className="pb-3 font-medium">Craft Type</th>
                        <th className="hidden pb-3 font-medium md:table-cell">Email</th>
                        <th className="pb-3 font-medium">Status</th>
                      </tr>
                    </thead>

                    <tbody className="divide-y divide-[#5C3A2E]/5">
                      {recentArtisans.length > 0 ? (
                        recentArtisans.map((artisan) => (
                          <tr key={artisan.id} className="transition hover:bg-[#F8F4ED]/60">
                            <td className="py-3">
                              <div className="flex items-center gap-2">
                                <Avatar name={artisan.business_name} size="sm" />
                                <span className="font-medium text-[#30231E]">
                                  {artisan.business_name}
                                </span>
                              </div>
                            </td>

                            <td className="py-3 text-xs text-[#8B6248]">
                              {artisan.craft_type}
                            </td>

                            <td className="hidden py-3 text-xs text-[#8B6248] md:table-cell">
                              {artisan.user__email || "-"}
                            </td>

                            <td className="py-3">
                              <StatusBadge status={artisan.verification_status} />
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan="4" className="py-6 text-center text-sm text-[#8B6248]">
                            No recent artisans found.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </section>

            {/* Recent Products */}

            <section className="rounded-xl border border-[#5C3A2E]/10 bg-white p-4 shadow-sm sm:p-6">
              <div className="mb-5 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <Package className="h-5 w-5 text-[#5C3A2E]" />
                  <h2 className="font-serif text-lg font-semibold text-[#30231E]">
                    Recent Products
                  </h2>
                </div>

                <NavLink
                  to="/admin/products"
                  className="flex shrink-0 items-center gap-1 text-xs font-medium text-[#B87552] hover:text-[#5C3A2E]"
                >
                  View All
                  <ArrowRight className="h-3.5 w-3.5" />
                </NavLink>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full min-w-[600px] text-sm">
                  <thead>
                    <tr className="border-b border-[#5C3A2E]/10 text-left text-xs text-[#8B6248]">
                      <th className="pb-3 font-medium">Product</th>
                      <th className="pb-3 font-medium">Category</th>
                      <th className="pb-3 font-medium">Artisan</th>
                      <th className="pb-3 font-medium">Price</th>
                      <th className="pb-3 font-medium">Stock</th>
                      <th className="pb-3 font-medium">Status</th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-[#5C3A2E]/5">
                    {recentProducts.length > 0 ? (
                      recentProducts.map((product) => (
                        <tr key={product.id} className="transition hover:bg-[#F8F4ED]/60">
                          <td className="py-3 font-medium text-[#30231E]">
                            {product.name}
                          </td>
                          <td className="py-3 text-xs text-[#8B6248]">
                            {product.category__name}
                          </td>
                          <td className="py-3 text-xs text-[#8B6248]">
                            {product.artisan__business_name}
                          </td>
                          <td className="py-3 font-medium text-[#30231E]">
                            {formatPrice(product.price)}
                          </td>
                          <td className="py-3 text-[#8B6248]">
                            {product.stock}
                          </td>
                          <td className="py-3">
                            <StatusBadge
                              status={
                                product.is_published
                                  ? "Published"
                                  : "Unpublished"
                              }
                            />
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="6" className="py-6 text-center text-sm text-[#8B6248]">
                          No recent products found.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </section>

            {/* Order and Payment Information */}

            <section className="grid grid-cols-1 gap-6 xl:grid-cols-2">
              <div className="rounded-xl border border-[#5C3A2E]/10 bg-white p-6 shadow-sm">
                <div className="mb-4 flex items-center gap-2">
                  <ShoppingBag className="h-5 w-5 text-[#5C3A2E]" />
                  <h2 className="font-serif text-lg font-semibold text-[#30231E]">
                    Order Statistics
                  </h2>
                </div>

                <p className="text-sm text-[#8B6248]">
                  Order statistics are not included in the current dashboard API response.
                </p>

                <NavLink
                  to="/admin/orders"
                  className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-[#B87552] hover:text-[#5C3A2E]"
                >
                  Go to Order Management
                  <ArrowRight className="h-4 w-4" />
                </NavLink>
              </div>

              <div className="rounded-xl border border-[#5C3A2E]/10 bg-white p-6 shadow-sm">
                <div className="mb-4 flex items-center gap-2">
                  <CreditCard className="h-5 w-5 text-[#5C3A2E]" />
                  <h2 className="font-serif text-lg font-semibold text-[#30231E]">
                    Payment Management
                  </h2>
                </div>

                <p className="text-sm text-[#8B6248]">
                  Payment statistics are not included in the current dashboard API response.
                </p>

                <NavLink
                  to="/admin/payments"
                  className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-[#B87552] hover:text-[#5C3A2E]"
                >
                  Go to Payment Management
                  <ArrowRight className="h-4 w-4" />
                </NavLink>
              </div>
            </section>
          </>
        )}

        <p className="pb-4 text-center text-xs text-[#8B6248]/70">
          Craftopia Admin Dashboard
        </p>
      </main>
    </div>
  );
};

export default AdminDashboardForm;
