import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
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
  submitLabel,
  onClose,
  onSubmit,
}) {
  const { t } = useTranslation();
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
        nextErrors[field.name] = t('forms.required');
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
        setErrors({ general: error.response?.data?.message ?? t('forms.unableToSave') });
      }
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal title={title} onClose={onClose}>
      <form onSubmit={submit} className="space-y-4">
        {errors.general && (
          <div className="rounded-xl border border-red-100 bg-[var(--srm-red-soft)] px-3 py-2 text-sm font-medium text-[var(--srm-red)]">
            {errors.general}
          </div>
        )}

        {fields.map((field) => (
          <div key={field.name}>
            <label className="mb-1.5 block text-sm font-semibold text-slate-700">
              {field.label}
              {field.required && <span className="text-[var(--srm-red)]"> *</span>}
            </label>

            {field.type === 'select' ? (
              <select
                value={values[field.name] ?? ''}
                onChange={(event) => update(field.name, event.target.value)}
                disabled={field.disabled}
                className={`w-full rounded-xl border px-3 py-2 text-sm text-slate-800 outline-none transition duration-300 focus:border-[var(--srm-green)] focus:ring-2 focus:ring-green-100 ${errors[field.name] ? 'border-[var(--srm-red)]' : 'border-slate-200'}`}
              >
                <option value="">{field.placeholderKey ? t(field.placeholderKey) : field.placeholder ?? t('common.selectOption')}</option>
                {field.options?.map((option) => (
                  <option key={option.value} value={option.value}>{option.labelKey ? t(option.labelKey) : option.label}</option>
                ))}
              </select>
            ) : field.type === 'textarea' ? (
              <textarea
                rows={field.rows ?? 3}
                value={values[field.name] ?? ''}
                onChange={(event) => update(field.name, event.target.value)}
                placeholder={field.placeholderKey ? t(field.placeholderKey) : field.placeholder}
                disabled={field.disabled}
                className={`w-full rounded-xl border px-3 py-2 text-sm text-slate-800 outline-none transition duration-300 focus:border-[var(--srm-green)] focus:ring-2 focus:ring-green-100 ${errors[field.name] ? 'border-[var(--srm-red)]' : 'border-slate-200'}`}
              />
            ) : (
              <input
                type={field.type ?? 'text'}
                value={values[field.name] ?? ''}
                onChange={(event) => update(field.name, event.target.value)}
                placeholder={field.placeholderKey ? t(field.placeholderKey) : field.placeholder}
                min={field.min}
                step={field.step}
                disabled={field.disabled}
                className={`w-full rounded-xl border px-3 py-2 text-sm text-slate-800 outline-none transition duration-300 focus:border-[var(--srm-green)] focus:ring-2 focus:ring-green-100 ${errors[field.name] ? 'border-[var(--srm-red)]' : 'border-slate-200'}`}
              />
            )}

            {(field.help || field.helpKey) && <p className="mt-1 text-xs font-medium text-slate-500">{field.helpKey ? t(field.helpKey) : field.help}</p>}
            {errors[field.name] && <p className="mt-1 text-xs font-medium text-[var(--srm-red)]">{errors[field.name]}</p>}
          </div>
        ))}

        <div className="flex justify-end gap-3 border-t border-slate-100 pt-4">
          <Button variant="secondary" onClick={onClose}>{t('buttons.cancel')}</Button>
          <Button variant="primary" type="submit" loading={saving}>{submitLabel ?? t('buttons.save')}</Button>
        </div>
      </form>
    </Modal>
  );
}
