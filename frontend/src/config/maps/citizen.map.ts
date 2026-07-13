import { MapConfig } from './types';

const citizenMap: MapConfig = {
  role: 'citizen',
  visibleLayers: ['current_location', 'child_location', 'hospitals', 'police', 'ngos', 'shelters', 'volunteers'],
  defaultRadius: 2,
  showControls: {
    zoom: true,
    locateMe: true,
    fullscreen: false,
    measureDistance: false,
    heatmapToggle: false,
    radiusToggle: true,
  },
  legendItems: [
    { label: 'My Location', color: '#3b82f6', emoji: '🙋' },
    { label: 'Lost Child', color: '#ef4444', emoji: '👶' },
    { label: 'Nearby Help', color: '#10b981', emoji: '🛵' },
    { label: 'Shelters', color: '#f97316', emoji: '🚐' },
  ],
  quickActions: [
    { label: 'Open Guardian AI', icon: 'BrainCircuit', action: 'open_ai' },
    { label: 'Call Child Helpline', icon: 'Phone', action: 'call_1098' },
  ],
};

export default citizenMap;
