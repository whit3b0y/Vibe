"use client";

import Link from "next/link";
import { formatEther } from "viem";
import { AgentDB } from "@/types";

interface AgentCardProps {
  agent: AgentDB;
}

export function AgentCard({ agent }: AgentCardProps) {
  return (
    <Link href={`/agent/${agent.contract_id}`}>
      <div className="bg-white rounded-xl shadow-md hover:shadow-lg transition-shadow p-6 cursor-pointer border border-gray-100">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">{agent.name}</h3>
            <span className="inline-block px-2 py-1 text-xs font-medium bg-indigo-100 text-indigo-800 rounded-full mt-1">
              {agent.category}
            </span>
          </div>
          <div className="text-right">
            <p className="text-lg font-bold text-indigo-600">
              {formatEther(BigInt(agent.price_per_month))} ETH
            </p>
            <p className="text-xs text-gray-500">/month</p>
          </div>
        </div>

        <div className="flex items-center text-sm text-gray-600 mt-4">
          <svg
            className="w-4 h-4 mr-1"
            fill="currentColor"
            viewBox="0 0 24 24"
          >
            <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
          </svg>
          <span>{agent.twitter_handle}</span>
          {agent.twitter_followers > 0 && (
            <span className="ml-2 text-gray-400">
              {agent.twitter_followers.toLocaleString()} followers
            </span>
          )}
        </div>

        <div className="mt-4 pt-4 border-t border-gray-100">
          <p className="text-xs text-gray-400">
            by {agent.owner_address.slice(0, 6)}...{agent.owner_address.slice(-4)}
          </p>
        </div>
      </div>
    </Link>
  );
}
