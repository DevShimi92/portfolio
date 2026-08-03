export interface BoardTrace {
  id:         string;
  waypoints:  [number, number][];
  width:      number;
  animatable: boolean;
  glowColor?: number;   // hex color ex: 0x00eeff — requis si animatable
}
