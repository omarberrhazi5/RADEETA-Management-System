import L from 'leaflet';
import { Circle, MapContainer, Marker, Popup, TileLayer, Tooltip } from 'react-leaflet';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import Badge from './ui/Badge';
import { EmptyState, LoadingState } from './PageState';
import { translateAnomaly, translateStatus } from '../utils/i18nLabels';
import { useAuth } from '../hooks/useAuth';
import { ROLES, normalizeRole } from '../utils/rbac';

const TAZA_CENTER = [34.22, -4.01];
const DEFAULT_SECTOR_RADIUS = 300;

function statusColor(status) {
  const value = String(status ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();

  if (['nouvelle', 'nouveau', 'open', 'ouvert', 'ouverte'].includes(value)) return 'red';
  if (['en cours', 'en_cours', 'in_progress', 'assigned', 'assignee', 'affectee'].includes(value)) return 'amber';
  if (['terminee', 'termine', 'completed', 'resolved', 'resolue'].includes(value)) return 'green';
  return 'red';
}

function iconFor(status) {
  const color = statusColor(status);
  return L.divIcon({
    className: '',
    html: `<span class="gis-marker gis-marker--${color}${color === 'red' ? ' gis-marker--pulse' : ''}"></span>`,
    iconSize: [18, 18],
    iconAnchor: [9, 9],
    popupAnchor: [0, -8],
  });
}

function numberValue(value) {
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

function userName(user) {
  return user?.name || `${user?.prenom ?? ''} ${user?.nom ?? ''}`.trim() || user?.identifiant || '-';
}

function sectorId(secteur) {
  return secteur?.id_secteur ?? secteur?.id ?? null;
}

function panneSector(panne) {
  return panne?.compteur?.secteur ?? panne?.meter?.secteur ?? null;
}

function panneSectorId(panne) {
  return sectorId(panneSector(panne)) ?? panne?.compteur?.id_secteur ?? panne?.meter?.id_secteur ?? null;
}

function latestWithCoordinates(items = []) {
  return items.find((item) => numberValue(item?.latitude) !== null && numberValue(item?.longitude) !== null);
}

function coordinatesForPanne(panne) {
  const intervention = latestWithCoordinates(panne?.interventions ?? []);
  const reparation = latestWithCoordinates(panne?.reparations ?? []);
  const secteur = panneSector(panne);

  const latitude = numberValue(panne?.latitude) ?? numberValue(intervention?.latitude) ?? numberValue(reparation?.latitude) ?? numberValue(secteur?.latitude);
  const longitude = numberValue(panne?.longitude) ?? numberValue(intervention?.longitude) ?? numberValue(reparation?.longitude) ?? numberValue(secteur?.longitude);

  if (latitude === null || longitude === null) return null;
  return { lat: latitude, lng: longitude };
}

function coordinatesForSector(secteur) {
  const latitude = numberValue(secteur?.latitude);
  const longitude = numberValue(secteur?.longitude);
  if (latitude === null || longitude === null) return null;
  return { lat: latitude, lng: longitude };
}

function activePanne(panne) {
  return statusColor(panne?.status ?? panne?.statut) !== 'green';
}

function sectorLabel(secteur, t) {
  const number = secteur?.numero_secteur ?? secteur?.num_torne ?? secteur?.id_secteur ?? secteur?.id;
  const address = secteur?.adresse ?? secteur?.nom_secteur ?? t('map.sector');
  return number ? `${t('map.sector')} ${number} - ${address}` : address;
}

function distanceMeters(a, b) {
  const earthRadius = 6371000;
  const lat1 = a.lat * Math.PI / 180;
  const lat2 = b.lat * Math.PI / 180;
  const dLat = (b.lat - a.lat) * Math.PI / 180;
  const dLng = (b.lng - a.lng) * Math.PI / 180;
  const value = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return earthRadius * 2 * Math.atan2(Math.sqrt(value), Math.sqrt(1 - value));
}

function pointBelongsToSector(point, secteur) {
  const pointSectorId = panneSectorId(point.panne);
  const currentSectorId = sectorId(secteur);
  if (pointSectorId && currentSectorId) return String(pointSectorId) === String(currentSectorId);

  const center = coordinatesForSector(secteur);
  return center ? distanceMeters(point, center) <= DEFAULT_SECTOR_RADIUS : false;
}

function routeForInterventions(role) {
  return {
    [ROLES.DIRECTEUR]: '/interventions',
    [ROLES.RESPONSABLE]: '/admin/interventions',
    [ROLES.MANAGER]: '/manager/interventions',
    [ROLES.TECHNICIAN]: '/technician/interventions',
    [ROLES.VIEWER]: '/viewer/interventions',
  }[role] ?? '/access-denied';
}

function routeForPannes(role) {
  return {
    [ROLES.DIRECTEUR]: '/anomalies',
    [ROLES.RESPONSABLE]: '/admin/pannes',
    [ROLES.MANAGER]: '/manager/pannes',
    [ROLES.VIEWER]: '/viewer/pannes',
  }[role] ?? '/access-denied';
}

function markerDescription(panne, t) {
  const intervention = panne?.interventions?.[0];
  const repair = panne?.reparations?.[0];
  const materials = intervention?.materials_used ?? intervention?.material_used ?? [];
  const materialText = Array.isArray(materials) ? materials.filter(Boolean).join(', ') : materials;
  return [
    panne?.description,
    intervention?.observations,
    repair?.description,
    materialText ? `${t('map.materials')}: ${materialText}` : '',
  ].filter(Boolean).join(' - ') || '-';
}

export default function PanneMap({ pannes = [], sectors = [], height = '420px', loading = false }) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { role } = useAuth();
  const normalizedRole = normalizeRole(role);
  const points = pannes
    .map((panne) => {
      const coordinates = coordinatesForPanne(panne);
      const secteur = panneSector(panne);
      return {
        panne,
        lat: coordinates?.lat,
        lng: coordinates?.lng,
        label: secteur?.nom_secteur,
      };
    })
    .filter((point) => numberValue(point.lat) !== null && numberValue(point.lng) !== null);

  const sectorAreas = sectors
    .map((secteur) => {
      const coordinates = coordinatesForSector(secteur);
      const activeCount = points.filter((point) => activePanne(point.panne) && pointBelongsToSector(point, secteur)).length;
      return coordinates ? { ...coordinates, secteur, activeCount } : null;
    })
    .filter(Boolean);

  const hasMapData = points.length > 0 || sectorAreas.length > 0;

  function openDetails(point) {
    const intervention = point.panne?.interventions?.[0];
    const targetInterventionId = intervention?.id ?? null;
    const targetPanneId = point.panne?.id_panne ?? point.panne?.id;
    navigate(targetInterventionId ? routeForInterventions(normalizedRole) : routeForPannes(normalizedRole), {
      state: targetInterventionId ? { targetInterventionId, targetPanneId } : { targetPanneId },
    });
  }

  return (
    <div className="overflow-hidden rounded-2xl bg-white shadow-[0_8px_30px_rgb(0_0_0_/_0.04)]" style={{ height }}>
      {loading ? (
        <LoadingState label={t('map.loading')} />
      ) : !hasMapData ? (
        <EmptyState message={t('map.empty')} />
      ) : (
        <MapContainer center={TAZA_CENTER} zoom={13} minZoom={11} scrollWheelZoom className="h-full w-full">
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          {sectorAreas.map((area) => (
            <Circle
              key={`sector-${sectorId(area.secteur) ?? area.secteur?.num_torne ?? area.secteur?.nom_secteur}`}
              center={[area.lat, area.lng]}
              radius={DEFAULT_SECTOR_RADIUS}
              pathOptions={{
                color: '#0f766e',
                fillColor: '#70b830',
                fillOpacity: 0.14,
                opacity: 0.72,
                weight: 2,
              }}
            >
              <Tooltip sticky className="gis-sector-tooltip">
                <div className="space-y-1">
                  <div className="font-bold text-slate-900">{sectorLabel(area.secteur, t)}</div>
                  <div className="text-xs font-semibold text-slate-600">{t('map.activePannes')}: {area.activeCount}</div>
                </div>
              </Tooltip>
            </Circle>
          ))}
          {points.map((point, index) => {
            const technician = point.panne.assigned_technician ?? point.panne.assigned_operator ?? point.panne.interventions?.[0]?.technician;
            const status = point.panne.status ?? point.panne.statut;
            return (
            <Marker
              key={`${point.label ?? 'point'}-${point.panne?.id ?? index}`}
              position={[point.lat, point.lng]}
              icon={iconFor(status)}
            >
              <Popup>
                <div className="gis-popup min-w-64 space-y-3 text-sm">
                  <div>
                    <strong className="block text-base font-bold text-slate-900">{translateAnomaly(t, point.panne.anomalie)}</strong>
                    <span className="text-xs font-semibold text-slate-500">{point.label ?? t('map.sector')}</span>
                  </div>
                  <div className="space-y-1.5">
                    <div><span className="font-semibold text-slate-800">{t('tables.technician')}:</span> {userName(technician)}</div>
                    <div><span className="font-semibold text-slate-800">{t('map.description')}:</span> {markerDescription(point.panne, t)}</div>
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <Badge label={translateStatus(t, status)} color={statusColor(status) === 'amber' ? 'amber' : statusColor(status)} />
                    <button
                      type="button"
                      onClick={() => openDetails(point)}
                      className="inline-flex h-9 items-center justify-center rounded-lg bg-[var(--srm-green)] px-3 text-xs font-bold text-white shadow-sm transition duration-300 hover:bg-emerald-700"
                    >
                      {t('map.viewDetails')}
                    </button>
                  </div>
                </div>
              </Popup>
            </Marker>
            );
          })}
        </MapContainer>
      )}
    </div>
  );
}
