import L from 'leaflet';
import { MapContainer, Marker, Popup, TileLayer } from 'react-leaflet';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import Badge from './ui/Badge';
import { EmptyState, LoadingState } from './PageState';
import { translateAnomaly, translateStatus } from '../utils/i18nLabels';

const TAZA_CENTER = [34.22, -4.01];

function iconFor(status) {
  const value = String(status ?? '').toLowerCase();
  const open = ['ouvert', 'ouverte', 'open'].includes(value);
  const progress = ['en cours', 'in_progress'].includes(value);
  return L.divIcon({
    className: '',
    html: `<span class="gis-marker gis-marker--${open ? 'red gis-marker--pulse' : progress ? 'amber' : 'green'}"></span>`,
    iconSize: [18, 18],
    iconAnchor: [9, 9],
    popupAnchor: [0, -8],
  });
}

export default function PanneMap({ pannes = [], sectors = [], height = '420px', loading = false }) {
  const { t } = useTranslation();
  const points = pannes
    .map((panne) => {
      const secteur = panne.compteur?.secteur;
      return {
        panne,
        lat: Number(secteur?.latitude),
        lng: Number(secteur?.longitude),
        label: secteur?.nom_secteur,
      };
    })
    .filter((point) => Number.isFinite(point.lat) && Number.isFinite(point.lng));

  const sectorPoints = points.length > 0
    ? points
    : sectors
      .map((secteur) => ({
        lat: Number(secteur.latitude),
        lng: Number(secteur.longitude),
        label: secteur.nom_secteur,
        panne: null,
      }))
      .filter((point) => Number.isFinite(point.lat) && Number.isFinite(point.lng));

  return (
    <div className="overflow-hidden rounded-2xl bg-white shadow-[0_8px_30px_rgb(0_0_0_/_0.04)]" style={{ height }}>
      {loading ? (
        <LoadingState label={t('map.loading')} />
      ) : sectorPoints.length === 0 ? (
        <EmptyState message={t('map.empty')} />
      ) : (
        <MapContainer center={TAZA_CENTER} zoom={13} minZoom={11} scrollWheelZoom className="h-full w-full">
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          {sectorPoints.map((point, index) => (
            <Marker
              key={`${point.label ?? 'point'}-${point.panne?.id ?? index}`}
              position={[point.lat, point.lng]}
              icon={iconFor(point.panne?.status ?? point.panne?.statut)}
            >
              <Popup>
                <div className="min-w-56 space-y-2 text-sm">
                  <strong className="block text-gray-900">{point.label ?? t('map.sector')}</strong>
                  {point.panne && (
                    <>
                      <div><span className="font-semibold">{t('tables.panne')}:</span> {translateAnomaly(t, point.panne.anomalie)}</div>
                      <div><span className="font-semibold">{t('tables.client')}:</span> {point.panne.compteur?.client ? `${point.panne.compteur.client.prenom ?? ''} ${point.panne.compteur.client.nom ?? ''}`.trim() : '-'}</div>
                      <div><span className="font-semibold">{t('tables.anomaly')}:</span> {translateAnomaly(t, point.panne.anomalie)}</div>
                      <div><span className="font-semibold">{t('tables.technician')}:</span> {point.panne.assigned_technician || point.panne.assigned_operator ? `${(point.panne.assigned_technician ?? point.panne.assigned_operator).prenom ?? ''} ${(point.panne.assigned_technician ?? point.panne.assigned_operator).nom ?? ''}`.trim() : '-'}</div>
                      <Badge label={translateStatus(t, point.panne.statut ?? point.panne.status)} color="red" />
                      <Link to="../pannes" className="block text-xs font-semibold text-[var(--srm-green)] hover:underline">
                        {t('map.openPannesList')}
                      </Link>
                    </>
                  )}
                </div>
              </Popup>
            </Marker>
          ))}
        </MapContainer>
      )}
    </div>
  );
}
