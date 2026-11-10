
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../../config/axiosInstance";

const gradients = [
  "from-amber-200 to-orange-300",
  "from-rose-200 to-pink-300",
  "from-amber-600 to-amber-800",
];

export default function ArtisanSection() {
  const [artisans, setArtisans] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchArtisans = async () => {
      try {
        const response = await api.get("/artisans/");
        setArtisans(response.data.slice(0, 3));
      } catch (error) {
        console.error("Error fetching artisans:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchArtisans();
  }, []);

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

          <div className="flex flex-col gap-3 lg:items-end">
            <p className="text-sm text-[#30231E]/60 max-w-md lg:text-right">
              Get to know the talented individuals who pour their heart and soul
              into every piece they create.
            </p>

            <Link
              to="/artisans"
              className="inline-flex items-center gap-2 text-sm font-semibold text-[#5C3A2E] hover:text-[#B87552] transition-colors"
            >
              View All Artisans
              <span>→</span>
            </Link>
          </div>
        </div>

        {/* Loading */}
        {loading && (
          <p className="text-center text-[#5C3A2E] py-10">
            Loading artisans...
          </p>
        )}

        {/* Artisan Grid */}
        {!loading && artisans.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {artisans.map((artisan, index) => (
              <div
                key={artisan.id}
                className="group bg-[#F5EDE4] rounded-2xl overflow-hidden hover:shadow-xl transition-all duration-300"
              >
                {/* Artisan Image */}
                <div
                  className={`relative aspect-[4/3] bg-gradient-to-br ${
                    gradients[index % gradients.length]
                  } overflow-hidden`}
                >
                  {artisan.profile_image ? (
                    <img
                      src={artisan.profile_image}
                      alt={artisan.business_name || artisan.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center text-7xl">
                      🧑‍🎨
                    </div>
                  )}
                </div>

                {/* Content */}
                <div className="p-6">
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div>
                      <h3 className="font-serif text-xl font-bold text-[#30231E]">
                        {artisan.name || artisan.business_name}
                      </h3>

                      <p className="text-sm text-[#B87552] font-medium">
                        {artisan.craft_type}
                      </p>
                    </div>

                    <span className="text-xs text-[#30231E]/50 bg-[#F8F4ED] px-2 py-1 rounded-full">
                      {artisan.address || "Kerala"}
                    </span>
                  </div>

                  <p className="text-sm text-[#30231E]/70 leading-relaxed mb-4 line-clamp-3">
                    {artisan.bio || "Discover the beautiful handmade creations of this artisan."}
                  </p>

                  <Link
                    to={`/artisans/${artisan.id}`}
                    className="inline-flex items-center gap-2 text-sm font-medium text-[#5C3A2E] hover:text-[#30231E] transition-colors"
                  >
                    View Profile

                    <svg
                      className="w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth={2}
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M17 8l4 4m0 0l-4 4m4-4H3"
                      />
                    </svg>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}

        {!loading && artisans.length === 0 && (
          <p className="text-center text-[#30231E]/60 py-10">
            No artisans available at the moment.
          </p>
        )}
      </div>
    </section>
  );
}
