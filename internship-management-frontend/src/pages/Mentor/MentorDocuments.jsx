import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useAuth } from "../../context/AuthContext";
import { getData, saveData } from "../../services/dataService";
import { uploadFile } from "../../services/fileService";
import Spinner from "../../components/ui/Spinner";
import {
  IoSearchOutline,
  IoCloudUploadOutline,
  IoDocumentTextOutline,
  IoDownloadOutline,
  IoTrashOutline,
  IoRefreshOutline,
} from "react-icons/io5";

const MentorDocuments = () => {
  const { user } = useAuth();

  const [documents, setDocuments] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });

  const loadDocuments = useCallback(
    async (refresh = false) => {
      try {
        refresh ? setRefreshing(true) : setLoading(true);
        const allDocs = (await getData("mentorDocs")) || [];
        const myDocs = allDocs.filter((doc) => doc.mentorId === user.id);
        setDocuments(myDocs);
      } catch (err) {
        console.error("Failed to load documents:", err);
        setMessage({ type: "error", text: "Failed to load documents" });
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [user.id]
  );

  useEffect(() => {
    if (user?.id) loadDocuments();
  }, [user, loadDocuments]);

  // Poll for updates every 2 minutes
  useEffect(() => {
    const interval = setInterval(() => loadDocuments(true), 120000);
    return () => clearInterval(interval);
  }, [loadDocuments]);

  // Auto clear messages
  useEffect(() => {
    if (message.text) {
      const t = setTimeout(() => setMessage({ type: "", text: "" }), 4000);
      return () => clearTimeout(t);
    }
  }, [message]);

  const filteredDocs = useMemo(() => {
    if (!searchQuery) return documents;
    const q = searchQuery.toLowerCase();
    return documents.filter(
      (doc) =>
        doc.title?.toLowerCase().includes(q) ||
        doc.description?.toLowerCase().includes(q)
    );
  }, [documents, searchQuery]);

  const handleUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const uploaded = await uploadFile(file, "mentorDocs");
      const newDoc = {
        id: `doc_${Date.now()}`,
        mentorId: user.id,
        title: file.name,
        url: uploaded.url,
        uploadedAt: new Date().toISOString(),
      };
      const all = (await getData("mentorDocs")) || [];
      await saveData("mentorDocs", [...all, newDoc]);
      setMessage({ type: "success", text: "Document uploaded" });
      loadDocuments(true);
    } catch (err) {
      console.error("Upload failed:", err);
      setMessage({ type: "error", text: "Upload failed" });
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (docId) => {
    try {
      const all = (await getData("mentorDocs")) || [];
      await saveData(
        "mentorDocs",
        all.filter((d) => d.id !== docId)
      );
      setMessage({ type: "success", text: "Document deleted" });
      loadDocuments(true);
    } catch (err) {
      console.error("Delete failed:", err);
      setMessage({ type: "error", text: "Delete failed" });
    }
  };

  if (loading) return <Spinner fullScreen text="Loading documents..." />;

  return (
    <div className="p-4 space-y-4">
      <h1 className="text-xl font-bold flex items-center gap-2">
        <IoDocumentTextOutline /> Mentor Documents
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

      {/* Search + Upload */}
      <div className="flex gap-2">
        <div className="flex items-center border rounded px-2 flex-grow">
          <IoSearchOutline />
          <input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search documents..."
            className="flex-grow p-1 outline-none"
          />
        </div>
        <label className="flex items-center gap-1 cursor-pointer border rounded px-3 py-1">
          <IoCloudUploadOutline />
          {uploading ? "Uploading..." : "Upload"}
          <input
            type="file"
            className="hidden"
            onChange={handleUpload}
            disabled={uploading}
          />
        </label>
        <button
          onClick={() => loadDocuments(true)}
          className="border rounded px-3 py-1 flex items-center gap-1"
          disabled={refreshing}
        >
          <IoRefreshOutline /> {refreshing ? "Refreshing..." : "Refresh"}
        </button>
      </div>

      {/* Documents List */}
      {filteredDocs.length === 0 ? (
        <p className="text-gray-500 p-4 border rounded">No documents found.</p>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredDocs.map((doc) => (
            <div
              key={doc.id}
              className="border rounded p-3 bg-white flex flex-col"
            >
              <h2 className="font-semibold">{doc.title}</h2>
              <p className="text-xs text-gray-500">
                Uploaded: {new Date(doc.uploadedAt).toLocaleDateString()}
              </p>
              <div className="mt-2 flex gap-2">
                <a
                  href={doc.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 text-blue-600 text-sm"
                >
                  <IoDownloadOutline /> Download
                </a>
                <button
                  onClick={() => handleDelete(doc.id)}
                  className="flex items-center gap-1 text-red-600 text-sm"
                >
                  <IoTrashOutline /> Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default MentorDocuments;
