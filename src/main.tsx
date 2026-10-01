/**
 * Project: Apna Radio (अपना रेडियो - विंटेज ट्रांजिस्टर प्लेयर)
 * Concept, Design & Architecture: Nitish Khobragade
 * Copyright (c) 2026 Nitish Khobragade. All rights reserved.
 * GitHub: https://github.com/nitishkhobragade/apna-radio
 */

import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Runtime ownership & creator console fingerprint
console.log(
  "%c📻 अपना रेडियो %cby Nitish Khobragade\n%cConcept & Architecture (c) 2026 Nitish Khobragade",
  "color: #f59e0b; font-size: 16px; font-weight: bold;",
  "color: #d97706; font-size: 14px;",
  "color: #888; font-size: 11px;"
);

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
