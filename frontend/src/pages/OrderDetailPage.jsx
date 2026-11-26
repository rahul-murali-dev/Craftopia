
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import Header from "../components/layout/Header";
import Footer from "../components/layout/Footer";
import api from "../config/axiosInstance";

function OrderDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [cancelItemId, setCancelItemId] = useState(null);
  const [showReturnForm, setShowReturnForm] = useState(false);
  const [showCODConfirmation, setShowCODConfirmation] = useState(false);

  const [cancelReason, setCancelReason] = useState("");
  const [returnReason, setReturnReason] = useState("");

  const [actionLoading, setActionLoading] = useState(false);
  const [invoiceLoading, setInvoiceLoading] = useState(false);
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");

  const fetchOrder = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await api.get(`/orders/${id}/`);
      setOrder(response.data);
    } catch (err) {
      if (err.response?.status === 401) {
        navigate("/login");
        return;
      }

      setError(
        err.response?.data?.message ||
        err.response?.data?.detail ||
        err.response?.data?.error ||
        "Unable to load order details."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrder();
  }, [id]);

  const formatPrice = (amount) =>
    `₹${Number(amount || 0).toFixed(2)}`;

  const formatDate = (date) => {
    if (!date) return "-";

    return new Date(date).toLocaleString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const displayStatus = (value) =>
    value?.replaceAll("_", " ") || "UNKNOWN";

  const getStatusStyle = (value) => {
    switch (value) {
      case "CONFIRMED":
        return "bg-blue-100 text-blue-700";
      case "SHIPPED":
        return "bg-purple-100 text-purple-700";
      case "OUT_FOR_DELIVERY":
        return "bg-orange-100 text-orange-700";
      case "DELIVERED":
        return "bg-green-100 text-green-700";
      case "CANCELLED":
        return "bg-red-100 text-red-700";
      case "PENDING":
        return "bg-yellow-100 text-yellow-700";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  const getReturnStatusStyle = (value) => {
    switch (value) {
      case "PENDING":
        return "bg-yellow-100 text-yellow-700";
      case "APPROVED":
        return "bg-blue-100 text-blue-700";
      case "REJECTED":
        return "bg-red-100 text-red-700";
      case "COMPLETED":
        return "bg-green-100 text-green-700";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  const getPaymentStatusStyle = (value) => {
    switch (value) {
      case "SUCCESS":
        return "bg-green-100 text-green-700";
      case "PENDING":
        return "bg-yellow-100 text-yellow-700";
      case "FAILED":
        return "bg-red-100 text-red-700";
      case "REFUNDED":
        return "bg-blue-100 text-blue-700";
      case "REFUND_PENDING":
        return "bg-orange-100 text-orange-700";
      case "REFUND_FAILED":
        return "bg-red-100 text-red-700";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  const loadRazorpayScript = () => {
    return new Promise((resolve) => {
      if (window.Razorpay) {
        resolve(true);
        return;
      }

      const existingScript = document.querySelector(
        'script[src="https://checkout.razorpay.com/v1/checkout.js"]'
      );

      if (existingScript) {
        existingScript.addEventListener("load", () => resolve(true), {
          once: true,
        });

        existingScript.addEventListener("error", () => resolve(false), {
          once: true,
        });

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

  const handleRetryPayment = async () => {
    try {
      setPaymentLoading(true);
      setError("");
      setSuccessMessage("");

      const scriptLoaded = await loadRazorpayScript();

      if (!scriptLoaded) {
        setError(
          "Unable to load Razorpay. Please check your internet connection and try again."
        );
        return;
      }

      const response = await api.post(
        `/orders/${id}/retry-payment/`
      );

      const paymentData = response.data.razorpay;

      if (!paymentData?.razorpay_order_id) {
        throw new Error("Razorpay payment information is missing.");
      }

      const options = {
        key: paymentData.key,
        amount: paymentData.amount,
        currency: paymentData.currency,
        name: "Craftopia",
        description: `Payment for Order ${order.order_number}`,
        order_id: paymentData.razorpay_order_id,

        prefill: {
          name: order.full_name || "",
          contact: order.phone || "",
        },

        theme: {
          color: "#5C3A2E",
        },

        handler: async function (razorpayResponse) {
          try {
            setPaymentLoading(true);
            setError("");
            setSuccessMessage("");

            const verifyResponse = await api.post(
              `/orders/${id}/verify-payment/`,
              {
                razorpay_order_id:
                  razorpayResponse.razorpay_order_id,
                razorpay_payment_id:
                  razorpayResponse.razorpay_payment_id,
                razorpay_signature:
                  razorpayResponse.razorpay_signature,
              }
            );

            if (verifyResponse.data.order) {
              setOrder(verifyResponse.data.order);
            } else {
              await fetchOrder();
            }

            setSuccessMessage(
              "Payment successful! Your order has been confirmed."
            );
          } catch (err) {
            setError(
              err.response?.data?.error ||
              err.response?.data?.detail ||
              "Payment verification failed. Please check your order status."
            );

            await fetchOrder();
          } finally {
            setPaymentLoading(false);
          }
        },

        modal: {
          ondismiss: async function () {
            setPaymentLoading(false);
            setError(
              "Payment was not completed. You can retry payment or change to COD."
            );
            await fetchOrder();
          },
        },
      };

      const razorpayInstance = new window.Razorpay(options);

      razorpayInstance.on("payment.failed", function (response) {
        setError(
          response.error?.description ||
          "Payment failed. You can try again."
        );

        fetchOrder();
      });

      razorpayInstance.open();
    } catch (err) {
      setError(
        err.response?.data?.error ||
        err.response?.data?.detail ||
        err.message ||
        "Unable to retry payment. Please try again."
      );
    } finally {
      setPaymentLoading(false);
    }
  };

  const handleChangeToCOD = async () => {
    try {
      setPaymentLoading(true);
      setError("");
      setSuccessMessage("");

      const response = await api.post(
        `/orders/${id}/change-payment-method/`
      );

      setOrder(response.data.order);
      setShowCODConfirmation(false);

      setSuccessMessage(
        "Payment method changed to Cash on Delivery successfully."
      );
    } catch (err) {
      setError(
        err.response?.data?.error ||
        err.response?.data?.detail ||
        "Unable to change payment method."
      );
    } finally {
      setPaymentLoading(false);
    }
  };

  const getImageUrl = (image) => {
    if (!image) return "";

    if (
      image.startsWith("http://") ||
      image.startsWith("https://")
    ) {
      return image;
    }

    const baseURL = api.defaults.baseURL?.replace(/\/api\/?$/, "");

    return `${baseURL}${image.startsWith("/") ? image : `/${image}`}`;
  };

  const handleCancelOrder = async (itemId) => {
    try {
      setActionLoading(true);
      setError("");
      setSuccessMessage("");

      const response = await api.post(`/orders/${id}/cancel/`, {
        order_item_id: itemId,
        reason: cancelReason.trim(),
      });

      setOrder(response.data);
      setCancelItemId(null);
      setCancelReason("");

      setSuccessMessage(
        "The selected product has been cancelled successfully."
      );
    } catch (err) {
      const errorData = err.response?.data;

      setError(
        errorData?.message ||
        errorData?.detail ||
        errorData?.error ||
        errorData?.order_item_id?.[0] ||
        "Unable to cancel this product."
      );
    } finally {
      setActionLoading(false);
    }
  };

  const handleReturnRequest = async () => {
    if (!returnReason.trim()) {
      setError("Please enter a reason for returning this order.");
      return;
    }

    try {
      setActionLoading(true);
      setError("");
      setSuccessMessage("");

      await api.post(`/orders/${id}/return/`, {
        reason: returnReason.trim(),
      });

      const response = await api.get(`/orders/${id}/`);
      setOrder(response.data);

      setShowReturnForm(false);
      setReturnReason("");

      setSuccessMessage(
        "Your return request has been submitted successfully."
      );
    } catch (err) {
      const errorData = err.response?.data;

      if (typeof errorData === "string") {
        setError(errorData);
      } else {
        setError(
          errorData?.message ||
          errorData?.detail ||
          errorData?.reason?.[0] ||
          errorData?.non_field_errors?.[0] ||
          errorData?.error ||
          "Unable to submit your return request."
        );
      }
    } finally {
      setActionLoading(false);
    }
  };

  const handleDownloadInvoice = async () => {
    try {
      setInvoiceLoading(true);
      setError("");

      const response = await api.get(`/orders/${id}/invoice/`, {
        responseType: "blob",
      });

      const blob = new Blob([response.data], {
        type: "application/pdf",
      });

      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement("a");

      link.href = downloadUrl;
      link.download = `Craftopia-Invoice-${order.order_number}.pdf`;

      document.body.appendChild(link);
      link.click();
      link.remove();

      window.URL.revokeObjectURL(downloadUrl);
    } catch (err) {
      setError(
        "Unable to download the invoice. Please try again."
      );
    } finally {
      setInvoiceLoading(false);
    }
  };

  const canCancel =
    order && ["PENDING", "CONFIRMED"].includes(order.status);

  const canReturn =
    order &&
    order.status === "DELIVERED" &&
    !order.return_request;

  const returnRequest = order?.return_request;
  const payment = order?.payment;

  const canRetryPayment =
    order?.status === "PENDING" &&
    payment?.payment_method === "RAZORPAY" &&
    ["PENDING", "FAILED"].includes(payment?.status);

  return (
    <>
      <Header />

      <main className="min-h-screen bg-[#F8F4ED] px-4 py-10">
        <div className="max-w-5xl mx-auto">
          <button
            type="button"
            onClick={() => navigate("/my-orders")}
            className="mb-6 text-[#8B6248] font-semibold hover:underline"
          >
            ← Back to My Orders
          </button>

          {loading && (
            <div className="bg-white rounded-xl p-10 text-center">
              Loading order details...
            </div>
          )}

          {!loading && error && !order && (
            <div className="bg-white rounded-xl p-8 text-center">
              <p className="text-red-600">{error}</p>

              <button
                onClick={fetchOrder}
                className="mt-5 rounded-lg bg-[#5C3A2E] px-6 py-3 text-white"
              >
                Try Again
              </button>
            </div>
          )}

          {!loading && order && (
            <>
              {/* Order Header */}
              <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4">
                  <div>
                    <h1 className="text-2xl font-serif font-bold text-[#30231E]">
                      Order Details
                    </h1>

                    <p className="text-sm text-gray-500 mt-2">
                      Order Number
                    </p>

                    <p className="font-semibold text-[#5C3A2E] break-all">
                      {order.order_number}
                    </p>

                    <p className="text-sm text-gray-500 mt-3">
                      Placed on {formatDate(order.created_at)}
                    </p>
                  </div>

                  <span
                    className={`rounded-full px-4 py-2 text-sm font-semibold w-fit ${getStatusStyle(
                      order.status
                    )}`}
                  >
                    {displayStatus(order.status)}
                  </span>
                </div>

                <div className="border-t border-gray-100 mt-6 pt-5 flex flex-wrap gap-3">
                  {canReturn && (
                    <button
                      type="button"
                      onClick={() => {
                        setShowReturnForm(!showReturnForm);
                        setCancelItemId(null);
                        setError("");
                      }}
                      className="rounded-lg bg-[#8B6248] px-5 py-2.5 text-white hover:bg-[#5C3A2E]"
                    >
                      Request Return
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={handleDownloadInvoice}
                    disabled={invoiceLoading}
                    className="rounded-lg border border-[#8B6248] px-5 py-2.5 text-[#5C3A2E] hover:bg-[#F8F4ED] disabled:opacity-60"
                  >
                    {invoiceLoading
                      ? "Downloading..."
                      : "Download Invoice"}
                  </button>
                </div>
              </div>

              {/* Messages */}
              {error && (
                <div className="mb-5 rounded-lg border border-red-300 bg-red-50 p-4 text-red-700">
                  {error}
                </div>
              )}

              {successMessage && (
                <div className="mb-5 rounded-lg border border-green-300 bg-green-50 p-4 text-green-700">
                  {successMessage}
                </div>
              )}

              {/* Payment Information */}
              <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
                <h2 className="text-xl font-semibold text-[#30231E] mb-5">
                  Payment Information
                </h2>

                {payment ? (
                  <>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                      <div>
                        <p className="text-sm text-gray-500">
                          Payment Method
                        </p>

                        <p className="font-semibold text-[#30231E] mt-1">
                          {payment.payment_method === "RAZORPAY"
                            ? "Razorpay"
                            : "Cash on Delivery"}
                        </p>
                      </div>

                      <div>
                        <p className="text-sm text-gray-500">
                          Payment Status
                        </p>

                        <span
                          className={`inline-block mt-1 rounded-full px-3 py-1 text-sm font-semibold ${getPaymentStatusStyle(
                            payment.status
                          )}`}
                        >
                          {displayStatus(payment.status)}
                        </span>
                      </div>

                      <div>
                        <p className="text-sm text-gray-500">
                          Payment Amount
                        </p>

                        <p className="font-semibold text-[#30231E] mt-1">
                          {formatPrice(payment.amount)}
                        </p>
                      </div>
                    </div>

                    {payment.failure_reason && (
                      <p className="mt-4 text-sm text-red-600">
                        {payment.failure_reason}
                      </p>
                    )}

                    {canRetryPayment && (
                      <div className="mt-6 border-t border-gray-100 pt-5">
                        <p className="text-sm text-gray-600 mb-4">
                          Your payment is not completed. You can retry
                          Razorpay payment or change your payment method
                          to Cash on Delivery.
                        </p>

                        <div className="flex flex-wrap gap-3">
                          <button
                            type="button"
                            onClick={handleRetryPayment}
                            disabled={paymentLoading}
                            className="rounded-lg bg-[#5C3A2E] px-5 py-3 text-white hover:bg-[#30231E] disabled:opacity-60"
                          >
                            {paymentLoading
                              ? "Please wait..."
                              : "Retry Payment"}
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              setShowCODConfirmation(!showCODConfirmation);
                              setError("");
                            }}
                            disabled={paymentLoading}
                            className="rounded-lg border border-[#8B6248] px-5 py-3 text-[#5C3A2E] hover:bg-[#F8F4ED] disabled:opacity-60"
                          >
                            Change to COD
                          </button>
                        </div>

                        {showCODConfirmation && (
                          <div className="mt-5 rounded-lg border border-[#D8C5B8] bg-[#F8F4ED] p-4">
                            <p className="font-semibold text-[#30231E]">
                              Confirm payment method change
                            </p>

                            <p className="text-sm text-gray-600 mt-2">
                              Are you sure you want to change this order
                              to Cash on Delivery? Your previous Razorpay
                              payment attempt will no longer be active.
                            </p>

                            <div className="flex flex-wrap gap-3 mt-4">
                              <button
                                type="button"
                                onClick={handleChangeToCOD}
                                disabled={paymentLoading}
                                className="rounded-lg bg-[#5C3A2E] px-5 py-2.5 text-white hover:bg-[#30231E] disabled:opacity-60"
                              >
                                {paymentLoading
                                  ? "Changing..."
                                  : "Confirm Change to COD"}
                              </button>

                              <button
                                type="button"
                                onClick={() => setShowCODConfirmation(false)}
                                disabled={paymentLoading}
                                className="rounded-lg border border-gray-300 px-5 py-2.5 text-gray-700"
                              >
                                Go Back
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {payment.payment_method === "COD" &&
                      payment.status === "PENDING" && (
                        <p className="mt-5 text-sm text-gray-600 border-t border-gray-100 pt-4">
                          Pay cash when your order is delivered.
                        </p>
                      )}

                    {payment.status === "SUCCESS" && (
                      <p className="mt-5 text-sm text-green-700 border-t border-gray-100 pt-4">
                        Your payment has been completed successfully.
                      </p>
                    )}
                  </>
                ) : (
                  <p className="text-gray-500">
                    Payment information is not available.
                  </p>
                )}
              </div>

              {/* Existing Return Request */}
              {returnRequest && (
                <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
                  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
                    <h2 className="text-xl font-semibold text-[#30231E]">
                      Return Request
                    </h2>

                    <span
                      className={`rounded-full px-4 py-2 text-sm font-semibold w-fit ${getReturnStatusStyle(
                        returnRequest.status
                      )}`}
                    >
                      {displayStatus(returnRequest.status)}
                    </span>
                  </div>

                  <div className="mt-4">
                    <p className="text-sm font-semibold text-gray-700">
                      Your Reason
                    </p>

                    <p className="text-gray-600 mt-1 whitespace-pre-wrap">
                      {returnRequest.reason}
                    </p>
                  </div>

                  {returnRequest.admin_note && (
                    <div className="mt-4 rounded-lg bg-[#F8F4ED] p-4">
                      <p className="text-sm font-semibold text-[#30231E]">
                        Admin Note
                      </p>

                      <p className="text-gray-600 mt-1 whitespace-pre-wrap">
                        {returnRequest.admin_note}
                      </p>
                    </div>
                  )}

                  <div className="mt-4 space-y-2 text-sm text-gray-500">
                    <p>
                      Requested on: {formatDate(returnRequest.created_at)}
                    </p>

                    {returnRequest.reviewed_at && (
                      <p>
                        Reviewed on: {formatDate(returnRequest.reviewed_at)}
                      </p>
                    )}

                    {returnRequest.completed_at && (
                      <p>
                        Completed on: {formatDate(returnRequest.completed_at)}
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* Return Form */}
              {showReturnForm && canReturn && (
                <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
                  <h2 className="text-lg font-semibold text-[#30231E]">
                    Request a Return
                  </h2>

                  <p className="text-sm text-gray-600 mt-2">
                    Please explain why you want to return this order.
                  </p>

                  <textarea
                    value={returnReason}
                    onChange={(event) => setReturnReason(event.target.value)}
                    rows={4}
                    placeholder="Enter your return reason"
                    className="w-full mt-4 rounded-lg border border-gray-300 p-3 outline-none focus:border-[#8B6248]"
                  />

                  <div className="flex flex-wrap gap-3 mt-4">
                    <button
                      type="button"
                      onClick={handleReturnRequest}
                      disabled={actionLoading}
                      className="rounded-lg bg-[#5C3A2E] px-5 py-2.5 text-white hover:bg-[#30231E] disabled:opacity-60"
                    >
                      {actionLoading
                        ? "Submitting..."
                        : "Submit Return Request"}
                    </button>

                    <button
                      type="button"
                      onClick={() => setShowReturnForm(false)}
                      disabled={actionLoading}
                      className="rounded-lg border border-gray-300 px-5 py-2.5 text-gray-700"
                    >
                      Go Back
                    </button>
                  </div>
                </div>
              )}

              {/* Ordered Products */}
              <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
                <h2 className="text-xl font-semibold text-[#30231E] mb-5">
                  Ordered Products
                </h2>

                <div className="space-y-5">
                  {order.items?.map((item) => {
                    const isCancelled = item.is_cancelled === true;
                    const productImage = item.product?.images?.[0]?.image;

                    return (
                      <div
                        key={item.id}
                        className={`rounded-xl border-2 p-4 flex flex-col sm:flex-row sm:items-start gap-4 ${
                          isCancelled
                            ? "border-red-300 bg-red-50"
                            : "border-gray-100 bg-white"
                        }`}
                      >
                        {/* Product Image */}
                        <div className="w-28 h-28 flex-shrink-0 bg-[#F8F4ED] rounded-lg overflow-hidden">
                          {productImage ? (
                            <img
                              src={getImageUrl(productImage)}
                              alt={item.product_name}
                              className={`w-full h-full object-cover ${
                                isCancelled ? "grayscale opacity-60" : ""
                              }`}
                              onError={(event) => {
                                event.currentTarget.style.display = "none";
                              }}
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-xs text-gray-400 text-center p-2">
                              Image unavailable
                            </div>
                          )}
                        </div>

                        {/* Product Details */}
                        <div className="flex-1 min-w-0">
                          <div className="flex flex-wrap items-center gap-3">
                            <h3 className="font-semibold text-lg text-[#30231E]">
                              {item.product_name}
                            </h3>

                            {isCancelled ? (
                              <span className="rounded-full bg-red-600 px-3 py-1 text-xs font-bold tracking-wide text-white">
                                CANCELLED
                              </span>
                            ) : (
                              <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-700">
                                ACTIVE
                              </span>
                            )}
                          </div>

                          <p className="text-sm text-gray-600 mt-3">
                            Quantity: {item.quantity}
                          </p>

                          <p className="text-sm text-gray-600 mt-1">
                            Unit Price: {formatPrice(item.unit_price)}
                          </p>

                          <p className="text-sm font-semibold text-[#5C3A2E] mt-2">
                            Item Subtotal: {formatPrice(item.subtotal)}
                          </p>

                          {/* Cancelled Product Information */}
                          {isCancelled && (
                            <div className="mt-4 rounded-lg border border-red-200 bg-white p-4">
                              <p className="font-bold text-red-700">
                                This product has been cancelled.
                              </p>

                              <p className="text-sm text-gray-700 mt-2">
                                <strong>Product:</strong> {item.product_name}
                              </p>

                              <p className="text-sm text-gray-700 mt-1">
                                <strong>Quantity:</strong> {item.quantity}
                              </p>

                              <p className="text-sm text-gray-700 mt-1">
                                <strong>Cancellation reason:</strong>{" "}
                                {item.cancellation_reason?.trim() ||
                                  "No reason provided"}
                              </p>

                              <p className="text-xs text-gray-500 mt-2">
                                Cancelled on: {formatDate(item.cancelled_at)}
                              </p>
                            </div>
                          )}

                          {/* Active Product Cancellation */}
                          {!isCancelled && canCancel && (
                            <div className="mt-4">
                              {cancelItemId === item.id ? (
                                <div className="rounded-lg border border-red-200 bg-red-50 p-4">
                                  <p className="font-semibold text-red-700">
                                    Cancel {item.product_name}
                                  </p>

                                  <p className="text-sm text-gray-600 mt-2">
                                    Are you sure you want to cancel this product?
                                  </p>

                                  <textarea
                                    value={cancelReason}
                                    onChange={(event) =>
                                      setCancelReason(event.target.value)
                                    }
                                    rows={3}
                                    maxLength={1000}
                                    placeholder="Enter cancellation reason (optional)"
                                    className="mt-3 w-full rounded-lg border border-gray-300 bg-white p-3 outline-none focus:border-[#8B6248]"
                                  />

                                  <div className="mt-3 flex flex-wrap gap-3">
                                    <button
                                      type="button"
                                      onClick={() => handleCancelOrder(item.id)}
                                      disabled={actionLoading}
                                      className="rounded-lg bg-red-600 px-4 py-2 text-white hover:bg-red-700 disabled:opacity-60"
                                    >
                                      {actionLoading
                                        ? "Cancelling..."
                                        : "Confirm Cancellation"}
                                    </button>

                                    <button
                                      type="button"
                                      onClick={() => {
                                        setCancelItemId(null);
                                        setCancelReason("");
                                      }}
                                      disabled={actionLoading}
                                      className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-gray-700"
                                    >
                                      Go Back
                                    </button>
                                  </div>
                                </div>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => {
                                    setCancelItemId(item.id);
                                    setCancelReason("");
                                    setError("");
                                    setSuccessMessage("");
                                  }}
                                  className="rounded-lg border border-red-500 px-4 py-2 text-sm font-semibold text-red-600 hover:bg-red-50"
                                >
                                  Cancel This Item
                                </button>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}

                  {(!order.items || order.items.length === 0) && (
                    <p className="text-gray-500">
                      No product items found for this order.
                    </p>
                  )}
                </div>

                {/* Updated Price Summary */}
                <div className="space-y-3 mt-6 border-t border-gray-200 pt-5">
                  <h3 className="font-semibold text-[#30231E] mb-3">
                    Updated Order Summary
                  </h3>

                  <div className="flex justify-between">
                    <span className="text-gray-600">Remaining Subtotal</span>
                    <span>{formatPrice(order.subtotal)}</span>
                  </div>

                  <div className="flex justify-between">
                    <span className="text-gray-600">Shipping</span>
                    <span>{formatPrice(order.shipping_charge)}</span>
                  </div>

                  <div className="flex justify-between">
                    <span className="text-gray-600">Tax</span>
                    <span>{formatPrice(order.tax)}</span>
                  </div>

                  {Number(order.discount_amount || 0) > 0 && (
                    <div className="flex justify-between text-green-700">
                      <span>
                        Coupon Discount
                        {order.coupon_code
                          ? ` (${order.coupon_code})`
                          : ""}
                      </span>

                      <span>
                        -{formatPrice(order.discount_amount)}
                      </span>
                    </div>
                  )}

                  <div className="border-t border-gray-200 pt-4 flex justify-between">
                    <span className="font-bold text-[#30231E]">
                      Remaining Order Amount
                    </span>

                    <span className="text-lg font-bold text-[#5C3A2E]">
                      {formatPrice(order.total_amount)}
                    </span>
                  </div>

                  {order.status === "CANCELLED" && (
                    <p className="rounded-lg bg-red-50 border border-red-200 p-3 text-sm font-semibold text-red-700">
                      All products in this order have been cancelled.
                    </p>
                  )}
                </div>
              </div>

              {/* Delivery Address */}
              <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
                <h2 className="text-xl font-semibold text-[#30231E] mb-4">
                  Delivery Address
                </h2>

                <p className="font-medium text-[#30231E]">
                  {order.full_name}
                </p>

                <p className="text-gray-600 mt-2">
                  {order.address_line}
                </p>

                <p className="text-gray-600">
                  {order.city}, {order.state} - {order.pincode}
                </p>

                <p className="text-gray-600 mt-2">
                  Phone: {order.phone}
                </p>
              </div>

              {/* Full Order Cancellation Reason */}
              {order.cancellation_reason && (
                <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
                  <h2 className="font-semibold text-[#30231E]">
                    Order Cancellation Reason
                  </h2>

                  <p className="text-gray-600 mt-2">
                    {order.cancellation_reason}
                  </p>
                </div>
              )}
            </>
          )}
        </div>
      </main>

      <Footer />
    </>
  );
}

export default OrderDetailPage;
