export default function TicketRef({ id }: { id: number }) {
  return <span className="text-brand font-semibold">TCK-{String(id).padStart(5, '0')}</span>;
}