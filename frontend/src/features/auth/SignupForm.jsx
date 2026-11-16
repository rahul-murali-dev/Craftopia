
import React, { useState } from 'react';
import {
  User,
  Mail,
  Lock,
  ArrowRight,
  ShieldCheck,
  Store,
  Phone,
} from 'lucide-react';

import FormInput from '../../components/ui/FormInput';
import CustomAlert from '../../components/ui/CustomAlert';
import api from '../../config/axiosInstance';
import { useNavigate } from 'react-router-dom';

const SignupForm = () => {
  const navigate = useNavigate();

  const [accountType, setAccountType] = useState('Customer');

  const [formData, setFormData] = useState({
    username: '',
    first_name: '',
    last_name: '',
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    craft_type: '',
    phone: '',
  });

  const [loading, setLoading] = useState(false);

  const [popup, setPopup] = useState({
    isOpen: false,
    type: 'info',
    title: '',
    message: '',
    onConfirm: null,
  });

  const showPopup = (type, title, message, onConfirm = null) => {
    setPopup({
      isOpen: true,
      type,
      title,
      message,
      onConfirm,
    });
  };

  const closePopup = () => {
    setPopup({
      isOpen: false,
      type: 'info',
      title: '',
      message: '',
      onConfirm: null,
    });
  };

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // Name validation
  const validateName = (name) => {
    const trimmedName = name.trim();

    const namePattern = /^\p{L}+(?:\s+\p{L}+)*$/u;

    if (trimmedName.length < 2) {
      return 'Name must contain at least 2 characters.';
    }

    if (!namePattern.test(trimmedName)) {
      return 'Name can contain only letters and spaces.';
    }

    return '';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Customer name validation
    if (accountType === 'Customer') {
      const firstNameError = validateName(formData.first_name);

      if (firstNameError) {
        showPopup(
          'error',
          'Invalid First Name',
          firstNameError
        );
        return;
      }

      if (formData.last_name.trim()) {
        const lastNameError = validateName(formData.last_name);

        if (lastNameError) {
          showPopup(
            'error',
            'Invalid Last Name',
            lastNameError
          );
          return;
        }
      }
    }

    // Artisan name validation
    if (accountType === 'Artisan') {
      const artisanNameError = validateName(formData.name);

      if (artisanNameError) {
        showPopup(
          'error',
          'Invalid Full Name',
          artisanNameError
        );
        return;
      }
    }

    // Password validation
    if (formData.password !== formData.confirmPassword) {
      showPopup(
        'error',
        'Password Mismatch',
        'Passwords do not match.'
      );
      return;
    }

    if (formData.password.length < 8) {
      showPopup(
        'error',
        'Weak Password',
        'Password must contain at least 8 characters.'
      );
      return;
    }

    if (loading) return;

    setLoading(true);

    try {
      let response;

      if (accountType === 'Artisan') {
        response = await api.post('/artisans/register/', {
          name: formData.name.trim(),
          email: formData.email.trim(),
          password: formData.password,
          craft_type: formData.craft_type.trim(),
          phone: formData.phone.trim(),
        });

        if (response.status === 201) {
          showPopup(
            'success',
            'Registration Successful',
            'Artisan registration successful. Please verify your email.',
            () => {
              navigate('/verify-otp', {
                state: {
                  email: formData.email.trim(),
                  accountType: 'Artisan',
                },
              });
            }
          );
        }
      } else {
        response = await api.post('/auth/register/', {
          username: formData.username.trim(),
          email: formData.email.trim(),
          password: formData.password,
          first_name: formData.first_name.trim(),
          last_name: formData.last_name.trim(),
        });

        showPopup(
          'success',
          'Registration Successful',
          'Registration successful. Please verify your email.',
          () => {
            navigate('/verify-otp', {
              state: {
                email: formData.email.trim(),
                accountType: 'Customer',
              },
            });
          }
        );
      }
    } catch (err) {
      const data = err.response?.data;

      if (data && typeof data === 'object') {
        const messages = Object.entries(data)
          .map(([field, value]) => {
            const message = Array.isArray(value)
              ? value.join(' ')
              : typeof value === 'string'
                ? value
                : JSON.stringify(value);

            return `${field}: ${message}`;
          })
          .join(' ');

        showPopup(
          'error',
          'Registration Failed',
          messages || 'Registration failed. Please try again.'
        );
      } else {
        showPopup(
          'error',
          'Connection Error',
          'Unable to connect to the server. Please try again.'
        );
      }

      console.error('Registration error:', data || err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="w-full max-w-md bg-white rounded-lg shadow-xl p-8 border border-gray-100">

        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-lg bg-[#FDFBF9] border border-[#E5E0D8] mb-4">
            <div className="text-[#8C4632] font-bold text-xl">📦</div>
          </div>

          <div className="inline-block px-3 py-1 rounded-full bg-[#F3E8E0] text-[#8C4632] text-[10px] font-bold tracking-wider mb-4 uppercase">
            <span className="mr-1">●</span>
            Provenance Certified
          </div>

          <h2 className="text-2xl font-serif font-bold text-gray-900 mb-2">
            Create Your Account
          </h2>

          <p className="text-sm text-gray-500 leading-relaxed px-4">
            Join Craftopia and discover beautiful handmade products crafted
            across God's Own Country.
          </p>
        </div>

        {/* Account Type */}
        <div className="mb-6">
          <label className="text-xs font-bold text-gray-700 uppercase tracking-wider mb-3 block">
            Register As
          </label>

          <div className="flex p-1 bg-[#F3E8E0] rounded-lg">
            {[
              { id: 'Customer', icon: User },
              { id: 'Artisan', icon: Store },
            ].map((type) => (
              <button
                key={type.id}
                type="button"
                onClick={() => setAccountType(type.id)}
                className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-md text-sm font-medium transition-all ${
                  accountType === type.id
                    ? 'bg-[#5C4033] text-white shadow-sm'
                    : 'text-[#5C4033] hover:bg-white/50'
                }`}
              >
                <type.icon size={15} />
                {type.id}
              </button>
            ))}
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">

          {accountType === 'Customer' ? (
            <>
              <FormInput
                label="Username"
                name="username"
                type="text"
                placeholder="Choose a username"
                icon={User}
                value={formData.username}
                onChange={handleChange}
              />

              <FormInput
                label="First Name"
                name="first_name"
                type="text"
                placeholder="Enter your first name"
                icon={User}
                value={formData.first_name}
                onChange={handleChange}
              />

              <FormInput
                label="Last Name"
                name="last_name"
                type="text"
                placeholder="Enter your last name"
                icon={User}
                value={formData.last_name}
                onChange={handleChange}
              />
            </>
          ) : (
            <>
              <FormInput
                label="Full Name"
                name="name"
                type="text"
                placeholder="Enter your full name"
                icon={User}
                value={formData.name}
                onChange={handleChange}
              />

              <FormInput
                label="Craft Type"
                name="craft_type"
                type="text"
                placeholder="e.g. Handmade Pottery"
                icon={Store}
                value={formData.craft_type}
                onChange={handleChange}
              />

              <FormInput
                label="Phone Number"
                name="phone"
                type="tel"
                placeholder="Enter your phone number"
                icon={Phone}
                value={formData.phone}
                onChange={handleChange}
              />
            </>
          )}

          <FormInput
            label="Email Address"
            name="email"
            type="email"
            placeholder="you@example.com"
            icon={Mail}
            value={formData.email}
            onChange={handleChange}
          />

          <FormInput
            label="Password"
            name="password"
            type="password"
            placeholder="Create a password (min. 8 characters)"
            icon={Lock}
            value={formData.password}
            onChange={handleChange}
          />

          <FormInput
            label="Confirm Password"
            name="confirmPassword"
            type="password"
            placeholder="Re-enter your password"
            icon={Lock}
            value={formData.confirmPassword}
            onChange={handleChange}
          />

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#8C4632] hover:bg-[#7a3d2c] text-white font-medium py-3 rounded-md transition-colors flex items-center justify-center gap-2 mt-2 shadow-sm disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {loading
              ? 'Creating...'
              : accountType === 'Artisan'
                ? 'Register as Artisan'
                : 'Create Customer Account'}

            <ArrowRight size={18} />
          </button>
        </form>

        {/* Trust Badges */}
        <div className="mt-6 p-3 bg-[#FDFBF9] rounded-md border border-[#F3E8E0] flex items-center justify-center gap-4 text-xs text-gray-600">
          <div className="flex items-center gap-1">
            <ShieldCheck size={14} className="text-[#8C4632]" />
            Secure Registration
          </div>

          <span className="text-[#8C4632]">•</span>

          <div className="flex items-center gap-1">
            <Store size={14} className="text-[#8C4632]" />
            Handmade with Love
          </div>
        </div>

        {/* Login Link */}
        <div className="mt-6 text-center text-sm text-gray-600">
          Already have an account?{' '}
          <button
            type="button"
            onClick={() => navigate('/login')}
            className="text-[#8C4632] font-semibold hover:underline"
          >
            Login
          </button>
        </div>
      </div>

      {/* Custom Popup */}
      <CustomAlert
        isOpen={popup.isOpen}
        type={popup.type}
        title={popup.title}
        message={popup.message}
        onClose={closePopup}
        onConfirm={popup.onConfirm}
        confirmText="Continue"
      />
    </>
  );
};

export default SignupForm;
