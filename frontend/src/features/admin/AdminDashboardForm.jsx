
import React from "react";
import { NavLink } from "react-router-dom";

import {
  LayoutDashboard,
  Users,
  Store,
  Package,
  ShoppingBag,
  CreditCard,
  TrendingUp,
  CalendarDays,
  ArrowRight,
  UserPlus,
  IndianRupee,
} from "lucide-react";

/* ----------------------------------
   Admin Navigation Items
---------------------------------- */

export const NAV_ITEMS = [
  { label: "Dashboard", icon: LayoutDashboard, path: "/admin/dashboard" },
  { label: "User Management", icon: Users, path: "/admin/users" },
  { label: "Artisan Management", icon: Store, path: "/admin/artisans" },
  { label: "Product Management", icon: Package, path: "/admin/products" },
  { label: "Order Management", icon: ShoppingBag, path: "/admin/orders" },
  { label: "Payment Management", icon: CreditCard, path: "/admin/payments" },
];

/* ----------------------------------
   Dashboard Mock Data
---------------------------------- */

const STATS = [
  {
    icon: Users,
    title: "Total Users",
    value: "1,248",
    growth: "+12% this month",
  },
  {
    icon: Store,
    title: "Total Artisans",
    value: "320",
    growth: "+8% this month",
  },
  {
    icon: Package,
    title: "Total Products",
    value: "856",
    growth: "+15% this month",
  },
  {
    icon: ShoppingBag,
    title: "Total Orders",
    value: "485",
    growth: "+10% this month",
  },
  {
    icon: IndianRupee,
    title: "Total Revenue",
    value: "₹2,48,520",
    growth: "+18% this month",
  },
];

const BAR_DATA = [
  { date: "Oct 17", customers: 85, artisans: 55 },
  { date: "Oct 18", customers: 90, artisans: 60 },
  { date: "Oct 19", customers: 105, artisans: 70 },
  { date: "Oct 20", customers: 115, artisans: 90 },
  { date: "Oct 21", customers: 140, artisans: 105 },
  { date: "Oct 22", customers: 138, artisans: 118 },
  { date: "Oct 23", customers: 148, artisans: 122 },
  { date: "Oct 24", customers: 162, artisans: 132 },
];

const LINE_DATA = [
  { date: "Oct 17", value: 15 },
  { date: "Oct 18", value: 25 },
  { date: "Oct 19", value: 32 },
  { date: "Oct 20", value: 43 },
  { date: "Oct 21", value: 33 },
  { date: "Oct 22", value: 47 },
  { date: "Oct 23", value: 43 },
  { date: "Oct 24", value: 62 },
];

const RECENT_USERS = [
  {
    id: 1248,
    name: "Ananya Nair",
    email: "ananya@example.com",
    role: "Customer",
    date: "Oct 24, 2024",
    status: "Active",
  },
  {
    id: 1247,
    name: "Arjun R",
    email: "arjun@example.com",
    role: "Artisan",
    date: "Oct 24, 2024",
    status: "Active",
  },
  {
    id: 1246,
    name: "Meera S",
    email: "meera@example.com",
    role: "Customer",
    date: "Oct 23, 2024",
    status: "Active",
  },
  {
    id: 1245,
    name: "Vikram P",
    email: "vikram@example.com",
    role: "Artisan",
    date: "Oct 23, 2024",
    status: "Blocked",
  },
  {
    id: 1244,
    name: "Sneha K",
    email: "sneha@example.com",
    role: "Customer",
    date: "Oct 22, 2024",
    status: "Active",
  },
];

const RECENT_ORDERS = [
  {
    id: "#ORD-1024",
    customer: "Ananya Nair",
    date: "Oct 24, 2024",
    amount: "₹2,480",
    status: "Pending",
  },
  {
    id: "#ORD-1023",
    customer: "Arjun R",
    date: "Oct 23, 2024",
    amount: "₹1,250",
    status: "Processing",
  },
  {
    id: "#ORD-1022",
    customer: "Meera S",
    date: "Oct 22, 2024",
    amount: "₹3,750",
    status: "Shipped",
  },
  {
    id: "#ORD-1021",
    customer: "Vikram P",
    date: "Oct 21, 2024",
    amount: "₹980",
    status: "Delivered",
  },
  {
    id: "#ORD-1020",
    customer: "Sneha K",
    date: "Oct 20, 2024",
    amount: "₹4,320",
    status: "Delivered",
  },
];

const STATUS_STYLES = {
  Active: "bg-green-50 text-green-700 border-green-200",
  Blocked: "bg-red-50 text-red-700 border-red-200",
  Pending: "bg-amber-50 text-amber-700 border-amber-200",
  Processing: "bg-blue-50 text-blue-700 border-blue-200",
  Shipped: "bg-purple-50 text-purple-700 border-purple-200",
  Delivered: "bg-green-50 text-green-700 border-green-200",
};

const ROLE_STYLES = {
  Customer: "bg-[#F8F4ED] text-[#5C3A2E] border-[#5C3A2E]/20",
  Artisan: "bg-[#F8F4ED] text-[#8B6248] border-[#8B6248]/30",
};

/* ----------------------------------
   Helper Components
---------------------------------- */

export const Avatar = ({ name = "Admin", size = "md" }) => {
  const initials = name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  const sizeClass =
    size === "sm"
      ? "h-8 w-8 text-[10px]"
      : "h-10 w-10 text-sm";

  return (
    <div
      className={`${sizeClass} flex shrink-0 items-center justify-center rounded-full bg-[#5C3A2E] font-semibold text-white`}
    >
      {initials}
    </div>
  );
};

const StatCard = ({ icon: Icon, title, value, growth }) => (
  <div className="rounded-xl border border-[#5C3A2E]/10 bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:shadow-md">
    <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-full bg-[#B87552]/15">
      <Icon className="h-5 w-5 text-[#5C3A2E]" strokeWidth={1.8} />
    </div>

    <p className="mb-1 text-sm text-[#5C3A2E]/70">{title}</p>

    <p className="text-2xl font-bold tracking-tight text-[#30231E]">
      {value}
    </p>

    <div className="mt-3 flex items-center gap-1 text-xs text-green-700">
      <TrendingUp className="h-3.5 w-3.5" />
      <span>{growth}</span>
    </div>
  </div>
);

const StatusBadge = ({ status }) => (
  <span
    className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border px-2.5 py-1 text-xs font-medium ${
      STATUS_STYLES[status] || "border-gray-200 bg-gray-50 text-gray-600"
    }`}
  >
    <span className="h-1.5 w-1.5 rounded-full bg-current" />
    {status}
  </span>
);

/* ----------------------------------
   Bar Chart
---------------------------------- */

const BarChart = () => {
  const width = 560;
  const height = 240;
  const padding = { top: 20, right: 20, bottom: 30, left: 40 };
  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;
  const maxValue = 200;
  const groupWidth = chartWidth / BAR_DATA.length;
  const barWidth = groupWidth * 0.3;

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      className="h-auto w-full"
      role="img"
      aria-label="Customer and artisan registration comparison chart"
    >
      {[0, 50, 100, 150, 200].map((value) => {
        const y =
          padding.top + chartHeight - (value / maxValue) * chartHeight;

        return (
          <g key={value}>
            <line
              x1={padding.left}
              y1={y}
              x2={width - padding.right}
              y2={y}
              stroke="#E5DDD2"
              strokeDasharray="3 3"
            />

            <text
              x={padding.left - 8}
              y={y + 4}
              textAnchor="end"
              fontSize="10"
              fill="#8B6248"
            >
              {value}
            </text>
          </g>
        );
      })}

      {BAR_DATA.map((item, index) => {
        const x =
          padding.left + index * groupWidth + groupWidth / 2;

        const customerHeight =
          (item.customers / maxValue) * chartHeight;

        const artisanHeight =
          (item.artisans / maxValue) * chartHeight;

        return (
          <g key={item.date}>
            <rect
              x={x - barWidth - 2}
              y={padding.top + chartHeight - customerHeight}
              width={barWidth}
              height={customerHeight}
              rx="3"
              fill="#5C3A2E"
            />

            <rect
              x={x + 2}
              y={padding.top + chartHeight - artisanHeight}
              width={barWidth}
              height={artisanHeight}
              rx="3"
              fill="#B87552"
            />

            <text
              x={x}
              y={height - 8}
              textAnchor="middle"
              fontSize="10"
              fill="#8B6248"
            >
              {item.date}
            </text>
          </g>
        );
      })}
    </svg>
  );
};

/* ----------------------------------
   Line Chart
---------------------------------- */

const LineChart = () => {
  const width = 560;
  const height = 240;

  const padding = {
    top: 20,
    right: 20,
    bottom: 30,
    left: 40,
  };

  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;
  const maxValue = 70;

  const points = LINE_DATA.map((item, index) => {
    const x =
      padding.left +
      (index / (LINE_DATA.length - 1)) * chartWidth;

    const y =
      padding.top +
      chartHeight -
      (item.value / maxValue) * chartHeight;

    return {
      x,
      y,
      ...item,
    };
  });

  const polylinePoints = points
    .map((point) => `${point.x},${point.y}`)
    .join(" ");

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      className="h-auto w-full"
      role="img"
      aria-label="Order statistics line chart"
    >
      {[0, 20, 40, 60].map((value) => {
        const y =
          padding.top +
          chartHeight -
          (value / maxValue) * chartHeight;

        return (
          <g key={value}>
            <line
              x1={padding.left}
              y1={y}
              x2={width - padding.right}
              y2={y}
              stroke="#E5DDD2"
              strokeDasharray="3 3"
            />

            <text
              x={padding.left - 8}
              y={y + 4}
              textAnchor="end"
              fontSize="10"
              fill="#8B6248"
            >
              {value}
            </text>
          </g>
        );
      })}

      <polyline
        points={polylinePoints}
        fill="none"
        stroke="#5C3A2E"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {points.map((point) => (
        <g key={point.date}>
          <circle
            cx={point.x}
            cy={point.y}
            r="4"
            fill="#F8F4ED"
            stroke="#5C3A2E"
            strokeWidth="2"
          />

          <text
            x={point.x}
            y={height - 8}
            textAnchor="middle"
            fontSize="10"
            fill="#8B6248"
          >
            {point.date}
          </text>
        </g>
      ))}
    </svg>
  );
};

/* ----------------------------------
   Main Dashboard Content
---------------------------------- */

const AdminDashboardForm = () => {
  const currentDate = new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date());

  return (
    <div className="min-h-screen bg-[#F8F4ED]">
      <main className="space-y-8 px-4 py-6 sm:px-6 lg:px-10 lg:py-8">

        {/* Welcome Section */}

        <section className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-[#B87552]">
              Dashboard
            </p>

            <h1 className="font-serif text-3xl font-bold text-[#30231E] md:text-4xl">
              Welcome, Admin
            </h1>

            <p className="mt-2 text-sm text-[#8B6248]">
              Here's what's happening with your marketplace today.
            </p>
          </div>

          <div className="flex items-center gap-3 rounded-lg border border-[#5C3A2E]/10 bg-white px-4 py-3 shadow-sm">
            <CalendarDays className="h-5 w-5 text-[#5C3A2E]" />

            <div>
              <p className="text-sm font-medium text-[#30231E]">
                Today
              </p>

              <p className="text-xs text-[#8B6248]">
                {currentDate}
              </p>
            </div>
          </div>
        </section>

        {/* Statistics Cards */}

        <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
          {STATS.map((stat) => (
            <StatCard key={stat.title} {...stat} />
          ))}
        </section>

        {/* Charts */}

        <section className="grid grid-cols-1 gap-6 xl:grid-cols-2">

          {/* Registration Chart */}

          <div className="min-w-0 rounded-xl border border-[#5C3A2E]/10 bg-white p-4 shadow-sm sm:p-6">
            <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <UserPlus className="h-5 w-5 text-[#5C3A2E]" />

                <h2 className="font-serif text-lg font-semibold text-[#30231E]">
                  User Registration Overview
                </h2>
              </div>

              <div className="flex items-center gap-3 text-xs text-[#5C3A2E]">
                <span className="flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-full bg-[#5C3A2E]" />
                  Customers
                </span>

                <span className="flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-full bg-[#B87552]" />
                  Artisans
                </span>
              </div>
            </div>

            <BarChart />
          </div>

          {/* Order Chart */}

          <div className="min-w-0 rounded-xl border border-[#5C3A2E]/10 bg-white p-4 shadow-sm sm:p-6">
            <div className="mb-6 flex items-center gap-2">
              <ShoppingBag className="h-5 w-5 text-[#5C3A2E]" />

              <h2 className="font-serif text-lg font-semibold text-[#30231E]">
                Order Statistics
              </h2>
            </div>

            <LineChart />
          </div>
        </section>

        {/* Recent Activity */}

        <section className="grid grid-cols-1 gap-6 2xl:grid-cols-2">

          {/* Recent Users */}

          <div className="min-w-0 rounded-xl border border-[#5C3A2E]/10 bg-white p-4 shadow-sm sm:p-6">
            <div className="mb-5 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <Users className="h-5 w-5 text-[#5C3A2E]" />

                <h2 className="font-serif text-lg font-semibold text-[#30231E]">
                  Recent User Registrations
                </h2>
              </div>

              <NavLink
                to="/admin/users"
                className="flex shrink-0 items-center gap-1 text-xs font-medium text-[#B87552] hover:text-[#5C3A2E]"
              >
                View All
                <ArrowRight className="h-3.5 w-3.5" />
              </NavLink>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full min-w-[580px] text-sm">
                <thead>
                  <tr className="border-b border-[#5C3A2E]/10 text-left text-xs text-[#8B6248]">
                    <th className="pb-3 font-medium">ID</th>
                    <th className="pb-3 font-medium">Name</th>
                    <th className="hidden pb-3 font-medium md:table-cell">Email</th>
                    <th className="pb-3 font-medium">Role</th>
                    <th className="hidden pb-3 font-medium sm:table-cell">Date</th>
                    <th className="pb-3 font-medium">Status</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-[#5C3A2E]/5">
                  {RECENT_USERS.map((user) => (
                    <tr
                      key={user.id}
                      className="transition hover:bg-[#F8F4ED]/60"
                    >
                      <td className="py-3 font-mono text-xs text-[#8B6248]">
                        {user.id}
                      </td>

                      <td className="py-3">
                        <div className="flex items-center gap-2">
                          <Avatar name={user.name} size="sm" />

                          <span className="font-medium text-[#30231E]">
                            {user.name}
                          </span>
                        </div>
                      </td>

                      <td className="hidden py-3 text-xs text-[#8B6248] md:table-cell">
                        {user.email}
                      </td>

                      <td className="py-3">
                        <span
                          className={`whitespace-nowrap rounded-full border px-2.5 py-1 text-xs font-medium ${
                            ROLE_STYLES[user.role]
                          }`}
                        >
                          {user.role}
                        </span>
                      </td>

                      <td className="hidden py-3 text-xs text-[#8B6248] sm:table-cell">
                        {user.date}
                      </td>

                      <td className="py-3">
                        <StatusBadge status={user.status} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Recent Orders */}

          <div className="min-w-0 rounded-xl border border-[#5C3A2E]/10 bg-white p-4 shadow-sm sm:p-6">
            <div className="mb-5 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <ShoppingBag className="h-5 w-5 text-[#5C3A2E]" />

                <h2 className="font-serif text-lg font-semibold text-[#30231E]">
                  Recent Orders
                </h2>
              </div>

              <NavLink
                to="/admin/orders"
                className="flex shrink-0 items-center gap-1 text-xs font-medium text-[#B87552] hover:text-[#5C3A2E]"
              >
                View All
                <ArrowRight className="h-3.5 w-3.5" />
              </NavLink>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full min-w-[520px] text-sm">
                <thead>
                  <tr className="border-b border-[#5C3A2E]/10 text-left text-xs text-[#8B6248]">
                    <th className="pb-3 font-medium">Order ID</th>
                    <th className="pb-3 font-medium">Customer</th>
                    <th className="hidden pb-3 font-medium md:table-cell">Date</th>
                    <th className="pb-3 font-medium">Amount</th>
                    <th className="pb-3 font-medium">Status</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-[#5C3A2E]/5">
                  {RECENT_ORDERS.map((order) => (
                    <tr
                      key={order.id}
                      className="transition hover:bg-[#F8F4ED]/60"
                    >
                      <td className="py-3 font-mono text-xs text-[#8B6248]">
                        {order.id}
                      </td>

                      <td className="py-3">
                        <div className="flex items-center gap-2">
                          <Avatar name={order.customer} size="sm" />

                          <span className="font-medium text-[#30231E]">
                            {order.customer}
                          </span>
                        </div>
                      </td>

                      <td className="hidden py-3 text-xs text-[#8B6248] md:table-cell">
                        {order.date}
                      </td>

                      <td className="py-3 font-medium text-[#30231E]">
                        {order.amount}
                      </td>

                      <td className="py-3">
                        <StatusBadge status={order.status} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        <p className="pb-4 text-center text-xs text-[#8B6248]/70">
          Craftopia Admin Dashboard
        </p>

      </main>
    </div>
  );
};

export default AdminDashboardForm;
