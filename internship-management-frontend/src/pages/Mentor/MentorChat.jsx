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
import { IoSendOutline, IoSearchOutline } from "react-icons/io5";

const MESSAGE_TYPES = {
  TEXT: "text",
  IMAGE: "image",
  FILE: "file",
};

const MESSAGE_STATUS = {
  SENDING: "sending",
  SENT: "sent",
  DELIVERED: "delivered",
  READ: "read",
  FAILED: "failed",
};

const MentorChat = () => {
  const { user } = useAuth();
  const [interns, setInterns] = useState([]);
  const [messages, setMessages] = useState({});
  const [conversationStats, setConversationStats] = useState({});
  const [selectedInternId, setSelectedInternId] = useState(null);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  const chatEndRef = useRef(null);

  const loadMentorData = useCallback(async () => {
    try {
      setLoading(true);
      const [internsData, conversationsData] = await Promise.all([
        getInternsByMentorId(user.id),
        getConversationsForMentor(user.id),
      ]);
      setInterns(internsData);

      const allMsgs = {};
      const stats = {};
      for (const intern of internsData) {
        const stored = getData(`messages_${user.id}_${intern.id}`) || [];
        allMsgs[intern.id] = stored;
        stats[intern.id] = {
          totalMessages: stored.length,
          unreadCount: stored.filter(
            (m) => m.senderId === intern.id && !m.readBy?.includes(user.id)
          ).length,
          lastActivity:
            stored.length > 0
              ? new Date(stored[stored.length - 1].timestamp)
              : null,
        };
      }
      setMessages(allMsgs);
      setConversationStats(stats);
      if (internsData.length > 0) setSelectedInternId(internsData[0].id);
    } catch (e) {
      console.error("Failed to load mentor chat data:", e);
    } finally {
      setLoading(false);
    }
  }, [user.id]);

  useEffect(() => {
    if (user?.id) loadMentorData();
  }, [user, loadMentorData]);

  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, selectedInternId]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedInternId) return;

    const msg = {
      id: `msg_${Date.now()}`,
      senderId: user.id,
      senderName: user.name,
      receiverId: selectedInternId,
      type: MESSAGE_TYPES.TEXT,
      content: newMessage.trim(),
      timestamp: new Date().toISOString(),
      status: MESSAGE_STATUS.SENDING,
      readBy: [user.id],
    };

    setMessages((prev) => ({
      ...prev,
      [selectedInternId]: [...(prev[selectedInternId] || []), msg],
    }));
    setNewMessage("");

    try {
      const updated = { ...msg, status: MESSAGE_STATUS.SENT };
      const currentMsgs = messages[selectedInternId] || [];
      await saveData(`messages_${user.id}_${selectedInternId}`, [
        ...currentMsgs,
        updated,
      ]);
      setMessages((prev) => ({
        ...prev,
        [selectedInternId]: prev[selectedInternId].map((m) =>
          m.id === msg.id ? updated : m
        ),
      }));
    } catch (err) {
      console.error("Failed to send message:", err);
      setMessages((prev) => ({
        ...prev,
        [selectedInternId]: prev[selectedInternId].map((m) =>
          m.id === msg.id ? { ...m, status: MESSAGE_STATUS.FAILED } : m
        ),
      }));
    }
  };

  const filteredInterns = useMemo(() => {
    return interns.filter(
      (intern) =>
        intern.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        intern.email?.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [interns, searchQuery]);

  if (loading) return <Spinner fullScreen text="Loading chat..." />;

  const selectedIntern = interns.find((i) => i.id === selectedInternId);
  const currentMsgs = messages[selectedInternId] || [];

  return (
    <div className="flex h-full">
      {/* Sidebar */}
      <div className="w-64 border-r p-3">
        <div className="flex items-center border px-2 mb-3 rounded">
          <IoSearchOutline />
          <input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search interns..."
            className="flex-grow p-1 outline-none"
          />
        </div>
        <ul>
          {filteredInterns.map((intern) => (
            <li
              key={intern.id}
              className={`p-2 cursor-pointer rounded ${
                selectedInternId === intern.id ? "bg-blue-100" : ""
              }`}
              onClick={() => setSelectedInternId(intern.id)}
            >
              <div className="flex justify-between items-center">
                <span>{intern.name}</span>
                {conversationStats[intern.id]?.unreadCount > 0 && (
                  <span className="text-xs bg-red-500 text-white px-2 rounded-full">
                    {conversationStats[intern.id]?.unreadCount}
                  </span>
                )}
              </div>
            </li>
          ))}
        </ul>
      </div>

      {/* Chat */}
      <div className="flex flex-col flex-grow">
        {selectedIntern ? (
          <>
            <div className="border-b p-3 font-semibold">
              Chat with {selectedIntern.name}
            </div>
            <div className="flex-grow overflow-y-auto p-3">
              {currentMsgs.map((msg) => (
                <div
                  key={msg.id}
                  className={`mb-2 flex ${
                    msg.senderId === user.id ? "justify-end" : "justify-start"
                  }`}
                >
                  <div
                    className={`p-2 rounded ${
                      msg.senderId === user.id
                        ? "bg-blue-500 text-white"
                        : "bg-gray-200"
                    }`}
                  >
                    {msg.content}
                  </div>
                </div>
              ))}
              <div ref={chatEndRef} />
            </div>
            <form
              onSubmit={handleSendMessage}
              className="border-t p-3 flex gap-2"
            >
              <input
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Type a message..."
                className="flex-grow border rounded p-2"
              />
              <button
                type="submit"
                className="p-2 bg-blue-600 text-white rounded"
              >
                <IoSendOutline />
              </button>
            </form>
          </>
        ) : (
          <div className="flex items-center justify-center flex-grow text-gray-500">
            Select an intern to start chatting
          </div>
        )}
      </div>
    </div>
  );
};

export default MentorChat;
