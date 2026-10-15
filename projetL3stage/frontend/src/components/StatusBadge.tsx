const COLORS: Record<string, string> = {
  OUVERT: 'bg-yellow-100 text-yellow-800',
  AFFECTE: 'bg-blue-100 text-blue-800',
  EN_COURS: 'bg-purple-100 text-purple-800',
  CLOTURE: 'bg-green-100 text-green-800',
  TERMINEE: 'bg-orange-100 text-orange-800',
  VALIDEE: 'bg-green-100 text-green-800',
  HAUTE: 'bg-red-100 text-red-800',
  MOYENNE: 'bg-gray-100 text-gray-800',
};

export default function StatusBadge({ value }: { value: string }) {
  return (
    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${COLORS[value] || 'bg-gray-100 text-gray-800'}`}>
      {value}
    </span>
  );
}