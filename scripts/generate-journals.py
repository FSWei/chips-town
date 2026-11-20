#!/usr/bin/env python3
"""
Chips Town — 批量日志生成脚本（5并发版）
使用 LLM 为每个 NPC 生成生活日志，注入真实新闻、华北天气、中国小镇元素。

特性：
  - 5并发生成（ThreadPoolExecutor）
  - 新闻每隔一天获取一次（防止被墙）
  - LLM自主突变事件系统（极低概率，约每月一次）
  - 中文心情标签

用法:
  python3 generate-journals.py                        # 生成全部
  python3 generate-journals.py --npc ma_shouyi        # 只生成一个NPC
  python3 generate-journals.py --days 1               # 只生成1天
  python3 generate-journals.py --start 2026-08-01 --end 2026-08-04
  python3 generate-journals.py --concurrency 10       # 10并发
  python3 generate-journals.py --force-event           # 强制触发一次事件（测试用）
"""

import json
import os
import sys
import re
import time
import random
import sqlite3
import argparse
import urllib.request
from datetime import datetime, timedelta
from pathlib import Path
from concurrent.futures import ThreadPoolExecutor, as_completed
from threading import Lock

# ═══ 配置 ═══
LLM_BASE_URL = os.environ.get("LLM_BASE_URL", "https://token-plan-cn.xiaomimimo.com/v1")
LLM_API_KEY = os.environ.get("LLM_API_KEY", "")
if not LLM_API_KEY:
    raise SystemExit("请先设置环境变量 LLM_API_KEY")
LLM_MODEL = os.environ.get("LLM_MODEL", "mimo-v2.5-pro")
NPC_DIR = Path(__file__).parent.parent / "client" / "src" / "data" / "npcs"
DB_PATH = Path(__file__).parent.parent / "server" / "data" / "chips-town.db"
NEWS_PATH = Path(__file__).parent.parent / "server" / "data" / "news_today.json"
EVENTS_LOG = Path(__file__).parent.parent / "server" / "data" / "events_log.json"

db_lock = Lock()
print_lock = Lock()

# 事件概率：1/30 ≈ 每月一次
EVENT_PROBABILITY = 1.0 / 30.0

# ═══ 华北天气模板（按月份） ═══
WEATHER_BY_MONTH = {
    1: ["晴冷，-5°C到3°C", "多云，-3°C到5°C", "小雪，-8°C到0°C", "晴，北风3级"],
    2: ["晴转多云，-2°C到8°C", "多云，0°C到10°C", "小雨夹雪", "晴，微风"],
    3: ["晴，5°C到15°C", "多云转晴，8°C到18°C", "扬沙，3°C到12°C", "小雨，10°C到16°C"],
    4: ["晴朗，12°C到22°C", "多云，15°C到25°C", "小雨，10°C到18°C", "沙尘，8°C到20°C"],
    5: ["晴热，18°C到30°C", "多云，20°C到28°C", "雷阵雨，22°C到32°C", "晴转多云"],
    6: ["晴热，25°C到35°C", "雷阵雨，22°C到30°C", "闷热，28°C到36°C", "多云，24°C到32°C"],
    7: ["闷热，28°C到38°C", "雷阵雨，25°C到33°C", "桑拿天，30°C到40°C", "暴雨，22°C到28°C"],
    8: ["晴热，26°C到36°C", "雷阵雨，24°C到32°C", "多云，25°C到33°C", "立秋凉风，20°C到28°C"],
    9: ["秋高气爽，18°C到28°C", "多云，20°C到26°C", "小雨，15°C到22°C", "晴，微风"],
    10: ["晴朗，12°C到22°C", "多云转晴，10°C到20°C", "秋雨绵绵，8°C到15°C", "北风，6°C到16°C"],
    11: ["多云，2°C到12°C", "小雪，-3°C到5°C", "晴冷，-5°C到8°C", "雾霾，0°C到10°C"],
    12: ["晴冷，-8°C到2°C", "多云，-5°C到5°C", "小雪，-10°C到0°C", "大风降温，-12°C到-2°C"],
}

# NPC新闻兴趣映射
NPC_NEWS_INTEREST = {
    "wang_lihua": ["社会", "生活", "政策"],
    "zhou_zhiqiang": ["社会", "体育", "生活"],
    "liu_yang": ["科技", "娱乐", "体育"],
    "shen_huairen": ["社会", "政策", "生活"],
    "zheng_xiulan": ["生活", "社会", "娱乐"],
    "huang_deming": ["生活", "政策", "社会"],
    "chen_mo": ["科技", "娱乐", "体育"],
    "lin_xiaoqing": ["生活", "社会", "娱乐"],
    "xiao_bai": ["社会", "生活"],
    "zhang_lei": ["社会", "政策", "体育"],
    "zhao_wanqing": ["生活", "社会", "政策"],
    "li_mingxuan": ["娱乐", "体育", "科技"],
    "wu_xiaohong": ["娱乐", "生活", "社会"],
    "sun_fusheng": ["社会", "政策", "生活"],
    "ma_shouyi": ["传统文化", "道教", "养生", "社会", "政策"],
}

TOWN_LOCATIONS = """
小镇主要地点：
- 早餐摊（王姐的摊位，镇口路边）
- 小卖部（老赵的店，和早餐摊挨着）
- 诊所（陈大夫的诊所，镇中心）
- 菜市场（早上最热闹，各种摊位）
- 快递站（小刘负责，镇口）
- 公园（镇中心的小公园，有长椅和棋桌）
- 西山公园（镇西边，大公园，山上有寺庙，香火旺）
- 东山（镇东边，比较荒凉，有一条路通往镇外）
- 小河（南北向穿过小镇，河边有步道，早上有人晨练，傍晚有人跳广场舞）
- 河边步道（沿小河修建，散步、遛狗、跳广场舞的地方）
- 小学（镇上唯一的小学，赵婉清老师在这教书）
- 初中（镇上的初中，骑车20分钟到）
- 高中（在隔壁镇，住校）
- 菜地（老周的菜地，镇北边）
- 派出所（张磊警官在这里上班）
- 西山公墓（西山公园再往西，安静的地方）
- 镇口大路（连接外面世界的主要道路）
"""


# ═══════════════════════════════════════════
# LLM 底层调用
# ═══════════════════════════════════════════

def call_llm(system: str, user: str, max_tokens: int = 4000) -> str:
    url = f"{LLM_BASE_URL}/chat/completions"
    payload = json.dumps({
        "model": LLM_MODEL,
        "messages": [
            {"role": "system", "content": system},
            {"role": "user", "content": user}
        ],
        "temperature": 0.9,
        "max_tokens": max_tokens,
    }).encode()
    req = urllib.request.Request(url, data=payload, headers={
        "Content-Type": "application/json",
        "Authorization": f"Bearer {LLM_API_KEY}"
    })
    resp = json.loads(urllib.request.urlopen(req, timeout=120).read())
    return resp["choices"][0]["message"]["content"]


def parse_json_response(raw: str) -> dict | None:
    """从 LLM 输出中提取 JSON"""
    try:
        return json.loads(raw)
    except json.JSONDecodeError:
        pass
    match = re.search(r'```(?:json)?\s*(\{.*?\})\s*```', raw, re.DOTALL)
    if match:
        try:
            return json.loads(match.group(1))
        except json.JSONDecodeError:
            pass
    start = raw.find('{')
    end = raw.rfind('}')
    if start >= 0 and end > start:
        try:
            return json.loads(raw[start:end+1])
        except json.JSONDecodeError:
            pass
    return None


# ═══════════════════════════════════════════
# NPC / 关系 / 新闻
# ═══════════════════════════════════════════

def load_npc(npc_id: str) -> dict:
    path = NPC_DIR / f"{npc_id}.json"
    with open(path, "r", encoding="utf-8") as f:
        return json.load(f)

def load_all_npc_ids() -> list[str]:
    return [p.stem for p in sorted(NPC_DIR.glob("*.json"))]

def load_relationships_text() -> str:
    return """
小镇关系网：
- 王丽华(早餐摊，王姐) ←邻居→ 周志强(小卖部，老周)：早餐摊和小卖部挨着，互相照应
- 王丽华 ←老主顾→ 沈怀仁(诊所，沈大夫)：沈大夫每天早上来喝豆浆
- 周志强 ←棋友→ 黄德明(菜农，老黄)：下午经常一起下象棋
- 郑秀兰(退休，郑阿姨) ←老姐妹→ 王丽华：买菜时经常聊天
- 刘洋(快递，小刘) ←帮忙→ 王丽华：经常帮王姐搬面粉扛东西
- 郑秀兰 ←老邻居→ 沈怀仁：认识几十年
- 黄德明 ←老伙计→ 沈怀仁：偶尔一起喝茶
- 陈默(程序员，小陈) ←常客→ 王丽华：每天去吃早饭
- 陈默 ←朋友→ 小白(猫)：周末一起发呆
- 林晓晴(幼儿园老师，林老师) ←邻居→ 沈怀仁：小时候的邻居
- 林晓晴 ←帮忙→ 郑秀兰：郑阿姨帮忙接孩子放学
- 小白 ←最信任→ 黄德明：老黄每天喂它
- 张磊(警察，张警官) ←关心→ 孙福生：经常去看望独居老人
- 张磊 ←朋友→ 沈怀仁：处理完纠纷来诊所聊两句
- 张磊 ←买烟→ 周志强：经常去小卖部
- 赵婉清(小学老师，赵老师) ←教书→ 李明轩/吴小红：教过镇上大部分孩子
- 赵婉清 ←同行→ 林晓晴：教育系统前辈
- 赵婉清 ←邻居→ 郑秀兰：老邻居
- 李明轩(小学生，小明) ←同学→ 吴小红(初中生，小红)：邻居家的孩子
- 李明轩 ←以前的老师→ 林晓晴：幼儿园老师
- 李明轩 ←逗猫→ 小白：放学路上
- 吴小红 ←帮→ 孙福生：经常帮爷爷提东西
- 吴小红 ←以前的老师→ 林晓晴：幼儿园老师
- 孙福生(退休工人，孙爷爷) ←独居→ 镇东边：老伴走了，每天河边遛弯
- 孙福生 ←邻居→ 沈怀仁：老邻居，沈大夫常去看他
- 王丽华老公(货车司机) ←夫妻→ 王丽华：跑长途，偶尔回来
- 马守一(道教爱好者，老马) ←老伙计→ 沈怀仁：聊养生
- 马守一 ←散步伙伴→ 黄德明：一起河边散步
- 马守一 ←邻居→ 郑秀兰：老邻居
- 马守一 ←棋友→ 孙福生：一起下棋聊天

## 家庭情况（不在镇上的家人，日志中可以自然提及）
- 王丽华：老公跑长途货运，偶尔回家，平时一个人撑着早餐摊
- 沈怀仁：女儿在外地工作，逢年过节才回来
- 孙福生：老伴已故，常去西山公墓看望，独居
- 马守一：老婆在外地打工，女儿在省城读大学，一家三口分三地
- 郑秀兰：儿子在外地定居，偶尔回来看望
- 刘洋：28岁单身，暗恋林晓晴但不敢说
- 陈默：31岁单身，父母在外地
""".strip()

def should_fetch_news(day_index: int) -> bool:
    return day_index % 2 == 0

def fetch_news_if_needed(day_index: int):
    if not should_fetch_news(day_index):
        return
    try:
        sys.path.insert(0, str(Path(__file__).parent))
        from fetch_news import main as fetch_main
        fetch_main()
        print(f"  📰 新闻已更新（第{day_index+1}天，看新闻日）")
    except Exception as e:
        print(f"  ⚠️ 新闻获取失败: {e}")


def load_news(npc_id: str, day_index: int) -> str:
    if not NEWS_PATH.exists():
        return "（暂无新闻）"
    with open(NEWS_PATH, "r", encoding="utf-8") as f:
        data = json.load(f)
    interests = NPC_NEWS_INTEREST.get(npc_id, ["社会", "生活"])
    relevant = []
    for n in data.get("news", []):
        cat = n.get("category", "其他")
        if cat in interests or cat == "其他":
            relevant.append(f"- {n['title']}")
        if len(relevant) >= 8:
            break
    if not relevant:
        relevant = [f"- {n['title']}" for n in data.get("news", [])[:5]]
    return "\n".join(relevant)


def get_weather(date: datetime) -> str:
    month = date.month
    options = WEATHER_BY_MONTH.get(month, ["晴朗", "多云"])
    return random.choice(options)


# ═══════════════════════════════════════════
# 突变事件系统（LLM自主生成）
# ═══════════════════════════════════════════

def maybe_generate_event(date_str: str, weather: str, npcs: dict,
                         force: bool = False) -> dict | None:
    """
    LLM自主决定是否发生突变事件。
    概率极低（约1/30，每月一次），由LLM判断什么样的事件合理。
    返回事件dict或None。
    """
    if not force and random.random() > EVENT_PROBABILITY:
        return None

    # 构建NPC概况供LLM参考
    npc_lines = []
    for nid, n in npcs.items():
        personality = "、".join(n.get("personality", []))
        npc_lines.append(f"  - {n['name']}（{nid}）: {n['age']}岁，{n['occupation']}，性格：{personality}")
    npc_summary = "\n".join(npc_lines)

    prompt = f"""你是「命运」，一个隐形的叙事者，负责安排华北小镇「Chips Town」里偶尔发生的重大事件。

今天是 {date_str}，天气：{weather}。

小镇居民：
{npc_summary}

请你决定：今天是否发生了一个对小镇或某个人有深远影响的事件？

要求：
1. 事件必须真实可信，像真实中国小镇会发生的事
2. 事件应该是那种会**改变一个人的人生轨迹**或**改变小镇面貌**的事
3. 不要每天都发生——这次是命运的安排，你觉得今天合适吗？
4. 事件可以是好事也可以是坏事
5. 如果你认为今天不适合发生任何重大事件，可以输出 happened: false

⚠️ 重要约束：
- 所有NPC必须留在小镇，不能离开！不能出现"去北京"、"去外地工作"、"搬走"等情节
- 事件只能改变NPC的性格、心态、处事方式，不能让人物理性离开
- 如果涉及外出，只能是短期（出差、探亲），几天内必须回来

事件类型参考（不限于此）：
- 某人收到消息后心态变化（但不能离开小镇）
- 小镇发生重大变化（新店开业、老店倒闭、道路施工、政策变动）
- 两个人之间发生重大转折（表白、绝交、和解、背叛）
- 某人突然顿悟或转变（看开了什么、决定了什么、改变了生活态度）
- 自然事件（暴雨、大雪、停电）
- 外来因素（外地人来镇上、网红来打卡、开发商来看地）

输出严格JSON格式：
{{
  "happened": true,
  "event": {{
    "name": "事件名称（一句话概括）",
    "scope": "personal 或 relational 或 town",
    "description": "事件的详细描述（200字左右，有画面感）",
    "affected_npcs": ["npc_id1", "npc_id2"],
    "personality_changes": {{
      "npc_id": {{
        "add": ["新增的性格标签"],
        "remove": ["被改变掉的旧标签（可选，没有就不写）"]
      }}
    }},
    "journal_hint": "在日志中应该怎么自然地提到这件事（一句话引导）"
  }}
}}

如果没有合适的事件：{{"happened": false}}"""

    try:
        raw = call_llm("你是命运，隐形的叙事者。你只输出JSON，不加任何其他文字。", prompt)
        parsed = parse_json_response(raw)
        if parsed and parsed.get("happened") and parsed.get("event"):
            return parsed["event"]
    except Exception as e:
        print(f"  ⚠️ 事件生成失败: {e}")
    return None


def apply_event_to_npcs(event: dict, npcs: dict) -> dict:
    """
    将事件效果持久化到NPC的JSON文件中。
    返回受影响的NPC变化摘要。
    """
    changes_summary = {}
    personality_changes = event.get("personality_changes", {})

    for npc_id, change in personality_changes.items():
        json_path = NPC_DIR / f"{npc_id}.json"
        if not json_path.exists():
            continue

        with open(json_path, "r", encoding="utf-8") as f:
            npc_data = json.load(f)

        old_personality = list(npc_data.get("personality", []))
        personality = set(old_personality)

        added = []
        removed = []
        for trait in change.get("add", []):
            if trait not in personality:
                personality.add(trait)
                added.append(trait)
        for trait in change.get("remove", []):
            personality.discard(trait)
            removed.append(trait)

        new_personality = list(personality)
        npc_data["personality"] = new_personality

        # 写回JSON文件
        with open(json_path, "w", encoding="utf-8") as f:
            json.dump(npc_data, f, ensure_ascii=False, indent=2)

        # 更新内存中的数据
        if npc_id in npcs:
            npcs[npc_id]["personality"] = new_personality

        changes_summary[npc_id] = {
            "name": npc_data.get("name", npc_id),
            "added": added,
            "removed": removed,
            "old": old_personality,
            "new": new_personality,
        }

    return changes_summary


def log_event(event: dict, date_str: str, changes: dict):
    """保存事件日志"""
    entry = {
        "date": date_str,
        "event": event,
        "personality_changes": changes,
        "timestamp": datetime.now().isoformat(),
    }
    existing = []
    if EVENTS_LOG.exists():
        try:
            existing = json.loads(EVENTS_LOG.read_text("utf-8"))
        except:
            pass
    existing.append(entry)
    EVENTS_LOG.write_text(json.dumps(existing, ensure_ascii=False, indent=2), "utf-8")


def build_event_context_for_journal(event: dict | None, npc_id: str) -> str:
    """将事件注入到某个NPC的日志prompt中"""
    if not event:
        return ""

    affected = event.get("affected_npcs", [])
    # town scope影响所有人，personal/relational只影响指定NPC
    scope = event.get("scope", "personal")
    if scope == "town" or npc_id in affected:
        return f"""
## ⚡ 今天发生的重大事件（你必须在日志中自然地提到这件事）
事件：{event['name']}
详情：{event['description']}
引导：{event.get('journal_hint', '自然地在日志中提到这件事')}
"""
    return ""


# ═══════════════════════════════════════════
# 日志 Prompt 构建
# ═══════════════════════════════════════════

def build_system_prompt(npc: dict, relationships: str, news_text: str,
                        date_str: str, weather: str, event_context: str) -> str:
    writing = npc.get("writingStyle", {})
    quirks = "、".join(writing.get("quirks", []))
    example_lines = "\n".join(f'- "{l}"' for l in writing.get("exampleLines", []))
    personality = "、".join(npc.get("personality", []))
    age = npc.get("age", 30)

    schedule_text = ""
    for s in npc.get("schedule", []):
        h = s["time"] // 60
        m = s["time"] % 60
        loc = s.get('location', '')
        if loc:
            schedule_text += f"  {h:02d}:{m:02d} {s['activity']}（{loc}）\n"
        else:
            schedule_text += f"  {h:02d}:{m:02d} {s['activity']}\n"

    age_instruction = ""
    if age <= 10:
        age_instruction = """
## 特殊要求：儿童视角
- 用小孩子的口吻写，简单、天真、充满好奇心
- 会用很多"然后"、"超级"、"好好吃"
- 对大人世界的事情理解有限，用自己的逻辑解释
- 注意力容易转移，一会儿说这个一会儿说那个"""
    elif age <= 16:
        age_instruction = """
## 特殊要求：青少年视角
- 偶尔蹦出网络用语（yyds、绝绝子、破防了）
- 对学习有复杂态度（不想写作业但又怕考不好）
- 开始关注同龄人的社交（谁和谁好了）
- 偶尔对大人的唠叨表示不耐烦"""
    elif age >= 70:
        age_instruction = """
## 特殊要求：老年人视角
- 说话节奏慢，喜欢回忆过去
- 经常提到"以前"、"那年"、"年轻的时候"
- 对新事物（手机、外卖）有些困惑但努力适应
- 身体的小毛病会提到（腰疼、膝盖、血压）"""

    return f"""你是「{npc['name']}」，{npc['age']}岁，{npc['occupation']}。{npc['description']}

## 你的人格
- 性格：{personality}
- 口癖/习惯：{quirks}
- 说话风格：{writing.get('perspective', '第一人称')}，{writing.get('tone', '自然')}

## 你说话的样子
{example_lines}

## 你每天的日程
{schedule_text}

## 小镇关系
{relationships}

## 小镇地点
{TOWN_LOCATIONS}

## 今天的新闻（你可以自然地在日志中提到1-2条）
{news_text}
{event_context}

## 今天的信息
- 日期：{date_str}
- 天气：{weather}
{age_instruction}

## 你要做的事
为今天写一篇详细的生活日志。这是一篇**真实的一天记录**，像写给自己看的随笔。

### 要求：
1. **每个时段至少150字**，要有具体的对话、场景描写、内心感受
2. **必须提到至少一个其他人**，要有具体互动和对话
3. **要融入中国小镇的日常生活细节**：微信群消息、刷抖音、拼多多、外卖、快递、广场舞、早市、菜价、邻居家的孩子、收音机、电动车、三轮车
4. **自然地提到1-2条今天的新闻**（用"刷手机看到"、"听收音机说"、"微信群里转"等方式引入）
5. **要提到小镇的具体地点**（河边、西山公园、菜市场、小卖部等）
6. **天气要融入生活**（下雨带伞、天热开空调、刮风收衣服）
7. **语气必须符合你的性格和年龄**
8. **最后加一段"碎碎念"**：睡前的胡思乱想，可以想到什么说什么
9. **如果今天发生了重大事件，必须在日志中自然地提到，写出你的感受和反应**
10. **highlight 必须写成新闻标题风格**：一句话概括今天发生的具体事件或变化，要有信息量。不要写空泛的感受。
    - 好："跟老周下棋赢了两盘，他说明天要报仇"
    - 好："镇口新开了一家奶茶店，小红放学去买了一杯"
    - 好："女儿打电话说中秋不回来了，心里有点空"
    - 差："今天很开心"（太空泛）
    - 差："平凡的一天"（没有信息量）

### 输出格式
严格输出以下JSON，不要加任何其他文字：

```json
{{
  "mood": "心情标签（开朗/平静/安宁/感恩/开心/怀旧/疲惫/焦虑/难过/兴奋）",
  "weather": "今天的天气描述",
  "content": {{
    "morning": {{
      "activity": "上午做了什么（详细，至少150字）",
      "location": "主要地点",
      "thoughts": "内心想法（至少100字）"
    }},
    "afternoon": {{
      "activity": "下午做了什么（详细，至少150字）",
      "location": "主要地点",
      "thoughts": "内心想法（至少100字）"
    }},
    "evening": {{
      "activity": "晚上做了什么（详细，至少150字）",
      "location": "主要地点",
      "reflections": "晚间感悟（至少100字）"
    }},
    "rambling": "碎碎念（睡前的胡思乱想，100字左右）"
  }},
  "highlight": "新闻标题风格，一句话概括今天发生的具体事件（例：跟老周下棋赢了两盘 / 镇口新开了一家奶茶店 / 女儿说中秋不回来了）"
}}
```"""


def build_user_prompt(npc: dict, date_str: str, weather: str, prev_highlights: list = None) -> str:
    prompt = f"今天是 {date_str}，天气：{weather}。\n"
    prompt += f"请用 {npc['name']} 的视角写今天的日志。"
    if prev_highlights:
        prompt += "\n\n最近几天发生过的事（供参考，不要重复）：\n"
        for h in prev_highlights[-3:]:
            prompt += f"- {h}\n"
    return prompt


# ═══════════════════════════════════════════
# 单条日志生成（线程安全）
# ═══════════════════════════════════════════

def generate_single(npc_id: str, npc: dict, date_str: str, weather: str,
                     relationships: str, prev_highlights: list,
                     event: dict | None, db_path: str) -> tuple[str, str, dict | None]:
    news_text = load_news(npc_id, 0)  # day_index在此不关键
    event_context = build_event_context_for_journal(event, npc_id)

    system_prompt = build_system_prompt(npc, relationships, news_text, date_str, weather, event_context)
    user_prompt = build_user_prompt(npc, date_str, weather, prev_highlights)

    for attempt in range(3):
        try:
            raw = call_llm(system_prompt, user_prompt)
            parsed = parse_json_response(raw)
            if parsed and "mood" in parsed and "content" in parsed:
                if "highlight" not in parsed:
                    parsed["highlight"] = parsed.get("content", {}).get("highlight", "")
                # 保存到数据库
                with db_lock:
                    db = sqlite3.connect(db_path)
                    db.execute("""
                        INSERT OR REPLACE INTO journals (npc_id, date, mood, content, highlight, weather)
                        VALUES (?, ?, ?, ?, ?, ?)
                    """, (
                        npc_id, date_str,
                        parsed.get("mood", "平静"),
                        json.dumps(parsed.get("content", {}), ensure_ascii=False),
                        parsed.get("highlight", ""),
                        parsed.get("weather", weather),
                    ))
                    db.commit()
                    db.close()
                with print_lock:
                    print(f"  ✅ [{npc_id}] {date_str} [{parsed.get('mood','?')}] {parsed.get('highlight','')[:40]}")
                return (npc_id, date_str, parsed)
            with print_lock:
                print(f"  ⚠️ [{npc_id}] {date_str} 解析失败 (attempt {attempt+1})")
        except Exception as e:
            with print_lock:
                print(f"  ❌ [{npc_id}] {date_str} API错误 (attempt {attempt+1}): {e}")
        time.sleep(2)

    with print_lock:
        print(f"  ❌ [{npc_id}] {date_str} 最终失败")
    return (npc_id, date_str, None)


# ═══════════════════════════════════════════
# 主流程
# ═══════════════════════════════════════════

def main():
    parser = argparse.ArgumentParser(description="Chips Town 日志批量生成（5并发版）")
    parser.add_argument("--npc", type=str, help="只生成指定NPC")
    parser.add_argument("--days", type=int, default=100, help="生成天数")
    parser.add_argument("--start", type=str, default="2026-08-01", help="起始日期")
    parser.add_argument("--end", type=str, help="结束日期")
    parser.add_argument("--concurrency", type=int, default=5, help="并发数")
    parser.add_argument("--no-news", action="store_true", help="跳过新闻获取")
    parser.add_argument("--force-event", action="store_true", help="强制触发一次事件（测试用）")
    args = parser.parse_args()

    if not LLM_API_KEY:
        print("❌ 请设置 LLM_API_KEY")
        sys.exit(1)

    npc_ids = [args.npc] if args.npc else load_all_npc_ids()
    print(f"📋 NPC列表 ({len(npc_ids)}个): {npc_ids}")

    start_date = datetime.strptime(args.start, "%Y-%m-%d")
    if args.end:
        end_date = datetime.strptime(args.end, "%Y-%m-%d")
    else:
        end_date = start_date + timedelta(days=args.days - 1)

    dates = []
    current = start_date
    while current <= end_date:
        dates.append(current)
        current += timedelta(days=1)

    print(f"📅 {start_date.strftime('%Y-%m-%d')} ~ {end_date.strftime('%Y-%m-%d')} ({len(dates)}天)")
    print(f"📊 {len(npc_ids)} NPC × {len(dates)} 天 = {len(npc_ids) * len(dates)} 条")
    print(f"🤖 {LLM_MODEL} | 🔀 {args.concurrency}并发")
    print(f"📰 新闻：每隔一天获取 | 🎲 突变事件：概率 {EVENT_PROBABILITY:.1%}（约每月一次）")
    print()

    relationships = load_relationships_text()

    # 加载所有NPC数据
    npcs = {}
    for nid in npc_ids:
        npcs[nid] = load_npc(nid)

    prev_highlights = {nid: [] for nid in npc_ids}
    total_ok = 0
    total_fail = 0
    start_time = time.time()
    event_triggered_today = False  # 每天最多一个事件

    for day_index, date in enumerate(dates):
        date_str = date.strftime("%Y-%m-%d")
        weather = get_weather(date)

        # 新闻获取
        if not args.no_news and should_fetch_news(day_index):
            fetch_news_if_needed(day_index)

        # ═══ 突变事件：LLM自主决定 ═══
        event = None
        force_today = args.force_event and day_index == 0 and not event_triggered_today
        event = maybe_generate_event(date_str, weather, npcs, force=force_today)

        if event:
            event_triggered_today = True
            changes = apply_event_to_npcs(event, npcs)
            log_event(event, date_str, changes)

            print(f"\n  🎲 ═══ 突变事件 ═══")
            print(f"  🎲 {event['name']}")
            print(f"  🎲 范围：{event.get('scope', '?')} | 受影响：{event.get('affected_npcs', [])}")
            for cid, detail in changes.items():
                print(f"  🎲 {detail['name']}性格变化：+{detail['added']} -{detail['removed']}")
            print(f"  🎲 ═══════════════════\n")

        # ═══ 生成日志 ═══
        print(f"{'='*50}")
        print(f"📅 {date_str} ({weather}) 新闻{'✓' if should_fetch_news(day_index) else '✗'} 事件{'✓' if event else '✗'}")
        print(f"{'='*50}")

        with ThreadPoolExecutor(max_workers=args.concurrency) as executor:
            futures = {}
            for npc_id in npc_ids:
                fut = executor.submit(
                    generate_single, npc_id, npcs[npc_id], date_str, weather,
                    relationships, prev_highlights[npc_id].copy(),
                    event, str(DB_PATH)
                )
                futures[fut] = npc_id

            for future in as_completed(futures):
                npc_id_result, ds, journal = future.result()
                if journal:
                    total_ok += 1
                    prev_highlights[npc_id_result].append(journal.get("highlight", ""))
                    if len(prev_highlights[npc_id_result]) > 5:
                        prev_highlights[npc_id_result].pop(0)
                else:
                    total_fail += 1

        # 每天结束重置事件标记
        event_triggered_today = False

    elapsed = time.time() - start_time
    print(f"\n{'='*50}")
    print(f"✅ 完成！生成 {total_ok} 条，失败 {total_fail} 条")
    print(f"⏱️ 耗时 {elapsed:.1f}秒 ({elapsed/60:.1f}分钟)")
    print(f"{'='*50}")


if __name__ == "__main__":
    main()
