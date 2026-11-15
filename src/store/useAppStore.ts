import { create } from 'zustand';
import { get as idbGet, set as idbSet, del as idbDel } from 'idb-keyval';
import { generateSeedData } from '../domain/seed';
import type { Entry, EnvId, Profile } from '../domain/types';

const STORAGE_KEY = 'astrovitals-state-v1';

export interface PersistedPayload {
  profiles: Profile[];
  activeProfileId: string;
  environment: EnvId;
  entriesByProfile: Record<string, Entry[]>;
  completedTasksByProfile: Record<string, string[]>;
  medicalOfficerMode: boolean;
}

export interface AppState extends PersistedPayload {
  hydrated: boolean;
  toastMessage: string | null;
  hydrateFromDb: () => Promise<void>;
  setActiveProfile: (id: string) => void;
  setEnvironment: (env: EnvId) => void;
  addEntry: (entry: Entry) => void;
  toggleTask: (taskId: string) => void;
  toggleMedicalOfficerMode: () => void;
  addOrUpdateProfile: (profile: Profile) => void;
  deleteProfile: (id: string) => void;
  resetDemoData: () => Promise<void>;
  importJsonData: (data: PersistedPayload) => void;
  clearToast: () => void;
  showToast: (msg: string) => void;
}

function createInitialPayload(): PersistedPayload {
  const seed = generateSeedData('station');
  return {
    profiles: seed.profiles,
    activeProfileId: seed.profiles[0].id,
    environment: 'station',
    entriesByProfile: seed.entriesByProfile,
    completedTasksByProfile: seed.completedTasksByProfile,
    medicalOfficerMode: false,
  };
}

async function savePayload(state: PersistedPayload): Promise<void> {
  try {
    await idbSet(STORAGE_KEY, {
      profiles: state.profiles,
      activeProfileId: state.activeProfileId,
      environment: state.environment,
      entriesByProfile: state.entriesByProfile,
      completedTasksByProfile: state.completedTasksByProfile,
      medicalOfficerMode: state.medicalOfficerMode,
    });
  } catch {
    // Fallback quietly in environments where IndexedDB is unavailable (e.g., jsdom tests)
  }
}

const initial = createInitialPayload();

export const useAppStore = create<AppState>((set, get) => ({
  ...initial,
  hydrated: false,
  toastMessage: null,

  hydrateFromDb: async () => {
    try {
      const saved = await idbGet<PersistedPayload>(STORAGE_KEY);
      if (saved && Array.isArray(saved.profiles) && saved.profiles.length > 0) {
        set({ ...saved, hydrated: true });
        return;
      }
    } catch {
      // Ignore IDB errors in restricted sandboxes
    }
    set({ hydrated: true });
  },

  setActiveProfile: (id) => {
    const profile = get().profiles.find((p) => p.id === id);
    if (!profile) return;
    set((s) => {
      const next: PersistedPayload = {
        profiles: s.profiles,
        activeProfileId: id,
        environment: s.environment,
        entriesByProfile: s.entriesByProfile,
        completedTasksByProfile: s.completedTasksByProfile,
        medicalOfficerMode: s.medicalOfficerMode,
      };
      void savePayload(next);
      return { activeProfileId: id, toastMessage: `Switched active profile to ${profile.name}` };
    });
  },

  setEnvironment: (env) => {
    set((s) => {
      const next: PersistedPayload = {
        profiles: s.profiles,
        activeProfileId: s.activeProfileId,
        environment: env,
        entriesByProfile: s.entriesByProfile,
        completedTasksByProfile: s.completedTasksByProfile,
        medicalOfficerMode: s.medicalOfficerMode,
      };
      void savePayload(next);
      return { environment: env, toastMessage: `Mission environment updated` };
    });
  },

  addEntry: (entry) => {
    set((s) => {
      const existing = s.entriesByProfile[entry.profileId] ?? [];
      const updatedEntries = {
        ...s.entriesByProfile,
        [entry.profileId]: [...existing, entry],
      };
      const next: PersistedPayload = {
        profiles: s.profiles,
        activeProfileId: s.activeProfileId,
        environment: s.environment,
        entriesByProfile: updatedEntries,
        completedTasksByProfile: s.completedTasksByProfile,
        medicalOfficerMode: s.medicalOfficerMode,
      };
      void savePayload(next);
      return {
        entriesByProfile: updatedEntries,
        toastMessage: `Mission Day ${entry.missionDay} check-in logged (+30 XP)`,
      };
    });
  },

  toggleTask: (taskId) => {
    set((s) => {
      const pid = s.activeProfileId;
      const cur = s.completedTasksByProfile[pid] ?? [];
      const updated = cur.includes(taskId)
        ? cur.filter((id) => id !== taskId)
        : [...cur, taskId];
      const completedTasksByProfile = { ...s.completedTasksByProfile, [pid]: updated };
      const next: PersistedPayload = {
        profiles: s.profiles,
        activeProfileId: pid,
        environment: s.environment,
        entriesByProfile: s.entriesByProfile,
        completedTasksByProfile,
        medicalOfficerMode: s.medicalOfficerMode,
      };
      void savePayload(next);
      return { completedTasksByProfile };
    });
  },

  toggleMedicalOfficerMode: () => {
    set((s) => {
      const medicalOfficerMode = !s.medicalOfficerMode;
      const next: PersistedPayload = {
        profiles: s.profiles,
        activeProfileId: s.activeProfileId,
        environment: s.environment,
        entriesByProfile: s.entriesByProfile,
        completedTasksByProfile: s.completedTasksByProfile,
        medicalOfficerMode,
      };
      void savePayload(next);
      return {
        medicalOfficerMode,
        toastMessage: medicalOfficerMode
          ? 'Medical Officer Console enabled (full clinical vitals unlocked)'
          : 'Crew Privacy Mode active (summary status only)',
      };
    });
  },

  addOrUpdateProfile: (profile) => {
    set((s) => {
      const exists = s.profiles.some((p) => p.id === profile.id);
      const profiles = exists
        ? s.profiles.map((p) => (p.id === profile.id ? profile : p))
        : [...s.profiles, profile];
      const entriesByProfile = exists
        ? s.entriesByProfile
        : { ...s.entriesByProfile, [profile.id]: [] };
      const completedTasksByProfile = exists
        ? s.completedTasksByProfile
        : { ...s.completedTasksByProfile, [profile.id]: [] };

      const next: PersistedPayload = {
        profiles,
        activeProfileId: exists ? s.activeProfileId : profile.id,
        environment: s.environment,
        entriesByProfile,
        completedTasksByProfile,
        medicalOfficerMode: s.medicalOfficerMode,
      };
      void savePayload(next);
      return {
        ...next,
        toastMessage: exists ? `Updated ${profile.name}` : `Added crew profile ${profile.name}`,
      };
    });
  },

  deleteProfile: (id) => {
    set((s) => {
      if (s.profiles.length <= 1) {
        return { toastMessage: 'Cannot delete the last crew profile.' };
      }
      const profiles = s.profiles.filter((p) => p.id !== id);
      const entriesByProfile = { ...s.entriesByProfile };
      delete entriesByProfile[id];
      const completedTasksByProfile = { ...s.completedTasksByProfile };
      delete completedTasksByProfile[id];
      const activeProfileId =
        s.activeProfileId === id ? profiles[0].id : s.activeProfileId;

      const next: PersistedPayload = {
        profiles,
        activeProfileId,
        environment: s.environment,
        entriesByProfile,
        completedTasksByProfile,
        medicalOfficerMode: s.medicalOfficerMode,
      };
      void savePayload(next);
      return { ...next, toastMessage: 'Crew profile removed.' };
    });
  },

  resetDemoData: async () => {
    try {
      await idbDel(STORAGE_KEY);
    } catch {
      // Ignore
    }
    const fresh = createInitialPayload();
    set({ ...fresh, hydrated: true, toastMessage: 'Demo mission dataset reset to Day 30.' });
  },

  importJsonData: (data) => {
    if (!data || !Array.isArray(data.profiles) || data.profiles.length === 0) return;
    set(() => {
      void savePayload(data);
      return { ...data, toastMessage: 'Imported Tempus Pro mission dataset.' };
    });
  },

  clearToast: () => set({ toastMessage: null }),
  showToast: (msg) => set({ toastMessage: msg }),
}));
