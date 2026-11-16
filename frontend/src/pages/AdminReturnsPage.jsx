
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  RefreshCw,
  Search,
  ArrowLeft,
  RotateCcw,
  CheckCircle,
  XCircle,
  Clock,
  PackageCheck,
} from "lucide-react";
import api from "../config/axiosInstance";

const STATUS_STYLES = {
  PENDING: "bg-yellow-100 text-yellow-800",
  APPROVED: "bg-blue-100 text-blue-800",
  REJECTED: "bg-red-100 text-red-800",
  COMPLETED: "bg-green-100 text-green-800",
};

const STATUS_LABELS = {
  PENDING: "Pending",
  APPROVED: "Approved",
  REJECTED: "Rejected",
  COMPLETED: "Completed",
};

const formatDate = (value) => {
  if (!value) return "—";

  return new Date(value).toLocaleString("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  });
};

const AdminReturnsPage = () => {
  const navigate = useNavigate();

  const [returns, setReturns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [notes, setNotes] = useState({});
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const fetchReturns = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await api.get("/orders/admin/returns/");
      const data = Array.isArray(response.data)
        ? response.data
        : response.data.results || [];

      setReturns(data);
    } catch (err) {
      console.error("Error fetching return requests:", err);
      setError(
        err.response?.data?.error ||
          err.response?.data?.detail ||
          "Unable to load return requests."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReturns();
  }, []);

  const updateNote = (id, value) => {
    setNotes((previous) => ({
      ...previous,
      [id]: value,
    }));
  };

  const handleReview = async (returnId, status) => {
    const action = status === "APPROVED" ? "approve" : "reject";

    if (!window.confirm(`Are you sure you want to ${action} this return request?`)) {
      return;
    }

    try {
      setUpdatingId(returnId);
      setError("");
      setSuccess("");

      const response = await api.patch(
        `/orders/admin/returns/${returnId}/`,
        {
          status,
          admin_note: notes[returnId] || "",
        }
      );

      setSuccess(response.data.message || `Return request ${action}d successfully.`);
      await fetchReturns();
    } catch (err) {
      console.error("Error reviewing return:", err);
      setError(
        err.response?.data?.error ||
          err.response?.data?.detail ||
          "Unable to update this return request."
      );
    } finally {
      setUpdatingId(null);
    }
  };

  const handleComplete = async (returnId) => {
    if (
      !window.confirm(
        "Confirm that you received the returned product and want to complete this return? Stock will be restored."
      )
    ) {
      return;
    }

    try {
      setUpdatingId(returnId);
      setError("");
      setSuccess("");

      const response = await api.patch(
        `/orders/admin/returns/${returnId}/`,
        {
          status: "COMPLETED",
          admin_note:
            notes[returnId] || "Product received and stock restored.",
        }
      );

      setSuccess(
        response.data.message || "Return completed and stock restored successfully."
      );

      await fetchReturns();
    } catch (err) {
      console.error("Error completing return:", err);
      setError(
        err.response?.data?.error ||
          err.response?.data?.detail ||
          "Unable to complete this return request."
      );
    } finally {
      setUpdatingId(null);
    }
  };

  const filteredReturns = returns.filter((item) => {
    const searchText = search.toLowerCase();

    const matchesSearch =
      String(item.order_number || "").toLowerCase().includes(searchText) ||
      String(item.customer?.username || "").toLowerCase().includes(searchText) ||
      String(item.customer?.email || "").toLowerCase().includes(searchText) ||
      String(item.reason || "").toLowerCase().includes(searchText);

    const matchesStatus =
      statusFilter === "ALL" || item.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const counts = {
    total: returns.length,
    pending: returns.filter((item) => item.status === "PENDING").length,
    approved: returns.filter((item) => item.status === "APPROVED").length,
    completed: returns.filter((item) => item.status === "COMPLETED").length,
  };

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
              Return Management
            </h1>
            <p className="mt-1 text-sm text-gray-500">
              Review customer return requests and manage returned products.
            </p>
          </div>

          <button
            onClick={fetchReturns}
            disabled={loading}
            className="flex items-center justify-center gap-2 rounded-lg border border-[#8B6248] px-4 py-2.5 text-sm font-semibold text-[#5C3A2E] hover:bg-[#8B6248] hover:text-white disabled:opacity-50"
          >
            <RefreshCw size={16} />
            Refresh
          </button>
        </div>

        {/* Summary */}
        <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
          {[
            { label: "Total Requests", value: counts.total, icon: RotateCcw },
            { label: "Pending", value: counts.pending, icon: Clock },
            { label: "Approved", value: counts.approved, icon: CheckCircle },
            { label: "Completed", value: counts.completed, icon: PackageCheck },
          ].map((item) => {
            const Icon = item.icon;

            return (
              <div key={item.label} className="rounded-xl bg-white p-5 shadow-sm">
                <div className="flex items-center justify-between">
                  <p className="text-sm text-gray-500">{item.label}</p>
                  <Icon size={20} className="text-[#8B6248]" />
                </div>
                <p className="mt-2 text-2xl font-bold text-[#30231E]">
                  {item.value}
                </p>
              </div>
            );
          })}
        </div>

        {/* Messages */}
        {error && (
          <div className="mb-5 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {success && (
          <div className="mb-5 rounded-lg border border-green-200 bg-green-50 p-3 text-sm text-green-700">
            {success}
          </div>
        )}

        {/* Search and filter */}
        <div className="mb-6 flex flex-col gap-3 rounded-xl bg-white p-4 shadow-sm sm:flex-row">
          <div className="relative flex-1">
            <Search
              size={18}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search order number, customer or reason..."
              className="w-full rounded-lg border border-gray-200 py-2.5 pl-10 pr-4 text-sm outline-none focus:border-[#8B6248]"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-lg border border-gray-200 px-4 py-2.5 text-sm outline-none focus:border-[#8B6248]"
          >
            <option value="ALL">All Statuses</option>
            <option value="PENDING">Pending</option>
            <option value="APPROVED">Approved</option>
            <option value="REJECTED">Rejected</option>
            <option value="COMPLETED">Completed</option>
          </select>
        </div>

        {/* Return requests */}
        {loading ? (
          <div className="rounded-xl bg-white p-10 text-center text-[#5C3A2E]">
            Loading return requests...
          </div>
        ) : filteredReturns.length === 0 ? (
          <div className="rounded-xl bg-white p-10 text-center shadow-sm">
            <RotateCcw size={36} className="mx-auto mb-3 text-[#B87552]" />
            <h2 className="font-semibold text-[#30231E]">
              No return requests found
            </h2>
            <p className="mt-1 text-sm text-gray-500">
              Try changing your search or status filter.
            </p>
          </div>
        ) : (
          <div className="space-y-5">
            {filteredReturns.map((item) => (
              <div
                key={item.id}
                className="rounded-xl bg-white p-5 shadow-sm"
              >
                <div className="flex flex-col gap-4 border-b border-gray-100 pb-4 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <p className="text-xs text-gray-500">Return Request #{item.id}</p>
                    <h2 className="mt-1 break-all font-bold text-[#5C3A2E]">
                      Order: {item.order_number}
                    </h2>
                    <p className="mt-1 text-xs text-gray-500">
                      Submitted: {formatDate(item.created_at)}
                    </p>
                  </div>

                  <span
                    className={`w-fit rounded-full px-3 py-1.5 text-xs font-semibold ${
                      STATUS_STYLES[item.status] || "bg-gray-100 text-gray-700"
                    }`}
                  >
                    {STATUS_LABELS[item.status] || item.status}
                  </span>
                </div>

                <div className="grid grid-cols-1 gap-4 py-4 sm:grid-cols-2">
                  <div>
                    <p className="text-xs text-gray-500">Customer</p>
                    <p className="mt-1 font-semibold text-[#30231E]">
                      {item.customer?.username || "—"}
                    </p>
                    <p className="text-sm text-gray-500">
                      {item.customer?.email || "—"}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs text-gray-500">Order ID</p>
                    <button
                      onClick={() => navigate(`/admin/orders/${item.order_id}`)}
                      className="mt-1 font-semibold text-[#8B6248] hover:underline"
                    >
                      View Order #{item.order_id}
                    </button>
                  </div>
                </div>

                <div className="rounded-lg bg-[#F8F4ED] p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Customer's Return Reason
                  </p>
                  <p className="mt-2 whitespace-pre-wrap text-sm text-[#30231E]">
                    {item.reason || "No reason provided."}
                  </p>
                </div>

                {item.reviewed_by && (
                  <div className="mt-3 text-xs text-gray-500">
                    Reviewed by: {item.reviewed_by}
                    {item.reviewed_at && ` · ${formatDate(item.reviewed_at)}`}
                  </div>
                )}

                {item.admin_note && (
                  <div className="mt-3 rounded-lg border border-gray-100 p-3">
                    <p className="text-xs font-semibold text-gray-500">
                      Admin Note
                    </p>
                    <p className="mt-1 whitespace-pre-wrap text-sm text-gray-700">
                      {item.admin_note}
                    </p>
                  </div>
                )}

                {/* Actions */}
                {(item.status === "PENDING" || item.status === "APPROVED") && (
                  <div className="mt-5 border-t border-gray-100 pt-4">
                    <label className="mb-2 block text-sm font-semibold text-[#30231E]">
                      Admin Note
                    </label>

                    <textarea
                      rows={2}
                      value={notes[item.id] ?? item.admin_note ?? ""}
                      onChange={(e) => updateNote(item.id, e.target.value)}
                      placeholder="Add a note about this return request..."
                      className="w-full rounded-lg border border-gray-200 p-3 text-sm outline-none focus:border-[#8B6248]"
                    />

                    <div className="mt-3 flex flex-wrap gap-3">
                      {item.status === "PENDING" && (
                        <>
                          <button
                            onClick={() => handleReview(item.id, "APPROVED")}
                            disabled={updatingId === item.id}
                            className="flex items-center gap-2 rounded-lg bg-green-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-green-800 disabled:opacity-50"
                          >
                            <CheckCircle size={16} />
                            {updatingId === item.id ? "Updating..." : "Approve"}
                          </button>

                          <button
                            onClick={() => handleReview(item.id, "REJECTED")}
                            disabled={updatingId === item.id}
                            className="flex items-center gap-2 rounded-lg bg-red-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-red-800 disabled:opacity-50"
                          >
                            <XCircle size={16} />
                            Reject
                          </button>
                        </>
                      )}

                      {item.status === "APPROVED" && (
                        <button
                          onClick={() => handleComplete(item.id)}
                          disabled={updatingId === item.id}
                          className="flex items-center gap-2 rounded-lg bg-[#5C3A2E] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#8B6248] disabled:opacity-50"
                        >
                          <PackageCheck size={16} />
                          {updatingId === item.id
                            ? "Completing..."
                            : "Complete Return & Restore Stock"}
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminReturnsPage;
