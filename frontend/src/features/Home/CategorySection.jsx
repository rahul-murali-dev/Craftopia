
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../../config/axiosInstance";
import { getImageUrl } from "../../config/media";

const gradients = [
  "from-amber-200 to-orange-300",
  "from-amber-700 to-amber-900",
  "from-rose-200 to-pink-300",
  "from-yellow-100 to-amber-200",
  "from-stone-200 to-stone-400",
];

export default function CategorySection() {
  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCategoryData = async () => {
      try {
        const [categoryResponse, productResponse] = await Promise.all([
          api.get("/products/public/categories/"),
          api.get("/products/products/", {
            params: {
              page: 1,
              ordering: "-created_at",
            },
          }),
        ]);

        setCategories(categoryResponse.data || []);
        setProducts(productResponse.data.results || []);
      } catch (error) {
        console.error("Category section fetch error:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchCategoryData();
  }, []);

  const getCategoryImage = (categoryId) => {
    const product = products.find(
      (item) => item.category?.id === categoryId && item.images?.[0]?.image
    );

    return product?.images?.[0]?.image || null;
  };

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

        {/* Loading */}
        {loading && (
          <div className="text-center py-12 text-[#8B6248]">
            Loading categories...
          </div>
        )}

        {/* Category Grid */}
        {!loading && categories.length > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 lg:gap-6">
            {categories.map((cat, index) => {
              const image = getCategoryImage(cat.id);

              return (
                <Link
                  key={cat.id}
                  to={`/products?category=${cat.id}`}
                  className="group relative rounded-2xl overflow-hidden aspect-[3/4] bg-[#F5EDE4] hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
                >
                  {/* Category Image */}
                  {image ? (
                    <img
                      src={getImageUrl(image)}
                      alt={cat.name}
                      className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  ) : (
                    <div
                      className={`absolute inset-0 bg-gradient-to-br ${
                        gradients[index % gradients.length]
                      }`}
                    />
                  )}

                  {/* Image Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-[#30231E]/85 via-[#30231E]/10 to-transparent" />

                  {/* Number Badge */}
                  <div className="absolute top-3 right-3 w-7 h-7 rounded-full bg-[#F8F4ED]/90 flex items-center justify-center">
                    <span className="text-xs font-bold text-[#30231E]">
                      {index + 1}
                    </span>
                  </div>

                  {/* Content */}
                  <div className="absolute inset-x-0 bottom-0 p-4">
                    <h3 className="font-serif text-base font-semibold text-[#F8F4ED] mb-1">
                      {cat.name}
                    </h3>

                    <p className="text-xs text-[#F8F4ED]/80 leading-snug">
                      {cat.description || "Explore handmade creations"}
                    </p>
                  </div>
                </Link>
              );
            })}
          </div>
        )}

        {!loading && categories.length === 0 && (
          <p className="text-center py-12 text-[#30231E]/60">
            No categories available.
          </p>
        )}
      </div>
    </section>
  );
}
