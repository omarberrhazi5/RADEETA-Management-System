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
  if (s === 'actif')     return 'green';
  if (s === 'suspendu')  return 'amber';
  if (s === 'inactif')   return 'gray';
  return 'gray';
}

const EMPTY_FORM = {
  nom: '',
  prenom: '',
  police: '',
  telephone: '',
  adresse: '',
  type_client: 'residential',
  statut: 'actif',
  id_secteur: '',
};

function getSecteurId(secteur) {
  return secteur?.id ?? secteur?.id_secteur;
}

function normalizeCollection(payload) {
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload)) return payload;
  return [];
}

// ── main component ─────────────────────────────────────────────────
export default function Clients() {
  const [clients, setClients]     = useState([]);
  const [secteurs, setSecteurs]   = useState([]);
  const [secteursLoading, setSecteursLoading] = useState(false);
  const [secteursError, setSecteursError] = useState('');
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState('');

  // Filters
  const [search, setSearch]       = useState('');
  const [filterSecteur, setFilterSecteur] = useState('');
  const [filterStatut, setFilterStatut]   = useState('');

  // Pagination
  const [page, setPage]           = useState(1);
  const [meta, setMeta]           = useState(null);

  // Modal states
  const [showModal, setShowModal]   = useState(false);
  const [editClient, setEditClient] = useState(null);
  const [form, setForm]             = useState(EMPTY_FORM);
  const [formErrors, setFormErrors] = useState({});
  const [saving, setSaving]         = useState(false);

  // Delete dialog
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting]         = useState(false);

  // ── fetch clients ────────────────────────────────────────────────
  const fetchClients = useCallback(async () => {
    try {
      setLoading(true);
      setError('');

      const params = {
        page,
        ...(search        && { search }),
        ...(filterSecteur && { id_secteur: filterSecteur }),
        ...(filterStatut  && { statut: filterStatut }),
      };

      const res = await api.get('/clients', { params });

      // Support both paginated and plain array responses
      if (res.data.data) {
        setClients(res.data.data);
        setMeta(res.data.meta ?? res.data);
      } else {
        setClients(res.data);
        setMeta(null);
      }
    } catch {
      setError('Impossible de charger les clients.');
    } finally {
      setLoading(false);
    }
  }, [page, search, filterSecteur, filterStatut]);

  // ── fetch secteurs for filter & form ────────────────────────────
  async function fetchSecteurs() {
    try {
      setSecteursLoading(true);
      setSecteursError('');

      const res = await api.get('/secteurs', {
        params: { limit: 500 },
      });

      const items = normalizeCollection(res.data);
      setSecteurs(items);

      if (items.length === 0) {
        setSecteursError('Aucun secteur disponible.');
      }
    } catch (err) {
      setSecteurs([]);
      setSecteursError('Impossible de charger les secteurs.');
      console.warn('Could not load secteurs', err);
    } finally {
      setSecteursLoading(false);
    }
  }

  useEffect(() => { fetchSecteurs(); }, []);
  useEffect(() => { fetchClients(); }, [fetchClients]);

  // Reset to page 1 when filters change
  useEffect(() => { setPage(1); }, [search, filterSecteur, filterStatut]);

  // ── modal helpers ────────────────────────────────────────────────
  function openAdd() {
    setEditClient(null);
    setForm(EMPTY_FORM);
    setFormErrors({});
    setShowModal(true);
  }

  function openEdit(client) {
    setEditClient(client);
    setForm({
      nom:         client.nom         ?? '',
      prenom:      client.prenom      ?? '',
      police:      client.police      ?? '',
      telephone:   client.telephone   ?? '',
      adresse:     client.adresse     ?? '',
      type_client: client.type_client ?? 'residential',
      statut:      client.statut      ?? 'actif',
      id_secteur:  client.id_secteur ?? client.secteur?.id ?? client.secteur?.id_secteur ?? '',
    });
    setFormErrors({});
    setShowModal(true);
  }

  function closeModal() {
    setShowModal(false);
    setEditClient(null);
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
    if (!form.nom.trim())       errors.nom    = 'Le nom est requis.';
    if (!form.police.trim())    errors.police = 'Le numéro police est requis.';
    if (secteurs.length > 0 && !form.id_secteur) {
      errors.id_secteur = 'Veuillez choisir un secteur.';
    }
    if (secteurs.length === 0 && secteursError) {
      errors.id_secteur = secteursError;
    }
    return errors;
  }

  // ── save (create or update) ──────────────────────────────────────
  async function handleSave() {
    const errors = validate();
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    try {
      setSaving(true);
      if (editClient) {
        await api.put(`/clients/${editClient.id_client}`, form);
      } else {
        await api.post('/clients', form);
      }
      closeModal();
      fetchClients();
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
      await api.delete(`/clients/${deleteTarget.id_client}`);
      setDeleteTarget(null);
      fetchClients();
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
          <h2 className="text-base font-semibold text-gray-800">Clients</h2>
          <p className="text-xs text-gray-400 mt-0.5">
            {meta?.total ?? clients.length} clients enregistrés
          </p>
        </div>
        <Button variant="primary" onClick={openAdd}>
          <Plus size={14} />
          Ajouter client
        </Button>
      </div>

      {/* Filters bar */}
      <div className="flex flex-wrap items-center gap-3">
        {/* Search */}
        <div className="relative min-w-[180px] flex-1 sm:max-w-xs">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Nom, police, téléphone..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-8 pr-3 py-2 text-sm border border-gray-200 rounded-lg text-gray-700 placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-300"
          />
        </div>

        {/* Secteur filter */}
        <select
          value={filterSecteur}
          onChange={(e) => setFilterSecteur(e.target.value)}
          className="text-sm border border-gray-200 rounded-lg px-3 py-2 text-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-100"
        >
          <option value="">Tous les secteurs</option>
          {secteurs.map((s) => (
            <option key={getSecteurId(s)} value={getSecteurId(s)}>
              {s.nom_secteur}
            </option>
          ))}
        </select>

        {/* Statut filter */}
        <select
          value={filterStatut}
          onChange={(e) => setFilterStatut(e.target.value)}
          className="text-sm border border-gray-200 rounded-lg px-3 py-2 text-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-100"
        >
          <option value="">Tous les statuts</option>
          <option value="actif">Actif</option>
          <option value="suspendu">Suspendu</option>
          <option value="inactif">Inactif</option>
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
          <table className="w-full min-w-[860px] text-sm">
            <thead>
              <tr className="border-b border-gray-50 bg-gray-50/60">
                <th className="text-left text-xs font-medium text-gray-400 px-5 py-3">Client</th>
                <th className="text-left text-xs font-medium text-gray-400 px-5 py-3">Police</th>
                <th className="text-left text-xs font-medium text-gray-400 px-5 py-3">Secteur</th>
                <th className="text-left text-xs font-medium text-gray-400 px-5 py-3">Téléphone</th>
                <th className="text-left text-xs font-medium text-gray-400 px-5 py-3">Type</th>
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
              ) : clients.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-sm text-gray-400">
                    Aucun client trouvé.
                  </td>
                </tr>
              ) : (
                clients.map((client) => {
                  const initials = `${client.nom?.[0] ?? ''}${client.prenom?.[0] ?? ''}`.toUpperCase();
                  return (
                    <tr key={client.id_client} className="hover:bg-gray-50/60 transition-colors">

                      {/* Name + avatar */}
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-blue-50 text-blue-600 text-xs font-semibold flex items-center justify-center flex-shrink-0">
                            {initials}
                          </div>
                          <div>
                            <p className="font-medium text-gray-800">
                              {client.nom} {client.prenom}
                            </p>
                            {client.adresse && (
                              <p className="text-xs text-gray-400 truncate max-w-[160px]">
                                {client.adresse}
                              </p>
                            )}
                          </div>
                        </div>
                      </td>

                      <td className="px-5 py-3.5 font-mono text-xs text-gray-500">
                        {client.police ?? '—'}
                      </td>

                      <td className="px-5 py-3.5 text-gray-600 text-xs">
                        {client.secteur?.nom_secteur ?? '—'}
                      </td>

                      <td className="px-5 py-3.5 text-gray-500 text-xs">
                        {client.telephone ?? '—'}
                      </td>

                      <td className="px-5 py-3.5 text-gray-500 text-xs capitalize">
                        {client.type_client ?? '—'}
                      </td>

                      <td className="px-5 py-3.5">
                        <Badge
                          label={client.statut ?? 'Inconnu'}
                          color={getStatutColor(client.statut)}
                        />
                      </td>

                      {/* Actions */}
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => openEdit(client)}
                            className="inline-flex h-10 w-10 items-center justify-center rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                            title="Modifier"
                          >
                            <Pencil size={14} />
                          </button>
                          <button
                            onClick={() => setDeleteTarget(client)}
                            className="inline-flex h-10 w-10 items-center justify-center rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                            title="Supprimer"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {meta && meta.last_page > 1 && (
          <div className="flex flex-col gap-3 px-5 py-3.5 border-t border-gray-50 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs text-gray-400">
              Page {meta.current_page} sur {meta.last_page}
              {meta.total && ` — ${meta.total} clients`}
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
          title={editClient ? 'Modifier le client' : 'Ajouter un client'}
          onClose={closeModal}
        >
          <div className="space-y-4">

            {/* General error */}
            {formErrors.general && (
              <div className="bg-red-50 border border-red-100 text-red-600 text-xs rounded-lg px-3 py-2">
                {formErrors.general}
              </div>
            )}

            {/* Row: Nom + Prénom */}
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1.5">
                  Nom <span className="text-red-400">*</span>
                </label>
                <input
                  name="nom"
                  value={form.nom}
                  onChange={handleFormChange}
                  placeholder="El Fassi"
                  className={`w-full px-3 py-2 text-sm border rounded-lg text-gray-800 placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-300 ${formErrors.nom ? 'border-red-300' : 'border-gray-200'}`}
                />
                {formErrors.nom && (
                  <p className="text-xs text-red-500 mt-1">{formErrors.nom}</p>
                )}
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1.5">Prénom</label>
                <input
                  name="prenom"
                  value={form.prenom}
                  onChange={handleFormChange}
                  placeholder="Ali"
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg text-gray-800 placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-300"
                />
              </div>
            </div>

            {/* Row: Police + Téléphone */}
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1.5">
                  N° Police <span className="text-red-400">*</span>
                </label>
                <input
                  name="police"
                  value={form.police}
                  onChange={handleFormChange}
                  placeholder="POL-00412"
                  className={`w-full px-3 py-2 text-sm border rounded-lg text-gray-800 placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-300 ${formErrors.police ? 'border-red-300' : 'border-gray-200'}`}
                />
                {formErrors.police && (
                  <p className="text-xs text-red-500 mt-1">{formErrors.police}</p>
                )}
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1.5">Téléphone</label>
                <input
                  name="telephone"
                  value={form.telephone}
                  onChange={handleFormChange}
                  placeholder="+212 6..."
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg text-gray-800 placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-300"
                />
              </div>
            </div>

            {/* Adresse */}
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1.5">Adresse</label>
              <input
                name="adresse"
                value={form.adresse}
                onChange={handleFormChange}
                placeholder="Rue, quartier..."
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg text-gray-800 placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-300"
              />
            </div>

            {/* Row: Secteur + Type */}
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
                  {secteursLoading && (
                    <option value="" disabled>
                      Chargement des secteurs...
                    </option>
                  )}
                  {secteurs.map((s) => (
                    <option key={getSecteurId(s)} value={getSecteurId(s)}>
                      {s.nom_secteur}
                    </option>
                  ))}
                </select>
                {(formErrors.id_secteur || secteursError) && (
                  <p className="text-xs text-red-500 mt-1">
                    {formErrors.id_secteur || secteursError}
                  </p>
                )}
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1.5">Type client</label>
                <select
                  name="type_client"
                  value={form.type_client}
                  onChange={handleFormChange}
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-300"
                >
                  <option value="residential">Résidentiel</option>
                  <option value="commercial">Commercial</option>
                  <option value="industriel">Industriel</option>
                </select>
              </div>
            </div>

            {/* Statut */}
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1.5">Statut</label>
              <select
                name="statut"
                value={form.statut}
                onChange={handleFormChange}
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-300"
              >
                <option value="actif">Actif</option>
                <option value="suspendu">Suspendu</option>
                <option value="inactif">Inactif</option>
              </select>
            </div>

            {/* Form actions */}
            <div className="flex justify-end gap-3 pt-2 border-t border-gray-50">
              <Button variant="secondary" onClick={closeModal}>
                Annuler
              </Button>
              <Button variant="primary" onClick={handleSave} loading={saving}>
                {editClient ? 'Enregistrer les modifications' : 'Créer le client'}
              </Button>
            </div>

          </div>
        </Modal>
      )}

      {/* Delete confirmation */}
      {deleteTarget && (
        <ConfirmDialog
          message={`Voulez-vous vraiment supprimer le client "${deleteTarget.nom} ${deleteTarget.prenom}" ? Cette action est irréversible.`}
          onConfirm={handleDelete}
          onCancel={() => setDeleteTarget(null)}
          loading={deleting}
        />
      )}

    </div>
  );
}
