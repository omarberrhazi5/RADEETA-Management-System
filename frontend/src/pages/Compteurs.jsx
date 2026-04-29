import { useEffect, useState, useCallback } from 'react';
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
  if (s === 'actif')   return 'green';
  if (s === 'inactif') return 'gray';
  if (s === 'en panne') return 'red';
  if (s === 'changé')  return 'amber';
  return 'gray';
}

const EMPTY_FORM = {
  cadran:            '',
  calibre:           '',
  marque:            '',
  index_releve:      '',
  statut:            'actif',
  date_installation: '',
  id_client:         '',
  id_secteur:        '',
};

// ── main component ─────────────────────────────────────────────────
export default function Compteurs() {
  const [compteurs, setCompteurs] = useState([]);
  const [clients, setClients]     = useState([]);
  const [secteurs, setSecteurs]   = useState([]);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState('');

  // Filters
  const [search, setSearch]             = useState('');
  const [filterSecteur, setFilterSecteur] = useState('');
  const [filterStatut, setFilterStatut]   = useState('');

  // Pagination
  const [page, setPage] = useState(1);
  const [meta, setMeta] = useState(null);

  // Modal
  const [showModal, setShowModal]     = useState(false);
  const [editCompteur, setEditCompteur] = useState(null);
  const [form, setForm]               = useState(EMPTY_FORM);
  const [formErrors, setFormErrors]   = useState({});
  const [saving, setSaving]           = useState(false);

  // Delete
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting]         = useState(false);

  // ── fetch compteurs ──────────────────────────────────────────────
  const fetchCompteurs = useCallback(async () => {
    try {
      setLoading(true);
      setError('');

      const params = {
        page,
        ...(search        && { search }),
        ...(filterSecteur && { id_secteur: filterSecteur }),
        ...(filterStatut  && { statut: filterStatut }),
      };

      const res = await api.get('/compteurs', { params });

      if (res.data.data) {
        setCompteurs(res.data.data);
        setMeta(res.data.meta ?? res.data);
      } else {
        setCompteurs(res.data);
        setMeta(null);
      }
    } catch {
      setError('Impossible de charger les compteurs.');
    } finally {
      setLoading(false);
    }
  }, [page, search, filterSecteur, filterStatut]);

  // ── fetch clients & secteurs for selects ─────────────────────────
  async function fetchSelects() {
    const [clientsResult, secteursResult] = await Promise.allSettled([
      api.get('/clients?limit=500'),
      api.get('/secteurs?limit=500'),
    ]);

    if (clientsResult.status === 'fulfilled') {
      setClients(clientsResult.value.data.data ?? clientsResult.value.data);
    } else {
      console.warn('Could not load clients select', clientsResult.reason);
    }

    if (secteursResult.status === 'fulfilled') {
      setSecteurs(secteursResult.value.data.data ?? secteursResult.value.data);
    } else {
      console.warn('Could not load secteurs select', secteursResult.reason);
    }
  }

  useEffect(() => { fetchSelects(); }, []);
  useEffect(() => { fetchCompteurs(); }, [fetchCompteurs]);
  useEffect(() => { setPage(1); }, [search, filterSecteur, filterStatut]);

  // ── modal helpers ────────────────────────────────────────────────
  function openAdd() {
    setEditCompteur(null);
    setForm(EMPTY_FORM);
    setFormErrors({});
    setShowModal(true);
  }

  function openEdit(compteur) {
    setEditCompteur(compteur);
    setForm({
      cadran:            compteur.cadran            ?? '',
      calibre:           compteur.calibre           ?? '',
      marque:            compteur.marque            ?? '',
      index_releve:      compteur.index_releve      ?? '',
      statut:            compteur.statut            ?? 'actif',
      date_installation: compteur.date_installation ?? '',
      id_client:         compteur.id_client         ?? '',
      id_secteur:        compteur.id_secteur        ?? '',
    });
    setFormErrors({});
    setShowModal(true);
  }

  function closeModal() {
    setShowModal(false);
    setEditCompteur(null);
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
    if (!form.cadran.trim())  errors.cadran    = 'Le cadran est requis.';
    if (!form.id_client)      errors.id_client  = 'Veuillez choisir un client.';
    if (!form.id_secteur)     errors.id_secteur = 'Veuillez choisir un secteur.';
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
      if (editCompteur) {
        await api.put(`/compteurs/${editCompteur.id_compteur}`, form);
      } else {
        await api.post('/compteurs', form);
      }
      closeModal();
      fetchCompteurs();
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
      await api.delete(`/compteurs/${deleteTarget.id_compteur}`);
      setDeleteTarget(null);
      fetchCompteurs();
    } catch {
      alert('Erreur lors de la suppression.');
    } finally {
      setDeleting(false);
    }
  }

  // ── render ───────────────────────────────────────────────────────
  return (
    <div className="space-y-5">

      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-base font-semibold text-gray-800">Compteurs</h2>
          <p className="text-xs text-gray-400 mt-0.5">
            {meta?.total ?? compteurs.length} compteurs enregistrés
          </p>
        </div>
        <Button variant="primary" onClick={openAdd}>
          <Plus size={14} />
          Ajouter compteur
        </Button>
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
            placeholder="Cadran, marque..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-8 pr-3 py-2 text-sm border border-gray-200 rounded-lg text-gray-700 placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-300"
          />
        </div>

        <select
          value={filterSecteur}
          onChange={(e) => setFilterSecteur(e.target.value)}
          className="text-sm border border-gray-200 rounded-lg px-3 py-2 text-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-100"
        >
          <option value="">Tous les secteurs</option>
          {secteurs.map((s) => (
            <option key={s.id_secteur} value={s.id_secteur}>
              {s.nom_secteur}
            </option>
          ))}
        </select>

        <select
          value={filterStatut}
          onChange={(e) => setFilterStatut(e.target.value)}
          className="text-sm border border-gray-200 rounded-lg px-3 py-2 text-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-100"
        >
          <option value="">Tous les statuts</option>
          <option value="actif">Actif</option>
          <option value="inactif">Inactif</option>
          <option value="en panne">En panne</option>
          <option value="changé">Changé</option>
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
                <th className="text-left text-xs font-medium text-gray-400 px-5 py-3">Cadran</th>
                <th className="text-left text-xs font-medium text-gray-400 px-5 py-3">Calibre</th>
                <th className="text-left text-xs font-medium text-gray-400 px-5 py-3">Marque</th>
                <th className="text-left text-xs font-medium text-gray-400 px-5 py-3">Client</th>
                <th className="text-left text-xs font-medium text-gray-400 px-5 py-3">Secteur</th>
                <th className="text-left text-xs font-medium text-gray-400 px-5 py-3">Index</th>
                <th className="text-left text-xs font-medium text-gray-400 px-5 py-3">Installation</th>
                <th className="text-left text-xs font-medium text-gray-400 px-5 py-3">Statut</th>
                <th className="text-left text-xs font-medium text-gray-400 px-5 py-3">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading ? (
                [...Array(5)].map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    {[...Array(9)].map((__, j) => (
                      <td key={j} className="px-5 py-4">
                        <div className="h-3 bg-gray-100 rounded w-3/4" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : compteurs.length === 0 ? (
                <tr>
                  <td colSpan={9} className="text-center py-12 text-sm text-gray-400">
                    Aucun compteur trouvé.
                  </td>
                </tr>
              ) : (
                compteurs.map((c) => (
                  <tr key={c.id_compteur} className="hover:bg-gray-50/60 transition-colors">

                    <td className="px-5 py-3.5 font-mono text-xs text-gray-700 font-medium">
                      {c.cadran ?? '—'}
                    </td>

                    <td className="px-5 py-3.5 text-gray-600 text-xs">
                      {c.calibre ?? '—'}
                    </td>

                    <td className="px-5 py-3.5 text-gray-600 text-xs">
                      {c.marque ?? '—'}
                    </td>

                    {/* Client with initials avatar */}
                    <td className="px-5 py-3.5">
                      {c.client ? (
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-blue-50 text-blue-600 text-[10px] font-semibold flex items-center justify-center flex-shrink-0">
                            {`${c.client.nom?.[0] ?? ''}${c.client.prenom?.[0] ?? ''}`.toUpperCase()}
                          </div>
                          <span className="text-xs text-gray-700">
                            {c.client.nom} {c.client.prenom}
                          </span>
                        </div>
                      ) : (
                        <span className="text-xs text-gray-400">—</span>
                      )}
                    </td>

                    <td className="px-5 py-3.5 text-xs text-gray-500">
                      {c.secteur?.nom_secteur ?? '—'}
                    </td>

                    <td className="px-5 py-3.5 font-mono text-xs text-gray-500">
                      {c.index_releve != null
                        ? Number(c.index_releve).toLocaleString('fr-MA')
                        : '—'}
                    </td>

                    <td className="px-5 py-3.5 text-xs text-gray-400">
                      {c.date_installation
                        ? new Date(c.date_installation).toLocaleDateString('fr-MA')
                        : '—'}
                    </td>

                    <td className="px-5 py-3.5">
                      <Badge
                        label={c.statut ?? 'Inconnu'}
                        color={getStatutColor(c.statut)}
                      />
                    </td>

                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => openEdit(c)}
                          className="inline-flex h-10 w-10 items-center justify-center rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                          title="Modifier"
                        >
                          <Pencil size={14} />
                        </button>
                        <button
                          onClick={() => setDeleteTarget(c)}
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
              {meta.total && ` — ${meta.total} compteurs`}
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
          title={editCompteur ? 'Modifier le compteur' : 'Ajouter un compteur'}
          onClose={closeModal}
        >
          <div className="space-y-4">

            {formErrors.general && (
              <div className="bg-red-50 border border-red-100 text-red-600 text-xs rounded-lg px-3 py-2">
                {formErrors.general}
              </div>
            )}

            {/* Cadran + Calibre */}
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1.5">
                  Cadran <span className="text-red-400">*</span>
                </label>
                <input
                  name="cadran"
                  value={form.cadran}
                  onChange={handleFormChange}
                  placeholder="CDR-00231"
                  className={`w-full px-3 py-2 text-sm border rounded-lg text-gray-800 placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-300 ${formErrors.cadran ? 'border-red-300' : 'border-gray-200'}`}
                />
                {formErrors.cadran && (
                  <p className="text-xs text-red-500 mt-1">{formErrors.cadran}</p>
                )}
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1.5">Calibre</label>
                <input
                  name="calibre"
                  value={form.calibre}
                  onChange={handleFormChange}
                  placeholder="15mm, 20mm..."
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg text-gray-800 placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-300"
                />
              </div>
            </div>

            {/* Marque + Index */}
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1.5">Marque</label>
                <input
                  name="marque"
                  value={form.marque}
                  onChange={handleFormChange}
                  placeholder="Itron, Actaris..."
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg text-gray-800 placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-300"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1.5">Index relevé</label>
                <input
                  name="index_releve"
                  type="number"
                  value={form.index_releve}
                  onChange={handleFormChange}
                  placeholder="0"
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg text-gray-800 placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-300"
                />
              </div>
            </div>

            {/* Client */}
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1.5">
                Client <span className="text-red-400">*</span>
              </label>
              <select
                name="id_client"
                value={form.id_client}
                onChange={handleFormChange}
                className={`w-full px-3 py-2 text-sm border rounded-lg text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-300 ${formErrors.id_client ? 'border-red-300' : 'border-gray-200'}`}
              >
                <option value="">Choisir un client</option>
                {clients.map((client) => (
                  <option key={client.id_client} value={client.id_client}>
                    {client.nom} {client.prenom} - {client.police}
                  </option>
                ))}
              </select>
              {formErrors.id_client && (
                <p className="text-xs text-red-500 mt-1">{formErrors.id_client}</p>
              )}
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1.5">
                  Secteur <span className="text-red-400">*</span>
                </label>
                <select
                  name="id_secteur"
                  value={form.id_secteur}
                  onChange={handleFormChange}
                  className={`w-full px-3 py-2 text-sm border rounded-lg text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-300 ${formErrors.id_secteur ? 'border-red-300' : 'border-gray-200'}`}
                >
                  <option value="">Choisir un secteur</option>
                  {secteurs.map((secteur) => (
                    <option key={secteur.id_secteur} value={secteur.id_secteur}>
                      {secteur.nom_secteur}
                    </option>
                  ))}
                </select>
                {formErrors.id_secteur && (
                  <p className="text-xs text-red-500 mt-1">{formErrors.id_secteur}</p>
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
                  <option value="actif">Actif</option>
                  <option value="inactif">Inactif</option>
                  <option value="en panne">En panne</option>
                </select>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-2 border-t border-gray-50">
              <Button variant="secondary" onClick={closeModal}>
                Annuler
              </Button>
              <Button variant="primary" onClick={handleSave} loading={saving}>
                {editCompteur ? 'Enregistrer les modifications' : 'Créer le compteur'}
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {deleteTarget && (
        <ConfirmDialog
          message={`Voulez-vous vraiment supprimer le compteur "${deleteTarget.cadran}" ? Cette action est irréversible.`}
          onConfirm={handleDelete}
          onCancel={() => setDeleteTarget(null)}
          loading={deleting}
        />
      )}
    </div>
  );
}
