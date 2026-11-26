
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Package,
  CheckCircle2,
  Zap,
  BookOpen,
  ArrowRight,
  Clock,
  Leaf,
  Plus,
  Settings,
  Eye,
  MapPin,
  Phone,
  RefreshCw,
  AlertCircle,
  ShoppingBag,
} from "lucide-react";

import api from "../../config/axiosInstance";

const formatPrice = (price) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(Number(price || 0));

const formatDate = (date) => {
  if (!date) return "Date unavailable";

  return new Date(date).toLocaleString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const displayStatus = (status) =>
  (status || "UNKNOWN")
    .replaceAll("_", " ")
    .toLowerCase()
    .replace(/\b\w/g, (letter) => letter.toUpperCase());

const getStatusStyle = (status) => {
  switch (status) {
    case "PENDING":
      return "bg-amber-100 text-amber-700";
    case "CONFIRMED":
      return "bg-green-100 text-green-700";
    case "SHIPPED":
      return "bg-blue-100 text-blue-700";
    case "OUT_FOR_DELIVERY":
      return "bg-purple-100 text-purple-700";
    case "DELIVERED":
      return "bg-emerald-100 text-emerald-700";
    case "CANCELLED":
      return "bg-red-100 text-red-700";
    default:
      return "bg-[#F8F4ED] text-[#5C3A2E]";
  }
};

const ArtisanDashboard = () => {
  const navigate = useNavigate();

  const [orders, setOrders] = useState([]);
  const [summary, setSummary] = useState({
    total_orders: 0,
    active_orders: 0,
    total_items: 0,
    completed_orders: 0,
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedOrder, setSelectedOrder] = useState(null);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      setError("");

      // Dashboard displays only the latest five orders.
      const response = await api.get("/orders/artisan/orders/", {
        params: {
          page: 1,
          page_size: 5,
        },
      });

      const orderData = Array.isArray(response.data?.results)
        ? response.data.results
        : [];

      const summaryData = response.data?.summary || {};

      setOrders(orderData);

      setSummary({
        total_orders: Number(summaryData.total_orders || 0),
        active_orders: Number(summaryData.active_orders || 0),
        total_items: Number(summaryData.total_items || 0),
        completed_orders: Number(
          summaryData.completed_orders ??
          summaryData.delivered_orders ??
          0
        ),
      });

      setSelectedOrder((previous) => {
        if (!previous) return null;

        return (
          orderData.find((order) => order.id === previous.id) || null
        );
      });
    } catch (err) {
      console.error("Failed to fetch artisan orders:", err);

      setError(
        err.response?.data?.error ||
          err.response?.data?.detail ||
          "Unable to load your orders. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const scrollToOrders = () => {
    document.getElementById("artisan-orders")?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  };

  const stats = [
    {
      label: "Order Overview",
      title: "Total Orders",
      count: summary.total_orders,
      description: "Orders containing your products",
      badge: "All Your Orders",
      icon: Package,
      onClick: () => navigate("/artisan/orders"),
    },
    {
      label: "Currently Active",
      title: "Active Orders",
      count: summary.active_orders,
      description: "Orders still being processed",
      badge: "Needs Tracking",
      icon: Clock,
      onClick: () => navigate("/artisan/orders?status=active"),
    },
    {
      label: "Product Overview",
      title: "Items Ordered",
      count: summary.total_items,
      description: "Total units ordered from your shop",
      badge: "Your Products",
      icon: ShoppingBag,
      onClick: () => navigate("/artisan/products"),
    },
  ];

  const workflow = [
    {
      title: "Review Customer Order",
      description:
        "Check your products, quantities and delivery details",
    },
    {
      title: "Prepare Your Products",
      description:
        "Prepare and pack the handmade products carefully",
    },
    {
      title: "Order Fulfilment",
      description:
        "Coordinate dispatch and track the order progress",
    },
  ];

  return (
    <div className="space-y-8">
      {/* Welcome Banner */}
      <section className="relative overflow-hidden rounded-3xl border border-[#F2E6E1] bg-gradient-to-r from-[#FDF4F1] to-[#FDE5DA] p-6 sm:p-8 md:p-12">
        <div className="absolute right-5 top-5 translate-x-5 -translate-y-5 opacity-10 sm:right-10">
          <Leaf
            size={160}
            className="text-[#5C3A2E] md:h-[200px] md:w-[200px]"
          />
        </div>

        <div className="relative z-10 max-w-3xl">
          <div className="mb-6 flex flex-wrap gap-3 text-[10px] font-bold uppercase tracking-wider text-[#8B6248] sm:text-xs">
            <span className="flex items-center gap-2 rounded-full border border-[#E5D5CC] bg-white/60 px-3 py-2">
              <span className="h-1.5 w-1.5 rounded-full bg-[#B87552]" />
              Kerala Artisan Atelier
            </span>

            <span className="flex items-center gap-2 rounded-full border border-[#E5D5CC] bg-white/60 px-3 py-2">
              <span className="h-1.5 w-1.5 rounded-full bg-[#5C3A2E]" />
              Your Artisan Workspace
            </span>
          </div>

          <h1 className="mb-4 font-serif text-3xl font-bold text-[#30231E] sm:text-4xl md:text-5xl">
            Welcome back, Artisan!
          </h1>

          <p className="mb-8 max-w-2xl text-sm leading-relaxed text-[#5C3A2E] sm:text-base md:text-lg">
            Manage your handmade products, view customer orders,
            prepare your products and track their delivery progress.
          </p>

          <button
            type="button"
            onClick={scrollToOrders}
            className="flex items-center gap-2 rounded-lg bg-[#30231E] px-5 py-3 text-sm font-medium text-white shadow-lg transition-colors hover:bg-[#5C3A2E]"
          >
            View My Orders
            <ArrowRight size={18} />
          </button>
        </div>
      </section>

      {/* Statistics */}
      <section className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {stats.map((stat) => {
          const Icon = stat.icon;

          return (
            <button
              key={stat.title}
              type="button"
              onClick={stat.onClick}
              className="flex h-full flex-col justify-between rounded-2xl border border-[#F2E6E1] bg-white p-5 text-left shadow-sm transition-all hover:-translate-y-1 hover:shadow-md sm:p-6"
            >
              <div className="mb-5 flex w-full items-start justify-between">
                <div>
                  <p className="mb-1 text-xs font-bold uppercase tracking-wider text-[#8B6248]">
                    {stat.label}
                  </p>

                  <h2 className="text-lg font-bold text-[#30231E]">
                    {stat.title}
                  </h2>
                </div>

                <div className="rounded-lg bg-[#FDF1EC] p-3 text-[#B87552]">
                  <Icon size={20} />
                </div>
              </div>

              <div>
                <p className="mb-2 font-serif text-4xl font-bold text-[#30231E]">
                  {stat.count}
                </p>

                <p className="mb-4 text-sm text-[#8B6248]">
                  {stat.description}
                </p>

                <span className="inline-flex rounded-full border border-[#E5E0D8] bg-[#F8F4ED] px-2.5 py-1 text-xs font-medium text-[#5C3A2E]">
                  {stat.badge}
                  <ArrowRight size={13} className="ml-1" />
                </span>
              </div>
            </button>
          );
        })}
      </section>

      {/* Orders and Sidebar */}
      <section className="grid grid-cols-1 gap-6 lg:grid-cols-3 lg:gap-8">
        {/* Artisan Orders */}
        <div
          id="artisan-orders"
          className="scroll-mt-6 space-y-5 lg:col-span-2"
        >
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <h2 className="font-serif text-2xl font-bold text-[#30231E]">
                My Customer Orders
              </h2>

              <p className="mt-1 text-sm text-[#8B6248]">
                Showing your latest five orders
              </p>
            </div>

            <div className="flex items-center gap-4">
              <button
                type="button"
                onClick={() => navigate("/artisan/orders")}
                className="flex items-center gap-1 text-sm font-semibold text-[#B87552] transition-colors hover:text-[#5C3A2E]"
              >
                View All Orders
                <ArrowRight size={15} />
              </button>

              <button
                type="button"
                onClick={fetchOrders}
                disabled={loading}
                className="flex items-center gap-2 text-sm font-medium text-[#5C3A2E] transition-colors hover:text-[#B87552] disabled:opacity-50"
              >
                <RefreshCw
                  size={14}
                  className={loading ? "animate-spin" : ""}
                />
                Refresh
              </button>
            </div>
          </div>

          {error && (
            <div className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
              <AlertCircle size={18} className="mt-0.5 flex-shrink-0" />
              {error}
            </div>
          )}

          {loading ? (
            <div className="rounded-2xl border border-[#F2E6E1] bg-white p-10 text-center">
              <RefreshCw
                className="mx-auto mb-3 animate-spin text-[#B87552]"
                size={28}
              />

              <p className="text-sm text-[#8B6248]">
                Loading your orders...
              </p>
            </div>
          ) : error ? (
            <div className="rounded-2xl border border-red-200 bg-white p-6 text-center">
              <p className="mb-4 text-sm text-red-600">
                Please check your connection and try again.
              </p>

              <button
                type="button"
                onClick={fetchOrders}
                className="rounded-lg bg-[#30231E] px-5 py-2 text-sm font-medium text-white hover:bg-[#5C3A2E]"
              >
                Try Again
              </button>
            </div>
          ) : orders.length === 0 ? (
            <div className="rounded-2xl border border-[#F2E6E1] bg-white p-10 text-center">
              <Package
                size={36}
                className="mx-auto mb-3 text-[#B87552]"
              />

              <h3 className="mb-2 font-bold text-[#30231E]">
                No Customer Orders Yet
              </h3>

              <p className="text-sm text-[#8B6248]">
                Customer orders containing your products will appear here.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {orders.map((order) => {
                const orderStatus = order.order_status || "PENDING";
                const isExpanded = selectedOrder?.id === order.id;

                return (
                  <article
                    key={order.id}
                    className="rounded-2xl border border-[#F2E6E1] bg-white p-4 shadow-sm"
                  >
                    <div className="flex flex-col gap-4 sm:flex-row">
                      {/* First Product Image */}
                      <div className="h-24 w-24 flex-shrink-0 overflow-hidden rounded-xl bg-[#FDF1EC]">
                        {order.items?.[0]?.image ? (
                          <img
                            src={order.items[0].image}
                            alt={
                              order.items[0].product_name || "Product"
                            }
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center text-[#B87552]">
                            <Package size={36} />
                          </div>
                        )}
                      </div>

                      <div className="flex min-w-0 flex-1 flex-col justify-between gap-3">
                        <div>
                          <div className="mb-2 flex flex-wrap items-center gap-2">
                            <span
                              className={`rounded-full px-2 py-1 text-xs font-bold ${getStatusStyle(orderStatus)}`}
                            >
                              {displayStatus(orderStatus)}
                            </span>

                            <span className="flex items-center gap-1 text-xs text-[#8B6248]">
                              <Clock size={12} />
                              {formatDate(order.created_at)}
                            </span>
                          </div>

                          <h3 className="mb-1 break-all font-bold text-[#30231E]">
                            Order #{String(order.order_number || order.id).slice(0, 8)}
                          </h3>

                          <p className="mb-2 text-sm text-[#5C3A2E]">
                            Customer:{" "}
                            {order.customer?.full_name || "Customer"}
                          </p>

                          <p className="text-sm font-medium text-[#30231E]">
                            {order.items_count || order.items?.length || 0}{" "}
                            product item(s) •{" "}
                            {formatPrice(order.artisan_subtotal)}
                          </p>
                        </div>

                        <button
                          type="button"
                          onClick={() =>
                            setSelectedOrder(
                              isExpanded ? null : order
                            )
                          }
                          className="flex items-center gap-2 self-start rounded-lg border border-[#E5E0D8] bg-white px-4 py-2 text-sm font-medium text-[#30231E] transition-colors hover:bg-[#F8F4ED]"
                        >
                          <Eye size={15} />
                          {isExpanded ? "Hide Details" : "View Order Details"}
                        </button>
                      </div>
                    </div>

                    {/* Expanded Order Details */}
                    {isExpanded && (
                      <div className="mt-5 space-y-4 border-t border-[#E5E0D8] pt-5">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <h4 className="font-bold text-[#30231E]">
                            Products in This Order
                          </h4>

                          <span
                            className={`rounded-full px-3 py-1 text-xs font-bold ${getStatusStyle(orderStatus)}`}
                          >
                            {displayStatus(orderStatus)}
                          </span>
                        </div>

                        {/* Product Items */}
                        <div className="space-y-3">
                          {order.items?.map((item) => (
                            <div
                              key={item.id}
                              className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-[#F8F4ED] p-3"
                            >
                              <div className="flex min-w-0 items-center gap-3">
                                {item.image ? (
                                  <img
                                    src={item.image}
                                    alt={item.product_name || "Product"}
                                    className="h-14 w-14 flex-shrink-0 rounded-lg object-cover"
                                  />
                                ) : (
                                  <div className="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-lg bg-[#FDF1EC] text-[#B87552]">
                                    <Package size={22} />
                                  </div>
                                )}

                                <div>
                                  <p className="text-sm font-semibold text-[#30231E]">
                                    {item.product_name}
                                  </p>

                                  <p className="text-xs text-[#8B6248]">
                                    {formatPrice(item.unit_price)} ×{" "}
                                    {item.quantity}
                                  </p>
                                </div>
                              </div>

                              <p className="text-sm font-bold text-[#5C3A2E]">
                                {formatPrice(item.subtotal)}
                              </p>
                            </div>
                          ))}
                        </div>

                        {/* Delivery Details */}
                        <div className="rounded-xl border border-[#F2E6E1] p-4">
                          <h4 className="mb-3 font-bold text-[#30231E]">
                            Delivery Details
                          </h4>

                          <div className="space-y-2 text-sm text-[#5C3A2E]">
                            <p>
                              <strong>Name:</strong>{" "}
                              {order.delivery_address?.full_name || "Not available"}
                            </p>

                            <p className="flex items-start gap-2">
                              <Phone
                                size={15}
                                className="mt-0.5 flex-shrink-0"
                              />
                              {order.delivery_address?.phone || "Not available"}
                            </p>

                            <p className="flex items-start gap-2">
                              <MapPin
                                size={15}
                                className="mt-0.5 flex-shrink-0"
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

                        {/* Artisan Subtotal */}
                        <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl bg-[#FDF1EC] p-4">
                          <span className="text-sm font-semibold text-[#5C3A2E]">
                            Your Products Subtotal
                          </span>

                          <span className="text-lg font-bold text-[#30231E]">
                            {formatPrice(order.artisan_subtotal)}
                          </span>
                        </div>

                        {/* Order Information */}
                        <div className="rounded-xl border border-[#E5E0D8] bg-white p-4">
                          <h4 className="mb-2 font-bold text-[#30231E]">
                            Order Progress
                          </h4>

                          <p className="text-sm leading-relaxed text-[#8B6248]">
                            {orderStatus === "PENDING" &&
                              "Your order is awaiting confirmation and processing."}

                            {orderStatus === "CONFIRMED" &&
                              "Your order has been confirmed. Prepare your products for dispatch."}

                            {orderStatus === "SHIPPED" &&
                              "Your order has been shipped and is on its way to the customer."}

                            {orderStatus === "OUT_FOR_DELIVERY" &&
                              "Your order is out for delivery."}

                            {orderStatus === "DELIVERED" &&
                              "This order has been successfully delivered."}

                            {orderStatus === "CANCELLED" &&
                              "This order has been cancelled."}

                            {![
                              "PENDING",
                              "CONFIRMED",
                              "SHIPPED",
                              "OUT_FOR_DELIVERY",
                              "DELIVERED",
                              "CANCELLED",
                            ].includes(orderStatus) &&
                              "Check the latest order status for updates."}
                          </p>
                        </div>
                      </div>
                    )}
                  </article>
                );
              })}
            </div>
          )}
        </div>

        {/* Right Sidebar */}
        <aside className="space-y-6">
          {/* Quick Actions */}
          <div className="rounded-2xl border border-[#F2E6E1] bg-white p-5 shadow-sm sm:p-6">
            <div className="mb-5 flex items-center gap-2">
              <Zap size={18} className="text-[#B87552]" />

              <h2 className="text-lg font-bold text-[#30231E]">
                Quick Actions
              </h2>
            </div>

            <div className="space-y-3">
              <button
                type="button"
                onClick={() => navigate("/artisan/products/add")}
                className="flex w-full flex-col items-center justify-center gap-2 rounded-xl bg-[#30231E] p-4 text-white shadow-md transition-colors hover:bg-[#5C3A2E]"
              >
                <span className="flex items-center gap-2 font-bold">
                  <Plus size={18} />
                  Add New Product
                </span>

                <span className="text-center text-xs font-normal text-gray-200">
                  Create a product listing with photos and pricing
                </span>
              </button>

              <button
                type="button"
                onClick={() => navigate("/artisan/products")}
                className="flex w-full flex-col items-center justify-center gap-2 rounded-xl border border-[#E5E0D8] bg-white p-4 text-[#30231E] transition-colors hover:bg-[#F8F4ED]"
              >
                <span className="flex items-center gap-2 font-bold">
                  <Settings size={18} />
                  Manage My Products
                </span>

                <span className="text-center text-xs font-normal text-[#8B6248]">
                  Update inventory, pricing, and product details
                </span>
              </button>
            </div>
          </div>

          {/* Artisan Workflow */}
          <div className="rounded-2xl border border-[#F2E6E1] bg-white p-5 shadow-sm sm:p-6">
            <div className="mb-5 flex items-center gap-2">
              <BookOpen size={18} className="text-[#B87552]" />

              <h2 className="text-lg font-bold text-[#30231E]">
                Artisan Order Workflow
              </h2>
            </div>

            <ol className="mb-5 space-y-4">
              {workflow.map((step, index) => (
                <li key={step.title} className="flex gap-3">
                  <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full border border-[#F2E6E1] bg-[#FDF1EC] text-xs font-bold text-[#B87552]">
                    {index + 1}
                  </span>

                  <div>
                    <p className="text-sm font-bold text-[#30231E]">
                      {step.title}
                    </p>

                    <p className="text-xs leading-relaxed text-[#8B6248]">
                      {step.description}
                    </p>
                  </div>
                </li>
              ))}
            </ol>

            <div className="flex gap-3 rounded-xl border border-[#F2E6E1] bg-[#FDF4F1] p-4">
              <div className="mt-0.5 text-[#B87552]">
                <Clock size={16} />
              </div>

              <p className="text-xs leading-relaxed text-[#5C3A2E]">
                <span className="font-bold">Tip:</span>{" "}
                Check new orders regularly and prepare your handmade
                products carefully for delivery.
              </p>
            </div>
          </div>

          {/* Completed Orders */}
          <div className="rounded-2xl border border-[#F2E6E1] bg-white p-5 shadow-sm sm:p-6">
            <div className="mb-3 flex items-center gap-2">
              <CheckCircle2 size={18} className="text-green-700" />

              <h2 className="text-lg font-bold text-[#30231E]">
                Completed Orders
              </h2>
            </div>

            <p className="font-serif text-3xl font-bold text-[#30231E]">
              {summary.completed_orders}
            </p>

            <p className="mt-1 text-xs text-[#8B6248]">
              Successfully delivered orders containing your products
            </p>
          </div>
        </aside>
      </section>
    </div>
  );
};

export default ArtisanDashboard;
