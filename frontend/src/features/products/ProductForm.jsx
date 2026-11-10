
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import api from "../../config/axiosInstance";
import ProductImageCropper from "./ProductImageCropper";

export default function ProductForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditMode = Boolean(id);

  const [categories, setCategories] = useState([]);
  const [existingImages, setExistingImages] = useState([]);

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    category: "",
    price: "",
    discount_price: "",
    stock: "",
    is_published: false,
  });

  const [selectedImages, setSelectedImages] = useState([]);
  const [cropImage, setCropImage] = useState(null);
  const [cropIndex, setCropIndex] = useState(null);

  const [loading, setLoading] = useState(false);
  const [pageLoading, setPageLoading] = useState(isEditMode);
  const [deletingImageId, setDeletingImageId] = useState(null);

  useEffect(() => {
    fetchCategories();

    if (isEditMode) {
      fetchProduct();
    }
  }, [id]);

  const fetchCategories = async () => {
    try {
      const response = await api.get("/products/artisan/categories/");
      setCategories(response.data);
    } catch (error) {
      console.error("Category loading failed:", error);
      alert("Unable to load categories.");
    }
  };

  const fetchProduct = async () => {
    try {
      setPageLoading(true);

      const response = await api.get(
        `/products/artisan/products/${id}/`
      );

      const product = response.data;

      setFormData({
        name: product.name,
        description: product.description,
        category: String(product.category),
        price: product.price,
        discount_price: product.discount_price || "",
        stock: product.stock,
        is_published: product.is_published,
      });

      setExistingImages(product.images || []);
    } catch (error) {
      console.error("Product loading failed:", error);
      alert("Unable to load product details.");
      navigate("/artisan/products");
    } finally {
      setPageLoading(false);
    }
  };

  const handleChange = (event) => {
    const { name, value, type, checked } = event.target;

    setFormData((previous) => ({
      ...previous,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleImageSelect = (event) => {
    const files = Array.from(event.target.files || []);

    if (!files.length) return;

    const validFiles = files.filter((file) =>
      file.type.startsWith("image/")
    );

    if (validFiles.length !== files.length) {
      alert("Please select image files only.");
    }

    const newImages = validFiles.map((file) => ({
      file,
      preview: URL.createObjectURL(file),
      cropped: false,
    }));

    setSelectedImages((previous) => [
      ...previous,
      ...newImages,
    ]);

    event.target.value = "";
  };

  const openCropper = (index) => {
    setCropIndex(index);
    setCropImage(selectedImages[index].preview);
  };

  const handleCropComplete = (croppedFile) => {
    setSelectedImages((previous) =>
      previous.map((item, index) =>
        index === cropIndex
          ? {
              file: croppedFile,
              preview: URL.createObjectURL(croppedFile),
              cropped: true,
            }
          : item
      )
    );

    setCropImage(null);
    setCropIndex(null);
  };

  const handleCropCancel = () => {
    setCropImage(null);
    setCropIndex(null);
  };

  const removeImage = (index) => {
    setSelectedImages((previous) => {
      URL.revokeObjectURL(previous[index].preview);

      return previous.filter((_, i) => i !== index);
    });
  };

  // Delete an existing product image
  const handleDeleteExistingImage = async (imageId) => {
    const confirmed = window.confirm(
      "Are you sure you want to remove this image?"
    );

    if (!confirmed) return;

    try {
      setDeletingImageId(imageId);

      await api.delete(
        `/products/artisan/products/${id}/images/${imageId}/`
      );

      setExistingImages((previous) =>
        previous.filter((image) => image.id !== imageId)
      );
    } catch (error) {
      console.error("Image deletion failed:", error);
      alert("Unable to remove image. Please try again.");
    } finally {
      setDeletingImageId(null);
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!formData.category) {
      alert("Please select a category.");
      return;
    }

    if (!isEditMode && !selectedImages.length) {
      alert("Please select at least one product image.");
      return;
    }

    if (selectedImages.some((item) => !item.cropped)) {
      alert("Please crop all selected images before submitting.");
      return;
    }

    const data = new FormData();

    Object.entries(formData).forEach(([key, value]) => {
      data.append(key, value);
    });

    selectedImages.forEach((item) => {
      data.append("images", item.file);
    });

    try {
      setLoading(true);

      if (isEditMode) {
        await api.patch(
          `/products/artisan/products/${id}/`,
          data
        );

        alert("Product updated successfully!");
      } else {
        await api.post(
          "/products/artisan/products/",
          data
        );

        alert("Product created successfully!");
      }

      selectedImages.forEach((item) =>
        URL.revokeObjectURL(item.preview)
      );

      navigate("/artisan/products");
    } catch (error) {
      console.error("Product saving failed:", error);

      alert(
        error.response?.data
          ? JSON.stringify(error.response.data)
          : "Unable to save product."
      );
    } finally {
      setLoading(false);
    }
  };

  if (pageLoading) {
    return (
      <p className="p-8 text-center">
        Loading product details...
      </p>
    );
  }

  return (
    <div className="max-w-3xl mx-auto bg-white p-6 rounded-xl shadow-md">

      {/* Page Heading and Dashboard Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <h2 className="text-2xl font-semibold text-[#5C3A2E]">
          {isEditMode ? "Edit Product" : "Add New Product"}
        </h2>

        <button
          type="button"
          onClick={() => navigate("/artisan-dashboard")}
          className="border border-[#5C3A2E] text-[#5C3A2E] px-4 py-2 rounded-lg hover:bg-[#F8F4ED] transition"
        >
          ← Back to Dashboard
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label className="block mb-2 font-medium">
            Product Name
          </label>

          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleChange}
            required
            className="w-full border rounded-lg p-3"
            placeholder="Enter product name"
          />
        </div>

        <div>
          <label className="block mb-2 font-medium">
            Description
          </label>

          <textarea
            name="description"
            value={formData.description}
            onChange={handleChange}
            required
            rows="4"
            className="w-full border rounded-lg p-3"
            placeholder="Describe your product"
          />
        </div>

        <div>
          <label className="block mb-2 font-medium">
            Category
          </label>

          <select
            name="category"
            value={formData.category}
            onChange={handleChange}
            required
            className="w-full border rounded-lg p-3"
          >
            <option value="">Select Category</option>

            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block mb-2 font-medium">
              Price
            </label>

            <input
              type="number"
              name="price"
              value={formData.price}
              onChange={handleChange}
              min="0.01"
              step="0.01"
              required
              className="w-full border rounded-lg p-3"
            />
          </div>

          <div>
            <label className="block mb-2 font-medium">
              Discount Price
            </label>

            <input
              type="number"
              name="discount_price"
              value={formData.discount_price}
              onChange={handleChange}
              min="0"
              step="0.01"
              className="w-full border rounded-lg p-3"
            />
          </div>

          <div>
            <label className="block mb-2 font-medium">
              Stock
            </label>

            <input
              type="number"
              name="stock"
              value={formData.stock}
              onChange={handleChange}
              min="0"
              required
              className="w-full border rounded-lg p-3"
            />
          </div>
        </div>

        {existingImages.length > 0 && (
          <div>
            <label className="block mb-2 font-medium">
              Current Images
            </label>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {existingImages.map((item) => (
                <div
                  key={item.id}
                  className="border rounded-lg p-2"
                >
                  <img
                    src={item.image}
                    alt="Current product"
                    className="w-full h-32 rounded-lg object-cover"
                  />

                  <button
                    type="button"
                    onClick={() =>
                      handleDeleteExistingImage(item.id)
                    }
                    disabled={deletingImageId === item.id}
                    className="w-full mt-2 border border-red-500 text-red-600 py-2 rounded-lg hover:bg-red-50 disabled:opacity-50"
                  >
                    {deletingImageId === item.id
                      ? "Removing..."
                      : "Remove Image"}
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        <div>
          <label className="block mb-2 font-medium">
            {isEditMode ? "Add More Images" : "Product Images"}
          </label>

          <input
            type="file"
            accept="image/*"
            multiple
            onChange={handleImageSelect}
            className="w-full border rounded-lg p-3"
          />
        </div>

        {selectedImages.length > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {selectedImages.map((item, index) => (
              <div
                key={index}
                className="border rounded-lg p-2"
              >
                <img
                  src={item.preview}
                  alt={`Product ${index + 1}`}
                  className="w-full h-32 object-cover rounded"
                />

                <p className="text-sm mt-2">
                  {item.cropped ? "Cropped" : "Not cropped"}
                </p>

                <button
                  type="button"
                  onClick={() => openCropper(index)}
                  className="w-full mt-2 bg-[#8B6248] text-white py-2 rounded"
                >
                  {item.cropped ? "Crop Again" : "Crop Image"}
                </button>

                <button
                  type="button"
                  onClick={() => removeImage(index)}
                  className="w-full mt-2 border border-red-500 text-red-600 py-2 rounded"
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
        )}

        <label className="flex items-center gap-3">
          <input
            type="checkbox"
            name="is_published"
            checked={formData.is_published}
            onChange={handleChange}
          />
          Publish Product
        </label>

        <button
          type="submit"
          disabled={loading || Boolean(cropImage)}
          className="w-full bg-[#5C3A2E] text-white py-3 rounded-lg hover:bg-[#8B6248] disabled:opacity-50"
        >
          {loading
            ? "Saving..."
            : isEditMode
              ? "Update Product"
              : "Add Product"}
        </button>
      </form>

      {cropImage && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 overflow-y-auto">
          <div className="w-full max-w-xl">
            <ProductImageCropper
              image={cropImage}
              onCropComplete={handleCropComplete}
              onCancel={handleCropCancel}
            />
          </div>
        </div>
      )}
    </div>
  );
}
