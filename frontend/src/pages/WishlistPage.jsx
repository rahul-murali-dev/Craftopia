
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Heart, ShoppingCart, Trash2, ArrowLeft } from "lucide-react";
import Header from "../components/layout/Header";
import Footer from "../components/layout/Footer";
import api from "../config/axiosInstance";

export default function WishlistPage() {
  const navigate = useNavigate();

  const [wishlistItems, setWishlistItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [removingId, setRemovingId] = useState(null);
  const [addingId, setAddingId] = useState(null);

  const fetchWishlist = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await api.get("/products/wishlist/");
      setWishlistItems(response.data);
    } catch (err) {
      console.error("Wishlist fetch error:", err);

      if (err.response?.status === 401) {
        navigate("/login");
        return;
      }

      setError("Unable to load your wishlist. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWishlist();
  }, []);

  // Remove product from Wishlist
  const handleRemove = async (wishlistId) => {
    try {
      setRemovingId(wishlistId);

      await api.delete(`/products/wishlist/${wishlistId}/`);

      setWishlistItems((prev) =>
        prev.filter((item) => item.id !== wishlistId)
      );

      // Update Header Wishlist Count
      window.dispatchEvent(new Event("wishlistUpdated"));

    } catch (err) {
      console.error("Remove wishlist error:", err);
      alert("Unable to remove this product. Please try again.");
    } finally {
      setRemovingId(null);
    }
  };

  // Add product to Cart
  const handleAddToCart = async (productId, wishlistId) => {
    try {
      setAddingId(wishlistId);

      await api.post("/products/cart/add/", {
        product_id: productId,
        quantity: 1,
      });

      // Backend automatically removes this product from wishlist.
      setWishlistItems((prev) =>
        prev.filter((item) => item.id !== wishlistId)
      );
      window.dispatchEvent(new Event("cartUpdated"));
      // Update Header Wishlist Count
      window.dispatchEvent(new Event("wishlistUpdated"));

      alert("Product added to cart successfully!");

    } catch (err) {
      console.error("Add to cart error:", err);

      if (err.response?.status === 401) {
        navigate("/login");
        return;
      }

      alert(
        err.response?.data?.message ||
        "Unable to add this product to cart."
      );
    } finally {
      setAddingId(null);
    }
  };

  const getImageUrl = (image) => {
    if (!image) return null;

    const imageUrl = image.image;

    if (!imageUrl) return null;

    return imageUrl.startsWith("http")
      ? imageUrl
      : `http://localhost:8000${imageUrl}`;
  };

  return (
    <div className="min-h-screen bg-[#F8F4ED]">
      <Header />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <button
          onClick={() => navigate("/products")}
          className="flex items-center gap-2 text-sm text-[#5C3A2E] hover:text-[#8B6248] mb-6"
        >
          <ArrowLeft size={18} />
          Continue Shopping
        </button>

        <div className="mb-8">
          <div className="flex items-center gap-3">
            <Heart className="text-[#B87552]" size={30} />

            <h1 className="font-serif text-3xl font-bold text-[#30231E]">
              My Wishlist
            </h1>
          </div>

          <p className="text-[#30231E]/60 mt-2">
            Your favourite handmade products, saved in one place.
          </p>
        </div>

        {loading ? (
          <div className="text-center py-20 text-[#5C3A2E]">
            Loading your wishlist...
          </div>
        ) : error ? (
          <div className="text-center py-20">
            <p className="text-red-600 mb-4">{error}</p>

            <button
              onClick={fetchWishlist}
              className="px-6 py-2 bg-[#5C3A2E] text-white rounded-full"
            >
              Try Again
            </button>
          </div>
        ) : wishlistItems.length === 0 ? (
          <div className="bg-white rounded-2xl border border-[#5C3A2E]/10 text-center py-16 px-4">
            <Heart
              size={48}
              className="mx-auto text-[#B87552]/50 mb-4"
            />

            <h2 className="font-serif text-2xl font-semibold text-[#30231E]">
              Your Wishlist is Empty
            </h2>

            <p className="text-[#30231E]/60 mt-2 mb-6">
              Save the handmade products you love and find them here.
            </p>

            <button
              onClick={() => navigate("/products")}
              className="px-7 py-3 bg-[#5C3A2E] text-white rounded-full hover:bg-[#8B6248] transition"
            >
              Explore Products
            </button>
          </div>
        ) : (
          <>
            <p className="text-sm text-[#30231E]/60 mb-5">
              {wishlistItems.length} saved product(s)
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {wishlistItems.map((item) => {
                const product = item.product;
                const imageUrl = getImageUrl(product.images?.[0]);

                const currentPrice =
                  product.discount_price &&
                  Number(product.discount_price) < Number(product.price)
                    ? product.discount_price
                    : product.price;

                const outOfStock = product.stock <= 0;

                return (
                  <div
                    key={item.id}
                    className="bg-white rounded-2xl overflow-hidden border border-[#5C3A2E]/10 shadow-sm"
                  >
                    <div
                      onClick={() => navigate(`/products/${product.id}`)}
                      className="relative h-56 bg-[#F8F4ED] cursor-pointer"
                    >
                      {imageUrl ? (
                        <img
                          src={imageUrl}
                          alt={product.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-[#8B6248]">
                          No Image Available
                        </div>
                      )}

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRemove(item.id);
                        }}
                        disabled={removingId === item.id}
                        aria-label="Remove from wishlist"
                        className="absolute top-3 right-3 w-10 h-10 rounded-full bg-white shadow flex items-center justify-center text-[#B87552] hover:bg-[#B87552] hover:text-white transition disabled:opacity-50"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>

                    <div className="p-5">
                      <p className="text-xs text-[#8B6248] mb-1">
                        {product.category?.name}
                      </p>

                      <h3
                        onClick={() => navigate(`/products/${product.id}`)}
                        className="font-serif text-lg font-semibold text-[#30231E] cursor-pointer hover:text-[#8B6248] line-clamp-1"
                      >
                        {product.name}
                      </h3>

                      <p className="text-sm text-[#30231E]/60 mt-1">
                        By {product.artisan?.business_name || "Artisan"}
                      </p>

                      <div className="flex items-center gap-2 mt-3">
                        <span className="font-semibold text-[#5C3A2E]">
                          ₹{currentPrice}
                        </span>

                        {Number(product.discount_price) > 0 &&
                          Number(product.discount_price) < Number(product.price) && (
                            <span className="text-sm text-gray-400 line-through">
                              ₹{product.price}
                            </span>
                          )}
                      </div>

                      <p
                        className={`text-xs mt-2 ${
                          outOfStock ? "text-red-500" : "text-green-700"
                        }`}
                      >
                        {outOfStock
                          ? "Currently unavailable"
                          : `${product.stock} available`}
                      </p>

                      <button
                        onClick={() =>
                          handleAddToCart(product.id, item.id)
                        }
                        disabled={outOfStock || addingId === item.id}
                        className="w-full mt-4 py-3 rounded-full bg-[#5C3A2E] text-white flex items-center justify-center gap-2 hover:bg-[#8B6248] transition disabled:bg-gray-300 disabled:cursor-not-allowed"
                      >
                        <ShoppingCart size={17} />

                        {addingId === item.id
                          ? "Adding..."
                          : outOfStock
                          ? "Out of Stock"
                          : "Add to Cart"}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </main>

      <Footer />
    </div>
  );
}
