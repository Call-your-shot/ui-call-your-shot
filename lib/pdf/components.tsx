import { Line, Polyline, StyleSheet, Svg, Text, View } from "@react-pdf/renderer";
import type { ReactNode } from "react";
import { color, font } from "@/lib/pdf/theme";

const styles = StyleSheet.create({
  header: {
    position: "absolute",
    top: 24,
    left: 56.7,
    right: 56.7,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingBottom: 6,
    borderBottom: "1px solid " + color.rule,
  },
  headerTitle: { fontSize: font.small, fontWeight: 700, color: color.ink },
  headerRef: { fontSize: font.small, color: color.body },
  footer: {
    position: "absolute",
    bottom: 20,
    left: 56.7,
    right: 56.7,
    flexDirection: "row",
    justifyContent: "space-between",
    fontSize: 8,
    color: color.body,
  },
  watermark: {
    position: "absolute",
    top: 380,
    left: 100,
    fontSize: 96,
    fontWeight: 700,
    color: color.ink,
    opacity: 0.08,
    transform: "rotate(-45deg)",
  },
  sectionHeading: {
    fontSize: font.section,
    fontWeight: 700,
    color: color.ink,
    marginTop: 18,
    marginBottom: 8,
  },
  clauseHeading: {
    fontSize: font.clause,
    fontWeight: 700,
    color: color.ink,
    marginTop: 12,
    marginBottom: 6,
  },
  clauseNumber: { color: color.body, marginRight: 4 },
  clauseBody: { fontSize: font.body, color: color.body, lineHeight: 1.5, marginBottom: 4 },
  subClauseBody: {
    fontSize: font.body,
    color: color.body,
    lineHeight: 1.5,
    marginBottom: 4,
    marginLeft: 14,
  },
  paraBody: { fontSize: font.body, color: color.body, lineHeight: 1.5, marginBottom: 8 },
  bold: { fontWeight: 700, color: color.ink },
  table: { marginTop: 8, marginBottom: 8, borderTop: "0.5px solid " + color.rule },
  tableHeadRow: { flexDirection: "row", backgroundColor: color.tableHead },
  tableRow: {
    flexDirection: "row",
    borderBottom: "0.5px solid " + color.rule,
  },
  tableCellHead: {
    fontSize: font.small,
    fontWeight: 700,
    color: color.ink,
    padding: 5,
  },
  tableCell: {
    fontSize: font.body,
    color: color.body,
    padding: 5,
  },
  tableCellNum: {
    fontSize: font.body,
    color: color.body,
    padding: 5,
    textAlign: "right",
  },
  tableCellNumBold: {
    fontSize: font.body,
    color: color.ink,
    fontWeight: 700,
    padding: 5,
    textAlign: "right",
  },
  chartAxisRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 24,
  },
  chartAxisLabel: { fontSize: 7, color: color.body },
});

export function PageHeader({ title, reference }: { title: string; reference: string }) {
  return (
    <View style={styles.header} fixed>
      <Text style={styles.headerTitle}>{title}</Text>
      <Text style={styles.headerRef}>{reference}</Text>
    </View>
  );
}

export function PageFooter({ generatedLabel }: { generatedLabel: string }) {
  return (
    <View style={styles.footer} fixed>
      <Text>{generatedLabel}</Text>
      <Text
        render={({ pageNumber, totalPages }) => `Page ${pageNumber} of ${totalPages}`}
      />
    </View>
  );
}

export function DraftWatermark({ show }: { show: boolean }) {
  if (!show) return null;
  return (
    <Text style={styles.watermark} fixed>
      DRAFT
    </Text>
  );
}

export function SectionHeading({ number, children }: { number: string; children: ReactNode }) {
  return (
    <Text style={styles.sectionHeading}>
      {number}. {children}
    </Text>
  );
}

export function ClauseHeading({ number, children }: { number: string; children: ReactNode }) {
  return (
    <Text style={styles.clauseHeading}>
      <Text style={styles.clauseNumber}>{number}. </Text>
      {children}
    </Text>
  );
}

export function Clause({ number, children }: { number?: string; children: ReactNode }) {
  return (
    <Text style={styles.clauseBody}>
      {number ? <Text style={styles.bold}>{number} </Text> : null}
      {children}
    </Text>
  );
}

export function SubClause({ letter, children }: { letter: string; children: ReactNode }) {
  return (
    <Text style={styles.subClauseBody}>
      <Text style={styles.bold}>({letter}) </Text>
      {children}
    </Text>
  );
}

export function Para({ children }: { children: ReactNode }) {
  return <Text style={styles.paraBody}>{children}</Text>;
}

export interface Column<T> {
  key: string;
  header: string;
  width: string | number;
  numeric?: boolean;
  bold?: boolean;
  render: (row: T) => string;
}

export function Table<T>({ columns, rows }: { columns: Column<T>[]; rows: T[] }) {
  return (
    <View style={styles.table} wrap>
      <View style={styles.tableHeadRow} fixed>
        {columns.map((c) => (
          <Text
            key={c.key}
            style={[styles.tableCellHead, { width: c.width, textAlign: c.numeric ? "right" : "left" }]}
          >
            {c.header}
          </Text>
        ))}
      </View>
      {rows.map((row, i) => (
        <View key={i} style={styles.tableRow} wrap={false}>
          {columns.map((c) => (
            <Text
              key={c.key}
              style={[
                c.numeric ? (c.bold ? styles.tableCellNumBold : styles.tableCellNum) : styles.tableCell,
                { width: c.width },
              ]}
            >
              {c.render(row)}
            </Text>
          ))}
        </View>
      ))}
    </View>
  );
}

export function KeyValueTable({ rows }: { rows: { label: string; value: string; bold?: boolean }[] }) {
  return (
    <View style={styles.table}>
      {rows.map((row, i) => (
        <View key={i} style={styles.tableRow} wrap={false}>
          <Text style={[styles.tableCell, { width: "60%" }]}>{row.label}</Text>
          <Text style={[row.bold ? styles.tableCellNumBold : styles.tableCellNum, { width: "40%" }]}>
            {row.value}
          </Text>
        </View>
      ))}
    </View>
  );
}

export function LineChart({
  points,
  width = 480,
  height = 140,
  zeroLine = true,
}: {
  points: { x: number; y: number }[];
  width?: number;
  height?: number;
  zeroLine?: boolean;
}) {
  const padding = 24;
  const xs = points.map((p) => p.x);
  const ys = points.map((p) => p.y);
  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  const minY = Math.min(0, ...ys);
  const maxY = Math.max(0, ...ys);
  const spanX = maxX - minX || 1;
  const spanY = maxY - minY || 1;

  const toSvgX = (x: number) => padding + ((x - minX) / spanX) * (width - padding * 2);
  const toSvgY = (y: number) => height - padding - ((y - minY) / spanY) * (height - padding * 2);

  const polylinePoints = points.map((p) => `${toSvgX(p.x)},${toSvgY(p.y)}`).join(" ");
  const zeroY = toSvgY(0);

  return (
    <View>
      <Svg width={width} height={height}>
        {zeroLine && (
          <Line x1={padding} y1={zeroY} x2={width - padding} y2={zeroY} stroke={color.rule} strokeWidth={1} />
        )}
        <Polyline points={polylinePoints} fill="none" stroke={color.accent} strokeWidth={2} />
      </Svg>
      <View style={styles.chartAxisRow}>
        {points.map((p, i) => (
          <Text key={i} style={styles.chartAxisLabel}>
            {`Y${p.x}`}
          </Text>
        ))}
      </View>
    </View>
  );
}
