import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import {
  getAvailableInternships,
  getInternshipStats,
} from "../services/internshipService";
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
          internshipsData.status === "fulfilled" &&
          Array.isArray(internshipsData.value)
            ? internshipsData.value
            : [];

        const statistics =
          statsData.status === "fulfilled" &&
          typeof statsData.value === "object"
            ? statsData.value
            : {};

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
      const role = user?.role?.toLowerCase();
      const dashboardPath =
        role === "intern"
          ? "/intern/dashboard"
          : role === "mentor"
            ? "/mentor/dashboard"
            : role === "admin"
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
    return <Spinner fullScreen text="Loading homepage..." />;
  }

  return (
    <div className="bg-gray-50">
      {/* Hero section */}
      <section className="bg-gradient-to-r from-blue-600 to-purple-600 text-white py-16 px-4 text-center">
        <h1 className="text-4xl font-bold mb-4">
          Unlock Your Potential with Aninex Internships
        </h1>
        <p className="max-w-2xl mx-auto mb-6">
          Get hands-on experience, expert mentorship, and direct pathways to
          top-tier careers.
        </p>
        <button
          onClick={handleGetStarted}
          className="bg-white text-blue-600 px-6 py-3 rounded-lg font-semibold shadow hover:bg-gray-100"
        >
          Get Started
        </button>
      </section>

      {/* Stats */}
      <section className="py-12 bg-white">
        <div className="max-w-6xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
          <div>
            <p className="text-3xl font-bold">{stats.totalInternships}</p>
            <p className="text-gray-500">Open Roles</p>
          </div>
          <div>
            <p className="text-3xl font-bold">{stats.totalInterns}</p>
            <p className="text-gray-500">Interns</p>
          </div>
          <div>
            <p className="text-3xl font-bold">{stats.totalMentors}</p>
            <p className="text-gray-500">Mentors</p>
          </div>
          <div>
            <p className="text-3xl font-bold">{stats.successRate}%</p>
            <p className="text-gray-500">Success Rate</p>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-16 bg-gray-50 text-center">
        <h2 className="text-3xl font-bold mb-8">Why Choose Aninex?</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
          {features.map((feature, idx) => (
            <div key={idx} className="p-6 bg-white rounded-lg shadow">
              <feature.icon className="text-4xl text-blue-600 mx-auto mb-4" />
              <h3 className="font-semibold text-lg mb-2">{feature.title}</h3>
              <p className="text-gray-600 text-sm">{feature.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Featured Internships */}
      <section className="py-16 bg-white">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold mb-8 text-center">
            Featured Internships
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {featuredInternships.map((internship, idx) => (
              <div
                key={idx}
                className="p-6 bg-gray-50 rounded-lg shadow hover:shadow-lg"
              >
                <h3 className="text-lg font-bold mb-2">
                  {internship.title || "Untitled"}
                </h3>
                <p className="text-gray-600 mb-4">
                  {internship.description || "Explore this opportunity."}
                </p>
                <Link
                  to={`/internships/${internship.id}`}
                  className="text-blue-600 font-medium"
                >
                  View Details →
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-16 bg-gray-50 text-center">
        <h2 className="text-3xl font-bold mb-8">What Our Alumni Say</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-6xl mx-auto">
          {testimonials.map((testimonial, idx) => (
            <div
              key={idx}
              className="bg-white p-6 rounded-lg shadow hover:shadow-lg"
            >
              <img
                src={testimonial.image}
                alt={testimonial.name}
                className="w-20 h-20 rounded-full mx-auto mb-4 object-cover"
              />
              <h3 className="font-semibold">{testimonial.name}</h3>
              <p className="text-sm text-gray-500 mb-2">{testimonial.role}</p>
              <p className="text-gray-600 text-sm italic">
                "{testimonial.quote}"
              </p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};

export default HomePage;
