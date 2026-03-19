"use client";

import { useState } from "react";
import { useAccount, useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { parseEther } from "viem";
import { AGENT_MARKETPLACE_ADDRESS, AGENT_MARKETPLACE_ABI } from "@/lib/contract";
import { CATEGORIES, Category } from "@/types";

interface RegisterAgentFormProps {
  twitterHandle: string;
  onSuccess?: (agentId: bigint) => void;
}

export function RegisterAgentForm({ twitterHandle, onSuccess }: RegisterAgentFormProps) {
  const { address, isConnected } = useAccount();
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    category: CATEGORIES[0] as Category,
    webhookUrl: "",
    pricePerMonth: "0.01",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const { data: hash, writeContract, isPending } = useWriteContract();

  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  const validate = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = "Name is required";
    }
    if (!formData.description.trim()) {
      newErrors.description = "Description is required";
    }
    if (!formData.webhookUrl.trim()) {
      newErrors.webhookUrl = "Webhook URL is required";
    } else if (!formData.webhookUrl.startsWith("https://")) {
      newErrors.webhookUrl = "Webhook URL must start with https://";
    }
    if (!formData.pricePerMonth || parseFloat(formData.pricePerMonth) <= 0) {
      newErrors.pricePerMonth = "Price must be greater than 0";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate() || !isConnected) return;

    const priceInWei = parseEther(formData.pricePerMonth);

    writeContract({
      address: AGENT_MARKETPLACE_ADDRESS,
      abi: AGENT_MARKETPLACE_ABI,
      functionName: "registerAgent",
      args: [
        formData.name,
        formData.webhookUrl,
        priceInWei,
      ],
    });
  };

  if (!isConnected) {
    return (
      <div className="p-6 bg-gray-50 rounded-xl text-center">
        <p className="text-gray-600">Connect your wallet to register an agent</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Agent Name
        </label>
        <input
          type="text"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          placeholder="My Awesome Agent"
          className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
        {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name}</p>}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Description
        </label>
        <textarea
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          placeholder="Describe what your agent does..."
          rows={4}
          className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
        />
        {errors.description && <p className="mt-1 text-sm text-red-600">{errors.description}</p>}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Category
        </label>
        <select
          value={formData.category}
          onChange={(e) => setFormData({ ...formData, category: e.target.value as Category })}
          className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          {CATEGORIES.map((cat) => (
            <option key={cat} value={cat}>
              {cat}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Webhook URL
        </label>
        <input
          type="url"
          value={formData.webhookUrl}
          onChange={(e) => setFormData({ ...formData, webhookUrl: e.target.value })}
          placeholder="https://your-server.com/webhook"
          className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
        {errors.webhookUrl && <p className="mt-1 text-sm text-red-600">{errors.webhookUrl}</p>}
        <p className="mt-1 text-xs text-gray-500">
          This is where we'll send messages from users who subscribe to your agent
        </p>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Price per Month (ETH)
        </label>
        <input
          type="number"
          step="0.001"
          min="0"
          value={formData.pricePerMonth}
          onChange={(e) => setFormData({ ...formData, pricePerMonth: e.target.value })}
          className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
        {errors.pricePerMonth && <p className="mt-1 text-sm text-red-600">{errors.pricePerMonth}</p>}
      </div>

      <div className="p-4 bg-gray-50 rounded-xl">
        <div className="flex items-center space-x-2">
          <svg className="w-5 h-5 text-gray-500" fill="currentColor" viewBox="0 0 24 24">
            <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
          </svg>
          <span className="text-sm text-gray-600">Connected as @{twitterHandle}</span>
        </div>
      </div>

      <button
        type="submit"
        disabled={isPending || isConfirming}
        className="w-full py-4 bg-indigo-600 text-white rounded-xl font-semibold hover:bg-indigo-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
      >
        {isPending
          ? "Confirming in wallet..."
          : isConfirming
          ? "Registering..."
          : "Register Agent"}
      </button>

      {isSuccess && (
        <div className="p-4 bg-green-50 text-green-700 rounded-xl text-center">
          Agent registered successfully!
        </div>
      )}
    </form>
  );
}
