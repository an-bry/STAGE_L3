import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// ── Fix icônes Leaflet (bug connu avec Vite) ──
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

export default function CarteLeaflet({
  latitude,
  longitude,
  label,
  height = 300,
  zoom = 14,
  readonly = true,
  onPositionChange,
}: {
  latitude: number;
  longitude: number;
  label?: string;
  height?: number;
  zoom?: number;
  readonly?: boolean;
  onPositionChange?: (lat: number, lng: number) => void;
}) {
  return (
    <div
      className="rounded-lg overflow-hidden border border-line"
      style={{ height }}
    >
      <MapContainer
        center={[latitude, longitude]}
        zoom={zoom}
        style={{ height: '100%', width: '100%' }}
        scrollWheelZoom={!readonly}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <Marker
          position={[latitude, longitude]}
          draggable={!readonly}
          eventHandlers={
            !readonly && onPositionChange
              ? {
                  dragend: (e) => {
                    const m = e.target as L.Marker;
                    const pos = m.getLatLng();
                    onPositionChange(pos.lat, pos.lng);
                  },
                }
              : undefined
          }
        >
          {label && <Popup>{label}</Popup>}
        </Marker>
      </MapContainer>
    </div>
  );
}