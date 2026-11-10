
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  MapPin,
  Phone,
  Store,
  Package,
  X,
  ZoomIn,
  ChevronLeft,
  ChevronRight,
  CheckCircle,
  Tag,
  ShoppingBag,
  Plus,
  Minus,
  ShoppingCart,
  Heart,
} from "lucide-react";

import Header from "../components/layout/Header";
import Footer from "../components/layout/Footer";
import api from "../config/axiosInstance";

const IMAGE_BASE_URL = "http://localhost:8000";

export default function ProductDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [product, setProduct] = useState(null);
  const [selectedImage, setSelectedImage] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isZoomOpen, setIsZoomOpen] = useState(false);
  const [relatedProducts, setRelatedProducts] = useState([]);
  const [relatedLoading, setRelatedLoading] = useState(false);

  const [addingToCart, setAddingToCart] = useState(false);
  const [quantity, setQuantity] = useState(1);

  // Wishlist states
  const [wishlistItemId, setWishlistItemId] = useState(null);
  const [wishlistLoading, setWishlistLoading] = useState(false);

  const getImageUrl = (image) => {
    if (!image) return null;

    if (image.startsWith("http")) {
      return image;
    }

    return `${IMAGE_BASE_URL}${image}`;
  };

  // Fetch Product Details
  const fetchProductDetails = async () => {
    try {
      setLoading(true);
      setError("");
      setProduct(null);
      setRelatedProducts([]);
      setQuantity(1);
      setWishlistItemId(null);

      const response = await api.get(`/products/products/${id}/`);

      setProduct(response.data);

      const firstImage = response.data.images?.[0]?.image;
      setSelectedImage(firstImage ? getImageUrl(firstImage) : "");
    } catch (err) {
      console.error("Product details fetch error:", err);
      setError("Unable to load product details. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProductDetails();
  }, [id]);

  // Fetch Wishlist Status
  const fetchWishlistStatus = async (productId) => {
    if (!localStorage.getItem("access")) {
      setWishlistItemId(null);
      return;
    }

    try {
      const response = await api.get("/products/wishlist/");

      const wishlistItems = Array.isArray(response.data)
        ? response.data
        : response.data.results || [];

      const existingItem = wishlistItems.find(
        (item) => item.product?.id === productId
      );

      setWishlistItemId(existingItem ? existingItem.id : null);
    } catch (err) {
      console.error("Wishlist status fetch error:", err);
    }
  };

  useEffect(() => {
    if (product?.id) {
      fetchWishlistStatus(product.id);
    }
  }, [product?.id]);

  // Fetch Related Products
  useEffect(() => {
    const fetchRelatedProducts = async () => {
      const categoryId = product?.category?.id;

      if (!categoryId) {
        setRelatedProducts([]);
        return;
      }

      try {
        setRelatedLoading(true);

        const response = await api.get("/products/products/", {
          params: {
            category: categoryId,
          },
        });

        const products = response.data.results || response.data;

        const filteredProducts = products.filter(
          (item) => item.id !== product.id && item.stock > 0
        );

        setRelatedProducts(filteredProducts);
      } catch (err) {
        console.error("Related products fetch error:", err);
        setRelatedProducts([]);
      } finally {
        setRelatedLoading(false);
      }
    };

    fetchRelatedProducts();
  }, [product]);

  // Close Zoom using Escape key
  useEffect(() => {
    const handleEscape = (event) => {
      if (event.key === "Escape") {
        setIsZoomOpen(false);
      }
    };

    window.addEventListener("keydown", handleEscape);

    return () => {
      window.removeEventListener("keydown", handleEscape);
    };
  }, []);

  const hasDiscount =
    product?.discount_price !== null &&
    product?.discount_price !== undefined &&
    Number(product?.discount_price) < Number(product?.price);

  const displayPrice = hasDiscount
    ? product?.discount_price
    : product?.price;

  // Gallery navigation
  const images = product?.images || [];

  const handleImageNavigation = (direction) => {
    if (images.length <= 1) return;

    const currentIndex = images.findIndex(
      (image) => getImageUrl(image.image) === selectedImage
    );

    const nextIndex =
      direction === "next"
        ? (currentIndex + 1) % images.length
        : (currentIndex - 1 + images.length) % images.length;

    setSelectedImage(getImageUrl(images[nextIndex].image));
  };

  // Add Product to Cart
  const handleAddToCart = async () => {
    if (!localStorage.getItem("access")) {
      navigate("/login");
      return;
    }

    try {
      setAddingToCart(true);

      const response = await api.post("/products/cart/add/", {
        product_id: product.id,
        quantity: quantity,
      });

      window.dispatchEvent(new Event("cartUpdated"));
      
      alert(
        response.data.message ||
        "Product added to cart successfully!"
      );

      navigate("/cart");
    } catch (err) {
      console.error("Add to cart error:", err);

      if (err.response?.status === 401) {
        navigate("/login");
        return;
      }

      alert(
        err.response?.data?.message ||
        "Unable to add product to cart. Please try again."
      );
    } finally {
      setAddingToCart(false);
    }
  };

  // Add / Remove Wishlist
  const handleWishlistToggle = async () => {
    if (!localStorage.getItem("access")) {
      navigate("/login");
      return;
    }

    try {
      setWishlistLoading(true);

      if (wishlistItemId) {
        await api.delete(
          `/products/wishlist/${wishlistItemId}/`
        );

        setWishlistItemId(null);
      } else {
        const response = await api.post("/products/wishlist/", {
          product_id: product.id,
        });

        if (response.data.wishlist_item) {
          setWishlistItemId(response.data.wishlist_item.id);
        } else {
          await fetchWishlistStatus(product.id);
        }
      }
      window.dispatchEvent(new Event("wishlistUpdated"));

    } catch (err) {
      console.error("Wishlist toggle error:", err);

      if (err.response?.status === 401) {
        navigate("/login");
        return;
      }

      alert(
        err.response?.data?.message ||
        "Unable to update wishlist. Please try again."
      );
    } finally {
      setWishlistLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8F4ED]">
      <Header />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">

        {/* Back Button */}
        <button
          onClick={() => navigate("/products")}
          className="flex items-center gap-2 text-sm font-medium text-[#5C3A2E] hover:text-[#B87552] mb-8 transition"
        >
          <ArrowLeft size={18} />
          Back to Products
        </button>

        {/* Breadcrumbs */}
        {!loading && product && (
          <div className="flex flex-wrap items-center gap-2 text-sm text-[#30231E]/60 mb-8">
            <button
              onClick={() => navigate("/home")}
              className="hover:text-[#8B6248]"
            >
              Home
            </button>

            <span>/</span>

            <button
              onClick={() => navigate("/products")}
              className="hover:text-[#8B6248]"
            >
              Products
            </button>

            <span>/</span>

            <span>{product.category?.name || "Category"}</span>

            <span>/</span>

            <span className="text-[#30231E] font-medium">
              {product.name}
            </span>
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div className="text-center py-24 text-[#8B6248]">
            Loading product details...
          </div>
        )}

        {/* Error */}
        {!loading && error && (
          <div className="text-center py-20 bg-white rounded-2xl">
            <p className="text-red-600 mb-5">{error}</p>

            <button
              onClick={fetchProductDetails}
              className="bg-[#5C3A2E] text-white px-6 py-2.5 rounded-full text-sm hover:bg-[#30231E]"
            >
              Try Again
            </button>

            <button
              onClick={() => navigate("/products")}
              className="block mx-auto mt-4 text-sm text-[#8B6248]"
            >
              Back to Products
            </button>
          </div>
        )}

        {/* Product Details */}
        {!loading && !error && product && (
          <>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16">

              {/* Product Images */}
              <div>
                <div className="relative aspect-square bg-white rounded-2xl overflow-hidden border border-[#30231E]/5 group">

                  {selectedImage ? (
                    <img
                      src={selectedImage}
                      alt={product.name}
                      onClick={() => setIsZoomOpen(true)}
                      className="w-full h-full object-cover cursor-zoom-in"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-[#8B6248]/60">
                      No Image Available
                    </div>
                  )}

                  {selectedImage && (
                    <button
                      type="button"
                      onClick={() => setIsZoomOpen(true)}
                      aria-label="Zoom product image"
                      className="absolute bottom-4 right-4 bg-white/90 text-[#5C3A2E] p-3 rounded-full shadow-md hover:bg-white transition"
                    >
                      <ZoomIn size={20} />
                    </button>
                  )}

                  {hasDiscount && (
                    <span className="absolute top-5 left-5 bg-[#B87552] text-white text-xs font-semibold px-4 py-2 rounded-full">
                      Special Offer
                    </span>
                  )}

                  {product.stock === 0 && (
                    <span className="absolute top-5 right-5 bg-[#30231E] text-white text-xs px-4 py-2 rounded-full">
                      Out of Stock
                    </span>
                  )}
                </div>

                {/* Image Thumbnails */}
                {images.length > 1 && (
                  <div className="flex gap-3 mt-4 flex-wrap">
                    {images.map((image) => {
                      const imageUrl = getImageUrl(image.image);

                      return (
                        <button
                          key={image.id}
                          type="button"
                          onClick={() => setSelectedImage(imageUrl)}
                          aria-label={`View ${product.name} image`}
                          className={`w-20 h-20 rounded-xl overflow-hidden border-2 transition ${
                            selectedImage === imageUrl
                              ? "border-[#8B6248]"
                              : "border-transparent"
                          }`}
                        >
                          <img
                            src={imageUrl}
                            alt={product.name}
                            className="w-full h-full object-cover"
                          />
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Product Information */}
              <div className="flex flex-col">

                <p className="text-xs font-semibold tracking-[0.2em] uppercase text-[#B87552] mb-3">
                  {product.category?.name || "Handmade Collection"}
                </p>

                <h1 className="font-serif text-3xl lg:text-4xl font-bold text-[#30231E] leading-tight">
                  {product.name}
                </h1>

                {/* Artisan Name */}
                <div className="flex items-center gap-2 mt-4 text-[#8B6248]">
                  <Store size={17} />

                  <span className="text-sm font-medium">
                    {product.artisan?.business_name || "Artisan"}
                  </span>
                </div>

                {/* Price */}
                <div className="flex items-center gap-3 mt-7 flex-wrap">
                  <span className="font-serif text-3xl font-bold text-[#30231E]">
                    ₹{Number(displayPrice).toLocaleString("en-IN")}
                  </span>

                  {hasDiscount && (
                    <>
                      <span className="text-lg text-[#30231E]/40 line-through">
                        ₹{Number(product.price).toLocaleString("en-IN")}
                      </span>

                      <span className="text-xs font-semibold text-green-700 bg-green-50 px-3 py-1.5 rounded-full">
                        Save ₹
                        {(
                          Number(product.price) -
                          Number(product.discount_price)
                        ).toLocaleString("en-IN")}
                      </span>
                    </>
                  )}
                </div>

                <div className="border-t border-[#30231E]/10 my-7" />

                {/* Description */}
                <div>
                  <h2 className="font-serif text-xl font-semibold text-[#30231E] mb-3">
                    Product Description
                  </h2>

                  <p className="text-sm text-[#30231E]/70 leading-7 whitespace-pre-line">
                    {product.description}
                  </p>
                </div>

                {/* Stock */}
                <div className="mt-7 flex items-center gap-2">
                  <Package
                    size={18}
                    className={
                      product.stock > 0
                        ? "text-green-700"
                        : "text-red-600"
                    }
                  />

                  <span
                    className={`text-sm font-medium ${
                      product.stock > 0
                        ? "text-green-700"
                        : "text-red-600"
                    }`}
                  >
                    {product.stock > 0
                      ? `${product.stock} items available`
                      : "Currently unavailable"}
                  </span>
                </div>

                {/* Quantity Selector */}
                {product.stock > 0 && (
                  <div className="mt-7">
                    <p className="text-sm font-semibold text-[#30231E] mb-3">
                      Select Quantity
                    </p>

                    <div className="flex items-center gap-4">
                      <div className="flex items-center border border-[#30231E]/20 rounded-lg overflow-hidden bg-white">
                        <button
                          type="button"
                          onClick={() =>
                            setQuantity((prev) => Math.max(1, prev - 1))
                          }
                          disabled={quantity <= 1 || addingToCart}
                          className="p-3 text-[#5C3A2E] hover:bg-[#F8F4ED] disabled:opacity-40"
                          aria-label="Decrease quantity"
                        >
                          <Minus size={16} />
                        </button>

                        <span className="min-w-12 text-center text-sm font-semibold text-[#30231E]">
                          {quantity}
                        </span>

                        <button
                          type="button"
                          onClick={() =>
                            setQuantity((prev) =>
                              Math.min(product.stock, prev + 1)
                            )
                          }
                          disabled={
                            quantity >= product.stock || addingToCart
                          }
                          className="p-3 text-[#5C3A2E] hover:bg-[#F8F4ED] disabled:opacity-40"
                          aria-label="Increase quantity"
                        >
                          <Plus size={16} />
                        </button>
                      </div>

                      <span className="text-xs text-[#30231E]/50">
                        Maximum {product.stock}
                      </span>
                    </div>
                  </div>
                )}

                {/* Add to Cart Button */}
                <button
                  type="button"
                  onClick={handleAddToCart}
                  disabled={
                    product.stock <= 0 ||
                    addingToCart ||
                    quantity > product.stock
                  }
                  className="mt-6 w-full sm:w-auto flex items-center justify-center gap-3 bg-[#5C3A2E] text-white px-8 py-4 rounded-full text-sm font-semibold hover:bg-[#30231E] transition disabled:bg-gray-300 disabled:text-gray-500 disabled:cursor-not-allowed"
                >
                  <ShoppingCart size={19} />

                  {addingToCart
                    ? "Adding to Cart..."
                    : product.stock <= 0
                    ? "Out of Stock"
                    : "Add to Cart"}
                </button>

                {/* Wishlist Button */}
                <button
                  type="button"
                  onClick={handleWishlistToggle}
                  disabled={wishlistLoading}
                  className={`mt-3 w-full sm:w-auto flex items-center justify-center gap-3 px-8 py-4 rounded-full text-sm font-semibold border transition disabled:opacity-50 ${
                    wishlistItemId
                      ? "bg-[#B87552] text-white border-[#B87552]"
                      : "bg-white text-[#5C3A2E] border-[#5C3A2E]/30 hover:bg-[#B87552]/10"
                  }`}
                >
                  <Heart
                    size={19}
                    fill={wishlistItemId ? "currentColor" : "none"}
                  />

                  {wishlistLoading
                    ? "Updating Wishlist..."
                    : wishlistItemId
                    ? "Remove from Wishlist"
                    : "Add to Wishlist"}
                </button>

                <div className="border-t border-[#30231E]/10 my-7" />

                {/* Product Highlights */}
                <div className="mt-2 bg-white rounded-2xl p-6 border border-[#30231E]/5">
                  <h2 className="font-serif text-xl font-semibold text-[#30231E] mb-5">
                    Product Highlights
                  </h2>

                  <div className="space-y-4">

                    <div className="flex items-center gap-3">
                      <Tag size={18} className="text-[#B87552]" />
                      <div>
                        <p className="text-xs text-[#30231E]/50">
                          Category
                        </p>
                        <p className="text-sm font-medium text-[#5C3A2E]">
                          {product.category?.name || "Not specified"}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <Store size={18} className="text-[#B87552]" />
                      <div>
                        <p className="text-xs text-[#30231E]/50">
                          Handmade by
                        </p>
                        <p className="text-sm font-medium text-[#5C3A2E]">
                          {product.artisan?.business_name || "Artisan"}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <Package size={18} className="text-[#B87552]" />
                      <div>
                        <p className="text-xs text-[#30231E]/50">
                          Availability
                        </p>
                        <p className="text-sm font-medium text-[#5C3A2E]">
                          {product.stock > 0
                            ? "In Stock"
                            : "Out of Stock"}
                        </p>
                      </div>
                    </div>

                    {hasDiscount && (
                      <div className="flex items-center gap-3">
                        <CheckCircle
                          size={18}
                          className="text-[#B87552]"
                        />
                        <div>
                          <p className="text-xs text-[#30231E]/50">
                            Offer
                          </p>
                          <p className="text-sm font-medium text-[#5C3A2E]">
                            Discount Available
                          </p>
                        </div>
                      </div>
                    )}

                  </div>
                </div>

                {/* Artisan Information */}
                {product.artisan && (
                  <div className="mt-8 bg-white rounded-2xl p-6 border border-[#30231E]/5">

                    <h2 className="font-serif text-xl font-semibold text-[#30231E] mb-5">
                      About the Artisan
                    </h2>

                    <p className="font-semibold text-[#5C3A2E]">
                      {product.artisan.business_name}
                    </p>

                    {product.artisan.craft_type && (
                      <p className="text-sm text-[#30231E]/60 mt-2">
                        {product.artisan.craft_type}
                      </p>
                    )}

                    {product.artisan.address && (
                      <div className="flex items-start gap-2 mt-4 text-sm text-[#30231E]/70">
                        <MapPin size={17} className="shrink-0 mt-0.5" />
                        <span>{product.artisan.address}</span>
                      </div>
                    )}

                    {product.artisan.phone && (
                      <div className="flex items-center gap-2 mt-3 text-sm text-[#30231E]/70">
                        <Phone size={17} />
                        <span>{product.artisan.phone}</span>
                      </div>
                    )}

                    {product.artisan.bio && (
                      <p className="text-sm text-[#30231E]/70 leading-6 mt-4">
                        {product.artisan.bio}
                      </p>
                    )}

                  </div>
                )}
              </div>
            </div>

            {/* Related Products */}
            <section className="mt-20">
              <div className="mb-8">
                <p className="text-xs font-semibold tracking-[0.2em] uppercase text-[#B87552] mb-2">
                  You May Also Like
                </p>

                <h2 className="font-serif text-3xl font-bold text-[#30231E]">
                  Related Products
                </h2>

                <p className="text-sm text-[#30231E]/60 mt-2">
                  Explore more handmade products from this category.
                </p>
              </div>

              {relatedLoading && (
                <p className="text-center py-10 text-[#8B6248]">
                  Loading related products...
                </p>
              )}

              {!relatedLoading && relatedProducts.length === 0 && (
                <div className="text-center py-10 bg-white rounded-2xl">
                  <ShoppingBag
                    size={32}
                    className="mx-auto text-[#B87552] mb-3"
                  />
                  <p className="text-sm text-[#30231E]/60">
                    No related products available at the moment.
                  </p>
                </div>
              )}

              {!relatedLoading && relatedProducts.length > 0 && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                  {relatedProducts.map((item) => {
                    const itemImage = item.images?.[0]?.image;
                    const itemImageUrl = getImageUrl(itemImage);

                    const itemHasDiscount =
                      item.discount_price !== null &&
                      item.discount_price !== undefined &&
                      Number(item.discount_price) < Number(item.price);

                    const itemDisplayPrice = itemHasDiscount
                      ? item.discount_price
                      : item.price;

                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() =>
                          navigate(`/products/${item.id}`)
                        }
                        className="text-left bg-white rounded-2xl overflow-hidden border border-[#30231E]/5 hover:shadow-lg transition group"
                      >
                        <div className="aspect-square bg-[#F8F4ED] overflow-hidden relative">
                          {itemImageUrl ? (
                            <img
                              src={itemImageUrl}
                              alt={item.name}
                              className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-sm text-[#8B6248]/60">
                              No Image Available
                            </div>
                          )}

                          {itemHasDiscount && (
                            <span className="absolute top-3 left-3 bg-[#B87552] text-white text-xs px-3 py-1.5 rounded-full">
                              Special Offer
                            </span>
                          )}
                        </div>

                        <div className="p-4">
                          <p className="text-xs text-[#B87552] mb-2">
                            {item.category?.name || "Handmade"}
                          </p>

                          <h3 className="font-serif text-lg font-semibold text-[#30231E] line-clamp-1">
                            {item.name}
                          </h3>

                          <p className="text-xs text-[#30231E]/50 mt-1">
                            {item.artisan?.business_name || "Artisan"}
                          </p>

                          <div className="flex items-center gap-2 mt-3">
                            <span className="font-semibold text-[#5C3A2E]">
                              ₹
                              {Number(itemDisplayPrice).toLocaleString("en-IN")}
                            </span>

                            {itemHasDiscount && (
                              <span className="text-xs text-[#30231E]/40 line-through">
                                ₹
                                {Number(item.price).toLocaleString("en-IN")}
                              </span>
                            )}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </section>
          </>
        )}
      </main>

      <Footer />

      {/* Image Zoom Modal */}
      {isZoomOpen && selectedImage && (
        <div
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4"
          onClick={() => setIsZoomOpen(false)}
        >
          <button
            type="button"
            onClick={() => setIsZoomOpen(false)}
            aria-label="Close image preview"
            className="absolute top-5 right-5 text-white bg-white/10 p-3 rounded-full hover:bg-white/20"
          >
            <X size={24} />
          </button>

          {images.length > 1 && (
            <>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleImageNavigation("previous");
                }}
                aria-label="Previous image"
                className="absolute left-3 md:left-8 text-white bg-white/10 p-3 rounded-full hover:bg-white/20"
              >
                <ChevronLeft size={28} />
              </button>

              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleImageNavigation("next");
                }}
                aria-label="Next image"
                className="absolute right-3 md:right-8 text-white bg-white/10 p-3 rounded-full hover:bg-white/20"
              >
                <ChevronRight size={28} />
              </button>
            </>
          )}

          <img
            src={selectedImage}
            alt={product?.name || "Product image"}
            onClick={(e) => e.stopPropagation()}
            className="max-w-full max-h-[85vh] object-contain rounded-lg"
          />
        </div>
      )}
    </div>
  );
}
