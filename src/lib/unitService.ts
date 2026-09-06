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
  if (!unitId || unitId === 'matriz' || unitId === 'MAT') {
    const main = units.find(u => u.is_main || u.id === 'matriz');
    return main?.name || 'Sede / Matriz';
  }
  const norm = unitId.trim().toLowerCase();
  const found = units.find(u => 
    u.id.toLowerCase() === norm || 
    u.name?.toLowerCase() === norm ||
    u.code?.toLowerCase() === norm
  );
  if (found) return found.name;
  
  // Se o identificador já for um nome legível (ex: "Unidade Pimentas"), usa o próprio valor
  if (unitId.includes(' ') || !unitId.startsWith('unit_')) {
    return unitId;
  }
  return 'Unidade Vinculada';
};

export const getUnitCode = (units: Unit[], unitId?: string): string => {
  if (!unitId || unitId === 'matriz' || unitId === 'MAT') {
    const main = units.find(u => u.is_main || u.id === 'matriz');
    return main?.code || 'MAT';
  }
  const norm = unitId.trim().toLowerCase();
  const found = units.find(u => 
    u.id.toLowerCase() === norm || 
    u.name?.toLowerCase() === norm ||
    u.code?.toLowerCase() === norm
  );
  return found?.code || 'POLO';
};

/**
 * Extrai o identificador de unidade de qualquer entidade de forma segura.
 */
export const getItemUnitId = (item: any): string | undefined => {
  if (!item) return undefined;
  return item.unit_id || item.unitId || item.unit || item.polo || item.polo_id || undefined;
};

/**
 * Verifica se um registro pertence à unidade selecionada.
 * - Se 'all' estiver selecionado, aceita todos.
 * - Itens sem unit_id pertencem por padrão à 'matriz'.
 * - Suporta correspondência por ID, Nome e Código com tolerância a maiúsculas/minúsculas.
 */
export const isItemInUnit = (
  itemUnitId: string | undefined, 
  selectedUnitId: string, 
  units: Unit[] = []
): boolean => {
  if (!selectedUnitId || selectedUnitId === 'all' || selectedUnitId.toLowerCase() === 'todas') {
    return true;
  }

  const selNorm = selectedUnitId.trim().toLowerCase();
  const isMatrizSelected = selNorm === 'matriz' || selNorm === 'mat' || selNorm === 'sede' || selNorm === 'sede / matriz';

  // Se o item não possui unidade definida, ele pertence por padrão à Matriz
  if (!itemUnitId || itemUnitId.trim() === '') {
    return isMatrizSelected;
  }

  const itemNorm = itemUnitId.trim().toLowerCase();

  if (isMatrizSelected) {
    return (
      itemNorm === 'matriz' || 
      itemNorm === 'mat' || 
      itemNorm === 'sede' || 
      itemNorm.includes('matriz') ||
      itemNorm.includes('sede')
    );
  }

  // Compara diretamente
  if (itemNorm === selNorm) return true;

  // Busca na lista de unidades conhecidas para resolver ID vs Nome vs Código
  const activeUnit = units.find(u => 
    u.id.toLowerCase() === selNorm || 
    u.name?.toLowerCase() === selNorm || 
    u.code?.toLowerCase() === selNorm
  );

  if (activeUnit) {
    if (itemNorm === activeUnit.id.toLowerCase()) return true;
    if (activeUnit.name && itemNorm === activeUnit.name.toLowerCase()) return true;
    if (activeUnit.code && itemNorm === activeUnit.code.toLowerCase()) return true;
  }

  // Também tenta cruzar no sentido inverso (caso itemNorm seja um ID e selNorm seja o Nome)
  const itemUnit = units.find(u => 
    u.id.toLowerCase() === itemNorm || 
    u.name?.toLowerCase() === itemNorm || 
    u.code?.toLowerCase() === itemNorm
  );

  if (itemUnit) {
    if (itemUnit.id.toLowerCase() === selNorm) return true;
    if (itemUnit.name && itemUnit.name.toLowerCase() === selNorm) return true;
    if (itemUnit.code && itemUnit.code.toLowerCase() === selNorm) return true;
  }

  return false;
};

/**
 * Filtra uma lista de entidades pela unidade ativa.
 */
export const filterListByUnit = <T>(
  items: T[], 
  selectedUnitId: string, 
  getUnitId: (item: T) => string | undefined,
  units: Unit[] = []
): T[] => {
  if (!selectedUnitId || selectedUnitId === 'all') return items;
  return items.filter(item => isItemInUnit(getUnitId(item), selectedUnitId, units));
};

/**
 * Retorna a unidade restrita para o usuário logado, se houver.
 * - Usuários sem perfil ou com unit_id === 'all' têm acesso irrestrito.
 * - Qualquer usuário (incluindo secretário ou assistente) com unit_id específico é restrito à sua unidade.
 */
export const getUserRestrictedUnit = (profile: any): string | null => {
  if (!profile) return null;
  const unitId = profile.unit_id || (profile as any).unitId || (profile as any).unit || (profile as any).polo;
  if (!unitId || typeof unitId !== 'string') return null;
  const norm = unitId.trim().toLowerCase();
  if (norm === '' || norm === 'all' || norm === 'todas' || norm === 'global') {
    return null;
  }
  return unitId.trim();
};
