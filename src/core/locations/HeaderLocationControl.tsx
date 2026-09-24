import React, { useState } from 'react';
import { Check, ChevronDown, MapPin } from 'lucide-react';
import { useOptionalOrganization } from '@/core/organizations/OrganizationProvider';
import { LOCATION_SCOPE_LABELS } from './locationLabels';

/**
 * Header용 현재 지점 표시/전환. 기존 organization location 상태를 연결한다.
 */
export const HeaderLocationControl: React.FC = () => {
  const org = useOptionalOrganization();
  const [open, setOpen] = useState(false);
  if (!org?.currentOrganization) return null;

  const {
    locations,
    currentLocation,
    selectLocation,
    locationLabel,
    canChangeLocation,
    canClearLocation,
  } = org;

  if (!canChangeLocation) {
    return (
      <p className="flex items-center gap-1 text-[11px] sm:text-xs text-slate-500 font-medium min-w-0">
        <MapPin className="w-3.5 h-3.5 shrink-0 text-slate-400" aria-hidden />
        <span className="truncate">{locationLabel}</span>
      </p>
    );
  }

  return (
    <div className="relative min-w-0">
      <button
        type="button"
        onClick={(event) => {
          event.stopPropagation();
          setOpen((prev) => !prev);
        }}
        aria-expanded={open}
        aria-haspopup="listbox"
        aria-label={`${LOCATION_SCOPE_LABELS.change}: ${locationLabel}`}
        className="flex items-center gap-1 min-h-[32px] max-w-full rounded-lg px-1 -ml-1 text-[11px] sm:text-xs text-slate-600 font-semibold hover:bg-slate-100"
      >
        <MapPin className="w-3.5 h-3.5 shrink-0 text-teal-600" aria-hidden />
        <span className="truncate">{locationLabel}</span>
        <ChevronDown className="w-3 h-3 shrink-0 text-slate-400" />
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} aria-hidden />
          <ul
            role="listbox"
            className="absolute left-0 top-full mt-1 z-50 min-w-[11rem] max-w-[16rem] rounded-xl border border-slate-200 bg-white shadow-lg p-1"
          >
            {canClearLocation && (
              <li>
                <button
                  type="button"
                  role="option"
                  aria-selected={!currentLocation}
                  onClick={() => {
                    selectLocation(null);
                    setOpen(false);
                  }}
                  className="w-full flex items-center justify-between gap-2 px-3 py-2 min-h-[44px] rounded-lg text-left text-xs font-semibold text-slate-700 hover:bg-slate-50"
                >
                  {LOCATION_SCOPE_LABELS.all}
                  {!currentLocation && <Check className="w-4 h-4 text-teal-600" />}
                </button>
              </li>
            )}
            {locations.map((row) => {
              const selected = currentLocation?.id === row.id;
              return (
                <li key={row.id}>
                  <button
                    type="button"
                    role="option"
                    aria-selected={selected}
                    onClick={() => {
                      selectLocation(row.id);
                      setOpen(false);
                    }}
                    className="w-full flex items-center justify-between gap-2 px-3 py-2 min-h-[44px] rounded-lg text-left text-xs font-semibold text-slate-700 hover:bg-slate-50"
                  >
                    <span className="truncate">{row.name}</span>
                    {selected && <Check className="w-4 h-4 text-teal-600 shrink-0" />}
                  </button>
                </li>
              );
            })}
          </ul>
        </>
      )}
    </div>
  );
};
