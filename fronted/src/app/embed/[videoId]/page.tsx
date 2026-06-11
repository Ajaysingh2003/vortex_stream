import EmbedView from "@/modules/embed/view/EmbedView";

export default async function Page({
  params,
}: {
  params: Promise<{ videoId: string }>;
}) {
  const { videoId } = await params;

  return (
    <div className="h-dvh w-full overflow-hidden bg-blacsk">
      <EmbedView videoId={videoId} />
    </div>
  );
}
