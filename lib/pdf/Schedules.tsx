import { Page, StyleSheet, Text } from "@react-pdf/renderer";
import { color, font, page } from "@/lib/pdf/theme";
import {
  Column,
  DraftWatermark,
  KeyValueTable,
  PageFooter,
  PageHeader,
  Para,
  SectionHeading,
  Table,
} from "@/lib/pdf/components";
import { formatCurrency, formatDate } from "@/lib/mockData";
import type { AssumptionRow, ProposalPdfData, ReserveYearRow } from "@/lib/pdf/data";

const styles = StyleSheet.create({
  page: {
    fontFamily: font.family,
    padding: page.marginPt,
    paddingTop: 70,
    paddingBottom: 50,
    fontSize: font.body,
    color: color.body,
  },
  partTitle: { fontSize: 20, fontWeight: 700, color: color.ink, marginBottom: 12 },
});

const reserveColumns: Column<ReserveYearRow>[] = [
  { key: "year", header: "Year", width: "14%", render: (r) => `Year ${r.year}` },
  { key: "event", header: "Event", width: "40%", render: (r) => r.event ?? "—" },
  {
    key: "cost",
    header: "Event cost",
    width: "18%",
    numeric: true,
    render: (r) => (r.eventCost ? formatCurrency(r.eventCost) : "—"),
  },
  {
    key: "balance",
    header: "Reserve balance",
    width: "28%",
    numeric: true,
    bold: true,
    render: (r) => formatCurrency(r.balance),
  },
];

const assumptionColumns: Column<AssumptionRow>[] = [
  { key: "label", header: "Input", width: "30%", render: (a) => a.label },
  { key: "value", header: "Value", width: "28%", render: (a) => a.value },
  { key: "source", header: "Source", width: "42%", render: (a) => a.source },
];

export function Schedules({ data, showWatermark }: { data: ProposalPdfData; showWatermark: boolean }) {
  const d = data;
  const w = d.workedExample;

  return (
    <Page size={page.size} style={styles.page} wrap>
      <PageHeader title="SOLAR SUPPLY AGREEMENT" reference={d.reference} />
      <DraftWatermark show={showWatermark} />

      <Text style={styles.partTitle}>Schedules</Text>

      <SectionHeading number="Schedule 1">System specification</SectionHeading>
      <KeyValueTable
        rows={[
          { label: "Panel make / model", value: d.systemSpec.panelModel },
          { label: "Panel count", value: `${d.systemSpec.panelCount}` },
          { label: "Panel wattage", value: `${d.systemSpec.panelWattage} W` },
          { label: "System size", value: `${d.systemSpec.systemSizeKw} kW` },
          { label: "Inverter", value: d.systemSpec.inverterModel },
          { label: "Install date", value: formatDate(d.systemSpec.installDate.toISOString()) },
          { label: "Installer", value: d.systemSpec.installer },
          { label: "Panel warranty (performance)", value: `${d.systemSpec.panelWarrantyYears} years` },
          { label: "Inverter warranty", value: `${d.systemSpec.inverterWarrantyYears} years` },
          { label: "Workmanship warranty", value: `${d.systemSpec.workmanshipWarrantyYears} years` },
          { label: "Monitoring", value: d.systemSpec.monitoring },
        ]}
      />

      <SectionHeading number="Schedule 2">Financial assumptions</SectionHeading>
      <Para>Cross-referenced from A7 — every input behind the figures in this document.</Para>
      <Table columns={assumptionColumns} rows={d.assumptions} />

      <SectionHeading number="Schedule 3">Maintenance schedule</SectionHeading>
      <Para>Expected servicing and replacement events, and the Reserve balance after each.</Para>
      <Table columns={reserveColumns} rows={d.reserveYearRows} />

      <SectionHeading number="Schedule 4">Worked example — {w.label}</SectionHeading>
      <Para>
        One sample Billing Period, showing metered figures, the grid comparison under clause 6,
        the charge calculation, and the resulting Recovery Balance movement.
      </Para>
      <KeyValueTable
        rows={[
          { label: "Solar Energy used", value: `${w.solarUsedKwh} kWh` },
          { label: "Charge for Solar Energy (at Tariff Rate)", value: formatCurrency(w.solarChargeDollars, { cents: true }) },
          { label: "Grid energy used", value: `${w.gridUsedKwh} kWh` },
          { label: "Charge for grid energy (retailer)", value: formatCurrency(w.gridChargeDollars, { cents: true }) },
          { label: "Total charged this period", value: formatCurrency(w.totalDollars, { cents: true }), bold: true },
          { label: "Cost without this Agreement (clause 6 comparison)", value: formatCurrency(w.withoutSolarDollars, { cents: true }) },
          { label: "Saving this period", value: formatCurrency(w.savingsDollars, { cents: true }), bold: true },
          { label: `Free-window energy (${w.freeWindowLabel})`, value: `${w.freeWindowKwh} kWh at no charge` },
          { label: "Reserve contribution this period", value: formatCurrency(w.reserveContribution) },
          { label: "Recovery Balance before this period", value: formatCurrency(w.recoveryBalanceBefore), bold: true },
          { label: "Recovery Balance movement", value: `− ${formatCurrency(w.recoveryBalanceMovement)}` },
          { label: "Recovery Balance after this period", value: formatCurrency(w.recoveryBalanceAfter), bold: true },
        ]}
      />

      <PageFooter generatedLabel={`Generated ${formatDate(d.preparedDate.toISOString())}`} />
    </Page>
  );
}
