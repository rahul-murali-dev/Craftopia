const products = [
  {
    id: 1,
    name: "Handcrafted Terracotta Vase",
    artisan: "Priya Sharma",
    price: "₹850",
    rating: 4.8,
    reviews: 124,
    gradient: "from-orange-200 to-amber-300",
    icon: "🏺",
  },
  {
    id: 2,
    name: "Wooden Carved Decoration",
    artisan: "Rajesh Kumar",
    price: "₹1,200",
    rating: 4.9,
    reviews: 89,
    gradient: "from-amber-600 to-amber-800",
    icon: "",
  },
  {
    id: 3,
    name: "Handmade Beaded Necklace",
    artisan: "Meera Patel",
    price: "₹650",
    rating: 4.7,
    reviews: 203,
    gradient: "from-rose-200 to-pink-300",
    icon: "📿",
  },
  {
    id: 4,
    name: "Handwoven Cotton Table Runner",
    artisan: "Aarav Singh",
    price: "₹950",
    rating: 4.6,
    reviews: 67,
    gradient: "from-yellow-100 to-amber-200",
    icon: "🧶",
  },
];

function StarRating({ rating }) {
  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <svg
          key={star}
          className={`w-3.5 h-3.5 ${
            star <= Math.round(rating) ? "text-amber-400" : "text-[#30231E]/20"
          }`}
          fill="currentColor"
          viewBox="0 0 20 20"
        >
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      ))}
      <span className="text-xs text-[#30231E]/60 ml-1">{rating}</span>
    </div>
  );
}

export default function FeaturedProductsSection() {
  return (
    <section className="bg-[#F5EDE4] py-16 lg:py-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-12">
          <span className="text-xs font-semibold tracking-[0.2em] uppercase text-[#B87552] mb-2 block">
            Handpicked for You
          </span>
          <h2 className="font-serif text-3xl lg:text-4xl font-bold text-[#30231E] mb-3">
            Made by Hand, Loved by You
          </h2>
          <p className="text-sm text-[#30231E]/60 max-w-xl mx-auto">
            Each piece is crafted with love and care by our talented artisans.
            Browse our most popular handmade creations.
          </p>
        </div>

        {/* Product Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {products.map((product) => (
            <div
              key={product.id}
              className="group bg-[#F8F4ED] rounded-2xl overflow-hidden hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
            >
              {/* Image */}
              <div className={`relative aspect-square bg-gradient-to-br ${product.gradient}`}>
                <div className="absolute inset-0 flex items-center justify-center text-6xl opacity-70 group-hover:scale-110 transition-transform duration-500">
                  {product.icon}
                </div>
                <button className="absolute top-3 right-3 w-8 h-8 rounded-full bg-[#F8F4ED]/90 flex items-center justify-center hover:bg-[#F8F4ED] transition-colors">
                  <svg className="w-4 h-4 text-[#30231E]/60" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                  </svg>
                </button>
              </div>

              {/* Content */}
              <div className="p-4">
                <p className="text-xs text-[#8B6248] font-medium mb-1">
                  by {product.artisan}
                </p>
                <h3 className="font-serif text-base font-semibold text-[#30231E] mb-2 line-clamp-1">
                  {product.name}
                </h3>
                <StarRating rating={product.rating} />
                <div className="flex items-center justify-between mt-3 pt-3 border-t border-[#30231E]/10">
                  <span className="font-serif text-lg font-bold text-[#30231E]">
                    {product.price}
                  </span>
                  <button className="px-3 py-1.5 bg-[#5C3A2E] text-[#F8F4ED] text-xs font-medium rounded-full hover:bg-[#30231E] transition-colors">
                    Add to Cart
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* CTA Button */}
        <div className="text-center mt-12">
          <a
            href="/products"
            className="inline-flex items-center gap-2 px-6 py-3 border-2 border-[#5C3A2E] text-[#5C3A2E] rounded-full text-sm font-medium hover:bg-[#5C3A2E] hover:text-[#F8F4ED] transition-colors"
          >
            Explore All Products
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
            </svg>
          </a>
        </div>
      </div>
    </section>
  );
}