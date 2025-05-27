// src/theme/spacing.ts

const BASE_UNIT = 8; // Or 4, depending on your preferred scale

export const spacing = {
  none: 0,
  xxs: BASE_UNIT / 2,  // 4 (if BASE_UNIT is 8)
  xs: BASE_UNIT,       // 8
  s: BASE_UNIT * 1.5,  // 12
  m: BASE_UNIT * 2,    // 16
  l: BASE_UNIT * 3,    // 24
  xl: BASE_UNIT * 4,   // 32
  xxl: BASE_UNIT * 6,  // 48
  // You can also define specific use-case spacing
  paddingScreenHorizontal: BASE_UNIT * 2.5, // 20
  paddingScreenVertical: BASE_UNIT * 2,     // 16
  gutter: BASE_UNIT * 2,                    // 16 (space between items)
};

export type AppSpacing = keyof typeof spacing;