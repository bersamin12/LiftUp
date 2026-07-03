type IconProps = {
  width: number;
  height: number;
  viewBox: string;
  fill: string;
  stroke: string;
  strokeWidth: number;
  strokeLinecap: 'round';
  strokeLinejoin: 'round';
};

export default function BadgeIcon({ iconKey, color = 'currentColor', size = 25 }: { iconKey?: string | null; color?: string; size?: number }) {
  const common: IconProps = {
    width: size,
    height: size,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: color,
    strokeWidth: 2,
    strokeLinecap: 'round',
    strokeLinejoin: 'round',
  };

  switch (iconKey) {
    case 'shirt':
      return <svg {...common}><path d="M9 3 4 7l2 3 2-1.5V20h8V8.5L18 10l2-3-5-4c-.6 1.2-1.7 1.8-3 1.8S9.6 4.2 9 3z" /></svg>;
    case 'star':
      return <svg {...common} fill={color} stroke="none"><path d="M12 2l2.9 6.6 7.1.6-5.4 4.7 1.6 7L12 17l-6.2 3.9 1.6-7-5.4-4.7 7.1-.6L12 2z" /></svg>;
    case 'cpu':
      return <svg {...common}><rect x="6" y="6" width="12" height="12" rx="1.5" /><path d="M9 2v3M15 2v3M9 19v3M15 19v3M2 9h3M2 15h3M19 9h3M19 15h3" /></svg>;
    case 'book':
      return <svg {...common}><path d="M4 4.5A2.5 2.5 0 0 1 6.5 2H20v17H6.5A2.5 2.5 0 0 0 4 21.5v-17z" /><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" /></svg>;
    case 'neighbours':
      return <svg {...common}><circle cx="8" cy="9" r="2.7" /><circle cx="16" cy="9" r="2.7" /><path d="M2.5 20v-1.5A3.7 3.7 0 0 1 6.2 14.8h1.6a3.7 3.7 0 0 1 3.5 2.5" /><path d="M10.7 20v-1.5a3.7 3.7 0 0 1 3.7-3.7h1.6a3.7 3.7 0 0 1 3.7 3.7V20" /></svg>;
    case 'fire':
      return <svg {...common}><path d="M12 2.5c-1 3-4.2 5.3-4.2 9.3a4.2 4.2 0 0 0 8.4 0c0-1.1-.3-1.9-.9-2.7.1 1.1-.5 1.9-1.3 1.9-1 0-1-1-1-2.3 0-2-.5-3.8-1-6.2z" /></svg>;
    case 'lantern':
      return <svg {...common}><path d="M9 3h6M9 21h6" /><path d="M7 6.5h10L15.5 18h-7L7 6.5z" /><path d="M12 9v6" /></svg>;
    case 'five':
      return <svg {...common}><circle cx="12" cy="8" r="5" /><path d="M9 12.5 7 21l5-3 5 3-2-8.5" /></svg>;
    case 'heart':
    default:
      return <svg {...common}><path d="M12 20s-6-4.4-6-9a3.4 3.4 0 0 1 6-2.2A3.4 3.4 0 0 1 18 11c0 4.6-6 9-6 9z" /></svg>;
  }
}
