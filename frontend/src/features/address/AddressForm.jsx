
import { useState } from "react";

const emptyForm = {
  full_name: "",
  phone: "",
  address_line: "",
  city: "",
  state: "",
  pincode: "",
  is_default: false,
};

export default function AddressForm({
  onSubmit,
  onCancel,
  saving,
  initialData,
}) {
  const [formData, setFormData] = useState(
    initialData || emptyForm
  );

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="mt-6 space-y-4 rounded-xl border border-gray-200 p-5"
    >
      <h2 className="text-lg font-semibold text-[#30231E]">
        {initialData ? "Edit Address" : "Add New Address"}
      </h2>

      <input
        type="text"
        name="full_name"
        value={formData.full_name}
        onChange={handleChange}
        placeholder="Full Name"
        required
        className="w-full rounded-lg border p-3 outline-none focus:border-[#8B6248]"
      />

      <input
        type="tel"
        name="phone"
        value={formData.phone}
        onChange={handleChange}
        placeholder="Phone Number"
        required
        className="w-full rounded-lg border p-3 outline-none focus:border-[#8B6248]"
      />

      <textarea
        name="address_line"
        value={formData.address_line}
        onChange={handleChange}
        placeholder="Address Line"
        rows="3"
        required
        className="w-full rounded-lg border p-3 outline-none focus:border-[#8B6248]"
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <input
          type="text"
          name="city"
          value={formData.city}
          onChange={handleChange}
          placeholder="City"
          required
          className="w-full rounded-lg border p-3 outline-none focus:border-[#8B6248]"
        />

        <input
          type="text"
          name="state"
          value={formData.state}
          onChange={handleChange}
          placeholder="State"
          required
          className="w-full rounded-lg border p-3 outline-none focus:border-[#8B6248]"
        />
      </div>

      <input
        type="text"
        name="pincode"
        value={formData.pincode}
        onChange={handleChange}
        placeholder="Pincode"
        required
        className="w-full rounded-lg border p-3 outline-none focus:border-[#8B6248]"
      />

      <label className="flex items-center gap-2 text-sm text-gray-700">
        <input
          type="checkbox"
          name="is_default"
          checked={formData.is_default}
          onChange={handleChange}
        />
        Set as default address
      </label>

      <div className="flex gap-3">
        <button
          type="button"
          onClick={onCancel}
          disabled={saving}
          className="rounded-lg border px-5 py-2 text-sm"
        >
          Cancel
        </button>

        <button
          type="submit"
          disabled={saving}
          className="rounded-lg bg-[#5C3A2E] px-5 py-2 text-sm text-white hover:bg-[#43291F] disabled:opacity-60"
        >
          {saving
            ? "Saving..."
            : initialData
              ? "Update Address"
              : "Save Address"}
        </button>
      </div>
    </form>
  );
}
