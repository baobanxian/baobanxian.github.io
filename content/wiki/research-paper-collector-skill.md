---
title: Research Paper Collector 技能定义
updated: 2026-07-11
tags:
  - 技能
  - opencode
  - arXiv
---

## 概述

`research-paper-collector` 是一个 opencode 技能，用于自动收集指定领域最新 arXiv 论文并更新网站数据。

## 工作流

1. 从 `references/topics.md` 读取主题-查询词映射
2. 调用 `collect_papers.py` 获取 arXiv 论文
3. 以 arXiv id 去重，验证必填字段
4. 运行 `check_papers.py` 进行完整性检查
5. 报告 fetched / new / saved 三个数字

## 安全规则

- 论文链接必须来自配置的数据源
- 不能把预印本描述成已经同行评审
- 没有新论文时不改写文件
- 网络失败时保留原数据

详见 [课堂反思](/wiki/research-paper-collector-reflection)。
