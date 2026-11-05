
import React, { useState, useEffect } from "react";
import api from "../config/axiosInstance";

const AdminUserManagementPage = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [updatingId, setUpdatingId] = useState(null);

  const [searchTerm, setSearchTerm] = useState("");

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [hasNext, setHasNext] = useState(false);
  const [hasPrevious, setHasPrevious] = useState(false);

  const pageSize = 10;
  const totalPages = Math.ceil(totalCount / pageSize);

  const fetchUsers = async (search = "", page = 1) => {
    setLoading(true);
    setError("");

    try {
      const response = await api.get("/auth/admin/users/", {
        params: {
          page: page,
          ...(search.trim() && { search: search.trim() }),
        },
      });

      setUsers(response.data.results || []);
      setTotalCount(response.data.count || 0);
      setHasNext(Boolean(response.data.next));
      setHasPrevious(Boolean(response.data.previous));
      setCurrentPage(page);

    } catch (err) {
      console.error("Fetch users error:", err);

      setError(
        err.response?.data?.detail ||
        "Failed to load users. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  // Search
  const handleSearch = (e) => {
    e.preventDefault();
    fetchUsers(searchTerm, 1);
  };

  // Clear
  const handleClear = () => {
    setSearchTerm("");
    fetchUsers("", 1);
  };

  // Previous page
  const handlePrevious = () => {
    if (hasPrevious && !loading) {
      fetchUsers(searchTerm, currentPage - 1);
    }
  };

  // Next page
  const handleNext = () => {
    if (hasNext && !loading) {
      fetchUsers(searchTerm, currentPage + 1);
    }
  };

  // Block / Unblock
  const handleUserStatus = async (user) => {
    const newStatus = !user.is_active;
    const action = newStatus ? "unblock" : "block";

    const confirmed = window.confirm(
      `Are you sure you want to ${action} ${user.username}?`
    );

    if (!confirmed) return;

    setUpdatingId(user.id);
    setError("");

    try {
      const response = await api.patch(
        `/auth/admin/users/${user.id}/`,
        { is_active: newStatus }
      );

      setUsers((previousUsers) =>
        previousUsers.map((item) =>
          item.id === user.id
            ? {
                ...item,
                is_active: response.data.is_active,
              }
            : item
        )
      );

    } catch (err) {
      console.error("Update user status error:", err);

      setError(
        err.response?.data?.detail ||
        `Failed to ${action} user. Please try again.`
      );
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8F4ED] p-6">

      <h1 className="text-3xl font-serif font-bold text-[#30231E] mb-6">
        User Management
      </h1>

      {/* Search Section */}
      <div className="bg-white rounded-xl shadow p-5 mb-6">

        <form
          onSubmit={handleSearch}
          className="flex flex-col sm:flex-row gap-3"
        >
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by name, username or email..."
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
        <p className="text-red-600 mb-4">{error}</p>
      )}

      {/* User List */}
      <div className="bg-white rounded-xl shadow p-5">

        <h2 className="text-lg font-semibold text-[#30231E] mb-4">
          Registered Users ({totalCount})
        </h2>

        {loading ? (
          <p className="text-[#8B6248]">Loading users...</p>
        ) : users.length === 0 ? (
          <p className="text-gray-500">No users found.</p>
        ) : (
          <>
            <div className="overflow-x-auto">

              <table className="w-full text-sm text-left">

                <thead className="bg-[#F3E8E0] text-[#30231E]">
                  <tr>
                    <th className="p-3">ID</th>
                    <th className="p-3">Username</th>
                    <th className="p-3">Name</th>
                    <th className="p-3">Email</th>
                    <th className="p-3">Role</th>
                    <th className="p-3">Status</th>
                    <th className="p-3">Action</th>
                  </tr>
                </thead>

                <tbody>
                  {users.map((user) => (
                    <tr
                      key={user.id}
                      className="border-b border-gray-100"
                    >
                      <td className="p-3">{user.id}</td>

                      <td className="p-3 font-medium">
                        {user.username}
                      </td>

                      <td className="p-3">
                        {user.first_name} {user.last_name}
                      </td>

                      <td className="p-3">
                        {user.email || "N/A"}
                      </td>

                      <td className="p-3">{user.role}</td>

                      <td className="p-3">
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-medium ${
                            user.is_active
                              ? "bg-green-100 text-green-700"
                              : "bg-red-100 text-red-700"
                          }`}
                        >
                          {user.is_active ? "Active" : "Blocked"}
                        </span>
                      </td>

                      <td className="p-3">
                        <button
                          onClick={() => handleUserStatus(user)}
                          disabled={updatingId === user.id}
                          className={`px-4 py-2 rounded-md text-white text-xs font-medium transition disabled:opacity-50 ${
                            user.is_active
                              ? "bg-red-600 hover:bg-red-700"
                              : "bg-green-600 hover:bg-green-700"
                          }`}
                        >
                          {updatingId === user.id
                            ? "Updating..."
                            : user.is_active
                            ? "Block"
                            : "Unblock"}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>

              </table>
            </div>

            {/* Pagination */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-6">

              <p className="text-sm text-gray-600">
                Showing{" "}
                {(currentPage - 1) * pageSize + 1}
                {" - "}
                {Math.min(currentPage * pageSize, totalCount)}
                {" of "}
                {totalCount} users
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

    </div>
  );
};

export default AdminUserManagementPage;
