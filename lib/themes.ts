// Theme type definitions
export interface ThemeColor {
  h: number;
  s: number;
  l: number;
}

export interface ThemeConfig {
  mode: "light" | "dark" | "auto";
  color: ThemeColor;
  shape: number;
  pageColor?: ThemeColor | null;
  sideColor?: ThemeColor | null;
  appbarColor?: ThemeColor | null;
  wallpaper?: {
    enabled: boolean;
    url?: string;
    opacity?: number;
  };
  decoration?: {
    style:
      | "waves"
      | "zig-zag"
      | "polka-dot"
      | "stripes"
      | "lego"
      | "custom"
      | "none";
    size?: number;
    customUrl?: string;
  };
  darkenContent?: boolean;
}

export interface ThemeJSON {
  ptheme?: string;
  shape?: number | string;
  pagecolor?: string;
  sidecolor?: string;
  appbarcolor?: string;
  wallpaper?: string;
  "wallpaper-opacity"?: number | string;
  decoration?: string;
  "decoration-size"?: number | string;
  "darken-content"?: boolean | string;
  "custom-css"?: string;
}

// Default theme values
export const DEFAULT_THEME = {
  mode: "auto",
  color: { h: 207, s: 95, l: 55 },
  shape: 8,
  pageColor: { h: 0, s: 0, l: 7 },
  sideColor: {
    h: 207,
    s: 73,
    l: 30,
  },
  appbarColor: {
    h: 207,
    s: 73,
    l: 22,
  },
  wallpaper: {
    enabled: false,
    opacity: 0.5,
  },
  decoration: {
    style: "none",
    size: 1,
  },
  darkenContent: false,
};

/**
 * Parses a theme JSON object into a typed ThemeConfig
 * @param json - Raw theme JSON from storage
 * @returns Parsed and validated ThemeConfig object
 */
export function parseThemeJSON(json: ThemeJSON = {}): ThemeConfig {
  // Parse theme mode and color from ptheme string (format: "mode,h,s,l")
  const pthemeArray = (
    json.ptheme ||
    `${DEFAULT_THEME.mode},${DEFAULT_THEME.color.h},${DEFAULT_THEME.color.s},${DEFAULT_THEME.color.l}`
  ).split(",");
  const mode = pthemeArray[0] as "light" | "dark" | "auto";
  const color: ThemeColor = {
    h: parseFloat(pthemeArray[1]) || DEFAULT_THEME.color.h,
    s: parseFloat(pthemeArray[2]) || DEFAULT_THEME.color.s,
    l: parseFloat(pthemeArray[3]) || DEFAULT_THEME.color.l,
  };

  // Parse shape (border-radius)
  const shape =
    typeof json.shape === "number"
      ? json.shape
      : parseFloat(json.shape || String(DEFAULT_THEME.shape));

  // Parse custom colors (format: "true,h,s,l" or null)
  const parseCustomColor = (colorStr?: string): ThemeColor | null => {
    if (!colorStr?.startsWith("true")) return null;
    const parts = colorStr.replace("true,", "").split(",");
    return {
      h: parseFloat(parts[0]) || 0,
      s: parseFloat(parts[1]) || 0,
      l: parseFloat(parts[2]) || 0,
    };
  };

  const pageColor = parseCustomColor(json.pagecolor);
  const sideColor = parseCustomColor(json.sidecolor);
  const appbarColor = parseCustomColor(json.appbarcolor);

  // Parse wallpaper (format: "custom,url" or null)
  const wallpaper = json.wallpaper?.startsWith("custom")
    ? {
        enabled: true,
        url: json.wallpaper.replace("custom,", ""),
        opacity:
          typeof json["wallpaper-opacity"] === "number"
            ? json["wallpaper-opacity"]
            : parseFloat(
                json["wallpaper-opacity"] ||
                  String(DEFAULT_THEME.wallpaper?.opacity || 0.5)
              ),
      }
    : {
        enabled: false,
        opacity: DEFAULT_THEME.wallpaper?.opacity || 0.5,
      };

  // Parse decoration (format: "style,customUrl" or "style")
  const decorationParts = (
    json.decoration ||
    DEFAULT_THEME.decoration?.style ||
    "none"
  ).split(",");
  const decorationStyle = decorationParts[0] as
    | "waves"
    | "zig-zag"
    | "polka-dot"
    | "stripes"
    | "lego"
    | "custom"
    | "none";
  const decoration = {
    style: decorationStyle,
    size:
      typeof json["decoration-size"] === "number"
        ? json["decoration-size"]
        : parseFloat(
            json["decoration-size"] ||
              String(DEFAULT_THEME.decoration?.size || 1)
          ),
    ...(decorationParts.length > 1 && { customUrl: decorationParts[1] }),
  };

  // Parse darken content option
  const darkenContent =
    json["darken-content"] === true || json["darken-content"] === "true";

  return {
    mode,
    color,
    shape,
    pageColor,
    sideColor,
    appbarColor,
    wallpaper,
    decoration,
    darkenContent,
  };
}

/**
 * Converts a ThemeConfig back to JSON format for storage
 * @param config - ThemeConfig object
 * @returns JSON object for storage
 */
export function themeToJSON(config: ThemeConfig): ThemeJSON {
  const json: ThemeJSON = {
    ptheme: `${config.mode},${config.color.h},${config.color.s},${config.color.l}`,
    shape: config.shape,
  };

  if (config.pageColor) {
    json.pagecolor = `true,${config.pageColor.h},${config.pageColor.s},${config.pageColor.l}`;
  }

  if (config.sideColor) {
    json.sidecolor = `true,${config.sideColor.h},${config.sideColor.s},${config.sideColor.l}`;
  }

  if (config.appbarColor) {
    json.appbarcolor = `true,${config.appbarColor.h},${config.appbarColor.s},${config.appbarColor.l}`;
  }

  if (config.wallpaper?.enabled && config.wallpaper.url) {
    json.wallpaper = `custom,${config.wallpaper.url}`;
    json["wallpaper-opacity"] = config.wallpaper.opacity || 0.5;
  }

  if (config.decoration) {
    json.decoration = config.decoration.customUrl
      ? `${config.decoration.style},${config.decoration.customUrl}`
      : config.decoration.style;
    json["decoration-size"] = config.decoration.size || 1;
  }

  if (config.darkenContent) {
    json["darken-content"] = true;
  }

  return json;
}
