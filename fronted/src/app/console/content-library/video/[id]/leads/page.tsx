import LeadsView from "@/modules/leads/components/LeadsView";
export default async function LeadsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <LeadsView videoId={id} />;
}
