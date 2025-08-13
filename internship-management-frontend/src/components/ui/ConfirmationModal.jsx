import React from "react";
import {
  IoWarningOutline,
  IoCheckmarkCircleOutline,
  IoCloseOutline,
} from "react-icons/io5";

const ConfirmationModal = ({
  isOpen,
  onClose,
  onConfirm,
  title = "Confirm Action",
  message = "Are you sure you want to proceed?",
  confirmText = "Confirm",
  cancelText = "Cancel",
  danger = false,
  loading = false,
}) => {
  if (!isOpen) return null;

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget && !loading) {
      onClose();
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Escape" && !loading) {
      onClose();
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50"
      onClick={handleBackdropClick}
      onKeyDown={handleKeyDown}
      role="dialog"
      aria-modal="true"
    >
      <div className="bg-white rounded-lg shadow-lg w-full max-w-md p-6 relative">
        <button
          className="absolute top-3 right-3 text-gray-400 hover:text-gray-600"
          onClick={onClose}
          disabled={loading}
        >
          <IoCloseOutline size={20} />
        </button>

        <div className="flex items-center space-x-3 mb-4">
          {danger ? (
            <IoWarningOutline className="text-red-500 text-2xl" />
          ) : (
            <IoCheckmarkCircleOutline className="text-green-500 text-2xl" />
          )}
          <h2 className="text-lg font-semibold">{title}</h2>
        </div>

        <p className="text-gray-600 mb-6">{message}</p>

        <div className="flex justify-end space-x-3">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-md border border-gray-300 text-gray-700 hover:bg-gray-100"
            disabled={loading}
          >
            {cancelText}
          </button>
          <button
            onClick={onConfirm}
            className={`px-4 py-2 rounded-md text-white ${
              danger
                ? "bg-red-600 hover:bg-red-700"
                : "bg-blue-600 hover:bg-blue-700"
            } disabled:opacity-50`}
            disabled={loading}
          >
            {loading ? "Processing..." : confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmationModal;
