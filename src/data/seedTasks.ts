import { AgentTask } from '../types.js';

export function getDynamicSeedTasks(): AgentTask[] {
  const now = Date.now();
  const ONE_HOUR = 3600 * 1000;
  const ONE_DAY = 24 * ONE_HOUR;

  return [
    // 1. TODAY: COMPLETED MULTI-STEP TASK
    {
      id: 'task-seed-101',
      prompt: 'Read the Q4 Enterprise SaaS financial report, analyze regional expansion metrics, and generate an executive slide deck with growth projections.',
      mode: 'agent',
      status: 'completed',
      createdAt: new Date(now - ONE_HOUR * 2.5).toISOString(),
      updatedAt: new Date(now - ONE_HOUR * 2.4).toISOString(),
      planOutline: [
        'Query knowledge base for Q4 ARR, CAC, and regional revenue records',
        'Execute statistical computation on EMEA vs APAC growth rates',
        'Generate 6-slide executive presentation deck',
        'Verify citations and output artifacts'
      ],
      subTasks: [
        {
          id: 'st-101-1',
          title: 'Search Knowledge Base for Financials',
          description: 'Semantic vector search on uploaded Q4 SaaS report',
          status: 'completed',
          toolName: 'search_knowledge_base',
          traceId: 'tr-101-1',
          dependencies: [],
          resultSummary: 'Retrieved 3 chunks: ARR $14.2M (+38%), EMEA $3.6M (55% YoY), APAC $1.8M.'
        },
        {
          id: 'st-101-2',
          title: 'Compute Regional Growth Rates',
          description: 'Execute sandboxed computation on revenue distribution',
          status: 'completed',
          toolName: 'execute_code',
          traceId: 'tr-101-2',
          dependencies: ['st-101-1'],
          resultSummary: 'EMEA accounts for 25% share; NA accounts for 62% ($8.8M).'
        },
        {
          id: 'st-101-3',
          title: 'Generate Executive Slide Deck',
          description: 'Create multi-slide deck with corporate theme and citations',
          status: 'completed',
          toolName: 'create_presentation',
          traceId: 'tr-101-3',
          dependencies: ['st-101-1', 'st-101-2'],
          resultSummary: 'Generated 6-slide presentation deck (PPTX format).'
        }
      ],
      traces: [
        {
          id: 'tr-101-1',
          toolName: 'search_knowledge_base',
          category: 'knowledge',
          input: { query: 'Q4 ARR growth regional distribution EMEA APAC', topK: 3 },
          output: {
            citationsCount: 3,
            chunks: [
              { docTitle: 'Q4 Enterprise SaaS Strategy & Financial Report', section: '1. Financial Performance', snippet: 'Total ARR reached $14.2 Million, representing 38% YoY growth. Gross margin held at 79.4%.' },
              { docTitle: 'Q4 Enterprise SaaS Strategy & Financial Report', section: '3. Regional Distribution', snippet: 'EMEA expansion generated $3.6M (25% share, 55% YoY). APAC generated $1.8M (13% share).' }
            ]
          },
          status: 'success',
          startedAt: new Date(now - ONE_HOUR * 2.5).toISOString(),
          completedAt: new Date(now - ONE_HOUR * 2.5 + 420).toISOString(),
          durationMs: 420
        },
        {
          id: 'tr-101-2',
          toolName: 'execute_code',
          category: 'data',
          input: {
            code: `const arr = 14.2; const emea = 3.6; const apac = 1.8; const na = 8.8;\nreturn { emeaPct: (emea/arr)*100, apacPct: (apac/arr)*100, naPct: (na/arr)*100 };`
          },
          output: {
            result: { emeaPct: 25.35, apacPct: 12.67, naPct: 61.97 },
            executionTimeMs: 18
          },
          status: 'success',
          startedAt: new Date(now - ONE_HOUR * 2.5 + 450).toISOString(),
          completedAt: new Date(now - ONE_HOUR * 2.5 + 630).toISOString(),
          durationMs: 180
        },
        {
          id: 'tr-101-3',
          toolName: 'create_presentation',
          category: 'productivity',
          input: {
            title: 'Q4 Enterprise Growth & FY2026 Strategy',
            slideCount: 6,
            theme: 'corporate',
            sourceContext: 'ARR $14.2M, NRR 124%, EMEA expansion +55% YoY'
          },
          output: {
            fileId: 'file-seed-deck-1',
            title: 'Q4 Enterprise Growth & FY2026 Strategy.pptx',
            slidesCount: 6,
            format: 'pptx'
          },
          status: 'success',
          startedAt: new Date(now - ONE_HOUR * 2.5 + 650).toISOString(),
          completedAt: new Date(now - ONE_HOUR * 2.5 + 1380).toISOString(),
          durationMs: 730
        }
      ],
      citations: [
        {
          id: 'cite-101-1',
          documentId: 'doc-1',
          documentTitle: 'Q4 Enterprise SaaS Strategy & Financial Report',
          chunkId: 'chunk-1-1',
          snippet: 'Total ARR reached $14.2 Million, representing a 38% Year-over-Year growth compared to $10.3M in Q4 previous year.',
          score: 0.96,
          pageNumber: 1,
          section: '1. Financial Performance'
        },
        {
          id: 'cite-101-2',
          documentId: 'doc-1',
          documentTitle: 'Q4 Enterprise SaaS Strategy & Financial Report',
          chunkId: 'chunk-1-4',
          snippet: 'Regional Distribution: North America 62% ($8.8M), EMEA 25% ($3.6M at 55% YoY), APAC 13% ($1.8M).',
          score: 0.94,
          pageNumber: 2,
          section: '3. Regional Distribution'
        }
      ],
      generatedFiles: [
        {
          id: 'file-seed-deck-1',
          title: 'Q4 Enterprise SaaS Strategy & Growth Deck',
          description: '6-slide executive presentation covering ARR growth, NRR retention, and EMEA market expansion.',
          format: 'pptx',
          content: 'Slide Deck with 6 Slides generated from verified Q4 Financials',
          metadata: {
            slides: [
              { slideNumber: 1, title: 'Q4 Executive SaaS Financial Performance', bullets: ['Total ARR: $14.2M (+38% YoY)', 'Net Revenue Retention: 124%', 'Gross Margin: 79.4%'], notes: 'Present with confidence on top-line acceleration.' },
              { slideNumber: 2, title: 'Regional Expansion & EMEA Surges', bullets: ['North America: 62% ($8.8M)', 'EMEA: 25% ($3.6M, +55% YoY)', 'APAC: 13% ($1.8M)'], notes: 'Highlight high partner demand in London and Berlin.' },
              { slideNumber: 3, title: 'Customer Unit Economics & CAC', bullets: ['CAC dropped from $4,200 to $2,850', 'Payback period lowered to 8.2 months', 'Autonomous agent feature adoption drove 48% onboarding boost'] }
            ]
          },
          createdAt: new Date(now - ONE_HOUR * 2.4).toISOString()
        }
      ],
      tokensUsed: 1840,
      executionDurationMs: 1330,
      finalResponse: `I have completed the full financial and regional analysis based on the verified Q4 Enterprise SaaS report:

### Key Performance Highlights:
- **Total ARR**: Reached **$14.2 Million** (+38% YoY growth from $10.3M) [1].
- **Net Revenue Retention (NRR)**: Peak at **124%** [1].
- **Regional Breakdown**:
  - **North America**: $8.8M (62% share)
  - **EMEA**: $3.6M (25% share, surging at **+55% YoY**) [2]
  - **APAC**: $1.8M (13% share)
- **Unit Economics**: CAC reduced to **$2,850** (down from $4,200), driving faster 8.2 month payback.

I have generated the formal **6-Slide Executive Presentation Deck** ready for download.`
    },

    // 2. ACTIVE TODAY: RUNNING MULTI-STEP TASK WITH REALTIME PULSE
    {
      id: 'task-seed-102',
      prompt: 'Perform deep intelligence research on autonomous AI agent frameworks, evaluate local execution security constraints, and generate a Python sandbox benchmark.',
      mode: 'agent',
      status: 'running',
      createdAt: new Date(now - 45000).toISOString(),
      updatedAt: new Date(now - 5000).toISOString(),
      planOutline: [
        'Web research latest local autonomous agent runtime benchmarks',
        'Analyze local container sandboxing & memory boundaries',
        'Generate Python verification script with safety assertions',
        'Produce technical architecture benchmark report'
      ],
      subTasks: [
        {
          id: 'st-102-1',
          title: 'Web Intelligence on Agent Runtimes',
          description: 'Search latest agent benchmarks and local execution standards',
          status: 'completed',
          toolName: 'web_search_research',
          traceId: 'tr-102-1',
          dependencies: [],
          resultSummary: 'Indexed 4 benchmark references on local agent latency and memory footprint.'
        },
        {
          id: 'st-102-2',
          title: 'Evaluate Local Sandbox Security',
          description: 'Analyze isolated execution constraints and policy enforcement',
          status: 'running',
          toolName: 'execute_code',
          traceId: 'tr-102-2',
          dependencies: ['st-102-1'],
          resultSummary: 'Executing local memory buffer benchmarks...'
        },
        {
          id: 'st-102-3',
          title: 'Generate Sandbox Benchmark Script',
          description: 'Create Python script testing multi-step agent latency',
          status: 'pending',
          toolName: 'generate_code',
          dependencies: ['st-102-2']
        },
        {
          id: 'st-102-4',
          title: 'Synthesize Architecture Report',
          description: 'Compile findings into structured Markdown documentation',
          status: 'pending',
          toolName: 'create_document',
          dependencies: ['st-102-1', 'st-102-3']
        }
      ],
      traces: [
        {
          id: 'tr-102-1',
          toolName: 'web_search_research',
          category: 'web',
          input: { query: 'local autonomous AI agent benchmarks runtime security sandboxing' },
          output: {
            resultsCount: 4,
            sources: [
              { title: 'Local AI Agent Architectures 2026', url: 'https://arxiv.org/abs/2602.agents' },
              { title: 'Sandboxed Code Execution for LLM Agents', url: 'https://security.dev/agent-sandboxing' }
            ]
          },
          status: 'success',
          startedAt: new Date(now - 40000).toISOString(),
          completedAt: new Date(now - 12000).toISOString(),
          durationMs: 28000
        },
        {
          id: 'tr-102-2',
          toolName: 'execute_code',
          category: 'data',
          input: {
            code: `import time; def benchmark_memory_isolation(): return {"status": "isolated", "latency_ms": 32}`
          },
          status: 'running',
          startedAt: new Date(now - 10000).toISOString()
        }
      ],
      citations: [],
      generatedFiles: [],
      tokensUsed: 620,
      executionDurationMs: 38000
    },

    // 3. ACTIVE TODAY: WAITING FOR APPROVAL TASK (Human-in-the-Loop Interceptor)
    {
      id: 'task-seed-103',
      prompt: 'Analyze high-risk customer churn segments from the Q4 dataset, prepare an executive intervention plan, and dispatch an urgent briefing email to the Customer Success Director.',
      mode: 'agent',
      status: 'waiting_approval',
      createdAt: new Date(now - ONE_HOUR * 1.1).toISOString(),
      updatedAt: new Date(now - ONE_HOUR * 1.05).toISOString(),
      planOutline: [
        'Extract churn risk distribution from Customer_Churn_Survey_Data.csv',
        'Compute churn probability metrics for Starter vs Enterprise tiers',
        'Draft high-priority escalation email',
        'Intercept & request human confirmation before external email dispatch'
      ],
      subTasks: [
        {
          id: 'st-103-1',
          title: 'Query Churn Dataset',
          description: 'Read Customer_Churn_Survey_Data.csv from RAG knowledge base',
          status: 'completed',
          toolName: 'search_knowledge_base',
          traceId: 'tr-103-1',
          dependencies: [],
          resultSummary: 'Identified accounts with >5 support tickets showing 4.2x churn risk.'
        },
        {
          id: 'st-103-2',
          title: 'Draft Escalation Email',
          description: 'Compose executive alert with remediation actions',
          status: 'completed',
          toolName: 'draft_email',
          traceId: 'tr-103-2',
          dependencies: ['st-103-1'],
          resultSummary: 'Drafted email to director-cs@enterprise.io with ticket analysis.'
        },
        {
          id: 'st-103-3',
          title: 'Dispatch External Email (Sensitive)',
          description: 'Send high-priority email via corporate mail server (Waiting for user confirmation)',
          status: 'pending',
          toolName: 'send_email',
          dependencies: ['st-103-2']
        }
      ],
      traces: [
        {
          id: 'tr-103-1',
          toolName: 'search_knowledge_base',
          category: 'knowledge',
          input: { query: 'customer churn risk support ticket correlation starter tier', topK: 2 },
          output: {
            citationsCount: 2,
            chunks: [
              { docTitle: 'Customer Churn & Survey Dataset (Q4)', section: 'Support Analysis', snippet: 'Accounts with >5 support tickets in first 30 days have 4.2x higher likelihood of churning.' }
            ]
          },
          status: 'success',
          startedAt: new Date(now - ONE_HOUR * 1.1).toISOString(),
          completedAt: new Date(now - ONE_HOUR * 1.1 + 380).toISOString(),
          durationMs: 380
        },
        {
          id: 'tr-103-2',
          toolName: 'draft_email',
          category: 'communication',
          input: {
            recipient: 'Director of Customer Success (director-cs@enterprise.io)',
            subject: 'URGENT: Q4 Churn Risk Mitigation & Onboarding Bottleneck Action Plan',
            purpose: 'Address 4.2x churn rate in Starter tier and deploy automated onboarding agents.'
          },
          output: {
            subject: 'URGENT: Q4 Churn Risk Mitigation & Onboarding Bottleneck Action Plan',
            to: 'director-cs@enterprise.io',
            draftId: 'draft-9842'
          },
          status: 'success',
          startedAt: new Date(now - ONE_HOUR * 1.1 + 400).toISOString(),
          completedAt: new Date(now - ONE_HOUR * 1.1 + 820).toISOString(),
          durationMs: 420
        }
      ],
      pendingApproval: {
        id: 'appr-seed-103',
        taskId: 'task-seed-103',
        actionType: 'send_email',
        title: 'Dispatch External Escalation Email',
        description: 'The autonomous agent is requesting permission to send a high-priority customer churn escalation email to an external corporate recipient.',
        suggestedAction: 'Send email to director-cs@enterprise.io with churn mitigation directives',
        toolName: 'send_email',
        toolInput: {
          to: 'director-cs@enterprise.io',
          subject: 'URGENT: Q4 Churn Risk Mitigation & Onboarding Bottleneck Action Plan',
          body: `Dear CS Leadership Team,

Analysis of the Q4 Customer Churn Dataset reveals that accounts submitting >5 support tickets in their first 30 days have a 4.2x higher likelihood of churning (average churn risk: 0.74 on Starter plans vs 0.08 on Enterprise).

Recommended Actions:
1. Roll out automated onboarding agent workflow to reduce ticket volume by 48%.
2. Implement priority live chat routing for early accounts exhibiting learning curve blockers.

Please confirm receipt to initiate target outreach.`
        },
        targetDetails: {
          recipient: 'director-cs@enterprise.io',
          securityLevel: 'External Communication',
          estimatedImpact: 'High Priority Notification'
        },
        status: 'pending',
        createdAt: new Date(now - ONE_HOUR * 1.05).toISOString()
      },
      citations: [
        {
          id: 'cite-103-1',
          documentId: 'doc-3',
          documentTitle: 'Customer Churn & Survey Dataset (Q4)',
          chunkId: 'chunk-3-2',
          snippet: 'Support Ticket Correlation: Accounts with >5 support tickets in first 30 days have 4.2x higher likelihood of churning. Introducing automated onboarding agent reduces ticket volume by 48%.',
          score: 0.95,
          section: 'Support Analysis'
        }
      ],
      generatedFiles: [],
      tokensUsed: 1240,
      executionDurationMs: 800,
      finalResponse: `I have extracted the customer churn metrics and prepared the executive escalation email. 

⚠️ **Human Approval Required**: Because sending external emails has irreversible side effects, this action is paused awaiting your confirmation in the approval modal or task inspector.`
    },

    // 4. TODAY: COMPLETED DATA ANALYST TASK
    {
      id: 'task-seed-104',
      prompt: 'Analyze Customer Churn by Plan Tier from the dataset and render an interactive bar chart breakdown.',
      mode: 'data_analyst',
      status: 'completed',
      createdAt: new Date(now - ONE_HOUR * 5).toISOString(),
      updatedAt: new Date(now - ONE_HOUR * 4.9).toISOString(),
      planOutline: [
        'Load churn CSV records',
        'Compute average churn risk grouped by plan tier',
        'Render Recharts visualization data',
        'Generate summary report'
      ],
      subTasks: [
        {
          id: 'st-104-1',
          title: 'Extract Churn Records',
          description: 'Read records from Customer_Churn_Survey_Data.csv',
          status: 'completed',
          toolName: 'search_knowledge_base',
          traceId: 'tr-104-1',
          resultSummary: 'Loaded 10 representative accounts across Enterprise, Pro, and Starter tiers.'
        },
        {
          id: 'st-104-2',
          title: 'Generate Statistical Chart',
          description: 'Compute mean churn risk and render interactive chart',
          status: 'completed',
          toolName: 'analyze_data_and_chart',
          traceId: 'tr-104-2',
          resultSummary: 'Created interactive bar chart showing Starter (77%), Pro (29%), Enterprise (5%).'
        }
      ],
      traces: [
        {
          id: 'tr-104-1',
          toolName: 'search_knowledge_base',
          category: 'knowledge',
          input: { query: 'churn survey records plan tier NPS', topK: 4 },
          output: { recordsCount: 10 },
          status: 'success',
          startedAt: new Date(now - ONE_HOUR * 5).toISOString(),
          completedAt: new Date(now - ONE_HOUR * 5 + 280).toISOString(),
          durationMs: 280
        },
        {
          id: 'tr-104-2',
          toolName: 'analyze_data_and_chart',
          category: 'data',
          input: { dataset: 'Customer_Churn_Survey_Data.csv', chartType: 'bar', metricName: 'Churn Risk by Plan Tier' },
          output: {
            chartType: 'bar',
            data: [
              { category: 'Enterprise', churnRisk: 5.2, npsScore: 9.5, count: 4 },
              { category: 'Pro Plan', churnRisk: 29.3, npsScore: 7.2, count: 3 },
              { category: 'Starter Plan', churnRisk: 77.3, npsScore: 4.0, count: 3 }
            ]
          },
          status: 'success',
          startedAt: new Date(now - ONE_HOUR * 5 + 300).toISOString(),
          completedAt: new Date(now - ONE_HOUR * 5 + 820).toISOString(),
          durationMs: 520
        }
      ],
      chartData: {
        type: 'bar',
        title: 'Average Churn Risk by Subscription Tier (%)',
        xAxisKey: 'category',
        dataKeys: ['churnRisk', 'npsScore'],
        data: [
          { category: 'Enterprise', churnRisk: 5.2, npsScore: 95 },
          { category: 'Pro Plan', churnRisk: 29.3, npsScore: 72 },
          { category: 'Starter Plan', churnRisk: 77.3, npsScore: 40 }
        ]
      },
      citations: [
        {
          id: 'cite-104-1',
          documentId: 'doc-3',
          documentTitle: 'Customer Churn & Survey Dataset (Q4)',
          chunkId: 'chunk-3-1',
          snippet: 'Enterprise customers show average NPS of 9.2 with churn risk under 0.08. Starter plans exhibit highest churn risk (0.74 avg).',
          score: 0.98,
          section: 'Overview'
        }
      ],
      generatedFiles: [],
      tokensUsed: 1410,
      executionDurationMs: 800,
      finalResponse: `### Churn Analysis by Subscription Tier

Based on statistical aggregation of the customer dataset:
- **Enterprise**: **5.2%** average churn risk with high NPS of **9.5/10**.
- **Pro Tier**: **29.3%** average churn risk with stable NPS of **7.2/10**.
- **Starter Tier**: **77.3%** average churn risk with NPS of **4.0/10**, primarily driven by onboarding complexity and slow support response times.`
    },

    // 5. YESTERDAY: RAG AUDIT & MULTI-DOCUMENT COMPARISON TASK
    {
      id: 'task-seed-105',
      prompt: 'Compare the Q4 Enterprise SaaS report against the Autonomous Multi-Agent Architecture spec and summarize compliance requirements.',
      mode: 'document',
      status: 'completed',
      createdAt: new Date(now - ONE_DAY * 1 - ONE_HOUR * 3).toISOString(),
      updatedAt: new Date(now - ONE_DAY * 1 - ONE_HOUR * 2.9).toISOString(),
      planOutline: [
        'Retrieve Architecture spec and Q4 Financial report',
        'Compare Human-in-the-Loop policy alignment',
        'Synthesize compliance audit checklist'
      ],
      subTasks: [
        {
          id: 'st-105-1',
          title: 'Load Domain Documents',
          description: 'Fetch doc-1 and doc-2 from RAG storage',
          status: 'completed',
          toolName: 'search_knowledge_base',
          traceId: 'tr-105-1',
          resultSummary: 'Loaded 5 chunks covering architecture safety protocols and Q4 governance.'
        },
        {
          id: 'st-105-2',
          title: 'Run Document Comparison Engine',
          description: 'Execute comparative cross-evaluation',
          status: 'completed',
          toolName: 'compare_documents',
          traceId: 'tr-105-2',
          resultSummary: 'Identified 100% alignment on Human-in-the-Loop external action gates.'
        }
      ],
      traces: [
        {
          id: 'tr-105-1',
          toolName: 'search_knowledge_base',
          category: 'knowledge',
          input: { query: 'Human-in-the-loop safety protocol compliance', topK: 4 },
          output: { matches: 4 },
          status: 'success',
          startedAt: new Date(now - ONE_DAY * 1 - ONE_HOUR * 3).toISOString(),
          completedAt: new Date(now - ONE_DAY * 1 - ONE_HOUR * 3 + 340).toISOString(),
          durationMs: 340
        },
        {
          id: 'tr-105-2',
          toolName: 'compare_documents',
          category: 'productivity',
          input: { documentIds: ['doc-1', 'doc-2'], focusArea: 'Compliance & Safety' },
          output: { comparisonResult: 'Both documents mandate human approval on external actions and data deletion.' },
          status: 'success',
          startedAt: new Date(now - ONE_DAY * 1 - ONE_HOUR * 3 + 360).toISOString(),
          completedAt: new Date(now - ONE_DAY * 1 - ONE_HOUR * 3 + 890).toISOString(),
          durationMs: 530
        }
      ],
      citations: [
        {
          id: 'cite-105-1',
          documentId: 'doc-2',
          documentTitle: 'Autonomous Multi-Agent Architecture Specification',
          chunkId: 'chunk-2-3',
          snippet: 'Human Approval Gate: All external side-effects (emails, live deployments) must emit a suspended task state awaiting human review.',
          score: 0.99,
          section: '3. Human Approval Gate'
        }
      ],
      generatedFiles: [],
      tokensUsed: 980,
      executionDurationMs: 870,
      finalResponse: `### Compliance Audit Summary
- **Architecture Mandate**: Requires strict isolation on shell execution and human-in-the-loop gates for external triggers.
- **Q4 Strategy Alignment**: Fully adheres to FY2026 security guidelines.`
    },

    // 6. 2 DAYS AGO: DEVELOPER MODE CODE GENERATION TASK
    {
      id: 'task-seed-106',
      prompt: 'Generate a TypeScript token bucket rate limiter with sliding window metrics and unit test suite.',
      mode: 'developer',
      status: 'completed',
      createdAt: new Date(now - ONE_DAY * 2 - ONE_HOUR * 4).toISOString(),
      updatedAt: new Date(now - ONE_DAY * 2 - ONE_HOUR * 3.9).toISOString(),
      planOutline: [
        'Draft RateLimiter class interface',
        'Implement token refill mathematics',
        'Execute unit test suite in sandbox'
      ],
      subTasks: [
        {
          id: 'st-106-1',
          title: 'Implement Token Bucket Class',
          description: 'Write TypeScript algorithm with sliding expiration',
          status: 'completed',
          toolName: 'generate_code',
          traceId: 'tr-106-1',
          resultSummary: 'Synthesized TokenBucketRateLimiter class with 100% type safety.'
        },
        {
          id: 'st-106-2',
          title: 'Run Sandbox Test Suite',
          description: 'Execute mock traffic assertions in sandbox',
          status: 'completed',
          toolName: 'execute_code',
          traceId: 'tr-106-2',
          resultSummary: 'Passed 8/8 assertions (burst tolerance, refill interval).'
        }
      ],
      traces: [
        {
          id: 'tr-106-1',
          toolName: 'generate_code',
          category: 'developer',
          input: { language: 'typescript', feature: 'TokenBucketRateLimiter' },
          output: { linesGenerated: 64, exportedMembers: ['TokenBucketRateLimiter', 'RateLimitConfig'] },
          status: 'success',
          startedAt: new Date(now - ONE_DAY * 2 - ONE_HOUR * 4).toISOString(),
          completedAt: new Date(now - ONE_DAY * 2 - ONE_HOUR * 4 + 610).toISOString(),
          durationMs: 610
        },
        {
          id: 'tr-106-2',
          toolName: 'execute_code',
          category: 'data',
          input: { code: 'const limiter = new TokenBucketRateLimiter(10, 1000); return limiter.consume(5);' },
          output: { passed: true, remainingTokens: 5 },
          status: 'success',
          startedAt: new Date(now - ONE_DAY * 2 - ONE_HOUR * 4 + 630).toISOString(),
          completedAt: new Date(now - ONE_DAY * 2 - ONE_HOUR * 4 + 750).toISOString(),
          durationMs: 120
        }
      ],
      citations: [],
      generatedFiles: [],
      tokensUsed: 1120,
      executionDurationMs: 730,
      finalResponse: `Successfully generated and verified the **TokenBucketRateLimiter** in TypeScript with complete test suite.`
    },

    // 7. ACTIVE TODAY: SECOND PENDING APPROVAL TASK (Batch Operations & Security Gate)
    {
      id: 'task-seed-107',
      prompt: 'Execute automated storage cleanup by purging stale temporary sandbox artifacts and deploying the updated API gateway routing manifest.',
      mode: 'agent',
      status: 'waiting_approval',
      createdAt: new Date(now - ONE_HOUR * 0.8).toISOString(),
      updatedAt: new Date(now - ONE_HOUR * 0.75).toISOString(),
      planOutline: [
        'Audit active sandbox containers and temporary cache volumes',
        'Stage API gateway routing manifest with updated security policies',
        'Request human security approval before staging live deployment'
      ],
      subTasks: [
        {
          id: 'st-107-1',
          title: 'Audit Storage Volumes',
          description: 'Identify unreferenced temporary session caches (>48h stale)',
          status: 'completed',
          toolName: 'execute_code',
          traceId: 'tr-107-1',
          dependencies: [],
          resultSummary: 'Identified 14 temporary cache objects occupying 184MB.'
        },
        {
          id: 'st-107-2',
          title: 'Draft API Routing Manifest',
          description: 'Generate JSON manifest with updated TLS 1.3 headers',
          status: 'completed',
          toolName: 'generate_code',
          traceId: 'tr-107-2',
          dependencies: ['st-107-1'],
          resultSummary: 'Created routing manifest with strict CORS and origin validation.'
        },
        {
          id: 'st-107-3',
          title: 'Deploy Live Gateway Manifest (Sensitive)',
          description: 'Apply live configuration changes to cloud edge routing (Awaiting Human Approval)',
          status: 'pending',
          toolName: 'modify_settings',
          dependencies: ['st-107-2']
        }
      ],
      traces: [
        {
          id: 'tr-107-1',
          toolName: 'execute_code',
          category: 'data',
          input: { query: 'audit sandbox storage cache volume' },
          output: { staleObjects: 14, totalBytes: 192937984 },
          status: 'success',
          startedAt: new Date(now - ONE_HOUR * 0.8).toISOString(),
          completedAt: new Date(now - ONE_HOUR * 0.8 + 240).toISOString(),
          durationMs: 240
        },
        {
          id: 'tr-107-2',
          toolName: 'generate_code',
          category: 'developer',
          input: { manifest: 'edge-gateway-v2.json' },
          output: { version: '2.4.1', policiesEnforced: ['TLS_1_3', 'CORS_RESTRICTED'] },
          status: 'success',
          startedAt: new Date(now - ONE_HOUR * 0.8 + 260).toISOString(),
          completedAt: new Date(now - ONE_HOUR * 0.8 + 510).toISOString(),
          durationMs: 250
        }
      ],
      pendingApproval: {
        id: 'appr-seed-107',
        taskId: 'task-seed-107',
        actionType: 'modify_settings',
        title: 'Deploy Edge Gateway Configuration',
        description: 'The autonomous agent is requesting permission to update live API gateway routing rules and purge 14 legacy sandbox cache objects.',
        suggestedAction: 'Apply edge-gateway-v2.json manifest to production routing table',
        toolName: 'modify_settings',
        toolInput: {
          target: 'edge-gateway-v2.json',
          action: 'apply_routing_and_purge_cache',
          affectedEndpoints: ['/api/v2/*', '/sandbox/stream/*'],
          purgeBytes: 192937984
        },
        targetDetails: {
          manifest: 'edge-gateway-v2.json',
          securityImpact: 'Production Routing Update',
          staleCachePurge: '184 MB'
        },
        status: 'pending',
        createdAt: new Date(now - ONE_HOUR * 0.75).toISOString()
      },
      citations: [],
      generatedFiles: [],
      tokensUsed: 890,
      executionDurationMs: 580,
      finalResponse: `I have audited the system cache and staged the updated edge routing manifest.

⚠️ **Human Approval Required**: Deploying production configuration changes requires explicit human verification.`
    }
  ];
}

export const INITIAL_SEED_TASKS: AgentTask[] = getDynamicSeedTasks();

