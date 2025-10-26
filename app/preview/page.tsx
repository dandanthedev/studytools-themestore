"use client";

import {
  DEFAULT_THEME,
  parseThemeJSON,
  ThemeConfig,
  ThemeJSON,
} from "@/lib/themes";
import { useEffect, useState } from "react";
function hslToStyle(hsl: { h: number; s: number; l: number }) {
  const h = hsl.h / 360;
  const s = hsl.s / 100;
  const l = hsl.l / 100;
  return `hsl(${h}, ${s * 100}%, ${l * 100}%)`;
}
export default function ThemePreview() {
  const [style, setStyle] = useState<ThemeJSON>();
  const [parsed, setParsed] = useState<ThemeConfig>();
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data?.style) {
        console.log("Received style:", event.data.style);
        setStyle(event.data.style);
      }
    };

    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, []);

  useEffect(() => {
    if (style) {
      setParsed(parseThemeJSON(style));
    }
  }, [style]);

  if (!style) return null;
  if (!parsed) return null;

  const extraStyles = `
          .logo{
          background-image: var(--mg-logo-expanded);
          background-size: contain;
          background-repeat: no-repeat;
          background-position: center;
          }
          #st-widget-homework{
          background-color: var(--st-background-secondary);
          }
            `;

  return (
    <>
      <style>{style["custom-css"] || ""}</style>
      <style>{extraStyles}</style>
      <div
        className={`w-full h-full flex gap-2 p-3`}
        style={{
          backgroundColor: hslToStyle(
            parsed.pageColor || DEFAULT_THEME.pageColor
          ),
          backgroundImage:
            (parsed.wallpaper?.enabled && `url(${parsed.wallpaper.url})`) ||
            undefined,
          backgroundSize: "cover",
          backgroundRepeat: "no-repeat",
          backgroundPosition: "center",
        }}
      >
        <div
          className="w-1/5 bg-blue-900 rounded flex flex-col p-1 gap-3 menu-host"
          style={{
            backgroundColor: hslToStyle(
              parsed.sideColor || DEFAULT_THEME.sideColor
            ),
            backgroundImage:
              (parsed.decoration?.customUrl &&
                `url(${parsed.decoration.customUrl})`) ||
              undefined,
            backgroundSize: "cover",
            backgroundRepeat: "no-repeat",
            backgroundPosition: "center",
          }}
        >
          <div className="h-3 bg-blue-600 rounded logo mt-1 "></div>
        </div>

        <div className="flex-1 flex flex-col gap-2">
          <div
            className="h-6 bg-blue-600 rounded"
            id="st-start-header-strip"
            style={{
              backgroundColor: parsed.sideColor
                ? hslToStyle(parsed.sideColor)
                : undefined,
            }}
          ></div>
          <div className="flex-1 bg-zinc-950 rounded"></div>
        </div>

        <div className="w-1/4 flex flex-col gap-2">
          <div
            className="flex-1 bg-blue-900 rounded"
            style={{
              backgroundColor: parsed.appbarColor
                ? hslToStyle(parsed.appbarColor)
                : undefined,
              backgroundImage:
                (parsed.decoration?.customUrl &&
                  `url(${parsed.decoration.customUrl})`) ||
                undefined,
              backgroundSize: "cover",
              backgroundRepeat: "no-repeat",
              backgroundPosition: "center",
            }}
          ></div>
          <div
            className="flex-1 border-2 border-black rounded"
            id="st-widget-homework"
          ></div>
        </div>
      </div>
    </>
  );
}
