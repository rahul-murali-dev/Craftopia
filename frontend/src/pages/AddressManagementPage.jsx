
import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { ArrowLeft, Plus } from "lucide-react";
import api from "../config/axiosInstance";

import AddressForm from "../features/address/AddressForm";
import AddressList from "../features/address/AddressList";

export default function AddressManagementPage() {
  const navigate = useNavigate();

  const [showForm, setShowForm] = useState(false);
  const [selectedAddress, setSelectedAddress] = useState(null);
  const [addresses, setAddresses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchAddresses();
  }, []);

  // Fetch all addresses
  const fetchAddresses = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await api.get("/auth/addresses/");
      setAddresses(response.data);
    } catch (err) {
      console.error("Address fetch error:", err);
      setError("Unable to load addresses. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Open Add Form
  const handleAddClick = () => {
    setSelectedAddress(null);
    setShowForm(true);
  };

  // Open Edit Form
  const handleEdit = (address) => {
    setSelectedAddress(address);
    setShowForm(true);
  };

  // Add or Update Address
  const handleSaveAddress = async (formData) => {
    try {
      setSaving(true);

      if (selectedAddress) {
        await api.patch(
          `/auth/addresses/${selectedAddress.id}/`,
          formData
        );
        alert("Address updated successfully.");
      } else {
        await api.post("/auth/addresses/", formData);
        alert("Address added successfully.");
      }

      setShowForm(false);
      setSelectedAddress(null);
      await fetchAddresses();
    } catch (err) {
      console.error("Address save error:", err);

      alert(
        JSON.stringify(
          err.response?.data || "Unable to save address."
        )
      );
    } finally {
      setSaving(false);
    }
  };

  // Delete Address
  const handleDelete = async (id) => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this address?"
    );

    if (!confirmed) return;

    try {
      await api.delete(`/auth/addresses/${id}/`);

      alert("Address deleted successfully.");
      await fetchAddresses();
    } catch (err) {
      console.error("Address delete error:", err);
      alert("Unable to delete address. Please try again.");
    }
  };

  // Set Default Address
  const handleSetDefault = async (address) => {
    try {
      await api.patch(
        `/auth/addresses/${address.id}/`,
        { is_default: true }
      );

      alert("Default address updated successfully.");
      await fetchAddresses();
    } catch (err) {
      console.error("Set default error:", err);
      alert("Unable to update default address.");
    }
  };

  return (
    <div className="min-h-screen bg-[#F8F4ED] px-4 py-8">
      <div className="mx-auto max-w-3xl">

        <button
          onClick={() => navigate("/user-profile")}
          className="mb-6 flex items-center gap-2 text-sm font-medium text-[#5C3A2E] hover:underline"
        >
          <ArrowLeft size={18} />
          Back to Profile
        </button>

        <div className="rounded-2xl bg-white p-6 shadow-sm sm:p-8">

          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
            <div>
              <h1 className="font-serif text-2xl font-bold text-[#30231E]">
                Manage Addresses
              </h1>

              <p className="mt-2 text-sm text-gray-500">
                Manage your saved delivery addresses.
              </p>
            </div>

            <button
              onClick={handleAddClick}
              disabled={showForm}
              className="flex items-center justify-center gap-2 rounded-lg bg-[#5C3A2E] px-5 py-3 text-sm font-medium text-white transition hover:bg-[#43291F] disabled:opacity-60"
            >
              <Plus size={18} />
              Add New Address
            </button>
          </div>

          {showForm && (
            <AddressForm
              key={selectedAddress?.id || "new-address"}
              initialData={selectedAddress}
              onSubmit={handleSaveAddress}
              onCancel={() => {
                setShowForm(false);
                setSelectedAddress(null);
              }}
              saving={saving}
            />
          )}

          <div className="my-6 border-t border-gray-100" />

          {loading ? (
            <p className="py-12 text-center text-gray-500">
              Loading addresses...
            </p>
          ) : error ? (
            <div className="py-12 text-center">
              <p className="text-red-600">{error}</p>

              <button
                onClick={fetchAddresses}
                className="mt-4 text-sm font-semibold text-[#5C3A2E] underline"
              >
                Try Again
              </button>
            </div>
          ) : (
            <AddressList
              addresses={addresses}
              onEdit={handleEdit}
              onDelete={handleDelete}
              onSetDefault={handleSetDefault}
            />
          )}

        </div>
      </div>
    </div>
  );
}
