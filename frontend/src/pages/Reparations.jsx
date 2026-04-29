import { useEffect, useState, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import { Plus, Pencil, Trash2, Search } from 'lucide-react';
import api from '../api/axios';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';
import Modal from '../components/ui/Modal';
import ConfirmDialog from '../components/ui/ConfirmDialog';

// ── helpers ────────────────────────────────────────────────────────
function getStatutColor(statut) {
  if (!statut) return 'gray';
  const s = statut.toLowerCase();
  if (s === 'effectuée')  return 'green';
  if (s === 'partielle')  return 'amber';
  if (s === 'echouée')    return 'red';
  return 'gray';
}

const EMPTY_FORM = {
  id_panne:        '',
  id_plombier:     '',
  date_reparation: '',
  description:     '',
  cout:            '',
  statut:          'effectuée',
};

// ── main component ─────────────────────────────────────────────────
export default function Reparations() {
  // Check if we arrived from Pannes page with a pre-selected panne
  const location = useLocation();
  const fromPanne = location.state?.fromPanne ?? null;

  const [reparations, setReparations] = useState([]);
  const [pannes, setPannes]           = useState([]);
  const [plombiers, setPlombiers]     = useState([]);
  const [loading, setLoading]         = useState(true);
  const [error, setError]             = useState('');

  // Filters
  const [search, setSearch]             = useState('');
  const [filterStatut, setFilterStatut] = useState('');

  // Pagination
  const [page, setPage] = useState(1);
  const [meta, setMeta] = useState(null);

  // Modal
  const [showModal, setShowModal]         = useState(false);
  const [editReparation, setEditReparation] = useState(null);
  const [form, setForm]                   = useState(EMPTY_FORM);
  const [formErrors, setFormErrors]       = useState({});
  const [saving, setSaving]               = useState(false);

  // Delete
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting]         = useState(false);

  // ── if arrived from Pannes, open modal pre-filled ────────────────
  useEffect(() => {
    if (fromPanne) {
      setForm({
        ...EMPTY_FORM,
        id_panne:        fromPanne.id_panne,
        date_reparation: new Date().toISOString().split('T')[0],
      });
      setFormErrors({});
      setShowModal(true);

      // Clear navigation state so refresh doesn't re-open modal
      window.history.replaceState({}, document.title);
    }
  }, [fromPanne]);

  // ── fetch réparations ────────────────────────────────────────────
  const fetchReparations = useCallback(async () => {
    try {
      setLoading(true);
      setError('');

      const params = {
        page,
        ...(search       && { search }),
        ...(filterStatut && { statut: filterStatut }),
      };

      const res = await api.get('/reparations', { params });

      if (res.data.data) {
        setReparations(res.data.data);
        setMeta(res.data.meta ?? res.data);
      } else {
        setReparations(res.data);
        setMeta(null);
      }
    } catch {
      setError('Impossible de charger les réparations.');
    } finally {
      setLoading(false);
    }
  }, [page, search, filterStatut]);

  // ── fetch pannes & plombiers for selects ─────────────────────────
  async function fetchSelects() {
    const [pannesResult, plombiersResult] = await Promise.allSettled([
      api.get('/pannes?limit=500'),
      api.get('/plombiers?limit=500'),
    ]);

    if (pannesResult.status === 'fulfilled') {
      setPannes(pannesResult.value.data.data ?? pannesResult.value.data);
    } else {
      console.warn('Could not load pannes select', pannesResult.reason);
    }

    if (plombiersResult.status === 'fulfilled') {
      setPlombiers(plombiersResult.value.data.data ?? plombiersResult.value.data);
    } else {
      console.warn('Could not load plombiers select', plombiersResult.reason);
    }
  }

  useEffect(() => { fetchSelects(); }, []);
  useEffect(() => { fetchReparations(); }, [fetchReparations]);
  useEffect(() => { setPage(1); }, [search, filterStatut]);

  // ── modal helpers ────────────────────────────────────────────────
  function openAdd() {
    setEditReparation(null);
    setForm({
      ...EMPTY_FORM,
      date_reparation: new Date().toISOString().split('T')[0],
    });
    setFormErrors({});
    setShowModal(true);
  }

  function openEdit(rep) {
    setEditReparation(rep);
    setForm({
      id_panne:        rep.id_panne        ?? '',
      id_plombier:     rep.id_plombier     ?? '',
      date_reparation: rep.date_reparation ?? '',
      description:     rep.description     ?? '',
      cout:            rep.cout            ?? '',
      statut:          rep.statut          ?? 'effectuée',
    });
    setFormErrors({});
    setShowModal(true);
  }

  function closeModal() {
    setShowModal(false);
    setEditReparation(null);
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
    if (!form.id_panne)        errors.id_panne        = 'Veuillez choisir une panne.';
    if (!form.id_plombier)     errors.id_plombier     = 'Veuillez choisir un plombier.';
    if (!form.date_reparation) errors.date_reparation = 'La date est requise.';
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

      const payload = {
        ...form,
        cout: form.cout ? parseFloat(form.cout) : null,
      };

      if (editReparation) {
        await api.put(`/reparations/${editReparation.id_reparation}`, payload);
      } else {
        await api.post('/reparations', payload);
      }

      closeModal();
      fetchReparations();

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

  // ── delete ───────────────────────────────────────────────────────
  async function handleDelete() {
    try {
      setDeleting(true);
      await api.delete(`/reparations/${deleteTarget.id_reparation}`);
      setDeleteTarget(null);
      fetchReparations();
    } catch {
      alert('Erreur lors de la suppression.');
    } finally {
      setDeleting(false);
    }
  }

  // ── summary counts ───────────────────────────────────────────────
  const totalCout = reparations
    .reduce((sum, r) => sum + (parseFloat(r.cout) || 0), 0)
    .toFixed(2);

  // ── render ───────────────────────────────────────────────────────
  return (
    <div className="space-y-5">

      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-base font-semibold text-gray-800">Réparations</h2>
          <p className="text-xs text-gray-400 mt-0.5">
            {meta?.total ?? reparations.length} réparations enregistrées
          </p>
        </div>
        <Button variant="primary" onClick={openAdd}>
          <Plus size={14} />
          Créer une réparation
        </Button>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          {
            label: 'Effectuées',
            value: reparations.filter(
              (r) => r.statut?.toLowerCase() === 'effectuée'
            ).length,
            color: 'text-green-600',
            bg:    'bg-green-50',
          },
          {
            label: 'Partielles',
            value: reparations.filter(
              (r) => r.statut?.toLowerCase() === 'partielle'
            ).length,
            color: 'text-amber-600',
            bg:    'bg-amber-50',
          },
          {
            label: 'Coût total (MAD)',
            value: Number(totalCout).toLocaleString('fr-MA'),
            color: 'text-blue-600',
            bg:    'bg-blue-50',
          },
        ].map(({ label, value, color, bg }) => (
          <div
            key={label}
            className="bg-white rounded-xl border border-gray-100 px-5 py-4 flex items-center gap-4"
          >
            <div className={`${bg} ${color} w-9 h-9 rounded-lg flex items-center justify-center text-sm font-semibold flex-shrink-0`}>
              {typeof value === 'number' ? value : ''}
            </div>
            <div>
              <p className="text-xs text-gray-400">{label}</p>
              <p className={`text-lg font-semibold ${color}`}>{value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Banner if arrived from Pannes */}
      {fromPanne && (
        <div className="flex items-start gap-3 bg-blue-50 border border-blue-100 text-blue-700 text-xs rounded-xl px-4 py-3">
          <span className="mt-0.5">ℹ</span>
          <span>
            Vous avez été redirigé depuis la panne{' '}
            <strong>
              #{String(fromPanne.id_panne).padStart(3, '0')}
            </strong>{' '}
            — {fromPanne.anomalie}. Le formulaire est pré-rempli.
          </span>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[180px] max-w-xs">
          <Search
            size={13}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
          />
          <input
            type="text"
            placeholder="Plombier, description..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-8 pr-3 py-2 text-sm border border-gray-200 rounded-lg text-gray-700 placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-300"
          />
        </div>

        <select
          value={filterStatut}
          onChange={(e) => setFilterStatut(e.target.value)}
          className="text-sm border border-gray-200 rounded-lg px-3 py-2 text-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-100"
        >
          <option value="">Tous les statuts</option>
          <option value="effectuée">Effectuée</option>
          <option value="partielle">Partielle</option>
          <option value="echouée">Échouée</option>
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
                <th className="text-left text-xs font-medium text-gray-400 px-5 py-3">N° Réparation</th>
                <th className="text-left text-xs font-medium text-gray-400 px-5 py-3">Panne liée</th>
                <th className="text-left text-xs font-medium text-gray-400 px-5 py-3">Compteur</th>
                <th className="text-left text-xs font-medium text-gray-400 px-5 py-3">Plombier</th>
                <th className="text-left text-xs font-medium text-gray-400 px-5 py-3">Date</th>
                <th className="text-left text-xs font-medium text-gray-400 px-5 py-3">Coût (MAD)</th>
                <th className="text-left text-xs font-medium text-gray-400 px-5 py-3">Statut</th>
                <th className="text-left text-xs font-medium text-gray-400 px-5 py-3">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading ? (
                [...Array(5)].map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    {[...Array(8)].map((__, j) => (
                      <td key={j} className="px-5 py-4">
                        <div className="h-3 bg-gray-100 rounded w-3/4" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : reparations.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-12 text-sm text-gray-400">
                    Aucune réparation trouvée.
                  </td>
                </tr>
              ) : (
                reparations.map((rep) => (
                  <tr
                    key={rep.id_reparation}
                    className="hover:bg-gray-50/60 transition-colors"
                  >
                    <td className="px-5 py-3.5 font-mono text-xs text-gray-400">
                      REP-{String(rep.id_reparation).padStart(3, '0')}
                    </td>

                    {/* Panne linked */}
                    <td className="px-5 py-3.5">
                      {rep.panne ? (
                        <div>
                          <p className="font-mono text-xs text-gray-700">
                            #{String(rep.panne.id_panne).padStart(3, '0')}
                          </p>
                          <p className="text-[10px] text-gray-400 truncate max-w-[120px]">
                            {rep.panne.anomalie}
                          </p>
                        </div>
                      ) : (
                        <span className="text-xs text-gray-400">—</span>
                      )}
                    </td>

                    {/* Compteur via panne */}
                    <td className="px-5 py-3.5 font-mono text-xs text-gray-600">
                      {rep.panne?.compteur?.cadran ?? '—'}
                    </td>

                    {/* Plombier */}
                    <td className="px-5 py-3.5">
                      {rep.plombier ? (
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-green-50 text-green-600 text-[10px] font-semibold flex items-center justify-center flex-shrink-0">
                            {`${rep.plombier.nom?.[0] ?? ''}${rep.plombier.prenom?.[0] ?? ''}`.toUpperCase()}
                          </div>
                          <span className="text-xs text-gray-700">
                            {rep.plombier.nom} {rep.plombier.prenom}
                          </span>
                        </div>
                      ) : (
                        <span className="text-xs text-gray-400">Non assigné</span>
                      )}
                    </td>

                    <td className="px-5 py-3.5 text-xs text-gray-400">
                      {rep.date_reparation
                        ? new Date(rep.date_reparation).toLocaleDateString('fr-MA')
                        : '—'}
                    </td>

                    <td className="px-5 py-3.5 text-xs font-medium text-gray-700">
                      {rep.cout != null
                        ? `${Number(rep.cout).toLocaleString('fr-MA')} MAD`
                        : '—'}
                    </td>

                    <td className="px-5 py-3.5">
                      <Badge
                        label={rep.statut ?? 'Inconnu'}
                        color={getStatutColor(rep.statut)}
                      />
                    </td>

                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => openEdit(rep)}
                          className="inline-flex h-10 w-10 items-center justify-center rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                          title="Modifier"
                        >
                          <Pencil size={14} />
                        </button>
                        <button
                          onClick={() => setDeleteTarget(rep)}
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
              {meta.total && ` — ${meta.total} réparations`}
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
          title={editReparation ? 'Modifier la réparation' : 'Créer une réparation'}
          onClose={closeModal}
        >
          <div className="space-y-4">

            {formErrors.general && (
              <div className="bg-red-50 border border-red-100 text-red-600 text-xs rounded-lg px-3 py-2">
                {formErrors.general}
              </div>
            )}

            {/* Panne */}
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1.5">
                Panne liée <span className="text-red-400">*</span>
              </label>
              <select
                name="id_panne"
                value={form.id_panne}
                onChange={handleFormChange}
                className={`w-full px-3 py-2 text-sm border rounded-lg text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-300 ${formErrors.id_panne ? 'border-red-300' : 'border-gray-200'}`}
              >
                <option value="">Choisir une panne</option>
                {pannes.map((p) => (
                  <option key={p.id_panne} value={p.id_panne}>
                    #{String(p.id_panne).padStart(3, '0')} — {p.anomalie}
                    {p.compteur ? ` (${p.compteur.cadran})` : ''}
                  </option>
                ))}
              </select>
              {formErrors.id_panne && (
                <p className="text-xs text-red-500 mt-1">{formErrors.id_panne}</p>
              )}
            </div>

            {/* Plombier */}
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1.5">
                Plombier assigné
              </label>
              <select
                name="id_plombier"
                value={form.id_plombier}
                onChange={handleFormChange}
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-300"
              >
                <option value="">Non assigné</option>
                {plombiers.map((pl) => (
                  <option key={pl.id_plombier} value={pl.id_plombier}>
                    {pl.nom} {pl.prenom}
                    {pl.grade ? ` — ${pl.grade}` : ''}
                  </option>
                ))}
              </select>
              {formErrors.id_plombier && (
                <p className="text-xs text-red-500 mt-1">{formErrors.id_plombier}</p>
              )}
            </div>

            {/* Date + Statut */}
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1.5">
                  Date de réparation <span className="text-red-400">*</span>
                </label>
                <input
                  name="date_reparation"
                  type="date"
                  value={form.date_reparation}
                  onChange={handleFormChange}
                  className={`w-full px-3 py-2 text-sm border rounded-lg text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-300 ${formErrors.date_reparation ? 'border-red-300' : 'border-gray-200'}`}
                />
                {formErrors.date_reparation && (
                  <p className="text-xs text-red-500 mt-1">
                    {formErrors.date_reparation}
                  </p>
                )}
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1.5">
                  Statut
                </label>
                <select
                  name="statut"
                  value={form.statut}
                  onChange={handleFormChange}
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-300"
                >
                  <option value="effectuée">Effectuée</option>
                  <option value="partielle">Partielle</option>
                  <option value="echouée">Échouée</option>
                </select>
              </div>
            </div>

            {/* Coût */}
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1.5">
                Coût (MAD)
              </label>
              <div className="relative">
                <input
                  name="cout"
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.cout}
                  onChange={handleFormChange}
                  placeholder="0.00"
                  className="w-full px-3 py-2 pr-14 text-sm border border-gray-200 rounded-lg text-gray-800 placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-300"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400 font-medium">
                  MAD
                </span>
              </div>
            </div>

            {/* Description */}
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1.5">
                Description des travaux
              </label>
              <textarea
                name="description"
                value={form.description}
                onChange={handleFormChange}
                rows={3}
                placeholder="Détails de l'intervention effectuée..."
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg text-gray-800 placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-300 resize-none"
              />
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-3 pt-2 border-t border-gray-50">
              <Button variant="secondary" onClick={closeModal}>
                Annuler
              </Button>
              <Button variant="primary" onClick={handleSave} loading={saving}>
                {editReparation
                  ? 'Enregistrer les modifications'
                  : 'Créer la réparation'}
              </Button>
            </div>

          </div>
        </Modal>
      )}

      {/* Delete confirmation */}
      {deleteTarget && (
        <ConfirmDialog
          message={`Voulez-vous vraiment supprimer la réparation REP-${String(deleteTarget.id_reparation).padStart(3, '0')} ? Cette action est irréversible.`}
          onConfirm={handleDelete}
          onCancel={() => setDeleteTarget(null)}
          loading={deleting}
        />
      )}

    </div>
  );
}
