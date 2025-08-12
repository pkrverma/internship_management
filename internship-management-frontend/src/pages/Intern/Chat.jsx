// src/pages/intern/Chat.jsx
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
import Spinner from "../../components/ui/Spinner";
import ConfirmationModal from "../../components/ui/ConfirmationModal";
import {
  IoChatbubbleOutline,
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
} from "react-icons/io5";

const MESSAGE_TYPES = {
  TEXT: "text",
  IMAGE: "image",
  FILE: "file",
  VOICE: "voice",
  SYSTEM: "system",
  POLL: "poll",
  TASK: "task",
};

const MESSAGE_STATUS = {
  SENDING: "sending",
  SENT: "sent",
  DELIVERED: "delivered",
  READ: "read",
  FAILED: "failed",
};

const CHAT_TYPES = {
  DIRECT: "direct",
  GROUP: "group",
  CHANNEL: "channel",
};

const EMOJI_REACTIONS = [
  "ðŸ‘",
  "â¤ï¸",
  "ðŸ˜‚",
  "ðŸ˜®",
  "ðŸ˜¢",
  "ðŸ˜¡",
  "ðŸ‘",
  "ðŸŽ‰",
];

const QUICK_REPLIES = [
  "Thanks!",
  "Got it",
  "Will do",
  "Let me check",
  "Meeting in 5 min",
  "Working on it",
  "Almost done",
  "Need help",
];

const Chat = () => {
  const { user } = useAuth();

  // Core chat state
  const [chats, setChats] = useState([]);
  const [activeChat, setActiveChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [typingUsers, setTypingUsers] = useState(new Set());

  // UI State
  const [sidebarVisible, setSidebarVisible] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showAttachments, setShowAttachments] = useState(false);
  const [showChatInfo, setShowChatInfo] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [selectedMessage, setSelectedMessage] = useState(null);
  const [replyingTo, setReplyingTo] = useState(null);
  const [editingMessage, setEditingMessage] = useState(null);

  // Media and file states
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [recordingVoice, setRecordingVoice] = useState(false);
  const [voiceRecorder, setVoiceRecorder] = useState(null);
  const [playingVoice, setPlayingVoice] = useState(null);

  // Message management
  const [messageFilter, setMessageFilter] = useState("all");
  const [searchResults, setSearchResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Refs
  const chatEndRef = useRef(null);
  const messageInputRef = useRef(null);
  const fileInputRef = useRef(null);
  const emojiPickerRef = useRef(null);

  // Modal states
  const [confirmModal, setConfirmModal] = useState({
    isOpen: false,
    type: null,
    title: "",
    message: "",
    data: null,
  });

  // Chat settings
  const [chatSettings, setChatSettings] = useState({
    notifications: true,
    soundEnabled: true,
    showTypingIndicators: true,
    showReadReceipts: true,
    autoDownloadMedia: false,
    theme: "light",
    fontSize: "medium",
  });

  // Load chats and initialize
  useEffect(() => {
    loadChats();
    initializeChat();
  }, [user]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  // Handle typing indicator
  useEffect(() => {
    let typingTimer;
    if (isTyping) {
      typingTimer = setTimeout(() => {
        setIsTyping(false);
        // Send typing stopped event
      }, 3000);
    }
    return () => clearTimeout(typingTimer);
  }, [isTyping]);

  // Simulate real-time updates
  useEffect(() => {
    if (activeChat) {
      const interval = setInterval(() => {
        simulateIncomingMessages();
        updateTypingIndicators();
        updateMessageStatus();
      }, 5000);
      return () => clearInterval(interval);
    }
  }, [activeChat]);

  const loadChats = async () => {
    setLoading(true);
    try {
      const users = getData("users") || [];
      const existingChats = getData(`chats_${user?.id}`) || [];
      const messages = getData("messages") || [];

      // Create default chats with mentors and admins
      const mentorsAndAdmins = users.filter(
        (u) => (u.role === "mentor" || u.role === "admin") && u.id !== user?.id
      );

      const defaultChats = mentorsAndAdmins.map((participant) => {
        const existingChat = existingChats.find(
          (chat) =>
            chat.type === CHAT_TYPES.DIRECT &&
            chat.participants.includes(participant.id)
        );

        if (existingChat) return existingChat;

        return {
          id: `chat_${user?.id}_${participant.id}`,
          type: CHAT_TYPES.DIRECT,
          name: participant.name,
          participants: [user?.id, participant.id],
          avatar: participant.avatar || null,
          lastMessage: null,
          lastActivity: new Date().toISOString(),
          unreadCount: 0,
          isOnline: Math.random() > 0.3, // Simulate online status
          isPinned: false,
          isMuted: false,
          createdAt: new Date().toISOString(),
        };
      });

      // Add group chats
      const groupChats = [
        {
          id: "general_chat",
          type: CHAT_TYPES.GROUP,
          name: "General Discussion",
          description: "General chat for all interns",
          participants: users
            .filter((u) => u.role === "intern")
            .map((u) => u.id),
          avatar: null,
          lastMessage: null,
          lastActivity: new Date().toISOString(),
          unreadCount: Math.floor(Math.random() * 5),
          admins: users.filter((u) => u.role === "admin").map((u) => u.id),
          isPinned: true,
          isMuted: false,
          createdAt: new Date(
            Date.now() - 7 * 24 * 60 * 60 * 1000
          ).toISOString(),
        },
        {
          id: "announcements_chat",
          type: CHAT_TYPES.CHANNEL,
          name: "Announcements",
          description: "Important announcements and updates",
          participants: users.map((u) => u.id),
          avatar: null,
          lastMessage: null,
          lastActivity: new Date().toISOString(),
          unreadCount: Math.floor(Math.random() * 3),
          admins: users.filter((u) => u.role === "admin").map((u) => u.id),
          isPinned: true,
          isMuted: false,
          isReadOnly: true,
          createdAt: new Date(
            Date.now() - 30 * 24 * 60 * 60 * 1000
          ).toISOString(),
        },
      ];

      const allChats = [...defaultChats, ...groupChats];

      // Update last messages and unread counts
      allChats.forEach((chat) => {
        const chatMessages = messages.filter((msg) => msg.chatId === chat.id);
        if (chatMessages.length > 0) {
          const lastMsg = chatMessages[chatMessages.length - 1];
          chat.lastMessage = lastMsg;
          chat.unreadCount = chatMessages.filter(
            (msg) =>
              msg.senderId !== user?.id && !msg.readBy?.includes(user?.id)
          ).length;
        }
      });

      // Sort chats by last activity
      allChats.sort((a, b) => {
        if (a.isPinned && !b.isPinned) return -1;
        if (!a.isPinned && b.isPinned) return 1;
        return new Date(b.lastActivity) - new Date(a.lastActivity);
      });

      setChats(allChats);
      await saveData(`chats_${user?.id}`, allChats);

      if (allChats.length > 0 && !activeChat) {
        setActiveChat(allChats[0]);
      }
    } catch (error) {
      console.error("Failed to load chats:", error);
      setError("Failed to load chats");
    } finally {
      setLoading(false);
    }
  };

  const initializeChat = () => {
    // Load chat settings
    const savedSettings = getData(`chat_settings_${user?.id}`);
    if (savedSettings) {
      setChatSettings(savedSettings);
    }
  };

  const loadMessages = useCallback(
    async (chatId) => {
      if (!chatId) return;

      try {
        const allMessages = getData("messages") || [];
        const chatMessages = allMessages.filter((msg) => msg.chatId === chatId);

        // Sort by timestamp
        chatMessages.sort(
          (a, b) => new Date(a.timestamp) - new Date(b.timestamp)
        );

        // Mark messages as read
        const updatedMessages = chatMessages.map((msg) => {
          if (msg.senderId !== user?.id && !msg.readBy?.includes(user?.id)) {
            return {
              ...msg,
              readBy: [...(msg.readBy || []), user?.id],
              status: MESSAGE_STATUS.READ,
            };
          }
          return msg;
        });

        setMessages(updatedMessages);

        // Update messages in storage
        const otherMessages = allMessages.filter(
          (msg) => msg.chatId !== chatId
        );
        await saveData("messages", [...otherMessages, ...updatedMessages]);

        // Update chat unread count
        setChats((prev) =>
          prev.map((chat) =>
            chat.id === chatId ? { ...chat, unreadCount: 0 } : chat
          )
        );
      } catch (error) {
        console.error("Failed to load messages:", error);
      }
    },
    [user?.id]
  );

  // Load messages when active chat changes
  useEffect(() => {
    if (activeChat) {
      loadMessages(activeChat.id);
    }
  }, [activeChat, loadMessages]);

  const simulateIncomingMessages = () => {
    if (!activeChat || Math.random() > 0.1) return; // 10% chance of receiving message

    const sampleMessages = [
      "How's the project going?",
      "Great work on the presentation!",
      "Can you review this code?",
      "Meeting in 10 minutes",
      "Check out this resource",
      "Thanks for your help!",
      "Let me know if you have questions",
      "Looking forward to your feedback",
    ];

    const participants =
      chats.find((c) => c.id === activeChat.id)?.participants || [];
    const otherParticipants = participants.filter((p) => p !== user?.id);

    if (otherParticipants.length === 0) return;

    const randomSender =
      otherParticipants[Math.floor(Math.random() * otherParticipants.length)];
    const randomMessage =
      sampleMessages[Math.floor(Math.random() * sampleMessages.length)];

    const newMessage = {
      id: `msg_${Date.now()}_${Math.random()}`,
      chatId: activeChat.id,
      senderId: randomSender,
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

    setMessages((prev) => [...prev, newMessage]);
    updateChatLastMessage(activeChat.id, newMessage);
  };

  const updateTypingIndicators = () => {
    const shouldShow = Math.random() > 0.7; // 30% chance
    if (shouldShow && activeChat) {
      const participants =
        chats.find((c) => c.id === activeChat.id)?.participants || [];
      const otherParticipants = participants.filter((p) => p !== user?.id);

      if (otherParticipants.length > 0) {
        const typingUser =
          otherParticipants[
            Math.floor(Math.random() * otherParticipants.length)
          ];
        setTypingUsers(new Set([typingUser]));

        setTimeout(() => {
          setTypingUsers(new Set());
        }, 3000);
      }
    }
  };

  const updateMessageStatus = () => {
    setMessages((prev) =>
      prev.map((msg) => {
        if (msg.senderId === user?.id && msg.status === MESSAGE_STATUS.SENT) {
          return { ...msg, status: MESSAGE_STATUS.DELIVERED };
        }
        return msg;
      })
    );
  };

  const updateChatLastMessage = (chatId, message) => {
    setChats((prev) =>
      prev.map((chat) =>
        chat.id === chatId
          ? {
              ...chat,
              lastMessage: message,
              lastActivity: message.timestamp,
              unreadCount:
                message.senderId !== user?.id
                  ? chat.unreadCount + 1
                  : chat.unreadCount,
            }
          : chat
      )
    );
  };

  const handleSendMessage = async (e) => {
    e?.preventDefault();

    if (!newMessage.trim() || !activeChat) return;

    const messageData = {
      id: `msg_${Date.now()}_${user?.id}`,
      chatId: activeChat.id,
      senderId: user?.id,
      senderName: user?.name,
      senderAvatar: user?.avatar,
      type: replyingTo ? MESSAGE_TYPES.TEXT : MESSAGE_TYPES.TEXT,
      content: newMessage.trim(),
      timestamp: new Date().toISOString(),
      status: MESSAGE_STATUS.SENDING,
      readBy: [user?.id],
      reactions: {},
      replyTo: replyingTo,
      edited: false,
      deleted: false,
    };

    // Add message to UI immediately
    setMessages((prev) => [...prev, messageData]);
    setNewMessage("");
    setReplyingTo(null);

    try {
      // Save to storage
      const allMessages = getData("messages") || [];
      const updatedMessage = { ...messageData, status: MESSAGE_STATUS.SENT };
      await saveData("messages", [...allMessages, updatedMessage]);

      // Update message status in UI
      setMessages((prev) =>
        prev.map((msg) => (msg.id === messageData.id ? updatedMessage : msg))
      );

      // Update chat last message
      updateChatLastMessage(activeChat.id, updatedMessage);
    } catch (error) {
      console.error("Failed to send message:", error);
      // Update message status to failed
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === messageData.id
            ? { ...msg, status: MESSAGE_STATUS.FAILED }
            : msg
        )
      );
    }
  };

  const handleFileUpload = async (files) => {
    if (!files || files.length === 0 || !activeChat) return;

    setUploading(true);
    setUploadProgress(0);

    try {
      for (const file of Array.from(files)) {
        // Validate file size (max 25MB)
        if (file.size > 25 * 1024 * 1024) {
          setError(`File ${file.name} is too large (max 25MB)`);
          continue;
        }

        const result = await uploadFile(file, `chat/${activeChat.id}`);

        const messageData = {
          id: `msg_${Date.now()}_${user?.id}`,
          chatId: activeChat.id,
          senderId: user?.id,
          senderName: user?.name,
          senderAvatar: user?.avatar,
          type: file.type.startsWith("image/")
            ? MESSAGE_TYPES.IMAGE
            : MESSAGE_TYPES.FILE,
          content: result.url,
          fileName: file.name,
          fileSize: file.size,
          fileType: file.type,
          timestamp: new Date().toISOString(),
          status: MESSAGE_STATUS.SENT,
          readBy: [user?.id],
          reactions: {},
          replyTo: null,
          edited: false,
          deleted: false,
        };

        // Add to UI and storage
        setMessages((prev) => [...prev, messageData]);
        const allMessages = getData("messages") || [];
        await saveData("messages", [...allMessages, messageData]);
        updateChatLastMessage(activeChat.id, messageData);
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

  const handleVoiceRecording = async () => {
    if (recordingVoice) {
      // Stop recording
      if (voiceRecorder) {
        voiceRecorder.stop();
        setRecordingVoice(false);
      }
    } else {
      // Start recording
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: true,
        });
        const recorder = new MediaRecorder(stream);
        const chunks = [];

        recorder.ondataavailable = (e) => chunks.push(e.data);
        recorder.onstop = async () => {
          const blob = new Blob(chunks, { type: "audio/wav" });
          const file = new File([blob], `voice_${Date.now()}.wav`, {
            type: "audio/wav",
          });

          // Upload voice message
          const result = await uploadFile(file, `chat/${activeChat.id}/voice`);

          const messageData = {
            id: `msg_${Date.now()}_${user?.id}`,
            chatId: activeChat.id,
            senderId: user?.id,
            senderName: user?.name,
            senderAvatar: user?.avatar,
            type: MESSAGE_TYPES.VOICE,
            content: result.url,
            fileName: file.name,
            duration: 0, // Would need to calculate actual duration
            timestamp: new Date().toISOString(),
            status: MESSAGE_STATUS.SENT,
            readBy: [user?.id],
            reactions: {},
            replyTo: null,
            edited: false,
            deleted: false,
          };

          setMessages((prev) => [...prev, messageData]);
          const allMessages = getData("messages") || [];
          await saveData("messages", [...allMessages, messageData]);
          updateChatLastMessage(activeChat.id, messageData);
        };

        recorder.start();
        setVoiceRecorder(recorder);
        setRecordingVoice(true);
      } catch (error) {
        console.error("Failed to start voice recording:", error);
        setError("Voice recording not supported");
      }
    }
  };

  const handleMessageReaction = async (messageId, emoji) => {
    try {
      const allMessages = getData("messages") || [];
      const updatedMessages = allMessages.map((msg) => {
        if (msg.id === messageId) {
          const reactions = { ...msg.reactions };
          if (reactions[emoji]) {
            if (reactions[emoji].includes(user?.id)) {
              reactions[emoji] = reactions[emoji].filter(
                (id) => id !== user?.id
              );
              if (reactions[emoji].length === 0) {
                delete reactions[emoji];
              }
            } else {
              reactions[emoji].push(user?.id);
            }
          } else {
            reactions[emoji] = [user?.id];
          }
          return { ...msg, reactions };
        }
        return msg;
      });

      await saveData("messages", updatedMessages);

      // Update local state
      setMessages((prev) =>
        prev.map((msg) => {
          const updatedMsg = updatedMessages.find((m) => m.id === msg.id);
          return updatedMsg || msg;
        })
      );
    } catch (error) {
      console.error("Failed to add reaction:", error);
    }
  };

  const handleDeleteMessage = async (messageId) => {
    try {
      const allMessages = getData("messages") || [];
      const updatedMessages = allMessages.map((msg) =>
        msg.id === messageId
          ? { ...msg, deleted: true, content: "This message was deleted" }
          : msg
      );

      await saveData("messages", updatedMessages);
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === messageId
            ? { ...msg, deleted: true, content: "This message was deleted" }
            : msg
        )
      );
    } catch (error) {
      console.error("Failed to delete message:", error);
    }
  };

  const handleEditMessage = async (messageId, newContent) => {
    try {
      const allMessages = getData("messages") || [];
      const updatedMessages = allMessages.map((msg) =>
        msg.id === messageId
          ? {
              ...msg,
              content: newContent,
              edited: true,
              editedAt: new Date().toISOString(),
            }
          : msg
      );

      await saveData("messages", updatedMessages);
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === messageId
            ? {
                ...msg,
                content: newContent,
                edited: true,
                editedAt: new Date().toISOString(),
              }
            : msg
        )
      );

      setEditingMessage(null);
    } catch (error) {
      console.error("Failed to edit message:", error);
    }
  };

  const searchMessages = (query) => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    const results = messages.filter(
      (msg) =>
        msg.content.toLowerCase().includes(query.toLowerCase()) ||
        msg.senderName?.toLowerCase().includes(query.toLowerCase())
    );
    setSearchResults(results);
  };

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

  const formatFileSize = (bytes) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
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
    const isOwn = message.senderId === user?.id;
    const showAvatar =
      !isOwn &&
      (index === 0 || messages[index - 1]?.senderId !== message.senderId);
    const showName =
      !isOwn && showAvatar && activeChat?.type !== CHAT_TYPES.DIRECT;

    return (
      <div
        key={message.id}
        className={`flex items-end space-x-2 mb-4 ${isOwn ? "justify-end" : "justify-start"}`}
      >
        {!isOwn && (
          <div className="w-8 h-8 rounded-full overflow-hidden flex-shrink-0">
            {showAvatar ? (
              message.senderAvatar ? (
                <img
                  src={message.senderAvatar}
                  alt={message.senderName}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-gray-300 flex items-center justify-center">
                  <IoPersonOutline className="w-4 h-4 text-gray-600" />
                </div>
              )
            ) : (
              <div className="w-full h-full" />
            )}
          </div>
        )}

        <div className={`max-w-xs lg:max-w-md ${isOwn ? "order-1" : ""}`}>
          {showName && (
            <div className="text-xs text-gray-500 mb-1 px-2">
              {message.senderName}
            </div>
          )}

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
            onContextMenu={(e) => {
              e.preventDefault();
              setSelectedMessage(message);
            }}
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
                  className="rounded-lg max-h-64 object-cover"
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
                    {formatFileSize(message.fileSize)}
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

            {message.type === MESSAGE_TYPES.VOICE && (
              <div className="flex items-center space-x-3 min-w-48">
                <button
                  onClick={() => {
                    if (playingVoice === message.id) {
                      setPlayingVoice(null);
                    } else {
                      setPlayingVoice(message.id);
                      // Play voice message
                      const audio = new Audio(message.content);
                      audio.play();
                      audio.onended = () => setPlayingVoice(null);
                    }
                  }}
                  className="p-2 rounded-full bg-black bg-opacity-10 hover:bg-opacity-20"
                >
                  {playingVoice === message.id ? (
                    <IoPauseOutline className="w-4 h-4" />
                  ) : (
                    <IoPlayOutline className="w-4 h-4" />
                  )}
                </button>
                <div className="flex-1 h-8 bg-black bg-opacity-10 rounded-full flex items-center px-3">
                  <div className="text-xs">Voice message</div>
                </div>
              </div>
            )}

            {/* Message reactions */}
            {Object.keys(message.reactions || {}).length > 0 && (
              <div className="flex flex-wrap gap-1 mt-2">
                {Object.entries(message.reactions).map(([emoji, users]) => (
                  <button
                    key={emoji}
                    onClick={() => handleMessageReaction(message.id, emoji)}
                    className={`flex items-center space-x-1 px-2 py-1 rounded-full text-xs ${
                      users.includes(user?.id)
                        ? "bg-blue-100 text-blue-800 border border-blue-300"
                        : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                    }`}
                  >
                    <span>{emoji}</span>
                    <span>{users.length}</span>
                  </button>
                ))}
              </div>
            )}

            {/* Message actions overlay */}
            <div className="absolute -top-6 right-0 bg-white shadow-lg rounded-lg border opacity-0 group-hover:opacity-100 transition-opacity flex items-center space-x-1 p-1">
              {EMOJI_REACTIONS.slice(0, 3).map((emoji) => (
                <button
                  key={emoji}
                  onClick={() => handleMessageReaction(message.id, emoji)}
                  className="p-1 hover:bg-gray-100 rounded"
                >
                  {emoji}
                </button>
              ))}
              <button
                onClick={() => setReplyingTo(message)}
                className="p-1 hover:bg-gray-100 rounded"
                title="Reply"
              >
                <IoReplyOutline className="w-4 h-4 text-gray-600" />
              </button>
              <button
                onClick={() => setSelectedMessage(message)}
                className="p-1 hover:bg-gray-100 rounded"
                title="More"
              >
                <IoEllipsisHorizontalOutline className="w-4 h-4 text-gray-600" />
              </button>
            </div>
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

  const renderChatListItem = (chat) => {
    const isActive = activeChat?.id === chat.id;
    const lastMessage = chat.lastMessage;

    return (
      <div
        key={chat.id}
        onClick={() => setActiveChat(chat)}
        className={`flex items-center space-x-3 p-4 hover:bg-gray-50 cursor-pointer border-r-2 ${
          isActive ? "bg-blue-50 border-blue-500" : "border-transparent"
        }`}
      >
        <div className="relative">
          <div className="w-12 h-12 rounded-full overflow-hidden bg-gray-300 flex items-center justify-center">
            {chat.avatar ? (
              <img
                src={chat.avatar}
                alt={chat.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center">
                <span className="text-white font-semibold">
                  {chat.name.charAt(0).toUpperCase()}
                </span>
              </div>
            )}
          </div>
          {chat.type === CHAT_TYPES.DIRECT && chat.isOnline && (
            <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white"></div>
          )}
          {chat.isPinned && (
            <div className="absolute -top-1 -right-1 w-4 h-4 bg-yellow-500 rounded-full flex items-center justify-center">
              <IoPinOutline className="w-2 h-2 text-white" />
            </div>
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between">
            <h4 className="font-semibold text-gray-900 truncate">
              {chat.name}
            </h4>
            <div className="flex items-center space-x-2">
              {lastMessage && (
                <span className="text-xs text-gray-500">
                  {formatTime(lastMessage.timestamp)}
                </span>
              )}
              {chat.unreadCount > 0 && (
                <span className="bg-blue-500 text-white text-xs rounded-full px-2 py-1 min-w-5 text-center">
                  {chat.unreadCount}
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-600 truncate">
              {lastMessage ? (
                <>
                  {lastMessage.senderId === user?.id ? "You: " : ""}
                  {lastMessage.type === MESSAGE_TYPES.IMAGE
                    ? "ðŸ“· Image"
                    : lastMessage.type === MESSAGE_TYPES.FILE
                      ? "ðŸ“Ž File"
                      : lastMessage.type === MESSAGE_TYPES.VOICE
                        ? "ðŸŽµ Voice"
                        : lastMessage.content}
                </>
              ) : (
                chat.description || "No messages yet"
              )}
            </p>
            <div className="flex items-center space-x-1">
              {chat.isMuted && (
                <IoVolumeMuteOutline className="w-4 h-4 text-gray-400" />
              )}
              {chat.type === CHAT_TYPES.GROUP && (
                <IoPeopleOutline className="w-4 h-4 text-gray-400" />
              )}
              {chat.type === CHAT_TYPES.CHANNEL && (
                <IoMegaphoneOutline className="w-4 h-4 text-gray-400" />
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
        <Spinner size="lg" text="Loading chats..." />
      </div>
    );
  }

  return (
    <div className="h-screen bg-white flex overflow-hidden">
      {/* Sidebar */}
      <div
        className={`bg-white border-r border-gray-200 flex flex-col transition-all duration-300 ${
          sidebarVisible ? "w-80" : "w-0 overflow-hidden"
        }`}
      >
        {/* Sidebar Header */}
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-xl font-bold text-gray-900">Messages</h1>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setShowSettings(true)}
                className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg"
                title="Settings"
              >
                <IoSettingsOutline className="w-5 h-5" />
              </button>
              <button
                onClick={() => setSidebarVisible(false)}
                className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg lg:hidden"
                title="Hide sidebar"
              >
                <IoCloseOutline className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Search */}
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <IoSearchOutline className="h-4 w-4 text-gray-400" />
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                searchMessages(e.target.value);
              }}
              placeholder="Search chats..."
              className="block w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 text-sm"
            />
          </div>
        </div>

        {/* Chat List */}
        <div className="flex-1 overflow-y-auto">
          {searchResults.length > 0 ? (
            <div className="p-2">
              <h3 className="text-sm font-medium text-gray-500 px-2 py-1">
                Search Results
              </h3>
              {searchResults.map(renderMessage)}
            </div>
          ) : (
            chats
              .filter(
                (chat) =>
                  chat.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                  chat.description
                    ?.toLowerCase()
                    .includes(searchQuery.toLowerCase())
              )
              .map(renderChatListItem)
          )}
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        {activeChat ? (
          <>
            {/* Chat Header */}
            <div className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <button
                  onClick={() => setSidebarVisible(true)}
                  className={`p-2 text-gray-500 hover:bg-gray-100 rounded-lg ${sidebarVisible ? "lg:hidden" : ""}`}
                >
                  <IoChatbubbleOutline className="w-5 h-5" />
                </button>

                <div className="flex items-center space-x-3">
                  <div className="relative">
                    <div className="w-10 h-10 rounded-full overflow-hidden bg-gray-300 flex items-center justify-center">
                      {activeChat.avatar ? (
                        <img
                          src={activeChat.avatar}
                          alt={activeChat.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center">
                          <span className="text-white font-semibold text-sm">
                            {activeChat.name.charAt(0).toUpperCase()}
                          </span>
                        </div>
                      )}
                    </div>
                    {activeChat.type === CHAT_TYPES.DIRECT &&
                      activeChat.isOnline && (
                        <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></div>
                      )}
                  </div>

                  <div>
                    <h2 className="font-semibold text-gray-900">
                      {activeChat.name}
                    </h2>
                    <p className="text-sm text-gray-500">
                      {activeChat.type === CHAT_TYPES.DIRECT
                        ? activeChat.isOnline
                          ? "Online"
                          : "Offline"
                        : `${activeChat.participants?.length || 0} members`}
                      {typingUsers.size > 0 && (
                        <span className="text-blue-600"> â€¢ typing...</span>
                      )}
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex items-center space-x-2">
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
                  onClick={() => setShowChatInfo(!showChatInfo)}
                  className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg"
                  title="Chat info"
                >
                  <IoInformationCircleOutline className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-4 bg-gray-50">
              {messages.length === 0 ? (
                <div className="flex items-center justify-center h-full text-center">
                  <div>
                    <IoChatbubbleOutline className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                      No messages yet
                    </h3>
                    <p className="text-gray-500">
                      Start a conversation with {activeChat.name}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="max-w-4xl mx-auto">
                  {messages.map(renderMessage)}

                  {/* Typing indicator */}
                  {typingUsers.size > 0 && (
                    <div className="flex items-center space-x-2 mb-4">
                      <div className="w-8 h-8 rounded-full bg-gray-300"></div>
                      <div className="bg-gray-200 rounded-full px-4 py-2">
                        <div className="flex space-x-1">
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                          <div
                            className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                            style={{ animationDelay: "0.1s" }}
                          ></div>
                          <div
                            className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                            style={{ animationDelay: "0.2s" }}
                          ></div>
                        </div>
                      </div>
                    </div>
                  )}

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
              {/* Quick replies */}
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
                    onChange={(e) => {
                      setNewMessage(e.target.value);
                      if (!isTyping) {
                        setIsTyping(true);
                      }
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        handleSendMessage();
                      }
                    }}
                    placeholder="Type a message..."
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 resize-none max-h-32"
                    rows="1"
                    style={{
                      minHeight: "42px",
                      height: "auto",
                    }}
                  />

                  {/* Emoji picker button */}
                  <button
                    type="button"
                    onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                    className="absolute right-2 top-2 p-1 text-gray-500 hover:bg-gray-100 rounded"
                  >
                    <IoEmojiHappyOutline className="w-4 h-4" />
                  </button>
                </div>

                {/* Voice message button */}
                <button
                  type="button"
                  onClick={handleVoiceRecording}
                  className={`p-2 rounded-lg ${
                    recordingVoice
                      ? "bg-red-500 text-white"
                      : "text-gray-500 hover:bg-gray-100"
                  }`}
                >
                  {recordingVoice ? (
                    <IoStopOutline className="w-5 h-5" />
                  ) : (
                    <IoMicOutline className="w-5 h-5" />
                  )}
                </button>

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
          /* No chat selected */
          <div className="flex-1 flex items-center justify-center bg-gray-50">
            <div className="text-center">
              <IoChatbubbleOutline className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Select a chat
              </h3>
              <p className="text-gray-500">
                Choose a conversation from the sidebar to start messaging
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Chat Info Sidebar */}
      {showChatInfo && activeChat && (
        <div className="w-80 bg-white border-l border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900">Chat Info</h3>
            <button
              onClick={() => setShowChatInfo(false)}
              className="p-1 text-gray-500 hover:bg-gray-100 rounded"
            >
              <IoCloseOutline className="w-5 h-5" />
            </button>
          </div>

          <div className="space-y-6">
            {/* Chat details */}
            <div className="text-center">
              <div className="w-16 h-16 rounded-full overflow-hidden bg-gray-300 flex items-center justify-center mx-auto mb-3">
                {activeChat.avatar ? (
                  <img
                    src={activeChat.avatar}
                    alt={activeChat.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center">
                    <span className="text-white font-semibold text-lg">
                      {activeChat.name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                )}
              </div>
              <h4 className="font-semibold text-gray-900">{activeChat.name}</h4>
              <p className="text-sm text-gray-500">{activeChat.description}</p>
            </div>

            {/* Actions */}
            <div className="space-y-2">
              <button className="w-full flex items-center space-x-3 p-3 text-left hover:bg-gray-50 rounded-lg">
                <IoNotificationsOutline className="w-5 h-5 text-gray-500" />
                <span className="text-sm text-gray-700">
                  Mute notifications
                </span>
              </button>
              <button className="w-full flex items-center space-x-3 p-3 text-left hover:bg-gray-50 rounded-lg">
                <IoPinOutline className="w-5 h-5 text-gray-500" />
                <span className="text-sm text-gray-700">Pin chat</span>
              </button>
              <button className="w-full flex items-center space-x-3 p-3 text-left hover:bg-gray-50 rounded-lg">
                <IoArchiveOutline className="w-5 h-5 text-gray-500" />
                <span className="text-sm text-gray-700">Archive chat</span>
              </button>
            </div>

            {/* Participants */}
            {activeChat.type !== CHAT_TYPES.DIRECT && (
              <div>
                <h5 className="font-medium text-gray-900 mb-3">
                  Members ({activeChat.participants?.length || 0})
                </h5>
                <div className="space-y-2">
                  {/* Participant list would go here */}
                  <div className="text-sm text-gray-500">
                    Loading members...
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Emoji Picker */}
      {showEmojiPicker && (
        <div
          ref={emojiPickerRef}
          className="absolute bottom-20 right-6 bg-white shadow-lg rounded-lg border p-4 z-20"
        >
          <div className="grid grid-cols-6 gap-2">
            {EMOJI_REACTIONS.map((emoji) => (
              <button
                key={emoji}
                onClick={() => {
                  setNewMessage((prev) => prev + emoji);
                  setShowEmojiPicker(false);
                }}
                className="text-2xl hover:bg-gray-100 rounded p-2"
              >
                {emoji}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Message context menu */}
      {selectedMessage && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-sm w-full m-4">
            <div className="p-4 border-b border-gray-200">
              <h3 className="font-semibold text-gray-900">Message Actions</h3>
            </div>
            <div className="p-2">
              <button
                onClick={() => {
                  setReplyingTo(selectedMessage);
                  setSelectedMessage(null);
                }}
                className="w-full flex items-center space-x-3 p-3 text-left hover:bg-gray-50 rounded-lg"
              >
                <IoReplyOutline className="w-4 h-4 text-gray-500" />
                <span className="text-sm">Reply</span>
              </button>

              <button
                onClick={() => {
                  navigator.clipboard.writeText(selectedMessage.content);
                  setSelectedMessage(null);
                }}
                className="w-full flex items-center space-x-3 p-3 text-left hover:bg-gray-50 rounded-lg"
              >
                <IoCopyOutline className="w-4 h-4 text-gray-500" />
                <span className="text-sm">Copy</span>
              </button>

              {selectedMessage.senderId === user?.id && (
                <>
                  <button
                    onClick={() => {
                      setEditingMessage(selectedMessage);
                      setSelectedMessage(null);
                    }}
                    className="w-full flex items-center space-x-3 p-3 text-left hover:bg-gray-50 rounded-lg"
                  >
                    <IoCreateOutline className="w-4 h-4 text-gray-500" />
                    <span className="text-sm">Edit</span>
                  </button>

                  <button
                    onClick={() => {
                      setConfirmModal({
                        isOpen: true,
                        type: "delete",
                        title: "Delete Message",
                        message:
                          "Are you sure you want to delete this message?",
                        data: selectedMessage,
                      });
                      setSelectedMessage(null);
                    }}
                    className="w-full flex items-center space-x-3 p-3 text-left hover:bg-red-50 rounded-lg text-red-600"
                  >
                    <IoTrashOutline className="w-4 h-4" />
                    <span className="text-sm">Delete</span>
                  </button>
                </>
              )}

              <button
                onClick={() => setSelectedMessage(null)}
                className="w-full flex items-center space-x-3 p-3 text-left hover:bg-gray-50 rounded-lg"
              >
                <IoCloseOutline className="w-4 h-4 text-gray-500" />
                <span className="text-sm">Cancel</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Error message */}
      {error && (
        <div className="fixed top-4 right-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded z-50">
          <div className="flex items-center">
            <IoWarningOutline className="w-4 h-4 mr-2" />
            <span className="text-sm">{error}</span>
            <button
              onClick={() => setError("")}
              className="ml-4 text-red-500 hover:text-red-700"
            >
              <IoCloseOutline className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Confirmation Modal */}
      <ConfirmationModal
        isOpen={confirmModal.isOpen}
        onClose={() =>
          setConfirmModal({
            isOpen: false,
            type: null,
            title: "",
            message: "",
            data: null,
          })
        }
        onConfirm={() => {
          if (confirmModal.type === "delete" && confirmModal.data) {
            handleDeleteMessage(confirmModal.data.id);
          }
          setConfirmModal({
            isOpen: false,
            type: null,
            title: "",
            message: "",
            data: null,
          });
        }}
        title={confirmModal.title}
        message={confirmModal.message}
        confirmText="Delete"
        cancelText="Cancel"
        danger={confirmModal.type === "delete"}
      />
    </div>
  );
};

export default Chat;
