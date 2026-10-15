import { useEffect, useState } from 'react';
import {
  MapContainer,
  TileLayer,
  Marker,
  useMapEvents,
  useMap,
} from 'react-leaflet';
import L from 'leaflet';
import { MapPin, Crosshair, Check, AlertCircle } from 'lucide-react';
import Button from './Button';

// Fix icônes Leaflet (obligatoire avec Vite)
import iconUrl from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';
import iconRetina from 'leaflet/dist/images/marker-icon-2x.png';

const DefaultIcon = L.icon({
  iconUrl,
  iconRetinaUrl: iconRetina,
  shadowUrl: iconShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

L.Marker.prototype.options.icon = DefaultIcon;

interface Position {
  lat: number;
  lng: number;
}

interface LocationPickerProps {
  position: Position | null;
  onChange: (pos: Position) => void;
  disabled?: boolean;
}

// Gère les clics sur la carte
function ClickHandler({ onChange }: { onChange: (pos: Position) => void }) {
  useMapEvents({
    click(e) {
      onChange({ lat: e.latlng.lat, lng: e.latlng.lng });
    },
  });
  return null;
}

// Recentre la carte quand la position change
function RecenterMap({ position }: { position: Position }) {
  const map = useMap();
  useEffect(() => {
    map.setView([position.lat, position.lng], map.getZoom());
  }, [position.lat, position.lng, map]);
  return null;
}

export default function LocationPicker({
  position,
  onChange,
  disabled = false,
}: LocationPickerProps) {
  const [gpsStatus, setGpsStatus] = useState<
    'idle' | 'loading' | 'success' | 'error'
  >('idle');
  const [gpsError, setGpsError] = useState('');

  // Antananarivo par défaut
  const defaultPos: Position = position || { lat: -18.9137, lng: 47.5361 };

  const getMaPosition = () => {
    if (!navigator.geolocation) {
      setGpsStatus('error');
      setGpsError("La géolocalisation n'est pas supportée par votre navigateur.");
      return;
    }

    setGpsStatus('loading');
    setGpsError('');

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        onChange({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
        });
        setGpsStatus('success');
      },
      (err) => {
        setGpsStatus('error');
        let msg = 'Erreur inconnue.';
        switch (err.code) {
          case err.PERMISSION_DENIED:
            msg =
              "Vous avez refusé la géolocalisation. Autorisez-la dans les paramètres du navigateur.";
            break;
          case err.POSITION_UNAVAILABLE:
            msg = 'Position indisponible. Vérifiez que le GPS est activé.';
            break;
          case err.TIMEOUT:
            msg = 'Délai dépassé. Réessayez.';
            break;
        }
        setGpsError(msg);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );
  };

  return (
    <div className="space-y-3">
      {/* Bouton GPS */}
      <div className="flex items-center gap-3 flex-wrap">
        <Button
          type="button"
          variant="secondary"
          icon={<Crosshair size={15} />}
          onClick={getMaPosition}
          loading={gpsStatus === 'loading'}
          disabled={disabled}
        >
          {gpsStatus === 'loading' ? 'Localisation…' : '📍 Ma position GPS'}
        </Button>

        {gpsStatus === 'success' && (
          <span className="text-xs text-success flex items-center gap-1">
            <Check size={12} /> Position obtenue
          </span>
        )}
      </div>

      {/* Message d'erreur */}
      {gpsStatus === 'error' && (
        <div className="flex items-start gap-2 p-3 bg-danger-soft border border-danger/30 rounded-md text-xs text-danger">
          <AlertCircle size={14} className="shrink-0 mt-0.5" />
          <span>{gpsError}</span>
        </div>
      )}

      {/* Carte */}
      <div
        className="rounded-md overflow-hidden border border-line"
        style={{ height: 350 }}
      >
        <MapContainer
          center={[defaultPos.lat, defaultPos.lng]}
          zoom={15}
          style={{ height: '100%', width: '100%' }}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          {position && (
            <>
              <Marker
                position={[position.lat, position.lng]}
                draggable={!disabled}
                eventHandlers={{
                  dragend: (e) => {
                    const marker = e.target as L.Marker;
                    const latlng = marker.getLatLng();
                    onChange({ lat: latlng.lat, lng: latlng.lng });
                  },
                }}
              />
              <RecenterMap position={position} />
            </>
          )}
          {!disabled && <ClickHandler onChange={onChange} />}
        </MapContainer>
      </div>

      {/* Coordonnées affichées */}
      {position && (
        <div className="grid grid-cols-2 gap-3 text-xs">
          <div className="bg-surface rounded-md p-2.5">
            <p className="text-ink-soft mb-0.5">Latitude</p>
            <p className="font-mono text-ink">{position.lat.toFixed(6)}</p>
          </div>
          <div className="bg-surface rounded-md p-2.5">
            <p className="text-ink-soft mb-0.5">Longitude</p>
            <p className="font-mono text-ink">{position.lng.toFixed(6)}</p>
          </div>
        </div>
      )}

      {!position && (
        <p className="text-xs text-ink-soft flex items-center gap-1.5">
          <MapPin size={12} /> Cliquez sur "Ma position GPS" ou cliquez directement sur la
          carte pour placer le marqueur.
        </p>
      )}
    </div>
  );
}