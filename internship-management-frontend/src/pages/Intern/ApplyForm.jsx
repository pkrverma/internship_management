import React, { useState, useEffect, useCallback } from "react";
import { useAuth } from "../../context/AuthContext";
import { useParams, useNavigate } from "react-router-dom";
import { getData, saveData } from "../../services/dataService";
import { uploadFile } from "../../services/fileService";
import Spinner from "../../components/ui/Spinner";
import ConfirmationModal from "../../components/ui/ConfirmationModal";
import {
  IoPersonOutline,
  IoSchoolOutline,
  IoBriefcaseOutline,
  IoDocumentTextOutline,
  IoHeartOutline,
  IoCheckmarkCircleOutline,
  IoRefreshOutline,
  IoSaveOutline,
  IoArrowBackOutline,
  IoArrowForwardOutline,
} from "react-icons/io5";

const FORM_STEPS = [
  { id: "personal", title: "Personal Information", icon: IoPersonOutline },
  { id: "education", title: "Education & Background", icon: IoSchoolOutline },
  { id: "experience", title: "Skills & Experience", icon: IoBriefcaseOutline },
  { id: "documents", title: "Documents", icon: IoDocumentTextOutline },
  { id: "motivation", title: "Motivation & Goals", icon: IoHeartOutline },
  { id: "review", title: "Review & Submit", icon: IoCheckmarkCircleOutline },
];

const ApplyForm = () => {
  const { user } = useAuth();
  const { internshipId } = useParams();
  const navigate = useNavigate();

  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState({
    firstName: user?.firstName || "",
    lastName: user?.lastName || "",
    email: user?.email || "",
    phone: user?.phone || "",
    university: user?.university || "",
    degree: user?.degree || "",
    major: user?.major || "",
    skills: [],
    resume: null,
    coverLetter: null,
    whyThisInternship: "",
    agreeToTerms: false,
  });

  const [internshipDetails, setInternshipDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });
  const [errors, setErrors] = useState({});

  const draftKey = `application_draft_${internshipId}_${user?.id}`;

  // Load data
  useEffect(() => {
    if (!user || !internshipId) return;
    setLoading(true);
    try {
      const internships = getData("internships") || [];
      const internship = internships.find((i) => i.id === internshipId);
      setInternshipDetails(internship || null);

      const draft = getData(draftKey);
      if (draft) setFormData((prev) => ({ ...prev, ...draft }));
    } catch (err) {
      console.error(err);
      setMessage({ type: "error", text: "Failed to load application data" });
    } finally {
      setLoading(false);
    }
  }, [user, internshipId, draftKey]);

  // Auto-clear message
  useEffect(() => {
    if (message.text) {
      const t = setTimeout(() => setMessage({ type: "", text: "" }), 5000);
      return () => clearTimeout(t);
    }
  }, [message]);

  const saveDraft = useCallback(async () => {
    try {
      await saveData(draftKey, formData);
      setMessage({ type: "success", text: "Draft saved" });
    } catch {
      setMessage({ type: "error", text: "Failed to save draft" });
    }
  }, [draftKey, formData]);

  const validateStep = (idx) => {
    const step = FORM_STEPS[idx].id;
    const errs = {};
    if (step === "personal") {
      if (!formData.firstName) errs.firstName = "Required";
      if (!formData.lastName) errs.lastName = "Required";
      if (!formData.email) errs.email = "Required";
    }
    if (step === "documents") {
      if (!formData.resume) errs.resume = "Resume is required";
    }
    if (step === "review") {
      if (!formData.agreeToTerms)
        errs.agreeToTerms = "You must agree before submitting";
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const nextStep = () => {
    if (validateStep(currentStep))
      setCurrentStep((p) => Math.min(p + 1, FORM_STEPS.length - 1));
  };
  const prevStep = () => setCurrentStep((p) => Math.max(p - 1, 0));

  const handleFileUpload = async (field, file) => {
    if (!file) return;
    try {
      const result = await uploadFile(file, `applications/${user.id}`);
      setFormData((prev) => ({
        ...prev,
        [field]: { name: file.name, url: result.url },
      }));
      setMessage({ type: "success", text: `${field} uploaded` });
    } catch {
      setMessage({ type: "error", text: `Failed to upload ${field}` });
    }
  };

  const handleSubmit = async () => {
    if (!FORM_STEPS.every((_, idx) => validateStep(idx))) {
      setMessage({ type: "error", text: "Fix validation errors first" });
      return;
    }
    setSubmitting(true);
    try {
      const applications = getData("applications") || [];
      const exists = applications.find(
        (a) => a.internId === user.id && a.internshipId === internshipId
      );
      const data = {
        id: exists?.id || `app_${Date.now()}`,
        internId: user.id,
        internshipId,
        ...formData,
        status: "Submitted",
        submittedAt: new Date().toISOString(),
      };
      await saveData(
        "applications",
        exists
          ? applications.map((a) => (a.id === exists.id ? data : a))
          : [...applications, data]
      );
      localStorage.removeItem(draftKey);
      setMessage({ type: "success", text: "Application submitted" });
      setTimeout(() => navigate("/intern/my-applications"), 1500);
    } catch {
      setMessage({ type: "error", text: "Submit failed" });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <Spinner fullScreen text="Loading form..." />;

  return (
    <div className="p-4 max-w-3xl mx-auto">
      <h1 className="text-xl font-bold mb-2">
        Apply for {internshipDetails?.title || "Internship"}
      </h1>
      {message.text && (
        <div
          className={`p-2 mb-3 rounded ${message.type === "error" ? "bg-red-100 text-red-700" : "bg-green-100 text-green-700"}`}
        >
          {message.text}
        </div>
      )}

      {/* Step navigation */}
      <div className="flex gap-2 mb-4">
        {FORM_STEPS.map((s, idx) => (
          <button
            key={s.id}
            onClick={() => setCurrentStep(idx)}
            className={`px-3 py-1 rounded ${currentStep === idx ? "bg-blue-600 text-white" : "bg-gray-200"}`}
          >
            {s.title}
          </button>
        ))}
      </div>

      {/* Step content */}
      {FORM_STEPS[currentStep].id === "personal" && (
        <div>
          <input
            value={formData.firstName}
            onChange={(e) =>
              setFormData({ ...formData, firstName: e.target.value })
            }
            placeholder="First Name"
            className="border p-2 w-full mb-2"
          />
          {errors.firstName && (
            <p className="text-red-600">{errors.firstName}</p>
          )}
          <input
            value={formData.lastName}
            onChange={(e) =>
              setFormData({ ...formData, lastName: e.target.value })
            }
            placeholder="Last Name"
            className="border p-2 w-full mb-2"
          />
          {errors.lastName && <p className="text-red-600">{errors.lastName}</p>}
          <input
            value={formData.email}
            onChange={(e) =>
              setFormData({ ...formData, email: e.target.value })
            }
            placeholder="Email"
            className="border p-2 w-full mb-2"
          />
          {errors.email && <p className="text-red-600">{errors.email}</p>}
        </div>
      )}

      {FORM_STEPS[currentStep].id === "documents" && (
        <div>
          <label>Resume:</label>
          <input
            type="file"
            onChange={(e) => handleFileUpload("resume", e.target.files[0])}
          />
          {errors.resume && <p className="text-red-600">{errors.resume}</p>}
          {formData.resume && <p>Uploaded: {formData.resume.name}</p>}
        </div>
      )}

      {FORM_STEPS[currentStep].id === "review" && (
        <div>
          <h2 className="font-semibold mb-2">Review</h2>
          <p>
            {formData.firstName} {formData.lastName} — {formData.email}
          </p>
          <label className="flex items-center gap-2 mt-2">
            <input
              type="checkbox"
              checked={formData.agreeToTerms}
              onChange={(e) =>
                setFormData({ ...formData, agreeToTerms: e.target.checked })
              }
            />
            Agree to terms
          </label>
          {errors.agreeToTerms && (
            <p className="text-red-600">{errors.agreeToTerms}</p>
          )}
        </div>
      )}

      {/* Navigation buttons */}
      <div className="flex justify-between mt-4">
        <button
          onClick={prevStep}
          disabled={currentStep === 0}
          className="px-4 py-2 bg-gray-300 rounded"
        >
          <IoArrowBackOutline /> Back
        </button>
        {currentStep < FORM_STEPS.length - 1 ? (
          <button
            onClick={nextStep}
            className="px-4 py-2 bg-blue-600 text-white rounded"
          >
            Next <IoArrowForwardOutline />
          </button>
        ) : (
          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="px-4 py-2 bg-green-600 text-white rounded"
          >
            {submitting ? "Submitting..." : "Submit"}
          </button>
        )}
      </div>
    </div>
  );
};

export default ApplyForm;
