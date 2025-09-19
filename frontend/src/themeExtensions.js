// Theme extensions for accessibility features
// This file extends the base theme with accessibility options while preserving custom colors

export const getAccessibilityTheme = (baseTheme, settings) => {
  const { fontSize, highContrast } = settings;
  
  // Font size multipliers
  const fontSizeMultipliers = {
    small: 0.875,
    medium: 1,
    large: 1.125,
    'extra-large': 1.25
  };
  
  const multiplier = fontSizeMultipliers[fontSize] || 1;
  
  // Create extended theme
  const extendedTheme = {
    ...baseTheme,
    typography: {
      ...baseTheme.typography,
      fontSize: baseTheme.typography.fontSize * multiplier,
      h1: { fontSize: 40 * multiplier },
      h2: { fontSize: 32 * multiplier },
      h3: { fontSize: 24 * multiplier },
      h4: { fontSize: 20 * multiplier },
      h5: { fontSize: 16 * multiplier },
      h6: { fontSize: 14 * multiplier },
    },
    components: {
      ...baseTheme.components,
      // Add accessibility-specific component overrides
      MuiButton: {
        styleOverrides: {
          root: {
            fontSize: `${12 * multiplier}px`,
            ...(highContrast && {
              borderWidth: '2px',
              fontWeight: 'bold',
            }),
          },
        },
      },
      MuiTypography: {
        styleOverrides: {
          root: {
            ...(highContrast && {
              fontWeight: 'bold',
            }),
          },
        },
      },
      MuiPaper: {
        styleOverrides: {
          root: {
            ...(highContrast && {
              border: '2px solid',
              borderColor: baseTheme.palette.primary.main,
            }),
          },
        },
      },
    },
  };


  // Apply high contrast adjustments
  if (highContrast) {
    extendedTheme.palette = {
      ...extendedTheme.palette,
      // Increase contrast ratios
      primary: {
        ...extendedTheme.palette.primary,
        main: extendedTheme.palette.mode === 'dark' ? '#FFFFFF' : '#000000',
        contrastText: extendedTheme.palette.mode === 'dark' ? '#000000' : '#FFFFFF',
      },
      secondary: {
        ...extendedTheme.palette.secondary,
        main: extendedTheme.palette.mode === 'dark' ? '#FFFF00' : '#0000FF',
        contrastText: extendedTheme.palette.mode === 'dark' ? '#000000' : '#FFFFFF',
      },
      background: {
        ...extendedTheme.palette.background,
        default: extendedTheme.palette.mode === 'dark' ? '#000000' : '#FFFFFF',
        paper: extendedTheme.palette.mode === 'dark' ? '#1A1A1A' : '#F5F5F5',
      },
    };
  }

  return extendedTheme;
};

// Helper function to apply accessibility settings to existing custom colors
export const applyAccessibilityToCustomColors = (customTokens, settings) => {
  const { highContrast } = settings;
  
  if (!highContrast) {
    return customTokens;
  }

  const adjustedTokens = { ...customTokens };

  if (highContrast) {
    // Adjust custom color tokens for high contrast
    Object.keys(adjustedTokens).forEach(colorKey => {
      if (typeof adjustedTokens[colorKey] === 'object') {
        adjustedTokens[colorKey] = {
          ...adjustedTokens[colorKey],
          // Make colors more extreme for high contrast
          500: adjustedTokens[colorKey][500] || adjustedTokens[colorKey].main,
          600: adjustedTokens[colorKey][600] || adjustedTokens[colorKey][500],
          700: adjustedTokens[colorKey][700] || adjustedTokens[colorKey][600],
        };
      }
    });
  }


  return adjustedTokens;
};
