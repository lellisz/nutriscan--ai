import React from 'react';
import Svg, { Path, Circle, Line, G, Polygon } from 'react-native-svg';
import { Colors } from '@/constants/design';

// ─── PRAXIS TAB ICONS ─────────────────────────────────────────────────────────
// Premium editorial icon set — stroke 1.4px, 22×22, warm ivory palette
// Each icon has active (opacity 1.0) and inactive (opacity 0.28) states
// Designed specifically for Praxis health app — not generic Material/iOS icons

interface IconProps {
  active: boolean;
}

// ─── HOME ─────────────────────────────────────────────────────────────────────
// Concept: Portal / threshold — two vertical pillars with a clean arch above.
// More architectural and abstract than a standard house shape.
export function IconHome({ active }: IconProps) {
  const c = Colors.t1;
  const o = active ? 1 : 0.28;
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24" fill="none" opacity={o}>
      {/* Left pillar */}
      <Line
        x1={6} y1={11} x2={6} y2={21}
        stroke={c} strokeWidth={1.4} strokeLinecap="round"
      />
      {/* Right pillar */}
      <Line
        x1={18} y1={11} x2={18} y2={21}
        stroke={c} strokeWidth={1.4} strokeLinecap="round"
      />
      {/* Arch spanning the two pillars */}
      <Path
        d="M6 11 C6 5.5 18 5.5 18 11"
        stroke={c} strokeWidth={1.4} strokeLinecap="round" strokeLinejoin="round"
      />
      {/* Ground / threshold line */}
      <Line
        x1={4} y1={21} x2={20} y2={21}
        stroke={c} strokeWidth={1.4} strokeLinecap="round"
      />
    </Svg>
  );
}

// ─── FASTING ──────────────────────────────────────────────────────────────────
// Concept: Hourglass — two triangles meeting at a point, representing time and
// metabolic state. More precise and editorial than a flame shape.
export function IconFasting({ active }: IconProps) {
  const c = Colors.t1;
  const o = active ? 1 : 0.28;
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24" fill="none" opacity={o}>
      {/* Top triangle — wider at top, narrows to center point */}
      <Path
        d="M5.5 3 L18.5 3 L12 12 Z"
        stroke={c} strokeWidth={1.4} strokeLinecap="round" strokeLinejoin="round"
      />
      {/* Bottom triangle — narrows from center, widens at base */}
      <Path
        d="M5.5 21 L18.5 21 L12 12 Z"
        stroke={c} strokeWidth={1.4} strokeLinecap="round" strokeLinejoin="round"
      />
      {/* Top horizontal cap */}
      <Line
        x1={5.5} y1={3} x2={18.5} y2={3}
        stroke={c} strokeWidth={1.4} strokeLinecap="round"
      />
      {/* Bottom horizontal cap */}
      <Line
        x1={5.5} y1={21} x2={18.5} y2={21}
        stroke={c} strokeWidth={1.4} strokeLinecap="round"
      />
    </Svg>
  );
}

// ─── INSIGHTS ─────────────────────────────────────────────────────────────────
// Concept: Asterisk spark — three intersecting lines radiating from a central
// point, evoking data correlation, illumination, and precision analytics.
export function IconInsights({ active }: IconProps) {
  const c = Colors.t1;
  const o = active ? 1 : 0.28;
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24" fill="none" opacity={o}>
      {/* Vertical axis */}
      <Line
        x1={12} y1={3.5} x2={12} y2={20.5}
        stroke={c} strokeWidth={1.4} strokeLinecap="round"
      />
      {/* Diagonal — top-left to bottom-right */}
      <Line
        x1={4.8} y1={7.2} x2={19.2} y2={16.8}
        stroke={c} strokeWidth={1.4} strokeLinecap="round"
      />
      {/* Diagonal — top-right to bottom-left */}
      <Line
        x1={19.2} y1={7.2} x2={4.8} y2={16.8}
        stroke={c} strokeWidth={1.4} strokeLinecap="round"
      />
      {/* Central focus dot */}
      <Circle
        cx={12} cy={12} r={1.8}
        fill={c}
      />
    </Svg>
  );
}

// ─── FOOD ─────────────────────────────────────────────────────────────────────
// Concept: Botanical leaf — a pointed oval leaf with a central vein, evoking
// natural nutrition. Entirely distinct from a fork or bowl.
export function IconFood({ active }: IconProps) {
  const c = Colors.t1;
  const o = active ? 1 : 0.28;
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24" fill="none" opacity={o}>
      {/* Leaf outline — starts at bottom tip, curves around, ends at top tip */}
      <Path
        d="M12 21 C7 21 4 17.5 4 13 C4 8 8 3 12 3 C16 3 20 8 20 13 C20 17.5 17 21 12 21 Z"
        stroke={c} strokeWidth={1.4} strokeLinecap="round" strokeLinejoin="round"
      />
      {/* Central vein — botanical detail running top to bottom */}
      <Line
        x1={12} y1={4.5} x2={12} y2={20.5}
        stroke={c} strokeWidth={1.4} strokeLinecap="round"
      />
      {/* Left secondary vein */}
      <Path
        d="M12 10 C10 11 8 12.5 7 14"
        stroke={c} strokeWidth={1.1} strokeLinecap="round"
      />
      {/* Right secondary vein */}
      <Path
        d="M12 10 C14 11 16 12.5 17 14"
        stroke={c} strokeWidth={1.1} strokeLinecap="round"
      />
    </Svg>
  );
}

// ─── COACH ────────────────────────────────────────────────────────────────────
// Concept: Triângulo outline — símbolo do PRAXIS, evoca precisão e foco.
export function IconCoach({ active }: IconProps) {
  const c = Colors.t1;
  const o = active ? 1 : 0.28;
  return (
    <Svg width={22} height={22} viewBox="0 0 40 35" fill="none" opacity={o}>
      <Polygon
        points="20,2 2,33 38,33"
        fill="none"
        stroke={c}
        strokeWidth={1.8}
        strokeLinejoin="round"
        strokeLinecap="round"
      />
    </Svg>
  );
}

// ─── PHOTO PROGRESS ───────────────────────────────────────────────────────────
// Concept: Two overlapping frames — before/after comparison visual
export function IconPhoto({ active }: IconProps) {
  const c = Colors.t1;
  const o = active ? 1 : 0.28;
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24" fill="none" opacity={o}>
      {/* Back frame */}
      <Path
        d="M4 7 L4 18 L15 18 L15 7 Z"
        stroke={c} strokeWidth={1.4} strokeLinecap="round" strokeLinejoin="round"
      />
      {/* Front frame */}
      <Path
        d="M9 5 L9 16 L20 16 L20 5 Z"
        stroke={c} strokeWidth={1.4} strokeLinecap="round" strokeLinejoin="round"
      />
      {/* Divider inside front frame */}
      <Line
        x1={14.5} y1={5.5} x2={14.5} y2={15.5}
        stroke={c} strokeWidth={1.0} strokeLinecap="round"
      />
    </Svg>
  );
}

// ─── PROFILE ──────────────────────────────────────────────────────────────────
// Concept: Refined person outline — circle head with a clean shoulder arc.
// Not displayed in current tab bar but exported for future use.
export function IconProfile({ active }: IconProps) {
  const c = Colors.t1;
  const o = active ? 1 : 0.28;
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24" fill="none" opacity={o}>
      {/* Head — slightly smaller and higher for better proportions */}
      <Circle
        cx={12} cy={7.5} r={3.5}
        stroke={c} strokeWidth={1.4}
      />
      {/* Shoulders — a clean arc with a subtle gap at the center bottom */}
      <Path
        d="M4.5 22 C4.5 17.5 7.8 14.5 12 14.5 C16.2 14.5 19.5 17.5 19.5 22"
        stroke={c} strokeWidth={1.4} strokeLinecap="round" strokeLinejoin="round"
      />
    </Svg>
  );
}
