import { useEffect, useState } from 'react';
import { Shield, FileText, Loader2 } from 'lucide-react';
import api from '../../api/axiosConfig';

export default function CouvertureEquipement({ ticketId }: { ticketId: number }) {
  const [couverture, setCouverture] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get(`/securitrack/tickets/${ticketId}/couverture/`)
      .then((r) => setCouverture(r.data.couverture))
      .catch(() => setCouverture(null))
      .finally(() => setLoading(false));
  }, [ticketId]);

  if (loading) return <div className="text-xs text-ink-soft"><Loader2 size={12} className="inline animate-spin" /> Vérification...</div>;
  if (!couverture) return null;

  return (
    <div className="bg-surface border border-line rounded-md p-3 mt-3 space-y-2">
      <p className="text-xs font-semibold text-ink">Prise en charge</p>
      
      <div className={`flex items-center gap-2 text-xs ${couverture.sous_contrat ? 'text-success' : 'text-danger'}`}>
        <FileText size={14} /> 
        {couverture.sous_contrat ? 'Couvert par un contrat' : 'Hors contrat'}
      </div>

      <div className={`flex items-center gap-2 text-xs ${couverture.sous_garantie ? 'text-success' : 'text-warning'}`}>
        <Shield size={14} /> 
        {couverture.sous_garantie ? `Sous garantie (${couverture.garantie_jours_restants} j restants)` : 'Garantie expirée'}
      </div>
    </div>
  );
}