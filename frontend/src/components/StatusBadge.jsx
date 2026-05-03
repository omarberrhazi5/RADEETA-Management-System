import Badge from './ui/Badge';

export default function StatusBadge({ status }) {
  const value = String(status ?? '').toLowerCase();
  const color = value === 'payee' ? 'green' : value === 'partielle' ? 'amber' : value === 'impayee' ? 'red' : 'gray';
  const label = {
    payee: 'Payee',
    partielle: 'Partielle',
    impayee: 'Impayee',
  }[value] ?? status ?? 'N/A';

  return <Badge label={label} color={color} />;
}
