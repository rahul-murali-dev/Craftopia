
import { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

import Header from "../components/layout/Header";
import Footer from "../components/layout/Footer";
import api from "../config/axiosInstance";

const initialAddress = {
  full_name: "",
  phone: "",
  address_line: "",
  city: "",
  state: "",
  pincode: "",
};

const createCheckoutKey = () => {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }

  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(
    /[xy]/g,
    (character) => {
      const random = (Math.random() * 16) | 0;
      const value =
        character === "x" ? random : (random & 0x3) | 0x8;

      return value.toString(16);
    }
  );
};

const loadRazorpayScript = () => {
  return new Promise((resolve) => {
    if (window.Razorpay) {
      resolve(true);
      return;
    }

    const script = document.createElement("script");

    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;

    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);

    document.body.appendChild(script);
  });
};

function CheckoutPage() {
  const navigate = useNavigate();
  const location = useLocation();

  const isBuyNow = location.state?.checkoutMode === "buy-now";
  const buyNowProductId = location.state?.productId;
  const buyNowQuantity = Number(location.state?.quantity || 1);

  const [addresses, setAddresses] = useState([]);
  const [selectedAddress, setSelectedAddress] = useState("");

  const [showNewAddress, setShowNewAddress] = useState(false);
  const [newAddress, setNewAddress] = useState(initialAddress);

  const [cart, setCart] = useState(null);
  const [buyNowProduct, setBuyNowProduct] = useState(null);

  const [loading, setLoading] = useState(true);
  const [placingOrder, setPlacingOrder] = useState(false);
  const [savingAddress, setSavingAddress] = useState(false);

  const [selectedPaymentMethod, setSelectedPaymentMethod] =
    useState("");

  const [pendingOrderId, setPendingOrderId] = useState(null);

  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const checkoutKey = useRef(createCheckoutKey());

  // Fetch addresses and checkout data.
  useEffect(() => {
    const fetchCheckoutData = async () => {
      try {
        setLoading(true);
        setError("");

        if (isBuyNow && !buyNowProductId) {
          throw new Error(
            "Product information is missing. Please try Buy Now again."
          );
        }

        const addressPromise = api.get("/auth/addresses/");

        const checkoutPromise = isBuyNow
          ? api.get(`/products/products/${buyNowProductId}/`)
          : api.get("/products/cart/");

        const [addressResponse, checkoutResponse] =
          await Promise.all([
            addressPromise,
            checkoutPromise,
          ]);

        const addressData = Array.isArray(addressResponse.data)
          ? addressResponse.data
          : addressResponse.data.results || [];

        setAddresses(addressData);

        const defaultAddress = addressData.find(
          (address) => address.is_default
        );

        if (defaultAddress) {
          setSelectedAddress(String(defaultAddress.id));
        } else if (addressData.length > 0) {
          setSelectedAddress(String(addressData[0].id));
        } else {
          setShowNewAddress(true);
        }

        if (isBuyNow) {
          setBuyNowProduct(checkoutResponse.data);
          setCart(null);
        } else {
          setCart(checkoutResponse.data);
          setBuyNowProduct(null);
        }
      } catch (err) {
        console.error("Checkout data fetch error:", err);

        if (err.response?.status === 401) {
          navigate("/login");
          return;
        }

        setError(
          err.response?.data?.message ||
            err.response?.data?.detail ||
            err.message ||
            "Unable to load checkout details. Please try again."
        );
      } finally {
        setLoading(false);
      }
    };

    fetchCheckoutData();
  }, [navigate, isBuyNow, buyNowProductId]);

  // Buy Now price calculation.
  const buyNowUnitPrice = buyNowProduct
    ? buyNowProduct.discount_price !== null &&
      buyNowProduct.discount_price !== undefined &&
      Number(buyNowProduct.discount_price) < Number(buyNowProduct.price)
      ? Number(buyNowProduct.discount_price)
      : Number(buyNowProduct.price)
    : 0;

  const buyNowSubtotal = buyNowUnitPrice * buyNowQuantity;

  const checkoutTotal = isBuyNow
    ? buyNowSubtotal
    : Number(cart?.cart_total || 0);

  const hasCheckoutItems = isBuyNow
    ? Boolean(
        buyNowProduct &&
          buyNowQuantity > 0 &&
          buyNowProduct.stock >= buyNowQuantity
      )
    : Boolean(cart?.items?.length);

  // Get products included in this checkout.
  const checkoutItems = isBuyNow
    ? buyNowProduct
      ? [buyNowProduct]
      : []
    : cart?.items?.map((item) => item.product).filter(Boolean) || [];

  // Payment method is available only if every product allows it.
  const canUseCOD =
    checkoutItems.length > 0 &&
    checkoutItems.every(
      (product) => product.allow_cod === true
    );

  const canUseOnlinePayment =
    checkoutItems.length > 0 &&
    checkoutItems.every(
      (product) => product.allow_online_payment === true
    );

  // Remove selected method if it is no longer allowed.
  useEffect(() => {
    if (selectedPaymentMethod === "COD" && !canUseCOD) {
      setSelectedPaymentMethod("");
    }

    if (
      selectedPaymentMethod === "RAZORPAY" &&
      !canUseOnlinePayment
    ) {
      setSelectedPaymentMethod("");
    }
  }, [
    selectedPaymentMethod,
    canUseCOD,
    canUseOnlinePayment,
  ]);

  const handleAddressChange = (event) => {
    setSelectedAddress(event.target.value);
    setShowNewAddress(false);
    setError("");
    setSuccessMessage("");
  };

  const handleNewAddressChange = (event) => {
    const { name, value } = event.target;

    setNewAddress((previous) => ({
      ...previous,
      [name]: value,
    }));

    setError("");
    setSuccessMessage("");
  };

  const validateNewAddress = () => {
    const requiredFields = [
      "full_name",
      "phone",
      "address_line",
      "city",
      "state",
      "pincode",
    ];

    for (const field of requiredFields) {
      if (!newAddress[field].trim()) {
        return "Please fill in all address fields.";
      }
    }

    if (!/^[0-9]{10}$/.test(newAddress.phone)) {
      return "Please enter a valid 10-digit phone number.";
    }

    if (!/^[0-9]{6}$/.test(newAddress.pincode)) {
      return "Please enter a valid 6-digit pincode.";
    }

    return "";
  };

  // Save new address.
  const handleSaveAddress = async () => {
    setError("");
    setSuccessMessage("");

    const validationError = validateNewAddress();

    if (validationError) {
      setError(validationError);
      return;
    }

    try {
      setSavingAddress(true);

      const response = await api.post("/auth/addresses/", {
        ...newAddress,
        is_default: false,
      });

      const savedAddress = response.data.address || response.data;

      if (!savedAddress.id) {
        throw new Error(
          "Saved address ID was not returned by the server."
        );
      }

      setAddresses((previous) => [
        ...previous,
        savedAddress,
      ]);

      setSelectedAddress(String(savedAddress.id));
      setShowNewAddress(false);
      setNewAddress(initialAddress);

      setSuccessMessage("Address saved successfully!");
    } catch (err) {
      console.error("Save address error:", err);

      if (err.response?.status === 401) {
        navigate("/login");
        return;
      }

      const serverErrors = err.response?.data;

      setError(
        serverErrors?.message ||
          serverErrors?.detail ||
          (typeof serverErrors === "object"
            ? Object.values(serverErrors).flat().join(" ")
            : null) ||
          err.message ||
          "Unable to save address. Please try again."
      );
    } finally {
      setSavingAddress(false);
    }
  };

  const handlePaymentMethodChange = (method) => {
    setSelectedPaymentMethod((previous) =>
      previous === method ? "" : method
    );

    setError("");
  };

  // Verify successful Razorpay payment.
  const verifyRazorpayPayment = async (
    orderId,
    paymentResponse
  ) => {
    try {
      const response = await api.post(
        `/orders/${orderId}/verify-payment/`,
        {
          razorpay_order_id: paymentResponse.razorpay_order_id,
          razorpay_payment_id: paymentResponse.razorpay_payment_id,
          razorpay_signature: paymentResponse.razorpay_signature,
        }
      );

      const verifiedOrder = response.data.order;

      if (!verifiedOrder) {
        throw new Error(
          "Payment verification response did not contain an order."
        );
      }

      if (!isBuyNow) {
        window.dispatchEvent(new Event("cartUpdated"));
      }

      navigate("/order-confirmation", {
        state: {
          order: verifiedOrder,
        },
      });
    } catch (err) {
      console.error("Payment verification error:", err);

      setPendingOrderId(orderId);

      setError(
        err.response?.data?.error ||
          err.response?.data?.message ||
          "Payment verification could not be completed. Please check My Orders."
      );

      setPlacingOrder(false);
    }
  };

  // Open Razorpay Checkout.
  const openRazorpayCheckout = (order, razorpayData) => {
    const options = {
      key: razorpayData.key,
      amount: razorpayData.amount,
      currency: razorpayData.currency,

      name: "Craftopia",
      description: "Handmade products order",

      order_id: razorpayData.razorpay_order_id,

      handler: async (paymentResponse) => {
        await verifyRazorpayPayment(
          order.id,
          paymentResponse
        );
      },

      prefill: {
        name: order.full_name || "",
        contact: order.phone || "",
      },

      theme: {
        color: "#5C3A2E",
      },

      modal: {
        ondismiss: () => {
          setPendingOrderId(order.id);
          setPlacingOrder(false);

          setError(
            "Payment was not completed. Your order is pending. Please check My Orders."
          );
        },
      },
    };

    const razorpay = new window.Razorpay(options);

    razorpay.on("payment.failed", (paymentFailure) => {
      console.error("Razorpay payment failed:", paymentFailure);

      setPendingOrderId(order.id);
      setPlacingOrder(false);

      setError(
        paymentFailure.error?.description ||
          "Payment failed. Please check your order in My Orders."
      );
    });

    razorpay.open();
  };

  // Place COD or Razorpay order.
  const handlePlaceOrder = async () => {
    setError("");
    setSuccessMessage("");

    if (pendingOrderId) {
      setError(
        "You already have a pending payment order. Please check My Orders."
      );
      return;
    }

    if (!hasCheckoutItems) {
      setError(
        isBuyNow
          ? "This product is unavailable or does not have enough stock."
          : "Your cart is empty."
      );
      return;
    }

    if (showNewAddress) {
      setError(
        "Please save your new address or select a saved address."
      );
      return;
    }

    if (!selectedAddress) {
      setError("Please select a delivery address.");
      return;
    }

    if (!selectedPaymentMethod) {
      setError("Please select a payment method.");
      return;
    }

    // Final frontend restriction check.
    if (
      selectedPaymentMethod === "COD" &&
      !canUseCOD
    ) {
      setError(
        "Cash on Delivery is not available for all products in your order."
      );
      setSelectedPaymentMethod("");
      return;
    }

    if (
      selectedPaymentMethod === "RAZORPAY" &&
      !canUseOnlinePayment
    ) {
      setError(
        "Online payment is not available for all products in your order."
      );
      setSelectedPaymentMethod("");
      return;
    }

    if (!canUseCOD && !canUseOnlinePayment) {
      setError(
        "No common payment method is available for these products. Please change your cart."
      );
      return;
    }

    try {
      setPlacingOrder(true);

      if (selectedPaymentMethod === "RAZORPAY") {
        const scriptLoaded = await loadRazorpayScript();

        if (!scriptLoaded) {
          setError(
            "Unable to load Razorpay. Please check your internet connection and try again."
          );
          setPlacingOrder(false);
          return;
        }
      }

      const payload = {
        checkout_key: checkoutKey.current,
        payment_method: selectedPaymentMethod,
        address_id: Number(selectedAddress),
      };

      let response;

      if (isBuyNow) {
        response = await api.post("/orders/buy-now/", {
          ...payload,
          product_id: Number(buyNowProductId),
          quantity: buyNowQuantity,
        });
      } else {
        response = await api.post("/orders/checkout/", payload);
      }

      // COD response.
      if (selectedPaymentMethod === "COD") {
        const order = response.data;

        if (!order?.id) {
          throw new Error(
            "Invalid order response received from the server."
          );
        }

        if (!isBuyNow) {
          window.dispatchEvent(new Event("cartUpdated"));
        }

        navigate("/order-confirmation", {
          state: {
            order,
          },
        });

        return;
      }

      // Razorpay response.
      const order = response.data.order;
      const razorpayData = response.data.razorpay;

      if (
        !order?.id ||
        !razorpayData?.razorpay_order_id ||
        !razorpayData?.key
      ) {
        throw new Error(
          "Invalid Razorpay response received from the server."
        );
      }

      setPendingOrderId(order.id);

      if (!isBuyNow) {
        window.dispatchEvent(new Event("cartUpdated"));
      }

      openRazorpayCheckout(order, razorpayData);
    } catch (err) {
      console.error("Checkout error:", err);

      if (err.response?.status === 401) {
        navigate("/login");
        return;
      }

      const responseData = err.response?.data;

      setError(
        responseData?.message ||
          responseData?.detail ||
          responseData?.error ||
          (typeof responseData === "object"
            ? Object.values(responseData).flat().join(" ")
            : null) ||
          err.message ||
          "Unable to place your order. Please try again."
      );

      setPlacingOrder(false);
    }
  };

  if (loading) {
    return (
      <>
        <Header />

        <div className="min-h-[60vh] flex items-center justify-center">
          <p className="text-[#5C3A2E]">
            Loading checkout...
          </p>
        </div>

        <Footer />
      </>
    );
  }

  return (
    <>
      <Header />

      <main className="min-h-screen bg-[#F8F4ED] px-4 py-10">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-3xl font-serif font-bold text-[#30231E] mb-2">
            Checkout
          </h1>

          <p className="text-gray-600 mb-8">
            Review your order and confirm your delivery details.
          </p>

          {error && (
            <div className="mb-6 rounded-lg border border-red-300 bg-red-50 px-4 py-3 text-red-700">
              {error}
            </div>
          )}

          {successMessage && (
            <div className="mb-6 rounded-lg border border-green-300 bg-green-50 px-4 py-3 text-green-700">
              {successMessage}
            </div>
          )}

          {pendingOrderId && (
            <div className="mb-6">
              <button
                type="button"
                onClick={() => navigate("/my-orders")}
                className="rounded-lg bg-[#5C3A2E] px-5 py-3 font-semibold text-white hover:bg-[#30231E]"
              >
                Go to My Orders
              </button>
            </div>
          )}

          {!isBuyNow && !hasCheckoutItems && (
            <div className="bg-white rounded-xl p-8 text-center shadow-sm">
              <h2 className="text-xl font-semibold text-[#30231E]">
                Your cart is empty
              </h2>

              <button
                type="button"
                onClick={() => navigate("/products")}
                className="mt-5 rounded-lg bg-[#5C3A2E] px-6 py-3 text-white hover:bg-[#30231E]"
              >
                Continue Shopping
              </button>
            </div>
          )}

          {isBuyNow && !hasCheckoutItems && (
            <div className="bg-white rounded-xl p-8 text-center shadow-sm">
              <h2 className="text-xl font-semibold text-[#30231E]">
                Product Unavailable
              </h2>

              <p className="text-gray-600 mt-2">
                {buyNowProduct
                  ? "This product does not have enough stock."
                  : "Unable to load the selected product. Please try again."}
              </p>

              <button
                type="button"
                onClick={() =>
                  navigate(
                    buyNowProductId
                      ? `/products/${buyNowProductId}`
                      : "/products"
                  )
                }
                className="mt-5 rounded-lg bg-[#5C3A2E] px-6 py-3 text-white hover:bg-[#30231E]"
              >
                Back to Product
              </button>
            </div>
          )}

          {hasCheckoutItems && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Delivery Address */}
              <section className="lg:col-span-2 bg-white rounded-xl p-6 shadow-sm">
                <h2 className="text-xl font-semibold text-[#30231E] mb-5">
                  Delivery Address
                </h2>

                {!showNewAddress && addresses.length > 0 && (
                  <div className="space-y-4">
                    {addresses.map((address) => (
                      <label
                        key={address.id}
                        className={`block cursor-pointer rounded-lg border p-4 ${
                          selectedAddress === String(address.id)
                            ? "border-[#8B6248] bg-[#F8F4ED]"
                            : "border-gray-200"
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <input
                            type="radio"
                            name="deliveryAddress"
                            value={address.id}
                            checked={
                              selectedAddress === String(address.id)
                            }
                            onChange={handleAddressChange}
                            className="mt-1 accent-[#5C3A2E]"
                          />

                          <div>
                            <p className="font-semibold text-[#30231E]">
                              {address.full_name}
                            </p>

                            <p className="text-sm text-gray-600 mt-1">
                              {address.address_line}, {address.city},{" "}
                              {address.state} - {address.pincode}
                            </p>

                            <p className="text-sm text-gray-600 mt-1">
                              Phone: {address.phone}
                            </p>

                            {address.is_default && (
                              <span className="inline-block mt-2 text-xs font-semibold text-[#8B6248]">
                                Default Address
                              </span>
                            )}
                          </div>
                        </div>
                      </label>
                    ))}
                  </div>
                )}

                {!showNewAddress && (
                  <button
                    type="button"
                    onClick={() => {
                      setShowNewAddress(true);
                      setError("");
                      setSuccessMessage("");
                    }}
                    className="mt-5 text-[#8B6248] font-semibold hover:underline"
                  >
                    + Add a New Address
                  </button>
                )}

                {showNewAddress && (
                  <div className="space-y-4">
                    <h3 className="font-semibold text-[#30231E]">
                      Enter Delivery Address
                    </h3>

                    {[
                      {
                        name: "full_name",
                        label: "Full Name",
                        type: "text",
                      },
                      {
                        name: "phone",
                        label: "Phone Number",
                        type: "tel",
                      },
                      {
                        name: "address_line",
                        label: "Address",
                        type: "text",
                      },
                      {
                        name: "city",
                        label: "City",
                        type: "text",
                      },
                      {
                        name: "state",
                        label: "State",
                        type: "text",
                      },
                      {
                        name: "pincode",
                        label: "Pincode",
                        type: "text",
                      },
                    ].map((field) => (
                      <div key={field.name}>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          {field.label}
                        </label>

                        <input
                          type={field.type}
                          name={field.name}
                          value={newAddress[field.name]}
                          onChange={handleNewAddressChange}
                          className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-[#8B6248]"
                          placeholder={`Enter ${field.label.toLowerCase()}`}
                        />
                      </div>
                    ))}

                    <button
                      type="button"
                      onClick={handleSaveAddress}
                      disabled={savingAddress}
                      className="w-full rounded-lg bg-[#5C3A2E] px-5 py-3 font-semibold text-white hover:bg-[#30231E] disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {savingAddress
                        ? "Saving Address..."
                        : "Save Address"}
                    </button>

                    {addresses.length > 0 && (
                      <button
                        type="button"
                        onClick={() => {
                          setShowNewAddress(false);
                          setError("");
                          setSuccessMessage("");
                        }}
                        className="text-sm text-[#8B6248] font-semibold hover:underline"
                      >
                        Choose a Saved Address
                      </button>
                    )}
                  </div>
                )}
              </section>

              {/* Order Summary */}
              <section className="bg-white rounded-xl p-6 shadow-sm h-fit">
                <h2 className="text-xl font-semibold text-[#30231E] mb-5">
                  Order Summary
                </h2>

                <div className="space-y-4">
                  {isBuyNow && buyNowProduct && (
                    <div className="flex justify-between gap-3 border-b border-gray-100 pb-4">
                      <div>
                        <p className="font-medium text-[#30231E]">
                          {buyNowProduct.name}
                        </p>

                        <p className="text-sm text-gray-500">
                          Quantity: {buyNowQuantity}
                        </p>

                        <p className="text-xs text-gray-500 mt-1">
                          ₹{buyNowUnitPrice.toFixed(2)} each
                        </p>
                      </div>

                      <p className="font-semibold text-[#5C3A2E] whitespace-nowrap">
                        ₹{buyNowSubtotal.toFixed(2)}
                      </p>
                    </div>
                  )}

                  {!isBuyNow &&
                    cart?.items?.map((item) => (
                      <div
                        key={item.id}
                        className="flex justify-between gap-3 border-b border-gray-100 pb-4"
                      >
                        <div>
                          <p className="font-medium text-[#30231E]">
                            {item.product?.name || item.product_name}
                          </p>

                          <p className="text-sm text-gray-500">
                            Quantity: {item.quantity}
                          </p>
                        </div>

                        <p className="font-semibold text-[#5C3A2E] whitespace-nowrap">
                          ₹{Number(item.subtotal).toFixed(2)}
                        </p>
                      </div>
                    ))}
                </div>

                <div className="space-y-3 mt-5 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Subtotal</span>
                    <span>₹{checkoutTotal.toFixed(2)}</span>
                  </div>

                  <div className="flex justify-between">
                    <span className="text-gray-600">Shipping</span>
                    <span>₹0.00</span>
                  </div>

                  <div className="flex justify-between">
                    <span className="text-gray-600">Tax</span>
                    <span>₹0.00</span>
                  </div>
                </div>

                <div className="border-t border-gray-200 mt-5 pt-5 flex justify-between">
                  <span className="font-bold text-[#30231E]">
                    Total Payable
                  </span>

                  <span className="font-bold text-lg text-[#5C3A2E]">
                    ₹{checkoutTotal.toFixed(2)}
                  </span>
                </div>

                {/* Payment Methods */}
                <div className="mt-6">
                  <h3 className="font-semibold text-[#30231E] mb-3">
                    Select Payment Method
                  </h3>

                  {canUseCOD && (
                    <button
                      type="button"
                      onClick={() =>
                        handlePaymentMethodChange("COD")
                      }
                      aria-pressed={selectedPaymentMethod === "COD"}
                      className={`w-full flex items-start gap-3 text-left rounded-lg border p-4 mb-3 transition ${
                        selectedPaymentMethod === "COD"
                          ? "border-[#8B6248] bg-[#F8F4ED]"
                          : "border-gray-200 bg-white hover:border-[#8B6248]"
                      }`}
                    >
                      <span
                        className={`mt-1 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border ${
                          selectedPaymentMethod === "COD"
                            ? "border-[#5C3A2E]"
                            : "border-gray-400"
                        }`}
                      >
                        {selectedPaymentMethod === "COD" && (
                          <span className="h-2.5 w-2.5 rounded-full bg-[#5C3A2E]" />
                        )}
                      </span>

                      <span>
                        <span className="block font-medium text-[#30231E]">
                          Cash on Delivery
                        </span>

                        <span className="block text-sm text-gray-600 mt-1">
                          Pay when your order is delivered.
                        </span>
                      </span>
                    </button>
                  )}

                  {canUseOnlinePayment && (
                    <button
                      type="button"
                      onClick={() =>
                        handlePaymentMethodChange("RAZORPAY")
                      }
                      aria-pressed={
                        selectedPaymentMethod === "RAZORPAY"
                      }
                      className={`w-full flex items-start gap-3 text-left rounded-lg border p-4 transition ${
                        selectedPaymentMethod === "RAZORPAY"
                          ? "border-[#8B6248] bg-[#F8F4ED]"
                          : "border-gray-200 bg-white hover:border-[#8B6248]"
                      }`}
                    >
                      <span
                        className={`mt-1 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border ${
                          selectedPaymentMethod === "RAZORPAY"
                            ? "border-[#5C3A2E]"
                            : "border-gray-400"
                        }`}
                      >
                        {selectedPaymentMethod === "RAZORPAY" && (
                          <span className="h-2.5 w-2.5 rounded-full bg-[#5C3A2E]" />
                        )}
                      </span>

                      <span>
                        <span className="block font-medium text-[#30231E]">
                          Online Payment
                        </span>

                        <span className="block text-sm text-gray-600 mt-1">
                          Pay securely using Razorpay.
                        </span>

                        <span className="block text-xs text-gray-500 mt-2">
                          UPI, Debit Card, Credit Card and other supported methods.
                        </span>
                      </span>
                    </button>
                  )}

                  {!canUseCOD && !canUseOnlinePayment && (
                    <div className="rounded-lg border border-red-200 bg-red-50 p-4">
                      <p className="font-medium text-red-700">
                        No payment method available
                      </p>

                      <p className="mt-1 text-sm text-red-600">
                        The products in your order have different payment
                        restrictions. Please remove or change products in
                        your cart.
                      </p>
                    </div>
                  )}

                  {(canUseCOD || canUseOnlinePayment) && (
                    <p className="text-xs text-gray-500 mt-3">
                      Click the selected option again to unselect it.
                    </p>
                  )}
                </div>

                <button
                  type="button"
                  onClick={handlePlaceOrder}
                  disabled={
                    placingOrder ||
                    savingAddress ||
                    !hasCheckoutItems ||
                    showNewAddress ||
                    !selectedPaymentMethod ||
                    (!canUseCOD && !canUseOnlinePayment) ||
                    Boolean(pendingOrderId)
                  }
                  className="w-full mt-6 rounded-lg bg-[#5C3A2E] px-5 py-3 font-semibold text-white hover:bg-[#30231E] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {placingOrder
                    ? "Processing..."
                    : selectedPaymentMethod === "RAZORPAY"
                    ? "Pay Now"
                    : "Place Order"}
                </button>

                <button
                  type="button"
                  onClick={() =>
                    navigate(
                      isBuyNow
                        ? `/products/${buyNowProductId}`
                        : "/cart"
                    )
                  }
                  disabled={placingOrder}
                  className="w-full mt-3 rounded-lg border border-[#8B6248] px-5 py-3 font-semibold text-[#5C3A2E] hover:bg-[#F8F4ED] disabled:opacity-50"
                >
                  {isBuyNow ? "Back to Product" : "Back to Cart"}
                </button>
              </section>
            </div>
          )}
        </div>
      </main>

      <Footer />
    </>
  );
}

export default CheckoutPage;
