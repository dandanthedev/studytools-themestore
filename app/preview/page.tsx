"use client";

import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import {
  DEFAULT_THEME,
  parseThemeJSON,
  ThemeConfig,
  ThemeJSON,
} from "@/lib/themes";
import { useAuthToken } from "@convex-dev/auth/react";
import { useQuery } from "convex/react";
import Image from "next/image";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
function hslToStyle(hsl: { h: number; s: number; l: number }) {
  const h = hsl.h / 360;
  const s = hsl.s / 100;
  const l = hsl.l / 100;
  return `hsl(${h}, ${s * 100}%, ${l * 100}%)`;
}

function Loading() {
  return (
    <div className="flex flex-col items-center justify-center h-screen w-screen">
      <Image
        src="https://raw.githubusercontent.com/QkeleQ10/http-resources/main/study-tools/load-animation.svg"
        alt="loading animation"
        unoptimized
        priority
        width={50}
        height={50}
      />
    </div>
  );
}

export default function ThemePreviewWrapper() {
  return (
    <Suspense fallback={<Loading />}>
      <ThemePreview />
    </Suspense>
  );
}

function ThemePreview() {
  const token = useAuthToken();

  const [parsed, setParsed] = useState<ThemeConfig>();
  const params = useSearchParams();
  const id = params.get("id");
  const [style, setStyle] = useState<ThemeJSON>();

  useEffect(() => {
    if (id) {
      //todo: this still opens convex websocket
      fetch(`${process.env.NEXT_PUBLIC_CONVEX_SITE_URL}/previewData?id=${id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
        .then((res) => res.json())
        .then((data) => {
          setStyle(data);
        });
    }
  }, [id, token]);

  useEffect(() => {
    if (style) {
      setParsed(parseThemeJSON(style));
    }
  }, [style]);

  if (!style) return <Loading />;
  if (!parsed) return <Loading />;

  const extraStyles = `
          .logo{
          background-image: var(--mg-logo-expanded);
          background-size: contain;
          background-repeat: no-repeat;
          background-position: center;
          }
          #st-widget-homework{
          background-color: var(--st-background-secondary);
          color: var(--st-foreground-primary);
          }
            `;

  return (
    <>
      <style>
        {(style["custom-css"] || "") + (style["custom-css2"] || "")}
      </style>
      <style>{extraStyles}</style>
      <div
        className={`w-screen h-screen flex gap-2 p-3`}
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
              backgroundColor: parsed.color
                ? hslToStyle(parsed.color)
                : undefined,
            }}
          ></div>
          <table className="flex-1 bg-zinc-950 rounded k-grid-content"></table>
        </div>

        <div className="w-1/4 flex flex-col gap-2">
          <div
            className="flex-1 bg-blue-900 rounded"
            style={{
              backgroundColor: parsed.color
                ? hslToStyle(parsed.color)
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
