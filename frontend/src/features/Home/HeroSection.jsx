import heroImg from "../../assets/hero.png";

export default function HeroSection() {
  const stats = [
    { value: "120+", label: "Verified Artisans" },
    { value: "500+", label: "Handmade Products" },
    { value: "15+", label: "Craft Categories" },
  ];

  return (
    <section className="bg-[#FDF8F0] overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-20">
        <div className="grid lg:grid-cols-2 gap-10 lg:gap-16 items-center">
          {/* Left Content */}
          <div className="order-2 lg:order-1">
            <span className="inline-block text-xs font-semibold tracking-[0.2em] uppercase text-[#B87552] mb-4">
              Discover Handmade · Crafted with Soul
            </span>
            <h1 className="font-serif text-4xl sm:text-5xl lg:text-6xl font-bold text-[#30231E] leading-[1.1] mb-6">
              Every Craft Has a{" "}
              <span className="italic text-[#B87552]">Living Story.</span>
            </h1>
            <p className="text-base lg:text-lg text-[#30231E]/70 leading-relaxed mb-8 max-w-lg">
              Discover authentic handmade goods crafted by skilled artisans.
              From pottery to textiles, each piece carries the warmth of human
              touch and centuries of tradition.
            </p>

            <div className="flex flex-wrap gap-3 mb-10">
              <a
                href="/explore"
                className="inline-flex items-center gap-2 px-6 py-3 bg-[#5C3A2E] text-[#F8F4ED] rounded-full text-sm font-medium hover:bg-[#30231E] transition-colors shadow-lg shadow-[#5C3A2E]/20"
              >
                Explore Handmade Crafts
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </a>
              <a
                href="/artisans"
                className="inline-flex items-center gap-2 px-6 py-3 border-2 border-[#5C3A2E]/30 text-[#30231E] rounded-full text-sm font-medium hover:border-[#5C3A2E] hover:bg-[#5C3A2E]/5 transition-colors"
              >
                Meet Our Artisans
              </a>
            </div>

            {/* Stats */}
            <div className="flex flex-wrap gap-6 lg:gap-10">
              {stats.map((stat) => (
                <div key={stat.label} className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full bg-[#B87552]" />
                  <div>
                    <div className="font-serif text-xl lg:text-2xl font-bold text-[#30231E]">
                      {stat.value}
                    </div>
                    <div className="text-xs text-[#30231E]/60">{stat.label}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right Image */}
          <div className="order-1 lg:order-2 relative">
            <div className="relative rounded-3xl overflow-hidden aspect-[4/5] bg-[#F5EDE4]">
              <img
                src={heroImg}
                alt="Artisan crafting pottery"
                className="w-full h-full object-cover"
              />

              {/* Decorative Badge */}
              <div className="absolute bottom-6 left-6 right-6 bg-[#F8F4ED]/95 backdrop-blur-sm rounded-2xl p-4 shadow-xl">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-[#B87552]/20 flex items-center justify-center shrink-0">
                    <svg className="w-6 h-6 text-[#B87552]" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-xs text-[#30231E]/60 font-medium">Featured Craft</p>
                    <p className="font-serif text-base font-semibold text-[#30231E]">Pottery & Clay Craft</p>
                  </div>
                  <button className="ml-auto w-8 h-8 rounded-full bg-[#5C3A2E] text-[#F8F4ED] flex items-center justify-center hover:bg-[#30231E] transition-colors">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>

            {/* Decorative circles */}
            <div className="absolute -top-6 -right-6 w-24 h-24 rounded-full bg-[#B87552]/20 -z-10" />
            <div className="absolute -bottom-4 -left-4 w-16 h-16 rounded-full bg-[#8B6248]/20 -z-10" />
          </div>
        </div>
      </div>
    </section>
  );
}