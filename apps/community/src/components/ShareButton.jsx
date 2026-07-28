import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useToast } from '../contexts/ToastContext.jsx';

function stripHtml(text) {
  if (!text) return '';
  return text
    .replace(/<[^>]*>/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function shareText({ title, author, body }) {
  const excerpt = stripHtml(body).slice(0, 150);
  let text = title || 'Check this out';
  if (author) text += `\nby @${author}`;
  if (excerpt) text += `\n\n${excerpt}`;
  return text;
}

function truncate(str, len) {
  if (!str) return '';
  const cleaned = stripHtml(str);
  return cleaned.length > len ? cleaned.slice(0, len) + '…' : cleaned;
}

let cardBlobCache = null;
let cardDataCache = null;

const NERD_FONT_FAMILY = '"NerdFontsSymbols Nerd Font"';
const NERD_FONT_URL = "url('https://www.nerdfonts.com/assets/fonts/Symbols-2048-em%20Nerd%20Font%20Complete.woff2')";

export default function ShareButton({ postId, postTitle, postBody, authorUsername, authorDisplayName, authorAvatarUrl, authorIsVerified, tags, createdAt, commentCount, className }) {
  const { showToast } = useToast();
  const [open, setOpen] = useState(false);
  const [capturing, setCapturing] = useState(false);
  const overlayRef = useRef(null);
  const canvasRef = useRef(null);
  const avatarImgRef = useRef(null);
  const logoImgRef = useRef(null);
  const nerdFontLoadedRef = useRef(false);

  const url = `${window.location.origin}/community/post/${postId}`;
  const cardText = shareText({ title: postTitle, author: authorUsername, body: postBody });
  const fullText = cardText + '\n\n' + url;
  const encodedUrl = encodeURIComponent(url);
  const encodedFull = encodeURIComponent(fullText);
  const encodedCard = encodeURIComponent(cardText);

  const isDark = document.documentElement.getAttribute('data-theme') === 'dark';

  useEffect(() => {
    if (!open) return;
    function handleKeyDown(e) {
      if (e.key === 'Escape') setOpen(false);
    }
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [open]);

  function handleOverlayClick(e) {
    if (e.target === overlayRef.current) setOpen(false);
  }

  function timeAgo(dateStr) {
    if (!dateStr) return '';
    const now = Date.now();
    const then = new Date(dateStr).getTime();
    const diff = Math.floor((now - then) / 1000);
    if (diff < 60) return 'just now';
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    if (diff < 2592000) return `${Math.floor(diff / 86400)}d ago`;
    return new Date(dateStr).toLocaleDateString();
  }

  function drawCard(canvas) {
    const W = 600;
    const H = 315;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = W * dpr;
    canvas.height = H * dpr;
    canvas.style.width = W + 'px';
    canvas.style.height = H + 'px';
    const ctx = canvas.getContext('2d');
    ctx.scale(dpr, dpr);

    const bg = isDark ? '#0d1117' : '#ffffff';
    const text = isDark ? '#e6edf3' : '#1f2328';
    const muted = isDark ? '#8b949e' : '#656d76';
    const subtle = isDark ? '#30363d' : '#d0d7de';
    const border = isDark ? '#21262d' : '#d8dee4';

    // Background
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, W, H);

    // Header section
    const avatarSize = 32;
    const avatarX = 24;
    const avatarY = 24;
    const nameX = avatarX + avatarSize + 12;

    // Draw avatar
    const displayName = authorDisplayName || authorUsername || 'Anonymous';
    const username = authorUsername ? '@' + authorUsername : '';
    const initial = displayName.charAt(0).toUpperCase();

    ctx.save();
    ctx.beginPath();
    ctx.arc(avatarX + avatarSize / 2, avatarY + avatarSize / 2, avatarSize / 2, 0, Math.PI * 2);
    ctx.clip();

    const avImg = avatarImgRef.current;
    if (avImg && avImg.complete && avImg.naturalWidth > 0) {
      ctx.drawImage(avImg, avatarX, avatarY, avatarSize, avatarSize);
    } else {
      ctx.fillStyle = isDark ? '#30363d' : '#e1e4e8';
      ctx.fillRect(avatarX, avatarY, avatarSize, avatarSize);
      ctx.fillStyle = text;
      ctx.font = 'bold 14px system-ui, -apple-system, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(initial, avatarX + avatarSize / 2, avatarY + avatarSize / 2);
      ctx.textAlign = 'left';
      ctx.textBaseline = 'alphabetic';
    }
    ctx.restore();

    // Display name
    ctx.fillStyle = text;
    ctx.font = 'bold 14px system-ui, -apple-system, sans-serif';
    ctx.fillText(displayName, nameX, avatarY + 13);
    let nameEnd = nameX + ctx.measureText(displayName).width + 4;

    // Verified badge
    if (authorIsVerified) {
      ctx.fillStyle = isDark ? '#58a6ff' : '#0969da';
      if (nerdFontLoadedRef.current) {
        ctx.font = '16px ' + NERD_FONT_FAMILY + ', system-ui, -apple-system, sans-serif';
        ctx.textBaseline = 'middle';
        ctx.fillText('\uf36e', nameEnd, avatarY + avatarSize / 2 + 1);
        ctx.textBaseline = 'alphabetic';
        nameEnd += 18;
      } else {
        ctx.font = '13px system-ui, -apple-system, sans-serif';
        ctx.fillText('✓', nameEnd, avatarY + 14);
        nameEnd += 14;
      }
    }

    // Time ago
    const timeStr = timeAgo(createdAt);
    if (timeStr) {
      ctx.fillStyle = muted;
      ctx.font = '13px system-ui, -apple-system, sans-serif';
      ctx.fillText('· ' + timeStr, nameEnd, avatarY + 13);
    }

    // Username
    ctx.fillStyle = muted;
    ctx.font = '13px system-ui, -apple-system, sans-serif';
    ctx.fillText(username, nameX, avatarY + 30);

    // Divider
    ctx.strokeStyle = border;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(24, 72);
    ctx.lineTo(576, 72);
    ctx.stroke();

    // Title
    const title = postTitle || 'KumoCoders Post';
    ctx.fillStyle = text;
    ctx.font = 'bold 20px system-ui, -apple-system, sans-serif';
    wrapText(ctx, title, 24, 104, 552, 26, 2);

    // Body
    const body = truncate(postBody, 200);
    if (body) {
      ctx.fillStyle = muted;
      ctx.font = '14px system-ui, -apple-system, sans-serif';
      wrapText(ctx, body, 24, 150, 552, 20, 3);
    }

    // Tags
    const tagArray = tags ? tags.split(',').map(t => t.trim()).filter(Boolean) : [];
    if (tagArray.length > 0) {
      let tagX = 24;
      const tagY = 230;
      for (const tag of tagArray.slice(0, 4)) {
        const tagLabel = '#' + tag;
        const tagW = ctx.measureText(tagLabel).width + 12;
        if (tagX + tagW > 576) break;
        roundRect(ctx, tagX, tagY - 1, tagW, 22, 6);
        ctx.fillStyle = isDark ? 'rgba(88,166,255,0.1)' : 'rgba(9,105,218,0.1)';
        ctx.fill();
        ctx.fillStyle = isDark ? '#58a6ff' : '#0969da';
        ctx.font = '13px system-ui, -apple-system, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(tagLabel, tagX + tagW / 2, tagY + 14);
        ctx.textAlign = 'left';
        tagX += tagW + 8;
      }
    }

    // Bottom bar
    ctx.strokeStyle = border;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(24, 262);
    ctx.lineTo(576, 262);
    ctx.stroke();

    // Brand logo + URL
    const logo = logoImgRef.current;
    if (logo && logo.complete && logo.naturalWidth > 0) {
      ctx.drawImage(logo, 24, 280, 20, 20);
    }
    ctx.fillStyle = muted;
    ctx.font = '600 13px system-ui, -apple-system, sans-serif';
    ctx.fillText('KumoCoders', 50, 296);

    ctx.fillStyle = muted;
    ctx.globalAlpha = 0.5;
    ctx.font = '12px system-ui, -apple-system, sans-serif';
    ctx.textAlign = 'right';
    ctx.fillText(url.replace(/^https?:\/\//, ''), 576, 296);
    ctx.textAlign = 'left';
    ctx.globalAlpha = 1;
  }

  function roundRect(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
  }

  function wrapText(ctx, text, x, y, maxWidth, lineHeight, maxLines) {
    const words = text.split(' ');
    let line = '';
    let lines = 0;
    for (const word of words) {
      const testLine = line + (line ? ' ' : '') + word;
      if (ctx.measureText(testLine).width > maxWidth && line) {
        ctx.fillText(line, x, y);
        lines++;
        if (lines >= maxLines) {
          ctx.fillText(line.slice(0, -1) + '…', x, y);
          return;
        }
        y += lineHeight;
        line = word;
      } else {
        line = testLine;
      }
    }
    if (line && lines < maxLines) {
      ctx.fillText(line, x, y);
    }
  }

  async function renderCard() {
    if (cardDataCache) return cardDataCache;
    await preloadAll();
    const canvas = canvasRef.current;
    if (!canvas) return null;
    drawCard(canvas);
    return new Promise((resolve) => {
      canvas.toBlob((blob) => {
        if (blob) cardBlobCache = blob;
        resolve(blob);
      }, 'image/png');
    });
  }

  async function preloadAvatar() {
    if (!authorAvatarUrl) return;
    return new Promise((resolve) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => { avatarImgRef.current = img; resolve(); };
      img.onerror = () => resolve();
      img.src = authorAvatarUrl;
    });
  }

  async function preloadLogo() {
    const logoUrl = isDark ? '/community/favicon-dark.svg' : '/community/favicon-light.svg';
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => { logoImgRef.current = img; resolve(); };
      img.onerror = () => resolve();
      img.src = logoUrl;
    });
  }

  async function preloadNerdFont() {
    if (nerdFontLoadedRef.current) return;
    try {
      const font = new FontFace('NerdFontsSymbols Nerd Font', NERD_FONT_URL);
      const loaded = await font.load();
      document.fonts.add(loaded);
      nerdFontLoadedRef.current = true;
    } catch {}
  }

  async function preloadAll() {
    await Promise.allSettled([preloadAvatar(), preloadLogo(), preloadNerdFont()]);
  }

  async function autoCapture() {
    cardBlobCache = null;
    cardDataCache = null;
    try {
      await preloadAll();
      await renderCard();
    } catch {}
  }

  function handleOpen(e) {
    e.stopPropagation();
    setOpen(true);
    setTimeout(autoCapture, 50);
  }

  async function copyWithImage() {
    setCapturing(true);
    try {
      const blob = cardBlobCache || await renderCard();
      if (blob) {
        try {
          await navigator.clipboard.write([
            new ClipboardItem({ 'image/png': blob }),
          ]);
        } catch {}
      }
      navigator.clipboard.writeText(fullText);
      showToast('Link + card image copied to clipboard!', 'success');
    } catch {
      navigator.clipboard.writeText(fullText).catch(() => {});
      showToast('Link copied!', 'success');
    } finally {
      setCapturing(false);
      setOpen(false);
    }
  }

  async function downloadImage() {
    setCapturing(true);
    try {
      const blob = cardBlobCache || await renderCard();
      if (!blob) throw new Error();
      try {
        await navigator.clipboard.write([
          new ClipboardItem({ 'image/png': blob }),
        ]);
        showToast('Card image copied to clipboard!', 'success');
      } catch {
        const link = document.createElement('a');
        link.download = `post-${postId}.png`;
        link.href = URL.createObjectURL(blob);
        link.click();
        URL.revokeObjectURL(link.href);
        showToast('Card image downloaded!', 'success');
      }
      setOpen(false);
    } catch {
      showToast('Could not capture card', 'error');
    } finally {
      setCapturing(false);
    }
  }

  const shareOptions = [
    {
      label: 'Copy Link + Image',
      icon: 'nf-fa-copy',
      action: copyWithImage,
    },
    {
      label: 'Download Card Image',
      icon: 'nf-fa-image',
      action: downloadImage,
    },
    {
      label: 'Twitter / X',
      icon: 'nf-dev-twitter',
      href: `https://twitter.com/intent/tweet?text=${encodedCard}&url=${encodedUrl}`,
    },
    {
      label: 'Facebook',
      icon: 'nf-fa-facebook_f',
      href: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
    },
    {
      label: 'Reddit',
      icon: 'nf-fa-reddit_alien',
      href: `https://reddit.com/submit?url=${encodedUrl}&title=${encodedCard}`,
    },
    {
      label: 'Email',
      icon: 'nf-fa-envelope',
      href: `mailto:?subject=${encodeURIComponent(postTitle || 'Check this out')}&body=${encodedFull}`,
    },
    {
      label: 'WhatsApp',
      icon: 'nf-fa-whatsapp',
      href: `https://wa.me/?text=${encodedFull}`,
    },
    {
      label: 'Instagram',
      icon: 'nf-fa-instagram',
      action: () => {
        navigator.clipboard.writeText(fullText).catch(() => {});
        showToast('Text copied! Paste in Instagram Stories or DM', 'success');
        setOpen(false);
      },
    },
  ];

  return (
    <>
      <button className={`community-btn community-btn--icon ${className || ''}`} onClick={handleOpen} aria-label="Share">
        <span className="nf nf-fa-share" />
      </button>

      {/* Hidden canvas for card rendering */}
      <canvas ref={canvasRef} style={{ position: 'fixed', left: -9999, top: 0 }} />

      {open && createPortal(
        <div className="community-modal-overlay" ref={overlayRef} onClick={handleOverlayClick}>
          <div className="community-modal" style={{ maxWidth: 380 }}>
            <div className="community-modal-header">
              <h3><span className="nf nf-fa-share" /> Share Post</h3>
              <button className="community-btn community-btn--icon" onClick={() => setOpen(false)} aria-label="Close">
                <span className="nf nf-fa-xmark" />
              </button>
            </div>
            <div className="community-modal-body">
              <div className="community-share-url">
                <input type="text" className="community-input" value={url} readOnly onClick={(e) => e.target.select()} />
              </div>
              <div className="community-share-options">
                {shareOptions.map((opt) => (
                  opt.href ? (
                    <a
                      key={opt.label}
                      href={opt.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="community-share-option"
                      onClick={() => setOpen(false)}
                    >
                      <span className={`nf ${opt.icon}`} />
                      <span>{opt.label}</span>
                      <span className="nf nf-fa-arrow_up_right_from_square community-share-option-ext" />
                    </a>
                  ) : (
                    <button key={opt.label} className="community-share-option" onClick={opt.action} disabled={capturing}>
                      <span className={`nf ${capturing ? 'nf-fa-spinner' : opt.icon}`} />
                      <span>{capturing ? 'Processing...' : opt.label}</span>
                    </button>
                  )
                ))}
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  );
}
