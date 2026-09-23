"use client";
import dynamic from "next/dynamic";
import { Suspense, type ReactNode } from "react";
import { ErrorBoundary } from "react-error-boundary";
import Link from "next/link";

const Loading = () => (
  <div role="status" className="p-8 text-sm text-muted-foreground">
    Loading your workspace…
  </div>
);
// Console queries use the browser's authenticated tRPC session. Rendering their
// suspense hooks on the server would make a second HTTP request without cookies.
const ConsoleLayout = dynamic(() => import("./ConsoleLayout"), {
  ssr: false,
  loading: Loading,
});
export default function ConsoleClientEntry({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <ErrorBoundary
      fallbackRender={({ error }) => (
        <div role="alert" className="mx-auto max-w-lg space-y-4 p-8 text-sm">
          <h1 className="text-lg font-semibold">
            Unable to load your workspace
          </h1>
          <p>
            {error instanceof Error
              ? error.message
              : "Please try again or sign in to continue."}
          </p>
          <div className="flex gap-4">
            <button
              className="underline"
              onClick={() => window.location.reload()}
            >
              Try again
            </button>
            <Link className="underline" href="/login">
              Sign in
            </Link>
          </div>
        </div>
      )}
    >
      <Suspense fallback={<Loading />}>
        <ConsoleLayout>{children}</ConsoleLayout>
      </Suspense>
    </ErrorBoundary>
  );
}
