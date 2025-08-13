import React, { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { getData, saveData } from "../../services/dataService";
import { uploadFile } from "../../services/fileService";
import Spinner from "../../components/ui/Spinner";
import {
  IoArrowBackOutline,
  IoArrowForwardOutline,
  IoCloudUploadOutline,
  IoCheckmarkCircleOutline,
} from "react-icons/io5";

const STEP_TITLES = [
  "Personal Information",
  "Academic Information",
  "Skills & Experience",
  "Motivation & Goals",
  "Documents & Review",
];

const InternshipApplication = () => {
  const { id: internshipId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [internship, setInternship] = useState(null);
  const [existingApplication, setExistingApplication] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = STEP_TITLES.length;

  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    address: "",
    city: "",
    state: "",
    university: "",
    degree: "",
    major: "",
    currentYear: "",
    expectedGraduation: "",
    currentGPA: "",
    skills: [],
    github: "",
    linkedin: "",
    portfolio: "",
    whyInternship: "",
    expectations: "",
  });
  const [files, setFiles] = useState({ resume: null, coverLetter: null });
  const [errors, setErrors] = useState({});
  const [message, setMessage] = useState({ type: "", text: "" });

  useEffect(() => {
    if (user?.id && internshipId) {
      loadData();
    }
  }, [user, internshipId]);

  useEffect(() => {
    if (message.text) {
      const t = setTimeout(() => setMessage({ type: "", text: "" }), 5000);
      return () => clearTimeout(t);
    }
  }, [message]);

  const loadData = () => {
    try {
      const internships = getData("internships") || [];
      const target = internships.find((i) => i.id === internshipId);
      if (!target) {
        setMessage({ type: "error", text: "Internship not found" });
        navigate("/internships");
        return;
      }
      setInternship(target);
      const apps = getData("applications") || [];
      const existing = apps.find(
        (a) =>
          a.internshipId === internshipId &&
          (a.internId === user.id || a.userId === user.id)
      );
      if (existing) setExistingApplication(existing);
    } catch (e) {
      console.error(e);
      setMessage({ type: "error", text: "Failed to load data" });
    } finally {
      setLoading(false);
    }
  };

  const handleInput = (e) => {
    const { name, value } = e.target;
    setFormData((p) => ({ ...p, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => {
        const copy = { ...prev };
        delete copy[name];
        return copy;
      });
    }
  };

  const validateStep = (step) => {
    const errs = {};
    if (step === 1) {
      if (!formData.firstName.trim()) errs.firstName = "Required";
      if (!formData.lastName.trim()) errs.lastName = "Required";
      if (!formData.email.trim()) errs.email = "Required";
    }
    if (step === 5) {
      if (!files.resume) errs.resume = "Resume required";
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep((s) => Math.min(s + 1, totalSteps));
      window.scrollTo(0, 0);
    } else {
      setMessage({
        type: "error",
        text: "Please fix errors before continuing",
      });
    }
  };
  const handlePrev = () => setCurrentStep((s) => Math.max(s - 1, 1));

  const handleFile = async (e, type) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      setMessage({ type: "error", text: "Max file size is 5MB" });
      return;
    }
    try {
      const res = await uploadFile(file, `applications/${user.id}`);
      setFiles((prev) => ({
        ...prev,
        [type]: { name: file.name, url: res.url },
      }));
      setMessage({ type: "success", text: `${type} uploaded` });
    } catch {
      setMessage({ type: "error", text: "Failed to upload file" });
    }
  };

  const handleSubmit = async () => {
    if (!validateStep(currentStep)) {
      setMessage({ type: "error", text: "Fix validation errors" });
      return;
    }
    setSubmitting(true);
    try {
      const apps = getData("applications") || [];
      const data = {
        id: existingApplication?.id || `app_${Date.now()}`,
        internshipId,
        internId: user.id,
        ...formData,
        resume: files.resume?.name,
        coverLetter: files.coverLetter?.name,
        status: "Submitted",
        submittedAt: new Date().toISOString(),
      };
      const updated = existingApplication
        ? apps.map((a) => (a.id === data.id ? data : a))
        : [...apps, data];
      await saveData("applications", updated);
      setMessage({ type: "success", text: "Application submitted" });
      setTimeout(() => navigate("/intern/my-applications"), 1500);
    } catch {
      setMessage({ type: "error", text: "Submit failed" });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <Spinner fullScreen text="Loading application..." />;

  return (
    <div className="p-4 max-w-3xl mx-auto">
      <h1 className="font-bold text-xl mb-3">
        Apply: {internship?.title} at {internship?.company}
      </h1>
      {message.text && (
        <div
          className={`p-2 mb-3 rounded ${message.type === "error" ? "bg-red-100 text-red-700" : "bg-green-100 text-green-700"}`}
        >
          {message.text}
        </div>
      )}

      <p className="mb-1 font-semibold">
        Step {currentStep} of {totalSteps} — {STEP_TITLES[currentStep - 1]}
      </p>

      {currentStep === 1 && (
        <div>
          <input
            name="firstName"
            value={formData.firstName}
            onChange={handleInput}
            placeholder="First Name"
            className="border p-2 w-full mb-2"
          />
          {errors.firstName && (
            <p className="text-red-600">{errors.firstName}</p>
          )}
          <input
            name="lastName"
            value={formData.lastName}
            onChange={handleInput}
            placeholder="Last Name"
            className="border p-2 w-full mb-2"
          />
          {errors.lastName && <p className="text-red-600">{errors.lastName}</p>}
          <input
            name="email"
            value={formData.email}
            onChange={handleInput}
            placeholder="Email"
            className="border p-2 w-full mb-2"
          />
          {errors.email && <p className="text-red-600">{errors.email}</p>}
        </div>
      )}

      {currentStep === 5 && (
        <div>
          <label>Resume</label>
          <input type="file" onChange={(e) => handleFile(e, "resume")} />
          {errors.resume && <p className="text-red-600">{errors.resume}</p>}
        </div>
      )}

      <div className="mt-4 flex justify-between">
        <button
          onClick={handlePrev}
          disabled={currentStep === 1}
          className="bg-gray-300 px-4 py-2 rounded"
        >
          <IoArrowBackOutline /> Back
        </button>
        {currentStep < totalSteps ? (
          <button
            onClick={handleNext}
            className="bg-blue-600 text-white px-4 py-2 rounded"
          >
            Next <IoArrowForwardOutline />
          </button>
        ) : (
          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="bg-green-600 text-white px-4 py-2 rounded"
          >
            {submitting ? "Submitting..." : "Submit"}
          </button>
        )}
      </div>
    </div>
  );
};

export default InternshipApplication;
