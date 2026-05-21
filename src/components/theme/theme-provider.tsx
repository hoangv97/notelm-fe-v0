"use client";

import {
  createTheme,
  type Shadows,
  ThemeProvider as MuiThemeProvider,
} from "@mui/material/styles";
import { useMemo, PropsWithChildren } from "react";
import StyledJsxRegistry from "./registry";

declare module "@mui/material/styles" {
  interface Theme {
    effects: {
      shadows: {
        enabled: boolean;
      };
    };
  }

  interface ThemeOptions {
    effects?: {
      shadows?: {
        enabled?: boolean;
      };
    };
  }
}

const shadows = Array(25).fill("none") as Shadows;

function ThemeProvider(props: PropsWithChildren) {
  const theme = useMemo(
    () =>
      createTheme({
        cssVariables: {
          colorSchemeSelector: "class",
        },
        colorSchemes: { light: true, dark: true },
        palette: {
          primary: {
            main: "#9667ff",
            contrastText: "#f2f1f8",
          },
          secondary: {
            main: "#00bec3",
            contrastText: "#d4fbfb",
          },
          success: {
            main: "#00a267",
            contrastText: "#e1f9ec",
          },
          warning: {
            main: "#de9f00",
            contrastText: "#231903",
          },
          error: {
            main: "#fc4f4e",
            contrastText: "#ffebe8",
          },
          info: {
            main: "#0094ce",
            contrastText: "#def6ff",
          },
          background: {
            default: "#eeeeff",
            paper: "#e4e5ff",
          },
          text: {
            primary: "#0f101f",
            secondary: "#3a3c4a",
          },
          divider: "#d5d5eb",
          mode: "light",
        },
        spacing: 8,
        shape: {
          borderRadius: 12,
        },
        effects: {
          shadows: {
            enabled: false,
          },
        },
        shadows,
      }),
    []
  );

  return (
    <StyledJsxRegistry>
      <MuiThemeProvider theme={theme}>{props.children}</MuiThemeProvider>
    </StyledJsxRegistry>
  );
}

export default ThemeProvider;
