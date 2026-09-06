import { Unit } from '../types';
import { fetchAll, saveData, deleteData } from './database';

export const DEFAULT_MAIN_UNIT: Unit = {
  id: 'matriz',
  code: 'MAT',
  name: 'Sede / Matriz',
  is_main: true,
  active: true,
  created_at: '2026-01-01T00:00:00.000Z'
};

const LOCAL_STORAGE_UNITS_KEY = 'db_fallback_units';

export const getUnits = async (): Promise<Unit[]> => {
  try {
    const rawList = await fetchAll('units', '*', 'name', true).catch(() => []);
    let list: Unit[] = Array.isArray(rawList) ? rawList : [];

    // Se a lista estiver vazia, inicializamos com a unidade Matriz
    if (list.length === 0) {
      list = [DEFAULT_MAIN_UNIT];
      await saveData('units', DEFAULT_MAIN_UNIT.id, DEFAULT_MAIN_UNIT).catch(() => {});
    } else {
      // Garante que a unidade matriz exista
      const hasMain = list.some(u => u.is_main || u.id === 'matriz');
      if (!hasMain) {
        list.unshift(DEFAULT_MAIN_UNIT);
        await saveData('units', DEFAULT_MAIN_UNIT.id, DEFAULT_MAIN_UNIT).catch(() => {});
      }
    }

    return list;
  } catch (error) {
    console.warn('[unitService] Erro ao carregar unidades, usando fallback:', error);
    try {
      const local = localStorage.getItem(LOCAL_STORAGE_UNITS_KEY);
      if (local) {
        const parsed = JSON.parse(local);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch {}
    return [DEFAULT_MAIN_UNIT];
  }
};

export const saveUnit = async (unit: Partial<Unit>): Promise<Unit> => {
  const id = unit.id || `unit_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
  const completeUnit: Unit = {
    id,
    code: unit.code?.trim().toUpperCase() || 'FIL',
    name: unit.name?.trim() || 'Nova Filial',
    is_main: unit.is_main || id === 'matriz',
    address: unit.address?.trim() || '',
    city: unit.city?.trim() || '',
    state: unit.state?.trim() || '',
    phone: unit.phone?.trim() || '',
    email: unit.email?.trim() || '',
    active: unit.active !== undefined ? unit.active : true,
    created_at: unit.created_at || new Date().toISOString()
  };

  await saveData('units', completeUnit.id, completeUnit);
  window.dispatchEvent(new CustomEvent('units-updated'));
  return completeUnit;
};

export const deleteUnit = async (unitId: string): Promise<boolean> => {
  if (unitId === 'matriz') {
    throw new Error('A unidade Matriz não pode ser excluída.');
  }

  await deleteData('units', unitId);
  window.dispatchEvent(new CustomEvent('units-updated'));
  return true;
};

export const getUnitName = (units: Unit[], unitId?: string): string => {
  if (!unitId || unitId === 'matriz') {
    const main = units.find(u => u.is_main || u.id === 'matriz');
    return main?.name || 'Sede / Matriz';
  }
  const found = units.find(u => u.id === unitId);
  return found?.name || 'Sede / Matriz';
};

export const getUnitCode = (units: Unit[], unitId?: string): string => {
  if (!unitId || unitId === 'matriz') {
    const main = units.find(u => u.is_main || u.id === 'matriz');
    return main?.code || 'MAT';
  }
  const found = units.find(u => u.id === unitId);
  return found?.code || 'MAT';
};

/**
 * Verifica se um registro pertence à unidade selecionada.
 * Itens sem unit_id pertencem por padrão à 'matriz'.
 * Se 'all' estiver selecionado, aceita todos.
 */
export const isItemInUnit = (itemUnitId: string | undefined, selectedUnitId: string): boolean => {
  if (!selectedUnitId || selectedUnitId === 'all') return true;
  if (selectedUnitId === 'matriz') {
    return !itemUnitId || itemUnitId === 'matriz';
  }
  return itemUnitId === selectedUnitId;
};

/**
 * Filtra uma lista de entidades pela unidade ativa.
 */
export const filterListByUnit = <T>(
  items: T[], 
  selectedUnitId: string, 
  getUnitId: (item: T) => string | undefined
): T[] => {
  if (!selectedUnitId || selectedUnitId === 'all') return items;
  return items.filter(item => isItemInUnit(getUnitId(item), selectedUnitId));
};

/**
 * Retorna a unidade restrita para o usuário logado, se houver.
 * Administradores e usuários com unit_id === 'all' têm acesso irrestrito.
 */
export const getUserRestrictedUnit = (profile: any): string | null => {
  if (!profile) return null;
  const unitId = profile.unit_id || (profile as any).unitId;
  if (!unitId || unitId === 'all') return null;
  return unitId;
};
