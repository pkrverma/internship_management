import React from "react";
import { Link } from "react-router-dom";
import { IoLocationOutline, IoCalendarOutline } from "react-icons/io5";

const InternshipCard = ({ internship }) => {
  const { id, title, location, duration, skills, applyBy } = internship;

  return (
    <div className="bg-white shadow-md rounded-lg p-5 flex flex-col justify-between hover:shadow-lg transition">
      <div>
        <h3 className="text-lg font-bold mb-2">{title}</h3>
        <div className="flex items-center text-gray-600 text-sm mb-1">
          <IoLocationOutline className="mr-1" /> {location}
        </div>
        <div className="flex items-center text-gray-600 text-sm mb-1">
          <IoCalendarOutline className="mr-1" /> Duration: {duration}
        </div>
        <div className="text-sm text-gray-500 mb-2">
          Skills: {skills?.join(", ") || "Not specified"}
        </div>
        <div className="text-xs text-gray-500">Apply by: {applyBy}</div>
      </div>

      <div className="mt-4 flex justify-between items-center">
        <Link
          to={`/internships/${id}`}
          className="text-blue-600 hover:underline text-sm font-medium"
        >
          View Details
        </Link>
      </div>
    </div>
  );
};

export default InternshipCard;
