"use client";

import { useParams } from "next/navigation";
import { useAccount } from "wagmi";
import { formatEther } from "viem";
import { useAgent } from "@/hooks/useAgents";
import { useSubscription } from "@/hooks/useSubscription";
import { useChat } from "@/hooks/useChat";
import { SubscribeButton } from "@/components/SubscribeButton";
import { ChatWindow } from "@/components/ChatWindow";

export default function AgentPage() {
  const params = useParams();
  const id = params.id as string;
  const { isConnected } = useAccount();

  const { agent, isLoading: agentLoading, error: agentError } = useAgent(id);
  const { hasAccess, isLoading: accessLoading, refetch: refetchAccess } = useSubscription(
    agent ? BigInt(agent.contract_id) : BigInt(0)
  );
  const { messages, sendMessage, isLoading: chatLoading } = useChat(id);

  if (agentLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/4 mb-8"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (agentError || !agent) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Agent not found</h1>
          <p className="text-gray-600">The agent you're looking for doesn't exist or has been removed.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Agent Info */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-xl shadow-lg p-6 sticky top-24">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">{agent.name}</h1>

            <span className="inline-block px-3 py-1 text-sm font-medium bg-indigo-100 text-indigo-800 rounded-full mb-4">
              {agent.category}
            </span>

            <p className="text-gray-600 mb-6">{agent.description || "No description provided."}</p>

            <div className="flex items-center text-sm text-gray-600 mb-6">
              <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 24 24">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
              </svg>
              <span>@{agent.twitter_handle}</span>
              {agent.twitter_followers > 0 && (
                <span className="ml-2 text-gray-400">
                  {agent.twitter_followers.toLocaleString()} followers
                </span>
              )}
            </div>

            <div className="border-t border-gray-200 pt-6">
              <div className="flex justify-between items-center mb-6">
                <span className="text-gray-600">Price</span>
                <div className="text-right">
                  <p className="text-2xl font-bold text-indigo-600">
                    {formatEther(BigInt(agent.price_per_month))} ETH
                  </p>
                  <p className="text-sm text-gray-500">/month</p>
                </div>
              </div>

              {!isConnected ? (
                <p className="text-center text-gray-500 py-4">
                  Connect your wallet to subscribe
                </p>
              ) : hasAccess ? (
                <div className="p-4 bg-green-50 text-green-700 rounded-xl text-center">
                  You have an active subscription
                </div>
              ) : (
                <SubscribeButton
                  agentId={BigInt(agent.contract_id)}
                  pricePerMonth={agent.price_per_month}
                  onSuccess={() => refetchAccess()}
                />
              )}
            </div>

            <div className="border-t border-gray-200 mt-6 pt-6">
              <p className="text-xs text-gray-400">
                Agent by {agent.owner_address.slice(0, 6)}...{agent.owner_address.slice(-4)}
              </p>
            </div>
          </div>
        </div>

        {/* Chat Section */}
        <div className="lg:col-span-2">
          {!isConnected ? (
            <div className="bg-white rounded-xl shadow-lg p-12 text-center">
              <svg
                className="mx-auto h-16 w-16 text-gray-300 mb-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                />
              </svg>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Connect to chat</h3>
              <p className="text-gray-500">Connect your wallet to chat with this agent</p>
            </div>
          ) : !hasAccess ? (
            <div className="bg-white rounded-xl shadow-lg p-12 text-center">
              <svg
                className="mx-auto h-16 w-16 text-gray-300 mb-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                />
              </svg>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Subscribe to unlock</h3>
              <p className="text-gray-500">Subscribe to this agent to start chatting</p>
            </div>
          ) : (
            <ChatWindow
              agentId={id}
              agentName={agent.name}
              messages={messages.map((m) => ({
                id: m.id,
                content: m.content,
                isUser: m.isUser,
                timestamp: m.timestamp,
              }))}
              onSendMessage={sendMessage}
              isLoading={chatLoading}
            />
          )}
        </div>
      </div>
    </div>
  );
}
