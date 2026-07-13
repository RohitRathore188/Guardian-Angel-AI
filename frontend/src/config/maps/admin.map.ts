import { MapConfig } from './types';

const adminMap: MapConfig = {
  role: 'admin',
  visibleLayers: [
    'cases',
    'police',
    'hospitals',
    'volunteers',
    'ngos',
    'shelters',
    'traffic',
    'routes',
    'current_location',
    'child_location',
    'patrol_zones',
    'roadblocks',
    'evidence',
    'food_camps',
    'med_camps',
    'counselling_centers',
    'legal_offices',
  ],
  defaultRadius: 10,
  showControls: {
    zoom: true,
    locateMe: true,
    fullscreen: true,
    measureDistance: true,
    heatmapToggle: true,
    radiusToggle: true,
  },
  legendItems: [
    { label: 'Lost Child / Distress Case', color: '#ef4444', emoji: '👶' },
    { label: 'Hospital Emergency Unit', color: '#3b82f6', emoji: '🏥' },
    { label: 'Police patrol units', color: '#ef4444', emoji: '🚓' },
    { label: 'Volunteer Force units', color: '#10b981', emoji: '🛵' },
    { label: 'NGO Shelter placements', color: '#f97316', emoji: '🚐' },
  ],
  quickActions: [
    { label: 'Broadcast Alert', icon: 'Radio', action: 'broadcast' },
    { label: 'Override Priority', icon: 'AlertTriangle', action: 'override_priority' },
  ],
};

export default adminMap;
