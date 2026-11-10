
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, Pencil, Trash2, Package } from "lucide-react";
import api from "../../config/axiosInstance";

export default function MyProducts() {
  const navigate = useNavigate();

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [deletingId, setDeletingId] = useState(null);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await api.get("/products/artisan/products/");

      const data = response.data;
      setProducts(Array.isArray(data) ? data : data.results || []);
    } catch (error) {
      console.error("Product loading failed:", error);
      setError("Unable to load your products. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const handleDelete = async (productId) => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this product? This product will be removed from your listings."
    );

    if (!confirmed) return;

    try {
      setDeletingId(productId);

      await api.delete(`/products/artisan/products/${productId}/`);

      setProducts((previous) =>
        previous.filter((product) => product.id !== productId)
      );
    } catch (error) {
      console.error("Product deletion failed:", error);
      alert(
        error.response?.data
          ? JSON.stringify(error.response.data)
          : "Unable to delete product. Please try again."
      );
    } finally {
      setDeletingId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#F8F4ED]">
        <p className="text-[#8B6248]">Loading products...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8F4ED] px-4 py-8 sm:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="font-serif text-3xl font-bold text-[#30231E]">
              My Products
            </h1>
            <p className="mt-2 text-sm text-[#8B6248]">
              Manage your handmade product listings
            </p>
          </div>

          <button
            type="button"
            onClick={() => navigate("/artisan/products/add")}
            className="flex items-center gap-2 rounded-lg bg-[#30231E] px-5 py-3 text-sm font-medium text-white transition-colors hover:bg-[#5C3A2E]"
          >
            <Plus size={18} />
            Add New Product
          </button>
        </div>

        {error && (
          <div className="rounded-lg bg-red-50 p-4 text-sm text-red-600">
            <p>{error}</p>
            <button
              type="button"
              onClick={fetchProducts}
              className="mt-2 font-semibold underline"
            >
              Try Again
            </button>
          </div>
        )}

        {!error && products.length === 0 && (
          <div className="rounded-2xl border border-[#E5E0D8] bg-white p-10 text-center">
            <Package size={40} className="mx-auto mb-4 text-[#B87552]" />
            <h2 className="text-lg font-bold text-[#30231E]">
              No Products Yet
            </h2>
            <p className="mt-2 text-sm text-[#8B6248]">
              Start by adding your first handmade product.
            </p>
            <button
              type="button"
              onClick={() => navigate("/artisan/products/add")}
              className="mt-5 rounded-lg bg-[#30231E] px-5 py-2.5 text-sm font-medium text-white hover:bg-[#5C3A2E]"
            >
              Add Your First Product
            </button>
          </div>
        )}

        {!error && products.length > 0 && (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {products.map((product) => (
              <div
                key={product.id}
                className="overflow-hidden rounded-2xl border border-[#F2E6E1] bg-white shadow-sm transition-shadow hover:shadow-md"
              >
                <div className="h-52 bg-[#F8F4ED]">
                  {product.images?.length > 0 ? (
                    <img
                      src={product.images[0].image}
                      alt={product.name}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center text-[#B87552]">
                      <Package size={40} />
                    </div>
                  )}
                </div>

                <div className="p-5">
                  <div className="mb-3 flex items-start justify-between gap-3">
                    <h2 className="font-bold text-[#30231E]">
                      {product.name}
                    </h2>

                    <span
                      className={`shrink-0 rounded-full px-3 py-1 text-xs font-medium ${
                        product.is_published
                          ? "bg-green-50 text-green-700"
                          : "bg-gray-100 text-gray-600"
                      }`}
                    >
                      {product.is_published ? "Published" : "Draft"}
                    </span>
                  </div>

                  <p className="mb-2 text-sm text-[#8B6248]">
                    Stock: {product.stock}
                  </p>

                  <p className="mb-4 font-bold text-[#5C3A2E]">
                    ₹{product.price}
                  </p>

                  <div className="flex gap-3 border-t border-[#F2E6E1] pt-4">
                    <button
                      type="button"
                      onClick={() =>
                        navigate(`/artisan/products/${product.id}/edit`)
                      }
                      className="flex flex-1 items-center justify-center gap-2 rounded-lg border border-[#E5E0D8] py-2 text-sm text-[#30231E] transition-colors hover:bg-[#F8F4ED]"
                    >
                      <Pencil size={15} />
                      Edit
                    </button>

                    <button
                      type="button"
                      onClick={() => handleDelete(product.id)}
                      disabled={deletingId === product.id}
                      className="flex flex-1 items-center justify-center gap-2 rounded-lg border border-red-100 py-2 text-sm text-red-600 transition-colors hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <Trash2 size={15} />
                      {deletingId === product.id ? "Deleting..." : "Delete"}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
