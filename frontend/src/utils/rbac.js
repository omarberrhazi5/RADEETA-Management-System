export const ROLES = {
  SUPER_ADMIN: 'super_admin',
  ADMIN: 'admin',
  MANAGER: 'manager',
  OPERATOR: 'operator',
  VIEWER: 'viewer',
  DEVELOPER: 'developer',
};

export const ROLE_LABELS = {
  [ROLES.SUPER_ADMIN]: 'Super Admin',
  [ROLES.ADMIN]: 'Admin',
  [ROLES.MANAGER]: 'Manager',
  [ROLES.OPERATOR]: 'Operator',
  [ROLES.VIEWER]: 'Viewer',
  [ROLES.DEVELOPER]: 'Developer',
};

const prod = import.meta.env.PROD;

export function isDeveloperEnabled(role) {
  return role !== ROLES.DEVELOPER || !prod;
}

export function hasRole(userRole, allowedRoles = []) {
  if (!userRole || !isDeveloperEnabled(userRole)) return false;
  if (userRole === ROLES.SUPER_ADMIN) return true;
  return allowedRoles.includes(userRole);
}

export function canCreate(role, resource) {
  if (role === ROLES.SUPER_ADMIN) return true;
  if (role === ROLES.DEVELOPER) return !prod;

  const map = {
    users: [ROLES.ADMIN],
    clients: [ROLES.ADMIN],
    secteurs: [ROLES.ADMIN],
    compteurs: [ROLES.ADMIN, ROLES.MANAGER],
    pannes: [ROLES.ADMIN, ROLES.MANAGER],
    reparations: [ROLES.ADMIN, ROLES.MANAGER, ROLES.OPERATOR],
    releves: [ROLES.ADMIN, ROLES.MANAGER, ROLES.OPERATOR],
    factures: [ROLES.ADMIN, ROLES.MANAGER],
    paiements: [ROLES.ADMIN, ROLES.MANAGER],
  };

  return map[resource]?.includes(role) ?? false;
}

export function canUpdate(role, resource) {
  if (role === ROLES.OPERATOR) {
    return ['pannes', 'reparations', 'releves'].includes(resource);
  }

  return canCreate(role, resource);
}

export function canDelete(role, resource) {
  if (role === ROLES.SUPER_ADMIN) return true;
  if (role === ROLES.DEVELOPER) return !prod;
  return [ROLES.ADMIN].includes(role) && ['clients', 'secteurs', 'compteurs', 'pannes', 'reparations'].includes(resource);
}

export function canViewReports(role) {
  return hasRole(role, [ROLES.ADMIN, ROLES.MANAGER, ROLES.VIEWER, ROLES.DEVELOPER]);
}

export function dashboardPathFor(role) {
  if (role === ROLES.ADMIN || role === ROLES.SUPER_ADMIN) return '/admin/dashboard';
  if (role === ROLES.MANAGER) return '/manager/dashboard';
  if (role === ROLES.OPERATOR) return '/operator/dashboard';
  if (role === ROLES.VIEWER) return '/viewer/dashboard';
  if (role === ROLES.DEVELOPER && !prod) return '/admin/dashboard';
  return '/access-denied';
}
