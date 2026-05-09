import Modal from './Modal';
import Button from './Button';
import { useTranslation } from 'react-i18next';

export default function ConfirmDialog({ message, onConfirm, onCancel, loading }) {
  const { t } = useTranslation();

  return (
    <Modal title={t('confirm.deleteTitle')} onClose={onCancel}>
      <p className="text-sm text-gray-600 mb-6">{message}</p>
      <div className="flex justify-end gap-3">
        <Button variant="secondary" onClick={onCancel}>
          {t('buttons.cancel')}
        </Button>
        <Button variant="danger" onClick={onConfirm} loading={loading}>
          {t('buttons.delete')}
        </Button>
      </div>
    </Modal>
  );
}
