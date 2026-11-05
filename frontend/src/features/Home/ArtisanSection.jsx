const artisans = [
  {
    id: 1,
    name: "Aarav",
    craft: "Pottery & Clay",
    location: "kerala,kollam",
    description:
      "Third-generation potter specializing in traditional blue pottery techniques passed down through centuries.",
    gradient: "from-amber-200 to-orange-300",
    icon: "",
  },
  {
    id: 2,
    name: "Priya",
    craft: "Textile Weaving",
    location: "kerala,thrissur",
    description:
      "Master weaver creating intricate Banarasi silk sarees using traditional handloom techniques.",
    gradient: "from-rose-200 to-pink-300",
    icon: "🧵",
  },
  {
    id: 3,
    name: "Meera",
    craft: "Wood Carving",
    location: "kerala,malappuram",
    description:
      "Skilled woodcarver crafting detailed sandalwood sculptures and decorative home accessories.",
    gradient: "from-amber-600 to-amber-800",
    icon: "🪵",
  },
];

export default function ArtisanSection() {
  return (
    <section className="bg-[#F8F4ED] py-16 lg:py-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4 mb-12">
          <div>
            <span className="text-xs font-semibold tracking-[0.2em] uppercase text-[#B87552] mb-2 block">
              Our Artisans
            </span>
            <h2 className="font-serif text-3xl lg:text-4xl font-bold text-[#30231E]">
              Meet the Hands Behind the Craft
            </h2>
          </div>
          <p className="text-sm text-[#30231E]/60 max-w-md lg:text-right">
            Get to know the talented individuals who pour their heart and soul
            into every piece they create.
          </p>
        </div>

        {/* Artisan Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {artisans.map((artisan) => (
            <div
              key={artisan.id}
              className="group bg-[#F5EDE4] rounded-2xl overflow-hidden hover:shadow-xl transition-all duration-300"
            >
              {/* Image */}
              <div className={`relative aspect-[4/3] bg-gradient-to-br ${artisan.gradient}`}>
                <div className="absolute inset-0 flex items-center justify-center text-7xl opacity-60 group-hover:scale-105 transition-transform duration-500">
                  {artisan.icon}
                </div>
              </div>

              {/* Content */}
              <div className="p-6">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h3 className="font-serif text-xl font-bold text-[#30231E]">
                      {artisan.name}
                    </h3>
                    <p className="text-sm text-[#B87552] font-medium">
                      {artisan.craft}
                    </p>
                  </div>
                  <span className="text-xs text-[#30231E]/50 bg-[#F8F4ED] px-2 py-1 rounded-full">
                    {artisan.location}
                  </span>
                </div>
                <p className="text-sm text-[#30231E]/70 leading-relaxed mb-4">
                  {artisan.description}
                </p>
                <button className="inline-flex items-center gap-2 text-sm font-medium text-[#5C3A2E] hover:text-[#30231E] transition-colors">
                  View Profile
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
                  </svg>
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}