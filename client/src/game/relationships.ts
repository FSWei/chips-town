// NPC 关系数据
// 关系类型：friend（朋友）、couple（夫妻）、colleague（同事）、rival（对手）、mentor（师徒）、neighbor（邻居）

export interface Relationship {
  from: string    // NPC id
  to: string      // NPC id
  type: 'friend' | 'couple' | 'colleague' | 'rival' | 'mentor' | 'neighbor' | 'crush' | 'customer' | 'pet'
  label: string   // 关系描述
  strength: number // 1-5 亲密度
}

export const RELATIONSHIPS: Relationship[] = [
  // ─── 早餐摊 & 小卖部 ───
  { from: 'wang_lihua', to: 'zhou_zhiqiang', type: 'neighbor', label: '隔壁', strength: 4 },
  { from: 'zhou_zhiqiang', to: 'wang_lihua', type: 'neighbor', label: '隔壁', strength: 4 },

  { from: 'wang_lihua', to: 'shen_huairen', type: 'customer', label: '老主顾', strength: 3 },
  { from: 'shen_huairen', to: 'wang_lihua', type: 'customer', label: '每天豆浆', strength: 3 },

  // ─── 棋友 & 老伙计 ───
  { from: 'zhou_zhiqiang', to: 'huang_deming', type: 'friend', label: '棋友', strength: 4 },
  { from: 'huang_deming', to: 'zhou_zhiqiang', type: 'friend', label: '棋友', strength: 4 },

  { from: 'huang_deming', to: 'shen_huairen', type: 'friend', label: '老伙计', strength: 3 },
  { from: 'shen_huairen', to: 'huang_deming', type: 'friend', label: '老伙计', strength: 3 },

  // ─── 郑阿姨 ───
  { from: 'zheng_xiulan', to: 'wang_lihua', type: 'friend', label: '老姐妹', strength: 3 },
  { from: 'wang_lihua', to: 'zheng_xiulan', type: 'friend', label: '老姐妹', strength: 3 },

  { from: 'zheng_xiulan', to: 'shen_huairen', type: 'neighbor', label: '老邻居', strength: 3 },
  { from: 'shen_huairen', to: 'zheng_xiulan', type: 'neighbor', label: '老邻居', strength: 3 },

  { from: 'zheng_xiulan', to: 'huang_deming', type: 'neighbor', label: '送菜', strength: 2 },
  { from: 'huang_deming', to: 'zheng_xiulan', type: 'neighbor', label: '送菜', strength: 2 },

  // ─── 小刘（快递）───
  { from: 'liu_yang', to: 'wang_lihua', type: 'customer', label: '帮忙搬货', strength: 2 },
  { from: 'wang_lihua', to: 'liu_yang', type: 'customer', label: '好孩子', strength: 2 },

  { from: 'liu_yang', to: 'zhou_zhiqiang', type: 'customer', label: '买水', strength: 2 },
  { from: 'zhou_zhiqiang', to: 'liu_yang', type: 'customer', label: '小伙子', strength: 2 },

  // ─── 陈默（程序员）───
  { from: 'chen_mo', to: 'wang_lihua', type: 'customer', label: '常去吃早饭', strength: 2 },
  { from: 'wang_lihua', to: 'chen_mo', type: 'customer', label: '那个戴眼镜的年轻人', strength: 2 },

  { from: 'chen_mo', to: 'xiao_bai', type: 'friend', label: '周末一起发呆', strength: 3 },
  { from: 'xiao_bai', to: 'chen_mo', type: 'friend', label: '安静的人类，不吵', strength: 3 },

  { from: 'chen_mo', to: 'zhou_zhiqiang', type: 'customer', label: '买可乐', strength: 1 },
  { from: 'zhou_zhiqiang', to: 'chen_mo', type: 'customer', label: '总买可乐那个', strength: 1 },

  // ─── 林老师 ───
  { from: 'lin_xiaoqing', to: 'shen_huairen', type: 'neighbor', label: '小时候的邻居', strength: 3 },
  { from: 'shen_huairen', to: 'lin_xiaoqing', type: 'neighbor', label: '看着长大的', strength: 3 },

  { from: 'lin_xiaoqing', to: 'zheng_xiulan', type: 'friend', label: '郑阿姨帮忙接孩子', strength: 3 },
  { from: 'zheng_xiulan', to: 'lin_xiaoqing', type: 'friend', label: '乖囡', strength: 3 },

  { from: 'lin_xiaoqing', to: 'xiao_bai', type: 'pet', label: '带小朋友喂猫', strength: 4 },
  { from: 'xiao_bai', to: 'lin_xiaoqing', type: 'pet', label: '带小人类来的那个', strength: 4 },

  { from: 'lin_xiaoqing', to: 'wang_lihua', type: 'customer', label: '买早餐给小朋友', strength: 2 },

  // ─── 小白（猫）───
  { from: 'xiao_bai', to: 'huang_deming', type: 'friend', label: '最信任的人类', strength: 5 },
  { from: 'huang_deming', to: 'xiao_bai', type: 'friend', label: '不说话的伙伴', strength: 5 },

  { from: 'xiao_bai', to: 'wang_lihua', type: 'customer', label: '鱼骨头人类', strength: 3 },
  { from: 'wang_lihua', to: 'xiao_bai', type: 'pet', label: '小白', strength: 3 },

  { from: 'xiao_bai', to: 'shen_huairen', type: 'customer', label: '白大褂', strength: 2 },
  { from: 'shen_huairen', to: 'xiao_bai', type: 'pet', label: '公园那只猫', strength: 2 },

  { from: 'xiao_bai', to: 'liu_yang', type: 'neighbor', label: '电三轮很吵', strength: 1 },

  // ─── 马守一（道教爱好者）───
  { from: 'ma_shouyi', to: 'shen_huairen', type: 'friend', label: '老伙计，聊养生', strength: 3 },
  { from: 'shen_huairen', to: 'ma_shouyi', type: 'friend', label: '那个爱说道德经的', strength: 3 },

  { from: 'ma_shouyi', to: 'huang_deming', type: 'friend', label: '一起河边散步', strength: 3 },
  { from: 'huang_deming', to: 'ma_shouyi', type: 'friend', label: '老马，种菜聊道', strength: 3 },

  { from: 'ma_shouyi', to: 'wang_lihua', type: 'customer', label: '常去吃早饭', strength: 2 },
  { from: 'wang_lihua', to: 'ma_shouyi', type: 'customer', label: '那个说道德经的', strength: 2 },

  { from: 'ma_shouyi', to: 'zheng_xiulan', type: 'neighbor', label: '老邻居', strength: 2 },
  { from: 'zheng_xiulan', to: 'ma_shouyi', type: 'neighbor', label: '老马这人不坏', strength: 2 },

  { from: 'ma_shouyi', to: 'sun_fusheng', type: 'friend', label: '一起下棋聊天', strength: 3 },
  { from: 'sun_fusheng', to: 'ma_shouyi', type: 'friend', label: '老马懂养生', strength: 3 },

  // ─── 张磊（警察）───
  { from: 'zhang_lei', to: 'shen_huairen', type: 'friend', label: '处理完纠纷来聊两句', strength: 2 },
  { from: 'shen_huairen', to: 'zhang_lei', type: 'friend', label: '小张警官辛苦', strength: 2 },

  { from: 'zhang_lei', to: 'zhou_zhiqiang', type: 'customer', label: '买烟买水', strength: 2 },
  { from: 'zhou_zhiqiang', to: 'zhang_lei', type: 'customer', label: '张警官', strength: 2 },

  { from: 'zhang_lei', to: 'sun_fusheng', type: 'neighbor', label: '关心独居老人', strength: 3 },
  { from: 'sun_fusheng', to: 'zhang_lei', type: 'neighbor', label: '小张这孩子不错', strength: 3 },

  { from: 'zhang_lei', to: 'zhao_wanqing', type: 'friend', label: '学校安全检查', strength: 2 },
  { from: 'zhao_wanqing', to: 'zhang_lei', type: 'friend', label: '张警官来检查', strength: 2 },

  // ─── 赵婉清（小学老师）───
  { from: 'zhao_wanqing', to: 'lin_xiaoqing', type: 'colleague', label: '教育系统同行', strength: 3 },
  { from: 'lin_xiaoqing', to: 'zhao_wanqing', type: 'colleague', label: '赵老师前辈', strength: 3 },

  { from: 'zhao_wanqing', to: 'wang_lihua', type: 'customer', label: '每天买早餐', strength: 2 },
  { from: 'wang_lihua', to: 'zhao_wanqing', type: 'customer', label: '赵老师早', strength: 2 },

  { from: 'zhao_wanqing', to: 'zheng_xiulan', type: 'neighbor', label: '老邻居', strength: 3 },
  { from: 'zheng_xiulan', to: 'zhao_wanqing', type: 'neighbor', label: '婉清啊', strength: 3 },

  { from: 'zhao_wanqing', to: 'li_mingxuan', type: 'mentor', label: '班主任', strength: 4 },
  { from: 'li_mingxuan', to: 'zhao_wanqing', type: 'mentor', label: '赵老师', strength: 4 },

  { from: 'zhao_wanqing', to: 'wu_xiaohong', type: 'mentor', label: '以前教过', strength: 3 },
  { from: 'wu_xiaohong', to: 'zhao_wanqing', type: 'mentor', label: '赵老师', strength: 3 },

  // ─── 李明轩（小学生）───
  { from: 'li_mingxuan', to: 'lin_xiaoqing', type: 'mentor', label: '幼儿园林老师', strength: 3 },
  { from: 'lin_xiaoqing', to: 'li_mingxuan', type: 'mentor', label: '以前的学生', strength: 3 },

  { from: 'li_mingxuan', to: 'wu_xiaohong', type: 'friend', label: '邻居家姐姐', strength: 3 },
  { from: 'wu_xiaohong', to: 'li_mingxuan', type: 'friend', label: '楼下小明', strength: 3 },

  { from: 'li_mingxuan', to: 'xiao_bai', type: 'pet', label: '放学逗猫', strength: 3 },
  { from: 'xiao_bai', to: 'li_mingxuan', type: 'pet', label: '那个小人类', strength: 2 },

  { from: 'li_mingxuan', to: 'sun_fusheng', type: 'neighbor', label: '孙爷爷好', strength: 2 },
  { from: 'sun_fusheng', to: 'li_mingxuan', type: 'neighbor', label: '乖孩子', strength: 2 },

  // ─── 吴小红（初中生）───
  { from: 'wu_xiaohong', to: 'lin_xiaoqing', type: 'mentor', label: '幼儿园林老师', strength: 2 },
  { from: 'lin_xiaoqing', to: 'wu_xiaohong', type: 'mentor', label: '以前的学生', strength: 2 },

  { from: 'wu_xiaohong', to: 'sun_fusheng', type: 'neighbor', label: '帮爷爷提东西', strength: 3 },
  { from: 'sun_fusheng', to: 'wu_xiaohong', type: 'neighbor', label: '小红真懂事', strength: 3 },

  { from: 'wu_xiaohong', to: 'wang_lihua', type: 'customer', label: '买煎饼', strength: 2 },
  { from: 'wang_lihua', to: 'wu_xiaohong', type: 'customer', label: '小红放学啦', strength: 2 },
]

/** 获取某 NPC 的所有关系 */
export function getRelationships(npcId: string): Relationship[] {
  return RELATIONSHIPS.filter(r => r.from === npcId)
}

/** 获取两个 NPC 之间的关系 */
export function getRelationship(fromId: string, toId: string): Relationship | undefined {
  return RELATIONSHIPS.find(r => r.from === fromId && r.to === toId)
}
