# task-orchestrator 🎯

**Multi-agent task orchestrator.** Split complex tasks into sub-tasks, analyze dependencies, and merge worker results.

Inspired by Claude Code's Coordinator Mode and built-in agent orchestration patterns.

## Quick Start

```bash
npx @xiaopin44/task-orchestrator split "Search docs. Analyze dependencies. Generate migration plan."
```

```json
{
  "splittable": true,
  "reason": "适合并行执行",
  "steps": [
    { "id": 1, "description": "Search docs", "deps": [], "parallel": true },
    { "id": 2, "description": "Analyze dependencies", "deps": [], "parallel": true },
    { "id": 3, "description": "Generate migration plan", "deps": [], "parallel": true }
  ]
}
```

## Install

```bash
npm install -g @xiaopin44/task-orchestrator
npm install --save-dev @xiaopin44/task-orchestrator
```

## Usage

### CLI

```bash
# Split a task into sub-steps
npx task-orchestrator split "搜索API文档。分析现有代码依赖。对比新旧接口差异。生成迁移脚本。执行测试验证"

# Merge results from parallel workers
npx task-orchestrator summary '{"summary":"Found 3 endpoints"}' '{"summary":"DB schema changed"}'
```

### API

```js
import { analyzeTask, mergeResults } from '@xiaopin44/task-orchestrator'

// Split a complex task
const plan = analyzeTask("设计数据库结构。实现API端点。编写测试用例。")
console.log(plan.steps)
// → [{ id: 1, description: '设计数据库结构', deps: [], parallel: false },
//     { id: 2, description: '实现API端点', deps: [1], parallel: false },
//     { id: 3, description: '编写测试用例', deps: [2], parallel: false }]

// Merge worker outputs
const merged = mergeResults([
  JSON.stringify({ summary: 'DB schema ready', keyFindings: ['Use PostgreSQL'] }),
  JSON.stringify({ summary: 'API endpoints designed', keyFindings: ['RESTful'] }),
])
```

## Integration

Use with OpenClaw's `sessions_spawn` for multi-agent workflows:

```bash
# Analyze what to split
PLAN=$(npx task-orchestrator split "复杂任务描述")

# Spawn workers in parallel...
# sessions_spawn worker1 "子任务1"
# sessions_spawn worker2 "子任务2"

# Collect and merge
# npx task-orchestrator summary "$result1" "$result2"
```

## License

MIT
