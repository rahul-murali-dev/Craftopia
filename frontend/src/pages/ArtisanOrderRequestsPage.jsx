
import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  Search,
  RefreshCw,
  Package,
  MapPin,
  Phone,
  ChevronLeft,
  ChevronRight,
  ShoppingBag,
  CalendarDays,
  AlertCircle,
  ArrowLeft,
  Image as ImageIcon,
} from "lucide-react";

import api from "../config/axiosInstance";

const PAGE_SIZE = 10;

const ORDER_STATUSES = [
  { value: "", label: "All Orders" },
  { value: "PENDING", label: "Pending" },
  { value: "CONFIRMED", label: "Confirmed" },
  { value: "SHIPPED", label: "Shipped" },
  { value: "OUT_FOR_DELIVERY", label: "Out for Delivery" },
  { value: "DELIVERED", label: "Delivered" },
  { value: "CANCELLED", label: "Cancelled" },
];

const formatPrice = (value) => {
  return `₹${Number(value || 0).toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
};

const formatDate = (value) => {
  if (!value) return "Date unavailable";

  return new Date(value).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const getStatusStyle = (status) => {
  switch (status) {
    case "PENDING":
      return "bg-yellow-100 text-yellow-800";
    case "CONFIRMED":
      return "bg-blue-100 text-blue-800";
    case "SHIPPED":
      return "bg-purple-100 text-purple-800";
    case "OUT_FOR_DELIVERY":
      return "bg-orange-100 text-orange-800";
    case "DELIVERED":
      return "bg-green-100 text-green-800";
    case "CANCELLED":
      return "bg-red-100 text-red-800";
    default:
      return "bg-gray-100 text-gray-700";
  }
};

const formatStatus = (status) => {
  if (!status) return "Unknown";

  return status
    .toLowerCase()
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
};

export default function ArtisanOrderRequestsPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const initialStatus = searchParams.get("status") || "";

  const validInitialStatus = ORDER_STATUSES.some(
    (item) => item.value === initialStatus
  )
    ? initialStatus
    : "";

  const [orders, setOrders] = useState([]);

  const [summary, setSummary] = useState({
    total_orders: 0,
    active_orders: 0,
    completed_orders: 0,
    total_items: 0,
  });

  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState(validInitialStatus);

  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchOrders = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await api.get("/orders/artisan/orders/", {
        params: {
          page,
          page_size: PAGE_SIZE,
          search,
          status: statusFilter,
        },
      });

      const data = response.data;

      setOrders(data.results || []);

      setSummary(
        data.summary || {
          total_orders: 0,
          active_orders: 0,
          completed_orders: 0,
          total_items: 0,
        }
      );

      setTotalPages(data.total_pages || 1);
      setTotalCount(data.count || 0);
    } catch (err) {
      console.error("Artisan orders error:", err);

      setOrders([]);

      setError(
        err.response?.data?.error ||
          "Unable to load your orders. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [page, search, statusFilter]);

  const handleSearch = (event) => {
    event.preventDefault();
    setPage(1);
    setSearch(searchInput.trim());
  };

  const handleStatusChange = (value) => {
    setPage(1);
    setStatusFilter(value);

    if (value) {
      setSearchParams({ status: value });
    } else {
      setSearchParams({});
    }
  };

  const goToPage = (nextPage) => {
    if (nextPage < 1 || nextPage > totalPages) return;

    setPage(nextPage);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className="min-h-screen bg-[#F8F4ED]">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">

        {/* Back to Dashboard */}
        <button
          type="button"
          onClick={() => navigate("/artisan-dashboard")}
          className="mb-6 flex items-center gap-2 rounded-lg border border-[#D9C9BB] bg-white px-4 py-2.5 text-sm font-semibold text-[#5C3A2E] shadow-sm transition hover:bg-[#5C3A2E] hover:text-white"
        >
          <ArrowLeft size={17} />
          Back to Dashboard
        </button>

        {/* Page heading */}
        <div className="mb-8">
          <p className="mb-2 text-sm font-medium text-[#8B6248]">
            ARTISAN DASHBOARD
          </p>

          <h1 className="text-3xl font-bold text-[#30231E]">
            Order Requests
          </h1>

          <p className="mt-2 text-sm text-gray-600">
            View orders containing your handmade products and check their
            current status.
          </p>
        </div>

        {/* Summary cards */}
        <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <SummaryCard
            title="Total Orders"
            value={summary.total_orders}
            icon={<ShoppingBag size={22} />}
          />

          <SummaryCard
            title="Active Orders"
            value={summary.active_orders}
            icon={<RefreshCw size={22} />}
          />

          <SummaryCard
            title="Completed Orders"
            value={summary.completed_orders}
            icon={<Package size={22} />}
          />

          <SummaryCard
            title="Items Ordered"
            value={summary.total_items}
            icon={<ShoppingBag size={22} />}
          />
        </div>

        {/* Search and filter */}
        <div className="mb-6 rounded-xl border border-[#E8DED3] bg-white p-4 shadow-sm">
          <div className="flex flex-col gap-4 md:flex-row">
            <form
              onSubmit={handleSearch}
              className="flex flex-1 gap-2"
            >
              <div className="relative flex-1">
                <Search
                  size={18}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                />

                <input
                  type="text"
                  value={searchInput}
                  onChange={(event) =>
                    setSearchInput(event.target.value)
                  }
                  placeholder="Search order ID, customer, phone or product..."
                  className="w-full rounded-lg border border-gray-300 py-3 pl-10 pr-3 text-sm outline-none transition focus:border-[#8B6248] focus:ring-2 focus:ring-[#8B6248]/20"
                />
              </div>

              <button
                type="submit"
                className="rounded-lg bg-[#5C3A2E] px-5 py-3 text-sm font-medium text-white transition hover:bg-[#43291F]"
              >
                Search
              </button>
            </form>

            <select
              value={statusFilter}
              onChange={(event) =>
                handleStatusChange(event.target.value)
              }
              className="rounded-lg border border-gray-300 bg-white px-4 py-3 text-sm outline-none focus:border-[#8B6248] md:w-52"
            >
              {ORDER_STATUSES.map((item) => (
                <option key={item.value} value={item.value}>
                  {item.label}
                </option>
              ))}
            </select>

            <button
              type="button"
              onClick={fetchOrders}
              disabled={loading}
              className="flex items-center justify-center gap-2 rounded-lg border border-[#8B6248] px-4 py-3 text-sm font-medium text-[#5C3A2E] transition hover:bg-[#F8F4ED] disabled:opacity-50"
            >
              <RefreshCw
                size={16}
                className={loading ? "animate-spin" : ""}
              />
              Refresh
            </button>
          </div>
        </div>

        {/* Result count */}
        <div className="mb-4 flex items-center justify-between">
          <p className="text-sm text-gray-600">
            Showing {orders.length} of {totalCount} orders
          </p>

          <p className="text-xs text-gray-500">
            Page {page} of {totalPages}
          </p>
        </div>

        {/* Loading */}
        {loading && (
          <div className="rounded-xl bg-white py-16 text-center shadow-sm">
            <RefreshCw
              size={30}
              className="mx-auto animate-spin text-[#8B6248]"
            />

            <p className="mt-3 text-sm text-gray-600">
              Loading your orders...
            </p>
          </div>
        )}

        {/* Error */}
        {!loading && error && (
          <div className="rounded-xl border border-red-200 bg-white p-8 text-center">
            <AlertCircle
              size={32}
              className="mx-auto text-red-500"
            />

            <p className="mt-3 font-medium text-red-700">{error}</p>

            <button
              type="button"
              onClick={fetchOrders}
              className="mt-4 rounded-lg bg-[#5C3A2E] px-5 py-2 text-sm font-medium text-white hover:bg-[#43291F]"
            >
              Try Again
            </button>
          </div>
        )}

        {/* Empty state */}
        {!loading && !error && orders.length === 0 && (
          <div className="rounded-xl border border-[#E8DED3] bg-white px-6 py-16 text-center shadow-sm">
            <Package
              size={42}
              className="mx-auto text-[#B87552]"
            />

            <h2 className="mt-4 text-lg font-semibold text-[#30231E]">
              No Orders Found
            </h2>

            <p className="mt-2 text-sm text-gray-500">
              No orders match your current search or filter.
            </p>

            {(search || statusFilter) && (
              <button
                type="button"
                onClick={() => {
                  setSearchInput("");
                  setSearch("");
                  setStatusFilter("");
                  setPage(1);
                  setSearchParams({});
                }}
                className="mt-5 text-sm font-semibold text-[#8B6248] hover:underline"
              >
                Clear Search and Filters
              </button>
            )}
          </div>
        )}

        {/* Orders */}
        {!loading && !error && orders.length > 0 && (
          <div className="space-y-5">
            {orders.map((order) => (
              <div
                key={order.id}
                className="overflow-hidden rounded-xl border border-[#E8DED3] bg-white shadow-sm"
              >
                {/* Order header */}
                <div className="flex flex-col justify-between gap-3 border-b border-gray-100 p-5 sm:flex-row sm:items-center">
                  <div>
                    <h2 className="text-lg font-bold text-[#30231E]">
                      {order.order_number}
                    </h2>

                    <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-gray-500">
                      <span className="flex items-center gap-1">
                        <CalendarDays size={14} />
                        {formatDate(order.created_at)}
                      </span>

                      <span className="flex items-center gap-1">
                        <Package size={14} />
                        {order.total_quantity || 0} items
                      </span>
                    </div>
                  </div>

                  <span
                    className={`w-fit rounded-full px-3 py-1.5 text-xs font-semibold ${getStatusStyle(
                      order.order_status
                    )}`}
                  >
                    {formatStatus(order.order_status)}
                  </span>
                </div>

                <div className="grid gap-6 p-5 lg:grid-cols-[1fr_280px]">

                  {/* Artisan's products */}
                  <div>
                    <h3 className="mb-4 text-sm font-semibold text-[#30231E]">
                      Your Products in This Order
                    </h3>

                    <div className="space-y-4">
                      {(order.items || []).map((item) => (
                        <div
                          key={item.id}
                          className="flex flex-col justify-between gap-3 rounded-lg bg-[#FAF8F5] p-4 sm:flex-row sm:items-center"
                        >
                          <div className="flex min-w-0 items-center gap-4">

                            {/* Product image */}
                            <div className="h-20 w-20 shrink-0 overflow-hidden rounded-lg border border-[#E8DED3] bg-white">
                              {item.image ? (
                                <img
                                  src={item.image}
                                  alt={item.product_name}
                                  className="h-full w-full object-cover"
                                  loading="lazy"
                                />
                              ) : (
                                <div className="flex h-full w-full items-center justify-center text-[#B87552]">
                                  <ImageIcon size={28} />
                                </div>
                              )}
                            </div>

                            {/* Product information */}
                            <div className="min-w-0">
                              <p className="break-words font-semibold text-[#30231E]">
                                {item.product_name || "Product"}
                              </p>

                              <p className="mt-1 text-xs text-gray-500">
                                Quantity: {item.quantity}
                              </p>

                              <p className="mt-1 text-xs text-gray-500">
                                Unit Price: {formatPrice(item.unit_price)}
                              </p>
                            </div>
                          </div>

                          <p className="shrink-0 font-semibold text-[#5C3A2E]">
                            {formatPrice(item.subtotal)}
                          </p>
                        </div>
                      ))}
                    </div>

                    <div className="mt-4 flex justify-between border-t border-gray-100 pt-4">
                      <span className="text-sm font-medium text-gray-600">
                        Your Product Subtotal
                      </span>

                      <span className="font-bold text-[#5C3A2E]">
                        {formatPrice(order.artisan_subtotal)}
                      </span>
                    </div>
                  </div>

                  {/* Customer and delivery information */}
                  <div className="rounded-lg bg-[#F8F4ED] p-4">
                    <h3 className="mb-3 text-sm font-semibold text-[#30231E]">
                      Delivery Details
                    </h3>

                    <p className="text-sm font-medium text-[#30231E]">
                      {order.customer?.full_name ||
                        order.delivery_address?.full_name ||
                        "Customer"}
                    </p>

                    <div className="mt-3 space-y-2 text-xs text-gray-600">
                      <p className="flex items-start gap-2">
                        <Phone
                          size={14}
                          className="mt-0.5 shrink-0"
                        />

                        {order.delivery_address?.phone || "Not available"}
                      </p>

                      <p className="flex items-start gap-2">
                        <MapPin
                          size={14}
                          className="mt-0.5 shrink-0"
                        />

                        <span>
                          {[
                            order.delivery_address?.address_line,
                            order.delivery_address?.city,
                            order.delivery_address?.state,
                            order.delivery_address?.pincode,
                          ]
                            .filter(Boolean)
                            .join(", ") || "Address not available"}
                        </span>
                      </p>
                    </div>
                  </div>
                </div>

                {/* Read-only status information */}
                <div className="border-t border-gray-100 bg-[#FCFBF9] px-5 py-3">
                  <p className="text-xs text-gray-500">
                    Order status is managed by the administrator. You can
                    view the latest status here.
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Pagination */}
        {!loading && !error && totalPages > 1 && (
          <div className="mt-8 flex items-center justify-center gap-4">
            <button
              type="button"
              onClick={() => goToPage(page - 1)}
              disabled={page <= 1}
              className="flex items-center gap-1 rounded-lg border border-[#D9C9BB] bg-white px-4 py-2 text-sm font-medium text-[#5C3A2E] hover:bg-[#F8F4ED] disabled:cursor-not-allowed disabled:opacity-40"
            >
              <ChevronLeft size={16} />
              Previous
            </button>

            <span className="text-sm font-medium text-gray-600">
              {page} / {totalPages}
            </span>

            <button
              type="button"
              onClick={() => goToPage(page + 1)}
              disabled={page >= totalPages}
              className="flex items-center gap-1 rounded-lg border border-[#D9C9BB] bg-white px-4 py-2 text-sm font-medium text-[#5C3A2E] hover:bg-[#F8F4ED] disabled:cursor-not-allowed disabled:opacity-40"
            >
              Next
              <ChevronRight size={16} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function SummaryCard({ title, value, icon }) {
  return (
    <div className="rounded-xl border border-[#E8DED3] bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500">{title}</p>

        <div className="rounded-lg bg-[#F8F4ED] p-2 text-[#8B6248]">
          {icon}
        </div>
      </div>

      <p className="mt-3 text-2xl font-bold text-[#30231E]">
        {value ?? 0}
      </p>
    </div>
  );
}
