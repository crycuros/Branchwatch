import React, { useEffect, useRef, useState, useMemo } from 'react';
import * as THREE from 'three';
import { Branch, Commit } from '@/lib/types';
import {
  RotateCcw,
  Play,
  Pause,
  Compass,
  User,
} from 'lucide-react';

interface ThreeGitTreeCanvasProps {
  className?: string;
  interactive?: boolean;
  branches?: Branch[];
  commits?: Commit[];
  onSelectCommit?: (commitHash: string) => void;
}

interface Commit3DData {
  hash: string;
  fullSha: string;
  message: string;
  branch: string;
  author: string;
  date: string;
  stats?: { additions: number; deletions: number };
  position: THREE.Vector3;
  colorHex: number;
  isHead?: boolean;
  isMerge?: boolean;
  mesh?: THREE.Mesh;
  glowMesh?: THREE.Mesh;
}

const BRANCH_COLOR_PALETTE = [
  0x10b981, // Emerald (Main / Trunk)
  0x3b82f6, // Blue
  0xa855f7, // Purple
  0xf59e0b, // Amber
  0xec4899, // Pink
  0x06b6d4, // Cyan
  0xf43f5e, // Rose
];

export const ThreeGitTreeCanvas: React.FC<ThreeGitTreeCanvasProps> = ({
  className = '',
  interactive = true,
  branches = [],
  commits = [],
  onSelectCommit,
}) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const [hoveredCommit, setHoveredCommit] = useState<Commit3DData | null>(null);
  const [tooltipPos, setTooltipPos] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isAutoRotating, setIsAutoRotating] = useState<boolean>(true);
  const [isolatedBranch, setIsolatedBranch] = useState<string | null>(null);
  const [nodeCount, setNodeCount] = useState<number>(0);

  // References to communicate with 3D animation loop without tearing down WebGL
  const autoRotateRef = useRef(true);
  useEffect(() => {
    autoRotateRef.current = isAutoRotating;
  }, [isAutoRotating]);

  const isolatedBranchRef = useRef<string | null>(null);
  useEffect(() => {
    isolatedBranchRef.current = isolatedBranch;
  }, [isolatedBranch]);

  // Reset Camera Trigger ref
  const resetCameraRef = useRef<() => void>(() => {});
  const setCameraViewRef = useRef<(view: 'iso' | 'top' | 'front') => void>(() => {});

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    let width = container.clientWidth || 800;
    let height = container.clientHeight || 550;

    // 1. Scene, Camera, Renderer
    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x050508, 0.015);

    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    const defaultCamPos = new THREE.Vector3(0, 4, 28);
    const targetCamPos = defaultCamPos.clone();
    const cameraTargetLookAt = new THREE.Vector3(0, 0, 0);
    const currentCamLookAt = new THREE.Vector3(0, 0, 0);
    camera.position.copy(defaultCamPos);

    let renderer: THREE.WebGLRenderer | null = new THREE.WebGLRenderer({
      alpha: true,
      antialias: true,
      powerPreference: 'high-performance',
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.3;
    renderer.domElement.style.width = '100%';
    renderer.domElement.style.height = '100%';
    renderer.domElement.style.display = 'block';

    // Clear previous children
    while (container.firstChild) {
      container.removeChild(container.firstChild);
    }
    container.appendChild(renderer.domElement);

    // 2. Lighting Setup
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.9);
    scene.add(ambientLight);

    const keyLight = new THREE.DirectionalLight(0xffffff, 1.4);
    keyLight.position.set(15, 25, 20);
    scene.add(keyLight);

    const emeraldLight = new THREE.PointLight(0x10b981, 4, 40);
    emeraldLight.position.set(-8, 6, 8);
    scene.add(emeraldLight);

    const cyanLight = new THREE.PointLight(0x06b6d4, 4, 40);
    cyanLight.position.set(8, -4, 8);
    scene.add(cyanLight);

    const purpleLight = new THREE.PointLight(0xa855f7, 3, 35);
    purpleLight.position.set(0, 12, -6);
    scene.add(purpleLight);

    // 3. Starfield & Ground Holographic Radar
    const starCount = 350;
    const starGeo = new THREE.BufferGeometry();
    const starPositions = new Float32Array(starCount * 3);
    const starColors = new Float32Array(starCount * 3);

    for (let i = 0; i < starCount; i++) {
      starPositions[i * 3] = (Math.random() - 0.5) * 80;
      starPositions[i * 3 + 1] = (Math.random() - 0.5) * 60;
      starPositions[i * 3 + 2] = (Math.random() - 0.5) * 80;

      const colorType = Math.random();
      if (colorType < 0.3) {
        starColors[i * 3] = 0.06;
        starColors[i * 3 + 1] = 0.72;
        starColors[i * 3 + 2] = 0.5;
      } else if (colorType < 0.6) {
        starColors[i * 3] = 0.23;
        starColors[i * 3 + 1] = 0.51;
        starColors[i * 3 + 2] = 0.96;
      } else if (colorType < 0.8) {
        starColors[i * 3] = 0.65;
        starColors[i * 3 + 1] = 0.33;
        starColors[i * 3 + 2] = 0.96;
      } else {
        starColors[i * 3] = 0.9;
        starColors[i * 3 + 1] = 0.9;
        starColors[i * 3 + 2] = 1.0;
      }
    }
    starGeo.setAttribute('position', new THREE.BufferAttribute(starPositions, 3));
    starGeo.setAttribute('color', new THREE.BufferAttribute(starColors, 3));

    const starMat = new THREE.PointsMaterial({
      size: 0.18,
      vertexColors: true,
      transparent: true,
      opacity: 0.65,
    });
    const starField = new THREE.Points(starGeo, starMat);
    scene.add(starField);

    // Radar Floor
    const radarGroup = new THREE.Group();
    radarGroup.position.y = -10;

    const gridHelper = new THREE.GridHelper(36, 36, 0x27272a, 0x141416);
    radarGroup.add(gridHelper);

    const ringGeo1 = new THREE.RingGeometry(4, 4.08, 64);
    const ringGeo2 = new THREE.RingGeometry(9, 9.1, 64);
    const ringGeo3 = new THREE.RingGeometry(15, 15.12, 64);
    const ringMat = new THREE.MeshBasicMaterial({
      color: 0x10b981,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.22,
    });

    const r1 = new THREE.Mesh(ringGeo1, ringMat);
    r1.rotation.x = -Math.PI / 2;
    const r2 = new THREE.Mesh(ringGeo2, ringMat);
    r2.rotation.x = -Math.PI / 2;
    const r3 = new THREE.Mesh(ringGeo3, ringMat);
    r3.rotation.x = -Math.PI / 2;

    radarGroup.add(r1, r2, r3);
    scene.add(radarGroup);

    // 4. Data Processing
    const commitNodesList: Commit3DData[] = [];
    const commitMeshesList: THREE.Mesh[] = [];
    const energyPackets: {
      mesh: THREE.Mesh;
      curve: THREE.CatmullRomCurve3;
      progress: number;
      speed: number;
      branchName: string;
    }[] = [];
    const branchTubes: { tube: THREE.Mesh; branchName: string; material: THREE.MeshStandardMaterial }[] = [];

    const rawCommits = commits.length > 0 ? commits.slice(0, 24) : [];
    const rawBranches = branches.length > 0 ? branches : [{ name: 'main', commit: { sha: '8a3f12c' } }];

    const branchColorMap = new Map<string, number>();
    rawBranches.forEach((b, idx) => {
      branchColorMap.set(b.name, BRANCH_COLOR_PALETTE[idx % BRANCH_COLOR_PALETTE.length]);
    });
    if (!branchColorMap.has('main')) branchColorMap.set('main', BRANCH_COLOR_PALETTE[0]);
    if (!branchColorMap.has('master')) branchColorMap.set('master', BRANCH_COLOR_PALETTE[0]);

    const mainBranchName = rawBranches[0]?.name || 'main';

    function createCommitSphere(
      pos: THREE.Vector3,
      colorHex: number,
      hash: string,
      message: string,
      branch: string,
      author: string,
      date: string,
      isHead = false,
      isMerge = false,
      stats?: { additions: number; deletions: number }
    ) {
      const radius = isHead ? 0.42 : isMerge ? 0.36 : 0.3;
      const sphereGeo = new THREE.SphereGeometry(radius, 28, 28);
      const sphereMat = new THREE.MeshStandardMaterial({
        color: colorHex,
        emissive: colorHex,
        emissiveIntensity: isHead ? 1.4 : 0.95,
        roughness: 0.08,
        metalness: 0.92,
      });

      const mesh = new THREE.Mesh(sphereGeo, sphereMat);
      mesh.position.copy(pos);
      mesh.userData = { hash, fullSha: hash, message, branch, author, date, stats, isHead, isMerge, colorHex };
      scene.add(mesh);

      const ringGeo = new THREE.RingGeometry(radius + 0.12, radius + 0.2, 32);
      const ringMat = new THREE.MeshBasicMaterial({
        color: colorHex,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: isHead ? 0.75 : 0.4,
      });
      const ring = new THREE.Mesh(ringGeo, ringMat);
      ring.position.copy(pos);
      ring.lookAt(camera.position);
      scene.add(ring);

      if (isHead) {
        const headHaloGeo = new THREE.TorusGeometry(0.65, 0.03, 16, 48);
        const headHaloMat = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.8 });
        const halo = new THREE.Mesh(headHaloGeo, headHaloMat);
        halo.position.copy(pos);
        halo.rotation.x = Math.PI / 2;
        scene.add(halo);
      }

      const item: Commit3DData = {
        hash,
        fullSha: hash,
        message,
        branch,
        author,
        date,
        stats,
        position: pos,
        colorHex,
        isHead,
        isMerge,
        mesh,
        glowMesh: ring,
      };

      commitNodesList.push(item);
      commitMeshesList.push(mesh);
    }

    if (rawCommits.length === 0) {
      // Demo Topology
      const demoNodes = [
        { hash: '8a3f12c', msg: 'Initial repository scaffolding', branch: 'main', author: 'alex', pos: new THREE.Vector3(0, -8, 0) },
        { hash: 'c90e41b', msg: 'Configure workspace schemas', branch: 'main', author: 'alex', pos: new THREE.Vector3(0, -5, 0.4) },
        { hash: 'd41a77e', msg: 'hotfix(db): add connection retry pool', branch: 'hotfix/db', author: 'sarah', pos: new THREE.Vector3(-3.5, -3.5, -2) },
        { hash: 'e88f21a', msg: 'fix: sanitize pool eviction timeout', branch: 'hotfix/db', author: 'sarah', pos: new THREE.Vector3(-4, -1.8, -2.5) },
        { hash: '710b91f', msg: 'Merge hotfix/db into main', branch: 'main', author: 'alex', pos: new THREE.Vector3(0, -1, 0), isMerge: true },
        { hash: '92fa381', msg: 'feat(auth): JWT token verify guard', branch: 'feature/auth', author: 'david', pos: new THREE.Vector3(3.8, 0.5, 2.5) },
        { hash: 'a441e8c', msg: 'feat(auth): permission clearance modal', branch: 'feature/auth', author: 'david', pos: new THREE.Vector3(5, 2.8, 3.2) },
        { hash: 'b31d99a', msg: 'Merge feature/auth into main', branch: 'main', author: 'alex', pos: new THREE.Vector3(0, 3.5, 0.2), isMerge: true },
        { hash: 'f20c441', msg: 'chore(release): bump version v1.0.0', branch: 'release/v1.0', author: 'elena', pos: new THREE.Vector3(-4, 5.2, 2.2) },
        { hash: '28e910c', msg: 'docs: update zero-config porting guide', branch: 'release/v1.0', author: 'elena', pos: new THREE.Vector3(-4.8, 7, 2.8) },
        { hash: '5c81b22', msg: 'Merge release/v1.0 into main', branch: 'main', author: 'alex', pos: new THREE.Vector3(0, 7.8, 0), isMerge: true },
        { hash: '649fa01', msg: 'HEAD -> main (v1.0.0-prod)', branch: 'main', author: 'alex', pos: new THREE.Vector3(0, 9.5, 0), isHead: true },
      ];

      const mainPts = [
        new THREE.Vector3(0, -8, 0),
        new THREE.Vector3(0, -5, 0.4),
        new THREE.Vector3(0, -1, 0),
        new THREE.Vector3(0, 3.5, 0.2),
        new THREE.Vector3(0, 7.8, 0),
        new THREE.Vector3(0, 9.5, 0),
      ];
      const mainCurve = new THREE.CatmullRomCurve3(mainPts);

      const hotfixPts = [
        new THREE.Vector3(0, -5, 0.4),
        new THREE.Vector3(-3.5, -3.5, -2),
        new THREE.Vector3(-4, -1.8, -2.5),
        new THREE.Vector3(0, -1, 0),
      ];
      const hotfixCurve = new THREE.CatmullRomCurve3(hotfixPts);

      const authPts = [
        new THREE.Vector3(0, -1, 0),
        new THREE.Vector3(3.8, 0.5, 2.5),
        new THREE.Vector3(5, 2.8, 3.2),
        new THREE.Vector3(0, 3.5, 0.2),
      ];
      const authCurve = new THREE.CatmullRomCurve3(authPts);

      const releasePts = [
        new THREE.Vector3(0, 3.5, 0.2),
        new THREE.Vector3(-4, 5.2, 2.2),
        new THREE.Vector3(-4.8, 7, 2.8),
        new THREE.Vector3(0, 7.8, 0),
      ];
      const releaseCurve = new THREE.CatmullRomCurve3(releasePts);

      const curvesConfig = [
        { curve: mainCurve, color: 0x10b981, branch: 'main' },
        { curve: hotfixCurve, color: 0xf59e0b, branch: 'hotfix/db' },
        { curve: authCurve, color: 0x3b82f6, branch: 'feature/auth' },
        { curve: releaseCurve, color: 0xa855f7, branch: 'release/v1.0' },
      ];

      curvesConfig.forEach(({ curve, color, branch }) => {
        const tubeGeo = new THREE.TubeGeometry(curve, 64, 0.1, 14, false);
        const tubeMat = new THREE.MeshStandardMaterial({
          color,
          emissive: color,
          emissiveIntensity: 0.55,
          roughness: 0.15,
          metalness: 0.85,
          transparent: true,
          opacity: 0.75,
        });
        const tubeMesh = new THREE.Mesh(tubeGeo, tubeMat);
        scene.add(tubeMesh);
        branchTubes.push({ tube: tubeMesh, branchName: branch, material: tubeMat });

        for (let p = 0; p < 3; p++) {
          const packetGeo = new THREE.SphereGeometry(0.14, 16, 16);
          const packetMat = new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.95 });
          const packet = new THREE.Mesh(packetGeo, packetMat);
          scene.add(packet);
          energyPackets.push({
            mesh: packet,
            curve,
            progress: (p / 3) + Math.random() * 0.1,
            speed: 0.0035 + Math.random() * 0.002,
            branchName: branch,
          });
        }
      });

      demoNodes.forEach((node) => {
        const col = branchColorMap.get(node.branch) || 0x10b981;
        createCommitSphere(
          node.pos,
          col,
          node.hash,
          node.msg,
          node.branch,
          node.author,
          new Date().toISOString(),
          node.isHead,
          node.isMerge
        );
      });
    } else {
      const total = rawCommits.length;
      const yStep = 17 / Math.max(1, total);
      const startY = -8.5;

      const mainTrackPoints: THREE.Vector3[] = [];
      const branchPointsMap = new Map<string, THREE.Vector3[]>();

      rawCommits.slice().reverse().forEach((c, idx) => {
        const bName = c.branch || mainBranchName;
        const bIdx = Array.from(branchColorMap.keys()).indexOf(bName);
        const angle = bName === mainBranchName ? 0 : (bIdx * (Math.PI * 2)) / Math.max(1, rawBranches.length);
        const radius = bName === mainBranchName ? 0 : 3.8 + (bIdx % 2) * 1.5;

        const x = Math.sin(angle) * radius;
        const y = startY + idx * yStep;
        const z = Math.cos(angle) * radius;
        const pos = new THREE.Vector3(x, y, z);

        if (bName === mainBranchName) {
          mainTrackPoints.push(pos);
        } else {
          if (!branchPointsMap.has(bName)) {
            const anchor = new THREE.Vector3(0, Math.max(startY, y - yStep), 0);
            branchPointsMap.set(bName, [anchor]);
          }
          branchPointsMap.get(bName)!.push(pos);
        }

        const col = branchColorMap.get(bName) || 0x10b981;
        const isHead = idx === total - 1;
        const isMerge = (c.commit?.message || '').toLowerCase().startsWith('merge');

        createCommitSphere(
          pos,
          col,
          c.sha.slice(0, 7),
          c.commit?.message || 'Update repository',
          bName,
          c.commit?.author?.name || 'developer',
          c.commit?.author?.date || new Date().toISOString(),
          isHead,
          isMerge,
          c.stats
        );
      });

      if (mainTrackPoints.length >= 2) {
        const mainCurve = new THREE.CatmullRomCurve3(mainTrackPoints);
        const tubeGeo = new THREE.TubeGeometry(mainCurve, 64, 0.12, 14, false);
        const tubeMat = new THREE.MeshStandardMaterial({
          color: 0x10b981,
          emissive: 0x10b981,
          emissiveIntensity: 0.6,
          roughness: 0.15,
          metalness: 0.85,
          transparent: true,
          opacity: 0.8,
        });
        const tube = new THREE.Mesh(tubeGeo, tubeMat);
        scene.add(tube);
        branchTubes.push({ tube, branchName: mainBranchName, material: tubeMat });

        for (let p = 0; p < 4; p++) {
          const packetGeo = new THREE.SphereGeometry(0.15, 16, 16);
          const packetMat = new THREE.MeshBasicMaterial({ color: 0x10b981, transparent: true, opacity: 0.95 });
          const packet = new THREE.Mesh(packetGeo, packetMat);
          scene.add(packet);
          energyPackets.push({
            mesh: packet,
            curve: mainCurve,
            progress: p / 4,
            speed: 0.003,
            branchName: mainBranchName,
          });
        }
      }

      branchPointsMap.forEach((pts, bName) => {
        if (pts.length >= 2) {
          const curve = new THREE.CatmullRomCurve3(pts);
          const col = branchColorMap.get(bName) || 0x3b82f6;
          const tubeGeo = new THREE.TubeGeometry(curve, 48, 0.09, 12, false);
          const tubeMat = new THREE.MeshStandardMaterial({
            color: col,
            emissive: col,
            emissiveIntensity: 0.55,
            roughness: 0.2,
            metalness: 0.8,
            transparent: true,
            opacity: 0.7,
          });
          const tube = new THREE.Mesh(tubeGeo, tubeMat);
          scene.add(tube);
          branchTubes.push({ tube, branchName: bName, material: tubeMat });

          for (let p = 0; p < 3; p++) {
            const packetGeo = new THREE.SphereGeometry(0.12, 16, 16);
            const packetMat = new THREE.MeshBasicMaterial({ color: col, transparent: true, opacity: 0.95 });
            const packet = new THREE.Mesh(packetGeo, packetMat);
            scene.add(packet);
            energyPackets.push({
              mesh: packet,
              curve,
              progress: p / 3,
              speed: 0.004,
              branchName: bName,
            });
          }
        }
      });
    }

    setNodeCount(commitNodesList.length);

    // 5. Orbit & Navigation Mechanics
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2(-999, -999);
    let isDragging = false;
    let dragButton = 0;
    let prevMouse = { x: 0, y: 0 };
    let spherical = { radius: 28, theta: 0, phi: Math.PI / 2.3 };
    let targetLookAt = new THREE.Vector3(0, 0, 0);

    const updateCameraSpherical = () => {
      spherical.radius = Math.max(10, Math.min(65, spherical.radius));
      spherical.phi = Math.max(0.1, Math.min(Math.PI - 0.1, spherical.phi));

      targetCamPos.x = targetLookAt.x + spherical.radius * Math.sin(spherical.phi) * Math.sin(spherical.theta);
      targetCamPos.y = targetLookAt.y + spherical.radius * Math.cos(spherical.phi);
      targetCamPos.z = targetLookAt.z + spherical.radius * Math.sin(spherical.phi) * Math.cos(spherical.theta);
    };
    updateCameraSpherical();

    const handleMouseDown = (e: MouseEvent) => {
      if (!interactive) return;
      isDragging = true;
      dragButton = e.button;
      prevMouse = { x: e.clientX, y: e.clientY };
    };

    const handleMouseMove = (e: MouseEvent) => {
      const rect = container.getBoundingClientRect();
      mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

      if (isDragging) {
        const dx = e.clientX - prevMouse.x;
        const dy = e.clientY - prevMouse.y;

        if (dragButton === 0) {
          spherical.theta -= dx * 0.006;
          spherical.phi -= dy * 0.006;
          updateCameraSpherical();
        } else if (dragButton === 2) {
          const panSpeed = 0.02;
          targetLookAt.x -= dx * panSpeed;
          targetLookAt.y += dy * panSpeed;
          updateCameraSpherical();
        }
        prevMouse = { x: e.clientX, y: e.clientY };
      }
    };

    const handleMouseUp = () => {
      isDragging = false;
    };

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      spherical.radius += e.deltaY * 0.025;
      updateCameraSpherical();
    };

    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
    };

    const handleClick = () => {
      if (!renderer) return;
      raycaster.setFromCamera(mouse, camera);
      const hits = raycaster.intersectObjects(commitMeshesList);
      if (hits.length > 0) {
        const hit = hits[0].object as THREE.Mesh;
        if (hit.userData?.hash && onSelectCommit) {
          onSelectCommit(hit.userData.hash);
        }
        targetLookAt.copy(hit.position);
        spherical.radius = 16;
        updateCameraSpherical();
      }
    };

    const handleDblClick = () => {
      if (!renderer) return;
      raycaster.setFromCamera(mouse, camera);
      const hits = raycaster.intersectObjects(commitMeshesList);
      if (hits.length > 0) {
        const hit = hits[0].object as THREE.Mesh;
        targetLookAt.copy(hit.position);
        spherical.radius = 12;
        updateCameraSpherical();
      }
    };

    container.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    container.addEventListener('wheel', handleWheel, { passive: false });
    container.addEventListener('contextmenu', handleContextMenu);
    container.addEventListener('click', handleClick);
    container.addEventListener('dblclick', handleDblClick);

    resetCameraRef.current = () => {
      targetLookAt.set(0, 0, 0);
      spherical = { radius: 28, theta: 0, phi: Math.PI / 2.3 };
      updateCameraSpherical();
    };

    setCameraViewRef.current = (view) => {
      targetLookAt.set(0, 0, 0);
      if (view === 'top') {
        spherical = { radius: 32, theta: 0, phi: 0.15 };
      } else if (view === 'front') {
        spherical = { radius: 30, theta: 0, phi: Math.PI / 2 };
      } else {
        spherical = { radius: 28, theta: Math.PI / 4, phi: Math.PI / 3 };
      }
      updateCameraSpherical();
    };

    // 6. Animation Loop (Using performance.now without deprecated THREE.Clock)
    let animId: number;
    let startTime = performance.now();

    const animate = (now: number) => {
      animId = requestAnimationFrame(animate);
      if (!renderer) return;

      const elapsed = (now - startTime) * 0.001;

      if (autoRotateRef.current && !isDragging) {
        spherical.theta += 0.003;
        updateCameraSpherical();
      }

      camera.position.lerp(targetCamPos, 0.08);
      currentCamLookAt.lerp(targetLookAt, 0.08);
      camera.lookAt(currentCamLookAt);

      starField.rotation.y = elapsed * 0.015;
      starField.rotation.x = Math.sin(elapsed * 0.01) * 0.05;
      radarGroup.rotation.y = elapsed * 0.05;

      energyPackets.forEach((p) => {
        const isDimmed = isolatedBranchRef.current && p.branchName !== isolatedBranchRef.current;
        p.mesh.visible = !isDimmed;
        if (!isDimmed) {
          p.progress = (p.progress + p.speed) % 1;
          const pt = p.curve.getPointAt(p.progress);
          p.mesh.position.copy(pt);
        }
      });

      branchTubes.forEach(({ branchName, material }) => {
        if (isolatedBranchRef.current) {
          if (branchName === isolatedBranchRef.current) {
            material.opacity = 0.95;
            material.emissiveIntensity = 1.0;
          } else {
            material.opacity = 0.15;
            material.emissiveIntensity = 0.1;
          }
        } else {
          material.opacity = 0.75;
          material.emissiveIntensity = 0.55;
        }
      });

      commitNodesList.forEach((c) => {
        if (c.glowMesh) {
          c.glowMesh.lookAt(camera.position);
          if (c.isHead) {
            const scale = 1 + Math.sin(elapsed * 4) * 0.08;
            c.glowMesh.scale.set(scale, scale, scale);
          }
        }
      });

      raycaster.setFromCamera(mouse, camera);
      const intersects = raycaster.intersectObjects(commitMeshesList);

      if (intersects.length > 0) {
        const hit = intersects[0].object as THREE.Mesh;
        const d = hit.userData;
        setHoveredCommit({
          hash: d.hash,
          fullSha: d.fullSha,
          message: d.message,
          branch: d.branch,
          author: d.author,
          date: d.date,
          stats: d.stats,
          position: hit.position,
          colorHex: d.colorHex,
          isHead: d.isHead,
          isMerge: d.isMerge,
        });

        const screenPos = hit.position.clone().project(camera);
        const screenX = ((screenPos.x + 1) * width) / 2;
        const screenY = ((-screenPos.y + 1) * height) / 2;
        setTooltipPos({ x: screenX, y: screenY });

        container.style.cursor = 'pointer';
      } else {
        setHoveredCommit(null);
        container.style.cursor = isDragging ? 'grabbing' : 'grab';
      }

      renderer.render(scene, camera);
    };

    animId = requestAnimationFrame(animate);

    // 7. Resize Observer
    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const cr = entry.contentRect;
        if (cr.width > 0 && cr.height > 0 && renderer) {
          width = cr.width;
          height = cr.height;
          camera.aspect = width / height;
          camera.updateProjectionMatrix();
          renderer.setSize(width, height);
        }
      }
    });
    resizeObserver.observe(container);

    return () => {
      cancelAnimationFrame(animId);
      resizeObserver.disconnect();
      container.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      container.removeEventListener('wheel', handleWheel);
      container.removeEventListener('contextmenu', handleContextMenu);
      container.removeEventListener('click', handleClick);
      container.removeEventListener('dblclick', handleDblClick);

      // Deep Scene Disposal to avoid WebGL context limits and memory leaks
      scene.traverse((obj) => {
        if (obj instanceof THREE.Mesh || obj instanceof THREE.Points) {
          if (obj.geometry) obj.geometry.dispose();
          if (obj.material) {
            if (Array.isArray(obj.material)) {
              obj.material.forEach((m) => m.dispose());
            } else {
              obj.material.dispose();
            }
          }
        }
      });

      if (renderer) {
        renderer.forceContextLoss();
        renderer.dispose();
        if (renderer.domElement && container.contains(renderer.domElement)) {
          container.removeChild(renderer.domElement);
        }
        renderer = null;
      }
    };
  }, [branches, commits, interactive, onSelectCommit]);

  const branchList = useMemo(() => {
    if (branches.length > 0) return branches;
    return [
      { name: 'main', protected: true },
      { name: 'feature/auth', protected: false },
      { name: 'release/v1.0', protected: false },
      { name: 'hotfix/db', protected: false },
    ];
  }, [branches]);

  return (
    <div className={`relative w-full h-full select-none overflow-hidden bg-[#07080a] ${className}`}>
      {/* 3D WebGL Canvas Container */}
      <div ref={mountRef} className="w-full h-full" />

      {/* Top HUD Overlay: Title, Status & Topology Count */}
      <div className="absolute top-4 left-4 z-10 flex items-center gap-3 pointer-events-none">
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-neutral-900/80 border border-neutral-800/80 backdrop-blur-md text-white shadow-xl">
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse shadow-xs shadow-emerald-400" />
          <span className="font-semibold text-xs tracking-tight">3D Spatial Topology</span>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-neutral-800 text-neutral-300">
            {nodeCount} Nodes
          </span>
        </div>
      </div>

      {/* Top-Right HUD Controls: Reset, Auto-Rotate, Zoom, Views */}
      <div className="absolute top-4 right-4 z-10 flex items-center gap-1.5 p-1 rounded-xl bg-neutral-900/85 border border-neutral-800/90 shadow-2xl backdrop-blur-md">
        <button
          onClick={() => setIsAutoRotating(!isAutoRotating)}
          className={`p-1.5 rounded-lg transition-colors text-xs flex items-center gap-1 ${
            isAutoRotating
              ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-medium'
              : 'text-neutral-400 hover:text-white hover:bg-neutral-800'
          }`}
          title={isAutoRotating ? 'Pause Orbit' : 'Resume 360° Orbit'}
        >
          {isAutoRotating ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
          <span className="hidden sm:inline text-[11px] font-mono">{isAutoRotating ? 'Orbiting' : 'Paused'}</span>
        </button>

        <div className="w-px h-4 bg-neutral-800 mx-0.5" />

        <button
          onClick={() => setCameraViewRef.current('iso')}
          className="p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors"
          title="Isometric View"
        >
          <Compass className="w-3.5 h-3.5" />
        </button>

        <button
          onClick={() => resetCameraRef.current()}
          className="p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors"
          title="Reset Camera Target"
        >
          <RotateCcw className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Bottom-Left Branch Filter Badges */}
      <div className="absolute bottom-4 left-4 z-10 flex items-center gap-1.5 flex-wrap max-w-xl">
        <button
          onClick={() => setIsolatedBranch(null)}
          className={`px-2.5 py-1 rounded-lg text-[11px] font-mono transition-all backdrop-blur-md border ${
            isolatedBranch === null
              ? 'bg-white text-neutral-900 font-bold border-transparent shadow-lg'
              : 'bg-neutral-900/80 text-neutral-400 hover:text-white border-neutral-800'
          }`}
        >
          All Branches ({branchList.length})
        </button>

        {branchList.map((b, idx) => {
          const color = BRANCH_COLOR_PALETTE[idx % BRANCH_COLOR_PALETTE.length];
          const isSelected = isolatedBranch === b.name;
          const hexStr = `#${color.toString(16).padStart(6, '0')}`;

          return (
            <button
              key={b.name}
              onClick={() => setIsolatedBranch(isSelected ? null : b.name)}
              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-mono transition-all backdrop-blur-md border ${
                isSelected
                  ? 'bg-neutral-900 text-white font-semibold border-neutral-600 shadow-xl ring-1 ring-white/20'
                  : 'bg-neutral-900/70 text-neutral-400 hover:text-white border-neutral-800/80'
              }`}
            >
              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: hexStr }} />
              <span>{b.name}</span>
            </button>
          );
        })}
      </div>

      {/* Bottom-Right Navigation Legend */}
      <div className="absolute bottom-4 right-4 z-10 pointer-events-none px-3 py-1.5 rounded-xl bg-neutral-900/70 border border-neutral-800/80 text-[10px] font-mono text-neutral-400 backdrop-blur-md hidden sm:flex items-center gap-3">
        <span>🖱 Left-Click + Drag: Rotate</span>
        <span>·</span>
        <span>Right-Click: Pan</span>
        <span>·</span>
        <span>Scroll: Zoom</span>
        <span>·</span>
        <span>Click Node: Inspect</span>
      </div>

      {/* Futuristic Holographic Commit Hover Card Tooltip */}
      {hoveredCommit && (
        <div
          style={{
            left: `${tooltipPos.x}px`,
            top: `${tooltipPos.y - 14}px`,
            transform: 'translate(-50%, -100%)',
          }}
          className="absolute z-30 pointer-events-none p-3.5 rounded-2xl bg-[#0d0f14]/95 border border-neutral-700/80 text-white shadow-2xl backdrop-blur-xl max-w-xs space-y-2 animate-in fade-in zoom-in-95 duration-100 font-sans"
        >
          <div className="flex items-center justify-between gap-3 pb-1.5 border-b border-neutral-800">
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: `#${hoveredCommit.colorHex.toString(16).padStart(6, '0')}` }} />
              <span className="font-mono text-xs text-emerald-400 font-bold">{hoveredCommit.hash}</span>
              {hoveredCommit.isHead && (
                <span className="text-[9px] font-mono uppercase px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  HEAD
                </span>
              )}
              {hoveredCommit.isMerge && (
                <span className="text-[9px] font-mono uppercase px-1.5 py-0.2 rounded bg-purple-500/20 text-purple-300 border border-purple-500/30">
                  Merge
                </span>
              )}
            </div>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-neutral-800 text-neutral-300 truncate max-w-[110px]">
              {hoveredCommit.branch}
            </span>
          </div>

          <p className="font-semibold text-xs text-neutral-100 leading-snug line-clamp-2">
            {hoveredCommit.message}
          </p>

          <div className="flex items-center justify-between text-[10px] text-neutral-400 font-mono pt-1">
            <span className="flex items-center gap-1">
              <User className="w-3 h-3 text-neutral-500" />
              <span>{hoveredCommit.author}</span>
            </span>
            <span className="text-neutral-500">Click to view diff →</span>
          </div>
        </div>
      )}
    </div>
  );
};
