<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}">
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">

        <title inertia>{{ config('app.name', 'CryptoScope') }}</title>

        <!-- Primary Meta Tags -->
        <meta name="title" content="CryptoScope — Inteligencia y Análisis Cripto Cuantitativo">
        <meta name="description" content="Screener cripto institucional, detector de flujo de ballenas DEX en Ethereum, motor de riesgo HHI para portafolio y alertas de precio autónomas con la API de CoinMarketCap.">
        <meta name="theme-color" content="#09090b">
        <meta name="color-scheme" content="dark">

        <!-- Open Graph / Facebook / LinkedIn / Discord -->
        <meta property="og:type" content="website">
        <meta property="og:url" content="{{ url()->current() }}">
        <meta property="og:title" content="CryptoScope — Inteligencia y Análisis Cripto Cuantitativo">
        <meta property="og:description" content="Screener cripto institucional, detector de flujo de ballenas DEX en Ethereum, motor de riesgo HHI para portafolio y alertas de precio autónomas con la API de CoinMarketCap.">
        <meta property="og:image" content="{{ asset('og-image.svg') }}">
        <meta property="og:image:width" content="1200">
        <meta property="og:image:height" content="630">
        <meta property="og:site_name" content="CryptoScope">

        <!-- Twitter / X Card -->
        <meta name="twitter:card" content="summary_large_image">
        <meta name="twitter:url" content="{{ url()->current() }}">
        <meta name="twitter:title" content="CryptoScope — Inteligencia y Análisis Cripto Cuantitativo">
        <meta name="twitter:description" content="Screener cripto institucional, detector de flujo de ballenas DEX en Ethereum, motor de riesgo HHI para portafolio y alertas de precio autónomas con la API de CoinMarketCap.">
        <meta name="twitter:image" content="{{ asset('og-image.svg') }}">

        <!-- Favicon (Monochrome White on Dark Matte) -->
        <link rel="icon" type="image/svg+xml" href="/favicon.svg">
        <link rel="alternate icon" href="/favicon.ico">

        <!-- Fonts -->
        <!-- Premium Fonts: Outfit (headings), Plus Jakarta Sans (body), JetBrains Mono (metrics) -->
        <link rel="preconnect" href="https://fonts.googleapis.com">
        <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
        <link href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;600;700&family=Outfit:wght@300;400;500;600;700;800&family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&display=swap" rel="stylesheet">

        <!-- Scripts -->
        @routes
        @viteReactRefresh
        @vite(['resources/js/app.jsx', "resources/js/Pages/{$page['component']}.jsx"])
        @inertiaHead
    </head>
    <body class="bg-[#09090b] text-zinc-100 font-sans antialiased min-h-screen selection:bg-zinc-800 selection:text-white">
        @inertia
    </body>
</html>
