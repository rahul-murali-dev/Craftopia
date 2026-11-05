import { useNavigate } from 'react-router-dom';
import { LogOut } from 'lucide-react';
import ArtisanDashboard from '../features/artisan/ArtisanDashboard';

const ArtisanDashboardPage = () => {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem('access');
    localStorage.removeItem('refresh');
    navigate('/login');
  };

  return (
    <div className="flex min-h-screen flex-col bg-[#F8F4ED] font-sans text-[#30231E]">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-[#E5E0D8] bg-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex min-h-20 flex-wrap items-center justify-between gap-4 py-3">
            {/* Logo */}
            <div className="flex items-center gap-3">
              <h1 className="font-serif text-2xl font-bold tracking-tight text-[#30231E]">
                Craftopia
              </h1>

              <span className="rounded-full bg-[#B87552] px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-white">
                Artisan Studio
              </span>
            </div>

            {/* Navigation */}
            <nav className="hidden items-center space-x-1 md:flex">
              <span className="rounded-full bg-[#30231E] px-4 py-2 text-sm font-medium text-white">
                Dashboard
              </span>

              <span className="cursor-default rounded-full px-4 py-2 text-sm font-medium text-[#5C3A2E]">
                My Products
              </span>

              <span className="cursor-default rounded-full px-4 py-2 text-sm font-medium text-[#5C3A2E]">
                Order Requests
              </span>

              <button
              type="button"
              onClick={() => navigate('/artisan/profile')}
              className="rounded-full px-4 py-2 text-sm font-medium text-[#5C3A2E] transition-colors hover:bg-[#F8F4ED]"
                               >
                     Profile
               </button>
            </nav>

            {/* Artisan Profile and Logout */}
            <div className="flex items-center gap-3 sm:gap-4 md:border-l md:border-[#E5E0D8] md:pl-5">
              <div className="hidden text-right sm:block">
                <p className="text-sm font-bold leading-tight text-[#30231E]">
                  Artisan
                </p>
                <p className="text-xs text-[#8B6248]">
                  Craftopia Studio
                </p>
              </div>

              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#5C3A2E] font-serif text-lg text-white">
                A
              </div>

              <button
                type="button"
                onClick={handleLogout}
                className="flex items-center gap-2 rounded-lg bg-[#FDE8E0] px-3 py-2 text-sm font-medium text-[#5C3A2E] transition-colors hover:bg-[#FAD5C5]"
              >
                <LogOut size={16} />
                <span>Logout</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="mx-auto w-full max-w-7xl flex-grow px-4 py-8 sm:px-6 lg:px-8">
        <ArtisanDashboard />
      </main>

      {/* Footer */}
      <footer className="mt-auto border-t border-[#E5E0D8] bg-[#FDF1EC] py-8 sm:py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-8 flex flex-col items-start justify-between gap-6 md:flex-row md:items-center">
            <p className="max-w-md text-sm italic text-[#8B6248]">
              Honoring the patience, handcraft, and heritage of dedicated
              master makers worldwide.
            </p>

            <div className="flex flex-col items-start gap-4 md:items-end">
              <span className="font-serif text-xl font-bold text-[#30231E]">
                Craftopia
              </span>

              <div className="flex flex-wrap gap-x-6 gap-y-3 text-xs font-medium text-[#5C3A2E]">
                <span>Artisan Guidelines</span>
                <span>Provenance Standards</span>
                <span>Studio Support</span>
                <span>Dispatch Logistics</span>
              </div>
            </div>
          </div>

          <div className="flex flex-col items-center justify-between gap-3 border-t border-[#E5E0D8] pt-6 text-center text-xs text-[#8B6248] md:flex-row md:text-left">
            <p>
              © {new Date().getFullYear()} Craftopia. All rights reserved.
            </p>

            <p className="text-[10px] font-semibold uppercase tracking-widest">
              Crafted with Patience • Handled with Reverence
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default ArtisanDashboardPage;