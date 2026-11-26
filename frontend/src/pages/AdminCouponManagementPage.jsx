
import React, { useEffect, useState } from "react";
import {
    TicketPercent,
    Plus,
    Search,
    RefreshCw,
    Edit,
    Trash2,
    Power,
    X,
    Eye,
    CalendarDays,
    CheckCircle,
    AlertCircle,
} from "lucide-react";

import api from "../config/axiosInstance";

const INITIAL_FORM = {
    code: "",
    discount_type: "PERCENTAGE",
    discount_value: "",
    min_order_amount: "0",
    max_discount_amount: "",
    start_date: "",
    expiry_date: "",
    max_total_usage: "",
    max_usage_per_customer: "1",
    is_active: true,
};

const formatPrice = (value) =>
    new Intl.NumberFormat("en-IN", {
        style: "currency",
        currency: "INR",
        maximumFractionDigits: 2,
    }).format(Number(value || 0));

const formatDate = (value) => {
    if (!value) return "-";

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "-";

    return new Intl.DateTimeFormat("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
    }).format(date);
};

const toDateTimeLocal = (value) => {
    if (!value) return "";

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "";

    const pad = (number) => String(number).padStart(2, "0");

    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(
        date.getDate()
    )}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
};

const toISOString = (value) => {
    if (!value) return null;

    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? null : date.toISOString();
};

const getInitialForm = () => {
    const now = new Date();
    const expiry = new Date();
    expiry.setDate(expiry.getDate() + 30);

    return {
        ...INITIAL_FORM,
        start_date: toDateTimeLocal(now),
        expiry_date: toDateTimeLocal(expiry),
    };
};

const getCouponFormData = (coupon) => ({
    code: coupon.code || "",
    discount_type: coupon.discount_type || "PERCENTAGE",
    discount_value: coupon.discount_value ?? "",
    min_order_amount: coupon.min_order_amount ?? "0",
    max_discount_amount: coupon.max_discount_amount ?? "",
    start_date: toDateTimeLocal(coupon.start_date),
    expiry_date: toDateTimeLocal(coupon.expiry_date),
    max_total_usage: coupon.max_total_usage ?? "",
    max_usage_per_customer: coupon.max_usage_per_customer ?? "1",
    is_active: coupon.is_active,
});

const getErrorMessage = (error, fallback) => {
    const data = error.response?.data;

    if (!data) return fallback;

    if (typeof data.error === "string") return data.error;
    if (typeof data.detail === "string") return data.detail;

    if (typeof data === "object") {
        const messages = Object.entries(data)
            .map(([field, value]) => {
                const message = Array.isArray(value)
                    ? value.join(" ")
                    : typeof value === "string"
                        ? value
                        : "";

                return message ? `${field}: ${message}` : "";
            })
            .filter(Boolean);

        if (messages.length) return messages.join(" ");
    }

    return fallback;
};

function AdminCouponManagementPage() {
    const [coupons, setCoupons] = useState([]);

    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState("");

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const [formOpen, setFormOpen] = useState(false);
    const [editingCoupon, setEditingCoupon] = useState(null);
    const [formData, setFormData] = useState(getInitialForm);
    const [saving, setSaving] = useState(false);
    const [formError, setFormError] = useState("");

    const [detailsCoupon, setDetailsCoupon] = useState(null);
    const [detailsLoading, setDetailsLoading] = useState(false);

    const [actionLoadingId, setActionLoadingId] = useState(null);
    const [message, setMessage] = useState("");
    const [actionError, setActionError] = useState("");

    const fetchCoupons = async (
        searchValue = search,
        statusValue = statusFilter
    ) => {
        try {
            setLoading(true);
            setError("");

            const params = {};

            if (searchValue.trim()) {
                params.search = searchValue.trim();
            }

            if (statusValue) {
                params.status = statusValue;
            }

            const response = await api.get("/orders/admin/coupons/", {
                params,
            });

            const data = response.data;

            setCoupons(Array.isArray(data) ? data : data.results || []);
        } catch (err) {
            console.error("Admin coupon loading error:", err);

            setError(
                getErrorMessage(err, "Unable to load coupons. Please try again.")
            );
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchCoupons();
    }, [statusFilter]);

    const handleSearch = (event) => {
        event.preventDefault();
        fetchCoupons(search, statusFilter);
    };

    const handleClearFilters = () => {
        setSearch("");
        setStatusFilter("");
        fetchCoupons("", "");
    };

    const openCreateForm = () => {
        setEditingCoupon(null);
        setFormData(getInitialForm());
        setFormError("");
        setFormOpen(true);
    };

    const openEditForm = (coupon) => {
        setEditingCoupon(coupon);
        setFormData(getCouponFormData(coupon));
        setFormError("");
        setFormOpen(true);
    };

    const closeForm = () => {
        if (saving) return;

        setFormOpen(false);
        setEditingCoupon(null);
        setFormError("");
    };

    const handleInputChange = (event) => {
        const { name, value, type, checked } = event.target;

        setFormData((previous) => ({
            ...previous,
            [name]: type === "checkbox" ? checked : value,
        }));
    };

    const handleSaveCoupon = async (event) => {
        event.preventDefault();

        setFormError("");

        if (!formData.code.trim()) {
            setFormError("Please enter a coupon code.");
            return;
        }

        if (Number(formData.discount_value) <= 0) {
            setFormError("Discount value must be greater than zero.");
            return;
        }

        if (
            formData.discount_type === "PERCENTAGE" &&
            Number(formData.discount_value) > 100
        ) {
            setFormError("Percentage discount cannot exceed 100%.");
            return;
        }

        if (!formData.start_date || !formData.expiry_date) {
            setFormError("Please select both validity dates.");
            return;
        }

        if (
            new Date(formData.expiry_date) <= new Date(formData.start_date)
        ) {
            setFormError("Expiry date must be after the start date.");
            return;
        }

        const payload = {
            code: formData.code.trim().toUpperCase(),
            discount_type: formData.discount_type,
            discount_value: String(formData.discount_value),
            min_order_amount: String(formData.min_order_amount || 0),
            max_discount_amount: formData.max_discount_amount
                ? String(formData.max_discount_amount)
                : null,
            start_date: toISOString(formData.start_date),
            expiry_date: toISOString(formData.expiry_date),
            max_total_usage: formData.max_total_usage
                ? Number(formData.max_total_usage)
                : null,
            max_usage_per_customer: Number(
                formData.max_usage_per_customer || 1
            ),
            is_active: formData.is_active,
        };

        try {
            setSaving(true);

            if (editingCoupon) {
                await api.patch(
                    `/orders/admin/coupons/${editingCoupon.id}/`,
                    payload
                );
                setMessage("Coupon updated successfully.");
            } else {
                await api.post("/orders/admin/coupons/", payload);
                setMessage("Coupon created successfully.");
            }

            setFormOpen(false);
            setEditingCoupon(null);

            await fetchCoupons();
        } catch (err) {
            console.error("Coupon save error:", err);

            setFormError(
                getErrorMessage(err, "Unable to save coupon. Please try again.")
            );
        } finally {
            setSaving(false);
        }
    };

    const handleToggleStatus = async (coupon) => {
        const action = coupon.is_active ? "deactivate" : "activate";

        if (!window.confirm(`Are you sure you want to ${action} this coupon?`)) {
            return;
        }

        try {
            setActionLoadingId(coupon.id);
            setMessage("");
            setActionError("");

            const response = await api.patch(
                `/orders/admin/coupons/${coupon.id}/status/`
            );

            setMessage(
                response.data?.message || "Coupon status updated successfully."
            );

            await fetchCoupons();
        } catch (err) {
            console.error("Coupon status update error:", err);

            setActionError(
                getErrorMessage(err, "Unable to update coupon status.")
            );
        } finally {
            setActionLoadingId(null);
        }
    };

    const handleDeleteCoupon = async (coupon) => {
        if (
            !window.confirm(
                `Delete coupon "${coupon.code}"? This coupon will no longer be available to customers.`
            )
        ) {
            return;
        }

        try {
            setActionLoadingId(coupon.id);
            setMessage("");
            setActionError("");

            const response = await api.delete(
                `/orders/admin/coupons/${coupon.id}/`
            );

            setMessage(
                response.data?.message || "Coupon deleted successfully."
            );

            await fetchCoupons();
        } catch (err) {
            console.error("Coupon delete error:", err);

            setActionError(
                getErrorMessage(err, "Unable to delete coupon.")
            );
        } finally {
            setActionLoadingId(null);
        }
    };

    const handleViewDetails = async (coupon) => {
        try {
            setDetailsLoading(true);
            setDetailsCoupon(null);
            setActionError("");

            const response = await api.get(
                `/orders/admin/coupons/${coupon.id}/`
            );

            setDetailsCoupon(response.data);
        } catch (err) {
            console.error("Coupon details error:", err);

            setActionError(
                getErrorMessage(err, "Unable to load coupon details.")
            );
        } finally {
            setDetailsLoading(false);
        }
    };

    const closeDetails = () => {
        setDetailsCoupon(null);
        setDetailsLoading(false);
    };

    const activeCount = coupons.filter(
        (coupon) => coupon.is_active
    ).length;

    const inactiveCount = coupons.filter(
        (coupon) => !coupon.is_active
    ).length;

    const totalUsage = coupons.reduce(
        (total, coupon) =>
            total + Number(coupon.actual_used_count || 0),
        0
    );

    const isExpired = (coupon) =>
        coupon.expiry_date &&
        new Date(coupon.expiry_date).getTime() < Date.now();

    const getCouponStatus = (coupon) => {
        if (isExpired(coupon)) return "Expired";
        return coupon.is_active ? "Active" : "Inactive";
    };

    const getStatusStyle = (coupon) => {
        if (isExpired(coupon)) {
            return "border-red-200 bg-red-50 text-red-700";
        }

        return coupon.is_active
            ? "border-green-200 bg-green-50 text-green-700"
            : "border-gray-200 bg-gray-100 text-gray-600";
    };

    const displayDiscount = (coupon) =>
        coupon.discount_type === "PERCENTAGE"
            ? `${Number(coupon.discount_value)}%`
            : formatPrice(coupon.discount_value);

    return (
        <div className="min-h-screen bg-[#F8F4ED]">
            <main className="space-y-7 px-4 py-6 sm:px-6 lg:px-10 lg:py-8">

                {/* Header */}

                <section className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                    <div>
                        <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-[#B87552]">
                            Administration
                        </p>

                        <h1 className="font-serif text-3xl font-bold text-[#30231E] md:text-4xl">
                            Coupon Management
                        </h1>

                        <p className="mt-2 text-sm text-[#8B6248]">
                            Create promotional offers and manage coupon validity and usage.
                        </p>
                    </div>

                    <div className="flex flex-wrap gap-3">
                        <button
                            type="button"
                            onClick={() => fetchCoupons()}
                            disabled={loading}
                            className="flex items-center gap-2 rounded-lg border border-[#5C3A2E]/15 bg-white px-4 py-3 text-sm font-medium text-[#5C3A2E] hover:bg-[#F8F4ED] disabled:opacity-50"
                        >
                            <RefreshCw
                                className={`h-4 w-4 ${loading ? "animate-spin" : ""}`}
                            />
                            Refresh
                        </button>

                        <button
                            type="button"
                            onClick={openCreateForm}
                            className="flex items-center gap-2 rounded-lg bg-[#5C3A2E] px-5 py-3 text-sm font-semibold text-white hover:bg-[#30231E]"
                        >
                            <Plus className="h-4 w-4" />
                            Create Coupon
                        </button>
                    </div>
                </section>

                {/* Summary */}

                <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
                    <SummaryCard
                        icon={<TicketPercent className="h-5 w-5 text-[#5C3A2E]" />}
                        label="Coupons Found"
                        value={coupons.length}
                        iconBg="bg-[#B87552]/15"
                    />

                    <SummaryCard
                        icon={<CheckCircle className="h-5 w-5 text-green-700" />}
                        label="Active Coupons"
                        value={activeCount}
                        iconBg="bg-green-100"
                    />

                    <SummaryCard
                        icon={<AlertCircle className="h-5 w-5 text-gray-600" />}
                        label="Inactive Coupons"
                        value={inactiveCount}
                        iconBg="bg-gray-100"
                    />

                    <SummaryCard
                        icon={<CalendarDays className="h-5 w-5 text-[#5C3A2E]" />}
                        label="Total Redemptions"
                        value={totalUsage}
                        iconBg="bg-[#B87552]/15"
                    />
                </section>

                {/* Search and Filters */}

                <section className="rounded-xl border border-[#5C3A2E]/10 bg-white p-5 shadow-sm">
                    <form
                        onSubmit={handleSearch}
                        className="grid grid-cols-1 gap-4 md:grid-cols-2"
                    >
                        <div>
                            <label className="mb-2 block text-sm font-medium text-[#30231E]">
                                Search Coupon
                            </label>

                            <div className="flex items-center gap-2 rounded-lg border border-gray-300 px-3 focus-within:border-[#8B6248]">
                                <Search className="h-5 w-5 text-[#8B6248]" />

                                <input
                                    type="text"
                                    value={search}
                                    onChange={(event) => setSearch(event.target.value)}
                                    placeholder="Enter coupon code..."
                                    className="w-full py-3 text-sm outline-none"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="mb-2 block text-sm font-medium text-[#30231E]">
                                Coupon Status
                            </label>

                            <select
                                value={statusFilter}
                                onChange={(event) => setStatusFilter(event.target.value)}
                                className="w-full rounded-lg border border-gray-300 px-3 py-3 text-sm outline-none focus:border-[#8B6248]"
                            >
                                <option value="">All Coupons</option>
                                <option value="active">Active</option>
                                <option value="inactive">Inactive</option>
                                <option value="expired">Expired</option>
                            </select>
                        </div>

                        <div className="flex flex-wrap gap-3 md:col-span-2">
                            <button
                                type="submit"
                                disabled={loading}
                                className="rounded-lg bg-[#5C3A2E] px-6 py-2.5 text-sm font-semibold text-white hover:bg-[#30231E] disabled:opacity-50"
                            >
                                Search
                            </button>

                            <button
                                type="button"
                                onClick={handleClearFilters}
                                className="rounded-lg border border-[#8B6248] px-6 py-2.5 text-sm font-semibold text-[#5C3A2E] hover:bg-[#F8F4ED]"
                            >
                                Clear Filters
                            </button>
                        </div>
                    </form>
                </section>

                {/* Feedback */}

                {message && (
                    <div className="flex items-start justify-between gap-3 rounded-xl border border-green-200 bg-green-50 p-4 text-sm font-medium text-green-700">
                        <span>{message}</span>
                        <button type="button" onClick={() => setMessage("")}>
                            <X className="h-4 w-4" />
                        </button>
                    </div>
                )}

                {actionError && (
                    <div className="flex items-start justify-between gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-700">
                        <span>{actionError}</span>
                        <button type="button" onClick={() => setActionError("")}>
                            <X className="h-4 w-4" />
                        </button>
                    </div>
                )}

                {error && !loading && (
                    <div className="rounded-xl border border-red-200 bg-red-50 p-5">
                        <p className="font-medium text-red-700">{error}</p>

                        <button
                            type="button"
                            onClick={() => fetchCoupons()}
                            className="mt-3 text-sm font-semibold text-red-700 underline"
                        >
                            Try Again
                        </button>
                    </div>
                )}

                {/* Coupon Table */}

                <section className="overflow-hidden rounded-xl border border-[#5C3A2E]/10 bg-white shadow-sm">
                    <div className="border-b border-[#5C3A2E]/10 p-5">
                        <h2 className="font-serif text-lg font-semibold text-[#30231E]">
                            All Coupons
                        </h2>

                        <p className="mt-1 text-xs text-[#8B6248]">
                            Manage coupon offers, validity and customer usage.
                        </p>
                    </div>

                    {loading ? (
                        <div className="p-10 text-center">
                            <RefreshCw className="mx-auto mb-3 h-7 w-7 animate-spin text-[#8B6248]" />
                            <p className="text-sm text-[#8B6248]">Loading coupons...</p>
                        </div>
                    ) : !error && coupons.length === 0 ? (
                        <div className="p-10 text-center">
                            <TicketPercent className="mx-auto mb-3 h-9 w-9 text-[#8B6248]" />

                            <p className="font-medium text-[#30231E]">
                                No coupons found.
                            </p>

                            <p className="mt-1 text-sm text-[#8B6248]">
                                Create a coupon or change your search filters.
                            </p>
                        </div>
                    ) : !error ? (
                        <div className="overflow-x-auto">
                            <table className="w-full min-w-[1250px] text-sm">
                                <thead>
                                    <tr className="border-b border-[#5C3A2E]/10 bg-[#F8F4ED]/60 text-left text-xs text-[#8B6248]">
                                        <th className="px-5 py-4 font-medium">Coupon</th>
                                        <th className="px-5 py-4 font-medium">Discount</th>
                                        <th className="px-5 py-4 font-medium">Minimum Order</th>
                                        <th className="px-5 py-4 font-medium">Validity</th>
                                        <th className="px-5 py-4 font-medium">Usage</th>
                                        <th className="px-5 py-4 font-medium">Status</th>
                                        <th className="px-5 py-4 font-medium">Actions</th>
                                    </tr>
                                </thead>

                                <tbody className="divide-y divide-[#5C3A2E]/5">
                                    {coupons.map((coupon) => {
                                        const busy = actionLoadingId === coupon.id;

                                        return (
                                            <tr
                                                key={coupon.id}
                                                className="transition hover:bg-[#F8F4ED]/50"
                                            >
                                                <td className="px-5 py-4">
                                                    <p className="font-bold tracking-wide text-[#5C3A2E]">
                                                        {coupon.code}
                                                    </p>
                                                    <p className="mt-1 text-xs text-gray-500">
                                                        ID: #{coupon.id}
                                                    </p>
                                                </td>

                                                <td className="px-5 py-4">
                                                    <p className="font-semibold text-[#30231E]">
                                                        {displayDiscount(coupon)}
                                                    </p>

                                                    {coupon.discount_type === "PERCENTAGE" &&
                                                        coupon.max_discount_amount && (
                                                            <p className="mt-1 text-xs text-gray-500">
                                                                Up to {formatPrice(coupon.max_discount_amount)}
                                                            </p>
                                                        )}
                                                </td>

                                                <td className="px-5 py-4 font-medium text-[#30231E]">
                                                    {formatPrice(coupon.min_order_amount)}
                                                </td>

                                                <td className="px-5 py-4">
                                                    <p className="text-xs text-[#30231E]">
                                                        From: {formatDate(coupon.start_date)}
                                                    </p>
                                                    <p className="mt-1 text-xs text-[#8B6248]">
                                                        Until: {formatDate(coupon.expiry_date)}
                                                    </p>
                                                </td>

                                                <td className="px-5 py-4">
                                                    <p className="font-semibold text-[#30231E]">
                                                        {coupon.actual_used_count ?? 0}
                                                        {coupon.max_total_usage
                                                            ? ` / ${coupon.max_total_usage}`
                                                            : " / Unlimited"}
                                                    </p>
                                                    <p className="mt-1 text-xs text-gray-500">
                                                        Per customer: {coupon.max_usage_per_customer}
                                                    </p>
                                                </td>

                                                <td className="px-5 py-4">
                                                    <span
                                                        className={`inline-flex whitespace-nowrap rounded-full border px-3 py-1 text-xs font-medium ${getStatusStyle(
                                                            coupon
                                                        )}`}
                                                    >
                                                        {getCouponStatus(coupon)}
                                                    </span>
                                                </td>

                                                <td className="px-5 py-4">
                                                    <div className="flex items-center gap-2">
                                                        <ActionButton
                                                            title="View details"
                                                            onClick={() => handleViewDetails(coupon)}
                                                        >
                                                            <Eye className="h-4 w-4" />
                                                        </ActionButton>

                                                        <ActionButton
                                                            title="Edit coupon"
                                                            onClick={() => openEditForm(coupon)}
                                                        >
                                                            <Edit className="h-4 w-4" />
                                                        </ActionButton>

                                                        <ActionButton
                                                            title={
                                                                coupon.is_active ? "Deactivate" : "Activate"
                                                            }
                                                            disabled={busy}
                                                            onClick={() => handleToggleStatus(coupon)}
                                                        >
                                                            {busy ? (
                                                                <RefreshCw className="h-4 w-4 animate-spin" />
                                                            ) : (
                                                                <Power
                                                                    className={`h-4 w-4 ${coupon.is_active
                                                                            ? "text-green-700"
                                                                            : "text-gray-500"
                                                                        }`}
                                                                />
                                                            )}
                                                        </ActionButton>

                                                        <ActionButton
                                                            title="Delete coupon"
                                                            disabled={busy}
                                                            onClick={() => handleDeleteCoupon(coupon)}
                                                        >
                                                            <Trash2 className="h-4 w-4 text-red-600" />
                                                        </ActionButton>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    ) : null}
                </section>

                <p className="pb-4 text-center text-xs text-[#8B6248]/70">
                    Craftopia Admin Panel
                </p>
            </main>

            {/* Create / Edit Modal */}

            {formOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-3 sm:p-5">
                    <div className="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white shadow-xl">
                        <div className="sticky top-0 flex items-center justify-between border-b border-[#5C3A2E]/10 bg-white p-5">
                            <div>
                                <h2 className="font-serif text-xl font-bold text-[#30231E]">
                                    {editingCoupon ? "Edit Coupon" : "Create New Coupon"}
                                </h2>
                                <p className="mt-1 text-xs text-[#8B6248]">
                                    Configure discount, validity and usage limits.
                                </p>
                            </div>

                            <button
                                type="button"
                                onClick={closeForm}
                                disabled={saving}
                                className="rounded-lg p-2 text-gray-500 hover:bg-gray-100"
                            >
                                <X className="h-5 w-5" />
                            </button>
                        </div>

                        <form onSubmit={handleSaveCoupon} className="space-y-5 p-5">
                            {formError && (
                                <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                                    {formError}
                                </div>
                            )}

                            <div>
                                <label className="mb-2 block text-sm font-medium text-[#30231E]">
                                    Coupon Code *
                                </label>
                                <input
                                    name="code"
                                    value={formData.code}
                                    onChange={handleInputChange}
                                    placeholder="Example: SAVE20"
                                    maxLength={30}
                                    required
                                    className="w-full rounded-lg border border-gray-300 px-3 py-3 text-sm uppercase outline-none focus:border-[#8B6248]"
                                />
                                <p className="mt-1 text-xs text-gray-500">
                                    Customers will enter this code during checkout.
                                </p>
                            </div>

                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                <div>
                                    <label className="mb-2 block text-sm font-medium text-[#30231E]">
                                        Discount Type *
                                    </label>
                                    <select
                                        name="discount_type"
                                        value={formData.discount_type}
                                        onChange={handleInputChange}
                                        className="w-full rounded-lg border border-gray-300 px-3 py-3 text-sm outline-none focus:border-[#8B6248]"
                                    >
                                        <option value="PERCENTAGE">Percentage (%)</option>
                                        <option value="FIXED">Fixed Amount (₹)</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="mb-2 block text-sm font-medium text-[#30231E]">
                                        Discount Value *
                                    </label>
                                    <input
                                        type="number"
                                        name="discount_value"
                                        value={formData.discount_value}
                                        onChange={handleInputChange}
                                        min="0.01"
                                        max={
                                            formData.discount_type === "PERCENTAGE"
                                                ? "100"
                                                : undefined
                                        }
                                        step="0.01"
                                        required
                                        placeholder={
                                            formData.discount_type === "PERCENTAGE"
                                                ? "Example: 20"
                                                : "Example: 150"
                                        }
                                        className="w-full rounded-lg border border-gray-300 px-3 py-3 text-sm outline-none focus:border-[#8B6248]"
                                    />
                                </div>

                                <div>
                                    <label className="mb-2 block text-sm font-medium text-[#30231E]">
                                        Minimum Order Amount (₹)
                                    </label>
                                    <input
                                        type="number"
                                        name="min_order_amount"
                                        value={formData.min_order_amount}
                                        onChange={handleInputChange}
                                        min="0"
                                        step="0.01"
                                        className="w-full rounded-lg border border-gray-300 px-3 py-3 text-sm outline-none focus:border-[#8B6248]"
                                    />
                                </div>

                                {formData.discount_type === "PERCENTAGE" && (
                                    <div>
                                        <label className="mb-2 block text-sm font-medium text-[#30231E]">
                                            Maximum Discount (₹)
                                        </label>
                                        <input
                                            type="number"
                                            name="max_discount_amount"
                                            value={formData.max_discount_amount}
                                            onChange={handleInputChange}
                                            min="0"
                                            step="0.01"
                                            placeholder="Optional"
                                            className="w-full rounded-lg border border-gray-300 px-3 py-3 text-sm outline-none focus:border-[#8B6248]"
                                        />
                                    </div>
                                )}
                            </div>

                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                <div>
                                    <label className="mb-2 block text-sm font-medium text-[#30231E]">
                                        Start Date & Time *
                                    </label>
                                    <input
                                        type="datetime-local"
                                        name="start_date"
                                        value={formData.start_date}
                                        onChange={handleInputChange}
                                        required
                                        className="w-full rounded-lg border border-gray-300 px-3 py-3 text-sm outline-none focus:border-[#8B6248]"
                                    />
                                </div>

                                <div>
                                    <label className="mb-2 block text-sm font-medium text-[#30231E]">
                                        Expiry Date & Time *
                                    </label>
                                    <input
                                        type="datetime-local"
                                        name="expiry_date"
                                        value={formData.expiry_date}
                                        onChange={handleInputChange}
                                        required
                                        className="w-full rounded-lg border border-gray-300 px-3 py-3 text-sm outline-none focus:border-[#8B6248]"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                <div>
                                    <label className="mb-2 block text-sm font-medium text-[#30231E]">
                                        Maximum Total Usage
                                    </label>
                                    <input
                                        type="number"
                                        name="max_total_usage"
                                        value={formData.max_total_usage}
                                        onChange={handleInputChange}
                                        min="1"
                                        step="1"
                                        placeholder="Leave empty for unlimited"
                                        className="w-full rounded-lg border border-gray-300 px-3 py-3 text-sm outline-none focus:border-[#8B6248]"
                                    />
                                </div>

                                <div>
                                    <label className="mb-2 block text-sm font-medium text-[#30231E]">
                                        Usage Per Customer *
                                    </label>
                                    <input
                                        type="number"
                                        name="max_usage_per_customer"
                                        value={formData.max_usage_per_customer}
                                        onChange={handleInputChange}
                                        min="1"
                                        step="1"
                                        required
                                        className="w-full rounded-lg border border-gray-300 px-3 py-3 text-sm outline-none focus:border-[#8B6248]"
                                    />
                                </div>
                            </div>

                            <label className="flex cursor-pointer items-center gap-3 rounded-lg border border-[#5C3A2E]/10 bg-[#F8F4ED] p-4">
                                <input
                                    type="checkbox"
                                    name="is_active"
                                    checked={formData.is_active}
                                    onChange={handleInputChange}
                                    className="h-4 w-4 accent-[#5C3A2E]"
                                />
                                <span>
                                    <span className="block text-sm font-semibold text-[#30231E]">
                                        Activate coupon
                                    </span>
                                    <span className="mt-1 block text-xs text-[#8B6248]">
                                        Active coupons can be used by eligible customers during
                                        their validity period.
                                    </span>
                                </span>
                            </label>

                            <div className="flex flex-col-reverse gap-3 border-t border-[#5C3A2E]/10 pt-5 sm:flex-row sm:justify-end">
                                <button
                                    type="button"
                                    onClick={closeForm}
                                    disabled={saving}
                                    className="rounded-lg border border-[#8B6248] px-5 py-3 text-sm font-semibold text-[#5C3A2E] hover:bg-[#F8F4ED] disabled:opacity-50"
                                >
                                    Cancel
                                </button>

                                <button
                                    type="submit"
                                    disabled={saving}
                                    className="flex items-center justify-center gap-2 rounded-lg bg-[#5C3A2E] px-6 py-3 text-sm font-semibold text-white hover:bg-[#30231E] disabled:opacity-50"
                                >
                                    {saving && (
                                        <RefreshCw className="h-4 w-4 animate-spin" />
                                    )}
                                    {saving
                                        ? "Saving..."
                                        : editingCoupon
                                            ? "Save Changes"
                                            : "Create Coupon"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Coupon Details Modal */}

            {(detailsLoading || detailsCoupon) && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-3 sm:p-5">
                    <div className="max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-2xl bg-white shadow-xl">
                        <div className="flex items-center justify-between border-b border-[#5C3A2E]/10 p-5">
                            <h2 className="font-serif text-xl font-bold text-[#30231E]">
                                Coupon Details
                            </h2>

                            <button
                                type="button"
                                onClick={closeDetails}
                                className="rounded-lg p-2 text-gray-500 hover:bg-gray-100"
                            >
                                <X className="h-5 w-5" />
                            </button>
                        </div>

                        {detailsLoading ? (
                            <div className="p-10 text-center">
                                <RefreshCw className="mx-auto mb-3 h-7 w-7 animate-spin text-[#8B6248]" />
                                <p className="text-sm text-[#8B6248]">
                                    Loading coupon details...
                                </p>
                            </div>
                        ) : detailsCoupon ? (
                            <div className="space-y-5 p-5">
                                <div className="rounded-xl bg-[#F8F4ED] p-5">
                                    <p className="text-xs font-semibold uppercase tracking-widest text-[#8B6248]">
                                        Coupon Code
                                    </p>
                                    <p className="mt-2 text-2xl font-bold tracking-wider text-[#5C3A2E]">
                                        {detailsCoupon.code}
                                    </p>
                                    <p className="mt-2 text-lg font-semibold text-[#30231E]">
                                        {displayDiscount(detailsCoupon)} discount
                                    </p>
                                </div>

                                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                    <DetailItem
                                        label="Minimum Order"
                                        value={formatPrice(detailsCoupon.min_order_amount)}
                                    />
                                    <DetailItem
                                        label="Maximum Discount"
                                        value={
                                            detailsCoupon.max_discount_amount
                                                ? formatPrice(detailsCoupon.max_discount_amount)
                                                : "No limit specified"
                                        }
                                    />
                                    <DetailItem
                                        label="Start Date"
                                        value={formatDate(detailsCoupon.start_date)}
                                    />
                                    <DetailItem
                                        label="Expiry Date"
                                        value={formatDate(detailsCoupon.expiry_date)}
                                    />
                                    <DetailItem
                                        label="Total Usage"
                                        value={detailsCoupon.max_total_usage || "Unlimited"}
                                    />
                                    <DetailItem
                                        label="Usage Per Customer"
                                        value={detailsCoupon.max_usage_per_customer}
                                    />
                                    <DetailItem
                                        label="Actual Used Count"
                                        value={detailsCoupon.actual_used_count ?? 0}
                                    />
                                    <DetailItem
                                        label="Recorded Used Count"
                                        value={detailsCoupon.total_used_count ?? 0}
                                    />
                                </div>

                                <div className="rounded-lg border border-[#5C3A2E]/10 p-4">
                                    <p className="text-sm font-semibold text-[#30231E]">
                                        Coupon Status
                                    </p>
                                    <span
                                        className={`mt-2 inline-flex rounded-full border px-3 py-1 text-xs font-medium ${detailsCoupon.is_active
                                                ? "border-green-200 bg-green-50 text-green-700"
                                                : "border-gray-200 bg-gray-100 text-gray-600"
                                            }`}
                                    >
                                        {detailsCoupon.is_active ? "Active" : "Inactive"}
                                    </span>
                                </div>

                                <p className="text-xs text-gray-500">
                                    Created: {formatDate(detailsCoupon.created_at)}
                                </p>
                            </div>
                        ) : null}
                    </div>
                </div>
            )}
        </div>
    );
}

function SummaryCard({ icon, label, value, iconBg }) {
    return (
        <div className="rounded-xl border border-[#5C3A2E]/10 bg-white p-5 shadow-sm">
            <div className="flex items-center gap-3">
                <div
                    className={`flex h-11 w-11 items-center justify-center rounded-full ${iconBg}`}
                >
                    {icon}
                </div>

                <div className="min-w-0">
                    <p className="text-sm text-[#8B6248]">{label}</p>
                    <p className="break-words text-2xl font-bold text-[#30231E]">
                        {value}
                    </p>
                </div>
            </div>
        </div>
    );
}

function ActionButton({ children, title, onClick, disabled = false }) {
    return (
        <button
            type="button"
            title={title}
            aria-label={title}
            onClick={onClick}
            disabled={disabled}
            className="rounded-lg border border-[#5C3A2E]/10 p-2 text-[#5C3A2E] transition hover:bg-[#F8F4ED] disabled:cursor-not-allowed disabled:opacity-40"
        >
            {children}
        </button>
    );
}

function DetailItem({ label, value }) {
    return (
        <div className="rounded-lg border border-[#5C3A2E]/10 p-3">
            <p className="text-xs text-[#8B6248]">{label}</p>
            <p className="mt-1 break-words text-sm font-semibold text-[#30231E]">
                {value ?? "-"}
            </p>
        </div>
    );
}

export default AdminCouponManagementPage;
