/**
 * React Hooks for Game Data
 *
 * Provides easy access to Supabase data in React components.
 */

import { useState, useEffect } from 'react';
import {
  getAllWeapons,
  getAllGadgets,
  getAllCities,
  getAllCountries,
  getAllPowers,
  getAllSkills,
  getAllStatusEffects,
  getAllArmor,
  getAllAmmunition,
  getAllMartialArtsStyles,
  getTechniquesByStyle,
  getCombatData,
  getWorldData,
  isSupabaseConfigured,
} from '../lib';
import type {
  Weapon,
  Gadget,
  City,
  Country,
  Power,
  Skill,
  StatusEffect,
  Armor,
  Ammunition,
  MartialArtsStyle,
  MartialArtsTechnique,
} from '../lib';

interface UseDataState<T> {
  data: T[];
  loading: boolean;
  error: string | null;
}

/**
 * Generic hook for fetching data
 */
function useData<T>(
  fetchFn: () => Promise<T[]>,
  deps: unknown[] = []
): UseDataState<T> {
  const [state, setState] = useState<UseDataState<T>>({
    data: [],
    loading: true,
    error: null,
  });

  useEffect(() => {
    if (!isSupabaseConfigured()) {
      setState({ data: [], loading: false, error: 'Supabase not configured' });
      return;
    }

    let mounted = true;

    fetchFn()
      .then((data) => {
        if (mounted) {
          setState({ data, loading: false, error: null });
        }
      })
      .catch((err) => {
        if (mounted) {
          setState({ data: [], loading: false, error: err.message });
        }
      });

    return () => {
      mounted = false;
    };
  }, deps);

  return state;
}

// ============== WEAPONS ==============

export function useWeapons() {
  return useData<Weapon>(getAllWeapons);
}

// ============== GADGETS ==============

export function useGadgets() {
  return useData<Gadget>(getAllGadgets);
}

// ============== CITIES ==============

export function useCities() {
  return useData<City>(getAllCities);
}

// ============== COUNTRIES ==============

export function useCountries() {
  return useData<Country>(getAllCountries);
}

// ============== POWERS ==============

export function usePowers() {
  return useData<Power>(getAllPowers);
}

// ============== SKILLS ==============

export function useSkills() {
  return useData<Skill>(getAllSkills);
}

// ============== STATUS EFFECTS ==============

export function useStatusEffects() {
  return useData<StatusEffect>(getAllStatusEffects);
}

// ============== ARMOR ==============

export function useArmor() {
  return useData<Armor>(getAllArmor);
}

// ============== AMMUNITION ==============

export function useAmmunition() {
  return useData<Ammunition>(getAllAmmunition);
}

// ============== MARTIAL ARTS ==============

export function useMartialArtsStyles() {
  return useData<MartialArtsStyle>(getAllMartialArtsStyles);
}

export function useTechniques(styleId: string) {
  return useData<MartialArtsTechnique>(
    () => getTechniquesByStyle(styleId),
    [styleId]
  );
}

// ============== COMBO HOOKS ==============

/**
 * Load all combat-relevant data at once
 */
export function useCombatData() {
  const [state, setState] = useState({
    weapons: [] as Weapon[],
    armor: [] as Armor[],
    ammunition: [] as Ammunition[],
    statusEffects: [] as StatusEffect[],
    skills: [] as Skill[],
    loading: true,
    error: null as string | null,
  });

  useEffect(() => {
    if (!isSupabaseConfigured()) {
      setState((s) => ({ ...s, loading: false, error: 'Supabase not configured' }));
      return;
    }

    getCombatData()
      .then((data) => {
        setState({ ...data, loading: false, error: null });
      })
      .catch((err) => {
        setState((s) => ({ ...s, loading: false, error: err.message }));
      });
  }, []);

  return state;
}

/**
 * Load all world map data at once
 */
export function useWorldData() {
  const [state, setState] = useState({
    cities: [] as City[],
    countries: [] as Country[],
    loading: true,
    error: null as string | null,
  });

  useEffect(() => {
    if (!isSupabaseConfigured()) {
      setState((s) => ({ ...s, loading: false, error: 'Supabase not configured' }));
      return;
    }

    getWorldData()
      .then((data) => {
        setState({ ...data, loading: false, error: null });
      })
      .catch((err) => {
        setState((s) => ({ ...s, loading: false, error: err.message }));
      });
  }, []);

  return state;
}

// ============== DATABASE STATUS ==============

export function useSupabaseStatus() {
  const [configured, setConfigured] = useState(false);

  useEffect(() => {
    setConfigured(isSupabaseConfigured());
  }, []);

  return { configured };
}
