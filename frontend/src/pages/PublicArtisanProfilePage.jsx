
import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { MapPin, ArrowLeft, ShoppingBag } from "lucide-react";
import Header from "../components/layout/Header";
import Footer from "../components/layout/Footer";
import api from "../config/axiosInstance";

const formatPrice = (price) =>
  Number(price).toLocaleString("en-IN", {
    maximumFractionDigits: 2,
  });

export default function PublicArtisanProfilePage() {
  const { id } = useParams();

  const [artisan, setArtisan] = useState(null);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchArtisanData = async () => {
      try {
        setLoading(true);
        setError("");

        const [artisanResponse, productsResponse] = await Promise.all([
          api.get(`/artisans/${id}/`),
          api.get(`/products/products/?artisan_id=${id}`),
        ]);

        setArtisan(artisanResponse.data);
        setProducts(productsResponse.data.results || []);
      } catch (err) {
        console.error("Error fetching artisan data:", err);

        setError(
          err.response?.status === 404
            ? "Artisan profile not found."
            : "Unable to load artisan profile. Please try again."
        );
      } finally {
        setLoading(false);
      }
    };

    fetchArtisanData();
  }, [id]);

  return (
    <div className="min-h-screen bg-[#F8F4ED]">
      <Header />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <Link
          to="/home"
          className="inline-flex items-center gap-2 text-sm text-[#5C3A2E] hover:text-[#B87552] mb-8"
        >
          <ArrowLeft size={18} />
          Back to Home
        </Link>

        {loading && (
          <p className="text-center py-20 text-[#5C3A2E]">
            Loading artisan profile...
          </p>
        )}

        {!loading && error && (
          <div className="text-center py-20">
            <p className="text-lg text-red-700 mb-4">{error}</p>
            <Link
              to="/home"
              className="text-[#5C3A2E] font-semibold hover:text-[#B87552]"
            >
              Return to Home
            </Link>
          </div>
        )}

        {!loading && artisan && (
          <>
            {/* Artisan Profile */}
            <div className="bg-white rounded-2xl overflow-hidden shadow-sm">
              <div className="grid grid-cols-1 md:grid-cols-2">
                <div className="bg-[#F5EDE4] min-h-[320px] md:min-h-[480px]">
                  {artisan.profile_image ? (
                    <img
                      src={artisan.profile_image}
                      alt={artisan.name || "Artisan"}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full min-h-[320px] flex items-center justify-center text-8xl">
                      🧑‍🎨
                    </div>
                  )}
                </div>

                <div className="p-8 lg:p-12 flex flex-col justify-center">
                  <span className="text-xs font-semibold tracking-[0.2em] uppercase text-[#B87552] mb-3">
                    Meet Our Artisan
                  </span>

                  <h1 className="font-serif text-3xl lg:text-4xl font-bold text-[#30231E] mb-3">
                    {artisan.name || "Artisan"}
                  </h1>

                  <p className="text-lg text-[#B87552] font-medium mb-5">
                    {artisan.craft_type}
                  </p>

                  {artisan.location && (
                    <div className="flex items-center gap-2 text-sm text-[#30231E]/60 mb-6">
                      <MapPin size={18} />
                      {artisan.location}
                    </div>
                  )}

                  <div className="border-t border-[#E8DED3] pt-6">
                    <h2 className="font-serif text-xl font-semibold text-[#30231E] mb-3">
                      About the Artisan
                    </h2>

                    <p className="text-[#30231E]/70 leading-7 whitespace-pre-line">
                      {artisan.bio || "No artisan description available yet."}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Artisan Products */}
            <section className="mt-16">
              <div className="flex items-center gap-3 mb-8">
                <ShoppingBag className="text-[#B87552]" size={24} />

                <div>
                  <h2 className="font-serif text-2xl lg:text-3xl font-bold text-[#30231E]">
                    Products by {artisan.name || "this Artisan"}
                  </h2>

                  <p className="text-sm text-[#30231E]/60 mt-1">
                    Explore handmade creations by this artisan
                  </p>
                </div>
              </div>

              {products.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {products.map((product) => (
                    <div
                      key={product.id}
                      className="bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300 group"
                    >
                      <Link to={`/products/${product.id}`}>
                        <div className="aspect-[4/3] bg-[#F5EDE4] overflow-hidden">
                          {product.images?.[0]?.image ? (
                            <img
                              src={product.images[0].image}
                              alt={product.name}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-5xl">
                              🎨
                            </div>
                          )}
                        </div>
                      </Link>

                      <div className="p-5">
                        <p className="text-xs text-[#B87552] font-medium mb-2">
                          {product.category?.name}
                        </p>

                        <Link to={`/products/${product.id}`}>
                          <h3 className="font-serif text-lg font-bold text-[#30231E] hover:text-[#B87552] transition-colors">
                            {product.name}
                          </h3>
                        </Link>

                        <div className="flex items-center gap-2 mt-3">
                          <span className="text-lg font-semibold text-[#5C3A2E]">
                            ₹{formatPrice(
                              product.discount_price &&
                              Number(product.discount_price) < Number(product.price)
                                ? product.discount_price
                                : product.price
                            )}
                          </span>

                          {product.discount_price &&
                            Number(product.discount_price) < Number(product.price) && (
                              <span className="text-sm text-gray-400 line-through">
                                ₹{formatPrice(product.price)}
                              </span>
                            )}
                        </div>

                        <Link
                          to={`/products/${product.id}`}
                          className="mt-4 inline-flex items-center justify-center w-full py-2.5 rounded-lg bg-[#5C3A2E] text-white text-sm font-medium hover:bg-[#30231E] transition-colors"
                        >
                          View Product
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="bg-white rounded-xl p-10 text-center">
                  <p className="text-[#30231E]/60">
                    This artisan has not published any products yet.
                  </p>
                </div>
              )}
            </section>
          </>
        )}
      </main>

      <Footer />
    </div>
  );
}
