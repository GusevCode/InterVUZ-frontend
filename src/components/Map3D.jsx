import { useEffect, useMemo, useState } from "react";
import { Canvas, useThree } from "@react-three/fiber";
import { Html, OrbitControls } from "@react-three/drei";
import { SVGLoader } from "three/examples/jsm/loaders/SVGLoader.js";
import * as THREE from "three";

function buildSvgText(mapVector) {
  const viewBox = Array.isArray(mapVector?.viewBox) ? mapVector.viewBox : [0, 0, mapVector?.width ?? 100, mapVector?.height ?? 100];
  const paths = (mapVector?.elements ?? [])
    .map((element) => {
      if (!element?.d) {
        return "";
      }

      const attrs = [];
      if (element.id) {
        attrs.push(`id="${element.id}"`);
      }
      attrs.push(`d="${element.d}"`);
      attrs.push(`fill="${element.fill ?? "none"}"`);

      if (element.stroke) {
        attrs.push(`stroke="${element.stroke}"`);
      }

      if (Number.isFinite(element.strokeWidth)) {
        attrs.push(`stroke-width="${element.strokeWidth}"`);
      }

      if (Number.isFinite(element.fillOpacity)) {
        attrs.push(`fill-opacity="${element.fillOpacity}"`);
      }

      if (Number.isFinite(element.strokeOpacity)) {
        attrs.push(`stroke-opacity="${element.strokeOpacity}"`);
      }

      if (Number.isFinite(element.opacity)) {
        attrs.push(`opacity="${element.opacity}"`);
      }

      if (element.fillRule) {
        attrs.push(`fill-rule="${element.fillRule}"`);
      }

      return `<path ${attrs.join(" ")} />`;
    })
    .join("");

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${viewBox.join(" ")}">${paths}</svg>`;
}

function getOpacity(style) {
  const base = Number.isFinite(style.opacity) ? style.opacity : 1;
  const fill = Number.isFinite(style.fillOpacity) ? style.fillOpacity : 1;
  return Math.max(0, Math.min(1, base * fill));
}

function getStrokeOpacity(style) {
  const base = Number.isFinite(style.opacity) ? style.opacity : 1;
  const stroke = Number.isFinite(style.strokeOpacity) ? style.strokeOpacity : 1;
  return Math.max(0, Math.min(1, base * stroke));
}

function parseNumber(value, fallback = null) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function CameraRig({ width, height }) {
  const { camera, size } = useThree();

  useEffect(() => {
    const aspect = size.width / size.height;
    const fovRad = camera.fov * (Math.PI / 180);
    const fitDist = Math.max(
      (height / 2) / Math.tan(fovRad / 2),
      (width / 2) / Math.tan(fovRad / 2) / aspect,
    );

    camera.up.set(0, 0, 1);
    camera.position.set(0, 0, fitDist * 1.05);
    camera.lookAt(0, 0, 0);
    camera.updateProjectionMatrix();
  }, [camera, width, height, size]);

  return null;
}

export default function Map3D({
  mapVector,
  selectedId,
  onSelect,
  showLabels = true,
  routePoints = [],
}) {
  const [hoveredId, setHoveredId] = useState(null);
  const sourceElements = useMemo(
    () => (mapVector?.elements ?? []).filter((element) => element?.d),
    [mapVector],
  );
  const svgText = useMemo(() => buildSvgText(mapVector), [mapVector]);
  const parsed = useMemo(() => new SVGLoader().parse(svgText), [svgText]);
  const shapes = useMemo(() => (
    parsed.paths.flatMap((path, pathIndex) => {
      const style = path.userData?.style ?? {};
      const element = sourceElements[pathIndex] ?? null;
      return SVGLoader.createShapes(path).map((shape, shapeIndex) => ({
        shape,
        style,
        element,
        key: `${pathIndex}-${shapeIndex}`,
      }));
    })
  ), [parsed, sourceElements]);

  const viewBox = Array.isArray(mapVector?.viewBox) ? mapVector.viewBox : [0, 0, mapVector?.width ?? 100, mapVector?.height ?? 100];
  const width = Number(mapVector?.width) || Number(viewBox[2]) || 100;
  const height = Number(mapVector?.height) || Number(viewBox[3]) || 100;
  const minX = Number(viewBox[0]) || 0;
  const minY = Number(viewBox[1]) || 0;
  const baseDepth = 30;
  const roomDepth = 50;
  const shadowExtent = Math.max(width, height) * 0.8;

  const fillMeshes = useMemo(() => (
    shapes.flatMap((item) => {
      const fill = item.style.fill ?? "#cbd5e1";
      if (!fill || fill === "none") {
        return [];
      }

      const id = item.element?.id ?? null;
      const isRoom = typeof id === "string" && id.toLowerCase().startsWith("room");
      const depth = isRoom ? roomDepth : baseDepth;
      const geometry = new THREE.ExtrudeGeometry(item.shape, {
        depth,
        bevelEnabled: false,
      });

      return [{
        key: `f-${item.key}-${fill}`,
        geometry,
        color: fill,
        opacity: getOpacity(item.style),
        id,
        depth,
      }];
    })
  ), [shapes, baseDepth, roomDepth]);

  const strokeMeshes = useMemo(() => (
    parsed.paths.flatMap((path, pathIndex) => {
      const style = path.userData?.style ?? {};
      const stroke = style.stroke;
      if (!stroke || stroke === "none") {
        return [];
      }

      const strokeWidth = parseNumber(style.strokeWidth, 1);
      const strokeStyle = SVGLoader.getStrokeStyle(
        strokeWidth,
        stroke,
        style.strokeLinejoin ?? "miter",
        style.strokeLinecap ?? "butt",
        parseNumber(style.strokeMiterlimit, 4),
      );

      return path.subPaths.flatMap((subPath, subIndex) => {
        const points = subPath.getPoints();
        const geometry = SVGLoader.pointsToStroke(points, strokeStyle);
        if (!geometry) {
          return [];
        }
        const element = sourceElements[pathIndex] ?? null;
        const id = element?.id ?? null;
        return [{
          key: `s-${pathIndex}-${subIndex}`,
          geometry,
          color: stroke,
          opacity: getStrokeOpacity(style),
          id,
        }];
      });
    })
  ), [parsed, sourceElements]);

  const outlineMeshes = useMemo(() => (
    shapes.flatMap((item) => {
      const id = item.element?.id ?? null;
      const isRoom = typeof id === "string" && id.toLowerCase().startsWith("room");
      if (!isRoom) {
        return [];
      }
      const points = item.shape.getSpacedPoints(120).map((point) => new THREE.Vector3(point.x, point.y, roomDepth + 0.6));
      const geometry = new THREE.BufferGeometry().setFromPoints(points);
      return [{
        key: `o-${item.key}`,
        geometry,
        id,
      }];
    })
  ), [shapes, roomDepth]);

  const routeGeometry = useMemo(() => {
    if (!Array.isArray(routePoints) || routePoints.length < 2) {
      return null;
    }
    const points = routePoints.map((point) => new THREE.Vector3(point.x, point.y, roomDepth + 10));
    return new THREE.BufferGeometry().setFromPoints(points);
  }, [routePoints, roomDepth]);

  const meshes = useMemo(
    () => [...fillMeshes, ...strokeMeshes, ...outlineMeshes].concat(routeGeometry ? [{ geometry: routeGeometry }] : []),
    [fillMeshes, strokeMeshes, outlineMeshes, routeGeometry],
  );

  const labelItems = useMemo(() => (
    shapes.flatMap((item) => {
      const id = item.element?.id ?? null;
      const isRoom = typeof id === "string" && id.toLowerCase().startsWith("room");
      const rawLabel = item.element?.title || item.element?.label || id;
      const label = typeof rawLabel === "string" ? rawLabel.replace(/^room-?/i, "") : rawLabel;
      if (!isRoom || !label) {
        return [];
      }
      const points = item.shape.getSpacedPoints(80);
      if (!points.length) {
        return [];
      }
      let minX = Number.POSITIVE_INFINITY;
      let maxX = Number.NEGATIVE_INFINITY;
      let minY = Number.POSITIVE_INFINITY;
      let maxY = Number.NEGATIVE_INFINITY;
      let area = 0;
      points.forEach((point, index) => {
        const next = points[(index + 1) % points.length];
        area += point.x * next.y - next.x * point.y;
        minX = Math.min(minX, point.x);
        maxX = Math.max(maxX, point.x);
        minY = Math.min(minY, point.y);
        maxY = Math.max(maxY, point.y);
      });
      area = Math.abs(area / 2);
      const centroid = points.reduce(
        (acc, point) => {
          acc.x += point.x;
          acc.y += point.y;
          return acc;
        },
        { x: 0, y: 0 },
      );
      const count = points.length;
      return [{
        key: `l-${item.key}`,
        id,
        label,
        x: centroid.x / count,
        y: centroid.y / count,
        z: roomDepth + 8,
        area,
        width: maxX - minX,
        height: maxY - minY,
      }];
    })
  ), [shapes, roomDepth]);

  const visibleLabels = useMemo(() => {
    const selectedSet = new Set([selectedId, hoveredId].filter(Boolean));
    const sorted = [...labelItems]
      .filter((item) => !selectedSet.has(item.id))
      .sort((left, right) => (right.area || 0) - (left.area || 0));
    const accepted = [];
    const minDistance = Math.max(width, height) * 0.035;

    sorted.forEach((candidate) => {
      const maxSize = Math.max(candidate.width || 0, candidate.height || 0);
      const threshold = Math.max(minDistance, maxSize * 0.5);
      const overlaps = accepted.some((item) => {
        const dx = item.x - candidate.x;
        const dy = item.y - candidate.y;
        return Math.hypot(dx, dy) < threshold;
      });
      if (!overlaps) {
        accepted.push(candidate);
      }
    });

    labelItems.forEach((item) => {
      if (selectedSet.has(item.id)) {
        accepted.push({ ...item, z: roomDepth + 14, elevated: true });
      }
    });

    return accepted;
  }, [labelItems, selectedId, hoveredId, width, height, roomDepth]);

  useEffect(() => () => {
    meshes.forEach((mesh) => mesh.geometry.dispose());
  }, [meshes]);

  function handleSelect(id) {
    if (typeof onSelect === "function") {
      onSelect(id ?? "");
    }
  }

  return (
    <Canvas
      shadows
      gl={{ alpha: true, antialias: true }}
      camera={{ position: [0, 0, Math.max(width, height) * 0.6], near: 1, far: 10000 }}
      style={{ width: "100%", height: "100%" }}
    >
      <CameraRig width={width} height={height} />
      <ambientLight intensity={0.6} />
      <directionalLight
        position={[0, 0, 600]}
        intensity={0.85}
        castShadow
        shadow-bias={-0.0005}
        shadow-normalBias={0.02}
        shadow-mapSize={[2048, 2048]}
        shadow-camera-near={1}
        shadow-camera-far={Math.max(width, height) * 5}
        shadow-camera-left={-shadowExtent}
        shadow-camera-right={shadowExtent}
        shadow-camera-top={shadowExtent}
        shadow-camera-bottom={-shadowExtent}
      />
      <group position={[-(minX + width / 2), (minY + height / 2), 0]} scale={[1, -1, 1]}>
        <mesh receiveShadow rotation={[0, 0, 0]} position={[0, 0, -2]}>
          <planeGeometry args={[width * 1.3, height * 1.3]} />
          <shadowMaterial opacity={0.25} />
        </mesh>
        {fillMeshes.map((mesh) => {
          const isSelected = mesh.id && mesh.id === selectedId;
          const isHovered = mesh.id && mesh.id === hoveredId;
          const tint = isSelected ? "#22c55e" : isHovered ? "#38bdf8" : mesh.color;
          return (
            <mesh
              key={mesh.key}
              geometry={mesh.geometry}
              castShadow
              receiveShadow
              onPointerDown={(event) => {
                event.stopPropagation();
                handleSelect(mesh.id);
              }}
              onPointerOver={(event) => {
                event.stopPropagation();
                if (mesh.id) {
                  setHoveredId(mesh.id);
                }
              }}
              onPointerOut={() => setHoveredId(null)}
            >
              <meshStandardMaterial
                color={tint}
                opacity={mesh.opacity}
                transparent={mesh.opacity < 1}
                metalness={0.05}
                roughness={0.55}
              />
            </mesh>
          );
        })}
        {strokeMeshes.map((mesh) => (
          <mesh key={mesh.key} geometry={mesh.geometry} position={[0, 0, 0.5]}>
            <meshStandardMaterial
              color={mesh.color}
              opacity={mesh.opacity}
              transparent={mesh.opacity < 1}
              metalness={0.05}
              roughness={0.8}
            />
          </mesh>
        ))}
        {outlineMeshes.map((mesh) => {
          const isSelected = mesh.id && mesh.id === selectedId;
          const isHovered = mesh.id && mesh.id === hoveredId;
          const color = isSelected ? "#16a34a" : isHovered ? "#0284c7" : "#0f172a";
          return (
            <lineLoop key={mesh.key} geometry={mesh.geometry}>
              <lineBasicMaterial color={color} linewidth={1} />
            </lineLoop>
          );
        })}
        {routeGeometry ? (
          <line geometry={routeGeometry}>
            <lineBasicMaterial color="#f97316" linewidth={2} />
          </line>
        ) : null}
        {showLabels ? visibleLabels.map((label) => (
          <Html
            key={label.key}
            position={[label.x, label.y, label.z]}
            center
            transform={false}
            occlude={false}
            style={{ pointerEvents: "none" }}
          >
            <div
              style={{
                padding: "2px 6px",
                borderRadius: 6,
                background: label.elevated ? "rgba(15, 23, 42, 0.8)" : "rgba(15, 23, 42, 0.65)",
                color: "#ffffff",
                fontSize: label.elevated ? 12 : 10,
                fontWeight: label.elevated ? 700 : 600,
                letterSpacing: 0.2,
                whiteSpace: "nowrap",
              }}
            >
              {label.label}
            </div>
          </Html>
        )) : null}
      </group>
      <OrbitControls
        enableDamping
        enablePan
        screenSpacePanning
        panSpeed={0.9}
        rotateSpeed={0.6}
        zoomSpeed={0.9}
        minPolarAngle={0}
        maxPolarAngle={Math.PI / 4}
        minDistance={Math.max(width, height) * 0.1}
        maxDistance={Math.max(width, height) * 3}
      />
    </Canvas>
  );
}
