
import { useEffect, useState } from "react";
import api from "../../config/axiosInstance";
import ProductImageCropper from "../products/ProductImageCropper";

const initialForm = {
  artisan: "",
  category: "",
  name: "",
  description: "",
  price: "",
  discount_price: "",
  stock: "",
  allow_online_payment: true,
  allow_cod: true,
  is_published: false,
};

export default function AdminProductManagementForm() {
  const [products, setProducts] = useState([]);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Add / Edit modal
  const [showForm, setShowForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [form, setForm] = useState(initialForm);
  const [artisans, setArtisans] = useState([]);
  const [categories, setCategories] = useState([]);
  const [images, setImages] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");

  // Image crop states
  const [cropQueue, setCropQueue] = useState([]);
  const [cropIndex, setCropIndex] = useState(0);
  const [cropImageUrl, setCropImageUrl] = useState("");
  const [imagePreviewUrls, setImagePreviewUrls] = useState([]);

  // View modal
  const [viewProduct, setViewProduct] = useState(null);

  // Action states
  const [deletingId, setDeletingId] = useState(null);
  const [deletingImageId, setDeletingImageId] = useState(null);

  // Fetch products
  const fetchProducts = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await api.get("/products/admin/products/", {
        params: {
          page,
          search: search.trim() || undefined,
        },
      });

      setProducts(response.data.results || []);
      setTotalPages(Math.max(1, Math.ceil(response.data.count / 12)));
    } catch (err) {
      console.error("Failed to fetch products:", err);
      setError("Unable to load products.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, [page, search]);

  // Cleanup cropped image preview URLs
  useEffect(() => {
    const urls = images.map((image) => URL.createObjectURL(image));
    setImagePreviewUrls(urls);

    return () => {
      urls.forEach((url) => URL.revokeObjectURL(url));
    };
  }, [images]);

  // Cleanup active crop URL
  useEffect(() => {
    return () => {
      if (cropImageUrl) {
        URL.revokeObjectURL(cropImageUrl);
      }
    };
  }, [cropImageUrl]);

  // Load dropdown data
  const loadFormData = async () => {
    const [artisanResponse, categoryResponse] = await Promise.all([
      api.get("/artisans/"),
      api.get("/products/public/categories/"),
    ]);

    setArtisans(artisanResponse.data);
    setCategories(categoryResponse.data);
  };

  // Reset crop state
  const resetCrop = () => {
    setCropQueue([]);
    setCropIndex(0);
    setCropImageUrl("");
  };

  // Open Add Product
  const openAddForm = async () => {
    try {
      setFormError("");
      await loadFormData();

      setEditingProduct(null);
      setForm(initialForm);
      setImages([]);
      resetCrop();
      setShowForm(true);
    } catch (err) {
      console.error("Failed to load form data:", err);
      setError("Unable to load artisans or categories.");
    }
  };

  // Open Edit Product
  const openEditForm = async (product) => {
    try {
      setFormError("");
      await loadFormData();

      setEditingProduct(product);

      setForm({
        artisan: String(product.artisan),
        category: String(product.category),
        name: product.name || "",
        description: product.description || "",
        price: product.price || "",
        discount_price: product.discount_price || "",
        stock: product.stock ?? "",
        allow_online_payment: product.allow_online_payment ?? true,
        allow_cod: product.allow_cod ?? true,
        is_published: product.is_published,
      });

      setImages([]);
      resetCrop();
      setShowForm(true);
    } catch (err) {
      console.error("Failed to load edit form:", err);
      setError("Unable to open product editor.");
    }
  };

  // Form input changes
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  // Select images and start sequential cropping
  const handleImageChange = (e) => {
    const selectedFiles = Array.from(e.target.files || []);

    if (!selectedFiles.length) return;

    setCropQueue(selectedFiles);
    setCropIndex(0);
    setCropImageUrl(URL.createObjectURL(selectedFiles[0]));

    // Allow selecting the same file again
    e.target.value = "";
  };

  // Save cropped image and open next image
  const handleCropComplete = (croppedFile) => {
    setImages((prev) => [...prev, croppedFile]);

    if (cropIndex + 1 < cropQueue.length) {
      const nextIndex = cropIndex + 1;
      setCropIndex(nextIndex);
      setCropImageUrl(URL.createObjectURL(cropQueue[nextIndex]));
    } else {
      resetCrop();
    }
  };

  // Cancel remaining crop queue
  const handleCropCancel = () => {
    resetCrop();
  };

  // Remove a newly cropped image
  const handleRemoveNewImage = (index) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
  };

  // Create or Update Product
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (cropImageUrl) {
      setFormError("Please finish or cancel image cropping before saving.");
      return;
    }

    if (!form.allow_online_payment && !form.allow_cod) {
      setFormError("At least one payment method must be enabled.");
      return;
    }

    try {
      setSubmitting(true);
      setFormError("");

      const formData = new FormData();

      Object.entries(form).forEach(([key, value]) => {
        formData.append(key, value);
      });

      images.forEach((image) => {
        formData.append("images", image, image.name);
      });

      if (editingProduct) {
        await api.patch(
          `/products/admin/products/${editingProduct.id}/`,
          formData
        );
      } else {
        await api.post("/products/admin/products/", formData);
      }

      setShowForm(false);
      setEditingProduct(null);
      setForm(initialForm);
      setImages([]);
      resetCrop();

      if (page !== 1) {
        setPage(1);
      } else {
        await fetchProducts();
      }
    } catch (err) {
      console.error("Failed to save product:", err);

      const data = err.response?.data;
      setFormError(
        data
          ? JSON.stringify(data)
          : "Unable to save product. Please try again."
      );
    } finally {
      setSubmitting(false);
    }
  };

  // Delete Product
  const handleDeleteProduct = async (product) => {
    const confirmed = window.confirm(
      `Are you sure you want to delete "${product.name}"?`
    );

    if (!confirmed) return;

    try {
      setDeletingId(product.id);
      setError("");

      await api.delete(`/products/admin/products/${product.id}/`);

      if (viewProduct?.id === product.id) {
        setViewProduct(null);
      }

      if (products.length === 1 && page > 1) {
        setPage((prev) => prev - 1);
      } else {
        await fetchProducts();
      }
    } catch (err) {
      console.error("Failed to delete product:", err);
      setError("Unable to delete product. Please try again.");
    } finally {
      setDeletingId(null);
    }
  };

  // Delete an existing product image
  const handleDeleteImage = async (productId, image) => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this image?"
    );

    if (!confirmed) return;

    try {
      setDeletingImageId(image.id);

      await api.delete(
        `/products/admin/products/${productId}/images/${image.id}/`
      );

      setEditingProduct((prev) => {
        if (!prev) return prev;

        return {
          ...prev,
          images: prev.images.filter((item) => item.id !== image.id),
        };
      });

      setViewProduct((prev) => {
        if (!prev || prev.id !== productId) return prev;

        return {
          ...prev,
          images: prev.images.filter((item) => item.id !== image.id),
        };
      });

      await fetchProducts();
    } catch (err) {
      console.error("Failed to delete image:", err);
      setFormError("Unable to delete image. Please try again.");
    } finally {
      setDeletingImageId(null);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8F4ED] p-4 sm:p-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-[#30231E]">
            Product Management
          </h1>
          <p className="mt-1 text-gray-500">
            Manage all products in Craftopia.
          </p>
        </div>

        <button
          type="button"
          onClick={openAddForm}
          className="rounded-lg bg-[#5C3A2E] px-5 py-3 text-white transition hover:bg-[#8B6248]"
        >
          + Add Product
        </button>
      </div>

      {/* Search */}
      <div className="mt-6">
        <input
          type="text"
          placeholder="Search products..."
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
          className="w-full max-w-md rounded-lg border border-gray-300 bg-white px-4 py-3 outline-none focus:border-[#8B6248]"
        />
      </div>

      {/* Errors and Loading */}
      {error && (
        <p className="mt-5 rounded-lg bg-red-50 p-3 text-red-600">
          {error}
        </p>
      )}

      {loading && (
        <p className="mt-6 text-gray-500">Loading products...</p>
      )}

      {/* Product Table */}
      {!loading && !error && (
        <>
          <div className="mt-6 overflow-x-auto rounded-xl border border-gray-200 bg-white">
            <table className="w-full min-w-[850px] text-left">
              <thead className="bg-[#5C3A2E] text-white">
                <tr>
                  <th className="p-4">Product</th>
                  <th className="p-4">Price</th>
                  <th className="p-4">Stock</th>
                  <th className="p-4">Status</th>
                  <th className="p-4">Actions</th>
                </tr>
              </thead>

              <tbody>
                {products.map((product) => (
                  <tr key={product.id} className="border-t border-gray-100">
                    <td className="p-4">
                      <button
                        type="button"
                        onClick={() => setViewProduct(product)}
                        className="flex items-center gap-3 text-left"
                      >
                        {product.images?.length > 0 ? (
                          <img
                            src={product.images[0].image}
                            alt={product.name}
                            className="h-16 w-16 rounded-lg border border-gray-200 object-cover"
                          />
                        ) : (
                          <div className="flex h-16 w-16 items-center justify-center rounded-lg bg-[#F8F4ED] text-xs text-gray-400">
                            No Image
                          </div>
                        )}

                        <div>
                          <p className="font-medium text-[#30231E] hover:text-[#8B6248]">
                            {product.name}
                          </p>
                          <p className="text-sm text-gray-500">
                            Product ID: {product.id}
                          </p>
                          <p className="mt-1 text-xs text-[#8B6248]">
                            Click to view details
                          </p>
                        </div>
                      </button>
                    </td>

                    <td className="p-4 text-gray-700">
                      ₹{product.price}
                      {product.discount_price && (
                        <p className="text-xs text-green-700">
                          Offer: ₹{product.discount_price}
                        </p>
                      )}
                    </td>

                    <td className="p-4 text-gray-700">
                      {product.stock}
                    </td>

                    <td className="p-4">
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-medium ${
                          product.is_published
                            ? "bg-green-100 text-green-700"
                            : "bg-gray-100 text-gray-600"
                        }`}
                      >
                        {product.is_published ? "Published" : "Unpublished"}
                      </span>
                    </td>

                    <td className="p-4">
                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={() => setViewProduct(product)}
                          className="rounded-lg border border-[#8B6248] px-3 py-2 text-sm text-[#5C3A2E] hover:bg-[#F8F4ED]"
                        >
                          View
                        </button>

                        <button
                          type="button"
                          onClick={() => openEditForm(product)}
                          className="rounded-lg bg-[#8B6248] px-3 py-2 text-sm text-white hover:bg-[#5C3A2E]"
                        >
                          Edit
                        </button>

                        <button
                          type="button"
                          onClick={() => handleDeleteProduct(product)}
                          disabled={deletingId === product.id}
                          className="rounded-lg bg-red-600 px-3 py-2 text-sm text-white hover:bg-red-700 disabled:opacity-50"
                        >
                          {deletingId === product.id ? "Deleting..." : "Delete"}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}

                {products.length === 0 && (
                  <tr>
                    <td colSpan="5" className="p-8 text-center text-gray-500">
                      No products found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="mt-5 flex items-center justify-between">
            <button
              type="button"
              onClick={() => setPage((prev) => prev - 1)}
              disabled={page === 1}
              className="rounded-lg border border-gray-300 bg-white px-4 py-2 disabled:opacity-40"
            >
              Previous
            </button>

            <span className="text-sm text-gray-600">
              Page {page} of {totalPages}
            </span>

            <button
              type="button"
              onClick={() => setPage((prev) => prev + 1)}
              disabled={page >= totalPages}
              className="rounded-lg border border-gray-300 bg-white px-4 py-2 disabled:opacity-40"
            >
              Next
            </button>
          </div>
        </>
      )}

      {/* VIEW PRODUCT MODAL */}
      {viewProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-xl bg-white p-6 shadow-xl">
            <div className="mb-5 flex items-center justify-between">
              <h2 className="text-xl font-semibold text-[#30231E]">
                Product Details
              </h2>

              <button
                type="button"
                onClick={() => setViewProduct(null)}
                className="text-2xl text-gray-500 hover:text-black"
              >
                ×
              </button>
            </div>

            <h3 className="mb-3 font-medium text-[#30231E]">
              Product Images
            </h3>

            {viewProduct.images?.length > 0 ? (
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                {viewProduct.images.map((image) => (
                  <img
                    key={image.id}
                    src={image.image}
                    alt={viewProduct.name}
                    className="h-40 w-full rounded-lg border border-gray-200 object-cover"
                  />
                ))}
              </div>
            ) : (
              <p className="rounded-lg bg-[#F8F4ED] p-5 text-center text-gray-500">
                No product images available.
              </p>
            )}

            <div className="mt-6 space-y-4">
              <div>
                <p className="text-sm text-gray-500">Product Name</p>
                <p className="font-medium text-[#30231E]">
                  {viewProduct.name}
                </p>
              </div>

              <div>
                <p className="text-sm text-gray-500">Description</p>
                <p className="whitespace-pre-wrap text-gray-700">
                  {viewProduct.description || "No description available."}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
                <div>
                  <p className="text-sm text-gray-500">Price</p>
                  <p className="font-medium">₹{viewProduct.price}</p>
                </div>

                <div>
                  <p className="text-sm text-gray-500">Discount Price</p>
                  <p className="font-medium">
                    {viewProduct.discount_price
                      ? `₹${viewProduct.discount_price}`
                      : "No discount"}
                  </p>
                </div>

                <div>
                  <p className="text-sm text-gray-500">Stock</p>
                  <p className="font-medium">{viewProduct.stock}</p>
                </div>

                <div>
                  <p className="text-sm text-gray-500">Artisan ID</p>
                  <p className="font-medium">{viewProduct.artisan}</p>
                </div>

                <div>
                  <p className="text-sm text-gray-500">Category ID</p>
                  <p className="font-medium">{viewProduct.category}</p>
                </div>

                <div>
                  <p className="text-sm text-gray-500">Status</p>
                  <p className="font-medium">
                    {viewProduct.is_published ? "Published" : "Unpublished"}
                  </p>
                </div>

                <div>
                  <p className="text-sm text-gray-500">Online Payment</p>
                  <p
                    className={`font-medium ${
                      viewProduct.allow_online_payment
                        ? "text-green-700"
                        : "text-red-600"
                    }`}
                  >
                    {viewProduct.allow_online_payment ? "Enabled" : "Disabled"}
                  </p>
                </div>

                <div>
                  <p className="text-sm text-gray-500">Cash on Delivery</p>
                  <p
                    className={`font-medium ${
                      viewProduct.allow_cod
                        ? "text-green-700"
                        : "text-red-600"
                    }`}
                  >
                    {viewProduct.allow_cod ? "Enabled" : "Disabled"}
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => {
                  const product = viewProduct;
                  setViewProduct(null);
                  openEditForm(product);
                }}
                className="rounded-lg bg-[#8B6248] px-5 py-2.5 text-white hover:bg-[#5C3A2E]"
              >
                Edit Product
              </button>

              <button
                type="button"
                onClick={() => setViewProduct(null)}
                className="rounded-lg border border-gray-300 px-5 py-2.5"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ADD / EDIT PRODUCT MODAL */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-xl bg-white p-6 shadow-xl">
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-xl font-semibold text-[#30231E]">
                {editingProduct ? "Edit Product" : "Add New Product"}
              </h2>

              <button
                type="button"
                onClick={() => {
                  setShowForm(false);
                  resetCrop();
                }}
                className="text-2xl text-gray-500 hover:text-black"
              >
                ×
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Artisan */}
              <div>
                <label className="mb-2 block font-medium text-gray-700">
                  Artisan *
                </label>

                <select
                  name="artisan"
                  value={form.artisan}
                  onChange={handleChange}
                  required
                  className="w-full rounded-lg border border-gray-300 p-3"
                >
                  <option value="">Select Artisan</option>
                  {artisans.map((artisan) => (
                    <option key={artisan.id} value={artisan.id}>
                      {artisan.business_name} ({artisan.name})
                    </option>
                  ))}
                </select>
              </div>

              {/* Category */}
              <div>
                <label className="mb-2 block font-medium text-gray-700">
                  Category *
                </label>

                <select
                  name="category"
                  value={form.category}
                  onChange={handleChange}
                  required
                  className="w-full rounded-lg border border-gray-300 p-3"
                >
                  <option value="">Select Category</option>
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Name */}
              <div>
                <label className="mb-2 block font-medium text-gray-700">
                  Product Name *
                </label>

                <input
                  type="text"
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  required
                  className="w-full rounded-lg border border-gray-300 p-3"
                  placeholder="Enter product name"
                />
              </div>

              {/* Description */}
              <div>
                <label className="mb-2 block font-medium text-gray-700">
                  Description *
                </label>

                <textarea
                  name="description"
                  value={form.description}
                  onChange={handleChange}
                  required
                  rows="4"
                  className="w-full rounded-lg border border-gray-300 p-3"
                  placeholder="Enter product description"
                />
              </div>

              {/* Price */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-2 block font-medium text-gray-700">
                    Price *
                  </label>

                  <input
                    type="number"
                    name="price"
                    value={form.price}
                    onChange={handleChange}
                    min="0.01"
                    step="0.01"
                    required
                    className="w-full rounded-lg border border-gray-300 p-3"
                    placeholder="Regular price"
                  />
                </div>

                <div>
                  <label className="mb-2 block font-medium text-gray-700">
                    Discount Price
                  </label>

                  <input
                    type="number"
                    name="discount_price"
                    value={form.discount_price}
                    onChange={handleChange}
                    min="0.01"
                    step="0.01"
                    className="w-full rounded-lg border border-gray-300 p-3"
                    placeholder="Optional"
                  />
                </div>
              </div>

              {/* Stock */}
              <div>
                <label className="mb-2 block font-medium text-gray-700">
                  Stock *
                </label>

                <input
                  type="number"
                  name="stock"
                  value={form.stock}
                  onChange={handleChange}
                  min="0"
                  required
                  className="w-full rounded-lg border border-gray-300 p-3"
                  placeholder="Available stock"
                />
              </div>

              {/* Existing Images */}
              {editingProduct && (
                <div>
                  <label className="mb-3 block font-medium text-gray-700">
                    Existing Images
                  </label>

                  {editingProduct.images?.length > 0 ? (
                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                      {editingProduct.images.map((image) => (
                        <div key={image.id} className="relative">
                          <img
                            src={image.image}
                            alt={editingProduct.name}
                            className="h-32 w-full rounded-lg border object-cover"
                          />

                          <button
                            type="button"
                            onClick={() =>
                              handleDeleteImage(editingProduct.id, image)
                            }
                            disabled={deletingImageId === image.id}
                            className="absolute right-2 top-2 rounded-md bg-red-600 px-2 py-1 text-xs text-white disabled:opacity-50"
                          >
                            {deletingImageId === image.id
                              ? "Deleting..."
                              : "Remove"}
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500">
                      No existing images.
                    </p>
                  )}
                </div>
              )}

              {/* New Images with Crop */}
              <div>
                <label className="mb-2 block font-medium text-gray-700">
                  {editingProduct ? "Add More Images" : "Product Images"}
                </label>

                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleImageChange}
                  className="w-full rounded-lg border border-gray-300 p-3"
                />

                <p className="mt-2 text-xs text-gray-500">
                  Selected images will open one by one for cropping.
                </p>

                {images.length > 0 && (
                  <div className="mt-3">
                    <p className="mb-3 text-sm font-medium text-green-700">
                      {images.length} image(s) cropped and ready to upload.
                    </p>

                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                      {images.map((image, index) => (
                        <div
                          key={`${image.name}-${index}`}
                          className="relative"
                        >
                          <img
                            src={imagePreviewUrls[index]}
                            alt={`Cropped product ${index + 1}`}
                            className="h-28 w-full rounded-lg border object-cover"
                          />

                          <button
                            type="button"
                            onClick={() => handleRemoveNewImage(index)}
                            className="absolute right-1 top-1 rounded bg-red-600 px-2 py-1 text-xs text-white"
                          >
                            Remove
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Payment Options */}
              <div className="rounded-lg border border-gray-200 bg-[#F8F4ED] p-4">
                <h3 className="font-semibold text-[#30231E]">
                  Payment Options
                </h3>

                <p className="mt-1 text-sm text-gray-500">
                  Choose which payment methods customers can use for this
                  product.
                </p>

                <div className="mt-4 space-y-4">
                  {/* Online Payment */}
                  <label className="flex items-start gap-3">
                    <input
                      type="checkbox"
                      name="allow_online_payment"
                      checked={form.allow_online_payment}
                      onChange={handleChange}
                      className="mt-1 h-4 w-4 accent-[#5C3A2E]"
                    />

                    <span>
                      <span className="block font-medium text-[#30231E]">
                        Allow Online Payment
                      </span>

                      <span className="text-sm text-gray-500">
                        Customers can pay online using Razorpay.
                      </span>
                    </span>
                  </label>

                  {/* Cash on Delivery */}
                  <label className="flex items-start gap-3">
                    <input
                      type="checkbox"
                      name="allow_cod"
                      checked={form.allow_cod}
                      onChange={handleChange}
                      className="mt-1 h-4 w-4 accent-[#5C3A2E]"
                    />

                    <span>
                      <span className="block font-medium text-[#30231E]">
                        Allow Cash on Delivery
                      </span>

                      <span className="text-sm text-gray-500">
                        Customers can pay when the product is delivered.
                      </span>
                    </span>
                  </label>
                </div>

                {!form.allow_online_payment && !form.allow_cod && (
                  <p className="mt-3 rounded-lg bg-red-50 p-3 text-sm text-red-600">
                    At least one payment method must be enabled.
                  </p>
                )}
              </div>

              {/* Publish */}
              <label className="flex items-center gap-3">
                <input
                  type="checkbox"
                  name="is_published"
                  checked={form.is_published}
                  onChange={handleChange}
                  className="h-4 w-4 accent-[#5C3A2E]"
                />

                <span className="text-gray-700">
                  Publish this product
                </span>
              </label>

              {formError && (
                <p className="break-words rounded-lg bg-red-50 p-3 text-sm text-red-600">
                  {formError}
                </p>
              )}

              {/* Form Buttons */}
              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowForm(false);
                    resetCrop();
                  }}
                  className="rounded-lg border border-gray-300 px-5 py-2.5"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={submitting || Boolean(cropImageUrl)}
                  className="rounded-lg bg-[#5C3A2E] px-5 py-2.5 text-white hover:bg-[#8B6248] disabled:opacity-50"
                >
                  {submitting
                    ? "Saving..."
                    : editingProduct
                    ? "Update Product"
                    : "Create Product"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* IMAGE CROP MODAL */}
      {cropImageUrl && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/70 p-4">
          <div className="w-full max-w-xl">
            <p className="mb-3 text-center text-sm font-medium text-white">
              Cropping image {cropIndex + 1} of {cropQueue.length}
            </p>

            <ProductImageCropper
              image={cropImageUrl}
              onCropComplete={handleCropComplete}
              onCancel={handleCropCancel}
            />
          </div>
        </div>
      )}
    </div>
  );
}
