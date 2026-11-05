export default function HomeCTA() {
  return (
    <section className="bg-[#30231E] py-16 lg:py-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-[#5C3A2E] rounded-3xl p-8 lg:p-14 overflow-hidden relative">
          {/* Decorative circles */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-[#B87552]/20 rounded-full -translate-y-1/2 translate-x-1/2" />
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-[#8B6248]/20 rounded-full translate-y-1/2 -translate-x-1/2" />

          <div className="relative grid lg:grid-cols-2 gap-10 items-center">
            {/* Left Content */}
            <div>
              <span className="text-xs font-semibold tracking-[0.2em] uppercase text-[#F8F4ED]/70 mb-3 block">
                Find Your Perfect Craft
              </span>
              <h2 className="font-serif text-3xl lg:text-4xl font-bold text-[#F8F4ED] mb-4 leading-tight">
                Something Special in Mind?
              </h2>
              <p className="text-[#F8F4ED]/70 text-sm lg:text-base leading-relaxed mb-8 max-w-lg">
                Whether you're looking for a unique gift, home decor, or a
                personal treasure — our artisans have something special crafted
                just for you.
              </p>

              {/* Search Bar */}
              <div className="flex flex-col sm:flex-row gap-3 max-w-md">
                <div className="flex-1 relative">
                  <svg
                    className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#30231E]/50"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={2}
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                    />
                  </svg>
                  <input
                    type="text"
                    placeholder="Search for crafts, artisans..."
                    className="w-full pl-11 pr-4 py-3 rounded-full bg-[#F8F4ED] text-[#30231E] text-sm placeholder:text-[#30231E]/50 focus:outline-none focus:ring-2 focus:ring-[#B87552]"
                  />
                </div>
                <button className="px-6 py-3 bg-[#B87552] text-[#F8F4ED] rounded-full text-sm font-medium hover:bg-[#8B6248] transition-colors whitespace-nowrap">
                  Search Crafts
                </button>
              </div>
            </div>

            {/* Right Card */}
            <div className="flex justify-center lg:justify-end">
              <div className="bg-[#F8F4ED]/10 backdrop-blur-sm rounded-2xl p-6 lg:p-8 border border-[#F8F4ED]/20 max-w-xs w-full">
                <div className="w-14 h-14 rounded-full bg-[#B87552] flex items-center justify-center mb-4">
                  <svg className="w-7 h-7 text-[#F8F4ED]" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                  </svg>
                </div>
                <h3 className="font-serif text-lg font-semibold text-[#F8F4ED] mb-2">
                  Discover Our Categories
                </h3>
                <p className="text-sm text-[#F8F4ED]/70 leading-relaxed mb-4">
                  Explore 15+ craft categories from pottery and textiles to
                  jewellery and woodwork.
                </p>
                <a
                  href="/explore"
                  className="inline-flex items-center gap-2 text-sm font-medium text-[#B87552] hover:text-[#F8F4ED] transition-colors"
                >
                  Browse Categories
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
                  </svg>
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}