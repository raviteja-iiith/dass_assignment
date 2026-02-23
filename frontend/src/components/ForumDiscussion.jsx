import { useState, useEffect, useRef } from "react";
import { useAuth } from "../context/AuthContext";
import API from "../services/api";

const ForumDiscussion = ({ eventId, isOrganizer }) => {
  const { user } = useAuth();
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [isAnnouncement, setIsAnnouncement] = useState(false);
  const [loading, setLoading] = useState(true);
  const [replyTo, setReplyTo] = useState(null);
  const [expandedThreads, setExpandedThreads] = useState(new Set());
  const [threadReplies, setThreadReplies] = useState({});
  const [lastSeenTimestamp, setLastSeenTimestamp] = useState(null);
  const [newMessageCount, setNewMessageCount] = useState(0);
  const [showNotification, setShowNotification] = useState(false);
  const previousMessageCount = useRef(0);

  // Load last seen timestamp from localStorage
  useEffect(() => {
    const stored = localStorage.getItem(`forum_last_seen_${eventId}`);
    if (stored) {
      setLastSeenTimestamp(new Date(stored));
    } else {
      // First visit - set to now
      const now = new Date();
      setLastSeenTimestamp(now);
      localStorage.setItem(`forum_last_seen_${eventId}`, now.toISOString());
    }
  }, [eventId]);

  useEffect(() => {
    fetchMessages();
    const interval = setInterval(fetchMessages, 5000); // Poll every 5 seconds
    return () => clearInterval(interval);
  }, [eventId]);

  const fetchMessages = async () => {
    try {
      const response = await API.get(`/events/${eventId}/forum`);
      const fetchedMessages = response.data;
      
      // Check for new messages
      if (lastSeenTimestamp && previousMessageCount.current > 0 && fetchedMessages.length > previousMessageCount.current) {
        const newMsgs = fetchedMessages.filter(msg => new Date(msg.createdAt) > lastSeenTimestamp);
        if (newMsgs.length > 0) {
          setShowNotification(true);
          setTimeout(() => setShowNotification(false), 5000); // Hide after 5 seconds
        }
      }
      
      previousMessageCount.current = fetchedMessages.length;
      setMessages(fetchedMessages);
      
      // Count unread messages
      if (lastSeenTimestamp) {
        const unreadCount = fetchedMessages.filter(msg => 
          new Date(msg.createdAt) > lastSeenTimestamp && 
          msg.userId?._id !== user?.id
        ).length;
        setNewMessageCount(unreadCount);
      }
    } catch (error) {
      console.error("Error fetching messages:", error);
    } finally {
      setLoading(false);
    }
  };

  const markAllAsRead = () => {
    const now = new Date();
    setLastSeenTimestamp(now);
    localStorage.setItem(`forum_last_seen_${eventId}`, now.toISOString());
    setNewMessageCount(0);
    setShowNotification(false);
  };

  const isMessageNew = (message) => {
    return lastSeenTimestamp && 
           new Date(message.createdAt) > lastSeenTimestamp && 
           message.userId?._id !== user?.id;
  };

  const fetchThreadReplies = async (messageId) => {
    try {
      const response = await API.get(`/events/${eventId}/forum/${messageId}/replies`);
      setThreadReplies(prev => ({ ...prev, [messageId]: response.data }));
    } catch (error) {
      console.error("Error fetching replies:", error);
    }
  };

  const handlePostMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    try {
      await API.post(`/events/${eventId}/forum`, {
        content: newMessage,
        parentMessageId: replyTo?._id,
        isAnnouncement: isOrganizer && isAnnouncement
      });
      setNewMessage("");
      setReplyTo(null);
      setIsAnnouncement(false);
      fetchMessages();
    } catch (error) {
      alert(error.response?.data?.error || "Failed to post message");
    }
  };

  const handleDelete = async (messageId) => {
    if (!confirm("Are you sure you want to delete this message?")) return;

    try {
      await API.delete(`/events/${eventId}/forum/${messageId}`);
      fetchMessages();
    } catch (error) {
      alert(error.response?.data?.error || "Failed to delete message");
    }
  };

  const handlePin = async (messageId) => {
    try {
      await API.put(`/events/${eventId}/forum/${messageId}/pin`);
      fetchMessages();
    } catch (error) {
      alert(error.response?.data?.error || "Failed to pin message");
    }
  };

  const handleReact = async (messageId, reactionType) => {
    try {
      await API.post(`/events/${eventId}/forum/${messageId}/react`, {
        reactionType
      });
      fetchMessages();
    } catch (error) {
      alert(error.response?.data?.error || "Failed to react");
    }
  };

  const toggleThread = async (messageId) => {
    const newExpanded = new Set(expandedThreads);
    if (newExpanded.has(messageId)) {
      newExpanded.delete(messageId);
    } else {
      newExpanded.add(messageId);
      if (!threadReplies[messageId]) {
        await fetchThreadReplies(messageId);
      }
    }
    setExpandedThreads(newExpanded);
  };

  const getReactionCount = (message, type) => {
    return message.reactions?.filter(r => r.type === type).length || 0;
  };

  const hasUserReacted = (message, type) => {
    return message.reactions?.some(
      r => r.userId === user?.id && r.type === type
    );
  };

  const ReactionButton = ({ message, type, emoji }) => {
    const count = getReactionCount(message, type);
    const reacted = hasUserReacted(message, type);

    return (
      <button
        onClick={() => handleReact(message._id, type)}
        className={`btn btn-xs ${reacted ? "btn-primary" : "btn-ghost"}`}
      >
        {emoji} {count > 0 && count}
      </button>
    );
  };

  const MessageItem = ({ message, isReply = false }) => {
    const userName = message.userRole === "organizer"
      ? message.userId?.organizerName
      : `${message.userId?.firstName} ${message.userId?.lastName}`;
    const isNew = isMessageNew(message);

    return (
      <div className={`${isReply ? "ml-8 mt-2" : ""} ${isNew ? "animate-pulse" : ""}`}>
        <div
          className={`card ${
            message.isAnnouncement
              ? "bg-accent text-accent-content"
              : message.isPinned
              ? "bg-base-200 border-2 border-primary"
              : isNew
              ? "bg-success bg-opacity-10 border-2 border-success"
              : "bg-base-100"
          } shadow-md mb-3`}
        >
          <div className="card-body p-4">
            <div className="flex justify-between items-start">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-bold">{userName}</span>
                  {isNew && (
                    <span className="badge badge-success badge-sm animate-bounce">🆕 NEW</span>
                  )}
                  {message.userRole === "organizer" && (
                    <span className="badge badge-primary badge-sm">Organizer</span>
                  )}
                  {message.isAnnouncement && (
                    <span className="badge badge-accent badge-sm">📢 Announcement</span>
                  )}
                  {message.isPinned && (
                    <span className="badge badge-info badge-sm">📌 Pinned</span>
                  )}
                </div>
                <p className="text-xs opacity-60">
                  {new Date(message.createdAt).toLocaleString()}
                </p>
              </div>
              {isOrganizer && !isReply && (
                <div className="dropdown dropdown-end">
                  <label tabIndex={0} className="btn btn-ghost btn-xs">
                    ⋮
                  </label>
                  <ul
                    tabIndex={0}
                    className="dropdown-content menu p-2 shadow bg-base-100 rounded-box w-32"
                  >
                    <li>
                      <button onClick={() => handlePin(message._id)}>
                        {message.isPinned ? "Unpin" : "Pin"}
                      </button>
                    </li>
                    <li>
                      <button onClick={() => handleDelete(message._id)}>
                        Delete
                      </button>
                    </li>
                  </ul>
                </div>
              )}
            </div>

            <p className="mt-2 whitespace-pre-wrap">{message.content}</p>

            <div className="flex gap-2 mt-3">
              <ReactionButton message={message} type="like" emoji="👍" />
              <ReactionButton message={message} type="heart" emoji="❤️" />
              <ReactionButton message={message} type="thumbsup" emoji="👏" />
              <ReactionButton message={message} type="question" emoji="❓" />
              {!isReply && (
                <>
                  <button
                    onClick={() => setReplyTo(message)}
                    className="btn btn-ghost btn-xs"
                  >
                    💬 Reply
                  </button>
                  {message.replyCount > 0 && (
                    <button
                      onClick={() => toggleThread(message._id)}
                      className="btn btn-ghost btn-xs"
                    >
                      {expandedThreads.has(message._id) ? "▼" : "▶"} {message.replyCount}{" "}
                      {message.replyCount === 1 ? "reply" : "replies"}
                    </button>
                  )}
                </>
              )}
            </div>
          </div>
        </div>

        {/* Thread replies */}
        {!isReply && expandedThreads.has(message._id) && threadReplies[message._id] && (
          <div className="ml-4">
            {threadReplies[message._id].map((reply) => (
              <MessageItem key={reply._id} message={reply} isReply={true} />
            ))}
          </div>
        )}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex justify-center p-8">
        <span className="loading loading-spinner loading-lg"></span>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Notification Toast */}
      {showNotification && (
        <div className="toast toast-top toast-center z-50">
          <div className="alert alert-success shadow-lg">
            <div>
              <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current flex-shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>New messages in the forum! 🎉</span>
            </div>
          </div>
        </div>
      )}

      {/* New Messages Header */}
      {newMessageCount > 0 && (
        <div className="alert alert-info shadow-lg">
          <div className="flex-1">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" className="w-6 h-6 mx-2 stroke-current">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
            </svg>
            <span>
              <strong>{newMessageCount}</strong> new {newMessageCount === 1 ? 'message' : 'messages'} since your last visit
            </span>
          </div>
          <div className="flex-none">
            <button onClick={markAllAsRead} className="btn btn-sm btn-primary">
              Mark All as Read
            </button>
          </div>
        </div>
      )}

      {/* Post new message */}
      <div className="card bg-base-100 shadow-xl border border-base-300">
        <div className="card-body">
          <h3 className="card-title">
            {replyTo ? `Replying to ${replyTo.userId?.firstName || replyTo.userId?.organizerName}` : "Post a Message"}
          </h3>
          {replyTo && (
            <div className="alert alert-info mb-2">
              <div>
                <p className="text-sm">{replyTo.content.substring(0, 100)}...</p>
                <button
                  onClick={() => setReplyTo(null)}
                  className="btn btn-xs btn-ghost mt-1"
                >
                  Cancel Reply
                </button>
              </div>
            </div>
          )}
          <form onSubmit={handlePostMessage}>
            <textarea
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              className="textarea textarea-bordered w-full"
              placeholder="Write your message here..."
              rows="3"
              required
            ></textarea>
            <div className="flex justify-between items-center mt-2">
              <div>
                {isOrganizer && !replyTo && (
                  <label className="label cursor-pointer gap-2">
                    <input
                      type="checkbox"
                      checked={isAnnouncement}
                      onChange={(e) => setIsAnnouncement(e.target.checked)}
                      className="checkbox checkbox-primary checkbox-sm"
                    />
                    <span className="label-text">Post as Announcement</span>
                  </label>
                )}
              </div>
              <button type="submit" className="btn btn-primary">
                {replyTo ? "Reply" : "Post"}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Messages list */}
      <div className="space-y-3">
        {messages.length === 0 ? (
          <div className="text-center p-8 opacity-60">
            No messages yet. Be the first to start the discussion!
          </div>
        ) : (
          messages
            .filter((msg) => !msg.parentMessageId) // Only show top-level messages
            .map((message) => <MessageItem key={message._id} message={message} />)
        )}
      </div>
    </div>
  );
};

export default ForumDiscussion;
