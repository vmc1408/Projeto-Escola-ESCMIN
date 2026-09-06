import React, { useState } from 'react';
import { 
  Building2, 
  Plus, 
  Edit2, 
  Trash2, 
  MapPin, 
  Phone, 
  Mail, 
  CheckCircle2, 
  AlertCircle, 
  Check, 
  X, 
  School,
  ShieldAlert,
  Loader2,
  Info
} from 'lucide-react';
import { useUnits } from '../contexts/UnitContext';
import { Unit } from '../types';
import { saveUnit, deleteUnit } from '../lib/unitService';
import { cn } from '../lib/utils';

export function UnitsSettingsTab() {
  const { units, refreshUnits, loading } = useUnits();
  const [editingUnit, setEditingUnit] = useState<Partial<Unit> | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const handleOpenCreate = () => {
    const nextNum = units.length;
    setEditingUnit({
      code: `FIL-${String(nextNum).padStart(2, '0')}`,
      name: '',
      is_main: false,
      active: true,
      address: '',
      city: '',
      state: '',
      phone: '',
      email: ''
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (unit: Unit) => {
    setEditingUnit({ ...unit });
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUnit || !editingUnit.name?.trim()) {
      setFeedback({ type: 'error', message: 'O nome da unidade é obrigatório.' });
      return;
    }

    setSaving(true);
    setFeedback(null);
    try {
      await saveUnit(editingUnit);
      await refreshUnits();
      setIsModalOpen(false);
      setEditingUnit(null);
      setFeedback({ type: 'success', message: 'Unidade salva com sucesso!' });
      setTimeout(() => setFeedback(null), 4000);
    } catch (error: any) {
      console.error('Erro ao salvar unidade:', error);
      setFeedback({ type: 'error', message: error.message || 'Falha ao salvar a unidade.' });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (unit: Unit) => {
    if (unit.is_main || unit.id === 'matriz') {
      alert('A Unidade Sede / Matriz é o polo principal do sistema e não pode ser excluída.');
      return;
    }

    if (!window.confirm(`Tem certeza que deseja excluir a unidade "${unit.name}"? As turmas associadas deverão ser reatribuídas à Matriz.`)) {
      return;
    }

    setDeletingId(unit.id);
    try {
      await deleteUnit(unit.id);
      await refreshUnits();
      setFeedback({ type: 'success', message: 'Unidade excluída com sucesso.' });
      setTimeout(() => setFeedback(null), 4000);
    } catch (error: any) {
      console.error('Erro ao excluir unidade:', error);
      setFeedback({ type: 'error', message: error.message || 'Falha ao excluir a unidade.' });
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Feedback Notification */}
      {feedback && (
        <div className={cn(
          "p-4 rounded-xl flex items-center justify-between shadow-sm animate-in fade-in duration-200",
          feedback.type === 'success' ? "bg-emerald-50 text-emerald-800 border border-emerald-200" : "bg-red-50 text-red-800 border border-red-200"
        )}>
          <div className="flex items-center gap-2">
            {feedback.type === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
            <span className="text-xs font-bold">{feedback.message}</span>
          </div>
          <button onClick={() => setFeedback(null)} className="opacity-70 hover:opacity-100">
            <X size={16} />
          </button>
        </div>
      )}

      {/* Header Info Card */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 border border-blue-100 flex items-center justify-center shrink-0">
            <Building2 size={24} />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-800">Unidades e Filiais (Polos)</h2>
            <p className="text-xs text-slate-500 mt-1 max-w-2xl leading-relaxed">
              Gerencie a <strong>Sede / Matriz</strong> e os <strong>Polos e Filiais</strong> da instituição. 
              O cadastro de alunos, professores e matriz curricular permanece compartilhado, enquanto turmas e chamadas podem ser segmentadas por local de funcionamento.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleOpenCreate}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold uppercase tracking-wider transition-all shadow-xs active:scale-95 shrink-0 cursor-pointer"
        >
          <Plus size={16} />
          Nova Filial / Polo
        </button>
      </div>

      {/* Notice Banner */}
      <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-4 flex items-start gap-3">
        <Info size={18} className="text-blue-600 shrink-0 mt-0.5" />
        <div className="text-xs text-slate-600 space-y-1">
          <p className="font-semibold text-slate-800">
            Como funciona a visão de múltiplas unidades:
          </p>
          <p>
            • <strong>Enquanto houver apenas a Matriz:</strong> O sistema mantém a interface simplificada, sem filtros desnecessários.
          </p>
          <p>
            • <strong>Ao cadastrar a 2ª unidade:</strong> O sistema libera automaticamente o seletor de unidades no topo, filtros em Turmas e Alunos, e direcionamento por filial.
          </p>
        </div>
      </div>

      {/* Units Grid / List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {units.map((unit) => {
          const isMain = unit.is_main || unit.id === 'matriz';
          const isActive = unit.active !== false;

          return (
            <div 
              key={unit.id}
              className={cn(
                "bg-white rounded-xl border p-5 transition-all flex flex-col justify-between relative",
                isMain 
                  ? "border-blue-200 shadow-xs ring-1 ring-blue-100" 
                  : "border-slate-200 hover:border-slate-300 shadow-2xs"
              )}
            >
              <div>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <div className={cn(
                      "w-9 h-9 rounded-lg flex items-center justify-center font-bold text-xs shrink-0",
                      isMain ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-700"
                    )}>
                      {unit.code || (isMain ? 'MAT' : 'FIL')}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-sm font-bold text-slate-900">{unit.name}</h3>
                        {isMain && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-800">
                            Sede Principal
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-400 font-mono mt-0.5">Código: {unit.code}</p>
                    </div>
                  </div>

                  <span className={cn(
                    "text-[10px] font-bold px-2 py-0.5 rounded-full",
                    isActive ? "bg-emerald-50 text-emerald-700 border border-emerald-200/60" : "bg-slate-100 text-slate-500"
                  )}>
                    {isActive ? 'Ativa' : 'Inativa'}
                  </span>
                </div>

                {/* Details */}
                <div className="mt-4 pt-3 border-t border-slate-100 space-y-1.5 text-xs text-slate-600">
                  <div className="flex items-center gap-2 text-slate-500">
                    <MapPin size={13} className="shrink-0 text-slate-400" />
                    <span className="truncate">
                      {unit.address ? `${unit.address}${unit.city ? ` - ${unit.city}` : ''}` : 'Endereço não informado'}
                    </span>
                  </div>

                  {unit.phone && (
                    <div className="flex items-center gap-2 text-slate-500">
                      <Phone size={13} className="shrink-0 text-slate-400" />
                      <span>{unit.phone}</span>
                    </div>
                  )}

                  {unit.email && (
                    <div className="flex items-center gap-2 text-slate-500">
                      <Mail size={13} className="shrink-0 text-slate-400" />
                      <span className="truncate">{unit.email}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => handleOpenEdit(unit)}
                  className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-slate-600 hover:text-blue-700 hover:bg-blue-50 transition-colors cursor-pointer"
                >
                  <Edit2 size={13} />
                  Editar
                </button>

                {!isMain && (
                  <button
                    type="button"
                    disabled={deletingId === unit.id}
                    onClick={() => handleDelete(unit)}
                    className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer disabled:opacity-50"
                  >
                    {deletingId === unit.id ? <Loader2 size={13} className="animate-spin" /> : <Trash2 size={13} />}
                    Excluir
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal de Criação / Edição de Unidade */}
      {isModalOpen && editingUnit && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 max-w-lg w-full overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                  <Building2 size={16} />
                </div>
                <h3 className="text-sm font-bold text-slate-900">
                  {editingUnit.id ? 'Editar Unidade' : 'Cadastrar Nova Filial / Polo'}
                </h3>
              </div>
              <button 
                type="button" 
                onClick={() => { setIsModalOpen(false); setEditingUnit(null); }}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSave} className="p-6 space-y-4">
              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-1">
                  <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Código <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    maxLength={10}
                    value={editingUnit.code || ''}
                    onChange={(e) => setEditingUnit({ ...editingUnit, code: e.target.value.toUpperCase() })}
                    placeholder="Ex: FIL-01"
                    className="w-full px-3 py-2 text-xs font-mono font-bold uppercase rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div className="col-span-2">
                  <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Nome da Unidade / Polo <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={editingUnit.name || ''}
                    onChange={(e) => setEditingUnit({ ...editingUnit, name: e.target.value })}
                    placeholder="Ex: Filial Centro / Polo São Pedro"
                    className="w-full px-3 py-2 text-xs font-semibold rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Endereço Completo
                </label>
                <input
                  type="text"
                  value={editingUnit.address || ''}
                  onChange={(e) => setEditingUnit({ ...editingUnit, address: e.target.value })}
                  placeholder="Rua, número, bairro..."
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Cidade
                  </label>
                  <input
                    type="text"
                    value={editingUnit.city || ''}
                    onChange={(e) => setEditingUnit({ ...editingUnit, city: e.target.value })}
                    placeholder="Ex: São Paulo"
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Estado (UF)
                  </label>
                  <input
                    type="text"
                    maxLength={2}
                    value={editingUnit.state || ''}
                    onChange={(e) => setEditingUnit({ ...editingUnit, state: e.target.value.toUpperCase() })}
                    placeholder="Ex: SP"
                    className="w-full px-3 py-2 text-xs uppercase rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Telefone de Contato
                  </label>
                  <input
                    type="text"
                    value={editingUnit.phone || ''}
                    onChange={(e) => setEditingUnit({ ...editingUnit, phone: e.target.value })}
                    placeholder="(00) 00000-0000"
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                    E-mail do Polo
                  </label>
                  <input
                    type="email"
                    value={editingUnit.email || ''}
                    onChange={(e) => setEditingUnit({ ...editingUnit, email: e.target.value })}
                    placeholder="polo@exemplo.com"
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              {/* Status */}
              <div className="pt-2 flex items-center gap-3">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={editingUnit.active !== false}
                    onChange={(e) => setEditingUnit({ ...editingUnit, active: e.target.checked })}
                    className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 border-slate-300"
                  />
                  <span className="text-xs font-semibold text-slate-700">Unidade ativa para matrículas e turmas</span>
                </label>
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => { setIsModalOpen(false); setEditingUnit(null); }}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:text-slate-800 rounded-lg hover:bg-slate-100 cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="inline-flex items-center gap-2 px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold uppercase tracking-wider transition-all cursor-pointer shadow-xs active:scale-95 disabled:opacity-50"
                >
                  {saving ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
                  Salvar Unidade
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
