import { redirect } from "next/navigation";

export default async function ProposalInvitePage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  redirect(`/proposal/${encodeURIComponent(token)}/landlord`);
}
