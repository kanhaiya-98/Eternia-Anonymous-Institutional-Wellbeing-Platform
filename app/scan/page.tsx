"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { QrCode, ArrowLeft, AlertTriangle } from "lucide-react";

export default function ScanPage() {
  const router = useRouter();
  const [isScanning, setIsScanning] = useState(false);

  const handleScan = () => {
    setIsScanning(true);
    // Simulate QR scan on web; real scan handled natively on mobile
    setTimeout(() => {
      setIsScanning(false);
      router.push("/activate");
    }, 2500);
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-gradient-to-br from-secondary via-background to-muted">
      {/* Back button */}
      <Button
        variant="ghost"
        className="absolute top-4 left-4 text-muted-foreground hover:text-foreground"
        onClick={() => router.push("/")}
      >
        <ArrowLeft className="w-4 h-4 mr-2" />
        Back
      </Button>

      {/* Logo */}
      <div className="mb-8 text-center">
        <h1 className="text-4xl md:text-5xl font-bold text-primary tracking-tight">
          Eternia
        </h1>
        <p className="text-muted-foreground mt-2 text-sm md:text-base">
          Verify your identity
        </p>
      </div>

      <Card className="w-full max-w-md shadow-xl border-border/50 backdrop-blur-sm bg-card/90">
        <CardHeader className="text-center pb-4">
          <CardTitle className="text-2xl text-foreground">Scan Now</CardTitle>
          <CardDescription className="text-muted-foreground">
            Point your camera at the QR code provided by your institution
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* QR Scanner Window */}
          <div className="aspect-square rounded-xl border-2 border-dashed border-primary/50 flex items-center justify-center bg-muted/30 relative overflow-hidden">
            {isScanning ? (
              <div className="text-center space-y-4">
                {/* Scanning animation */}
                <div className="relative w-32 h-32">
                  <div className="absolute inset-0 border-4 border-primary rounded-lg" />
                  {/* Replaced <style jsx> keyframe with Tailwind animate-bounce */}
                  <div className="absolute top-0 left-0 right-0 h-1 bg-primary animate-bounce" />
                </div>
                <p className="text-primary font-medium">Scanning...</p>
              </div>
            ) : (
              <div className="text-center space-y-4 p-8">
                <QrCode className="w-24 h-24 text-muted-foreground mx-auto" />
                <p className="text-muted-foreground text-sm">
                  QR Scanning Window
                </p>
              </div>
            )}
          </div>

          <Button
            onClick={handleScan}
            disabled={isScanning}
            className="w-full h-12 text-lg font-medium bg-primary hover:bg-primary/90 text-primary-foreground transition-all duration-300"
          >
            {isScanning ? (
              <span className="flex items-center gap-2">
                <span className="w-5 h-5 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                Scanning...
              </span>
            ) : (
              "Scan Now"
            )}
          </Button>

          {/* Disclaimer */}
          <div className="bg-muted/50 rounded-lg p-4 border border-border">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p className="text-sm font-medium text-foreground">
                  Disclaimer
                </p>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  By scanning this QR code, you confirm that you are a
                  registered student of the partnering institution. Your
                  identity will remain anonymous within the Eternia platform.
                  The QR code is used solely for verification purposes and does
                  not store any personal information.
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
