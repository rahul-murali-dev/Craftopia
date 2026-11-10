
import { useEffect, useState } from "react";
import { Plus, Search, Pencil, Trash2, X, ChevronLeft, ChevronRight } from "lucide-react";
import api from "../../config/axiosInstance";

export default function CategoryManagement() {
  const [categories, setCategories] = useState([]);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [pagination, setPagination] = useState({
    count: 0,
    next: null,
    previous: null,
  });

  const [showForm, setShowForm] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  const [formData, setFormData] = useState({
    name: "",
    description: "",
  });

  useEffect(() => {
    fetchCategories();
  }, [search, page]);

  const fetchCategories = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await api.get("/products/categories/", {
        params: {
          search: search.trim(),
          page,
        },
      });

      const data = response.data;

      setCategories(data.results || []);
      setPagination({
        count: data.count || 0,
        next: data.next,
        previous: data.previous,
      });
    } catch (error) {
      console.error("Category loading failed:", error);
      setError("Unable to load categories. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleSearchChange = (value) => {
    setSearch(value);
    setPage(1);
  };

  const openAddForm = () => {
    setEditingCategory(null);
    setFormData({
      name: "",
      description: "",
    });
    setShowForm(true);
  };

  const openEditForm = (category) => {
    setEditingCategory(category);
    setFormData({
      name: category.name,
      description: category.description || "",
    });
    setShowForm(true);
  };

  const closeForm = () => {
    setShowForm(false);
    setEditingCategory(null);
    setFormData({
      name: "",
      description: "",
    });
  };

  const handleChange = (event) => {
    const { name, value } = event.target;

    setFormData((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    try {
      setSaving(true);

      if (editingCategory) {
        await api.patch(
          `/products/categories/${editingCategory.id}/`,
          formData
        );
        alert("Category updated successfully!");
      } else {
        await api.post("/products/categories/", formData);
        alert("Category created successfully!");
      }

      closeForm();
      setPage(1);
      await fetchCategories();
    } catch (error) {
      console.error("Category saving failed:", error);

      const errorData = error.response?.data;

      alert(
        errorData
          ? JSON.stringify(errorData)
          : "Unable to save category."
      );
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (categoryId) => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this category?"
    );

    if (!confirmed) return;

    try {
      setDeletingId(categoryId);

      await api.delete(`/products/categories/${categoryId}/`);

      alert("Category deleted successfully!");

      await fetchCategories();
    } catch (error) {
      console.error("Category deletion failed:", error);

      alert(
        error.response?.data
          ? JSON.stringify(error.response.data)
          : "Unable to delete category."
      );
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8F4ED] px-4 py-6 sm:px-6 lg:px-10">
      <div className="mx-auto max-w-7xl space-y-6">

        {/* Header */}

        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-[#B87552]">
              Admin Management
            </p>

            <h1 className="mt-2 font-serif text-3xl font-bold text-[#30231E]">
              Category Management
            </h1>

            <p className="mt-2 text-sm text-[#8B6248]">
              Create and manage product categories.
            </p>
          </div>

          <button
            type="button"
            onClick={openAddForm}
            className="flex items-center justify-center gap-2 rounded-lg bg-[#5C3A2E] px-5 py-3 text-sm font-medium text-white transition hover:bg-[#8B6248]"
          >
            <Plus size={18} />
            Add Category
          </button>
        </div>

        {/* Search */}

        <div className="rounded-xl border border-[#5C3A2E]/10 bg-white p-4 shadow-sm">
          <div className="relative max-w-md">
            <Search
              size={18}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8B6248]"
            />

            <input
              type="text"
              value={search}
              onChange={(event) =>
                handleSearchChange(event.target.value)
              }
              placeholder="Search categories..."
              className="w-full rounded-lg border border-[#5C3A2E]/20 py-3 pl-10 pr-10 text-sm outline-none focus:border-[#8B6248]"
            />

            {search && (
              <button
                type="button"
                onClick={() => handleSearchChange("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#8B6248] hover:text-[#30231E]"
                aria-label="Clear search"
              >
                <X size={18} />
              </button>
            )}
          </div>
        </div>

        {/* Category Table */}

        <div className="overflow-hidden rounded-xl border border-[#5C3A2E]/10 bg-white shadow-sm">
          <div className="border-b border-[#5C3A2E]/10 px-5 py-4">
            <h2 className="font-serif text-lg font-semibold text-[#30231E]">
              Categories
            </h2>

            <p className="mt-1 text-xs text-[#8B6248]">
              {pagination.count} categories found
            </p>
          </div>

          {loading ? (
            <p className="p-10 text-center text-sm text-[#8B6248]">
              Loading categories...
            </p>
          ) : error ? (
            <div className="p-10 text-center">
              <p className="text-sm text-red-600">{error}</p>

              <button
                type="button"
                onClick={fetchCategories}
                className="mt-3 text-sm font-medium text-[#5C3A2E] underline"
              >
                Try Again
              </button>
            </div>
          ) : categories.length === 0 ? (
            <div className="p-10 text-center">
              <p className="font-medium text-[#30231E]">
                No categories found
              </p>

              <p className="mt-1 text-sm text-[#8B6248]">
                Add a category or try a different search.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[600px] text-left text-sm">
                <thead className="bg-[#F8F4ED] text-xs text-[#8B6248]">
                  <tr>
                    <th className="px-5 py-4 font-semibold">ID</th>
                    <th className="px-5 py-4 font-semibold">Category Name</th>
                    <th className="px-5 py-4 font-semibold">Description</th>
                    <th className="px-5 py-4 text-right font-semibold">Actions</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-[#5C3A2E]/10">
                  {categories.map((category) => (
                    <tr
                      key={category.id}
                      className="transition hover:bg-[#F8F4ED]/50"
                    >
                      <td className="px-5 py-4 font-mono text-xs text-[#8B6248]">
                        {category.id}
                      </td>

                      <td className="px-5 py-4 font-medium text-[#30231E]">
                        {category.name}
                      </td>

                      <td className="max-w-xs px-5 py-4 text-[#8B6248]">
                        <span className="line-clamp-2">
                          {category.description || "—"}
                        </span>
                      </td>

                      <td className="px-5 py-4">
                        <div className="flex justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => openEditForm(category)}
                            className="rounded-lg border border-[#8B6248]/30 p-2 text-[#5C3A2E] transition hover:bg-[#F8F4ED]"
                            aria-label="Edit category"
                          >
                            <Pencil size={16} />
                          </button>

                          <button
                            type="button"
                            onClick={() => handleDelete(category.id)}
                            disabled={deletingId === category.id}
                            className="rounded-lg border border-red-200 p-2 text-red-600 transition hover:bg-red-50 disabled:opacity-50"
                            aria-label="Delete category"
                          >
                            {deletingId === category.id ? (
                              <span className="text-xs">...</span>
                            ) : (
                              <Trash2 size={16} />
                            )}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}

          {!loading && !error && categories.length > 0 && (
            <div className="flex flex-col items-center justify-between gap-3 border-t border-[#5C3A2E]/10 px-5 py-4 sm:flex-row">
              <p className="text-xs text-[#8B6248]">
                Showing {categories.length} of {pagination.count} categories
              </p>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  disabled={!pagination.previous}
                  onClick={() => setPage((previous) => previous - 1)}
                  className="flex items-center gap-1 rounded-lg border border-[#5C3A2E]/20 px-3 py-2 text-sm text-[#5C3A2E] hover:bg-[#F8F4ED] disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <ChevronLeft size={16} />
                  Previous
                </button>

                <span className="text-sm font-medium text-[#30231E]">
                  Page {page}
                </span>

                <button
                  type="button"
                  disabled={!pagination.next}
                  onClick={() => setPage((previous) => previous + 1)}
                  className="flex items-center gap-1 rounded-lg border border-[#5C3A2E]/20 px-3 py-2 text-sm text-[#5C3A2E] hover:bg-[#F8F4ED] disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Next
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Add / Edit Modal */}

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/50 p-4">
          <div className="w-full max-w-lg rounded-xl bg-white p-6 shadow-xl">

            <div className="mb-6 flex items-center justify-between">
              <h2 className="font-serif text-xl font-semibold text-[#30231E]">
                {editingCategory ? "Edit Category" : "Add Category"}
              </h2>

              <button
                type="button"
                onClick={closeForm}
                disabled={saving}
                className="rounded-lg p-2 text-[#8B6248] hover:bg-[#F8F4ED]"
                aria-label="Close form"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="mb-2 block text-sm font-medium text-[#30231E]">
                  Category Name
                </label>

                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  maxLength={100}
                  placeholder="Enter category name"
                  className="w-full rounded-lg border border-[#5C3A2E]/20 p-3 text-sm outline-none focus:border-[#8B6248]"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-[#30231E]">
                  Description
                </label>

                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  rows={4}
                  placeholder="Enter category description"
                  className="w-full rounded-lg border border-[#5C3A2E]/20 p-3 text-sm outline-none focus:border-[#8B6248]"
                />
              </div>

              <div className="flex flex-col-reverse gap-3 pt-2 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={closeForm}
                  disabled={saving}
                  className="rounded-lg border border-[#5C3A2E]/20 px-5 py-3 text-sm font-medium text-[#5C3A2E] hover:bg-[#F8F4ED] disabled:opacity-50"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={saving}
                  className="rounded-lg bg-[#5C3A2E] px-5 py-3 text-sm font-medium text-white hover:bg-[#8B6248] disabled:opacity-50"
                >
                  {saving
                    ? "Saving..."
                    : editingCategory
                      ? "Update Category"
                      : "Create Category"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
