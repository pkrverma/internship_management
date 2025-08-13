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
      // Mentor-shared
      const mentorShared = sharedDocuments.filter(
        (doc) => doc.internId === user.id
      );
      setMentorDocs(mentorShared);

      // Intern uploaded
      const internStored =
        JSON.parse(localStorage.getItem("internDocuments")) || [];
      const myDocs = internStored.filter((doc) => doc.internId === user.id);
      setInternDocs(myDocs);

      setLoading(false);
    }
  }, [user]);

  // Auto clear message
  useEffect(() => {
    if (message.text) {
      const t = setTimeout(() => setMessage({ type: "", text: "" }), 4000);
      return () => clearTimeout(t);
    }
  }, [message]);

  const handleChange = (e) => {
    const { name, value, files } = e.target;
    if (name === "file" && files.length > 0) {
      setFormData((prev) => ({ ...prev, file: files[0] }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const formatDate = (dateStr) =>
    new Date(dateStr).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });

  const getFileIcon = (type) => (
    <IoDocumentTextOutline className="inline text-blue-600" />
  );

  const handleUpload = (e) => {
    e.preventDefault();
    if (!formData.title || !formData.file) {
      return setMessage({
        type: "error",
        text: "Please provide both title and file.",
      });
    }
    // Validate file type
    if (!ALLOWED_TYPES.includes(formData.file.type)) {
      return setMessage({
        type: "error",
        text: "Invalid file type. Only PDF, DOC, and DOCX are allowed.",
      });
    }
    // Validate file size
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
    if (fileInputRef.current) fileInputRef.current.value = "";
    setMessage({ type: "success", text: "Document uploaded successfully!" });
  };

  const handleDelete = (docId) => {
    if (!window.confirm("Are you sure you want to delete this document?"))
      return;
    const allDocs = JSON.parse(localStorage.getItem("internDocuments")) || [];
    const updated = allDocs.filter((doc) => doc.id !== docId);
    localStorage.setItem("internDocuments", JSON.stringify(updated));
    setInternDocs(updated.filter((doc) => doc.internId === user.id));
    setMessage({ type: "success", text: "Document deleted." });
  };

  if (loading) {
    return <p className="p-4">Loading documents...</p>;
  }

  return (
    <div className="p-4 space-y-6">
      <h1 className="text-xl font-bold flex items-center gap-2">
        <IoDocumentTextOutline /> My Documents
      </h1>

      {message.text && (
        <div
          className={`p-2 rounded ${
            message.type === "error"
              ? "bg-red-100 text-red-700"
              : "bg-green-100 text-green-700"
          }`}
        >
          {message.text}
        </div>
      )}

      {/* Mentor-shared docs */}
      <section>
        <h2 className="font-semibold mb-2">Mentor Shared Documents</h2>
        {mentorDocs.length === 0 ? (
          <p className="text-gray-500">No mentor-shared documents yet.</p>
        ) : (
          <div className="overflow-x-auto border rounded bg-white">
            <table className="min-w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="p-2 text-left">Title</th>
                  <th className="p-2 text-left">File</th>
                  <th className="p-2">Uploaded At</th>
                </tr>
              </thead>
              <tbody>
                {mentorDocs.map((doc) => (
                  <tr key={doc.id} className="border-t">
                    <td className="p-2">{doc.title}</td>
                    <td className="p-2 flex items-center gap-1">
                      {getFileIcon(doc.fileType)} {doc.fileName}
                    </td>
                    <td className="p-2">{formatDate(doc.uploadedAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* My uploaded docs */}
      <section>
        <h2 className="font-semibold mb-2">My Uploaded Documents</h2>
        {internDocs.length === 0 ? (
          <p className="text-gray-500">
            You haven't uploaded any documents yet.
          </p>
        ) : (
          <div className="overflow-x-auto border rounded bg-white">
            <table className="min-w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="p-2 text-left">Title</th>
                  <th className="p-2 text-left">File</th>
                  <th className="p-2">Uploaded At</th>
                  <th className="p-2">Actions</th>
                </tr>
              </thead>
              <tbody>
                {internDocs.map((doc) => (
                  <tr key={doc.id} className="border-t">
                    <td className="p-2">{doc.title}</td>
                    <td className="p-2 flex items-center gap-1">
                      {getFileIcon(doc.fileType)} {doc.fileName}
                    </td>
                    <td className="p-2">{formatDate(doc.uploadedAt)}</td>
                    <td className="p-2">
                      <a
                        href={doc.url || "#"}
                        download
                        className="text-blue-600 hover:underline flex items-center gap-1 text-sm"
                      >
                        <IoDownloadOutline /> Download
                      </a>
                      <button
                        onClick={() => handleDelete(doc.id)}
                        className="text-red-600 hover:underline flex items-center gap-1 text-sm ml-2"
                      >
                        <IoTrashOutline /> Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Upload form */}
        <form onSubmit={handleUpload} className="mt-4 flex gap-2">
          <input
            type="text"
            name="title"
            placeholder="Document title"
            value={formData.title}
            onChange={handleChange}
            className="border p-2 rounded flex-grow"
          />
          <input
            type="file"
            name="file"
            ref={fileInputRef}
            onChange={handleChange}
            className="border p-2 rounded"
          />
          <button
            type="submit"
            className="bg-blue-600 text-white px-4 py-2 rounded flex items-center gap-1"
          >
            <IoCloudUploadOutline /> Upload
          </button>
        </form>
      </section>
    </div>
  );
};

export default Documents;
