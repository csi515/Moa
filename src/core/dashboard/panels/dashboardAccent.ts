export type DashboardAccent = 'orange' | 'sky';

export const DASHBOARD_ACCENT_STYLES: Record<
  DashboardAccent,
  {
    icon: string;
    link: string;
    hoverBorder: string;
    hoverBg: string;
    primaryButton: string;
    outlineButton: string;
  }
> = {
  orange: {
    icon: 'text-orange-600',
    link: 'text-orange-600',
    hoverBorder: 'hover:border-orange-200',
    hoverBg: 'hover:bg-orange-50/30',
    primaryButton: 'bg-orange-600 hover:bg-orange-700',
    outlineButton: 'border-orange-200 text-orange-700 hover:bg-orange-50',
  },
  sky: {
    icon: 'text-sky-600',
    link: 'text-sky-600',
    hoverBorder: 'hover:border-sky-200',
    hoverBg: 'hover:bg-sky-50/30',
    primaryButton: 'bg-sky-600 hover:bg-sky-700',
    outlineButton: 'border-sky-200 text-sky-700 hover:bg-sky-50',
  },
};
