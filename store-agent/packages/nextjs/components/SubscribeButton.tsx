"use client";

import { useState } from "react";
import { useAccount, useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { parseEther } from "viem";
import { AGENT_MARKETPLACE_ADDRESS, AGENT_MARKETPLACE_ABI } from "@/lib/contract";

interface SubscribeButtonProps {
  agentId: bigint;
  pricePerMonth: string;
  onSuccess?: () => void;
}

export function SubscribeButton({ agentId, pricePerMonth, onSuccess }: SubscribeButtonProps) {
  const { isConnected } = useAccount();
  const [months, setMonths] = useState(1);

  const { data: hash, writeContract, isPending } = useWriteContract();

  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  const handleSubscribe = async () => {
    if (!isConnected) return;

    const totalPrice = BigInt(pricePerMonth) * BigInt(months);

    writeContract({
      address: AGENT_MARKETPLACE_ADDRESS,
      abi: AGENT_MARKETPLACE_ABI,
      functionName: "subscribe",
      args: [agentId, BigInt(months)],
      value: totalPrice,
    });
  };

  if (isSuccess) {
    onSuccess?.();
  }

  if (!isConnected) {
    return (
      <div className="p-4 bg-gray-50 rounded-xl text-center">
        <p className="text-gray-600">Connect your wallet to subscribe</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center space-x-4">
        <label className="text-sm font-medium text-gray-700">Duration:</label>
        <select
          value={months}
          onChange={(e) => setMonths(Number(e.target.value))}
          className="px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          <option value={1}>1 month</option>
          <option value={3}>3 months</option>
          <option value={6}>6 months</option>
          <option value={12}>12 months</option>
        </select>
      </div>

      <div className="p-4 bg-gray-50 rounded-xl">
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">Price per month</span>
          <span className="font-medium">{(Number(pricePerMonth) / 1e18).toFixed(4)} ETH</span>
        </div>
        <div className="flex justify-between text-sm mt-2">
          <span className="text-gray-600">Duration</span>
          <span className="font-medium">{months} month(s)</span>
        </div>
        <div className="flex justify-between text-lg font-bold mt-3 pt-3 border-t border-gray-200">
          <span>Total</span>
          <span className="text-indigo-600">
            {((Number(pricePerMonth) / 1e18) * months).toFixed(4)} ETH
          </span>
        </div>
      </div>

      <button
        onClick={handleSubscribe}
        disabled={isPending || isConfirming}
        className="w-full py-4 bg-indigo-600 text-white rounded-xl font-semibold hover:bg-indigo-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
      >
        {isPending
          ? "Confirming in wallet..."
          : isConfirming
          ? "Processing..."
          : `Subscribe for ${months} month(s)`}
      </button>

      {isSuccess && (
        <div className="p-4 bg-green-50 text-green-700 rounded-xl text-center">
          Subscription successful! You can now chat with this agent.
        </div>
      )}
    </div>
  );
}
