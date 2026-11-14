import { NASA_TREK_ROOT } from './api';

export const layers = [
  {
    id: 'optical',
    name: 'Optical mosaic',
    short: 'OPTICAL',
    subtitle: 'Viking MDIM 2.1',
    resolution: '232 m / px',
    description: 'A global, true-color view of the Martian surface.',
    url: `${NASA_TREK_ROOT}Mars_Viking_MDIM21_ClrMosaic_global_232m/1.0.0/default/default028mm/{z}/{y}/{x}.jpg`,
    thumb: '/optical_thumb.jpg',
    fallbackThumb: `${NASA_TREK_ROOT}Mars_Viking_MDIM21_ClrMosaic_global_232m/1.0.0/default/default028mm/1/0/1.jpg`,
    maxNativeZoom: 7
  },
  {
    id: 'elevation',
    name: 'Elevation relief',
    short: 'ELEVATION',
    subtitle: 'MGS MOLA Color Shaded Relief',
    resolution: '463 m / px',
    description: 'Color-shaded topography reveals the planet’s dramatic relief.',
    url: `${NASA_TREK_ROOT}Mars_MGS_MOLA_ClrShade_merge_global_463m/1.0.0/default/default028mm/{z}/{y}/{x}.jpg`,
    thumb: '/elevation_thumb.jpg',
    fallbackThumb: `${NASA_TREK_ROOT}Mars_MGS_MOLA_ClrShade_merge_global_463m/1.0.0/default/default028mm/1/0/1.jpg`,
    maxNativeZoom: 7
  },
  {
    id: 'thermal',
    name: 'Thermal surface',
    short: 'THERMAL',
    subtitle: 'THEMIS IR Day Mosaic',
    resolution: '100 m / px',
    description: 'Daytime infrared imagery of the Martian surface.',
    url: `${NASA_TREK_ROOT}THEMIS_DayIR_ControlledMosaics_100m_v2_oct2018/1.0.0/default/default028mm/{z}/{y}/{x}.png`,
    thumb: '/themis_thumb.png',
    fallbackThumb: `${NASA_TREK_ROOT}THEMIS_DayIR_ControlledMosaics_100m_v2_oct2018/1.0.0/default/default028mm/1/0/1.png`,
    bounds: [[-65.0006576, -180], [65.0007535, 180]],
    maxNativeZoom: 9
  }
];
