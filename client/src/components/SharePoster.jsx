import { useState, useRef } from 'react';
import QRCode from 'qrcode';

const SharePoster = ({ onClose }) => {
  const [posterUrl, setPosterUrl] = useState(null);
  const [isGenerating, setIsGenerating] = useState(true);
  const canvasRef = useRef(null);

  // 配置项：你要分享的网址 (换成你自己的!)
  const SHARE_URL = 'https://www.campus-quest.top';

  // 核心：开始绘制海报
  const generatePoster = async () => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');

    // 1. 设置画布尺寸 (高清海报分辨率: 1080x1920)
    const width = 1080;
    const height = 1920;
    canvas.width = width;
    canvas.height = height;

    // --- 🎨 开始绘画 ---

    // 2. 绘制背景 (蓝紫色渐变)
    const gradient = ctx.createLinearGradient(0, 0, width, height);
    gradient.addColorStop(0, '#4facfe'); // 顶部浅蓝
    gradient.addColorStop(1, '#00f2fe'); // 底部青蓝
    // 你也可以换成其他喜欢的颜色，例如紫到粉：'#a18cd1' -> '#fbc2eb'
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);

    // 3. 绘制装饰圆环 (增加设计感)
    ctx.beginPath();
    ctx.arc(width / 2, height / 2 - 100, 500, 0, 2 * Math.PI);
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
    ctx.lineWidth = 40;
    ctx.stroke();

    // 4. 绘制大标题
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'center';
    ctx.font = 'bold 120px sans-serif';
    ctx.fillText('医大集市', width / 2, 400);

    // 5. 绘制副标题/口号
    ctx.font = '50px sans-serif';
    ctx.fillText('校园闲置 · 求购互助 · 安全便捷', width / 2, 500);

    // 6. 绘制二维码区域的白色底框
    const qrBgSize = 600;
    const qrBgX = (width - qrBgSize) / 2;
    const qrBgY = 700;
    ctx.fillStyle = '#ffffff';
    // 画圆角矩形底框
    roundRect(ctx, qrBgX, qrBgY, qrBgSize, qrBgSize, 40);
    ctx.fill();
    // 加个阴影让它浮起来
    ctx.shadowColor = 'rgba(0, 0, 0, 0.2)';
    ctx.shadowBlur = 30;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 15;
    ctx.fill();
    ctx.shadowColor = 'transparent'; // 清除阴影设置

    // 7. 生成并绘制二维码
    try {
      // 生成二维码 Data URL
      const qrDataUrl = await QRCode.toDataURL(SHARE_URL, {
        errorCorrectionLevel: 'H', // 高容错率
        margin: 1,
        width: 500, // 二维码尺寸
        color: {
          dark: '#333333', // 二维码颜色
          light: '#ffffff00' // 背景透明
        }
      });

      // 加载二维码图片并绘制
      const qrImg = new Image();
      qrImg.src = qrDataUrl;
      await new Promise((resolve) => { qrImg.onload = resolve; });
      // 把二维码画在白色底框中间
      ctx.drawImage(qrImg, (width - 500) / 2, qrBgY + 50);

    } catch (err) {
      console.error('二维码生成失败', err);
    }

    // 8. 绘制底部引导文字
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 60px sans-serif';
    ctx.fillText('长按识别二维码', width / 2, qrBgY + qrBgSize + 150);
    ctx.font = '40px sans-serif';
    ctx.fillText('进入你的校园专属集市', width / 2, qrBgY + qrBgSize + 230);

    // --- ✅ 绘画结束 ---

    // 9. 将 Canvas 导出为图片并显示
    setPosterUrl(canvas.toDataURL('image/png'));
    setIsGenerating(false);
  };

  // 用于画圆角矩形的辅助函数
  function roundRect(ctx, x, y, width, height, radius) {
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + width - radius, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
    ctx.lineTo(x + width, y + height - radius);
    ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
    ctx.lineTo(x + radius, y + height);
    ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
    ctx.lineTo(x, y + radius);
    ctx.quadraticCurveTo(x, y, x + radius, y);
    ctx.closePath();
  }

  // 组件挂载后立即开始绘图
  useState(() => {
    // 用 setTimeout 确保 Canvas 元素已挂载
    setTimeout(generatePoster, 100);
  }, []);

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.8)', zIndex: 2000,
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center'
    }}>
      {/* 用于绘图的 Canvas (隐藏起来不给人看) */}
      <canvas ref={canvasRef} style={{ display: 'none' }} />

      {isGenerating ? (
        <div style={{ color: 'white', fontSize: '20px' }}>🎨 正在绘制精美海报...</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '20px', animation: 'fadeIn 0.5s' }}>
          {/* 展示生成的图片 */}
          <img 
            src={posterUrl} 
            alt="分享海报" 
            style={{ width: '80%', maxWidth: '400px', borderRadius: '12px', boxShadow: '0 10px 30px rgba(0,0,0,0.5)' }} 
          />
          <p style={{ color: '#fff', fontSize: '16px', opacity: 0.8 }}>✨ 长按图片保存到相册，或发送给朋友 ✨</p>
          {/* 关闭按钮 */}
          <button 
            onClick={onClose}
            style={{
              padding: '10px 30px', borderRadius: '30px', border: '1px solid rgba(255,255,255,0.5)',
              background: 'none', color: 'white', cursor: 'pointer'
            }}
          >
            关闭
          </button>
        </div>
      )}
    </div>
  );
};

export default SharePoster;