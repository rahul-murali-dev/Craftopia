
import { useLocation, useNavigate } from "react-router-dom";

import Header from "../components/layout/Header";
import Footer from "../components/layout/Footer";

function OrderConfirmationPage() {
  const navigate = useNavigate();
  const location = useLocation();

  const order = location.state?.order;

  // If the customer refreshes this page or opens it directly,
  // redirect to My Orders.
  if (!order) {
    return (
      <>
        <Header />

        <main className="min-h-[60vh] flex flex-col items-center justify-center bg-[#F8F4ED] px-4">
          <h2 className="text-2xl font-semibold text-[#30231E]">
            Order details not found
          </h2>

          <p className="text-gray-600 mt-2">
            Please check your orders to view the details.
          </p>

          <button
            onClick={() => navigate("/my-orders")}
            className="mt-6 rounded-lg bg-[#5C3A2E] px-6 py-3 text-white hover:bg-[#30231E]"
          >
            My Orders
          </button>
        </main>

        <Footer />
      </>
    );
  }

  const formatPrice = (amount) =>
    `₹${Number(amount || 0).toFixed(2)}`;

  return (
    <>
      <Header />

      <main className="min-h-screen bg-[#F8F4ED] px-4 py-12">
        <div className="max-w-3xl mx-auto">

          {/* Success Message */}
          <div className="bg-white rounded-xl shadow-sm p-8 text-center">

            <div className="mx-auto w-16 h-16 rounded-full bg-green-100 flex items-center justify-center">
              <span className="text-3xl text-green-600">✓</span>
            </div>

            <h1 className="text-3xl font-serif font-bold text-[#30231E] mt-5">
              Order Placed Successfully!
            </h1>

            <p className="text-gray-600 mt-3">
              Thank you for shopping with Craftopia.
              Your order has been confirmed.
            </p>

            <div className="mt-6 rounded-lg bg-[#F8F4ED] p-4">
              <p className="text-sm text-gray-600">
                Order Number
              </p>

              <p className="font-semibold text-[#5C3A2E] mt-1 break-all">
                {order.order_number}
              </p>
            </div>

          </div>

          {/* Order Details */}
          <div className="bg-white rounded-xl shadow-sm p-6 mt-6">

            <h2 className="text-xl font-semibold text-[#30231E] mb-5">
              Order Details
            </h2>

            <div className="flex justify-between gap-4 mb-3">
              <span className="text-gray-600">Order Status</span>

              <span className="font-semibold text-green-700">
                {order.status}
              </span>
            </div>

            <div className="flex justify-between gap-4 mb-3">
              <span className="text-gray-600">Payment Method</span>
              <span className="font-medium">Cash on Delivery</span>
            </div>

            <div className="flex justify-between gap-4 mb-3">
              <span className="text-gray-600">Order Date</span>

              <span className="font-medium">
                {order.created_at
                  ? new Date(order.created_at).toLocaleDateString("en-IN")
                  : "-"}
              </span>
            </div>

            <div className="border-t border-gray-200 my-5" />

            <h3 className="font-semibold text-[#30231E] mb-4">
              Ordered Products
            </h3>

            <div className="space-y-4">
              {order.items?.map((item) => (
                <div
                  key={item.id}
                  className="flex justify-between gap-4 border-b border-gray-100 pb-4"
                >
                  <div>
                    <p className="font-medium text-[#30231E]">
                      {item.product_name}
                    </p>

                    <p className="text-sm text-gray-500 mt-1">
                      Quantity: {item.quantity}
                    </p>

                    <p className="text-sm text-gray-500">
                      Unit Price: {formatPrice(item.unit_price)}
                    </p>
                  </div>

                  <p className="font-semibold text-[#5C3A2E] whitespace-nowrap">
                    {formatPrice(item.subtotal)}
                  </p>
                </div>
              ))}
            </div>

            <div className="border-t border-gray-200 mt-5 pt-5 space-y-3">

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

                <span className="font-bold text-lg text-[#5C3A2E]">
                  {formatPrice(order.total_amount)}
                </span>
              </div>

            </div>
          </div>

          {/* Delivery Address */}
          <div className="bg-white rounded-xl shadow-sm p-6 mt-6">

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

          {/* Navigation Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 mt-8">

            <button
              onClick={() => navigate("/my-orders")}
              className="flex-1 rounded-lg bg-[#5C3A2E] px-6 py-3 font-semibold text-white hover:bg-[#30231E]"
            >
              View My Orders
            </button>

            <button
              onClick={() => navigate("/products")}
              className="flex-1 rounded-lg border border-[#8B6248] px-6 py-3 font-semibold text-[#5C3A2E] hover:bg-white"
            >
              Continue Shopping
            </button>

          </div>

        </div>
      </main>

      <Footer />
    </>
  );
}

export default OrderConfirmationPage;
