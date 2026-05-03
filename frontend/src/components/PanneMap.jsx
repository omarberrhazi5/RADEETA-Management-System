import L from 'leaflet';
import { MapContainer, Marker, Popup, TileLayer } from 'react-leaflet';
import { Link } from 'react-router-dom';
import Badge from './ui/Badge';
import { EmptyState, LoadingState } from './PageState';

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
    <div className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm" style={{ height }}>
      {loading ? (
        <LoadingState label="Loading map..." />
      ) : sectorPoints.length === 0 ? (
        <EmptyState message="No pannes or sector coordinates available for the map." />
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
                  <strong className="block text-gray-900">{point.label ?? 'Sector'}</strong>
                  {point.panne && (
                    <>
                      <div><span className="font-semibold">Panne:</span> #{point.panne.id_panne ?? point.panne.id}</div>
                      <div><span className="font-semibold">Client:</span> {point.panne.compteur?.client ? `${point.panne.compteur.client.prenom ?? ''} ${point.panne.compteur.client.nom ?? ''}`.trim() : '-'}</div>
                      <div><span className="font-semibold">Anomaly:</span> {point.panne.anomalie}</div>
                      <div><span className="font-semibold">Operator:</span> {point.panne.assigned_operator ? `${point.panne.assigned_operator.prenom ?? ''} ${point.panne.assigned_operator.nom ?? ''}`.trim() : '-'}</div>
                      <Badge label={point.panne.statut ?? point.panne.status ?? 'unknown'} color="red" />
                      <Link to="../pannes" className="block text-xs font-semibold text-blue-700 hover:underline">
                        Open pannes list
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
