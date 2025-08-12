// src/pages/mentor/MentorDocuments.jsx
import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useAuth } from "../../context/AuthContext";
import { getData, saveData } from "../../services/dataService";
import { uploadFile } from "../../services/fileService";
import { getInternsByMentorId } from "../../services/mockDataService";
import ProfileAvatar from "../../components/ui/ProfileAvatar";
import Spinner from "../../components/ui/Spinner";
import ConfirmationModal from "../../components/ui/ConfirmationModal";
import {
  IoCloudUploadOutline,
  IoDocumentTextOutline,
  IoSearchOutline,
  IoFilterOutline,
  IoAddOutline,
  IoTrashOutline,
  IoDownloadOutline,
  IoEyeOutline,
  IoCreateOutline,
  IoShareOutline,
  IoCopyOutline,
  IoFolderOpenOutline,
  IoFolderOutline,
  IoStarOutline,
  IoStarHalfOutline,
  IoPeopleOutline,
  IoPersonOutline,
  IoCalendarOutline,
  IoTimeOutline,
  IoCheckmarkCircleOutline,
  IoWarningOutline,
  IoInformationCircleOutline,
  IoCloseOutline,
  IoGridOutline,
  IoListOutline,
  IoOptionsOutline,
  IoRefreshOutline,
  IoArchiveOutline,
  IoLockClosedOutline,
  IoLockOpenOutline,
  IoImageOutline,
  IoVideocamOutline,
  IoMusicalNotesOutline,
  IoCodeSlashOutline,
  IoBusinessOutline,
  IoSchoolOutline,
  IoBookOutline,
  IoLibraryOutline,
  IoBriefcaseOutline,
  IoRocketOutline,
  IoTrendingUpOutline,
  IoStatsChartOutline,
  IoCloseCircleOutline,
  IoCheckboxOutline,
  IoRadioButtonOnOutline,
  IoRadioButtonOffOutline,
  IoEllipsisVerticalOutline,
  IoChevronDownOutline,
  IoChevronUpOutline,
  IoArrowUpOutline,
  IoArrowDownOutline,
  IoSyncOutline,
  IoLayers,
  IoSparklesOutline,
  IoShieldCheckmarkOutline,
  IoGlobeOutline
} from 'react-icons/io5';

const DOCUMENT_TYPES = {
  'application/pdf': { name: 'PDF', icon: IoDocumentTextOutline, color: 'text-red-600', bgColor: 'bg-red-100' },
  'application/msword': { name: 'DOC', icon: IoDocumentTextOutline, color: 'text-blue-600', bgColor: 'bg-blue-100' },
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': { name: 'DOCX', icon: IoDocumentTextOutline, color: 'text-blue-600', bgColor: 'bg-blue-100' },
  'application/vnd.ms-excel': { name: 'XLS', icon: IoStatsChartOutline, color: 'text-green-600', bgColor: 'bg-green-100' },
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': { name: 'XLSX', icon: IoStatsChartOutline, color: 'text-green-600', bgColor: 'bg-green-100' },
  'application/vnd.ms-powerpoint': { name: 'PPT', icon: IoBusinessOutline, color: 'text-orange-600', bgColor: 'bg-orange-100' },
  'application/vnd.openxmlformats-officedocument.presentationml.presentation': { name: 'PPTX', icon: IoBusinessOutline, color: 'text-orange-600', bgColor: 'bg-orange-100' },
  'image/jpeg': { name: 'JPG', icon: IoImageOutline, color: 'text-purple-600', bgColor: 'bg-purple-100' },
  'image/png': { name: 'PNG', icon: IoImageOutline, color: 'text-purple-600', bgColor: 'bg-purple-100' },
  'video/mp4': { name: 'MP4', icon: IoVideocamOutline, color: 'text-indigo-600', bgColor: 'bg-indigo-100' },
  'text/plain': { name: 'TXT', icon: IoDocumentTextOutline, color: 'text-gray-600', bgColor: 'bg-gray-100' }
};

const DOCUMENT_CATEGORIES = {
  'assignments': { name: 'Assignments', icon: IoBookOutline, color: 'text-blue-600' },
  'resources': { name: 'Learning Resources', icon: IoLibraryOutline, color: 'text-green-600' },
  'templates': { name: 'Templates', icon: IoCopyOutline, color: 'text-purple-600' },
  'certificates': { name: 'Certificates', icon: IoStarOutline, color: 'text-yellow-600' },
  'feedback': { name: 'Feedback & Reviews', icon: IoCreateOutline, color: 'text-orange-600' },
  'projects': { name: 'Project Files', icon: IoBriefcaseOutline, color: 'text-indigo-600' },
  'misc': { name: 'Miscellaneous', icon: IoFolderOutline, color: 'text-gray-600' }
};

const ALLOWED_FILE_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'image/jpeg',
  'image/png',
  'video/mp4',
  'text/plain'
];

const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB
const MAX_BULK_FILES = 10;

const VIEW_MODES = {
  GRID: 'grid',
  LIST: 'list'
};

const SORT_OPTIONS = [
  { value: 'name-asc', label: 'Name A-Z' },
  { value: 'name-desc', label: 'Name Z-A' },
  { value: 'date-desc', label: 'Newest First' },
  { value: 'date-asc', label: 'Oldest First' },
  { value: 'size-desc', label: 'Largest First' },
  { value: 'size-asc', label: 'Smallest First' },
  { value: 'type', label: 'File Type' }
];

const MentorDocuments = () => {
  const { user } = useAuth();

  // Core data state
  const [assignedInterns, setAssignedInterns] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Upload state
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState({});
  const [dragOver, setDragOver] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    internId: '',
    title: '',
    description: '',
    category: 'assignments',
    tags: [],
    isPrivate: false,
    files: []
  });

  // UI state
  const [viewMode, setViewMode] = useState(VIEW_MODES.GRID);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedIntern, setSelectedIntern] = useState('all');
  const [sortBy, setSortBy] = useState('date-desc');
  const [showFilters, setShowFilters] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showBulkUpload, setShowBulkUpload] = useState(false);

  // Selection and actions
  const [selectedDocuments, setSelectedDocuments] = useState(new Set());
  const [showDocumentDetails, setShowDocumentDetails] = useState(null);

  // Messages and modals
  const [message, setMessage] = useState({ type: '', text: '' });
  const [confirmModal, setConfirmModal] = useState({
    isOpen: false,
    type: null,
    title: '',
    message: '',
    data: null
  });

  // Analytics state
  const [analytics, setAnalytics] = useState({
    totalDocuments: 0,
    totalSize: 0,
    documentsPerIntern: {},
    categoryCounts: {},
    recentUploads: 0
  });

  // Refs
  const fileInputRef = useRef(null);
  const bulkFileInputRef = useRef(null);
  const dropZoneRef = useRef(null);

  // Load initial data
  useEffect(() => {
    loadMentorData();
  }, [user]);

  // Clear messages after 5 seconds
  useEffect(() => {
    if (message.text) {
      const timer = setTimeout(() => {
        setMessage({ type: '', text: '' });
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [message]);

  // Calculate analytics when documents change
  useEffect(() => {
    calculateAnalytics();
  }, [documents]);

  const loadMentorData = async () => {
    setLoading(true);
    try {
      // Load assigned interns
      const interns = await getInternsByMentorId(user.id);
      setAssignedInterns(interns);

      // Load shared documents
      const existingDocs = getData("sharedDocuments") || [];
      const mentorDocs = existingDocs.filter(doc => doc.uploadedBy === user.id);
      
      // Enrich documents with additional metadata
      const enrichedDocs = mentorDocs.map(doc => ({
        ...doc,
        uploadedAt: doc.uploadedAt || new Date().toISOString(),
        category: doc.category || 'misc',
        tags: doc.tags || [],
        isPrivate: doc.isPrivate || false,
        downloads: doc.downloads || 0,
        views: doc.views || 0,
        fileType: doc.fileType || 'application/pdf',
        fileSize: doc.fileSize || 0,
        version: doc.version || 1,
        status: doc.status || 'active'
      }));

      setDocuments(enrichedDocs);

    } catch (error) {
      console.error("Failed to load mentor data:", error);
      setMessage({ type: "error", text: "Failed to load documents" });
    } finally {
      setLoading(false);
    }
  };

  const calculateAnalytics = () => {
    const totalDocuments = documents.length;
    const totalSize = documents.reduce((sum, doc) => sum + (doc.fileSize || 0), 0);
    
    const documentsPerIntern = {};
    const categoryCounts = {};
    
    documents.forEach(doc => {
      // Count by intern
      if (doc.internId) {
        documentsPerIntern[doc.internId] = (documentsPerIntern[doc.internId] || 0) + 1;
      }
      
      // Count by category
      const category = doc.category || 'misc';
      categoryCounts[category] = (categoryCounts[category] || 0) + 1;
    });

    // Recent uploads (last 7 days)
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const recentUploads = documents.filter(doc => 
      new Date(doc.uploadedAt) >= weekAgo
    ).length;

    setAnalytics({
      totalDocuments,
      totalSize,
      documentsPerIntern,
      categoryCounts,
      recentUploads
    });
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleFileSelect = (files) => {
    const validFiles = [];
    const errors = [];

    Array.from(files).forEach(file => {
      // Validate file type
      if (!ALLOWED_FILE_TYPES.includes(file.type)) {
        errors.push(`${file.name}: Unsupported file type`);
        return;
      }

      // Validate file size
      if (file.size > MAX_FILE_SIZE) {
        errors.push(`${file.name}: File size exceeds 50MB limit`);
        return;
      }

      validFiles.push(file);
    });

    if (errors.length > 0) {
      setMessage({ type: "error", text: errors.join(', ') });
    }

    if (validFiles.length > 0) {
      setFormData(prev => ({
        ...prev,
        files: showBulkUpload ? validFiles : [validFiles[0]]
      }));
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setDragOver(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    
    const files = Array.from(e.dataTransfer.files);
    if (files.length > MAX_BULK_FILES) {
      setMessage({ type: "error", text: `Maximum ${MAX_BULK_FILES} files allowed` });
      return;
    }

    handleFileSelect(files);
  };

  const handleUpload = async () => {
    if (!formData.internId || !formData.title || formData.files.length === 0) {
      setMessage({ type: "error", text: "Please fill in all required fields and select files" });
      return;
    }

    setUploading(true);
    const uploadResults = [];

    try {
      for (const file of formData.files) {
        setUploadProgress(prev => ({ ...prev, [file.name]: 0 }));

        // Simulate upload progress
        const progressInterval = setInterval(() => {
          setUploadProgress(prev => ({
            ...prev,
            [file.name]: Math.min((prev[file.name] || 0) + 10, 90)
          }));
        }, 100);

        try {
          const result = await uploadFile(file, `mentor_documents/${user.id}`);
          clearInterval(progressInterval);
          
          setUploadProgress(prev => ({ ...prev, [file.name]: 100 }));

          const documentData = {
            id: `doc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            internId: formData.internId,
            title: formData.files.length === 1 ? formData.title : `${formData.title} - ${file.name}`,
            description: formData.description,
            fileName: file.name,
            fileType: file.type,
            fileSize: file.size,
            uploadedBy: user.id,
            uploadedByName: user.name,
            uploadedAt: new Date().toISOString(),
            category: formData.category,
            tags: formData.tags,
            isPrivate: formData.isPrivate,
            url: result.url,
            downloads: 0,
            views: 0,
            version: 1,
            status: 'active'
          };

          uploadResults.push(documentData);

        } catch (error) {
          clearInterval(progressInterval);
          console.error(`Failed to upload ${file.name}:`, error);
          setMessage({ type: "error", text: `Failed to upload ${file.name}` });
        }
      }

      if (uploadResults.length > 0) {
        // Save to storage
        const existingDocs = getData("sharedDocuments") || [];
        const updatedDocs = [...existingDocs, ...uploadResults];
        await saveData("sharedDocuments", updatedDocs);

        // Update local state
        setDocuments(prev => [...prev, ...uploadResults]);

        // Reset form
        setFormData({
          internId: '',
          title: '',
          description: '',
          category: 'assignments',
          tags: [],
          isPrivate: false,
          files: []
        });

        setShowUploadModal(false);
        setShowBulkUpload(false);
        setMessage({ 
          type: "success", 
          text: `Successfully uploaded ${uploadResults.length} document(s)` 
        });
      }

    } catch (error) {
      console.error("Upload process failed:", error);
      setMessage({ type: "error", text: "Upload process failed" });
    } finally {
      setUploading(false);
      setUploadProgress({});
    }
  };

  const handleDeleteDocument = async (documentId) => {
    try {
      const existingDocs = getData("sharedDocuments") || [];
      const updatedDocs = existingDocs.filter(doc => doc.id !== documentId);
      await saveData("sharedDocuments", updatedDocs);

      setDocuments(prev => prev.filter(doc => doc.id !== documentId));
      setMessage({ type: "success", text: "Document deleted successfully" });

    } catch (error) {
      console.error("Failed to delete document:", error);
      setMessage({ type: "error", text: "Failed to delete document" });
    }
  };

  const handleBulkDelete = async () => {
    if (selectedDocuments.size === 0) return;

    try {
      const existingDocs = getData("sharedDocuments") || [];
      const updatedDocs = existingDocs.filter(doc => !selectedDocuments.has(doc.id));
      await saveData("sharedDocuments", updatedDocs);

      setDocuments(prev => prev.filter(doc => !selectedDocuments.has(doc.id)));
      setSelectedDocuments(new Set());
      setMessage({ 
        type: "success", 
        text: `Successfully deleted ${selectedDocuments.size} document(s)` 
      });

    } catch (error) {
      console.error("Failed to delete documents:", error);
      setMessage({ type: "error", text: "Failed to delete documents" });
    }
  };

  const incrementViewCount = async (documentId) => {
    try {
      const existingDocs = getData("sharedDocuments") || [];
      const updatedDocs = existingDocs.map(doc => 
        doc.id === documentId 
          ? { ...doc, views: (doc.views || 0) + 1 }
          : doc
      );
      await saveData("sharedDocuments", updatedDocs);

      setDocuments(prev => prev.map(doc => 
        doc.id === documentId 
          ? { ...doc, views: (doc.views || 0) + 1 }
          : doc
      ));

    } catch (error) {
      console.error("Failed to update view count:", error);
    }
  };

  const incrementDownloadCount = async (documentId) => {
    try {
      const existingDocs = getData("sharedDocuments") || [];
      const updatedDocs = existingDocs.map(doc => 
        doc.id === documentId 
          ? { ...doc, downloads: (doc.downloads || 0) + 1 }
          : doc
      );
      await saveData("sharedDocuments", updatedDocs);

      setDocuments(prev => prev.map(doc => 
        doc.id === documentId 
          ? { ...doc, downloads: (doc.downloads || 0) + 1 }
          : doc
      ));

    } catch (error) {
      console.error("Failed to update download count:", error);
    }
  };

  // Filter and sort documents
  const filteredAndSortedDocuments = useMemo(() => {
    let filtered = documents.filter(doc => {
      const matchesSearch = !searchQuery || 
        doc.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        doc.fileName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        doc.description?.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesCategory = selectedCategory === 'all' || doc.category === selectedCategory;
      
      const matchesIntern = selectedIntern === 'all' || doc.internId === selectedIntern;

      return matchesSearch && matchesCategory && matchesIntern;
    });

    // Sort documents
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'name-asc':
          return a.title.localeCompare(b.title);
        case 'name-desc':
          return b.title.localeCompare(a.title);
        case 'date-desc':
          return new Date(b.uploadedAt) - new Date(a.uploadedAt);
        case 'date-asc':
          return new Date(a.uploadedAt) - new Date(b.uploadedAt);
        case 'size-desc':
          return (b.fileSize || 0) - (a.fileSize || 0);
        case 'size-asc':
          return (a.fileSize || 0) - (b.fileSize || 0);
        case 'type':
          return (a.fileType || '').localeCompare(b.fileType || '');
        default:
          return new Date(b.uploadedAt) - new Date(a.uploadedAt);
      }
    });

    return filtered;
  }, [documents, searchQuery, selectedCategory, selectedIntern, sortBy]);

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getFileTypeInfo = (fileType) => {
    return DOCUMENT_TYPES[fileType] || DOCUMENT_TYPES['text/plain'];
  };

  const handleSelectAll = () => {
    if (selectedDocuments.size === filteredAndSortedDocuments.length) {
      setSelectedDocuments(new Set());
    } else {
      setSelectedDocuments(new Set(filteredAndSortedDocuments.map(doc => doc.id)));
    }
  };

  const renderDocumentCard = (document) => {
    const intern = assignedInterns.find(i => i.id === document.internId);
    const fileTypeInfo = getFileTypeInfo(document.fileType);
    const isSelected = selectedDocuments.has(document.id);
    const FileIcon = fileTypeInfo.icon;

    return (
      <div
        key={document.id}
        className={`bg-white rounded-lg shadow-sm border-2 p-4 hover:shadow-md transition-all duration-200 ${
          isSelected ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
        }`}
      >
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center space-x-3">
            <input
              type="checkbox"
              checked={isSelected}
              onChange={(e) => {
                const newSelected = new Set(selectedDocuments);
                if (e.target.checked) {
                  newSelected.add(document.id);
                } else {
                  newSelected.delete(document.id);
                }
                setSelectedDocuments(newSelected);
              }}
              className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
            <div className={`p-2 rounded-lg ${fileTypeInfo.bgColor}`}>
              <FileIcon className={`w-6 h-6 ${fileTypeInfo.color}`} />
            </div>
          </div>
          
          <div className="flex items-center space-x-1">
            <button
              onClick={() => {
                incrementViewCount(document.id);
                window.open(document.url, '_blank');
              }}
              className="p-1 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded"
              title="Preview"
            >
              <IoEyeOutline className="w-4 h-4" />
            </button>
            <button
              onClick={() => {
                incrementDownloadCount(document.id);
                const link = document.createElement('a');
                link.href = document.url;
                link.download = document.fileName;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
              }}
              className="p-1 text-gray-500 hover:text-green-600 hover:bg-green-50 rounded"
              title="Download"
            >
              <IoDownloadOutline className="w-4 h-4" />
            </button>
            <button
              onClick={() => setConfirmModal({
                isOpen: true,
                type: 'delete',
                title: 'Delete Document',
                message: `Are you sure you want to delete "${document.title}"?`,
                data: document.id
              })}
              className="p-1 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded"
              title="Delete"
            >
              <IoTrashOutline className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="mb-3">
          <h3 className="font-semibold text-gray-900 mb-1 line-clamp-2">{document.title}</h3>
          <p className="text-sm text-gray-500 line-clamp-1">{document.fileName}</p>
          {document.description && (
            <p className="text-sm text-gray-600 mt-1 line-clamp-2">{document.description}</p>
          )}
        </div>

        <div className="flex items-center justify-between text-xs text-gray-500 mb-3">
          <span>{formatFileSize(document.fileSize)}</span>
          <span className={`px-2 py-1 rounded-full ${DOCUMENT_CATEGORIES[document.category]?.color || 'text-gray-600'} bg-opacity-20`}>
            {DOCUMENT_CATEGORIES[document.category]?.name || 'Miscellaneous'}
          </span>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            {intern && <ProfileAvatar user={intern} size="xs" />}
            <span className="text-sm text-gray-600 truncate">
              {intern ? intern.name : 'Unknown Intern'}
            </span>
          </div>
          
          <div className="flex items-center space-x-3 text-xs text-gray-500">
            <span className="flex items-center">
              <IoEyeOutline className="w-3 h-3 mr-1" />
              {document.views || 0}
            </span>
            <span className="flex items-center">
              <IoDownloadOutline className="w-3 h-3 mr-1" />
              {document.downloads || 0}
            </span>
          </div>
        </div>

        <div className="mt-3 pt-3 border-t border-gray-100">
          <div className="flex items-center justify-between text-xs text-gray-500">
            <span>{formatDate(document.uploadedAt)}</span>
            <div className="flex items-center space-x-1">
              {document.isPrivate && (
                <IoLockClosedOutline className="w-3 h-3 text-orange-500" title="Private" />
              )}
              {document.tags && document.tags.length > 0 && (
                <span className="px-1 py-0.5 bg-gray-100 rounded text-xs">
                  +{document.tags.length} tags
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderDocumentRow = (document) => {
    const intern = assignedInterns.find(i => i.id === document.internId);
    const fileTypeInfo = getFileTypeInfo(document.fileType);
    const isSelected = selectedDocuments.has(document.id);
    const FileIcon = fileTypeInfo.icon;

    return (
      <tr
        key={document.id}
        className={`hover:bg-gray-50 ${isSelected ? 'bg-blue-50' : ''}`}
      >
        <td className="px-6 py-4 whitespace-nowrap">
          <input
            type="checkbox"
            checked={isSelected}
            onChange={(e) => {
              const newSelected = new Set(selectedDocuments);
              if (e.target.checked) {
                newSelected.add(document.id);
              } else {
                newSelected.delete(document.id);
              }
              setSelectedDocuments(newSelected);
            }}
            className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
          />
        </td>
        
        <td className="px-6 py-4 whitespace-nowrap">
          <div className="flex items-center">
            <div className={`p-2 rounded-lg ${fileTypeInfo.bgColor} mr-3`}>
              <FileIcon className={`w-5 h-5 ${fileTypeInfo.color}`} />
            </div>
            <div>
              <div className="text-sm font-medium text-gray-900">{document.title}</div>
              <div className="text-sm text-gray-500">{document.fileName}</div>
            </div>
          </div>
        </td>
        
        <td className="px-6 py-4 whitespace-nowrap">
          <div className="flex items-center">
            {intern && <ProfileAvatar user={intern} size="xs" className="mr-2" />}
            <span className="text-sm text-gray-900">{intern ? intern.name : 'Unknown'}</span>
          </div>
        </td>
        
        <td className="px-6 py-4 whitespace-nowrap">
          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${DOCUMENT_CATEGORIES[document.category]?.color || 'text-gray-600'} bg-opacity-20`}>
            {DOCUMENT_CATEGORIES[document.category]?.name || 'Miscellaneous'}
          </span>
        </td>
        
        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
          {formatFileSize(document.fileSize)}
        </td>
        
        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
          {formatDate(document.uploadedAt)}
        </td>
        
        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
          <div className="flex items-center space-x-4">
            <span className="flex items-center">
              <IoEyeOutline className="w-4 h-4 mr-1" />
              {document.views || 0}
            </span>
            <span className="flex items-center">
              <IoDownloadOutline className="w-4 h-4 mr-1" />
              {document.downloads || 0}
            </span>
          </div>
        </td>
        
        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
          <div className="flex items-center justify-end space-x-2">
            <button
              onClick={() => {
                incrementViewCount(document.id);
                window.open(document.url, '_blank');
              }}
              className="text-blue-600 hover:text-blue-900"
              title="Preview"
            >
              <IoEyeOutline className="w-4 h-4" />
            </button>
            <button
              onClick={() => {
                incrementDownloadCount(document.id);
                const link = document.createElement('a');
                link.href = document.url;
                link.download = document.fileName;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
              }}
              className="text-green-600 hover:text-green-900"
              title="Download"
            >
              <IoDownloadOutline className="w-4 h-4" />
            </button>
            <button
              onClick={() => setConfirmModal({
                isOpen: true,
                type: 'delete',
                title: 'Delete Document',
                message: `Are you sure you want to delete "${document.title}"?`,
                data: document.id
              })}
              className="text-red-600 hover:text-red-900"
              title="Delete"
            >
              <IoTrashOutline className="w-4 h-4" />
            </button>
          </div>
        </td>
      </tr>
    );
  };

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="text-center">
          <Spinner size="lg" text="Loading documents..." />
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center">
            <IoFolderOpenOutline className="mr-3" />
            Document Management
          </h1>
          <p className="text-gray-600 mt-2">Manage and share documents with your assigned interns</p>
        </div>
        
        <div className="flex items-center space-x-3">
          <button
            onClick={() => setShowBulkUpload(true)}
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
          >
            <IoCloudUploadOutline className="w-4 h-4 mr-2" />
            Bulk Upload
          </button>
          
          <button
            onClick={() => setShowUploadModal(true)}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
          >
            <IoAddOutline className="w-4 h-4 mr-2" />
            Upload Document
          </button>
        </div>
      </div>

      {/* Messages */}
      {message.text && (
        <div className={`mb-6 p-4 rounded-md ${
          message.type === "success" ? "bg-green-50 border border-green-200" : "bg-red-50 border border-red-200"
        }`}>
          <div className="flex items-center">
            {message.type === "success" ? (
              <IoCheckmarkCircleOutline className="w-5 h-5 text-green-600 mr-2" />
            ) : (
              <IoWarningOutline className="w-5 h-5 text-red-600 mr-2" />
            )}
            <p className={message.type === "success" ? "text-green-700" : "text-red-700"}>
              {message.text}
            </p>
          </div>
        </div>
      )}

      {/* Analytics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <IoDocumentTextOutline className="w-8 h-8 text-blue-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Total Documents</p>
              <p className="text-2xl font-semibold text-gray-900">{analytics.totalDocuments}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <IoCloudUploadOutline className="w-8 h-8 text-green-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Storage Used</p>
              <p className="text-2xl font-semibold text-gray-900">{formatFileSize(analytics.totalSize)}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <IoRocketOutline className="w-8 h-8 text-purple-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Recent Uploads</p>
              <p className="text-2xl font-semibold text-gray-900">{analytics.recentUploads}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <IoPeopleOutline className="w-8 h-8 text-orange-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Active Interns</p>
              <p className="text-2xl font-semibold text-gray-900">{assignedInterns.length}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Search */}
          <div className="flex-1">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <IoSearchOutline className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search documents by title, filename, or description..."
                className="block w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>

          {/* Filters */}
          <div className="flex flex-wrap gap-4">
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">All Categories</option>
              {Object.entries(DOCUMENT_CATEGORIES).map(([key, category]) => (
                <option key={key} value={key}>{category.name}</option>
              ))}
            </select>

            <select
              value={selectedIntern}
              onChange={(e) => setSelectedIntern(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">All Interns</option>
              {assignedInterns.map(intern => (
                <option key={intern.id} value={intern.id}>{intern.name}</option>
              ))}
            </select>

            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            >
              {SORT_OPTIONS.map(option => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex items-center justify-between mt-4">
          <div className="flex items-center space-x-4">
            {selectedDocuments.size > 0 && (
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-500">
                  {selectedDocuments.size} selected
                </span>
                <button
                  onClick={() => setConfirmModal({
                    isOpen: true,
                    type: 'bulkDelete',
                    title: 'Delete Documents',
                    message: `Are you sure you want to delete ${selectedDocuments.size} document(s)?`,
                    data: null
                  })}
                  className="text-sm text-red-600 hover:text-red-700 font-medium"
                >
                  Delete Selected
                </button>
              </div>
            )}
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={handleSelectAll}
              className="text-sm text-blue-600 hover:text-blue-700 font-medium"
            >
              {selectedDocuments.size === filteredAndSortedDocuments.length ? 'Deselect All' : 'Select All'}
            </button>

            <div className="flex border border-gray-300 rounded-lg">
              <button
                onClick={() => setViewMode(VIEW_MODES.GRID)}
                className={`p-2 ${viewMode === VIEW_MODES.GRID ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-gray-100'} rounded-l-lg transition-colors`}
              >
                <IoGridOutline className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode(VIEW_MODES.LIST)}
                className={`p-2 ${viewMode === VIEW_MODES.LIST ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-gray-100'} rounded-r-lg transition-colors`}
              >
                <IoListOutline className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Documents Display */}
      {filteredAndSortedDocuments.length === 0 ? (
        <div className="text-center py-12">
          <IoFolderOpenOutline className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No documents found</h3>
          <p className="text-gray-500 mb-6">
            {documents.length === 0 
              ? "Start by uploading your first document to share with interns"
              : "Try adjusting your search or filters to find what you're looking for"
            }
          </p>
          <button
            onClick={() => setShowUploadModal(true)}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
          >
            <IoAddOutline className="w-4 h-4 mr-2" />
            Upload First Document
          </button>
        </div>
      ) : viewMode === VIEW_MODES.GRID ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredAndSortedDocuments.map(renderDocumentCard)}
        </div>
      ) : (
        <div className="bg-white shadow-sm rounded-lg overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <input
                    type="checkbox"
                    checked={selectedDocuments.size === filteredAndSortedDocuments.length && filteredAndSortedDocuments.length > 0}
                    onChange={handleSelectAll}
                    className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Document
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Intern
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Category
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Size
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Uploaded
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Activity
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredAndSortedDocuments.map(renderDocumentRow)}
            </tbody>
          </table>
        </div>
      )}

      {/* Upload Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center p-6 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">Upload Document</h3>
              <button
                onClick={() => setShowUploadModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <IoCloseOutline className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Drag and Drop Zone */}
              <div
                ref={dropZoneRef}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                  dragOver ? 'border-blue-400 bg-blue-50' : 'border-gray-300'
                }`}
              >
                <IoCloudUploadOutline className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                <p className="text-lg font-medium text-gray-900 mb-2">
                  Drop files here or click to select
                </p>
                <p className="text-sm text-gray-500 mb-4">
                  Supports PDF, DOC, DOCX, XLS, XLSX, PPT, PPTX, images, and more
                </p>
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple={showBulkUpload}
                  accept={ALLOWED_FILE_TYPES.join(',')}
                  onChange={(e) => handleFileSelect(e.target.files)}
                  className="hidden"
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                >
                  <IoFolderOpenOutline className="w-4 h-4 mr-2" />
                  Select Files
                </button>
              </div>

              {/* Form Fields */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Select Intern *
                  </label>
                  <select
                    name="internId"
                    value={formData.internId}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    required
                  >
                    <option value="">-- Select Intern --</option>
                    {assignedInterns.map(intern => (
                      <option key={intern.id} value={intern.id}>{intern.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Category
                  </label>
                  <select
                    name="category"
                    value={formData.category}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  >
                    {Object.entries(DOCUMENT_CATEGORIES).map(([key, category]) => (
                      <option key={key} value={key}>{category.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Document Title *
                </label>
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  placeholder="e.g., Assignment 1 Instructions"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description (Optional)
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Provide additional context or instructions..."
                />
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="isPrivate"
                  name="isPrivate"
                  checked={formData.isPrivate}
                  onChange={handleInputChange}
                  className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <label htmlFor="isPrivate" className="ml-2 text-sm text-gray-700">
                  Private document (only visible to you and the selected intern)
                </label>
              </div>

              {/* Selected Files Preview */}
              {formData.files.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium text-gray-900 mb-3">Selected Files</h4>
                  <div className="space-y-2">
                    {formData.files.map((file, index) => {
                      const fileTypeInfo = getFileTypeInfo(file.type);
                      const FileIcon = fileTypeInfo.icon;
                      const progress = uploadProgress[file.name] || 0;
                      
                      return (
                        <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-md">
                          <div className="flex items-center">
                            <div className={`p-2 rounded ${fileTypeInfo.bgColor} mr-3`}>
                              <FileIcon className={`w-4 h-4 ${fileTypeInfo.color}`} />
                            </div>
                            <div>
                              <div className="text-sm font-medium">{file.name}</div>
                              <div className="text-xs text-gray-500">{formatFileSize(file.size)}</div>
                            </div>
                          </div>
                          
                          {uploading && progress > 0 && (
                            <div className="flex items-center space-x-2">
                              <div className="w-20 bg-gray-200 rounded-full h-2">
                                <div 
                                  className="bg-blue-600 h-2 rounded-full transition-all duration-300" 
                                  style={{ width: `${progress}%` }}
                                ></div>
                              </div>
                              <span className="text-xs text-gray-500">{progress}%</span>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            <div className="bg-gray-50 px-6 py-3 border-t border-gray-200 flex justify-end space-x-3">
              <button
                onClick={() => setShowUploadModal(false)}
                className="px-4 py-2 text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50"
                disabled={uploading}
              >
                Cancel
              </button>
              <button
                onClick={handleUpload}
                disabled={uploading || formData.files.length === 0 || !formData.internId || !formData.title}
                className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
              >
                {uploading ? (
                  <>
                    <Spinner size="sm" color="white" className="mr-2" />
                    Uploading...
                  </>
                ) : (
                  <>
                    <IoCloudUploadOutline className="w-4 h-4 mr-2" />
                    Upload Document{formData.files.length > 1 ? 's' : ''}
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Upload Modal */}
      {showBulkUpload && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center p-6 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">Bulk Upload Documents</h3>
              <button
                onClick={() => setShowBulkUpload(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <IoCloseOutline className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6">
              <div className="mb-6">
                <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
                  <div className="flex">
                    <IoInformationCircleOutline className="w-5 h-5 text-blue-600 mt-0.5 mr-3" />
                    <div className="text-sm text-blue-700">
                      <p className="font-medium">Bulk Upload Tips:</p>
                      <ul className="mt-2 list-disc list-inside space-y-1">
                        <li>Upload up to {MAX_BULK_FILES} files at once</li>
                        <li>Each file must be under {formatFileSize(MAX_FILE_SIZE)}</li>
                        <li>All files will be assigned to the same intern and category</li>
                        <li>You can drag and drop multiple files or select them using the button below</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>

              {/* Same form content as single upload but adapted for bulk */}
              <div className="space-y-6">
                {/* Drag and Drop Zone */}
                <div
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  className={`border-2 border-dashed rounded-lg p-12 text-center transition-colors ${
                    dragOver ? 'border-blue-400 bg-blue-50' : 'border-gray-300'
                  }`}
                >
                  <IoCloudUploadOutline className="mx-auto h-16 w-16 text-gray-400 mb-4" />
                  <p className="text-xl font-medium text-gray-900 mb-2">
                    Drop multiple files here or click to select
                  </p>
                  <p className="text-sm text-gray-500 mb-6">
                    Upload up to {MAX_BULK_FILES} files at once (max {formatFileSize(MAX_FILE_SIZE)} each)
                  </p>
                  <input
                    ref={bulkFileInputRef}
                    type="file"
                    multiple
                    accept={ALLOWED_FILE_TYPES.join(',')}
                    onChange={(e) => handleFileSelect(e.target.files)}
                    className="hidden"
                  />
                  <button
                    onClick={() => bulkFileInputRef.current?.click()}
                    className="inline-flex items-center px-6 py-3 border border-gray-300 rounded-md shadow-sm text-base font-medium text-gray-700 bg-white hover:bg-gray-50"
                  >
                    <IoFolderOpenOutline className="w-5 h-5 mr-2" />
                    Select Multiple Files
                  </button>
                </div>

                {/* Form fields for bulk upload */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Select Intern *
                    </label>
                    <select
                      name="internId"
                      value={formData.internId}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                      required
                    >
                      <option value="">-- Select Intern --</option>
                      {assignedInterns.map(intern => (
                        <option key={intern.id} value={intern.id}>{intern.name}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Category
                    </label>
                    <select
                      name="category"
                      value={formData.category}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    >
                      {Object.entries(DOCUMENT_CATEGORIES).map(([key, category]) => (
                        <option key={key} value={key}>{category.name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Batch Title Prefix *
                  </label>
                  <input
                    type="text"
                    name="title"
                    value={formData.title}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    placeholder="e.g., Week 1 Materials"
                    required
                  />
                  <p className="text-sm text-gray-500 mt-1">
                    This prefix will be added to each file name
                  </p>
                </div>

                {/* Selected Files Preview for Bulk */}
                {formData.files.length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium text-gray-900 mb-3">
                      Selected Files ({formData.files.length}/{MAX_BULK_FILES})
                    </h4>
                    <div className="max-h-64 overflow-y-auto space-y-2">
                      {formData.files.map((file, index) => {
                        const fileTypeInfo = getFileTypeInfo(file.type);
                        const FileIcon = fileTypeInfo.icon;
                        const progress = uploadProgress[file.name] || 0;
                        
                        return (
                          <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-md">
                            <div className="flex items-center flex-1">
                              <div className={`p-2 rounded ${fileTypeInfo.bgColor} mr-3`}>
                                <FileIcon className={`w-4 h-4 ${fileTypeInfo.color}`} />
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="text-sm font-medium truncate">{file.name}</div>
                                <div className="text-xs text-gray-500">{formatFileSize(file.size)}</div>
                              </div>
                            </div>
                            
                            {uploading && progress > 0 ? (
                              <div className="flex items-center space-x-2">
                                <div className="w-20 bg-gray-200 rounded-full h-2">
                                  <div 
                                    className="bg-blue-600 h-2 rounded-full transition-all duration-300" 
                                    style={{ width: `${progress}%` }}
                                  ></div>
                                </div>
                                <span className="text-xs text-gray-500">{progress}%</span>
                              </div>
                            ) : (
                              <button
                                onClick={() => {
                                  const newFiles = formData.files.filter((_, i) => i !== index);
                                  setFormData(prev => ({ ...prev, files: newFiles }));
                                }}
                                className="text-red-500 hover:text-red-700 p-1"
                              >
                                <IoTrashOutline className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="bg-gray-50 px-6 py-3 border-t border-gray-200 flex justify-end space-x-3">
              <button
                onClick={() => setShowBulkUpload(false)}
                className="px-4 py-2 text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50"
                disabled={uploading}
              >
                Cancel
              </button>
              <button
                onClick={handleUpload}
                disabled={uploading || formData.files.length === 0 || !formData.internId || !formData.title}
                className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
              >
                {uploading ? (
                  <>
                    <Spinner size="sm" color="white" className="mr-2" />
                    Uploading {formData.files.length} files...
                  </>
                ) : (
                  <>
                    <IoCloudUploadOutline className="w-4 h-4 mr-2" />
                    Upload {formData.files.length} Documents
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal */}
      <ConfirmationModal
        isOpen={confirmModal.isOpen}
        onClose={() => setConfirmModal({ isOpen: false, type: null, title: '', message: '', data: null })}
        onConfirm={() => {
          if (confirmModal.type === 'delete') {
            handleDeleteDocument(confirmModal.data);
          } else if (confirmModal.type === 'bulkDelete') {
            handleBulkDelete();
          }
          setConfirmModal({ isOpen: false, type: null, title: '', message: '', data: null });
        }}
        title={confirmModal.title}
        message={confirmModal.message}
        confirmText="Delete"
        cancelText="Cancel"
        danger={true}
      />
    </div>
  );
};

export default MentorDocuments;
