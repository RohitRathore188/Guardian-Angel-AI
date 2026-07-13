import { MapConfig } from './types';

const volunteerMap: MapConfig = {
  role: 'volunteer',
  visibleLayers: ['cases', 'volunteers', 'routes'],
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
    { label: 'Active Missions', color: '#ef4444', emoji: '👶' },
    { label: 'My Location', color: '#10b981', emoji: '🛵' },
    { label: 'Other Volunteers', color: '#10b981', emoji: '🟢' },
  ],
  quickActions: [
    { label: 'Accept Mission', icon: 'CheckSquare', action: 'accept_mission' },
    { label: 'Call Control Center', icon: 'Phone', action: 'call_hotline' },
  ],
};

export default volunteerMap;
