"use client";

import dynamic from "next/dynamic";
import { Navbar } from "@/components/navbar";
import { Loader2 } from "lucide-react";

// Use next/dynamic with ssr: false to prevent Agora SDK from accessing 'window' during server build
const BlackboxClient = dynamic(() => import("./blackbox-client"), {
  ssr: false,
  loading: () => (
    <div className="min-h-screen bg-background overflow-hidden relative noise-bg flex flex-col items-center justify-center">
      <Navbar />
      <div className="orb orb-1 w-[500px] h-[500px] -top-32 -right-32 opacity-30" />
      <div className="flex flex-col items-center justify-center gap-4 z-10 pt-20">
        <Loader2 className="w-10 h-10 text-teal-400 animate-spin" />
        <p className="text-teal-400/80 font-mono text-sm animate-pulse">Initializing anonymous voice protocol...</p>
      </div>
    </div>
  ),
});

export default function BlackboxPage() {
  return <BlackboxClient />;
}
