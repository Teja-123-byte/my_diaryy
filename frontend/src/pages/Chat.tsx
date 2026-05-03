import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { socket, SERVER_URL } from "@/socket";
import { ArrowLeft, Send, Paperclip, Video, Users, Smile, Sparkles, Hash } from "lucide-react";

interface ChatMsg {
  username: string;
  message?: string;
  timestamp?: number;
  socketId?: string;
  isFile?: boolean;
  fileUrl?: string;
  fileName?: string;
}

export default function Chat() {
  const navigate = useNavigate();
  const [roomId, setRoomId] = useState("");
  const [username, setUsername] = useState(localStorage.getItem("dreamline:name") || "Friend");
  const [joined, setJoined] = useState(false);
  const [messages, setMessages] = useState<ChatMsg[]>([]);
  const [messageInput, setMessageInput] = useState("");
  const [usersInRoom, setUsersInRoom] = useState<any[]>([]);
  const [file, setFile] = useState<File | null>(null);
  const [showEmoji, setShowEmoji] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // ✅ Socket listeners — properly cleaned up with named functions
  useEffect(() => {
    if (!joined) return;

    const onMsg = (msg: ChatMsg) => setMessages((p) => [...p, msg]);

    const onJoined = (data: any) =>
      setUsersInRoom((p) => [...p.filter((u) => u.socketId !== data.socketId), data]);

    const onLeft = (data: any) =>
      setUsersInRoom((p) => p.filter((u) => u.socketId !== data.socketId));

    const onAll = (list: any[]) => setUsersInRoom(list);

    const onFile = (f: any) => setMessages((p) => [...p, { ...f, isFile: true }]);

    socket.on("chat-message", onMsg);
    socket.on("user-joined", onJoined);
    socket.on("user-left", onLeft);
    socket.on("all-users", onAll);
    socket.on("file-shared", onFile);

    return () => {
      // ✅ Remove exact listeners, not all listeners on the event
      socket.off("chat-message", onMsg);
      socket.off("user-joined", onJoined);
      socket.off("user-left", onLeft);
      socket.off("all-users", onAll);
      socket.off("file-shared", onFile);
    };
  }, [joined]);

  const joinRoom = () => {
    if (!roomId.trim()) { alert("Please enter a Room ID"); return; }
    socket.connect();
    socket.emit("join-room", { roomId: roomId.trim(), username });
    // ✅ Save name for video call page to pick up
    localStorage.setItem("dreamline:name", username);
    setJoined(true);
  };

  const createRoom = () => {
    socket.connect();
    socket.emit("create-room", { username });
    socket.once("room-created", ({ roomId: id }: any) => {
      setRoomId(id);
      localStorage.setItem("dreamline:name", username);
      socket.emit("join-room", { roomId: id, username });
      setJoined(true);
    });
    // ✅ Fallback if server doesn't support create-room event
    setTimeout(() => {
      if (!joined) {
        const id = Math.random().toString(36).slice(2, 10);
        setRoomId(id);
        socket.emit("join-room", { roomId: id, username });
        setJoined(true);
      }
    }, 1200);
  };

  const sendMessage = () => {
    if (!messageInput.trim() || !joined) return;
    socket.emit("chat-message", { roomId, message: messageInput, username });
    setMessageInput("");
  };

  const uploadFile = async () => {
    if (!file || !joined) return;
    const fd = new FormData();
    fd.append("file", file);
    fd.append("roomId", roomId);
    fd.append("username", username);
    try {
      await fetch(`${SERVER_URL}/upload`, { method: "POST", body: fd });
      setFile(null);
    } catch (err) {
      console.error(err);
    }
  };

  const leaveRoom = () => {
    socket.emit("leave-room");
    setJoined(false);
    setMessages([]);
    setUsersInRoom([]);
    // ✅ Don't reset roomId so user can rejoin easily
  };

  const startVideoCall = () => navigate(`/call?roomId=${roomId}`);

  // ── Join screen ──────────────────────────────────────────────
  if (!joined) {
    return (
      <div className="flex min-h-[80vh] items-center justify-center px-4">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-strong w-full max-w-md rounded-5xl p-8 dreamy-ring"
        >
          <div className="mb-6 text-center">
            <span className="inline-flex items-center gap-2 rounded-full glass px-3 py-1 text-xs font-bold uppercase tracking-widest text-muted-foreground">
              <Sparkles className="h-3.5 w-3.5 text-primary" /> cozy chat
            </span>
            <h1 className="mt-4 font-display text-5xl font-bold">Join a study room</h1>
            <p className="mt-1 text-sm text-muted-foreground">Enter a room ID or start a brand-new one.</p>
          </div>

          <div className="space-y-3">
            <input
              type="text"
              value={roomId}
              onChange={(e) => setRoomId(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && joinRoom()}
              placeholder="Room ID (e.g. a0c5f1ec)"
              className="w-full rounded-2xl border border-border bg-card/60 px-5 py-4 text-base focus:outline-none focus:ring-2 focus:ring-primary"
            />
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Your name"
              className="w-full rounded-2xl border border-border bg-card/60 px-5 py-4 text-base focus:outline-none focus:ring-2 focus:ring-primary"
            />
            <button
              onClick={joinRoom}
              className="w-full rounded-2xl bg-gradient-primary py-4 font-bold text-primary-foreground shadow-pop hover:-translate-y-0.5 transition-transform"
            >
              Join room
            </button>
            <button
              onClick={createRoom}
              className="w-full rounded-2xl glass py-4 font-bold hover:-translate-y-0.5 transition-transform"
            >
              ✨ Create new room
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  // ── Chat screen ──────────────────────────────────────────────
  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_280px] h-[calc(100vh-3rem)]">

      {/* Chat panel */}
      <div className="glass-strong flex flex-col rounded-5xl overflow-hidden">

        {/* Header */}
        <div className="flex items-center justify-between gap-3 border-b border-border/40 px-5 py-4">
          <div className="flex items-center gap-3 min-w-0">
            <button
              onClick={leaveRoom}
              className="grid h-10 w-10 place-items-center rounded-2xl bg-muted/40 hover:bg-muted"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <div className="min-w-0">
              <div className="flex items-center gap-2 font-bold">
                <Hash className="h-4 w-4 text-primary" />
                <span className="truncate">{roomId}</span>
              </div>
              <div className="text-xs text-muted-foreground flex items-center gap-1.5">
                {/* ✅ +1 to include yourself */}
                <span className="h-1.5 w-1.5 rounded-full bg-mint animate-pulse" />
                {usersInRoom.length + 1} online
              </div>
            </div>
          </div>
          <button
            onClick={startVideoCall}
            className="inline-flex items-center gap-2 rounded-2xl bg-gradient-primary px-4 py-2.5 text-sm font-bold text-primary-foreground shadow-pop hover:-translate-y-0.5 transition-transform"
          >
            <Video className="h-4 w-4" /> Video call
          </button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto scrollbar-dreamy p-5 space-y-3">
          {messages.length === 0 && (
            <div className="text-center text-muted-foreground py-10 font-display text-2xl">
              Say hi to your friends ✨
            </div>
          )}
          <AnimatePresence initial={false}>
            {messages.map((msg, i) => {
              const mine = msg.username === username;
              return (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex ${mine ? "justify-end" : "justify-start"}`}
                >
                  <div className={`max-w-[75%] rounded-3xl px-5 py-3 ${
                    mine
                      ? "bg-gradient-primary text-primary-foreground rounded-br-md shadow-pop"
                      : "glass rounded-bl-md"
                  }`}>
                    {!mine && <p className="text-xs font-bold opacity-80 mb-1">{msg.username}</p>}
                    {msg.isFile ? (
                      <a href={msg.fileUrl} target="_blank" rel="noreferrer" className="flex items-center gap-2 underline">
                        <Paperclip className="h-4 w-4" /> {msg.fileName}
                      </a>
                    ) : (
                      <p className="break-words">{msg.message}</p>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="border-t border-border/40 p-4">
          {showEmoji && (
            <div className="mb-2 flex flex-wrap gap-1 rounded-2xl glass p-2">
              {["😊","💖","✨","🌷","📚","🔥","🎉","☕","💪","🥹","😴","🤩","🌙","💫","🫶","📝"].map((e) => (
                <button
                  key={e}
                  onClick={() => { setMessageInput((m) => m + e); setShowEmoji(false); }}
                  className="text-2xl hover:scale-125 transition-transform p-1"
                >{e}</button>
              ))}
            </div>
          )}
          <div className="flex gap-2">
            <button
              onClick={() => setShowEmoji((v) => !v)}
              className="grid h-12 w-12 place-items-center rounded-2xl glass hover:bg-muted/40"
            >
              <Smile className="h-5 w-5" />
            </button>
            <input
              type="text"
              value={messageInput}
              onChange={(e) => setMessageInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && sendMessage()}
              placeholder="Type a dreamy message…"
              className="flex-1 rounded-2xl border border-border bg-card/60 px-5 py-3 text-base focus:outline-none focus:ring-2 focus:ring-primary"
            />
            <label className="cursor-pointer grid h-12 w-12 place-items-center rounded-2xl glass hover:bg-muted/40">
              <Paperclip className="h-5 w-5" />
              <input type="file" className="hidden" onChange={(e) => setFile(e.target.files?.[0] || null)} />
            </label>
            <button
              onClick={sendMessage}
              className="grid h-12 w-12 place-items-center rounded-2xl bg-gradient-primary text-primary-foreground shadow-pop hover:-translate-y-0.5 transition-transform"
            >
              <Send className="h-5 w-5" />
            </button>
          </div>

          {file && (
            <div className="mt-2 flex items-center justify-between rounded-2xl glass px-4 py-2 text-sm">
              <span className="truncate">📎 {file.name}</span>
              <div className="flex gap-2">
                <button
                  onClick={uploadFile}
                  className="rounded-full bg-gradient-primary px-3 py-1 text-xs font-bold text-primary-foreground"
                >Upload</button>
                <button onClick={() => setFile(null)} className="text-muted-foreground hover:text-foreground">✕</button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Members panel */}
      <aside className="hidden lg:flex flex-col glass rounded-5xl p-5 overflow-y-auto scrollbar-dreamy">
        <div className="mb-4 flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-muted-foreground">
          <Users className="h-3.5 w-3.5 text-primary" /> in this room
        </div>
        <ul className="space-y-2">
          {/* ✅ Show yourself first, then others, no duplicates */}
          {[
            { socketId: "me", username: `${username} (you)` },
            ...usersInRoom.filter((u) => u.username !== username),
          ].map((u) => (
            <li key={u.socketId} className="flex items-center gap-3 rounded-2xl glass p-3">
              <span className="grid h-10 w-10 place-items-center rounded-2xl bg-gradient-primary font-bold text-primary-foreground">
                {u.username?.[0]?.toUpperCase()}
              </span>
              <div>
                <div className="font-bold text-sm">{u.username}</div>
                <div className="text-[10px] uppercase tracking-widest text-mint">● online</div>
              </div>
            </li>
          ))}
        </ul>
        <button
          onClick={startVideoCall}
          className="mt-auto inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-primary px-4 py-3 text-sm font-bold text-primary-foreground shadow-pop hover:-translate-y-0.5 transition-transform"
        >
          <Video className="h-4 w-4" /> Start video call
        </button>
      </aside>
    </div>
  );
}