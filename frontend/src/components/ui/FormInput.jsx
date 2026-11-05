import React, { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';

const FormInput = ({ 
  label, 
  type, 
  name, 
  placeholder, 
  icon: Icon, 
  helperText, 
  value, 
  onChange,
  required 
}) => {
  const [showPassword, setShowPassword] = useState(false);
  const isPassword = type === 'password';
  const inputType = isPassword ? (showPassword ? 'text' : 'password') : type;

  return (
    <div className="mb-4">
      <div className="flex justify-between items-center mb-1.5">
        <label className="text-sm font-semibold text-gray-800">{label}</label>
        {helperText && (
          <span className="text-xs text-gray-400">{helperText}</span>
        )}
      </div>
      
      <div className="relative">
        {/* Left Icon */}
        {Icon && (
          <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
            <Icon size={18} />
          </div>
        )}
        
        <input
          type={inputType}
          name={name}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          className={`w-full bg-[#FDFBF9] border border-[#E5E0D8] rounded-md py-2.5 ${Icon ? 'pl-10' : 'pl-4'} ${isPassword ? 'pr-10' : 'pr-4'} text-sm text-gray-700 focus:outline-none focus:border-[#8C4632] focus:ring-1 focus:ring-[#8C4632] transition-all placeholder:text-gray-400`}
        />

        {/* Right Icon (Password Toggle) */}
        {isPassword && (
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
          >
            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        )}
      </div>
    </div>
  );
};

export default FormInput;