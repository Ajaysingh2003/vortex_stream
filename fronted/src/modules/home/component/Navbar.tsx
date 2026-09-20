"use client";

import React, { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";

import {
  ArrowRight,
  BarChart3,
  BookOpen,
  Braces,
  ChevronRight,
  Cloud,
  Code2,
  Cpu,
  Globe2,
  Menu,
  PlayCircle,
  Radio,
  ShieldCheck,
  Sparkles,
  Terminal,
  Video,
  Workflow,
  Zap,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
} from "@/components/ui/navigation-menu";

import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

/* -------------------------------------------------------------------------- */
/* Navigation Data                                                            */
/* -------------------------------------------------------------------------- */

const platformItems = [
  {
    title: "Video Streaming",
    description: "Low-latency adaptive playback across web, mobile, and smart TVs.",
    href: "/platform/streaming",
    icon: PlayCircle,
  },
  {
    title: "Transcoding Pipeline",
    description: "Cloud-native multi-rendition HLS & AV1 encoding with zero wait.",
    href: "/platform/transcoding",
    icon: Cpu,
  },
  {
    title: "Global Edge Delivery",
    description: "Sub-40ms time-to-first-frame across 310+ Anycast edge PoPs.",
    href: "/platform/delivery",
    icon: Globe2,
  },
  {
    title: "Viewer Telemetry",
    description: "Per-frame retention heatmaps, rebuffering stats, and geo metrics.",
    href: "/platform/analytics",
    icon: BarChart3,
  },
  {
    title: "Security & DRM",
    description: "Signed token gating, AES-128 keys, and dynamic forensic watermarks.",
    href: "/platform/security",
    icon: ShieldCheck,
  },
  {
    title: "Modern Player",
    description: "Under 18kB gzip runtime with custom theme tokens and speed controls.",
    href: "/platform/player",
    icon: Video,
  },
];

const developerItems = [
  {
    title: "Documentation",
    description: "Architectural quickstarts, API manuals, and integration guides.",
    href: "/docs",
    icon: BookOpen,
  },
  {
    title: "API Reference",
    description: "Interactive endpoints for video ingest, signing, and quotas.",
    href: "/docs/api",
    icon: Braces,
  },
  {
    title: "Client Libraries",
    description: "First-party SDKs for React, Next.js, Node.js, Python, and Go.",
    href: "/docs/sdks",
    icon: Code2,
  },
  {
    title: "Webhooks",
    description: "Idempotent event dispatch for upload and transcode milestones.",
    href: "/docs/webhooks",
    icon: Radio,
  },
];

const solutionItems = [
  {
    title: "SaaS Platforms",
    description: "Native white-labeled video processing and custom player embeds.",
    href: "/solutions/saas",
    icon: Cloud,
  },
  {
    title: "Online Education",
    description: "Anti-piracy session gating, student watermarks, and progress sync.",
    href: "/solutions/education",
    icon: BookOpen,
  },
  {
    title: "Media & Creators",
    description: "High-throughput delivery with zero buffer delays and HDR color.",
    href: "/solutions/media",
    icon: Video,
  },
];

/* -------------------------------------------------------------------------- */
/* Main Navbar Component                                                      */
/* -------------------------------------------------------------------------- */

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <header
      className={cn(
        "fixed inset-x-0 top-0 z-[100] w-full transition-all duration-300 ease-out",
        scrolled
          ? "border-b border-black/[0.06] bg-[#faf9f5]/80 shadow-[0_8px_30px_-15px_rgba(20,22,16,0.08)] backdrop-blur-xl"
          : "border-b border-transparent bg-transparent"
      )}
    >
      <nav className="mx-auto flex h-[70px] w-full max-w-[1240px] items-center justify-between px-5 sm:px-8">
        {/* ================================================================= */}
        {/* Brand & Left Navigation Links                                     */}
        {/* ================================================================= */}
        <div className="flex items-center gap-8">
          <Link href="/" className="group flex items-center gap-2.5 select-none">
            <div className="flex size-8.5 items-center justify-center overflow-hidden rounded-xl border border-black/[0.08] bg-white shadow-2xs transition-all duration-200 group-hover:scale-105 group-hover:border-black/20">
              <Image
                src="/intigration/dropbox.png"
                alt="Rowley"
                width={34}
                height={34}
                priority
                className="size-full object-cover"
              />
            </div>
            <span className="font-heading text-[17px] font-bold tracking-tight text-[#171812]">
              Rowley
            </span>
          </Link>

          {/* Desktop Nav Items */}
          <div className="hidden lg:block">
            <NavigationMenu>
              <NavigationMenuList className="gap-1">
                {/* Platform Dropdown */}
                <NavigationMenuItem>
                  <NavTrigger>Platform</NavTrigger>
                  <NavigationMenuContent>
                    <PlatformMenu />
                  </NavigationMenuContent>
                </NavigationMenuItem>

                {/* Solutions Dropdown */}
                <NavigationMenuItem>
                  <NavTrigger>Solutions</NavTrigger>
                  <NavigationMenuContent>
                    <SolutionsMenu />
                  </NavigationMenuContent>
                </NavigationMenuItem>

                {/* Developers Dropdown */}
                <NavigationMenuItem>
                  <NavTrigger>Developers</NavTrigger>
                  <NavigationMenuContent>
                    <DevelopersMenu />
                  </NavigationMenuContent>
                </NavigationMenuItem>

                {/* Pricing Direct Link */}
                <NavigationMenuItem>
                  <NavigationMenuLink asChild>
                    <Link
                      href="/pricing"
                      className="inline-flex h-9 items-center rounded-lg px-3 text-[13px] font-medium text-[#64675e] transition-colors hover:bg-black/[0.035] hover:text-[#171812]"
                    >
                      Pricing
                    </Link>
                  </NavigationMenuLink>
                </NavigationMenuItem>
              </NavigationMenuList>
            </NavigationMenu>
          </div>
        </div>

        {/* ================================================================= */}
        {/* Right CTA Dock                                                    */}
        {/* ================================================================= */}
        <div className="hidden items-center gap-3 lg:flex">
          <Link
            href="/docs"
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-[#64675e] transition-colors hover:text-[#171812]"
          >
            <Terminal className="size-3.5" />
            <span>API Docs</span>
          </Link>

          <Button
            // variant="ghost"
            asChild
            className="h-9 rounded-xl px-3.5 text-xs font-medium secondary-btn"
          >
            <Link href="/sign-in">Sign in</Link>
          </Button>

          <Button
            asChild
            className="group h-9 rounded-xl  px-4 text-xs font-bold text-[#151c04] shadow-2xs transition-all  primary-btn   hover:shadow-xs active:scale-[0.98]"
          >
            <Link href="/login">
              <span>Start Building</span>
              <ArrowRight className="ml-1.5 size-3 transition-transform duration-200 group-hover:translate-x-0.5" />
            </Link>
          </Button>
        </div>

        {/* ================================================================= */}
        {/* Mobile Navigation Trigger & Drawer                                */}
        {/* ================================================================= */}
        <div className="flex items-center gap-2 lg:hidden">
          <Sheet>
            <SheetTrigger asChild>
              <button
                aria-label="Open mobile navigation menu"
                className="flex size-9.5 items-center justify-center rounded-xl border border-black/[0.08] bg-white/80 text-[#363831] shadow-2xs backdrop-blur-md transition-colors hover:bg-white active:scale-95"
              >
                <Menu className="size-5" />
              </button>
            </SheetTrigger>

            <SheetContent
              side="right"
              className="w-full max-w-[390px] border-l border-black/[0.08] bg-[#faf9f5] p-0 shadow-2xl"
            >
              <SheetHeader className="flex flex-row items-center justify-between border-b border-black/[0.06] bg-white/70 px-5 py-4 backdrop-blur-md">
                <SheetTitle className="sr-only">Navigation Drawer</SheetTitle>
                <Link href="/" className="flex items-center gap-2">
                  <div className="flex size-7 items-center justify-center overflow-hidden rounded-lg border border-black/[0.08] bg-white">
                    <Image
                      src="/intigration/dropbox.png"
                      alt="Rowley"
                      width={28}
                      height={28}
                      className="size-full object-cover"
                    />
                  </div>
                  <span className="font-heading text-base font-bold text-[#171812]">
                    Rowley
                  </span>
                </Link>
              </SheetHeader>

              <div className="flex h-[calc(100dvh-65px)] flex-col justify-between">
                <div className="flex-1 overflow-y-auto px-4 py-5 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
                  <MobileNavGroup title="Platform Capabilities" items={platformItems} />
                  <MobileNavGroup title="Solutions" items={solutionItems} />
                  <MobileNavGroup title="Developers" items={developerItems} />

                  <div className="mt-4 border-t border-black/[0.06] pt-3">
                    <MobileSimpleRow href="/pricing" label="Pricing" />
                    <MobileSimpleRow href="/docs" label="Documentation & Guides" />
                  </div>
                </div>

                <div className="border-t border-black/[0.06] bg-white/80 p-4 backdrop-blur-md">
                  <div className="grid grid-cols-2 gap-2.5">
                    <SheetClose asChild>
                      <Button
                        variant="outline"
                        asChild
                        className="h-11 rounded-xl border-black/[0.08] text-sm font-semibold   secondary-btn"
                      >
                        <Link href="/sign-in">Sign in</Link>
                      </Button>
                    </SheetClose>

                    <SheetClose asChild>
                      <Button
                        asChild
                        className="h-11 rounded-xl  text-sm font-semibold text-[#141d02] shadow-xs  primary-btn"
                      >
                        <Link href="/sign-up">Start Building</Link>
                      </Button>
                    </SheetClose>
                  </div>
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </nav>
    </header>
  );
}

/* -------------------------------------------------------------------------- */
/* Nav Trigger                                                                */
/* -------------------------------------------------------------------------- */

function NavTrigger({ children }: { children: React.ReactNode }) {
  return (
    <NavigationMenuTrigger className="h-9 rounded-lg bg-transparent px-3  text-md font-medium tracking-[-0.01em] text-[#64675e] shadow-none hover:bg-black/[0.035] hover:text-[#171812] focus:bg-black/[0.035] data-[state=open]:bg-black/[0.045] data-[state=open]:text-[#171812]">
      {children}
    </NavigationMenuTrigger>
  );
}

/* -------------------------------------------------------------------------- */
/* Desktop Submenu Panels                                                     */
/* -------------------------------------------------------------------------- */

function PlatformMenu() {
  return (
    <div className="w-[780px] overflow-hidden rounded-2xl border border-black/[0.08] bg-white shadow-[0_24px_60px_-15px_rgba(20,22,16,0.18)]">
      <div className="grid grid-cols-[1fr_260px]">
        {/* Left: 2x3 Grid */}
        <div className="grid grid-cols-2 gap-1.5 p-3.5">
          {platformItems.map((item) => (
            <MegaCard key={item.title} {...item} />
          ))}
        </div>

        {/* Right: Architectural Highlight Panel */}
        <div className="relative flex flex-col justify-between border-l border-black/[0.06] bg-[#f8f8f4] p-5">
          <div className="absolute -right-12 -top-12 size-40 rounded-full bg-[#B3E61D]/25 blur-[45px] pointer-events-none" />

          <div className="relative z-10">
            <div className="flex size-8.5 items-center justify-center rounded-lg bg-[#B3E61D] text-[#141b02] shadow-2xs">
              <Zap className="size-4" />
            </div>

            <h4 className="mt-4 font-heading text-sm font-bold leading-tight text-[#1a1c15]">
              Distributed Engine
            </h4>
            <p className="mt-1.5 text-[11px] leading-relaxed text-[#73766d]">
              Upload source files and stream multi-bitrate HLS ladders backed by Anycast edge PoPs.
            </p>
          </div>

          <Link
            href="/platform"
            className="group relative z-10 inline-flex items-center gap-1 text-[11px] font-bold text-[#4a640a] hover:underline"
          >
            <span>Explore architecture</span>
            <ArrowRight className="size-3 transition-transform group-hover:translate-x-0.5" />
          </Link>
        </div>
      </div>

      {/* Global Status Footer */}
      <div className="flex items-center justify-between border-t border-black/[0.06] bg-[#fafaf7] px-4 py-2.5 text-[11px] text-[#73766d]">
        <div className="flex items-center gap-2">
          <span className="relative flex size-2">
            <span className="absolute inline-flex size-full animate-ping rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex size-2 rounded-full bg-emerald-500" />
          </span>
          <span className="font-subheading font-medium">All edge systems operational</span>
        </div>
        <span className="font-subheading text-neutral-400">310+ Global PoPs Active</span>
      </div>
    </div>
  );
}

function DevelopersMenu() {
  return (
    <div className="w-[580px] overflow-hidden rounded-2xl border border-black/[0.08] bg-white p-3 shadow-[0_24px_60px_-15px_rgba(20,22,16,0.18)]">
      <div className="grid grid-cols-2 gap-1">
        {developerItems.map((item) => (
          <MegaCard key={item.title} {...item} />
        ))}
      </div>

      {/* Quickstart Action Bar */}
      <div className="mt-2.5 flex items-center justify-between rounded-xl border border-black/[0.05] bg-[#f8f8f4] px-3.5 py-2.5">
        <div className="flex items-center gap-2">
          <Workflow className="size-3.5 text-[#5e7714]" />
          <span className="text-[11px] font-medium text-[#64675e]">
            Ready to integrate? Clone the quickstart starter.
          </span>
        </div>
        <Link
          href="/docs"
          className="text-[11px] font-bold text-[#4a640a] hover:underline flex items-center gap-0.5"
        >
          <span>Docs</span>
          <ChevronRight className="size-3" />
        </Link>
      </div>
    </div>
  );
}

function SolutionsMenu() {
  return (
    <div className="w-[460px] overflow-hidden rounded-2xl border border-black/[0.08] bg-white p-3 shadow-[0_24px_60px_-15px_rgba(20,22,16,0.18)]">
      <div className="flex flex-col gap-1">
        {solutionItems.map((item) => (
          <MegaCard key={item.title} {...item} />
        ))}
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Submenu Item Card                                                          */
/* -------------------------------------------------------------------------- */

function MegaCard({
  title,
  description,
  href,
  icon: Icon,
}: {
  title: string;
  description: string;
  href: string;
  icon: React.ElementType;
}) {
  return (
    <NavigationMenuLink asChild>
      <Link
        href={href}
        className="group flex items-start gap-3 rounded-xl p-2.5 transition-colors hover:bg-[#f6f6f1] focus:bg-[#f6f6f1] focus:outline-none"
      >
        <div className="flex size-8.5 shrink-0 items-center justify-center rounded-lg border border-black/[0.06] bg-white text-[#64675e] shadow-2xs transition-all group-hover:border-black/[0.12] group-hover:text-[#171812] group-hover:shadow-xs">
          <Icon className="size-4" />
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1">
            <p className="font-heading text-xs font-semibold text-[#1f211a]">
              {title}
            </p>
            <ArrowRight className="size-3 -translate-x-1 opacity-0 transition-all duration-150 group-hover:translate-x-0 group-hover:opacity-100 text-neutral-400" />
          </div>
          <p className="mt-0.5 text-[11px] leading-snug text-[#7e8178] line-clamp-2">
            {description}
          </p>
        </div>
      </Link>
    </NavigationMenuLink>
  );
}

/* -------------------------------------------------------------------------- */
/* Mobile Drawer Components                                                   */
/* -------------------------------------------------------------------------- */

function MobileNavGroup({
  title,
  items,
}: {
  title: string;
  items: {
    title: string;
    description: string;
    href: string;
    icon: React.ElementType;
  }[];
}) {
  return (
    <div className="mb-5">
      <p className="font-subheading mb-2 px-2 text-[11px] font-bold uppercase tracking-wider text-slate-400">
        {title}
      </p>

      <div className="space-y-1">
        {items.map((item) => {
          const Icon = item.icon;
          return (
            <SheetClose key={item.title} asChild>
              <Link
                href={item.href}
                className="flex items-center gap-3.5 rounded-xl px-2.5 py-2.5 transition-colors hover:bg-black/[0.035] active:bg-black/[0.05]"
              >
                <div className="flex size-9 shrink-0 items-center justify-center rounded-xl border border-black/[0.06] bg-white text-slate-700 shadow-2xs">
                  <Icon className="size-4.5" />
                </div>

                <div className="min-w-0 flex-1">
                  <p className="font-heading text-sm font-semibold text-slate-900">
                    {item.title}
                  </p>
                  <p className="truncate text-xs text-slate-500">
                    {item.description}
                  </p>
                </div>

                <ChevronRight className="size-4 text-slate-400" />
              </Link>
            </SheetClose>
          );
        })}
      </div>
    </div>
  );
}

function MobileSimpleRow({ href, label }: { href: string; label: string }) {
  return (
    <SheetClose asChild>
      <Link
        href={href}
        className="flex h-11 items-center justify-between rounded-xl px-2.5 text-sm font-semibold text-slate-800 transition-colors hover:bg-black/[0.035]"
      >
        <span>{label}</span>
        <ChevronRight className="size-4 text-slate-400" />
      </Link>
    </SheetClose>
  );
}