import { MapConfig } from './types';

const childWelfareMap: MapConfig = {
  role: 'child_welfare',
  visibleLayers: ['cases', 'shelters', 'counselling_centers', 'legal_offices'],
  defaultRadius: 5,
  showControls: {
    zoom: true,
    locateMe: true,
    fullscreen: true,
    measureDistance: true,
    heatmapToggle: false,
    radiusToggle: true,
  },
  legendItems: [
    { label: 'Lost Child Case', color: '#ef4444', emoji: '👶' },
    { label: 'Welfare Shelters', color: '#f97316', emoji: '🚐' },
    { label: 'Counselling Centers', color: '#8b5cf6', emoji: '🏢' },
    { label: 'Legal Offices', color: '#3b82f6', emoji: '⚖️' },
  ],
  quickActions: [
    { label: 'Schedule Counseling', icon: 'Calendar', action: 'counseling' },
    { label: 'Assign Safehouse', icon: 'Shield', action: 'safehouse' },
  ],
};

export default childWelfareMap;
