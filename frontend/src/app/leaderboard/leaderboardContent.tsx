"use client";

import { useState, useEffect } from "react";
import { Trophy, RefreshCw, TrendingUp } from "lucide-react";
import { getLeaderboard, getHistory, ScoreEntry, AttemptEntry } from "@/lib/leaderboard-api";
import { Spinner } from "@/components/ui/spinner";
import {
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import DarkModeToggle from "@/components/ui/darkModeToggle";
import { UserMenu } from "@/components/user-menu";
import { loadState } from "@/lib/app-state";

const NUM_LEVELS = 7;

function formatTime(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  const tenths = Math.floor((ms % 1000) / 100);
  return minutes > 0
    ? `${minutes}:${String(seconds).padStart(2, "0")}.${tenths}s`
    : `${seconds}.${tenths}s`;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

function medalColor(rank: number): string {
  if (rank === 1) return "text-yellow-500";
  if (rank === 2) return "text-gray-400";
  if (rank === 3) return "text-amber-600";
  return "text-gray-500 dark:text-gray-400";
}

export default function LeaderboardContent() {
  const [selectedLevel, setSelectedLevel] = useState(1);
  const [scores, setScores] = useState<ScoreEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [username, setUsername] = useState("");
  const [token, setToken] = useState("");
  const [history, setHistory] = useState<AttemptEntry[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  useEffect(() => {
    const state = loadState();
    setUsername(state.user.username ?? "");
    setToken(state.user.token ?? "");
  }, []);

  useEffect(() => {
    setLoading(true);
    getLeaderboard(selectedLevel).then((data) => {
      setScores(data);
      setLoading(false);
    });
  }, [selectedLevel]);

  useEffect(() => {
    if (!token) {
      setHistory([]);
      return;
    }
    setHistoryLoading(true);
    getHistory(token, selectedLevel).then((data) => {
      setHistory(data);
      setHistoryLoading(false);
    });
  }, [selectedLevel, token]);

  const refresh = () => {
    setLoading(true);
    getLeaderboard(selectedLevel).then((data) => {
      setScores(data);
      setLoading(false);
    });
  };

  return (
    <SidebarProvider>
      <div className="relative min-h-screen w-full bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-gray-100">
        <AppSidebar />

        <div className="flex flex-1 flex-col h-full">
          <header className="p-4 flex items-center border-b">
            <SidebarTrigger />
            <div className="ml-auto flex items-center gap-4">
              <UserMenu
                username={username}
                token={token}
                onAuthChange={(u, t) => { setUsername(u); setToken(t); }}
              />
              <DarkModeToggle />
            </div>
          </header>

          <main className="flex-1 p-6 max-w-3xl mx-auto w-full">
            <div className="flex items-center gap-3 mb-2">
              <Trophy className="w-7 h-7 text-yellow-500" />
              <h1 className="text-2xl font-bold">Leaderboard</h1>
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
              Ranked by fewest steps, then fastest time, then fewest lines of code. Only your
              first completion of a level counts here — see all your attempts under{" "}
              <span className="font-medium">Your Progress</span> below.
            </p>

            {/* Level tabs */}
            <div className="flex gap-2 mb-6 flex-wrap">
              {Array.from({ length: NUM_LEVELS }, (_, i) => i + 1).map((lvl) => (
                <button
                  key={lvl}
                  onClick={() => setSelectedLevel(lvl)}
                  className={[
                    "px-4 py-1.5 rounded-lg text-sm font-medium transition-colors",
                    selectedLevel === lvl
                      ? "bg-blue-600 text-white"
                      : "bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700",
                  ].join(" ")}
                >
                  Level {lvl}
                </button>
              ))}
              <button
                onClick={refresh}
                className="ml-auto p-2 rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700"
                title="Refresh"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            </div>

            {/* Table */}
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden shadow-sm">
              {loading ? (
                <div className="flex justify-center items-center py-16">
                  <Spinner />
                </div>
              ) : scores.length === 0 ? (
                <div className="text-center py-16 text-gray-400 dark:text-gray-500">
                  <Trophy className="w-10 h-10 mx-auto mb-3 opacity-30" />
                  <p>No scores yet for Level {selectedLevel}.</p>
                  <p className="text-sm mt-1">Complete the level to appear here!</p>
                </div>
              ) : (
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 text-xs uppercase tracking-wider">
                      <th className="px-5 py-3 text-left w-12">Rank</th>
                      <th className="px-5 py-3 text-left">Player</th>
                      <th className="px-5 py-3 text-right">Steps</th>
                      <th className="px-5 py-3 text-right">Time</th>
                      <th className="px-5 py-3 text-right">Lines of Code</th>
                      <th className="px-5 py-3 text-right">When</th>
                    </tr>
                  </thead>
                  <tbody>
                    {scores.map((entry, idx) => {
                      const rank = idx + 1;
                      const isMe = entry.username === username;
                      return (
                        <tr
                          key={`${entry.username}-${entry.levelId}`}
                          className={[
                            "border-b border-gray-100 dark:border-gray-700/50 last:border-0",
                            isMe ? "bg-blue-50 dark:bg-blue-900/20" : "",
                          ].join(" ")}
                        >
                          <td className={`px-5 py-3 font-bold ${medalColor(rank)}`}>
                            {rank}
                          </td>
                          <td className="px-5 py-3 font-medium">
                            {entry.username}
                            {isMe && (
                              <span className="ml-2 text-xs text-blue-500">(you)</span>
                            )}
                          </td>
                          <td className="px-5 py-3 text-right font-mono">
                            {entry.steps ?? "—"}
                          </td>
                          <td className="px-5 py-3 text-right font-mono">
                            {formatTime(entry.firstTimeMs)}
                          </td>
                          <td className="px-5 py-3 text-right font-mono">
                            {entry.linesOfCode ?? "—"}
                          </td>
                          <td className="px-5 py-3 text-right text-gray-500 dark:text-gray-400">
                            {formatDate(entry.createdAt)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>

            {token && (
              <div className="mt-8">
                <div className="flex items-center gap-2 mb-4">
                  <TrendingUp className="w-5 h-5 text-blue-500" />
                  <h2 className="text-lg font-bold">Your Progress</h2>
                </div>
                <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden shadow-sm">
                  {historyLoading ? (
                    <div className="flex justify-center items-center py-10">
                      <Spinner />
                    </div>
                  ) : history.length === 0 ? (
                    <div className="text-center py-10 text-gray-400 dark:text-gray-500">
                      <p>No attempts yet for Level {selectedLevel}.</p>
                    </div>
                  ) : (
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 text-xs uppercase tracking-wider">
                          <th className="px-5 py-3 text-left w-16">Attempt</th>
                          <th className="px-5 py-3 text-right">Steps</th>
                          <th className="px-5 py-3 text-right">Time</th>
                          <th className="px-5 py-3 text-right">Lines of Code</th>
                          <th className="px-5 py-3 text-right">When</th>
                        </tr>
                      </thead>
                      <tbody>
                        {history.map((attempt, idx) => (
                          <tr
                            key={idx}
                            className="border-b border-gray-100 dark:border-gray-700/50 last:border-0"
                          >
                            <td className="px-5 py-3 font-medium">#{idx + 1}</td>
                            <td className="px-5 py-3 text-right font-mono">{attempt.steps}</td>
                            <td className="px-5 py-3 text-right font-mono">
                              {formatTime(attempt.timeMs)}
                            </td>
                            <td className="px-5 py-3 text-right font-mono">
                              {attempt.linesOfCode}
                            </td>
                            <td className="px-5 py-3 text-right text-gray-500 dark:text-gray-400">
                              {formatDate(attempt.createdAt)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              </div>
            )}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
