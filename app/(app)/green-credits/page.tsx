"use client";

import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import { useDemo } from "@/lib/demo-context";
import {
  allocateGreenCredits,
  getGreenCreditActivity,
  getGreenCreditWallet,
  greenProjects,
  sponsorFundingForCredits,
  type GreenCreditActivity,
  type GreenProject,
  type GreenProjectCategory,
} from "@/lib/greenCredits";
import { cn } from "@/lib/utils";
import {
  ArrowDownLeft,
  ArrowUpRight,
  BatteryCharging,
  Check,
  ChevronRight,
  CircleDollarSign,
  HandHeart,
  Leaf,
  LockKeyhole,
  MapPin,
  ShieldCheck,
  Sparkles,
  Sprout,
  Sun,
  Users,
  X,
  Zap,
  type LucideIcon,
} from "lucide-react";
import { useEffect, useState } from "react";

const numberFormatter = new Intl.NumberFormat("en-AU");
const currencyFormatter = new Intl.NumberFormat("en-AU", {
  style: "currency",
  currency: "AUD",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const projectIcons: Record<GreenProjectCategory, LucideIcon> = {
  energy_storage: BatteryCharging,
  rooftop_solar: Sun,
  habitat_restoration: Sprout,
};

export default function GreenCreditsPage() {
  const { account } = useDemo();

  return <GreenCreditsExperience key={account.id} accountId={account.id} />;
}

function GreenCreditsExperience({ accountId }: { accountId: string }) {
  const wallet = getGreenCreditWallet(accountId);
  const [availableCredits, setAvailableCredits] = useState(wallet.availableCredits);
  const [projects, setProjects] = useState(() => greenProjects.map((project) => ({ ...project })));
  const [activities, setActivities] = useState<GreenCreditActivity[]>(() =>
    getGreenCreditActivity(accountId).map((activity) => ({ ...activity }))
  );
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [success, setSuccess] = useState<{
    projectTitle: string;
    credits: number;
    sponsorDollars: number;
  } | null>(null);

  const selectedProject = projects.find((project) => project.id === selectedProjectId) ?? null;
  const sponsorPotential = sponsorFundingForCredits(availableCredits, 100);

  function completeAllocation(project: GreenProject, requestedCredits: number) {
    const result = allocateGreenCredits({
      requestedCredits,
      availableCredits,
      projectRemainingCredits: project.targetCredits - project.directedCredits,
      creditsPerSponsorDollar: project.creditsPerSponsorDollar,
    });

    setAvailableCredits(result.remainingWalletCredits);
    setProjects((current) =>
      current.map((item) =>
        item.id === project.id
          ? { ...item, directedCredits: item.directedCredits + result.allocatedCredits }
          : item
      )
    );
    setActivities((current) => [
      {
        id: `allocation-${project.id}-${current.length}`,
        type: "allocated",
        title: `Supported ${project.title}`,
        detail: `${currencyFormatter.format(result.sponsorFundingUnlockedDollars)} of sponsor funding unlocked`,
        date: "Today",
        credits: -result.allocatedCredits,
      },
      ...current,
    ]);
    setSelectedProjectId(null);
    setSuccess({
      projectTitle: project.title,
      credits: result.allocatedCredits,
      sponsorDollars: result.sponsorFundingUnlockedDollars,
    });
  }

  return (
    <div>
      <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-h1">Green credits</h1>
          <p className="text-body mt-1">
            Turn verified solar use into a say over sponsor-funded community projects.
          </p>
        </div>
        <span className="mt-3 inline-flex w-fit items-center gap-1.5 rounded-full bg-success-light px-3 py-1.5 text-[12px] font-bold text-success sm:mt-0">
          <ShieldCheck size={14} aria-hidden="true" /> Verified solar rewards
        </span>
      </div>

      {success && (
        <div
          role="status"
          className="mt-6 flex items-start gap-3 rounded-2xl bg-success-light p-4 text-grey-800"
        >
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-success text-white">
            <Check size={18} aria-hidden="true" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-[14px] font-bold">Your credits are making an impact</p>
            <p className="mt-0.5 text-[13px] leading-5 text-grey-700">
              {numberFormatter.format(success.credits)} credits were directed to {success.projectTitle},
              unlocking {currencyFormatter.format(success.sponsorDollars)} from its sponsor pool.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setSuccess(null)}
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-grey-600 hover:bg-white/60"
            aria-label="Dismiss message"
          >
            <X size={16} />
          </button>
        </div>
      )}

      <section className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-12">
        <Card className="relative overflow-hidden bg-primary-darker p-0 text-white lg:col-span-8">
          <div className="pointer-events-none absolute -top-16 -right-10 h-56 w-56 rounded-full bg-primary/35" />
          <div className="pointer-events-none absolute -right-10 -bottom-24 h-52 w-52 rounded-full border-[28px] border-white/5" />
          <div className="relative p-6 sm:p-8">
            <div className="flex items-center gap-2 text-[12px] font-bold tracking-wider text-primary-light uppercase">
              <Sparkles size={15} aria-hidden="true" /> Available to direct
            </div>
            <p className="mt-3 text-[42px] leading-none font-bold tracking-tight tabular-nums sm:text-[52px]">
              {numberFormatter.format(availableCredits)}
            </p>
            <p className="mt-2 text-[15px] font-semibold text-white/90">green credits</p>
            <p className="mt-5 max-w-lg text-[13px] leading-6 text-white/70">
              At the current campaign rate, your choices can unlock up to{" "}
              <strong className="text-white">{currencyFormatter.format(sponsorPotential)}</strong>{" "}
              of already committed sponsor funding.
            </p>
            <a
              href="#projects"
              className="mt-6 inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-white px-4 text-[14px] font-bold text-primary-darker hover:bg-grey-100 sm:h-11"
            >
              Choose a project <ChevronRight size={16} aria-hidden="true" />
            </a>
          </div>
        </Card>

        <Card className="lg:col-span-4">
          <div className="flex items-center justify-between">
            <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary-lighter text-primary-darker">
              <Leaf size={22} aria-hidden="true" />
            </span>
            <span className="rounded-md bg-grey-200 px-2 py-1 text-[11px] font-bold text-grey-600">
              1 verified kWh = 1 credit pool
            </span>
          </div>
          <h2 className="text-h3 mt-5">Your reward summary</h2>
          <dl className="mt-4 divide-y divide-dashed divide-line">
            <SummaryRow label="Lifetime earned" value={`${numberFormatter.format(wallet.lifetimeEarnedCredits)} cr`} />
            <SummaryRow label="Already allocated" value={`${numberFormatter.format(wallet.lifetimeAllocatedCredits)} cr`} />
            <SummaryRow label="Verified solar behind rewards" value={`${numberFormatter.format(wallet.verifiedSolarKwh)} kWh`} />
          </dl>
        </Card>
      </section>

      <section className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <MiniStat
          icon={Zap}
          label="Credits earned"
          value={numberFormatter.format(wallet.lifetimeEarnedCredits)}
          detail="From finalised meter readings"
        />
        <MiniStat
          icon={HandHeart}
          label="Credits directed"
          value={numberFormatter.format(wallet.lifetimeAllocatedCredits)}
          detail="Permanently allocated"
        />
        <MiniStat
          icon={CircleDollarSign}
          label="Sponsor funding unlocked"
          value={currencyFormatter.format(wallet.lifetimeAllocatedCredits / 100)}
          detail="At $1 per 100 credits"
        />
      </section>

      <section id="projects" className="mt-10 scroll-mt-24">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-h2">Choose where your impact goes</h2>
            <p className="text-body mt-1">
              Every project is curated, sponsor-backed and required to report its results.
            </p>
          </div>
          <span className="inline-flex w-fit items-center gap-1.5 text-[12px] font-semibold text-grey-600">
            <LockKeyhole size={14} aria-hidden="true" /> Allocations are permanent
          </span>
        </div>

        <div className="mt-5 grid grid-cols-1 gap-6 xl:grid-cols-3">
          {projects.map((project) => (
            <ProjectCard
              key={project.id}
              project={project}
              walletBalance={availableCredits}
              onSelect={() => setSelectedProjectId(project.id)}
            />
          ))}
        </div>
      </section>

      <section className="mt-10 grid grid-cols-1 gap-6 lg:grid-cols-12">
        <Card className="lg:col-span-7">
          <h2 className="text-h3">How the funding works</h2>
          <p className="text-body mt-1">
            Green credits guide real sponsor money; they are not money themselves.
          </p>
          <ol className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-3">
            <HowStep
              number="1"
              icon={Sun}
              title="Use verified solar"
              detail="Finalised meter readings create rewards using the active property split."
            />
            <HowStep
              number="2"
              icon={Users}
              title="Choose a project"
              detail="Your allocation tells the platform which curated outcome you support."
            />
            <HowStep
              number="3"
              icon={CircleDollarSign}
              title="Unlock sponsor funds"
              detail="Committed money is released at the campaign's published matching rate."
            />
          </ol>
          <div className="mt-6 rounded-xl bg-info-light p-4 text-[13px] leading-5 text-grey-700">
            <strong className="text-grey-900">Important:</strong> credits have no cash value and
            cannot be withdrawn or transferred. Project delivery and sponsor disbursement are
            tracked separately from your credit balance.
          </div>
        </Card>

        <Card className="lg:col-span-5">
          <div className="flex items-center justify-between">
            <h2 className="text-h3">Recent activity</h2>
            <span className="text-[12px] font-semibold text-grey-500">Latest first</span>
          </div>
          <div className="mt-4 divide-y divide-dashed divide-line">
            {activities.slice(0, 4).map((activity) => (
              <ActivityRow key={activity.id} activity={activity} />
            ))}
          </div>
        </Card>
      </section>

      {selectedProject && (
        <AllocationDialog
          project={selectedProject}
          walletBalance={availableCredits}
          onClose={() => setSelectedProjectId(null)}
          onConfirm={(amount) => completeAllocation(selectedProject, amount)}
        />
      )}
    </div>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4 py-3 first:pt-0 last:pb-0">
      <dt className="text-[13px] text-grey-600">{label}</dt>
      <dd className="text-[13px] font-bold tabular-nums text-grey-900">{value}</dd>
    </div>
  );
}

function MiniStat({
  icon: Icon,
  label,
  value,
  detail,
}: {
  icon: LucideIcon;
  label: string;
  value: string;
  detail: string;
}) {
  return (
    <Card className="p-5">
      <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-lighter text-primary-darker">
        <Icon size={19} aria-hidden="true" />
      </span>
      <p className="mt-4 text-[12px] font-semibold tracking-wide text-grey-500 uppercase">{label}</p>
      <p className="mt-1 text-[24px] font-bold tabular-nums text-grey-900">{value}</p>
      <p className="text-small mt-1">{detail}</p>
    </Card>
  );
}

function ProjectCard({
  project,
  walletBalance,
  onSelect,
}: {
  project: GreenProject;
  walletBalance: number;
  onSelect: () => void;
}) {
  const Icon = projectIcons[project.category];
  const progress = Math.min(100, (project.directedCredits / project.targetCredits) * 100);
  const remaining = Math.max(0, project.targetCredits - project.directedCredits);
  const fullyDirected = remaining === 0;

  return (
    <Card className="flex h-full flex-col overflow-hidden p-0">
      <div className="relative overflow-hidden bg-primary-darker p-5 text-white">
        <div className="absolute -top-12 -right-8 h-36 w-36 rounded-full bg-primary/35" />
        <div className="relative flex items-start justify-between gap-4">
          <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/12">
            <Icon size={24} aria-hidden="true" />
          </span>
          <span className="rounded-full bg-white/12 px-2.5 py-1 text-[11px] font-bold text-white/90">
            Sponsor-backed
          </span>
        </div>
        <h3 className="relative mt-5 text-[18px] font-bold leading-6">{project.title}</h3>
        <p className="relative mt-1 flex items-center gap-1.5 text-[12px] text-white/65">
          <MapPin size={13} aria-hidden="true" /> {project.location}
        </p>
      </div>

      <div className="flex flex-1 flex-col p-5">
        <p className="text-body">{project.description}</p>

        <div className="mt-5">
          <div className="flex items-center justify-between text-[12px] font-semibold text-grey-600">
            <span>{numberFormatter.format(project.directedCredits)} credits directed</span>
            <span>{Math.round(progress)}%</span>
          </div>
          <div className="mt-2 h-2 overflow-hidden rounded-full bg-grey-200">
            <div
              className="h-full rounded-full bg-primary transition-[width] duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        <dl className="mt-5 space-y-3 rounded-xl bg-grey-100 p-4">
          <ProjectDetail label="Sponsor" value={project.sponsorName} />
          <ProjectDetail
            label="Committed funding"
            value={currencyFormatter.format(project.sponsorCommitmentDollars)}
          />
          <ProjectDetail
            label="Matching rate"
            value={`$1 per ${project.creditsPerSponsorDollar} credits`}
          />
        </dl>

        <div className="mt-4 flex items-start gap-2 text-[12px] leading-5 text-grey-600">
          <ShieldCheck size={15} className="mt-0.5 shrink-0 text-primary" aria-hidden="true" />
          <span>
            <strong className="text-grey-800">Expected impact:</strong> {project.impactLabel}
            <span className="mt-1 block text-[11px] text-grey-500">
              Verified through {project.verificationMethod.toLowerCase()}.
            </span>
          </span>
        </div>

        <Button
          fullWidth
          className="mt-5"
          disabled={fullyDirected || walletBalance === 0}
          onClick={onSelect}
        >
          {fullyDirected ? "Target reached" : "Support this project"}
        </Button>
      </div>
    </Card>
  );
}

function ProjectDetail({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-3">
      <dt className="text-[12px] text-grey-500">{label}</dt>
      <dd className="max-w-[62%] text-right text-[12px] font-bold text-grey-800">{value}</dd>
    </div>
  );
}

function HowStep({
  number,
  icon: Icon,
  title,
  detail,
}: {
  number: string;
  icon: LucideIcon;
  title: string;
  detail: string;
}) {
  return (
    <li>
      <div className="flex items-center gap-2">
        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary-lighter text-primary-darker">
          <Icon size={17} aria-hidden="true" />
        </span>
        <span className="text-[11px] font-bold tracking-wider text-grey-400 uppercase">Step {number}</span>
      </div>
      <h3 className="mt-3 text-[14px] font-bold text-grey-900">{title}</h3>
      <p className="mt-1 text-[12px] leading-5 text-grey-600">{detail}</p>
    </li>
  );
}

function ActivityRow({ activity }: { activity: GreenCreditActivity }) {
  const earned = activity.type === "earned";
  const Icon = earned ? ArrowDownLeft : ArrowUpRight;

  return (
    <div className="flex items-start gap-3 py-4 first:pt-0 last:pb-0">
      <span
        className={cn(
          "flex h-9 w-9 shrink-0 items-center justify-center rounded-xl",
          earned ? "bg-success-light text-success" : "bg-info-light text-info"
        )}
      >
        <Icon size={17} aria-hidden="true" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-[13px] font-bold text-grey-900">{activity.title}</p>
        <p className="mt-0.5 text-[12px] leading-4 text-grey-500">{activity.detail}</p>
        <p className="mt-1 text-[11px] text-grey-400">{activity.date}</p>
      </div>
      <span
        className={cn(
          "shrink-0 text-[13px] font-bold tabular-nums",
          earned ? "text-success" : "text-grey-700"
        )}
      >
        {activity.credits > 0 ? "+" : ""}
        {numberFormatter.format(activity.credits)} cr
      </span>
    </div>
  );
}

function AllocationDialog({
  project,
  walletBalance,
  onClose,
  onConfirm,
}: {
  project: GreenProject;
  walletBalance: number;
  onClose: () => void;
  onConfirm: (amount: number) => void;
}) {
  const remaining = project.targetCredits - project.directedCredits;
  const defaultAmount = Math.min(500, walletBalance, remaining);
  const [amount, setAmount] = useState(String(defaultAmount));
  const [error, setError] = useState<string | null>(null);
  const parsedAmount = Number(amount);
  const previewCredits = Number.isInteger(parsedAmount) && parsedAmount > 0
    ? Math.min(parsedAmount, remaining)
    : 0;
  const previewFunding = sponsorFundingForCredits(
    previewCredits,
    project.creditsPerSponsorDollar
  );
  const partial = parsedAmount > remaining && previewCredits > 0;

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKeyDown);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  function submit() {
    try {
      allocateGreenCredits({
        requestedCredits: parsedAmount,
        availableCredits: walletBalance,
        projectRemainingCredits: remaining,
        creditsPerSponsorDollar: project.creditsPerSponsorDollar,
      });
      onConfirm(parsedAmount);
    } catch (allocationError) {
      setError(
        allocationError instanceof Error
          ? allocationError.message
          : "This allocation could not be completed."
      );
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-6">
      <button
        type="button"
        className="absolute inset-0 bg-[rgba(22,28,36,0.56)] backdrop-blur-[2px]"
        aria-label="Close allocation dialog"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="allocation-title"
        className="relative max-h-[92dvh] w-full overflow-y-auto rounded-t-3xl bg-surface p-6 shadow-hover sm:max-w-lg sm:rounded-3xl"
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-[11px] font-bold tracking-wider text-primary uppercase">Support project</p>
            <h2 id="allocation-title" className="text-h2 mt-1">
              {project.title}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-grey-200 text-grey-600 hover:bg-grey-300"
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>

        <div className="mt-5 flex items-center justify-between rounded-xl bg-grey-100 p-4">
          <span className="text-[13px] text-grey-600">Available balance</span>
          <span className="text-[15px] font-bold tabular-nums text-grey-900">
            {numberFormatter.format(walletBalance)} credits
          </span>
        </div>

        <label htmlFor="credit-amount" className="mt-5 block text-[13px] font-bold text-grey-800">
          Credits to allocate
        </label>
        <div className="relative mt-2">
          <input
            id="credit-amount"
            type="number"
            min="1"
            step="1"
            inputMode="numeric"
            value={amount}
            onChange={(event) => {
              setAmount(event.target.value);
              setError(null);
            }}
            className="h-12 w-full rounded-xl border border-line bg-surface px-4 pr-20 text-[16px] font-bold tabular-nums text-grey-900 focus:border-primary"
          />
          <span className="pointer-events-none absolute top-1/2 right-4 -translate-y-1/2 text-[12px] font-semibold text-grey-500">
            credits
          </span>
        </div>

        <div className="mt-3 grid grid-cols-4 gap-2">
          {[100, 250, 500].map((quickAmount) => (
            <button
              key={quickAmount}
              type="button"
              onClick={() => {
                setAmount(String(Math.min(quickAmount, walletBalance)));
                setError(null);
              }}
              className="h-9 rounded-lg bg-grey-200 text-[12px] font-bold text-grey-700 hover:bg-grey-300"
            >
              {quickAmount}
            </button>
          ))}
          <button
            type="button"
            onClick={() => {
              setAmount(String(walletBalance));
              setError(null);
            }}
            className="h-9 rounded-lg bg-grey-200 text-[12px] font-bold text-grey-700 hover:bg-grey-300"
          >
            Max
          </button>
        </div>

        <div className="mt-5 rounded-xl border border-dashed border-line p-4">
          <div className="flex items-center justify-between gap-4">
            <span className="text-[13px] text-grey-600">Credits directed</span>
            <span className="text-[13px] font-bold tabular-nums text-grey-900">
              {numberFormatter.format(previewCredits)}
            </span>
          </div>
          <div className="mt-3 flex items-center justify-between gap-4">
            <span className="text-[13px] text-grey-600">Sponsor funding unlocked</span>
            <span className="text-[15px] font-bold tabular-nums text-success">
              {currencyFormatter.format(previewFunding)}
            </span>
          </div>
          {partial && (
            <p className="mt-3 rounded-lg bg-warning-light p-3 text-[12px] leading-5 text-grey-700">
              This project only needs {numberFormatter.format(remaining)} more credits. The rest
              will stay in your wallet.
            </p>
          )}
        </div>

        {error && <p className="mt-3 text-[12px] font-semibold text-error">{error}</p>}

        <p className="mt-4 text-[12px] leading-5 text-grey-500">
          This allocation is permanent. Green credits have no cash value, and the sponsor pays
          the delivery partner separately under the published campaign terms.
        </p>

        <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={submit} disabled={!amount || previewCredits <= 0}>
            Confirm allocation
          </Button>
        </div>
      </div>
    </div>
  );
}
