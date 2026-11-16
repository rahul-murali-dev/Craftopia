
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ShoppingBag,
  Search,
  RefreshCw,
  Eye,
  CalendarDays,
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

  const parsedDate = new Date(date);

  if (Number.isNaN(parsedDate.getTime())) return "-";

  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(parsedDate);
};

const STATUS_STYLES = {
  PENDING: "bg-amber-50 text-amber-700 border-amber-200",
  CONFIRMED: "bg-blue-50 text-blue-700 border-blue-200",
  SHIPPED: "bg-purple-50 text-purple-700 border-purple-200",
  OUT_FOR_DELIVERY: "bg-orange-50 text-orange-700 border-orange-200",
  DELIVERED: "bg-green-50 text-green-700 border-green-200",
  CANCELLED: "bg-red-50 text-red-700 border-red-200",
};

const ORDER_STATUSES = [
  "PENDING",
  "CONFIRMED",
  "SHIPPED",
  "OUT_FOR_DELIVERY",
  "DELIVERED",
  "CANCELLED",
];

function AdminOrdersPage() {
  const navigate = useNavigate();

  const [orders, setOrders] = useState([]);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchOrders = async (
    searchValue = search,
    statusValue = status
  ) => {
    try {
      setLoading(true);
      setError("");

      const params = {};

      if (searchValue.trim()) {
        params.search = searchValue.trim();
      }

      if (statusValue) {
        params.status = statusValue;
      }

      const response = await api.get("/orders/admin/orders/", {
        params,
      });

      const data = response.data;

      if (Array.isArray(data)) {
        setOrders(data);
      } else if (Array.isArray(data?.results)) {
        setOrders(data.results);
      } else {
        setOrders([]);
      }
    } catch (err) {
      console.error("Admin orders error:", err);

      setError(
        err.response?.data?.error ||
          err.response?.data?.detail ||
          "Unable to load orders. Please try again."
      );

      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders("", "");
  }, []);

  const handleSearch = (event) => {
    event.preventDefault();
    fetchOrders(search, status);
  };

  const handleStatusChange = (value) => {
    setStatus(value);
    fetchOrders(search, value);
  };

  const clearFilters = () => {
    setSearch("");
    setStatus("");
    fetchOrders("", "");
  };

  const displayStatus = (value) =>
    value?.replaceAll("_", " ") || "-";

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
              Order Management
            </h1>

            <p className="mt-2 text-sm text-[#8B6248]">
              View and manage customer orders.
            </p>
          </div>

          <button
            type="button"
            onClick={() => fetchOrders(search, status)}
            disabled={loading}
            className="flex items-center gap-2 rounded-lg border border-[#5C3A2E]/15 bg-white px-4 py-3 text-sm font-medium text-[#5C3A2E] hover:bg-[#F8F4ED] disabled:opacity-50"
          >
            <RefreshCw
              className={`h-4 w-4 ${loading ? "animate-spin" : ""}`}
            />
            Refresh
          </button>
        </section>

        {/* Summary */}
        <section className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="rounded-xl border border-[#5C3A2E]/10 bg-white p-5 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[#B87552]/15">
                <ShoppingBag className="h-5 w-5 text-[#5C3A2E]" />
              </div>

              <div>
                <p className="text-sm text-[#8B6248]">
                  Orders Found
                </p>

                <p className="text-2xl font-bold text-[#30231E]">
                  {orders.length}
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
                  Current Filter
                </p>

                <p className="text-lg font-bold text-[#30231E]">
                  {status ? displayStatus(status) : "All Orders"}
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Search and Filter */}
        <section className="rounded-xl border border-[#5C3A2E]/10 bg-white p-5 shadow-sm">
          <form
            onSubmit={handleSearch}
            className="grid grid-cols-1 gap-4 md:grid-cols-3"
          >
            <div className="md:col-span-2">
              <label className="mb-2 block text-sm font-medium text-[#30231E]">
                Search Orders
              </label>

              <div className="flex items-center gap-2 rounded-lg border border-gray-300 px-3 focus-within:border-[#8B6248]">
                <Search className="h-5 w-5 text-[#8B6248]" />

                <input
                  type="text"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Order number, customer name, email or phone..."
                  className="w-full py-3 text-sm outline-none"
                />
              </div>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-[#30231E]">
                Filter by Status
              </label>

              <select
                value={status}
                onChange={(event) =>
                  handleStatusChange(event.target.value)
                }
                className="w-full rounded-lg border border-gray-300 px-3 py-3 text-sm outline-none focus:border-[#8B6248]"
              >
                <option value="">All Orders</option>

                {ORDER_STATUSES.map((item) => (
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
                onClick={clearFilters}
                disabled={loading && !search && !status}
                className="rounded-lg border border-[#8B6248] px-6 py-2.5 text-sm font-semibold text-[#5C3A2E] hover:bg-[#F8F4ED] disabled:opacity-50"
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
              onClick={() => fetchOrders(search, status)}
              className="mt-3 text-sm font-semibold text-red-700 underline"
            >
              Try Again
            </button>
          </div>
        )}

        {/* Orders Table */}
        <section className="overflow-hidden rounded-xl border border-[#5C3A2E]/10 bg-white shadow-sm">
          <div className="border-b border-[#5C3A2E]/10 p-5">
            <h2 className="font-serif text-lg font-semibold text-[#30231E]">
              Customer Orders
            </h2>

            <p className="mt-1 text-xs text-[#8B6248]">
              Orders are displayed with the newest first.
            </p>
          </div>

          {loading ? (
            <div className="p-10 text-center">
              <RefreshCw className="mx-auto mb-3 h-7 w-7 animate-spin text-[#8B6248]" />

              <p className="text-sm text-[#8B6248]">
                Loading orders...
              </p>
            </div>
          ) : !error && orders.length === 0 ? (
            <div className="p-10 text-center">
              <ShoppingBag className="mx-auto mb-3 h-9 w-9 text-[#8B6248]" />

              <p className="font-medium text-[#30231E]">
                No orders found.
              </p>

              <p className="mt-1 text-sm text-[#8B6248]">
                Try changing your search or status filter.
              </p>
            </div>
          ) : !error ? (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[950px] text-sm">
                <thead>
                  <tr className="border-b border-[#5C3A2E]/10 bg-[#F8F4ED]/60 text-left text-xs text-[#8B6248]">
                    <th className="px-5 py-4 font-medium">Order ID</th>
                    <th className="px-5 py-4 font-medium">Customer</th>
                    <th className="px-5 py-4 font-medium">Date</th>
                    <th className="px-5 py-4 font-medium">Items</th>
                    <th className="px-5 py-4 font-medium">Total</th>
                    <th className="px-5 py-4 font-medium">Status</th>
                    <th className="px-5 py-4 text-center font-medium">
                      Action
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-[#5C3A2E]/5">
                  {orders.map((order) => {
                    const customerName =
                      `${order.customer?.first_name || ""} ${
                        order.customer?.last_name || ""
                      }`.trim() ||
                      order.customer?.username ||
                      "Customer";

                    return (
                      <tr
                        key={order.id}
                        className="transition hover:bg-[#F8F4ED]/50"
                      >
                        <td className="px-5 py-4">
                          <p className="font-mono text-xs font-medium text-[#5C3A2E]">
                            #{order.id}
                          </p>

                          <p className="mt-1 max-w-[190px] truncate text-xs text-gray-500">
                            {order.order_number}
                          </p>
                        </td>

                        <td className="px-5 py-4">
                          <p className="font-medium text-[#30231E]">
                            {customerName}
                          </p>

                          <p className="mt-1 text-xs text-[#8B6248]">
                            {order.customer?.email || "-"}
                          </p>

                          <p className="text-xs text-[#8B6248]">
                            {order.phone || "-"}
                          </p>
                        </td>

                        <td className="whitespace-nowrap px-5 py-4 text-[#8B6248]">
                          {formatDate(order.created_at)}
                        </td>

                        <td className="px-5 py-4 text-[#30231E]">
                          {order.items_count ?? 0}
                        </td>

                        <td className="whitespace-nowrap px-5 py-4 font-semibold text-[#30231E]">
                          {formatPrice(order.total_amount)}
                        </td>

                        <td className="px-5 py-4">
                          <span
                            className={`inline-flex whitespace-nowrap rounded-full border px-3 py-1 text-xs font-medium ${
                              STATUS_STYLES[order.status] ||
                              "border-gray-200 bg-gray-50 text-gray-600"
                            }`}
                          >
                            {displayStatus(order.status)}
                          </span>
                        </td>

                        <td className="px-5 py-4 text-center">
                          <button
                            type="button"
                            onClick={() =>
                              navigate(`/admin/orders/${order.id}`)
                            }
                            title="View Order Details"
                            className="inline-flex items-center gap-2 rounded-lg border border-[#8B6248]/30 px-3 py-2 text-xs font-semibold text-[#5C3A2E] transition hover:bg-[#F8F4ED]"
                          >
                            <Eye className="h-4 w-4" />
                            View
                          </button>
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

export default AdminOrdersPage;
