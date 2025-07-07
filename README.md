# 恐龙跳绳

一个适合3岁小孩的体感游戏，使用笔记本电脑摄像头识别人体跳跃，当用户跳跃时，游戏中的卡通霸王龙也会跳跃。跳够100下算作过关。

## 功能特点

- 使用TensorFlow.js进行人体姿态检测
- 实时摄像头画面处理
- 卡通恐龙角色跟随跳跃
- 跳跃计数和视觉反馈
- 适合3岁儿童的简单界面

## 技术栈

- React
- TensorFlow.js
- Pose Detection模型
- Vite

## 安装与运行

1. 克隆仓库
```
git clone https://github.com/yourusername/konglongtiaosheng.git
cd konglongtiaosheng
```

2. 安装依赖
```
npm install
```

3. 运行开发服务器
```
npm run dev
```

4. 构建生产版本
```
npm run build
```

## 使用说明

1. 确保您的设备有摄像头并已授予浏览器访问权限
2. 站在摄像头前，确保全身可见
3. 点击"开始游戏"按钮
4. 开始跳跃，屏幕上的恐龙会跟着一起跳
5. 跳够100下即可过关

## 资源文件

游戏需要以下资源文件，请将它们放在`src/assets/`目录下：

- `background.png` - 游戏背景图片
- `dino.png` - 卡通霸王龙图片
- `coin.mp3` - 跳跃时的金币音效

## 注意事项

- 游戏需要在光线良好的环境中使用
- 建议在稳定的网络环境下运行，以确保TensorFlow模型加载顺利
- 如果检测不准确，请尝试调整站立位置或确保全身在画面中

## 许可

MIT 