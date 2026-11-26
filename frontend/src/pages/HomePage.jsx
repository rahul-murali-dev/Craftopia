import Header from "../components/layout/Header";
import Footer from "../components/layout/Footer";
import HeroSection from "../features/Home/HeroSection";
import CategorySection from "../features/Home/CategorySection";
import FeaturedProductsSection from "../features/Home/FeaturedProductsSection";
import ArtisanSection from "../features/Home/ArtisanSection";
import HomeCTA from "../features/Home/HomeCTA";

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