
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  RefreshCw,
  Search,
  Package,
  Pencil,
  Check,
  X,
  AlertCircle,
  CheckCircle,
} from "lucide-react";
import api from "../config/axiosInstance";

const AdminStockPage = () => {
  const navigate = useNavigate();

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [stockValue, setStockValue] = useState("");
  const [updatingId, setUpdatingId] = useState(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const fetchProducts = async (searchValue = search) => {
    try {
      setLoading(true);
      setError("");

      const response = await api.get("/products/admin/stock/", {
        params: searchValue.trim()
          ? { search: searchValue.trim() }
          : {},
      });

      setProducts(Array.isArray(response.data) ? response.data : []);
    } catch (err) {
      console.error("Error fetching stock:", err);
      setError(
        err.response?.data?.error ||
          err.response?.data?.detail ||
          "Unable to load stock information."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts("");
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    fetchProducts(search);
  };

  const clearSearch = () => {
    setSearch("");
    fetchProducts("");
  };

  const startEditing = (product) => {
    setEditingId(product.id);
    setStockValue(String(product.stock));
    setError("");
    setSuccess("");
  };

  const cancelEditing = () => {
    setEditingId(null);
    setStockValue("");
  };

  const handleStockUpdate = async (productId) => {
    const trimmedValue = String(stockValue).trim();

    if (trimmedValue === "") {
      setError("Please enter a stock quantity.");
      return;
    }

    if (!/^\d+$/.test(trimmedValue)) {
      setError("Stock must be a non-negative whole number.");
      return;
    }

    const newStock = Number(trimmedValue);

    if (!Number.isSafeInteger(newStock)) {
      setError("Please enter a valid stock quantity.");
      return;
    }

    try {
      setUpdatingId(productId);
      setError("");
      setSuccess("");

      const response = await api.patch(
        `/products/admin/stock/${productId}/`,
        { stock: newStock }
      );

      setProducts((previous) =>
        previous.map((product) =>
          product.id === productId
            ? { ...product, stock: response.data.stock }
            : product
        )
      );

      setSuccess(response.data.message || "Stock updated successfully.");
      setEditingId(null);
      setStockValue("");
    } catch (err) {
      console.error("Error updating stock:", err);
      setError(
        err.response?.data?.error ||
          err.response?.data?.detail ||
          "Unable to update stock."
      );
    } finally {
      setUpdatingId(null);
    }
  };

  const getStockLabel = (stock) => {
    if (stock === 0) {
      return {
        label: "Out of Stock",
        style: "bg-red-100 text-red-700",
      };
    }

    if (stock <= 5) {
      return {
        label: "Low Stock",
        style: "bg-yellow-100 text-yellow-800",
      };
    }

    return {
      label: "In Stock",
      style: "bg-green-100 text-green-700",
    };
  };

  const getDisplayValue = (value) => {
    if (value === null || value === undefined || value === "") {
      return "—";
    }

    if (typeof value === "object") {
      return value.name || value.business_name || "—";
    }

    return value;
  };

  const lowStockCount = products.filter(
    (product) => product.stock > 0 && product.stock <= 5
  ).length;

  const outOfStockCount = products.filter(
    (product) => product.stock === 0
  ).length;

  return (
    <div className="min-h-screen bg-[#F8F4ED] p-4 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <button
              onClick={() => navigate("/admin/dashboard")}
              className="mb-3 flex items-center gap-2 text-sm font-medium text-[#8B6248] hover:text-[#5C3A2E]"
            >
              <ArrowLeft size={17} />
              Back to Dashboard
            </button>

            <h1 className="text-2xl font-bold text-[#30231E] sm:text-3xl">
              Stock Management
            </h1>

            <p className="mt-1 text-sm text-gray-500">
              View product stock and update available quantities.
            </p>
          </div>

          <button
            onClick={() => fetchProducts()}
            disabled={loading}
            className="flex items-center justify-center gap-2 rounded-lg border border-[#8B6248] px-4 py-2.5 text-sm font-semibold text-[#5C3A2E] hover:bg-[#8B6248] hover:text-white disabled:opacity-50"
          >
            <RefreshCw size={16} />
            Refresh
          </button>
        </div>

        {/* Summary */}
        <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="rounded-xl bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-500">Products Found</p>
              <Package size={20} className="text-[#8B6248]" />
            </div>
            <p className="mt-2 text-2xl font-bold text-[#30231E]">
              {products.length}
            </p>
          </div>

          <div className="rounded-xl bg-white p-5 shadow-sm">
            <p className="text-sm text-gray-500">Low Stock (1–5)</p>
            <p className="mt-2 text-2xl font-bold text-yellow-700">
              {lowStockCount}
            </p>
          </div>

          <div className="rounded-xl bg-white p-5 shadow-sm">
            <p className="text-sm text-gray-500">Out of Stock</p>
            <p className="mt-2 text-2xl font-bold text-red-700">
              {outOfStockCount}
            </p>
          </div>
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

        {/* Search */}
        <form
          onSubmit={handleSearch}
          className="mb-6 flex flex-col gap-3 rounded-xl bg-white p-4 shadow-sm sm:flex-row"
        >
          <div className="relative flex-1">
            <Search
              size={18}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search product name..."
              className="w-full rounded-lg border border-gray-200 py-2.5 pl-10 pr-4 text-sm outline-none focus:border-[#8B6248]"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="rounded-lg bg-[#5C3A2E] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#8B6248] disabled:opacity-50"
          >
            Search
          </button>

          <button
            type="button"
            onClick={clearSearch}
            className="rounded-lg border border-gray-200 px-5 py-2.5 text-sm font-semibold text-gray-600 hover:bg-gray-50"
          >
            Clear
          </button>
        </form>

        {/* Products table */}
        <div className="overflow-hidden rounded-xl bg-white shadow-sm">
          <div className="border-b border-gray-100 p-5">
            <h2 className="font-bold text-[#30231E]">Product Stock List</h2>
            <p className="mt-1 text-xs text-gray-500">
              Select Edit to change a product's stock quantity.
            </p>
          </div>

          {loading ? (
            <div className="p-10 text-center text-[#5C3A2E]">
              Loading products...
            </div>
          ) : products.length === 0 ? (
            <div className="p-10 text-center">
              <Package size={36} className="mx-auto mb-3 text-[#B87552]" />
              <p className="font-semibold text-[#30231E]">
                No products found
              </p>
              <p className="mt-1 text-sm text-gray-500">
                Try another product name.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[850px] text-left text-sm">
                <thead className="bg-[#F8F4ED] text-xs uppercase text-gray-500">
                  <tr>
                    <th className="px-5 py-4">Product</th>
                    <th className="px-5 py-4">Category</th>
                    <th className="px-5 py-4">Artisan</th>
                    <th className="px-5 py-4">Price</th>
                    <th className="px-5 py-4">Stock</th>
                    <th className="px-5 py-4">Publication</th>
                    <th className="px-5 py-4 text-right">Action</th>
                  </tr>
                </thead>

                <tbody>
                  {products.map((product) => {
                    const stockStatus = getStockLabel(product.stock);
                    const isEditing = editingId === product.id;

                    return (
                      <tr
                        key={product.id}
                        className="border-t border-gray-100 hover:bg-[#FDFBF8]"
                      >
                        <td className="px-5 py-4">
                          <p className="font-semibold text-[#30231E]">
                            {product.name}
                          </p>
                          <p className="mt-1 text-xs text-gray-400">
                            ID: {product.id}
                          </p>
                        </td>

                        <td className="px-5 py-4 text-gray-600">
                          {getDisplayValue(product.category)}
                        </td>

                        <td className="px-5 py-4 text-gray-600">
                          {getDisplayValue(product.artisan)}
                        </td>

                        <td className="px-5 py-4 font-medium text-[#5C3A2E]">
                          ₹{Number(product.price || 0).toLocaleString("en-IN")}
                        </td>

                        <td className="px-5 py-4">
                          {isEditing ? (
                            <input
                              type="number"
                              min="0"
                              step="1"
                              value={stockValue}
                              onChange={(e) => setStockValue(e.target.value)}
                              className="w-24 rounded-lg border border-[#8B6248] px-3 py-2 outline-none focus:ring-2 focus:ring-[#8B6248]/20"
                            />
                          ) : (
                            <div>
                              <p className="font-bold text-[#30231E]">
                                {product.stock}
                              </p>
                              <span
                                className={`mt-1 inline-block rounded-full px-2.5 py-1 text-xs font-semibold ${stockStatus.style}`}
                              >
                                {stockStatus.label}
                              </span>
                            </div>
                          )}
                        </td>

                        <td className="px-5 py-4">
                          <span
                            className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                              product.is_published
                                ? "bg-green-100 text-green-700"
                                : "bg-gray-100 text-gray-600"
                            }`}
                          >
                            {product.is_published ? "Published" : "Unpublished"}
                          </span>
                        </td>

                        <td className="px-5 py-4">
                          <div className="flex justify-end gap-2">
                            {isEditing ? (
                              <>
                                <button
                                  onClick={() => handleStockUpdate(product.id)}
                                  disabled={updatingId === product.id}
                                  title="Save stock"
                                  className="rounded-lg bg-green-700 p-2 text-white hover:bg-green-800 disabled:opacity-50"
                                >
                                  <Check size={17} />
                                </button>

                                <button
                                  onClick={cancelEditing}
                                  disabled={updatingId === product.id}
                                  title="Cancel"
                                  className="rounded-lg bg-gray-200 p-2 text-gray-700 hover:bg-gray-300"
                                >
                                  <X size={17} />
                                </button>
                              </>
                            ) : (
                              <button
                                onClick={() => startEditing(product)}
                                title="Edit stock"
                                className="flex items-center gap-2 rounded-lg bg-[#5C3A2E] px-3 py-2 text-xs font-semibold text-white hover:bg-[#8B6248]"
                              >
                                <Pencil size={14} />
                                Edit
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminStockPage;
