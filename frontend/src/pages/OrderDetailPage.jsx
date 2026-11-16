
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

  const [showCancelForm, setShowCancelForm] = useState(false);
  const [showReturnForm, setShowReturnForm] = useState(false);

  const [cancelReason, setCancelReason] = useState("");
  const [returnReason, setReturnReason] = useState("");

  const [actionLoading, setActionLoading] = useState(false);
  const [invoiceLoading, setInvoiceLoading] = useState(false);
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

  const displayStatus = (status) =>
    status?.replaceAll("_", " ") || "UNKNOWN";

  const getStatusStyle = (status) => {
    switch (status) {
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

  const getReturnStatusStyle = (status) => {
    switch (status) {
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

  const getArtisanStatusStyle = (status) => {
    switch (status) {
      case "PENDING":
        return "bg-yellow-100 text-yellow-700";
      case "ACCEPTED":
        return "bg-green-100 text-green-700";
      case "REJECTED":
        return "bg-red-100 text-red-700";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  const rejectionLabels = {
    OUT_OF_STOCK: "Out of Stock",
    PRODUCT_UNAVAILABLE: "Product Currently Unavailable",
    UNABLE_TO_PREPARE: "Unable to Prepare",
    CUSTOM_ORDER_NOT_POSSIBLE: "Custom Order Not Possible",
    OTHER: "Other",
  };

  // Convert relative media path into backend image URL
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

  // Cancel Order
  const handleCancelOrder = async () => {
    try {
      setActionLoading(true);
      setError("");
      setSuccessMessage("");

      const response = await api.post(`/orders/${id}/cancel/`, {
        reason: cancelReason.trim(),
      });

      setOrder(response.data);
      setShowCancelForm(false);
      setCancelReason("");

      setSuccessMessage(
        "Your order has been cancelled successfully."
      );
    } catch (err) {
      setError(
        err.response?.data?.message ||
          err.response?.data?.detail ||
          err.response?.data?.error ||
          "Unable to cancel this order."
      );
    } finally {
      setActionLoading(false);
    }
  };

  // Return Request
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
      console.error(
        "Return Request Error:",
        err.response?.data || err
      );

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

  // Download Invoice PDF
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

  const artisanResponses = order?.artisan_responses || [];

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
                  {canCancel && (
                    <button
                      type="button"
                      onClick={() => {
                        setShowCancelForm(!showCancelForm);
                        setShowReturnForm(false);
                        setError("");
                      }}
                      className="rounded-lg bg-red-600 px-5 py-2.5 text-white hover:bg-red-700"
                    >
                      Cancel Order
                    </button>
                  )}

                  {canReturn && (
                    <button
                      type="button"
                      onClick={() => {
                        setShowReturnForm(!showReturnForm);
                        setShowCancelForm(false);
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

              {/* Artisan Order Responses */}
              <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
                <h2 className="text-xl font-semibold text-[#30231E] mb-2">
                  Artisan Order Updates
                </h2>

                <p className="text-sm text-gray-500 mb-5">
                  Check the confirmation status of your order from each artisan.
                </p>

                {artisanResponses.length > 0 ? (
                  <div className="space-y-4">
                    {artisanResponses.map((response) => (
                      <div
                        key={response.id}
                        className="border border-[#EDE3D9] rounded-lg p-4"
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                          <div>
                            <p className="font-semibold text-[#30231E]">
                              {response.artisan_name || "Artisan"}
                            </p>

                            <p className="text-xs text-gray-500 mt-1">
                              Artisan ID: {response.artisan_id}
                            </p>
                          </div>

                          <span
                            className={`rounded-full px-4 py-2 text-xs font-semibold w-fit ${getArtisanStatusStyle(
                              response.status
                            )}`}
                          >
                            {displayStatus(response.status)}
                          </span>
                        </div>

                        {response.status === "PENDING" && (
                          <p className="text-sm text-yellow-700 mt-3">
                            Waiting for artisan confirmation.
                          </p>
                        )}

                        {response.status === "ACCEPTED" && (
                          <p className="text-sm text-green-700 mt-3">
                            The artisan has accepted your order.
                          </p>
                        )}

                        {response.status === "REJECTED" && (
                          <div className="mt-3 rounded-lg bg-red-50 p-4">
                            <p className="text-sm font-semibold text-red-700">
                              This artisan could not accept your order.
                            </p>

                            {response.rejection_reason && (
                              <p className="text-sm text-red-600 mt-2">
                                Reason:{" "}
                                {rejectionLabels[response.rejection_reason] ||
                                  response.rejection_reason}
                              </p>
                            )}

                            {response.response_note && (
                              <p className="text-sm text-gray-600 mt-2 whitespace-pre-wrap">
                                Note: {response.response_note}
                              </p>
                            )}
                          </div>
                        )}

                        {response.responded_at && (
                          <p className="text-xs text-gray-400 mt-3">
                            Responded on:{" "}
                            {formatDate(response.responded_at)}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-500">
                    Artisan response information is not available yet.
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

              {/* Cancel Form */}
              {showCancelForm && (
                <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
                  <h2 className="text-lg font-semibold text-[#30231E]">
                    Cancel Order
                  </h2>

                  <p className="text-sm text-gray-600 mt-2">
                    You can optionally provide a reason for cancellation.
                  </p>

                  <textarea
                    value={cancelReason}
                    onChange={(event) =>
                      setCancelReason(event.target.value)
                    }
                    rows={3}
                    maxLength={1000}
                    placeholder="Enter cancellation reason (optional)"
                    className="w-full mt-4 rounded-lg border border-gray-300 p-3 outline-none focus:border-[#8B6248]"
                  />

                  <div className="flex flex-wrap gap-3 mt-4">
                    <button
                      type="button"
                      onClick={handleCancelOrder}
                      disabled={actionLoading}
                      className="rounded-lg bg-red-600 px-5 py-2.5 text-white hover:bg-red-700 disabled:opacity-60"
                    >
                      {actionLoading
                        ? "Cancelling..."
                        : "Confirm Cancellation"}
                    </button>

                    <button
                      type="button"
                      onClick={() => setShowCancelForm(false)}
                      disabled={actionLoading}
                      className="rounded-lg border border-gray-300 px-5 py-2.5 text-gray-700"
                    >
                      Go Back
                    </button>
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
                    onChange={(event) =>
                      setReturnReason(event.target.value)
                    }
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

              {/* Ordered Products with Images */}
              <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
                <h2 className="text-xl font-semibold text-[#30231E] mb-5">
                  Ordered Products
                </h2>

                <div className="space-y-5">
                  {order.items?.map((item) => {
                    const productImage =
                      item.product?.images?.[0]?.image;

                    return (
                      <div
                        key={item.id}
                        className="flex flex-col sm:flex-row sm:items-center gap-4 border-b border-gray-100 pb-5 last:border-b-0"
                      >
                        {/* Product Image */}
                        <div className="w-28 h-28 flex-shrink-0 bg-[#F8F4ED] rounded-lg overflow-hidden">
                          {productImage ? (
                            <img
                              src={getImageUrl(productImage)}
                              alt={item.product_name}
                              className="w-full h-full object-cover"
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
                        <div className="flex-1">
                          <p className="font-semibold text-lg text-[#30231E]">
                            {item.product_name}
                          </p>

                          <p className="text-sm text-gray-500 mt-2">
                            Quantity: {item.quantity}
                          </p>

                          <p className="text-sm text-gray-500 mt-1">
                            Unit Price: {formatPrice(item.unit_price)}
                          </p>

                          <p className="text-sm font-semibold text-[#5C3A2E] mt-2">
                            Subtotal: {formatPrice(item.subtotal)}
                          </p>
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

                {/* Price Summary */}
                <div className="space-y-3 mt-6 border-t border-gray-200 pt-5">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Subtotal</span>
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

                  <div className="border-t border-gray-200 pt-4 flex justify-between">
                    <span className="font-bold text-[#30231E]">
                      Total Amount
                    </span>

                    <span className="text-lg font-bold text-[#5C3A2E]">
                      {formatPrice(order.total_amount)}
                    </span>
                  </div>
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

              {/* Cancellation Reason */}
              {order.cancellation_reason && (
                <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
                  <h2 className="font-semibold text-[#30231E]">
                    Cancellation Reason
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
