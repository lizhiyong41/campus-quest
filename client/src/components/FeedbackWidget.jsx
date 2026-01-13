import { useState } from 'react';
import { supabase } from '../supabase'; // 确保路径对，根据你文件位置调整

const FeedbackWidget = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [content, setContent] = useState('');
  const [contact, setContact] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState(''); // 提示信息

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!content.trim()) return;

    setIsSubmitting(true);
    
    // 获取当前用户（如果有的话）
    const { data: { user } } = await supabase.auth.getUser();

    const { error } = await supabase
      .from('feedback')
      .insert([
        { 
          content: content, 
          contact_info: contact,
          user_id: user ? user.id : null // 如果没登录就是 null
        }
      ]);

    setIsSubmitting(false);

    if (error) {
      setMessage('发送失败，请稍后再试 😭');
      console.error(error);
    } else {
      setMessage('收到啦！感谢你的建议 ❤️');
      setContent('');
      setContact('');
      // 2秒后自动关闭
      setTimeout(() => {
        setIsOpen(false);
        setMessage('');
      }, 2000);
    }
  };

  return (
    <div style={{ position: 'fixed', bottom: '20px', right: '20px', zIndex: 1000 }}>
      {/* 1. 悬浮按钮 (平时显示的那个图标) */}
      {!isOpen && (
        <button
  onClick={() => setIsOpen(true)}
  style={{
    // ---👇 核心修改位置开始 👇---
    position: 'fixed',           // 1. 让它悬浮在屏幕上
    right: '20px',               // 2. 靠右距离
    bottom: '100px',             // 3. 靠底距离 (设置 100px 足够高，避开黑条和底部菜单)
    zIndex: 9999,                // 4. 确保层级最高，不被其他内容盖住
    // ---👆 核心修改位置结束 👆---

    backgroundColor: '#3b82f6', 
    color: 'white',
    border: 'none',
    borderRadius: '50px',
    padding: '12px 20px',
    boxShadow: '0 4px 6px rgba(0,0,0,0.3)', // 稍微加深一点阴影，更有悬浮感
    cursor: 'pointer',
    fontWeight: 'bold',
    display: 'flex',
    alignItems: 'center',
    gap: '8px'
  }}
>
  <span>📩</span> 提意见
</button>
      )}

      {/* 2. 弹出的输入框表单 */}
      {isOpen && (
        <div style={{
          backgroundColor: 'white',
          padding: '20px',
          borderRadius: '12px',
          boxShadow: '0 10px 25px rgba(0,0,0,0.2)',
          width: '300px',
          display: 'flex',
          flexDirection: 'column',
          gap: '10px',
          border: '1px solid #eee'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '5px' }}>
            <h3 style={{ margin: 0, fontSize: '16px' }}>📬 意见箱</h3>
            <button 
              onClick={() => setIsOpen(false)}
              style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '18px', color: '#888' }}
            >
              ×
            </button>
          </div>

          {message ? (
            <div style={{ padding: '20px 0', textAlign: 'center', color: '#10b981', fontWeight: 'bold' }}>
              {message}
            </div>
          ) : (
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <textarea
                placeholder="遇到Bug了？还是有什么新想法？告诉我吧..."
                value={content}
                onChange={(e) => setContent(e.target.value)}
                required
                style={{
                  width: '100%',
                  height: '80px',
                  padding: '8px',
                  borderRadius: '6px',
                  border: '1px solid #ddd',
                  resize: 'none',
                  fontSize: '14px'
                }}
              />
              
              <input 
                type="text"
                placeholder="怎么联系你？(QQ/微信，选填)"
                value={contact}
                onChange={(e) => setContact(e.target.value)}
                style={{
                  width: '100%',
                  padding: '8px',
                  borderRadius: '6px',
                  border: '1px solid #ddd',
                  fontSize: '14px'
                }}
              />

              <button
                type="submit"
                disabled={isSubmitting}
                style={{
                  backgroundColor: isSubmitting ? '#9ca3af' : '#3b82f6',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  padding: '10px',
                  cursor: isSubmitting ? 'not-allowed' : 'pointer',
                  fontWeight: 'bold',
                  transition: '0.2s'
                }}
              >
                {isSubmitting ? '发送中...' : '发送'}
              </button>
            </form>
          )}
        </div>
      )}
    </div>
  );
};

export default FeedbackWidget;