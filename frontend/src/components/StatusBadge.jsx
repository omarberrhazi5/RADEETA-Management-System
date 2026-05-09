import Badge from './ui/Badge';
import { useTranslation } from 'react-i18next';
import { translateStatus } from '../utils/i18nLabels';

export default function StatusBadge({ status }) {
  const { t } = useTranslation();
  const value = String(status ?? '').toLowerCase();
  const color = value === 'payee' ? 'green' : value === 'partielle' ? 'amber' : value === 'impayee' ? 'red' : 'gray';
  const label = value ? translateStatus(t, value) : t('common.notAvailable');

  return <Badge label={label} color={color} />;
}
