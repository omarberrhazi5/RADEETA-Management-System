import { useEffect, useState } from 'react';
import api from '../api/axios';
import { ErrorState, LoadingState } from '../components/PageState';
import Button from '../components/ui/Button';

export default function TariffSettings() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [value, setValue] = useState('');
  const [jsonError, setJsonError] = useState('');

  function parseJson() {
    try {
      const parsed = JSON.parse(value);
      setJsonError('');
      return parsed;
    } catch (err) {
      setJsonError(`Invalid JSON: ${err.message}`);
      return null;
    }
  }

  useEffect(() => {
    let mounted = true;

    async function load() {
      setLoading(true);
      setError('');
      try {
        const response = await api.get('/tariff-settings');
        if (mounted) {
          setValue(JSON.stringify(response.data?.data ?? {}, null, 2));
        }
      } catch (err) {
        if (mounted) {
          setError(err.response?.data?.message || err.message || 'Unable to load tariff settings.');
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    load();

    return () => {
      mounted = false;
    };
  }, []);

  async function saveSettings(event) {
    event.preventDefault();
    setSaving(true);
    setError('');
    setMessage('');

    try {
      const parsed = parseJson();
      if (!parsed) return;

      const response = await api.put('/tariff-settings', { value: parsed });
      setValue(JSON.stringify(response.data?.data ?? parsed, null, 2));
      setMessage('Tariff settings saved.');
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Unable to save tariff settings.');
    } finally {
      setSaving(false);
    }
  }

  function formatJson() {
    const parsed = parseJson();
    if (parsed) {
      setValue(JSON.stringify(parsed, null, 2));
      setMessage('JSON formatted.');
    }
  }

  if (loading) {
    return <LoadingState label="Loading tariff settings..." />;
  }

  return (
    <div className="space-y-5">
      {error && <ErrorState message={error} />}
      {message && <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">{message}</div>}

      <div className="rounded-lg border border-gray-200 bg-white p-5">
        <div className="mb-4">
          <h1 className="text-lg font-semibold text-gray-900">Tariff Settings</h1>
          <p className="text-sm text-gray-500">Configure water, sanitation, fixed fees, TVA rates, and meter coefficients used for new invoices.</p>
          <p className="mt-2 text-xs text-gray-500">Use decimal TVA rates such as 0.07 for 7%. New invoices use these values; existing invoices keep their saved snapshot.</p>
        </div>

        <form onSubmit={saveSettings} className="space-y-4">
          <textarea
            value={value}
            onChange={(event) => {
              setValue(event.target.value);
              setJsonError('');
              setMessage('');
            }}
            spellCheck="false"
            className={`min-h-[520px] w-full rounded-lg border bg-gray-950 p-4 font-mono text-sm text-gray-50 outline-none focus:ring-2 ${jsonError ? 'border-red-400 focus:border-red-500 focus:ring-red-100' : 'border-gray-300 focus:border-blue-500 focus:ring-blue-100'}`}
          />
          {jsonError && <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{jsonError}</div>}
          <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
            <Button type="button" variant="secondary" onClick={formatJson}>Pretty format</Button>
            <Button type="submit" disabled={saving || Boolean(jsonError)}>{saving ? 'Saving...' : 'Save settings'}</Button>
          </div>
        </form>
      </div>
    </div>
  );
}
