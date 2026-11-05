
import React, { useEffect, useState } from "react";
import api from "../../config/axiosInstance";

const AdminArtisanManagementForm = () => {
  const [artisans, setArtisans] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [updatingId, setUpdatingId] = useState(null);
  const [selectedArtisan, setSelectedArtisan] = useState(null);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [hasNext, setHasNext] = useState(false);
  const [hasPrevious, setHasPrevious] = useState(false);

  const pageSize = 10;
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));

  // Fetch artisans
  const fetchArtisans = async (search = "", page = 1) => {
    setLoading(true);
    setError("");

    try {
      const response = await api.get("/auth/admin/artisans/", {
        params: {
          page,
          ...(search.trim() && { search: search.trim() }),
        },
      });

      setArtisans(response.data.results || []);
      setTotalCount(response.data.count || 0);
      setHasNext(Boolean(response.data.next));
      setHasPrevious(Boolean(response.data.previous));
      setCurrentPage(page);
    } catch (err) {
      console.error("Fetch artisans error:", err);

      setError(
        err.response?.data?.detail ||
        "Failed to load artisans. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchArtisans();
  }, []);

  // Search
  const handleSearch = (e) => {
    e.preventDefault();
    fetchArtisans(searchTerm, 1);
  };

  // Clear search
  const handleClear = () => {
    setSearchTerm("");
    fetchArtisans("", 1);
  };

  // Pagination
  const handlePrevious = () => {
    if (hasPrevious && !loading) {
      fetchArtisans(searchTerm, currentPage - 1);
    }
  };

  const handleNext = () => {
    if (hasNext && !loading) {
      fetchArtisans(searchTerm, currentPage + 1);
    }
  };

  // Approve / Reject
  const handleStatusUpdate = async (artisan, newStatus) => {
    const action = newStatus === "APPROVED" ? "approve" : "reject";

    const confirmed = window.confirm(
      `Are you sure you want to ${action} ${artisan.name || "this artisan"}?`
    );

    if (!confirmed) return;

    setUpdatingId(artisan.id);
    setError("");

    try {
      const response = await api.patch(
        `/auth/admin/artisans/${artisan.id}/status/`,
        {
          verification_status: newStatus,
        }
      );

      const updatedStatus =
        response.data.verification_status || newStatus;

      setArtisans((previousArtisans) =>
        previousArtisans.map((item) =>
          item.id === artisan.id
            ? { ...item, verification_status: updatedStatus }
            : item
        )
      );

      setSelectedArtisan((previous) =>
        previous?.id === artisan.id
          ? { ...previous, verification_status: updatedStatus }
          : previous
      );
    } catch (err) {
      console.error("Update artisan status error:", err);

      setError(
        err.response?.data?.detail ||
        `Failed to ${action} artisan. Please try again.`
      );
    } finally {
      setUpdatingId(null);
    }
  };

  // Status badge
  const getStatusStyle = (status) => {
    switch (status) {
      case "APPROVED":
        return "bg-green-100 text-green-700";
      case "REJECTED":
        return "bg-red-100 text-red-700";
      default:
        return "bg-yellow-100 text-yellow-700";
    }
  };

  const getStatusLabel = (status) => {
    if (status === "APPROVED") return "Approved";
    if (status === "REJECTED") return "Rejected";
    return "Pending";
  };

  return (
    <div className="min-h-screen bg-[#F8F4ED] p-6">

      <h1 className="text-3xl font-serif font-bold text-[#30231E] mb-6">
        Artisan Management
      </h1>

      {/* Search */}
      <div className="bg-white rounded-xl shadow p-5 mb-6">
        <form
          onSubmit={handleSearch}
          className="flex flex-col sm:flex-row gap-3"
        >
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by artisan name, email or craft type..."
            className="flex-1 border border-gray-300 rounded-md px-4 py-3 outline-none focus:ring-2 focus:ring-[#8B6248]"
          />

          <button
            type="submit"
            disabled={loading}
            className="bg-[#5C3A2E] text-white px-6 py-3 rounded-md hover:bg-[#30231E] transition disabled:opacity-50"
          >
            Search
          </button>

          <button
            type="button"
            onClick={handleClear}
            disabled={loading}
            className="border border-[#8B6248] text-[#5C3A2E] px-6 py-3 rounded-md hover:bg-[#F3E8E0] transition disabled:opacity-50"
          >
            Clear
          </button>
        </form>
      </div>

      {error && (
        <p className="text-red-600 bg-red-50 p-3 rounded-md mb-4">
          {error}
        </p>
      )}

      {/* Artisan List */}
      <div className="bg-white rounded-xl shadow p-5">

        <h2 className="text-lg font-semibold text-[#30231E] mb-4">
          Registered Artisans ({totalCount})
        </h2>

        {loading ? (
          <p className="text-[#8B6248]">Loading artisans...</p>
        ) : artisans.length === 0 ? (
          <p className="text-gray-500">No artisans found.</p>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">

                <thead className="bg-[#F3E8E0] text-[#30231E]">
                  <tr>
                    <th className="p-3">ID</th>
                    <th className="p-3">Artisan</th>
                    <th className="p-3">Business</th>
                    <th className="p-3">Email</th>
                    <th className="p-3">Craft Type</th>
                    <th className="p-3">Status</th>
                    <th className="p-3">Actions</th>
                  </tr>
                </thead>

                <tbody>
                  {artisans.map((artisan) => (
                    <tr
                      key={artisan.id}
                      className="border-b border-gray-100"
                    >
                      <td className="p-3">{artisan.id}</td>

                      <td className="p-3 font-medium">
                        {artisan.name || "N/A"}
                      </td>

                      <td className="p-3">
                        {artisan.business_name || "N/A"}
                      </td>

                      <td className="p-3">
                        {artisan.email || "N/A"}
                      </td>

                      <td className="p-3">
                        {artisan.craft_type || "N/A"}
                      </td>

                      <td className="p-3">
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusStyle(
                            artisan.verification_status
                          )}`}
                        >
                          {getStatusLabel(artisan.verification_status)}
                        </span>
                      </td>

                      <td className="p-3">
                        <div className="flex flex-wrap gap-2">

                          <button
                            onClick={() => setSelectedArtisan(artisan)}
                            className="px-3 py-2 rounded-md bg-[#8B6248] text-white text-xs hover:bg-[#5C3A2E]"
                          >
                            View Details
                          </button>

                          {artisan.verification_status !== "APPROVED" && (
                            <button
                              onClick={() =>
                                handleStatusUpdate(artisan, "APPROVED")
                              }
                              disabled={updatingId === artisan.id}
                              className="px-3 py-2 rounded-md bg-green-600 text-white text-xs hover:bg-green-700 disabled:opacity-50"
                            >
                              {updatingId === artisan.id
                                ? "Updating..."
                                : "Approve"}
                            </button>
                          )}

                          {artisan.verification_status !== "REJECTED" && (
                            <button
                              onClick={() =>
                                handleStatusUpdate(artisan, "REJECTED")
                              }
                              disabled={updatingId === artisan.id}
                              className="px-3 py-2 rounded-md bg-red-600 text-white text-xs hover:bg-red-700 disabled:opacity-50"
                            >
                              {updatingId === artisan.id
                                ? "Updating..."
                                : "Reject"}
                            </button>
                          )}

                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>

              </table>
            </div>

            {/* Pagination */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-6">

              <p className="text-sm text-gray-600">
                Showing {(currentPage - 1) * pageSize + 1}
                {" - "}
                {Math.min(currentPage * pageSize, totalCount)}
                {" of "}
                {totalCount} artisans
              </p>

              <div className="flex items-center gap-3">

                <button
                  onClick={handlePrevious}
                  disabled={!hasPrevious || loading}
                  className="px-4 py-2 border border-[#8B6248] rounded-md text-[#5C3A2E] disabled:opacity-40 disabled:cursor-not-allowed hover:bg-[#F3E8E0]"
                >
                  Previous
                </button>

                <span className="text-sm font-medium text-[#30231E]">
                  Page {currentPage} of {totalPages}
                </span>

                <button
                  onClick={handleNext}
                  disabled={!hasNext || loading}
                  className="px-4 py-2 bg-[#5C3A2E] text-white rounded-md disabled:opacity-40 disabled:cursor-not-allowed hover:bg-[#30231E]"
                >
                  Next
                </button>

              </div>
            </div>
          </>
        )}
      </div>

      {/* Artisan Details Modal */}
      {selectedArtisan && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">

          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">

            <div className="flex items-center justify-between p-5 border-b">
              <h2 className="text-xl font-serif font-bold text-[#30231E]">
                Artisan Details
              </h2>

              <button
                onClick={() => setSelectedArtisan(null)}
                className="text-gray-500 hover:text-red-600 text-2xl"
                aria-label="Close"
              >
                &times;
              </button>
            </div>

            <div className="p-6">

              {selectedArtisan.profile_image && (
                <div className="flex justify-center mb-5">
                  <img
                    src={selectedArtisan.profile_image}
                    alt={selectedArtisan.name || "Artisan"}
                    className="w-28 h-28 rounded-full object-cover border-4 border-[#F3E8E0]"
                  />
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">

                <div>
                  <p className="text-sm text-gray-500">Artisan Name</p>
                  <p className="font-medium text-[#30231E]">
                    {selectedArtisan.name || "N/A"}
                  </p>
                </div>

                <div>
                  <p className="text-sm text-gray-500">Business Name</p>
                  <p className="font-medium text-[#30231E]">
                    {selectedArtisan.business_name || "N/A"}
                  </p>
                </div>

                <div>
                  <p className="text-sm text-gray-500">Email</p>
                  <p className="font-medium text-[#30231E]">
                    {selectedArtisan.email || "N/A"}
                  </p>
                </div>

                <div>
                  <p className="text-sm text-gray-500">Phone</p>
                  <p className="font-medium text-[#30231E]">
                    {selectedArtisan.phone || "N/A"}
                  </p>
                </div>

                <div>
                  <p className="text-sm text-gray-500">Craft Type</p>
                  <p className="font-medium text-[#30231E]">
                    {selectedArtisan.craft_type || "N/A"}
                  </p>
                </div>

                <div>
                  <p className="text-sm text-gray-500">Registered Date</p>
                  <p className="font-medium text-[#30231E]">
                    {selectedArtisan.created_at
                      ? new Date(selectedArtisan.created_at).toLocaleDateString()
                      : "N/A"}
                  </p>
                </div>

                <div className="sm:col-span-2">
                  <p className="text-sm text-gray-500">Address</p>
                  <p className="font-medium text-[#30231E]">
                    {selectedArtisan.address || "N/A"}
                  </p>
                </div>

                <div className="sm:col-span-2">
                  <p className="text-sm text-gray-500">Bio</p>
                  <p className="font-medium text-[#30231E] whitespace-pre-wrap">
                    {selectedArtisan.bio || "N/A"}
                  </p>
                </div>

                <div className="sm:col-span-2">
                  <p className="text-sm text-gray-500 mb-1">
                    Verification Status
                  </p>
                  <span
                    className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${getStatusStyle(
                      selectedArtisan.verification_status
                    )}`}
                  >
                    {getStatusLabel(selectedArtisan.verification_status)}
                  </span>
                </div>

              </div>

              <div className="flex justify-end mt-6">
                <button
                  onClick={() => setSelectedArtisan(null)}
                  className="px-5 py-2 rounded-md bg-[#5C3A2E] text-white hover:bg-[#30231E]"
                >
                  Close
                </button>
              </div>

            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default AdminArtisanManagementForm;
