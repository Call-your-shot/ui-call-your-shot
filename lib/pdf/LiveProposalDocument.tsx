import { Circle, Document, Image, Page, Path, StyleSheet, Svg, Text, View } from "@react-pdf/renderer";
import {
  DraftWatermark,
  KeyValueTable,
  PageFooter,
  PageHeader,
  Para,
  SectionHeading,
} from "@/lib/pdf/components";
import { color, font, page } from "@/lib/pdf/theme";
import type { ProposalPdfData } from "@/lib/pdf/live-data";

const styles = StyleSheet.create({
  page: {
    fontFamily: font.family,
    padding: page.marginPt,
    paddingBottom: 50,
    fontSize: font.body,
    color: color.body,
  },
  contentPage: {
    fontFamily: font.family,
    padding: page.marginPt,
    paddingTop: 70,
    paddingBottom: 50,
    fontSize: font.body,
    color: color.body,
  },
  logoRow: { alignItems: "center", marginTop: 42 },
  brand: { marginTop: 8, color: color.navy, fontWeight: 700, fontSize: 12, letterSpacing: 1.2 },
  title: { marginTop: 24, color: color.ink, fontSize: 27, fontWeight: 700, textAlign: "center" },
  subtitle: { marginTop: 7, color: color.body, fontSize: 12, textAlign: "center" },
  property: { marginTop: 24, color: color.navy, fontSize: 16, fontWeight: 700, textAlign: "center" },
  identityBox: {
    marginTop: 30,
    border: `1px solid ${color.rule}`,
    borderRadius: 5,
    padding: 16,
  },
  identityRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 16,
    borderBottom: `0.5px solid ${color.rule}`,
    paddingVertical: 6,
  },
  identityLabel: { width: "34%", color: color.body, fontSize: 9 },
  identityValue: { width: "66%", color: color.ink, fontSize: 9, fontWeight: 600, textAlign: "right" },
  headlineRow: { flexDirection: "row", gap: 10, marginTop: 18 },
  headlineCard: { flexGrow: 1, width: "50%", backgroundColor: color.accentLight, borderRadius: 5, padding: 13 },
  headlineLabel: { color: color.navy, fontSize: 8, textTransform: "uppercase", letterSpacing: 0.6 },
  headlineValue: { color: color.ink, fontSize: 19, fontWeight: 700, marginTop: 5 },
  headlineDetail: { color: color.body, fontSize: 8, marginTop: 4, lineHeight: 1.35 },
  qrRow: { alignItems: "center", marginTop: 22 },
  qrCaption: { fontSize: 8, color: color.body, marginTop: 4 },
  notice: { marginTop: "auto", border: `1px solid ${color.amber}`, borderRadius: 5, padding: 12 },
  noticeTitle: { color: color.ink, fontSize: 9, fontWeight: 700 },
  noticeText: { color: color.body, fontSize: 8, lineHeight: 1.45, marginTop: 3 },
  twoColumn: { flexDirection: "row", gap: 12 },
  column: { width: "50%" },
  metricBox: { border: `0.5px solid ${color.rule}`, borderRadius: 4, padding: 10, marginBottom: 8 },
  metricLabel: { color: color.body, fontSize: 8 },
  metricValue: { color: color.ink, fontWeight: 700, fontSize: 14, marginTop: 3 },
  metricDetail: { color: color.body, fontSize: 8, marginTop: 3, lineHeight: 1.35 },
  callout: { backgroundColor: color.tableHead, borderLeft: `3px solid ${color.accent}`, padding: 10, marginVertical: 8 },
  calloutTitle: { color: color.ink, fontWeight: 700, fontSize: 9 },
  calloutText: { color: color.body, fontSize: 9, lineHeight: 1.45, marginTop: 3 },
  listItem: { color: color.body, fontSize: 9, lineHeight: 1.5, marginBottom: 5 },
  warning: { border: `0.5px solid ${color.amber}`, borderRadius: 4, padding: 9, marginBottom: 6 },
  warningCode: { color: color.ink, fontSize: 8, fontWeight: 700 },
  warningText: { color: color.body, fontSize: 8, lineHeight: 1.4, marginTop: 2 },
  signatureRow: { flexDirection: "row", gap: 22, marginTop: 22 },
  signatureColumn: { width: "50%" },
  signatureLine: { borderBottom: `0.5px solid ${color.ink}`, height: 28, marginTop: 12 },
  signatureLabel: { color: color.body, fontSize: 8, marginTop: 4 },
});

const currency = new Intl.NumberFormat("en-AU", {
  style: "currency",
  currency: "AUD",
  maximumFractionDigits: 0,
});
const number = new Intl.NumberFormat("en-AU", { maximumFractionDigits: 0 });
const decimal = new Intl.NumberFormat("en-AU", { minimumFractionDigits: 1, maximumFractionDigits: 1 });
const date = new Intl.DateTimeFormat("en-AU", {
  day: "2-digit",
  month: "short",
  year: "numeric",
  timeZone: "Australia/Sydney",
});

function LogoMark({ size = 42 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 32 32">
      <Circle cx={16} cy={12} r={5.5} fill={color.amber} />
      <Path d="M3 27L13 15L19 21L24 15L29 27H3Z" fill={color.navy} />
    </Svg>
  );
}

function money(value: number | null): string {
  return value == null ? "Not available" : currency.format(value);
}

function percent(value: number | null): string {
  return value == null ? "Not available" : `${decimal.format(value * 100)}%`;
}

function payback(value: number | null): string {
  return value == null ? "Not reached in horizon" : `${decimal.format(value)} years`;
}

function statusLabel(status: string): string {
  return status.replaceAll("_", " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function Metric({ label, value, detail }: { label: string; value: string; detail: string }) {
  return (
    <View style={styles.metricBox} wrap={false}>
      <Text style={styles.metricLabel}>{label}</Text>
      <Text style={styles.metricValue}>{value}</Text>
      <Text style={styles.metricDetail}>{detail}</Text>
    </View>
  );
}

export function LiveProposalDocument({
  data,
  qrDataUrl,
}: {
  data: ProposalPdfData;
  qrDataUrl: string;
}) {
  const draft = data.status !== "accepted";
  const savings = data.tenantEconomics.annualSavings;
  const cashflow = data.landlordEconomics.firstYearCashflow;
  const solarShare = data.tenantEconomics.solarShare;
  const tenantRate = data.pricing.tenantSolarRate;
  const range = data.landlordEconomics.paybackRangeYears;

  return (
    <Document
      title={`${data.reference} - Solar Sharing Proposal`}
      author="SunShare"
      subject="Assessment-backed rooftop solar sharing proposal"
      keywords="solar, ROI, payback, tenant, landlord"
    >
      <Page size={page.size} style={styles.page}>
        <DraftWatermark show={draft} />
        <View style={styles.logoRow}>
          <LogoMark />
          <Text style={styles.brand}>SUNSHARE</Text>
        </View>
        <Text style={styles.title}>SOLAR SHARING PROPOSAL</Text>
        <Text style={styles.subtitle}>Assessment-backed investment and tenant savings summary</Text>
        <Text style={styles.property}>{data.propertyAddress}</Text>

        <View style={styles.identityBox}>
          {[
            ["Prepared for", `${data.landlordName} (${data.landlordEmail})`],
            ["Proposed by", `${data.tenantName} (${data.tenantEmail})`],
            ["Reference", data.reference],
            ["Proposal status", statusLabel(data.status)],
            ["Prepared", date.format(new Date(data.preparedDate))],
            ["Valid until", date.format(new Date(data.validUntilDate))],
          ].map(([label, value], index, rows) => (
            <View key={label} style={[styles.identityRow, index === rows.length - 1 ? { borderBottom: "none" } : {}]}>
              <Text style={styles.identityLabel}>{label}</Text>
              <Text style={styles.identityValue}>{value}</Text>
            </View>
          ))}
        </View>

        <View style={styles.headlineRow}>
          <View style={styles.headlineCard}>
            <Text style={styles.headlineLabel}>Median tenant saving</Text>
            <Text style={styles.headlineValue}>{money(savings?.median ?? null)} / year</Text>
            <Text style={styles.headlineDetail}>
              Simulation range P05-P95: {money(savings?.p05 ?? null)} to {money(savings?.p95 ?? null)}.
            </Text>
          </View>
          <View style={styles.headlineCard}>
            <Text style={styles.headlineLabel}>Median landlord payback</Text>
            <Text style={styles.headlineValue}>{payback(data.landlordEconomics.medianPaybackYears)}</Text>
            <Text style={styles.headlineDetail}>
              90% forecast interval: {payback(range.lower)} to {payback(range.upper)}.
            </Text>
          </View>
        </View>

        <View style={styles.qrRow}>
          {/* eslint-disable-next-line jsx-a11y/alt-text -- react-pdf Image is not an HTML image */}
          <Image src={qrDataUrl} style={{ width: 76, height: 76 }} />
          <Text style={styles.qrCaption}>Scan to review the live proposal</Text>
        </View>

        <View style={styles.notice}>
          <Text style={styles.noticeTitle}>Important forecast notice</Text>
          <Text style={styles.noticeText}>
            This proposal is an explainable feasibility estimate, not a quote, guarantee, confidence interval,
            contract, or financial advice. Forecast ranges are percentiles from simulated outcomes under the
            recorded assumptions. Installation design, rebates, tariffs, metering, legal terms and actual costs
            must be confirmed before either party signs a final agreement.
          </Text>
        </View>
        <PageFooter generatedLabel={`Generated ${date.format(new Date(data.preparedDate))}`} />
      </Page>

      <Page size={page.size} style={styles.contentPage} wrap>
        <PageHeader title="SOLAR SHARING PROPOSAL" reference={data.reference} />
        <DraftWatermark show={draft} />

        <SectionHeading number="1">System and energy estimate</SectionHeading>
        <KeyValueTable
          rows={[
            { label: "System size", value: `${decimal.format(data.system.systemSizeKw)} kW` },
            { label: "Panel configuration", value: `${data.system.panelCount} x ${data.system.panelWatts} W panels` },
            { label: "Expected annual generation", value: `${number.format(data.system.expectedAnnualGenerationKwh)} kWh` },
            { label: "Expected annual household usage", value: `${number.format(data.household.expectedAnnualUsageKwh)} kWh` },
            { label: "Roof estimate source", value: data.system.source },
            { label: "Imagery quality", value: data.system.imageryQuality ?? "Not recorded" },
          ]}
        />

        <SectionHeading number="2">Tenant outcome</SectionHeading>
        <View style={styles.twoColumn}>
          <View style={styles.column}>
            <Metric
              label="Median annual saving"
              value={money(savings?.median ?? null)}
              detail={`P05-P95: ${money(savings?.p05 ?? null)} to ${money(savings?.p95 ?? null)}`}
            />
            <Metric
              label="Median projected annual electricity cost"
              value={money(data.tenantEconomics.projectedAnnualCost?.median ?? null)}
              detail={`Current baseline: ${money(data.household.baselineAnnualBillDollars)}`}
            />
          </View>
          <View style={styles.column}>
            <Metric
              label="Median solar share of usage"
              value={percent(solarShare?.median ?? null)}
              detail={`P05-P95: ${percent(solarShare?.p05 ?? null)} to ${percent(solarShare?.p95 ?? null)}`}
            />
            <Metric
              label="Probability tenant saves money"
              value={percent(data.tenantEconomics.probabilitySavesMoney)}
              detail="Share of simulated outcomes with positive tenant savings."
            />
          </View>
        </View>

        <SectionHeading number="3">Landlord outcome</SectionHeading>
        <View style={styles.twoColumn}>
          <View style={styles.column}>
            <Metric
              label="Net installation investment"
              value={money(data.landlordEconomics.netInstallationCostDollars)}
              detail="Gross installation cost less recorded upfront rebates."
            />
            <Metric
              label="Median first-year net cash flow"
              value={money(cashflow?.median ?? null)}
              detail={`P05-P95: ${money(cashflow?.p05 ?? null)} to ${money(cashflow?.p95 ?? null)}`}
            />
          </View>
          <View style={styles.column}>
            <Metric
              label="Median payback"
              value={payback(data.landlordEconomics.medianPaybackYears)}
              detail={`90% forecast interval: ${payback(range.lower)} to ${payback(range.upper)}`}
            />
            <Metric
              label="Probability of payback"
              value={`${percent(data.landlordEconomics.probabilityPaybackWithin7Years)} by year 7`}
              detail={`${percent(data.landlordEconomics.probabilityPaybackWithin10Years)} by year 10`}
            />
          </View>
        </View>

        <PageFooter generatedLabel={`Generated ${date.format(new Date(data.preparedDate))}`} />
      </Page>

      <Page size={page.size} style={styles.contentPage} wrap>
        <PageHeader title="SOLAR SHARING PROPOSAL" reference={data.reference} />
        <DraftWatermark show={draft} />

        <SectionHeading number="4">Pricing approach</SectionHeading>
        <KeyValueTable
          rows={[
            { label: "Pricing mode", value: statusLabel(data.pricing.mode) },
            { label: "Median modelled tenant solar rate", value: tenantRate ? `${decimal.format(tenantRate.median)} cents/kWh` : "Not available" },
            { label: "Grid comparison rate", value: `${decimal.format(data.pricing.gridRateCentsPerKwh)} cents/kWh` },
            { label: "Export feed-in tariff", value: data.pricing.exportRateCentsPerKwh == null ? "Not available" : `${decimal.format(data.pricing.exportRateCentsPerKwh)} cents/kWh` },
          ]}
        />
        <View style={styles.callout}>
          <Text style={styles.calloutTitle}>Dynamic pricing boundary</Text>
          <Text style={styles.calloutText}>
            The proposal uses an assumption-based approximation for feasibility. Once interval meter data is
            available, the pricing service calculates the tenant solar charge hour by hour. Only solar consumed
            by the tenant is charged at the tenant solar rate. Exported solar is valued separately at the feed-in tariff.
          </Text>
        </View>
        <SectionHeading number="5">How the estimate was produced</SectionHeading>
        <Para>
          Instead of treating one future result as certain, the assessment simulated plausible solar generation,
          household demand, self-consumption, tariffs and operating costs. It then calculated monthly cash flow
          and the point at which cumulative landlord revenue recovered the net installation investment.
        </Para>
        <KeyValueTable
          rows={[
            { label: "Forecast source", value: "Assumption-based Monte Carlo simulation" },
            { label: "Simulation iterations", value: data.simulation.iterations?.toLocaleString("en-AU") ?? "Not available" },
            { label: "Forecast horizon", value: data.simulation.forecastYears == null ? "Not available" : `${data.simulation.forecastYears} years` },
            { label: "Random seed", value: data.simulation.randomSeed == null ? "Not supplied" : String(data.simulation.randomSeed) },
            { label: "Probability of no payback in horizon", value: percent(data.simulation.probabilityNoPayback) },
            { label: "Assessment recommendation", value: statusLabel(data.recommendation) },
            { label: "Assessment reference", value: data.assessmentId ?? "Legacy proposal" },
          ]}
        />

        <SectionHeading number="6">Fairness and commercial principles</SectionHeading>
        {[
          "The tenant solar rate should remain below the comparable grid rate for the same interval.",
          "Tenant solar consumption cannot exceed generation or tenant electricity demand.",
          "The landlord receives tenant solar revenue and actual feed-in tariff revenue, less operating costs.",
          "Exported electricity is not treated as tenant consumption and is not charged to the tenant.",
          "A tenant does not inherit or personally guarantee the property's remaining solar investment balance.",
          "All final prices, ownership obligations, maintenance terms and exit rights require a separate signed agreement.",
        ].map((item, index) => (
          <Text key={item} style={styles.listItem}>{`${index + 1}. ${item}`}</Text>
        ))}

        <PageFooter generatedLabel={`Generated ${date.format(new Date(data.preparedDate))}`} />
      </Page>

      <Page size={page.size} style={styles.contentPage} wrap>
        <PageHeader title="SOLAR SHARING PROPOSAL" reference={data.reference} />
        <DraftWatermark show={draft} />

        <SectionHeading number="7">Items requiring confirmation</SectionHeading>
        {data.reviewReasons.map((reason) => (
          <View key={reason} style={styles.warning} wrap={false}>
            <Text style={styles.warningCode}>MANUAL REVIEW</Text>
            <Text style={styles.warningText}>{reason}</Text>
          </View>
        ))}
        {data.warnings.map((warning) => (
          <View key={`${warning.code}-${warning.message}`} style={styles.warning} wrap={false}>
            <Text style={styles.warningCode}>{warning.code}</Text>
            <Text style={styles.warningText}>{warning.message}</Text>
          </View>
        ))}
        {data.reviewReasons.length === 0 && data.warnings.length === 0 && (
          <Para>No model warnings were recorded. A site inspection, installer quote and legal review are still required.</Para>
        )}

        <SectionHeading number="8">What happens next</SectionHeading>
        {[
          "The property owner reviews the proposal, forecast assumptions and outstanding confirmation items.",
          "A qualified installer completes a site inspection and provides a final system design and quote.",
          "Both parties review the final commercial, tenancy, maintenance and metering terms independently.",
          "Installation proceeds only after the required final documents and regulatory checks are complete.",
        ].map((item, index) => (
          <Text key={item} style={styles.listItem}>{`${index + 1}. ${item}`}</Text>
        ))}

        <SectionHeading number="9">Proposal acknowledgement</SectionHeading>
        <Para>
          Signing below records acknowledgement of this proposal only. It does not replace the final solar supply,
          installation, tenancy, finance or energy retail documents required before installation.
        </Para>
        <KeyValueTable
          rows={[
            { label: "Property", value: data.propertyAddress },
            { label: "Property owner", value: `${data.landlordName} - ${data.landlordEmail}` },
            { label: "Tenant", value: `${data.tenantName} - ${data.tenantEmail}` },
            { label: "Proposal reference", value: data.reference },
            { label: "Proposal status", value: statusLabel(data.status) },
          ]}
        />
        <View style={styles.signatureRow} wrap={false}>
          <View style={styles.signatureColumn}>
            <Text>{data.landlordName}</Text>
            <View style={styles.signatureLine} />
            <Text style={styles.signatureLabel}>Property owner signature</Text>
            <View style={styles.signatureLine} />
            <Text style={styles.signatureLabel}>Date</Text>
          </View>
          <View style={styles.signatureColumn}>
            <Text>{data.tenantName}</Text>
            <View style={styles.signatureLine} />
            <Text style={styles.signatureLabel}>Tenant signature</Text>
            <View style={styles.signatureLine} />
            <Text style={styles.signatureLabel}>Date</Text>
          </View>
        </View>
        <PageFooter generatedLabel={`Generated ${date.format(new Date(data.preparedDate))}`} />
      </Page>
    </Document>
  );
}
