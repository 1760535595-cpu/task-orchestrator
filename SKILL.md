---
name: coordinator-mode
description: "多Agent编排模式。将复杂任务拆分为多个子Agent并行/串行执行，提供Worker通知格式和Scratchpad协调。"
---

# 协调者模式 (Coordinator Mode)

## 概念

当收到**复杂的多步骤任务**时，启用协调者模式：将任务拆分为多个可以独立运行的子任务，派发给子 Agent（通过 `sessions_spawn`）并行或串行执行。

## 何时使用

- 任务包含 **3 个以上独立步骤**
- 需要**并行探索**多个方向（如同时搜索多个 API 文档）
- 任务可以分为**明确边界**的子任务
- 任务涉及的上下文量大，拆分可以节省 Token

不需要协调者的场景：
- 简单的编辑/问答（一个步骤）
- 需要强上下文连贯性的任务（如重构）

## 任务拆分模板

### 1. 分析 → 拆解

```markdown
## 任务分析

总目标：（一句话描述）

可拆分步骤：
1. （第一步）— 独立，需要工具 A
2. （第二步）— 独立，需要工具 B
3. （第三步）— 依赖第一步结果

依赖关系：3 → 1,2
```

### 2. 派发 Worker

使用 `sessions_spawn` 派发子任务：

```
派发 Worker 1：执行步骤 1
派发 Worker 2：执行步骤 2
等待结果...
汇总步骤 1、2 的结果 → 执行步骤 3
```

### 3. Worker 通知格式

子 Agent 返回结果时使用统一格式：

```xml
<task-notification>
  <task-id>子任务1</task-id>
  <status>completed|failed</status>
  <summary>一句话总结做了什么</summary>
  <key-findings>关键发现（如果有）</key-findings>
</task-notification>
```

### 4. 汇总合成

收到所有 Worker 结果后：
1. 不要感谢 Worker（Worker 是工具不是人）
2. 不要编造 Worker 结果
3. 合成为主：理解结果 + 写具体代码/指示
4. 区分"继续完善"（与上次结果 overlap 高）vs "重新生成"

## Scratchpad（跨 Worker 知识共享）

对于相互依赖的子任务，使用 scratchpad 文件传递状态：

```markdown
/sketch/scratchpad.md
```

内容格式：

```markdown
# Scratchpad: （任务名称）

## 共享上下文

- 仓库路径：...
- 关键文件：...
- 默认分支：...

## Worker 1 输出

（完成内容摘要）

## Worker 2 输出

（完成内容摘要）
```

## 实用拆分模式

### 探索模式
多个 Worker 并行搜索/读取不同来源
→ 汇总对比 → 输出综合结论

### 拆分模式
大文件/复杂模块拆成多个 Worker 各自处理
→ 合并/协调接口 → 输出完整方案

### 审查模式
一个 Worker 修改代码
另一个 Worker 审查修改
→ 根据审查结果修正

## 示例

**复杂重构任务：**

```
用户：帮我升级这个项目的 Webpack 配置到 Vite

步骤：
1. Worker A: 分析现有 webpack.config.js 依赖和插件
2. Worker B: 研究 Vite 配置最佳实践
3. 汇总：根据 A 结果 + B 知识，生成迁移方案
4. Worker C: 根据方案执行代码修改
5. Worker D: 验证构建是否成功
```
