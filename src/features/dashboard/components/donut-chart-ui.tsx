import React, { useMemo, useState } from 'react';
import { StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import Svg, { Circle, G } from 'react-native-svg';

import { formatCurrency } from '@/src/shared/utils/format-currency';

import type { ThemeColors } from './dashboard-palette';
import { useDashboardColors } from './dashboard-palette';

export interface ProcessedSegment {
  label: string;
  value: number;
  percentage: number;
  startAngle: number;
  sweepAngle: number;
  color: string;
  index: number;
}

interface DonutChartDatum {
  label: string;
  value: number;
}

export interface DonutChartConfig {
  data: DonutChartDatum[];
  colors?: string[];
  strokeWidth?: number;
  gap?: number;
  roundedCorners?: boolean;
  centerValues?: {
    enabled?: boolean;
    renderContent?: (
      segments: ProcessedSegment[],
      total: number,
      selectedSegment: ProcessedSegment | null,
    ) => React.ReactNode;
  };
}

export const DONUT_CHART_STYLE = {
  strokeWidth: 22,
  gap: 4,
  roundedCorners: true,
} as const;

interface ChartCenterContentProps {
  value: number;
  label: string;
  accentColor: string;
  isTotal: boolean;
}

function createCenterStyles(colors: ThemeColors) {
  return StyleSheet.create({
    centerContent: {
      alignItems: 'center',
      gap: 3,
      paddingHorizontal: 10,
    },
    centerLabel: {
      fontSize: 11,
      color: colors.textMuted,
      letterSpacing: 0.5,
      textTransform: 'uppercase',
      textAlign: 'center',
    },
    centerValue: {
      fontSize: 18,
      fontWeight: '600',
      letterSpacing: -0.4,
      textAlign: 'center',
    },
  });
}

export function ChartCenterContent({
  value,
  label,
  accentColor,
  isTotal,
}: ChartCenterContentProps) {
  const colors = useDashboardColors();
  const styles = useMemo(() => createCenterStyles(colors), [colors]);

  return (
    <View key={`${label}-${value}`} style={styles.centerContent}>
      <Text style={styles.centerLabel}>{label}</Text>
      <Text
        style={[
          styles.centerValue,
          { color: isTotal ? colors.text : accentColor },
        ]}
      >
        {formatCurrency(value)}
      </Text>
    </View>
  );
}

interface DashboardDonutChartProps {
  height: number;
  config: DonutChartConfig;
  legend?: React.ReactNode;
}

export function DashboardDonutChart({ height, config, legend }: DashboardDonutChartProps) {
  const colors = useDashboardColors();
  const [size, setSize] = useState({ width: 0, height: 0 });
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

  const data = useMemo(
    () => config.data.filter((item) => Number.isFinite(item.value) && item.value > 0),
    [config.data],
  );
  const total = useMemo(() => data.reduce((sum, item) => sum + item.value, 0), [data]);
  const chartSegments = useMemo<ProcessedSegment[]>(() => {
    if (total <= 0) return [];

    const gap = Math.max(0, config.gap ?? 0);
    const availableAngle = Math.max(0, 360 - gap * data.length);
    let currentAngle = -90;

    return data.map((item, index) => {
      const percentage = item.value / total;
      const sweepAngle = percentage * availableAngle;
      const segment: ProcessedSegment = {
        ...item,
        percentage,
        startAngle: currentAngle,
        sweepAngle,
        color: config.colors?.[index % (config.colors.length || 1)] ?? colors.accent,
        index,
      };
      currentAngle += sweepAngle + gap;
      return segment;
    });
  }, [config.colors, config.gap, colors.accent, data, total]);

  const diameter = Math.min(size.width, size.height);
  const strokeWidth = config.strokeWidth ?? DONUT_CHART_STYLE.strokeWidth;
  const radius = Math.max(1, diameter / 2 - strokeWidth / 2 - 10);
  const circumference = 2 * Math.PI * radius;
  const gapLength = (Math.max(0, config.gap ?? 0) / 360) * circumference;
  const availableLength = Math.max(0, circumference - gapLength * chartSegments.length);
  const selectedSegment =
    selectedIndex === null ? null : chartSegments[selectedIndex] ?? null;

  const circles = chartSegments.map((segment) => {
    const segmentLength = availableLength * segment.percentage;
    const precedingLength = chartSegments
      .slice(0, segment.index)
      .reduce(
        (sum, precedingSegment) => sum + availableLength * precedingSegment.percentage + gapLength,
        0,
      );
    const dashOffset = -precedingLength;

    return (
      <Circle
        key={segment.label}
        cx={size.width / 2}
        cy={size.height / 2}
        r={radius}
        fill="none"
        stroke={segment.color}
        strokeWidth={strokeWidth}
        strokeLinecap={config.roundedCorners ? 'round' : 'butt'}
        strokeDasharray={[segmentLength, Math.max(0, circumference - segmentLength)]}
        strokeDashoffset={dashOffset}
        onPress={() =>
          setSelectedIndex((current) => (current === segment.index ? null : segment.index))
        }
        accessibilityLabel={`${segment.label}, ${Math.round(segment.percentage * 100)}%`}
      />
    );
  });

  const centerContent = config.centerValues?.renderContent?.(
    chartSegments,
    total,
    selectedSegment,
  );

  return (
    <View style={{ width: '100%' }}>
      <View
        style={{ width: '100%', height, alignItems: 'center', justifyContent: 'center' }}
        onLayout={(event) => {
          const { width, height: layoutHeight } = event.nativeEvent.layout;
          setSize({ width, height: layoutHeight });
        }}
      >
        {diameter > 0 && total > 0 ? (
          <>
            <Svg width={size.width} height={size.height}>
              <Circle
                cx={size.width / 2}
                cy={size.height / 2}
                r={radius}
                fill="none"
                stroke={colors.border}
                strokeWidth={strokeWidth}
              />
              <G rotation={-90} originX={size.width / 2} originY={size.height / 2}>
                {circles}
              </G>
            </Svg>
            {config.centerValues?.enabled && centerContent ? (
              <View
                pointerEvents="none"
                style={{
                  position: 'absolute',
                  width: size.width,
                  height: size.height,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                {centerContent}
              </View>
            ) : null}
          </>
        ) : null}
      </View>
      {legend ?? null}
    </View>
  );
}

function createLegendStyles(colors: ThemeColors) {
  return StyleSheet.create({
    legend: {
      marginTop: 12,
      gap: 8,
    },
    legendItem: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
    },
    legendSwatch: {
      width: 12,
      height: 2,
      borderRadius: 1,
    },
    legendLabel: {
      flex: 1,
      fontSize: 12,
      color: colors.textSecondary,
      letterSpacing: 0.1,
    },
    legendValue: {
      fontSize: 12,
      color: colors.textMuted,
      fontVariant: ['tabular-nums'],
    },
  });
}

export function DonutChartLegend({ segments }: { segments: ProcessedSegment[] }) {
  const colors = useDashboardColors();
  const styles = useMemo(() => createLegendStyles(colors), [colors]);

  return (
    <View style={styles.legend}>
      {segments.map((segment) => (
        <View key={segment.label} style={styles.legendItem}>
          <View style={[styles.legendSwatch, { backgroundColor: segment.color }]} />
          <Text style={styles.legendLabel}>{segment.label}</Text>
          <Text style={styles.legendValue}>
            {Math.round(segment.percentage * 100)}%
          </Text>
        </View>
      ))}
    </View>
  );
}

export function useDonutChartHeight(_variant: 'primary' | 'secondary' = 'primary') {
  const { width: windowWidth } = useWindowDimensions();
  return Math.min(Math.max(windowWidth * 0.62, 240), 310);
}
