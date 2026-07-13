import { MapConfig } from './types';

const hospitalMap: MapConfig = {
  role: 'hospital',
  visibleLayers: ['cases', 'hospitals', 'ambulances', 'traffic', 'routes'],
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
    { label: 'Patient Inflow', color: '#ef4444', emoji: '👶' },
    { label: 'Hospitals', color: '#3b82f6', emoji: '🏥' },
    { label: 'Ambulance Units', color: '#3b82f6', emoji: '🚑' },
    { label: 'Congested Roads', color: '#ef4444', emoji: '🔴' },
  ],
  quickActions: [
    { label: 'Send Ambulance', icon: 'Truck', action: 'send_ambulance' },
    { label: 'Confirm Bed Booking', icon: 'Check', action: 'bed_booking' },
  ],
};

export default hospitalMap;
