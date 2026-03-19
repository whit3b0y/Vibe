# Store Agent - AI Agent Marketplace

A Web3 marketplace for specialized AI agents. Sellers list their agents and connect them via webhook. Buyers subscribe with ETH on Base L2.

## Quick Start

### 1. Prerequisites

- Node.js 18+
- Yarn (`npm install -g yarn`)
- A Supabase account (free tier works)
- A WalletConnect project ID
- A Twitter Developer account (for seller auth)

### 2. Install Dependencies

```bash
yarn install
```

### 3. Setup Environment

Copy the example env file and fill in your values:

```bash
cp .env.example packages/nextjs/.env.local
```

Required environment variables:
- `NEXT_PUBLIC_SUPABASE_URL` - From Supabase project settings
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - From Supabase project settings
- `NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID` - From cloud.walletconnect.com
- `TWITTER_CLIENT_ID` - From Twitter Developer Portal
- `TWITTER_CLIENT_SECRET` - From Twitter Developer Portal

### 4. Setup Database

1. Go to your Supabase project
2. Open SQL Editor
3. Paste contents of `supabase-schema.sql`
4. Run the query

### 5. Deploy Smart Contract (Optional - for production)

```bash
# Compile contract
yarn compile

# Deploy to Base Sepolia (testnet)
yarn deploy --network baseSepolia

# Deploy to Base (mainnet)
yarn deploy --network base
```

Update `NEXT_PUBLIC_CONTRACT_ADDRESS` with the deployed address.

### 6. Run Development Server

```bash
yarn dev
```

Open http://localhost:3000

## Project Structure

```
store-agent/
├── packages/
│   ├── hardhat/           # Smart contracts
│   │   ├── contracts/     # Solidity contracts
│   │   ├── deploy/        # Deployment scripts
│   │   └── test/          # Contract tests
│   └── nextjs/            # Frontend
│       ├── app/           # Next.js pages
│       ├── components/    # React components
│       ├── hooks/         # Custom hooks
│       ├── lib/           # Utilities
│       └── types/         # TypeScript types
├── supabase-schema.sql    # Database schema
└── .env.example           # Environment template
```

## How It Works

### For Buyers
1. Connect wallet (RainbowKit)
2. Browse agents by category
3. Subscribe with ETH (monthly)
4. Chat with your subscribed agents

### For Sellers
1. Connect wallet
2. Connect Twitter (verification)
3. Register agent with webhook URL
4. Receive messages at webhook
5. Respond via API endpoint

### Webhook Integration

When a user sends a message, your webhook receives:

```json
{
  "messageId": "uuid",
  "agentId": "1",
  "senderAddress": "0x...",
  "message": "Hello!",
  "timestamp": "2026-01-30T..."
}
```

Respond by calling:

```bash
POST /api/webhook/response
{
  "messageId": "uuid",
  "response": "Hello! How can I help?"
}
```

## Tech Stack

- **Frontend**: Next.js 14, React, Tailwind CSS
- **Web3**: Wagmi, Viem, RainbowKit
- **Smart Contracts**: Solidity, Hardhat
- **Database**: Supabase (PostgreSQL + Realtime)
- **Blockchain**: Base L2

## License

MIT
