import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import {
  getAvailableInternships,
  getInternshipStats,
} from "../services/internshipService";
import Spinner from "../components/ui/Spinner";

// Ionicons v5 (react-icons/io5) — valid, available icons
import {
  IoArrowForward,
  IoCheckmarkCircle,
  IoPeople,
  IoBriefcase,
  IoTrophy,
  IoGlobe,
  IoStar,
  IoChatbubbleEllipsesOutline, // use this instead of the undefined IoQuoteOutline
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

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Spinner />
      </div>
    );
  }

  return (
    <div className="space-y-16">
      {/* Hero */}
      <section className="relative bg-gradient-to-br from-blue-50 to-indigo-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
            <div>
              <h1 className="text-3xl sm:text-5xl font-extrabold text-gray-900 leading-tight">
                Transform your potential into success
              </h1>
              <p className="mt-4 text-gray-600 text-base sm:text-lg">
                through our comprehensive internship programs. Get hands-on
                experience, expert mentorship, and direct pathways to top-tier
                careers.
              </p>

              {/* CTA Buttons */}
              <div className="mt-6 flex items-center gap-3">
                <button
                  onClick={handleGetStarted}
                  className="inline-flex items-center px-5 py-3 rounded-md bg-blue-600 text-white font-medium hover:bg-blue-700 transition-colors"
                >
                  Get Started
                  <IoArrowForward className="ml-2 h-5 w-5" />
                </button>
                <Link
                  to="/internships"
                  className="inline-flex items-center px-5 py-3 rounded-md border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Browse Internships
                </Link>
              </div>

              {/* Quick Stats */}
              <div className="mt-8 grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="p-4 bg-white border rounded-lg text-center">
                  <IoBriefcase className="mx-auto h-6 w-6 text-blue-600" />
                  <p className="mt-2 text-2xl font-semibold text-gray-900">
                    {stats.totalInternships}
                  </p>
                  <p className="text-xs text-gray-500">Open Roles</p>
                </div>
                <div className="p-4 bg-white border rounded-lg text-center">
                  <IoPeople className="mx-auto h-6 w-6 text-blue-600" />
                  <p className="mt-2 text-2xl font-semibold text-gray-900">
                    {stats.totalInterns}
                  </p>
                  <p className="text-xs text-gray-500">Interns</p>
                </div>
                <div className="p-4 bg-white border rounded-lg text-center">
                  <IoGlobe className="mx-auto h-6 w-6 text-blue-600" />
                  <p className="mt-2 text-2xl font-semibold text-gray-900">
                    {stats.totalMentors}
                  </p>
                  <p className="text-xs text-gray-500">Mentors</p>
                </div>
                <div className="p-4 bg-white border rounded-lg text-center">
                  <IoTrophy className="mx-auto h-6 w-6 text-blue-600" />
                  <p className="mt-2 text-2xl font-semibold text-gray-900">
                    {stats.successRate}%
                  </p>
                  <p className="text-xs text-gray-500">Success Rate</p>
                </div>
              </div>
            </div>

            {/* Right visual (placeholder) */}
            <div className="hidden lg:block">
              <div className="relative rounded-2xl border bg-white p-6 shadow-sm">
                <div className="flex items-center space-x-3">
                  <IoCheckmarkCircle className="h-6 w-6 text-green-600" />
                  <p className="text-gray-800 font-medium">
                    Real-world projects and mentorship
                  </p>
                </div>
                <div className="mt-4 flex items-center space-x-3">
                  <IoStar className="h-6 w-6 text-yellow-500" />
                  <p className="text-gray-800 font-medium">
                    Rated highly by our alumni
                  </p>
                </div>
                <div className="mt-4 flex items-center space-x-3">
                  <IoBriefcase className="h-6 w-6 text-blue-600" />
                  <p className="text-gray-800 font-medium">
                    Direct pathways to top-tier roles
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">
          Why choose our programs
        </h2>
        <p className="mt-2 text-gray-600">
          We don't just offer internships – we provide transformative
          experiences that launch successful careers in technology and business.
        </p>

        <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {features.map((feature) => (
            <div
              key={feature.title}
              className="p-6 bg-white border rounded-lg hover:shadow-sm transition-shadow"
            >
              <feature.icon className="h-7 w-7 text-blue-600" />
              <h3 className="mt-3 font-semibold text-gray-900">
                {feature.title}
              </h3>
              <p className="mt-2 text-sm text-gray-600">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Featured Internships */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-end justify-between">
          <div>
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">
              Featured internships
            </h2>
            <p className="mt-2 text-gray-600">
              Discover some of our most popular internship programs currently
              accepting applications.
            </p>
          </div>
          <Link
            to="/internships"
            className="hidden sm:inline-flex items-center text-blue-600 hover:text-blue-700 font-medium"
          >
            View all
            <IoArrowForward className="ml-2 h-5 w-5" />
          </Link>
        </div>

        <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {featuredInternships.length === 0 && (
            <div className="col-span-full p-6 border rounded-lg bg-white text-gray-600">
              No featured internships available right now. Check back soon!
            </div>
          )}

          {featuredInternships.map((internship) => (
            <div
              key={internship.id || internship._id || internship.title}
              className="p-5 bg-white border rounded-lg hover:shadow-sm transition-shadow"
            >
              <div className="flex items-start justify-between">
                <h3 className="text-lg font-semibold text-gray-900">
                  {internship.title || "Internship"}
                </h3>
                <span className="text-xs rounded-full px-2 py-1 bg-blue-50 text-blue-700">
                  {internship.type || "Full-time"}
                </span>
              </div>

              <p className="mt-2 text-sm text-gray-600 line-clamp-3">
                {internship.description || "Explore this opportunity."}
              </p>

              <div className="mt-4 flex items-center justify-between">
                <div className="text-xs text-gray-500">
                  {internship.location || "Remote"}
                </div>
                <Link
                  to={`/internships/${internship.id || internship._id || ""}`}
                  className="inline-flex items-center text-sm text-blue-600 hover:text-blue-700"
                >
                  View details
                  <IoArrowForward className="ml-1 h-4 w-4" />
                </Link>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-4 sm:hidden">
          <Link
            to="/internships"
            className="inline-flex items-center text-blue-600 hover:text-blue-700 font-medium"
          >
            View all
            <IoArrowForward className="ml-2 h-5 w-5" />
          </Link>
        </div>
      </section>

      {/* Testimonials */}
      <section className="bg-white border-t">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">
            What our alumni say
          </h2>
          <p className="mt-2 text-gray-600">
            Hear from our alumni who have transformed their careers through our
            internship programs.
          </p>

          <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {testimonials.map((testimonial, idx) => (
              <div
                key={idx}
                className="p-6 border rounded-lg bg-gray-50 hover:shadow-sm transition-shadow"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <img
                      src={testimonial.image}
                      alt={testimonial.name}
                      className="h-10 w-10 rounded-full object-cover"
                    />
                    <div>
                      <p className="font-semibold text-gray-900">
                        {testimonial.name}
                      </p>
                      <p className="text-xs text-gray-500">
                        {testimonial.role}
                      </p>
                    </div>
                  </div>
                  <IoChatbubbleEllipsesOutline className="h-5 w-5 text-gray-400" />
                </div>

                <p className="mt-4 text-gray-700">"{testimonial.quote}"</p>

                <div className="mt-4 flex items-center">
                  {Array.from({ length: testimonial.rating }).map((_, i) => (
                    <IoStar
                      key={i}
                      className="h-5 w-5 text-yellow-500"
                      aria-hidden="true"
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div className="mt-10 text-center">
            <button
              onClick={handleGetStarted}
              className="inline-flex items-center px-5 py-3 rounded-md bg-blue-600 text-white font-medium hover:bg-blue-700 transition-colors"
            >
              Get Started
              <IoArrowForward className="ml-2 h-5 w-5" />
            </button>
          </div>
        </div>
      </section>
    </div>
  );
};

export default HomePage;
