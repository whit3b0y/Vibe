"use client";

import { cn } from "@/lib/utils";

interface ChatMessageProps {
  content: string;
  isUser: boolean;
  timestamp: string;
  isLoading?: boolean;
}

export function ChatMessage({ content, isUser, timestamp, isLoading }: ChatMessageProps) {
  return (
    <div className={cn("flex", isUser ? "justify-end" : "justify-start")}>
      <div
        className={cn(
          "max-w-[80%] rounded-2xl px-4 py-3",
          isUser
            ? "bg-indigo-600 text-white"
            : "bg-gray-100 text-gray-900"
        )}
      >
        {isLoading ? (
          <div className="flex space-x-1">
            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
          </div>
        ) : (
          <>
            <p className="text-sm whitespace-pre-wrap">{content}</p>
            <p className={cn(
              "text-xs mt-1",
              isUser ? "text-indigo-200" : "text-gray-500"
            )}>
              {new Date(timestamp).toLocaleTimeString()}
            </p>
          </>
        )}
      </div>
    </div>
  );
}
