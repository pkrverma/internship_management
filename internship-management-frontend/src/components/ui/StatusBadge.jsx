import React from "react";

const statusStyles = {
  Active: "bg-green-100 text-green-800",
  Completed: "bg-blue-100 text-blue-800",
  "Pending Review": "bg-yellow-100 text-yellow-800",
  Approved: "bg-green-100 text-green-800",
  "Needs Revision": "bg-red-100 text-red-800",
};

const StatusBadge = ({ status }) => {
  const style = statusStyles[status] || "bg-gray-100 text-gray-800";
  return (
    <span className={`px-2 py-1 rounded-full text-xs font-medium ${style}`}>
      {status}
    </span>
  );
};

export default StatusBadge;
