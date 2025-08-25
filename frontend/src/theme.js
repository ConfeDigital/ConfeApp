import { createContext, useState, useMemo, useEffect } from "react";
import { createTheme } from "@mui/material/styles";
import useMediaQuery from "@mui/material/useMediaQuery";
import { esES as dataGridEsEs } from '@mui/x-data-grid/locales';
import { esES as coreEsES } from '@mui/material/locale';
import { esES } from '@mui/x-date-pickers/locales';
import { THEME_MODE } from './constants'

// color design tokens export
export const tokens = (mode) => ({
    ...(mode === "dark"
      ? {
          grey: {
            100: "#e0e0e0",
            200: "#c2c2c2",
            300: "#a3a3a3",
            400: "#858585",
            500: "#666666",
            600: "#525252",
            700: "#3d3d3d",
            800: "#292929",
            900: "#141414",
          },
          primary: {
            100: "#cfdae6",
            200: "#a0b4cd",
            300: "#708fb3",
            400: "#41699a",
            500: "#114481",
            600: "#0e3667",
            700: "#0a294d",
            800: "#071b34",
            900: "#030e1a",
          },
          primaryBackground: {
            100: "#d0d1d5",
            200: "#a1a4ab",
            300: "#727681",
            400: "#1F2A40", // manually changed
            500: "#141b2d",
            600: "#101624",
            700: "#0c101b",
            800: "#080b12",
            900: "#040509",
          },
          greenAccent: {
            100: "#dbf5ee",
            200: "#b7ebde",
            300: "#94e2cd",
            400: "#70d8bd",
            500: "#4cceac",
            600: "#3da58a",
            700: "#2e7c67",
            800: "#1e5245",
            900: "#0f2922",
          },
          redAccent: {
            100: "#f8dcdb",
            200: "#f1b9b7",
            300: "#e99592",
            400: "#e2726e",
            500: "#db4f4a",
            600: "#af3f3b",
            700: "#832f2c",
            800: "#58201e",
            900: "#2c100f",
          },
          blueAccent: {
            100: "#e1e2fe",
            200: "#c3c6fd",
            300: "#a4a9fc",
            400: "#868dfb",
            500: "#6870fa",
            600: "#535ac8",
            700: "#3e4396",
            800: "#2a2d64",
            900: "#151632",
          },
          gold: {
            100: "#fdecdf",
            200: "#fbdac0",
            300: "#f8c7a0",
            400: "#f6b581",
            500: "#f4a261",
            600: "#c3824e",
            700: "#92613a",
            800: "#624127",
            900: "#312013",
          },
          blueGreen: {
            100: "#d4ebe9",
            200: "#aad8d2",
            300: "#7fc4bc",
            400: "#55b1a5",
            500: "#2a9d8f",
            600: "#227e72",
            700: "#195e56",
            800: "#113f39",
            900: "#081f1d",
          },
          blueGreenCEIL: {
            100: "#cce4e7",
            200: "#99c9cf",
            300: "#66afb7",
            400: "#33949f",
            500: "#007987",
            600: "#00616c",
            700: "#004951",
            800: "#003036",
            900: "#00181b"
          },
          lightGreen: {
            100: "#fafffa",
            200: "#f5fff5",
            300: "#f0fff0",
            400: "#ebffeb",
            500: "#e6ffe6",
            600: "#b8ccb8",
            700: "#8a998a",
            800: "#5c665c",
            900: "#2e332e"
          },
          lightBlue: {
            100: "#f1f8fe",
            200: "#e4f2fd",
            300: "#d6ebfd",
            400: "#c9e5fc",
            500: "#bbdefb",
            600: "#96b2c9",
            700: "#708597",
            800: "#4b5964",
            900: "#252c32",
          }
        }
      : {
          grey: {
            100: "#141414",
            200: "#292929",
            300: "#3d3d3d",
            400: "#525252",
            500: "#666666",
            600: "#858585",
            700: "#a3a3a3",
            800: "#c2c2c2",
            900: "#e0e0e0",
          },
          primary: {
            100: "#030e1a",
            200: "#071b34",
            300: "#0a294d",
            400: "#0e3667",
            500: "#114481",
            600: "#41699a",
            700: "#708fb3",
            800: "#a0b4cd",
            900: "#cfdae6",
          },
          primaryBackground: {
            100: "#616060",
            200: "#919090",
            300: "#c2c0c0",
            400: "#f2f0f0",
            500: "#f4f4f3",
            600: "#f5f3f3",
            700: "#f7f6f6",
            800: "#faf9f9",
            900: "#fcfcfc",
          },
          greenAccent: {
            100: "#0f2922",
            200: "#1e5245",
            300: "#2e7c67",
            400: "#3da58a",
            500: "#4cceac",
            600: "#70d8bd",
            700: "#94e2cd",
            800: "#b7ebde",
            900: "#dbf5ee",
          },
          redAccent: {
            100: "#2c100f",
            200: "#58201e",
            300: "#832f2c",
            400: "#af3f3b",
            500: "#db4f4a",
            600: "#e2726e",
            700: "#e99592",
            800: "#f1b9b7",
            900: "#f8dcdb",
          },
          blueAccent: {
            100: "#151632",
            200: "#2a2d64",
            300: "#3e4396",
            400: "#535ac8",
            500: "#6870fa",
            600: "#868dfb",
            700: "#a4a9fc",
            800: "#c3c6fd",
            900: "#e1e2fe",
          },
          gold: {
            100: "#312013",
            200: "#624127",
            300: "#92613a",
            400: "#c3824e",
            500: "#f4a261",
            600: "#f6b581",
            700: "#f8c7a0",
            800: "#fbdac0",
            900: "#fdecdf",
          },
          blueGreen: {
            100: "#081f1d",
            200: "#113f39",
            300: "#195e56",
            400: "#227e72",
            500: "#2a9d8f",
            600: "#55b1a5",
            700: "#7fc4bc",
            800: "#aad8d2",
            900: "#d4ebe9",
          },
          blueGreenCEIL: {
            100: "#00181b",
            200: "#003036",
            300: "#004951",
            400: "#00616c",
            500: "#007987",
            600: "#33949f",
            700: "#66afb7",
            800: "#99c9cf",
            900: "#cce4e7",
          },
          lightGreen: {
            100: "#2e332e",
            200: "#5c665c",
            300: "#8a998a",
            400: "#b8ccb8",
            500: "#e6ffe6",
            600: "#ebffeb",
            700: "#f0fff0",
            800: "#f5fff5",
            900: "#fafffa",
          },
          lightBlue: {
            100: "#252c32",
            200: "#4b5964",
            300: "#708597",
            400: "#96b2c9",
            500: "#bbdefb",
            600: "#c9e5fc",
            700: "#d6ebfd",
            800: "#e4f2fd",
            900: "#f1f8fe",
          }
        }),
  });

  // mui theme settings
export const themeSettings = (mode) => {
    const colors = tokens(mode);
    return {
      palette: {
        mode: mode,
        ...(mode === "dark"
          ? { // palette values for dark mode
              primary: {
                main: colors.primary[400],
              },
              secondary: {
                main: colors.blueGreenCEIL[400],
                light: colors.blueGreenCEIL[300],
              },
              neutral: {
                dark: colors.grey[700],
                main: colors.grey[500],
                light: colors.grey[100],
              },
              background: {
                default: colors.primaryBackground[600],
                paper: colors.primaryBackground[500],
              },
            }
          : { // palette values for light mode
              primary: {
                main: colors.primary[500],
              },
              secondary: {
                main: colors.blueGreenCEIL[500],
              },
              neutral: {
                dark: colors.grey[900],
                main: colors.grey[500],
                light: colors.grey[100],
              },
              background: {
                default: colors.primaryBackground[700],
                paper: colors.primaryBackground[900],
              },
            }),
      },
      typography: {
        fontFamily: ["Montserrat", "sans-serif"].join(","),
        fontSize: 12,
        h1: { fontSize: 40 },
        h2: { fontSize: 32 },
        h3: { fontSize: 24 },
        h4: { fontSize: 20 },
        h5: { fontSize: 16 },
        h6: { fontSize: 14 },
      },
      cssVariables: true,
      customTokens: colors,
      components: {
        MuiDataGrid: {
          defaultProps: {
            localeText: dataGridEsEs.components.MuiDataGrid.defaultProps.localeText,
          },
        },
      },
      esES,
      coreEsES,
    };
  };

  export const ColorModeContext = createContext({
    cycleColorMode: () => {},
    mode: "system",           // the logical mode
    resolvedMode: "light",    // the actual MUI palette.mode
  });
  
  export const useMode = () => {
    // 1. Read last‐saved or default to "system"
    const [mode, setMode] = useState(
      () => localStorage.getItem(THEME_MODE) || "system"
    );
  
    // 2. Watch system preference
    const prefersDark = useMediaQuery("(prefers-color-scheme: dark)");
    const resolvedMode = mode === "system" ? (prefersDark ? "dark" : "light") : mode;
  
    // 3. Whenever mode changes, persist it
    useEffect(() => {
      localStorage.setItem(THEME_MODE, mode);
    }, [mode]);
  
    // 4. Build theme off the _resolved_ mode
    const theme = useMemo(
      () => createTheme(themeSettings(resolvedMode)),
      [resolvedMode]
    );
  
    // 5. Expose a cycle function
    const cycleColorMode = useMemo(() => {
      const order = ["light", "dark", "system"];
      return () => {
        setMode(prev => {
          const next = order[(order.indexOf(prev) + 1) % order.length];
          return next;
        });
      };
    }, []);
  
    return [{ theme, mode, resolvedMode }, { cycleColorMode }];
  };