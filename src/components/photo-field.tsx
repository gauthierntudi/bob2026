"use client";

import { useId, useState } from "react";
import Cropper, { type Area } from "react-easy-crop";

async function cropToFile(src: string, area: Area) {
  const image = await new Promise<HTMLImageElement>((resolve, reject) => {
    const element = new Image();
    element.onload = () => resolve(element);
    element.onerror = () => reject(new Error("Image illisible."));
    element.src = src;
  });
  const longest = 900;
  const scale = Math.min(1, longest / Math.max(area.width, area.height));
  const width = Math.max(1, Math.round(area.width * scale));
  const height = Math.max(1, Math.round(area.height * scale));
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("Recadrage impossible.");
  context.drawImage(image, area.x, area.y, area.width, area.height, 0, 0, width, height);
  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/jpeg", 0.9));
  if (!blob) throw new Error("Recadrage impossible.");
  return new File([blob], "photo.jpg", { type: "image/jpeg" });
}

export function PhotoField({ initialUrl, compact = false }: { initialUrl?: string | null; compact?: boolean }) {
  const [source, setSource] = useState<string | null>(null);
  const [preview, setPreview] = useState<string | null>(initialUrl ?? null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [area, setArea] = useState<Area | null>(null);
  const [fileName, setFileName] = useState("");
  const inputId = useId();

  function onPick(file: File | undefined) {
    if (!file) return;
    setCrop({ x: 0, y: 0 });
    setZoom(1);
    setSource(URL.createObjectURL(file));
  }

  async function confirmCrop() {
    if (!source || !area) return;
    const file = await cropToFile(source, area);
    const input = document.getElementById(inputId) as HTMLInputElement | null;
    if (input) {
      const list = new DataTransfer();
      list.items.add(file);
      input.files = list.files;
    }
    setPreview(URL.createObjectURL(file));
    setFileName("Photo recadrée");
    URL.revokeObjectURL(source);
    setSource(null);
  }

  return (
    <div className={compact ? "photo-field compact" : "photo-field"}>
      {compact ? (
        <label className="file-pick photo-hit" aria-label="Choisir une photo">
          {preview ? <img className="photo-preview" src={preview} alt="" /> : <span className="photo-preview empty" />}
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            onChange={(event) => onPick(event.target.files?.[0])}
          />
        </label>
      ) : (
        <>
          {preview ? <img className="photo-preview" src={preview} alt="" /> : <span className="photo-preview empty" />}
          <label className="ghost file-pick">
            Choisir une photo
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              onChange={(event) => onPick(event.target.files?.[0])}
            />
          </label>
        </>
      )}
      <input id={inputId} type="file" name="photo" hidden />
      {fileName ? <span className="sub">{fileName}</span> : null}
      {source ? (
        <div className="crop-layer" role="dialog" aria-label="Recadrer la photo">
          <div className="crop-stage">
            <Cropper
              image={source}
              crop={crop}
              zoom={zoom}
              aspect={1}
              onCropChange={setCrop}
              onZoomChange={setZoom}
              onCropComplete={(_, pixels) => setArea(pixels)}
            />
          </div>
          <label className="zoom">
            Zoom
            <input
              type="range"
              min={1}
              max={3}
              step={0.01}
              value={zoom}
              onChange={(event) => setZoom(Number(event.target.value))}
            />
          </label>
          <div className="crop-actions">
            <button
              className="ghost"
              type="button"
              onClick={() => {
                URL.revokeObjectURL(source);
                setSource(null);
              }}
            >
              Annuler
            </button>
            <button className="action" type="button" onClick={confirmCrop}>
              Recadrer
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
