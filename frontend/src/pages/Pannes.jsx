import { useEffect, useState, useCallback } from 'react';
import { FileSpreadsheet, FileText, Plus, Pencil, Trash2, Search, Wrench } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { downloadFile } from '../api/download';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';
import Modal from '../components/ui/Modal';
import ConfirmDialog from '../components/ui/ConfirmDialog';

// ── Anomaly list from your project annexe ─────────────────────────
const ANOMALIES = [
  'Relevé sans anomalie',
  'Local vide',
  'Compteur posé à l\'envers',
  'Compteur mal posé',
  'Fuite côté abonné',
  'Fuite côté RADEETA',
  'Compteur déplombé',
  'Fuite compteur',
  'Fraude',
  'Compteur déposé',
  'Refus abonné',
  'Compteur à l\'intérieur',
  'Compteur enterré',
  'Existence by-pass sur CG',
  'Index illisible',
  'Compteur cassé',
  'Compteur bloqué',
  'Tête détériorée',
  'Compteur changé',
  'Passage à zéro',
  'Compteur introuvable',
  'Compteur inaccessible',
];

// ── helpers ────────────────────────────────────────────────────────
function getStatutColor(statut) {
  if (!statut) return 'gray';
  const s = statut.toLowerCase();
  if (s === 'ouverte')  return 'red';
  if (s === 'en cours') return 'amber';
  if (s === 'résolue')  return 'green';
  return 'gray';
}

const EMPTY_FORM = {
  id_compteur: '',
  anomalie:    '',
  date_panne:  '',
  description: '',
  statut:      'ouverte',
};

// ── main component ─────────────────────────────────────────────────
export default function Pannes() {
  const navigate = useNavigate();
  const role = localStorage.getItem('user_role');
  const canExport = role === 'admin' || role === 'manager';

  const [pannes, setPannes]       = useState([]);
  const [compteurs, setCompteurs] = useState([]);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState('');
  const [downloading, setDownloading] = useState('');

  // Filters
  const [search, setSearch]             = useState('');
  const [filterStatut, setFilterStatut] = useState('');
  const [filterAnomalie, setFilterAnomalie] = useState('');

  // Pagination
  const [page, setPage] = useState(1);
  const [meta, setMeta] = useState(null);

  // Modal
  const [showModal, setShowModal]   = useState(false);
  const [editPanne, setEditPanne]   = useState(null);
  const [form, setForm]             = useState(EMPTY_FORM);
  const [formErrors, setFormErrors] = useState({});
  const [saving, setSaving]         = useState(false);

  // Delete
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting]         = useState(false);

  // ── fetch pannes ─────────────────────────────────────────────────
  const fetchPannes = useCallback(async () => {
    try {
      setLoading(true);
      setError('');

      const params = {
        page,
        ...(search         && { search }),
        ...(filterStatut   && { statut: filterStatut }),
        ...(filterAnomalie && { anomalie: filterAnomalie }),
      };

      const res = await api.get('/pannes', { params });

      if (res.data.data) {
        setPannes(res.data.data);
        setMeta(res.data.meta ?? res.data);
      } else {
        setPannes(res.data);
        setMeta(null);
      }
    } catch {
      setError('Impossible de charger les pannes.');
    } finally {
      setLoading(false);
    }
  }, [page, search, filterStatut, filterAnomalie]);

  // ── fetch compteurs for select ───────────────────────────────────
  async function fetchCompteurs() {
    try {
      const res = await api.get('/compteurs?limit=500');
      setCompteurs(res.data.data ?? res.data);
    } catch {
      console.warn('Could not load compteurs');
    }
  }

  useEffect(() => { fetchCompteurs(); }, []);
  useEffect(() => { fetchPannes(); }, [fetchPannes]);
  useEffect(() => { setPage(1); }, [search, filterStatut, filterAnomalie]);

  // ── modal helpers ────────────────────────────────────────────────
  function openAdd() {
    setEditPanne(null);
    setForm({
      ...EMPTY_FORM,
      date_panne: new Date().toISOString().split('T')[0], // today
    });
    setFormErrors({});
    setShowModal(true);
  }

  function openEdit(panne) {
    setEditPanne(panne);
    setForm({
      id_compteur: panne.id_compteur  ?? '',
      anomalie:    panne.anomalie     ?? '',
      date_panne:  panne.date_panne   ?? '',
      description: panne.description  ?? '',
      statut:      panne.statut       ?? 'ouverte',
    });
    setFormErrors({});
    setShowModal(true);
  }

  function closeModal() {
    setShowModal(false);
    setEditPanne(null);
    setForm(EMPTY_FORM);
  }

  function handleFormChange(e) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    setFormErrors((prev) => ({ ...prev, [name]: '' }));
  }

  // ── validation ───────────────────────────────────────────────────
  function validate() {
    const errors = {};
    if (!form.id_compteur) errors.id_compteur = 'Veuillez choisir un compteur.';
    if (!form.anomalie)    errors.anomalie    = 'Veuillez choisir une anomalie.';
    if (!form.date_panne)  errors.date_panne  = 'La date est requise.';
    return errors;
  }

  // ── save ─────────────────────────────────────────────────────────
  async function handleSave() {
    const errors = validate();
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    try {
      setSaving(true);
      if (editPanne) {
        await api.put(`/pannes/${editPanne.id_panne}`, form);
      } else {
        await api.post('/pannes', form);
      }
      closeModal();
      fetchPannes();
    } catch (err) {
      if (err.response?.data?.errors) {
        setFormErrors(err.response.data.errors);
      } else {
        setFormErrors({ general: 'Une erreur est survenue. Réessayez.' });
      }
    } finally {
      setSaving(false);
    }
  }

  // ── quick statut update ──────────────────────────────────────────
  async function updateStatut(panne, newStatut) {
    try {
      await api.put(`/pannes/${panne.id_panne}`, {
        ...panne,
        statut: newStatut,
      });
      fetchPannes();
    } catch {
      alert('Erreur lors de la mise à jour du statut.');
    }
  }

  // ── delete ───────────────────────────────────────────────────────
  async function handleDelete() {
    try {
      setDeleting(true);
      await api.delete(`/pannes/${deleteTarget.id_panne}`);
      setDeleteTarget(null);
      fetchPannes();
    } catch {
      alert('Erreur lors de la suppression.');
    } finally {
      setDeleting(false);
    }
  }

  // ── navigate to réparations with panne pre-selected ──────────────
  function handleCreateReparation(panne) {
    navigate('/reparations', {
      state: { fromPanne: panne },
    });
  }

  async function handleDownload(url, filename, type) {
    try {
      setDownloading(type);
      await downloadFile(url, filename);
    } catch (err) {
      console.error(err);
      setError('Impossible de télécharger le rapport.');
    } finally {
      setDownloading('');
    }
  }

  // ── render ───────────────────────────────────────────────────────
  return (
    <div className="space-y-5">

      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-base font-semibold text-gray-800">Pannes</h2>
          <p className="text-xs text-gray-400 mt-0.5">
            {meta?.total ?? pannes.length} pannes enregistrées
          </p>
        </div>
        <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:flex-wrap sm:items-center sm:justify-end">
          {canExport && (
            <div className="grid w-full grid-cols-1 gap-2 sm:w-auto sm:grid-cols-2">
              <Button
                variant="danger"
                className="w-full sm:w-auto"
                loading={downloading === 'pdf'}
                onClick={() => handleDownload('/reports/pannes/pdf', 'pannes-du-mois.pdf', 'pdf')}
              >
                <FileText size={14} />
                Exporter PDF
              </Button>
              <Button
                variant="success"
                className="w-full sm:w-auto"
                loading={downloading === 'excel'}
                onClick={() => handleDownload('/reports/clients/excel', 'clients-compteurs.xlsx', 'excel')}
              >
                <FileSpreadsheet size={14} />
                Exporter Excel
              </Button>
            </div>
          )}
          <Button variant="primary" className="w-full sm:w-auto" onClick={openAdd}>
            <Plus size={14} />
            Signaler une panne
          </Button>
        </div>
      </div>

      {/* Summary badges */}
      <div className="flex flex-wrap gap-3">
        {[
          { label: 'Ouvertes',  statut: 'ouverte',  color: 'bg-red-50   text-red-600   border-red-100'   },
          { label: 'En cours',  statut: 'en cours', color: 'bg-amber-50 text-amber-600 border-amber-100' },
          { label: 'Résolues',  statut: 'résolue',  color: 'bg-green-50 text-green-600 border-green-100' },
        ].map(({ label, statut, color }) => {
          const count = pannes.filter(
            (p) => p.statut?.toLowerCase() === statut
          ).length;
          return (
            <button
              key={statut}
              onClick={() =>
                setFilterStatut(filterStatut === statut ? '' : statut)
              }
              className={`text-xs font-medium px-3 py-1.5 rounded-full border transition-all ${color} ${
                filterStatut === statut ? 'ring-2 ring-offset-1 ring-current' : ''
              }`}
            >
              {label}: {count}
            </button>
          );
        })}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[180px] max-w-xs">
          <Search
            size={13}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
          />
          <input
            type="text"
            placeholder="Cadran du compteur..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-8 pr-3 py-2 text-sm border border-gray-200 rounded-lg text-gray-700 placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-300"
          />
        </div>

        <select
          value={filterAnomalie}
          onChange={(e) => setFilterAnomalie(e.target.value)}
          className="text-sm border border-gray-200 rounded-lg px-3 py-2 text-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-100"
        >
          <option value="">Toutes les anomalies</option>
          {ANOMALIES.map((a) => (
            <option key={a} value={a}>{a}</option>
          ))}
        </select>

        <select
          value={filterStatut}
          onChange={(e) => setFilterStatut(e.target.value)}
          className="text-sm border border-gray-200 rounded-lg px-3 py-2 text-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-100"
        >
          <option value="">Tous les statuts</option>
          <option value="ouverte">Ouverte</option>
          <option value="en cours">En cours</option>
          <option value="résolue">Résolue</option>
        </select>
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-50 border border-red-100 text-red-600 text-sm rounded-xl px-4 py-3">
          ⚠ {error}
        </div>
      )}

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px] text-sm">
            <thead>
              <tr className="border-b border-gray-50 bg-gray-50/60">
                <th className="text-left text-xs font-medium text-gray-400 px-5 py-3">N° Panne</th>
                <th className="text-left text-xs font-medium text-gray-400 px-5 py-3">Compteur</th>
                <th className="text-left text-xs font-medium text-gray-400 px-5 py-3">Anomalie</th>
                <th className="text-left text-xs font-medium text-gray-400 px-5 py-3">Secteur</th>
                <th className="text-left text-xs font-medium text-gray-400 px-5 py-3">Date</th>
                <th className="text-left text-xs font-medium text-gray-400 px-5 py-3">Statut</th>
                <th className="text-left text-xs font-medium text-gray-400 px-5 py-3">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading ? (
                [...Array(5)].map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    {[...Array(7)].map((__, j) => (
                      <td key={j} className="px-5 py-4">
                        <div className="h-3 bg-gray-100 rounded w-3/4" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : pannes.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-sm text-gray-400">
                    Aucune panne trouvée.
                  </td>
                </tr>
              ) : (
                pannes.map((panne) => (
                  <tr
                    key={panne.id_panne}
                    className="hover:bg-gray-50/60 transition-colors"
                  >
                    <td className="px-5 py-3.5 font-mono text-xs text-gray-400">
                      #{String(panne.id_panne).padStart(3, '0')}
                    </td>

                    <td className="px-5 py-3.5 font-mono text-xs text-gray-700 font-medium">
                      {panne.compteur?.cadran ?? '—'}
                    </td>

                    <td className="px-5 py-3.5 text-xs text-gray-600 max-w-[180px]">
                      <span
                        className="truncate block"
                        title={panne.anomalie}
                      >
                        {panne.anomalie ?? '—'}
                      </span>
                    </td>

                    <td className="px-5 py-3.5 text-xs text-gray-500">
                      {panne.compteur?.secteur?.nom_secteur ?? '—'}
                    </td>

                    <td className="px-5 py-3.5 text-xs text-gray-400">
                      {panne.date_panne
                        ? new Date(panne.date_panne).toLocaleDateString('fr-MA')
                        : '—'}
                    </td>

                    {/* Statut — clickable to advance workflow */}
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-2">
                        <Badge
                          label={panne.statut ?? 'Inconnu'}
                          color={getStatutColor(panne.statut)}
                        />
                        {/* Quick advance button */}
                        {panne.statut === 'ouverte' && (
                          <button
                            onClick={() => updateStatut(panne, 'en cours')}
                            className="text-[10px] text-amber-600 hover:underline"
                            title="Marquer en cours"
                          >
                            → En cours
                          </button>
                        )}
                        {panne.statut === 'en cours' && (
                          <button
                            onClick={() => updateStatut(panne, 'résolue')}
                            className="text-[10px] text-green-600 hover:underline"
                            title="Marquer résolue"
                          >
                            → Résolue
                          </button>
                        )}
                      </div>
                    </td>

                    {/* Actions */}
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-1.5">
                        {/* Create repair — only for non-resolved pannes */}
                        {panne.statut !== 'résolue' && (
                          <button
                            onClick={() => handleCreateReparation(panne)}
                            className="inline-flex h-10 w-10 items-center justify-center rounded-lg text-gray-400 hover:text-green-600 hover:bg-green-50 transition-colors"
                            title="Créer une réparation"
                          >
                            <Wrench size={14} />
                          </button>
                        )}
                        <button
                          onClick={() => openEdit(panne)}
                          className="inline-flex h-10 w-10 items-center justify-center rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                          title="Modifier"
                        >
                          <Pencil size={14} />
                        </button>
                        <button
                          onClick={() => setDeleteTarget(panne)}
                          className="inline-flex h-10 w-10 items-center justify-center rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                          title="Supprimer"
                        >
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

        {/* Pagination */}
        {meta && meta.last_page > 1 && (
          <div className="flex flex-col gap-3 px-5 py-3.5 border-t border-gray-50 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs text-gray-400">
              Page {meta.current_page} sur {meta.last_page}
              {meta.total && ` — ${meta.total} pannes`}
            </p>
            <div className="flex gap-2">
              <Button
                variant="secondary"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
              >
                ← Précédent
              </Button>
              <Button
                variant="secondary"
                onClick={() => setPage((p) => p + 1)}
                disabled={page >= meta.last_page}
              >
                Suivant →
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Add / Edit Modal */}
      {showModal && (
        <Modal
          title={editPanne ? 'Modifier la panne' : 'Signaler une panne'}
          onClose={closeModal}
        >
          <div className="space-y-4">

            {formErrors.general && (
              <div className="bg-red-50 border border-red-100 text-red-600 text-xs rounded-lg px-3 py-2">
                {formErrors.general}
              </div>
            )}

            {/* Compteur */}
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1.5">
                Compteur <span className="text-red-400">*</span>
              </label>
              <select
                name="id_compteur"
                value={form.id_compteur}
                onChange={handleFormChange}
                className={`w-full px-3 py-2 text-sm border rounded-lg text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-300 ${formErrors.id_compteur ? 'border-red-300' : 'border-gray-200'}`}
              >
                <option value="">Choisir un compteur</option>
                {compteurs.map((c) => (
                  <option key={c.id_compteur} value={c.id_compteur}>
                    {c.cadran}
                    {c.client
                      ? ` — ${c.client.nom} ${c.client.prenom}`
                      : ''}
                  </option>
                ))}
              </select>
              {formErrors.id_compteur && (
                <p className="text-xs text-red-500 mt-1">{formErrors.id_compteur}</p>
              )}
            </div>

            {/* Anomalie */}
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1.5">
                Type d'anomalie <span className="text-red-400">*</span>
              </label>
              <select
                name="anomalie"
                value={form.anomalie}
                onChange={handleFormChange}
                className={`w-full px-3 py-2 text-sm border rounded-lg text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-300 ${formErrors.anomalie ? 'border-red-300' : 'border-gray-200'}`}
              >
                <option value="">Choisir une anomalie</option>
                {ANOMALIES.map((a) => (
                  <option key={a} value={a}>{a}</option>
                ))}
              </select>
              {formErrors.anomalie && (
                <p className="text-xs text-red-500 mt-1">{formErrors.anomalie}</p>
              )}
            </div>

            {/* Date + Statut */}
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1.5">
                  Date de panne <span className="text-red-400">*</span>
                </label>
                <input
                  name="date_panne"
                  type="date"
                  value={form.date_panne}
                  onChange={handleFormChange}
                  className={`w-full px-3 py-2 text-sm border rounded-lg text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-300 ${formErrors.date_panne ? 'border-red-300' : 'border-gray-200'}`}
                />
                {formErrors.date_panne && (
                  <p className="text-xs text-red-500 mt-1">{formErrors.date_panne}</p>
                )}
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1.5">Statut</label>
                <select
                  name="statut"
                  value={form.statut}
                  onChange={handleFormChange}
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-300"
                >
                  <option value="ouverte">Ouverte</option>
                  <option value="en cours">En cours</option>
                  <option value="résolue">Résolue</option>
                </select>
              </div>
            </div>

            {/* Description */}
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1.5">
                Description (optionnel)
              </label>
              <textarea
                name="description"
                value={form.description}
                onChange={handleFormChange}
                rows={3}
                placeholder="Détails supplémentaires sur la panne..."
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg text-gray-800 placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-300 resize-none"
              />
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-3 pt-2 border-t border-gray-50">
              <Button variant="secondary" onClick={closeModal}>
                Annuler
              </Button>
              <Button variant="primary" onClick={handleSave} loading={saving}>
                {editPanne ? 'Enregistrer les modifications' : 'Signaler la panne'}
              </Button>
            </div>

          </div>
        </Modal>
      )}

      {/* Delete confirmation */}
      {deleteTarget && (
        <ConfirmDialog
          message={`Voulez-vous vraiment supprimer la panne #${String(deleteTarget.id_panne).padStart(3, '0')} ? Cette action est irréversible.`}
          onConfirm={handleDelete}
          onCancel={() => setDeleteTarget(null)}
          loading={deleting}
        />
      )}

    </div>
  );
}
