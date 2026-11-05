
import React, { useState } from "react";
import { useNavigate, Outlet } from "react-router-dom";

import {
  Box,
  X,
  LogOut,
  Menu,
  Search,
  Bell,
  ChevronDown,
} from "lucide-react";

import { NavLink } from "react-router-dom";

import {
  NAV_ITEMS,
  Avatar,
} from "./AdminDashboardForm";

const AdminLayout = () => {
  const navigate = useNavigate();

  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  let adminUser = {};

  try {
    adminUser = JSON.parse(
      localStorage.getItem("adminUser") || "{}"
    );
  } catch {
    adminUser = {};
  }

  const adminName = adminUser.name || "Admin";
  const adminEmail = adminUser.email || "";

  const handleLogout = () => {
    localStorage.removeItem("access");
    localStorage.removeItem("refresh");
    localStorage.removeItem("userRole");
    localStorage.removeItem("adminUser");

    navigate("/admin-login", { replace: true });
  };

  return (
    <div className="min-h-screen bg-[#F8F4ED]">

      {/* Mobile Sidebar Overlay */}
      {mobileOpen && (
        <button
          type="button"
          aria-label="Close navigation"
          className="fixed inset-0 z-40 bg-black/40 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed left-0 top-0 z-50 flex h-screen w-64 flex-col bg-[#30231E] text-white transition-transform duration-300 ${
          mobileOpen
            ? "translate-x-0"
            : "-translate-x-full"
        } lg:translate-x-0`}
      >
        {/* Logo */}
        <div className="flex items-center justify-between border-b border-white/10 px-6 py-6">

          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#5C3A2E]">
              <Box className="h-5 w-5 text-white" />
            </div>

            <div>
              <h1 className="font-serif text-lg font-bold tracking-wide">
                Craftopia
              </h1>

              <p className="text-[10px] uppercase tracking-widest text-white/60">
                Admin Panel
              </p>
            </div>
          </div>

          <button
            type="button"
            className="rounded-md p-1 text-white/70 hover:bg-white/10 lg:hidden"
            onClick={() => setMobileOpen(false)}
            aria-label="Close sidebar"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-1 overflow-y-auto px-4 py-6">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;

            return (
              <NavLink
                key={item.path}
                to={item.path}
                end={item.path === "/admin/dashboard"}
                onClick={() => setMobileOpen(false)}
                className={({ isActive }) =>
                  `flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium transition-colors ${
                    isActive
                      ? "bg-[#5C3A2E] text-white shadow-md"
                      : "text-white/70 hover:bg-white/10 hover:text-white"
                  }`
                }
              >
                <Icon
                  className="h-5 w-5 shrink-0"
                  strokeWidth={1.8}
                />

                <span>{item.label}</span>
              </NavLink>
            );
          })}
        </nav>

        {/* Logout */}
        <div className="px-4 pb-3">
          <button
            type="button"
            onClick={handleLogout}
            className="flex w-full items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium text-white/70 transition hover:bg-white/10 hover:text-white"
          >
            <LogOut className="h-5 w-5" />
            <span>Logout</span>
          </button>
        </div>

        {/* Footer */}
        <div className="px-6 pb-6 text-[11px] italic text-white/40">
          Handmade with Love,
          <br />
          Made to Last.
        </div>
      </aside>

      {/* Main Area */}
      <div className="min-h-screen lg:ml-64">

        {/* Top Navbar */}
        <header className="sticky top-0 z-30 border-b border-[#5C3A2E]/10 bg-[#F8F4ED]/95 backdrop-blur-md">

          <div className="flex min-h-[76px] items-center justify-between gap-3 px-4 py-3 sm:px-6 lg:px-10">

            <div className="flex min-w-0 flex-1 items-center gap-3">

              {/* Mobile Menu Button */}
              <button
                type="button"
                onClick={() => setMobileOpen(true)}
                className="rounded-lg p-2 text-[#5C3A2E] hover:bg-white lg:hidden"
                aria-label="Open navigation"
              >
                <Menu className="h-5 w-5" />
              </button>

              {/* Search */}
              <div className="relative w-full max-w-xl">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#8B6248]" />

                <input
                  type="search"
                  value={searchTerm}
                  onChange={(event) =>
                    setSearchTerm(event.target.value)
                  }
                  placeholder="Search users or orders..."
                  className="w-full rounded-lg border border-[#5C3A2E]/10 bg-white py-2.5 pl-10 pr-4 text-sm text-[#30231E] outline-none transition placeholder:text-[#8B6248]/60 focus:border-[#B87552] focus:ring-2 focus:ring-[#B87552]/20"
                />
              </div>
            </div>

            {/* Admin Profile */}
            <div className="flex shrink-0 items-center gap-2 sm:gap-4">

              <button
                type="button"
                className="relative rounded-lg p-2 text-[#5C3A2E] transition hover:bg-white"
                aria-label="Notifications"
              >
                <Bell className="h-5 w-5" />

                <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-[#B87552] ring-2 ring-[#F8F4ED]" />
              </button>

              <div className="flex items-center gap-2 sm:gap-3">
                <Avatar name={adminName} size="sm" />

                <div className="hidden sm:block">
                  <span className="block text-sm font-medium text-[#30231E]">
                    {adminName}
                  </span>

                  {adminEmail && (
                    <span className="block text-xs text-[#8B6248]">
                      {adminEmail}
                    </span>
                  )}
                </div>

                <ChevronDown className="h-4 w-4 text-[#8B6248]" />
              </div>
            </div>

          </div>
        </header>

        {/* Nested Route Content */}
        <main>
          <Outlet />
        </main>

      </div>
    </div>
  );
};

export default AdminLayout;
