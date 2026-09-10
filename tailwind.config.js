import defaultTheme from 'tailwindcss/defaultTheme';
import forms from '@tailwindcss/forms';

/** @type {import('tailwindcss').Config} */
export default {
    content: [
        './vendor/laravel/framework/src/Illuminate/Pagination/resources/views/*.blade.php',
        './storage/framework/views/*.php',
        './resources/views/**/*.blade.php',
        './resources/js/**/*.jsx',
    ],

    theme: {
        extend: {
            fontFamily: {
                sans: ['"Plus Jakarta Sans"', ...defaultTheme.fontFamily.sans],
                display: ['"Outfit"', 'sans-serif'],
                mono: ['"JetBrains Mono"', ...defaultTheme.fontFamily.mono],
            },
            colors: {
                dark: {
                    950: '#030508',
                    900: '#06090e',
                    850: '#0a0f16',
                    800: '#0f1723',
                    700: '#172233',
                    600: '#223249',
                },
                accent: {
                    cyan: '#06b6d4',
                    emerald: '#10b981',
                    violet: '#8b5cf6',
                    amber: '#f59e0b',
                    rose: '#f43f5e',
                },
            },
            boxShadow: {
                'glass-edge': 'inset 0 1px 1px 0 rgba(255, 255, 255, 0.12), 0 20px 40px -15px rgba(0, 0, 0, 0.7)',
                'glass-glow': '0 0 25px -5px rgba(6, 182, 212, 0.15), inset 0 1px 1px 0 rgba(255, 255, 255, 0.2)',
                'clay-card': 'inset 0 2px 4px 0 rgba(255, 255, 255, 0.08), inset 0 -3px 6px 0 rgba(0, 0, 0, 0.4), 0 16px 32px -8px rgba(0, 0, 0, 0.6)',
                'clay-btn': 'inset 0 1px 1px 0 rgba(255, 255, 255, 0.25), inset 0 -2px 4px 0 rgba(0, 0, 0, 0.3), 0 4px 12px rgba(0, 0, 0, 0.4)',
            },
        },
    },

    plugins: [forms],
};
