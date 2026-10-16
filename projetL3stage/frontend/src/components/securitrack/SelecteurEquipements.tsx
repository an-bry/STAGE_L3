import { Check} from 'lucide-react';
import type { Equipement } from '../../types/securitrack';
import { StatutEquipementBadge } from './badges';

export default function SelecteurEquipements({
  equipements,
  selection,
  onChange,
  loading,
}: {
  equipements: Equipement[];
  selection: number[];
  onChange: (ids: number[]) => void;
  loading?: boolean;
}) {
  const toggle = (id: number) => {
    if (selection.includes(id)) {
      onChange(selection.filter((x) => x !== id));
    } else {
      onChange([...selection, id]);
    }
  };

  const toutSelectionner = () => onChange(equipements.map((e) => e.id));
  const toutDeselectionner = () => onChange([]);

  if (loading) {
    return (
      <div className="bg-surface rounded-md p-4 text-sm text-ink-soft text-center">
        Chargement des équipements…
      </div>
    );
  }

  if (equipements.length === 0) {
    return (
      <div className="bg-surface rounded-md p-4 text-sm text-ink-soft text-center">
        Aucun équipement pour ce client.
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {/* Barre d'action */}
      <div className="flex items-center justify-between text-xs">
        <span className="text-ink-soft">
          {selection.length} / {equipements.length} sélectionné{selection.length > 1 ? 's' : ''}
        </span>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={toutSelectionner}
            className="text-primary hover:underline"
          >
            Tout
          </button>
          <button
            type="button"
            onClick={toutDeselectionner}
            className="text-ink-soft hover:underline"
          >
            Aucun
          </button>
        </div>
      </div>

      {/* Liste */}
      <div className="max-h-64 overflow-y-auto border border-line rounded-md divide-y divide-line">
        {equipements.map((eq) => {
          const checked = selection.includes(eq.id);
          return (
            <button
              key={eq.id}
              type="button"
              onClick={() => toggle(eq.id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 text-left transition-colors ${
                checked ? 'bg-primary-soft' : 'hover:bg-surface'
              }`}
            >
              {/* Checkbox custom */}
              <div
                className={`w-4 h-4 rounded border-2 flex items-center justify-center shrink-0 transition-colors ${
                  checked ? 'bg-primary border-primary' : 'border-line-strong'
                }`}
              >
                {checked && <Check size={11} className="text-white" strokeWidth={3} />}
              </div>

              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-ink truncate">
                  {eq.model}
                </p>
                <p className="text-xs text-ink-soft truncate">
                  {eq.type_equipement}
                  {eq.adresse_ip && ` • ${eq.adresse_ip}`}
                  {eq.site_nom && ` • ${eq.site_nom}`}
                </p>
              </div>

              <StatutEquipementBadge statut={eq.statut} />
            </button>
          );
        })}
      </div>
    </div>
  );
}