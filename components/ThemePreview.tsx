import dynamic from "next/dynamic";
import React, { useRef, useEffect, useState, ReactElement } from "react";

// === TYPES ===
interface StyleProps {
  pageColor?: string;
  wallpaperUrl?: string;
  wallpaperOpacity?: number;
  appbarColor?: string;
  menubarColor?: string;
  accentColor?: [number, number, number]; // H, S, L
  decoration?: string;
  decorationUrl?: string;
  colorScheme?: "light" | "dark" | "auto";
  shape?: number;
}

interface CanvasPreviewProps {
  style?: StyleProps;
  scale?: number;
}

// === HOOK: Detect preferred color scheme ===
function usePreferredColorScheme(): "light" | "dark" {
  const getScheme = (): "light" | "dark" =>
    window.matchMedia("(prefers-color-scheme: dark)").matches
      ? "dark"
      : "light";
  const [scheme, setScheme] = useState<"light" | "dark">(getScheme);

  useEffect(() => {
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const listener = (e: MediaQueryListEvent) =>
      setScheme(e.matches ? "dark" : "light");
    media.addEventListener("change", listener);
    return () => media.removeEventListener("change", listener);
  }, []);

  return scheme;
}

// === HELPER: Typed throttle ===
function throttle<T extends (...args: Parameters<T>) => void>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let lastArgs: Parameters<T> | null = null;
  let flag = false;

  return function throttledFunction(
    this: ThisParameterType<T>,
    ...args: Parameters<T>
  ): void {
    if (!flag) {
      func.apply(this, args);
      flag = true;
      setTimeout(() => {
        flag = false;
        if (lastArgs) {
          func.apply(this, lastArgs);
          lastArgs = null;
        }
      }, wait);
    } else {
      lastArgs = args;
    }
  };
}

// === MAIN COMPONENT ===
export default dynamic(() => Promise.resolve(ThemePreview), {
  ssr: false,
});
function ThemePreview({
  style = {},
  scale = 1,
}: CanvasPreviewProps): ReactElement {
  const wrapper = useRef<HTMLDivElement | null>(null);
  const canvas = useRef<HTMLCanvasElement | null>(null);
  const preferredColor = usePreferredColorScheme();

  // === COLOR UTILS ===
  function lightDark(lightColor: string, darkColor: string): string {
    switch (style.colorScheme) {
      case "dark":
        return darkColor;
      case "light":
        return lightColor;
      default:
        return preferredColor === "dark" ? darkColor : lightColor;
    }
  }

  function shiftedHslColor(
    wishH: number,
    wishS: number,
    wishL: number,
    defaultS: number,
    defaultL: number
  ): string {
    return `hsl(${wishH}, ${normaliseColorComponent(
      wishS,
      defaultS,
      95
    )}%, ${normaliseColorComponent(wishL, defaultL, 55)}%)`;
  }

  function normaliseColorComponent(x: number, a: number, b: number): number {
    return x <= b ? (x / b) * a : a + ((x - b) / (100 - b)) * (100 - a);
  }

  async function getDecoration(decorationName: string): Promise<string> {
    if (decorationName.startsWith("http") || decorationName.startsWith("https"))
      return decorationName;
    if (decorationName.startsWith("none,")) {
      return decorationName.split(",")[1];
    }
    return `/decorations/${decorationName}.png`;
  }

  // === DRAW FUNCTION ===
  const drawCanvas = throttle(async (): Promise<void> => {
    const canvasEl = canvas.current;
    const wrapperEl = wrapper.current;
    if (!canvasEl || !wrapperEl) return;

    const ctx = canvasEl.getContext("2d");
    if (!ctx) return;

    ctx.canvas.width = wrapperEl.clientWidth;
    ctx.canvas.height = wrapperEl.clientHeight;
    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);

    const canvasWidth = ctx.canvas.width;
    const canvasHeight = ctx.canvas.height;

    const textThickness = 0.03 * scale * canvasWidth;
    const appbarWidth = 0.045 * scale * canvasWidth;
    const menubarWidth = 0.195 * scale * canvasWidth;
    const textMarginTop = 0.045 * scale * canvasWidth;
    const textMarginLeft = 0.03 * scale * canvasWidth;
    const sidebarWidth = 0.285 * scale * canvasWidth;
    const widgetHeight = 0.105 * scale * canvasWidth;
    const widgetGap = 0.015 * scale * canvasWidth;
    const widgetMarginTop = 0.03 * scale * canvasWidth;
    const widgetMarginLeft = 0.025 * scale * canvasWidth;
    const widgetMarginRight = 0.03 * scale * canvasWidth;
    const borderThickness = 0.004 * scale * canvasWidth;

    // Background
    ctx.fillStyle = style.pageColor ?? lightDark("#ffffff", "#111111");
    ctx.fillRect(0, 0, canvasWidth, canvasHeight);

    // Wallpaper
    if (style.wallpaperUrl) {
      const img = new Image();
      img.src = style.wallpaperUrl;
      await img.decode();
      const canvasRatio = canvasWidth / canvasHeight;
      const imgRatio = img.width / img.height;
      let drawWidth: number,
        drawHeight: number,
        offsetX: number,
        offsetY: number;

      if (canvasRatio > imgRatio) {
        drawWidth = canvasWidth;
        drawHeight = drawWidth / imgRatio;
        offsetX = 0;
        offsetY = (canvasHeight - drawHeight) / 2;
      } else {
        drawHeight = canvasHeight;
        drawWidth = drawHeight * imgRatio;
        offsetX = (canvasWidth - drawWidth) / 2;
        offsetY = 0;
      }

      ctx.globalAlpha = style.wallpaperOpacity ?? 0.2;
      ctx.drawImage(img, offsetX, offsetY, drawWidth, drawHeight);
      ctx.globalAlpha = 1;
    }

    // Appbar
    ctx.fillStyle =
      style.appbarColor ??
      lightDark(
        shiftedHslColor(...(style.accentColor ?? [210, 70, 50]), 95, 47),
        shiftedHslColor(...(style.accentColor ?? [210, 70, 50]), 73, 22)
      );
    ctx.fillRect(0, 0, appbarWidth, canvasHeight);

    // Menubar background
    ctx.fillStyle =
      style.menubarColor ??
      lightDark(
        shiftedHslColor(...(style.accentColor ?? [210, 70, 50]), 95, 55),
        shiftedHslColor(...(style.accentColor ?? [210, 70, 50]), 73, 30)
      );
    ctx.fillRect(appbarWidth, 0, menubarWidth, canvasHeight);

    // Decoration
    if (style.decoration) {
      const img = new Image();
      img.src =
        style.decoration === "custom"
          ? (style.decorationUrl ?? "")
          : await getDecoration(style.decoration);
      await img.decode();

      const targetWidth = menubarWidth;
      const targetX = appbarWidth;
      const imgRatio = img.width / img.height;
      const targetRatio = targetWidth / canvasHeight;

      let drawWidth: number,
        drawHeight: number,
        offsetX: number,
        offsetY: number;
      if (targetRatio > imgRatio) {
        drawWidth = targetWidth;
        drawHeight = drawWidth / imgRatio;
        offsetX = targetX;
        offsetY = -(drawHeight - canvasHeight) / 2;
      } else {
        drawHeight = canvasHeight;
        drawWidth = drawHeight * imgRatio;
        offsetX = targetX - (drawWidth - targetWidth) / 2;
        offsetY = 0;
      }

      ctx.save();
      ctx.beginPath();
      ctx.rect(targetX, 0, targetWidth, canvasHeight);
      ctx.clip();
      if (style.decoration !== "custom")
        ctx.globalCompositeOperation = "lighter";
      ctx.drawImage(img, offsetX, offsetY, drawWidth, drawHeight);
      ctx.globalCompositeOperation = "source-over";
      ctx.restore();
    }

    // Menubar title
    ctx.fillStyle = "#fff";
    ctx.globalAlpha = 0.6;
    roundRect(
      ctx,
      appbarWidth + textMarginLeft,
      textMarginTop,
      menubarWidth * 0.65,
      textThickness,
      textThickness / 2
    );
    ctx.fill();
    ctx.globalAlpha = 1;

    // Page title
    ctx.fillStyle = lightDark(
      shiftedHslColor(...(style.accentColor ?? [210, 70, 50]), 78, 43),
      shiftedHslColor(...(style.accentColor ?? [210, 70, 50]), 53, 55)
    );
    roundRect(
      ctx,
      appbarWidth + menubarWidth + textMarginLeft,
      textMarginTop,
      menubarWidth,
      textThickness,
      textThickness / 2
    );
    ctx.fill();

    // Sidebar
    ctx.fillStyle = lightDark("#ffffffaa", "#0c0c0caa");
    ctx.fillRect(canvasWidth - sidebarWidth, 0, sidebarWidth, canvasHeight);
    ctx.strokeStyle = lightDark("#dfdfdfaa", "#2e2e2eaa");
    ctx.lineWidth = borderThickness;
    ctx.beginPath();
    ctx.moveTo(canvasWidth - sidebarWidth, 0);
    ctx.lineTo(canvasWidth - sidebarWidth, canvasHeight);
    ctx.stroke();

    // Widgets
    ctx.beginPath();
    roundRect(
      ctx,
      canvasWidth - sidebarWidth + widgetMarginLeft,
      widgetMarginTop + 1.5 * widgetHeight + widgetGap,
      sidebarWidth - widgetMarginLeft - widgetMarginRight,
      widgetHeight,
      (style.shape ?? 10) / 2.5
    );
    roundRect(
      ctx,
      canvasWidth - sidebarWidth + widgetMarginLeft,
      widgetMarginTop + 2.5 * widgetHeight + 2 * widgetGap,
      sidebarWidth - widgetMarginLeft - widgetMarginRight,
      widgetHeight,
      (style.shape ?? 10) / 2.5
    );
    ctx.fill();
    ctx.stroke();

    // Gradient widget
    const gradient = ctx.createLinearGradient(
      canvasWidth - sidebarWidth + widgetMarginLeft,
      widgetMarginTop,
      canvasWidth -
        sidebarWidth +
        widgetMarginLeft +
        sidebarWidth -
        widgetMarginLeft -
        widgetMarginRight,
      widgetMarginTop + widgetHeight * 1.5
    );

    gradient.addColorStop(
      0,
      lightDark(
        shiftedHslColor(...(style.accentColor ?? [210, 70, 50]), 95, 55),
        shiftedHslColor(...(style.accentColor ?? [210, 70, 50]), 73, 30)
      )
    );
    gradient.addColorStop(
      1,
      lightDark(
        shiftedHslColor(...(style.accentColor ?? [210, 70, 50]), 95, 47),
        shiftedHslColor(...(style.accentColor ?? [210, 70, 50]), 73, 22)
      )
    );

    ctx.fillStyle = gradient;
    roundRect(
      ctx,
      canvasWidth - sidebarWidth + widgetMarginLeft,
      widgetMarginTop,
      sidebarWidth - widgetMarginLeft - widgetMarginRight,
      widgetHeight * 1.5,
      (style.shape ?? 10) / 2.5
    );
    ctx.fill();
    ctx.stroke();
  }, 200);

  // === EFFECTS ===
  useEffect(() => {
    drawCanvas();
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const listener = (): void => drawCanvas();
    media.addEventListener("change", listener);
    return () => media.removeEventListener("change", listener);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [style, scale, preferredColor]);

  return (
    <div ref={wrapper} className="w-full h-full overflow-hidden">
      <canvas ref={canvas} width={300} height={150} />
    </div>
  );
}

// === ROUND RECT HELPER ===
function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
): void {
  const radius = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + w - radius, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + radius);
  ctx.lineTo(x + w, y + h - radius);
  ctx.quadraticCurveTo(x + w, y + h, x + w - radius, y + h);
  ctx.lineTo(x + radius, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.closePath();
}
