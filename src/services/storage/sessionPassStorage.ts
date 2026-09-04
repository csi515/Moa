import type { SessionPass, SlotRecruitment } from '../../core/types/schedule';
import { STORAGE_KEYS } from '../adapters';
import { deleteById, generateEntityId, getItem, setItem } from './helpers';
import { getPassRemaining, pickPassToConsume } from '@/core/schedules/sessionPassUtils';
import { buildSlotKey, normalizeStaffId, UNASSIGNED_STAFF_TOKEN } from '@/core/schedules/bookingCapacity';

/** 이용권·슬롯 모집 마감 CRUD (로컬) */
export function createSessionPassStorage() {
  return {
    getSessionPasses(): SessionPass[] {
      return getItem<SessionPass[]>(STORAGE_KEYS.SESSION_PASSES, []);
    },

    saveSessionPass(pass: Omit<SessionPass, 'id'> & { id?: string }): SessionPass {
      const list = this.getSessionPasses();
      const remaining = Math.max(0, pass.totalSessions - pass.usedSessions);
      const status: SessionPass['status'] =
        pass.status === 'cancelled' ? 'cancelled' : remaining <= 0 ? 'exhausted' : 'active';

      let saved: SessionPass;
      if (pass.id) {
        const idx = list.findIndex((entry) => entry.id === pass.id);
        if (idx >= 0) {
          saved = { ...list[idx], ...pass, id: pass.id, status };
          list[idx] = saved;
        } else {
          saved = { ...pass, id: pass.id, status };
          list.unshift(saved);
        }
      } else {
        saved = { ...pass, id: generateEntityId('pass'), status };
        list.unshift(saved);
      }

      setItem(STORAGE_KEYS.SESSION_PASSES, list);
      return saved;
    },

    deleteSessionPass(id: string): boolean {
      const list = this.getSessionPasses();
      if (!deleteById(list, id)) return false;
      setItem(STORAGE_KEYS.SESSION_PASSES, list);
      return true;
    },

    /** 이용권 1회 차감. 성공 시 이용권 id */
    consumeSessionPass(customerId: string): string | null {
      const list = this.getSessionPasses();
      const target = pickPassToConsume(list, customerId);
      if (!target) return null;

      const usedSessions = target.usedSessions + 1;
      const remaining = getPassRemaining({ ...target, usedSessions });
      const status: SessionPass['status'] = remaining <= 0 ? 'exhausted' : 'active';
      const idx = list.findIndex((p) => p.id === target.id);
      if (idx < 0) return null;
      list[idx] = { ...target, usedSessions, status };
      setItem(STORAGE_KEYS.SESSION_PASSES, list);
      return target.id;
    },

    /** 완료 취소 시 이용권 1회 복구 */
    refundSessionPass(passId: string): boolean {
      const list = this.getSessionPasses();
      const idx = list.findIndex((p) => p.id === passId);
      if (idx < 0) return false;
      const pass = list[idx];
      if (pass.status === 'cancelled') return false;
      const usedSessions = Math.max(0, pass.usedSessions - 1);
      list[idx] = {
        ...pass,
        usedSessions,
        status: usedSessions >= pass.totalSessions ? 'exhausted' : 'active',
      };
      setItem(STORAGE_KEYS.SESSION_PASSES, list);
      return true;
    },

    getSlotRecruitments(): SlotRecruitment[] {
      return getItem<SlotRecruitment[]>(STORAGE_KEYS.SLOT_RECRUITMENTS, []);
    },

    setSlotRecruitmentClosed(
      serviceId: string,
      staffId: string | null | undefined,
      startsAt: string,
      closedManually: boolean
    ): SlotRecruitment {
      const normalizedStaffId = normalizeStaffId(staffId);
      const id = buildSlotKey(serviceId, normalizedStaffId, startsAt);
      const list = this.getSlotRecruitments();
      const idx = list.findIndex((r) => r.id === id);
      const saved: SlotRecruitment = {
        id,
        serviceId,
        staffId: normalizedStaffId === UNASSIGNED_STAFF_TOKEN ? '' : normalizedStaffId,
        startsAt,
        closedManually,
      };
      if (idx >= 0) list[idx] = saved;
      else list.unshift(saved);
      setItem(STORAGE_KEYS.SLOT_RECRUITMENTS, list);
      return saved;
    },
  };
}
