// NPC 数据加载器 — 从 JSON 配置文件读取所有 NPC 数据
// 新增 NPC 只需要在 npcs/ 目录下添加 JSON 文件，然后在这里 import

import type { NPCData } from '../game/types'
import wang_lihua from './npcs/wang_lihua.json'
import zhou_zhiqiang from './npcs/zhou_zhiqiang.json'
import liu_yang from './npcs/liu_yang.json'
import shen_huairen from './npcs/shen_huairen.json'
import zheng_xiulan from './npcs/zheng_xiulan.json'
import huang_deming from './npcs/huang_deming.json'
import chen_mo from './npcs/chen_mo.json'
import lin_xiaoqing from './npcs/lin_xiaoqing.json'
import xiao_bai from './npcs/xiao_bai.json'
import zhang_lei from './npcs/zhang_lei.json'
import zhao_wanqing from './npcs/zhao_wanqing.json'
import li_mingxuan from './npcs/li_mingxuan.json'
import wu_xiaohong from './npcs/wu_xiaohong.json'
import sun_fusheng from './npcs/sun_fusheng.json'
import ma_shouyi from './npcs/ma_shouyi.json'

export type NpcConfig = NPCData & {
  nickname?: string
  occupation?: string
  age?: number
  gender?: string
  hometown?: string
  personality?: string[]
  description?: string
  dailyLife?: Record<string, string>
  关注的新闻?: string[]
  writingStyle?: {
    perspective: string
    tone: string
    quirks: string[]
    exampleLines: string[]
  }
  appearance?: {
    basePrompt: string
    wardrobe: string[]
  }
}

export const ALL_NPCS: NpcConfig[] = [
  wang_lihua,
  zhou_zhiqiang,
  liu_yang,
  shen_huairen,
  zheng_xiulan,
  huang_deming,
  chen_mo,
  lin_xiaoqing,
  xiao_bai,
  zhang_lei,
  zhao_wanqing,
  li_mingxuan,
  wu_xiaohong,
  sun_fusheng,
  ma_shouyi,
] as NpcConfig[]

export function getNpcById(id: string): NpcConfig | undefined {
  return ALL_NPCS.find(n => n.id === id)
}

export function getNpcScheduleData(): NPCData[] {
  return ALL_NPCS.map(n => ({
    id: n.id,
    name: n.name,
    spriteIndex: n.spriteIndex,
    occupation: n.occupation,
    age: n.age,
    personality: n.personality,
    description: n.description,
    schedule: n.schedule,
  }))
}
