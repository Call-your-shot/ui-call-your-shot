import Button from "@/components/ui/Button";
import Callout from "@/components/ui/Callout";
import PublicShellLayout from "@/components/layouts/PublicShellLayout";
import { ArrowRightLeft, Calculator, FileSearch, Handshake } from "lucide-react";
import Image from "next/image";

const steps = [
  {
    icon: Calculator,
    title: "1. Check the address",
    body: "Tell us about the property and we estimate whether rooftop solar can work there.",
  },
  {
    icon: FileSearch,
    title: "2. See your solar plan",
    body: "We design a system for your roof and show exactly what you'd save.",
  },
  {
    icon: Handshake,
    title: "3. Split the savings",
    body: "Send your landlord a ready-made proposal. Both of you sign, solar goes on the roof.",
  },
];

export default function LandingPage() {
  return (
    <PublicShellLayout>
      {/* Hero */}
      <section className="relative isolate overflow-hidden">
        <div className="absolute inset-0" aria-hidden="true">
          <Image
            src="/coverImage.png"
            alt=""
            fill
            priority
            sizes="100vw"
            className="object-cover"
          />
          <div className="absolute inset-0 bg-primary-dark/70" />
        </div>

        <div className="relative mx-auto max-w-6xl px-6 py-20 sm:py-28">
          <h1 className="text-display max-w-xl text-white animate-fade-up">
            Renting? Your roof could be saving you money.
          </h1>
          <p className="text-body mt-5 max-w-lg text-white/90 animate-fade-up [animation-delay:100ms]">
            Landlords won&apos;t install solar on a home they don&apos;t pay the
            power bill for, and tenants can&apos;t install solar on a roof
            they don&apos;t own. SunShare fixes the standoff — you buy solar
            power straight from your landlord at about half the grid rate.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row animate-fade-up [animation-delay:150ms]">
            <Button href="/signin" variant="accent">
              Get started
            </Button>
            <Button href="/plans" variant="inverse">
              I already have a plan
            </Button>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="mx-auto max-w-6xl px-6 py-14">
        <h2 className="text-h2 text-ink">How it works</h2>
        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
          {steps.map((step) => (
            <div
              key={step.title}
              className="flex flex-col items-start gap-3 rounded-lg border border-line bg-surface p-6"
            >
              <span className="flex h-12 w-12 items-center justify-center rounded-full bg-secondary-light text-secondary">
                <step.icon size={22} aria-hidden="true" />
              </span>
              <h3 className="text-h3 text-ink">{step.title}</h3>
              <p className="text-small text-muted">{step.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Plain-language explainer band */}
      <section className="bg-surface-alt py-14">
        <div className="mx-auto max-w-6xl px-6">
          <h2 className="text-h2 text-ink">The numbers, plainly</h2>
          <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="rounded-lg border border-line bg-surface p-6 text-center">
              <p className="text-data text-success">15¢</p>
              <p className="text-small mt-1 text-muted">you pay per unit</p>
            </div>
            <div className="rounded-lg border border-line bg-surface p-6 text-center">
              <p className="text-data text-accent">30¢</p>
              <p className="text-small mt-1 text-muted">grid price, for comparison</p>
            </div>
            <div className="rounded-lg border border-line bg-surface p-6 text-center">
              <p className="text-data text-primary">3×</p>
              <p className="text-small mt-1 text-muted">landlord&apos;s usual export rate</p>
            </div>
          </div>

          <div className="mt-6">
            <Callout variant="info" heading="Free, eventually">
              <div className="flex items-start gap-2">
                <ArrowRightLeft size={16} className="mt-0.5 shrink-0" aria-hidden="true" />
                <p>
                  When your landlord has recovered their costs plus a fair
                  return, the charge switches off{" "}
                  <span className="font-semibold">permanently</span> — and
                  the solar becomes free.
                </p>
              </div>
            </Callout>
          </div>
        </div>
      </section>
    </PublicShellLayout>
  );
}
