import { useMemo, useState } from 'react';
import api from '../api/axios';
import { endpoints } from '../api/resources';
import DataTable from '../components/DataTable';
import EntityFormModal from '../components/EntityFormModal';
import { ErrorState } from '../components/PageState';
import Badge from '../components/ui/Badge';
import { useAuth } from '../hooks/useAuth';
import useResource from '../hooks/useResource';
import { ROLE_LABELS, ROLES } from '../utils/rbac';

export default function Users() {
  const { role } = useAuth();
  const { error, items, loading, refresh } = useResource(endpoints.users, { limit: 500 });
  const [formState, setFormState] = useState(null);

  const fields = useMemo(() => [
    { name: 'identifiant', label: 'Identifier', required: true },
    { name: 'nom', label: 'Last name', required: true },
    { name: 'prenom', label: 'First name' },
    { name: 'email', label: 'Email', type: 'email' },
    ...(formState?.item ? [] : [{ name: 'password', label: 'Password', type: 'password', required: true }]),
    {
      name: 'role',
      label: 'Role',
      type: 'select',
      required: true,
      options: Object.values(ROLES).map((value) => ({ value, label: ROLE_LABELS[value] })),
    },
  ], [formState?.item]);

  async function saveUser(values) {
    if (formState?.item) {
      await api.put(`/users/${formState.item.id}`, values);
    } else {
      await api.post('/users', values);
    }
    refresh();
  }

  return (
    <div className="space-y-4">
      {error && <ErrorState message={error} />}
      <DataTable
        title="Users"
        subtitle="User management is limited to super admin and admin by backend middleware."
        resource="users"
        role={role}
        loading={loading}
        rows={items}
        onCreate={() => setFormState({ item: null })}
        onEdit={(item) => setFormState({ item })}
        columns={[
          { key: 'name', header: 'Name', render: (row) => `${row.nom ?? ''} ${row.prenom ?? ''}`.trim() || row.name || '-' },
          { key: 'identifiant', header: 'Identifier' },
          { key: 'email', header: 'Email' },
          { key: 'role', header: 'Role', render: (row) => <Badge label={ROLE_LABELS[row.role] ?? row.role} color="blue" /> },
        ]}
      />
      {formState && (
        <EntityFormModal
          title={formState.item ? 'Edit User' : 'Add User'}
          fields={fields}
          initialItem={formState.item}
          submitLabel={formState.item ? 'Save changes' : 'Create user'}
          onClose={() => setFormState(null)}
          onSubmit={saveUser}
        />
      )}
    </div>
  );
}
