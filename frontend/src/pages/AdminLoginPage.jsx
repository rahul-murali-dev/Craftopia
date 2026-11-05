
import React from 'react';
import AdminLoginForm from '../features/admin/AdminLoginForm';

const AdminLoginPage = () => {
  return (
    <div className="min-h-screen bg-[#F8F4ED] flex items-center justify-center px-4 py-10">

      <div className="w-full max-w-5xl grid md:grid-cols-2 bg-white rounded-2xl shadow-xl overflow-hidden">

        {/* Left Side - Branding */}
        <div className="hidden md:flex flex-col justify-center items-center bg-[#5C3A2E] text-white p-12 text-center">

          <div className="w-20 h-20 rounded-full border border-[#B87552] flex items-center justify-center mb-6">
            <span className="text-4xl font-serif">C</span>
          </div>

          <h1 className="text-4xl font-serif font-bold tracking-wide">
            CRAFTOPIA
          </h1>

          <p className="text-[#E8D8CC] text-sm mt-4 tracking-wider">
            ADMINISTRATION PORTAL
          </p>

          <div className="w-16 h-1 bg-[#B87552] my-8 rounded-full" />

          <h2 className="text-2xl font-serif font-semibold">
            Handmade with Love,
            <br />
            Made to Last.
          </h2>

          <p className="text-sm text-[#E8D8CC] mt-5 leading-7">
            Manage your marketplace, support artisans,
            and create a better shopping experience.
          </p>

        </div>

        {/* Right Side - Login Form */}
        <div className="flex items-center justify-center p-7 sm:p-12">

          <div className="w-full max-w-md">

            {/* Mobile Logo */}
            <div className="md:hidden text-center mb-8">
              <h1 className="text-3xl font-serif font-bold text-[#5C3A2E]">
                CRAFTOPIA
              </h1>

              <p className="text-xs text-gray-500 tracking-widest mt-2">
                ADMINISTRATION PORTAL
              </p>
            </div>

            <AdminLoginForm />

            <p className="text-center text-xs text-gray-400 mt-8">
              © {new Date().getFullYear()} Craftopia. All rights reserved.
            </p>

          </div>

        </div>

      </div>

    </div>
  );
};

export default AdminLoginPage;
