import { Page, StyleSheet, Text } from "@react-pdf/renderer";
import { color, font, page } from "@/lib/pdf/theme";
import {
  Column,
  DraftWatermark,
  KeyValueTable,
  LineChart,
  PageFooter,
  PageHeader,
  Para,
  SectionHeading,
  Table,
} from "@/lib/pdf/components";
import { formatCurrency, formatDate } from "@/lib/mockData";
import type { OccupantMonthRow, OwnerYearRow, ProposalPdfData } from "@/lib/pdf/data";

const styles = StyleSheet.create({
  page: {
    fontFamily: font.family,
    padding: page.marginPt,
    paddingTop: 70,
    paddingBottom: 50,
    fontSize: font.body,
    color: color.body,
  },
  subheading: { fontSize: 11, fontWeight: 700, color: color.ink, marginTop: 10, marginBottom: 4 },
  list: { marginTop: 4, marginBottom: 6 },
  listItem: { fontSize: font.body, color: color.body, lineHeight: 1.5, marginBottom: 3 },
  chartCaption: { fontSize: 8, color: color.body, marginTop: 4 },
});

const ownerYearColumns: Column<OwnerYearRow>[] = [
  { key: "year", header: "Year", width: "12%", render: (r) => `Year ${r.year}` },
  { key: "opening", header: "Opening balance", width: "22%", numeric: true, render: (r) => formatCurrency(r.opening) },
  { key: "income", header: "Income received", width: "22%", numeric: true, render: (r) => formatCurrency(r.income) },
  {
    key: "reserve",
    header: "Reserve contribution",
    width: "22%",
    numeric: true,
    render: (r) => `− ${formatCurrency(r.reserveContribution)}`,
  },
  {
    key: "closing",
    header: "Closing balance",
    width: "22%",
    numeric: true,
    bold: true,
    render: (r) => formatCurrency(r.closing),
  },
];

const occupantMonthColumns: Column<OccupantMonthRow>[] = [
  { key: "month", header: "Month", width: "28%", render: (r) => r.month },
  {
    key: "grid",
    header: "Grid-only cost",
    width: "24%",
    numeric: true,
    render: (r) => formatCurrency(r.gridOnlyCost, { cents: true }),
  },
  {
    key: "agreement",
    header: "Cost under agreement",
    width: "24%",
    numeric: true,
    render: (r) => formatCurrency(r.agreementCost, { cents: true }),
  },
  {
    key: "saving",
    header: "Saving",
    width: "24%",
    numeric: true,
    bold: true,
    render: (r) => formatCurrency(r.saving, { cents: true }),
  },
];

export function PartA({ data, showWatermark }: { data: ProposalPdfData; showWatermark: boolean }) {
  const r = data.scenario.results!;
  const roof = data.scenario.roof;

  return (
    <Page size={page.size} style={styles.page} wrap>
      <PageHeader title="SOLAR SUPPLY AGREEMENT" reference={data.reference} />
      <DraftWatermark show={showWatermark} />

      <SectionHeading number="A1">Summary</SectionHeading>
      <Para>
        {data.ownerName} is invited to fund a {roof.systemSizeKw} kW solar system at{" "}
        {data.propertyAddress}. {data.occupantName} pays for the solar power it produces at a
        reduced rate, repaying the investment over time. Once repaid, the rate {data.occupantName}{" "}
        pays drops permanently to the Post-Completion Rate of {data.postCompletionRateCents} cents
        per kilowatt hour — still well under grid price — for the remaining life of the system,
        and {data.ownerName} continues to earn income at that rate rather than none at all.
      </Para>
      <KeyValueTable
        rows={[
          { label: "System size", value: `${roof.systemSizeKw} kW (${roof.panelCount} panels)` },
          { label: "Estimated annual generation", value: `${data.annualGenerationKwh.toLocaleString("en-AU")} kWh` },
          { label: "Total installed cost", value: formatCurrency(r.systemCost) },
          { label: "Federal STC solar rebate", value: `− ${formatCurrency(r.federalRebate)}` },
          { label: "Net investment", value: formatCurrency(r.netLandlordInvestment), bold: true },
          { label: "Estimated annual income to Owner", value: formatCurrency(data.annualIncomeToOwner) },
          { label: "Estimated return", value: `${r.landlordReturnPercent}% p.a.` },
          { label: "Estimated recovery period", value: data.recoveryPeriodLabel },
          { label: "Estimated annual saving to Occupant", value: formatCurrency(data.occupantAnnualSaving) },
        ]}
      />

      <SectionHeading number="A2">The property and roof</SectionHeading>
      <Para>
        {data.propertyAddress}. The system is sited on the {roof.usableFace.toLowerCase()}, pitched at{" "}
        {roof.pitchDegrees}° and oriented {roof.orientation.toLowerCase()}.
      </Para>
      <KeyValueTable
        rows={[
          { label: "Roof face used", value: roof.usableFace },
          { label: "Orientation", value: roof.orientation },
          { label: "Pitch", value: `${roof.pitchDegrees}°` },
          { label: "Panel layout", value: `${roof.panelCount} panels, ${roof.systemSizeKw} kW total` },
          { label: "Imagery source", value: data.imagery.source },
          { label: "Imagery date", value: formatDate(data.imagery.date.toISOString()) },
          { label: "Imagery quality", value: data.imagery.quality },
        ]}
      />
      {data.imagery.quality !== "HIGH" && (
        <Para>
          Note: imagery quality for this property is {data.imagery.quality}, not HIGH. Panel
          layout and generation estimates carry wider uncertainty as a result.
        </Para>
      )}

      <SectionHeading number="A3">Why this arrangement exists</SectionHeading>
      <Para>
        Solar on rental properties is rare, because the owner pays for the system but the occupant
        receives the bill saving — the two people who would normally negotiate a return on
        investment are different people entirely.
      </Para>
      <Para>
        Energy used inside the home is worth roughly {data.gridRateCents}c per unit to the
        occupant; energy exported to the grid earns roughly {data.exportRateCents}c. That gap is
        the value this agreement shares.
      </Para>
      <Para>
        Under this agreement, {data.occupantName} pays about half the grid price
        ({data.tariffRateCents}c against {data.gridRateCents}c), and {data.ownerName} earns roughly
        three times the export rate for the same energy ({data.tariffRateCents}c against{" "}
        {data.exportRateCents}c) — turning a rooftop neither party could otherwise finance into a
        return for the Owner and a saving for the Occupant.
      </Para>

      <SectionHeading number="A4">Financial projection — Owner</SectionHeading>
      <Para>
        Year-by-year position of the Recovery Balance, from commencement to full repayment.
      </Para>
      <Table columns={ownerYearColumns} rows={data.ownerYearRows} />
      <LineChart points={data.ownerYearRows.map((row) => ({ x: row.year, y: row.closing }))} />
      <Text style={styles.chartCaption}>
        Owner position over time — balance reaches zero around {data.recoveryPeriodLabel}.
      </Text>

      <SectionHeading number="A5">Financial projection — Occupant</SectionHeading>
      <Para>Monthly comparison of estimated cost with and without this agreement.</Para>
      <Table columns={occupantMonthColumns} rows={data.occupantMonthRows} />
      <KeyValueTable
        rows={[
          { label: "Annual saving", value: formatCurrency(data.occupantAnnualSaving), bold: true },
          {
            label: `Full-term saving (${data.termYears} years)`,
            value: formatCurrency(data.occupantFullTermSaving),
            bold: true,
          },
        ]}
      />

      <SectionHeading number="A6">Maintenance and equipment life</SectionHeading>
      <KeyValueTable
        rows={[
          { label: "Panels — expected life", value: `${data.systemSpec.panelWarrantyYears} years` },
          {
            label: "Inverter — expected life / replacement cost",
            value: `${data.systemSpec.inverterExpectedLifeYears} years, ~${formatCurrency(
              data.systemSpec.inverterReplacementCost
            )}`,
          },
          { label: "Monitoring", value: data.systemSpec.monitoring },
          { label: "Monthly reserve contribution", value: formatCurrency(data.monthlyReserveContribution) },
          {
            label: "Projected reserve balance at 20 years",
            value: formatCurrency(data.reserveYearRows[data.reserveYearRows.length - 1]?.balance ?? 0),
          },
        ]}
      />

      <SectionHeading number="A7">Assumptions</SectionHeading>
      <Para>
        Every figure in this proposal is built from one of the inputs below. Where a figure is
        modelled rather than measured, its source is given so both parties can check it.
      </Para>
      <Table
        columns={[
          { key: "label", header: "Assumption", width: "30%", render: (a) => a.label },
          { key: "value", header: "Value", width: "28%", render: (a) => a.value },
          { key: "source", header: "Source", width: "42%", render: (a) => a.source },
        ]}
        rows={data.assumptions}
      />

      <PageFooter generatedLabel={`Generated ${formatDate(data.preparedDate.toISOString())}`} />
    </Page>
  );
}
