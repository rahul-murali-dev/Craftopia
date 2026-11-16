
import React, { useEffect, useState } from "react";
import {
  CreditCard,
  Search,
  RefreshCw,
  CalendarDays,
  CheckCircle,
  Clock,
} from "lucide-react";

import api from "../config/axiosInstance";

const formatPrice = (price) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(Number(price || 0));

const formatDate = (date) => {
  if (!date) return "-";

  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(date));
};

const PAYMENT_STATUS_STYLES = {
  PENDING: "bg-amber-50 text-amber-700 border-amber-200",
  SUCCESS: "bg-green-50 text-green-700 border-green-200",
  FAILED: "bg-red-50 text-red-700 border-red-200",
  REFUND_PENDING: "bg-orange-50 text-orange-700 border-orange-200",
  REFUND_FAILED: "bg-red-50 text-red-700 border-red-200",
  REFUNDED: "bg-purple-50 text-purple-700 border-purple-200",
};

const PAYMENT_STATUSES = [
  "PENDING",
  "SUCCESS",
  "FAILED",
  "REFUND_PENDING",
  "REFUND_FAILED",
  "REFUNDED",
];

function AdminPaymentsPage() {
  const [payments, setPayments] = useState([]);

  const [search, setSearch] = useState("");
  const [method, setMethod] = useState("");
  const [status, setStatus] = useState("");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchPayments = async (
    searchValue = search,
    methodValue = method,
    statusValue = status
  ) => {
    try {
      setLoading(true);
      setError("");

      const params = {};

      if (searchValue.trim()) {
        params.search = searchValue.trim();
      }

      if (methodValue) {
        params.method = methodValue;
      }

      if (statusValue) {
        params.status = statusValue;
      }

      const response = await api.get(
        "/orders/admin/payments/",
        { params }
      );

      const data = response.data;

      setPayments(
        Array.isArray(data) ? data : data.results || []
      );
    } catch (err) {
      console.error("Admin payments error:", err);

      setError(
        err.response?.data?.error ||
        err.response?.data?.detail ||
        "Unable to load payments. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPayments();
  }, [method, status]);

  const handleSearch = (event) => {
    event.preventDefault();
    fetchPayments();
  };

  const handleClearFilters = () => {
    setSearch("");
    setMethod("");
    setStatus("");

    fetchPayments("", "", "");
  };

  const displayStatus = (value) =>
    value?.replaceAll("_", " ") || "-";

  const successfulPayments = payments.filter(
    (payment) => payment.status === "SUCCESS"
  ).length;

  const pendingPayments = payments.filter(
    (payment) => payment.status === "PENDING"
  ).length;

  const totalAmount = payments
    .filter((payment) => payment.status === "SUCCESS")
    .reduce(
      (total, payment) => total + Number(payment.amount || 0),
      0
    );

  return (
    <div className="min-h-screen bg-[#F8F4ED]">
      <main className="space-y-8 px-4 py-6 sm:px-6 lg:px-10 lg:py-8">

        {/* Header */}

        <section className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-[#B87552]">
              Administration
            </p>

            <h1 className="font-serif text-3xl font-bold text-[#30231E] md:text-4xl">
              Payment Management
            </h1>

            <p className="mt-2 text-sm text-[#8B6248]">
              View customer payments and transaction details.
            </p>
          </div>

          <button
            type="button"
            onClick={() => fetchPayments()}
            disabled={loading}
            className="flex items-center gap-2 rounded-lg border border-[#5C3A2E]/15 bg-white px-4 py-3 text-sm font-medium text-[#5C3A2E] hover:bg-[#F8F4ED] disabled:opacity-50"
          >
            <RefreshCw
              className={`h-4 w-4 ${loading ? "animate-spin" : ""}`}
            />
            Refresh
          </button>
        </section>

        {/* Summary Cards */}

        <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">

          <div className="rounded-xl border border-[#5C3A2E]/10 bg-white p-5 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[#B87552]/15">
                <CreditCard className="h-5 w-5 text-[#5C3A2E]" />
              </div>

              <div>
                <p className="text-sm text-[#8B6248]">
                  Payments Found
                </p>
                <p className="text-2xl font-bold text-[#30231E]">
                  {payments.length}
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-[#5C3A2E]/10 bg-white p-5 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-full bg-green-100">
                <CheckCircle className="h-5 w-5 text-green-700" />
              </div>

              <div>
                <p className="text-sm text-[#8B6248]">
                  Successful Payments
                </p>
                <p className="text-2xl font-bold text-[#30231E]">
                  {successfulPayments}
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-[#5C3A2E]/10 bg-white p-5 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-full bg-amber-100">
                <Clock className="h-5 w-5 text-amber-700" />
              </div>

              <div>
                <p className="text-sm text-[#8B6248]">
                  Pending Payments
                </p>
                <p className="text-2xl font-bold text-[#30231E]">
                  {pendingPayments}
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-[#5C3A2E]/10 bg-white p-5 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[#B87552]/15">
                <CalendarDays className="h-5 w-5 text-[#5C3A2E]" />
              </div>

              <div>
                <p className="text-sm text-[#8B6248]">
                  Successful Amount
                </p>
                <p className="text-xl font-bold text-[#30231E]">
                  {formatPrice(totalAmount)}
                </p>
              </div>
            </div>
          </div>

        </section>

        {/* Search and Filters */}

        <section className="rounded-xl border border-[#5C3A2E]/10 bg-white p-5 shadow-sm">
          <form
            onSubmit={handleSearch}
            className="grid grid-cols-1 gap-4 md:grid-cols-3"
          >
            <div className="md:col-span-1">
              <label className="mb-2 block text-sm font-medium text-[#30231E]">
                Search Payments
              </label>

              <div className="flex items-center gap-2 rounded-lg border border-gray-300 px-3 focus-within:border-[#8B6248]">
                <Search className="h-5 w-5 text-[#8B6248]" />

                <input
                  type="text"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Order number, customer or transaction ID..."
                  className="w-full py-3 text-sm outline-none"
                />
              </div>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-[#30231E]">
                Payment Method
              </label>

              <select
                value={method}
                onChange={(event) => setMethod(event.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-3 text-sm outline-none focus:border-[#8B6248]"
              >
                <option value="">All Methods</option>
                <option value="COD">Cash on Delivery</option>
                <option value="RAZORPAY">Razorpay</option>
              </select>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-[#30231E]">
                Payment Status
              </label>

              <select
                value={status}
                onChange={(event) => setStatus(event.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-3 text-sm outline-none focus:border-[#8B6248]"
              >
                <option value="">All Statuses</option>

                {PAYMENT_STATUSES.map((item) => (
                  <option key={item} value={item}>
                    {displayStatus(item)}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex flex-wrap gap-3 md:col-span-3">
              <button
                type="submit"
                disabled={loading}
                className="rounded-lg bg-[#5C3A2E] px-6 py-2.5 text-sm font-semibold text-white hover:bg-[#30231E] disabled:opacity-50"
              >
                Search
              </button>

              <button
                type="button"
                onClick={handleClearFilters}
                className="rounded-lg border border-[#8B6248] px-6 py-2.5 text-sm font-semibold text-[#5C3A2E] hover:bg-[#F8F4ED]"
              >
                Clear Filters
              </button>
            </div>
          </form>
        </section>

        {/* Error */}

        {!loading && error && (
          <div className="rounded-xl border border-red-200 bg-red-50 p-5">
            <p className="font-medium text-red-700">{error}</p>

            <button
              type="button"
              onClick={() => fetchPayments()}
              className="mt-3 text-sm font-semibold text-red-700 underline"
            >
              Try Again
            </button>
          </div>
        )}

        {/* Payments Table */}

        <section className="overflow-hidden rounded-xl border border-[#5C3A2E]/10 bg-white shadow-sm">
          <div className="border-b border-[#5C3A2E]/10 p-5">
            <h2 className="font-serif text-lg font-semibold text-[#30231E]">
              Customer Payments
            </h2>

            <p className="mt-1 text-xs text-[#8B6248]">
              Payment records are displayed with the newest first.
            </p>
          </div>

          {loading ? (
            <div className="p-10 text-center">
              <RefreshCw className="mx-auto mb-3 h-7 w-7 animate-spin text-[#8B6248]" />
              <p className="text-sm text-[#8B6248]">
                Loading payments...
              </p>
            </div>
          ) : !error && payments.length === 0 ? (
            <div className="p-10 text-center">
              <CreditCard className="mx-auto mb-3 h-9 w-9 text-[#8B6248]" />

              <p className="font-medium text-[#30231E]">
                No payments found.
              </p>

              <p className="mt-1 text-sm text-[#8B6248]">
                Try changing your search or filters.
              </p>
            </div>
          ) : !error ? (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[1250px] text-sm">
                <thead>
                  <tr className="border-b border-[#5C3A2E]/10 bg-[#F8F4ED]/60 text-left text-xs text-[#8B6248]">
                    <th className="px-5 py-4 font-medium">Payment ID</th>
                    <th className="px-5 py-4 font-medium">Order</th>
                    <th className="px-5 py-4 font-medium">Customer</th>
                    <th className="px-5 py-4 font-medium">Date</th>
                    <th className="px-5 py-4 font-medium">Amount</th>
                    <th className="px-5 py-4 font-medium">Method</th>
                    <th className="px-5 py-4 font-medium">Payment Status</th>
                    <th className="px-5 py-4 font-medium">Order Status</th>
                    <th className="px-5 py-4 font-medium">Verification</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-[#5C3A2E]/5">
                  {payments.map((payment) => {
                    const customerName =
                      `${payment.customer?.first_name || ""} ${payment.customer?.last_name || ""}`.trim() ||
                      payment.customer?.username ||
                      "Customer";

                    return (
                      <tr
                        key={payment.id}
                        className="transition hover:bg-[#F8F4ED]/50"
                      >
                        <td className="px-5 py-4 font-mono text-xs font-medium text-[#5C3A2E]">
                          #{payment.id}
                        </td>

                        <td className="px-5 py-4">
                          <p className="font-medium text-[#30231E]">
                            #{payment.order?.id}
                          </p>

                          <p className="mt-1 max-w-[190px] truncate text-xs text-gray-500">
                            {payment.order?.order_number || "-"}
                          </p>
                        </td>

                        <td className="px-5 py-4">
                          <p className="font-medium text-[#30231E]">
                            {customerName}
                          </p>

                          <p className="mt-1 text-xs text-[#8B6248]">
                            {payment.customer?.email || "-"}
                          </p>
                        </td>

                        <td className="whitespace-nowrap px-5 py-4 text-xs text-[#8B6248]">
                          {formatDate(payment.created_at)}
                        </td>

                        <td className="whitespace-nowrap px-5 py-4 font-semibold text-[#30231E]">
                          {formatPrice(payment.amount)}
                        </td>

                        <td className="px-5 py-4">
                          <span className="whitespace-nowrap rounded-full border border-[#5C3A2E]/15 bg-[#F8F4ED] px-3 py-1 text-xs font-medium text-[#5C3A2E]">
                            {payment.payment_method === "RAZORPAY"
                              ? "Razorpay"
                              : "Cash on Delivery"}
                          </span>
                        </td>

                        <td className="px-5 py-4">
                          <span
                            className={`inline-flex whitespace-nowrap rounded-full border px-3 py-1 text-xs font-medium ${
                              PAYMENT_STATUS_STYLES[payment.status] ||
                              "border-gray-200 bg-gray-50 text-gray-600"
                            }`}
                          >
                            {displayStatus(payment.status)}
                          </span>

                          {payment.failure_reason && (
                            <p className="mt-1 max-w-[180px] text-xs text-red-600">
                              {payment.failure_reason}
                            </p>
                          )}
                        </td>

                        <td className="px-5 py-4">
                          <span className="whitespace-nowrap text-xs font-medium text-[#5C3A2E]">
                            {displayStatus(payment.order?.order_status)}
                          </span>
                        </td>

                        <td className="px-5 py-4">
                          {payment.payment_method === "RAZORPAY" ? (
                            payment.signature_verified ? (
                              <span className="inline-flex items-center gap-1 text-xs font-medium text-green-700">
                                <CheckCircle className="h-4 w-4" />
                                Verified
                              </span>
                            ) : (
                              <span className="text-xs font-medium text-amber-700">
                                Not verified
                              </span>
                            )
                          ) : (
                            <span className="text-xs text-gray-500">
                              Not applicable
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : null}
        </section>

        <p className="pb-4 text-center text-xs text-[#8B6248]/70">
          Craftopia Admin Panel
        </p>
      </main>
    </div>
  );
}

export default AdminPaymentsPage;
