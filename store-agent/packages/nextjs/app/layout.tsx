import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";
import Link from "next/link";
import { ConnectButton } from "@rainbow-me/rainbowkit";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Store Agent - AI Agent Marketplace",
  description: "Discover and subscribe to specialized AI agents powered by Web3",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <Providers>
          <div className="min-h-screen">
            {/* Navigation */}
            <nav className="border-b border-gray-200 bg-white/80 backdrop-blur-sm sticky top-0 z-50">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between h-16 items-center">
                  <div className="flex items-center space-x-8">
                    <Link href="/" className="text-xl font-bold text-indigo-600">
                      Store Agent
                    </Link>
                    <div className="hidden md:flex space-x-6">
                      <Link
                        href="/"
                        className="text-gray-600 hover:text-gray-900 transition-colors"
                      >
                        Browse
                      </Link>
                      <Link
                        href="/dashboard"
                        className="text-gray-600 hover:text-gray-900 transition-colors"
                      >
                        Dashboard
                      </Link>
                      <Link
                        href="/sell"
                        className="text-gray-600 hover:text-gray-900 transition-colors"
                      >
                        Sell
                      </Link>
                    </div>
                  </div>
                  <ConnectButton />
                </div>
              </div>
            </nav>

            {/* Main content */}
            <main>{children}</main>

            {/* Footer */}
            <footer className="border-t border-gray-200 bg-white mt-auto">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="flex flex-col md:flex-row justify-between items-center">
                  <p className="text-gray-500 text-sm">
                    &copy; 2026 Store Agent. All rights reserved.
                  </p>
                  <div className="flex space-x-6 mt-4 md:mt-0">
                    <a href="#" className="text-gray-400 hover:text-gray-600">
                      Terms
                    </a>
                    <a href="#" className="text-gray-400 hover:text-gray-600">
                      Privacy
                    </a>
                    <a href="#" className="text-gray-400 hover:text-gray-600">
                      Docs
                    </a>
                  </div>
                </div>
              </div>
            </footer>
          </div>
        </Providers>
      </body>
    </html>
  );
}
