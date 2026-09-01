import React, { useMemo, useState } from 'react';
import { LayoutDashboard, RotateCcw, Sparkles } from 'lucide-react';
import { Modal } from '@/shared/components/ui/Modal';
import { StorageService } from '@/services/storage';
import { useApp } from '@/context/AppContext';
import type { AcademySettings } from '@/types';
import {
  ALL_PIANO_DASHBOARD_WIDGET_IDS,
  PIANO_DASHBOARD_WIDGET_GROUP_LABELS,
  RECOMMENDED_PIANO_DASHBOARD_WIDGETS,
  type PianoDashboardWidgetGroup,
  type PianoDashboardWidgetId,
  widgetsByGroup,
} from './dashboardWidgets';

interface DashboardCustomizeModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: AcademySettings;
}

const GROUP_ORDER: PianoDashboardWidgetGroup[] = ['metrics', 'charts', 'panels'];

export const DashboardCustomizeModal: React.FC<DashboardCustomizeModalProps> = ({
  isOpen,
  onClose,
  settings,
}) => {
  const { triggerRefresh } = useApp();
  const initial = useMemo(() => {
    const configured = settings.dashboard?.widgets;
    return new Set(
      configured === undefined ? ALL_PIANO_DASHBOARD_WIDGET_IDS : configured
    );
  }, [settings.dashboard?.widgets, isOpen]);

  const [selected, setSelected] = useState<Set<PianoDashboardWidgetId>>(initial);

  React.useEffect(() => {
    if (isOpen) {
      setSelected(initial);
    }
  }, [isOpen, initial]);

  const toggle = (id: PianoDashboardWidgetId) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const applyPreset = (ids: PianoDashboardWidgetId[]) => {
    setSelected(new Set(ids));
  };

  const handleSave = () => {
    StorageService.updateSettings({
      dashboard: { widgets: Array.from(selected) },
    });
    triggerRefresh();
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="대시보드 편집" maxWidth="2xl">
      <div className="flex flex-col gap-5 p-4 sm:p-6 overflow-y-auto">
        <p className="text-sm text-slate-600 leading-relaxed">
          대시보드에 표시할 항목을 선택하세요. 상단 환영 배너는 항상 표시됩니다.
        </p>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => applyPreset([...ALL_PIANO_DASHBOARD_WIDGET_IDS])}
            className="px-3 py-2 text-xs font-bold rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 min-h-[44px]"
          >
            전체 선택
          </button>
          <button
            type="button"
            onClick={() => applyPreset([...RECOMMENDED_PIANO_DASHBOARD_WIDGETS])}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-bold rounded-xl border border-indigo-200 text-indigo-700 bg-indigo-50 hover:bg-indigo-100 min-h-[44px]"
          >
            <Sparkles className="w-3.5 h-3.5" />
            추천 구성
          </button>
          <button
            type="button"
            onClick={() => applyPreset([])}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-bold rounded-xl border border-slate-200 text-slate-500 hover:bg-slate-50 min-h-[44px]"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            전체 해제
          </button>
        </div>

        {GROUP_ORDER.map((group) => {
          const items = widgetsByGroup(group);
          const groupSelected = items.filter((w) => selected.has(w.id)).length;
          return (
            <section key={group} className="space-y-2">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                  {PIANO_DASHBOARD_WIDGET_GROUP_LABELS[group]}
                </h3>
                <span className="text-[11px] text-slate-400">
                  {groupSelected}/{items.length}개 선택
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {items.map((widget) => {
                  const checked = selected.has(widget.id);
                  return (
                    <label
                      key={widget.id}
                      className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer min-h-[44px] transition-colors ${
                        checked
                          ? 'border-indigo-300 bg-indigo-50/60'
                          : 'border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => toggle(widget.id)}
                        className="mt-1 w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                      />
                      <span className="min-w-0">
                        <span className="block text-sm font-bold text-slate-800">{widget.label}</span>
                        <span className="block text-[11px] text-slate-500 mt-0.5">{widget.description}</span>
                      </span>
                    </label>
                  );
                })}
              </div>
            </section>
          );
        })}

        {selected.size === 0 && (
          <p className="text-xs text-amber-700 bg-amber-50 border border-amber-100 rounded-xl px-3 py-2">
            선택된 항목이 없으면 환영 배너만 표시됩니다.
          </p>
        )}

        <div className="flex gap-2 pt-2 border-t border-slate-100">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-3 rounded-xl border border-slate-200 text-sm font-bold text-slate-600 hover:bg-slate-50 min-h-[44px]"
          >
            취소
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="flex-1 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold min-h-[44px] inline-flex items-center justify-center gap-2"
          >
            <LayoutDashboard className="w-4 h-4" />
            저장
          </button>
        </div>
      </div>
    </Modal>
  );
};
