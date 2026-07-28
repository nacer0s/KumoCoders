import { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext.jsx';
import useSocket from '../hooks/useSocket.js';
import { useToast } from '../contexts/ToastContext.jsx';
import LoadingSkeleton from '../components/LoadingSkeleton.jsx';

let idCounter = 0;
function uid() { return `el_${++idCounter}_${Date.now()}`; }

function pt(x, y) { return { x, y }; }

function dist(a, b) { return Math.hypot(a.x - b.x, a.y - b.y); }

function mid(a, b) { return pt((a.x + b.x) / 2, (a.y + b.y) / 2); }

const TOOLS = [
  { key: 'select', icon: 'nf-fa-arrow_pointer', label: 'Select' },
  { key: 'pen', icon: 'nf-fa-pen', label: 'Pen' },
  { key: 'rect', icon: 'nf-fa-square', label: 'Rectangle' },
  { key: 'circle', icon: 'nf-fa-circle', label: 'Circle' },
  { key: 'line', icon: 'nf-fa-minus', label: 'Line' },
  { key: 'arrow', icon: 'nf-fa-arrow_right', label: 'Arrow' },
  { key: 'text', icon: 'nf-fa-font', label: 'Text' },
  { key: 'eraser', icon: 'nf-fa-eraser', label: 'Eraser' },
];

function getBbox(el) {
  if (el.type === 'pen') {
    if (!el.points || el.points.length === 0) return { x: 0, y: 0, w: 0, h: 0 };
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    for (const p of el.points) {
      if (p.x < minX) minX = p.x;
      if (p.y < minY) minY = p.y;
      if (p.x > maxX) maxX = p.x;
      if (p.y > maxY) maxY = p.y;
    }
    return { x: minX - el.strokeWidth, y: minY - el.strokeWidth, w: maxX - minX + el.strokeWidth * 2, h: maxY - minY + el.strokeWidth * 2 };
  }
  if (el.type === 'rect' || el.type === 'circle') {
    const s = el.strokeWidth || 2;
    return { x: Math.min(el.x, el.x + el.w) - s, y: Math.min(el.y, el.y + el.h) - s, w: Math.abs(el.w) + s * 2, h: Math.abs(el.h) + s * 2 };
  }
  if (el.type === 'line' || el.type === 'arrow') {
    const s = el.strokeWidth || 2;
    const minX = Math.min(el.x1, el.x2) - s;
    const minY = Math.min(el.y1, el.y2) - s;
    return { x: minX, y: minY, w: Math.abs(el.x2 - el.x1) + s * 2, h: Math.abs(el.y2 - el.y1) + s * 2 };
  }
  if (el.type === 'text') {
    const fs = el.fontSize || 20;
    return { x: el.x, y: el.y - fs, w: (el.text || '').length * fs * 0.6, h: fs * 1.4 };
  }
  return { x: el.x || 0, y: el.y || 0, w: 0, h: 0 };
}

function hitTest(el, px, py) {
  const b = getBbox(el);
  if (px < b.x || px > b.x + b.w || py < b.y || py > b.y + b.h) return false;
  if (el.type === 'pen') {
    for (let i = 1; i < el.points.length; i++) {
      const d = distToSegment(px, py, el.points[i - 1], el.points[i]);
      if (d < Math.max(el.strokeWidth || 3, 6)) return true;
    }
    return false;
  }
  return true;
}

function distToSegment(px, py, a, b) {
  const dx = b.x - a.x, dy = b.y - a.y;
  const len2 = dx * dx + dy * dy;
  if (len2 === 0) return dist(pt(px, py), a);
  let t = ((px - a.x) * dx + (py - a.y) * dy) / len2;
  t = Math.max(0, Math.min(1, t));
  return dist(pt(px, py), pt(a.x + t * dx, a.y + t * dy));
}

const HANDLE_SIZE = 8;

function getHandles(el) {
  const b = getBbox(el);
  const cx = b.x + b.w / 2, cy = b.y + b.h / 2;
  return [
    { key: 'tl', x: b.x, y: b.y, cursor: 'nwse-resize' },
    { key: 'tr', x: b.x + b.w, y: b.y, cursor: 'nesw-resize' },
    { key: 'bl', x: b.x, y: b.y + b.h, cursor: 'nesw-resize' },
    { key: 'br', x: b.x + b.w, y: b.y + b.h, cursor: 'nwse-resize' },
    { key: 'tm', x: cx, y: b.y, cursor: 'ns-resize' },
    { key: 'bm', x: cx, y: b.y + b.h, cursor: 'ns-resize' },
    { key: 'ml', x: b.x, y: cy, cursor: 'ew-resize' },
    { key: 'mr', x: b.x + b.w, y: cy, cursor: 'ew-resize' },
  ];
}

function hitHandle(el, px, py) {
  const handles = getHandles(el);
  for (const h of handles) {
    if (Math.abs(px - h.x) < HANDLE_SIZE && Math.abs(py - h.y) < HANDLE_SIZE) return h;
  }
  return null;
}

function applyHandle(el, handle, dx, dy) {
  const b = getBbox(el);
  const e = { ...el };
  const setRect = (x1, y1, x2, y2) => {
    if (el.type === 'rect' || el.type === 'circle') {
      e.x = x1; e.y = y1; e.w = x2 - x1; e.h = y2 - y1;
    } else if (el.type === 'line' || el.type === 'arrow') {
      e.x1 = x1; e.y1 = y1; e.x2 = x2; e.y2 = y2;
    }
  };
  let x1 = b.x, y1 = b.y, x2 = b.x + b.w, y2 = b.y + b.h;
  if (handle.key.includes('l')) x1 += dx;
  if (handle.key.includes('r')) x2 += dx;
  if (handle.key.includes('t')) y1 += dy;
  if (handle.key.includes('b')) y2 += dy;
  if (el.type === 'pen') {
    const sx = (x2 - x1) / b.w, sy = (y2 - y1) / b.h;
    e.points = el.points.map(p => pt(x1 + (p.x - b.x) * sx, y1 + (p.y - b.y) * sy));
    return e;
  }
  setRect(x1, y1, x2, y2);
  return e;
}

function screenToCanvas(clientX, clientY, canvasRect, zoom, panX, panY) {
  return pt(
    (clientX - canvasRect.left - panX) / zoom,
    (clientY - canvasRect.top - panY) / zoom
  );
}

function defaultEl(type, pos, color, sw) {
  const base = { id: uid(), type, color: color || '#666666', strokeWidth: sw || 2, opacity: 1 };
  if (type === 'pen') return { ...base, points: [pos] };
  if (type === 'rect' || type === 'circle') return { ...base, x: pos.x, y: pos.y, w: 0, h: 0, fill: false };
  if (type === 'line' || type === 'arrow') return { ...base, x1: pos.x, y1: pos.y, x2: pos.x, y2: pos.y };
  if (type === 'text') return { ...base, x: pos.x, y: pos.y, text: '', fontSize: 20 };
  return base;
}

function drawElement(ctx, el, scale) {
  if (!el) return;
  ctx.save();
  ctx.globalAlpha = el.opacity ?? 1;
  ctx.strokeStyle = el.color || '#666';
  ctx.lineWidth = (el.strokeWidth || 2) * scale;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  if (el.type === 'pen' && el.points && el.points.length > 1) {
    ctx.beginPath();
    ctx.moveTo(el.points[0].x, el.points[0].y);
    for (let i = 1; i < el.points.length; i++) {
      ctx.lineTo(el.points[i].x, el.points[i].y);
    }
    ctx.stroke();
  }

  if (el.type === 'rect') {
    if (el.fill) { ctx.fillStyle = el.color; ctx.fillRect(el.x, el.y, el.w, el.h); }
    ctx.strokeRect(el.x, el.y, el.w, el.h);
  }

  if (el.type === 'circle') {
    const cx = el.x + el.w / 2, cy = el.y + el.h / 2, rx = Math.abs(el.w) / 2, ry = Math.abs(el.h) / 2;
    ctx.beginPath();
    ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
    if (el.fill) { ctx.fillStyle = el.color; ctx.fill(); }
    ctx.stroke();
  }

  if (el.type === 'line') {
    ctx.beginPath();
    ctx.moveTo(el.x1, el.y1);
    ctx.lineTo(el.x2, el.y2);
    ctx.stroke();
  }

  if (el.type === 'arrow') {
    const angle = Math.atan2(el.y2 - el.y1, el.x2 - el.x1);
    const len = Math.hypot(el.y2 - el.y1, el.x2 - el.x1);
    if (len > 0) {
      ctx.beginPath();
      ctx.moveTo(el.x1, el.y1);
      ctx.lineTo(el.x2, el.y2);
      ctx.stroke();
      const headLen = Math.min(15 * scale, len / 3);
      ctx.beginPath();
      ctx.moveTo(el.x2, el.y2);
      ctx.lineTo(el.x2 - headLen * Math.cos(angle - 0.4), el.y2 - headLen * Math.sin(angle - 0.4));
      ctx.moveTo(el.x2, el.y2);
      ctx.lineTo(el.x2 - headLen * Math.cos(angle + 0.4), el.y2 - headLen * Math.sin(angle + 0.4));
      ctx.stroke();
    }
  }

  if (el.type === 'text' && el.text) {
    const fs = (el.fontSize || 20) * scale;
    ctx.font = `${fs}px sans-serif`;
    ctx.fillStyle = el.color || '#666';
    ctx.textBaseline = 'top';
    ctx.fillText(el.text, el.x, el.y);
  }

  ctx.restore();
}

function drawSelection(ctx, el, scale) {
  const b = getBbox(el);
  ctx.save();
  ctx.strokeStyle = '#4af';
  ctx.lineWidth = 1.5;
  ctx.setLineDash([4, 3]);
  ctx.strokeRect(b.x, b.y, b.w, b.h);
  ctx.setLineDash([]);
  const hs = HANDLE_SIZE;
  getHandles(el).forEach(h => {
    ctx.fillStyle = '#fff';
    ctx.strokeStyle = '#4af';
    ctx.lineWidth = 1.5;
    ctx.fillRect(h.x - hs / 2, h.y - hs / 2, hs, hs);
    ctx.strokeRect(h.x - hs / 2, h.y - hs / 2, hs, hs);
  });
  ctx.restore();
}

function drawGrid(ctx, w, h, zoom, panX, panY) {
  const gridSize = 30 * zoom;
  if (gridSize < 5) return;
  ctx.save();
  ctx.strokeStyle = 'rgba(128,128,128,0.12)';
  ctx.lineWidth = 1;
  const ox = panX % gridSize;
  const oy = panY % gridSize;
  for (let x = ox; x < w; x += gridSize) {
    ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.stroke();
  }
  for (let y = oy; y < h; y += gridSize) {
    ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke();
  }
  ctx.restore();
}

export default function WhiteboardPage({ teamId }) {
  const { token, user } = useAuth();
  const { showToast } = useToast();
  const socket = useSocket(user);
  const [boards, setBoards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeBoard, setActiveBoard] = useState(null);
  const [elements, setElements] = useState([]);
  const canvasRef = useRef(null);
  const containerRef = useRef(null);
  const [zoom, setZoom] = useState(1);
  const panRef = useRef({ x: 0, y: 0 });
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [tool, setTool] = useState('pen');
  const [color, setColor] = useState('#666666');
  const [lineWidth, setLineWidth] = useState(2);
  const [opacity, setOpacity] = useState(1);
  const [fillShapes, setFillShapes] = useState(false);
  const [showGrid, setShowGrid] = useState(true);
  const [selectedId, setSelectedId] = useState(null);
  const [dirty, setDirty] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [remoteCursors, setRemoteCursors] = useState([]);
  const cursorsRef = useRef([]);
  const cursorThrottleRef = useRef(0);

  // History
  const historyRef = useRef([[]]);
  const historyIdxRef = useRef(0);
  const maxHistory = 50;

  function pushHistory(els) {
    const idx = historyIdxRef.current;
    const h = historyRef.current.slice(0, idx + 1);
    h.push(JSON.parse(JSON.stringify(els)));
    if (h.length > maxHistory) h.shift();
    historyRef.current = h;
    historyIdxRef.current = h.length - 1;
  }

  function undo() {
    if (historyIdxRef.current <= 0) return;
    historyIdxRef.current--;
    const els = JSON.parse(JSON.stringify(historyRef.current[historyIdxRef.current]));
    setElements(els);
    setDirty(true);
  }

  function redo() {
    if (historyIdxRef.current >= historyRef.current.length - 1) return;
    historyIdxRef.current++;
    const els = JSON.parse(JSON.stringify(historyRef.current[historyIdxRef.current]));
    setElements(els);
    setDirty(true);
  }

  // Drawing state refs
  const drawingRef = useRef(false);
  const currentElRef = useRef(null);
  const startPosRef = useRef(null);
  const dragModeRef = useRef(null); // 'draw' | 'move' | 'resize'
  const dragHandleRef = useRef(null);
  const dragOffsetRef = useRef(null);
  const spacePressedRef = useRef(false);
  const panStartRef = useRef(null);

  const elementsRef = useRef(elements);
  elementsRef.current = elements;
  const selectedRef = useRef(selectedId);
  selectedRef.current = selectedId;
  const toolRef = useRef(tool);
  toolRef.current = tool;
  const colorRef = useRef(color);
  colorRef.current = color;
  const lineWidthRef = useRef(lineWidth);
  lineWidthRef.current = lineWidth;
  const opacityRef = useRef(opacity);
  opacityRef.current = opacity;
  const fillRef = useRef(fillShapes);
  fillRef.current = fillShapes;
  const zoomRef = useRef(zoom);
  zoomRef.current = zoom;
  const socketRef = useRef(null);
  socketRef.current = socket;

  const drawContent = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const w = canvas.width / devicePixelRatio;
    const h = canvas.height / devicePixelRatio;
    ctx.setTransform(devicePixelRatio, 0, 0, devicePixelRatio, 0, 0);

    const z = zoomRef.current;
    const p = panRef.current;
    const allEls = elementsRef.current;

    ctx.fillStyle = getComputedStyle(document.documentElement).getPropertyValue('--color-bg').trim() || '#1a1a1a';
    ctx.fillRect(0, 0, w, h);

    if (showGrid) drawGrid(ctx, w, h, z, p.x, p.y);

    ctx.save();
    ctx.translate(p.x, p.y);
    ctx.scale(z, z);

    for (const el of allEls) {
      drawElement(ctx, el, 1);
    }

    if (selectedRef.current) {
      const sel = allEls.find(e => e.id === selectedRef.current);
      if (sel) drawSelection(ctx, sel, 1);
    }

    const ghost = currentElRef.current;
    if (ghost && ghost.type !== 'pen') {
      drawElement(ctx, ghost, 1);
    }

    // Remote cursors
    const cursors = cursorsRef.current;
    for (const c of cursors) {
      if (!c.position) continue;
      const cx = c.position.x, cy = c.position.y;
      ctx.beginPath();
      ctx.arc(cx, cy, 5, 0, Math.PI * 2);
      ctx.fillStyle = '#4af';
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(cx + 8, cy + 12);
      ctx.lineTo(cx - 4, cy + 8);
      ctx.closePath();
      ctx.fillStyle = '#4af';
      ctx.fill();
      const name = c.user?.display_name || c.user?.username || 'User';
      ctx.font = '11px sans-serif';
      ctx.fillStyle = '#fff';
      ctx.fillText(name, cx + 10, cy + 6);
    }

    ctx.restore();
  }, [showGrid]);

  function sizeCanvas() {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;
    const w = container.clientWidth;
    const h = container.clientHeight;
    if (w === 0 || h === 0) return;
    const bw = Math.round(w * devicePixelRatio);
    const bh = Math.round(h * devicePixelRatio);
    if (canvas.width !== bw || canvas.height !== bh) {
      canvas.width = bw;
      canvas.height = bh;
    }
  }

  const redraw = useCallback(() => {
    sizeCanvas();
    drawContent();
  }, [drawContent]);

  useEffect(() => {
    redraw();
  }, [elements, selectedId, zoom, pan, remoteCursors, redraw]);

  useEffect(() => {
    const ro = new ResizeObserver(() => redraw());
    if (containerRef.current) ro.observe(containerRef.current);
    return () => ro.disconnect();
  }, [redraw]);

  useEffect(() => { sizeCanvas(); }, []);

  // Socket listeners for active board
  useEffect(() => {
    if (!activeBoard || !socketRef.current) return;
    const s = socketRef.current;
    s.joinWhiteboard(activeBoard.id, {
      id: user?.id,
      display_name: user?.display_name,
      username: user?.username,
      avatar_url: user?.avatar_url,
    });

    const unsubs = [];

    unsubs.push(s.on('whiteboard:element:add', ({ element }) => {
      setElements(prev => {
        if (prev.find(e => e.id === element.id)) return prev;
        const next = [...prev, element];
        pushHistory(next);
        return next;
      });
      setDirty(true);
    }));

    unsubs.push(s.on('whiteboard:element:update', ({ elementId, changes }) => {
      setElements(prev => {
        const next = prev.map(e => e.id === elementId ? { ...e, ...changes } : e);
        pushHistory(next);
        return next;
      });
      setDirty(true);
    }));

    unsubs.push(s.on('whiteboard:element:delete', ({ elementId }) => {
      setElements(prev => {
        const next = prev.filter(e => e.id !== elementId);
        pushHistory(next);
        return next;
      });
      setDirty(true);
    }));

    unsubs.push(s.on('whiteboard:clear', () => {
      setElements([]);
      pushHistory([]);
      setDirty(true);
    }));

    unsubs.push(s.on('whiteboard:sync', ({ elements: remoteEls }) => {
      if (Array.isArray(remoteEls) && remoteEls.length > 0) {
        setElements(remoteEls);
        pushHistory(remoteEls);
        setDirty(true);
      }
    }));

    unsubs.push(s.on('whiteboard:cursor:move', ({ userId, user: cursorUser, position }) => {
      cursorsRef.current = [...cursorsRef.current.filter(c => c.userId !== userId), { userId, user: cursorUser, position }];
      setRemoteCursors(cursorsRef.current);
    }));

    unsubs.push(s.on('whiteboard:user:left', ({ userId }) => {
      cursorsRef.current = cursorsRef.current.filter(c => c.userId !== userId);
      setRemoteCursors(cursorsRef.current);
    }));

    return () => {
      unsubs.forEach(fn => fn());
      s.leaveWhiteboard(activeBoard.id);
      cursorsRef.current = [];
      setRemoteCursors([]);
    };
  }, [activeBoard?.id, user?.id]);

  // Fetch boards
  function fetchBoards() {
    if (!token) return;
    fetch(`/api/studio/teams/${teamId}/whiteboards`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(r => { if (!r.ok) throw new Error(); return r.json(); })
      .then(data => { if (Array.isArray(data)) setBoards(data); })
      .catch(() => {}).finally(() => setLoading(false));
  }

  useEffect(() => { fetchBoards(); }, [teamId, token]);

  async function openBoard(board) {
    setActiveBoard(board);
    const res = await fetch(`/api/studio/whiteboards/${board.id}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (res.ok) {
      const data = await res.json();
      setActiveBoard(data);
      let els = data.elements;
      if (typeof els === 'string') { try { els = JSON.parse(els); } catch { els = []; } }
      if (!Array.isArray(els)) els = [];
      setElements(els);
      historyRef.current = [JSON.parse(JSON.stringify(els))];
      historyIdxRef.current = 0;
      setSelectedId(null);
      setDirty(false);
    }
  }

  function getCanvasPos(e) {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const t = e.touches ? e.touches[0] : e;
    return screenToCanvas(t.clientX, t.clientY, rect, zoomRef.current, panRef.current.x, panRef.current.y);
  }

  function handlePointerDown(e) {
    if (e.button === 1 || spacePressedRef.current) {
      panStartRef.current = { x: e.clientX - panRef.current.x, y: e.clientY - panRef.current.y };
      return;
    }
    const pos = getCanvasPos(e);
    const currentTool = toolRef.current;
    const allEls = elementsRef.current;

    if (currentTool === 'select') {
      // Check handles first
      const sel = allEls.find(el => el.id === selectedRef.current);
      if (sel) {
        const h = hitHandle(sel, pos.x, pos.y);
        if (h) {
          dragModeRef.current = 'resize';
          dragHandleRef.current = h;
          return;
        }
      }
      // Check element hit
      for (let i = allEls.length - 1; i >= 0; i--) {
        if (hitTest(allEls[i], pos.x, pos.y)) {
          setSelectedId(allEls[i].id);
          dragModeRef.current = 'move';
          const b = getBbox(allEls[i]);
          dragOffsetRef.current = { x: pos.x - b.x, y: pos.y - b.y };
          return;
        }
      }
      setSelectedId(null);
      return;
    }

    if (currentTool === 'eraser') {
      for (let i = allEls.length - 1; i >= 0; i--) {
        if (hitTest(allEls[i], pos.x, pos.y)) {
          const next = allEls.filter(el => el.id !== allEls[i].id);
          setElements(next);
          pushHistory(next);
          setDirty(true);
          if (selectedRef.current === allEls[i].id) setSelectedId(null);
          return;
        }
      }
      return;
    }

    if (currentTool === 'text') {
      const newEl = defaultEl('text', pos, colorRef.current, lineWidthRef.current);
      const newText = prompt('Enter text:', '');
      if (newText) {
        newEl.text = newText;
        const next = [...allEls, newEl];
        setElements(next);
        pushHistory(next);
        setDirty(true);
        setSelectedId(newEl.id);
        setTool('select');
      }
      return;
    }

    // Drawing tool
    drawingRef.current = true;
    startPosRef.current = pos;
    const el = defaultEl(currentTool, pos, colorRef.current, lineWidthRef.current);
    el.opacity = opacityRef.current;
    if (currentTool === 'rect' || currentTool === 'circle') el.fill = fillRef.current;
    currentElRef.current = el;
  }

  function handlePointerMove(e) {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const t = e.touches ? e.touches[0] : e;

    if (panStartRef.current) {
      panRef.current = { x: e.clientX - panStartRef.current.x, y: e.clientY - panStartRef.current.y };
      setPan({ ...panRef.current });
      return;
    }

    const pos = screenToCanvas(t.clientX, t.clientY, rect, zoomRef.current, panRef.current.x, panRef.current.y);

    const now = Date.now();
    if (now - cursorThrottleRef.current > 50 && socketRef.current?.emit && activeBoard) {
      cursorThrottleRef.current = now;
      socketRef.current.emit('whiteboard:cursor:move', { boardId: activeBoard.id, position: pos });
    }

    if (dragModeRef.current === 'move' && selectedRef.current) {
      const b = getBbox(elementsRef.current.find(el => el.id === selectedRef.current));
      if (!b) return;
      const dx = pos.x - b.x - dragOffsetRef.current.x;
      const dy = pos.y - b.y - dragOffsetRef.current.y;
      const next = elementsRef.current.map(el => {
        if (el.id !== selectedRef.current) return el;
        const e = { ...el };
        if (e.type === 'pen') {
          e.points = e.points.map(p => pt(p.x + dx, p.y + dy));
        } else if (e.type === 'rect' || e.type === 'circle') {
          e.x += dx; e.y += dy;
        } else if (e.type === 'line' || e.type === 'arrow') {
          e.x1 += dx; e.y1 += dy; e.x2 += dx; e.y2 += dy;
        } else if (e.type === 'text') {
          e.x += dx; e.y += dy;
        }
        return e;
      });
      setElements(next);
      setDirty(true);
      return;
    }

    if (dragModeRef.current === 'resize' && selectedRef.current) {
      const el = elementsRef.current.find(e => e.id === selectedRef.current);
      if (!el || !dragHandleRef.current) return;
      const b = getBbox(el);
      const dx = pos.x - (dragHandleRef.current.key.includes('r') ? (b.x + b.w) : dragHandleRef.current.key.includes('l') ? b.x : (b.x + b.w / 2));
      const dy = pos.y - (dragHandleRef.current.key.includes('b') ? (b.y + b.h) : dragHandleRef.current.key.includes('t') ? b.y : (b.y + b.h / 2));
      const next = elementsRef.current.map(e => {
        if (e.id !== selectedRef.current) return e;
        return applyHandle(e, dragHandleRef.current, dx, dy);
      });
      setElements(next);
      setDirty(true);
      return;
    }

    if (!drawingRef.current || !currentElRef.current) return;

    if (currentElRef.current.type === 'pen') {
      currentElRef.current = { ...currentElRef.current, points: [...currentElRef.current.points, pos] };
      redraw();
      return;
    }

    const el = currentElRef.current;
    const start = startPosRef.current;
    if (el.type === 'rect' || el.type === 'circle') {
      el.x = Math.min(start.x, pos.x);
      el.y = Math.min(start.y, pos.y);
      el.w = pos.x - start.x;
      el.h = pos.y - start.y;
    }
    if (el.type === 'line' || el.type === 'arrow') {
      el.x2 = pos.x;
      el.y2 = pos.y;
    }
    currentElRef.current = { ...el };
    redraw();
  }

  function handlePointerUp(e) {
    if (panStartRef.current) { panStartRef.current = null; return; }

    if (dragModeRef.current === 'move' || dragModeRef.current === 'resize') {
      if (dirty) {
        pushHistory(elementsRef.current);
        if (socketRef.current?.emit && selectedRef.current) {
          const sel = elementsRef.current.find(e => e.id === selectedRef.current);
          if (sel) socketRef.current.emit('whiteboard:element:update', { boardId: activeBoard?.id, elementId: sel.id, changes: sel });
        }
      }
      dragModeRef.current = null;
      dragHandleRef.current = null;
      dragOffsetRef.current = null;
      return;
    }

    if (!drawingRef.current || !currentElRef.current) return;
    drawingRef.current = false;

    const el = currentElRef.current;
    currentElRef.current = null;
    startPosRef.current = null;

    if (el.type === 'pen' && el.points.length < 2) return;
    if ((el.type === 'rect' || el.type === 'circle') && Math.abs(el.w) < 3 && Math.abs(el.h) < 3) return;
    if ((el.type === 'line' || el.type === 'arrow') && dist(pt(el.x1, el.y1), pt(el.x2, el.y2)) < 3) return;

    const next = [...elementsRef.current, el];
    setElements(next);
    pushHistory(next);
    setDirty(true);
    if (el.type !== 'pen') setSelectedId(el.id);
    if (socketRef.current?.emit) socketRef.current.emit('whiteboard:element:add', { boardId: activeBoard?.id, element: el });
  }

  function handleWheel(e) {
    if (e.ctrlKey || e.metaKey) {
      e.preventDefault();
      const delta = -e.deltaY * 0.001;
      const newZoom = Math.max(0.1, Math.min(10, zoomRef.current + delta));
      const rect = canvasRef.current.getBoundingClientRect();
      const mx = e.clientX - rect.left;
      const my = e.clientY - rect.top;
      const s = newZoom / zoomRef.current;
      panRef.current = {
        x: mx - s * (mx - panRef.current.x),
        y: my - s * (my - panRef.current.y),
      };
      setPan({ ...panRef.current });
      setZoom(newZoom);
    } else {
      panRef.current = {
        x: panRef.current.x - e.deltaX,
        y: panRef.current.y - e.deltaY,
      };
      setPan({ ...panRef.current });
    }
  }

  useEffect(() => {
    function onKey(e) {
      if (e.key === ' ' && e.target === document.body) {
        e.preventDefault();
        spacePressedRef.current = true;
      }
      if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) { e.preventDefault(); undo(); }
      if ((e.ctrlKey || e.metaKey) && (e.key === 'y' || (e.key === 'z' && e.shiftKey))) { e.preventDefault(); redo(); }
      if (e.key === 'Delete' || e.key === 'Backspace') {
        if (selectedRef.current && e.target.tagName !== 'INPUT' && e.target.tagName !== 'TEXTAREA') {
          const id = selectedRef.current;
          const next = elementsRef.current.filter(el => el.id !== id);
          setElements(next);
          pushHistory(next);
          setDirty(true);
          setSelectedId(null);
          if (socketRef.current?.emit) socketRef.current.emit('whiteboard:element:delete', { boardId: activeBoard?.id, elementId: id });
        }
      }
      if (e.key === 'Escape') { setSelectedId(null); }
    }
    function onKeyUp(e) {
      if (e.key === ' ') spacePressedRef.current = false;
    }
    window.addEventListener('keydown', onKey);
    window.addEventListener('keyup', onKeyUp);
    return () => { window.removeEventListener('keydown', onKey); window.removeEventListener('keyup', onKeyUp); };
  }, []);

  async function handleSave() {
    if (!activeBoard) return;
    try {
      const res = await fetch(`/api/studio/whiteboards/${activeBoard.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ title: activeBoard.title, elements: elements }),
      });
      if (res.ok) { setDirty(false); showToast('Board saved', 'success'); }
    } catch { showToast('Failed to save board', 'error'); }
  }

  async function handleCreate(e) {
    e.preventDefault();
    try {
      const res = await fetch(`/api/studio/teams/${teamId}/whiteboards`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ title: newTitle || 'Untitled Board', elements: [] }),
      });
      if (res.ok) {
        const board = await res.json();
        setShowCreate(false);
        setNewTitle('');
        fetchBoards();
        openBoard(board);
        showToast('Board created', 'success');
      }
    } catch { showToast('Failed to create board', 'error'); }
  }

  async function handleClear() {
    setElements([]);
    pushHistory([]);
    setDirty(true);
    setSelectedId(null);
    if (socketRef.current?.emit) socketRef.current.emit('whiteboard:clear', { boardId: activeBoard?.id });
  }

  function handleExport() {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const link = document.createElement('a');
    link.download = `${activeBoard?.title || 'whiteboard'}.png`;
    link.href = canvas.toDataURL();
    link.click();
  }

  function zoomTo(v) {
    const newZoom = Math.max(0.1, Math.min(10, v));
    setZoom(newZoom);
  }

  function handleDeleteBoard(boardId) {
    fetch(`/api/studio/whiteboards/${boardId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    }).then(r => {
      if (r.ok) {
        if (activeBoard?.id === boardId) {
          setActiveBoard(null);
          setElements([]);
          setSelectedId(null);
        }
        fetchBoards();
        showToast('Board deleted', 'success');
      }
    }).catch(() => { showToast('Failed to delete board', 'error'); });
  }

  useEffect(() => {
    function handleBeforeUnload(e) {
      if (dirty) { e.preventDefault(); e.returnValue = ''; }
    }
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [dirty]);

  if (loading) return <LoadingSkeleton.Page />;

  return (
    <div className="studio-page">
      <div className="studio-page-header">
        <h1><span className="nf nf-fa-pen_fancy" /> Whiteboard</h1>
        <div className="studio-page-actions">
          <button className="studio-btn studio-btn--ghost" onClick={() => setShowCreate(true)}>
            <span className="nf nf-fa-plus" /> New Board
          </button>
        </div>
      </div>

      <div className="studio-whiteboard-layout">
        <div className="studio-whiteboard-sidebar">
          {boards.map(b => (
            <button
              key={b.id}
              className={`studio-docs-item ${activeBoard?.id === b.id ? 'studio-docs-item--active' : ''}`}
              onClick={() => openBoard(b)}
            >
              <span className="nf nf-fa-pen_fancy" />
              <div>
                <strong>{b.title}</strong>
                <span className="studio-text-muted">{b.author_name}</span>
              </div>
              <button className="studio-btn studio-btn--icon studio-board-delete" onClick={(e) => { e.stopPropagation(); handleDeleteBoard(b.id); }}>
                <span className="nf nf-fa-trash" />
              </button>
            </button>
          ))}
        </div>

        <div className="studio-whiteboard-main">
          {activeBoard ? (
            <>
              {/* Toolbar */}
              <div className="studio-whiteboard-toolbar">
                <div className="studio-whiteboard-toolbar-row">
                  <div className="studio-wb-tools">
                    {TOOLS.map(t => (
                      <button
                        key={t.key}
                        className={`studio-wb-tool ${tool === t.key ? 'studio-wb-tool--active' : ''}`}
                        onClick={() => setTool(t.key)}
                        title={t.label}
                      >
                        <span className={`nf ${t.icon}`} />
                      </button>
                    ))}
                  </div>

                  <div className="studio-wb-controls">
                    <label className="studio-wb-label" title="Color">
                      <input type="color" value={color} onChange={e => setColor(e.target.value)} className="studio-color-input" />
                    </label>

                    <label className="studio-wb-label" title="Stroke width">
                      <span className="studio-wb-label-text">W</span>
                      <input type="range" min={1} max={20} value={lineWidth} onChange={e => setLineWidth(parseInt(e.target.value))} className="studio-wb-slider" />
                      <span className="studio-wb-value">{lineWidth}</span>
                    </label>

                    <label className="studio-wb-label" title="Opacity">
                      <span className="studio-wb-label-text">O</span>
                      <input type="range" min={0.1} max={1} step={0.1} value={opacity} onChange={e => setOpacity(parseFloat(e.target.value))} className="studio-wb-slider" />
                      <span className="studio-wb-value">{Math.round(opacity * 100)}%</span>
                    </label>

                    <label className="studio-wb-label" title="Fill shapes">
                      <input type="checkbox" checked={fillShapes} onChange={e => setFillShapes(e.target.checked)} />
                      <span className="studio-wb-label-text">Fill</span>
                    </label>

                    <label className="studio-wb-label" title="Show grid">
                      <input type="checkbox" checked={showGrid} onChange={e => setShowGrid(e.target.checked)} />
                      <span className="studio-wb-label-text">Grid</span>
                    </label>
                  </div>
                </div>

                <div className="studio-whiteboard-tools">
                  <button className="studio-btn studio-btn--icon" onClick={undo} title="Undo (Ctrl+Z)">
                    <span className="nf nf-fa-rotate_left" />
                  </button>
                  <button className="studio-btn studio-btn--icon" onClick={redo} title="Redo (Ctrl+Y)">
                    <span className="nf nf-fa-rotate_right" />
                  </button>
                  <div className="studio-wb-sep" />
                  <button className="studio-btn studio-btn--icon" onClick={() => zoomTo(zoom - 0.2)} title="Zoom out">
                    <span className="nf nf-fa-search_minus" />
                  </button>
                  <span className="studio-wb-zoom-text">{Math.round(zoom * 100)}%</span>
                  <button className="studio-btn studio-btn--icon" onClick={() => zoomTo(zoom + 0.2)} title="Zoom in">
                    <span className="nf nf-fa-search_plus" />
                  </button>
                  <button className="studio-btn studio-btn--ghost" onClick={() => zoomTo(1)}>Reset</button>
                  <div className="studio-wb-sep" />
                  <button className="studio-btn studio-btn--icon" onClick={handleExport} title="Export PNG">
                    <span className="nf nf-fa-download" />
                  </button>
                  <button className="studio-btn studio-btn--ghost" onClick={handleClear}>
                    <span className="nf nf-fa-eraser" /> Clear
                  </button>
                  <button className="studio-btn studio-btn--primary" onClick={handleSave} disabled={!dirty}>
                    <span className="nf nf-fa-floppy_disk" /> {dirty ? 'Save' : 'Saved'}
                  </button>
                </div>
              </div>

              {/* Canvas */}
              <div className="studio-whiteboard-canvas-wrap" ref={containerRef} onWheel={handleWheel}>
                <canvas
                  ref={canvasRef}
                  className="studio-whiteboard-canvas"
                  onMouseDown={handlePointerDown}
                  onMouseMove={handlePointerMove}
                  onMouseUp={handlePointerUp}
                  onMouseLeave={handlePointerUp}
                  onTouchStart={handlePointerDown}
                  onTouchMove={handlePointerMove}
                  onTouchEnd={handlePointerUp}
                  style={{ touchAction: 'none', cursor: tool === 'select' ? 'default' : tool === 'text' ? 'text' : tool === 'eraser' ? 'pointer' : 'crosshair' }}
                />
              </div>
            </>
          ) : (
            <div className="studio-empty">
              <span className="nf nf-fa-pen_fancy studio-empty-icon" />
              <h3>Select a board</h3>
              <p>Choose a whiteboard from the list or create a new one</p>
            </div>
          )}
        </div>
      </div>

      {showCreate && (
        <>
          <div className="studio-backdrop" onClick={() => setShowCreate(false)} />
          <div className="studio-modal">
            <div className="studio-modal-header">
              <h2>New Whiteboard</h2>
              <button className="studio-btn studio-btn--ghost" onClick={() => setShowCreate(false)}>
                <span className="nf nf-fa-xmark" /></button>
            </div>
            <form onSubmit={handleCreate} className="studio-form">
              <label className="studio-label">Title <input className="studio-input" value={newTitle} onChange={e => setNewTitle(e.target.value)} required autoFocus /></label>
              <div className="studio-form-actions">
                <button type="submit" className="studio-btn studio-btn--primary">Create</button>
              </div>
            </form>
          </div>
        </>
      )}
    </div>
  );
}
