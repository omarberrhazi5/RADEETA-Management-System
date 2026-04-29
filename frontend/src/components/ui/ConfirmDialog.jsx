import Modal from './Modal';
import Button from './Button';

export default function ConfirmDialog({ message, onConfirm, onCancel, loading }) {
  return (
    <Modal title="Confirmer la suppression" onClose={onCancel}>
      <p className="text-sm text-gray-600 mb-6">{message}</p>
      <div className="flex justify-end gap-3">
        <Button variant="secondary" onClick={onCancel}>
          Annuler
        </Button>
        <Button variant="danger" onClick={onConfirm} loading={loading}>
          Supprimer
        </Button>
      </div>
    </Modal>
  );
}