"use client";

import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import { useDemo } from "@/lib/demo-context";
import { formatPropertyAddress, isLandlord, isTenant } from "@/lib/accounts";
import { cn } from "@/lib/utils";
import { Check, Paperclip } from "lucide-react";
import { useState } from "react";

const tenantCategories = [
  { value: "billing", label: "Billing dispute" },
  { value: "not_generating", label: "System not generating" },
  { value: "reading_wrong", label: "Reading looks wrong" },
  { value: "landlord_unresponsive", label: "Landlord not responding" },
  { value: "other", label: "Other" },
];

const landlordCategories = [
  { value: "system_fault", label: "System fault" },
  { value: "tenant_not_paying", label: "Tenant not paying" },
  { value: "meter_issue", label: "Meter issue" },
  { value: "other", label: "Other" },
];

interface PastReport {
  id: string;
  reference: string;
  category: string;
  property: string;
  status: "Open" | "In progress" | "Resolved";
  submittedAt: string;
}

const statusClasses: Record<PastReport["status"], string> = {
  Open: "bg-warning-light text-warning",
  "In progress": "bg-info-light text-info",
  Resolved: "bg-success-light text-success",
};

export default function ReportIssuePage() {
  const { account } = useDemo();
  const tenant = isTenant(account);
  const landlord = isLandlord(account);

  const combinedCategories = [...(tenant ? tenantCategories : []), ...(landlord ? landlordCategories : [])];
  const categories = combinedCategories.filter(
    (c, i) => combinedCategories.findIndex((other) => other.value === c.value) === i
  );
  const properties = [
    ...account.tenancies.map((t) => ({ id: t.id, label: formatPropertyAddress(t.address) })),
    ...account.ownedProperties.map((p) => ({ id: p.id, label: formatPropertyAddress(p.address) })),
  ];

  const [category, setCategory] = useState(categories[0]?.value ?? "other");
  const [propertyId, setPropertyId] = useState(properties[0]?.id ?? "");
  const [description, setDescription] = useState("");
  const [contactPreference, setContactPreference] = useState<"email" | "phone">("email");
  const [fileName, setFileName] = useState<string | null>(null);
  const [pastReports, setPastReports] = useState<PastReport[]>([
    {
      id: "r1",
      reference: "SR-2026-0142",
      category: "Reading looks wrong",
      property: properties[0]?.label ?? "",
      status: "Resolved",
      submittedAt: "2026-06-02",
    },
  ]);
  const [submittedRef, setSubmittedRef] = useState<string | null>(null);

  function submit() {
    if (!description.trim()) return;
    const reference = `SR-2026-${Math.floor(1000 + Math.random() * 9000)}`;
    const categoryLabel = categories.find((c) => c.value === category)?.label ?? category;
    const propertyLabel = properties.find((p) => p.id === propertyId)?.label ?? "—";
    setPastReports((prev) => [
      { id: reference, reference, category: categoryLabel, property: propertyLabel, status: "Open", submittedAt: new Date().toISOString().slice(0, 10) },
      ...prev,
    ]);
    setSubmittedRef(reference);
    setDescription("");
    setFileName(null);
  }

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="text-h1">Report an issue</h1>
      <p className="text-body mt-1">Tell us what&apos;s wrong and we&apos;ll get on it.</p>

      {submittedRef ? (
        <Card className="mt-6 flex flex-col items-center gap-3 py-10 text-center">
          <span className="flex h-14 w-14 items-center justify-center rounded-full bg-success-light text-success">
            <Check size={26} aria-hidden="true" />
          </span>
          <h2 className="text-h3">Report submitted</h2>
          <p className="text-body">
            Reference <span className="font-bold text-grey-900">{submittedRef}</span>
          </p>
          <p className="text-small">We usually respond within 1 business day.</p>
          <Button variant="secondary" className="mt-2" onClick={() => setSubmittedRef(null)}>
            Submit another report
          </Button>
        </Card>
      ) : (
        <Card className="mt-6">
          <div className="flex flex-col gap-4">
            <label className="block">
              <span className="mb-1.5 block text-[14px] font-semibold text-grey-900">Category</span>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full rounded-lg border border-line bg-surface-alt px-3.5 py-2.5 text-[15px] outline-none focus:border-primary focus:bg-surface"
              >
                {categories.map((c) => (
                  <option key={c.value} value={c.value}>
                    {c.label}
                  </option>
                ))}
              </select>
            </label>

            {properties.length > 0 && (
              <label className="block">
                <span className="mb-1.5 block text-[14px] font-semibold text-grey-900">Property</span>
                <select
                  value={propertyId}
                  onChange={(e) => setPropertyId(e.target.value)}
                  className="w-full rounded-lg border border-line bg-surface-alt px-3.5 py-2.5 text-[15px] outline-none focus:border-primary focus:bg-surface"
                >
                  {properties.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.label}
                    </option>
                  ))}
                </select>
              </label>
            )}

            <label className="block">
              <span className="mb-1.5 block text-[14px] font-semibold text-grey-900">Description</span>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={4}
                placeholder="What's happening?"
                className="w-full rounded-lg border border-line bg-surface-alt px-3.5 py-2.5 text-[15px] outline-none focus:border-primary focus:bg-surface"
              />
            </label>

            <label className="flex w-fit cursor-pointer items-center gap-2 rounded-lg border border-dashed border-line px-3.5 py-2.5 text-[13px] font-medium text-grey-600">
              <Paperclip size={15} aria-hidden="true" />
              {fileName ?? "Attach a photo (optional)"}
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => setFileName(e.target.files?.[0]?.name ?? null)}
              />
            </label>

            <div>
              <span className="mb-1.5 block text-[14px] font-semibold text-grey-900">Contact preference</span>
              <div className="flex gap-2">
                {(["email", "phone"] as const).map((c) => (
                  <button
                    key={c}
                    onClick={() => setContactPreference(c)}
                    className={cn(
                      "min-h-9 flex-1 rounded-lg px-3 py-2 text-[13px] font-semibold capitalize",
                      contactPreference === c ? "bg-primary text-white" : "bg-grey-200 text-grey-600"
                    )}
                  >
                    {c}
                  </button>
                ))}
              </div>
            </div>

            <Button disabled={!description.trim()} onClick={submit}>
              Submit report
            </Button>
          </div>
        </Card>
      )}

      <h2 className="text-h2 mt-8">Past reports</h2>
      <div className="mt-4 flex flex-col gap-3">
        {pastReports.map((r) => (
          <Card key={r.id} className="flex items-center justify-between gap-4">
            <div className="min-w-0">
              <p className="text-[14px] font-semibold text-grey-900">{r.category}</p>
              <p className="text-small mt-0.5">
                {r.reference} · {r.property}
              </p>
            </div>
            <span className={cn("inline-flex h-6 shrink-0 items-center rounded-md px-2 text-[12px] font-bold", statusClasses[r.status])}>
              {r.status}
            </span>
          </Card>
        ))}
      </div>
    </div>
  );
}
