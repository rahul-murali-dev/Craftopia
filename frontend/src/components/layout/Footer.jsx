const footerLinks = {
  Marketplace: [
    { label: "All Crafts", href: "#" },
    { label: "New Arrivals", href: "#" },
    { label: "Best Sellers", href: "#" },
    { label: "Gift Ideas", href: "#" },
  ],
  Artisan: [
    { label: "Become an Artisan", href: "#" },
    { label: "Artisan Stories", href: "#" },
    { label: "Workshops", href: "#" },
    { label: "Community", href: "#" },
  ],
  Customer: [
    { label: "Help Center", href: "#" },
    { label: "Shipping Info", href: "#" },
    { label: "Returns", href: "#" },
    { label: "Track Order", href: "#" },
  ],
  Company: [
    { label: "About Us", href: "#" },
    { label: "Careers", href: "#" },
    { label: "Press", href: "#" },
    { label: "Contact", href: "#" },
  ],
};

export default function Footer() {
  return (
    <footer className="bg-[#30231E] text-[#F8F4ED]/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-10">
          {/* Brand Column */}
          <div className="lg:col-span-2">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-9 h-9 rounded-full bg-[#B87552] flex items-center justify-center">
                <svg className="w-5 h-5 text-[#F8F4ED]" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z" />
                </svg>
              </div>
              <span className="font-serif text-xl font-bold text-[#F8F4ED]">Craftopia</span>
            </div>
            <p className="text-sm leading-relaxed text-[#F8F4ED]/60 max-w-xs">
              Discover authentic handmade crafts from skilled artisans around the world. Every piece tells a story of tradition, passion, and craftsmanship.
            </p>
            <div className="flex gap-3 mt-6">
              {["facebook", "instagram", "twitter", "pinterest"].map((social) => (
                <a
                  key={social}
                  href="#"
                  aria-label={social}
                  className="w-9 h-9 rounded-full bg-[#F8F4ED]/10 flex items-center justify-center hover:bg-[#B87552] transition-colors"
                >
                  <span className="text-xs font-medium uppercase">{social[0]}</span>
                </a>
              ))}
            </div>
          </div>

          {/* Link Columns */}
          {Object.entries(footerLinks).map(([title, links]) => (
            <div key={title}>
              <h4 className="font-serif text-base font-semibold text-[#F8F4ED] mb-4">
                {title}
              </h4>
              <ul className="space-y-2.5">
                {links.map((link) => (
                  <li key={link.label}>
                    <a
                      href={link.href}
                      className="text-sm text-[#F8F4ED]/60 hover:text-[#B87552] transition-colors"
                    >
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom Bar */}
        <div className="mt-12 pt-8 border-t border-[#F8F4ED]/10 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-[#F8F4ED]/50">
            © 2026 Craftopia. All rights reserved. Handcrafted with ❤️
          </p>
          <div className="flex gap-6 text-xs text-[#F8F4ED]/50">
            <a href="#" className="hover:text-[#B87552] transition-colors">Privacy Policy</a>
            <a href="#" className="hover:text-[#B87552] transition-colors">Terms of Service</a>
            <a href="#" className="hover:text-[#B87552] transition-colors">Cookie Policy</a>
          </div>
        </div>
      </div>
    </footer>
  );
}