import type { ReactNode } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import ConsoleLayout from "@/modules/console/component/ConsoleClientEntry";

// Console queries depend on the viewer's session and cannot run at build time.
export const dynamic = "force-dynamic";

export default async function Layout({ children }: { children: ReactNode }) {
  if (!(await cookies()).has("access_token")) redirect("/login");
  return <ConsoleLayout>{children}</ConsoleLayout>;
}
