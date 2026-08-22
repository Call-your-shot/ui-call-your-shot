import type { Account } from "@/lib/accounts";
import { backendErrorResponse, backendFetch } from "@/lib/backend/server";
import { getSessionEmail } from "@/lib/backend/session";
import type { BackendDashboard, UserProfile } from "@/lib/backend/types";

export async function GET() {
  const email = await getSessionEmail();
  if (!email) return Response.json({ message: "Not signed in" }, { status: 401 });

  try {
    const encoded = encodeURIComponent(email);
    const [profile, dashboard] = await Promise.all([
      backendFetch<UserProfile>(`/api/v1/users/profile?email=${encoded}`),
      backendFetch<BackendDashboard>(`/api/dashboard?email=${encoded}`),
    ]);
    const account: Account = {
      id: profile.id,
      name: profile.full_name,
      email: profile.email,
      avatarInitials: profile.avatar_initials,
      tenancies: dashboard.tenancies,
      ownedProperties: dashboard.ownedProperties,
    };
    return Response.json(account);
  } catch (error) {
    return backendErrorResponse(error);
  }
}
