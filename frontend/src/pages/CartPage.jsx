
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  ShoppingBag,
  Trash2,
  Plus,
  Minus,
  Package,
} from "lucide-react";

import Header from "../components/layout/Header";
import Footer from "../components/layout/Footer";
import api from "../config/axiosInstance";

const IMAGE_BASE_URL = "http://localhost:8000";

export default function CartPage() {
  const navigate = useNavigate();

  const [cart, setCart] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [updatingItem, setUpdatingItem] = useState(null);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const getImageUrl = (image) => {
    if (!image) return null;
    if (image.startsWith("http")) return image;
    return `${IMAGE_BASE_URL}${image}`;
  };

  const fetchCart = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await api.get("/products/cart/");
      setCart(response.data);
    } catch (err) {
      console.error("Cart fetch error:", err);

      if (err.response?.status === 401) {
        navigate("/login");
        return;
      }

      setError("Unable to load your cart. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCart();
  }, []);

  const updateQuantity = async (item, newQuantity) => {
    if (newQuantity < 1) return;

    if (newQuantity > item.product.stock) {
      alert(`Only ${item.product.stock} items are available.`);
      return;
    }

    try {
      setUpdatingItem(item.id);

      const response = await api.patch(
        `/products/cart/items/${item.id}/`,
        { quantity: newQuantity }
      );

      setCart(response.data.cart || response.data);

      window.dispatchEvent(new Event("cartUpdated"));

    } catch (err) {
      console.error("Cart quantity update error:", err);

      alert(
        err.response?.data?.message ||
        "Unable to update quantity. Please try again."
      );

      await fetchCart();
    } finally {
      setUpdatingItem(null);
    }
  };

  const removeItem = async (itemId) => {
    const confirmed = window.confirm(
      "Are you sure you want to remove this product from your cart?"
    );

    if (!confirmed) return;

    try {
      setUpdatingItem(itemId);

      const response = await api.delete(
        `/products/cart/items/${itemId}/`
      );

      setCart(response.data.cart || response.data);
      window.dispatchEvent(new Event("cartUpdated"));
      
    } catch (err) {
      console.error("Remove cart item error:", err);
      alert("Unable to remove this product. Please try again.");
      await fetchCart();
    } finally {
      setUpdatingItem(null);
    }
  };

  const formatPrice = (price) =>
    Number(price || 0).toLocaleString("en-IN", {
      maximumFractionDigits: 2,
    });

  const items = cart?.items || [];


const validateCheckout = async () => {
  try {
    setCheckoutLoading(true);

    const response = await api.post("/products/cart/validate/");

    if (response.data.valid) {
      navigate("/checkout");
    } else {
      const errors = response.data.errors;

      if (errors && errors.length > 0) {
        alert(
          errors
            .map((item) => `${item.product_name}: ${item.error}`)
            .join("\n")
        );

        await fetchCart();
      } else {
        alert("Your cart is not valid. Please check your products.");
      }
    }
  } catch (err) {
    console.error("Checkout validation error:", err);

    if (err.response?.status === 401) {
      navigate("/login");
      return;
    }

    const errors = err.response?.data?.errors;

    if (errors && errors.length > 0) {
      alert(
        errors
          .map((item) => `${item.product_name}: ${item.error}`)
          .join("\n")
      );

      await fetchCart();
    } else {
      alert(
        err.response?.data?.error ||
        "Unable to validate cart. Please try again."
      );
    }
  } finally {
    setCheckoutLoading(false);
  }
};



  const hasInvalidItems = items.some(
  (item) =>
    !item.is_available ||
    item.product.stock <= 0 ||
    item.quantity > item.product.stock
);

  const isCartEmpty = items.length === 0;
  const checkoutDisabled = isCartEmpty || hasInvalidItems;

  return (
    <div className="min-h-screen bg-[#F8F4ED]">
      <Header />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">

        {/* Page Heading */}
        <div className="mb-8">
          <button
            onClick={() => navigate("/products")}
            className="flex items-center gap-2 text-sm font-medium text-[#5C3A2E] hover:text-[#B87552] mb-5 transition"
          >
            <ArrowLeft size={18} />
            Continue Shopping
          </button>

          <h1 className="font-serif text-3xl md:text-4xl font-bold text-[#30231E]">
            My Shopping Cart
          </h1>

          <p className="text-sm text-[#30231E]/60 mt-2">
            Review your selected handmade products.
          </p>
        </div>

        {/* Loading */}
        {loading && (
          <div className="text-center py-24 text-[#8B6248]">
            Loading your cart...
          </div>
        )}

        {/* Error */}
        {!loading && error && (
          <div className="bg-white rounded-2xl p-10 text-center">
            <p className="text-red-600 mb-5">{error}</p>

            <button
              onClick={fetchCart}
              className="bg-[#5C3A2E] text-white px-6 py-2.5 rounded-full text-sm hover:bg-[#30231E]"
            >
              Try Again
            </button>
          </div>
        )}

        {/* Empty Cart */}
        {!loading && !error && isCartEmpty && (
          <div className="bg-white rounded-2xl border border-[#30231E]/5 text-center py-20 px-5">
            <ShoppingBag
              size={48}
              className="mx-auto text-[#B87552] mb-5"
            />

            <h2 className="font-serif text-2xl font-semibold text-[#30231E]">
              Your cart is empty
            </h2>

            <p className="text-sm text-[#30231E]/60 mt-3 mb-7">
              Discover beautiful handmade products and add them to your cart.
            </p>

            <button
              onClick={() => navigate("/products")}
              className="bg-[#5C3A2E] text-white px-7 py-3 rounded-full text-sm font-medium hover:bg-[#30231E] transition"
            >
              Explore Products
            </button>
          </div>
        )}

        {/* Cart Content */}
        {!loading && !error && !isCartEmpty && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

            {/* Cart Items */}
            <div className="lg:col-span-2 space-y-5">

              {items.map((item) => {
                const product = item.product;
                const image = product.images?.[0]?.image;
                const imageUrl = getImageUrl(image);

                const isInvalid =
                  product.stock <= 0 ||
                  item.quantity > product.stock;

                return (
                  <div
                    key={item.id}
                    className="bg-white rounded-2xl border border-[#30231E]/5 p-4 sm:p-5 flex flex-col sm:flex-row gap-5"
                  >
                    {/* Product Image */}
                    <div
                      className="w-full sm:w-36 h-36 shrink-0 bg-[#F8F4ED] rounded-xl overflow-hidden cursor-pointer"
                      onClick={() =>
                        navigate(`/products/${product.id}`)
                      }
                    >
                      {imageUrl ? (
                        <img
                          src={imageUrl}
                          alt={product.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-xs text-[#8B6248]/60">
                          No Image
                        </div>
                      )}
                    </div>

                    {/* Product Information */}
                    <div className="flex-1 min-w-0">

                      <div className="flex justify-between gap-3">
                        <div>
                          <p className="text-xs text-[#B87552] mb-1">
                            {product.category?.name || "Handmade"}
                          </p>

                          <h2
                            onClick={() =>
                              navigate(`/products/${product.id}`)
                            }
                            className="font-serif text-lg font-semibold text-[#30231E] cursor-pointer hover:text-[#B87552]"
                          >
                            {product.name}
                          </h2>

                          <p className="text-xs text-[#30231E]/50 mt-1">
                            {product.artisan?.business_name || "Artisan"}
                          </p>
                        </div>

                        <button
                          type="button"
                          onClick={() => removeItem(item.id)}
                          disabled={updatingItem === item.id}
                          aria-label="Remove product"
                          className="text-[#8B6248] hover:text-red-600 transition disabled:opacity-40"
                        >
                          <Trash2 size={19} />
                        </button>
                      </div>

                      {/* Price */}
                      <div className="mt-4">
                        <span className="font-semibold text-[#5C3A2E]">
                          ₹{formatPrice(item.unit_price)}
                        </span>

                        {Number(product.discount_price) > 0 &&
                          Number(product.discount_price) < Number(product.price) && (
                            <span className="text-xs text-[#30231E]/40 line-through ml-2">
                              ₹{formatPrice(product.price)}
                            </span>
                          )}
                      </div>

                      {/* Quantity Controls */}
                      <div className="flex flex-wrap items-center justify-between gap-4 mt-4">

                        <div className="flex items-center border border-[#30231E]/15 rounded-lg overflow-hidden">
                          <button
                            type="button"
                            onClick={() =>
                              updateQuantity(item, item.quantity - 1)
                            }
                            disabled={
                              updatingItem === item.id ||
                              item.quantity <= 1
                            }
                            className="p-2 text-[#5C3A2E] hover:bg-[#F8F4ED] disabled:opacity-40"
                          >
                            <Minus size={15} />
                          </button>

                          <span className="min-w-10 text-center text-sm font-medium text-[#30231E]">
                            {item.quantity}
                          </span>

                          <button
                            type="button"
                            onClick={() =>
                              updateQuantity(item, item.quantity + 1)
                            }
                            disabled={
                              updatingItem === item.id ||
                              item.quantity >= product.stock
                            }
                            className="p-2 text-[#5C3A2E] hover:bg-[#F8F4ED] disabled:opacity-40"
                          >
                            <Plus size={15} />
                          </button>
                        </div>

                        <div className="text-right">
                          <p className="text-xs text-[#30231E]/50">
                            Subtotal
                          </p>

                          <p className="font-semibold text-[#30231E]">
                            ₹{formatPrice(item.subtotal)}
                          </p>
                        </div>
                      </div>

                      {/* Stock Warning */}
                      {isInvalid && (
                        <div className="mt-4 text-xs text-red-600 flex items-center gap-2">
                          <Package size={15} />
                          {product.stock <= 0
                            ? "This product is currently out of stock."
                            : `Only ${product.stock} items are available. Please reduce the quantity.`}
                        </div>
                      )}

                      {!isInvalid && (
                        <p className="text-xs text-green-700 mt-3">
                          In Stock
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Cart Summary */}
            <aside className="lg:col-span-1">
              <div className="bg-white rounded-2xl border border-[#30231E]/5 p-6 sticky top-6">

                <h2 className="font-serif text-xl font-semibold text-[#30231E] mb-6">
                  Order Summary
                </h2>

                <div className="flex justify-between text-sm text-[#30231E]/70 mb-4">
                  <span>Total Items</span>
                  <span>{cart.total_items}</span>
                </div>

                <div className="border-t border-[#30231E]/10 pt-4 mb-5">
                  <div className="flex justify-between items-center">
                    <span className="font-semibold text-[#30231E]">
                      Cart Total
                    </span>

                    <span className="font-serif text-2xl font-bold text-[#5C3A2E]">
                      ₹{formatPrice(cart.cart_total)}
                    </span>
                  </div>
                </div>

                {hasInvalidItems && (
                  <p className="text-xs text-red-600 mb-4">
                    Please resolve unavailable or excess-quantity items before checkout.
                  </p>
                )}

                <button
  type="button"
  disabled={checkoutDisabled || checkoutLoading}
  onClick={validateCheckout}
  className="w-full bg-[#5C3A2E] text-white py-3 rounded-full text-sm font-semibold hover:bg-[#30231E] transition disabled:bg-gray-300 disabled:text-gray-500 disabled:cursor-not-allowed"
>
  {checkoutLoading ? "Validating..." : "Proceed to Checkout"}
</button>
                <button
                  type="button"
                  onClick={() => navigate("/products")}
                  className="w-full mt-3 border border-[#8B6248] text-[#5C3A2E] py-3 rounded-full text-sm font-medium hover:bg-[#F8F4ED] transition"
                >
                  Continue Shopping
                </button>

                <p className="text-xs text-center text-[#30231E]/45 mt-5">
                  Handmade with Love, Made to Last.
                </p>
              </div>
            </aside>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
