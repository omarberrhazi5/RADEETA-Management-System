export const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function fieldError(value, rules = {}, t) {
  const text = String(value ?? '').trim();

  if (rules.required && !text) return rules.requiredMessage ?? t('forms.required');
  if (!text) return '';
  if (rules.type === 'email' && !emailPattern.test(text)) return t('forms.invalidEmail');
  if (rules.type === 'number' && Number.isNaN(Number(text))) return t('forms.invalidNumber', { defaultValue: t('forms.required') });
  if (rules.type === 'date' && Number.isNaN(Date.parse(text))) return t('forms.invalidDate', { defaultValue: t('forms.required') });
  if (rules.minLength && text.length < rules.minLength) return t('forms.minPassword');
  if (rules.pattern && !(new RegExp(rules.pattern)).test(text)) return rules.patternMessage ?? t('forms.required');

  const numericValue = Number(text);
  if (rules.type === 'number' && rules.min !== undefined && numericValue < Number(rules.min)) {
    return t('forms.invalidNumber', { defaultValue: t('forms.required') });
  }

  return '';
}

export function normalizeApiErrors(apiErrors, fallbackMessage) {
  if (!apiErrors) return { general: fallbackMessage };

  return Object.fromEntries(
    Object.entries(apiErrors).map(([key, messages]) => [
      key,
      Array.isArray(messages) ? messages[0] : messages,
    ]),
  );
}

export function errorText(error) {
  return Array.isArray(error) ? error[0] : error;
}

export function focusFirstInvalid(formRef, errors) {
  const firstField = Object.keys(errors)[0];
  if (!firstField) return;

  window.setTimeout(() => {
    formRef.current?.querySelector(`[name="${firstField}"]`)?.focus();
  }, 0);
}
