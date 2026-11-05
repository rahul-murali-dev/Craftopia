import Header from "../components/layout/Header";
import Footer from "../components/layout/Footer";
import HeroSection from "../features/home/HeroSection";
import CategorySection from "../features/home/CategorySection";
import FeaturedProductsSection from "../features/home/FeaturedProductsSection";
import ArtisanSection from "../features/home/ArtisanSection";
import HomeCTA from "../features/home/HomeCTA";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-[#F8F4ED]">
      <Header />

      <main>
        <HeroSection />
        <CategorySection />
        <FeaturedProductsSection />
        <ArtisanSection />
        <HomeCTA />
      </main>

      <Footer />
    </div>
  );
}