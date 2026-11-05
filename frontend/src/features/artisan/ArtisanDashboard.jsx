import {
  Package,
  Hourglass,
  CheckCircle2,
  Zap,
  BookOpen,
  ArrowRight,
  Clock,
  Leaf,
  Plus,
  Settings,
} from 'lucide-react';

const ArtisanDashboard = () => {
  const stats = [
    {
      label: 'Catalog',
      title: 'My Products',
      count: '18',
      description: 'Total handcrafted products listed',
      badge: '16 Active in Catalog',
      icon: Package,
      badgeStyle: 'bg-[#F8F4ED] text-[#5C3A2E] border-[#E5E0D8]',
    },
    {
      label: 'New Inquiries',
      title: 'Pending Requests',
      count: '2',
      description: 'Orders waiting for your decision',
      badge: 'Requires Action',
      icon: Hourglass,
      badgeStyle: 'bg-[#FDE8E0] text-[#B87552] border-[#FAD5C5]',
    },
    {
      label: 'In Progress',
      title: 'Accepted Orders',
      count: '5',
      description: 'Orders accepted and awaiting payment or crafting',
      badge: '3 Awaiting Payment • 2 In Progress',
      icon: CheckCircle2,
      badgeStyle: 'bg-[#F8F4ED] text-[#5C3A2E] border-[#E5E0D8]',
    },
  ];

  const orders = [
    {
      id: 1,
      status: 'Pending',
      time: 'Today, 10:45 AM',
      product: 'Handcrafted Terracotta Vase',
      customer: 'Customer',
      location: 'Kerala',
      quantity: '2 Units',
      total: '₹1,300',
      image:
        'https://images.unsplash.com/photo-1610701596007-11502861dcfa?auto=format&fit=crop&q=80&w=300',
      alt: 'Terracotta vase',
      note:
        'Could you please make one with a slightly deeper terracotta tone?',
      statusStyle: 'bg-[#FDE8E0] text-[#B87552]',
      showNote: true,
    },
    {
      id: 2,
      status: 'Pending',
      time: 'Yesterday, 4:15 PM',
      product: 'Ceramic Coffee Mug (Raw Glazed)',
      customer: 'Customer',
      location: 'Kerala',
      quantity: '4 Mugs',
      total: '₹1,400',
      image:
        'https://images.unsplash.com/photo-1514228742587-6b1558fcca3d?auto=format&fit=crop&q=80&w=300',
      alt: 'Ceramic coffee mug',
      statusStyle: 'bg-[#FDE8E0] text-[#B87552]',
    },
    {
      id: 3,
      status: 'Accepted',
      time: '2 days ago',
      product: 'Handmade Clay Planter (Ribbed)',
      customer: 'Customer',
      location: 'Kerala',
      quantity: '1 Unit',
      total: '₹500',
      image:
        'https://images.unsplash.com/photo-1485955900006-10f4d324d411?auto=format&fit=crop&q=80&w=300',
      alt: 'Handmade clay planter',
      statusStyle: 'bg-[#E8F5E9] text-[#2E7D32]',
    },
  ];

  const workflow = [
    {
      title: 'Review Inquiry',
      description: 'Check customer notes and quantities',
    },
    {
      title: 'Accept or Decline',
      description: 'Review the schedule and available stock',
    },
    {
      title: 'Customer Pays Online',
      description: 'Begin crafting after payment confirmation',
    },
  ];

  return (
    <div className="space-y-8">
      {/* Welcome Banner */}
      <section className="relative overflow-hidden rounded-3xl border border-[#F2E6E1] bg-gradient-to-r from-[#FDF4F1] to-[#FDE5DA] p-6 sm:p-8 md:p-12">
        <div className="absolute right-5 top-5 translate-x-5 -translate-y-5 opacity-10 sm:right-10">
          <Leaf size={160} className="text-[#5C3A2E] md:h-[200px] md:w-[200px]" />
        </div>

        <div className="relative z-10 max-w-3xl">
          <div className="mb-6 flex flex-wrap gap-3 text-[10px] font-bold uppercase tracking-wider text-[#8B6248] sm:text-xs">
            <span className="flex items-center gap-2 rounded-full border border-[#E5D5CC] bg-white/60 px-3 py-2">
              <span className="h-1.5 w-1.5 rounded-full bg-[#B87552]" />
              Kerala Artisan Atelier
            </span>

            <span className="flex items-center gap-2 rounded-full border border-[#E5D5CC] bg-white/60 px-3 py-2">
              <span className="h-1.5 w-1.5 rounded-full bg-[#5C3A2E]" />
              Your Artisan Workspace
            </span>
          </div>

          <h1 className="mb-4 font-serif text-3xl font-bold text-[#30231E] sm:text-4xl md:text-5xl">
            Welcome back, Artisan!
          </h1>

          <p className="mb-8 max-w-2xl text-sm leading-relaxed text-[#5C3A2E] sm:text-base md:text-lg">
            Manage your handmade products, review customer order requests,
            and keep track of your artisan workspace.
          </p>

          <button
            type="button"
            className="flex items-center gap-2 rounded-lg bg-[#30231E] px-5 py-3 text-sm font-medium text-white shadow-lg shadow-[#30231E]/10 transition-colors hover:bg-[#5C3A2E]"
          >
            View Order Requests
            <ArrowRight size={18} />
          </button>
        </div>
      </section>

      {/* Statistics */}
      <section className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {stats.map((stat) => {
          const Icon = stat.icon;

          return (
            <div
              key={stat.title}
              className="flex h-full flex-col justify-between rounded-2xl border border-[#F2E6E1] bg-white p-5 shadow-sm sm:p-6"
            >
              <div className="mb-5 flex items-start justify-between">
                <div>
                  <p className="mb-1 text-xs font-bold uppercase tracking-wider text-[#8B6248]">
                    {stat.label}
                  </p>

                  <h2 className="text-lg font-bold text-[#30231E]">
                    {stat.title}
                  </h2>
                </div>

                <div className="rounded-lg bg-[#FDF1EC] p-3 text-[#B87552]">
                  <Icon size={20} />
                </div>
              </div>

              <div>
                <p className="mb-2 font-serif text-4xl font-bold text-[#30231E]">
                  {stat.count}
                </p>

                <p className="mb-4 text-sm text-[#8B6248]">
                  {stat.description}
                </p>

                <span
                  className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-medium ${stat.badgeStyle}`}
                >
                  {stat.badge}
                </span>
              </div>
            </div>
          );
        })}
      </section>

      {/* Orders and Sidebar */}
      <section className="grid grid-cols-1 gap-6 lg:grid-cols-3 lg:gap-8">
        {/* Recent Orders */}
        <div className="space-y-5 lg:col-span-2">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <h2 className="font-serif text-2xl font-bold text-[#30231E]">
                Recent Order Requests
              </h2>

              <p className="mt-1 text-sm text-[#8B6248]">
                Review the latest customer inquiries
              </p>
            </div>

            <button
              type="button"
              className="flex items-center gap-1 text-sm font-medium text-[#5C3A2E] transition-colors hover:text-[#B87552]"
            >
              View All Requests
              <ArrowRight size={14} />
            </button>
          </div>

          <div className="space-y-4">
            {orders.map((order) => (
              <article
                key={order.id}
                className="flex flex-col gap-4 rounded-2xl border border-[#F2E6E1] bg-white p-4 shadow-sm md:flex-row"
              >
                <div className="h-40 w-full flex-shrink-0 overflow-hidden rounded-xl bg-[#F8F4ED] sm:h-36 md:h-28 md:w-28">
                  <img
                    src={order.image}
                    alt={order.alt}
                    className="h-full w-full object-cover"
                    loading="lazy"
                  />
                </div>

                <div className="flex min-w-0 flex-1 flex-col justify-between gap-3">
                  <div>
                    <div className="mb-2 flex flex-wrap items-center gap-2">
                      <span
                        className={`rounded-full px-2 py-1 text-xs font-bold ${order.statusStyle}`}
                      >
                        {order.status}
                      </span>

                      <span className="flex items-center gap-1 text-xs text-[#8B6248]">
                        <Clock size={12} />
                        {order.time}
                      </span>
                    </div>

                    <h3 className="mb-1 font-bold text-[#30231E]">
                      {order.product}
                    </h3>

                    <p className="mb-2 text-sm text-[#5C3A2E]">
                      {order.customer}
                      <span className="text-[#8B6248]">
                        {' '}• {order.location}
                      </span>
                    </p>

                    <p className="text-sm font-medium text-[#30231E]">
                      {order.quantity} • {order.total} total
                    </p>
                  </div>

                  {order.showNote && (
                    <p className="rounded-lg border border-[#F2E6E1] bg-[#FDF4F1] p-3 text-xs italic leading-relaxed text-[#5C3A2E]">
                      “{order.note}”
                    </p>
                  )}

                  <button
                    type="button"
                    className="self-start rounded-lg border border-[#E5E0D8] bg-white px-4 py-2 text-sm font-medium text-[#30231E] transition-colors hover:bg-[#F8F4ED]"
                  >
                    View Request
                  </button>
                </div>
              </article>
            ))}
          </div>
        </div>

        {/* Right Sidebar */}
        <aside className="space-y-6">
          {/* Quick Actions */}
          <div className="rounded-2xl border border-[#F2E6E1] bg-white p-5 shadow-sm sm:p-6">
            <div className="mb-5 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Zap size={18} className="text-[#B87552]" />
                <h2 className="text-lg font-bold text-[#30231E]">
                  Quick Actions
                </h2>
              </div>
            </div>

            <div className="space-y-3">
              <button
                type="button"
                className="flex w-full flex-col items-center justify-center gap-2 rounded-xl bg-[#30231E] p-4 text-white shadow-md transition-colors hover:bg-[#5C3A2E]"
              >
                <span className="flex items-center gap-2 font-bold">
                  <Plus size={18} />
                  Add New Product
                </span>

                <span className="text-center text-xs font-normal text-gray-200">
                  Create a product listing with photos and pricing
                </span>
              </button>

              <button
                type="button"
                className="flex w-full flex-col items-center justify-center gap-2 rounded-xl border border-[#E5E0D8] bg-white p-4 text-[#30231E] transition-colors hover:bg-[#F8F4ED]"
              >
                <span className="flex items-center gap-2 font-bold">
                  <Settings size={18} />
                  Manage My Products
                </span>

                <span className="text-center text-xs font-normal text-[#8B6248]">
                  Update inventory, pricing, and product details
                </span>
              </button>
            </div>
          </div>

          {/* Artisan Workflow */}
          <div className="rounded-2xl border border-[#F2E6E1] bg-white p-5 shadow-sm sm:p-6">
            <div className="mb-5 flex items-center gap-2">
              <BookOpen size={18} className="text-[#B87552]" />

              <h2 className="text-lg font-bold text-[#30231E]">
                Craftopia Artisan Workflow
              </h2>
            </div>

            <ol className="mb-5 space-y-4">
              {workflow.map((step, index) => (
                <li key={step.title} className="flex gap-3">
                  <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full border border-[#F2E6E1] bg-[#FDF1EC] text-xs font-bold text-[#B87552]">
                    {index + 1}
                  </span>

                  <div>
                    <p className="text-sm font-bold text-[#30231E]">
                      {step.title}
                    </p>

                    <p className="text-xs leading-relaxed text-[#8B6248]">
                      {step.description}
                    </p>
                  </div>
                </li>
              ))}
            </ol>

            <div className="flex gap-3 rounded-xl border border-[#F2E6E1] bg-[#FDF4F1] p-4">
              <div className="mt-0.5 text-[#B87552]">
                <Clock size={16} />
              </div>

              <p className="text-xs leading-relaxed text-[#5C3A2E]">
                <span className="font-bold">Tip:</span> Review new order
                requests regularly and respond to customers promptly.
              </p>
            </div>
          </div>
        </aside>
      </section>
    </div>
  );
};

export default ArtisanDashboard;