import React, { useState, useEffect, useRef } from "react";
import { useAuth } from "../../context/AuthContext";
import sharedDocuments from "../../mock/sharedDocuments.json";
import {
  IoDocumentTextOutline,
  IoCloudUploadOutline,
  IoTrashOutline,
  IoDownloadOutline,
} from "react-icons/io5";

const ALLOWED_TYPES = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
];
const MAX_FILE_SIZE_MB = 5;

const Documents = () => {
  const { user } = useAuth();

  const [mentorDocs, setMentorDocs] = useState([]);
  const [internDocs, setInternDocs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({ title: "", file: null });
  const [message, setMessage] = useState({ type: "", text: "" });

  const fileInputRef = useRef();

  // Load on mount
  useEffect(() => {
    if (user?.id) {
      // Mentor shared
      const mentorShared = sharedDocuments.filter(
        (doc) => doc.internId === user.id
      );
      setMentorDocs(mentorShared);

      // Intern uploaded (local storage)
      const internStored =
        JSON.parse(localStorage.getItem("internDocuments")) || [];
      const myDocs = internStored.filter((doc) => doc.internId === user.id);
      setInternDocs(myDocs);

      setLoading(false);
    }
  }, [user]);

  // Handle field changes
  const handleChange = (e) => {
    const { name, value, files } = e.target;
    if (name === "file") {
      if (files.length > 0) setFormData({ ...formData, file: files[0] });
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  // Format date
  const formatDate = (dateStr) => {
    return new Date(dateStr).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  // Handle upload
  const handleUpload = (e) => {
    e.preventDefault();
    if (!formData.title || !formData.file) {
      return setMessage({
        type: "error",
        text: "Please provide both title and file.",
      });
    }

    // Validate type
    if (!ALLOWED_TYPES.includes(formData.file.type)) {
      return setMessage({
        type: "error",
        text: "Invalid file type. Only PDF, DOC, and DOCX are allowed.",
      });
    }

    // Validate size
    if (formData.file.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
      return setMessage({
        type: "error",
        text: `File is too large. Max size is ${MAX_FILE_SIZE_MB}MB.`,
      });
    }

    const newDoc = {
      id: "doc_" + Date.now(),
      internId: user.id,
      title: formData.title.trim(),
      fileName: formData.file.name,
      fileType: formData.file.type,
      uploadedAt: new Date().toISOString(),
    };

    const prevDocs = JSON.parse(localStorage.getItem("internDocuments")) || [];
    const updated = [...prevDocs, newDoc];
    localStorage.setItem("internDocuments", JSON.stringify(updated));

    setInternDocs(updated.filter((d) => d.internId === user.id));
    setFormData({ title: "", file: null });
    fileInputRef.current.value = ""; // reset file input

    setMessage({ type: "success", text: "Document uploaded successfully!" });
  };

  // Handle delete
  const handleDelete = (docId) => {
    if (!window.confirm("Are you sure you want to delete this document?"))
      return;

    const allDocs = JSON.parse(localStorage.getItem("internDocuments")) || [];
    const updated = allDocs.filter((doc) => doc.id !== docId);
    localStorage.setItem("internDocuments", JSON.stringify(updated));

    setInternDocs(updated.filter((doc) => doc.internId === user.id));
    setMessage({ type: "success", text: "Document deleted." });
  };

  // File type icon
  const getFileIcon = (type) => {
    return (
      <IoDocumentTextOutline className="text-indigo-500 w-5 h-5 inline-block" />
    );
  };

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <h2 className="text-3xl font-bold text-gray-800 mb-4">
        📂 Document Center
      </h2>

      {message.text && (
        <div
          className={`mb-4 p-3 rounded-md ${message.type === "error" ? "bg-red-100 text-red-700" : "bg-green-100 text-green-700"}`}
        >
          {message.text}
        </div>
      )}

      {/* Mentor Shared Documents */}
      <section className="mb-10">
        <h3 className="text-2xl font-semibold mb-3">Mentor Shared Documents</h3>
        {loading ? (
          <p className="text-gray-600">Loading Documents...</p>
        ) : mentorDocs.length === 0 ? (
          <p className="text-gray-500">No mentor-shared documents yet.</p>
        ) : (
          <div className="bg-white shadow-md rounded-lg overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-100">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                    Title
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                    File
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                    Uploaded By
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                    Uploaded At
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {mentorDocs.map((doc) => (
                  <tr key={doc.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {doc.title}
                    </td>
                    <td className="px-6 py-4 text-sm text-blue-600 hover:underline">
                      <a
                        href={`/${doc.fileName}`}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        {getFileIcon(doc.fileType)} {doc.fileName}
                      </a>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-700">
                      {doc.uploadedBy}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {formatDate(doc.uploadedAt)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Upload Form */}
      <section className="mb-10">
        <h3 className="text-2xl font-semibold mb-3">Upload Your Documents</h3>
        <form
          onSubmit={handleUpload}
          className="mb-8 space-y-4 bg-white p-4 rounded-lg shadow border"
        >
          <input
            type="text"
            name="title"
            placeholder="Document Title (e.g., Resume)"
            value={formData.title}
            onChange={handleChange}
            className="w-full px-4 py-2 border rounded focus:ring focus:ring-indigo-300"
            required
          />
          <input
            type="file"
            name="file"
            accept=".pdf,.doc,.docx"
            onChange={handleChange}
            ref={fileInputRef}
            className="w-full px-4 py-2 border rounded focus:ring focus:ring-indigo-300"
            required
          />
          <button
            type="submit"
            className="flex items-center gap-2 bg-indigo-600 text-white px-6 py-2 rounded hover:bg-indigo-700"
          >
            <IoCloudUploadOutline />
            Upload Document
          </button>
        </form>
      </section>

      {/* Your Uploaded Documents */}
      <section>
        <h3 className="text-2xl font-semibold mb-3">Your Uploaded Documents</h3>
        {internDocs.length === 0 ? (
          <p className="text-gray-500">
            You haven't uploaded any documents yet.
          </p>
        ) : (
          <div className="bg-white shadow-md rounded-lg overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-100">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                    Title
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                    File
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                    Uploaded At
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-semibold text-gray-600 uppercase">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {internDocs.map((doc) => (
                  <tr key={doc.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {doc.title}
                    </td>
                    <td className="px-6 py-4 text-sm text-blue-600 hover:underline">
                      <a
                        href={`/${doc.fileName}`}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        {getFileIcon(doc.fileType)} {doc.fileName}
                      </a>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {formatDate(doc.uploadedAt)}
                    </td>
                    <td className="px-6 py-4 text-center flex items-center justify-center gap-4">
                      <a
                        href={`/${doc.fileName}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        title="Download"
                      >
                        <IoDownloadOutline className="text-green-600 hover:text-green-800 cursor-pointer" />
                      </a>
                      <IoTrashOutline
                        onClick={() => handleDelete(doc.id)}
                        className="text-red-600 hover:text-red-800 cursor-pointer"
                        title="Delete"
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
};

export default Documents;
