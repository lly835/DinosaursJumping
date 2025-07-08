# 恐龙跳绳 🦕

一个适合3岁小孩的体感游戏，使用笔记本电脑摄像头识别人体跳跃，当用户跳跃时，游戏中的卡通霸王龙也会跳跃。跳够100下算作过关。

## 🎮 在线体验

**[立即开始游戏](https://konglongtiaosheng-lrs4eqwzn-shuiges-projects-32e68798.vercel.app)**

> 注意：游戏需要摄像头权限，请在浏览器中允许访问摄像头

## ✨ 功能特点

- 🤖 使用TensorFlow.js进行人体姿态检测
- 📹 实时摄像头画面处理
- 🦕 卡通恐龙角色跟随跳跃
- 🎯 跳跃计数和视觉反馈
- 👶 适合3岁儿童的简单界面
- 🔊 跳跃音效和视觉特效
- 📱 支持隐藏/显示摄像头窗口

## 🛠️ 技术栈

- **React** - 用户界面框架
- **TensorFlow.js** - 机器学习库
- **Pose Detection模型** - 人体姿态检测
- **Vite** - 构建工具
- **Vercel** - 部署平台

## 🚀 本地开发

1. 克隆仓库
```bash
git clone https://github.com/lly835/DinosaursJumping.git
cd DinosaursJumping
```

2. 安装依赖
```bash
npm install
```

3. 运行开发服务器
```bash
npm run dev
```

4. 构建生产版本
```bash
npm run build
```

## 📖 使用说明

1. 📷 确保您的设备有摄像头并已授予浏览器访问权限
2. 🏃 站在摄像头前，确保全身可见
3. ▶️ 点击"开始游戏"按钮
4. 🦘 开始跳跃，屏幕上的恐龙会跟着一起跳
5. 🎯 跳够100下即可过关
6. 👁️ 可以点击"隐藏摄像头"按钮来切换摄像头显示

## 📁 资源文件

游戏包含以下资源文件（位于`public/`目录下）：

- `dino.png` - 卡通霸王龙图片
- `coin.mp3` - 跳跃时的金币音效
- `jump.mp3` - 跳跃音效

## ⚠️ 注意事项

- 💡 游戏需要在光线良好的环境中使用
- 🌐 建议在稳定的网络环境下运行，以确保TensorFlow模型加载顺利
- 🎯 如果检测不准确，请尝试调整站立位置或确保全身在画面中
- 🔊 首次使用时需要点击页面来解锁音效播放

## 🚀 部署

项目已配置自动部署到Vercel：
- 推送代码到GitHub main分支会自动触发部署
- 部署地址：https://konglongtiaosheng-lrs4eqwzn-shuiges-projects-32e68798.vercel.app

## 📝 许可

MIT License 