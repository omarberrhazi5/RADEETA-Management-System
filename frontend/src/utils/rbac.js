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
  anomalies: [ROLES.RESPONSABLE, ROLES.MANAGER, ROLES.TECHNICIAN, ROLES.VIEWER, ROLES.DEVELOPER],
  reparations: [ROLES.RESPONSABLE, ROLES.MANAGER, ROLES.TECHNICIAN],
  interventions: [ROLES.RESPONSABLE, ROLES.MANAGER, ROLES.TECHNICIAN, ROLES.VIEWER],
  dashboard: [ROLES.RESPONSABLE, ROLES.MANAGER, ROLES.TECHNICIAN, ROLES.VIEWER, ROLES.DEVELOPER],
  reports: [ROLES.RESPONSABLE, ROLES.MANAGER],
  notifications: [ROLES.RESPONSABLE],
};

const prod = import.meta.env.PROD;
const LEGACY_ROLES = ['super_admin', 'admin', 'operator'];

export function isLegacyRole(role) {
  return LEGACY_ROLES.includes(role);
}

export function isKnownRole(role) {
  return Object.values(ROLES).includes(role);
}

export function isDeveloperEnabled(role) {
  return isKnownRole(role) && (role !== ROLES.DEVELOPER || !prod);
}

export function hasRole(userRole, allowedRoles = []) {
  if (!userRole || !isDeveloperEnabled(userRole)) return false;
  if (userRole === ROLES.DIRECTEUR) return true;
  return allowedRoles.includes(userRole);
}

export function hasPermission(userRole, permission) {
  return hasRole(userRole, MODULE_PERMISSIONS[permission] ?? []);
}

export function isDirecteur(userRole) {
  return userRole === ROLES.DIRECTEUR;
}

export function canCreate(role, resource) {
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
  if (role === ROLES.TECHNICIAN) {
    return ['pannes', 'interventions'].includes(resource);
  }

  if (role === ROLES.MANAGER) {
    return ['pannes', 'interventions'].includes(resource);
  }

  return canCreate(role, resource);
}

export function canDelete(role, resource) {
  if (role === ROLES.DIRECTEUR) return true;
  if (role === ROLES.DEVELOPER) return !prod;
  return [ROLES.RESPONSABLE].includes(role) && ['clients', 'secteurs', 'compteurs', 'pannes', 'reparations'].includes(resource);
}

export function canViewReports(role) {
  return hasPermission(role, 'reports');
}

export function dashboardPathFor(role) {
  if (role === ROLES.DIRECTEUR) return '/administration';
  if (role === ROLES.RESPONSABLE) return '/admin/dashboard';
  if (role === ROLES.MANAGER) return '/manager/dashboard';
  if (role === ROLES.TECHNICIAN) return '/technician/dashboard';
  if (role === ROLES.VIEWER) return '/viewer/dashboard';
  if (role === ROLES.DEVELOPER && !prod) return '/admin/dashboard';
  return '/access-denied';
}
