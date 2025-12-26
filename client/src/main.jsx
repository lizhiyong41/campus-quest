import React from 'react' // 👈 补上这个，虽然新版React不强求，但Sentry有时候需要
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

// 1. 引入 Sentry
import * as Sentry from "@sentry/react";

// 2. 初始化 Sentry (开机！)
Sentry.init({
  // 👇👇👇 请务必去 Sentry 后台复制你的【前端 DSN】填在这里 👇👇👇
  // 位置：Sentry后台 -> Projects -> javascript-react -> Settings -> Client Keys (DSN)
  dsn: "https://b9ce0823be3894b7d4774c2727ac22d4@o4510600053522432.ingest.us.sentry.io/4510600058699776", 

  integrations: [
    Sentry.browserTracingIntegration(),
    Sentry.replayIntegration(),
  ],

  // 性能监控采样率 (1.0 = 100% 采集，生产环境建议 0.1)
  tracesSampleRate: 1.0, 

  // 录屏采样率 (调试时设为 1.0，生产环境建议 0.1 或 0)
  replaysSessionSampleRate: 0.1, 
  replaysOnErrorSampleRate: 1.0, 
});

createRoot(document.getElementById('root')).render(
  <StrictMode>
    {/* 3. 添加错误边界，这样崩了之后能显示友好的提示，而不是白屏 */}
    <Sentry.ErrorBoundary fallback={<div style={{padding:'50px', textAlign:'center'}}><h2>🚫 页面出错了</h2><p>我们需要刷新一下...</p></div>}>
      <App />
    </Sentry.ErrorBoundary>
  </StrictMode>,
)