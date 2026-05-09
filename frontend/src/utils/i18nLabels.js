const STATUS_ALIASES = {
  ouverte: 'open',
  ouvert: 'open',
  'rã©solue': 'resolved',
  resolue: 'resolved',
  résolue: 'resolved',
  reparee: 'repare',
  réparée: 'repare',
  'en panne': 'broken',
  actif: 'active',
  'effectuã©e': 'completed',
  effectuee: 'completed',
  effectuée: 'completed',
  echouee: 'annulee',
};

const FALLBACK_ROLE_KEYS = {
  directeur: 'roles.directeur',
  responsable: 'roles.responsable',
  manager: 'roles.manager',
  technician: 'roles.technician',
  viewer: 'roles.viewer',
  developer: 'roles.developer',
};

function normalizedKey(value) {
  return String(value ?? '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '_');
}

function compactString(value) {
  return String(value ?? '').trim();
}

export function translateRole(t, role) {
  const key = FALLBACK_ROLE_KEYS[role];
  return key ? t(key) : compactString(role) || t('common.notAvailable');
}

export function translateStatus(t, status) {
  const key = normalizedKey(status);
  if (!key) return t('common.notAvailable');
  return t(`statuses.${STATUS_ALIASES[key] ?? key}`, { defaultValue: t('common.notAvailable') });
}

export function translateAnomaly(t, anomaly) {
  const key = normalizedKey(anomaly);
  if (!key) return t('tables.anomaly');
  return t(`anomalies.${key}`, { defaultValue: t('common.notAvailable') });
}

export function translateModule(t, module) {
  const key = compactString(module);
  if (!key) return t('common.notAvailable');
  return t(`modules.${key}`, { defaultValue: t('common.notAvailable') });
}

export function translateActivityAction(t, action) {
  const key = compactString(action);
  if (!key) return t('common.notAvailable');
  return t(`activityActions.${key}`, { defaultValue: t('common.notAvailable') });
}

export function translateRepairDescription(t, description) {
  const key = compactString(description);
  if (!key) return '-';
  return t(`repairDescriptions.${key}`, { defaultValue: key });
}

export function translateNotificationTitle(t, item) {
  const type = normalizedKey(item?.type);
  if (type) {
    const translated = t(`notificationTypes.${type}.title`, { defaultValue: '' });
    if (translated) return translated;
  }

  return t(`notificationTitles.${compactString(item?.title)}`, { defaultValue: t('notifications.title') });
}

export function translateNotificationMessage(t, item) {
  const type = normalizedKey(item?.type);
  const meta = item?.meta ?? {};
  const panneId = meta.panne_id ?? compactString(item?.message).match(/panne #?(\d+)/i)?.[1];
  const repairId = meta.reparation_id ?? compactString(item?.message).match(/repair #?(\d+)/i)?.[1];
  const sector = compactString(item?.message).match(/assigned in (.+)$/i)?.[1];

  if (type === 'panne_assigned') {
    return sector
      ? t('notificationTypes.panne_assigned.messageWithSector', { id: panneId, sector })
      : t('notificationTypes.panne_assigned.message', { id: panneId });
  }

  if (type === 'repair_completed') {
    return t('notificationTypes.repair_completed.message', { id: repairId, panneId });
  }

  if (type === 'user_created') {
    return t('notificationTypes.user_created.message');
  }

  return t(`notificationMessages.${compactString(item?.message)}`, { defaultValue: t('notifications.messageUnavailable') });
}

export function currentLocale(i18n) {
  return (i18n.resolvedLanguage || i18n.language || 'fr').startsWith('en') ? 'en-US' : 'fr-MA';
}
