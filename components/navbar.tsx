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
import { Home, User, LogOut, Menu, X, Coins } from "lucide-react";
import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";

const navLinks = [
  { href: "/dashboard", label: "Home" },
  { href: "/about", label: "About Us" },
  { href: "/features", label: "Features" },
];

export function Navbar() {
  const pathname = usePathname();
  const router = useRouter();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [username, setUsername] = useState<string>("User");
  const [initials, setInitials] = useState<string>("U");
  const [eccBalance, setEccBalance] = useState<number | null>(null);

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
    <nav className="sticky top-0 z-50 w-full border-b border-border/50 bg-background/80 backdrop-blur-lg">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          {/* ── Logo ── */}
          <Link href="/dashboard" className="flex items-center gap-2">
            <span className="text-2xl font-bold text-primary">Eternia</span>
          </Link>

          {/* ── Desktop nav links ── */}
          <div className="hidden md:flex items-center gap-6">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`text-sm font-medium transition-colors hover:text-primary ${
                  pathname === link.href
                    ? "text-primary"
                    : "text-muted-foreground"
                }`}
              >
                {link.label}
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
                  className="h-8 gap-1.5 px-3 cursor-pointer border-primary/30 bg-primary/5 text-primary hover:bg-primary/10 transition-colors"
                >
                  <Coins className="w-3.5 h-3.5" />
                  <span className="text-xs font-semibold">
                    {eccBalance} ECC
                  </span>
                </Badge>
              </Link>
            )}

            {/* Profile dropdown */}
            {mounted && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    className="relative h-10 w-10 rounded-full"
                  >
                    <Avatar className="h-10 w-10 border-2 border-primary/20">
                      <AvatarFallback className="bg-primary/10 text-primary font-medium">
                        {initials}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>

                <DropdownMenuContent className="w-60" align="end" forceMount>
                  {/* User info header */}
                  <div className="flex items-center gap-3 p-3">
                    <Avatar className="h-9 w-9 shrink-0">
                      <AvatarFallback className="bg-primary/10 text-primary text-sm font-semibold">
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
                    <div className="mx-2 mb-2 flex items-center justify-between rounded-md bg-primary/5 border border-primary/10 px-3 py-2">
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <Coins className="w-3.5 h-3.5 text-primary" />
                        <span>Care Credits</span>
                      </div>
                      <span className="text-sm font-bold text-primary">
                        {eccBalance}
                      </span>
                    </div>
                  )}

                  <DropdownMenuSeparator />

                  <DropdownMenuItem asChild>
                    <Link
                      href="/profile"
                      className="flex items-center cursor-pointer"
                    >
                      <User className="mr-2 h-4 w-4" />
                      <span>Profile</span>
                    </Link>
                  </DropdownMenuItem>

                  <DropdownMenuItem asChild>
                    <Link
                      href="/dashboard"
                      className="flex items-center cursor-pointer"
                    >
                      <Home className="mr-2 h-4 w-4" />
                      <span>Dashboard</span>
                    </Link>
                  </DropdownMenuItem>

                  <DropdownMenuSeparator />

                  <DropdownMenuItem
                    onClick={handleLogout}
                    className="flex items-center cursor-pointer text-destructive focus:text-destructive focus:bg-destructive/10"
                  >
                    <LogOut className="mr-2 h-4 w-4" />
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
            className="md:hidden"
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
          <div className="md:hidden py-4 border-t border-border/50">
            <div className="flex flex-col space-y-1">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`text-sm font-medium px-3 py-2.5 rounded-lg transition-colors ${
                    pathname === link.href
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                  }`}
                >
                  {link.label}
                </Link>
              ))}

              <Link
                href="/profile"
                onClick={() => setMobileMenuOpen(false)}
                className="text-sm font-medium px-3 py-2.5 rounded-lg text-muted-foreground hover:bg-secondary hover:text-foreground flex items-center gap-2"
              >
                <User className="h-4 w-4" />
                Profile
              </Link>

              {/* ECC balance row (mobile) */}
              {eccBalance !== null && (
                <Link
                  href="/profile"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center justify-between px-3 py-2.5 rounded-lg bg-primary/5 border border-primary/10 mx-0"
                >
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
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
                className="text-left text-sm font-medium px-3 py-2.5 rounded-lg text-destructive hover:bg-destructive/10 flex items-center gap-2 w-full"
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
