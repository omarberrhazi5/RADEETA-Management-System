import { useEffect, useMemo, useState } from 'react';
import { Navigate } from 'react-router-dom';
import L from 'leaflet';
import { MapContainer, Marker, Popup, TileLayer, useMap } from 'react-leaflet';
import {
  AlertTriangle,
  FileSpreadsheet,
  FileText,
  Gauge,
  Layers,
  MapPinned,
  Search,
  Users,
  Wrench,
} from 'lucide-react';
import StatCard from '../components/ui/StatCard';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';
import api from '../api/axios';
import { downloadFile } from '../api/download';

const TAZA_CENTER = [34.22, -4.01];
const STANDARD_TILE_URL = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
const SATELLITE_TILE_URL = 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}';

function createSectorIcon(hasOpenPannes) {
  return L.divIcon({
    className: '',
    html: `<span class="gis-marker gis-marker--${hasOpenPannes ? 'red gis-marker--pulse' : 'green'}"></span>`,
    iconSize: [18, 18],
    iconAnchor: [9, 9],
    popupAnchor: [0, -10],
  });
}

function getGisSectors(stats) {
  const secteurs = stats?.secteurs_gis ?? stats?.meters_per_sector ?? [];

  return secteurs
    .map((secteur) => ({
      ...secteur,
      latitude: Number(secteur.latitude),
      longitude: Number(secteur.longitude),
      meters_count: Number(secteur.meters_count ?? 0),
      pannes_ouvertes_count: Number(secteur.pannes_ouvertes_count ?? 0),
    }))
    .filter((secteur) => Number.isFinite(secteur.latitude) && Number.isFinite(secteur.longitude));
}

function getSearchValue(value) {
  return String(value ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

function MapFlyTo({ sector }) {
  const map = useMap();

  useEffect(() => {
    if (sector) {
      map.flyTo([sector.latitude, sector.longitude], 16, { duration: 1.1 });
    }
  }, [map, sector]);

  return null;
}

function getPanneColor(statut) {
  if (!statut) return 'gray';
  const s = statut.toLowerCase();
  if (s === 'ouverte') return 'red';
  if (s === 'en cours') return 'amber';
  if (s === 'résolue') return 'green';
  return 'gray';
}

export default function Dashboard() {
  const role = localStorage.getItem('user_role');
  const canExport = role === 'admin' || role === 'manager';
  const [stats, setStats] = useState(null);
  const [pannes, setPannes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [downloading, setDownloading] = useState('');
  const [mapSearch, setMapSearch] = useState('');
  const [selectedSector, setSelectedSector] = useState(null);
  const [isSatellite, setIsSatellite] = useState(false);

  const gisSectors = useMemo(() => getGisSectors(stats), [stats]);
  const filteredGisSectors = useMemo(() => {
    const query = getSearchValue(mapSearch);

    if (!query) return gisSectors;

    return gisSectors.filter((secteur) => {
      const searchName = secteur.search_name ?? `${secteur.nom_secteur} ${secteur.emplacement}`;
      return getSearchValue(searchName).includes(query);
    });
  }, [gisSectors, mapSearch]);
  const activeGisAlerts = gisSectors.filter((secteur) => secteur.pannes_ouvertes_count > 0).length;

  async function handleDownload(url, filename, type) {
    try {
      setDownloading(type);
      await downloadFile(url, filename);
    } catch (err) {
      console.error(err);
      setError('Impossible de télécharger le rapport.');
    } finally {
      setDownloading('');
    }
  }

  useEffect(() => {
    if (role === 'technician') return;

    async function fetchData() {
      try {
        setLoading(true);
        const [statsRes, pannesRes] = await Promise.all([
          api.get('/dashboard/stats'),
          api.get('/pannes?limit=5&sort=recent'),
        ]);

        setStats(statsRes.data);
        setPannes(pannesRes.data.data ?? pannesRes.data);
      } catch (err) {
        setError('Impossible de charger les données. Vérifiez votre API Laravel.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [role]);

  if (role === 'technician') {
    return <Navigate to="/pannes" replace />;
  }

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-white rounded-xl border border-gray-100 p-5 h-24" />
          ))}
        </div>
        <div className="bg-white rounded-xl border border-gray-100 h-64" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-100 text-red-600 text-sm rounded-xl p-5">
        {error}
      </div>
    );
  }

  return (
    <div className="dashboard-page space-y-6">
      <section className="dashboard-hero">
        <div className="dashboard-hero__content">
          <div>
            <span className="dashboard-kicker">Pilotage reseau</span>
            <h2 className="dashboard-title">Bonjour</h2>
            <p className="dashboard-subtitle mt-1">
            Voici un résumé de l'activité du système.
          </p>
          <div className="dashboard-summary-grid">
            <div className="dashboard-summary-pill">
              <span>Secteurs suivis</span>
              <strong>{stats?.total_secteurs ?? gisSectors.length ?? '-'}</strong>
            </div>
            <div className="dashboard-summary-pill">
              <span>GIS actifs</span>
              <strong>{gisSectors.length}</strong>
            </div>
            <div className="dashboard-summary-pill">
              <span>Alertes ouvertes</span>
              <strong>{activeGisAlerts}</strong>
            </div>
          </div>
        </div>
        </div>
        {canExport && (
          <div className="dashboard-hero__actions">
            <div className="grid w-full grid-cols-1 gap-2 sm:w-auto sm:grid-cols-2">
            <Button
              variant="danger"
              className="w-full sm:w-auto"
              loading={downloading === 'pdf'}
              onClick={() => handleDownload('/reports/pannes/pdf', 'pannes-du-mois.pdf', 'pdf')}
            >
              <FileText size={14} />
              Exporter PDF
            </Button>
            <Button
              variant="success"
              className="w-full sm:w-auto"
              loading={downloading === 'excel'}
              onClick={() => handleDownload('/reports/clients/excel', 'clients-compteurs.xlsx', 'excel')}
            >
              <FileSpreadsheet size={14} />
              Exporter Excel
            </Button>
            </div>
          </div>
        )}
      </section>

      <div className="dashboard-stats-grid grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Clients total"
          value={stats?.total_clients ?? '—'}
          sub="abonnés enregistrés"
          icon={Users}
          color="blue"
        />
        <StatCard
          label="Compteurs"
          value={stats?.total_compteurs ?? '—'}
          sub={`${stats?.total_secteurs ?? '—'} secteurs`}
          icon={Gauge}
          color="green"
        />
        <StatCard
          label="Pannes ouvertes"
          value={stats?.pannes_ouvertes ?? '—'}
          sub="nécessitent attention"
          icon={AlertTriangle}
          color="red"
        />
        <StatCard
          label="Réparations / mois"
          value={stats?.reparations_mois ?? '—'}
          sub="ce mois-ci"
          icon={Wrench}
          color="amber"
        />
      </div>

      <div className="dashboard-panel bg-white rounded-xl border border-gray-100 overflow-hidden">
        <div className="flex flex-col gap-3 px-5 py-4 border-b border-gray-50 md:flex-row md:items-center md:justify-between">
          <div className="flex items-start gap-3">
            <span className="dashboard-section-icon">
              <MapPinned size={18} />
            </span>
            <div>
              <h3 className="text-sm font-semibold text-gray-800">Carte GIS des secteurs</h3>
              <p className="text-xs text-gray-400 mt-0.5">
                Couverture opérationnelle de Taza avec les pannes ouvertes par quartier.
              </p>
            </div>
          </div>
          <div className="flex flex-col gap-3 md:items-end">
            <div className="dashboard-search relative w-full md:w-72">
              <Search
                size={14}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              />
              <input
                type="search"
                value={mapSearch}
                onChange={(event) => {
                  setMapSearch(event.target.value);
                  setSelectedSector(null);
                }}
                placeholder="Rechercher un quartier..."
                className="w-full rounded-lg border border-gray-200 bg-gray-50 py-2 pl-9 pr-3 text-sm text-gray-700 placeholder-gray-400 outline-none transition focus:border-emerald-300 focus:bg-white focus:ring-2 focus:ring-emerald-100"
              />
            </div>
            <div className="flex items-center gap-3 text-xs">
              <span className="inline-flex items-center gap-1.5 text-gray-500">
                <span className="h-2.5 w-2.5 rounded-full bg-green-600" />
                Stable
              </span>
              <span className="inline-flex items-center gap-1.5 text-gray-500">
                <span className="h-2.5 w-2.5 rounded-full bg-red-600" />
                {activeGisAlerts} secteur{activeGisAlerts > 1 ? 's' : ''} en alerte
              </span>
            </div>
          </div>
        </div>

        {mapSearch && (
          <div className="dashboard-chip-row flex gap-2 overflow-x-auto border-b border-gray-50 px-5 py-3">
            {filteredGisSectors.length === 0 ? (
              <span className="text-xs text-gray-400">Aucun secteur trouvé.</span>
            ) : (
              filteredGisSectors.map((secteur) => (
                <button
                  key={secteur.id ?? secteur.nom_secteur}
                  type="button"
                  onClick={() => setSelectedSector(secteur)}
                  className={`dashboard-chip ${
                    selectedSector?.id === secteur.id ? 'is-active' : ''
                  }`}
                >
                  {secteur.nom_secteur}
                </button>
              ))
            )}
          </div>
        )}

        <div className="dashboard-map-shell relative h-[320px] bg-slate-100 sm:h-[380px] lg:h-[460px]">
          {gisSectors.length === 0 ? (
            <div className="dashboard-empty-state flex h-full items-center justify-center text-sm text-gray-400">
              Aucune coordonnée GIS disponible.
            </div>
          ) : (
            <>
              <button
                type="button"
                onClick={() => setIsSatellite((current) => !current)}
                className="dashboard-map-toggle absolute right-3 top-3 z-[1000] inline-flex items-center gap-2 rounded-lg border border-white/70 bg-white/95 px-3 py-2 text-xs font-semibold text-gray-700 shadow-lg backdrop-blur hover:bg-white"
              >
                <Layers size={14} />
                {isSatellite ? 'Vue standard' : 'Vue satellite'}
              </button>

              {selectedSector && (
                <div className="dashboard-map-focus">
                  <p className="dashboard-map-focus__label">Secteur cible</p>
                  <h4>{selectedSector.nom_secteur}</h4>
                  <div className="dashboard-map-focus__meta">
                    <span>{selectedSector.meters_count} compteurs</span>
                    <span>
                      {selectedSector.pannes_ouvertes_count} panne
                      {selectedSector.pannes_ouvertes_count > 1 ? 's' : ''} ouverte
                      {selectedSector.pannes_ouvertes_count > 1 ? 's' : ''}
                    </span>
                  </div>
                </div>
              )}

              <MapContainer
                center={TAZA_CENTER}
                zoom={13}
                minZoom={11}
                scrollWheelZoom
                className="h-full w-full"
              >
                <MapFlyTo sector={selectedSector} />
                <TileLayer
                  key={isSatellite ? 'satellite' : 'standard'}
                  attribution={
                    isSatellite
                      ? 'Tiles &copy; Esri'
                      : '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                  }
                  url={isSatellite ? SATELLITE_TILE_URL : STANDARD_TILE_URL}
                />
                {filteredGisSectors.map((secteur) => {
                  const hasOpenPannes = secteur.pannes_ouvertes_count > 0;

                  return (
                    <Marker
                      key={secteur.id ?? secteur.nom_secteur}
                      position={[secteur.latitude, secteur.longitude]}
                      icon={createSectorIcon(hasOpenPannes)}
                      eventHandlers={{
                        click: () => setSelectedSector(secteur),
                      }}
                    >
                      <Popup>
                        <strong>Quartier:</strong> {secteur.nom_secteur} <br />
                        <strong>Compteurs:</strong> {secteur.meters_count} <br />
                        <strong>Pannes:</strong> {secteur.pannes_ouvertes_count}
                      </Popup>
                    </Marker>
                  );
                })}
              </MapContainer>
            </>
          )}
        </div>
      </div>

      <div className="dashboard-panel dashboard-table-shell bg-white rounded-xl border border-gray-100">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-50">
          <div className="flex items-start gap-3">
            <span className="dashboard-section-icon dashboard-section-icon--warm">
              <AlertTriangle size={18} />
            </span>
            <div>
            <h3 className="text-sm font-semibold text-gray-800">Pannes récentes</h3>
            <p className="text-xs text-gray-400 mt-0.5">Les 5 dernières pannes signalées</p>
            </div>
          </div>
          <a href="/pannes" className="dashboard-table-link text-xs text-blue-600 hover:underline font-medium">
            Voir tout
          </a>
        </div>

        {pannes.length === 0 ? (
          <div className="dashboard-empty-state text-center py-12 text-sm text-gray-400">
            Aucune panne enregistrée.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-sm">
              <thead>
                <tr className="border-b border-gray-50">
                  <th className="text-left text-xs font-medium text-gray-400 px-5 py-3">N° Panne</th>
                  <th className="text-left text-xs font-medium text-gray-400 px-5 py-3">Compteur</th>
                  <th className="text-left text-xs font-medium text-gray-400 px-5 py-3">Anomalie</th>
                  <th className="text-left text-xs font-medium text-gray-400 px-5 py-3">Secteur</th>
                  <th className="text-left text-xs font-medium text-gray-400 px-5 py-3">Date</th>
                  <th className="text-left text-xs font-medium text-gray-400 px-5 py-3">Statut</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {pannes.map((panne) => (
                  <tr key={panne.id_panne} className="hover:bg-gray-50 transition-colors">
                    <td className="px-5 py-3.5 font-mono text-xs text-gray-400">
                      #{panne.id_panne}
                    </td>
                    <td className="px-5 py-3.5 text-gray-700 font-medium">
                      {panne.compteur?.cadran ?? '—'}
                    </td>
                    <td className="px-5 py-3.5 text-gray-600">{panne.anomalie ?? '—'}</td>
                    <td className="px-5 py-3.5 text-gray-500 text-xs">
                      {panne.compteur?.secteur?.nom_secteur ?? '—'}
                    </td>
                    <td className="px-5 py-3.5 text-gray-400 text-xs">
                      {panne.date_panne
                        ? new Date(panne.date_panne).toLocaleDateString('fr-MA')
                        : '—'}
                    </td>
                    <td className="px-5 py-3.5">
                      <Badge
                        label={panne.statut ?? 'Inconnu'}
                        color={getPanneColor(panne.statut)}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
