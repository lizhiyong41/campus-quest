import { useState, useEffect } from 'react';
import { supabase } from './supabase';

function Admin() {
    const [quests, setQuests] = useState([]);
    const [userEmail, setUserEmail] = useState("");
    const [loading, setLoading] = useState(true);

    // 👇👇👇 这里的邮箱必须和后端那个一模一样！ 👇👇👇
    const MY_ADMIN_EMAIL = "1310635424@qq.com";

    // 获取 API 地址 (自动适配本地或线上)
    const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:3000";

   // ✅ Admin.jsx 专用的“开后门”代码
    useEffect(() => {
        // 1. 直接问 Supabase 是谁
        supabase.auth.getUser().then(({ data: { user } }) => {
            if (user) {
                // Admin.jsx 里用的是 setUserEmail，这里是对的！
                setUserEmail(user.email); 
            }
        });

        // 2. 加载数据
        fetch(`${API_BASE}/api/quests?sort=newest`)
            .then(res => res.json())
            .then(data => {
                setQuests(data);
                setLoading(false);
            })
            .catch(err => alert("加载失败：" + err));
    }, []);

    // ⛔️ 门卫：如果不是站长，显示“闲人免进”
    if (userEmail !== MY_ADMIN_EMAIL) {
        return (
            <div style={{ padding: '50px', textAlign: 'center', color: 'red' }}>
                <h1>🚫 403 Forbidden</h1>
                <p>这里是监控室，普通同学请回吧。</p>
                <p>当前登录: {userEmail || "未登录"}</p>
            </div>
        );
    }

    // 🗑️ 上帝删除动作
    const handleForceDelete = async (id) => {
        if (!window.confirm("⚠️ 确定要动用管理员权限强制删除这条吗？此操作不可恢复！")) return;

        try {
            const res = await fetch(`${API_BASE}/api/admin/quests/${id}`, {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ admin_email: userEmail }) // 亮出身份
            });

            const data = await res.json();
            
            if (res.ok) {
                alert("已清除违规内容！");
                // 界面上把这一行删掉
                setQuests(quests.filter(q => q.id !== id));
            } else {
                alert("删除失败：" + data.error);
            }
        } catch (err) {
            alert("网络错误");
        }
    };

    return (
        <div style={{ maxWidth: '800px', margin: '0 auto', padding: '20px' }}>
            <h2 style={{ borderBottom: '2px solid #333', paddingBottom: '10px' }}>
                👮‍♂️ 医大集市·风控中心
            </h2>
            <p>你好，站长。当前共有 {quests.length} 条帖子。</p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                {quests.map(quest => (
                    <div key={quest.id} style={{ 
                        border: '1px solid #ddd', 
                        padding: '15px', 
                        borderRadius: '8px',
                        backgroundColor: '#fff',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        boxShadow: '0 2px 5px rgba(0,0,0,0.05)'
                    }}>
                        <div style={{ flex: 1 }}>
                            <div style={{ fontWeight: 'bold', fontSize: '16px' }}>
                                {quest.title} 
                                <span style={{ marginLeft: '10px', fontSize: '12px', padding: '2px 6px', background: '#eee', borderRadius: '4px' }}>
                                    {quest.category}
                                </span>
                            </div>
                            <div style={{ color: '#666', fontSize: '14px', margin: '5px 0' }}>
                                {quest.description}
                            </div>
                            <div style={{ fontSize: '12px', color: '#999' }}>
                                发布者: {quest.publisher_nickname || quest.publisher_email} | 时间: {new Date(quest.created_at).toLocaleString()}
                            </div>
                        </div>

                        <button 
                            onClick={() => handleForceDelete(quest.id)}
                            style={{ 
                                backgroundColor: '#ff4d4f', 
                                color: 'white', 
                                border: 'none', 
                                padding: '8px 15px', 
                                borderRadius: '5px', 
                                cursor: 'pointer',
                                fontWeight: 'bold',
                                marginLeft: '15px'
                            }}
                        >
                            强制删除 🗑️
                        </button>
                    </div>
                ))}
            </div>
        </div>
    );
}

export default Admin;