import { formatEther, parseEther } from "viem";

export function formatPrice(priceInWei: bigint): string {
  return `${formatEther(priceInWei)} ETH`;
}

export function parsePrice(priceInEth: string): bigint {
  return parseEther(priceInEth);
}

export function shortenAddress(address: string): string {
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

export function formatDate(timestamp: number | string): string {
  const date = typeof timestamp === "string" ? new Date(timestamp) : new Date(timestamp * 1000);
  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(date);
}

export function isSubscriptionActive(expiresAt: number): boolean {
  return expiresAt > Math.floor(Date.now() / 1000);
}

export function getExpirationDate(daysFromNow: number = 30): string {
  const date = new Date();
  date.setDate(date.getDate() + daysFromNow);
  return date.toISOString();
}

export function cn(...classes: (string | boolean | undefined)[]): string {
  return classes.filter(Boolean).join(" ");
}
