// client/src/Auth.jsx
import { useState } from 'react'
import { supabase } from './supabase'

export default function Auth() {
  const [loading, setLoading] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isLogin, setIsLogin] = useState(true) // 切换登录/注册模式

  const handleAuth = async (e) => {
    e.preventDefault()
    setLoading(true)

    let error
    
    if (isLogin) {
      // 登录逻辑
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      })
      error = signInError
    } else {
      // 注册逻辑
      const { error: signUpError } = await supabase.auth.signUp({
        email,
        password,
      })
      error = signUpError
      if (!error) {
        alert('📧 注册确认邮件已发送！请去邮箱点击链接激活账号（如果没收到检查垃圾箱）。')
      }
    }

    if (error) {
      alert(error.message)
    }
    setLoading(false)
  }

  return (
    <div className="container" style={{maxWidth: '400px', marginTop: '100px'}}>
      <div className="card">
        <h2 className="card-title" style={{justifyContent: 'center'}}>
          {isLogin ? '🔑 登录公会' : '📝 注册新人'}
        </h2>
        
        <form onSubmit={handleAuth}>
          <div className="form-group">
            <label className="form-label">邮箱</label>
            <input
              className="form-control"
              type="email"
              placeholder="你的邮箱"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="form-group">
            <label className="form-label">密码</label>
            <input
              className="form-control"
              type="password"
              placeholder="设置密码"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <button className="btn-submit" disabled={loading}>
            {loading ? '处理中...' : (isLogin ? '登录' : '注册')}
          </button>
        </form>

        <p style={{textAlign: 'center', marginTop: '15px', color: '#666', fontSize: '0.9rem'}}>
          {isLogin ? '还没有账号？' : '已有账号？'}
          <span 
            onClick={() => setIsLogin(!isLogin)} 
            style={{color: '#3498db', cursor: 'pointer', fontWeight: 'bold', marginLeft: '5px'}}
          >
            {isLogin ? '去注册' : '去登录'}
          </span>
        </p>
      </div>
    </div>
  )
}