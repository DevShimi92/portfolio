export interface TraceSegment {
  segmentStart:    THREE.Vector3  // extrémité de départ du segment (world-space)
  segmentEnd:      THREE.Vector3  // extrémité d'arrivée du segment (world-space)
  segmentLength:   number         // longueur du segment (unités world-space)
  cumulativeStart: number         // distance cumulée depuis le début de la trace jusqu'au début de CE segment
}
