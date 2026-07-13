import { MapConfig } from './types';

const ngoMap: MapConfig = {
  role: 'ngo',
  visibleLayers: ['cases', 'ngos', 'shelters', 'volunteers', 'food_camps', 'med_camps'],
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
    { label: 'Families In Need', color: '#ef4444', emoji: '👶' },
    { label: 'NGO Shelters', color: '#f97316', emoji: '🚐' },
    { label: 'Food Camps', color: '#f5a623', emoji: '🍞' },
    { label: 'Medical Camps', color: '#ef4444', emoji: '🩺' },
  ],
  quickActions: [
    { label: 'Allocate Shelter', icon: 'Home', action: 'allocate_shelter' },
    { label: 'Deploy Rations', icon: 'Package', action: 'deploy_rations' },
  ],
};

export default ngoMap;
