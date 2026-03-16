import { Navbar } from "@/components/navbar";

export default function SpocDashboard() {
  return (
    <div className="min-h-screen bg-background overflow-hidden relative noise-bg">
      <Navbar />
      <div className="orb orb-3 w-[600px] h-[600px] -bottom-32 left-1/4 opacity-15" />
      <div className="container mx-auto px-4 py-20 relative z-10 text-center">
        <h1 className="text-4xl md:text-5xl font-black gradient-text">SPOC Dashboard</h1>
        <p className="text-muted-foreground mt-4 max-w-lg mx-auto">
          Welcome, SPOC. Here you can manage your institution&apos;s wellness analytics, issue care credits, and review anonymized escalation requests.
        </p>
      </div>
    </div>
  );
}
