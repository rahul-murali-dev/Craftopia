const categories = [
  {
    id: 1,
    name: "Pottery & Ceramics",
    description: "Hand-thrown vessels and decorative pieces",
    count: "24 items",
    gradient: "from-amber-200 to-orange-300",
    icon: "🏺",
  },
  {
    id: 2,
    name: "Wooden Crafts",
    description: "Carved furniture and decorative woodwork",
    count: "18 items",
    gradient: "from-amber-700 to-amber-900",
    icon: "🪵",
  },
  {
    id: 3,
    name: "Handmade Jewellery",
    description: "Unique accessories crafted with care",
    count: "32 items",
    gradient: "from-rose-200 to-pink-300",
    icon: "💍",
  },
  {
    id: 4,
    name: "Handloom Products",
    description: "Traditional woven textiles and fabrics",
    count: "21 items",
    gradient: "from-yellow-100 to-amber-200",
    icon: "🧵",
  },
  {
    id: 5,
    name: "Home Accessories",
    description: "Decorative pieces for your living space",
    count: "15 items",
    gradient: "from-stone-200 to-stone-400",
    icon: "🏠",
  },
];

export default function CategorySection() {
  return (
    <section className="bg-[#F8F4ED] py-16 lg:py-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4 mb-12">
          <div>
            <span className="text-xs font-semibold tracking-[0.2em] uppercase text-[#B87552] mb-2 block">
              Browse by Category
            </span>
            <h2 className="font-serif text-3xl lg:text-4xl font-bold text-[#30231E]">
              Explore Handmade Creations
            </h2>
          </div>
          <p className="text-sm text-[#30231E]/60 max-w-md lg:text-right">
            From pottery to textiles, each craft is carefully curated through
            design and choice. Click to explore each category.
          </p>
        </div>

        {/* Category Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 lg:gap-6">
          {categories.map((cat) => (
            <a
              key={cat.id}
              href={`/category/${cat.id}`}
              className="group relative rounded-2xl overflow-hidden aspect-[3/4] bg-[#F5EDE4] hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
            >
              {/* Image Placeholder */}
              <div className={`absolute inset-0 bg-gradient-to-br ${cat.gradient} opacity-80 group-hover:opacity-90 transition-opacity`}>
                <div className="absolute inset-0 flex items-center justify-center text-5xl opacity-60">
                  {cat.icon}
                </div>
              </div>

              {/* Number Badge */}
              <div className="absolute top-3 right-3 w-7 h-7 rounded-full bg-[#F8F4ED]/90 flex items-center justify-center">
                <span className="text-xs font-bold text-[#30231E]">{cat.id}</span>
              </div>

              {/* Content */}
              <div className="absolute inset-x-0 bottom-0 p-4 bg-gradient-to-t from-[#30231E]/80 to-transparent">
                <h3 className="font-serif text-base font-semibold text-[#F8F4ED] mb-1">
                  {cat.name}
                </h3>
                <p className="text-xs text-[#F8F4ED]/80 leading-snug">
                  {cat.description}
                </p>
              </div>
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}