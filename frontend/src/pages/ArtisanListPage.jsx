
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { MapPin, ArrowRight } from "lucide-react";
import Header from "../components/layout/Header";
import Footer from "../components/layout/Footer";
import api from "../config/axiosInstance";

export default function ArtisanListPage() {
  const [artisans, setArtisans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchArtisans = async () => {
      try {
        setLoading(true);
        setError("");

        const response = await api.get("/artisans/");
        setArtisans(response.data);
      } catch (err) {
        console.error("Error fetching artisans:", err);
        setError("Unable to load artisans. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    fetchArtisans();
  }, []);

  return (
    <div className="min-h-screen bg-[#F8F4ED]">
      <Header />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        {/* Page Heading */}
        <div className="text-center mb-12">
          <p className="text-[#B87552] uppercase tracking-[0.2em] text-sm font-semibold mb-3">
            Meet the Makers
          </p>

          <h1 className="text-3xl md:text-4xl font-serif font-bold text-[#30231E] mb-4">
            Our Artisans
          </h1>

          <p className="text-[#8B6248] max-w-2xl mx-auto">
            Discover the talented artisans behind our handmade collections.
            Every creation tells a unique story.
          </p>
        </div>

        {/* Loading */}
        {loading && (
          <div className="text-center py-16 text-[#8B6248]">
            Loading artisans...
          </div>
        )}

        {/* Error */}
        {!loading && error && (
          <div className="text-center py-16">
            <p className="text-red-600 mb-4">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="bg-[#5C3A2E] text-white px-6 py-2 rounded-md"
            >
              Try Again
            </button>
          </div>
        )}

        {/* Empty State */}
        {!loading && !error && artisans.length === 0 && (
          <div className="text-center py-16">
            <p className="text-[#8B6248] text-lg">
              No approved artisans available at the moment.
            </p>
          </div>
        )}

        {/* Artisan Cards */}
        {!loading && !error && artisans.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {artisans.map((artisan) => (
              <div
                key={artisan.id}
                className="bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-lg transition duration-300"
              >
                {/* Profile Image */}
                <div className="h-64 bg-[#E8DDD2] overflow-hidden">
                  {artisan.profile_image ? (
                    <img
                      src={artisan.profile_image}
                      alt={artisan.name || artisan.business_name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-6xl text-[#8B6248]">
                      🧑‍🎨
                    </div>
                  )}
                </div>

                {/* Artisan Details */}
                <div className="p-6">
                  <h2 className="text-xl font-serif font-semibold text-[#30231E] mb-2">
                    {artisan.name || artisan.business_name || "Artisan"}
                  </h2>

                  <p className="text-[#B87552] font-medium mb-3">
                    {artisan.craft_type}
                  </p>

                  {artisan.address && (
                    <p className="flex items-center gap-2 text-sm text-[#8B6248] mb-4">
                      <MapPin size={16} />
                      {artisan.address}
                    </p>
                  )}

                  <Link
                    to={`/artisans/${artisan.id}`}
                    className="inline-flex items-center gap-2 text-[#5C3A2E] font-semibold hover:text-[#B87552] transition"
                  >
                    View Profile
                    <ArrowRight size={16} />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
