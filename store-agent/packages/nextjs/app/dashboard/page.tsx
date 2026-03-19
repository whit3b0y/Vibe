"use client";

import { useAccount } from "wagmi";
import Link from "next/link";
import { formatEther } from "viem";
import { useUserSubscriptions } from "@/hooks/useSubscription";
import { useAgents } from "@/hooks/useAgents";

export default function DashboardPage() {
  const { address, isConnected } = useAccount();
  const { subscriptions, isLoading: subsLoading } = useUserSubscriptions();
  const { agents } = useAgents();

  // Get agents that user is subscribed to
  const subscribedAgentIds = subscriptions.map((s) => s.agent_id);
  const subscribedAgents = agents.filter((a) =>
    subscribedAgentIds.includes(a.contract_id)
  );

  if (!isConnected) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center py-16">
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
              d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z"
            />
          </svg>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Connect your wallet</h2>
          <p className="text-gray-500">Connect your wallet to view your subscriptions</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Dashboard</h1>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
        <div className="bg-white rounded-xl shadow-md p-6">
          <p className="text-sm text-gray-500 mb-1">Active Subscriptions</p>
          <p className="text-3xl font-bold text-gray-900">{subscriptions.length}</p>
        </div>
        <div className="bg-white rounded-xl shadow-md p-6">
          <p className="text-sm text-gray-500 mb-1">Wallet Address</p>
          <p className="text-lg font-mono text-gray-900 truncate">
            {address?.slice(0, 10)}...{address?.slice(-8)}
          </p>
        </div>
        <div className="bg-white rounded-xl shadow-md p-6">
          <p className="text-sm text-gray-500 mb-1">Network</p>
          <p className="text-lg font-semibold text-gray-900">Base</p>
        </div>
      </div>

      {/* Subscribed Agents */}
      <h2 className="text-xl font-semibold text-gray-900 mb-4">Your Agents</h2>

      {subsLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="bg-white rounded-xl shadow-md p-6 animate-pulse">
              <div className="h-6 bg-gray-200 rounded w-3/4 mb-4"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            </div>
          ))}
        </div>
      ) : subscribedAgents.length === 0 ? (
        <div className="bg-white rounded-xl shadow-md p-12 text-center">
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
              d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
            />
          </svg>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No subscriptions yet</h3>
          <p className="text-gray-500 mb-6">Browse our marketplace to find AI agents to subscribe to</p>
          <Link
            href="/"
            className="inline-flex items-center px-6 py-3 bg-indigo-600 text-white rounded-xl font-medium hover:bg-indigo-700 transition-colors"
          >
            Browse Agents
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {subscribedAgents.map((agent) => {
            const subscription = subscriptions.find((s) => s.agent_id === agent.contract_id);
            const expiresAt = subscription ? new Date(subscription.expires_at) : null;
            const isExpired = expiresAt ? expiresAt < new Date() : false;

            return (
              <Link key={agent.id} href={`/agent/${agent.contract_id}`}>
                <div className="bg-white rounded-xl shadow-md hover:shadow-lg transition-shadow p-6 cursor-pointer border border-gray-100">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">{agent.name}</h3>
                      <span className="inline-block px-2 py-1 text-xs font-medium bg-indigo-100 text-indigo-800 rounded-full mt-1">
                        {agent.category}
                      </span>
                    </div>
                    <span
                      className={`px-2 py-1 text-xs font-medium rounded-full ${
                        isExpired
                          ? "bg-red-100 text-red-700"
                          : "bg-green-100 text-green-700"
                      }`}
                    >
                      {isExpired ? "Expired" : "Active"}
                    </span>
                  </div>

                  {expiresAt && (
                    <p className="text-sm text-gray-500">
                      {isExpired ? "Expired on" : "Expires"}{" "}
                      {expiresAt.toLocaleDateString()}
                    </p>
                  )}

                  <div className="mt-4 pt-4 border-t border-gray-100 flex justify-between items-center">
                    <span className="text-sm text-gray-600">
                      {formatEther(BigInt(agent.price_per_month))} ETH/mo
                    </span>
                    <span className="text-indigo-600 text-sm font-medium">
                      Chat &rarr;
                    </span>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
