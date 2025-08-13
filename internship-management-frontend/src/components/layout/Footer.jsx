// src/components/layout/Footer.jsx
import React from "react";
import { Link } from "react-router-dom";
import {
  IoLogoLinkedin,
  IoLogoTwitter,
  IoLogoInstagram,
  IoMailOutline,
  IoPhonePortraitOutline,
  IoLocationOutline,
  IoGlobeOutline,
} from "react-icons/io5";

const Footer = ({ variant = "default", className = "" }) => {
  const currentYear = new Date().getFullYear();

  // ===== Minimal Footer =====
  if (variant === "minimal") {
    return (
      <footer className={`bg-gray-900 text-gray-300 py-4 ${className}`}>
        <div className="max-w-7xl mx-auto px-4 text-center text-sm">
          © {currentYear} Aninex Global Services Pvt. Ltd. All rights reserved.
        </div>
      </footer>
    );
  }

  // ===== Detailed Footer =====
  if (variant === "detailed") {
    return (
      <footer className={`bg-gray-900 text-gray-300 pt-10 ${className}`}>
        <div className="max-w-7xl mx-auto px-4 grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Company Info */}
          <div>
            <h3 className="text-white font-bold mb-2">Aninex Global</h3>
            <p className="text-sm">
              Connecting talent with opportunities. Join internships, mentor
              students, and manage applications in one place.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-white font-semibold mb-3">Quick Links</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link to="/" className="hover:text-white">
                  Home
                </Link>
              </li>
              <li>
                <Link to="/internships" className="hover:text-white">
                  Internships
                </Link>
              </li>
              <li>
                <Link to="/about" className="hover:text-white">
                  About Us
                </Link>
              </li>
              <li>
                <Link to="/contact" className="hover:text-white">
                  Contact
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact Info */}
          <div>
            <h4 className="text-white font-semibold mb-3">Contact</h4>
            <ul className="space-y-2 text-sm">
              <li className="flex items-center space-x-2">
                <IoLocationOutline /> <span>Mumbai, India</span>
              </li>
              <li className="flex items-center space-x-2">
                <IoPhonePortraitOutline /> <span>+91 12345 67890</span>
              </li>
              <li className="flex items-center space-x-2">
                <IoMailOutline />{" "}
                <a
                  href="mailto:support@aninex.com"
                  className="hover:text-white"
                >
                  support@aninex.com
                </a>
              </li>
              <li className="flex items-center space-x-2">
                <IoGlobeOutline />{" "}
                <a
                  href="https://www.aninex.com"
                  target="_blank"
                  rel="noreferrer"
                  className="hover:text-white"
                >
                  aninex.com
                </a>
              </li>
            </ul>
          </div>

          {/* Social Media */}
          <div>
            <h4 className="text-white font-semibold mb-3">Follow Us</h4>
            <div className="flex space-x-4 text-2xl">
              <a
                href="https://linkedin.com/company/aninex"
                target="_blank"
                rel="noreferrer"
                className="hover:text-white"
              >
                <IoLogoLinkedin />
              </a>
              <a
                href="https://twitter.com/aninex"
                target="_blank"
                rel="noreferrer"
                className="hover:text-white"
              >
                <IoLogoTwitter />
              </a>
              <a
                href="https://instagram.com/aninex"
                target="_blank"
                rel="noreferrer"
                className="hover:text-white"
              >
                <IoLogoInstagram />
              </a>
            </div>
          </div>
        </div>

        {/* Footer bottom */}
        <div className="border-t border-gray-700 mt-8 py-4 text-center text-sm text-gray-500">
          © {currentYear} Aninex Global Services Pvt. Ltd. All rights reserved.
        </div>
      </footer>
    );
  }

  // ===== Default Footer =====
  return (
    <footer className={`bg-gray-900 text-gray-300 py-6 ${className}`}>
      <div className="max-w-7xl mx-auto px-4 flex flex-col md:flex-row items-center justify-between">
        <div className="text-sm">
          © {currentYear} Aninex Global Services Pvt. Ltd.
        </div>
        <div className="flex space-x-4 text-xl mt-3 md:mt-0">
          <a
            href="https://linkedin.com/company/aninex"
            target="_blank"
            rel="noreferrer"
            className="hover:text-white"
          >
            <IoLogoLinkedin />
          </a>
          <a
            href="https://twitter.com/aninex"
            target="_blank"
            rel="noreferrer"
            className="hover:text-white"
          >
            <IoLogoTwitter />
          </a>
          <a
            href="https://instagram.com/aninex"
            target="_blank"
            rel="noreferrer"
            className="hover:text-white"
          >
            <IoLogoInstagram />
          </a>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
