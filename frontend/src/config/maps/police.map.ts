import { MapConfig } from './types';

const policeMap: MapConfig = {
  role: 'police',
  visibleLayers: ['cases', 'police', 'traffic', 'hospitals', 'patrol_zones', 'roadblocks', 'evidence'],
  defaultRadius: 5,
  showControls: {
    zoom: true,
    locateMe: true,
    fullscreen: true,
    measureDistance: true,
    heatmapToggle: true,
    radiusToggle: true,
  },
  legendItems: [
    { label: 'Emergency Cases', color: '#ef4444', emoji: '👶' },
    { label: 'Police Cruisers', color: '#ef4444', emoji: '🚓' },
    { label: 'Roadblocks', color: '#f5a623', emoji: '🚧' },
    { label: 'Patrol Sectors', color: '#3b82f6', emoji: '🔵' },
  ],
  quickActions: [
    { label: 'Dispatch Team', icon: 'Navigation', action: 'dispatch' },
    { label: 'Broadcast Area', icon: 'Radio', action: 'broadcast' },
  ],
};

export default policeMap;
