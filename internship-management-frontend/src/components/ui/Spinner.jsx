import React from "react";

const Spinner = ({
  size = "md",
  color = "primary",
  className = "",
  text = null,
  fullScreen = false,
}) => {
  // Size configurations
  const sizeClasses = {
    xs: "w-3 h-3 border-2",
    sm: "w-4 h-4 border-2",
    md: "w-6 h-6 border-4",
    lg: "w-8 h-8 border-4",
    xl: "w-12 h-12 border-4",
  };

  // Color configurations
  const colorClasses = {
    primary: "border-blue-600 border-t-transparent",
    white: "border-white border-t-transparent",
    gray: "border-gray-600 border-t-transparent",
    success: "border-green-600 border-t-transparent",
    warning: "border-yellow-600 border-t-transparent",
    danger: "border-red-600 border-t-transparent",
    current: "border-current border-t-transparent",
  };

  const spinnerClasses = `
    ${sizeClasses[size] || sizeClasses.md}
    ${colorClasses[color] || colorClasses.primary}
    border-solid rounded-full animate-spin
    ${className}
  `;

  const content = (
    <div className="flex flex-col items-center justify-center space-y-2">
      <div className={spinnerClasses} role="status" aria-label="Loading" />
      {text && <p className="text-sm text-gray-600 animate-pulse">{text}</p>}
    </div>
  );

  if (fullScreen) {
    return (
      <div className="fixed inset-0 bg-white bg-opacity-80 flex items-center justify-center z-50">
        {content}
      </div>
    );
  }

  return content;
};

// Specialized spinner components
export const ButtonSpinner = ({ className = "" }) => (
  <Spinner size="sm" color="current" className={`mr-2 ${className}`} />
);

export const FullPageSpinner = ({ text = "Loading..." }) => (
  <Spinner size="lg" color="primary" text={text} fullScreen={true} />
);

export const TableSpinner = () => (
  <div className="flex justify-center py-8">
    <Spinner size="md" color="primary" text="Loading data..." />
  </div>
);

export default Spinner;
