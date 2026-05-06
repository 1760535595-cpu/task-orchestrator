/**
 * 协调者工具——多 Agent 任务编排
 * 
 * 用法：
 *   node orchestrator.js split "任务描述"    → 分析任务并生成拆分方案
 *   node orchestrator.js summary "结果1" "结果2"  → 合并多个 worker 结果
 */

// ---------- Task Splitter 核心逻辑 ----------

function analyzeTask(task) {
  // 启发式分析：根据关键词判断是否适合拆分
  const keywords = {
    parallel: ['同时', '分别', '对比', '比较', '搜索', '查找', '多个', '各', '所有', 'every', 'all', 'each'],
    sequential: ['先', '然后', '再', '接着', '最后', 'first', 'then', 'next', 'finally', 'after'],
    combined: ['重构', '迁移', '升级', '实现', '开发', 'refactor', 'migrate', 'implement']
  }

  const lines = task.split(/[。\n;]/).filter(l => l.trim())
  const estimatedSteps = lines.length

  // 如果只有 1-2 个步骤，不适合拆分
  if (estimatedSteps <= 2) {
    return {
      splittable: false,
      reason: '任务简单，不需要拆分',
      steps: lines.map((l, i) => ({ id: i + 1, description: l.trim(), deps: [] }))
    }
  }

  // 分析依赖关系
  const steps = lines.map((line, i) => {
    const cleanLine = line.trim()
    if (!cleanLine) return null
    
    // 检查是否依赖前面的步骤
    const deps = []
    for (let j = 0; j < i; j++) {
      const prev = lines[j]
      // 简单启发：如果当前行引用了前面行的关键词
      const prevKeywords = prev.split(/\s+/).filter(w => w.length > 2)
      for (const kw of prevKeywords) {
        if (cleanLine.includes(kw)) {
          deps.push(j + 1)
          break
        }
      }
    }

    const isParallel = keywords.parallel.some(k => cleanLine.includes(k))
    return {
      id: i + 1,
      description: cleanLine,
      deps: [...new Set(deps)],
      parallel: isParallel && deps.length === 0
    }
  }).filter(Boolean)

  // 如果步骤间没有依赖且步骤 >= 3，适合并行拆分
  const hasDeps = steps.some(s => s.deps.length > 0)
  const canParallel = !hasDeps && steps.length >= 3

  return {
    splittable: steps.length >= 3,
    reason: canParallel ? '适合并行执行' : (hasDeps ? '有依赖关系，需要串行或分层执行' : '适合串行执行'),
    steps
  }
}

function mergeResults(results) {
  const items = results.map(r => {
    try { return JSON.parse(r) }
    catch { return { text: r } }
  })

  return {
    summary: items.map(i => i.summary || i.text || '').join('\n'),
    keyFindings: items.flatMap(i => i.keyFindings || [i.text || '']).filter(Boolean),
    merged: true
  }
}

// ---------- CLI ----------

const mode = process.argv[2]
const args = process.argv.slice(3)

if (mode === 'split') {
  const task = args.join(' ')
  console.log(JSON.stringify(analyzeTask(task), null, 2))
} else if (mode === 'summary') {
  const merged = mergeResults(args)
  console.log(JSON.stringify(merged, null, 2))
} else if (mode === '--help' || mode === '-h') {
  console.log(`task-orchestrator — Multi-agent task orchestrator

USAGE:
  npx task-orchestrator split "<task description>"
  npx task-orchestrator summary "<result1>" "<result2>"
  npx task-orchestrator --help

EXAMPLES:
  npx task-orchestrator split "搜索文档。修改代码。运行测试。"
  npx task-orchestrator summary '{"status":"ok"}' '{"status":"fail"}'

EXIT CODES:
  0 — Success
  1 — Error
`)
} else {
  console.log(JSON.stringify({
    error: 'Unknown mode',
    usage: 'node orchestrator.js split|summary <args>'
  }))
  process.exit(1)
}

export { analyzeTask, mergeResults }
