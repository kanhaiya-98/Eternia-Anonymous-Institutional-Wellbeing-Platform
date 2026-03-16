import { Navbar } from "@/components/navbar";

export default function InternDashboard() {
  return (
    <div className="min-h-screen bg-background overflow-hidden relative noise-bg">
      <Navbar />
      <div className="orb orb-1 w-[500px] h-[500px] -top-32 -left-32 opacity-30" />
      <div className="container mx-auto px-4 py-20 relative z-10 text-center">
        <h1 className="text-4xl md:text-5xl font-black gradient-text">Peer Listener Dashboard</h1>
        <p className="text-muted-foreground mt-4 max-w-lg mx-auto">
          Welcome, Intern. Here you can accept anonymous chat requests and provide empathetic peer support.
        </p>
      </div>
    </div>
  );
}
