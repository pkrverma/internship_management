import React, { useState } from "react";
import { UserIcon } from "@heroicons/react/24/outline";

const getInitials = (name = "") => {
  if (!name || typeof name !== "string") return "?";
  const words = name.trim().split(" ");
  return words
    .slice(0, 2)
    .map((w) => w.charAt(0))
    .join("")
    .toUpperCase();
};

const getUserColor = (user) => {
  const colors = [
    "bg-blue-500",
    "bg-green-500",
    "bg-purple-500",
    "bg-pink-500",
    "bg-indigo-500",
    "bg-yellow-500",
    "bg-red-500",
  ];
  const seed = user?.id || user?.name || "default";
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = seed.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
};

const ProfileAvatar = ({ user, size = "lg", className = "" }) => {
  const [imageError, setImageError] = useState(false);
  if (!user) return null;
  const initials = getInitials(user.name);
  const bgColor = getUserColor(user);
  const containerSize = size === "lg" ? "w-16 h-16" : "w-8 h-8";

  return (
    <div
      className={`rounded-full flex items-center justify-center text-white ${bgColor} ${containerSize} ${className}`}
    >
      {!user.profilePictureUrl || imageError ? (
        initials || <UserIcon className="w-6 h-6" />
      ) : (
        <img
          src={user.profilePictureUrl}
          onError={() => setImageError(true)}
          alt={user.name}
          className="rounded-full w-full h-full object-cover"
        />
      )}
    </div>
  );
};

export default ProfileAvatar;
