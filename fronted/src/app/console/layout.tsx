"use client";
import React from "react";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/modules/console/component/AppSidebar";
import { ConsoleProvider } from "@/modules/console/context/ConsoleContext";
import BreadCumbConsole from "@/modules/console/component/BreadCumbConsole";
import ProfileView from "@/components/static/ProfileView";
import { useTRPC } from "@/trpc/client";
import { useMutation, useSuspenseQuery } from "@tanstack/react-query";
import { UserDataType, UserSubscriptionType } from "@/modules/types";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";

function Layout({ children }: { children: React.ReactNode }) {
  const trpc = useTRPC();
  const { data: user } = useSuspenseQuery(trpc.user.profile.queryOptions());
  const { data: planDetails } = useSuspenseQuery(
    trpc.user.getCurrentPlan.queryOptions(),
  );

  const userData = user as UserDataType;
  const router=useRouter()
  const logOutMutate = useMutation(
    trpc.user.logout.mutationOptions({
      onSuccess: () => {
        toast.success("User Logedout Successfully.");
        router.push(`/`)
      },
      onError: (err) => {
        toast.error(err.message);
      },
    }),
  );
  const planDetailsType = planDetails as UserSubscriptionType;

  const handleLogOut = async () => {
    await logOutMutate.mutateAsync();
  };

  return (
    <ConsoleProvider>
      <SidebarProvider>
        <section className="flex w-full min-h-screen">
          <div className="py-8 h-full">
            <AppSidebar />
          </div>

          <div className="flex-1 w-full relative">
            {/* Header Navbar */}
            <header className="sticky top-0 z-40 w-full bg-white px-4 py-3 border-b border-stone-200 flex items-center justify-between gap-4">
              {/* Left Section: Trigger & Breadcrumbs */}
              <div className="flex items-center gap-3">
                <SidebarTrigger />
                <div
                  className="h-4 w-[1px] bg-zinc-300 dark:bg-zinc-700"
                  aria-hidden="true"
                />
                <BreadCumbConsole />
              </div>

              {/* Right Section: User Info / Search / Badges */}
              <div className="flex items-center gap-3">
                <ProfileView
                  name={userData.name}
                  email={userData.email}
                  plan={planDetailsType.plan}
                  onLogout={handleLogOut}
                />
              </div>
            </header>

            {/* Main Content Area */}
            <main className="p-6 w-full h-full">{children}</main>
          </div>
        </section>
      </SidebarProvider>
    </ConsoleProvider>
  );
}

export default Layout;
