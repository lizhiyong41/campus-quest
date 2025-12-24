// client/src/cropUtils.js

// 1. 辅助函数：创建一个图片对象
export const createImage = (url) =>
  new Promise((resolve, reject) => {
    const image = new Image()
    image.addEventListener('load', () => resolve(image))
    image.addEventListener('error', (error) => reject(error))
    image.setAttribute('crossOrigin', 'anonymous') // 防止跨域问题
    image.src = url
  })

// 2. 主函数：裁剪并压缩图片
export function getCroppedImg(imageSrc, pixelCrop) {
  return new Promise(async (resolve, reject) => {
    try {
      // 这里调用了上面的 createImage，所以它必须存在！
      const image = await createImage(imageSrc)
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')

      if (!ctx) {
        return reject(new Error('No 2d context'))
      }

      // 设置画布大小
      canvas.width = pixelCrop.width
      canvas.height = pixelCrop.height

      // 在画布上绘制裁剪后的图片
      ctx.drawImage(
        image,
        pixelCrop.x,
        pixelCrop.y,
        pixelCrop.width,
        pixelCrop.height,
        0,
        0,
        pixelCrop.width,
        pixelCrop.height
      )

      // 转换为 Blob (并压缩)
      canvas.toBlob(
        (blob) => {
          if (!blob) {
            reject(new Error('Canvas is empty'));
            return;
          }
          blob.name = 'avatar.jpg';
          resolve(blob);
        },
        'image/jpeg', 
        0.6 // 🔥 压缩质量 0.6
      );

    } catch (e) {
      reject(e)
    }
  })
}