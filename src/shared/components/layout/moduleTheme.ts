/** 업종별 네비·셸 accent 테마 */
export type ModuleTheme = 'indigo' | 'teal' | 'rose';

export interface ModuleThemeClasses {
  shell: string;
  sidebarActive: string;
  sidebarActiveIcon: string;
  sidebarBadge: string;
  bottomNavActive: string;
  bottomSheetActive: string;
  bottomSheetActiveIcon: string;
}

export const MODULE_THEMES: Record<ModuleTheme, ModuleThemeClasses> = {
  indigo: {
    shell:
      'min-h-screen bg-[#F1F5F9] text-slate-800 flex flex-col font-sans antialiased selection:bg-indigo-500 selection:text-white',
    sidebarActive: 'bg-indigo-50 text-indigo-700 font-bold',
    sidebarActiveIcon: 'text-indigo-600',
    sidebarBadge: 'bg-indigo-600 text-white',
    bottomNavActive: 'text-indigo-600 font-bold scale-105',
    bottomSheetActive: 'bg-indigo-50 border-indigo-300 text-indigo-700 font-bold shadow-xs',
    bottomSheetActiveIcon: 'bg-indigo-600 text-white',
  },
  teal: {
    shell:
      'min-h-screen bg-[#F1F5F9] text-slate-800 flex flex-col font-sans antialiased selection:bg-teal-500 selection:text-white',
    sidebarActive: 'bg-teal-50 text-teal-700 font-bold',
    sidebarActiveIcon: 'text-teal-600',
    sidebarBadge: 'bg-teal-600 text-white',
    bottomNavActive: 'text-teal-600 font-bold scale-105',
    bottomSheetActive: 'bg-teal-50 border-teal-300 text-teal-700 font-bold shadow-xs',
    bottomSheetActiveIcon: 'bg-teal-600 text-white',
  },
  rose: {
    shell:
      'min-h-screen bg-[#F8F5F4] text-slate-800 flex flex-col font-sans antialiased selection:bg-rose-500 selection:text-white',
    sidebarActive: 'bg-rose-50 text-rose-700 font-bold',
    sidebarActiveIcon: 'text-rose-600',
    sidebarBadge: 'bg-rose-600 text-white',
    bottomNavActive: 'text-rose-600 font-bold scale-105',
    bottomSheetActive: 'bg-rose-50 border-rose-300 text-rose-700 font-bold shadow-xs',
    bottomSheetActiveIcon: 'bg-rose-600 text-white',
  },
};
