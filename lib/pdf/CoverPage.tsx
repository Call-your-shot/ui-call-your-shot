import path from "node:path";
import { Image, Page, StyleSheet, Text, View } from "@react-pdf/renderer";
import { color, font, page } from "@/lib/pdf/theme";
import { PageFooter, DraftWatermark } from "@/lib/pdf/components";
import { formatDate } from "@/lib/mockData";
import type { ProposalPdfData } from "@/lib/pdf/data";

const LOGO_PATH = path.join(process.cwd(), "public", "logo.png");
const LOGO_ASPECT_RATIO = 1024 / 1536;

const styles = StyleSheet.create({
  page: {
    fontFamily: font.family,
    padding: page.marginPt,
    paddingBottom: 50,
    fontSize: font.body,
    color: color.body,
  },
  logoRow: { alignItems: "center", marginTop: 60 },
  title: {
    fontSize: 26,
    fontWeight: 700,
    color: color.ink,
    textAlign: "center",
    marginTop: 24,
    letterSpacing: 1,
  },
  subtitle: {
    fontSize: 13,
    color: color.body,
    textAlign: "center",
    marginTop: 8,
    fontStyle: "italic",
  },
  summaryBox: {
    marginTop: 56,
    marginHorizontal: 24,
    border: "1px solid " + color.rule,
    borderRadius: 4,
    padding: 20,
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    borderBottom: "0.5px solid " + color.rule,
    paddingVertical: 7,
  },
  summaryLabel: { fontSize: font.body, color: color.body },
  summaryValue: { fontSize: font.body, fontWeight: 700, color: color.ink },
  qrRow: { alignItems: "center", marginTop: 28 },
  qrCaption: { fontSize: 8, color: color.body, marginTop: 4 },
  notice: {
    marginTop: "auto",
    marginHorizontal: 24,
    marginBottom: 12,
    border: "1px solid " + color.ink,
    borderRadius: 4,
    padding: 14,
  },
  noticeText: { fontSize: 9, color: color.body, lineHeight: 1.5 },
  noticeBold: { fontWeight: 700, color: color.ink },
});

function LogoMark({ width = 110 }: { width?: number }) {
  // eslint-disable-next-line jsx-a11y/alt-text -- @react-pdf/renderer Image, not an HTML img; renders to a PDF, not a DOM
  return <Image src={LOGO_PATH} style={{ width, height: width * LOGO_ASPECT_RATIO }} />;
}

export function CoverPage({
  data,
  qrDataUrl,
  qrCaption,
  showWatermark,
}: {
  data: ProposalPdfData;
  qrDataUrl: string;
  qrCaption?: string;
  showWatermark: boolean;
}) {
  return (
    <Page size={page.size} style={styles.page}>
      <DraftWatermark show={showWatermark} />

      <View style={styles.logoRow}>
        <LogoMark />
      </View>
      <Text style={styles.title}>SOLAR SUPPLY AGREEMENT</Text>
      <Text style={styles.subtitle}>Proposal and Draft Terms</Text>

      <View style={styles.summaryBox}>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Property</Text>
          <Text style={styles.summaryValue}>{data.propertyAddress}</Text>
        </View>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Owner</Text>
          <Text style={styles.summaryValue}>{data.ownerName}</Text>
        </View>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Occupant</Text>
          <Text style={styles.summaryValue}>{data.occupantName}</Text>
        </View>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Reference</Text>
          <Text style={styles.summaryValue}>{data.reference}</Text>
        </View>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Prepared</Text>
          <Text style={styles.summaryValue}>{formatDate(data.preparedDate.toISOString())}</Text>
        </View>
        <View style={[styles.summaryRow, { borderBottom: "none" }]}>
          <Text style={styles.summaryLabel}>Valid until</Text>
          <Text style={styles.summaryValue}>{formatDate(data.validUntilDate.toISOString())}</Text>
        </View>
      </View>

      <View style={styles.qrRow}>
        {/* eslint-disable-next-line jsx-a11y/alt-text -- @react-pdf/renderer Image, not an HTML img; renders to a PDF, not a DOM */}
        <Image src={qrDataUrl} style={{ width: 76, height: 76 }} />
        <Text style={styles.qrCaption}>{qrCaption ?? "Scan to view the live plan online"}</Text>
      </View>

      <View style={styles.notice}>
        <Text style={styles.noticeText}>
          <Text style={styles.noticeBold}>IMPORTANT — THIS IS A DRAFT. </Text>
          This document is generated as a template and does not constitute legal or
          financial advice. Before signing, both parties should obtain independent legal
          advice and confirm compliance with the National Energy Retail Law and the
          Australian Energy Regulator&apos;s retail exemption framework. The Owner may be
          required to register as an exempt seller before supplying energy under this
          agreement.
        </Text>
      </View>

      <PageFooter generatedLabel={`Generated ${formatDate(data.preparedDate.toISOString())}`} />
    </Page>
  );
}
