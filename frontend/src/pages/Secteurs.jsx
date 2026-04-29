import { useCallback, useEffect, useState } from 'react';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import api from '../api/axios';
import Button from '../components/ui/Button';
import Modal from '../components/ui/Modal';
import ConfirmDialog from '../components/ui/ConfirmDialog';

const EMPTY_FORM = {
  nom_secteur: '',
  emplacement: 'Taza Haut',
  num_torne: '',
};

export default function Secteurs() {
  const [secteurs, setSecteurs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [meta, setMeta] = useState(null);
  const [page, setPage] = useState(1);
  const [showModal, setShowModal] = useState(false);
  const [editSecteur, setEditSecteur] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [formErrors, setFormErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const fetchSecteurs = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const res = await api.get('/secteurs', { params: { page } });
      setSecteurs(res.data.data ?? res.data);
      setMeta(res.data.meta ?? null);
    } catch {
      setError('Impossible de charger les secteurs.');
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => {
    fetchSecteurs();
  }, [fetchSecteurs]);

  function openAdd() {
    setEditSecteur(null);
    setForm(EMPTY_FORM);
    setFormErrors({});
    setShowModal(true);
  }

  function openEdit(secteur) {
    setEditSecteur(secteur);
    setForm({
      nom_secteur: secteur.nom_secteur ?? '',
      emplacement: secteur.emplacement ?? 'Taza Haut',
      num_torne: secteur.num_torne ?? '',
    });
    setFormErrors({});
    setShowModal(true);
  }

  function closeModal() {
    setShowModal(false);
    setEditSecteur(null);
    setForm(EMPTY_FORM);
  }

  function handleFormChange(e) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    setFormErrors((prev) => ({ ...prev, [name]: '' }));
  }

  function validate() {
    const errors = {};
    if (!form.nom_secteur.trim()) errors.nom_secteur = 'Le nom du secteur est requis.';
    if (!form.num_torne.trim()) errors.num_torne = 'Le numero de tournee est requis.';
    return errors;
  }

  async function handleSave() {
    const errors = validate();
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    try {
      setSaving(true);
      if (editSecteur) {
        await api.put(`/secteurs/${editSecteur.id_secteur}`, form);
      } else {
        await api.post('/secteurs', form);
      }
      closeModal();
      fetchSecteurs();
    } catch (err) {
      setFormErrors(err.response?.data?.errors ?? { general: 'Une erreur est survenue.' });
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    try {
      setDeleting(true);
      await api.delete(`/secteurs/${deleteTarget.id_secteur}`);
      setDeleteTarget(null);
      fetchSecteurs();
    } catch {
      alert('Erreur lors de la suppression.');
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-base font-semibold text-gray-800">Secteurs</h2>
          <p className="text-xs text-gray-400 mt-0.5">
            {meta?.total ?? secteurs.length} secteurs enregistres
          </p>
        </div>
        <Button variant="primary" onClick={openAdd}>
          <Plus size={14} />
          Ajouter secteur
        </Button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-100 text-red-600 text-sm rounded-xl px-4 py-3">
          {error}
        </div>
      )}

      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-sm">
            <thead>
              <tr className="border-b border-gray-50 bg-gray-50/60">
                <th className="text-left text-xs font-medium text-gray-400 px-5 py-3">Nom</th>
                <th className="text-left text-xs font-medium text-gray-400 px-5 py-3">Emplacement</th>
                <th className="text-left text-xs font-medium text-gray-400 px-5 py-3">Tournee</th>
                <th className="text-left text-xs font-medium text-gray-400 px-5 py-3">Compteurs</th>
                <th className="text-left text-xs font-medium text-gray-400 px-5 py-3">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading ? (
                <tr>
                  <td colSpan={5} className="text-center py-12 text-sm text-gray-400">Chargement...</td>
                </tr>
              ) : secteurs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-12 text-sm text-gray-400">Aucun secteur trouve.</td>
                </tr>
              ) : (
                secteurs.map((secteur) => (
                  <tr key={secteur.id_secteur} className="hover:bg-gray-50/60 transition-colors">
                    <td className="px-5 py-3.5 font-medium text-gray-800">{secteur.nom_secteur}</td>
                    <td className="px-5 py-3.5 text-xs text-gray-500">{secteur.emplacement}</td>
                    <td className="px-5 py-3.5 text-xs text-gray-500">{secteur.num_torne}</td>
                    <td className="px-5 py-3.5 text-xs text-gray-500">{secteur.compteurs?.length ?? 0}</td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-2">
                        <button onClick={() => openEdit(secteur)} className="inline-flex h-10 w-10 items-center justify-center rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50" title="Modifier">
                          <Pencil size={14} />
                        </button>
                        <button onClick={() => setDeleteTarget(secteur)} className="inline-flex h-10 w-10 items-center justify-center rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50" title="Supprimer">
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {meta && meta.last_page > 1 && (
          <div className="flex flex-col gap-3 px-5 py-3.5 border-t border-gray-50 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs text-gray-400">Page {meta.current_page} sur {meta.last_page}</p>
            <div className="flex gap-2">
              <Button variant="secondary" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}>Precedent</Button>
              <Button variant="secondary" onClick={() => setPage((p) => p + 1)} disabled={page >= meta.last_page}>Suivant</Button>
            </div>
          </div>
        )}
      </div>

      {showModal && (
        <Modal title={editSecteur ? 'Modifier le secteur' : 'Ajouter un secteur'} onClose={closeModal}>
          <div className="space-y-4">
            {formErrors.general && (
              <div className="bg-red-50 border border-red-100 text-red-600 text-xs rounded-lg px-3 py-2">{formErrors.general}</div>
            )}
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1.5">Nom du secteur</label>
              <input name="nom_secteur" value={form.nom_secteur} onChange={handleFormChange} className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg" />
              {formErrors.nom_secteur && <p className="text-xs text-red-500 mt-1">{formErrors.nom_secteur}</p>}
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1.5">Emplacement</label>
                <select name="emplacement" value={form.emplacement} onChange={handleFormChange} className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg">
                  <option value="Taza Haut">Taza Haut</option>
                  <option value="Taza Bas">Taza Bas</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1.5">Tournee</label>
                <input name="num_torne" value={form.num_torne} onChange={handleFormChange} className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg" />
                {formErrors.num_torne && <p className="text-xs text-red-500 mt-1">{formErrors.num_torne}</p>}
              </div>
            </div>
            <div className="flex justify-end gap-3 pt-2 border-t border-gray-50">
              <Button variant="secondary" onClick={closeModal}>Annuler</Button>
              <Button variant="primary" onClick={handleSave} loading={saving}>{editSecteur ? 'Enregistrer' : 'Creer'}</Button>
            </div>
          </div>
        </Modal>
      )}

      {deleteTarget && (
        <ConfirmDialog
          message={`Voulez-vous vraiment supprimer le secteur "${deleteTarget.nom_secteur}" ?`}
          onConfirm={handleDelete}
          onCancel={() => setDeleteTarget(null)}
          loading={deleting}
        />
      )}
    </div>
  );
}
