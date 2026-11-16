
import { useEffect, useState, useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import api from "../../config/axiosInstance";

const navLinks = [
  { label: "Home", href: "/home" },
  { label: "Explore Crafts", href: "/products" },
  { label: "Meet Our Artisans", href: "/artisans" },
];

export default function Header() {
  const navigate = useNavigate();
  const location = useLocation();

  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  const activePath = location.pathname;

  const [isLoggedIn, setIsLoggedIn] = useState(
    () => !!localStorage.getItem("access")
  );

  const [wishlistCount, setWishlistCount] = useState(0);
  const [cartCount, setCartCount] = useState(0);

  // Show My Orders only for logged-in customers
  const isCustomer =
    localStorage.getItem("userRole")?.toUpperCase() === "CUSTOMER";

  const visibleNavLinks =
    isLoggedIn && isCustomer
      ? [...navLinks, { label: "My Orders", href: "/my-orders" }]
      : navLinks;

  // Fetch Wishlist Count
  const fetchWishlistCount = useCallback(async () => {
    if (!localStorage.getItem("access")) {
      setWishlistCount(0);
      return;
    }

    try {
      const response = await api.get("/products/wishlist/");

      const wishlistItems = Array.isArray(response.data)
        ? response.data
        : response.data.results || [];

      setWishlistCount(wishlistItems.length);
    } catch (error) {
      console.error("Wishlist count fetch error:", error);

      if (error.response?.status === 401) {
        setWishlistCount(0);
      }
    }
  }, []);

  // Fetch Cart Count
  const fetchCartCount = useCallback(async () => {
    if (!localStorage.getItem("access")) {
      setCartCount(0);
      return;
    }

    try {
      const response = await api.get("/products/cart/");

      const cart = response.data;

      if (typeof cart.total_items === "number") {
        setCartCount(cart.total_items);
      } else {
        const items = cart.items || [];

        const totalQuantity = items.reduce(
          (total, item) => total + Number(item.quantity || 0),
          0
        );

        setCartCount(totalQuantity);
      }
    } catch (error) {
      console.error("Cart count fetch error:", error);

      if (error.response?.status === 401) {
        setCartCount(0);
      }
    }
  }, []);

  // Fetch counts when Header loads or route changes
  useEffect(() => {
    setIsLoggedIn(!!localStorage.getItem("access"));

    fetchWishlistCount();
    fetchCartCount();
  }, [location.pathname, fetchWishlistCount, fetchCartCount]);

  // Listen for Wishlist updates
  useEffect(() => {
    const handleWishlistUpdate = () => {
      fetchWishlistCount();
    };

    window.addEventListener("wishlistUpdated", handleWishlistUpdate);

    return () => {
      window.removeEventListener("wishlistUpdated", handleWishlistUpdate);
    };
  }, [fetchWishlistCount]);

  // Listen for Cart updates
  useEffect(() => {
    const handleCartUpdate = () => {
      fetchCartCount();
    };

    window.addEventListener("cartUpdated", handleCartUpdate);

    return () => {
      window.removeEventListener("cartUpdated", handleCartUpdate);
    };
  }, [fetchCartCount]);

  const handleNavigation = (path) => {
    setMobileOpen(false);
    navigate(path);
  };

  // Search Products
  const handleSearch = (e) => {
    e.preventDefault();

    const searchValue = searchTerm.trim();

    if (!searchValue) return;

    setSearchOpen(false);
    setSearchTerm("");
    setMobileOpen(false);

    navigate(`/products?search=${encodeURIComponent(searchValue)}`);
  };

  const handleLogout = async () => {
    try {
      await api.post("/auth/logout/");
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      localStorage.removeItem("access");
      localStorage.removeItem("refresh");

      setIsLoggedIn(false);
      setWishlistCount(0);
      setCartCount(0);
      setMobileOpen(false);

      navigate("/home");
    }
  };

  return (
    <header className="sticky top-0 z-50 bg-[#F8F4ED]/95 backdrop-blur-md border-b border-[#5C3A2E]/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        <div className="flex items-center justify-between h-16 lg:h-20">

          {/* Logo */}
          <button
            onClick={() => handleNavigation("/home")}
            className="flex items-center gap-2 shrink-0"
          >
            <div className="w-9 h-9 rounded-full bg-[#5C3A2E] flex items-center justify-center">
              <svg
                className="w-5 h-5 text-[#F8F4ED]"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"
                />
              </svg>
            </div>

            <span className="font-serif text-xl lg:text-2xl font-bold text-[#30231E] tracking-tight">
              Craftopia
            </span>
          </button>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-1">
            {visibleNavLinks.map((link) => {
              const isActive = activePath === link.href;

              return (
                <button
                  key={link.label}
                  onClick={() => handleNavigation(link.href)}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
                    isActive
                      ? "bg-[#5C3A2E] text-[#F8F4ED]"
                      : "text-[#30231E]/80 hover:text-[#30231E] hover:bg-[#5C3A2E]/10"
                  }`}
                >
                  {link.label}
                </button>
              );
            })}
          </nav>

          {/* Right Actions */}
          <div className="flex items-center gap-1">

            {/* Search */}
            <button
              aria-label="Search"
              onClick={() => setSearchOpen(!searchOpen)}
              className="w-10 h-10 rounded-full flex items-center justify-center text-[#30231E]/70 hover:text-[#30231E] hover:bg-[#5C3A2E]/10 transition-colors"
            >
              {searchOpen ? (
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2}
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              ) : (
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2}
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
              )}
            </button>

            {/* Cart */}
            <button
              aria-label={`Shopping Cart, ${cartCount} items`}
              onClick={() => handleNavigation("/cart")}
              className="w-10 h-10 rounded-full flex items-center justify-center text-[#30231E]/70 hover:text-[#5C3A2E] hover:bg-[#5C3A2E]/10 transition-colors relative"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M3 3h2l2.4 12.4a2 2 0 002 1.6h8.8a2 2 0 002-1.6L22 7H6"
                />
                <circle cx="10" cy="21" r="1" />
                <circle cx="19" cy="21" r="1" />
              </svg>

              <span className="absolute top-1.5 right-1.5 min-w-4 h-4 px-1 bg-[#5C3A2E] text-[#F8F4ED] text-[10px] font-bold rounded-full flex items-center justify-center">
                {cartCount > 99 ? "99+" : cartCount}
              </span>
            </button>

            {/* Wishlist */}
            <button
              aria-label={`Wishlist, ${wishlistCount} items`}
              onClick={() => handleNavigation("/wishlist")}
              className="w-10 h-10 rounded-full flex items-center justify-center text-[#30231E]/70 hover:text-[#B87552] hover:bg-[#B87552]/10 transition-colors relative"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                />
              </svg>

              <span className="absolute top-1.5 right-1.5 min-w-4 h-4 px-1 bg-[#B87552] text-[#F8F4ED] text-[10px] font-bold rounded-full flex items-center justify-center">
                {wishlistCount > 99 ? "99+" : wishlistCount}
              </span>
            </button>

            {/* Login / Signup OR Profile / Logout */}
            {!isLoggedIn ? (
              <div className="hidden sm:flex items-center gap-2 ml-2">
                <button
                  onClick={() => handleNavigation("/login")}
                  className="px-4 py-2 text-sm font-medium text-[#5C3A2E] hover:bg-[#5C3A2E]/10 rounded-full transition"
                >
                  Login
                </button>

                <button
                  onClick={() => handleNavigation("/signup")}
                  className="px-5 py-2 text-sm font-medium bg-[#5C3A2E] text-[#F8F4ED] rounded-full hover:bg-[#8B6248] transition"
                >
                  Sign Up
                </button>
              </div>
            ) : (
              <div className="hidden sm:flex items-center gap-2">
                <button
                  aria-label="User profile"
                  onClick={() => handleNavigation("/user-profile")}
                  className="w-10 h-10 rounded-full flex items-center justify-center text-[#30231E]/70 hover:text-[#30231E] hover:bg-[#5C3A2E]/10 transition-colors"
                >
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={2}
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                    />
                  </svg>
                </button>

                <button
                  onClick={handleLogout}
                  className="px-4 py-2 text-sm font-medium text-[#5C3A2E] hover:bg-[#5C3A2E]/10 rounded-full"
                >
                  Logout
                </button>
              </div>
            )}

            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="md:hidden w-10 h-10 rounded-full flex items-center justify-center text-[#30231E]/70 hover:text-[#30231E] hover:bg-[#5C3A2E]/10 transition-colors"
              aria-label="Toggle menu"
            >
              {mobileOpen ? (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              ) : (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              )}
            </button>
          </div>
        </div>

        {/* Search Form */}
        {searchOpen && (
          <form
            onSubmit={handleSearch}
            className="pb-4 pt-2 flex items-center gap-3"
          >
            <div className="flex-1 flex items-center gap-3 bg-white border border-[#5C3A2E]/20 rounded-full px-4 py-3 shadow-sm">
              <svg
                className="w-5 h-5 text-[#8B6248]"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>

              <input
                type="search"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search handmade products..."
                autoFocus
                className="flex-1 outline-none bg-transparent text-sm text-[#30231E] placeholder:text-[#8B6248]/60"
              />
            </div>

            <button
              type="submit"
              disabled={!searchTerm.trim()}
              className="px-6 py-3 bg-[#5C3A2E] text-white rounded-full text-sm font-medium hover:bg-[#8B6248] transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Search
            </button>
          </form>
        )}

        {/* Mobile Navigation */}
        {mobileOpen && (
          <nav className="md:hidden pb-4 border-t border-[#5C3A2E]/10 pt-3 flex flex-col gap-1">

            {visibleNavLinks.map((link) => {
              const isActive = activePath === link.href;

              return (
                <button
                  key={link.label}
                  onClick={() => handleNavigation(link.href)}
                  className={`text-left px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                    isActive
                      ? "bg-[#5C3A2E] text-[#F8F4ED]"
                      : "text-[#30231E]/80 hover:bg-[#5C3A2E]/10"
                  }`}
                >
                  {link.label}
                </button>
              );
            })}

            {/* Mobile Cart */}
            <button
              onClick={() => handleNavigation("/cart")}
              className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-[#30231E]/80 hover:bg-[#5C3A2E]/10 transition-all"
            >
              <span className="text-[#5C3A2E]">🛒</span>
              Shopping Cart

              <span className="ml-auto min-w-5 h-5 px-1 bg-[#5C3A2E] text-[#F8F4ED] text-[10px] font-bold rounded-full flex items-center justify-center">
                {cartCount > 99 ? "99+" : cartCount}
              </span>
            </button>

            {/* Mobile Wishlist */}
            <button
              onClick={() => handleNavigation("/wishlist")}
              className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-[#30231E]/80 hover:bg-[#B87552]/10 transition-all"
            >
              <span className="text-[#B87552]">♡</span>
              Wishlist

              <span className="ml-auto min-w-5 h-5 px-1 bg-[#B87552] text-[#F8F4ED] text-[10px] font-bold rounded-full flex items-center justify-center">
                {wishlistCount > 99 ? "99+" : wishlistCount}
              </span>
            </button>

            {/* Mobile Authentication */}
            {!isLoggedIn ? (
              <>
                <button
                  onClick={() => handleNavigation("/login")}
                  className="text-left px-4 py-3 rounded-xl text-sm font-medium text-[#5C3A2E] hover:bg-[#5C3A2E]/10"
                >
                  Login
                </button>

                <button
                  onClick={() => handleNavigation("/signup")}
                  className="text-left px-4 py-3 rounded-xl text-sm font-medium bg-[#5C3A2E] text-[#F8F4ED]"
                >
                  Sign Up
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() => handleNavigation("/user-profile")}
                  className="text-left px-4 py-3 rounded-xl text-sm font-medium text-[#5C3A2E] hover:bg-[#5C3A2E]/10"
                >
                  My Profile
                </button>

                <button
                  onClick={handleLogout}
                  className="text-left px-4 py-3 rounded-xl text-sm font-medium text-[#5C3A2E] hover:bg-[#5C3A2E]/10"
                >
                  Logout
                </button>
              </>
            )}
          </nav>
        )}
      </div>
    </header>
  );
}
