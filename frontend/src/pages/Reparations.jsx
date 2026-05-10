import { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useLocation } from 'react-router-dom';
import { Search } from 'lucide-react';
import api from '../api/axios';
import { endpoints } from '../api/resources';
import DataTable from '../components/DataTable';
import { ErrorState } from '../components/PageState';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';
import ConfirmDialog from '../components/ui/ConfirmDialog';
import Modal from '../components/ui/Modal';
import { useAuth } from '../hooks/useAuth';
import useResource from '../hooks/useResource';
import { translateAnomaly, translateRepairDescription } from '../utils/i18nLabels';
import { ROLES } from '../utils/rbac';

function technicianName(technician) {
  return `${technician?.prenom ?? ''} ${technician?.nom ?? ''}`.trim() || technician?.identifiant || '-';
}

function panneLabel(t, panne) {
  const id = panne?.id_panne ?? panne?.id;
  const meter = panneMeterCadran(panne) ?? panne?.id_compteur ?? '-';
  const description = panne?.description || translateAnomaly(t, panne?.anomalie);
  return `#${id} - ${meter} - ${description}`;
}

function panneMeterCadran(panne) {
  return panne?.compteur?.cadran ?? panne?.meter?.cadran ?? panne?.compteur_cadran ?? panne?.cadran ?? '';
}

function panneClientName(panne) {
  const client = panne?.compteur?.client ?? panne?.meter?.client;
  return `${client?.prenom ?? ''} ${client?.nom ?? ''}`.trim() || client?.police || '';
}

function panneTechnicianName(panne) {
  return technicianName(panne?.assigned_technician ?? panne?.assigned_operator);
}

function containsSearch(value, searchTerm) {
  return String(value ?? '').toLowerCase().includes(searchTerm);
}

function panneMatchesSearch(t, panne, searchTerm) {
  const meterCadran = panneMeterCadran(panne);
  const clientName = panneClientName(panne);
  const description = panne?.description || translateAnomaly(t, panne?.anomalie);

  return (
    containsSearch(panne?.id_panne ?? panne?.id, searchTerm)
    || containsSearch(meterCadran, searchTerm)
    || containsSearch(clientName, searchTerm)
    || containsSearch(description, searchTerm)
    || containsSearch(panne?.id_compteur, searchTerm)
    || containsSearch(panne?.compteur?.id ?? panne?.meter?.id, searchTerm)
  );
}

function useDebouncedValue(value, delay = 200) {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timer = window.setTimeout(() => setDebounced(value), delay);
    return () => window.clearTimeout(timer);
  }, [delay, value]);

  return debounced;
}

function normalizeRepairErrors(apiErrors, fallbackMessage) {
  if (!apiErrors) return { general: fallbackMessage };

  const aliases = {
    id_plombier: 'technician_id',
    id_panne: 'anomaly_id',
    date_reparation: 'repair_date',
  };

  return Object.fromEntries(
    Object.entries(apiErrors).map(([key, messages]) => [
      aliases[key] ?? key,
      Array.isArray(messages) ? messages[0] : messages,
    ]),
  );
}

export default function Reparations() {
  const { t } = useTranslation();
  const location = useLocation();
  const { role } = useAuth();
  const { error, items, loading, refresh } = useResource(endpoints.reparations, { limit: 500 });
  const technicians = useResource(endpoints.technicians, { limit: 500 }, { enabled: role !== ROLES.TECHNICIAN });
  const pannes = useResource(endpoints.pannes, { limit: 500 }, { enabled: role !== ROLES.TECHNICIAN });
  const [formState, setFormState] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [filters, setFilters] = useState({ month: '', operator: '' });

  const createRepair = useCallback((panne = null) => {
    setFormState({
      item: {
        id_panne: panne?.id_panne ?? panne?.id ?? '',
        technician_id: panne?.assigned_to ?? '',
        date_reparation: new Date().toISOString().slice(0, 10),
        description: t('reparations.defaultDescription'),
      },
      isCreate: true,
    });
  }, [t]);

  async function saveRepair(values) {
    const payload = {
      anomaly_id: Number(values.id_panne),
      technician_id: values.technician_id ? Number(values.technician_id) : null,
      repair_date: values.date_reparation,
      description: values.description,
    };

    if (formState?.isCreate) {
      await api.post('/reparations', payload);
    } else {
      await api.put(`/reparations/${formState.item.id_reparation ?? formState.item.id}`, payload);
    }
    refresh();
  }

  useEffect(() => {
    if (location.state?.panne) {
      createRepair(location.state.panne);
      window.history.replaceState({}, document.title);
    }
  }, [createRepair, location.state?.panne]);

  async function deleteRepair(repair) {
    try {
      setDeleting(true);
      await api.delete(`/reparations/${repair.id_reparation ?? repair.id}`);
      setDeleteTarget(null);
      refresh();
    } finally {
      setDeleting(false);
    }
  }

  const filteredItems = items.filter((item) => {
    const matchesMonth = !filters.month || String(item.date_reparation ?? '').startsWith(filters.month);
    const matchesOperator = !filters.operator || String(item.id_plombier ?? '') === filters.operator;
    return matchesMonth && matchesOperator;
  });

  return (
    <div className="space-y-4">
      {error && <ErrorState message={error} />}
      <DataTable
        title={t('reparations.title')}
        subtitle={t('reparations.subtitle')}
        resource="reparations"
        role={role}
        loading={loading}
        rows={filteredItems}
        filters={(
          <>
            <input type="month" value={filters.month} onChange={(event) => setFilters((current) => ({ ...current, month: event.target.value }))} className="h-11 rounded-md border border-gray-300 px-3 text-sm" />
            {role !== ROLES.TECHNICIAN && (
              <select value={filters.operator} onChange={(event) => setFilters((current) => ({ ...current, operator: event.target.value }))} className="h-11 rounded-md border border-gray-300 px-3 text-sm">
                <option value="">{t('common.allTechnicians')}</option>
                {technicians.items.map((technician) => <option key={technician.id} value={technician.id}>{technicianName(technician)}</option>)}
              </select>
            )}
          </>
        )}
        emptyMessage={t('reparations.empty')}
        onCreate={() => createRepair()}
        onEdit={(repair) => setFormState({ item: repair, isCreate: false })}
        onDelete={setDeleteTarget}
        columns={[
          { key: 'service_type', header: t('tables.service'), render: (row) => {
            const serviceType = row.panne?.compteur?.service_type ?? row.service_type ?? 'water';
            return <Badge label={t(`services.${serviceType}`)} color={serviceType === 'electricity' ? 'amber' : 'blue'} />;
          } },
          { key: 'meter', header: t('tables.meter'), render: (row) => row.panne?.compteur?.cadran ?? '-' },
          { key: 'operator', header: t('tables.technician'), render: (row) => row.plombier ? `${row.plombier.nom ?? ''} ${row.plombier.prenom ?? ''}`.trim() : '-' },
          { key: 'date_reparation', header: t('tables.date') },
          { key: 'description', header: t('forms.description'), render: (row) => translateRepairDescription(t, row.description) },
        ]}
      />
      {formState && (
        <RepairFormModal
          title={formState.isCreate ? t('reparations.add') : t('reparations.edit')}
          initialItem={formState.item}
          submitLabel={formState.isCreate ? t('reparations.create') : t('buttons.saveChanges')}
          technicians={technicians.items}
          pannes={pannes.items}
          role={role}
          isCreate={formState.isCreate}
          onClose={() => setFormState(null)}
          onSubmit={saveRepair}
        />
      )}
      {deleteTarget && (
        <ConfirmDialog
          message={t('reparations.deleteConfirm', { id: deleteTarget.id_reparation ?? deleteTarget.id })}
          onConfirm={() => deleteRepair(deleteTarget)}
          onCancel={() => setDeleteTarget(null)}
          loading={deleting}
        />
      )}
    </div>
  );
}

function RepairFormModal({ title, initialItem, submitLabel, technicians, pannes, role, isCreate, onClose, onSubmit }) {
  const { t } = useTranslation();
  const [values, setValues] = useState({
    id_panne: initialItem?.id_panne ?? '',
    technician_id: initialItem?.technician_id ?? initialItem?.id_plombier ?? '',
    date_reparation: initialItem?.date_reparation ?? new Date().toISOString().slice(0, 10),
    description: initialItem?.description ?? t('reparations.defaultDescription'),
  });
  const [technicianQuery, setTechnicianQuery] = useState('');
  const [panneQuery, setPanneQuery] = useState('');
  const [extraPannes, setExtraPannes] = useState([]);
  const [searchingPannes, setSearchingPannes] = useState(false);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const debouncedPanneQuery = useDebouncedValue(panneQuery, 200);

  const allPannes = useMemo(() => {
    const byId = new Map();
    [...pannes, ...extraPannes].forEach((panne) => {
      const id = String(panne?.id_panne ?? panne?.id ?? '');
      if (id) byId.set(id, panne);
    });
    return Array.from(byId.values());
  }, [extraPannes, pannes]);

  const selectedTechnician = technicians.find((technician) => String(technician.id) === String(values.technician_id));
  const selectedPanne = allPannes.find((panne) => String(panne.id_panne ?? panne.id) === String(values.id_panne));
  const selectedTechnicianLabel = selectedTechnician ? technicianName(selectedTechnician) : values.technician_id ? `#${values.technician_id}` : '';
  const selectedPanneLabel = selectedPanne ? panneLabel(t, selectedPanne) : values.id_panne ? `#${values.id_panne}` : '';
  const showTechnicianSelect = role !== ROLES.TECHNICIAN;
  const showPanneSelect = role !== ROLES.TECHNICIAN;
  const availablePannes = allPannes;

  const update = useCallback((name, value) => {
    setValues((current) => ({ ...current, [name]: value }));
    const aliases = {
      id_panne: 'anomaly_id',
      technician_id: 'id_plombier',
      date_reparation: 'repair_date',
    };
    setErrors((current) => ({ ...current, [name]: '', [aliases[name]]: '', general: '' }));
  }, []);

  const selectTechnician = useCallback((technician) => {
    update('technician_id', String(technician.id));
    setTechnicianQuery(technicianName(technician));
  }, [update]);

  const selectPanne = useCallback((panne) => {
    update('id_panne', String(panne.id_panne ?? panne.id));
    setPanneQuery(panneLabel(t, panne));
  }, [t, update]);

  const filteredTechnicians = useMemo(() => {
    const query = technicianQuery.trim().toLowerCase();
    const list = query
      ? technicians.filter((technician) => [
        technicianName(technician),
        technician.identifiant,
        technician.email,
      ].join(' ').toLowerCase().includes(query))
      : technicians;
    return list.slice(0, 8);
  }, [technicianQuery, technicians]);

  const filteredPannes = useMemo(() => {
    const query = debouncedPanneQuery.trim().toLowerCase();
    const list = query
      ? availablePannes.filter((panne) => panneMatchesSearch(t, panne, query))
      : availablePannes;
    return list.slice(0, 8);
  }, [availablePannes, debouncedPanneQuery, t]);

  useEffect(() => {
    if (!showPanneSelect) return;

    let cancelled = false;
    setSearchingPannes(true);
    api.get('/pannes', { params: { all: true, sort: 'recent' } })
      .then((response) => {
        const results = Array.isArray(response.data?.data) ? response.data.data : Array.isArray(response.data) ? response.data : [];
        if (cancelled) return;

        setExtraPannes((current) => {
          const byId = new Map();
          [...current, ...results].forEach((panne) => {
            const id = String(panne?.id_panne ?? panne?.id ?? '');
            if (id) byId.set(id, panne);
          });
          return Array.from(byId.values());
        });
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setSearchingPannes(false);
      });

    return () => {
      cancelled = true;
    };
  }, [showPanneSelect]);

  useEffect(() => {
    const query = debouncedPanneQuery.trim();
    if (!showPanneSelect || query.length < 2 || selectedPanne) return;

    let cancelled = false;
    setSearchingPannes(true);
    api.get('/pannes', { params: { search: query, all: true, sort: 'recent' } })
      .then((response) => {
        const results = Array.isArray(response.data?.data) ? response.data.data : Array.isArray(response.data) ? response.data : [];
        if (cancelled) return;

        setExtraPannes((current) => {
          const byId = new Map();
          [...current, ...results].forEach((panne) => {
            const id = String(panne?.id_panne ?? panne?.id ?? '');
            if (id) byId.set(id, panne);
          });
          return Array.from(byId.values());
        });
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setSearchingPannes(false);
      });

    return () => {
      cancelled = true;
    };
  }, [debouncedPanneQuery, isCreate, selectedPanne, showPanneSelect]);

  useEffect(() => {
    const query = debouncedPanneQuery.trim();
    if (!showPanneSelect || !/^\d+$/.test(query) || selectedPanne) return;

    const existsLocally = allPannes.some((panne) => String(panne.id_panne ?? panne.id) === query);
    if (existsLocally) return;

    let cancelled = false;
    api.get(`/pannes/${query}`)
      .then((response) => {
        const panne = response.data?.data ?? response.data;
        if (cancelled || !panne) return;

        setExtraPannes((current) => (
          current.some((item) => String(item.id_panne ?? item.id) === query) ? current : [...current, panne]
        ));
      })
      .catch(() => {});

    return () => {
      cancelled = true;
    };
  }, [allPannes, debouncedPanneQuery, selectedPanne, showPanneSelect]);

  useEffect(() => {
    const query = debouncedPanneQuery.trim().toLowerCase();
    if (!showPanneSelect || !query || selectedPanne) return;

    const exactCadranMatch = availablePannes.find((panne) => panneMeterCadran(panne).toLowerCase() === query);
    if (exactCadranMatch) {
      selectPanne(exactCadranMatch);
    }
  }, [availablePannes, debouncedPanneQuery, selectedPanne, selectPanne, showPanneSelect]);

  useEffect(() => {
    if (selectedPanne && !panneQuery) {
      setPanneQuery(panneLabel(t, selectedPanne));
    }
  }, [panneQuery, selectedPanne, t]);

  useEffect(() => {
    if (selectedTechnician && !technicianQuery) {
      setTechnicianQuery(technicianName(selectedTechnician));
    }
  }, [selectedTechnician, technicianQuery]);

  async function submit(event) {
    event.preventDefault();
    const nextErrors = {};
    if (!String(values.id_panne ?? '').trim()) nextErrors.id_panne = t('forms.required');
    if (showTechnicianSelect && !String(values.technician_id ?? '').trim()) nextErrors.technician_id = t('forms.required');
    if (!String(values.date_reparation ?? '').trim()) nextErrors.date_reparation = t('forms.required');

    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      return;
    }

    try {
      setSaving(true);
      await onSubmit(values);
      onClose();
    } catch (error) {
      setErrors(normalizeRepairErrors(error.response?.data?.errors, error.response?.data?.message ?? t('forms.unableToSave')));
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal title={title} onClose={onClose} maxWidth="max-w-2xl">
      <form onSubmit={submit} className="space-y-4">
        {errors.general && <div className="rounded-xl border border-red-100 bg-[var(--srm-red-soft)] px-3 py-2 text-sm font-medium text-[var(--srm-red)]">{errors.general}</div>}

        {showPanneSelect ? (
          <SearchableSelect
            label={t('forms.panneId')}
            required
            query={panneQuery}
            setQuery={(value) => {
              setPanneQuery(value);
              update('id_panne', '');
            }}
            placeholder="# / meter / anomaly"
            error={errors.anomaly_id ?? errors.id_panne}
            selectedLabel={selectedPanneLabel}
            options={filteredPannes.map((panne) => ({
              value: panne.id_panne ?? panne.id,
              label: panneLabel(t, panne),
              caption: panneTechnicianName(panne),
              item: panne,
            }))}
            loading={searchingPannes}
            onSelect={(option) => selectPanne(option.item)}
          />
        ) : (
          <Field label={t('forms.panneId')} name="id_panne" value={values.id_panne} onChange={update} error={errors.anomaly_id ?? errors.id_panne} required />
        )}

        {showTechnicianSelect && (
          <SearchableSelect
            label={t('forms.technician')}
            required
            query={technicianQuery}
            setQuery={(value) => {
              setTechnicianQuery(value);
              update('technician_id', '');
            }}
            placeholder={t('common.searchPlaceholder')}
            error={errors.technician_id ?? errors.id_plombier}
            selectedLabel={selectedTechnicianLabel}
            options={filteredTechnicians.map((technician) => ({
              value: technician.id,
              label: technicianName(technician),
              caption: technician.identifiant,
              item: technician,
            }))}
            onSelect={(option) => selectTechnician(option.item)}
          />
        )}

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <Field label={t('forms.repairDate')} name="date_reparation" type="date" value={values.date_reparation} onChange={update} error={errors.repair_date ?? errors.date_reparation} required />
          <Textarea label={t('forms.description')} name="description" value={values.description} onChange={update} error={errors.description} />
        </div>

        <div className="flex justify-end gap-3 border-t border-slate-100 pt-4">
          <Button variant="secondary" onClick={onClose}>{t('buttons.cancel')}</Button>
          <Button variant="primary" type="submit" loading={saving}>{submitLabel}</Button>
        </div>
      </form>
    </Modal>
  );
}

function SearchableSelect({ label, required, query, setQuery, placeholder, error, selectedLabel, options, loading = false, onSelect }) {
  const { t } = useTranslation();

  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-semibold text-slate-700">
        {label}{required && <span className="text-[var(--srm-red)]"> *</span>}
      </span>
      <div className="relative">
        <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder={placeholder}
          className={`w-full rounded-xl border bg-slate-50/80 py-2 pl-9 pr-3 text-sm text-slate-800 outline-none transition duration-300 focus:border-[var(--srm-green)] focus:ring-2 focus:ring-green-100 ${error ? 'border-[var(--srm-red)]' : 'border-slate-200'}`}
        />
      </div>
      {query && !selectedLabel && (
        <div className="mt-2 max-h-44 overflow-y-auto rounded-xl border border-slate-100 bg-white shadow-[0_8px_30px_rgb(0_0_0_/_0.05)]">
          {options.length === 0 ? (
            <div className="px-3 py-3 text-sm font-medium text-slate-500">{loading ? t('common.loading') : t('common.noData')}</div>
          ) : options.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => onSelect(option)}
              className="flex w-full items-center justify-between gap-3 px-3 py-2 text-left text-sm transition duration-300 hover:bg-[var(--srm-green-soft)]"
            >
              <span className="truncate font-semibold text-slate-800">{option.label}</span>
              {option.caption && <span className="shrink-0 text-xs font-medium text-slate-500">{option.caption}</span>}
            </button>
          ))}
        </div>
      )}
      {selectedLabel && (
        <div className="mt-2 rounded-xl border border-green-100 bg-[var(--srm-green-soft)] px-3 py-2 text-xs font-semibold text-[var(--srm-green)]">
          {selectedLabel}
        </div>
      )}
      {error && <p className="mt-1 text-xs font-medium text-[var(--srm-red)]">{error}</p>}
    </label>
  );
}

function Field({ label, name, value, onChange, error, type = 'text', required = false }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-semibold text-slate-700">{label}{required && <span className="text-[var(--srm-red)]"> *</span>}</span>
      <input
        type={type}
        value={value ?? ''}
        onChange={(event) => onChange(name, event.target.value)}
        className={`w-full rounded-xl border bg-slate-50/80 px-3 py-2 text-sm text-slate-800 outline-none transition duration-300 focus:border-[var(--srm-green)] focus:ring-2 focus:ring-green-100 ${error ? 'border-[var(--srm-red)]' : 'border-slate-200'}`}
      />
      {error && <p className="mt-1 text-xs font-medium text-[var(--srm-red)]">{error}</p>}
    </label>
  );
}

function Textarea({ label, name, value, onChange, error }) {
  return (
    <label className="block md:col-span-1">
      <span className="mb-1.5 block text-sm font-semibold text-slate-700">{label}</span>
      <textarea
        rows={3}
        value={value ?? ''}
        onChange={(event) => onChange(name, event.target.value)}
        className={`w-full rounded-xl border bg-slate-50/80 px-3 py-2 text-sm text-slate-800 outline-none transition duration-300 focus:border-[var(--srm-green)] focus:ring-2 focus:ring-green-100 ${error ? 'border-[var(--srm-red)]' : 'border-slate-200'}`}
      />
      {error && <p className="mt-1 text-xs font-medium text-[var(--srm-red)]">{error}</p>}
    </label>
  );
}
