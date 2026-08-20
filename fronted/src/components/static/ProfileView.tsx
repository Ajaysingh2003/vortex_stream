"use client";

import React from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { User, CreditCard, Settings, LogOut, Sparkles, ChevronDown } from "lucide-react";

interface ProfileViewProps {
  name?: string;
  email?: string;
  avatarUrl?: string;
  plan?: string;
  onLogout?: () => void;
}

export default function ProfileView({
  name = "Ajay Singh",
  email = "ajay@example.com",
  avatarUrl = "",
  plan = "Pro Plan",
  onLogout,
}: ProfileViewProps) {
  // Generate initials for avatar fallback (e.g. "Ajay Singh" -> "AS")
  const initials = name
    .split(" ")
    .filter(Boolean)
    .map((n) => n[0])
    .join("")
    .toUpperCase();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="flex items-center gap-2 p-1 rounded-full outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 hover:bg-muted/50 transition-colors">
          <Avatar className="h-8 w-8 border border-border">
            <AvatarImage src={avatarUrl} alt={name} />
            <AvatarFallback className="bg-teal-600 text-white font-medium text-xs">
              {initials}
            </AvatarFallback>
          </Avatar>
          <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
        </button>
      </DropdownMenuTrigger>

      <DropdownMenuContent className="w-60 rounded-lg shadow-xl" align="end" forceMount>
        {/* User Profile Info Header */}
        <DropdownMenuLabel className="font-normal p-3">
          <div className="flex flex-col space-y-1">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold leading-none text-foreground">{name}</p>
              <span className="inline-flex items-center gap-1 rounded-full bg-purple-500/10 px-2 py-0.5 text-[10px] font-medium text-purple-600 dark:text-purple-400 border border-purple-500/20">
                <Sparkles className="h-3 w-3" />
                {plan}
              </span>
            </div>
            <p className="text-xs leading-none text-muted-foreground truncate">{email}</p>
          </div>
        </DropdownMenuLabel>

        <DropdownMenuSeparator />

        {/* Core Options */}
        <DropdownMenuGroup>
          <DropdownMenuItem className="cursor-pointer gap-2 hover:bg-muted focus:bg-muted rounded-lg">
            <User className="h-4 w-4 text-muted-foreground" />
            <span>Profile</span>
          </DropdownMenuItem>
          <DropdownMenuItem className="cursor-pointer gap-2 hover:bg-muted focus:bg-muted rounded-lg">
            <CreditCard className="h-4 w-4 text-muted-foreground" />
            <span>Billing & Usage</span>
          </DropdownMenuItem>
          <DropdownMenuItem className="cursor-pointer gap-2 hover:bg-muted focus:bg-muted rounded-lg">
            <Settings className="h-4 w-4 text-muted-foreground" />
            <span>Settings</span>
          </DropdownMenuItem>
        </DropdownMenuGroup>

        <DropdownMenuSeparator />

        {/* Logout Action */}
        <DropdownMenuItem 
          onClick={onLogout}
          className="cursor-pointer gap-2 text-destructive focus:text-destructive focus:bg-destructive/10"
        >
          <LogOut className="h-4 w-4" />
          <span>Log out</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}