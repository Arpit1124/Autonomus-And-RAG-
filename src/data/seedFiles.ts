import { GeneratedFile } from '../types.js';

/**
 * Generates rich, realistic generated artifacts dynamically computed relative
 * to the latest daily 23:00 nightly batch synchronization cycle.
 */
export function getDynamicSeedFiles(referenceDate: Date = new Date()): GeneratedFile[] {
  // Compute the latest 23:00 timestamp
  const now = referenceDate.getTime();
  const todayNight23 = new Date(referenceDate);
  todayNight23.setHours(23, 0, 0, 0);

  let latest23Timestamp = todayNight23.getTime();
  if (now < latest23Timestamp) {
    // If current time is before 23:00 today, the last run was yesterday at 23:00
    latest23Timestamp -= 24 * 3600 * 1000;
  }

  const syncIso = new Date(latest23Timestamp).toISOString();

  return [
    {
      id: 'file-seed-deck-1',
      title: 'Q4_Executive_Board_Deck.pptx',
      description: '6-slide executive board presentation covering Q4 ARR ($14.2M, +38% YoY), EMEA expansion (+55%), CAC reduction, and FY2026 roadmap with interactive slide rendering.',
      format: 'pptx',
      content: 'Q4 Executive Board Presentation Deck with Financials, Regional Growth, and AI Platform adoption.',
      createdAt: new Date(latest23Timestamp + 180000).toISOString(),
      downloadUrl: '#',
      metadata: {
        slides: [
          {
            slideNumber: 1,
            title: 'Q4 Enterprise SaaS Executive Summary',
            bullets: [
              'Record ARR milestone: $14.2 Million achieved (+38% YoY)',
              'Net Revenue Retention (NRR) reached all-time high of 124%',
              'Gross Margin expanded to 79.4% through automated orchestration',
              '450 enterprise accounts onboarded in Beta'
            ],
            notes: 'Presenter: Start with ARR trajectory and emphasize CAC reduction to $2,850.'
          },
          {
            slideNumber: 2,
            title: 'Financial Performance & Revenue Dynamics',
            bullets: [
              'North America: $8.8M ARR (62% revenue contribution)',
              'EMEA High-Growth Market: $3.6M ARR (+55% YoY, 25% share)',
              'APAC Expansion: $1.8M ARR (13% share, strong AU/SG uptake)',
              'Payback period shortened from 14.1 months to 8.2 months'
            ],
            notes: 'Highlight EMEA enterprise security compliance accelerating deal velocity.'
          },
          {
            slideNumber: 3,
            title: 'Customer Economics & Churn Reduction',
            bullets: [
              'CAC decreased from $4,200 to $2,850 via organic product-led acquisition',
              'Average NPS across enterprise tiers rose from 68 to 74',
              'Support tickets with automated RAG deflection reduced by 48%',
              'Churn risk score across enterprise cohort stabilized under 0.08'
            ],
            notes: 'Customer survey dataset shows learning curve is primary friction for starter tier.'
          },
          {
            slideNumber: 4,
            title: 'Autonomous Multi-Agent Architecture',
            bullets: [
              'Intent-Driven Task Planner with DAG subtask orchestration',
              'Hybrid Vector RAG Gate with BM25 reranking and chunk citations',
              'Sandboxed tool execution across 12 verified capabilities',
              'Zero-Trust RBAC with Human-in-the-Loop approval interceptors'
            ],
            notes: 'Demonstrate the 1,120ms average subtask execution latency.'
          },
          {
            slideNumber: 5,
            title: 'Daily 23:00 Nocturnal Self-Updating Engine',
            bullets: [
              'Nightly batch recalculation of Gantt histories and task metrics',
              'Vector index re-indexing and document chunk optimization',
              'Memory rule validation and autonomous guardrail tuning',
              'Automated generation of audit telemetry and compliance logs'
            ],
            notes: 'Emphasize zero downtime and continuous operational readiness.'
          },
          {
            slideNumber: 6,
            title: 'Strategic Directives for FY2026',
            bullets: [
              'Target ARR: $22.0 Million with 82% target gross margin',
              'Expand enterprise Human-in-the-Loop multi-signature approvals',
              'Deploy local on-premise memory encryption modules',
              'Q1 Milestone: General availability of Autonomous AgentOS'
            ],
            notes: 'Conclude with Q1 hiring and enterprise pilot expansion targets.'
          }
        ]
      }
    },
    {
      id: 'file-seed-report-1',
      title: 'Autonomous_MultiAgent_Workflow_Report.pdf',
      description: 'Comprehensive audit report on autonomous execution latency, safety interceptor efficacy, zero-trust RBAC permissions, and tool telemetry.',
      format: 'pdf',
      createdAt: new Date(latest23Timestamp + 320000).toISOString(),
      downloadUrl: '#',
      content: `# Autonomous AgentOS Platform Architecture & Verification Report
**Generated by Nocturnal Synchronization Engine (Daily 23:00 UTC)**
**Version:** 2.4-Enterprise | **Compliance:** Zero-Trust SOC2 / ISO-27001

## 1. Executive Summary
During the daily 23:00 orchestration cycle, the system verified all 12 registered tool capabilities, synced 14 knowledge graph embeddings, and validated subtask execution traces. Overall execution success rate currently stands at **99.4%** across 1,840 automated daily runs.

## 2. Security & RBAC Enforcement Matrix
- **Admin Role:** Full governance, API token rotation, schema migration, model selection.
- **Lead Role:** Human-in-the-Loop approval gatekeeper (e.g. Email dispatch, database deletion, payment webhooks).
- **Analyst Role:** RAG knowledge querying, code execution sandbox, data visualization generation.
- **Auditor Role:** Read-only compliance telemetry, Gantt trace inspection, export access.

## 3. Human-in-the-Loop Interceptor Statistics
- Intercepted Sensitive Actions: 34 requests
- Average Approval Turnaround: 4.2 minutes
- False Positive Interceptions: 0.0%
- Modifications Made in UI Review: 18% (e.g., parameter tuning before sending)

## 4. Latency & Concurrency Benchmarks
- Vector Search P95: 18ms
- Sandboxed Script Execution: 32ms
- Multi-step Task Planning: 420ms
- Full Workflow Completion: 1,120ms avg`,
      metadata: {
        wordCount: 380
      }
    },
    {
      id: 'file-seed-script-1',
      title: 'Customer_Churn_Statistical_Model.py',
      description: 'Python analytics script computing Logistic Regression and Random Forest feature importance on the Q4 Customer Churn survey dataset.',
      format: 'code',
      createdAt: new Date(latest23Timestamp + 450000).toISOString(),
      downloadUrl: '#',
      metadata: {
        language: 'python'
      },
      content: `"""
Customer Churn Predictive Analytics & Feature Importance
Generated automatically by AgentOS Nightly Analytics Engine (23:00 Batch)
"""

import numpy as np
import pandas as pd
from typing import Dict, Any

def train_churn_model(csv_filepath: str = "Customer_Churn_Survey_Data.csv") -> Dict[str, Any]:
    print("[AgentOS 23:00 Sync] Loading customer survey records...")
    df = pd.DataFrame([
        {"tier": "Enterprise", "hours": 142, "nps": 9, "tickets": 1, "churn": 0.08},
        {"tier": "Pro", "hours": 45, "nps": 6, "tickets": 4, "churn": 0.42},
        {"tier": "Enterprise", "hours": 190, "nps": 10, "tickets": 0, "churn": 0.02},
        {"tier": "Starter", "hours": 12, "nps": 4, "tickets": 7, "churn": 0.78},
        {"tier": "Pro", "hours": 88, "nps": 8, "tickets": 2, "churn": 0.15},
    ])
    
    # Calculate feature correlations
    correlation_matrix = df[["hours", "nps", "tickets", "churn"]].corr()
    
    # Feature Importance weights
    feature_importance = {
        "support_ticket_frequency": 0.46,
        "nps_satisfaction": 0.32,
        "monthly_usage_hours": 0.18,
        "plan_tier_level": 0.04
    }
    
    print("[AgentOS 23:00 Sync] Model trained successfully. R2 = 0.942, AUC = 0.968.")
    return {
        "status": "ready",
        "feature_importance": feature_importance,
        "recommended_action": "Trigger automated onboarding workflow for accounts with >3 tickets in first 14 days."
    }

if __name__ == "__main__":
    results = train_churn_model()
    print(results)
`
    },
    {
      id: 'file-seed-audit-1',
      title: 'Daily_Nocturnal_Sync_Audit_Log_2300.json',
      description: 'JSON telemetry audit log exported during the daily 23:00 UTC automated self-updating batch run.',
      format: 'json',
      createdAt: syncIso,
      downloadUrl: '#',
      content: JSON.stringify({
        batchId: `sync-batch-2300-${new Date(latest23Timestamp).toISOString().split('T')[0]}`,
        scheduledRunTime: '23:00:00 UTC',
        executedAt: syncIso,
        durationSeconds: 3.42,
        tasksSyncedCount: 4,
        ganttTimelineSlicesUpdated: 16,
        ragDocumentsReIndexed: 3,
        vectorEmbeddingsRecalculated: 14,
        toolsRegistryHealthCheck: '12/12 Operational (100%)',
        memoryRulesActive: 4,
        metrics30DayTrendRegenerated: true,
        zeroTrustAuditPassed: true,
        securitySignature: 'SHA256:7f83b1657ff1fc53b92dc18148a1d65dfc2d4b1fa3d677284addd200126d9069'
      }, null, 2)
    },
    {
      id: 'file-seed-matrix-1',
      title: 'Enterprise_RBAC_Security_Matrix.csv',
      description: 'Tabular RBAC security matrix mapping enterprise roles against tool execution privileges and approval requirements.',
      format: 'csv',
      createdAt: new Date(latest23Timestamp + 240000).toISOString(),
      downloadUrl: '#',
      metadata: {
        columns: ['Capability / Tool Name', 'Category', 'Admin Role', 'Lead Role', 'Analyst Role', 'Auditor Role', 'Requires Human Approval'],
        rows: [
          { 'Capability / Tool Name': 'search_knowledge_base', 'Category': 'Knowledge', 'Admin Role': 'Allowed', 'Lead Role': 'Allowed', 'Analyst Role': 'Allowed', 'Auditor Role': 'Allowed', 'Requires Human Approval': 'No' },
          { 'Capability / Tool Name': 'create_presentation', 'Category': 'Productivity', 'Admin Role': 'Allowed', 'Lead Role': 'Allowed', 'Analyst Role': 'Allowed', 'Auditor Role': 'View Only', 'Requires Human Approval': 'No' },
          { 'Capability / Tool Name': 'create_document', 'Category': 'Productivity', 'Admin Role': 'Allowed', 'Lead Role': 'Allowed', 'Analyst Role': 'Allowed', 'Auditor Role': 'View Only', 'Requires Human Approval': 'No' },
          { 'Capability / Tool Name': 'execute_code', 'Category': 'Data', 'Admin Role': 'Allowed', 'Lead Role': 'Allowed', 'Analyst Role': 'Allowed', 'Auditor Role': 'No Access', 'Requires Human Approval': 'No' },
          { 'Capability / Tool Name': 'send_email', 'Category': 'Communication', 'Admin Role': 'Allowed (Gate)', 'Lead Role': 'Allowed (Gate)', 'Analyst Role': 'Approval Req', 'Auditor Role': 'No Access', 'Requires Human Approval': 'YES' }
        ]
      },
      content: `Capability / Tool Name,Category,Admin Role,Lead Role,Analyst Role,Auditor Role,Requires Human Approval
search_knowledge_base,Knowledge,Allowed,Allowed,Allowed,Allowed,No
create_presentation,Productivity,Allowed,Allowed,Allowed,View Only,No
create_document,Productivity,Allowed,Allowed,Allowed,View Only,No
create_spreadsheet,Productivity,Allowed,Allowed,Allowed,View Only,No
execute_code,Data,Allowed,Allowed,Allowed,No Access,No
analyze_data_and_chart,Data,Allowed,Allowed,Allowed,Allowed,No
web_search_research,Web,Allowed,Allowed,Allowed,Allowed,No
draft_email,Communication,Allowed,Allowed,Allowed,No Access,No
send_email,Communication,Allowed (Gate),Allowed (Gate),Approval Req,No Access,YES
create_calendar_event,Scheduling,Allowed,Allowed,Allowed,No Access,No
generate_code,Developer,Allowed,Allowed,Allowed,View Only,No
rotate_api_token,Security,Allowed,No Access,No Access,No Access,YES`
    },
    {
      id: 'file-seed-sql-1',
      title: 'Database_Migration_v2_4_RAG.sql',
      description: 'PostgreSQL vector schema migration with HNSW indexing and row-level security policies for AgentOS documents.',
      format: 'code',
      createdAt: new Date(latest23Timestamp + 510000).toISOString(),
      downloadUrl: '#',
      metadata: {
        language: 'sql'
      },
      content: `-- AgentOS Database Migration v2.4 (RAG Vector Indexing)
-- Daily 23:00 Batch Automated Schema Validation

CREATE EXTENSION IF NOT EXISTS "vector";
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Documents & Metadata Table
CREATE TABLE IF NOT EXISTS knowledge_documents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(255) NOT NULL,
    filename VARCHAR(255) NOT NULL,
    file_type VARCHAR(50) NOT NULL,
    size_bytes BIGINT NOT NULL,
    summary TEXT,
    tags TEXT[],
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Semantic Vector Chunks with HNSW Index
CREATE TABLE IF NOT EXISTS document_chunks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    document_id UUID REFERENCES knowledge_documents(id) ON DELETE CASCADE,
    chunk_index INT NOT NULL,
    section_name VARCHAR(255),
    content TEXT NOT NULL,
    embedding vector(768),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- HNSW Vector Index for Sub-Millisecond Similarity Queries
CREATE INDEX IF NOT EXISTS idx_document_chunks_embedding_hnsw 
ON document_chunks USING hnsw (embedding vector_cosine_ops)
WITH (m = 16, ef_construction = 64);

-- Row-Level Security Policy for Enterprise RBAC
ALTER TABLE knowledge_documents ENABLE ROW LEVEL SECURITY;
`
    }
  ];
}
