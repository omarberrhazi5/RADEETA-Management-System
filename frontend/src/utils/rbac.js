export const ROLES = {
  DIRECTEUR: 'directeur',
  RESPONSABLE: 'responsable',
  MANAGER: 'manager',
  TECHNICIAN: 'technician',
  VIEWER: 'viewer',
  DEVELOPER: 'developer',
};

export const ROLE_LABELS = {
  [ROLES.DIRECTEUR]: 'Directeur',
  [ROLES.RESPONSABLE]: 'Responsable',
  [ROLES.MANAGER]: 'Manager',
  [ROLES.TECHNICIAN]: 'Technicien',
  [ROLES.VIEWER]: 'Viewer',
  [ROLES.DEVELOPER]: 'Developer',
};

export const MODULE_PERMISSIONS = {
  administration: [ROLES.DIRECTEUR],
  clients: [ROLES.RESPONSABLE, ROLES.MANAGER, ROLES.VIEWER],
  compteurs: [ROLES.RESPONSABLE, ROLES.MANAGER, ROLES.VIEWER],
  secteurs: [ROLES.RESPONSABLE, ROLES.MANAGER, ROLES.VIEWER],
  anomalies: [ROLES.RESPONSABLE, ROLES.MANAGER, ROLES.VIEWER, ROLES.DEVELOPER],
  reparations: [ROLES.RESPONSABLE, ROLES.MANAGER],
  interventions: [ROLES.RESPONSABLE, ROLES.MANAGER, ROLES.TECHNICIAN, ROLES.VIEWER],
  dashboard: [ROLES.RESPONSABLE, ROLES.MANAGER, ROLES.VIEWER, ROLES.DEVELOPER],
  reports: [ROLES.RESPONSABLE, ROLES.MANAGER],
  notifications: [ROLES.RESPONSABLE, ROLES.MANAGER, ROLES.TECHNICIAN, ROLES.VIEWER, ROLES.DEVELOPER],
};

const prod = import.meta.env.PROD;
const LEGACY_ROLES = ['super_admin', 'admin', 'operator'];

export function normalizeRole(role) {
  return String(role ?? '').trim().toLowerCase();
}

export function isLegacyRole(role) {
  return LEGACY_ROLES.includes(normalizeRole(role));
}

export function isKnownRole(role) {
  return Object.values(ROLES).includes(normalizeRole(role));
}

export function isDeveloperEnabled(role) {
  const normalized = normalizeRole(role);
  return isKnownRole(normalized) && (normalized !== ROLES.DEVELOPER || !prod);
}

export function hasRole(userRole, allowedRoles = []) {
  const normalized = normalizeRole(userRole);
  if (!normalized || !isDeveloperEnabled(normalized)) return false;
  if (normalized === ROLES.DIRECTEUR) return true;
  return allowedRoles.includes(normalized);
}

export function hasPermission(userRole, permission) {
  return hasRole(userRole, MODULE_PERMISSIONS[permission] ?? []);
}

export function isDirecteur(userRole) {
  return normalizeRole(userRole) === ROLES.DIRECTEUR;
}

export function canCreate(role, resource) {
  role = normalizeRole(role);
  if (role === ROLES.DIRECTEUR) return true;
  if (role === ROLES.DEVELOPER) return !prod;

  const map = {
    clients: [ROLES.RESPONSABLE],
    secteurs: [ROLES.RESPONSABLE],
    compteurs: [ROLES.RESPONSABLE],
    pannes: [ROLES.RESPONSABLE],
    reparations: [ROLES.RESPONSABLE],
    interventions: [ROLES.RESPONSABLE],
  };

  return map[resource]?.includes(role) ?? false;
}

export function canUpdate(role, resource) {
  role = normalizeRole(role);
  if (role === ROLES.TECHNICIAN) {
    return ['interventions'].includes(resource);
  }

  if (role === ROLES.MANAGER) {
    return ['pannes', 'interventions'].includes(resource);
  }

  return canCreate(role, resource);
}

export function canDelete(role, resource) {
  role = normalizeRole(role);
  if (role === ROLES.DIRECTEUR) return true;
  if (role === ROLES.DEVELOPER) return !prod;
  return [ROLES.RESPONSABLE].includes(role) && ['clients', 'secteurs', 'compteurs', 'pannes', 'reparations'].includes(resource);
}

export function canViewReports(role) {
  return hasPermission(role, 'reports');
}

export function dashboardPathFor(role) {
  role = normalizeRole(role);
  if (role === ROLES.DIRECTEUR) return '/administration';
  if (role === ROLES.RESPONSABLE) return '/admin/dashboard';
  if (role === ROLES.MANAGER) return '/manager/dashboard';
  if (role === ROLES.TECHNICIAN) return '/technician/tasks';
  if (role === ROLES.VIEWER) return '/viewer/dashboard';
  if (role === ROLES.DEVELOPER && !prod) return '/admin/dashboard';
  return '/access-denied';
}
