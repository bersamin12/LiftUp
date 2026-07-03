import type { CSSProperties } from 'react';

type SkeletonProps = {
  width?: string | number;
  height?: string | number;
  borderRadius?: string | number;
  style?: CSSProperties;
};

export default function Skeleton({ width = '100%', height = 16, borderRadius, style }: SkeletonProps) {
  return <div className="skeleton" style={{ width, height, borderRadius, ...style }} />;
}
