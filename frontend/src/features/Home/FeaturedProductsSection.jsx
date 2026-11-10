
import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Heart, ShoppingCart, Star } from "lucide-react";
import api from "../../config/axiosInstance";

const IMAGE_BASE_URL = "http://localhost:8000";

export default function FeaturedProductsSection() {
  const navigate = useNavigate();

  const [products, setProducts] = useState([]);
  const [wishlistItems, setWishlistItems] = useState([]);
  const [wishlistLoading, setWishlistLoading] = useState({});
  const [loading, setLoading] = useState(true);

  const getImageUrl = (image) => {
    if (!image) return null;

    if (image.startsWith("http")) {
      return image;
    }

    return `${IMAGE_BASE_URL}${image}`;
  };

  const fetchProducts = async () => {
    try {
      setLoading(true);

      const response = await api.get("/products/products/", {
        params: {
          page: 1,
          ordering: "-created_at",
        },
      });

      setProducts((response.data.results || []).slice(0, 4));
    } catch (err) {
      console.error("Featured products fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

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

  useEffect(() => {
    fetchProducts();
    fetchWishlist();
  }, []);

  const isInWishlist = (productId) => {
    return wishlistItems.some(
      (item) => item.product?.id === productId
    );
  };

  const handleWishlistToggle = async (e, productId) => {
    e.stopPropagation();

    if (!localStorage.getItem("access")) {
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
        (item) => item.product?.id === productId
      );

      if (existingItem) {
        await api.delete(`/products/wishlist/${existingItem.id}/`);

        setWishlistItems((prev) =>
          prev.filter((item) => item.id !== existingItem.id)
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
        alert(
          err.response?.data?.message ||
          err.response?.data?.error ||
          "Unable to update wishlist."
        );
      }
    } finally {
      setWishlistLoading((prev) => ({
        ...prev,
        [productId]: false,
      }));
    }
  };

  const handleAddToCart = async (e, productId) => {
    e.stopPropagation();

    if (!localStorage.getItem("access")) {
      navigate("/login");
      return;
    }

    try {
      await api.post("/products/cart/add/", {
        product_id: productId,
        quantity: 1,
      });

      window.dispatchEvent(new Event("cartUpdated"));
      alert("Product added to cart successfully.");
    } catch (err) {
      console.error("Add to cart error:", err);

      if (err.response?.status === 401) {
        navigate("/login");
      } else {
        alert(
          err.response?.data?.message ||
          err.response?.data?.error ||
          "Unable to add product to cart."
        );
      }
    }
  };

  const formatPrice = (price) => {
    return Number(price).toLocaleString("en-IN");
  };

  return (
    <section className="py-20 bg-[#F8F4ED]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Section Heading */}
        <div className="text-center mb-12">
          <p className="text-xs font-semibold tracking-[0.2em] uppercase text-[#B87552] mb-2">
            Handpicked for You
          </p>

          <h2 className="font-serif text-3xl lg:text-4xl font-bold text-[#30231E]">
            Made by Hand, Loved by You
          </h2>

          <p className="text-sm text-[#30231E]/60 mt-3">
            Discover unique creations from our talented artisans.
          </p>
        </div>

        {/* Loading */}
        {loading && (
          <div className="text-center py-16 text-[#8B6248]">
            Loading featured products...
          </div>
        )}

        {/* Empty State */}
        {!loading && products.length === 0 && (
          <div className="text-center py-16">
            <p className="text-[#30231E]/60">
              No featured products available right now.
            </p>
          </div>
        )}

        {/* Product Grid */}
        {!loading && products.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">

            {products.map((product) => {
              const firstImage = product.images?.[0]?.image;

              const hasDiscount =
                product.discount_price !== null &&
                Number(product.discount_price) < Number(product.price);

              const inWishlist = isInWishlist(product.id);

              return (
                <article
                  key={product.id}
                  onClick={() => navigate(`/products/${product.id}`)}
                  className="group bg-white rounded-2xl overflow-hidden border border-[#30231E]/5 hover:shadow-xl transition-all duration-300 hover:-translate-y-1 cursor-pointer"
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
                      <div className="w-full h-full flex items-center justify-center text-[#8B6248]/50 text-sm">
                        No Image Available
                      </div>
                    )}

                    {/* Wishlist */}
                    <button
                      type="button"
                      onClick={(e) =>
                        handleWishlistToggle(e, product.id)
                      }
                      disabled={wishlistLoading[product.id]}
                      aria-label={
                        inWishlist
                          ? "Remove from wishlist"
                          : "Add to wishlist"
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

                    {product.stock <= 0 && (
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

                    <h3 className="font-serif text-lg font-semibold text-[#30231E] line-clamp-1">
                      {product.name}
                    </h3>

                    <p className="text-xs text-[#30231E]/50 mt-1">
                      {product.category?.name || "Uncategorized"}
                    </p>

                    {/* Price */}
                    <div className="flex items-center gap-2 mt-3">
                      <span className="font-serif text-lg font-bold text-[#30231E]">
                        ₹
                        {formatPrice(
                          hasDiscount
                            ? product.discount_price
                            : product.price
                        )}
                      </span>

                      {hasDiscount && (
                        <span className="text-sm text-[#30231E]/40 line-through">
                          ₹{formatPrice(product.price)}
                        </span>
                      )}
                    </div>

                    {/* Add to Cart */}
                    <button
                      type="button"
                      disabled={product.stock <= 0}
                      onClick={(e) =>
                        handleAddToCart(e, product.id)
                      }
                      className="w-full mt-4 flex items-center justify-center gap-2 bg-[#5C3A2E] text-white py-2.5 rounded-full text-sm font-medium hover:bg-[#30231E] transition disabled:bg-gray-300 disabled:text-gray-500 disabled:cursor-not-allowed"
                    >
                      <ShoppingCart size={16} />
                      {product.stock > 0
                        ? "Add to Cart"
                        : "Out of Stock"}
                    </button>

                  </div>
                </article>
              );
            })}

          </div>
        )}

        {/* Explore All Products */}
        <div className="text-center mt-12">
          <Link
            to="/products"
            className="inline-block border border-[#5C3A2E] text-[#5C3A2E] px-8 py-3 rounded-full text-sm font-semibold hover:bg-[#5C3A2E] hover:text-white transition"
          >
            Explore All Products
          </Link>
        </div>

      </div>
    </section>
  );
}
