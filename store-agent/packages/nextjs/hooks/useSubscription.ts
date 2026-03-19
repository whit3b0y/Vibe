"use client";

import { useState, useEffect } from "react";
import { useAccount, useReadContract } from "wagmi";
import { AGENT_MARKETPLACE_ADDRESS, AGENT_MARKETPLACE_ABI } from "@/lib/contract";
import { getUserSubscriptions } from "@/lib/supabase";

interface Subscription {
  id: string;
  agent_id: string;
  subscriber_address: string;
  expires_at: string;
  created_at: string;
}

export function useSubscription(agentId: bigint) {
  const { address } = useAccount();

  const { data: hasAccess, isLoading, refetch } = useReadContract({
    address: AGENT_MARKETPLACE_ADDRESS,
    abi: AGENT_MARKETPLACE_ABI,
    functionName: "checkAccess",
    args: address ? [agentId, address] : undefined,
    query: {
      enabled: !!address,
    },
  });

  return {
    hasAccess: hasAccess as boolean | undefined,
    isLoading,
    refetch,
  };
}

export function useUserSubscriptions() {
  const { address } = useAccount();
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    async function fetchSubscriptions() {
      if (!address) {
        setSubscriptions([]);
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        const data = await getUserSubscriptions(address);
        setSubscriptions(data);
      } catch (err) {
        setError(err instanceof Error ? err : new Error("Failed to fetch subscriptions"));
      } finally {
        setIsLoading(false);
      }
    }

    fetchSubscriptions();
  }, [address]);

  return { subscriptions, isLoading, error };
}
