
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import Header from "../components/layout/Header";
import Footer from "../components/layout/Footer";
import api from "../config/axiosInstance";

function MyOrdersPage() {
  const navigate = useNavigate();

  const [orders, setOrders] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchOrders = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await api.get("/orders/my-orders/");
      const data = response.data;

      setOrders(Array.isArray(data) ? data : data.results || []);
    } catch (err) {
      if (err.response?.status === 401) {
        navigate("/login");
        return;
      }

      setError(
        err.response?.data?.message ||
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

  const filteredOrders = useMemo(() => {
    const keyword = search.trim().toLowerCase();

    if (!keyword) return orders;

    return orders.filter(
      (order) =>
        order.order_number?.toLowerCase().includes(keyword) ||
        order.status?.toLowerCase().includes(keyword)
    );
  }, [orders, search]);

  const formatPrice = (amount) =>
    `₹${Number(amount || 0).toFixed(2)}`;

  const formatDate = (date) => {
    if (!date) return "-";

    return new Date(date).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

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

  const displayStatus = (status) =>
    status?.replaceAll("_", " ") || "UNKNOWN";

  const getImageUrl = (image) => {
    if (!image) return "";

    if (image.startsWith("http://") || image.startsWith("https://")) {
      return image;
    }

    const baseURL = api.defaults.baseURL?.replace(/\/api\/?$/, "");

    return `${baseURL}${image.startsWith("/") ? image : `/${image}`}`;
  };

  return (
    <>
      <Header />

      <main className="min-h-screen bg-[#F8F4ED] px-4 py-10">
        <div className="max-w-6xl mx-auto">

          {/* Page Heading */}
          <div className="mb-8">
            <h1 className="text-3xl sm:text-4xl font-serif font-bold text-[#30231E]">
              My Orders
            </h1>

            <p className="text-[#8B6248] mt-2">
              Track and manage your Craftopia purchases.
            </p>
          </div>

          {/* Search */}
          <div className="mb-7">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by order number or status..."
              className="w-full bg-white border border-[#E5D8CA] rounded-lg px-4 py-3 outline-none focus:ring-2 focus:ring-[#8B6248]"
            />
          </div>

          {/* Loading */}
          {loading && (
            <div className="text-center py-16 text-[#8B6248]">
              Loading your orders...
            </div>
          )}

          {/* Error */}
          {!loading && error && (
            <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-5 text-center">
              {error}

              <button
                onClick={fetchOrders}
                className="block mx-auto mt-3 underline font-semibold"
              >
                Try Again
              </button>
            </div>
          )}

          {/* Empty */}
          {!loading && !error && filteredOrders.length === 0 && (
            <div className="bg-white rounded-xl shadow-sm p-10 text-center">
              <h2 className="text-xl font-semibold text-[#30231E]">
                No Orders Found
              </h2>

              <p className="text-gray-500 mt-2">
                {search
                  ? "No orders match your search."
                  : "You have not placed any orders yet."}
              </p>

              {!search && (
                <button
                  onClick={() => navigate("/products")}
                  className="mt-5 bg-[#5C3A2E] text-white px-6 py-3 rounded-lg hover:bg-[#8B6248] transition"
                >
                  Explore Products
                </button>
              )}
            </div>
          )}

          {/* Orders */}
          {!loading && !error && filteredOrders.length > 0 && (
            <div className="space-y-6">
              {filteredOrders.map((order) => (
                <div
                  key={order.id}
                  className="bg-white rounded-xl shadow-sm border border-[#EDE3D9] overflow-hidden"
                >
                  {/* Order Header */}
                  <div className="p-5 sm:p-6 border-b border-[#EDE3D9]">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                      <div>
                        <p className="text-sm text-gray-500">
                          Order Number
                        </p>

                        <p className="font-semibold text-[#30231E] break-all">
                          #{order.order_number}
                        </p>

                        <p className="text-sm text-gray-500 mt-2">
                          Ordered on {formatDate(order.created_at)}
                        </p>
                      </div>

                      <span
                        className={`px-4 py-2 rounded-full text-xs font-semibold w-fit ${getStatusStyle(
                          order.status
                        )}`}
                      >
                        {displayStatus(order.status)}
                      </span>
                    </div>
                  </div>

                  {/* Product Items */}
                  <div className="p-5 sm:p-6 space-y-4">
                    <h3 className="font-semibold text-[#30231E]">
                      Ordered Products ({order.items?.length || 0})
                    </h3>

                    {order.items?.map((item) => {
                      const firstImage = item.product?.images?.[0]?.image;

                      return (
                        <div
                          key={item.id}
                          className="flex gap-4 items-center border border-[#F0E8DF] rounded-lg p-3"
                        >
                          {/* Actual Product Image */}
                          <div className="w-20 h-20 sm:w-24 sm:h-24 flex-shrink-0 bg-[#F8F4ED] rounded-lg overflow-hidden">
                            {firstImage ? (
                              <img
                                src={getImageUrl(firstImage)}
                                alt={item.product_name}
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                  e.currentTarget.style.display = "none";
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
                            <h4 className="font-semibold text-[#30231E]">
                              {item.product_name}
                            </h4>

                            <p className="text-sm text-gray-500 mt-1">
                              Price: {formatPrice(item.unit_price)}
                            </p>

                            <p className="text-sm text-gray-500">
                              Quantity: {item.quantity}
                            </p>

                            <p className="font-semibold text-[#8B6248] mt-1">
                              Subtotal: {formatPrice(item.subtotal)}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Order Summary */}
                  <div className="bg-[#FCFAF7] p-5 sm:p-6 border-t border-[#EDE3D9]">
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                      <div>
                        <p className="text-sm text-gray-500">
                          Total Items
                        </p>

                        <p className="font-semibold text-[#30231E]">
                          {order.items?.reduce(
                            (total, item) => total + item.quantity,
                            0
                          ) || 0}
                        </p>
                      </div>

                      <div>
                        <p className="text-sm text-gray-500">
                          Payment
                        </p>

                        <p className="font-semibold text-[#30231E]">
                          Order Payment
                        </p>
                      </div>

                      <div className="col-span-2 sm:col-span-1">
                        <p className="text-sm text-gray-500">
                          Total Amount
                        </p>

                        <p className="text-lg font-bold text-[#5C3A2E]">
                          {formatPrice(order.total_amount)}
                        </p>
                      </div>
                    </div>

                    {/* View Details */}
                    <div className="flex justify-end mt-5">
                      <button
                        onClick={() =>
                          navigate(`/my-orders/${order.id}`)
                        }
                        className="bg-[#5C3A2E] text-white px-6 py-3 rounded-lg font-medium hover:bg-[#8B6248] transition"
                      >
                        View Details
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      <Footer />
    </>
  );
}

export default MyOrdersPage;
