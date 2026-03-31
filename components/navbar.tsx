"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Home, User, LogOut, Menu, X, Coins, Sparkles } from "lucide-react";
import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";

const navLinks = [
  { href: "/dashboard", label: "Home" },
  { href: "/dashboard#about-us", label: "About Us" },
  { href: "/dashboard#features", label: "Features" },
];

export function Navbar() {
  const pathname = usePathname();
  const router = useRouter();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [username, setUsername] = useState<string>("User");
  const [initials, setInitials] = useState<string>("U");
  const [eccBalance, setEccBalance] = useState<number | null>(null);
  const [scrolled, setScrolled] = useState(false);

  // ── Scroll detection ──────────────────────────────────────────────────────
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // ── Fetch user data (username + ECC balance) on mount ─────────────────────
  const fetchUserData = useCallback(async () => {
    const supabase = createClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) return;

    // 1. Fetch username from public.users
    const { data: userRow } = await supabase
      .from("users")
      .select("username")
      .eq("id", user.id)
      .single();

    if (userRow?.username) {
      const uname = userRow.username as string;
      setUsername(uname);
      setInitials(uname.slice(0, 2).toUpperCase());
    }

    // 2. Fetch ECC balance from the credit_balance materialized view
    const { data: balanceRow } = await supabase
      .from("credit_balance")
      .select("balance")
      .eq("user_id", user.id)
      .maybeSingle();

    setEccBalance((balanceRow?.balance as number) ?? 0);
  }, []);

  useEffect(() => {
    setMounted(true);
    fetchUserData();
  }, [fetchUserData]);

  // ── Logout ─────────────────────────────────────────────────────────────────
  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/");
  };

  return (
    <nav
      className={`sticky top-0 z-50 w-full transition-all duration-300 ${
        scrolled
          ? "navbar-glass shadow-sm"
          : "bg-background/70 backdrop-blur-md border-b border-transparent"
      }`}
    >
      <div className="container mx-auto px-4 md:px-6">
        <div className="flex h-16 items-center justify-between">
          {/* ── Logo ── */}
          <Link href="/dashboard" className="flex items-center gap-2.5 group">
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center transition-transform duration-200 group-hover:scale-105"
              style={{ background: "var(--gradient-hero)" }}
            >
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <span className="text-xl font-black gradient-text tracking-tight">
              Eternia
            </span>
          </Link>

          {/* ── Desktop nav links ── */}
          <div className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`relative text-sm font-medium px-4 py-2 rounded-xl transition-all duration-200 ${
                  pathname === link.href
                    ? "text-primary bg-primary/10"
                    : "text-muted-foreground hover:text-foreground hover:bg-secondary/60"
                }`}
              >
                {link.label}
                {pathname === link.href && (
                  <span className="absolute bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-primary" />
                )}
              </Link>
            ))}
          </div>

          {/* ── Right-side controls (desktop) ── */}
          <div className="hidden md:flex items-center gap-3">
            {/* ECC balance chip */}
            {mounted && eccBalance !== null && (
              <Link href="/profile">
                <Badge
                  variant="outline"
                  className="h-9 gap-1.5 px-3.5 cursor-pointer border-primary/25 bg-primary/8 text-primary hover:bg-primary/15 hover:border-primary/40 transition-all duration-200 rounded-xl font-semibold"
                >
                  <Coins className="w-3.5 h-3.5" />
                  <span className="text-xs">{eccBalance} ECC</span>
                </Badge>
              </Link>
            )}

            {/* Profile dropdown */}
            {mounted && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    className="relative h-10 w-10 rounded-full p-0 hover:bg-primary/10 transition-colors"
                  >
                    <Avatar className="h-9 w-9 border-2 border-primary/25 hover:border-primary/50 transition-colors">
                      <AvatarFallback
                        className="font-bold text-xs"
                        style={{ background: "var(--gradient-hero)", color: "white" }}
                      >
                        {initials}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>

                <DropdownMenuContent
                  className="w-64 glass border-border/60 rounded-2xl shadow-2xl p-2"
                  align="end"
                  forceMount
                >
                  {/* User info header */}
                  <div className="flex items-center gap-3 p-3 rounded-xl"
                    style={{ background: "var(--gradient-card)" }}>
                    <Avatar className="h-10 w-10 shrink-0">
                      <AvatarFallback
                        className="font-bold text-sm"
                        style={{ background: "var(--gradient-hero)", color: "white" }}
                      >
                        {initials}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col min-w-0">
                      <p className="text-sm font-semibold text-foreground truncate">
                        {username}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Anonymous User
                      </p>
                    </div>
                  </div>

                  {/* ECC balance row inside dropdown */}
                  {eccBalance !== null && (
                    <div className="mx-1 mt-2 mb-1 flex items-center justify-between rounded-xl border border-primary/15 px-3.5 py-2.5"
                      style={{ background: "linear-gradient(135deg, rgba(120,60,220,0.06), rgba(40,200,220,0.04))" }}>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Coins className="w-3.5 h-3.5 text-primary" />
                        <span>Care Credits</span>
                      </div>
                      <span className="text-sm font-bold text-primary">
                        {eccBalance}
                      </span>
                    </div>
                  )}

                  <DropdownMenuSeparator className="my-1 bg-border/60" />

                  <DropdownMenuItem asChild>
                    <Link
                      href="/profile"
                      className="flex items-center gap-2.5 cursor-pointer rounded-xl px-3 py-2.5 text-sm"
                    >
                      <User className="h-4 w-4 text-primary" />
                      <span>Profile</span>
                    </Link>
                  </DropdownMenuItem>

                  <DropdownMenuItem asChild>
                    <Link
                      href="/dashboard"
                      className="flex items-center gap-2.5 cursor-pointer rounded-xl px-3 py-2.5 text-sm"
                    >
                      <Home className="h-4 w-4 text-primary" />
                      <span>Dashboard</span>
                    </Link>
                  </DropdownMenuItem>

                  <DropdownMenuSeparator className="my-1 bg-border/60" />

                  <DropdownMenuItem
                    onClick={handleLogout}
                    className="flex items-center gap-2.5 cursor-pointer rounded-xl px-3 py-2.5 text-sm text-destructive focus:text-destructive focus:bg-destructive/10"
                  >
                    <LogOut className="h-4 w-4" />
                    <span>Log out</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>

          {/* ── Mobile hamburger ── */}
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden h-10 w-10 rounded-xl hover:bg-primary/10"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
          >
            {mobileMenuOpen ? (
              <X className="h-5 w-5" />
            ) : (
              <Menu className="h-5 w-5" />
            )}
          </Button>
        </div>

        {/* ── Mobile navigation drawer ── */}
        {mobileMenuOpen && (
          <div className="md:hidden py-4 border-t border-border/40 animate-in slide-in-from-top-2 duration-200">
            <div className="flex flex-col gap-1">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`text-sm font-medium px-4 py-3 rounded-xl transition-all duration-200 ${
                    pathname === link.href
                      ? "bg-primary/10 text-primary font-semibold"
                      : "text-muted-foreground hover:bg-secondary/60 hover:text-foreground"
                  }`}
                >
                  {link.label}
                </Link>
              ))}

              <Link
                href="/profile"
                onClick={() => setMobileMenuOpen(false)}
                className="text-sm font-medium px-4 py-3 rounded-xl text-muted-foreground hover:bg-secondary/60 hover:text-foreground flex items-center gap-2.5 transition-all duration-200"
              >
                <User className="h-4 w-4 text-primary" />
                Profile
              </Link>

              {/* ECC balance row (mobile) */}
              {eccBalance !== null && (
                <Link
                  href="/profile"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center justify-between px-4 py-3 rounded-xl border border-primary/15 transition-colors"
                  style={{ background: "linear-gradient(135deg, rgba(120,60,220,0.06), rgba(40,200,220,0.04))" }}
                >
                  <div className="flex items-center gap-2.5 text-sm text-muted-foreground">
                    <Coins className="h-4 w-4 text-primary" />
                    <span>Care Credits</span>
                  </div>
                  <span className="text-sm font-bold text-primary">
                    {eccBalance} ECC
                  </span>
                </Link>
              )}

              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  handleLogout();
                }}
                className="text-left text-sm font-medium px-4 py-3 rounded-xl text-destructive hover:bg-destructive/10 flex items-center gap-2.5 w-full transition-all duration-200"
              >
                <LogOut className="h-4 w-4" />
                Log out
              </button>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
