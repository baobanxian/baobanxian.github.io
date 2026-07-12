---
title: Site Health Check 脚本设计
updated: 2026-07-11
tags:
  - 脚本
  - 测试
  - CI
---

## 概述

`scripts/check-site.sh` 是一个零依赖的网站健康检查脚本，用于在部署前快速验证站点完整性。

## 检查项

| 检查 | 覆盖内容 |
|------|----------|
| 必要页面 | 9 个核心 HTML 和 XML 文件是否存在 |
| 站内链接 | 从 HTML 中提取所有 `<a href>`，解析本地路径 |
| RSS XML | XML 结构 + `<channel>/<title>/<item>/<link>` 完备性 |

## 设计特点

- 纯 bash + perl，零 npm 依赖
- 跳过 mailto / https 等外部链接
- 自动处理 `trailingSlash`（`/about/` → `/about/index.html`）

详见 [课堂反思](/wiki/research-paper-collector-reflection)。
