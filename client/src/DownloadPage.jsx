import React from 'react';

const DownloadPage = () => {
  // 🔴 替换成你第一步里复制的 GitHub APK 链接
  const apkUrl = "https://github.com/lizhiyong41/campus-quest/releases/download/v1.0.0/CampusQuest.apk";

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        {/* 标题部分 */}
        <h1 style={styles.title}>Campus Quest</h1>
        <p style={styles.subtitle}>校园互助，一键触达</p>
        
        {/* LOGO (如果有的话，没有就用文字代替) */}
        <div style={styles.iconPlaceholder}>🚀</div>

        {/* 核心介绍 */}
        <div style={styles.features}>
          <p>✅ 跑腿代购更轻松</p>
          <p>✅ 闲置交易更安全</p>
          <p>✅ 校园生活更便捷</p>
        </div>

        {/* 下载按钮区域 */}
        <div style={styles.actionArea}>
          {/* 安卓下载按钮 */}
          <a href={apkUrl} style={styles.downloadBtn}>
            🤖 Android 下载安装包
          </a>
          <p style={styles.tip}>* 小米/华为手机安装时请允许“未知来源”</p>

          <hr style={{margin: '20px 0', opacity: 0.2}}/>

          {/* iOS 指引 */}
          <div style={styles.iosGuide}>
            <h3>🍎 iOS / 网页版用户</h3>
            <p>无需安装，直接使用：</p>
            <p style={{fontSize: '14px', color: '#666'}}>
              1. 使用 Safari 浏览器打开<br/>
              2. 点击底部中间的 <span style={{fontSize:'18px'}}>share</span> 分享按钮<br/>
              3. 选择 <strong>"添加到主屏幕"</strong>
            </p>
            <button onClick={() => window.location.href = '/'} style={styles.webBtn}>
              直接进入网页版 &rarr;
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// 简单的内联样式，确保手机上好看
const styles = {
  container: {
    minHeight: '100vh',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    padding: '20px',
    fontFamily: 'sans-serif',
  },
  card: {
    background: 'white',
    padding: '40px 30px',
    borderRadius: '20px',
    boxShadow: '0 10px 25px rgba(0,0,0,0.2)',
    textAlign: 'center',
    maxWidth: '400px',
    width: '100%',
  },
  title: { margin: '0 0 10px 0', color: '#333' },
  subtitle: { margin: '0 0 30px 0', color: '#666' },
  iconPlaceholder: { fontSize: '60px', marginBottom: '20px' },
  features: { textAlign: 'left', background: '#f5f7fa', padding: '15px', borderRadius: '10px', marginBottom: '25px', lineHeight: '1.8' },
  downloadBtn: {
    display: 'block',
    width: '100%',
    padding: '15px',
    background: '#00d2ff',
    color: 'white',
    textDecoration: 'none',
    borderRadius: '10px',
    fontWeight: 'bold',
    boxShadow: '0 4px 15px rgba(0,210,255,0.4)',
    marginBottom: '10px',
  },
  webBtn: {
    width: '100%',
    padding: '12px',
    background: 'transparent',
    border: '2px solid #764ba2',
    color: '#764ba2',
    borderRadius: '10px',
    marginTop: '10px',
    cursor: 'pointer',
    fontWeight: 'bold',
  },
  tip: { fontSize: '12px', color: '#999', marginTop: '5px' },
  iosGuide: { textAlign: 'left', color: '#444' }
};

export default DownloadPage;