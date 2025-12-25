import { useEffect, useState, useRef } from 'react' // ✅ 所有的 React Hook 都在这里引入
import axios from 'axios'
import './App.css'
import { supabase } from './supabase'
import Auth from './Auth'
import Cropper from 'react-easy-crop'
import { getCroppedImg } from './cropUtils'
import toast, { Toaster } from 'react-hot-toast';
import { compressImage } from './compress'; // 🔥 引入压缩工具
import FeedbackWidget from './components/FeedbackWidget';

// --- 工具函数 ---
const timeAgo = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const now = new Date();
    const seconds = Math.floor((now - date) / 1000);
    
    if (seconds < 60) return '刚刚';
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}分钟前`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}小时前`;
    const days = Math.floor(hours / 24);
    if (days < 7) return `${days}天前`;
    return `${date.getMonth()+1}月${date.getDate()}日`;
}

// --- 组件：单个消息卡片 (受控组件版) ---

function QuestItem({ q, session, onCancel, onStatusUpdate, onDrop, onReview }) {
    // 🔥 关键修复：加回 useState，让卡片自己管理开关
    const [isOpen, setIsOpen] = useState(
        q.status === 'LOCKED' || q.status === 'PENDING_REVIEW'
    );
    
    const isPublisher = q.publisher_email === session.user.email;
    
    // 状态颜色字典
    const STATUS_MAP = { 'OPEN': '招募中', 'LOCKED': '交易中', 'PENDING_REVIEW': '待确认', 'COMPLETED': '已完成' };
    const statusColor = { 'OPEN': '#2db7f5', 'LOCKED': '#fa8c16', 'PENDING_REVIEW': '#13c2c2', 'COMPLETED': '#bfbfbf' }[q.status] || '#999';

    return (
        <div className="msg-item" style={{flexDirection: 'column', alignItems: 'stretch', gap: 0}}>
            {/* 1. 头部标题栏 (点击切换) */}
            <div 
                onClick={() => setIsOpen(!isOpen)} // 🔥 恢复自己的点击事件
                style={{display: 'flex', alignItems: 'center', cursor: 'pointer', paddingBottom: isOpen ? '10px' : '0'}}
            >
                {/* 图片 */}
                {q.image_url ? (
                    <img src={q.image_url} style={{width:'40px', height:'40px', objectFit:'cover', borderRadius:'8px', border:'1px solid #eee', marginRight:'10px'}} />
                ) : (
                    <div className="img-placeholder" style={{width:'40px', height:'40px', fontSize:'1.2rem', marginRight:'10px'}}>
                        {q.category === '跑腿' ? '⚡' : q.category === '学习' ? '📚' : '📝'}
                    </div>
                )}

                {/* 文字信息 */}
                <div style={{flex: 1, minWidth: 0}}>
                    <div style={{display:'flex', justifyContent:'space-between', alignItems:'center'}}>
                        <div style={{fontWeight:'bold', fontSize:'0.9rem', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', maxWidth:'120px'}}>{q.title}</div>
                        <div style={{fontSize:'0.7rem', color:'#ccc'}}>{new Date(q.created_at).getMonth()+1}/{new Date(q.created_at).getDate()}</div>
                    </div>
                    <div style={{display:'flex', alignItems:'center', gap:'5px', marginTop:'2px'}}>
                        <span className="badge-tag" style={{background: statusColor, color: 'white', border: 'none', fontSize:'0.7rem', padding:'1px 5px'}}>{STATUS_MAP[q.status]}</span>
                        <span style={{fontSize:'0.75rem', color:'#999'}}>{isOpen ? '' : (isPublisher ? ' 我发布的' : ' 我预订的')}</span>
                    </div>
                </div>

                {/* 箭头 */}
                <div style={{marginLeft: '10px', color: '#ccc', fontSize: '0.8rem'}}>
                    {isOpen ? '🔼' : '🔽'}
                </div>
            </div>

            {/* 2. 展开的内容区域 */}
            {isOpen && (
                <div style={{borderTop: '1px dashed #eee', paddingTop: '10px', marginTop: '5px', animation: 'fadeIn 0.3s'}}>
                    
                    {/* 按钮组 */}
                    <div style={{display:'flex', justifyContent:'flex-end', gap:'10px', flexWrap:'wrap'}}>
                        {isPublisher && q.status !== 'COMPLETED' && (
                            <button onClick={(e)=>{e.stopPropagation(); onCancel(q.id)}} style={{color:'#ff4d4f', border:'none', background:'none', cursor:'pointer', fontSize:'0.85rem'}}>
                                {q.status === 'LOCKED' ? '强制撤单' : '撤单'}
                            </button>
                        )}
                        {!isPublisher && q.status === 'LOCKED' && q.provider_email === session.user.email && (
                            <>
                                <button onClick={(e)=>{e.stopPropagation(); onStatusUpdate(q.id,'submit')}} style={{color:'#1890ff', border:'none', background:'none', cursor:'pointer', fontWeight:'bold', fontSize:'0.85rem'}}>发货/提交</button>
                                <button onClick={(e)=>{e.stopPropagation(); onDrop(q.id)}} style={{color:'#999', border:'none', background:'none', cursor:'pointer', fontSize:'0.85rem'}}>放弃</button>
                            </>
                        )}
                        {isPublisher && q.status === 'PENDING_REVIEW' && 
                            <button onClick={(e)=>{e.stopPropagation(); onStatusUpdate(q.id,'complete',q.provider_email)}} style={{color:'#52c41a', border:'none', background:'none', cursor:'pointer', fontWeight:'bold', fontSize:'0.85rem'}}>确认完成</button>
                        }
                        {q.status === 'COMPLETED' && (
                            <button onClick={(e) => {e.stopPropagation(); onReview({questId: q.id, toEmail: isPublisher ? q.provider_email : q.publisher_email})}} style={{color:'#faad14', border:'none', background:'none', cursor:'pointer', fontWeight:'bold', display: 'flex', alignItems: 'center', gap: '2px', fontSize:'0.85rem'}}>✨ 评价{isPublisher ? '接单人' : '发布者'}</button>
                        )}
                    </div>

                    {/* 联系卡片 */}
                    {(q.status === 'LOCKED' || q.status === 'PENDING_REVIEW') && (isPublisher || q.provider_email === session.user.email) && (
                        <div style={{marginTop:'10px', padding:'10px', background:'#f6ffed', borderRadius:'8px', border:'1px solid #b7eb8f', fontSize:'0.9rem', color:'#389e0d'}}>
                            <div style={{fontWeight:'bold', marginBottom:'5px'}}>🎉 交易已对接！</div>
                            <div style={{marginTop:'5px', userSelect:'all', background:'rgba(255,255,255,0.6)', padding:'8px', borderRadius:'4px', border:'1px dashed #b7eb8f'}}>
                                {isPublisher ? (
                                    <><div>📧 邮箱：<strong>{q.provider_email}</strong></div><div style={{fontSize:'0.8rem', color:'#999'}}>(请邮件联系)</div></>
                                ) : (
                                    <>
                                        <div style={{fontSize:'1rem', color:'#333'}}>📞 <strong>{q.contact_info || '无预留信息'}</strong></div>
                                        {!q.contact_info && <div>📧 邮箱：{q.publisher_email}</div>}
                                        <div style={{fontSize:'0.8rem', marginTop:'2px'}}>👉 快去添加对方吧！</div>
                                    </>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    )
}

// --- 主组件 ---
function App() {
    const [expandedIds, setExpandedIds] = useState([]); // 补上这一行
    // client/src/App.jsx - 在 App 组件内部
const [isMsgSectionOpen, setIsMsgSectionOpen] = useState(true); // 🔥 默认展开 (true)
    // 状态定义
    const [session, setSession] = useState(null)
    const [profile, setProfile] = useState({ nickname: '...' })
    const [quests, setQuests] = useState([]); 
    const [myQuests, setMyQuests] = useState([]); 
    const [leaderboard, setLeaderboard] = useState([]);
    
    // 筛选与搜索
    const [filterCategory, setFilterCategory] = useState('全部')
    const [filterLocation, setFilterLocation] = useState('全校')
    const [filterType, setFilterType] = useState('全部')
    const [sortOrder, setSortOrder] = useState('newest')
    const [searchTerm, setSearchTerm] = useState('')

    // 表单状态
    const [form, setForm] = useState({ type: 'REQUEST', title: '', description: '', reward: '', category: '跑腿', location: '全校', image_url: '',contact_info: '' })
    const [uploading, setUploading] = useState(false)
    
    // 评价与弹窗状态
    const [reviewTarget, setReviewTarget] = useState(null); 
    const [reviewForm, setReviewForm] = useState({ rating: 5, comment: '' });
    const [previewImage, setPreviewImage] = useState(null)
    
    // 用户编辑状态
    const [isEditingName, setIsEditingName] = useState(false)
    const [newName, setNewName] = useState('')
    
    // 收藏状态
    const [favoriteIds, setFavoriteIds] = useState([])
    const [showFavOnly, setShowFavOnly] = useState(false)
    
    // 裁剪状态
    const [cropImageSrc, setCropImageSrc] = useState(null)
    const [crop, setCrop] = useState({ x: 0, y: 0 })
    const [zoom, setZoom] = useState(1)
    const [croppedAreaPixels, setCroppedAreaPixels] = useState(null)
    const [isCropping, setIsCropping] = useState(false)

    // 常量
    const CATEGORIES = ['跑腿', '学习', '技术', '二手', '游戏', '其他']
    const LOCATIONS = ['全校', '城北校区', '忠山校区', '校外']
    const STATUS_MAP = {
        'OPEN': '招募中',
        'LOCKED': '交易中',
        'PENDING_REVIEW': '待确认完成',
        'COMPLETED': '已完成'
    }

    // 初始化 Session
    useEffect(() => {
        supabase.auth.getSession().then(({ data: { session } }) => setSession(session))
        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => setSession(session))
        return () => subscription.unsubscribe()
    }, [])

    // 加载数据
    const loadAllData = () => {
        if (!session) return;
        
        // 1. 获取个人资料
        axios.get(`https://campus-quest-api.onrender.com/api/profile?email=${session.user.email}`).then(res => setProfile(res.data))

        // 2. 获取任务列表 (带筛选)
        let url = `https://campus-quest-api.onrender.com/api/quests?q=${searchTerm}`;
        if (filterCategory !== '全部') url += `&category=${filterCategory}`;
        if (filterLocation !== '全校') url += `&location=${filterLocation}`;
        if (filterType !== '全部') url += `&type=${filterType}`;
        url += `&sort=${sortOrder}`;
        
        axios.get(url).then(res => {
            setQuests(res.data);
        }).catch(err => console.error(err));

        // 3. 获取“我参与的”任务
        axios.get(`https://campus-quest-api.onrender.com/api/my-quests?email=${session.user.email}`).then(res => {
    setMyQuests(res.data);
    // 🔥 智能初始化：默认展开那些“交易中”或“待确认”的任务
    const defaultOpenIds = res.data
        .filter(q => q.status === 'LOCKED' || q.status === 'PENDING_REVIEW')
        .map(q => q.id);
    setExpandedIds(defaultOpenIds);
})
        
        // 4. 获取排行榜
        axios.get('https://campus-quest-api.onrender.com/api/leaderboard').then(res => setLeaderboard(res.data))

        // 5. 获取我的收藏列表
        axios.get(`https://campus-quest-api.onrender.com/api/favorites/${session.user.email}`)
             .then(res => setFavoriteIds(res.data))
             .catch(err => console.error("获取收藏失败:", err));
    }

    // 监听筛选变化自动加载
    useEffect(() => { 
        if (session) loadAllData() 
    }, [session, filterCategory, filterLocation, filterType, sortOrder])

    // --- 功能函数 ---

    // 切换收藏
    const toggleFavorite = async (e, questId) => {
        e.stopPropagation();
        const isFav = favoriteIds.includes(questId);
        if (isFav) {
            setFavoriteIds(prev => prev.filter(id => id !== questId));
        } else {
            setFavoriteIds(prev => [...prev, questId]);
        }
        try {
            await axios.post('https://campus-quest-api.onrender.com/api/favorites/toggle', {
                user_email: session.user.email,
                quest_id: questId
            });
        } catch (err) {
            alert("操作失败，请重试");
            loadAllData();
        }
    }

    // 渲染星星
    const renderStars = (rating) => {
        if (!rating) {
            return <span style={{fontSize:'0.7rem', background:'#f0f0f0', color:'#888', padding:'1px 5px', borderRadius:'4px'}}>✨ 萌新</span>;
        }
        const score = Number(rating);
        return (
            <span style={{fontSize:'0.75rem', color:'#ffc107', fontWeight:'bold', display:'flex', alignItems:'center', gap:'2px'}}>
                ⭐ {score.toFixed(1)}
            </span>
        );
    }

    // 图片上传处理
    // client/src/App.jsx - 替换 handleImageUpload 函数

const handleImageUpload = async (e) => {
    try {
        setUploading(true);
        const file = e.target.files[0];
        if (!file) return;

        // 🔥🔥🔥 第一步：先压缩图片 🔥🔥🔥
        // 这一步会把 10MB 的图变成 200KB 左右！
        const compressedBlob = await compressImage(file);

        // 第二步：生成文件名 (统一改成 .jpg 后缀，因为我们强制转成了 jpeg)
        const fileName = `${Math.random()}.jpg`;
        const filePath = `${fileName}`;

        // 第三步：上传压缩后的 blob
        const { error: uploadError } = await supabase.storage
            .from('quest-images')
            .upload(filePath, compressedBlob); // 这里传的是压缩后的 blob

        if (uploadError) throw uploadError;

        // 第四步：获取链接
        const { data } = supabase.storage
            .from('quest-images')
            .getPublicUrl(filePath);

        setForm({ ...form, image_url: data.publicUrl });
        toast.success('图片上传成功 (已自动压缩)');

    } catch (error) {
        console.error(error);
        toast.error('上传失败: ' + error.message);
    } finally {
        setUploading(false);
    }
}

    // 头像选择与裁剪
    const onSelectFile = (e) => {
        if (e.target.files && e.target.files.length > 0) {
            const reader = new FileReader()
            reader.readAsDataURL(e.target.files[0])
            reader.addEventListener('load', () => {
                setCropImageSrc(reader.result)
                setIsCropping(true)
            })
        }
    }

    const handleCropAndUpload = async () => {
        try {
            const croppedBlob = await getCroppedImg(cropImageSrc, croppedAreaPixels)
            const fileExt = 'jpeg';
            const filePath = `avatar_${Math.random()}.${fileExt}`;
            
            const { error: uploadError } = await supabase.storage.from('quest-images').upload(filePath, croppedBlob);
            if (uploadError) throw uploadError;

            const { data } = supabase.storage.from('quest-images').getPublicUrl(filePath);
            const newAvatarUrl = data.publicUrl;

            await axios.put('https://campus-quest-api.onrender.com/api/profile', {
                email: session.user.email,
                avatar_url: newAvatarUrl
            });

            setProfile({ ...profile, avatar_url: newAvatarUrl });
            setIsCropping(false);
            setCropImageSrc(null);
            alert('头像更换成功！');

        } catch (error) {
            alert('上传失败: ' + error.message);
        }
    }

    // 提交发布
    const handleSubmit = (e) => {
        e.preventDefault()
        axios.post('https://campus-quest-api.onrender.com/api/quests', { ...form, email: session.user.email })
          .then(() => { 
              alert('发布成功！'); 
              setFilterType('全部'); setFilterLocation('全校'); setFilterCategory('全部'); setSearchTerm(''); setSortOrder('newest');
              setForm({ ...form, title: '', description: '', reward: '', image_url: '' }); 
              loadAllData() 
          })
          .catch(err => alert(err.response?.data?.error || err.message))
    }

    // 修改昵称
    const handleUpdateName = () => {
        if (!newName.trim()) return alert("名字不能为空！");
        axios.put('https://campus-quest-api.onrender.com/api/profile', { email: session.user.email, nickname: newName })
        .then(res => {
            setProfile(res.data);
            setIsEditingName(false);
            alert("改名成功！");
        })
        .catch(err => alert(err.response?.data?.error || "修改失败"));
    }

    // 任务操作
    const handleIWant = (id) => { if(confirm('💬 想要这个委托？\n确定后将为您预订并开启私聊。')) axios.post(`https://campus-quest-api.onrender.com/api/quests/${id}/accept`, {email:session.user.email}).then(()=>{ alert('✅ 已预订！'); loadAllData() }) }
    const handleCancel = (id) => { if(confirm('确定取消/删除该任务吗？')) axios.delete(`https://campus-quest-api.onrender.com/api/quests/${id}`, {data:{email:session.user.email}}).then(()=>{alert('已删除');loadAllData()}) }
    const handleDrop = (id) => { if(confirm('确定放弃吗？')) axios.post(`https://campus-quest-api.onrender.com/api/quests/${id}/drop`, {email:session.user.email}).then(()=>{alert('已放弃');loadAllData()}) }
    const updateStatus = (id, action, providerEmail) => {
        if(action==='complete') { if(!confirm('确认任务已完成？')) return; axios.post(`https://campus-quest-api.onrender.com/api/quests/${id}/complete`).then(()=>{ setReviewTarget({questId:id, toEmail:providerEmail}); loadAllData() }) } 
        else { axios.post(`https://campus-quest-api.onrender.com/api/quests/${id}/${action}`).then(()=>{ loadAllData() }) }
    }

    // 提交评价
    const submitReview = async () => {
        if (!reviewTarget || !reviewTarget.questId || !reviewTarget.toEmail) {
            return alert("❌ 错误：无法确定评价对象，请刷新页面重试。");
        }
        try {
            await axios.post(`https://campus-quest-api.onrender.com/api/quests/${reviewTarget.questId}/review`, {
                from_email: session.user.email,
                to_email: reviewTarget.toEmail,
                rating: reviewForm.rating,
                comment: reviewForm.comment
            });
            alert('✨ 评价提交成功！');
            setReviewTarget(null); 
            setReviewForm({ rating: 5, comment: '' }); 
            loadAllData(); 
        } catch (err) {
            const errorMsg = err.response?.data?.error || "";
            if (errorMsg.includes("duplicate key") || errorMsg.includes("unique constraint")) {
                alert("⚠️ 您已经评价过这个订单啦，不能重复评价哦！");
                setReviewTarget(null); 
            } else {
                alert('😭 评价失败: ' + (errorMsg || "网络连接异常"));
            }
        }
    }

    if (!session) return <Auth />

    return (
        <div className="container">
            {/* 1. 评价弹窗 */}
            {reviewTarget && (
                <div style={{position:'fixed',top:0,left:0,right:0,bottom:0,background:'rgba(0,0,0,0.5)',zIndex:999,display:'flex',justifyContent:'center',alignItems:'center'}}>
                    <div className="card" style={{width:'320px',textAlign:'center'}}>
                        <h3>✨ 交易评价</h3>
                        <p style={{color:'#666', marginBottom:'10px'}}>给对方打个分吧</p>
                        <div style={{fontSize:'2.5rem', marginBottom:'15px', cursor:'pointer', userSelect:'none'}}>
                            {[1, 2, 3, 4, 5].map((star) => (
                                <span key={star} onClick={() => setReviewForm({ ...reviewForm, rating: star })}
                                    style={{ opacity: star <= reviewForm.rating ? 1 : 0.3, transition: 'all 0.2s', display: 'inline-block' }}>⭐</span>
                            ))}
                        </div>
                        <div style={{marginBottom:'15px', color:'#ffc107', fontWeight:'bold'}}>
                            {reviewForm.rating === 5 ? '非常满意 (5.0)' : reviewForm.rating + '.0 分'}
                        </div>
                        <input className="form-control" placeholder="写点好评..." value={reviewForm.comment} onChange={e=>setReviewForm({...reviewForm,comment:e.target.value})} style={{marginBottom:'15px'}} />
                        <button className="btn-submit" onClick={submitReview}>提交评价</button>
                        <button onClick={() => setReviewTarget(null)} style={{marginTop:'10px', background:'none', border:'none', color:'#999', cursor:'pointer'}}>取消</button>
                    </div>
                </div>
            )}

            {/* 2. 头部 Header */}
            <header className="page-header">
                <div className="brand">
                    <span style={{fontSize: '2rem'}}>🏫</span>
                    <h1>校园集市</h1>
                </div>
                <div className="user-panel">
                    <div style={{display:'flex', alignItems:'center', gap:'12px'}}>
                        {/* 头像 */}
                        <div style={{position:'relative', width:'40px', height:'40px', cursor:'pointer'}}>
                            <input type="file" accept="image/*" onChange={onSelectFile} style={{position:'absolute', top: 0, left: 0, width:'100%', height:'100%', opacity:0, cursor:'pointer', zIndex:10}} title="点击更换头像" />
                            {profile.avatar_url ? (
                                <img src={profile.avatar_url} style={{width:'100%', height:'100%', borderRadius:'50%', objectFit:'cover', border:'2px solid #fff', boxShadow:'0 2px 5px rgba(0,0,0,0.1)'}} />
                            ) : (
                                <div style={{width:'100%', height:'100%', borderRadius:'50%', background:'#eee', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'1.2rem'}}>👤</div>
                            )}
                        </div>
                        {/* 用户名区域 */}
                        <div style={{display:'flex', flexDirection:'column', alignItems:'flex-end', gap:'2px'}}>
                            {isEditingName ? (
                                <div style={{display:'flex', alignItems:'center', gap:'5px'}}>
                                    <input value={newName} onChange={e => setNewName(e.target.value)} style={{padding:'2px 5px', borderRadius:'4px', border:'1px solid #ddd', width:'80px', fontSize:'0.85rem'}} autoFocus />
                                    <button onClick={handleUpdateName} style={{border:'none', background:'none', cursor:'pointer'}}>💾</button>
                                    <button onClick={() => setIsEditingName(false)} style={{border:'none', background:'none', cursor:'pointer'}}>❌</button>
                                </div>
                            ) : (
                                <div style={{display:'flex', alignItems:'center', gap:'5px'}}>
                                    <span style={{fontWeight:'700', fontSize:'0.95rem', color:'#333'}}>{profile.nickname || '神秘同学'}</span>
                                    <button onClick={() => { setIsEditingName(true); setNewName(profile.nickname); }} style={{border:'none', background:'none', cursor:'pointer', fontSize:'0.8rem', opacity:0.5}}>✏️</button>
                                </div>
                            )}
                            <span style={{fontSize:'0.75rem', color:'#999'}}>{session.user.email}</span>
                        </div>
                    </div>
                    <button className="btn-logout" onClick={async () => await supabase.auth.signOut()} style={{marginLeft:'15px'}}>退出</button>
                </div>
            </header>

            {/* 3. 主布局 */}
            <div style={{display: 'flex', gap: '30px', flexWrap: 'wrap', alignItems: 'flex-start'}}>
                
                {/* 左侧栏：发布 & 动态 */}
                {/* client/src/App.jsx - 左侧栏完整代码 */}

{/* client/src/App.jsx - 找到 className="sidebar" 的 div，完全替换成下面这些 */}

<div style={{flex: '1 1 300px', maxWidth: '380px', width: '100%'}} className="sidebar">
    
    {/* ===================================
        第一部分：发布表单 (之前不见了，现在加回来)
       =================================== */}
    <section className="card">
    <h2 className="card-title">📸 发布闲置 / 委托</h2>
    
    {/* 🔥🔥🔥 核心修改：给 form 加上 maxHeight 和 overflowY 🔥🔥🔥 */}
    <form 
        onSubmit={handleSubmit} 
        style={{
            display:'flex', 
            flexDirection:'column', 
            gap:'15px',
            // 新增滚动样式：
            maxHeight: '600px',  // 限制最大高度 (和下面的消息列表保持一致)
            overflowY: 'auto',   // 内容超出时出现滚动条
            paddingRight: '5px'  // 给滚动条留点空隙
        }}
    >
        {/* 下拉菜单组 */}
        <div style={{display:'flex', gap:'10px'}}>
            <select className="form-control" value={form.location} onChange={e=>setForm({...form,location:e.target.value})}>{LOCATIONS.map(c=><option key={c} value={c}>{c}</option>)}</select>
            <select className="form-control" value={form.category} onChange={e=>setForm({...form,category:e.target.value})}>{CATEGORIES.map(c=><option key={c} value={c}>{c}</option>)}</select>
            <select className="form-control" style={{width:'80px'}} value={form.type} onChange={e=>setForm({...form,type:e.target.value})}><option value="REQUEST">求</option><option value="OFFER">出</option></select>
        </div>
        
        {/* 标题 & 描述 */}
        <input className="form-control" placeholder="标题 (如: 出九成新高数书)" value={form.title} onChange={e=>setForm({...form,title:e.target.value})} required />
        <textarea className="form-control" placeholder="描述详情..." value={form.description} onChange={e=>setForm({...form,description:e.target.value})} />
        
        {/* 联系方式 (必填) */}
        <input 
            className="form-control" 
            placeholder="VX / QQ / 手机号 (接单后对方可见)" 
            value={form.contact_info} 
            onChange={e => setForm({...form, contact_info: e.target.value})}
            required 
        />

        {/* 图片上传区域 */}
        <div className="upload-area">
            <input type="file" id="file" accept="image/*" onChange={handleImageUpload} disabled={uploading} style={{display:'none'}} />
            <label htmlFor="file" style={{cursor:'pointer', width:'100%', display:'block'}}>
                {uploading ? '☁️ 上传中...' : (form.image_url ? '✅ 图片已添加 (点击更换)' : '📷 点击上传图片')}
            </label>
            {form.image_url && <img src={form.image_url} alt="preview" style={{width:'100%', height:'120px', objectFit:'cover', borderRadius:'8px', marginTop:'10px'}} />}
        </div>
        
        {/* 报酬 & 提交按钮 */}
        <input className="form-control" placeholder="报酬描述 (如: 15元 / 奶茶 / 面议)" value={form.reward} onChange={e=>setForm({...form,reward:e.target.value})} />
        <button type="submit" className="btn-submit" disabled={uploading}>立即发布</button>
    </form>
</section>

    {/* ===================================
        第二部分：消息 & 动态 (带折叠功能的最新版)
       =================================== */}
    <section className="card">
        {/* 标题栏：点击切换展开/收起 */}
        <div 
            onClick={() => setIsMsgSectionOpen(!isMsgSectionOpen)} 
            style={{
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center', 
                cursor: 'pointer', 
                userSelect: 'none', 
                marginBottom: isMsgSectionOpen ? '15px' : '0'
            }}
        >
            <h2 className="card-title" style={{margin:0}}>🔔 消息 & 动态</h2>
            <div style={{fontSize: '0.85rem', color: '#666', background: '#f5f5f5', padding: '5px 12px', borderRadius: '20px', display: 'flex', alignItems: 'center', gap: '5px'}}>
                {isMsgSectionOpen ? <>收起全部 🔼</> : <>展开全部 🔽</>}
            </div>
        </div>

        {/* 列表内容 */}
        {/* client/src/App.jsx - 找到左侧栏底部的“消息列表”容器 */}

        {/* 列表内容 */}
        {isMsgSectionOpen && (
            <div style={{
                display:'flex', 
                flexDirection:'column', 
                gap:'10px', 
                animation: 'fadeIn 0.3s',
                
                // 🔥🔥🔥 核心修改：加上这两行，实现局部滚动 🔥🔥🔥
                maxHeight: '600px',  // 限制高度 (你可以改成 500px 或 80vh)
                overflowY: 'auto',   // 超出高度自动出现滚动条
                paddingRight: '5px'  // 给滚动条留点空隙，更好看
            }}>
                {myQuests.length === 0 && <div style={{textAlign:'center', color:'#ccc', padding:'20px'}}>暂无消息</div>}
                
                {myQuests.map(q => (
                    <QuestItem 
                        key={q.id} 
                        q={q} 
                        session={session} 
                        onCancel={handleCancel}
                        onStatusUpdate={updateStatus}
                        onDrop={handleDrop}
                        onReview={setReviewTarget}
                    />
                ))}
            </div>
        )}
    </section>

</div>

                {/* 右侧栏：集市列表 */}
                <div style={{flex: '2 1 500px'}} className="main-content">
    <section className="card" style={{height: 'calc(100vh - 40px)', display: 'flex', flexDirection: 'column', overflow: 'hidden'}}>
        
        {/* =========================================
            1. 顶部固定区域 (标题 + 搜索框)
            这部分不会动，永远停在上面
           ========================================= */}
        <div style={{flexShrink: 0}}> {/* 防止头部被压缩 */}
            
            {/* 标题 & Tab */}
            <div style={{display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '15px', flexWrap: 'wrap', gap: '10px'}}>
                <h2 className="card-title" style={{margin: 0, whiteSpace: 'nowrap', fontSize: '1.2rem'}}>
                    🏫 医大集市
                </h2>
                <div className="filter-tabs" style={{display: 'flex', gap: '8px', overflowX: 'auto', whiteSpace: 'nowrap', maxWidth: '100%', paddingBottom: '2px', scrollbarWidth: 'none'}}>
                    {LOCATIONS.map(loc => (
                        <button key={loc} className={`tab-btn ${filterLocation === loc ? 'active' : 'inactive'}`} onClick={() => setFilterLocation(loc)} style={{flexShrink: 0}}>
                            {loc}
                        </button>
                    ))}
                </div>
            </div>

            {/* 搜索 & 筛选栏 */}
            <div className="search-filter-bar" style={{display: 'flex', flexWrap: 'wrap', gap: '10px', alignItems: 'center', background: '#fff', padding: '15px', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)', marginBottom: '10px'}}>
                {/* 搜索框 */}
                <div className="search-input-group" style={{display: 'flex', alignItems: 'center', flex: '1 1 280px', background: '#f5f5f5', padding: '5px 12px', borderRadius: '30px', gap: '8px'}}>
                    <span style={{fontSize:'1.2rem'}}>🔍</span>
                    <input 
                        placeholder="搜一搜..." 
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && loadAllData()} 
                        style={{border: 'none', background: 'transparent', outline: 'none', flex: 1, minWidth: 0, fontSize: '0.95rem'}}
                    />
                    <button onClick={loadAllData} style={{background: '#ffd666', border: 'none', borderRadius: '20px', padding: '6px 16px', fontWeight: 'bold', cursor: 'pointer', whiteSpace: 'nowrap'}}>搜索</button>
                </div>

                {/* 只看收藏 */}
                <label style={{display:'flex', alignItems:'center', gap:'5px', cursor:'pointer', userSelect:'none', fontSize:'0.9rem', color:'#eb2f96', background: '#fff0f6', padding: '8px 15px', borderRadius: '20px', whiteSpace: 'nowrap', fontWeight: 'bold'}}>
                    <input type="checkbox" checked={showFavOnly} onChange={e => setShowFavOnly(e.target.checked)} style={{accentColor: '#eb2f96'}} />
                    只看收藏 ❤️
                </label>

                {/* 下拉筛选 */}
                <div className="filter-selects" style={{display: 'flex', gap: '10px', flex: '1 1 auto', justifyContent: 'flex-end', minWidth: '200px'}}>
                    <select value={filterType} onChange={e => setFilterType(e.target.value)} className="mini-select" style={{flex: 1, padding: '8px', borderRadius: '8px', border: '1px solid #eee'}}>
                        <option value="全部">全部类型</option>
                        <option value="REQUEST">求购/求助</option>
                        <option value="OFFER">出售/提供</option>
                    </select>
                    <select value={sortOrder} onChange={e => setSortOrder(e.target.value)} className="mini-select" style={{flex: 1, padding: '8px', borderRadius: '8px', border: '1px solid #eee'}}>
                        <option value="newest">最新发布</option>
                        <option value="oldest">最早发布</option>
                    </select>
                </div>
            </div>

            <div style={{height:'1px', background:'#f0f0f0', margin:'10px 0 20px 0'}}></div>
        </div>

        {/* =========================================
            2. 底部滚动区域 (任务列表)
            只有这部分会滚动！
           ========================================= */}
        <div style={{
            flex: 1,                      // 🔥 自动填满剩余高度
            overflowY: 'auto',            // 🔥 超出部分垂直滚动
            paddingRight: '5px',          // 滚动条不遮挡
            paddingBottom: '20px',        // 底部留白
            // 如果 flex 不生效，可以用 height: 'calc(100vh - 280px)' 强制指定高度
        }}>
           {/* client/src/App.jsx - 替换原来的 grid-container 部分 */}

<div className="grid-container" style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '20px', alignContent: 'start'}}>
    {quests
        .filter(q => {
            // 1. 原有的逻辑：如果开了“只看收藏”，就检查 id 是否在收藏夹里
            const matchFav = showFavOnly ? favoriteIds.includes(q.id) : true;
            
            // 2. 🔥🔥🔥 新增逻辑：排除我自己发布的任务 🔥🔥🔥
            // 判断：发布者邮箱 不等于 当前登录用户的邮箱
            // 使用 ?. 防止 session 为空时报错
            const isNotMine = q.publisher_email !== session?.user?.email;

            // 只有同时满足两个条件，才显示出来
            return matchFav && isNotMine;
        })
        .map(q => (
            <div key={q.id} className="hover-card">
                <div className="card-img-wrapper" style={{position:'relative'}}>
                    {q.image_url ? (
                        <img src={q.image_url} onClick={() => setPreviewImage(q.image_url)} style={{width:'100%', height:'100%', objectFit:'cover', cursor: 'zoom-in'}} alt="任务图片" />
                    ) : (
                        <div className="card-img-placeholder">
                            <span style={{fontSize:'3rem', marginBottom:'5px'}}>{q.category === '跑腿' ? '⚡' : '📦'}</span>
                            <div style={{fontSize:'0.8rem', color:'#ccc'}}>暂无图片</div>
                        </div>
                    )}
                    <div style={{position:'absolute', top:'10px', left:'10px', background:'rgba(0,0,0,0.6)', color:'#fff', padding:'2px 8px', borderRadius:'4px', fontSize:'0.7rem'}}>{q.category}</div>
                    <div onClick={(e) => toggleFavorite(e, q.id)} style={{position:'absolute', top:'5px', right:'5px', width:'32px', height:'32px', background:'rgba(255,255,255,0.8)', borderRadius:'50%', display:'flex', justifyContent:'center', alignItems:'center', cursor:'pointer', fontSize:'1.2rem', boxShadow:'0 2px 5px rgba(0,0,0,0.1)', transition: 'all 0.2s'}} title={favoriteIds.includes(q.id) ? "取消收藏" : "收藏"}>
                        {favoriteIds.includes(q.id) ? '❤️' : '🤍'}
                    </div>
                </div>
                <div className="card-content">
                    <div>
                        <div style={{fontWeight:'700', fontSize:'1rem', marginBottom:'4px', lineHeight:'1.4', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap'}}>{q.title}</div>
                        <p className="card-desc">{q.description || '暂无详细描述...'}</p>
                        <div style={{display:'flex', justifyContent:'space-between', alignItems:'baseline', marginTop:'8px'}}>
                            <span className="price-tag" style={{fontSize:'0.9rem', color:'#ff5000'}}>{q.reward || '面议'}</span>
                            <span style={{fontSize:'0.75rem', color:'#999'}}>{timeAgo(q.created_at)} · {q.location}</span>
                        </div>
                    </div>
                    <div style={{display:'flex', alignItems:'center', marginTop:'15px', justifyContent:'space-between'}}>
                        <div style={{display:'flex', alignItems:'center', gap:'8px'}}>
                            <div style={{position:'relative'}}>
                                {q.publisher_avatar ? (
                                    <img src={q.publisher_avatar} style={{width:'28px', height:'28px', borderRadius:'50%', objectFit:'cover', border:'1px solid #eee'}} alt="头像" />
                                ) : (
                                    <div style={{width:'28px', height:'28px', borderRadius:'50%', background:'#f0f0f0', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'0.8rem'}}>👤</div>
                                )}
                            </div>
                            <div style={{display:'flex', flexDirection:'column', lineHeight:'1.2'}}>
                                <span style={{fontSize:'0.75rem', color:'#333', fontWeight:'bold', maxWidth:'90px', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap'}}>{q.publisher_nickname || '神秘同学'}</span>
                                <div style={{marginTop:'1px'}}>{renderStars(q.publisher_rating)}</div>
                            </div>
                        </div>
                        {/* 这里其实已经不用判断了，因为前面 filter 已经排除了自己，但留着也没坏处 */}
                        {q.publisher_email !== session.user.email && (<button className="want-btn" onClick={()=>handleIWant(q.id)}>想要</button>)}
                    </div>
                </div>
            </div>
        ))}
</div>
            
            {/* 空状态提示 */}
            {quests.length === 0 && (
                <div style={{textAlign:'center', marginTop:'50px', color:'#ccc'}}>
                    <div style={{fontSize:'4rem', marginBottom:'20px'}}>🍃</div>
                    <p>该区域暂时没有宝贝，快来发布一个吧！</p>
                </div>
            )}
        </div>
    </section>
</div>
            </div>
            {/* 🔥🔥🔥 新增：底部免责声明 Footer 🔥🔥🔥 */}
            <footer style={{
                marginTop: '40px',
                padding: '30px 20px',
                textAlign: 'center',
                fontSize: '0.8rem',
                color: '#999',
                borderTop: '1px solid #eee',
                width: '100%',
                background: '#fafafa',
                borderRadius: '12px'
            }}>
                <div style={{marginBottom: '10px', fontSize: '0.9rem', fontWeight: 'bold', color: '#ccc'}}>
                    🏫 医大集市 · Made with ❤️ by 同学们
                </div>
                <p style={{margin: '5px 0', lineHeight: '1.5'}}>
                    ⚠️ <strong>免责声明：</strong>本平台仅为校园信息发布与交流平台，
                    <br className="mobile-break" /> {/* 手机上换行 */}
                    不介入具体交易过程。请同学们在线下交易时注意人身与财产安全，
                    <br />
                    谨防诈骗，建议在校内公共场所（如食堂、图书馆）进行交接。
                </p>
                <p style={{marginTop: '10px', opacity: 0.6}}>
                    &copy; {new Date().getFullYear()} Campus Quest | 仅供学习与交流使用
                </p>
            </footer>

            {/* 全局弹窗：大图预览 & 裁剪 */}
            {previewImage && (
                <div className="image-modal" onClick={() => setPreviewImage(null)}>
                    <img src={previewImage} alt="查看大图" onClick={(e) => e.stopPropagation()} />
                    <button className="close-btn" onClick={() => setPreviewImage(null)}>×</button>
                </div>
            )}
            {isCropping && (
                <div className="cropper-modal">
                    <div className="cropper-container">
                        <Cropper image={cropImageSrc} crop={crop} zoom={zoom} aspect={1} cropShape="round" onCropChange={setCrop} onZoomChange={setZoom} onCropComplete={(_, croppedAreaPixels) => setCroppedAreaPixels(croppedAreaPixels)} />
                    </div>
                    <div className="cropper-controls">
                        <span style={{color:'white'}}>缩放: </span>
                        <input type="range" value={zoom} min={1} max={3} step={0.1} onChange={(e) => setZoom(Number(e.target.value))} />
                        <div style={{marginTop:'10px', display:'flex', gap:'10px', justifyContent:'center'}}>
                            <button onClick={handleCropAndUpload} style={{background:'#ffda44', border:'none', padding:'8px 20px', borderRadius:'20px', fontWeight:'bold', cursor:'pointer'}}>确认裁剪</button>
                            <button onClick={() => setIsCropping(false)} style={{background:'white', border:'none', padding:'8px 20px', borderRadius:'20px', cursor:'pointer'}}>取消</button>
                        </div>
                    </div>
                </div>
            )}
            <FeedbackWidget />
        </div>
    )
}

export default App