"use client";

import { useState, useEffect } from "react";
import { useAccount } from "wagmi";
import { useSearchParams } from "next/navigation";
import { TwitterConnect } from "@/components/TwitterConnect";
import { RegisterAgentForm } from "@/components/RegisterAgentForm";

export default function SellPage() {
  const { isConnected } = useAccount();
  const searchParams = useSearchParams();
  const [twitterUser, setTwitterUser] = useState<{ handle: string; followers: number } | null>(null);

  // Check for Twitter connection from cookie
  useEffect(() => {
    const twitterCookie = document.cookie
      .split("; ")
      .find((row) => row.startsWith("twitter_user="));

    if (twitterCookie) {
      try {
        const userData = JSON.parse(decodeURIComponent(twitterCookie.split("=")[1]));
        setTwitterUser(userData);
      } catch (e) {
        console.error("Failed to parse Twitter cookie:", e);
      }
    }
  }, [searchParams]);

  // Check for errors from OAuth
  const error = searchParams.get("error");

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <h1 className="text-3xl font-bold text-gray-900 mb-2">Sell Your AI Agent</h1>
      <p className="text-gray-600 mb-8">
        List your AI agent on the marketplace and earn ETH from subscriptions.
      </p>

      {error && (
        <div className="mb-6 p-4 bg-red-50 text-red-700 rounded-xl">
          Twitter connection failed: {error}
        </div>
      )}

      {!isConnected ? (
        <div className="bg-white rounded-xl shadow-lg p-8 text-center">
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
          <p className="text-gray-500">Connect your wallet to start selling AI agents</p>
        </div>
      ) : (
        <div className="space-y-8">
          {/* Step 1: Twitter Connect */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-8 h-8 rounded-full bg-indigo-600 text-white flex items-center justify-center text-sm font-bold">
                1
              </div>
              <h2 className="text-lg font-semibold text-gray-900">Connect Twitter</h2>
            </div>
            <p className="text-gray-600 mb-4">
              We require Twitter verification to ensure agent legitimacy and build trust with subscribers.
            </p>
            <TwitterConnect
              onConnect={(handle) => setTwitterUser({ handle, followers: 0 })}
              isConnected={!!twitterUser}
              handle={twitterUser?.handle}
            />
          </div>

          {/* Step 2: Register Agent */}
          <div className={`bg-white rounded-xl shadow-lg p-6 ${!twitterUser ? "opacity-50" : ""}`}>
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-8 h-8 rounded-full bg-indigo-600 text-white flex items-center justify-center text-sm font-bold">
                2
              </div>
              <h2 className="text-lg font-semibold text-gray-900">Register Your Agent</h2>
            </div>
            {!twitterUser ? (
              <p className="text-gray-500">Connect your Twitter account first to continue.</p>
            ) : (
              <RegisterAgentForm
                twitterHandle={twitterUser.handle}
                onSuccess={(agentId) => {
                  // Could redirect to agent page or show success
                  console.log("Agent registered:", agentId);
                }}
              />
            )}
          </div>

          {/* Info */}
          <div className="bg-indigo-50 rounded-xl p-6">
            <h3 className="font-semibold text-indigo-900 mb-2">How it works</h3>
            <ul className="space-y-2 text-sm text-indigo-800">
              <li className="flex items-start">
                <svg className="w-5 h-5 mr-2 text-indigo-600 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Users pay ETH to subscribe to your agent
              </li>
              <li className="flex items-start">
                <svg className="w-5 h-5 mr-2 text-indigo-600 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Messages are relayed to your webhook URL
              </li>
              <li className="flex items-start">
                <svg className="w-5 h-5 mr-2 text-indigo-600 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Your agent responds via our API
              </li>
              <li className="flex items-start">
                <svg className="w-5 h-5 mr-2 text-indigo-600 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                5% platform fee, 95% goes to you
              </li>
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}
