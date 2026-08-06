import React from 'react';
import ReactDOM from 'react-dom/client';
import {BrowserRouter} from 'react-router-dom';
import {PolarisVizProvider} from '@shopify/polaris-viz';

import '@shopify/polaris-viz/build/esm/styles.css';

import Shell from './Shell';

/**
 * Entry của HARNESS mockup — không phải file của app thật.
 *
 * App thật (Remix / React Router template) có `app/root.tsx` + `app/entry.client.tsx`
 * riêng do Shopify CLI scaffold. File này chỉ để chạy mockup trên localhost:3100.
 *
 * Chú ý KHÔNG có AppProvider của Polaris — web components không cần provider,
 * chúng là custom element global do polaris.js định nghĩa (xem index.html).
 * PolarisVizProvider vẫn cần vì polaris-viz là thư viện React.
 */
ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter future={{v7_startTransition: true, v7_relativeSplatPath: true}}>
      <PolarisVizProvider>
        <Shell />
      </PolarisVizProvider>
    </BrowserRouter>
  </React.StrictMode>,
);
