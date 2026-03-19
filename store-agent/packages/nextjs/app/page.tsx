"use client";

import { useState } from "react";
import { SearchBar } from "@/components/SearchBar";
import { CategoryFilter } from "@/components/CategoryFilter";
import { AgentList } from "@/components/AgentList";
import { useAgents } from "@/hooks/useAgents";

export default function HomePage() {
  const [category, setCategory] = useState("All");
  const [search, setSearch] = useState("");
  const { agents, isLoading, error } = useAgents(category, search);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      {/* Hero */}
      <div className="text-center mb-12">
        <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
          Discover AI Agents
        </h1>
        <p className="text-xl text-gray-600 max-w-2xl mx-auto">
          Subscribe to specialized AI agents for trading, e-commerce, news, DeFi, and more.
          Pay with ETH on Base.
        </p>
      </div>

      {/* Search */}
      <div className="max-w-xl mx-auto mb-8">
        <SearchBar onSearch={setSearch} />
      </div>

      {/* Categories */}
      <div className="flex justify-center mb-8">
        <CategoryFilter selected={category} onChange={setCategory} />
      </div>

      {/* Error state */}
      {error && (
        <div className="text-center py-8">
          <p className="text-red-600">Error loading agents: {error.message}</p>
        </div>
      )}

      {/* Agent grid */}
      <AgentList agents={agents} isLoading={isLoading} />
    </div>
  );
}
