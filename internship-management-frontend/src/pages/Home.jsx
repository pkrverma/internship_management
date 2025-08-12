import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import {
  getAvailableInternships,
  getInternshipStats,
} from "../services/internshipService";
// import { search_images } from "../services/imageService"; // If you have image service
import Spinner from "../components/ui/Spinner";
import {
  IoArrowForward,
  IoCheckmarkCircle,
  IoPeople,
  IoBriefcase,
  IoTrophy,
  IoGlobe,
  IoStar,
  IoChatbubbleEllipsesOutline,
  IoRocketOutline,
  IoSchoolOutline,
  IoBusinessOutline,
} from "react-icons/io5";

const HomePage = () => {
  const { isAuthenticated, user } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    totalInternships: 0,
    totalInterns: 0,
    totalMentors: 0,
    successRate: 95,
  });
  const [featuredInternships, setFeaturedInternships] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadHomeData = async () => {
      try {
        const [internshipsData, statsData] = await Promise.allSettled([
          getAvailableInternships(),
          getInternshipStats(),
        ]);

        const internships =
          internshipsData.status === "fulfilled" ? internshipsData.value : [];
        const statistics =
          statsData.status === "fulfilled" ? statsData.value : {};

        setFeaturedInternships(internships.slice(0, 3));
        setStats((prev) => ({
          ...prev,
          totalInternships: internships.length,
          ...statistics,
        }));
      } catch (error) {
        console.error("Failed to load home data:", error);
      } finally {
        setLoading(false);
      }
    };

    loadHomeData();
  }, []);

  const handleGetStarted = () => {
    if (isAuthenticated) {
      const dashboardPath =
        user?.role === "Intern"
          ? "/intern/dashboard"
          : user?.role === "Mentor"
            ? "/mentor/dashboard"
            : user?.role === "Admin"
              ? "/admin/dashboard"
              : "/";
      navigate(dashboardPath);
    } else {
      navigate("/register");
    }
  };

  const features = [
    {
      icon: IoRocketOutline,
      title: "Career Acceleration",
      description:
        "Fast-track your career with hands-on experience in cutting-edge technologies and industry best practices.",
    },
    {
      icon: IoPeople,
      title: "Expert Mentorship",
      description:
        "Learn from industry veterans who provide personalized guidance and support throughout your journey.",
    },
    {
      icon: IoSchoolOutline,
      title: "Skill Development",
      description:
        "Build practical skills through real-world projects and comprehensive training programs.",
    },
    {
      icon: IoBusinessOutline,
      title: "Industry Connections",
      description:
        "Network with professionals and build relationships that last beyond your internship.",
    },
  ];

  const testimonials = [
    {
      name: "Sarah Johnson",
      role: "Software Engineer at Google",
      image: "/api/placeholder/100/100",
      quote:
        "My internship at Aninex was transformative. The mentorship I received helped me land my dream job at Google.",
      rating: 5,
    },
    {
      name: "Michael Chen",
      role: "Data Scientist at Microsoft",
      image: "/api/placeholder/100/100",
      quote:
        "The hands-on projects and expert guidance prepared me perfectly for my career in tech. Highly recommend!",
      rating: 5,
    },
    {
      name: "Emily Rodriguez",
      role: "Product Manager at Amazon",
      image: "/api/placeholder/100/100",
      quote:
        "Aninex doesn't just offer internships, they provide a pathway to success. The experience was invaluable.",
      rating: 5,
    },
  ];

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 overflow-hidden">
        <div className="absolute inset-0 bg-grid-pattern opacity-5"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-32">
          <div className="text-center">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-gray-900 leading-tight">
              Launch Your Career with{" "}
              <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Aninex Global
              </span>
            </h1>
            <p className="mt-6 text-xl sm:text-2xl text-gray-600 max-w-4xl mx-auto leading-relaxed">
              Transform your potential into success through our comprehensive
              internship programs. Get hands-on experience, expert mentorship,
              and direct pathways to top-tier careers.
            </p>

            {/* CTA Buttons */}
            <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center items-center">
              <button
                onClick={handleGetStarted}
                className="group inline-flex items-center px-8 py-4 text-lg font-semibold text-white bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl hover:from-blue-700 hover:to-purple-700 transform hover:scale-105 transition-all duration-200 shadow-lg hover:shadow-xl"
              >
                {isAuthenticated ? "Go to Dashboard" : "Start Your Journey"}
                <IoArrowForward className="ml-2 group-hover:translate-x-1 transition-transform" />
              </button>

              <Link
                to="/internships"
                className="inline-flex items-center px-8 py-4 text-lg font-semibold text-blue-600 bg-white rounded-xl border-2 border-blue-200 hover:border-blue-300 hover:bg-blue-50 transition-all duration-200 shadow-lg hover:shadow-xl"
              >
                Explore Opportunities
                <IoGlobe className="ml-2" />
              </Link>
            </div>

            {/* Trust Indicators */}
            <div className="mt-12 grid grid-cols-2 lg:grid-cols-4 gap-8 text-center">
              <div className="space-y-2">
                <div className="text-3xl font-bold text-blue-600">
                  {loading ? (
                    <Spinner size="sm" />
                  ) : (
                    `${stats.totalInternships}+`
                  )}
                </div>
                <div className="text-sm font-medium text-gray-600 uppercase tracking-wider">
                  Active Internships
                </div>
              </div>
              <div className="space-y-2">
                <div className="text-3xl font-bold text-green-600">
                  {loading ? <Spinner size="sm" /> : `${stats.totalInterns}+`}
                </div>
                <div className="text-sm font-medium text-gray-600 uppercase tracking-wider">
                  Successful Interns
                </div>
              </div>
              <div className="space-y-2">
                <div className="text-3xl font-bold text-purple-600">
                  {loading ? <Spinner size="sm" /> : `${stats.totalMentors}+`}
                </div>
                <div className="text-sm font-medium text-gray-600 uppercase tracking-wider">
                  Expert Mentors
                </div>
              </div>
              <div className="space-y-2">
                <div className="text-3xl font-bold text-orange-600">
                  {stats.successRate}%
                </div>
                <div className="text-sm font-medium text-gray-600 uppercase tracking-wider">
                  Success Rate
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
              Why Choose Aninex?
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              We don't just offer internships – we provide transformative
              experiences that launch successful careers in technology and
              business.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <div
                key={index}
                className="group p-8 bg-gray-50 rounded-2xl hover:bg-white hover:shadow-xl transition-all duration-300 border border-transparent hover:border-blue-100"
              >
                <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl mb-6 group-hover:scale-110 transition-transform">
                  <feature.icon className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-4">
                  {feature.title}
                </h3>
                <p className="text-gray-600 leading-relaxed">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Internships */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
              Featured Opportunities
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Discover some of our most popular internship programs currently
              accepting applications.
            </p>
          </div>

          {loading ? (
            <div className="flex justify-center">
              <Spinner size="lg" text="Loading featured internships..." />
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {featuredInternships.map((internship) => (
                <div
                  key={internship.id}
                  className="group bg-white rounded-2xl p-8 shadow-lg hover:shadow-2xl transition-all duration-300 border border-gray-100 hover:border-blue-200"
                >
                  <div className="flex items-center justify-between mb-6">
                    <span className="inline-flex px-3 py-1 text-sm font-medium bg-blue-100 text-blue-800 rounded-full">
                      {internship.department || "Technology"}
                    </span>
                    <span className="text-sm text-gray-500">
                      {internship.type || "Full-time"}
                    </span>
                  </div>

                  <h3 className="text-xl font-semibold text-gray-900 mb-3 group-hover:text-blue-600 transition-colors">
                    {internship.title}
                  </h3>

                  <p className="text-gray-600 mb-6 line-clamp-3">
                    {internship.description}
                  </p>

                  <div className="space-y-3 mb-6">
                    <div className="flex items-center text-sm text-gray-600">
                      <IoBusinessOutline className="w-4 h-4 mr-2 text-gray-400" />
                      <span>{internship.location}</span>
                    </div>
                    <div className="flex items-center text-sm text-gray-600">
                      <IoBriefcase className="w-4 h-4 mr-2 text-gray-400" />
                      <span>{internship.duration}</span>
                    </div>
                    {internship.stipend && (
                      <div className="flex items-center text-sm text-gray-600">
                        <IoTrophy className="w-4 h-4 mr-2 text-gray-400" />
                        <span>{internship.stipend}</span>
                      </div>
                    )}
                  </div>

                  <Link
                    to={
                      isAuthenticated
                        ? `/intern/apply/${internship.id}`
                        : "/register"
                    }
                    className="inline-flex items-center w-full justify-center px-6 py-3 text-sm font-semibold text-white bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all duration-200 group-hover:shadow-lg"
                  >
                    {isAuthenticated ? "Apply Now" : "Sign Up to Apply"}
                    <IoArrowForward className="ml-2 group-hover:translate-x-1 transition-transform" />
                  </Link>
                </div>
              ))}
            </div>
          )}

          <div className="text-center mt-12">
            <Link
              to="/internships"
              className="inline-flex items-center px-8 py-4 text-lg font-semibold text-blue-600 bg-white rounded-xl border-2 border-blue-200 hover:border-blue-300 hover:bg-blue-50 transition-all duration-200 shadow-lg hover:shadow-xl"
            >
              View All Opportunities
              <IoArrowForward className="ml-2" />
            </Link>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
              Success Stories
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Hear from our alumni who have transformed their careers through
              our internship programs.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <div
                key={index}
                className="relative bg-gray-50 rounded-2xl p-8 hover:bg-white hover:shadow-xl transition-all duration-300 border border-transparent hover:border-blue-100"
              >
                <div className="absolute top-6 right-6">
                  <IoQuoteOutline className="w-8 h-8 text-blue-200" />
                </div>

                <div className="flex items-center mb-6">
                  <img
                    src={testimonial.image}
                    alt={testimonial.name}
                    className="w-16 h-16 rounded-full object-cover mr-4"
                    onError={(e) => {
                      e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(testimonial.name)}&background=3b82f6&color=fff`;
                    }}
                  />
                  <div>
                    <h4 className="text-lg font-semibold text-gray-900">
                      {testimonial.name}
                    </h4>
                    <p className="text-sm text-gray-600">{testimonial.role}</p>
                  </div>
                </div>

                <p className="text-gray-700 mb-6 leading-relaxed italic">
                  "{testimonial.quote}"
                </p>

                <div className="flex items-center">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <IoStar key={i} className="w-5 h-5 text-yellow-400" />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-blue-600 to-purple-600">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl lg:text-4xl font-bold text-white mb-6">
            Ready to Start Your Journey?
          </h2>
          <p className="text-xl text-blue-100 mb-10 leading-relaxed">
            Join thousands of successful professionals who started their careers
            with Aninex. Your future self will thank you.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <button
              onClick={handleGetStarted}
              className="inline-flex items-center px-8 py-4 text-lg font-semibold text-blue-600 bg-white rounded-xl hover:bg-gray-50 transform hover:scale-105 transition-all duration-200 shadow-lg hover:shadow-xl"
            >
              {isAuthenticated ? "Go to Dashboard" : "Join Now"}
              <IoArrowForward className="ml-2" />
            </button>

            {!isAuthenticated && (
              <Link
                to="/login"
                className="inline-flex items-center px-8 py-4 text-lg font-semibold text-white border-2 border-white rounded-xl hover:bg-white hover:text-blue-600 transition-all duration-200"
              >
                Sign In
              </Link>
            )}
          </div>
        </div>
      </section>
    </div>
  );
};

export default HomePage;
