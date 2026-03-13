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
} from "lucide-react";
import Link from "next/link";

export default function DashboardPage() {
  const portals = [
    {
      title: "Expert Connect",
      description:
        "Book appointments with certified therapists and mental health professionals",
      icon: <UserCircle className="w-8 h-8 text-primary" />,
      href: "/expert",
      gradient: "from-primary/10 to-primary/5",
    },
    {
      title: "Peer Connect",
      description:
        "Connect anonymously with peers who understand what you're going through",
      icon: <MessageCircle className="w-8 h-8 text-primary" />,
      href: "/peer-connect",
      gradient: "from-secondary to-secondary/50",
    },
    {
      title: "Blackbox",
      description:
        "Your gateway to anonymous therapy. No name, no face. Just support.",
      icon: <Bot className="w-8 h-8 text-primary" />,
      href: "/blackbox",
      gradient: "from-accent/20 to-accent/5",
    },
    {
      title: "Self Help Tools",
      description:
        "Guided meditations, calming sounds, and exercises for your wellbeing",
      icon: <Music className="w-8 h-8 text-primary" />,
      href: "/sound-therapy",
      gradient: "from-muted to-secondary/30",
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-background to-accent/5" />
        <div className="container mx-auto px-4 py-16 md:py-24 relative">
          <div className="max-w-3xl mx-auto text-center space-y-6">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-foreground leading-tight text-balance">
              A Safe Space Beyond{" "}
              <span className="text-primary">Society&apos;s Judgement</span>
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed text-pretty">
              Your journey to mental wellness starts here. Connect with experts,
              peers, or explore at your own pace. Complete anonymity guaranteed.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
              <Button
                asChild
                size="lg"
                className="bg-primary hover:bg-primary/90 text-primary-foreground"
              >
                <Link href="/expert">
                  Start Your Journey
                  <ArrowRight className="ml-2 w-4 h-4" />
                </Link>
              </Button>
              <Button
                asChild
                size="lg"
                variant="outline"
                className="border-border hover:bg-secondary/50"
              >
                <Link href="/sound-therapy">Explore Self Help Tools</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Cards Section */}
      <section className="container mx-auto px-4 py-12 md:py-16">
        <div className="text-center mb-12">
          <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-4">
            How Can We Help You Today?
          </h2>
          <p className="text-muted-foreground max-w-xl mx-auto">
            Choose the support that feels right for you. Every path leads to
            healing.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {portals.map((portal) => (
            <PortalCard key={portal.title} {...portal} />
          ))}
        </div>
      </section>

      {/* Blackbox Portal Highlight */}
      <section className="container mx-auto px-4 py-12 md:py-16">
        <div className="bg-gradient-to-br from-card via-card to-secondary/20 rounded-3xl border border-border/50 p-8 md:p-12">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full text-sm font-medium mb-6">
              <Shield className="w-4 h-4" />
              100% Anonymous
            </div>
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              The Blackbox Portal
            </h2>
            <p className="text-lg text-muted-foreground mb-6 leading-relaxed">
              Your gateway to anonymous therapy. No name, no face. Just pure,
              judgement-free support when you need it most. Connect with another
              anonymous soul and find peace.
            </p>
            <Button
              asChild
              size="lg"
              className="bg-primary hover:bg-primary/90 text-primary-foreground"
            >
              <Link href="/blackbox">
                Enter Blackbox
                <ArrowRight className="ml-2 w-4 h-4" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Ready to Begin Section */}
      <section className="container mx-auto px-4 py-12 md:py-16">
        <div className="text-center space-y-6">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground">
            Ready to Begin Your Journey?
          </h2>
          <p className="text-muted-foreground max-w-xl mx-auto">
            Take the first step towards a healthier mind. We&apos;re here to
            support you every step of the way.
          </p>
          <div className="flex flex-wrap justify-center gap-8 pt-6">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Heart className="w-5 h-5 text-primary" />
              <span>24/7 Support</span>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <Shield className="w-5 h-5 text-primary" />
              <span>Complete Privacy</span>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <Sparkles className="w-5 h-5 text-primary" />
              <span>Certified Experts</span>
            </div>
          </div>
        </div>
      </section>

      {/* Partners Section */}
      <section className="container mx-auto px-4 py-12 md:py-16 border-t border-border/50">
        <div className="text-center mb-8">
          <h3 className="text-lg font-medium text-muted-foreground">
            Our Partners
          </h3>
        </div>
        <div className="flex flex-wrap justify-center items-center gap-8 md:gap-16 opacity-60">
          <span className="text-xl font-semibold text-muted-foreground">
            University of Delhi
          </span>
          <span className="text-xl font-semibold text-muted-foreground">
            NIMHANS
          </span>
          <span className="text-xl font-semibold text-muted-foreground">
            iCall
          </span>
          <span className="text-xl font-semibold text-muted-foreground">
            Vandrevala Foundation
          </span>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/50 bg-card/50">
        <div className="container mx-auto px-4 py-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <span className="text-xl font-bold text-primary">Eternia</span>
            </div>
            <div className="flex items-center gap-6 text-sm text-muted-foreground">
              <Link
                href="/about"
                className="hover:text-foreground transition-colors"
              >
                About
              </Link>
              <Link
                href="/privacy"
                className="hover:text-foreground transition-colors"
              >
                Privacy
              </Link>
              <Link
                href="/contact"
                className="hover:text-foreground transition-colors"
              >
                Contact
              </Link>
            </div>
            <p className="text-sm text-muted-foreground">
              Your privacy is our priority
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
