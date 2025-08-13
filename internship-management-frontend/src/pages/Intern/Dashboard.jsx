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
import {
  IoChatbubbleOutline,
  IoSendOutline,
  IoSearchOutline,
} from "react-icons/io5";

const MESSAGE_TYPES = { TEXT: "text", IMAGE: "image", FILE: "file" };
const MESSAGE_STATUS = {
  SENDING: "sending",
  SENT: "sent",
  DELIVERED: "delivered",
  READ: "read",
  FAILED: "failed",
};
const CHAT_TYPES = { DIRECT: "direct", GROUP: "group" };

const Chat = () => {
  const { user } = useAuth();
  const [chats, setChats] = useState([]);
  const [activeChat, setActiveChat] = useState(null);
  const [messages, setMessages] = useState({});
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  const chatEndRef = useRef(null);

  const loadChats = useCallback(async () => {
    try {
      setLoading(true);
      const users = getData("users") || [];
      const storedChats = getData(`chats_${user.id}`) || [];

      const peers = users.filter(
        (u) => (u.role === "mentor" || u.role === "admin") && u.id !== user.id
      );
      const defaultChats = peers.map((p) => ({
        id: `chat_${user.id}_${p.id}`,
        type: CHAT_TYPES.DIRECT,
        name: p.name,
        participants: [user.id, p.id],
        lastMessage: null,
        unreadCount: 0,
        isOnline: Math.random() > 0.3,
      }));

      const merged = [...defaultChats, ...storedChats];
      setChats(merged);
      if (merged.length > 0) setActiveChat(merged[0].id);

      // Load messages per chat
      const allMsgs = {};
      merged.forEach((c) => {
        allMsgs[c.id] = getData(`messages_${c.id}`) || [];
      });
      setMessages(allMsgs);
    } catch (err) {
      console.error("Failed to load chats:", err);
    } finally {
      setLoading(false);
    }
  }, [user.id]);

  useEffect(() => {
    if (user?.id) loadChats();
  }, [user, loadChats]);

  useEffect(() => {
    if (chatEndRef.current)
      chatEndRef.current.scrollIntoView({ behavior: "smooth" });
  }, [messages, activeChat]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !activeChat) return;

    const msg = {
      id: `msg_${Date.now()}`,
      senderId: user.id,
      content: newMessage.trim(),
      type: MESSAGE_TYPES.TEXT,
      timestamp: new Date().toISOString(),
      status: MESSAGE_STATUS.SENDING,
      readBy: [user.id],
    };

    setMessages((prev) => ({
      ...prev,
      [activeChat]: [...(prev[activeChat] || []), msg],
    }));
    setNewMessage("");

    try {
      const savedMsg = { ...msg, status: MESSAGE_STATUS.SENT };
      await saveData(`messages_${activeChat}`, [
        ...(messages[activeChat] || []),
        savedMsg,
      ]);
      setMessages((prev) => ({
        ...prev,
        [activeChat]: prev[activeChat].map((m) =>
          m.id === msg.id ? savedMsg : m
        ),
      }));
    } catch (err) {
      console.error("Failed to send:", err);
      setMessages((prev) => ({
        ...prev,
        [activeChat]: prev[activeChat].map((m) =>
          m.id === msg.id ? { ...m, status: MESSAGE_STATUS.FAILED } : m
        ),
      }));
    }
  };

  const filteredChats = useMemo(() => {
    if (!searchQuery) return chats;
    const q = searchQuery.toLowerCase();
    return chats.filter((c) => c.name.toLowerCase().includes(q));
  }, [chats, searchQuery]);

  if (loading) return <Spinner fullScreen text="Loading chats..." />;

  const activeMessages = messages[activeChat] || [];
  const currentChat = chats.find((c) => c.id === activeChat);

  return (
    <div className="flex h-full">
      {/* Sidebar */}
      <div className="w-64 border-r p-2">
        <div className="flex items-center border rounded px-2 mb-2">
          <IoSearchOutline />
          <input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search chats..."
            className="flex-grow p-1 outline-none"
          />
        </div>
        <ul>
          {filteredChats.map((chat) => (
            <li
              key={chat.id}
              onClick={() => setActiveChat(chat.id)}
              className={`p-2 cursor-pointer rounded ${
                activeChat === chat.id ? "bg-blue-100" : ""
              }`}
            >
              <div className="flex justify-between">
                <span>{chat.name}</span>
                {chat.unreadCount > 0 && (
                  <span className="text-xs bg-red-500 text-white px-2 rounded-full">
                    {chat.unreadCount}
                  </span>
                )}
              </div>
            </li>
          ))}
        </ul>
      </div>

      {/* Chat window */}
      <div className="flex flex-col flex-grow">
        {currentChat ? (
          <>
            <div className="border-b p-2 font-semibold">{currentChat.name}</div>
            <div className="flex-grow overflow-y-auto p-3">
              {activeMessages.map((msg) => (
                <div
                  key={msg.id}
                  className={`mb-1 flex ${
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
              className="border-t p-2 flex gap-2"
            >
              <input
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Type a message..."
                className="flex-grow border rounded p-2"
              />
              <button className="p-2 bg-blue-600 text-white rounded">
                <IoSendOutline />
              </button>
            </form>
          </>
        ) : (
          <div className="flex items-center justify-center flex-grow text-gray-500">
            Select a chat to start messaging
          </div>
        )}
      </div>
    </div>
  );
};

export default Chat;
