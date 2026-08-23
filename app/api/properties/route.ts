import { backendErrorResponse, backendFetch } from "@/lib/backend/server";
import { getSessionEmail } from "@/lib/backend/session";
import type { Address } from "@/lib/mockData";
import type { OwnedProperty } from "@/lib/accounts";

export interface PropertyListItem {
  id: string;
  address: Address;
  imageVariant: number;
  occupancyStatus: OwnedProperty["occupancyStatus"];
  systemSizeKw: number | null;
  currentTenantName: string | null;
  monthlyIncome: number;
  balanceOutstanding: number;
}

export interface PropertiesApiResponse {
  properties: PropertyListItem[];
}

export async function GET() {
  const email = await getSessionEmail();
  if (!email) return Response.json({ message: "Not signed in" }, { status: 401 });
  try {
    return Response.json(
      await backendFetch(`/api/properties?email=${encodeURIComponent(email)}`)
    );
  } catch (error) {
    return backendErrorResponse(error);
  }
}

export async function POST(request: Request) {
  const email = await getSessionEmail();
  if (!email) return Response.json({ message: "Not signed in" }, { status: 401 });
  try {
    const body = await request.json();
    return Response.json(await backendFetch("/api/properties", {
      method: "POST",
      body: JSON.stringify({ ...body, email }),
    }), { status: 201 });
  } catch (error) {
    return backendErrorResponse(error);
  }
}
