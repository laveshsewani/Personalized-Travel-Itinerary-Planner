import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { formatINR } from '../utils/formatters';

// Fix for default Leaflet icon paths in bundlers
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

export const LeafletMap = ({ items = [], center = [26.9124, 75.7873], zoom = 12 }) => {
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const layerGroupRef = useRef(null);

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current) return;
    if (mapInstanceRef.current) return;

    const map = L.map(mapContainerRef.current, {
      center: center,
      zoom: zoom,
      scrollWheelZoom: false,
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      maxZoom: 19,
    }).addTo(map);

    layerGroupRef.current = L.layerGroup().addTo(map);
    mapInstanceRef.current = map;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Update Markers
  useEffect(() => {
    const map = mapInstanceRef.current;
    const layers = layerGroupRef.current;
    if (!map || !layers) return;

    layers.clearLayers();

    const validItems = items.filter((item) => item.lat && item.lng && !isNaN(item.lat) && !isNaN(item.lng));

    if (validItems.length === 0) {
      map.setView(center, zoom);
      return;
    }

    const bounds = L.latLngBounds();

    validItems.forEach((item, index) => {
      const latLng = [item.lat, item.lng];
      bounds.extend(latLng);

      // Custom numbered icon
      const customIcon = L.divIcon({
        className: 'custom-map-pin',
        html: `
          <div style="
            background: #ea580c;
            color: #ffffff;
            width: 28px;
            height: 28px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 12px;
            font-weight: 700;
            box-shadow: 0 2px 6px rgba(0,0,0,0.3);
            border: 2px solid #ffffff;
          ">
            ${index + 1}
          </div>
        `,
        iconSize: [28, 28],
        iconAnchor: [14, 14],
        popupAnchor: [0, -14],
      });

      const marker = L.marker(latLng, { icon: customIcon });

      const popupHtml = `
        <div style="font-family: Inter, sans-serif; min-width: 160px;">
          <div style="font-size: 11px; text-transform: uppercase; font-weight: 700; color: #ea580c;">
            Stop ${index + 1} &bull; ${item.time_slot || ''}
          </div>
          <div style="font-weight: 600; font-size: 14px; margin-top: 2px; color: #0f172a;">
            ${item.title}
          </div>
          <div style="font-size: 12px; color: #64748b; margin-top: 2px;">
            ${item.location || ''}
          </div>
          <div style="font-size: 12px; font-weight: 600; color: #059669; margin-top: 4px;">
            Estimated Cost: ${formatINR(item.cost || 0)}
          </div>
        </div>
      `;

      marker.bindPopup(popupHtml);
      layers.addLayer(marker);
    });

    if (validItems.length > 0) {
      map.fitBounds(bounds, { padding: [40, 40], maxZoom: 14 });
    }
  }, [items, center, zoom]);

  return (
    <div className="w-full h-full min-h-[350px] relative rounded-2xl overflow-hidden shadow-inner border border-slate-200 dark:border-slate-800">
      <div ref={mapContainerRef} className="w-full h-full" />
    </div>
  );
};
