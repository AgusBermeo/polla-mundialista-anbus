"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";

interface ChatMessage {
  id: string;
  userId: string;
  content: string;
  createdAt: string;
  user: { name: string; email: string };
}

interface ChatProps {
  currentUserId: string;
  currentUserName: string;
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString("es", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "America/Guayaquil",
  });
}

function getInitials(name: string) {
  return name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

// Deterministic color from userId for avatars
const AVATAR_COLORS = [
  "bg-cyan-500",
  "bg-violet-500",
  "bg-amber-500",
  "bg-emerald-500",
  "bg-rose-500",
  "bg-sky-500",
  "bg-fuchsia-500",
  "bg-orange-500",
];

function avatarColor(userId: string) {
  let hash = 0;
  for (let i = 0; i < userId.length; i++) hash = userId.charCodeAt(i) + ((hash << 5) - hash);
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

// ── Message bubble ────────────────────────────────────────────────────────────

function MessageBubble({
  msg,
  isMe,
  showName,
}: {
  msg: ChatMessage;
  isMe: boolean;
  showName: boolean;
}) {
  const displayName = msg.user.name || msg.user.email.split("@")[0];

  return (
    <div className={`flex gap-2 items-end ${isMe ? "flex-row-reverse" : "flex-row"}`}>
      {/* Avatar — only for others, shown once per group */}
      {!isMe && (
        <div
          className={`w-7 h-7 rounded-full shrink-0 flex items-center justify-center text-[10px] font-bold text-white ${avatarColor(msg.userId)} ${!showName ? "invisible" : ""}`}
        >
          {getInitials(displayName)}
        </div>
      )}

      <div className={`flex flex-col gap-0.5 max-w-[72%] ${isMe ? "items-end" : "items-start"}`}>
        {/* Name label above first message in group */}
        {showName && !isMe && (
          <span className="text-[10px] text-gray-400 font-medium px-1">{displayName}</span>
        )}

        <div
          className={`px-3 py-2 rounded-2xl text-sm leading-relaxed break-words ${
            isMe
              ? "bg-cyan-600 text-white rounded-br-sm"
              : "bg-white border border-gray-100 text-gray-800 rounded-bl-sm shadow-xs"
          }`}
        >
          {msg.content}
        </div>

        <span className="text-[9px] text-gray-400 px-1">{formatTime(msg.createdAt)}</span>
      </div>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export default function Chat({ currentUserId, currentUserName }: ChatProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [unread, setUnread] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const supabase = createClient();

  // Scroll to bottom
  const scrollToBottom = useCallback((behavior: ScrollBehavior = "smooth") => {
    bottomRef.current?.scrollIntoView({ behavior });
  }, []);

  // Load history on first open
  useEffect(() => {
    if (!isOpen) return;

    setIsLoading(true);
    fetch("/api/chat")
      .then((r) => r.json())
      .then(({ data }) => {
        if (data) setMessages(data);
      })
      .finally(() => {
        setIsLoading(false);
        setTimeout(() => scrollToBottom("instant"), 50);
      });
  }, [isOpen, scrollToBottom]);

  // Supabase Realtime broadcast
  useEffect(() => {
    const channel = supabase.channel("chat-room");

    channel
      .on("broadcast", { event: "new-message" }, ({ payload }) => {
        const msg = payload as ChatMessage;
        setMessages((prev) => {
          // Deduplicate by id
          if (prev.find((m) => m.id === msg.id)) return prev;
          return [...prev, msg];
        });

        if (!isOpen || document.hidden) {
          setUnread((n) => n + 1);
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [isOpen]);

  // Scroll when new messages arrive (if chat is open)
  useEffect(() => {
    if (isOpen && messages.length > 0) {
      scrollToBottom();
    }
  }, [messages, isOpen, scrollToBottom]);

  // Clear unread when opened
  useEffect(() => {
    if (isOpen) {
      setUnread(0);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  async function handleSend() {
    const text = input.trim();
    if (!text || sending) return;

    setSending(true);
    setInput("");

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: text }),
      });

      if (!res.ok) {
        setInput(text); // restore on error
        return;
      }

      const { data: msg } = await res.json();

      // Optimistically add to local state
      setMessages((prev) => {
        if (prev.find((m) => m.id === msg.id)) return prev;
        return [...prev, msg];
      });

      // Broadcast to other users
      await supabase.channel("chat-room").send({
        type: "broadcast",
        event: "new-message",
        payload: msg,
      });
    } finally {
      setSending(false);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  return (
    <>
      {/* ── Chat window ─────────────────────────────────────────────────── */}
      <div
        className={`fixed bottom-20 right-4 sm:right-6 z-50 flex flex-col bg-slate-50 rounded-2xl shadow-2xl border border-gray-200 overflow-hidden transition-all duration-300 ease-out origin-bottom-right ${
          isOpen
            ? "w-[min(360px,calc(100vw-2rem))] h-[min(520px,calc(100vh-7rem))] opacity-100 scale-100 pointer-events-auto"
            : "w-0 h-0 opacity-0 scale-90 pointer-events-none"
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 bg-cyan-700 shrink-0">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-300 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-green-400" />
            </span>
            <span className="text-sm font-semibold text-white">Chat del grupo</span>
          </div>
          <button
            onClick={() => setIsOpen(false)}
            className="text-cyan-200 hover:text-white transition-colors p-1 rounded-lg hover:bg-cyan-600"
            aria-label="Cerrar chat"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-3 py-3 space-y-1 scrollbar-thin scrollbar-thumb-gray-200">
          {isLoading && (
            <div className="flex justify-center py-8">
              <div className="flex gap-1">
                {[0, 1, 2].map((i) => (
                  <span
                    key={i}
                    className="w-2 h-2 rounded-full bg-cyan-400 animate-bounce"
                    style={{ animationDelay: `${i * 0.12}s` }}
                  />
                ))}
              </div>
            </div>
          )}

          {!isLoading && messages.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full py-12 text-center">
              <span className="text-3xl mb-3">⚽</span>
              <p className="text-sm font-medium text-gray-500">¡Nadie ha dicho nada aún!</p>
              <p className="text-xs text-gray-400 mt-1">Sé el primero en escribir</p>
            </div>
          )}

          {messages.map((msg, i) => {
            const prev = messages[i - 1];
            const showName = !prev || prev.userId !== msg.userId;
            const isMe = msg.userId === currentUserId;

            return (
              <MessageBubble
                key={msg.id}
                msg={msg}
                isMe={isMe}
                showName={showName}
              />
            );
          })}

          <div ref={bottomRef} />
        </div>

        {/* Input */}
        <div className="shrink-0 px-3 py-3 border-t border-gray-200 bg-white">
          <div className="flex items-center gap-2">
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Escribe un mensaje..."
              maxLength={300}
              className="flex-1 text-sm px-3 py-2 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent placeholder-gray-300 text-gray-700 bg-slate-50"
            />
            <button
              onClick={handleSend}
              disabled={!input.trim() || sending}
              className="shrink-0 w-9 h-9 flex items-center justify-center rounded-xl bg-cyan-600 text-white hover:bg-cyan-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all active:scale-95"
              aria-label="Enviar"
            >
              {sending ? (
                <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
              ) : (
                <svg className="w-4 h-4 translate-x-px" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
                </svg>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* ── Floating bubble button ───────────────────────────────────────── */}
      <button
        onClick={() => setIsOpen((v) => !v)}
        className={`cursor-pointer fixed bottom-4 right-4 sm:right-6 z-50 w-13 h-13 rounded-full shadow-lg flex items-center justify-center transition-all duration-300 active:scale-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500 focus-visible:ring-offset-2 ${
          isOpen ? "bg-cyan-700 rotate-0" : "bg-cyan-600 hover:bg-cyan-700 hover:scale-105"
        }`}
        aria-label={isOpen ? "Cerrar chat" : "Abrir chat"}
        style={{ width: "52px", height: "52px" }}
      >
        <span className={`absolute inset-0 flex items-center justify-center transition-all duration-200 ${isOpen ? "opacity-100 rotate-0" : "opacity-0 rotate-90"}`}>
          <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </span>
        <span className={`absolute inset-0 flex items-center justify-center transition-all duration-200 ${isOpen ? "opacity-0 -rotate-90" : "opacity-100 rotate-0"}`}>
          <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 9.75a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375m-13.5 3.01c0 1.6 1.123 2.994 2.707 3.227 1.087.16 2.185.283 3.293.369V21l4.184-4.183a1.14 1.14 0 01.778-.332 48.294 48.294 0 005.83-.498c1.585-.233 2.708-1.626 2.708-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018z" />
          </svg>
        </span>

        {/* Unread badge */}
        {unread > 0 && !isOpen && (
          <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] bg-rose-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center px-1 shadow-md animate-bounce">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>
    </>
  );
}