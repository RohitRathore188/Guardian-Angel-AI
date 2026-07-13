export interface QuickActionConfig {
  label: string;
  icon: string;
  action: string;
}

export interface MapConfig {
  role: string;
  visibleLayers: string[]; // List of visible layer types
  defaultRadius: number; // in KM
  showControls: {
    zoom: boolean;
    locateMe: boolean;
    fullscreen: boolean;
    measureDistance: boolean;
    heatmapToggle: boolean;
    radiusToggle: boolean;
  };
  legendItems: {
    label: string;
    color: string;
    emoji?: string;
  }[];
  quickActions: QuickActionConfig[];
}
