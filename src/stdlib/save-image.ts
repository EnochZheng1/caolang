/**
 * Browser side of 存图: show the canvas as an image in an overlay.
 * On phones people long-press to save or share (programmatic share/download
 * is blocked outside a direct tap); on desktop there's a download link.
 *
 * Self-contained, so `cao build --网页` can embed it with toString().
 */
export function showSavedImage(canvas: HTMLCanvasElement, filename: string): void {
  const url = canvas.toDataURL("image/png");
  const old = document.getElementById("cao-saved-image");
  if (old) old.remove();

  const overlay = document.createElement("div");
  overlay.id = "cao-saved-image";
  overlay.style.cssText =
    "position:fixed;inset:0;z-index:9999;background:rgba(0,0,0,.85);display:flex;flex-direction:column;" +
    "align-items:center;justify-content:center;gap:12px;padding:16px;box-sizing:border-box;";

  const img = document.createElement("img");
  img.src = url;
  img.alt = filename;
  img.style.cssText = "max-width:100%;max-height:75vh;border-radius:8px;box-shadow:0 0 24px rgba(255,82,82,.5);";

  const hint = document.createElement("div");
  hint.style.cssText = "color:#fff;font:14px/1.6 sans-serif;text-align:center;";
  hint.textContent = "📱 长按图片保存或分享";

  const actions = document.createElement("div");
  actions.style.cssText = "display:flex;gap:12px;";
  const button = (text: string) => {
    const el = document.createElement("a");
    el.textContent = text;
    el.style.cssText =
      "color:#fff;background:#e53935;padding:8px 18px;border-radius:6px;font:bold 14px sans-serif;" +
      "text-decoration:none;cursor:pointer;";
    return el;
  };
  const download = button("下载图片");
  download.href = url;
  download.download = filename;
  const close = button("关闭");
  close.style.background = "#555";
  close.addEventListener("click", () => overlay.remove());

  actions.append(download, close);
  overlay.append(img, hint, actions);
  overlay.addEventListener("click", (e) => {
    if (e.target === overlay) overlay.remove();
  });
  // Keep game keys (Space, arrows) from reaching the game while this is open
  overlay.addEventListener("keydown", (e) => e.stopPropagation());
  document.body.appendChild(overlay);
}
