
import React from 'react';
import {
  CheckCircle2,
  AlertCircle,
  Info,
  X,
} from 'lucide-react';

const CustomAlert = ({
  isOpen,
  type = 'info',
  title,
  message,
  onClose,
  onConfirm,
  confirmText = 'Continue',
}) => {
  if (!isOpen) return null;

  const styles = {
    success: {
      icon: CheckCircle2,
      iconColor: 'text-green-600',
      iconBg: 'bg-green-100',
      button: 'bg-green-700 hover:bg-green-800',
      defaultTitle: 'Success',
    },
    error: {
      icon: AlertCircle,
      iconColor: 'text-red-600',
      iconBg: 'bg-red-100',
      button: 'bg-[#5C4033] hover:bg-[#4A3329]',
      defaultTitle: 'Something went wrong',
    },
    info: {
      icon: Info,
      iconColor: 'text-blue-600',
      iconBg: 'bg-blue-100',
      button: 'bg-[#5C4033] hover:bg-[#4A3329]',
      defaultTitle: 'Information',
    },
  };

  const currentStyle = styles[type] || styles.info;
  const Icon = currentStyle.icon;

  const handleAction = () => {
    if (onConfirm) {
      onConfirm();
    } else {
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 px-4">
      <div
        role="alertdialog"
        aria-modal="true"
        className="relative w-full max-w-sm rounded-xl bg-white p-6 shadow-2xl"
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Close popup"
          className="absolute right-4 top-4 text-gray-400 hover:text-gray-700"
        >
          <X size={20} />
        </button>

        <div className="flex flex-col items-center text-center">
          <div
            className={`mb-4 flex h-14 w-14 items-center justify-center rounded-full ${currentStyle.iconBg}`}
          >
            <Icon size={30} className={currentStyle.iconColor} />
          </div>

          <h3 className="mb-2 text-xl font-semibold text-[#30231E]">
            {title || currentStyle.defaultTitle}
          </h3>

          <p className="mb-6 text-sm leading-6 text-gray-600">
            {message}
          </p>

          <button
            type="button"
            onClick={handleAction}
            className={`w-full rounded-lg px-5 py-2.5 text-sm font-medium text-white transition-colors ${currentStyle.button}`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CustomAlert;
