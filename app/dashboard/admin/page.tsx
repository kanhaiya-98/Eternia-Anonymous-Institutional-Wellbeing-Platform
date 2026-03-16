import { Navbar } from "@/components/navbar";

export default function AdminDashboard() {
  return (
    <div className="min-h-screen bg-background overflow-hidden relative noise-bg">
      <Navbar />
      <div className="orb orb-1 w-[400px] h-[400px] top-10 right-10 opacity-40" />
      <div className="container mx-auto px-4 py-20 relative z-10 text-center">
        <h1 className="text-4xl md:text-5xl font-black gradient-text">System Admin</h1>
        <p className="text-muted-foreground mt-4 max-w-lg mx-auto">
          Welcome, Platform Admin. Manage institutions, onboard experts, and monitor compliance logs.
        </p>
      </div>
    </div>
  );
}
