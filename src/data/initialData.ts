import { KnowledgeDocument, ToolDefinition, MemoryItem } from '../types';

export const INITIAL_DOCUMENTS: KnowledgeDocument[] = [
  {
    id: 'doc-1',
    title: 'Q4 Enterprise SaaS Strategy & Financial Report',
    filename: 'Q4_Enterprise_SaaS_Strategy_Report.pdf',
    fileType: 'pdf',
    sizeBytes: 245000,
    uploadedAt: new Date(Date.now() - 3600000 * 24 * 3).toISOString(),
    chunksCount: 8,
    status: 'ready',
    summary: 'Executive overview of Q4 ARR growth ($14.2M, +38% YoY), expansion into EMEA markets, CAC reduction from $4,200 to $2,850, customer net retention at 124%, and AI feature adoption roadmap for FY2026.',
    tags: ['finance', 'strategy', 'q4', 'executive'],
    rawContent: `EXECUTIVE SUMMARY - Q4 ENTERPRISE SAAS REPORT
1. Financial Performance:
Total ARR reached $14.2 Million, representing a 38% Year-over-Year growth compared to $10.3M in Q4 of previous fiscal year. Gross margin held strong at 79.4%.
Net Revenue Retention (NRR) achieved an all-time peak of 124%, driven by enterprise tier expansions and add-on analytics modules.
Customer Acquisition Cost (CAC) decreased significantly from $4,200 to $2,850 due to organic product-led growth and targeted partner integrations.

2. Product & AI Platform Metrics:
The new Autonomous Agent workflow feature saw 450 enterprise accounts onboarded in Beta, processing over 1.8M automated tasks monthly.
Average time-to-value (TTV) decreased from 14 days to 2.4 days after introducing automated RAG knowledge base connectors.

3. Regional Distribution:
North America accounts for 62% of revenue ($8.8M).
EMEA expansion generated $3.6M (25% share), growing at 55% YoY.
APAC generated $1.8M (13% share) with high demand in Australia and Singapore.

4. Strategic Directives for FY2026:
- Expand multi-agent autonomous tool calling capabilities.
- Implement strict Human-in-the-Loop approval workflows for financial and external API triggers.
- Target $22M ARR by end of FY2026 with 82% target gross margin.`,
    chunks: [
      {
        id: 'chunk-1-1',
        documentId: 'doc-1',
        content: 'Total ARR reached $14.2 Million, representing a 38% Year-over-Year growth compared to $10.3M in Q4 previous year. Gross margin held at 79.4%. Net Revenue Retention (NRR) achieved 124%.',
        chunkIndex: 0,
        page: 1,
        section: '1. Financial Performance'
      },
      {
        id: 'chunk-1-2',
        documentId: 'doc-1',
        content: 'Customer Acquisition Cost (CAC) decreased from $4,200 to $2,850 due to organic product-led growth and targeted partner integrations. Payback period shortened to 8.2 months.',
        chunkIndex: 1,
        page: 1,
        section: '1. Financial Performance'
      },
      {
        id: 'chunk-1-3',
        documentId: 'doc-1',
        content: 'Autonomous Agent workflow feature onboarded 450 enterprise accounts in Beta, executing over 1.8M automated tasks monthly. Average time-to-value decreased from 14 days to 2.4 days.',
        chunkIndex: 2,
        page: 2,
        section: '2. Product & AI Platform'
      },
      {
        id: 'chunk-1-4',
        documentId: 'doc-1',
        content: 'Regional Distribution: North America 62% ($8.8M), EMEA 25% ($3.6M at 55% YoY), APAC 13% ($1.8M). Key expansion focus for next year is EMEA enterprise security compliance.',
        chunkIndex: 3,
        page: 2,
        section: '3. Regional Distribution'
      },
      {
        id: 'chunk-1-5',
        documentId: 'doc-1',
        content: 'Strategic Directives FY2026: Expand multi-agent autonomous tool calling, implement Human-in-the-Loop approvals for sensitive triggers, target $22M ARR and 82% gross margin.',
        chunkIndex: 4,
        page: 3,
        section: '4. Strategic Directives'
      }
    ]
  },
  {
    id: 'doc-2',
    title: 'Autonomous Multi-Agent Architecture Specification',
    filename: 'Agent_Architecture_Spec.md',
    fileType: 'markdown',
    sizeBytes: 112000,
    uploadedAt: new Date(Date.now() - 3600000 * 48).toISOString(),
    chunksCount: 6,
    status: 'ready',
    summary: 'Technical architecture outlining the Task Planner, Dynamic RAG Router, Tool Registry, Sandboxed Code Execution, and Human-in-the-loop safety protocol.',
    tags: ['engineering', 'architecture', 'agents', 'rag'],
    rawContent: `# Autonomous AI Agent System Architecture

## 1. Request Pipeline
1. Intent Recognition: Classifies whether request is Direct Answer, Deep Research, Multi-step Task, Code Analysis, or Document Transformation.
2. Task Planner: Breaks complex instructions into a Directed Acyclic Graph (DAG) of subtasks with pre-conditions and expected outputs.
3. RAG Retrieval Gate: Evaluates if private domain documents are required. If query references private knowledge, chunks are fetched via hybrid embedding + BM25 keyword matching.

## 2. Tool Execution Engine
- Sandboxed execution for JavaScript & Python code.
- Dynamic schema matching with Gemini Function Declarations.
- Error interception and auto-retry up to 3 attempts with fallback parameters.

## 3. Human Approval Gate
Sensitive operations (Email dispatch, file deletion, financial actions, external API mutations) pause execution, generate a cryptographic token, and require explicit UI approval with 'Cancel | Review | Confirm & Send'.

## 4. Verification Step
Upon subtask completion, the Agent Critic verifies output format against schema requirements and checks that citations are properly attributed to source chunk indices.`,
    chunks: [
      {
        id: 'chunk-2-1',
        documentId: 'doc-2',
        content: 'Intent Recognition classifies whether request is Direct Answer, Deep Research, Multi-step Task, Code Analysis, or Document Transformation. Task Planner creates a DAG of subtasks.',
        chunkIndex: 0,
        section: '1. Request Pipeline'
      },
      {
        id: 'chunk-2-2',
        documentId: 'doc-2',
        content: 'RAG Retrieval Gate: If query references private knowledge, chunks are fetched via hybrid embedding + BM25 keyword matching and reranked before injecting into the context window.',
        chunkIndex: 1,
        section: '1. Request Pipeline'
      },
      {
        id: 'chunk-2-3',
        documentId: 'doc-2',
        content: 'Human Approval Gate: Sensitive operations (Email dispatch, file deletion, financial actions, external API mutations) pause execution and require explicit UI approval.',
        chunkIndex: 2,
        section: '3. Human Approval Gate'
      },
      {
        id: 'chunk-2-4',
        documentId: 'doc-2',
        content: 'Verification Step: Agent Critic verifies output format against schema requirements and validates that citations are properly attributed to source chunk indices.',
        chunkIndex: 3,
        section: '4. Verification Step'
      }
    ]
  },
  {
    id: 'doc-3',
    title: 'Customer Churn & Survey Dataset (Q4)',
    filename: 'Customer_Churn_Survey_Data.csv',
    fileType: 'csv',
    sizeBytes: 85000,
    uploadedAt: new Date(Date.now() - 3600000 * 72).toISOString(),
    chunksCount: 4,
    status: 'ready',
    summary: 'Dataset with 500 customer records detailing plan tier, NPS score (avg 68), churn risk score, support ticket count, monthly active usage, and primary churn reasons.',
    tags: ['data', 'churn', 'customers', 'analytics'],
    rawContent: `CustomerID,PlanTier,MonthlyUsageHours,NPS,SupportTickets,ChurnRisk,PrimaryReason
CUST-101,Enterprise,142,9,1,0.08,None
CUST-102,Pro,45,6,4,0.42,Pricing
CUST-103,Enterprise,190,10,0,0.02,None
CUST-104,Starter,12,4,7,0.78,Integration Complexity
CUST-105,Pro,88,8,2,0.15,Feature Request
CUST-106,Enterprise,210,9,1,0.05,None
CUST-107,Starter,8,3,9,0.89,Slow Support
CUST-108,Pro,64,7,3,0.31,Competitor Offering
CUST-109,Enterprise,165,10,1,0.04,None
CUST-110,Starter,15,5,5,0.65,Learning Curve`,
    chunks: [
      {
        id: 'chunk-3-1',
        documentId: 'doc-3',
        content: 'Customer Churn Analysis: Enterprise customers show average NPS of 9.2 with churn risk under 0.08. Starter plans exhibit highest churn risk (0.74 avg) linked to integration complexity and learning curve.',
        chunkIndex: 0,
        section: 'Overview'
      },
      {
        id: 'chunk-3-2',
        documentId: 'doc-3',
        content: 'Support Ticket Correlation: Accounts with >5 support tickets in first 30 days have 4.2x higher likelihood of churning. Introducing automated onboarding agent reduces ticket volume by 48%.',
        chunkIndex: 1,
        section: 'Support Analysis'
      }
    ]
  }
];

export const INITIAL_TOOLS: ToolDefinition[] = [
  {
    id: 'tool-rag-search',
    name: 'search_knowledge_base',
    displayName: 'Knowledge Base Search (RAG)',
    description: 'Searches indexed documents using hybrid semantic vector search and keyword matching with citation coordinates.',
    category: 'knowledge',
    isSensitive: false,
    parameters: [
      { name: 'query', type: 'string', description: 'Semantic search query', required: true },
      { name: 'topK', type: 'number', description: 'Number of chunks to return (default: 4)', required: false, defaultValue: 4 },
      { name: 'filterTag', type: 'string', description: 'Optional tag filter', required: false }
    ]
  },
  {
    id: 'tool-compare-docs',
    name: 'compare_documents',
    displayName: 'Document Comparison',
    description: 'Compares two or more documents, highlighting differences, contradictions, and shared themes.',
    category: 'knowledge',
    isSensitive: false,
    parameters: [
      { name: 'documentIds', type: 'array', description: 'List of document IDs to compare', required: true },
      { name: 'focusArea', type: 'string', description: 'Specific aspects or metrics to compare', required: false }
    ]
  },
  {
    id: 'tool-generate-slides',
    name: 'create_presentation',
    displayName: 'Slide Deck Presentation Maker',
    description: 'Generates structured multi-slide presentation decks (PPTX compatible) with titles, bullet points, visual themes, and presenter notes.',
    category: 'productivity',
    isSensitive: false,
    parameters: [
      { name: 'title', type: 'string', description: 'Presentation title', required: true },
      { name: 'slideCount', type: 'number', description: 'Number of slides (e.g. 5-10)', required: true },
      { name: 'sourceContext', type: 'string', description: 'Information to summarize into slides', required: true },
      { name: 'theme', type: 'string', description: 'Visual theme style (modern, corporate, minimal, dark)', required: false }
    ]
  },
  {
    id: 'tool-generate-doc',
    name: 'create_document',
    displayName: 'Document & Report Generator',
    description: 'Creates professional reports, executive summaries, or proposals formatted in Markdown, PDF-ready layout, or DOCX structure.',
    category: 'productivity',
    isSensitive: false,
    parameters: [
      { name: 'title', type: 'string', description: 'Document title', required: true },
      { name: 'format', type: 'string', description: 'Format: markdown | pdf | docx | txt', required: true },
      { name: 'sections', type: 'array', description: 'Key section headings and content guidelines', required: true }
    ]
  },
  {
    id: 'tool-generate-sheet',
    name: 'create_spreadsheet',
    displayName: 'Spreadsheet & CSV Builder',
    description: 'Constructs structured tabular datasets, financial models, or comparison matrices exportable to XLSX/CSV.',
    category: 'productivity',
    isSensitive: false,
    parameters: [
      { name: 'title', type: 'string', description: 'Sheet title', required: true },
      { name: 'columns', type: 'array', description: 'Column headers', required: true },
      { name: 'data', type: 'array', description: 'Rows data objects', required: true }
    ]
  },
  {
    id: 'tool-code-exec',
    name: 'execute_code',
    displayName: 'Code Execution Sandbox',
    description: 'Executes JavaScript or data transformation scripts to compute exact statistics, perform data filtering, or test algorithms.',
    category: 'data',
    isSensitive: false,
    parameters: [
      { name: 'code', type: 'string', description: 'JavaScript / Python expression or function', required: true },
      { name: 'inputData', type: 'object', description: 'Dataset or variables to pass in', required: false }
    ]
  },
  {
    id: 'tool-data-analysis',
    name: 'analyze_data_and_chart',
    displayName: 'Data Analyst & Chart Engine',
    description: 'Computes statistical summaries, trends, correlations, and generates responsive interactive visual charts (Bar, Line, Area, Pie).',
    category: 'data',
    isSensitive: false,
    parameters: [
      { name: 'dataset', type: 'string', description: 'Raw CSV/JSON data or document ID', required: true },
      { name: 'chartType', type: 'string', description: 'bar | line | area | pie', required: true },
      { name: 'metricName', type: 'string', description: 'Primary metric to evaluate', required: true }
    ]
  },
  {
    id: 'tool-web-search',
    name: 'web_search_research',
    displayName: 'Web Research & Intelligence',
    description: 'Conducts multi-source web intelligence, gathering current competitive benchmarks, news, and technical references.',
    category: 'web',
    isSensitive: false,
    parameters: [
      { name: 'query', type: 'string', description: 'Search query', required: true },
      { name: 'targetDomains', type: 'array', description: 'Optional domains to prioritize', required: false }
    ]
  },
  {
    id: 'tool-draft-email',
    name: 'draft_email',
    displayName: 'Email Drafter',
    description: 'Drafts tailored professional email communications with subject, recipient, and body.',
    category: 'communication',
    isSensitive: false,
    parameters: [
      { name: 'recipient', type: 'string', description: 'Recipient name or email', required: true },
      { name: 'subject', type: 'string', description: 'Email subject line', required: true },
      { name: 'purpose', type: 'string', description: 'Key message points', required: true }
    ]
  },
  {
    id: 'tool-send-email',
    name: 'send_email',
    displayName: 'Send Email (Sensitive)',
    description: 'Dispatches an email message to an external recipient. ALWAYS triggers Human-in-the-Loop confirmation before sending.',
    category: 'communication',
    isSensitive: true,
    parameters: [
      { name: 'to', type: 'string', description: 'Recipient email address', required: true },
      { name: 'subject', type: 'string', description: 'Subject line', required: true },
      { name: 'body', type: 'string', description: 'Full email content', required: true }
    ]
  },
  {
    id: 'tool-schedule-event',
    name: 'create_calendar_event',
    displayName: 'Calendar & Meeting Scheduler',
    description: 'Schedules calendar appointments, meetings, and sets automated reminder notifications.',
    category: 'scheduling',
    isSensitive: false,
    parameters: [
      { name: 'title', type: 'string', description: 'Event title', required: true },
      { name: 'date', type: 'string', description: 'ISO date or description (e.g. tomorrow 2pm)', required: true },
      { name: 'durationMinutes', type: 'number', description: 'Duration in minutes', required: true },
      { name: 'attendees', type: 'array', description: 'List of attendee emails', required: false }
    ]
  },
  {
    id: 'tool-code-gen',
    name: 'generate_code',
    displayName: 'Developer Code Generator & Debugger',
    description: 'Generates production-grade code, unit tests, refactoring suggestions, or bug fixes with syntax explanations.',
    category: 'developer',
    isSensitive: false,
    parameters: [
      { name: 'language', type: 'string', description: 'TypeScript, Python, SQL, Rust, Go, etc.', required: true },
      { name: 'specification', type: 'string', description: 'Detailed feature requirements', required: true },
      { name: 'framework', type: 'string', description: 'Target framework (React, Express, FastAPI, etc.)', required: false }
    ]
  }
];

export const INITIAL_MEMORIES: MemoryItem[] = [
  {
    id: 'mem-1',
    type: 'preference',
    key: 'Tone & Style',
    value: 'Direct, analytical, and structured with concise executive bullet points. Avoid filler words.',
    createdAt: new Date(Date.now() - 3600000 * 24 * 7).toISOString(),
    source: 'user_defined',
    enabled: true
  },
  {
    id: 'mem-2',
    type: 'workflow',
    key: 'Presentation Standards',
    value: 'When generating presentations, always include an Agenda slide, 3-5 content slides with data citations, and a Concluding Next Steps slide.',
    createdAt: new Date(Date.now() - 3600000 * 24 * 5).toISOString(),
    source: 'auto_extracted',
    enabled: true
  },
  {
    id: 'mem-3',
    type: 'guideline',
    key: 'Sensitive Actions Policy',
    value: 'Always require explicit confirmation before sending external emails, deleting documents, or mutating billing records.',
    createdAt: new Date(Date.now() - 3600000 * 24 * 10).toISOString(),
    source: 'user_defined',
    enabled: true
  },
  {
    id: 'mem-4',
    type: 'fact',
    key: 'Fiscal Target FY2026',
    value: 'Enterprise company FY2026 revenue goal is $22M ARR with 82% target gross margin.',
    createdAt: new Date(Date.now() - 3600000 * 24 * 2).toISOString(),
    source: 'auto_extracted',
    enabled: true
  }
];
