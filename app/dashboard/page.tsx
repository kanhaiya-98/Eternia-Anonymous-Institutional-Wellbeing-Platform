import { Navbar } from "@/components/navbar";
import { PortalCard } from "@/components/portal-card";
import { Button } from "@/components/ui/button";
import {
  UserCircle,
  MessageCircle,
  Bot,
  Music,
  ArrowRight,
  Heart,
  Shield,
  Sparkles,
  Star,
  Zap,
} from "lucide-react";
import Link from "next/link";

export default function DashboardPage() {
  const portals = [
    {
      title: "Expert Connect",
      description:
        "Book appointments with certified therapists and mental health professionals",
      icon: <UserCircle className="w-8 h-8 text-violet-600" />,
      href: "/expert",
      gradient: "from-violet-50 to-purple-50/50 dark:from-violet-950/40 dark:to-purple-950/20",
      accentColor: "rgba(139, 92, 246, 0.5)",
    },
    {
      title: "Peer Connect",
      description:
        "Connect anonymously with peers who understand what you're going through",
      icon: <MessageCircle className="w-8 h-8 text-cyan-500" />,
      href: "/peer-connect",
      gradient: "from-cyan-50 to-sky-50/50 dark:from-cyan-950/40 dark:to-sky-950/20",
      accentColor: "rgba(6, 182, 212, 0.5)",
    },
    {
      title: "Blackbox",
      description:
        "Your gateway to anonymous therapy. No name, no face. Just support.",
      icon: <Bot className="w-8 h-8 text-indigo-500" />,
      href: "/blackbox",
      gradient: "from-indigo-50 to-blue-50/50 dark:from-indigo-950/40 dark:to-blue-950/20",
      accentColor: "rgba(99, 102, 241, 0.5)",
    },
    {
      title: "Self Help Tools",
      description:
        "Guided meditations, calming sounds, and exercises for your wellbeing",
      icon: <Music className="w-8 h-8 text-fuchsia-500" />,
      href: "/sound-therapy",
      gradient: "from-fuchsia-50 to-pink-50/50 dark:from-fuchsia-950/40 dark:to-pink-950/20",
      accentColor: "rgba(217, 70, 239, 0.5)",
    },
  ];

  const stats = [
    { label: "Students Supported", value: "12,400+", icon: <Heart className="w-5 h-5" /> },
    { label: "Expert Therapists", value: "340+", icon: <Star className="w-5 h-5" /> },
    { label: "Sessions Completed", value: "98,000+", icon: <Zap className="w-5 h-5" /> },
  ];

  return (
    <div className="min-h-screen bg-background overflow-hidden">
      <Navbar />

      {/* ── Hero Section ─────────────────────────────────────────── */}
      <section className="relative overflow-hidden noise-bg">
        {/* Background orbs */}
        <div className="orb orb-1 w-[700px] h-[700px] -top-48 -left-48 opacity-40" />
        <div className="orb orb-2 w-[600px] h-[600px] -bottom-40 -right-32 opacity-35" />
        <div className="orb orb-3 w-[400px] h-[400px] top-20 right-1/3 opacity-20" />

        <div className="container mx-auto px-4 md:px-6 py-20 md:py-32 relative z-10">
          <div className="max-w-3xl mx-auto text-center space-y-8">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-primary/25 bg-primary/8 text-primary text-sm font-semibold fade-in-up">
              <Sparkles className="w-4 h-4" />
              Mental Wellness Platform
            </div>

            {/* Heading */}
            <h1 className="text-5xl md:text-6xl lg:text-7xl font-black text-foreground leading-[1.05] tracking-tight fade-in-up fade-in-up-delay-1">
              A Safe Space Beyond{" "}
              <span className="gradient-text">Society&apos;s Judgement</span>
            </h1>

            <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed fade-in-up fade-in-up-delay-2">
              Your journey to mental wellness starts here. Connect with experts,
              peers, or explore at your own pace. Complete anonymity guaranteed.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center pt-2 fade-in-up fade-in-up-delay-3">
              <Link href="/expert">
                <button className="btn-premium inline-flex items-center gap-2 px-8 py-3.5 rounded-2xl font-semibold text-base text-white">
                  Start Your Journey
                  <ArrowRight className="w-4 h-4" />
                </button>
              </Link>
              <Link href="/sound-therapy">
                <Button
                  size="lg"
                  variant="outline"
                  className="border-border/60 hover:border-primary/40 hover:bg-primary/5 rounded-2xl px-8 font-medium transition-all duration-200"
                >
                  Explore Self Help Tools
                </Button>
              </Link>
            </div>

            {/* Stats strip */}
            <div className="flex flex-wrap justify-center gap-8 pt-8 fade-in-up fade-in-up-delay-4">
              {stats.map((stat) => (
                <div key={stat.label} className="flex flex-col items-center gap-1">
                  <div className="flex items-center gap-1.5 text-primary">
                    {stat.icon}
                    <span className="text-2xl font-black">{stat.value}</span>
                  </div>
                  <span className="text-xs text-muted-foreground font-medium">{stat.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── Portal Cards Section ─────────────────────────────────── */}
      <section className="container mx-auto px-4 md:px-6 py-16 md:py-24">
        <div className="text-center mb-14">
          <h2 className="text-3xl md:text-4xl font-black text-foreground mb-4 tracking-tight">
            How Can We Help You Today?
          </h2>
          <p className="text-muted-foreground max-w-xl mx-auto text-base leading-relaxed">
            Choose the support that feels right for you. Every path leads to healing.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {portals.map((portal) => (
            <PortalCard key={portal.title} {...portal} />
          ))}
        </div>
      </section>

      {/* ── Blackbox Portal Highlight ────────────────────────────── */}
      <section className="container mx-auto px-4 md:px-6 py-12 md:py-16">
        <div
          className="relative overflow-hidden rounded-3xl border border-primary/20 p-10 md:p-14 noise-bg"
          style={{
            background:
              "linear-gradient(135deg, rgba(120,60,220,0.07) 0%, rgba(40,200,220,0.05) 50%, rgba(180,80,255,0.04) 100%)",
          }}
        >
          {/* Background orbs inside card */}
          <div className="orb orb-1 w-96 h-96 -top-24 -right-24 opacity-30" />
          <div className="orb orb-2 w-64 h-64 bottom-0 left-1/4 opacity-20" />

          <div className="relative z-10 max-w-2xl">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-primary/30 bg-primary/10 text-primary text-sm font-semibold mb-6">
              <Shield className="w-4 h-4" />
              100% Anonymous
            </div>
            <h2 className="text-3xl md:text-5xl font-black text-foreground mb-4 leading-tight">
              The Blackbox{" "}
              <span className="gradient-text">Portal</span>
            </h2>
            <p className="text-lg text-muted-foreground mb-8 leading-relaxed max-w-xl">
              Your gateway to anonymous therapy. No name, no face. Just pure,
              judgement-free support when you need it most. Connect with another
              anonymous soul and find peace.
            </p>
            <Link href="/blackbox">
              <button className="btn-premium inline-flex items-center gap-2 px-8 py-3.5 rounded-2xl font-semibold text-base text-white">
                Enter Blackbox
                <ArrowRight className="w-4 h-4" />
              </button>
            </Link>
          </div>
        </div>
      </section>

      {/* ── Ready to Begin Section ───────────────────────────────── */}
      <section className="container mx-auto px-4 md:px-6 py-16 md:py-20">
        <div className="text-center space-y-6">
          <h2 className="text-3xl md:text-4xl font-black text-foreground tracking-tight">
            Ready to Begin Your Journey?
          </h2>
          <p className="text-muted-foreground max-w-lg mx-auto text-base leading-relaxed">
            Take the first step towards a healthier mind. We&apos;re here to
            support you every step of the way.
          </p>
          <div className="flex flex-wrap justify-center gap-6 pt-4">
            {[
              { icon: <Heart className="w-4 h-4" />, text: "24/7 Support" },
              { icon: <Shield className="w-4 h-4" />, text: "Complete Privacy" },
              { icon: <Sparkles className="w-4 h-4" />, text: "Certified Experts" },
            ].map((item) => (
              <div
                key={item.text}
                className="flex items-center gap-2 px-5 py-2.5 rounded-2xl border border-primary/20 bg-primary/5 text-sm font-semibold text-foreground"
              >
                <span className="text-primary">{item.icon}</span>
                {item.text}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Partners Section ─────────────────────────────────────── */}
      <section className="container mx-auto px-4 md:px-6 py-10 md:py-14 border-t border-border/40">
        <div className="text-center mb-8">
          <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
            Trusted Partners
          </h3>
        </div>
        <div className="flex flex-wrap justify-center items-center gap-10 md:gap-20">
          {["University of Delhi", "NIMHANS", "iCall", "Vandrevala Foundation"].map((partner) => (
            <span
              key={partner}
              className="text-base font-bold text-muted-foreground/50 hover:text-muted-foreground transition-colors duration-200 tracking-tight"
            >
              {partner}
            </span>
          ))}
        </div>
      </section>

      {/* ── Footer ───────────────────────────────────────────────── */}
      <footer className="border-t border-border/40 bg-card/30">
        <div className="container mx-auto px-4 md:px-6 py-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-5">
            <div className="flex items-center gap-2.5">
              <div
                className="w-7 h-7 rounded-lg flex items-center justify-center"
                style={{ background: "var(--gradient-hero)" }}
              >
                <Sparkles className="w-3.5 h-3.5 text-white" />
              </div>
              <span className="text-lg font-black gradient-text">Eternia</span>
            </div>
            <div className="flex items-center gap-7 text-sm text-muted-foreground">
              {[
                { href: "/about", label: "About" },
                { href: "/privacy", label: "Privacy" },
                { href: "/contact", label: "Contact" },
              ].map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="hover:text-foreground transition-colors font-medium"
                >
                  {link.label}
                </Link>
              ))}
            </div>
            <p className="text-sm text-muted-foreground font-medium">
              Your privacy is our priority
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
