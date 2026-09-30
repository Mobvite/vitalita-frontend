import {definePreset} from "@primeuix/themes";
import Material from "@primeuix/themes/material";

/**
 * Vitalita theme based on PrimeVue Material.
 * We only change the primary palette to teal, so every PrimeVue component
 * follows the colors defined in the Style Guidelines.
 */
const VitalitaTheme = definePreset(Material, {
    semantic: {
        primary: {
            50: '#ecfdf5',
            100: '#ccfbf1',
            200: '#99f6e4',
            300: '#5eead4',
            400: '#2dd4bf',
            500: '#14b8a6',
            600: '#0d9488',
            700: '#0f766e',
            800: '#115e59',
            900: '#134e4a',
            950: '#042f2e'
        },
        colorScheme: {
            light: {
                primary: {
                    color: '{primary.700}',
                    contrastColor: '#ffffff',
                    hoverColor: '{primary.800}',
                    activeColor: '{primary.900}'
                }
            }
        }
    }
});

export default VitalitaTheme;
