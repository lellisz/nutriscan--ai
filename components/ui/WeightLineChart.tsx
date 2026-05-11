import React from "react";
import { View, Text, StyleSheet } from "react-native";
import Svg, { Polyline, Circle, Line, Text as SvgText } from "react-native-svg";
import { Colors, fonts } from "@/constants/design";

interface DataPoint { date: string; value: number; }

interface WeightLineChartProps {
  data: DataPoint[];
  height?: number;
  color?: string;
}

export const WeightLineChart = React.memo(function WeightLineChart({ data, height = 160, color = Colors.gold }: WeightLineChartProps) {
  if (data.length < 2) {
    return (
      <View style={[styles.empty, { height }]}>
        <Text style={styles.emptyText}>Sem dados suficientes</Text>
      </View>
    );
  }

  const PAD = { top: 12, bottom: 28, left: 36, right: 12 };
  const W = 300;
  const chartW = W - PAD.left - PAD.right;
  const chartH = height - PAD.top - PAD.bottom;

  const values = data.map((d) => d.value);
  const minV = Math.min(...values) - 0.5;
  const maxV = Math.max(...values) + 0.5;

  const toX = (i: number) => PAD.left + (i / (data.length - 1)) * chartW;
  const toY = (v: number) => PAD.top + chartH - ((v - minV) / (maxV - minV)) * chartH;

  const points = data.map((d, i) => `${toX(i)},${toY(d.value)}`).join(" ");
  const gridLines = [0, 0.5, 1].map((t) => minV + t * (maxV - minV));

  return (
    <View style={{ height }}>
      <Svg width="100%" height={height} viewBox={`0 0 ${W} ${height}`}>
        {gridLines.map((v, i) => (
          <Line key={i} x1={PAD.left} y1={toY(v)} x2={W - PAD.right} y2={toY(v)}
            stroke={Colors.b1} strokeWidth={1} strokeDasharray="3,3" />
        ))}
        {gridLines.map((v, i) => (
          <SvgText key={i} x={PAD.left - 4} y={toY(v) + 3}
            fontSize={8} fill={Colors.t4} textAnchor="end">{v.toFixed(1)}</SvgText>
        ))}
        <Polyline points={points} fill="none" stroke={color} strokeWidth={1.5} />
        {data.map((d, i) => (
          <Circle key={i} cx={toX(i)} cy={toY(d.value)} r={3} fill={color} />
        ))}
        {data.filter((_, i) => i === 0 || i === data.length - 1).map((d, idx) => {
          const i = idx === 0 ? 0 : data.length - 1;
          const label = new Date(d.date + "T12:00:00").toLocaleDateString("pt-BR", { day: "numeric", month: "short" });
          return (
            <SvgText key={i} x={toX(i)} y={height - 4}
              fontSize={8} fill={Colors.t4} textAnchor="middle">{label}</SvgText>
          );
        })}
      </Svg>
    </View>
  );
});

const styles = StyleSheet.create({
  empty: { alignItems: "center", justifyContent: "center" },
  emptyText: { fontFamily: fonts.sansLight, fontSize: 12, color: Colors.t4 },
});
