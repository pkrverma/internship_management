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

const Footer = ({
  variant = "default", // "default", "minimal", "detailed"
  className = "",
}) => {
  const currentYear = new Date().getFullYear();

  if (variant === "minimal") {
    return (
      <footer
        className={`bg-white border-t border-gray-200 mt-auto ${className}`}
      >
        <div className="max-w-7xl mx-auto py-4 px-4 sm:px-6 lg:px-8">
          <div className="text-center text-sm text-gray-500">
            © {currentYear} Aninex Global Services Private Limited. All Rights
            Reserved.
          </div>
        </div>
      </footer>
    );
  }

  if (variant === "detailed") {
    return (
      <footer className={`bg-gray-900 text-white mt-auto ${className}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Main Footer Content */}
          <div className="py-12 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {/* Company Info */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Aninex Global Services</h3>
              <p className="text-gray-300 text-sm leading-relaxed">
                Empowering the next generation through comprehensive internship
                programs that bridge the gap between education and industry.
              </p>
              <div className="flex space-x-4">
                <a
                  href="https://linkedin.com/company/aninex"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gray-400 hover:text-white transition-colors"
                  aria-label="LinkedIn"
                >
                  <IoLogoLinkedin className="w-5 h-5" />
                </a>
                <a
                  href="https://twitter.com/aninex"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gray-400 hover:text-white transition-colors"
                  aria-label="Twitter"
                >
                  <IoLogoTwitter className="w-5 h-5" />
                </a>
                <a
                  href="https://instagram.com/aninex"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gray-400 hover:text-white transition-colors"
                  aria-label="Instagram"
                >
                  <IoLogoInstagram className="w-5 h-5" />
                </a>
              </div>
            </div>

            {/* Quick Links */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Quick Links</h3>
              <ul className="space-y-2 text-sm">
                <li>
                  <Link
                    to="/internships"
                    className="text-gray-300 hover:text-white transition-colors"
                  >
                    Browse Internships
                  </Link>
                </li>
                <li>
                  <Link
                    to="/register"
                    className="text-gray-300 hover:text-white transition-colors"
                  >
                    Join as Intern
                  </Link>
                </li>
                <li>
                  <Link
                    to="/about"
                    className="text-gray-300 hover:text-white transition-colors"
                  >
                    About Us
                  </Link>
                </li>
                <li>
                  <Link
                    to="/contact"
                    className="text-gray-300 hover:text-white transition-colors"
                  >
                    Contact Us
                  </Link>
                </li>
              </ul>
            </div>

            {/* For Organizations */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">For Organizations</h3>
              <ul className="space-y-2 text-sm">
                <li>
                  <Link
                    to="/admin/login"
                    className="text-gray-300 hover:text-white transition-colors"
                  >
                    Admin Portal
                  </Link>
                </li>
                <li>
                  <Link
                    to="/mentor-program"
                    className="text-gray-300 hover:text-white transition-colors"
                  >
                    Mentor Program
                  </Link>
                </li>
                <li>
                  <Link
                    to="/enterprise"
                    className="text-gray-300 hover:text-white transition-colors"
                  >
                    Enterprise Solutions
                  </Link>
                </li>
                <li>
                  <Link
                    to="/resources"
                    className="text-gray-300 hover:text-white transition-colors"
                  >
                    Resources
                  </Link>
                </li>
              </ul>
            </div>

            {/* Contact Info */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Contact</h3>
              <div className="space-y-3 text-sm">
                <div className="flex items-start space-x-3">
                  <IoLocationOutline className="w-5 h-5 text-gray-400 mt-0.5 flex-shrink-0" />
                  <address className="text-gray-300 not-italic">
                    Aninex Global Services
                    <br />
                    Business District
                    <br />
                    City, State 12345
                  </address>
                </div>
                <div className="flex items-center space-x-3">
                  <IoMailOutline className="w-5 h-5 text-gray-400 flex-shrink-0" />
                  <a
                    href="mailto:contact@aninex.com"
                    className="text-gray-300 hover:text-white transition-colors"
                  >
                    contact@aninex.com
                  </a>
                </div>
                <div className="flex items-center space-x-3">
                  <IoPhonePortraitOutline className="w-5 h-5 text-gray-400 flex-shrink-0" />
                  <a
                    href="tel:+1234567890"
                    className="text-gray-300 hover:text-white transition-colors"
                  >
                    +1 (234) 567-8900
                  </a>
                </div>
                <div className="flex items-center space-x-3">
                  <IoGlobeOutline className="w-5 h-5 text-gray-400 flex-shrink-0" />
                  <a
                    href="https://aninex.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-gray-300 hover:text-white transition-colors"
                  >
                    www.aninex.com
                  </a>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Bar */}
          <div className="border-t border-gray-800 py-6">
            <div className="flex flex-col sm:flex-row justify-between items-center space-y-4 sm:space-y-0">
              <div className="text-sm text-gray-400">
                © {currentYear} Aninex Global Services Private Limited. All
                Rights Reserved.
              </div>
              <div className="flex space-x-6 text-sm">
                <Link
                  to="/privacy"
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  Privacy Policy
                </Link>
                <Link
                  to="/terms"
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  Terms of Service
                </Link>
                <Link
                  to="/cookies"
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  Cookie Policy
                </Link>
              </div>
            </div>
          </div>
        </div>
      </footer>
    );
  }

  // Default footer
  return (
    <footer
      className={`bg-white border-t border-gray-200 mt-auto ${className}`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="py-8">
          <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
            {/* Left side - Company info */}
            <div className="text-center md:text-left">
              <p className="text-gray-900 font-medium">
                Aninex Global Services Private Limited
              </p>
              <p className="text-sm text-gray-500 mt-1">
                Empowering careers through quality internships
              </p>
            </div>

            {/* Right side - Links */}
            <div className="flex items-center space-x-6">
              <Link
                to="/about"
                className="text-sm text-gray-600 hover:text-gray-900 transition-colors"
              >
                About
              </Link>
              <Link
                to="/contact"
                className="text-sm text-gray-600 hover:text-gray-900 transition-colors"
              >
                Contact
              </Link>
              <Link
                to="/privacy"
                className="text-sm text-gray-600 hover:text-gray-900 transition-colors"
              >
                Privacy
              </Link>

              {/* Social Links */}
              <div className="flex space-x-3 ml-4">
                <a
                  href="https://linkedin.com/company/aninex"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                  aria-label="LinkedIn"
                >
                  <IoLogoLinkedin className="w-5 h-5" />
                </a>
                <a
                  href="mailto:contact@aninex.com"
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                  aria-label="Email"
                >
                  <IoMailOutline className="w-5 h-5" />
                </a>
              </div>
            </div>
          </div>

          {/* Copyright */}
          <div className="mt-6 pt-6 border-t border-gray-200 text-center">
            <p className="text-sm text-gray-500">
              © {currentYear} Aninex Global Services. All Rights Reserved.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
