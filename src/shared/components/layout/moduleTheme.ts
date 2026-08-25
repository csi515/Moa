export type ModuleTheme = 'indigo' | 'teal' | 'red';

export interface ModuleThemeTokens {
  shell: string;
  sidebarActive: string;
  sidebarActiveIcon: string;
  sidebarBadge: string;
  bottomNavActive: string;
  bottomSheetActive: string;
  bottomSheetActiveIcon: string;
}

export const MODULE_THEMES: Record<ModuleTheme, ModuleThemeTokens> = {
  indigo: {
    shell: 'min-h-screen bg-[#F1F5F9] text-slate-800 flex flex-col font-sans antialiased selection:bg-indigo-500 selection:text-white',
    sidebarActive: 'bg-indigo-50 text-indigo-700 font-bold',
    sidebarActiveIcon: 'text-indigo-600',
    sidebarBadge: 'bg-indigo-600 text-white',
    bottomNavActive: 'text-indigo-600 font-bold',
    bottomSheetActive: 'bg-indigo-50 border-indigo-200 text-indigo-700',
    bottomSheetActiveIcon: 'bg-indigo-600 text-white',
  },
  teal: {
    shell: 'min-h-screen bg-[#F1F5F9] text-slate-800 flex flex-col font-sans antialiased selection:bg-teal-500 selection:text-white',
    sidebarActive: 'bg-teal-50 text-teal-700 font-bold',
    sidebarActiveIcon: 'text-teal-600',
    sidebarBadge: 'bg-teal-600 text-white',
    bottomNavActive: 'text-teal-600 font-bold',
    bottomSheetActive: 'bg-teal-50 border-teal-200 text-teal-700',
    bottomSheetActiveIcon: 'bg-teal-600 text-white',
  },
  red: {
    shell: 'min-h-screen bg-[#F1F5F9] text-slate-800 flex flex-col font-sans antialiased selection:bg-red-500 selection:text-white',
    sidebarActive: 'bg-red-50 text-red-700 font-bold',
    sidebarActiveIcon: 'text-red-600',
    sidebarBadge: 'bg-red-600 text-white',
    bottomNavActive: 'text-red-600 font-bold',
    bottomSheetActive: 'bg-red-50 border-red-200 text-red-700',
    bottomSheetActiveIcon: 'bg-red-600 text-white',
  },
};
