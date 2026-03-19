"use client";

import { useState, useEffect, useCallback } from "react";
import { AgentDB } from "@/types";
import { getAgents, getAgentById } from "@/lib/supabase";

export function useAgents(category?: string, search?: string) {
  const [agents, setAgents] = useState<AgentDB[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchAgents = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const data = await getAgents(
        category && category !== "All" ? category : undefined,
        search
      );
      setAgents(data);
    } catch (err) {
      setError(err instanceof Error ? err : new Error("Failed to fetch agents"));
    } finally {
      setIsLoading(false);
    }
  }, [category, search]);

  useEffect(() => {
    fetchAgents();
  }, [fetchAgents]);

  return { agents, isLoading, error, refetch: fetchAgents };
}

export function useAgent(id: string) {
  const [agent, setAgent] = useState<AgentDB | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    async function fetchAgent() {
      setIsLoading(true);
      setError(null);

      try {
        const data = await getAgentById(id);
        setAgent(data);
      } catch (err) {
        setError(err instanceof Error ? err : new Error("Failed to fetch agent"));
      } finally {
        setIsLoading(false);
      }
    }

    if (id) {
      fetchAgent();
    }
  }, [id]);

  return { agent, isLoading, error };
}
