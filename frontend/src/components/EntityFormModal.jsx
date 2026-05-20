import { useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import Modal from './ui/Modal';
import Button from './ui/Button';
import { errorText, fieldError, normalizeApiErrors } from '../utils/formValidation';

function valueFor(item, field) {
  if (!item) {
    if (field.generateDefaultValue) return field.generateDefaultValue();
    return field.defaultValue ?? '';
  }
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
  const formRef = useRef(null);
  const initialValues = useMemo(() => {
    return fields.reduce((values, field) => ({
      ...values,
      [field.name]: valueFor(initialItem, field),
    }), {});
  }, [fields, initialItem]);

  const [values, setValues] = useState(initialValues);
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setValues(initialValues);
    setErrors({});
    setTouched({});
  }, [initialValues]);

  function fieldType(field, nextValues = values) {
    return field.getType?.(nextValues) ?? field.type;
  }

  function fieldOptions(field, nextValues = values) {
    return field.getOptions?.(nextValues) ?? field.options;
  }

  function validateField(field, nextValues = values) {
    return fieldError(nextValues[field.name], {
      required: field.required,
      requiredMessage: field.requiredMessage,
      type: fieldType(field, nextValues),
      min: field.min,
      minLength: field.minLength,
      pattern: field.pattern,
      patternMessage: field.patternMessage,
    }, t);
  }

  function update(name, value) {
    const field = fields.find((item) => item.name === name);
    const nextValues = {
      ...values,
      [name]: value,
      ...(field?.populateOnChange?.(value, values) ?? {}),
    };

    setValues(nextValues);
    setErrors((current) => ({
      ...current,
      [name]: touched[name] || current[name] ? validateField(field, nextValues) : '',
      general: '',
    }));
  }

  function validate() {
    const nextErrors = {};

    fields.forEach((field) => {
      const error = validateField(field);
      if (error) nextErrors[field.name] = error;
    });

    return nextErrors;
  }

  function focusFirstError(nextErrors) {
    const firstField = fields.find((field) => nextErrors[field.name] && field.type !== 'hidden' && !field.disabled);
    if (!firstField) return;

    window.setTimeout(() => {
      formRef.current?.querySelector(`[name="${firstField.name}"]`)?.focus();
    }, 0);
  }

  async function submit(event) {
    event.preventDefault();
    const nextErrors = validate();

    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      setTouched(Object.fromEntries(fields.map((field) => [field.name, true])));
      focusFirstError(nextErrors);
      return;
    }

    try {
      setSaving(true);
      await onSubmit(values);
      onClose();
    } catch (error) {
      const apiErrors = error.response?.data?.errors;
      if (apiErrors) {
        setErrors(normalizeApiErrors(apiErrors, t('forms.unableToSave')));
      } else {
        setErrors({ general: error.response?.data?.message ?? error.message ?? t('forms.unableToSave') });
      }
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal title={title} onClose={onClose}>
      <form ref={formRef} onSubmit={submit} noValidate className="space-y-4">
        {errors.general && (
          <div className="rounded-xl border border-red-100 bg-[var(--srm-red-soft)] px-3 py-2 text-sm font-medium text-[var(--srm-red)]">
            {errors.general}
          </div>
        )}

        {fields.map((field) => {
          const resolvedType = fieldType(field);
          const resolvedOptions = fieldOptions(field);

          return resolvedType === 'hidden' ? null : (
            <div key={field.name}>
            <label className="mb-1.5 block text-sm font-semibold text-slate-700">
              {field.label}
              {field.required && <span className="text-[var(--srm-red)]"> *</span>}
            </label>

            {resolvedType === 'select' ? (
              <select
                value={values[field.name] ?? ''}
                name={field.name}
                onChange={(event) => update(field.name, event.target.value)}
                onBlur={() => {
                  setTouched((current) => ({ ...current, [field.name]: true }));
                  setErrors((current) => ({ ...current, [field.name]: validateField(field) }));
                }}
                disabled={field.disabled}
                className={`w-full rounded-xl border px-3 py-2 text-sm text-slate-800 outline-none transition duration-300 focus:border-[var(--srm-green)] focus:ring-2 focus:ring-green-100 ${errors[field.name] ? 'border-red-500 ring-2 ring-red-400/40' : 'border-slate-200'}`}
              >
                <option value="">{field.placeholderKey ? t(field.placeholderKey) : field.placeholder ?? t('common.selectOption')}</option>
                {resolvedOptions?.map((option) => (
                  <option key={option.value} value={option.value}>{option.labelKey ? t(option.labelKey) : option.label}</option>
                ))}
              </select>
            ) : resolvedType === 'textarea' ? (
              <textarea
                rows={field.rows ?? 3}
                value={values[field.name] ?? ''}
                name={field.name}
                onChange={(event) => update(field.name, event.target.value)}
                onBlur={() => {
                  setTouched((current) => ({ ...current, [field.name]: true }));
                  setErrors((current) => ({ ...current, [field.name]: validateField(field) }));
                }}
                placeholder={field.placeholderKey ? t(field.placeholderKey) : field.placeholder}
                disabled={field.disabled}
                className={`w-full rounded-xl border px-3 py-2 text-sm text-slate-800 outline-none transition duration-300 focus:border-[var(--srm-green)] focus:ring-2 focus:ring-green-100 ${errors[field.name] ? 'border-red-500 ring-2 ring-red-400/40' : 'border-slate-200'}`}
              />
            ) : (
              <input
                type={resolvedType ?? 'text'}
                value={values[field.name] ?? ''}
                name={field.name}
                onChange={(event) => {
                  const nextValue = field.numericOnly
                    ? event.target.value.replace(/\D/g, '').slice(0, field.maxLength)
                    : event.target.value;
                  update(field.name, nextValue);
                }}
                onBlur={() => {
                  setTouched((current) => ({ ...current, [field.name]: true }));
                  setErrors((current) => ({ ...current, [field.name]: validateField(field) }));
                }}
                placeholder={field.placeholderKey ? t(field.placeholderKey) : field.placeholder}
                min={field.min}
                step={field.step}
                inputMode={field.inputMode}
                pattern={field.pattern}
                maxLength={field.maxLength}
                disabled={field.disabled}
                readOnly={field.readOnly}
                aria-readonly={field.readOnly ? 'true' : undefined}
                className={`w-full rounded-xl border px-3 py-2 text-sm outline-none transition duration-300 focus:border-[var(--srm-green)] focus:ring-2 focus:ring-green-100 ${field.disabled || field.readOnly ? 'bg-gray-100 text-gray-500 cursor-not-allowed' : 'text-slate-800'} ${errors[field.name] ? 'border-red-500 ring-2 ring-red-400/40' : 'border-slate-200'}`}
              />
            )}

            {(field.help || field.helpKey) && <p className="mt-1 text-xs font-medium text-slate-500">{field.helpKey ? t(field.helpKey) : field.help}</p>}
            {errors[field.name] && <p className="mt-1 text-xs font-medium text-red-500 transition-opacity duration-300">{errorText(errors[field.name])}</p>}
            {field.renderAfter?.(values)}
          </div>
          );
        })}

        <div className="flex justify-end gap-3 border-t border-slate-100 pt-4">
          <Button variant="secondary" onClick={onClose}>{t('buttons.cancel')}</Button>
          <Button variant="primary" type="submit" loading={saving}>{submitLabel ?? t('buttons.save')}</Button>
        </div>
      </form>
    </Modal>
  );
}
