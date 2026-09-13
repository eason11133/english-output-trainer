/** Build 2 canonical wood/paper family. Reading remains on light paper. */
export const EOTWood = {
  color: {
    canvas: '#F5EFE5', canvasRaised: '#FBF7F0', card: '#FFFDFC', cardMuted: '#F0E7DA',
    ink: '#2D241F', inkSoft: '#5E5148', inkMuted: '#8A7B70',
    walnut900: '#3A251B', walnut800: '#4A3023', walnut700: '#5B3C2C',
    walnut600: '#704B36', walnut500: '#8A6147', caramel600: '#A56E3A',
    caramel500: '#BC814A', amber400: '#D9A568', amber300: '#E8C08A',
    sand300: '#D8C8B5', sand200: '#E7DCCE', sand100: '#F2EADF',
    success: '#627A59', warning: '#A06B33', danger: '#A8584F',
    overlay: 'rgba(45,36,31,0.68)', spotlight: '#D9A568',
    border: 'rgba(91,60,44,0.14)', borderStrong: 'rgba(91,60,44,0.24)',
  },
  radius: { sm: 10, md: 16, lg: 22, xl: 28 },
  motion: { quick: 160, normal: 240, emphasis: 360 },
} as const;
