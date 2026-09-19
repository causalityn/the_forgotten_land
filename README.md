# The Forgotten Land

一个使用 Hugo 和 Tailwind CSS 搭建的个人网站。当前主题代码直接放在项目根目录中，方便按个人需求逐步演进。

## 环境要求

- Hugo Extended
- Node.js
- npm

## 安装依赖

```bash
npm install
```

## 字体

站点默认使用霞鹜文楷。当前文章文本会生成到 `static/fonts/lxgw-wenkai/`，未覆盖字符会在运行时按需加载固定版本的 jsDelivr 字体，最后回退到系统中文字体。新增或修改大量文章后运行：

```bash
npm run build:fonts
```

## 本地开发

开发时建议开两个终端。

终端一：监听并构建 Tailwind CSS。

```bash
npm run watch:css
```

终端二：启动 Hugo 本地服务。

```bash
hugo server
```

也可以直接运行 Hugo：

```bash
hugo server --disableFastRender
```

## 构建站点

先构建 CSS，再构建 Hugo 站点：

```bash
npm run build
```

如果只想重新生成 CSS：

```bash
npm run build:css
```

## 创建文章

使用 posts archetype 创建新文章：

```bash
hugo new posts/my-new-post.md
```

新文章会使用 [archetypes/posts.md](archetypes/posts.md) 里的 YAML front matter 模板。

## 文章 Front Matter

文章放在 `content/posts/` 下，front matter 使用 YAML：

```yaml
---
title: "文章标题"
date: "2026-07-02"
lastmod: "2026-07-02"
draft: false
hidden: false
description: "用于 SEO 的描述"
summary: "用于首页和列表页的摘要"
categories: ["写作"]
tags: ["Hugo", "个人网站"]
series: ["site-notes"]
series_order: 1
toc: true
comments: false
featured: false
pinned: false
cover: ""
cover_alt: ""
aliases: []
---
```

字段说明：

- `draft`：是否为草稿。
- `hidden`：是否隐藏在首页、列表、归档和 taxonomy 页面中。
- `description`：页面 meta 描述。
- `summary`：首页和文章列表摘要。
- `categories`：分类。
- `tags`：标签。
- `series`：系列 key，第一版约定只放一个主系列。
- `series_order`：系列内排序。
- `toc`：是否显示目录。
- `comments`：为后续评论功能预留。
- `featured`：为后续精选内容预留。
- `pinned`：为后续置顶文章预留。
- `cover` / `cover_alt`：为后续封面图预留。
- `aliases`：Hugo 别名/重定向。

## 系列文章

系列元数据放在 [data/series.yaml](data/series.yaml)：

```yaml
site-notes:
  title: "个人网站搭建随记"
  description: "记录这个个人网站从空白骨架到可长期写作空间的形成过程。"
  order: 1
```

文章通过 `series` 引用系列 key：

```yaml
series: ["site-notes"]
series_order: 1
```

系列文章页会按 `series_order` 排序，并优先使用系列内上一篇/下一篇。

## 配置结构

站点配置放在：

```text
config/_default/hugo.yaml
```

常用参数：

- `params.siteName`：站点名称。
- `params.intro`：首页介绍文字。
- `params.homeRecentPosts`：首页最近文章数量。
- `pagination.pagerSize`：列表分页数量。
- `params.defaultTheme`：默认主题策略。
- `params.defaultToc`：默认是否显示目录。
- `params.defaultComments`：默认是否开启评论。

## 样式结构

Tailwind 入口：

```text
assets/css/input.css
```

Markdown 正文样式：

```text
assets/css/markdown.css
```

生成后的 CSS：

```text
static/css/main.css
```

修改 `assets/css/` 下的样式后，需要重新运行：

```bash
npm run build:css
```

## 常用目录

```text
content/posts/          文章
data/series.yaml        系列元数据
layouts/                Hugo 模板
layouts/partials/       可复用模板片段
assets/css/             源样式
static/                 静态资源
archetypes/             内容模板
config/_default/        站点配置
```
