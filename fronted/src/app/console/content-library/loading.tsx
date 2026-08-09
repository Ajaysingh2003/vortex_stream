export default function Loading() {
  return (
    <div className="min-h-screen w-full animate-pulse px-4 py-6 md:px-12">
      <div className="mb-8 flex items-center justify-between">
        <div className="h-8 w-32 rounded-md bg-muted" />
        <div className="h-9 w-28 rounded-md bg-muted" />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {Array.from({ length: 8 }).map((_, index) => (
          <div key={index} className="h-40 rounded-xl bg-muted" />
        ))}
      </div>
    </div>
  );
}
