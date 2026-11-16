
import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  Search,
  SlidersHorizontal,
  X,
  ChevronLeft,
  ChevronRight,
  Heart,
} from "lucide-react";
import Header from "../components/layout/Header";
import Footer from "../components/layout/Footer";
import CustomAlert from "../components/ui/CustomAlert";
import api from "../config/axiosInstance";

const IMAGE_BASE_URL = "http://localhost:8000";

export default function ProductListPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [searchInput, setSearchInput] = useState(
    () => searchParams.get("search") || "",
  );

  const [search, setSearch] = useState(
    () => searchParams.get("search") || "",
  );

  const [ordering, setOrdering] = useState("-created_at");

  const [selectedCategory, setSelectedCategory] = useState(
    () => searchParams.get("category") || "",
  );

  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [page, setPage] = useState(1);

  const [wishlistItems, setWishlistItems] = useState([]);
  const [wishlistLoading, setWishlistLoading] = useState({});

  const [pagination, setPagination] = useState({
    count: 0,
    next: null,
    previous: null,
  });

  // Custom Alert State
  const [popup, setPopup] = useState({
    isOpen: false,
    type: "info",
    title: "",
    message: "",
    onConfirm: null,
  });

  // Show Custom Alert
  const showPopup = (type, title, message, onConfirm = null) => {
    setPopup({
      isOpen: true,
      type,
      title,
      message,
      onConfirm,
    });
  };

  // Close Custom Alert
  const closePopup = () => {
    setPopup({
      isOpen: false,
      type: "info",
      title: "",
      message: "",
      onConfirm: null,
    });
  };

  // Fetch Categories
  const fetchCategories = async () => {
    try {
      const response = await api.get("/products/public/categories/");
      setCategories(response.data);
    } catch (err) {
      console.error("Category fetch error:", err);
    }
  };

  // Fetch Wishlist
  const fetchWishlist = async () => {
    const token = localStorage.getItem("access");

    if (!token) {
      setWishlistItems([]);
      return;
    }

    try {
      const response = await api.get("/products/wishlist/");
      setWishlistItems(response.data || []);
    } catch (err) {
      console.error("Wishlist fetch error:", err);

      if (err.response?.status === 401) {
        setWishlistItems([]);
      }
    }
  };

  // Fetch Products
  const fetchProducts = async () => {
    try {
      setLoading(true);
      setError("");

      const params = {
        page,
        ordering,
      };

      if (search.trim()) {
        params.search = search.trim();
      }

      if (selectedCategory) {
        params.category = selectedCategory;
      }

      if (minPrice !== "") {
        params.min_price = minPrice;
      }

      if (maxPrice !== "") {
        params.max_price = maxPrice;
      }

      const response = await api.get("/products/products/", { params });

      setProducts(response.data.results || []);

      setPagination({
        count: response.data.count || 0,
        next: response.data.next,
        previous: response.data.previous,
      });
    } catch (err) {
      console.error("Product fetch error:", err);
      setError("Unable to load products. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Read Search Keyword from URL
  useEffect(() => {
    const searchValue = searchParams.get("search") || "";

    setSearchInput(searchValue);
    setSearch(searchValue);
    setPage(1);
  }, [searchParams]);

  // Initial Fetch
  useEffect(() => {
    fetchCategories();
    fetchWishlist();
  }, []);

  // Fetch Products Whenever Filters Change
  useEffect(() => {
    fetchProducts();
  }, [search, ordering, selectedCategory, minPrice, maxPrice, page]);

  // Search
  const handleSearch = (e) => {
    e.preventDefault();
    setPage(1);
    setSearch(searchInput);
  };

  // Filter Change
  const handleFilterChange = (setter, value) => {
    setter(value);
    setPage(1);
  };

  // Clear All Filters
  const clearFilters = () => {
    setSearchInput("");
    setSearch("");
    setOrdering("-created_at");
    setSelectedCategory("");
    setMinPrice("");
    setMaxPrice("");
    setPage(1);
  };

  // Image URL
  const getImageUrl = (image) => {
    if (!image) return null;

    if (image.startsWith("http")) {
      return image;
    }

    return `${IMAGE_BASE_URL}${image}`;
  };

  // Open Product Details
  const handleProductClick = (productId) => {
    navigate(`/products/${productId}`);
  };

  // Check Whether Product Is in Wishlist
  const isInWishlist = (productId) => {
    return wishlistItems.some((item) => item.product?.id === productId);
  };

  // Add / Remove Wishlist
  const handleWishlistToggle = async (e, productId) => {
    e.stopPropagation();

    const token = localStorage.getItem("access");

    if (!token) {
      navigate("/login");
      return;
    }

    if (wishlistLoading[productId]) return;

    setWishlistLoading((prev) => ({
      ...prev,
      [productId]: true,
    }));

    try {
      const existingItem = wishlistItems.find(
        (item) => item.product?.id === productId,
      );

      if (existingItem) {
        await api.delete(`/products/wishlist/${existingItem.id}/`);

        setWishlistItems((prev) =>
          prev.filter((item) => item.id !== existingItem.id),
        );
      } else {
        const response = await api.post("/products/wishlist/", {
          product_id: productId,
        });

        if (response.data.wishlist_item) {
          setWishlistItems((prev) => [
            response.data.wishlist_item,
            ...prev,
          ]);
        }
      }

      window.dispatchEvent(new Event("wishlistUpdated"));
    } catch (err) {
      console.error("Wishlist update error:", err);

      if (err.response?.status === 401) {
        navigate("/login");
      } else {
        showPopup(
          "error",
          "Wishlist Update Failed",
          err.response?.data?.message ||
            err.response?.data?.error ||
            "Unable to update wishlist. Please try again.",
        );
      }
    } finally {
      setWishlistLoading((prev) => ({
        ...prev,
        [productId]: false,
      }));
    }
  };

  return (
    <div className="min-h-screen bg-[#F8F4ED]">
      <Header />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Page Heading */}
        <div className="mb-10 text-center">
          <p className="text-xs font-semibold tracking-[0.2em] uppercase text-[#B87552] mb-2">
            Explore Our Collection
          </p>

          <h1 className="font-serif text-3xl lg:text-4xl font-bold text-[#30231E]">
            Discover Handmade Treasures
          </h1>

          <p className="text-sm text-[#30231E]/60 mt-3">
            Find unique creations made with love by talented artisans.
          </p>
        </div>

        {/* Search */}
        <form onSubmit={handleSearch} className="max-w-2xl mx-auto mb-8">
          <div className="flex items-center bg-white border border-[#30231E]/10 rounded-full px-5 py-2 shadow-sm focus-within:border-[#8B6248]">
            <Search size={19} className="text-[#8B6248]" />

            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search handmade products..."
              className="flex-1 px-3 py-2 outline-none text-sm text-[#30231E] bg-transparent"
            />

            <button
              type="submit"
              className="bg-[#5C3A2E] text-white px-5 py-2 rounded-full text-sm hover:bg-[#30231E]"
            >
              Search
            </button>
          </div>
        </form>

        {/* Filters */}
        <div className="bg-white rounded-2xl p-5 mb-8 shadow-sm border border-[#30231E]/5">
          <div className="flex items-center gap-2 mb-4 text-[#30231E] font-semibold">
            <SlidersHorizontal size={18} />
            <span>Filter & Sort Products</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            {/* Sort */}
            <div>
              <label className="block text-xs font-medium text-[#30231E]/70 mb-2">
                Sort By
              </label>

              <select
                value={ordering}
                onChange={(e) =>
                  handleFilterChange(setOrdering, e.target.value)
                }
                className="w-full border border-[#30231E]/15 rounded-lg px-3 py-2.5 text-sm outline-none focus:border-[#8B6248]"
              >
                <option value="-created_at">Newest First</option>
                <option value="price">Price: Low to High</option>
                <option value="-price">Price: High to Low</option>
                <option value="name">Name: A to Z</option>
                <option value="-name">Name: Z to A</option>
              </select>
            </div>

            {/* Category Filter */}
            <div>
              <label className="block text-xs font-medium text-[#30231E]/70 mb-2">
                Category
              </label>

              <select
                value={selectedCategory}
                onChange={(e) =>
                  handleFilterChange(setSelectedCategory, e.target.value)
                }
                className="w-full border border-[#30231E]/15 rounded-lg px-3 py-2.5 text-sm outline-none focus:border-[#8B6248]"
              >
                <option value="">All Categories</option>

                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Minimum Price */}
            <div>
              <label className="block text-xs font-medium text-[#30231E]/70 mb-2">
                Minimum Price (₹)
              </label>

              <input
                type="number"
                min="0"
                value={minPrice}
                onChange={(e) =>
                  handleFilterChange(setMinPrice, e.target.value)
                }
                placeholder="Min price"
                className="w-full border border-[#30231E]/15 rounded-lg px-3 py-2.5 text-sm outline-none focus:border-[#8B6248]"
              />
            </div>

            {/* Maximum Price */}
            <div>
              <label className="block text-xs font-medium text-[#30231E]/70 mb-2">
                Maximum Price (₹)
              </label>

              <input
                type="number"
                min="0"
                value={maxPrice}
                onChange={(e) =>
                  handleFilterChange(setMaxPrice, e.target.value)
                }
                placeholder="Max price"
                className="w-full border border-[#30231E]/15 rounded-lg px-3 py-2.5 text-sm outline-none focus:border-[#8B6248]"
              />
            </div>

            {/* Clear Filters */}
            <div className="flex items-end">
              <button
                type="button"
                onClick={clearFilters}
                className="w-full flex items-center justify-center gap-2 border border-[#5C3A2E] text-[#5C3A2E] rounded-lg px-3 py-2.5 text-sm hover:bg-[#5C3A2E] hover:text-white transition"
              >
                <X size={16} />
                Clear Filters
              </button>
            </div>
          </div>
        </div>

        {/* Product Count */}
        <div className="flex justify-between items-center mb-6">
          <p className="text-sm text-[#30231E]/60">
            {pagination.count} products found
          </p>
        </div>

        {/* Loading */}
        {loading && (
          <div className="text-center py-20 text-[#8B6248]">
            Loading products...
          </div>
        )}

        {/* Error */}
        {!loading && error && (
          <div className="text-center py-16">
            <p className="text-red-600 mb-4">{error}</p>

            <button
              onClick={fetchProducts}
              className="bg-[#5C3A2E] text-white px-5 py-2 rounded-full"
            >
              Try Again
            </button>
          </div>
        )}

        {/* Empty State */}
        {!loading && !error && products.length === 0 && (
          <div className="text-center py-20 bg-white rounded-2xl">
            <p className="font-serif text-xl text-[#30231E] mb-2">
              No Products Found
            </p>

            <p className="text-sm text-[#30231E]/60 mb-5">
              Try changing your search or filters.
            </p>

            <button
              onClick={clearFilters}
              className="text-[#8B6248] font-semibold text-sm"
            >
              Clear Filters
            </button>
          </div>
        )}

        {/* Product Grid */}
        {!loading && !error && products.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {products.map((product) => {
              const firstImage = product.images?.[0]?.image;

              const hasDiscount =
                product.discount_price !== null &&
                Number(product.discount_price) < Number(product.price);

              const inWishlist = isInWishlist(product.id);

              return (
                <article
                  key={product.id}
                  onClick={() => handleProductClick(product.id)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      handleProductClick(product.id);
                    }
                  }}
                  role="link"
                  tabIndex={0}
                  aria-label={`View details for ${product.name}`}
                  className="group bg-white rounded-2xl overflow-hidden border border-[#30231E]/5 hover:shadow-xl transition-all duration-300 hover:-translate-y-1 cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#8B6248]"
                >
                  {/* Product Image */}
                  <div className="relative aspect-square bg-[#F5EDE4] overflow-hidden">
                    {firstImage ? (
                      <img
                        src={getImageUrl(firstImage)}
                        alt={product.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-[#8B6248]/50">
                        No Image Available
                      </div>
                    )}

                    {/* Wishlist Button */}
                    <button
                      type="button"
                      onClick={(e) => handleWishlistToggle(e, product.id)}
                      disabled={wishlistLoading[product.id]}
                      aria-label={
                        inWishlist ? "Remove from wishlist" : "Add to wishlist"
                      }
                      className="absolute top-3 right-3 z-10 w-10 h-10 rounded-full bg-white/95 shadow-md flex items-center justify-center hover:scale-110 transition disabled:opacity-50"
                    >
                      <Heart
                        size={20}
                        className={
                          inWishlist
                            ? "fill-[#B87552] text-[#B87552]"
                            : "text-[#5C3A2E]"
                        }
                      />
                    </button>

                    {hasDiscount && (
                      <span className="absolute top-3 left-3 bg-[#B87552] text-white text-xs font-semibold px-3 py-1 rounded-full">
                        Sale
                      </span>
                    )}

                    {product.stock === 0 && (
                      <span className="absolute top-3 left-3 bg-[#30231E] text-white text-xs px-3 py-1 rounded-full">
                        Out of Stock
                      </span>
                    )}
                  </div>

                  {/* Product Details */}
                  <div className="p-4">
                    <p className="text-xs text-[#8B6248] font-medium mb-1">
                      {product.artisan?.business_name || "Artisan"}
                    </p>

                    <h2 className="font-serif text-lg font-semibold text-[#30231E] line-clamp-1">
                      {product.name}
                    </h2>

                    <p className="text-xs text-[#30231E]/50 mt-1">
                      {product.category?.name || "Uncategorized"}
                    </p>

                    {/* Price */}
                    <div className="flex items-center gap-2 mt-3">
                      <span className="font-serif text-lg font-bold text-[#30231E]">
                        ₹
                        {Number(
                          hasDiscount ? product.discount_price : product.price,
                        ).toLocaleString("en-IN")}
                      </span>

                      {hasDiscount && (
                        <span className="text-sm text-[#30231E]/40 line-through">
                          ₹{Number(product.price).toLocaleString("en-IN")}
                        </span>
                      )}
                    </div>

                    {/* Stock */}
                    <p
                      className={`text-xs mt-2 ${
                        product.stock > 0 ? "text-green-700" : "text-red-600"
                      }`}
                    >
                      {product.stock > 0
                        ? `${product.stock} available`
                        : "Currently unavailable"}
                    </p>
                  </div>
                </article>
              );
            })}
          </div>
        )}

        {/* Pagination */}
        {!loading && !error && products.length > 0 && (
          <div className="flex justify-center items-center gap-5 mt-12">
            <button
              disabled={!pagination.previous}
              onClick={() => setPage((current) => Math.max(1, current - 1))}
              className="flex items-center gap-2 px-4 py-2 rounded-full border border-[#5C3A2E] text-[#5C3A2E] text-sm disabled:opacity-30 disabled:cursor-not-allowed hover:bg-[#5C3A2E] hover:text-white transition"
            >
              <ChevronLeft size={16} />
              Previous
            </button>

            <span className="text-sm text-[#30231E]/70">Page {page}</span>

            <button
              disabled={!pagination.next}
              onClick={() => setPage((current) => current + 1)}
              className="flex items-center gap-2 px-4 py-2 rounded-full border border-[#5C3A2E] text-[#5C3A2E] text-sm disabled:opacity-30 disabled:cursor-not-allowed hover:bg-[#5C3A2E] hover:text-white transition"
            >
              Next
              <ChevronRight size={16} />
            </button>
          </div>
        )}
      </main>

      <Footer />

      {/* Custom Alert */}
      <CustomAlert
        isOpen={popup.isOpen}
        type={popup.type}
        title={popup.title}
        message={popup.message}
        onClose={closePopup}
        onConfirm={popup.onConfirm}
        confirmText="Continue"
      />
    </div>
  );
}
