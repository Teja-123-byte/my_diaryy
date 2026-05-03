import { useEffect, useRef, useState, useCallback } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { socket } from "@/socket";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft, Mic, MicOff, Video, VideoOff, Users, MonitorUp,
  MessageCircle, Send, PhoneOff, Sparkles, X
} from "lucide-react";

interface Peer {
  socketId: string;
  username: string;
  stream: MediaStream | null;
}
interface ChatMsg { username: string; message: string; ts: number; mine?: boolean }

export default function Call() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const [roomId, setRoom] = useState(searchParams.get("roomId") || "");
  const [username, setUsername] = useState(localStorage.getItem("dreamline:name") || "Friend");
  const [isJoined, setIsJoined] = useState(false);
  const [error, setError] = useState("");
  const [isMicOn, setIsMicOn] = useState(true);
  const [isVideoOn, setIsVideoOn] = useState(true);
  const [isSharing, setIsSharing] = useState(false);
  const [peers, setPeers] = useState<Peer[]>([]);
  const [chatOpen, setChatOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMsg[]>([]);
  const [chatInput, setChatInput] = useState("");

  const localStreamRef = useRef<MediaStream | null>(null);
  const camTrackRef = useRef<MediaStreamTrack | null>(null);
  const pcsRef = useRef<Record<string, RTCPeerConnection>>({});
  const remoteVideoRefs = useRef<Record<string, HTMLVideoElement | null>>({});
  const remoteStreamsRef = useRef<Record<string, MediaStream>>({}); // ✅ stream store independent of React state
  const localVideoRef = useRef<HTMLVideoElement | null>(null);
  const chatEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const toggleMic = () => {
    const a = localStreamRef.current?.getAudioTracks()[0];
    if (a) { a.enabled = !a.enabled; setIsMicOn(a.enabled); }
  };

  const toggleVideo = () => {
    const v = localStreamRef.current?.getVideoTracks()[0];
    if (v) { v.enabled = !v.enabled; setIsVideoOn(v.enabled); }
  };

  const replaceVideoTrackForAllPeers = (newTrack: MediaStreamTrack) => {
    Object.values(pcsRef.current).forEach((pc) => {
      const sender = pc.getSenders().find((s) => s.track?.kind === "video");
      sender?.replaceTrack(newTrack);
    });
  };

  const toggleScreenShare = async () => {
    if (!localStreamRef.current) return;
    if (!isSharing) {
      try {
        const display = await (navigator.mediaDevices as any).getDisplayMedia({ video: true, audio: false });
        const screenTrack: MediaStreamTrack = display.getVideoTracks()[0];
        camTrackRef.current = localStreamRef.current.getVideoTracks()[0] || null;
        replaceVideoTrackForAllPeers(screenTrack);
        const newLocal = new MediaStream([screenTrack, ...localStreamRef.current.getAudioTracks()]);
        if (localVideoRef.current) { localVideoRef.current.srcObject = newLocal; localVideoRef.current.play().catch(() => {}); }
        screenTrack.onended = () => stopScreenShare();
        localStreamRef.current = newLocal;
        setIsSharing(true);
      } catch (e) { console.error(e); }
    } else { stopScreenShare(); }
  };

  const stopScreenShare = async () => {
    const cam = camTrackRef.current;
    if (cam) {
      replaceVideoTrackForAllPeers(cam);
      const restored = new MediaStream([cam, ...(localStreamRef.current?.getAudioTracks() || [])]);
      localStreamRef.current = restored;
      if (localVideoRef.current) { localVideoRef.current.srcObject = restored; localVideoRef.current.play().catch(() => {}); }
    } else {
      try {
        const cam2 = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
        const t = cam2.getVideoTracks()[0];
        camTrackRef.current = t;
        replaceVideoTrackForAllPeers(t);
        const restored = new MediaStream([t, ...(localStreamRef.current?.getAudioTracks() || [])]);
        localStreamRef.current = restored;
        if (localVideoRef.current) { localVideoRef.current.srcObject = restored; localVideoRef.current.play().catch(() => {}); }
      } catch {}
    }
    setIsSharing(false);
  };

  const startLocalStream = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      localStreamRef.current = stream;
      camTrackRef.current = stream.getVideoTracks()[0] || null;
      return stream;
    } catch (err) {
      console.error(err);
      setError("Failed to access camera/microphone");
      return null;
    }
  };

  // ✅ Central attach function — works regardless of timing
  const attachStream = useCallback((socketId: string, stream: MediaStream) => {
    remoteStreamsRef.current[socketId] = stream;
    const el = remoteVideoRefs.current[socketId];
    if (el && el.srcObject !== stream) {
      el.srcObject = stream;
      el.play().catch(() => {});
    }
    setPeers((prev) =>
      prev.map((p) => p.socketId === socketId ? { ...p, stream } : p)
    );
  }, []);

  const createPeerConnection = useCallback((targetSocketId: string) => {
    if (!localStreamRef.current) return null;
    if (pcsRef.current[targetSocketId]) pcsRef.current[targetSocketId].close();

    const pc = new RTCPeerConnection({
      iceServers: [
        { urls: "stun:stun.l.google.com:19302" },
        { urls: "stun:stun1.l.google.com:19302" },
      ],
    });

    localStreamRef.current.getTracks().forEach((track) =>
      pc.addTrack(track, localStreamRef.current!)
    );

    pc.ontrack = (event) => {
      console.log("🎥 ontrack from", targetSocketId, event.streams);
      const stream = event.streams[0];
      if (stream) attachStream(targetSocketId, stream);
    };

    pc.onicecandidate = (event) => {
      if (event.candidate)
        socket.emit("ice-candidate", { targetSocketId, candidate: event.candidate });
    };

    pc.onconnectionstatechange = () => {
      console.log(`🔗 ${targetSocketId} state:`, pc.connectionState);
    };

    pcsRef.current[targetSocketId] = pc;
    return pc;
  }, [attachStream]);

  // ✅ Safety net: when video element mounts after stream arrived, attach immediately
  useEffect(() => {
    peers.forEach((peer) => {
      const stream = remoteStreamsRef.current[peer.socketId];
      const el = remoteVideoRefs.current[peer.socketId];
      if (el && stream && el.srcObject !== stream) {
        el.srcObject = stream;
        el.play().catch(() => {});
      }
    });
  }, [peers]);

  const joinWebinar = async () => {
    if (!roomId) { setError("No Room ID found"); return; }
    const stream = await startLocalStream();
    if (!stream) return;
    socket.connect();
    socket.emit("join-room", { roomId, username });
    setIsJoined(true);
  };

  useEffect(() => {
    if (!isJoined || !roomId) return;

    // ✅ We are the NEW user — send offers to everyone already in room
    const onAllUsers = async (users: any[]) => {
      const others = users.filter((u) => u.socketId !== socket.id);
      setPeers(others.map((u) => ({ socketId: u.socketId, username: u.username, stream: null })));
      for (const user of others) {
        const pc = createPeerConnection(user.socketId);
        if (!pc) continue;
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);
        socket.emit("offer", { targetSocketId: user.socketId, offer });
      }
    };

    // ✅ KEY FIX: Someone else joined — just register them, NO offer from our side
    // They will send us an offer via their own onAllUsers. Both sides making offers = black video.
    const onUserJoined = ({ socketId, username: uname }: any) => {
      setPeers((prev) =>
        prev.find((p) => p.socketId === socketId)
          ? prev
          : [...prev, { socketId, username: uname, stream: null }]
      );
    };

    const onOffer = async ({ from, offer }: any) => {
      // ✅ Make sure peer is registered before answering
      setPeers((prev) =>
        prev.find((p) => p.socketId === from)
          ? prev
          : [...prev, { socketId: from, username: from, stream: null }]
      );
      let pc = pcsRef.current[from];
      if (!pc) pc = createPeerConnection(from)!;
      await pc.setRemoteDescription(new RTCSessionDescription(offer));
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);
      socket.emit("answer", { targetSocketId: from, answer });
    };

    const onAnswer = async ({ from, answer }: any) => {
      const pc = pcsRef.current[from];
      if (pc) await pc.setRemoteDescription(new RTCSessionDescription(answer));
    };

    const onIce = async ({ from, candidate }: any) => {
      const pc = pcsRef.current[from];
      if (pc) {
        try { await pc.addIceCandidate(new RTCIceCandidate(candidate)); } catch {}
      }
    };

    const onUserLeft = ({ socketId }: any) => {
      pcsRef.current[socketId]?.close();
      delete pcsRef.current[socketId];
      delete remoteStreamsRef.current[socketId];
      setPeers((prev) => prev.filter((p) => p.socketId !== socketId));
    };

    const onChat = (msg: any) => {
      setMessages((p) => [...p, {
        username: msg.username,
        message: msg.message,
        ts: msg.timestamp || Date.now(),
        mine: msg.username === username,
      }]);
    };

    socket.on("all-users", onAllUsers);
    socket.on("user-joined", onUserJoined);
    socket.on("offer", onOffer);
    socket.on("answer", onAnswer);
    socket.on("ice-candidate", onIce);
    socket.on("user-left", onUserLeft);
    socket.on("chat-message", onChat);

    return () => {
      socket.off("all-users", onAllUsers);
      socket.off("user-joined", onUserJoined);
      socket.off("offer", onOffer);
      socket.off("answer", onAnswer);
      socket.off("ice-candidate", onIce);
      socket.off("user-left", onUserLeft);
      socket.off("chat-message", onChat);
    };
  }, [isJoined, roomId, createPeerConnection, username]);

  const leaveCall = () => {
    localStreamRef.current?.getTracks().forEach((t) => t.stop());
    Object.values(pcsRef.current).forEach((pc) => pc.close());
    pcsRef.current = {};
    remoteStreamsRef.current = {};
    socket.emit("leave-room");
    navigate("/chat");
  };

  const sendChat = () => {
    if (!chatInput.trim()) return;
    socket.emit("chat-message", { roomId, message: chatInput, username });
    setChatInput("");
  };

  const totalUsers = 1 + peers.length;
  const cols = totalUsers === 1 ? "grid-cols-1" : totalUsers <= 4 ? "grid-cols-2" : "grid-cols-3";

  if (!isJoined) {
    return (
      <div className="flex min-h-[80vh] items-center justify-center px-4">
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
          className="glass-strong w-full max-w-md rounded-5xl p-8 dreamy-ring">
          <div className="mb-6 text-center">
            <span className="inline-flex items-center gap-2 rounded-full glass px-3 py-1 text-xs font-bold uppercase tracking-widest text-muted-foreground">
              <Sparkles className="h-3.5 w-3.5 text-primary" /> dreamy webinar
            </span>
            <h1 className="mt-4 font-display text-5xl font-bold">Join video room</h1>
            <p className="mt-1 text-sm text-muted-foreground">Study, talk, share screens — together.</p>
          </div>
          {error && <div className="mb-3 rounded-2xl bg-destructive/20 px-4 py-2 text-sm text-destructive">{error}</div>}
          <div className="space-y-3">
            <input type="text" value={roomId} onChange={(e) => setRoom(e.target.value)} placeholder="Room ID"
              className="w-full rounded-2xl border border-border bg-card/60 px-5 py-4 text-base focus:outline-none focus:ring-2 focus:ring-primary" />
            <input type="text" value={username} onChange={(e) => setUsername(e.target.value)} placeholder="Your name"
              className="w-full rounded-2xl border border-border bg-card/60 px-5 py-4 text-base focus:outline-none focus:ring-2 focus:ring-primary" />
            <button onClick={joinWebinar}
              className="w-full rounded-2xl bg-gradient-primary py-4 font-bold text-primary-foreground shadow-pop hover:-translate-y-0.5 transition-transform">
              Join webinar
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[calc(100vh-3rem)] gap-4">

      {/* Header */}
      <div className="glass rounded-3xl px-5 py-3 flex items-center justify-between">
        <button onClick={leaveCall} className="inline-flex items-center gap-2 text-sm font-bold text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" /> Leave
        </button>
        <div className="text-center">
          <div className="font-display text-2xl font-bold leading-none">Webinar Room</div>
          <div className="text-[11px] uppercase tracking-widest text-muted-foreground">#{roomId}</div>
        </div>
        <div className="inline-flex items-center gap-2 rounded-full glass px-3 py-1.5 text-sm font-bold text-mint">
          <Users className="h-4 w-4" /> {totalUsers}
        </div>
      </div>

      {/* Main area */}
      <div className={`flex-1 grid gap-4 min-h-0 ${chatOpen ? "lg:grid-cols-[1fr_340px]" : ""}`}>

        <div className="glass rounded-4xl p-4 overflow-hidden flex flex-col min-h-0">
          <div className={`flex-1 grid gap-3 ${cols} min-h-0`}>

            {/* ✅ Local video */}
            <motion.div layout className="relative rounded-3xl overflow-hidden bg-black/60 border border-border min-h-[180px]">
              <video
                ref={(el) => {
                  localVideoRef.current = el;
                  if (el && localStreamRef.current && el.srcObject !== localStreamRef.current) {
                    el.srcObject = localStreamRef.current;
                    el.play().catch(() => {});
                  }
                }}
                autoPlay playsInline muted
                className="w-full h-full object-cover"
              />
              <div className="absolute bottom-3 left-3 inline-flex items-center gap-2 rounded-2xl glass-strong px-3 py-1.5 text-xs font-bold">
                You ({username}) {isSharing && <span className="text-mint">· sharing</span>}
              </div>
              {!isVideoOn && (
                <div className="absolute inset-0 grid place-items-center bg-card/70 font-display text-4xl">
                  {username[0]?.toUpperCase()}
                </div>
              )}
            </motion.div>

            {/* ✅ Remote videos — 3-layer stream attachment */}
            {peers.map((peer) => (
              <motion.div key={peer.socketId} layout
                className="relative rounded-3xl overflow-hidden bg-black/60 border border-border min-h-[180px]">
                <video
                  ref={(el) => {
                    remoteVideoRefs.current[peer.socketId] = el;
                    // Layer 2: attach if stream arrived before this element mounted
                    const stream = remoteStreamsRef.current[peer.socketId];
                    if (el && stream && el.srcObject !== stream) {
                      el.srcObject = stream;
                      el.play().catch(() => {});
                    }
                  }}
                  autoPlay playsInline
                  className="w-full h-full object-cover"
                />
                {/* Avatar only while truly waiting for stream */}
                {!remoteStreamsRef.current[peer.socketId] && (
                  <div className="absolute inset-0 grid place-items-center bg-card/70 font-display text-4xl">
                    {peer.username[0]?.toUpperCase()}
                  </div>
                )}
                <div className="absolute bottom-3 left-3 inline-flex items-center gap-2 rounded-2xl glass-strong px-3 py-1.5 text-xs font-bold">
                  {peer.username}
                </div>
              </motion.div>
            ))}
          </div>

          {peers.length === 0 && (
            <div className="text-center text-sm text-muted-foreground mt-3">
              Waiting for friends to join… share room ID <span className="font-mono text-foreground">{roomId}</span>
            </div>
          )}
        </div>

        {/* Chat panel */}
        <AnimatePresence>
          {chatOpen && (
            <motion.aside initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}
              className="glass-strong rounded-4xl flex flex-col overflow-hidden min-h-0">
              <div className="flex items-center justify-between px-4 py-3 border-b border-border/40">
                <div className="font-bold flex items-center gap-2"><MessageCircle className="h-4 w-4 text-primary" /> In-call chat</div>
                <button onClick={() => setChatOpen(false)} className="grid h-8 w-8 place-items-center rounded-xl hover:bg-muted/40">
                  <X className="h-4 w-4" />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto scrollbar-dreamy p-3 space-y-2">
                {messages.length === 0 && <div className="text-center text-xs text-muted-foreground py-6">No messages yet ✨</div>}
                {messages.map((m, i) => (
                  <div key={i} className={`flex ${m.mine ? "justify-end" : "justify-start"}`}>
                    <div className={`max-w-[80%] rounded-2xl px-3 py-2 text-sm ${m.mine ? "bg-gradient-primary text-primary-foreground" : "glass"}`}>
                      {!m.mine && <div className="text-[10px] font-bold opacity-80 mb-0.5">{m.username}</div>}
                      <div className="break-words">{m.message}</div>
                    </div>
                  </div>
                ))}
                <div ref={chatEndRef} />
              </div>
              <div className="p-3 border-t border-border/40 flex gap-2">
                <input value={chatInput} onChange={(e) => setChatInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && sendChat()} placeholder="Message…"
                  className="flex-1 rounded-2xl border border-border bg-card/60 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
                <button onClick={sendChat} className="grid h-10 w-10 place-items-center rounded-2xl bg-gradient-primary text-primary-foreground">
                  <Send className="h-4 w-4" />
                </button>
              </div>
            </motion.aside>
          )}
        </AnimatePresence>
      </div>

      {/* Controls */}
      <div className="glass-strong rounded-3xl px-4 py-3 flex items-center justify-center gap-3">
        <button onClick={toggleMic} title={isMicOn ? "Mute" : "Unmute"}
          className={`grid h-12 w-12 place-items-center rounded-2xl transition-all ${isMicOn ? "glass" : "bg-destructive text-destructive-foreground"}`}>
          {isMicOn ? <Mic className="h-5 w-5" /> : <MicOff className="h-5 w-5" />}
        </button>
        <button onClick={toggleVideo} title={isVideoOn ? "Turn off camera" : "Turn on camera"}
          className={`grid h-12 w-12 place-items-center rounded-2xl transition-all ${isVideoOn ? "glass" : "bg-destructive text-destructive-foreground"}`}>
          {isVideoOn ? <Video className="h-5 w-5" /> : <VideoOff className="h-5 w-5" />}
        </button>
        <button onClick={toggleScreenShare} title="Share screen"
          className={`grid h-12 w-12 place-items-center rounded-2xl transition-all ${isSharing ? "bg-gradient-primary text-primary-foreground shadow-pop" : "glass"}`}>
          <MonitorUp className="h-5 w-5" />
        </button>
        <button onClick={() => setChatOpen((v) => !v)} title="In-call chat"
          className={`grid h-12 w-12 place-items-center rounded-2xl transition-all ${chatOpen ? "bg-gradient-primary text-primary-foreground shadow-pop" : "glass"}`}>
          <MessageCircle className="h-5 w-5" />
        </button>
        <button onClick={leaveCall}
          className="ml-2 inline-flex items-center gap-2 rounded-2xl bg-destructive px-5 py-3 font-bold text-destructive-foreground hover:-translate-y-0.5 transition-transform">
          <PhoneOff className="h-4 w-4" /> End
        </button>
      </div>
    </div>
  );
}