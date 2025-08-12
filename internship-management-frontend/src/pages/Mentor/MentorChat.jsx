// src/pages/mentor/MentorChat.jsx
import React, {
  useState,
  useEffect,
  useRef,
  useCallback,
  useMemo,
} from "react";
import { useAuth } from "../../context/AuthContext";
import { getData, saveData } from "../../services/dataService";
import { uploadFile } from "../../services/fileService";
import {
  getInternsByMentorId,
  getConversationsForMentor,
} from "../../services/mockDataService";
import ProfileAvatar from "../../components/ui/ProfileAvatar";
import Spinner from "../../components/ui/Spinner";
import ConfirmationModal from "../../components/ui/ConfirmationModal";
import {
  IoSendOutline,
  IoSearchOutline,
  IoAttachOutline,
  IoEmojiHappyOutline,
  IoCallOutline,
  IoVideocamOutline,
  IoInformationCircleOutline,
  IoSettingsOutline,
  IoNotificationsOutline,
  IoPersonAddOutline,
  IoPersonOutline,
  IoPeopleOutline,
  IoCheckmarkDoneOutline,
  IoCheckmarkOutline,
  IoTimeOutline,
  IoEyeOutline,
  IoDownloadOutline,
  IoImageOutline,
  IoDocumentTextOutline,
  IoMicOutline,
  IoStopOutline,
  IoPlayOutline,
  IoPauseOutline,
  IoVolumeHighOutline,
  IoVolumeMuteOutline,
  IoHappyOutline,
  IoSadOutline,
  IoHeartOutline,
  IoThumbsUpOutline,
  IoReplyOutline,
  IoForwardOutline,
  IoCopyOutline,
  IoTrashOutline,
  IoFlagOutline,
  IoStarOutline,
  IoArchiveOutline,
  IoPinOutline,
  IoLockClosedOutline,
  IoShieldCheckmarkOutline,
  IoGlobeOutline,
  IoBusinessOutline,
  IoSchoolOutline,
  IoRefreshOutline,
  IoCloseOutline,
  IoAddOutline,
  IoRemoveOutline,
  IoOptionsOutline,
  IoFilterOutline,
  IoCalendarOutline,
  IoLocationOutline,
  IoLinkOutline,
  IoCodeSlashOutline,
  IoListOutline,
  IoBulbOutline,
  IoWarningOutline,
  IoCheckboxOutline,
  IoRadioButtonOnOutline,
  IoEllipsisVerticalOutline,
  IoEllipsisHorizontalOutline,
  IoChevronDownOutline,
  IoChevronUpOutline,
  IoTrendingUpOutline,
  IoStatsChartOutline,
  IoCloudUploadOutline,
  IoFolderOutline,
  IoMenuOutline,
  IoCloseCircleOutline,
} from "react-icons/io5";

const MESSAGE_TYPES = {
  TEXT: "text",
  IMAGE: "image",
  FILE: "file",
  VOICE: "voice",
  SYSTEM: "system",
  ASSIGNMENT: "assignment",
  FEEDBACK: "feedback",
};

const MESSAGE_STATUS = {
  SENDING: "sending",
  SENT: "sent",
  DELIVERED: "delivered",
  READ: "read",
  FAILED: "failed",
};

const CONVERSATION_FILTERS = {
  ALL: "all",
  UNREAD: "unread",
  ACTIVE: "active",
  ARCHIVED: "archived",
  PRIORITY: "priority",
};

const EMOJI_REACTIONS = [
  "👍",
  "❤️",
  "😂",
  "😮",
  "😢",
  "😡",
  "👏",
  "🎉",
  "🚀",
  "💡",
];

const QUICK_REPLIES = [
  "Great work!",
  "Let's schedule a meeting",
  "Please review this",
  "Can you clarify?",
  "Thanks for the update",
  "Looking forward to your progress",
  "Feel free to ask questions",
  "Excellent progress!",
];

const MENTOR_ACTIONS = [
  { id: "assignment", label: "Create Assignment", icon: IoDocumentTextOutline },
  { id: "feedback", label: "Give Feedback", icon: IoStarOutline },
  { id: "meeting", label: "Schedule Meeting", icon: IoCalendarOutline },
  { id: "resource", label: "Share Resource", icon: IoLinkOutline },
];

const MentorChat = () => {
  const { user } = useAuth();

  // Core state
  const [interns, setInterns] = useState([]);
  const [conversations, setConversations] = useState({});
  const [messages, setMessages] = useState({});
  const [selectedInternId, setSelectedInternId] = useState(null);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);

  // UI state
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [conversationFilter, setConversationFilter] = useState(
    CONVERSATION_FILTERS.ALL
  );
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showAttachments, setShowAttachments] = useState(false);
  const [showInternInfo, setShowInternInfo] = useState(false);
  const [showMentorActions, setShowMentorActions] = useState(false);
  const [selectedMessage, setSelectedMessage] = useState(null);
  const [replyingTo, setReplyingTo] = useState(null);

  // Media and interaction states
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [recordingVoice, setRecordingVoice] = useState(false);
  const [playingVoice, setPlayingVoice] = useState(null);
  const [typingIndicators, setTypingIndicators] = useState(new Set());

  // Message and conversation management
  const [messageFilter, setMessageFilter] = useState("all");
  const [searchResults, setSearchResults] = useState([]);
  const [conversationStats, setConversationStats] = useState({});
  const [error, setError] = useState("");
  const [message, setMessage] = useState({ type: "", text: "" });

  // Modal states
  const [confirmModal, setConfirmModal] = useState({
    isOpen: false,
    type: null,
    title: "",
    message: "",
    data: null,
  });

  // Assignment/feedback modal
  const [actionModal, setActionModal] = useState({
    isOpen: false,
    type: null,
    internId: null,
    data: {},
  });

  // Refs
  const chatEndRef = useRef(null);
  const messageInputRef = useRef(null);
  const fileInputRef = useRef(null);
  const emojiPickerRef = useRef(null);

  // Load initial data
  useEffect(() => {
    if (user?.id) {
      loadMentorData();
    }
  }, [user]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, selectedInternId]);

  // Simulate real-time updates
  useEffect(() => {
    if (selectedInternId) {
      const interval = setInterval(() => {
        simulateInternActivity();
        updateMessageStatus();
      }, 8000);
      return () => clearInterval(interval);
    }
  }, [selectedInternId]);

  const loadMentorData = async () => {
    setLoading(true);
    try {
      const [internsData, conversationsData] = await Promise.all([
        getInternsByMentorId(user.id),
        getConversationsForMentor(user.id),
      ]);

      setInterns(internsData);

      // Load messages for each conversation
      const allMessages = {};
      const stats = {};

      for (const intern of internsData) {
        const internMessages =
          getData(`messages_${user.id}_${intern.id}`) ||
          conversationsData[intern.id] ||
          [];
        allMessages[intern.id] = internMessages;

        // Calculate conversation stats
        stats[intern.id] = {
          totalMessages: internMessages.length,
          unreadCount: internMessages.filter(
            (msg) =>
              msg.senderId === intern.id && !msg.readBy?.includes(user.id)
          ).length,
          lastActivity:
            internMessages.length > 0
              ? new Date(internMessages[internMessages.length - 1].timestamp)
              : new Date(),
          avgResponseTime: calculateAvgResponseTime(internMessages, user.id),
          isActive: Math.random() > 0.3, // Simulate online status
        };
      }

      setMessages(allMessages);
      setConversationStats(stats);
      setConversations(conversationsData);

      if (internsData.length > 0) {
        setSelectedInternId(internsData[0].id);
      }
    } catch (error) {
      console.error("Failed to load mentor data:", error);
      setError("Failed to load conversations");
    } finally {
      setLoading(false);
    }
  };

  const calculateAvgResponseTime = (messages, mentorId) => {
    const responses = [];
    for (let i = 1; i < messages.length; i++) {
      if (
        messages[i].senderId === mentorId &&
        messages[i - 1].senderId !== mentorId
      ) {
        const timeDiff =
          new Date(messages[i].timestamp) - new Date(messages[i - 1].timestamp);
        responses.push(timeDiff);
      }
    }

    if (responses.length === 0) return 0;
    const avgMs = responses.reduce((a, b) => a + b, 0) / responses.length;
    return Math.round(avgMs / (1000 * 60)); // Convert to minutes
  };

  const simulateInternActivity = () => {
    if (!selectedInternId || Math.random() > 0.15) return; // 15% chance

    const sampleMessages = [
      "I have a question about the project",
      "Can you review my code?",
      "I completed the task you assigned",
      "I'm having trouble with this concept",
      "Thank you for the feedback!",
      "When is our next meeting?",
      "I found a helpful resource",
      "Could you clarify the requirements?",
    ];

    const randomMessage =
      sampleMessages[Math.floor(Math.random() * sampleMessages.length)];

    const newMsg = {
      id: `msg_${Date.now()}_${Math.random()}`,
      senderId: selectedInternId,
      senderName: interns.find((i) => i.id === selectedInternId)?.name,
      receiverId: user.id,
      type: MESSAGE_TYPES.TEXT,
      content: randomMessage,
      timestamp: new Date().toISOString(),
      status: MESSAGE_STATUS.DELIVERED,
      readBy: [],
      reactions: {},
      replyTo: null,
      edited: false,
      deleted: false,
    };

    setMessages((prev) => ({
      ...prev,
      [selectedInternId]: [...(prev[selectedInternId] || []), newMsg],
    }));

    // Update conversation stats
    setConversationStats((prev) => ({
      ...prev,
      [selectedInternId]: {
        ...prev[selectedInternId],
        unreadCount: (prev[selectedInternId]?.unreadCount || 0) + 1,
        lastActivity: new Date(),
      },
    }));
  };

  const updateMessageStatus = () => {
    if (!selectedInternId) return;

    setMessages((prev) => ({
      ...prev,
      [selectedInternId]:
        prev[selectedInternId]?.map((msg) => {
          if (msg.senderId === user.id && msg.status === MESSAGE_STATUS.SENT) {
            return { ...msg, status: MESSAGE_STATUS.DELIVERED };
          }
          return msg;
        }) || [],
    }));
  };

  const handleSendMessage = async (e) => {
    e?.preventDefault();

    if (!newMessage.trim() || !selectedInternId) return;

    const messageData = {
      id: `msg_${Date.now()}_${user.id}`,
      senderId: user.id,
      senderName: user.name,
      receiverId: selectedInternId,
      type: replyingTo ? MESSAGE_TYPES.TEXT : MESSAGE_TYPES.TEXT,
      content: newMessage.trim(),
      timestamp: new Date().toISOString(),
      status: MESSAGE_STATUS.SENDING,
      readBy: [user.id],
      reactions: {},
      replyTo: replyingTo,
      edited: false,
      deleted: false,
    };

    // Add message to UI immediately
    setMessages((prev) => ({
      ...prev,
      [selectedInternId]: [...(prev[selectedInternId] || []), messageData],
    }));

    setNewMessage("");
    setReplyingTo(null);

    try {
      // Save to storage
      const updatedMessage = { ...messageData, status: MESSAGE_STATUS.SENT };
      const currentMessages = messages[selectedInternId] || [];
      const allMessages = [...currentMessages, updatedMessage];

      await saveData(`messages_${user.id}_${selectedInternId}`, allMessages);

      // Update message status in UI
      setMessages((prev) => ({
        ...prev,
        [selectedInternId]:
          prev[selectedInternId]?.map((msg) =>
            msg.id === messageData.id ? updatedMessage : msg
          ) || [],
      }));

      // Update conversation stats
      setConversationStats((prev) => ({
        ...prev,
        [selectedInternId]: {
          ...prev[selectedInternId],
          lastActivity: new Date(),
          totalMessages: (prev[selectedInternId]?.totalMessages || 0) + 1,
        },
      }));
    } catch (error) {
      console.error("Failed to send message:", error);
      // Update message status to failed
      setMessages((prev) => ({
        ...prev,
        [selectedInternId]:
          prev[selectedInternId]?.map((msg) =>
            msg.id === messageData.id
              ? { ...msg, status: MESSAGE_STATUS.FAILED }
              : msg
          ) || [],
      }));
    }
  };

  const handleFileUpload = async (files) => {
    if (!files || files.length === 0 || !selectedInternId) return;

    setUploading(true);
    setUploadProgress(0);

    try {
      for (const file of Array.from(files)) {
        if (file.size > 25 * 1024 * 1024) {
          setError(`File ${file.name} is too large (max 25MB)`);
          continue;
        }

        const result = await uploadFile(
          file,
          `mentor_chat/${selectedInternId}`
        );

        const messageData = {
          id: `msg_${Date.now()}_${user.id}`,
          senderId: user.id,
          senderName: user.name,
          receiverId: selectedInternId,
          type: file.type.startsWith("image/")
            ? MESSAGE_TYPES.IMAGE
            : MESSAGE_TYPES.FILE,
          content: result.url,
          fileName: file.name,
          fileSize: file.size,
          fileType: file.type,
          timestamp: new Date().toISOString(),
          status: MESSAGE_STATUS.SENT,
          readBy: [user.id],
          reactions: {},
          replyTo: null,
          edited: false,
          deleted: false,
        };

        setMessages((prev) => ({
          ...prev,
          [selectedInternId]: [...(prev[selectedInternId] || []), messageData],
        }));

        const currentMessages = messages[selectedInternId] || [];
        await saveData(`messages_${user.id}_${selectedInternId}`, [
          ...currentMessages,
          messageData,
        ]);
      }
    } catch (error) {
      console.error("Failed to upload file:", error);
      setError("Failed to upload file");
    } finally {
      setUploading(false);
      setUploadProgress(0);
      setShowAttachments(false);
    }
  };

  const handleMentorAction = (actionType) => {
    setActionModal({
      isOpen: true,
      type: actionType,
      internId: selectedInternId,
      data: {},
    });
    setShowMentorActions(false);
  };

  const sendActionMessage = async (actionType, data) => {
    if (!selectedInternId) return;

    let content = "";
    let messageType = MESSAGE_TYPES.TEXT;

    switch (actionType) {
      case "assignment":
        content = `📝 **New Assignment**: ${data.title}\n\n${data.description}\n\n📅 Due: ${data.dueDate}`;
        messageType = MESSAGE_TYPES.ASSIGNMENT;
        break;
      case "feedback":
        content = `⭐ **Feedback**: ${data.subject}\n\n${data.feedback}\n\nRating: ${"★".repeat(data.rating)}${"☆".repeat(5 - data.rating)}`;
        messageType = MESSAGE_TYPES.FEEDBACK;
        break;
      case "meeting":
        content = `📅 **Meeting Scheduled**: ${data.title}\n\n📅 Date: ${data.date}\n🕐 Time: ${data.time}\n🔗 Link: ${data.link}`;
        break;
      case "resource":
        content = `📚 **Resource Shared**: ${data.title}\n\n${data.description}\n\n🔗 ${data.url}`;
        break;
    }

    const messageData = {
      id: `msg_${Date.now()}_${user.id}`,
      senderId: user.id,
      senderName: user.name,
      receiverId: selectedInternId,
      type: messageType,
      content: content,
      timestamp: new Date().toISOString(),
      status: MESSAGE_STATUS.SENT,
      readBy: [user.id],
      reactions: {},
      replyTo: null,
      edited: false,
      deleted: false,
      actionData: data,
    };

    setMessages((prev) => ({
      ...prev,
      [selectedInternId]: [...(prev[selectedInternId] || []), messageData],
    }));

    const currentMessages = messages[selectedInternId] || [];
    await saveData(`messages_${user.id}_${selectedInternId}`, [
      ...currentMessages,
      messageData,
    ]);
  };

  const markMessagesAsRead = useCallback(
    async (internId) => {
      if (!internId) return;

      const internMessages = messages[internId] || [];
      const updatedMessages = internMessages.map((msg) => {
        if (msg.senderId === internId && !msg.readBy?.includes(user.id)) {
          return {
            ...msg,
            readBy: [...(msg.readBy || []), user.id],
            status: MESSAGE_STATUS.READ,
          };
        }
        return msg;
      });

      setMessages((prev) => ({ ...prev, [internId]: updatedMessages }));
      await saveData(`messages_${user.id}_${internId}`, updatedMessages);

      // Update conversation stats
      setConversationStats((prev) => ({
        ...prev,
        [internId]: { ...prev[internId], unreadCount: 0 },
      }));
    },
    [messages, user.id]
  );

  // Mark messages as read when selecting conversation
  useEffect(() => {
    if (selectedInternId) {
      markMessagesAsRead(selectedInternId);
    }
  }, [selectedInternId, markMessagesAsRead]);

  const filteredInterns = useMemo(() => {
    let filtered = interns.filter(
      (intern) =>
        intern.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        intern.email.toLowerCase().includes(searchQuery.toLowerCase())
    );

    switch (conversationFilter) {
      case CONVERSATION_FILTERS.UNREAD:
        filtered = filtered.filter(
          (intern) => (conversationStats[intern.id]?.unreadCount || 0) > 0
        );
        break;
      case CONVERSATION_FILTERS.ACTIVE:
        filtered = filtered.filter(
          (intern) => conversationStats[intern.id]?.isActive
        );
        break;
      case CONVERSATION_FILTERS.ARCHIVED:
        // Implementation would depend on archived conversation logic
        break;
      case CONVERSATION_FILTERS.PRIORITY:
        filtered = filtered.filter(
          (intern) =>
            intern.priority === "high" ||
            (conversationStats[intern.id]?.unreadCount || 0) > 5
        );
        break;
    }

    // Sort by last activity
    filtered.sort((a, b) => {
      const aActivity = conversationStats[a.id]?.lastActivity || new Date(0);
      const bActivity = conversationStats[b.id]?.lastActivity || new Date(0);
      return new Date(bActivity) - new Date(aActivity);
    });

    return filtered;
  }, [interns, searchQuery, conversationFilter, conversationStats]);

  const currentMessages = messages[selectedInternId] || [];
  const selectedIntern = interns.find((i) => i.id === selectedInternId);
  const selectedStats = conversationStats[selectedInternId];

  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;

    return date.toLocaleDateString();
  };

  const getMessageStatusIcon = (status) => {
    switch (status) {
      case MESSAGE_STATUS.SENDING:
        return <IoTimeOutline className="w-3 h-3 text-gray-400" />;
      case MESSAGE_STATUS.SENT:
        return <IoCheckmarkOutline className="w-3 h-3 text-gray-400" />;
      case MESSAGE_STATUS.DELIVERED:
        return <IoCheckmarkDoneOutline className="w-3 h-3 text-gray-400" />;
      case MESSAGE_STATUS.READ:
        return <IoCheckmarkDoneOutline className="w-3 h-3 text-blue-500" />;
      case MESSAGE_STATUS.FAILED:
        return <IoWarningOutline className="w-3 h-3 text-red-500" />;
      default:
        return null;
    }
  };

  const renderMessage = (message, index) => {
    const isOwn = message.senderId === user.id;
    const showAvatar =
      !isOwn &&
      (index === 0 ||
        currentMessages[index - 1]?.senderId !== message.senderId);

    return (
      <div
        key={message.id}
        className={`flex items-end space-x-2 mb-4 ${isOwn ? "justify-end" : "justify-start"}`}
      >
        {!isOwn && (
          <div className="w-8 h-8 rounded-full overflow-hidden flex-shrink-0">
            {showAvatar ? (
              <ProfileAvatar user={selectedIntern} size="sm" />
            ) : (
              <div className="w-full h-full" />
            )}
          </div>
        )}

        <div className={`max-w-xs lg:max-w-md ${isOwn ? "order-1" : ""}`}>
          {message.replyTo && (
            <div className="text-xs bg-gray-100 p-2 rounded-t-lg border-l-2 border-blue-500 mb-1">
              <div className="text-gray-600 truncate">
                Replying to: {message.replyTo.content}
              </div>
            </div>
          )}

          <div
            className={`px-4 py-2 rounded-2xl relative group ${
              isOwn
                ? "bg-blue-600 text-white rounded-br-sm"
                : "bg-gray-200 text-gray-900 rounded-bl-sm"
            } ${message.deleted ? "opacity-50" : ""}`}
          >
            {message.type === MESSAGE_TYPES.TEXT && (
              <div className="whitespace-pre-wrap break-words">
                {message.content}
              </div>
            )}

            {message.type === MESSAGE_TYPES.IMAGE && (
              <div className="max-w-sm">
                <img
                  src={message.content}
                  alt="Shared image"
                  className="rounded-lg max-h-64 object-cover cursor-pointer"
                  onClick={() => window.open(message.content, "_blank")}
                />
              </div>
            )}

            {message.type === MESSAGE_TYPES.FILE && (
              <div className="flex items-center space-x-3 min-w-48">
                <IoDocumentTextOutline className="w-8 h-8 text-gray-500" />
                <div className="flex-1 min-w-0">
                  <div className="font-medium truncate">{message.fileName}</div>
                  <div className="text-xs opacity-75">
                    {Math.round(message.fileSize / 1024)} KB
                  </div>
                </div>
                <button
                  onClick={() => window.open(message.content, "_blank")}
                  className="p-1 hover:bg-black hover:bg-opacity-10 rounded"
                >
                  <IoDownloadOutline className="w-4 h-4" />
                </button>
              </div>
            )}

            {(message.type === MESSAGE_TYPES.ASSIGNMENT ||
              message.type === MESSAGE_TYPES.FEEDBACK) && (
              <div className="space-y-2">
                <div className="whitespace-pre-wrap break-words text-sm">
                  {message.content}
                </div>
                {message.actionData && (
                  <div className="bg-black bg-opacity-10 p-2 rounded text-xs">
                    <div className="font-medium">Action Data Available</div>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="flex items-center justify-between mt-1 px-2">
            <div className="text-xs text-gray-500 flex items-center space-x-2">
              <span>{formatTime(message.timestamp)}</span>
              {message.edited && <span className="italic">(edited)</span>}
            </div>
            {isOwn && (
              <div className="flex items-center space-x-1">
                {getMessageStatusIcon(message.status)}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  const renderConversationItem = (intern) => {
    const stats = conversationStats[intern.id];
    const lastMessage = currentMessages[currentMessages.length - 1];
    const isSelected = selectedInternId === intern.id;

    return (
      <div
        key={intern.id}
        onClick={() => setSelectedInternId(intern.id)}
        className={`p-4 flex items-center cursor-pointer border-l-4 transition-colors ${
          isSelected
            ? "bg-blue-50 border-blue-500"
            : "border-transparent hover:bg-gray-50"
        }`}
      >
        <div className="relative">
          <ProfileAvatar user={intern} size="md" />
          {stats?.isActive && (
            <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></div>
          )}
          {stats?.unreadCount > 0 && (
            <div className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full px-1.5 py-0.5 min-w-5 text-center">
              {stats.unreadCount}
            </div>
          )}
        </div>

        <div className="ml-3 flex-1 min-w-0">
          <div className="flex items-center justify-between">
            <h4 className="font-semibold text-gray-900 truncate">
              {intern.name}
            </h4>
            <div className="flex items-center space-x-2">
              {lastMessage && (
                <span className="text-xs text-gray-500">
                  {formatTime(lastMessage.timestamp)}
                </span>
              )}
              {intern.priority === "high" && (
                <IoWarningOutline className="w-4 h-4 text-orange-500" />
              )}
            </div>
          </div>

          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-600 truncate">
              {lastMessage ? (
                <>
                  {lastMessage.senderId === user.id ? "You: " : ""}
                  {lastMessage.type === MESSAGE_TYPES.IMAGE
                    ? "📷 Image"
                    : lastMessage.type === MESSAGE_TYPES.FILE
                      ? "📎 File"
                      : lastMessage.type === MESSAGE_TYPES.ASSIGNMENT
                        ? "📝 Assignment"
                        : lastMessage.type === MESSAGE_TYPES.FEEDBACK
                          ? "⭐ Feedback"
                          : lastMessage.content}
                </>
              ) : (
                "No messages yet"
              )}
            </p>
            <div className="flex items-center space-x-1">
              {stats?.avgResponseTime && (
                <span
                  className="text-xs text-gray-400"
                  title={`Avg response time: ${stats.avgResponseTime}min`}
                >
                  ⏱️ {stats.avgResponseTime}m
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <Spinner size="lg" text="Loading conversations..." />
      </div>
    );
  }

  return (
    <div className="h-screen bg-white flex overflow-hidden">
      {/* Sidebar */}
      <div
        className={`bg-white border-r border-gray-200 flex flex-col transition-all duration-300 ${
          sidebarCollapsed ? "w-16" : "w-80"
        }`}
      >
        {/* Sidebar Header */}
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h1
              className={`font-bold text-gray-900 ${sidebarCollapsed ? "hidden" : "text-xl"}`}
            >
              Intern Conversations
            </h1>
            <button
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg"
            >
              <IoMenuOutline className="w-5 h-5" />
            </button>
          </div>

          {!sidebarCollapsed && (
            <>
              {/* Search */}
              <div className="relative mb-4">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <IoSearchOutline className="h-4 w-4 text-gray-400" />
                </div>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search interns..."
                  className="block w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 text-sm"
                />
              </div>

              {/* Filters */}
              <div className="flex flex-wrap gap-2">
                {Object.entries(CONVERSATION_FILTERS).map(([key, value]) => (
                  <button
                    key={key}
                    onClick={() => setConversationFilter(value)}
                    className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                      conversationFilter === value
                        ? "bg-blue-600 text-white"
                        : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                    }`}
                  >
                    {key.charAt(0) + key.slice(1).toLowerCase()}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Conversation List */}
        <div className="flex-1 overflow-y-auto">
          {sidebarCollapsed ? (
            <div className="space-y-2 p-2">
              {filteredInterns.map((intern) => {
                const stats = conversationStats[intern.id];
                return (
                  <div
                    key={intern.id}
                    onClick={() => setSelectedInternId(intern.id)}
                    className={`relative p-2 rounded-lg cursor-pointer transition-colors ${
                      selectedInternId === intern.id
                        ? "bg-blue-100"
                        : "hover:bg-gray-100"
                    }`}
                  >
                    <ProfileAvatar user={intern} size="sm" />
                    {stats?.unreadCount > 0 && (
                      <div className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full px-1 py-0.5 min-w-4 text-center">
                        {stats.unreadCount}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <div>
              {filteredInterns.length === 0 ? (
                <div className="p-4 text-center text-gray-500">
                  <IoPeopleOutline className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  No conversations found
                </div>
              ) : (
                filteredInterns.map(renderConversationItem)
              )}
            </div>
          )}
        </div>

        {/* Sidebar Footer Stats */}
        {!sidebarCollapsed && (
          <div className="border-t border-gray-200 p-4">
            <div className="grid grid-cols-3 gap-2 text-center">
              <div>
                <div className="text-lg font-semibold text-gray-900">
                  {interns.length}
                </div>
                <div className="text-xs text-gray-500">Total</div>
              </div>
              <div>
                <div className="text-lg font-semibold text-blue-600">
                  {Object.values(conversationStats).reduce(
                    (sum, stats) => sum + (stats?.unreadCount || 0),
                    0
                  )}
                </div>
                <div className="text-xs text-gray-500">Unread</div>
              </div>
              <div>
                <div className="text-lg font-semibold text-green-600">
                  {
                    Object.values(conversationStats).filter(
                      (stats) => stats?.isActive
                    ).length
                  }
                </div>
                <div className="text-xs text-gray-500">Active</div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        {selectedIntern ? (
          <>
            {/* Chat Header */}
            <div className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-3">
                  <div className="relative">
                    <ProfileAvatar user={selectedIntern} size="md" />
                    {selectedStats?.isActive && (
                      <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></div>
                    )}
                  </div>

                  <div>
                    <h2 className="font-semibold text-gray-900">
                      {selectedIntern.name}
                    </h2>
                    <div className="flex items-center space-x-2 text-sm text-gray-500">
                      <span>{selectedIntern.university}</span>
                      <span>•</span>
                      <span>
                        {selectedStats?.isActive ? "Online" : "Offline"}
                      </span>
                      {selectedStats?.avgResponseTime && (
                        <>
                          <span>•</span>
                          <span>
                            Avg response: {selectedStats.avgResponseTime}min
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <div className="relative">
                  <button
                    onClick={() => setShowMentorActions(!showMentorActions)}
                    className="flex items-center px-3 py-2 text-sm font-medium text-gray-700 bg-blue-50 border border-blue-200 rounded-md hover:bg-blue-100"
                  >
                    <IoAddOutline className="w-4 h-4 mr-1" />
                    Mentor Actions
                  </button>

                  {showMentorActions && (
                    <div className="absolute top-full right-0 mt-2 w-48 bg-white shadow-lg rounded-lg border z-10">
                      {MENTOR_ACTIONS.map((action) => {
                        const Icon = action.icon;
                        return (
                          <button
                            key={action.id}
                            onClick={() => handleMentorAction(action.id)}
                            className="w-full flex items-center px-4 py-3 text-left hover:bg-gray-50 first:rounded-t-lg last:rounded-b-lg"
                          >
                            <Icon className="w-4 h-4 mr-3 text-gray-500" />
                            <span className="text-sm">{action.label}</span>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>

                <button
                  className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg"
                  title="Voice call"
                >
                  <IoCallOutline className="w-5 h-5" />
                </button>
                <button
                  className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg"
                  title="Video call"
                >
                  <IoVideocamOutline className="w-5 h-5" />
                </button>
                <button
                  onClick={() => setShowInternInfo(!showInternInfo)}
                  className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg"
                  title="Intern info"
                >
                  <IoInformationCircleOutline className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-4 bg-gray-50">
              {currentMessages.length === 0 ? (
                <div className="flex items-center justify-center h-full text-center">
                  <div>
                    <ProfileAvatar
                      user={selectedIntern}
                      size="xl"
                      className="mx-auto mb-4"
                    />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                      Start mentoring {selectedIntern.name}
                    </h3>
                    <p className="text-gray-500 mb-4">
                      Begin the conversation with your intern. You can send
                      messages, share resources, create assignments, and provide
                      feedback.
                    </p>
                    <div className="flex flex-wrap gap-2 justify-center">
                      {QUICK_REPLIES.slice(0, 3).map((reply) => (
                        <button
                          key={reply}
                          onClick={() => setNewMessage(reply)}
                          className="px-3 py-1 bg-blue-100 text-blue-700 text-sm rounded-full hover:bg-blue-200 transition-colors"
                        >
                          {reply}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="max-w-4xl mx-auto">
                  {currentMessages.map(renderMessage)}
                  <div ref={chatEndRef} />
                </div>
              )}
            </div>

            {/* Reply indicator */}
            {replyingTo && (
              <div className="bg-blue-50 border-t border-blue-200 px-6 py-3 flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <IoReplyOutline className="w-4 h-4 text-blue-600" />
                  <div>
                    <p className="text-sm text-blue-600">
                      Replying to {replyingTo.senderName}
                    </p>
                    <p className="text-xs text-gray-600 truncate max-w-xs">
                      {replyingTo.content}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setReplyingTo(null)}
                  className="p-1 text-blue-600 hover:bg-blue-100 rounded"
                >
                  <IoCloseOutline className="w-4 h-4" />
                </button>
              </div>
            )}

            {/* Message Input */}
            <div className="bg-white border-t border-gray-200 px-6 py-4">
              {/* Quick Actions */}
              <div className="mb-3 flex flex-wrap gap-2">
                {QUICK_REPLIES.slice(0, 4).map((reply) => (
                  <button
                    key={reply}
                    onClick={() => setNewMessage(reply)}
                    className="px-3 py-1 bg-gray-100 text-gray-700 text-sm rounded-full hover:bg-gray-200 transition-colors"
                  >
                    {reply}
                  </button>
                ))}
              </div>

              <form
                onSubmit={handleSendMessage}
                className="flex items-end space-x-3"
              >
                {/* Attachment button */}
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setShowAttachments(!showAttachments)}
                    className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg"
                  >
                    <IoAttachOutline className="w-5 h-5" />
                  </button>

                  {showAttachments && (
                    <div className="absolute bottom-12 left-0 bg-white shadow-lg rounded-lg border p-2 space-y-2 z-10">
                      <input
                        ref={fileInputRef}
                        type="file"
                        multiple
                        className="hidden"
                        onChange={(e) => handleFileUpload(e.target.files)}
                      />
                      <button
                        onClick={() => fileInputRef.current?.click()}
                        className="flex items-center space-x-2 w-full p-2 text-left hover:bg-gray-50 rounded"
                      >
                        <IoDocumentTextOutline className="w-4 h-4 text-gray-500" />
                        <span className="text-sm">File</span>
                      </button>
                      <button
                        onClick={() => {
                          fileInputRef.current.accept = "image/*";
                          fileInputRef.current?.click();
                        }}
                        className="flex items-center space-x-2 w-full p-2 text-left hover:bg-gray-50 rounded"
                      >
                        <IoImageOutline className="w-4 h-4 text-gray-500" />
                        <span className="text-sm">Image</span>
                      </button>
                    </div>
                  )}
                </div>

                {/* Message input */}
                <div className="flex-1 relative">
                  <textarea
                    ref={messageInputRef}
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        handleSendMessage();
                      }
                    }}
                    placeholder="Type your message to help and guide your intern..."
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 resize-none max-h-32"
                    rows="1"
                    style={{
                      minHeight: "42px",
                      height: "auto",
                    }}
                  />
                </div>

                {/* Send button */}
                <button
                  type="submit"
                  disabled={!newMessage.trim() || uploading}
                  className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {uploading ? (
                    <Spinner size="sm" color="white" />
                  ) : (
                    <IoSendOutline className="w-5 h-5" />
                  )}
                </button>
              </form>
            </div>
          </>
        ) : (
          /* No conversation selected */
          <div className="flex-1 flex items-center justify-center bg-gray-50">
            <div className="text-center">
              <IoPeopleOutline className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Select an intern to start mentoring
              </h3>
              <p className="text-gray-500">
                Choose a conversation from the sidebar to begin your mentoring
                session
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Intern Info Sidebar */}
      {showInternInfo && selectedIntern && (
        <div className="w-80 bg-white border-l border-gray-200 p-6 overflow-y-auto">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900">
              Intern Details
            </h3>
            <button
              onClick={() => setShowInternInfo(false)}
              className="p-1 text-gray-500 hover:bg-gray-100 rounded"
            >
              <IoCloseOutline className="w-5 h-5" />
            </button>
          </div>

          <div className="space-y-6">
            {/* Intern profile */}
            <div className="text-center">
              <ProfileAvatar
                user={selectedIntern}
                size="xl"
                className="mx-auto mb-3"
              />
              <h4 className="font-semibold text-gray-900">
                {selectedIntern.name}
              </h4>
              <p className="text-sm text-gray-500">{selectedIntern.email}</p>
              <p className="text-sm text-gray-500">
                {selectedIntern.university}
              </p>
            </div>

            {/* Statistics */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h5 className="font-medium text-gray-900 mb-3">
                Conversation Stats
              </h5>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Total Messages</span>
                  <span className="text-sm font-medium">
                    {selectedStats?.totalMessages || 0}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">
                    Avg Response Time
                  </span>
                  <span className="text-sm font-medium">
                    {selectedStats?.avgResponseTime || 0}min
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Status</span>
                  <span
                    className={`text-sm font-medium ${selectedStats?.isActive ? "text-green-600" : "text-gray-600"}`}
                  >
                    {selectedStats?.isActive ? "Active" : "Offline"}
                  </span>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="space-y-2">
              <h5 className="font-medium text-gray-900">Quick Actions</h5>
              {MENTOR_ACTIONS.map((action) => {
                const Icon = action.icon;
                return (
                  <button
                    key={action.id}
                    onClick={() => handleMentorAction(action.id)}
                    className="w-full flex items-center space-x-3 p-3 text-left hover:bg-gray-50 rounded-lg"
                  >
                    <Icon className="w-5 h-5 text-gray-500" />
                    <span className="text-sm">{action.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Action Modal */}
      {actionModal.isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                {MENTOR_ACTIONS.find((a) => a.id === actionModal.type)?.label}
              </h3>

              {/* Modal content would be specific to each action type */}
              <div className="space-y-4">
                <p className="text-gray-600">
                  This feature will be implemented to handle {actionModal.type}{" "}
                  actions.
                </p>
              </div>

              <div className="flex justify-end space-x-3 mt-6">
                <button
                  onClick={() =>
                    setActionModal({
                      isOpen: false,
                      type: null,
                      internId: null,
                      data: {},
                    })
                  }
                  className="px-4 py-2 text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    // Handle action submission
                    setActionModal({
                      isOpen: false,
                      type: null,
                      internId: null,
                      data: {},
                    });
                  }}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  Create
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Error Messages */}
      {error && (
        <div className="fixed top-4 right-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded z-50">
          <div className="flex items-center">
            <IoWarningOutline className="w-4 h-4 mr-2" />
            <span className="text-sm">{error}</span>
            <button
              onClick={() => setError("")}
              className="ml-4 text-red-500 hover:text-red-700"
            >
              <IoCloseCircleOutline className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default MentorChat;
