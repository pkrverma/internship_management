import React from "react";

const Spinner = ({
  size = "md",
  color = "primary",
  className = "",
  text = null,
  fullScreen = false,
}) => {
  const sizeClasses = {
    xs: "w-3 h-3 border-2",
    sm: "w-4 h-4 border-2",
    md: "w-6 h-6 border-4",
    lg: "w-8 h-8 border-4",
    xl: "w-12 h-12 border-4",
  };
  const colorClasses = {
    primary: "border-blue-600 border-t-transparent",
    white: "border-white border-t-transparent",
    gray: "border-gray-600 border-t-transparent",
    success: "border-green-600 border-t-transparent",
    warning: "border-yellow-600 border-t-transparent",
    danger: "border-red-600 border-t-transparent",
    current: "border-current border-t-transparent",
  };
  const spinnerClasses = `${sizeClasses[size]} ${colorClasses[color]} border-solid rounded-full animate-spin ${className}`;

  const content = (
    <div className="flex flex-col items-center">
      <div className={spinnerClasses} />
      {text && <p className="mt-2 text-sm text-gray-500">{text}</p>}
    </div>
  );

  return fullScreen ? (
    <div className="fixed inset-0 flex items-center justify-center bg-white z-50">
      {content}
    </div>
  ) : (
    content
  );
};

export default Spinner;
