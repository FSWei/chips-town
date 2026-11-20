# Chips Town NPC 立绘生成提示词

## 通用风格约束

**画风**：高清像素风（HD Pixel Art）
**参考**：星露谷物语角色立绘、Celeste角色画、Eastward高清像素
**特点**：明显的像素颗粒感但分辨率高，每个像素清晰可见，暖色调，手绘温度感
**色调**：暖色调为主（琥珀金、深墨、暖灰），光线柔和
**背景**：头像和证件照用深墨色背景（#1c1917），全身立绘用透明背景

---

## 类型A：1:1 头像（256×256）

用途：面板圆形头像、侧边栏小图

**通用后缀**（每个提示词末尾加）：
```
HD pixel art style, 256x256, visible pixel blocks, warm earth tones, soft lighting, indie game character portrait, similar to Stardew Valley character art but higher resolution. Square format, head and shoulders, dark muted background (#1c1917).
```

### 1. 陈默（小陈）— 31岁程序员
```
HD pixel art portrait of a young Chinese man, 31 years old, thin build, black-framed glasses, plaid shirt, short messy hair, slightly tired but gentle eyes. HD pixel art style, 256x256, visible pixel blocks, warm earth tones, soft lighting, indie game character portrait. Square format, head and shoulders, dark muted background.
```

### 2. 黄德明（老黄）— 68岁菜农
```
HD pixel art portrait of an elderly Chinese farmer, 68 years old, dark tanned skin, thin wrinkled face, straw hat, old cotton shirt, kind weathered eyes, gentle smile. HD pixel art style, 256x256, visible pixel blocks, warm earth tones. Square format, head and shoulders, dark muted background.
```

### 3. 李明轩（小明）— 8岁小学生
```
HD pixel art portrait of a young Chinese boy, 8 years old, thin energetic, round face, messy hair, dirt on cheek, bright curious eyes, red T-shirt. HD pixel art style, 256x256, visible pixel blocks, warm earth tones. Square format, head and shoulders, dark muted background.
```

### 4. 林晓晴（林老师）— 26岁幼儿园老师
```
HD pixel art portrait of a young Chinese woman, 26 years old, round face, ponytail, dimples, light-colored T-shirt, warm gentle smile. HD pixel art style, 256x256, visible pixel blocks, warm earth tones. Square format, head and shoulders, dark muted background.
```

### 5. 刘洋（小刘）— 28岁快递站老板
```
HD pixel art portrait of a young Chinese man, 28 years old, thin, blue delivery uniform, baseball cap, friendly energetic smile, slightly tanned. HD pixel art style, 256x256, visible pixel blocks, warm earth tones. Square format, head and shoulders, dark muted background.
```

### 6. 马守一（老马）— 48岁道教文化爱好者
```
HD pixel art portrait of a middle-aged Chinese man, 48 years old, slightly chubby, traditional mandarin-collar shirt, calm contemplative expression, holding a thermos. HD pixel art style, 256x256, visible pixel blocks, warm earth tones. Square format, head and shoulders, dark muted background.
```

### 7. 沈怀仁（沈大夫）— 62岁诊所医生
```
HD pixel art portrait of an elderly Chinese doctor, 62 years old, thin dignified, white lab coat, reading glasses, stethoscope, wise kind eyes. HD pixel art style, 256x256, visible pixel blocks, warm earth tones. Square format, head and shoulders, dark muted background.
```

### 8. 孙福生（孙爷爷）— 78岁退休工人
```
HD pixel art portrait of a very elderly Chinese man, 78 years old, thin stooped, deep wrinkles, sparse white hair, warm cloudy eyes, old grey Mao jacket. HD pixel art style, 256x256, visible pixel blocks, warm earth tones. Square format, head and shoulders, dark muted background.
```

### 9. 王丽华（王姐）— 47岁早餐摊主
```
HD pixel art portrait of a middle-aged Chinese woman, 47 years old, slightly plump, hair under cap, white apron over floral blouse, flour on hands, loud warm smile. HD pixel art style, 256x256, visible pixel blocks, warm earth tones. Square format, head and shoulders, dark muted background.
```

### 10. 吴小红（小红）— 14岁初中生
```
HD pixel art portrait of a teenage Chinese girl, 14 years old, tall slim, ponytail, fair skin, glasses, neat blue-white school uniform, quiet gentle expression. HD pixel art style, 256x256, visible pixel blocks, warm earth tones. Square format, head and shoulders, dark muted background.
```

### 11. 小白 — 3岁白色异瞳猫
```
HD pixel art portrait of a white short-haired cat, heterochromia (one blue eye, one green eye), fluffy fur, no collar, curious calm expression. HD pixel art style, 256x256, visible pixel blocks, warm earth tones. Square format, close-up face, dark muted background.
```

### 12. 张磊（张警官）— 38岁派出所警察
```
HD pixel art portrait of a Chinese police officer, 38 years old, square jaw, buzz cut, dark skin, sharp kind eyes, dark blue uniform. HD pixel art style, 256x256, visible pixel blocks, warm earth tones. Square format, head and shoulders, dark muted background.
```

### 13. 赵婉清（赵老师）— 55岁小学老师
```
HD pixel art portrait of a middle-aged Chinese woman teacher, 55 years old, slightly plump, round face, short permed hair, gold reading glasses, warm smile, floral blouse. HD pixel art style, 256x256, visible pixel blocks, warm earth tones. Square format, head and shoulders, dark muted background.
```

### 14. 郑秀兰（郑阿姨）— 63岁退休职工
```
HD pixel art portrait of an elderly Chinese woman, 63 years old, slightly plump, curly permed hair, floral blouse, sociable warm expression. HD pixel art style, 256x256, visible pixel blocks, warm earth tones. Square format, head and shoulders, dark muted background.
```

### 15. 周志强（老周）— 55岁小卖部老板
```
HD pixel art portrait of a middle-aged Chinese man, 55 years old, slightly chubby, reading glasses, white tank top, calm unhurried expression. HD pixel art style, 256x256, visible pixel blocks, warm earth tones. Square format, head and shoulders, dark muted background.
```

---

## 类型B：半身证件照（512×768）

用途：面板详情区大图

**通用后缀**：
```
HD pixel art, 512x768, visible pixel blocks, warm earth tones, soft golden lighting, indie game character art. Portrait format, upper body (waist up), dark muted background with subtle environment hint.
```

在类型A基础上加：
- 更多服装细节
- 姿态描述（站姿/手势）
- 背景微弱环境暗示

### 示例（王姐）：
```
HD pixel art portrait of a Chinese woman, 47 years old, slightly plump, hair under cap, white apron over floral blouse, flour-dusted hands on hips, warm loud smile. Background hint: faint steam rising. HD pixel art, 512x768, visible pixel blocks, warm earth tones, soft golden morning light. Upper body, dark muted background.
```

### 示例（沈大夫）：
```
HD pixel art portrait of an elderly Chinese doctor, 62 years old, thin dignified, white lab coat, reading glasses on nose, stethoscope in hand, gentle wise expression. Background hint: blurred medicine cabinet. HD pixel art, 512x768, visible pixel blocks, warm earth tones. Upper body, dark muted background.
```

---

## 类型C：全身立绘（512×1024，透明背景）

用途：角色卡片、互动场景

**通用后缀**：
```
HD pixel art, 512x1024, visible pixel blocks, warm earth tones, soft lighting, indie game character art. Full body standing pose, transparent background, PNG.
```

### 示例（张警官）：
```
HD pixel art of a Chinese police officer, 38 years old, full body standing pose, square jaw, buzz cut, dark blue uniform with belt and badge, hands behind back, confident upright posture. HD pixel art, 512x1024, visible pixel blocks, warm earth tones. Full body, transparent background, PNG.
```

### 示例（小白猫）：
```
HD pixel art of a white short-haired cat, heterochromia (blue+green eyes), sitting pose, fluffy tail wrapped around paws, curious head tilt. HD pixel art, 512x1024, visible pixel blocks, warm earth tones. Full body, transparent background, PNG.
```

---

## 生成建议

1. **工具推荐**：Midjourney（--style raw --s 150 --ar 1:1）、Stable Diffusion + Pixel Art LoRA
2. **一致性**：用同一个 seed 或风格参数，确保15个NPC画风统一
3. **先测试**：拿王姐、张警官、小白 3个角色测试画风，确认后再批量
4. **后处理**：如果AI生成的像素不够明显，用 PixelStudio 或 Aseprite 手动调色/锐化

## 文件结构

```
client/public/assets/portraits/
├── head/           # 256×256 头像
│   ├── wang_lihua.png
│   ├── zhou_zhiqiang.png
│   └── ...
├── bust/           # 512×768 半身
│   ├── wang_lihua.png
│   └── ...
└── full/           # 512×1024 全身（透明背景）
    ├── wang_lihua.png
    └── ...
```
