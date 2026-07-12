---
title: 关于 Research Paper Collector SKILL 的课堂反思
updated: 2026-07-11
tags:
  - 技能
  - 论文收集
  - arXiv
  - AI-Agent
---

## 我的原话

> [张方宇] 今天我们在课堂上一起完成了 `research-paper-collector` 技能的搭建。整个过程包括：定义 SKILL.md 的工作流、编写 `collect_papers.py` 和 `check_papers.py` 脚本、创建 `check-site.sh` 零依赖检查脚本，最后把这些集成到网站中。

> [张方宇] 我特别注意到数据路径的问题——脚本里用了绝对路径 `/public/data/papers.json`，但实际项目根目录在 `/Users/baobanxian/my-portfolio`，如果不改成相对路径就会写出到系统根目录。这个 bug 是在运行检查脚本时才暴露的。

> [张方宇] 零依赖的 `check-site.sh` 让我印象很深。它只用 bash 和 perl（macOS 自带），不需要装任何包，适合放在 CI 的第一个步骤做快速健康检查。

## Agent 总结

根据对话记录，Agent 完成了以下工作：

1. 创建 `.opencode/skills/research-paper-collector/SKILL.md`，包含工作流、输入参数和安全规则
2. 创建 `references/topics.md`，提供中文主题到 arXiv 查询词的映射
3. 编写 `scripts/collect_papers.py`，调用 arXiv API 获取论文，以 id 去重
4. 编写 `scripts/check_papers.py`，验证必需字段、重复 id、URL 格式
5. 运行收集脚本，成功获取 10 篇 AI Agent 相关论文
6. 修复 `check_papers.py` 中 URL scheme 只允许 https 的断言——arXiv API 返回的是 http 链接
7. 将脚本的 OUTPUT 路径从绝对路径改为基于 `__file__` 的相对路径
8. 更新 `app/papers/page.tsx`，从 `public/data/papers.json` 读取并展示论文列表
9. 编写 `scripts/check-site.sh`，零依赖 bash 脚本，覆盖必要页面、站内链接、RSS XML 检查

## 我的反思

这次实践让我意识到几个关键点：

1. **路径问题容易在"最后一公里"暴露**。脚本在本地跑没问题，但部署到 CI 或不同机器就可能出问题。以后写脚本应该优先用相对于脚本位置的路径。

2. **外部 API 的返回格式不能假设**。arXiv API 返回的 URL 是 http 而非 https，这提醒我们在写验证逻辑时要对实际数据做探查，而不是凭想象写断言。

3. **零依赖工具链的价值**。bash 写的检查脚本可以在任何 POSIX 环境运行，不依赖 node_modules，适合做 CI 快速门禁。

## 相关 Wiki 页面

- [Research Paper Collector 技能定义](/wiki/research-paper-collector-skill)
- [Site Health Check 脚本设计](/wiki/site-health-check)
