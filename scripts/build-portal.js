/* eslint-disable */
const fs = require('fs');
const path = require('path');

const html = /* HTML */`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=5.0, viewport-fit=cover" />
  <title>Amrutam Telemedicine - Developer Portal</title>
  <meta name="description" content="Amrutam Telemedicine System API Developer Portal - 100k/day consultations, sub-200ms reads, AES-256-GCM encryption, MFA, idempotency, Prometheus observability." />
  <meta name="theme-color" content="#0a0e14" id="meta-theme-color" />
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600&display=swap" rel="stylesheet" />
  <script>
    // Immediate anti-FOUC theme detector
    (function() {
      try {
        var saved = localStorage.getItem('amrutam_theme');
        var theme = saved || (window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark');
        document.documentElement.setAttribute('data-theme', theme);
      } catch (e) {}
    })();
  </script>
  <style>
  :root {
    /* ════════════════════════════════════════════════════════════
       DARK THEME (Default: Obsidian, Emerald & Ayurvedic Gold)
       ════════════════════════════════════════════════════════════ */
    --bg-primary: #0a0e14;
    --bg-surface: #111722;
    --bg-elevated: #16202e;
    --bg-hover: #1c2b3e;
    --border-subtle: rgba(255, 255, 255, 0.08);
    --border-strong: rgba(255, 255, 255, 0.16);
    --text-primary: #f8fafc;
    --text-secondary: #94a3b8;
    --text-muted: #64748b;
    --brand-gold: #d4a642;
    --brand-gold-glow: rgba(212, 166, 66, 0.22);
    --brand-emerald: #10b981;
    --brand-emerald-glow: rgba(16, 185, 129, 0.2);
    --brand-blue: #38bdf8;
    --brand-purple: #c084fc;
    --brand-red: #f87171;
    --nav-bg: rgba(10, 14, 20, 0.92);
    --card-shadow: 0 8px 30px -4px rgba(0, 0, 0, 0.45);
    --code-bg: #070a0f;
    --inp-bg: #0d131d;
    --tab-active-bg: rgba(212, 166, 66, 0.12);
    --scrollbar-track: #0a0e14;
    --scrollbar-thumb: #1e293b;
    --status-dot-glow: 0 0 10px #10b981;
  }

  [data-theme="light"] {
    /* ════════════════════════════════════════════════════════════
       WHITE / LIGHT THEME (Pearl, White, Forest & Amber)
       ════════════════════════════════════════════════════════════ */
    --bg-primary: #f8fafc;
    --bg-surface: #ffffff;
    --bg-elevated: #f1f5f9;
    --bg-hover: #e2e8f0;
    --border-subtle: #e2e8f0;
    --border-strong: #cbd5e1;
    --text-primary: #0f172a;
    --text-secondary: #475569;
    --text-muted: #64748b;
    --brand-gold: #b45309;
    --brand-gold-glow: rgba(180, 83, 9, 0.15);
    --brand-emerald: #059669;
    --brand-emerald-glow: rgba(5, 150, 105, 0.18);
    --brand-blue: #0284c7;
    --brand-purple: #7e22ce;
    --brand-red: #dc2626;
    --nav-bg: rgba(248, 250, 252, 0.94);
    --card-shadow: 0 8px 25px -4px rgba(15, 23, 42, 0.08);
    --code-bg: #0f172a;
    --inp-bg: #f8fafc;
    --tab-active-bg: rgba(180, 83, 9, 0.1);
    --scrollbar-track: #f1f5f9;
    --scrollbar-thumb: #cbd5e1;
    --status-dot-glow: 0 0 8px #059669;
  }

  *, *::before, *::after {
    box-sizing: border-box;
    margin: 0;
    padding: 0;
    -webkit-tap-highlight-color: transparent;
  }

  html {
    scroll-behavior: smooth;
    font-size: 14px;
  }

  body {
    font-family: 'Plus Jakarta Sans', system-ui, -apple-system, sans-serif;
    background: var(--bg-primary);
    color: var(--text-primary);
    line-height: 1.6;
    min-height: 100vh;
    overflow-x: hidden;
    transition: background-color 0.25s ease, color 0.25s ease;
  }

  ::-webkit-scrollbar { width: 6px; height: 6px; }
  ::-webkit-scrollbar-track { background: var(--scrollbar-track); }
  ::-webkit-scrollbar-thumb { background: var(--scrollbar-thumb); border-radius: 3px; }

  /* ════════════════════════════════════════════════════════════
     TOP NAVBAR
     ════════════════════════════════════════════════════════════ */
  .nav {
    position: fixed;
    top: 0; left: 0; right: 0;
    z-index: 100;
    height: 62px;
    background: var(--nav-bg);
    backdrop-filter: blur(20px);
    -webkit-backdrop-filter: blur(20px);
    border-bottom: 1px solid var(--border-subtle);
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0 20px;
    transition: all 0.2s ease;
  }

  .brand {
    display: flex;
    align-items: center;
    gap: 10px;
    font-weight: 700;
    font-size: 15px;
    color: var(--text-primary);
    text-decoration: none;
    letter-spacing: -0.01em;
    flex-shrink: 0;
  }

  .logo-icon {
    width: 34px; height: 34px;
    background: linear-gradient(135deg, #d4a642, #9a7230);
    border-radius: 9px;
    display: flex; align-items: center; justify-content: center;
    font-size: 18px;
    box-shadow: 0 2px 10px rgba(212, 166, 66, 0.3);
    flex-shrink: 0;
  }

  .brand-text {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .bdg {
    font-size: 10px;
    font-weight: 700;
    background: var(--brand-gold-glow);
    color: var(--brand-gold);
    border: 1px solid var(--brand-gold);
    border-radius: 12px;
    padding: 2px 7px;
    line-height: 1;
  }

  .nav-links {
    display: flex;
    gap: 4px;
    align-items: center;
  }

  .nl {
    font-size: 13px;
    font-weight: 600;
    color: var(--text-secondary);
    padding: 7px 14px;
    border-radius: 8px;
    cursor: pointer;
    border: none;
    background: none;
    transition: all 0.15s ease;
    font-family: inherit;
  }

  .nl:hover {
    color: var(--text-primary);
    background: var(--bg-hover);
  }

  .nl.active {
    color: var(--brand-gold);
    background: var(--tab-active-bg);
  }

  .nav-r {
    display: flex;
    gap: 8px;
    align-items: center;
  }

  /* ════════════════════════════════════════════════════════════
     BUTTONS & CONTROLS
     ════════════════════════════════════════════════════════════ */
  .btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
    font-size: 12.5px;
    font-weight: 600;
    border: none;
    cursor: pointer;
    border-radius: 8px;
    padding: 8px 14px;
    transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
    text-decoration: none;
    white-space: nowrap;
    font-family: inherit;
  }

  .btn:active {
    transform: scale(0.97);
  }

  .bg {
    background: var(--bg-elevated);
    color: var(--text-secondary);
    border: 1px solid var(--border-subtle);
  }

  .bg:hover {
    color: var(--text-primary);
    border-color: var(--border-strong);
    background: var(--bg-hover);
  }

  .bgo {
    background: linear-gradient(135deg, #d4a642, #b48325);
    color: #0b0f14;
    font-weight: 700;
    box-shadow: 0 4px 14px var(--brand-gold-glow);
  }

  .bgo:hover {
    transform: translateY(-1px);
    box-shadow: 0 6px 20px rgba(212, 166, 66, 0.4);
  }

  .bgs {
    background: linear-gradient(135deg, #10b981, #059669);
    color: #ffffff;
    font-weight: 700;
    box-shadow: 0 4px 14px var(--brand-emerald-glow);
  }

  .bgs:hover {
    transform: translateY(-1px);
    box-shadow: 0 6px 20px rgba(16, 185, 129, 0.35);
  }

  /* Theme Switcher Button */
  .theme-toggle-btn {
    width: 36px; height: 36px;
    border-radius: 9px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    background: var(--bg-elevated);
    border: 1px solid var(--border-subtle);
    color: var(--text-primary);
    cursor: pointer;
    font-size: 17px;
    transition: all 0.2s ease;
    flex-shrink: 0;
  }

  .theme-toggle-btn:hover {
    border-color: var(--brand-gold);
    transform: scale(1.06);
    background: var(--bg-hover);
  }

  /* ════════════════════════════════════════════════════════════
     LAYOUT: SIDEBAR + MAIN CONTENT
     ════════════════════════════════════════════════════════════ */
  .layout {
    display: flex;
    margin-top: 62px;
    min-height: calc(100vh - 62px);
  }

  .sb {
    width: 250px;
    flex-shrink: 0;
    background: var(--bg-surface);
    border-right: 1px solid var(--border-subtle);
    height: calc(100vh - 62px);
    position: sticky;
    top: 62px;
    overflow-y: auto;
    padding: 16px 0 30px;
    transition: background-color 0.25s, border-color 0.25s;
  }

  .sbl {
    font-size: 10px;
    font-weight: 800;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    color: var(--text-muted);
    padding: 10px 18px 4px;
    display: block;
  }

  .sbi {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 12.5px;
    font-weight: 500;
    color: var(--text-secondary);
    padding: 7px 18px;
    cursor: pointer;
    transition: all 0.15s ease;
    border: none;
    background: none;
    width: 100%;
    text-align: left;
    text-decoration: none;
    font-family: inherit;
  }

  .sbi:hover {
    color: var(--text-primary);
    background: var(--bg-hover);
  }

  .mb {
    font-size: 10px;
    font-weight: 700;
    font-family: 'JetBrains Mono', monospace;
    padding: 2px 6px;
    border-radius: 4px;
    flex-shrink: 0;
  }

  .mg { background: rgba(56, 189, 248, 0.15); color: var(--brand-blue); }
  .mp { background: rgba(16, 185, 129, 0.15); color: var(--brand-emerald); }
  .mx { background: rgba(212, 166, 66, 0.15); color: var(--brand-gold); }

  .main {
    flex: 1;
    min-width: 0;
    padding: 36px;
    max-width: 1100px;
  }

  /* ════════════════════════════════════════════════════════════
     HERO SECTION
     ════════════════════════════════════════════════════════════ */
  .hero {
    position: relative;
    padding: 30px 0 24px;
    margin-bottom: 28px;
  }

  .hero::before {
    content: "";
    position: absolute;
    top: -40px; right: -80px;
    width: 440px; height: 440px;
    background: radial-gradient(circle, var(--brand-gold-glow) 0%, transparent 70%);
    pointer-events: none;
  }

  .htag {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    font-size: 11px;
    font-weight: 700;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: var(--brand-gold);
    background: var(--tab-active-bg);
    border: 1px solid var(--brand-gold);
    padding: 4px 14px;
    border-radius: 20px;
    margin-bottom: 14px;
  }

  h1 {
    font-size: clamp(24px, 4vw, 42px);
    font-weight: 800;
    line-height: 1.15;
    letter-spacing: -0.025em;
    margin-bottom: 12px;
  }

  .hl {
    background: linear-gradient(135deg, #f3c258, #d4a642);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
  }

  [data-theme="light"] .hl {
    background: linear-gradient(135deg, #b45309, #d97706);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
  }

  .hero p {
    font-size: 14.5px;
    color: var(--text-secondary);
    max-width: 640px;
    line-height: 1.7;
    margin-bottom: 22px;
  }

  .ha {
    display: flex;
    gap: 10px;
    flex-wrap: wrap;
  }

  /* ════════════════════════════════════════════════════════════
     STATS GRID
     ════════════════════════════════════════════════════════════ */
  .stats {
    display: grid;
    grid-template-columns: repeat(6, 1fr);
    gap: 12px;
    margin-bottom: 32px;
  }

  .scard {
    background: var(--bg-surface);
    border: 1px solid var(--border-subtle);
    border-radius: 12px;
    padding: 16px;
    box-shadow: var(--card-shadow);
    transition: all 0.2s ease;
  }

  .scard:hover {
    border-color: var(--brand-gold);
    transform: translateY(-2px);
  }

  .si { font-size: 19px; margin-bottom: 6px; display: block; }
  .sv {
    font-size: 20px;
    font-weight: 800;
    color: var(--text-primary);
    letter-spacing: -0.02em;
    font-family: 'JetBrains Mono', monospace;
  }
  .slb { font-size: 11.5px; color: var(--text-secondary); margin-top: 3px; }
  .str { font-size: 10.5px; color: var(--brand-emerald); font-weight: 600; margin-top: 3px; }

  /* ════════════════════════════════════════════════════════════
     CORE CAPABILITIES / FEATURES
     ════════════════════════════════════════════════════════════ */
  .sct {
    font-size: 18px;
    font-weight: 800;
    color: var(--text-primary);
    margin-bottom: 4px;
    letter-spacing: -0.01em;
  }

  .scs {
    font-size: 13px;
    color: var(--text-secondary);
    margin-bottom: 16px;
  }

  .fts {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
    gap: 14px;
    margin-bottom: 32px;
  }

  .fc {
    background: var(--bg-surface);
    border: 1px solid var(--border-subtle);
    border-radius: 14px;
    padding: 20px;
    box-shadow: var(--card-shadow);
    transition: all 0.2s ease;
  }

  .fc:hover {
    border-color: var(--brand-gold);
    transform: translateY(-2px);
  }

  .fi2 {
    width: 40px; height: 40px;
    border-radius: 10px;
    display: flex; align-items: center; justify-content: center;
    font-size: 18px;
    margin-bottom: 12px;
  }

  .ig { background: rgba(212, 166, 66, 0.14); }
  .is { background: rgba(16, 185, 129, 0.14); }
  .ib { background: rgba(56, 189, 248, 0.14); }
  .ip { background: rgba(192, 132, 252, 0.14); }
  .ir { background: rgba(248, 113, 113, 0.14); }

  .ft { font-size: 14px; font-weight: 700; margin-bottom: 5px; color: var(--text-primary); }
  .fd { font-size: 12.5px; color: var(--text-secondary); line-height: 1.6; }
  .tags { display: flex; flex-wrap: wrap; gap: 5px; margin-top: 10px; }
  .tag {
    font-size: 10.5px;
    font-weight: 600;
    padding: 3px 8px;
    border-radius: 6px;
    background: var(--bg-elevated);
    color: var(--text-secondary);
    border: 1px solid var(--border-subtle);
  }

  /* ════════════════════════════════════════════════════════════
     API CARDS & ACCORDION
     ════════════════════════════════════════════════════════════ */
  .ac {
    background: var(--bg-surface);
    border: 1px solid var(--border-subtle);
    border-radius: 12px;
    margin-bottom: 12px;
    box-shadow: var(--card-shadow);
    transition: border-color 0.2s ease;
    overflow: hidden;
  }

  .ac:hover {
    border-color: var(--brand-gold);
  }

  .ach {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 14px 18px;
    cursor: pointer;
    transition: background 0.15s;
    user-select: none;
  }

  .ach:hover {
    background: var(--bg-hover);
  }

  .ae {
    font-family: 'JetBrains Mono', monospace;
    font-size: 13px;
    font-weight: 600;
    color: var(--text-primary);
    flex: 1;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .as {
    font-size: 12px;
    color: var(--text-secondary);
    flex: 1.5;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .cv {
    font-size: 11px;
    color: var(--text-muted);
    transition: transform 0.2s ease;
    flex-shrink: 0;
  }

  .ac.exp .cv {
    transform: rotate(90deg);
  }

  .acb {
    display: none;
    border-top: 1px solid var(--border-subtle);
    padding: 18px;
    background: var(--bg-surface);
  }

  .ac.exp .acb {
    display: block;
  }

  /* Code Block */
  .cb {
    background: var(--code-bg);
    border: 1px solid var(--border-subtle);
    border-radius: 10px;
    overflow: hidden;
    margin-bottom: 14px;
  }

  .ch {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 7px 14px;
    background: rgba(255, 255, 255, 0.02);
    border-bottom: 1px solid var(--border-subtle);
  }

  .cl {
    font-size: 10.5px;
    font-weight: 700;
    color: var(--text-muted);
    letter-spacing: 0.08em;
  }

  .cpb {
    font-size: 11px;
    font-weight: 600;
    color: var(--text-secondary);
    background: none;
    border: 1px solid var(--border-subtle);
    border-radius: 6px;
    padding: 3px 9px;
    cursor: pointer;
    transition: all 0.15s;
    font-family: inherit;
  }

  .cpb:hover {
    color: var(--brand-gold);
    border-color: var(--brand-gold);
  }

  .cpb.done {
    color: var(--brand-emerald);
    border-color: var(--brand-emerald);
  }

  pre {
    padding: 14px;
    font-family: 'JetBrains Mono', monospace;
    font-size: 12px;
    line-height: 1.6;
    overflow-x: auto;
    color: #e2e8f0;
    -webkit-overflow-scrolling: touch;
  }

  [data-theme="light"] pre {
    color: #cbd5e1;
  }

  .k { color: #7dd3fc; }
  .s2 { color: #fed7aa; }
  .b2 { color: #c084fc; }
  .cm { color: #94a3b8; font-style: italic; }
  .m2 { color: #86efac; font-weight: 600; }
  .hd { color: #fde047; }

  /* Try-It Console Box */
  .tp2 {
    background: var(--bg-elevated);
    border: 1px solid var(--border-subtle);
    border-radius: 10px;
    padding: 16px;
    margin-top: 14px;
  }

  .tl {
    font-size: 11px;
    font-weight: 700;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: var(--brand-gold);
    margin-bottom: 12px;
  }

  .fg { margin-bottom: 12px; }
  .fl {
    font-size: 11px;
    font-weight: 600;
    color: var(--text-secondary);
    margin-bottom: 4px;
    display: block;
  }

  .inp {
    width: 100%;
    min-height: 38px;
    padding: 8px 12px;
    background: var(--inp-bg);
    border: 1px solid var(--border-subtle);
    border-radius: 6px;
    color: var(--text-primary);
    font-size: 13px;
    font-family: 'JetBrains Mono', monospace;
    outline: none;
    transition: border-color 0.15s;
  }

  .inp:focus {
    border-color: var(--brand-gold);
  }

  .inp::placeholder {
    color: var(--text-muted);
  }

  .rbox {
    background: var(--code-bg);
    border: 1px solid var(--border-subtle);
    border-radius: 8px;
    padding: 12px;
    font-family: 'JetBrains Mono', monospace;
    font-size: 11.5px;
    color: var(--text-primary);
    min-height: 40px;
    max-height: 260px;
    overflow-y: auto;
    white-space: pre-wrap;
    word-break: break-all;
    margin-top: 12px;
    -webkit-overflow-scrolling: touch;
  }

  .rs {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    font-size: 11.5px;
    font-weight: 700;
    margin-bottom: 6px;
  }

  .dot { width: 8px; height: 8px; border-radius: 50%; }
  .ok .dot { background: var(--brand-emerald); }
  .ok { color: var(--brand-emerald); }
  .er .dot { background: var(--brand-red); }
  .er { color: var(--brand-red); }
  .ld { color: var(--text-muted); font-style: italic; }

  /* Tabs */
  .tabs {
    display: flex;
    gap: 4px;
    border-bottom: 1px solid var(--border-subtle);
    margin-bottom: 16px;
  }

  .tab {
    font-size: 12.5px;
    font-weight: 600;
    color: var(--text-secondary);
    padding: 9px 16px;
    cursor: pointer;
    border: none;
    border-bottom: 2px solid transparent;
    transition: all 0.15s;
    background: none;
    font-family: inherit;
  }

  .tab:hover { color: var(--text-primary); }
  .tab.active {
    color: var(--brand-gold);
    border-bottom-color: var(--brand-gold);
  }

  /* Tables */
  .tw {
    overflow-x: auto;
    -webkit-overflow-scrolling: touch;
    border-radius: 8px;
    margin-bottom: 10px;
    border: 1px solid var(--border-subtle);
  }

  table { width: 100%; border-collapse: collapse; font-size: 12.5px; }
  th {
    text-align: left;
    padding: 9px 12px;
    font-size: 10.5px;
    font-weight: 700;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: var(--text-muted);
    background: var(--bg-elevated);
    border-bottom: 1px solid var(--border-subtle);
    white-space: nowrap;
  }

  td {
    padding: 9px 12px;
    border-bottom: 1px solid var(--border-subtle);
    color: var(--text-secondary);
    vertical-align: top;
  }

  td:first-child {
    color: var(--text-primary);
    font-family: 'JetBrains Mono', monospace;
    font-size: 12px;
  }

  tr:last-child td { border-bottom: none; }
  tr:hover td { background: var(--bg-hover); }

  .rby {
    font-size: 10px;
    font-weight: 700;
    padding: 2px 6px;
    border-radius: 4px;
    background: rgba(248, 113, 113, 0.15);
    color: var(--brand-red);
  }

  .rbn {
    font-size: 10px;
    font-weight: 700;
    padding: 2px 6px;
    border-radius: 4px;
    background: var(--bg-elevated);
    color: var(--text-muted);
  }

  /* Architecture & Flow Cards */
  .ar {
    background: var(--bg-surface);
    border: 1px solid var(--border-subtle);
    border-radius: 14px;
    padding: 22px;
    margin-bottom: 24px;
    box-shadow: var(--card-shadow);
  }

  .nr {
    display: flex;
    align-items: center;
    margin-bottom: 8px;
    justify-content: center;
    flex-wrap: wrap;
    gap: 8px;
  }

  .nd {
    background: var(--bg-elevated);
    border: 1px solid var(--border-subtle);
    border-radius: 10px;
    padding: 10px 16px;
    font-size: 12px;
    font-weight: 600;
    text-align: center;
    min-width: 110px;
    transition: border-color 0.2s;
  }

  .nd:hover { border-color: var(--brand-gold); }
  .ndg { border-color: var(--brand-gold); color: var(--brand-gold); }
  .nds { border-color: var(--brand-emerald); color: var(--brand-emerald); }
  .ndb { border-color: var(--brand-blue); color: var(--brand-blue); }
  .ndp { border-color: var(--brand-purple); color: var(--brand-purple); }
  .arr { color: var(--text-muted); padding: 0 4px; font-size: 14px; }
  .al { font-size: 11px; color: var(--text-muted); text-align: center; margin: 4px 0 12px; }

  /* Footer */
  .ftr {
    margin-top: 48px;
    padding: 24px 0;
    border-top: 1px solid var(--border-subtle);
    display: flex;
    align-items: center;
    justify-content: space-between;
    font-size: 12px;
    color: var(--text-muted);
    flex-wrap: wrap;
    gap: 10px;
  }

  /* Toast Notification */
  .toast {
    position: fixed;
    bottom: 24px; right: 24px;
    background: var(--bg-surface);
    border: 1px solid var(--border-strong);
    border-radius: 10px;
    padding: 12px 20px;
    font-size: 13px;
    font-weight: 600;
    color: var(--text-primary);
    transform: translateY(100px);
    opacity: 0;
    transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
    z-index: 400;
    box-shadow: 0 12px 32px rgba(0, 0, 0, 0.4);
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .toast.show { transform: translateY(0); opacity: 1; }
  .toast.ok { border-color: var(--brand-emerald); }

  /* ════════════════════════════════════════════════════════════
     MOBILE BOTTOM NAVIGATION DOCK
     ════════════════════════════════════════════════════════════ */
  .mobile-nav {
    display: none;
    position: fixed;
    bottom: 0; left: 0; right: 0;
    height: 64px;
    background: var(--nav-bg);
    backdrop-filter: blur(24px);
    -webkit-backdrop-filter: blur(24px);
    border-top: 1px solid var(--border-subtle);
    z-index: 200;
    justify-content: space-around;
    align-items: center;
    padding: 0 8px calc(env(safe-area-inset-bottom, 0px) + 2px);
    box-shadow: 0 -4px 20px rgba(0, 0, 0, 0.15);
  }

  .mn-item {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 3px;
    background: none;
    border: none;
    color: var(--text-secondary);
    font-size: 10.5px;
    font-weight: 600;
    padding: 6px 12px;
    border-radius: 10px;
    cursor: pointer;
    transition: all 0.15s ease;
    text-decoration: none;
    font-family: inherit;
    flex: 1;
    max-width: 80px;
  }

  .mn-item .mn-icon {
    font-size: 18px;
    line-height: 1;
    transition: transform 0.15s ease;
  }

  .mn-item:active .mn-icon {
    transform: scale(1.2);
  }

  .mn-item.active {
    color: var(--brand-gold);
    background: var(--tab-active-bg);
  }

  @keyframes pulse {
    0%, 100% { opacity: 1; transform: scale(1); }
    50% { opacity: 0.35; transform: scale(0.9); }
  }

  .ldot {
    display: inline-block;
    width: 8px; height: 8px;
    border-radius: 50%;
    background: var(--brand-emerald);
    box-shadow: var(--status-dot-glow);
  }

  .page { display: none; }
  .page.active { display: block; animation: fadeUp 0.35s ease both; }

  @keyframes fadeUp {
    from { opacity: 0; transform: translateY(10px); }
    to { opacity: 1; transform: translateY(0); }
  }

  /* ════════════════════════════════════════════════════════════
     RESPONSIVE MEDIA QUERIES (Mobile, Tablet, Desktop)
     ════════════════════════════════════════════════════════════ */
  @media (max-width: 1024px) {
    .stats { grid-template-columns: repeat(3, 1fr); }
  }

  @media (max-width: 900px) {
    .sb { display: none !important; }
    .main {
      padding: 24px 20px 96px 20px;
      max-width: 100%;
    }
    .mobile-nav { display: flex; }
    .nav-links { display: none; }
  }

  @media (max-width: 680px) {
    .nav {
      padding: 0 14px;
      height: 58px;
    }
    .layout {
      margin-top: 58px;
    }
    .brand {
      font-size: 14px;
      gap: 8px;
    }
    .brand-full-name { display: none; }
    .brand-short-name { display: inline !important; }
    .nav-r .btn {
      padding: 6px 10px;
      font-size: 11px;
    }
    .main {
      padding: 18px 14px 96px 14px;
    }
    h1 {
      font-size: clamp(22px, 6.5vw, 28px);
      line-height: 1.2;
    }
    .hero p {
      font-size: 13.5px;
      margin-bottom: 18px;
    }
    .ha {
      flex-direction: column;
      gap: 8px;
    }
    .ha .btn {
      width: 100%;
      min-height: 42px;
      font-size: 13px;
    }
    .stats {
      grid-template-columns: repeat(2, 1fr);
      gap: 8px;
    }
    .scard {
      padding: 12px 14px;
    }
    .sv { font-size: 18px; }
    .fts {
      grid-template-columns: 1fr;
      gap: 10px;
    }
    .fc { padding: 16px; }
    .as { display: none; }
    .ach { padding: 12px 14px; }
    .ae { font-size: 12px; }
    .grid-2col {
      flex-direction: column !important;
    }
    .nd {
      min-width: 90px;
      padding: 8px 10px;
      font-size: 11px;
    }
    .arr { font-size: 12px; }
    .ftr {
      flex-direction: column;
      align-items: flex-start;
      gap: 6px;
    }
  }

  @media (max-width: 360px) {
    .stats { grid-template-columns: 1fr; }
    .brand-text .bdg { display: none; }
  }
  </style>
</head>
<body>

<!-- ════════════════════════════════════════════════════════════
     TOP NAVBAR
     ════════════════════════════════════════════════════════════ -->
<nav class="nav">
  <a class="brand" href="#">
    <div class="logo-icon">🌿</div>
    <div class="brand-text">
      <span class="brand-full-name">Amrutam Telemedicine</span>
      <span class="brand-short-name" style="display:none">Amrutam</span>
      <span class="bdg">v1.0</span>
    </div>
  </a>

  <!-- Desktop Navigation Links -->
  <div class="nav-links">
    <button class="nl active" id="n-ov" onclick="pg('overview',this)">Overview</button>
    <button class="nl" id="n-ex" onclick="pg('explorer',this)">API Explorer</button>
    <button class="nl" id="n-ar" onclick="pg('architecture',this)">Architecture</button>
    <button class="nl" id="n-qs" onclick="pg('quickstart',this)">Quick Start</button>
  </div>

  <!-- Right Actions: Theme Toggle + Health Probe + OpenAPI Link -->
  <div class="nav-r">
    <button class="theme-toggle-btn" id="theme-btn" onclick="toggleTheme()" title="Toggle Dark/Light Theme" aria-label="Toggle Theme">🌙</button>
    <button class="btn bg" onclick="probeH()" id="nav-health-btn"><span class="ldot" id="ldot"></span>&nbsp;Health</button>
    <a class="btn bgo" href="/api/openapi.json" target="_blank" rel="noopener">OpenAPI ↗</a>
  </div>
</nav>

<!-- ════════════════════════════════════════════════════════════
     MOBILE BOTTOM NAVIGATION DOCK (Pixel 9 Pro / Touch Devices)
     ════════════════════════════════════════════════════════════ -->
<nav class="mobile-nav" aria-label="Mobile Navigation">
  <button class="mn-item active" id="m-ov" onclick="pg('overview',document.getElementById('n-ov'))">
    <span class="mn-icon">🌿</span>
    <span>Overview</span>
  </button>
  <button class="mn-item" id="m-ex" onclick="pg('explorer',document.getElementById('n-ex'))">
    <span class="mn-icon">🔍</span>
    <span>Explorer</span>
  </button>
  <button class="mn-item" id="m-ar" onclick="pg('architecture',document.getElementById('n-ar'))">
    <span class="mn-icon">🏗️</span>
    <span>Arch</span>
  </button>
  <button class="mn-item" id="m-qs" onclick="pg('quickstart',document.getElementById('n-qs'))">
    <span class="mn-icon">🚀</span>
    <span>Start</span>
  </button>
</nav>

<!-- ════════════════════════════════════════════════════════════
     MAIN LAYOUT (Sidebar + Content)
     ════════════════════════════════════════════════════════════ -->
<div class="layout">

<!-- Desktop Sticky Sidebar -->
<aside class="sb">
  <span class="sbl">Observability</span>
  <a class="sbi" href="/health" target="_blank">❤️ /health</a>
  <a class="sbi" href="/ready" target="_blank">✅ /ready</a>
  <a class="sbi" href="/metrics" target="_blank">📊 /metrics</a>

  <span class="sbl">Auth API</span>
  <button class="sbi" onclick="jmp('register')"><span class="mb mp">POST</span>/register</button>
  <button class="sbi" onclick="jmp('r2')"><span class="mb mp">POST</span>/login</button>
  <button class="sbi" onclick="jmp('r3')"><span class="mb mp">POST</span>/refresh</button>
  <button class="sbi" onclick="jmp('r4')"><span class="mb mp">POST</span>/mfa/*</button>

  <span class="sbl">Doctor Directory</span>
  <button class="sbi" onclick="jmp('d1')"><span class="mb mg">GET</span>/doctors</button>
  <button class="sbi" onclick="jmp('d2')"><span class="mb mg">GET</span>/:id/slots</button>
  <button class="sbi" onclick="jmp('d3')"><span class="mb mp">POST</span>/:id/slots</button>

  <span class="sbl">Consultations</span>
  <button class="sbi" onclick="jmp('c1')"><span class="mb mg">GET</span>/consultations</button>
  <button class="sbi" onclick="jmp('c2')"><span class="mb mp">POST</span>/consultations</button>
  <button class="sbi" onclick="jmp('c3')"><span class="mb mx">PATCH</span>/:id/status</button>

  <span class="sbl">Rx &amp; Payments</span>
  <button class="sbi" onclick="jmp('p1')"><span class="mb mp">POST</span>/prescriptions</button>
  <button class="sbi" onclick="jmp('p2')"><span class="mb mp">POST</span>/payments</button>

  <span class="sbl">Admin &amp; Audit</span>
  <button class="sbi" onclick="jmp('a1')"><span class="mb mg">GET</span>/analytics</button>
  <button class="sbi" onclick="jmp('a2')"><span class="mb mg">GET</span>/users</button>
  <button class="sbi" onclick="jmp('a3')"><span class="mb mg">GET</span>/audit-logs</button>
</aside>

<!-- Main Scrollable Content -->
<main class="main">

<!-- ════════════════════════════════════════════════════════════
     PAGE 1: OVERVIEW
     ════════════════════════════════════════════════════════════ -->
<div class="page active" id="page-overview">
  <div class="hero">
    <div class="htag">🌿 Production-Grade Telemedicine API</div>
    <h1>Amrutam <span class="hl">Telemedicine</span><br/>Backend System</h1>
    <p>Engineered for <strong>100k daily consultations</strong> — sub-200ms p95, AES-256-GCM encryption, JWT+TOTP MFA, distributed idempotency, Prometheus observability, and 30 automated integration tests.</p>
    <div class="ha">
      <button class="btn bgo" onclick="pg('explorer',document.getElementById('n-ex'))">Explore APIs →</button>
      <button class="btn bgs" onclick="probeH()">Live Health Check</button>
      <a class="btn bg" href="/api/openapi.json" target="_blank" rel="noopener">OpenAPI JSON ↗</a>
    </div>
  </div>

  <!-- Key Metrics / Stats Grid -->
  <div class="stats">
    <div class="scard"><span class="si">⚡</span><div class="sv">&lt;200ms</div><div class="slb">p95 Read Latency</div><div class="str">↑ target met</div></div>
    <div class="scard"><span class="si">✅</span><div class="sv">30/30</div><div class="slb">Tests Passing</div><div class="str">Jest + Playwright</div></div>
    <div class="scard"><span class="si">🔐</span><div class="sv">AES-256</div><div class="slb">Encryption at rest</div><div class="str">GCM + PBKDF2</div></div>
    <div class="scard"><span class="si">🛡️</span><div class="sv">TOTP MFA</div><div class="slb">Multi-Factor Auth</div><div class="str">RFC 6238</div></div>
    <div class="scard"><span class="si">🔁</span><div class="sv">24h TTL</div><div class="slb">Idempotency</div><div class="str">Race-safe</div></div>
    <div class="scard"><span class="si">📊</span><div class="sv">Prometheus</div><div class="slb">Observability</div><div class="str">+ Grafana alerts</div></div>
  </div>

  <!-- Core Capabilities Feature Grid -->
  <div class="sct">Core Capabilities</div>
  <div class="scs">Enterprise-grade features engineered for Ayurvedic healthcare at scale</div>
  <div class="fts">
    <div class="fc">
      <div class="fi2 ig">🔐</div>
      <div class="ft">JWT + TOTP MFA Auth</div>
      <div class="fd">15-min access tokens, 7-day rotating refresh tokens, TOTP MFA via speakeasy. Privilege escalation strictly blocked at schema level.</div>
      <div class="tags"><span class="tag">JWT HS256</span><span class="tag">TOTP RFC6238</span><span class="tag">Refresh Rotation</span></div>
    </div>
    <div class="fc">
      <div class="fi2 is">🔁</div>
      <div class="ft">Distributed Idempotency</div>
      <div class="fd">PostgreSQL-backed keys with 24h TTL and SHA-256 request hashing. Prevents double-booking and duplicate charges via atomic constraints.</div>
      <div class="tags"><span class="tag">Unique constraint</span><span class="tag">24h TTL</span></div>
    </div>
    <div class="fc">
      <div class="fi2 ib">📊</div>
      <div class="ft">Full Observability Stack</div>
      <div class="fd">Prometheus metrics, p95 duration histograms, Pino structured JSON logs with correlation trace IDs, and Grafana dashboard alerts.</div>
      <div class="tags"><span class="tag">Prometheus</span><span class="tag">Grafana</span><span class="tag">Pino</span></div>
    </div>
    <div class="fc">
      <div class="fi2 ip">🌿</div>
      <div class="ft">Ayurvedic Doctor Directory</div>
      <div class="fd">Doctor profiles with specialty, Prakriti typing, slot scheduling, multi-language filter, ratings, and fee-based patient matching.</div>
      <div class="tags"><span class="tag">Multi-specialty</span><span class="tag">Language filter</span></div>
    </div>
    <div class="fc">
      <div class="fi2 ir">💊</div>
      <div class="ft">Ayurvedic Prescriptions</div>
      <div class="fd">Structured Rx linked to consultation lifecycle. Doctor-only write, patient-accessible read with full dosage instructions.</div>
      <div class="tags"><span class="tag">Consultation-linked</span><span class="tag">Dosage control</span></div>
    </div>
    <div class="fc">
      <div class="fi2 ig">💳</div>
      <div class="ft">Payments &amp; Audit Trail</div>
      <div class="fd">INR payments with Razorpay webhook hooks, idempotent transactions, refund flows, and tamper-evident audit logs.</div>
      <div class="tags"><span class="tag">Razorpay-ready</span><span class="tag">Immutable audit</span></div>
    </div>
  </div>

  <!-- Live Health Probe Section -->
  <div class="ar">
    <div class="sct" style="margin-bottom:12px">🩺 Live Health Probe</div>
    <div id="healthResult" class="rbox" style="min-height:46px;color:var(--text-muted);font-style:italic">Click button below to probe the active server...</div>
    <div style="display:flex;gap:8px;margin-top:12px;flex-wrap:wrap">
      <button class="btn bgs" onclick="probeH()">Live Health Check</button>
      <button class="btn bg" onclick="probeR()">Probe /ready</button>
      <button class="btn bg" onclick="probeM()">Probe /metrics</button>
    </div>
  </div>
</div>

<!-- ════════════════════════════════════════════════════════════
     PAGE 2: API EXPLORER
     ════════════════════════════════════════════════════════════ -->
<div class="page" id="page-explorer">
  <div class="sct">🔍 API Explorer</div>
  <div class="scs">Click an endpoint to expand schema details. Switch to "Try It" to execute live requests.</div>

  <!-- AUTH SECTION -->
  <div style="margin:20px 0 8px"><b style="font-size:11px;font-weight:800;letter-spacing:.08em;text-transform:uppercase;color:var(--brand-gold)">⚙️ Auth — /api/auth</b></div>

  <!-- /api/auth/register -->
  <div id="register" class="ac api-card">
    <div class="ach api-card-header" onclick="tog('register')">
      <span class="mb mp">POST</span>
      <span class="ae">/api/auth/register</span>
      <span class="as">Register Patient or Doctor</span>
      <span class="cv">▶</span>
    </div>
    <div class="acb api-card-body">
      <div class="tabs">
        <button class="tab active" onclick="swt(this,'register','s')">Schema</button>
        <button class="tab" onclick="swt(this,'register','t')">Try It</button>
      </div>
      <div id="register-s">
        <div class="cb">
          <div class="ch"><span class="cl">CURL</span><button class="cpb" onclick="cpc(this)">Copy</button></div>
          <pre><span class="m2">curl</span> -X POST http://localhost:3000/api/auth/register \
  <span class="hd">-H "Content-Type: application/json"</span> \
  -d '{"email":"aarav@example.com","password":"Sup3rSecret!pass","firstName":"Aarav","lastName":"Mehta","role":"PATIENT"}'</pre>
        </div>
        <div class="tw">
          <table>
            <thead><tr><th>Field</th><th>Type</th><th>Required</th><th>Notes</th></tr></thead>
            <tbody>
              <tr><td>email</td><td>string</td><td><span class="rby">yes</span></td><td>Unique, lowercased</td></tr>
              <tr><td>password</td><td>string (min 8)</td><td><span class="rby">yes</span></td><td>bcrypt salted (10 rounds)</td></tr>
              <tr><td>firstName</td><td>string (max 100)</td><td><span class="rby">yes</span></td><td>Patient or Doctor first name</td></tr>
              <tr><td>lastName</td><td>string (max 100)</td><td><span class="rby">yes</span></td><td>Patient or Doctor last name</td></tr>
              <tr><td>role</td><td>PATIENT | DOCTOR</td><td><span class="rbn">no</span></td><td>ADMIN role demoted for safety</td></tr>
            </tbody>
          </table>
        </div>
      </div>
      <div id="register-t" style="display:none">
        <div class="tp2">
          <div class="tl">🚀 Live Console</div>
          <div class="fg"><label class="fl">Email Address</label><input class="inp" id="reg-email" type="email" value="patient_test@example.com" /></div>
          <div class="fg"><label class="fl">Password</label><input class="inp" id="re-pw" type="password" value="Sup3rSecret!pass" /></div>
          <div class="grid-2col" style="display:flex;gap:10px">
            <div class="fg" style="flex:1"><label class="fl">First Name</label><input class="inp" id="re-fn" value="Aarav" /></div>
            <div class="fg" style="flex:1"><label class="fl">Last Name</label><input class="inp" id="re-ln" value="Mehta" /></div>
          </div>
          <button class="btn bgo" onclick="tryReg()">Send Request</button>
          <div id="reg-result" class="rbox" style="margin-top:12px;display:none"></div>
        </div>
      </div>
    </div>
  </div>

  <!-- /api/auth/login -->
  <div id="r2" class="ac api-card">
    <div class="ach api-card-header" onclick="tog('r2')">
      <span class="mb mp">POST</span>
      <span class="ae">/api/auth/login</span>
      <span class="as">Authenticate — receive access and refresh tokens</span>
      <span class="cv">▶</span>
    </div>
    <div class="acb api-card-body">
      <div class="tabs">
        <button class="tab active" onclick="swt(this,'r2','s')">Schema</button>
        <button class="tab" onclick="swt(this,'r2','t')">Try It</button>
      </div>
      <div id="r2-s">
        <div class="cb">
          <div class="ch"><span class="cl">CURL</span><button class="cpb" onclick="cpc(this)">Copy</button></div>
          <pre><span class="m2">curl</span> -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"patient@amrutam.co.in","password":"Patient@123456"}'</pre>
        </div>
        <div class="cb">
          <div class="ch"><span class="cl">RESPONSE 200</span></div>
          <pre>{"<span class="k">success</span>":<span class="b2">true</span>,"<span class="k">data</span>":{"<span class="k">accessToken</span>":"<span class="s2">eyJhbGciOiJIUzI1Ni...</span>","<span class="k">refreshToken</span>":"<span class="s2">eyJhbGciOiJIUzI1Ni...</span>","<span class="k">mfaRequired</span>":<span class="b2">false</span>}}</pre>
        </div>
      </div>
      <div id="r2-t" style="display:none">
        <div class="tp2">
          <div class="tl">🚀 Live Console</div>
          <div class="fg"><label class="fl">Email Address</label><input class="inp" id="li-em" value="patient@amrutam.co.in" /></div>
          <div class="fg"><label class="fl">Password</label><input class="inp" id="li-pw" type="password" value="Patient@123456" /></div>
          <button class="btn bgo" onclick="tryLogin()">Send Request</button>
          <div id="li-rs" class="rbox" style="margin-top:12px;display:none"></div>
        </div>
      </div>
    </div>
  </div>

  <!-- /api/auth/refresh -->
  <div id="r3" class="ac api-card">
    <div class="ach api-card-header" onclick="tog('r3')">
      <span class="mb mp">POST</span>
      <span class="ae">/api/auth/refresh</span>
      <span class="as">Rotate refresh token — replay detection returns 401</span>
      <span class="cv">▶</span>
    </div>
    <div class="acb api-card-body">
      <p style="font-size:12.5px;color:var(--text-secondary);margin-bottom:10px">Each refresh token is minted with a unique <code style="color:var(--brand-gold);font-family:'JetBrains Mono',monospace">jti</code> UUID. Replaying a previously rotated token invalidates session immediately.</p>
      <div class="cb">
        <div class="ch"><span class="cl">CURL</span><button class="cpb" onclick="cpc(this)">Copy</button></div>
        <pre><span class="m2">curl</span> -X POST http://localhost:3000/api/auth/refresh \
  -H "Content-Type: application/json" \
  -d '{"refreshToken":"&lt;your_refresh_token&gt;"}'</pre>
      </div>
    </div>
  </div>

  <!-- /api/auth/mfa/* -->
  <div id="r4" class="ac api-card">
    <div class="ach api-card-header" onclick="tog('r4')">
      <span class="mb mp">POST</span>
      <span class="ae">/api/auth/mfa/setup → enable → login-verify</span>
      <span class="as">TOTP Multi-Factor Authentication (RFC 6238)</span>
      <span class="cv">▶</span>
    </div>
    <div class="acb api-card-body">
      <div class="cb">
        <div class="ch"><span class="cl">MFA FLOW</span></div>
        <pre><span class="cm"># Step 1: Generate TOTP secret + QR code URL</span>
POST /api/auth/mfa/setup        → { secret, otpauthUrl }

<span class="cm"># Step 2: Confirm via 6-digit TOTP code</span>
POST /api/auth/mfa/enable       body: { "token": "123456" }

<span class="cm"># Step 3: Login with MFA enforced</span>
POST /api/auth/login            → { mfaRequired: true, mfaToken }
POST /api/auth/mfa/login-verify body: { "mfaToken": "...", "token": "123456" }
                                → { accessToken, refreshToken }</pre>
      </div>
    </div>
  </div>

  <!-- DOCTORS SECTION -->
  <div style="margin:20px 0 8px"><b style="font-size:11px;font-weight:800;letter-spacing:.08em;text-transform:uppercase;color:var(--brand-emerald)">🌿 Doctors — /api/doctors</b></div>

  <!-- /api/doctors -->
  <div id="d1" class="ac api-card">
    <div class="ach api-card-header" onclick="tog('d1')">
      <span class="mb mg">GET</span>
      <span class="ae">/api/doctors</span>
      <span class="as">Search directory by specialty, rating, fee, language</span>
      <span class="cv">▶</span>
    </div>
    <div class="acb api-card-body">
      <div class="tabs">
        <button class="tab active" onclick="swt(this,'d1','s')">Schema</button>
        <button class="tab" onclick="swt(this,'d1','t')">Try It</button>
      </div>
      <div id="d1-s">
        <div class="tw">
          <table>
            <thead><tr><th>Param</th><th>Type</th><th>Description</th></tr></thead>
            <tbody>
              <tr><td>specialty</td><td>string</td><td>Filter by specialty (e.g. Panchakarma, Kayachikitsa)</td></tr>
              <tr><td>minRating</td><td>0-5 float</td><td>Minimum doctor rating threshold</td></tr>
              <tr><td>maxFee</td><td>number</td><td>Maximum consultation fee (INR)</td></tr>
              <tr><td>languages</td><td>CSV string</td><td>Comma-separated spoken languages</td></tr>
              <tr><td>page / limit</td><td>integer</td><td>Pagination control (default: 1 / 10)</td></tr>
              <tr><td>sortBy</td><td>string</td><td>Sort order: rating | fee | experience</td></tr>
            </tbody>
          </table>
        </div>
      </div>
      <div id="d1-t" style="display:none">
        <div class="tp2">
          <div class="tl">🚀 Live Console</div>
          <div class="fg"><label class="fl">Specialty Filter</label><input class="inp" id="dl-sp" placeholder="e.g. Panchakarma" /></div>
          <div class="fg"><label class="fl">Minimum Rating</label><input class="inp" id="dl-rt" type="number" placeholder="4.5" min="0" max="5" step="0.1" /></div>
          <button class="btn bgo" onclick="tryDr()">Send Request</button>
          <div id="dl-rs" class="rbox" style="margin-top:12px;display:none"></div>
        </div>
      </div>
    </div>
  </div>

  <!-- /api/doctors/:id/slots -->
  <div id="d2" class="ac api-card">
    <div class="ach api-card-header" onclick="tog('d2')">
      <span class="mb mg">GET</span>
      <span class="ae">/api/doctors/:id/slots</span>
      <span class="as">Retrieve bookable time slots for doctor</span>
      <span class="cv">▶</span>
    </div>
    <div class="acb api-card-body">
      <div class="cb">
        <div class="ch"><span class="cl">CURL</span><button class="cpb" onclick="cpc(this)">Copy</button></div>
        <pre><span class="m2">curl</span> http://localhost:3000/api/doctors/&lt;doctor_uuid&gt;/slots?from=2026-11-01</pre>
      </div>
    </div>
  </div>

  <div id="d3" class="ac api-card">
    <div class="ach api-card-header" onclick="tog('d3')">
      <span class="mb mp">POST</span>
      <span class="ae">/api/doctors/:id/slots</span>
      <span class="as">Publish availability slot (Doctor role)</span>
      <span class="cv">▶</span>
    </div>
    <div class="acb api-card-body">
      <div class="cb">
        <div class="ch"><span class="cl">CURL</span><button class="cpb" onclick="cpc(this)">Copy</button></div>
        <pre><span class="m2">curl</span> -X POST http://localhost:3000/api/doctors/&lt;id&gt;/slots \
  <span class="hd">-H "Authorization: Bearer &lt;doctor_token&gt;"</span> \
  -d '{"startTime":"2026-11-01T10:00:00Z","endTime":"2026-11-01T11:00:00Z","consultationType":"VIDEO"}'</pre>
      </div>
    </div>
  </div>

  <!-- CONSULTATIONS SECTION -->
  <div style="margin:20px 0 8px"><b style="font-size:11px;font-weight:800;letter-spacing:.08em;text-transform:uppercase;color:var(--brand-blue)">📋 Consultations — /api/consultations</b></div>

  <div id="c1" class="ac api-card">
    <div class="ach api-card-header" onclick="tog('c1')">
      <span class="mb mg">GET</span>
      <span class="ae">/api/consultations</span>
      <span class="as">List consultations for patient or doctor</span>
      <span class="cv">▶</span>
    </div>
    <div class="acb api-card-body">
      <div class="cb">
        <div class="ch"><span class="cl">CURL</span><button class="cpb" onclick="cpc(this)">Copy</button></div>
        <pre><span class="m2">curl</span> http://localhost:3000/api/consultations?page=1 \
  <span class="hd">-H "Authorization: Bearer &lt;token&gt;"</span></pre>
      </div>
    </div>
  </div>

  <div id="c2" class="ac api-card">
    <div class="ach api-card-header" onclick="tog('c2')">
      <span class="mb mp">POST</span>
      <span class="ae">/api/consultations</span>
      <span class="as">Book consultation — Idempotency-Key required</span>
      <span class="cv">▶</span>
    </div>
    <div class="acb api-card-body">
      <div class="cb">
        <div class="ch"><span class="cl">CURL</span><button class="cpb" onclick="cpc(this)">Copy</button></div>
        <pre><span class="m2">curl</span> -X POST http://localhost:3000/api/consultations \
  <span class="hd">-H "Authorization: Bearer &lt;token&gt;"</span> \
  <span class="hd">-H "Idempotency-Key: 550e8400-e29b-41d4-a716-446655440000"</span> \
  -d '{"doctorId":"uuid","slotId":"uuid","type":"VIDEO"}'</pre>
      </div>
      <p style="font-size:12px;color:var(--text-secondary)">⚠️ Replay of the same <code style="color:var(--brand-gold);font-family:'JetBrains Mono',monospace">Idempotency-Key</code> within 24 hours returns the cached 201 response atomically.</p>
    </div>
  </div>

  <div id="c3" class="ac api-card">
    <div class="ach api-card-header" onclick="tog('c3')">
      <span class="mb mx">PATCH</span>
      <span class="ae">/api/consultations/:id/status</span>
      <span class="as">Update status, clinical diagnosis, and notes</span>
      <span class="cv">▶</span>
    </div>
    <div class="acb api-card-body">
      <div class="cb">
        <div class="ch"><span class="cl">CURL</span><button class="cpb" onclick="cpc(this)">Copy</button></div>
        <pre><span class="m2">curl</span> -X PATCH http://localhost:3000/api/consultations/&lt;id&gt;/status \
  <span class="hd">-H "Authorization: Bearer &lt;doctor_token&gt;"</span> \
  -d '{"status":"COMPLETED","diagnosis":"Vata-Pitta imbalance","notes":"Prescribed Shirodhara & Triphala"}'</pre>
      </div>
    </div>
  </div>

  <!-- RX & PAYMENTS -->
  <div style="margin:20px 0 8px"><b style="font-size:11px;font-weight:800;letter-spacing:.08em;text-transform:uppercase;color:var(--brand-purple)">💊 Rx &amp; 💳 Payments</b></div>

  <div id="p1" class="ac api-card">
    <div class="ach api-card-header" onclick="tog('p1')">
      <span class="mb mp">POST</span>
      <span class="ae">/api/prescriptions</span>
      <span class="as">Issue structured Ayurvedic prescription</span>
      <span class="cv">▶</span>
    </div>
    <div class="acb api-card-body">
      <div class="cb">
        <div class="ch"><span class="cl">CURL</span><button class="cpb" onclick="cpc(this)">Copy</button></div>
        <pre><span class="m2">curl</span> -X POST http://localhost:3000/api/prescriptions \
  <span class="hd">-H "Authorization: Bearer &lt;doctor_token&gt;"</span> \
  -d '{"consultationId":"uuid","medication":"Amrutam Brainkey Gold Malt","dosage":"10g","frequency":"Twice daily","duration":"30 days","instructions":"After meals with warm milk"}'</pre>
      </div>
    </div>
  </div>

  <div id="p2" class="ac api-card">
    <div class="ach api-card-header" onclick="tog('p2')">
      <span class="mb mp">POST</span>
      <span class="ae">/api/payments</span>
      <span class="as">Initiate consultation fee payment (Razorpay-ready)</span>
      <span class="cv">▶</span>
    </div>
    <div class="acb api-card-body">
      <div class="cb">
        <div class="ch"><span class="cl">CURL</span><button class="cpb" onclick="cpc(this)">Copy</button></div>
        <pre><span class="m2">curl</span> -X POST http://localhost:3000/api/payments \
  <span class="hd">-H "Authorization: Bearer &lt;token&gt;"</span> \
  <span class="hd">-H "Idempotency-Key: &lt;uuid&gt;"</span> \
  -d '{"consultationId":"uuid","amount":750,"currency":"INR"}'</pre>
      </div>
    </div>
  </div>

  <!-- ADMIN & AUDIT -->
  <div style="margin:20px 0 8px"><b style="font-size:11px;font-weight:800;letter-spacing:.08em;text-transform:uppercase;color:var(--brand-red)">🛡️ Admin — /api/admin</b></div>

  <div id="a1" class="ac api-card">
    <div class="ach api-card-header" onclick="tog('a1')">
      <span class="mb mg">GET</span>
      <span class="ae">/api/admin/analytics</span>
      <span class="as">System KPIs — revenue, consultations, retention</span>
      <span class="cv">▶</span>
    </div>
    <div class="acb api-card-body">
      <div class="cb">
        <div class="ch"><span class="cl">CURL</span><button class="cpb" onclick="cpc(this)">Copy</button></div>
        <pre><span class="m2">curl</span> http://localhost:3000/api/admin/analytics?period=month \
  <span class="hd">-H "Authorization: Bearer &lt;admin_token&gt;"</span></pre>
      </div>
    </div>
  </div>

  <div id="a2" class="ac api-card">
    <div class="ach api-card-header" onclick="tog('a2')">
      <span class="mb mg">GET</span>
      <span class="ae">/api/admin/users</span>
      <span class="as">List and filter registered accounts</span>
      <span class="cv">▶</span>
    </div>
    <div class="acb api-card-body">
      <div class="cb">
        <div class="ch"><span class="cl">CURL</span><button class="cpb" onclick="cpc(this)">Copy</button></div>
        <pre><span class="m2">curl</span> http://localhost:3000/api/admin/users?role=DOCTOR \
  <span class="hd">-H "Authorization: Bearer &lt;admin_token&gt;"</span></pre>
      </div>
    </div>
  </div>

  <div id="a3" class="ac api-card">
    <div class="ach api-card-header" onclick="tog('a3')">
      <span class="mb mg">GET</span>
      <span class="ae">/api/admin/audit-logs</span>
      <span class="as">Immutable security compliance audit trail</span>
      <span class="cv">▶</span>
    </div>
    <div class="acb api-card-body">
      <p style="font-size:12px;color:var(--text-secondary);margin-bottom:8px">Tracked Actions: USER_REGISTERED, USER_LOGIN, TOKEN_REFRESHED, MFA_*, CONSULTATION_*, PAYMENT_*, PASSWORD_CHANGED</p>
      <div class="cb">
        <div class="ch"><span class="cl">CURL</span><button class="cpb" onclick="cpc(this)">Copy</button></div>
        <pre><span class="m2">curl</span> http://localhost:3000/api/admin/audit-logs?action=USER_LOGIN \
  <span class="hd">-H "Authorization: Bearer &lt;admin_token&gt;"</span></pre>
      </div>
    </div>
  </div>
</div>

<!-- ════════════════════════════════════════════════════════════
     PAGE 3: ARCHITECTURE
     ════════════════════════════════════════════════════════════ -->
<div class="page" id="page-architecture">
  <div class="sct">🏗️ System Architecture</div>
  <div class="scs">Horizontal scalability, sub-200ms p95 latency, 100k daily consultations</div>

  <div class="ar">
    <div style="text-align:center;margin-bottom:16px">
      <span style="font-size:11px;color:var(--text-muted);letter-spacing:.08em;text-transform:uppercase;font-weight:700">Production Request Pipeline</span>
    </div>
    <div class="nr">
      <div class="nd ndg">Client / Mobile<br><small style="font-size:9.5px;color:var(--text-muted)">Flutter / Web</small></div>
      <div class="arr">→</div>
      <div class="nd ndb">Nginx / ALB<br><small style="font-size:9.5px;color:var(--text-muted)">SSL Termination</small></div>
      <div class="arr">→</div>
      <div class="nd nds">Express API<br><small style="font-size:9.5px;color:var(--text-muted)">Node.js 20 TS</small></div>
    </div>
    <div class="al">Helmet → CORS → Sliding-Window Rate Limiter → Trace ID → JWT Auth → Idempotency → Handler</div>
    <div class="nr">
      <div class="nd ndp">PostgreSQL 15<br><small style="font-size:9.5px;color:var(--text-muted)">Prisma ORM · 8 tables</small></div>
      <div class="arr">↔</div>
      <div class="nd ndg">Redis 7<br><small style="font-size:9.5px;color:var(--text-muted)">Token &amp; Rate Cache</small></div>
      <div class="arr">↔</div>
      <div class="nd ndb">Bull MQ<br><small style="font-size:9.5px;color:var(--text-muted)">Async Jobs &amp; Email</small></div>
    </div>
    <div class="al">Storage &amp; High-Throughput Messaging Layer</div>
    <div class="nr">
      <div class="nd nds">Prometheus<br><small style="font-size:9.5px;color:var(--text-muted)">Metrics Scrape</small></div>
      <div class="arr">→</div>
      <div class="nd ndg">Grafana<br><small style="font-size:9.5px;color:var(--text-muted)">Port 3001 Dashboards</small></div>
      <div class="arr">→</div>
      <div class="nd ndp">Alertmanager<br><small style="font-size:9.5px;color:var(--text-muted)">p95 &gt; 200ms alert</small></div>
    </div>
    <div class="al">End-to-End Observability Stack</div>
  </div>

  <div class="fts">
    <div class="fc">
      <div class="fi2 ig">🗄️</div>
      <div class="ft">PostgreSQL + Prisma</div>
      <div class="fd">8 normalized models, 20+ performance indexes, UUID primary keys, and Prisma transactional isolation.</div>
      <div class="tags"><span class="tag">8 Models</span><span class="tag">Transactions</span></div>
    </div>
    <div class="fc">
      <div class="fi2 ib">⚡</div>
      <div class="ft">Redis + Bull MQ</div>
      <div class="fd">Atomic sliding-window rate limiter with graceful in-memory fallback. Bull MQ queues for background dispatch.</div>
      <div class="tags"><span class="tag">Rate Limiter</span><span class="tag">Bull MQ</span></div>
    </div>
    <div class="fc">
      <div class="fi2 is">🐳</div>
      <div class="ft">Docker + Compose</div>
      <div class="fd">Multi-stage Dockerfile and docker-compose.yml orchestrating API, PostgreSQL, Redis, Prometheus, and Grafana.</div>
      <div class="tags"><span class="tag">Multi-stage</span><span class="tag">5 Services</span></div>
    </div>
    <div class="fc">
      <div class="fi2 ip">🧪</div>
      <div class="ft">Test Automation</div>
      <div class="fd">30 Jest integration tests on EmbeddedPostgres + RedisMemoryServer. 24 Playwright tests covering portal and UI.</div>
      <div class="tags"><span class="tag">Jest 30/30</span><span class="tag">Playwright 24/24</span></div>
    </div>
  </div>

  <div class="ar">
    <div class="sct" style="margin-bottom:12px;font-size:15px">📦 Clean Modular Project Structure</div>
    <div class="cb" style="margin:0">
      <div class="ch"><span class="cl">PROJECT DIRECTORY TREE</span></div>
      <pre>telemedicine-backend/
├── src/
│   ├── app.ts             <span class="cm">← Express application &amp; middleware chain</span>
│   ├── server.ts          <span class="cm">← HTTP bootstrap &amp; graceful shutdown</span>
│   ├── modules/
│   │   ├── auth/          <span class="cm">← JWT · TOTP MFA · token rotation</span>
│   │   ├── doctors/       <span class="cm">← Directory · availability slots · search</span>
│   │   ├── consultations/ <span class="cm">← Booking · lifecycle · clinical notes</span>
│   │   ├── prescriptions/ <span class="cm">← Ayurvedic Rx issuance &amp; lookup</span>
│   │   ├── payments/      <span class="cm">← Razorpay webhooks &amp; refunds</span>
│   │   └── admin/         <span class="cm">← Analytics · users · audit-logs</span>
│   └── shared/
│       ├── middleware/    <span class="cm">← auth · rateLimiter · idempotency · validation</span>
│       ├── observability/ <span class="cm">← Prometheus metrics · Pino logging · tracing</span>
│       ├── security/      <span class="cm">← AES-256-GCM encryption · bcrypt password</span>
│       └── jobs/          <span class="cm">← Bull MQ background processing</span>
├── tests/                 <span class="cm">← Jest integration (30) + Playwright E2E (24)</span>
├── prisma/                <span class="cm">← Schema definition &amp; SQL migrations</span>
├── docs/                  <span class="cm">← OpenAPI 3.0 specs &amp; video walkthrough script</span>
└── public/index.html      <span class="cm">← Responsive Dark/Light Developer Portal</span></pre>
    </div>
  </div>
</div>

<!-- ════════════════════════════════════════════════════════════
     PAGE 4: QUICK START
     ════════════════════════════════════════════════════════════ -->
<div class="page" id="page-quickstart">
  <div class="sct">🚀 Quick Start Guide</div>
  <div class="scs">Launch the complete stack in under 3 minutes</div>

  <div class="ar">
    <div class="sct" style="margin-bottom:10px;font-size:15px">Option 1 — Docker Compose (Zero Configuration)</div>
    <div class="cb">
      <div class="ch"><span class="cl">SHELL</span><button class="cpb" onclick="cpc(this)">Copy</button></div>
      <pre><span class="cm"># 1. Clone repository</span>
git clone https://github.com/Vijay-1807/Amrutam-Pharmaceuticals.git
cd Amrutam-Pharmaceuticals/telemedicine-backend

<span class="cm"># 2. Launch all 5 containers</span>
cp .env.example .env
docker-compose up -d

<span class="cm"># 3. Seed demo accounts &amp; doctors</span>
docker exec -it telemedicine-backend npm run seed</pre>
    </div>
  </div>

  <div class="ar">
    <div class="sct" style="margin-bottom:10px;font-size:15px">Option 2 — Local Node.js Development</div>
    <div class="cb">
      <div class="ch"><span class="cl">SHELL</span><button class="cpb" onclick="cpc(this)">Copy</button></div>
      <pre><span class="cm"># Prerequisites: Node.js 20+, PostgreSQL 15, Redis 7</span>
npm install
npm run prisma:migrate &amp;&amp; npm run seed
npm run dev                        <span class="cm"># Serves on http://localhost:3000</span>

<span class="cm"># Run automated verification</span>
npm test                           <span class="cm"># Jest: 30/30 suites passing</span>
npm run test:playwright            <span class="cm"># Playwright: 24/24 tests passing</span></pre>
    </div>
  </div>

  <div class="ar">
    <div class="sct" style="margin-bottom:12px;font-size:15px">🔑 Pre-Seeded Demo Credentials</div>
    <div class="tw">
      <table>
        <thead><tr><th>Role</th><th>Email</th><th>Password</th></tr></thead>
        <tbody>
          <tr><td>ADMIN</td><td>admin@amrutam.co.in</td><td>Admin@123456</td></tr>
          <tr><td>PATIENT</td><td>patient@amrutam.co.in</td><td>Patient@123456</td></tr>
          <tr><td>DOCTOR</td><td>dr.ananya@amrutam.co.in</td><td>Doctor@123456</td></tr>
          <tr><td>DOCTOR</td><td>dr.rajesh@amrutam.co.in</td><td>Doctor@123456</td></tr>
          <tr><td>DOCTOR</td><td>dr.priya@amrutam.co.in</td><td>Doctor@123456</td></tr>
          <tr><td>DOCTOR</td><td>dr.vikram@amrutam.co.in</td><td>Doctor@123456</td></tr>
        </tbody>
      </table>
    </div>
  </div>

  <div class="ar">
    <div class="sct" style="margin-bottom:12px;font-size:15px">🌐 Service Endpoints</div>
    <div class="tw">
      <table>
        <thead><tr><th>Service</th><th>URL</th></tr></thead>
        <tbody>
          <tr><td>Developer Portal</td><td>http://localhost:3000 or http://localhost:3000/portal</td></tr>
          <tr><td>Prometheus Metrics</td><td>http://localhost:3000/metrics</td></tr>
          <tr><td>OpenAPI 3.0 JSON</td><td>http://localhost:3000/api/openapi.json</td></tr>
          <tr><td>Grafana Dashboard</td><td>http://localhost:3001 (default: admin / admin)</td></tr>
          <tr><td>Prometheus Server</td><td>http://localhost:9090</td></tr>
        </tbody>
      </table>
    </div>
  </div>
</div>

<!-- Footer -->
<div class="ftr">
  <div>🌿 <strong>Amrutam Telemedicine API</strong> · Production Ready v1.0.0</div>
  <div>TypeScript · Express · PostgreSQL · Redis · Prisma · Prometheus · 54 Automated Tests Passing ✅</div>
</div>

</main>
</div>

<!-- Toast Popup -->
<div class="toast" id="toast"></div>

<!-- ════════════════════════════════════════════════════════════
     PORTAL INTERACTIVE SCRIPT
     ════════════════════════════════════════════════════════════ -->
<script>
const BASE = window.location.origin;
let _tok = null;

// Page Navigation
function pg(name, el) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  const target = document.getElementById('page-' + name);
  if (target) target.classList.add('active');

  // Desktop links
  document.querySelectorAll('.nl').forEach(l => l.classList.remove('active'));
  if (el && el.classList.contains('nl')) el.classList.add('active');
  const desktopBtn = document.getElementById('n-' + (name === 'overview' ? 'ov' : name === 'explorer' ? 'ex' : name === 'architecture' ? 'ar' : 'qs'));
  if (desktopBtn) desktopBtn.classList.add('active');

  // Mobile dock
  document.querySelectorAll('.mn-item').forEach(m => m.classList.remove('active'));
  const mobileBtn = document.getElementById('m-' + (name === 'overview' ? 'ov' : name === 'explorer' ? 'ex' : name === 'architecture' ? 'ar' : 'qs'));
  if (mobileBtn) mobileBtn.classList.add('active');

  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function jmp(id) {
  pg('explorer', document.getElementById('n-ex'));
  setTimeout(() => {
    const el = document.getElementById(id) || (id === 'r1' ? document.getElementById('register') : null);
    if (!el) return;
    el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    el.classList.add('exp');
  }, 100);
}

function tog(id) {
  const el = document.getElementById(id);
  if (el) el.classList.toggle('exp');
}

function swt(btn, cId, t) {
  const body = btn.closest('.acb');
  body.querySelectorAll('.tab').forEach(x => x.classList.remove('active'));
  btn.classList.add('active');
  const s = document.getElementById(cId + '-s');
  const tr = document.getElementById(cId + '-t');
  if (s) s.style.display = t === 's' ? 'block' : 'none';
  if (tr) tr.style.display = t === 't' ? 'block' : 'none';
}

function cpc(btn) {
  const pre = btn.closest('.cb').querySelector('pre');
  navigator.clipboard.writeText(pre.innerText).then(() => {
    btn.textContent = '✓ Copied';
    btn.classList.add('done');
    setTimeout(() => {
      btn.textContent = 'Copy';
      btn.classList.remove('done');
    }, 2000);
  });
}

function toast(msg, type = '') {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.className = 'toast show ' + type;
  setTimeout(() => t.classList.remove('show'), 3000);
}

function rRes(el, status, data) {
  const ok = status >= 200 && status < 300;
  el.style.display = 'block';
  el.innerHTML = '<div class="rs ' + (ok ? 'ok' : 'er') + '"><span class="dot"></span>' + status + ' ' + (ok ? 'OK' : 'Error') + '</div><div class="rbox">' + JSON.stringify(data, null, 2) + '</div>';
}

// ════════════════════════════════════════════════════════════
// THEME SWITCHER (Dark & Light Theme)
// ════════════════════════════════════════════════════════════
function toggleTheme() {
  const current = document.documentElement.getAttribute('data-theme') === 'light' ? 'light' : 'dark';
  const next = current === 'light' ? 'dark' : 'light';
  document.documentElement.setAttribute('data-theme', next);
  try { localStorage.setItem('amrutam_theme', next); } catch (e) {}
  updateThemeUI(next);
  toast((next === 'light' ? '☀️ Light' : '🌙 Dark') + ' theme enabled');
}

function updateThemeUI(theme) {
  const btn = document.getElementById('theme-btn');
  if (btn) {
    btn.textContent = theme === 'light' ? '☀️' : '🌙';
    btn.title = theme === 'light' ? 'Switch to Dark Theme' : 'Switch to Light Theme';
  }
  const metaTheme = document.getElementById('meta-theme-color');
  if (metaTheme) {
    metaTheme.setAttribute('content', theme === 'light' ? '#f8fafc' : '#0a0e14');
  }
}

// ════════════════════════════════════════════════════════════
// PROBES & LIVE TESTING
// ════════════════════════════════════════════════════════════
async function probeH() {
  const el = document.getElementById('healthResult') || document.getElementById('hlth');
  if (el) {
    el.style.display = 'block';
    el.style.color = 'var(--text-muted)';
    el.style.fontStyle = 'italic';
    el.textContent = 'Probing /health...';
  }
  try {
    const r = await fetch(BASE + '/health');
    const d = await r.json();
    if (el) {
      el.style.color = 'var(--brand-emerald)';
      el.style.fontStyle = 'normal';
      el.textContent = JSON.stringify(d, null, 2);
    }
    const dot = document.getElementById('ldot');
    if (dot) {
      dot.style.opacity = '1';
      dot.style.animation = 'pulse 2s infinite';
    }
    toast('System is healthy', 'ok');
  } catch (e) {
    if (el) {
      el.style.color = 'var(--brand-red)';
      el.style.fontStyle = 'normal';
      el.textContent = 'Connection refused — verify server is running on port 3000';
    }
    toast('Server unreachable');
  }
}

async function probeR() {
  const el = document.getElementById('healthResult');
  if (!el) return;
  el.style.display = 'block';
  el.style.color = 'var(--text-muted)';
  el.textContent = 'Probing /ready...';
  try {
    const r = await fetch(BASE + '/ready');
    const d = await r.json();
    el.style.color = r.ok ? 'var(--brand-emerald)' : 'var(--brand-red)';
    el.textContent = JSON.stringify(d, null, 2);
  } catch (e) {
    el.style.color = 'var(--brand-red)';
    el.textContent = e.message;
  }
}

async function probeM() {
  const el = document.getElementById('healthResult');
  if (!el) return;
  el.style.display = 'block';
  el.style.color = 'var(--text-muted)';
  el.textContent = 'Probing /metrics...';
  try {
    const r = await fetch(BASE + '/metrics');
    const t = await r.text();
    el.style.color = 'var(--text-primary)';
    el.textContent = t.slice(0, 950) + (t.length > 950 ? '\\n... (view /metrics for complete Prometheus metrics)' : '');
  } catch (e) {
    el.style.color = 'var(--brand-red)';
    el.textContent = e.message;
  }
}

async function tryReg() {
  const el = document.getElementById('reg-result');
  if (el) {
    el.style.display = 'block';
    el.innerHTML = '<span class="rs ld">Registering user...</span>';
  }
  try {
    const email = document.getElementById('reg-email')?.value || ('patient_' + Date.now() + '@example.com');
    const password = document.getElementById('re-pw')?.value || 'Sup3rSecret!pass';
    const firstName = document.getElementById('re-fn')?.value || 'Aarav';
    const lastName = document.getElementById('re-ln')?.value || 'Mehta';
    const r = await fetch(BASE + '/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, firstName, lastName, role: 'PATIENT' })
    });
    const d = await r.json();
    if (d.data && d.data.accessToken) {
      _tok = d.data.accessToken;
      toast('Registered successfully — session saved!', 'ok');
    }
    rRes(el, r.status, d);
  } catch (e) {
    if (el) el.innerHTML = '<div class="rbox" style="color:var(--brand-red)">' + e.message + '</div>';
  }
}

async function tryLogin() {
  const el = document.getElementById('li-rs');
  if (el) {
    el.style.display = 'block';
    el.innerHTML = '<span class="rs ld">Authenticating...</span>';
  }
  try {
    const r = await fetch(BASE + '/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: document.getElementById('li-em').value,
        password: document.getElementById('li-pw').value
      })
    });
    const d = await r.json();
    if (d.data && d.data.accessToken) {
      _tok = d.data.accessToken;
      toast('Login successful — token saved!', 'ok');
    }
    rRes(el, r.status, d);
  } catch (e) {
    if (el) el.innerHTML = '<div class="rbox" style="color:var(--brand-red)">' + e.message + '</div>';
  }
}

async function tryDr() {
  const el = document.getElementById('dl-rs');
  if (el) {
    el.style.display = 'block';
    el.innerHTML = '<span class="rs ld">Searching doctors...</span>';
  }
  let url = BASE + '/api/doctors?page=1&limit=5';
  const sp = document.getElementById('dl-sp').value;
  const rt = document.getElementById('dl-rt').value;
  if (sp) url += '&specialty=' + encodeURIComponent(sp);
  if (rt) url += '&minRating=' + rt;
  try {
    const r = await fetch(url);
    const d = await r.json();
    rRes(el, r.status, d);
  } catch (e) {
    if (el) el.innerHTML = '<div class="rbox" style="color:var(--brand-red)">' + e.message + '</div>';
  }
}

// Initialize on page load
window.addEventListener('load', async () => {
  const currentTheme = document.documentElement.getAttribute('data-theme') || 'dark';
  updateThemeUI(currentTheme);
  try {
    const r = await fetch(BASE + '/health', { signal: AbortSignal.timeout(2500) });
    if (r.ok) {
      const dot = document.getElementById('ldot');
      if (dot) {
        dot.style.opacity = '1';
        dot.style.animation = 'pulse 2s infinite';
      }
    }
  } catch {}
});
</script>
</body>
</html>`;

const outPath = path.join(__dirname, '../public/index.html');
fs.writeFileSync(outPath, html, 'utf8');
console.log('Portal generated successfully at:', outPath, `(${html.length} bytes)`);
