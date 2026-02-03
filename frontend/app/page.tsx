import Navbar from '@/components/Navbar'
import HeroSection from '@/components/HeroSection'
import FeatureShowcase from '@/components/FeatureShowcase'
import PricingCards from '@/components/PricingCards'
import FAQ from '@/components/FAQ'
import Footer from '@/components/Footer'

export default function Home() {
  return (
    <main className="min-h-screen">
      <Navbar />
      <HeroSection />
      <FeatureShowcase />
      <PricingCards />
      <FAQ />
      <Footer />
    </main>
  )
}
