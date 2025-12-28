import { useState, useEffect } from 'react';
import { supabase } from './supabase'; // 引入 Supabase

function Admin() {
    const [quests, setQuests] = useState([]);
    const [userEmail, setUserEmail] = useState("");
    const [loading, setLoading] = useState(true);
    
    // 🔐 新增：锁屏状态
    const [isLocked, setIsLocked] = useState(true);
    const [inputPin, setInputPin] = useState("");

    // 👇👇👇 设置你的【二级管理密码】(可以是数字，也可以是暗号) 👇👇👇
    const ADMIN_PIN = "8888"; 
    
    // 获取 API 地址
    const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:3000";

    useEffect(() => {
        // 1. 验证身份 (第一道门：必须是站长账号)
        supabase.auth.getUser().then(({ data: { user } }) => {
            if (user) setUserEmail(user.email);
        });

        // 2. 加载数据
        fetch(`${API_BASE}/api/quests?sort=newest`)
            .then(res => res.json())
            .then(data => {
                setQuests(data);
                setLoading(false);
            })
            .catch(err => alert("数据加载失败：" + err));
    }, []);

    // 🔐 解锁函数
    const handleUnlock = (e) => {
        e.preventDefault();
        if (inputPin === ADMIN_PIN) {
            setIsLocked(false); // 密码对，开门！
        } else {
            alert("🚫 口令错误！小心报警！");
            setInputPin("");
        }
    };

    // 🗑️ 删除函数
    const handleForceDelete = async (id) => {
        if (!window.confirm("⚠️ 警告：确定要执行【上帝删除】吗？此操作不可逆！")) return;

        try {
            const res = await fetch(`${API_BASE}/api/admin/quests/${id}`, {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ admin_email: userEmail }) 
            });

            if (res.ok) {
                // 界面上也移除
                setQuests(quests.filter(q => q.id !== id));
                alert("✅ 已执行净化操作！");
            } else {
                const data = await res.json();
                alert("❌ 操作失败：" + data.error);
            }
        } catch (err) {
            alert("❌ 网络连不上后端");
        }
    };

    // 📊 简单的统计数据计算
    const stats = {
        total: quests.length,
        today: quests.filter(q => new Date(q.created_at).toDateString() === new Date().toDateString()).length,
        locked: quests.filter(q => q.status === 'LOCKED').length
    };

    // 🛑 门卫：如果不是站长本人，直接赶走 (Level 1 防御)
    const MY_ADMIN_EMAIL = "1310635424@qq.com"; // 你的邮箱
    if (!loading && userEmail !== MY_ADMIN_EMAIL) {
        return (
            <div style={{ height: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center', flexDirection: 'column', color: '#ff4d4f' }}>
                <h1 style={{ fontSize: '4rem' }}>🚫 403</h1>
                <p>系统检测到非管理员入侵，IP 已记录。</p>
            </div>
        );
    }

    // 🔐 锁屏界面 (Level 2 防御)
    if (isLocked) {
        return (
            <div style={{ 
                height: '100vh', 
                background: '#202124', 
                color: 'white', 
                display: 'flex', 
                justifyContent: 'center', 
                alignItems: 'center', 
                flexDirection: 'column' 
            }}>
                <div style={{ fontSize: '3rem', marginBottom: '20px' }}>🛡️ 风控中心</div>
                <form onSubmit={handleUnlock} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '15px' }}>
                    <p style={{ color: '#9aa0a6' }}>请输入二级指挥官口令</p>
                    <input 
                        type="password" 
                        autoFocus
                        value={inputPin}
                        onChange={e => setInputPin(e.target.value)}
                        placeholder="PIN Code"
                        style={{ 
                            padding: '10px 20px', 
                            fontSize: '1.5rem', 
                            textAlign: 'center', 
                            letterSpacing: '5px',
                            borderRadius: '8px',
                            border: '2px solid #5f6368',
                            background: '#303134',
                            color: 'white',
                            outline: 'none',
                            width: '200px'
                        }} 
                    />
                    <button type="submit" style={{ 
                        padding: '10px 30px', 
                        background: '#8ab4f8', 
                        color: '#202124', 
                        border: 'none', 
                        borderRadius: '30px', 
                        fontWeight: 'bold', 
                        cursor: 'pointer',
                        fontSize: '1rem'
                    }}>
                        解锁进入
                    </button>
                </form>
            </div>
        );
    }

    // 🚀 正式仪表盘界面
    return (
        <div style={{ minHeight: '100vh', background: '#f8f9fa', padding: '30px' }}>
            <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
                {/* 顶部 Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
                    <div>
                        <h1 style={{ margin: 0, color: '#202124' }}>👮‍♂️ 医大集市 · 指挥舱</h1>
                        <p style={{ margin: '5px 0 0 0', color: '#5f6368', fontSize: '0.9rem' }}>
                            欢迎回来，站长。当前身份验证通过。
                        </p>
                    </div>
                    <button onClick={() => setIsLocked(true)} style={{ background: '#202124', color: 'white', border: 'none', padding: '8px 15px', borderRadius: '8px', cursor: 'pointer' }}>
                        🔒 锁定屏幕
                    </button>
                </div>

                {/* 数据概览卡片 */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px', marginBottom: '30px' }}>
                    <div style={{ background: 'white', padding: '20px', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
                        <div style={{ color: '#5f6368', fontSize: '0.9rem' }}>总帖子数</div>
                        <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#1a73e8' }}>{stats.total}</div>
                    </div>
                    <div style={{ background: 'white', padding: '20px', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
                        <div style={{ color: '#5f6368', fontSize: '0.9rem' }}>今日新增</div>
                        <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#137333' }}>+{stats.today}</div>
                    </div>
                    <div style={{ background: 'white', padding: '20px', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
                        <div style={{ color: '#5f6368', fontSize: '0.9rem' }}>正在交易中</div>
                        <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#f9ab00' }}>{stats.locked}</div>
                    </div>
                </div>

                {/* 帖子管理表格 */}
                <div style={{ background: 'white', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)', overflow: 'hidden' }}>
                    <div style={{ padding: '20px', borderBottom: '1px solid #eee', fontWeight: 'bold', fontSize: '1.1rem' }}>
                        📋 监控列表
                    </div>
                    <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
                            <thead style={{ background: '#f8f9fa' }}>
                                <tr>
                                    <th style={{ padding: '15px', textAlign: 'left', color: '#5f6368' }}>内容摘要</th>
                                    <th style={{ padding: '15px', textAlign: 'left', color: '#5f6368' }}>发布者</th>
                                    <th style={{ padding: '15px', textAlign: 'left', color: '#5f6368' }}>时间</th>
                                    <th style={{ padding: '15px', textAlign: 'right', color: '#5f6368' }}>操作</th>
                                </tr>
                            </thead>
                            <tbody>
                                {quests.map(q => (
                                    <tr key={q.id} style={{ borderBottom: '1px solid #eee' }}>
                                        <td style={{ padding: '15px' }}>
                                            <div style={{ fontWeight: 'bold', color: '#202124' }}>{q.title}</div>
                                            <div style={{ color: '#5f6368', fontSize: '0.85rem', maxWidth: '300px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                                {q.description}
                                            </div>
                                        </td>
                                        <td style={{ padding: '15px' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                <img src={q.publisher_avatar || 'https://via.placeholder.com/30'} style={{ width: '24px', height: '24px', borderRadius: '50%' }} />
                                                <span style={{ color: '#3c4043' }}>{q.publisher_nickname || '神秘人'}</span>
                                            </div>
                                            <div style={{ fontSize: '0.75rem', color: '#9aa0a6' }}>{q.publisher_email}</div>
                                        </td>
                                        <td style={{ padding: '15px', color: '#5f6368' }}>
                                            {new Date(q.created_at).toLocaleDateString()}
                                        </td>
                                        <td style={{ padding: '15px', textAlign: 'right' }}>
                                            <button 
                                                onClick={() => handleForceDelete(q.id)}
                                                style={{ 
                                                    background: '#fee2e2', 
                                                    color: '#dc2626', 
                                                    border: 'none', 
                                                    padding: '6px 12px', 
                                                    borderRadius: '4px', 
                                                    cursor: 'pointer',
                                                    fontWeight: 'bold',
                                                    fontSize: '0.8rem',
                                                    transition: 'all 0.2s'
                                                }}
                                            >
                                                ⚡ 销毁
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default Admin;