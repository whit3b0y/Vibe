"use client";

import { useState, useEffect, useCallback } from "react";
import { useAccount } from "wagmi";
import { getMessages, createMessage } from "@/lib/supabase";
import { supabase } from "@/lib/supabase";

interface Message {
  id: string;
  content: string;
  isUser: boolean;
  timestamp: string;
}

export function useChat(agentId: string) {
  const { address } = useAccount();
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  // Fetch initial messages
  useEffect(() => {
    async function fetchMessages() {
      if (!address || !agentId) {
        setMessages([]);
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        const data = await getMessages(agentId, address);
        const formattedMessages: Message[] = data.flatMap((msg) => {
          const result: Message[] = [
            {
              id: msg.id,
              content: msg.user_message,
              isUser: true,
              timestamp: msg.created_at,
            },
          ];
          if (msg.agent_response) {
            result.push({
              id: `${msg.id}-response`,
              content: msg.agent_response,
              isUser: false,
              timestamp: msg.responded_at || msg.created_at,
            });
          }
          return result;
        });
        setMessages(formattedMessages);
      } catch (err) {
        setError(err instanceof Error ? err : new Error("Failed to fetch messages"));
      } finally {
        setIsLoading(false);
      }
    }

    fetchMessages();
  }, [agentId, address]);

  // Subscribe to realtime updates
  useEffect(() => {
    if (!address || !agentId) return;

    const channel = supabase
      .channel(`messages:${agentId}:${address}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "messages",
          filter: `agent_id=eq.${agentId}`,
        },
        (payload) => {
          const updated = payload.new as any;
          if (updated.agent_response && updated.subscriber_address === address) {
            setMessages((prev) => {
              // Check if response already exists
              const responseId = `${updated.id}-response`;
              if (prev.some((m) => m.id === responseId)) return prev;

              return [
                ...prev,
                {
                  id: responseId,
                  content: updated.agent_response,
                  isUser: false,
                  timestamp: updated.responded_at || new Date().toISOString(),
                },
              ];
            });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [agentId, address]);

  const sendMessage = useCallback(
    async (content: string) => {
      if (!address || !agentId) {
        throw new Error("Not connected");
      }

      // Optimistically add user message
      const tempId = `temp-${Date.now()}`;
      const userMessage: Message = {
        id: tempId,
        content,
        isUser: true,
        timestamp: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, userMessage]);

      try {
        // Send to API which will relay to agent webhook
        const response = await fetch("/api/chat", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            agentId,
            message: content,
            senderAddress: address,
          }),
        });

        if (!response.ok) {
          throw new Error("Failed to send message");
        }

        const data = await response.json();

        // Update temp message with real ID
        setMessages((prev) =>
          prev.map((m) =>
            m.id === tempId ? { ...m, id: data.messageId } : m
          )
        );
      } catch (err) {
        // Remove optimistic message on error
        setMessages((prev) => prev.filter((m) => m.id !== tempId));
        throw err;
      }
    },
    [agentId, address]
  );

  return { messages, isLoading, error, sendMessage };
}
