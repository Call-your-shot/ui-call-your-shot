"use client";

import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import { useDemo } from "@/lib/demo-context";
import { formatPropertyAddress } from "@/lib/accounts";
import { cn } from "@/lib/utils";
import { CreditCard, LogOut } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

const notificationOptions = [
  { id: "statement-ready", label: "Statement ready", description: "When your new monthly statement is available." },
  { id: "output-alerts", label: "Output alerts", description: "When a system's generation drops below expected." },
  { id: "plan-changes", label: "Plan changes", description: "Proposal responses, leave requests, and terms updates." },
];

export default function SettingsPage() {
  const { account } = useDemo();
  const router = useRouter();
  const [notifications, setNotifications] = useState<Record<string, boolean>>({
    "statement-ready": true,
    "output-alerts": true,
    "plan-changes": true,
  });
  const [language, setLanguage] = useState("en-AU");
  const [largeText, setLargeText] = useState(false);
  const [reduceMotion, setReduceMotion] = useState(false);
  const [saveMessage, setSaveMessage] = useState("");

  useEffect(() => {
    fetch("/api/settings", { cache: "no-store" })
      .then(async (response) => {
        const payload = await response.json();
        if (!response.ok) throw new Error(payload.message ?? "Could not load settings");
        setNotifications(payload.notifications);
        setLanguage(payload.language);
        setLargeText(payload.largeText);
        setReduceMotion(payload.reduceMotion);
      })
      .catch(() => setSaveMessage("Settings could not be loaded."));
  }, []);

  async function saveSettings() {
    const response = await fetch("/api/settings", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ notifications, language, largeText, reduceMotion }),
    });
    setSaveMessage(response.ok ? "Settings saved." : "Settings could not be saved.");
  }

  async function signOut() {
    await fetch("/api/session", { method: "DELETE" });
    router.push("/signin");
    router.refresh();
  }

  const linkedProperties = [
    ...account.tenancies.map((t) => ({
      id: t.id,
      label: formatPropertyAddress(t.address),
      role: "Tenant" as const,
    })),
    ...account.ownedProperties.map((p) => ({
      id: p.id,
      label: formatPropertyAddress(p.address),
      role: "Landlord" as const,
    })),
  ];

  return (
    <div>
      <h1 className="text-h1">Settings</h1>
      <p className="text-body mt-1">Manage your account, notifications, and preferences.</p>

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-12">
        <Card className="lg:col-span-6">
          <h2 className="text-h3">Profile</h2>
          <div className="mt-4 flex flex-col gap-4">
            <Field label="Full name" defaultValue={account.name} readOnly />
            <Field label="Email" defaultValue={account.email} type="email" readOnly />
            <Field label="Phone" defaultValue="" type="tel" placeholder="Not provided" readOnly />
          </div>
        </Card>

        <Card className="lg:col-span-6">
          <h2 className="text-h3">Notifications</h2>
          <div className="mt-4 flex flex-col divide-y divide-dashed divide-line">
            {notificationOptions.map((opt) => (
              <label key={opt.id} className="flex items-center justify-between gap-4 py-3 first:pt-0 last:pb-0">
                <span>
                  <span className="block text-[14px] font-medium text-grey-900">{opt.label}</span>
                  <span className="block text-[12px] text-grey-500">{opt.description}</span>
                </span>
                <input
                  type="checkbox"
                  checked={notifications[opt.id]}
                  onChange={(e) => setNotifications((n) => ({ ...n, [opt.id]: e.target.checked }))}
                  className="h-5 w-9 shrink-0 accent-primary"
                />
              </label>
            ))}
          </div>
        </Card>

        <Card className="lg:col-span-12">
          <h2 className="text-h3">Linked properties</h2>
          <p className="text-small mt-0.5">Every property you rent or own, in one place.</p>
          <div className="mt-4 flex flex-col divide-y divide-dashed divide-line">
            {linkedProperties.length === 0 ? (
              <p className="text-body py-3">No properties linked yet.</p>
            ) : (
              linkedProperties.map((p) => (
                <div key={`${p.role}-${p.id}`} className="flex items-center justify-between gap-4 py-3">
                  <span className="text-[14px] font-medium text-grey-900">{p.label}</span>
                  <span
                    className={cn(
                      "inline-flex h-6 items-center rounded-md px-2 text-[12px] font-bold",
                      p.role === "Tenant" ? "bg-info-light text-info" : "bg-primary-lighter text-primary-darker"
                    )}
                  >
                    {p.role}
                  </span>
                </div>
              ))
            )}
          </div>
        </Card>

        <Card className="lg:col-span-6">
          <h2 className="text-h3">Payment details</h2>
          <div className="mt-4 flex items-center gap-3 rounded-lg bg-grey-200 p-3">
            <CreditCard size={20} className="text-grey-600" aria-hidden="true" />
            <div>
              <p className="text-[14px] font-semibold text-grey-900">No payment method connected</p>
              <p className="text-small">Payment integration is not part of the current backend.</p>
            </div>
          </div>
          <Button variant="secondary" className="mt-3" disabled>
            Update payment method
          </Button>
        </Card>

        <Card className="lg:col-span-6">
          <h2 className="text-h3">Language &amp; accessibility</h2>
          <div className="mt-4 flex flex-col gap-4">
            <label className="block">
              <span className="mb-1.5 block text-[14px] font-semibold text-grey-900">Language</span>
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                className="w-full rounded-lg border border-line bg-surface-alt px-3.5 py-2.5 text-[15px] outline-none focus:border-primary focus:bg-surface"
              >
                <option value="en-AU">English (Australia)</option>
                <option value="zh-CN">中文 (简体)</option>
                <option value="ar">العربية</option>
                <option value="vi">Tiếng Việt</option>
              </select>
            </label>
            <ToggleRow label="Large text" checked={largeText} onChange={setLargeText} />
            <ToggleRow label="Reduce motion" checked={reduceMotion} onChange={setReduceMotion} />
          </div>
        </Card>

        <div className="lg:col-span-12">
          <div className="mb-4 flex items-center gap-3">
            <Button onClick={saveSettings}>Save settings</Button>
            {saveMessage && <span className="text-small text-muted" role="status">{saveMessage}</span>}
          </div>
          <Button variant="danger" onClick={signOut}>
            <LogOut size={16} aria-hidden="true" />
            Sign out
          </Button>
        </div>
      </div>
    </div>
  );
}

function Field({
  label,
  defaultValue,
  type = "text",
  placeholder,
  readOnly = false,
}: {
  label: string;
  defaultValue: string;
  type?: string;
  placeholder?: string;
  readOnly?: boolean;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-[14px] font-semibold text-grey-900">{label}</span>
      <input
        type={type}
        defaultValue={defaultValue}
        placeholder={placeholder}
        readOnly={readOnly}
        className="w-full rounded-lg border border-line bg-surface-alt px-3 py-2.5 text-[15px] text-grey-900 outline-none focus:border-primary focus:bg-surface"
      />
    </label>
  );
}

function ToggleRow({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <label className="flex items-center justify-between gap-4">
      <span className="text-[14px] font-medium text-grey-900">{label}</span>
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="h-5 w-9 shrink-0 accent-primary"
      />
    </label>
  );
}
