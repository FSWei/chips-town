#!/usr/bin/env python3
"""
抓取中国热点新闻，用于日志生成。
输出 news_today.json 供 generate-journals.py 使用。
"""
import json
import urllib.request
import os
import sys
from datetime import datetime

OUTPUT = os.path.join(os.path.dirname(__file__), "..", "server", "data", "news_today.json")

HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
}

def fetch_json(url, timeout=10):
    req = urllib.request.Request(url, headers=HEADERS)
    try:
        resp = urllib.request.urlopen(req, timeout=timeout)
        return json.loads(resp.read().decode('utf-8'))
    except Exception as e:
        print(f"  ⚠️ {url}: {e}")
        return None

def fetch_weibo_hot():
    """微博热搜"""
    try:
        url = "https://weibo.com/ajax/side/hotSearch"
        data = fetch_json(url)
        if data and "data" in data:
            items = []
            for item in data["data"].get("realtime", [])[:15]:
                items.append({
                    "title": item.get("word", ""),
                    "heat": item.get("num", 0),
                    "category": categorize_news(item.get("word", ""))
                })
            return items
    except:
        pass
    return []

def fetch_bilibili_hot():
    """B站热门"""
    try:
        url = "https://api.bilibili.com/x/web-interface/popular?ps=20&pn=1"
        data = fetch_json(url)
        if data and "data" in data:
            items = []
            for item in data["data"].get("list", [])[:15]:
                items.append({
                    "title": item.get("title", ""),
                    "heat": item.get("stat", {}).get("view", 0),
                    "category": categorize_news(item.get("title", ""))
                })
            return items
    except:
        pass
    return []

def fetch_toutiao_hot():
    """今日头条热榜 (via public API)"""
    try:
        url = "https://www.toutiao.com/hot-event/hot-board/?origin=toutiao_pc"
        data = fetch_json(url)
        if data and "data" in data:
            items = []
            for item in data["data"][:15]:
                items.append({
                    "title": item.get("Title", ""),
                    "heat": item.get("HotValue", 0),
                    "category": categorize_news(item.get("Title", ""))
                })
            return items
    except:
        pass
    return []

def categorize_news(title):
    """简单分类新闻"""
    keywords = {
        "社会": ["事故", "救援", "暴雨", "洪水", "地震", "火灾", "失踪", "救人"],
        "科技": ["AI", "人工智能", "芯片", "华为", "苹果", "iPhone", "机器人", "5G"],
        "娱乐": ["明星", "电影", "综艺", "演唱会", "演员", "导演"],
        "体育": ["奥运", "世界杯", "足球", "篮球", "冠军", "比赛"],
        "生活": ["高考", "开学", "物价", "房价", "菜价", "天气", "台风"],
        "政策": ["政策", "改革", "补贴", "社保", "医保", "退休"],
    }
    for cat, kws in keywords.items():
        for kw in kws:
            if kw in title:
                return cat
    return "其他"

def main():
    print("📰 正在抓取热点新闻...")
    
    all_news = []
    
    print("  微博热搜...", end=" ", flush=True)
    weibo = fetch_weibo_hot()
    print(f"{len(weibo)}条")
    all_news.extend(weibo)
    
    print("  B站热门...", end=" ", flush=True)
    bilibili = fetch_bilibili_hot()
    print(f"{len(bilibili)}条")
    all_news.extend(bilibili)
    
    print("  今日头条...", end=" ", flush=True)
    toutiao = fetch_toutiao_hot()
    print(f"{len(toutiao)}条")
    all_news.extend(toutiao)
    
    # 去重
    seen = set()
    unique = []
    for n in all_news:
        if n["title"] not in seen and len(n["title"]) > 3:
            seen.add(n["title"])
            unique.append(n)
    
    result = {
        "date": datetime.now().strftime("%Y-%m-%d"),
        "fetched_at": datetime.now().isoformat(),
        "total": len(unique),
        "news": unique
    }
    
    os.makedirs(os.path.dirname(OUTPUT), exist_ok=True)
    with open(OUTPUT, "w", encoding="utf-8") as f:
        json.dump(result, f, ensure_ascii=False, indent=2)
    
    print(f"\n✅ 共 {len(unique)} 条热点，已保存到 {OUTPUT}")
    
    # 按分类统计
    cats = {}
    for n in unique:
        c = n.get("category", "其他")
        cats[c] = cats.get(c, 0) + 1
    print("📊 分类分布：", "、".join(f"{k}({v})" for k, v in sorted(cats.items(), key=lambda x: -x[1])))

if __name__ == "__main__":
    main()
