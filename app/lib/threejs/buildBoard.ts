import { Materials } from '@/app/types/materials';
import * as THREE from 'three';

export function buildBoard(scene: THREE.Scene, materials: Materials) {

  const root = new THREE.Group();
  scene.add(root);

  const BOARD_HEIGHT  = 0.10;
  const BOARD_SURFACE = BOARD_HEIGHT / 2; // niveau Y de la surface du board

  root.add(new THREE.Mesh(
    new THREE.BoxGeometry(100, BOARD_HEIGHT, 100),
    new THREE.MeshStandardMaterial({
      color: 0x04080c, roughness: 0.12, metalness: 0.7,
    })
  ));

  // ─────────────────────────────────────────────────────────
  //  GRILLE — unité de base pour le placement des traces
  //  Toutes les coordonnées des traces sont exprimées en
  //  "cases de grille" et converties en coordonnées monde
  //  via gridX() et gridZ()
  // ─────────────────────────────────────────────────────────
  const GRID_UNIT = 1.9; // taille d'une case en unités monde
  const gridX = (column: number) => column * GRID_UNIT;
  const gridZ = (row: number) => row * GRID_UNIT;

  // Tableaux de géométries à merger par matériau
  const backFaceGeometries: THREE.BufferGeometry[] = []; // intérieur du verre (BackSide)
  const filamentGeometries: THREE.BufferGeometry[] = []; // cœur conducteur (quasi invisible)
  const frontFaceGeometries:THREE.BufferGeometry[] = []; // surface Fresnel (FrontSide)

  // ─────────────────────────────────────────────────────────
  //  BAKE — applique position + rotation à une géométrie
  //  en espace monde (évite des Object3D superflus)
  // ─────────────────────────────────────────────────────────
  function bakeTransformToGeometry(geometry: THREE.BufferGeometry, posX: number, posY: number, posZ: number, rotationY: number): THREE.BufferGeometry {
      const transformMatrix = new THREE.Matrix4();
      transformMatrix.compose(
          new THREE.Vector3(posX, posY, posZ),
          new THREE.Quaternion().setFromEuler(new THREE.Euler(0, rotationY, 0)),
          new THREE.Vector3(1, 1, 1)
      );
      const cloned = geometry.clone();
      cloned.applyMatrix4(transformMatrix);
      return cloned;
  }

  // ─────────────────────────────────────────────────────────
  //  MERGE — concatène des BufferGeometry non-indexées
  //  en une seule (un seul draw call par matériau)
  // ─────────────────────────────────────────────────────────
  function mergeGeometries(geometries: THREE.BufferGeometry[]):THREE.BufferGeometry {
      const nonIndexedGeometries = geometries.map((geo: THREE.BufferGeometry) => {
          const nonIndexed = geo.toNonIndexed();
          // Sécurité : remplace les NaN par 0 pour éviter les artefacts
          const positions = nonIndexed.attributes.position.array;
          for (let i = 0; i < positions.length; i++) {
              if (isNaN(positions[i])) positions[i] = 0;
          }
          return nonIndexed;
      });

      // Compte le total de vertices pour allouer les buffers
      let totalVertices = 0;
      nonIndexedGeometries.forEach((geo: THREE.BufferGeometry) => {
          totalVertices += geo.attributes.position.count;
      });

      const positionBuffer = new Float32Array(totalVertices * 3);
      const normalBuffer   = new Float32Array(totalVertices * 3);

      let vertexOffset = 0;
      nonIndexedGeometries.forEach((geo: THREE.BufferGeometry) => {
          positionBuffer.set(geo.attributes.position.array, vertexOffset * 3);
          if (geo.attributes.normal) {
              normalBuffer.set(geo.attributes.normal.array, vertexOffset * 3);
          }
          vertexOffset += geo.attributes.position.count;
      });

      const mergedGeometry = new THREE.BufferGeometry();
      mergedGeometry.setAttribute('position', new THREE.BufferAttribute(positionBuffer, 3));
      mergedGeometry.setAttribute('normal',   new THREE.BufferAttribute(normalBuffer,   3));
      mergedGeometry.computeVertexNormals();

      return mergedGeometry;
  }

  // ─────────────────────────────────────────────────────────
   //  TUBE OUVERT — 4 faces latérales, bouts ouverts
   //  halfWidth  : demi-largeur de la section (axe X local)
   //  halfHeight : demi-hauteur de la section (axe Y local)
   //  length     : longueur totale du tube (axe Z local)
   // ─────────────────────────────────────────────────────────
   function makeOpenTubeGeometry(halfWidth: number, halfHeight: number, length: number) {
       if (length < 0.001 || halfWidth < 0.0001 || halfHeight < 0.0001) return null;

       const halfLength = length / 2;

       // 8 sommets du tube (section rectangulaire)
       const positions = new Float32Array([
           -halfWidth, -halfHeight, -halfLength,
            halfWidth, -halfHeight, -halfLength,
            halfWidth,  halfHeight, -halfLength,
           -halfWidth,  halfHeight, -halfLength,
           -halfWidth, -halfHeight,  halfLength,
            halfWidth, -halfHeight,  halfLength,
            halfWidth,  halfHeight,  halfLength,
           -halfWidth,  halfHeight,  halfLength,
       ]);

       // Indices des triangles pour les 4 faces latérales
       const indices = new Uint16Array([
           0,1,5, 0,5,4,   // face bas
           1,2,6, 1,6,5,   // face droite
           2,3,7, 2,7,6,   // face haut
           3,0,4, 3,4,7,   // face gauche
       ]);

       const geometry = new THREE.BufferGeometry();
       geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
       geometry.setIndex(new THREE.BufferAttribute(indices, 1));
       geometry.computeVertexNormals();

       return geometry;
   }


   // ─────────────────────────────────────────────────────────
   //  AJOUT D'UN TUBE en coordonnées monde
   //  startX/Z   : point de départ
   //  endX/Z     : point d'arrivée
   //  tubeWidth  : largeur/épaisseur du tube
   // ─────────────────────────────────────────────────────────
   function addTube(startX: number, startZ: number, endX:   number, endZ:   number, tubeWidth: number) {
       const deltaX      = endX - startX;
       const deltaZ      = endZ - startZ;
       const tubeLength  = Math.sqrt(deltaX * deltaX + deltaZ * deltaZ);
       if (tubeLength < 0.01) return;

       const rotationY   = Math.atan2(deltaX, deltaZ); // angle d'orientation du tube
       const centerX     = (startX + endX) / 2;
       const centerZ     = (startZ + endZ) / 2;
       const tubeHeight  = tubeWidth; // section carrée
       const centerY     = BOARD_SURFACE + tubeHeight / 2; // posé sur le board

       // Chaque tube est créé en 3 épaisseurs (back, filament, front)
       const pushToLayers = (
           targetArray: THREE.BufferGeometry[],
           scaleWidth: number,
           scaleHeight: number
       ) => {
           const geo = makeOpenTubeGeometry(scaleWidth / 2, scaleHeight / 2, tubeLength);
           if (geo) targetArray.push(
               bakeTransformToGeometry(geo, centerX, centerY, centerZ, rotationY)
           );
       };

       pushToLayers(backFaceGeometries,  tubeWidth * 0.94, tubeHeight * 0.94);
       pushToLayers(filamentGeometries,  tubeWidth * 0.26, tubeHeight * 0.26);
       pushToLayers(frontFaceGeometries, tubeWidth,        tubeHeight       );
   }

   // Variante de addTube en coordonnées de grille
   function addTubeOnGrid(startColumn: number, startRow: number, endColumn:   number, endRow:   number, tubeWidth:   number) {
       addTube(
           gridX(startColumn), gridZ(startRow),
           gridX(endColumn),   gridZ(endRow),
           tubeWidth
       );
   }


   // ─────────────────────────────────────────────────────────
      //  JONCTION — faces haut et bas uniquement
      //  Couvre les angles à 45° entre deux tubes
      //  La taille est multipliée par √2 pour couvrir la diagonale
      // ─────────────────────────────────────────────────────────
      function makeJunctionGeometry(halfSize: number, height: number) {
          if (halfSize < 0.0001 || height < 0.0001) return null;

          const positions = new Float32Array([
              // Face bas (normale vers le bas)
              -halfSize, -height/2, -halfSize,
               halfSize, -height/2, -halfSize,
               halfSize, -height/2,  halfSize,
              -halfSize, -height/2,  halfSize,
              // Face haut (normale vers le haut)
              -halfSize,  height/2,  halfSize,
               halfSize,  height/2,  halfSize,
               halfSize,  height/2, -halfSize,
              -halfSize,  height/2, -halfSize,
          ]);

          const normals = new Float32Array([
              0,-1,0, 0,-1,0, 0,-1,0, 0,-1,0, // bas
              0, 1,0, 0, 1,0, 0, 1,0, 0, 1,0, // haut
          ]);

          const indices = new Uint16Array([
              0,1,2, 0,2,3, // face bas
              4,5,6, 4,6,7, // face haut
          ]);

          const geometry = new THREE.BufferGeometry();
          geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
          geometry.setAttribute('normal',   new THREE.BufferAttribute(normals,   3));
          geometry.setIndex(new THREE.BufferAttribute(indices, 1));

          return geometry;
      }


      // ─────────────────────────────────────────────────────────
      //  AJOUT D'UNE JONCTION en coordonnées monde
      //  Placée à chaque coude et extrémité de trace
      // ─────────────────────────────────────────────────────────
      function addJunction(posX: number, posZ: number, tubeWidth: number) {
          const junctionHeight  = tubeWidth;
          const centerY         = BOARD_SURFACE + junctionHeight / 2;
          // √2 * 0.52 pour couvrir la diagonale à 45° sans dépasser
          const diagonalCover   = (tubeWidth / 2) * Math.SQRT2 * 0.52;

          const pushToLayers = (
              targetArray: THREE.BufferGeometry[],
              scaleSize: number,
              scaleHeight: number
          ) => {
              const geo = makeJunctionGeometry(scaleSize, scaleHeight);
              if (geo) targetArray.push(
                  bakeTransformToGeometry(geo, posX, centerY, posZ, 0)
              );
          };

          pushToLayers(backFaceGeometries,  diagonalCover * 0.94, junctionHeight * 0.94);
          pushToLayers(filamentGeometries,  diagonalCover * 0.26, junctionHeight * 0.26);
          pushToLayers(frontFaceGeometries, diagonalCover,        junctionHeight       );
      }

      // Variante de addJunction en coordonnées de grille
      function addJunctionOnGrid(column: number, row: number, tubeWidth: number) {
          addJunction(gridX(column), gridZ(row), tubeWidth);
      }

      // ─────────────────────────────────────────────────────────
      //  TRACE — enchaîne des points pour former une trace PCB
      //  Pose automatiquement les tubes + jonctions à chaque coude
      //
      //  points    : tableau de [colonne, rangée] en coordonnées grille
      //  tubeWidth : largeur des tubes de la trace
      //
      //  Pour dessiner une trace, liste les points de passage :
      //  traceTubes([[colDépart, rangDépart], [col1, rang1], ..., [colFin, rangFin]], largeur)
      // ─────────────────────────────────────────────────────────
      function traceTubes(points: number[][], tubeWidth: number) {
          for (let pointIndex = 0; pointIndex < points.length - 1; pointIndex++) {
              addTubeOnGrid(
                  points[pointIndex][0],     points[pointIndex][1],
                  points[pointIndex + 1][0], points[pointIndex + 1][1],
                  tubeWidth
              );
              addJunctionOnGrid(points[pointIndex][0], points[pointIndex][1], tubeWidth);
          }
          // Jonction sur le dernier point
          addJunctionOnGrid(points[points.length - 1][0], points[points.length - 1][1], tubeWidth);
      }

      // Largeur des traces principales
      const TRACE_WIDTH  = 0.22;

      // ─────────────────────────────────────────────────────────
      //  TRACÉ DES TRACES PCB
      //  Syntaxe : traceTubes([[col, rang], ...], largeur)
      //  Les colonnes/rangées sont des coordonnées de grille
      //  (multipliées par GRID_UNIT pour obtenir les coords monde)
      // ─────────────────────────────────────────────────────────
      traceTubes([[-5.65,2.35],[-5.65,3.35], [-5.5,3.5], [-5.5,10]], TRACE_WIDTH);
      traceTubes([[-5.75,1.25],[-5.75,2.25], [-5,3], [-5,10]], TRACE_WIDTH);
      traceTubes([[-6,-4],[-6,1], [-4.5,2.5], [-4.5,10]], TRACE_WIDTH);
      traceTubes([[-5,-11.5],[-7,-9.5],[-7,-5],[-6.5,-4.5]], TRACE_WIDTH);
      traceTubes([[-5  ,-20],[-5,-10.5],[-6.5,-9],[-6.5,-4.5],[-6,-4], [-6,-0], [-4,2], [-4,10]], TRACE_WIDTH);
      traceTubes([[-3  ,-20],[-3,    -11],[-5,-9],[-5,-8]],    TRACE_WIDTH);
      traceTubes([[-2.5,-20],[-2.5,-10.5], [-5.5,-7.5],[-5.5,-0.5],[-3.5, 1.5],[-3.5,10]],  TRACE_WIDTH);
      traceTubes([[-1  ,-20],[-1    ,-11], [-5,    -7],[-5,    -1],[-3,     1],[-3,10]], TRACE_WIDTH);
      traceTubes([[-0.5,-20],[-0.5,-10.5], [-4.5,-6.5],[-4.5,-1.5],[-2.5, 0.5],[-2.5,10]], TRACE_WIDTH);
      traceTubes([[0   ,-20],[0     ,-10], [-4,    -6],[-4,    -2],[-2,     0], [-2,10]], TRACE_WIDTH);
      traceTubes([[1   ,-20],[1      ,-9], [-3,    -5],[-3    ,-3],[-2.5,-2.5], [-2.5,-0.5]], TRACE_WIDTH);
      traceTubes([[1.5 ,-20],[1.5  ,-8.5], [-2.5,-4.5],[-2.5,-3.5],[-2,    -3], [-2.5,-2.5]], TRACE_WIDTH);

      // ─────────────────────────────────────────────────────────
      //  MERGE FINAL — un seul draw call par matériau
      // ─────────────────────────────────────────────────────────
      function mergeAndAddToScene(geometries: THREE.BufferGeometry[], material: THREE.Material) {
          if (!geometries.length) return;
          const merged = mergeGeometries(geometries);
          root.add(new THREE.Mesh(merged, material));
      }

      mergeAndAddToScene(backFaceGeometries,  materials.matGlassBack);
      mergeAndAddToScene(filamentGeometries,  materials.matFilament);
      mergeAndAddToScene(frontFaceGeometries, materials.matGlassFront);
}
