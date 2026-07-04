import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Condition } from '@/types';
import { persistStorage } from './storage';

// Price alerts: a model + a target price the user wants to be told about.
//
// TODO(PROMPT 2 / backend): real push notifications need a backend that watches
// prices server-side and pushes when an alert fires. For now alerts are stored
// locally and evaluated on-device against the (mock) report data whenever the
// Alerts screen is open.

export type PriceAlert = {
  id: string;
  modelId: string;
  modelName: string;
  storageGb?: number;
  condition: Condition;
  targetPriceIdr: number;
  enabled: boolean;
  createdAt: string;
};

type NewAlert = Omit<PriceAlert, 'id' | 'createdAt' | 'enabled'> & { enabled?: boolean };

type AlertsState = {
  alerts: PriceAlert[];
  add: (alert: NewAlert) => void;
  remove: (id: string) => void;
  toggle: (id: string) => void;
  updateTarget: (id: string, targetPriceIdr: number) => void;
};

let counter = 0;
function makeId(modelId: string): string {
  // Runtime-only id; uniqueness across a session is enough for local alerts.
  counter += 1;
  return `${modelId}-${Date.now()}-${counter}`;
}

export const useAlertsStore = create<AlertsState>()(
  persist(
    (set) => ({
      alerts: [],
      add: (alert) =>
        set((state) => ({
          alerts: [
            {
              ...alert,
              enabled: alert.enabled ?? true,
              id: makeId(alert.modelId),
              createdAt: new Date().toISOString(),
            },
            ...state.alerts,
          ],
        })),
      remove: (id) =>
        set((state) => ({ alerts: state.alerts.filter((a) => a.id !== id) })),
      toggle: (id) =>
        set((state) => ({
          alerts: state.alerts.map((a) =>
            a.id === id ? { ...a, enabled: !a.enabled } : a,
          ),
        })),
      updateTarget: (id, targetPriceIdr) =>
        set((state) => ({
          alerts: state.alerts.map((a) =>
            a.id === id ? { ...a, targetPriceIdr } : a,
          ),
        })),
    }),
    {
      name: 'hargaradar.alerts',
      storage: persistStorage,
      partialize: (state) => ({ alerts: state.alerts }),
    },
  ),
);
