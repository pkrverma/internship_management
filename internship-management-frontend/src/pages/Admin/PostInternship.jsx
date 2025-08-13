import React, { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { getData, saveData } from "../../services/dataService";
import { createInternship } from "../../services/internshipService";
import CreatableSelect from "react-select/creatable";
import Spinner from "../../components/ui/Spinner";
import { IoSaveOutline, IoEyeOutline } from "react-icons/io5";

const PostInternship = () => {
  const navigate = useNavigate();
  const formRef = useRef(null);

  const [formData, setFormData] = useState({
    title: "",
    company: "Aninex Global Services",
    department: "",
    location: "",
    type: "Full-time",
    duration: "",
    stipend: "",
    startDate: "",
    applicationDeadline: "",
    description: "",
    responsibilities: "",
    requirements: "",
    qualifications: "",
    skills: [],
    benefits: [],
    maxApplications: "",
    isUrgent: false,
    isRemote: false,
    experienceLevel: "Entry-level",
  });

  const [selectedSkillOptions, setSelectedSkillOptions] = useState([]);
  const [selectedBenefitOptions, setSelectedBenefitOptions] = useState([]);
  const [isUnpaid, setIsUnpaid] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });
  const [errors, setErrors] = useState({});

  const skillOptions = [
    { value: "JavaScript", label: "JavaScript" },
    { value: "React", label: "React" },
    { value: "Node.js", label: "Node.js" },
    { value: "Python", label: "Python" },
    // ... add more predefined
  ];
  const benefitOptions = [
    { value: "Health Insurance", label: "Health Insurance" },
    { value: "Flexible Hours", label: "Flexible Hours" },
    { value: "Remote Work", label: "Remote Work" },
  ];

  useEffect(() => {
    if (message.text) {
      const timer = setTimeout(() => setMessage({ type: "", text: "" }), 5000);
      return () => clearTimeout(timer);
    }
  }, [message]);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    if (name === "stipend" && !isUnpaid) {
      const numericValue = value.replace(/[^0-9]/g, "");
      setFormData((prev) => ({ ...prev, stipend: numericValue }));
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: type === "checkbox" ? checked : value,
      }));
    }
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const handleSkillsChange = (sel) => {
    setSelectedSkillOptions(sel || []);
    setFormData((prev) => ({
      ...prev,
      skills: sel ? sel.map((o) => o.value) : [],
    }));
  };

  const handleBenefitsChange = (sel) => {
    setSelectedBenefitOptions(sel || []);
    setFormData((prev) => ({
      ...prev,
      benefits: sel ? sel.map((o) => o.value) : [],
    }));
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.title.trim()) newErrors.title = "Job title required";
    if (!formData.department.trim())
      newErrors.department = "Department required";
    if (!formData.location.trim()) newErrors.location = "Location required";
    if (!formData.duration) newErrors.duration = "Duration required";
    if (!formData.applicationDeadline)
      newErrors.applicationDeadline = "Application deadline required";
    if (!formData.description.trim())
      newErrors.description = "Description required";
    if (!formData.skills.length)
      newErrors.skills = "At least one skill required";
    if (!isUnpaid && (!formData.stipend || parseInt(formData.stipend) <= 0)) {
      newErrors.stipend = "Enter valid stipend amount";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const formatStipend = (amount) =>
    isUnpaid || !amount || amount === "0"
      ? "Unpaid"
      : `₹${parseInt(amount).toLocaleString("en-IN")}/month`;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) {
      setMessage({ type: "error", text: "Fix errors before submitting." });
      return;
    }
    setIsSubmitting(true);
    try {
      const newInternship = {
        ...formData,
        id: `int_${Date.now()}`,
        stipend: formatStipend(formData.stipend),
        status: "Open",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      const existing = getData("internships") || [];
      await saveData("internships", [...existing, newInternship]);
      setMessage({ type: "success", text: "Internship posted successfully!" });
      setTimeout(() => navigate("/admin/all-internships"), 1500);
    } catch (err) {
      console.error("Post failed:", err);
      setMessage({ type: "error", text: "Failed to post internship" });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSubmitting) return <Spinner fullScreen text="Posting internship..." />;

  return (
    <div className="p-4">
      <h1 className="text-xl font-bold mb-4">Post New Internship</h1>
      {message.text && (
        <div
          className={`mb-3 p-2 rounded ${message.type === "error" ? "bg-red-100 text-red-700" : "bg-green-100 text-green-700"}`}
        >
          {message.text}
        </div>
      )}
      <form onSubmit={handleSubmit} className="space-y-3" ref={formRef}>
        <input
          name="title"
          placeholder="Job Title"
          value={formData.title}
          onChange={handleInputChange}
          className="w-full border p-2"
        />
        {errors.title && <p className="text-red-600 text-sm">{errors.title}</p>}
        <input
          name="department"
          placeholder="Department"
          value={formData.department}
          onChange={handleInputChange}
          className="w-full border p-2"
        />
        <input
          name="location"
          placeholder="Location"
          value={formData.location}
          onChange={handleInputChange}
          className="w-full border p-2"
        />
        <input
          name="duration"
          placeholder="Duration (e.g. 3 months)"
          value={formData.duration}
          onChange={handleInputChange}
          className="w-full border p-2"
        />
        <input
          name="stipend"
          placeholder="Stipend"
          value={formData.stipend}
          onChange={handleInputChange}
          className="w-full border p-2"
          disabled={isUnpaid}
        />
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={isUnpaid}
            onChange={(e) => setIsUnpaid(e.target.checked)}
          />{" "}
          Unpaid Internship
        </label>
        <input
          type="date"
          name="applicationDeadline"
          value={formData.applicationDeadline}
          onChange={handleInputChange}
          className="border p-2"
        />
        <textarea
          name="description"
          placeholder="Description..."
          value={formData.description}
          onChange={handleInputChange}
          className="w-full border p-2 h-24"
        />
        <div>
          <label>Skills</label>
          <CreatableSelect
            isMulti
            value={selectedSkillOptions}
            onChange={handleSkillsChange}
            options={skillOptions}
          />
          {errors.skills && (
            <p className="text-red-600 text-sm">{errors.skills}</p>
          )}
        </div>
        <div>
          <label>Benefits</label>
          <CreatableSelect
            isMulti
            value={selectedBenefitOptions}
            onChange={handleBenefitsChange}
            options={benefitOptions}
          />
        </div>
        <button
          type="submit"
          className="bg-blue-600 text-white px-4 py-2 rounded flex items-center gap-2"
        >
          <IoSaveOutline /> Post Internship
        </button>
      </form>
    </div>
  );
};

export default PostInternship;
