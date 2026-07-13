/**
 * components/ui/Modal.jsx – Accessible modal dialog with animations
 */

import { useEffect } from 'react';
import { X } from 'lucide-react';

const Modal = ({ isOpen, onClose, title, children, size = 'md', footer }) => {
  // Close on Escape key
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape' && isOpen) onClose();
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  if (!isOpen) return null;

  const sizeClasses = {
    sm:  'max-w-md',
    md:  'max-w-lg',
    lg:  'max-w-2xl',
    xl:  'max-w-4xl',
    full:'max-w-full mx-4',
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 modal-overlay"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

      {/* Modal Content */}
      <div
        className={`
          relative w-full ${sizeClasses[size] || sizeClasses.md}
          bg-dark-800 border border-dark-700/60 rounded-2xl shadow-2xl
          modal-content max-h-[90vh] flex flex-col
        `}
      >
        {/* Header */}
        {title && (
          <div className="flex items-center justify-between p-6 border-b border-dark-700/60">
            <h2 className="text-lg font-bold text-white">{title}</h2>
            <button
              onClick={onClose}
              className="p-2 rounded-lg text-dark-400 hover:text-white hover:bg-dark-700/60 transition-colors"
            >
              <X size={18} />
            </button>
          </div>
        )}

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6">
          {children}
        </div>

        {/* Footer */}
        {footer && (
          <div className="p-6 border-t border-dark-700/60 flex items-center justify-end gap-3">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
};

export default Modal;
