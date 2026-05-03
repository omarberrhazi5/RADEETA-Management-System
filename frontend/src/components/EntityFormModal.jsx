import { useEffect, useMemo, useState } from 'react';
import Modal from './ui/Modal';
import Button from './ui/Button';

function valueFor(item, field) {
  if (!item) return field.defaultValue ?? '';
  if (field.getValue) return field.getValue(item) ?? '';
  return item[field.name] ?? field.defaultValue ?? '';
}

export default function EntityFormModal({
  title,
  fields,
  initialItem,
  submitLabel = 'Save',
  onClose,
  onSubmit,
}) {
  const initialValues = useMemo(() => {
    return fields.reduce((values, field) => ({
      ...values,
      [field.name]: valueFor(initialItem, field),
    }), {});
  }, [fields, initialItem]);

  const [values, setValues] = useState(initialValues);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setValues(initialValues);
    setErrors({});
  }, [initialValues]);

  function update(name, value) {
    setValues((current) => ({ ...current, [name]: value }));
    setErrors((current) => ({ ...current, [name]: '', general: '' }));
  }

  function validate() {
    const nextErrors = {};

    fields.forEach((field) => {
      if (field.required && !String(values[field.name] ?? '').trim()) {
        nextErrors[field.name] = `${field.label} is required.`;
      }
    });

    return nextErrors;
  }

  async function submit(event) {
    event.preventDefault();
    const nextErrors = validate();

    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      return;
    }

    try {
      setSaving(true);
      await onSubmit(values);
      onClose();
    } catch (error) {
      const apiErrors = error.response?.data?.errors;
      if (apiErrors) {
        setErrors(Object.fromEntries(
          Object.entries(apiErrors).map(([key, messages]) => [key, Array.isArray(messages) ? messages[0] : messages]),
        ));
      } else {
        setErrors({ general: error.response?.data?.message ?? 'Unable to save. Check the form and try again.' });
      }
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal title={title} onClose={onClose}>
      <form onSubmit={submit} className="space-y-4">
        {errors.general && (
          <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {errors.general}
          </div>
        )}

        {fields.map((field) => (
          <div key={field.name}>
            <label className="mb-1.5 block text-sm font-medium text-gray-700">
              {field.label}
              {field.required && <span className="text-red-500"> *</span>}
            </label>

            {field.type === 'select' ? (
              <select
                value={values[field.name] ?? ''}
                onChange={(event) => update(field.name, event.target.value)}
                disabled={field.disabled}
                className={`w-full rounded-md border px-3 py-2 text-sm text-gray-800 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 ${errors[field.name] ? 'border-red-300' : 'border-gray-300'}`}
              >
                <option value="">{field.placeholder ?? 'Select an option'}</option>
                {field.options?.map((option) => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
            ) : field.type === 'textarea' ? (
              <textarea
                rows={field.rows ?? 3}
                value={values[field.name] ?? ''}
                onChange={(event) => update(field.name, event.target.value)}
                placeholder={field.placeholder}
                className={`w-full rounded-md border px-3 py-2 text-sm text-gray-800 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 ${errors[field.name] ? 'border-red-300' : 'border-gray-300'}`}
              />
            ) : (
              <input
                type={field.type ?? 'text'}
                value={values[field.name] ?? ''}
                onChange={(event) => update(field.name, event.target.value)}
                placeholder={field.placeholder}
                min={field.min}
                step={field.step}
                className={`w-full rounded-md border px-3 py-2 text-sm text-gray-800 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 ${errors[field.name] ? 'border-red-300' : 'border-gray-300'}`}
              />
            )}

            {field.help && <p className="mt-1 text-xs text-gray-500">{field.help}</p>}
            {errors[field.name] && <p className="mt-1 text-xs text-red-600">{errors[field.name]}</p>}
          </div>
        ))}

        <div className="flex justify-end gap-3 border-t border-gray-100 pt-4">
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button variant="primary" type="submit" loading={saving}>{submitLabel}</Button>
        </div>
      </form>
    </Modal>
  );
}
