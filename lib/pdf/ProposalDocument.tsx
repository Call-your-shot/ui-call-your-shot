import { Document } from "@react-pdf/renderer";
import { CoverPage } from "@/lib/pdf/CoverPage";
import { PartA } from "@/lib/pdf/PartA";
import { PartB } from "@/lib/pdf/PartB";
import { Schedules } from "@/lib/pdf/Schedules";
import type { ProposalPdfData } from "@/lib/pdf/data";

export function ProposalDocument({ data, qrDataUrl }: { data: ProposalPdfData; qrDataUrl: string }) {
  const showWatermark = data.plan.status !== "active";

  return (
    <Document title={`${data.reference} — Solar Supply Agreement`} author="SunShare">
      <CoverPage data={data} qrDataUrl={qrDataUrl} showWatermark={showWatermark} />
      <PartA data={data} showWatermark={showWatermark} />
      <PartB data={data} showWatermark={showWatermark} />
      <Schedules data={data} showWatermark={showWatermark} />
    </Document>
  );
}
