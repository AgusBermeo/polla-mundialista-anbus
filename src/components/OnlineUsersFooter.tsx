"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

interface OnlineUser {
  userId: string;
  name: string;
  joinedAt: number;
}

interface OnlineUsersFooterProps {
  currentUserId: string;
  currentUserName: string;
  isAdmin: boolean;
}

export default function OnlineUsersFooter({
  currentUserId,
  currentUserName,
  isAdmin,
}: OnlineUsersFooterProps) {
  if (!isAdmin) return null;
  const [onlineUsers, setOnlineUsers] = useState<OnlineUser[]>([]);

  useEffect(() => {
    const supabase = createClient();

    const channel = supabase.channel("online-users", {
      config: {
        presence: {
          key: currentUserId,
        },
      },
    });

    channel
      .on("presence", { event: "sync" }, () => {
        const state = channel.presenceState<{
          name: string;
          joinedAt: number;
        }>();

        const users: OnlineUser[] = Object.entries(state).map(
          ([userId, presences]) => ({
            userId,
            name: presences[0].name,
            joinedAt: presences[0].joinedAt,
          })
        );

        // Sort by join time
        users.sort((a, b) => a.joinedAt - b.joinedAt);
        setOnlineUsers(users);
      })
      .subscribe(async (status) => {
        if (status === "SUBSCRIBED") {
          await channel.track({
            name: currentUserName,
            joinedAt: Date.now(),
          });
        }
      });

    return () => {
      channel.untrack().then(() => supabase.removeChannel(channel));
    };
  }, [currentUserId, currentUserName]);

  const count = onlineUsers.length;

  return (
    <footer className="bg-slate-800 border-t border-slate-700 py-3 px-6">
      <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-4">
        {/* Online count badge */}
        <div className="flex items-center gap-2 shrink-0">
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-500" />
          </span>
          <span className="text-xs font-semibold text-green-400 uppercase tracking-wider">
            {count} {count === 1 ? "conectado" : "conectados"}
          </span>
        </div>

        {/* Divider */}
        <div className="hidden sm:block h-3 w-px bg-slate-600" />

        {/* Users list */}
        <div className="flex flex-wrap gap-2">
          {onlineUsers.map((user) => (
            <span
              key={user.userId}
              className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium transition-all ${
                user.userId === currentUserId
                  ? "bg-cyan-900/60 text-cyan-300 ring-1 ring-cyan-500/40"
                  : "bg-slate-700 text-slate-300"
              }`}
            >
              <span
                className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                  user.userId === currentUserId
                    ? "bg-cyan-400"
                    : "bg-green-400"
                }`}
              />
              {user.name}
              {user.userId === currentUserId && (
                <span className="text-cyan-500/70 text-[10px]">(tú)</span>
              )}
            </span>
          ))}
        </div>
      </div>
    </footer>
  );
}