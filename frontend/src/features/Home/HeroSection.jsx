
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Clock } from "lucide-react";
import api from "../../config/axiosInstance";

export default function HeroSection() {
  const [heroImage, setHeroImage] = useState("");

  const [stats, setStats] = useState([
    { value: "—", label: "Verified Artisans" },
    { value: "—", label: "Handmade Products" },
    { value: "—", label: "Craft Categories" },
  ]);

  useEffect(() => {
    const fetchHomeStats = async () => {
      try {
        const response = await api.get("/auth/home-stats/");
        const data = response.data;

        setStats([
          {
            value: data.verified_artisans,
            label: "Verified Artisans",
          },
          {
            value: data.handmade_products,
            label: "Handmade Products",
          },
          {
            value: data.craft_categories,
            label: "Craft Categories",
          },
        ]);
      } catch (error) {
        console.error("Unable to load homepage stats:", error);
      }
    };

    fetchHomeStats();
  }, []);

  useEffect(() => {
    const fetchHeroImage = async () => {
      try {
        const response = await api.get("/products/products/");
        const products = response.data.results || [];

        // Prefer a pottery or clay product image
        const potteryProduct = products.find((product) => {
          const category = product.category?.name?.toLowerCase() || "";
          const name = product.name?.toLowerCase() || "";

          return (
            (category.includes("pottery") ||
              category.includes("clay") ||
              name.includes("pottery") ||
              name.includes("clay")) &&
            product.images?.length > 0
          );
        });

        // Fallback to another product with an image
        const selectedProduct =
          potteryProduct ||
          products.find((product) => product.images?.length > 0);

        if (selectedProduct) {
          const image = selectedProduct.images[0].image;

          const imageUrl = image.startsWith("http")
            ? image
            : `http://localhost:8000${image}`;

          setHeroImage(imageUrl);
        }
      } catch (error) {
        console.error("Unable to load hero image:", error);
      }
    };

    fetchHeroImage();
  }, []);

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
              <span className="italic text-[#B87552]">
                Living Story.
              </span>
            </h1>

            <p className="text-base lg:text-lg text-[#30231E]/70 leading-relaxed mb-8 max-w-lg">
              Discover authentic handmade goods crafted by skilled artisans.
              From pottery to textiles, each piece carries the warmth of human
              touch and centuries of tradition.
            </p>

            <div className="flex flex-wrap gap-3 mb-10">
              <Link
                to="/products"
                className="inline-flex items-center gap-2 px-6 py-3 bg-[#5C3A2E] text-[#F8F4ED] rounded-full text-sm font-medium hover:bg-[#30231E] transition-colors shadow-lg shadow-[#5C3A2E]/20"
              >
                Explore Handmade Crafts
                <ArrowRight size={16} />
              </Link>

              <Link
                to="/artisans"
                className="inline-flex items-center gap-2 px-6 py-3 border-2 border-[#5C3A2E]/30 text-[#30231E] rounded-full text-sm font-medium hover:border-[#5C3A2E] hover:bg-[#5C3A2E]/5 transition-colors"
              >
                Meet Our Artisans
              </Link>
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
                    <div className="text-xs text-[#30231E]/60">
                      {stat.label}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right Image */}
          <div className="order-1 lg:order-2 relative">
            <div className="relative rounded-3xl overflow-hidden aspect-[4/5] bg-[#F5EDE4]">

              {heroImage ? (
                <img
                  src={heroImage}
                  alt="Handmade pottery and clay crafts by Craftopia artisans"
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-[#8B6248]">
                  <div className="text-center">
                    <Clock size={48} className="mx-auto mb-3 opacity-50" />
                    <p className="text-sm">Discover Handmade Crafts</p>
                  </div>
                </div>
              )}

              {/* Featured Craft Card */}
              <div className="absolute bottom-6 left-6 right-6 bg-[#F8F4ED]/95 backdrop-blur-sm rounded-2xl p-4 shadow-xl">
                <div className="flex items-center gap-3">

                  <div className="w-12 h-12 rounded-xl bg-[#B87552]/20 flex items-center justify-center shrink-0">
                    <Clock className="w-6 h-6 text-[#B87552]" />
                  </div>

                  <div>
                    <p className="text-xs text-[#30231E]/60 font-medium">
                      Featured Craft
                    </p>
                    <p className="font-serif text-base font-semibold text-[#30231E]">
                      Pottery & Clay Craft
                    </p>
                  </div>

                  {/* Arrow Navigation */}
                  <Link
                    to="/products?search=pottery"
                    aria-label="Explore pottery and clay products"
                    title="Explore Pottery & Clay Crafts"
                    className="ml-auto w-10 h-10 rounded-full bg-[#5C3A2E] text-[#F8F4ED] flex items-center justify-center hover:bg-[#B87552] hover:scale-105 transition-all"
                  >
                    <ArrowRight size={20} />
                  </Link>

                </div>
              </div>
            </div>

            {/* Decorative Circles */}
            <div className="absolute -top-6 -right-6 w-24 h-24 rounded-full bg-[#B87552]/20 -z-10" />
            <div className="absolute -bottom-4 -left-4 w-16 h-16 rounded-full bg-[#8B6248]/20 -z-10" />
          </div>

        </div>
      </div>
    </section>
  );
}
