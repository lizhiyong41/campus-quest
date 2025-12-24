// client/src/compress.js

/**
 * 图片压缩工具函数
 * @param {File} file - 原始文件对象
 * @returns {Promise<Blob>} - 压缩后的 Blob 对象
 */
export const compressImage = (file) => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        
        reader.onload = (event) => {
            const img = new Image();
            img.src = event.target.result;
            
            img.onload = () => {
                // 1. 设置最大尺寸 (防止 4000px 的超大图)
                const MAX_WIDTH = 1200; 
                const MAX_HEIGHT = 1200;
                let width = img.width;
                let height = img.height;

                if (width > height) {
                    if (width > MAX_WIDTH) {
                        height *= MAX_WIDTH / width;
                        width = MAX_WIDTH;
                    }
                } else {
                    if (height > MAX_HEIGHT) {
                        width *= MAX_HEIGHT / height;
                        height = MAX_HEIGHT;
                    }
                }

                // 2. 创建 Canvas 进行绘图
                const canvas = document.createElement('canvas');
                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0, width, height);

                // 3. 导出压缩后的图片
                canvas.toBlob((blob) => {
                    resolve(blob);
                }, 'image/jpeg', 0.6); // 🔥 60% 质量压缩
            };
            
            img.onerror = (err) => reject(err);
        };
        
        reader.onerror = (err) => reject(err);
    });
};