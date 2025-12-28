import React from 'react'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

// 👇👇👇【关键】引入路由容器 👇👇👇
import { BrowserRouter } from 'react-router-dom'

// 1. 引入 Sentry
import * as Sentry from "@sentry/react";

// 2. 初始化 Sentry
Sentry.init({
  dsn: "https://b9ce0823be3894b7d4774c2727ac22d4@o4510600053522432.ingest.us.sentry.io/4510600058699776", 
  integrations: [
    Sentry.browserTracingIntegration(),
    Sentry.replayIntegration(),
  ],
  tracesSampleRate: 1.0, 
  replaysSessionSampleRate: 0.1, 
  replaysOnErrorSampleRate: 1.0, 
});

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <Sentry.ErrorBoundary fallback={<div style={{padding:'50px', textAlign:'center'}}><h2>🚫 页面出错了</h2><p>我们需要刷新一下...</p></div>}>
      
      {/* 👇👇👇【关键】必须用 BrowserRouter 包裹住 App 👇👇👇 */}
      <BrowserRouter>
        <App />
      </BrowserRouter>

    </Sentry.ErrorBoundary>
  </StrictMode>,
)