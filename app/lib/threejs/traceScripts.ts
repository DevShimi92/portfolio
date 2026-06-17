import { TraceScript } from '@/app/types/traceScript';
import { resolveDistanceAtWaypoint } from './traceRegistry';

//  C'est ici qu'on crée / édite les scénarios d'animation, sans
//  toucher au moteur.

//    TRACE_SCRIPTS           — tous les scripts disponibles
//    DEFAULT_SCRIPT_ROTATION — playlist jouée par défaut (rotation)

export const TRACE_SCRIPTS: Record<string, TraceScript> = {
  'default0': {
    scriptId: 'default0',
    activeTraceIds: ['trace-A7'],
    animationConfig: {
      travelSpeed: 40,
    },
  },
  'default1': {
    scriptId: 'default1',
    activeTraceIds: ['trace-A6'],
    animationConfig: {
      travelSpeed: 40,
    },
  },
  'default2': {
    scriptId: 'default2',
    activeTraceIds: ['trace-A8'],
    animationConfig: {
      travelSpeed: 40,
    },
  },
  'trace-on-1': {
    scriptId: 'trace-on-1',
    activeTraceIds: ['trace-A4'],
    glowColor: 0x03FC28,
    animationConfig: {
      travelSpeed: 90,
    },
  },
  'trace-on-2A': {
    scriptId: 'trace-on-2A',
    activeTraceIds: ['trace-A4', 'trace-A10', 'trace-A9'],
    glowColor: 0x03FC28,
    startupDelays: {
        'trace-A10': { delay: 0 },
        'trace-A9':  { delay: 0.4, startDistance: resolveDistanceAtWaypoint('trace-A9', 3.7) }
      },
    animationConfig: {
      travelSpeed: 90,
    },
  },
  'trace-on-2B': {
    scriptId: 'trace-on-2B',
    activeTraceIds: ['trace-A4', 'trace-A10', 'trace-A9'],
    glowColor: 0xF8FC03,
    startupDelays: {
        'trace-A10': { delay: 0 },
        'trace-A9':  { delay: 0.45, startDistance: resolveDistanceAtWaypoint('trace-A9', 3.7) }
      },
    animationConfig: {
      travelSpeed: 90,
      arcDensity:   12,
      arcAmplitude: 0.5,
      arcReach:     4,
      arcNervosity: 20,
      arcIntensity: 5,
    },
  },
  'trace-on-3A': {
    scriptId: 'trace-on-3A',
    activeTraceIds: ['trace-A0', 'trace-A1', 'trace-A2', 'trace-A3', 'trace-A4', 'trace-A5', 'trace-A6', 'trace-A7', 'trace-A8', 'trace-A9', 'trace-A10', 'trace-A11'],
    glowColor: 0xF8FC03,
    startupDelays: {
      'trace-A0': { delay: 0.4 },
      'trace-A1': { delay: 0.4 },
      'trace-A2': { delay: 0.3 },
      'trace-A3': { delay: 0.2 },
    },
    animationConfig: {
      travelSpeed: 90,
      arcDensity:   12,
      arcAmplitude: 0.75,
      arcReach:     6,
      arcNervosity: 20,
      arcIntensity: 9,
    },
  },
  'trace-on-3B': {
    scriptId: 'trace-on-3B',
    activeTraceIds: ['trace-A0', 'trace-A1', 'trace-A2', 'trace-A3', 'trace-A4', 'trace-A5', 'trace-A6', 'trace-A7', 'trace-A8', 'trace-A9', 'trace-A10', 'trace-A11'],
    startupDelays: {
      'trace-A0': { delay: 0.4 },
      'trace-A1': { delay: 0.4 },
      'trace-A2': { delay: 0.3 },
      'trace-A3': { delay: 0.2 },
    },
    animationConfig: {
      travelSpeed: 90,
    },
  },
};

export const DEFAULT_SCRIPT_ROTATION: string[] = ['default0', 'default1', 'default2'];
