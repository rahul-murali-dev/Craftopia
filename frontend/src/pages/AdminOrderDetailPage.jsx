// src/pages/AdminOrderDetailPage.jsx

import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  RefreshCw,
  Package,
  User,
  MapPin,
  CreditCard,
  Truck,
  CheckCircle,
  AlertCircle,
} from "lucide-react";
import api from "../config/axiosInstance";

const STATUS_FLOW = {
  CONFIRMED: "SHIPPED",
  SHIPPED: "OUT_FOR_DELIVERY",
  OUT_FOR_DELIVERY: "DELIVERED",
};

const STATUS_LABELS = {
  PENDING: "Pending",
  CONFIRMED: "Confirmed",
  SHIPPED: "Shipped",
  OUT_FOR_DELIVERY: "Out for Delivery",
  DELIVERED: "Delivered",
  CANCELLED: "Cancelled",
};

const formatPrice = (value) =>
  `₹${Number(value || 0).toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

const formatDate = (value) => {
  if (!value) return "—";

  return new Date(value).toLocaleString("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  });
};

const getStatusStyle = (status) => {
  const styles = {
    PENDING: "bg-yellow-100 text-yellow-800",
    CONFIRMED: "bg-blue-100 text-blue-800",
    SHIPPED: "bg-indigo-100 text-indigo-800",
    OUT_FOR_DELIVERY: "bg-purple-100 text-purple-800",
    DELIVERED: "bg-green-100 text-green-800",
    CANCELLED: "bg-red-100 text-red-800",
  };

  return styles[status] || "bg-gray-100 text-gray-700";
};

const AdminOrderDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const fetchOrder = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await api.get(`/orders/admin/orders/${id}/`);
      setOrder(response.data);
    } catch (err) {
      console.error("Error fetching order:", err);
      setError(
        err.response?.data?.error ||
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

  const handleStatusUpdate = async () => {
    if (!order) return;

    const nextStatus = STATUS_FLOW[order.status];

    if (!nextStatus) return;

    const confirmed = window.confirm(
      `Are you sure you want to change this order status to ${STATUS_LABELS[nextStatus]}?`
    );

    if (!confirmed) return;

    try {
      setUpdating(true);
      setError("");
      setSuccess("");

      await api.patch(`/orders/admin/orders/${id}/status/`, {
        status: nextStatus,
      });

      setSuccess("Order status updated successfully.");
      await fetchOrder();
    } catch (err) {
      console.error("Error updating order status:", err);
      setError(
        err.response?.data?.error ||
          err.response?.data?.detail ||
          "Unable to update order status."
      );
    } finally {
      setUpdating(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F8F4ED] p-6 flex items-center justify-center">
        <p className="text-[#5C3A2E] font-medium">Loading order details...</p>
      </div>
    );
  }

  if (error && !order) {
    return (
      <div className="min-h-screen bg-[#F8F4ED] p-6">
        <button
          onClick={() => navigate("/admin/orders")}
          className="mb-6 flex items-center gap-2 text-[#5C3A2E] hover:text-[#8B6248]"
        >
          <ArrowLeft size={18} />
          Back to Orders
        </button>

        <div className="rounded-xl border border-red-200 bg-white p-6 text-red-700">
          {error}
          <button
            onClick={fetchOrder}
            className="ml-3 underline font-medium"
          >
            Try again
          </button>
        </div>
      </div>
    );
  }

  if (!order) return null;

  const customerName = [
    order.customer?.first_name,
    order.customer?.last_name,
  ]
    .filter(Boolean)
    .join(" ");

  const nextStatus = STATUS_FLOW[order.status];

  return (
    <div className="min-h-screen bg-[#F8F4ED] p-4 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <button
              onClick={() => navigate("/admin/orders")}
              className="mb-3 flex items-center gap-2 text-sm font-medium text-[#8B6248] hover:text-[#5C3A2E]"
            >
              <ArrowLeft size={17} />
              Back to Orders
            </button>

            <h1 className="text-2xl font-bold text-[#30231E] sm:text-3xl">
              Order Details
            </h1>

            <p className="mt-1 break-all text-sm text-[#8B6248]">
              Order ID: {order.order_number}
            </p>
          </div>

          <button
            onClick={fetchOrder}
            disabled={loading}
            className="flex items-center justify-center gap-2 rounded-lg border border-[#8B6248] px-4 py-2.5 text-sm font-semibold text-[#5C3A2E] hover:bg-[#8B6248] hover:text-white disabled:opacity-50"
          >
            <RefreshCw size={16} />
            Refresh
          </button>
        </div>

        {/* Messages */}
        {error && (
          <div className="mb-5 flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            <AlertCircle size={18} className="mt-0.5 shrink-0" />
            {error}
          </div>
        )}

        {success && (
          <div className="mb-5 flex items-start gap-2 rounded-lg border border-green-200 bg-green-50 p-3 text-sm text-green-700">
            <CheckCircle size={18} className="mt-0.5 shrink-0" />
            {success}
          </div>
        )}

        {/* Order summary */}
        <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-3">
          <div className="rounded-xl bg-white p-5 shadow-sm">
            <p className="text-sm text-gray-500">Order Status</p>
            <span
              className={`mt-3 inline-flex rounded-full px-3 py-1.5 text-sm font-semibold ${getStatusStyle(
                order.status
              )}`}
            >
              {STATUS_LABELS[order.status] || order.status}
            </span>
          </div>

          <div className="rounded-xl bg-white p-5 shadow-sm">
            <p className="text-sm text-gray-500">Order Total</p>
            <p className="mt-2 text-2xl font-bold text-[#5C3A2E]">
              {formatPrice(order.total_amount)}
            </p>
          </div>

          <div className="rounded-xl bg-white p-5 shadow-sm">
            <p className="text-sm text-gray-500">Order Date</p>
            <p className="mt-2 font-semibold text-[#30231E]">
              {formatDate(order.created_at)}
            </p>
          </div>
        </div>

        {/* Status update */}
        <section className="mb-6 rounded-xl bg-white p-5 shadow-sm">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="font-bold text-[#30231E]">Update Order Status</h2>
              <p className="mt-1 text-sm text-gray-500">
                Update the order to its next permitted status.
              </p>
            </div>

            {nextStatus ? (
              <button
                onClick={handleStatusUpdate}
                disabled={updating}
                className="flex items-center justify-center gap-2 rounded-lg bg-[#5C3A2E] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#8B6248] disabled:cursor-not-allowed disabled:opacity-60"
              >
                <Truck size={17} />
                {updating
                  ? "Updating..."
                  : `Mark as ${STATUS_LABELS[nextStatus]}`}
              </button>
            ) : (
              <p className="text-sm font-medium text-gray-500">
                No further status update is available.
              </p>
            )}
          </div>
        </section>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Left section */}
          <div className="space-y-6 lg:col-span-2">
            {/* Customer */}
            <section className="rounded-xl bg-white p-5 shadow-sm">
              <div className="mb-4 flex items-center gap-2">
                <User size={20} className="text-[#8B6248]" />
                <h2 className="font-bold text-[#30231E]">
                  Customer Information
                </h2>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <p className="text-xs text-gray-500">Customer Name</p>
                  <p className="mt-1 font-medium text-[#30231E]">
                    {customerName || order.customer?.username || "—"}
                  </p>
                </div>

                <div>
                  <p className="text-xs text-gray-500">Username</p>
                  <p className="mt-1 font-medium text-[#30231E]">
                    {order.customer?.username || "—"}
                  </p>
                </div>

                <div>
                  <p className="text-xs text-gray-500">Email</p>
                  <p className="mt-1 break-all font-medium text-[#30231E]">
                    {order.customer?.email || "—"}
                  </p>
                </div>

                <div>
                  <p className="text-xs text-gray-500">Phone</p>
                  <p className="mt-1 font-medium text-[#30231E]">
                    {order.delivery_address?.phone || "—"}
                  </p>
                </div>
              </div>
            </section>

            {/* Delivery address */}
            <section className="rounded-xl bg-white p-5 shadow-sm">
              <div className="mb-4 flex items-center gap-2">
                <MapPin size={20} className="text-[#8B6248]" />
                <h2 className="font-bold text-[#30231E]">
                  Delivery Address
                </h2>
              </div>

              <div className="space-y-1 text-sm text-gray-700">
                <p className="font-semibold text-[#30231E]">
                  {order.delivery_address?.full_name || "—"}
                </p>
                <p>{order.delivery_address?.phone || "—"}</p>
                <p>{order.delivery_address?.address_line || "—"}</p>
                <p>
                  {[
                    order.delivery_address?.city,
                    order.delivery_address?.state,
                    order.delivery_address?.pincode,
                  ]
                    .filter(Boolean)
                    .join(", ") || "—"}
                </p>
              </div>
            </section>

            {/* Items */}
            <section className="rounded-xl bg-white p-5 shadow-sm">
              <div className="mb-4 flex items-center gap-2">
                <Package size={20} className="text-[#8B6248]" />
                <h2 className="font-bold text-[#30231E]">Ordered Products</h2>
              </div>

              {order.items?.length ? (
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[520px] text-left text-sm">
                    <thead>
                      <tr className="border-b text-xs uppercase text-gray-500">
                        <th className="pb-3 pr-4">Product</th>
                        <th className="pb-3 px-4">Unit Price</th>
                        <th className="pb-3 px-4">Quantity</th>
                        <th className="pb-3 pl-4 text-right">Subtotal</th>
                      </tr>
                    </thead>

                    <tbody>
                      {order.items.map((item) => (
                        <tr key={item.id} className="border-b last:border-0">
                          <td className="py-4 pr-4 font-medium text-[#30231E]">
                            {item.product_name}
                          </td>
                          <td className="px-4 py-4 text-gray-600">
                            {formatPrice(item.unit_price)}
                          </td>
                          <td className="px-4 py-4 text-gray-600">
                            {item.quantity}
                          </td>
                          <td className="py-4 pl-4 text-right font-semibold text-[#5C3A2E]">
                            {formatPrice(item.subtotal)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-sm text-gray-500">
                  No order items found.
                </p>
              )}
            </section>
          </div>

          {/* Right section */}
          <div className="space-y-6">
            {/* Amount summary */}
            <section className="rounded-xl bg-white p-5 shadow-sm">
              <h2 className="mb-4 font-bold text-[#30231E]">
                Payment Summary
              </h2>

              <div className="space-y-3 text-sm">
                <div className="flex justify-between gap-3">
                  <span className="text-gray-500">Subtotal</span>
                  <span className="font-medium">
                    {formatPrice(order.subtotal)}
                  </span>
                </div>

                <div className="flex justify-between gap-3">
                  <span className="text-gray-500">Shipping Charge</span>
                  <span className="font-medium">
                    {formatPrice(order.shipping_charge)}
                  </span>
                </div>

                <div className="flex justify-between gap-3">
                  <span className="text-gray-500">Tax</span>
                  <span className="font-medium">
                    {formatPrice(order.tax)}
                  </span>
                </div>

                <div className="border-t pt-3">
                  <div className="flex justify-between gap-3 text-base font-bold text-[#5C3A2E]">
                    <span>Total</span>
                    <span>{formatPrice(order.total_amount)}</span>
                  </div>
                </div>
              </div>
            </section>

            {/* Payment records */}
            <section className="rounded-xl bg-white p-5 shadow-sm">
              <div className="mb-4 flex items-center gap-2">
                <CreditCard size={20} className="text-[#8B6248]" />
                <h2 className="font-bold text-[#30231E]">
                  Payment Information
                </h2>
              </div>

              {order.payments?.length ? (
                <div className="space-y-4">
                  {order.payments.map((payment) => (
                    <div
                      key={payment.id}
                      className="rounded-lg border border-gray-100 p-3"
                    >
                      <div className="flex justify-between gap-3">
                        <span className="text-sm text-gray-500">Method</span>
                        <span className="text-sm font-semibold text-[#30231E]">
                          {payment.payment_method}
                        </span>
                      </div>

                      <div className="mt-2 flex justify-between gap-3">
                        <span className="text-sm text-gray-500">Amount</span>
                        <span className="text-sm font-semibold">
                          {formatPrice(payment.amount)}
                        </span>
                      </div>

                      <div className="mt-2 flex justify-between gap-3">
                        <span className="text-sm text-gray-500">Status</span>
                        <span className="text-sm font-semibold">
                          {payment.status}
                        </span>
                      </div>

                      <p className="mt-2 text-xs text-gray-400">
                        {formatDate(payment.created_at)}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-500">
                  No payment records found.
                </p>
              )}
            </section>

            {/* Cancellation reason */}
            {order.cancellation_reason && (
              <section className="rounded-xl border border-red-100 bg-red-50 p-5">
                <h2 className="font-bold text-red-800">
                  Cancellation Reason
                </h2>
                <p className="mt-2 text-sm text-red-700">
                  {order.cancellation_reason}
                </p>
              </section>
            )}

            {/* Timestamps */}
            <section className="rounded-xl bg-white p-5 shadow-sm">
              <h2 className="mb-3 font-bold text-[#30231E]">
                Order Timeline
              </h2>

              <div className="space-y-3 text-sm">
                <div>
                  <p className="text-xs text-gray-500">Created At</p>
                  <p className="mt-1 text-gray-700">
                    {formatDate(order.created_at)}
                  </p>
                </div>

                <div>
                  <p className="text-xs text-gray-500">Last Updated</p>
                  <p className="mt-1 text-gray-700">
                    {formatDate(order.updated_at)}
                  </p>
                </div>
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminOrderDetailPage;