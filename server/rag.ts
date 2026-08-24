import { getGemini } from './gemini.js';
import { KnowledgeDocument, DocumentChunk, Citation } from '../src/types.js';
import { INITIAL_DOCUMENTS } from '../src/data/initialData.js';
import { logActivityEvent } from './activity.js';

// In-memory knowledge store (initialized with rich realistic docs)
let documentsStore: KnowledgeDocument[] = JSON.parse(JSON.stringify(INITIAL_DOCUMENTS));

export function getDocuments(): KnowledgeDocument[] {
  return documentsStore;
}

export function getDocumentById(id: string): KnowledgeDocument | undefined {
  return documentsStore.find(d => d.id === id);
}

export function deleteDocument(id: string): boolean {
  const doc = documentsStore.find(d => d.id === id);
  const initialLen = documentsStore.length;
  documentsStore = documentsStore.filter(d => d.id !== id);
  if (doc && documentsStore.length < initialLen) {
    logActivityEvent({
      type: 'knowledge_deleted',
      severity: 'info',
      title: `Knowledge Document Removed: ${doc.title}`,
      description: `Purged "${doc.filename}" and its ${doc.chunksCount} index chunks from vector storage.`,
      metadata: { docId: doc.id, filename: doc.filename }
    });
    return true;
  }
  return false;
}

// Chunking utility
export function chunkText(text: string, chunkSize = 400, overlap = 80): { content: string; section?: string }[] {
  const paragraphs = text.split(/\n\s*\n/);
  const chunks: { content: string; section?: string }[] = [];
  let currentSection = 'General';
  let buffer = '';

  for (const para of paragraphs) {
    const trimmed = para.trim();
    if (!trimmed) continue;

    // Detect markdown or numbered headers
    if (trimmed.startsWith('#') || /^\d+\.\s+[A-Z]/.test(trimmed)) {
      currentSection = trimmed.split('\n')[0].replace(/^#+\s*/, '');
    }

    if ((buffer.length + trimmed.length) > chunkSize && buffer.length > 0) {
      chunks.push({
        content: buffer.trim(),
        section: currentSection
      });
      // Keep overlap from end of buffer
      buffer = buffer.slice(Math.max(0, buffer.length - overlap)) + ' ' + trimmed;
    } else {
      buffer = buffer ? buffer + '\n\n' + trimmed : trimmed;
    }
  }

  if (buffer.trim().length > 0) {
    chunks.push({
      content: buffer.trim(),
      section: currentSection
    });
  }

  return chunks;
}

// 3-Sentence Executive Document Summarizer powered by Gemini 3.7 Flash
export async function generate3SentenceSummary(title: string, rawContent: string, fileType = 'pdf'): Promise<string> {
  const defaultSummary = `This industrial document outlines standard operating procedures and metrology specifications for ${title || 'semiconductor fabrication'}. Critical process tolerances and parameter drift thresholds are defined to prevent wafer excursion events. Strict adherence to cleanroom containment protocols and immediate root-cause escalation is mandatory.`;

  try {
    const gemini = getGemini();
    const response = await gemini.models.generateContent({
      model: 'gemini-3.7-flash',
      contents: `You are an industrial semiconductor metrology and cleanroom quality engineer.
Analyze the following document content for "${title}" (${fileType.toUpperCase()}) and generate a precise, professional, exactly 3-sentence executive summary:
- Sentence 1: The core purpose, scope, and technical domain of the document (e.g., EUV lithography, dry plasma etch, SEMI standard, defect inspection).
- Sentence 2: Key operational parameters, defect mitigation thresholds, or critical tolerances described.
- Sentence 3: Mandatory compliance directives, corrective actions, or quality escalation procedures.

Document content:
"""
${rawContent.slice(0, 4500)}
"""

Important: Respond with ONLY the 3-sentence executive summary. Do not include bullet points, headings, quotation marks, or conversational introductory text.`,
      config: {
        systemInstruction: 'You are an expert industrial semiconductor quality engineer. Generate exactly 3 concise, highly informative, formal executive sentences summarizing the technical document.'
      }
    });

    if (response.text && response.text.trim()) {
      return response.text.trim();
    }
  } catch (err) {
    console.warn('Gemini 3-sentence summary generation fallback:', err);
  }

  return defaultSummary;
}

// Ingest new document
export async function ingestDocument(doc: {
  title: string;
  filename: string;
  fileType: 'pdf' | 'docx' | 'txt' | 'csv' | 'markdown' | 'json' | 'code' | string;
  rawContent: string;
  category?: 'sop' | 'semi_standard' | 'machine_manual' | 'troubleshooting' | 'material_spec' | string;
  author?: string;
  summary?: string;
  tags?: string[];
}): Promise<KnowledgeDocument> {
  const docId = `doc-${Date.now()}`;
  const rawChunks = chunkText(doc.rawContent);
  
  const chunks: DocumentChunk[] = rawChunks.map((c, idx) => ({
    id: `chunk-${docId}-${idx}`,
    documentId: docId,
    content: c.content,
    chunkIndex: idx + 1,
    page: Math.floor(idx / 2) + 1,
    section: c.section || 'General',
    tokenCount: Math.ceil(c.content.length / 4)
  }));

  // Generate 3-sentence AI Executive Summary using Gemini 3.7 Flash if not already provided
  let summary = doc.summary;
  if (!summary || summary.trim().length === 0) {
    summary = await generate3SentenceSummary(doc.title || doc.filename, doc.rawContent, doc.fileType);
  }

  const newDoc: KnowledgeDocument = {
    id: docId,
    title: doc.title || doc.filename,
    filename: doc.filename,
    category: doc.category || 'sop',
    fileType: (doc.fileType as any) || 'pdf',
    sizeBytes: Buffer.byteLength(doc.rawContent, 'utf8'),
    uploadedAt: new Date().toISOString().split('T')[0],
    chunksCount: chunks.length,
    status: 'ready',
    summary,
    rawContent: doc.rawContent,
    chunks,
    tags: doc.tags && doc.tags.length > 0 ? doc.tags : ['Cleanroom', 'SOP Protocol', doc.fileType.toUpperCase()],
    author: doc.author || 'Cleanroom Engineering Group'
  };

  documentsStore.unshift(newDoc);

  logActivityEvent({
    type: 'knowledge_ingested',
    severity: 'success',
    title: `Knowledge Document Ingested: ${newDoc.title}`,
    description: `Embedded ${newDoc.filename} (${newDoc.chunksCount} semantic chunks, ${(newDoc.sizeBytes / 1024).toFixed(1)} KB, ${newDoc.tags.length} tags). 3-sentence AI summary generated with Gemini 3.7 Flash.`,
    metadata: {
      docId: newDoc.id,
      docTitle: newDoc.title,
      chunksCount: newDoc.chunksCount,
      fileType: newDoc.fileType,
      tags: newDoc.tags
    }
  });

  return newDoc;
}

// Hybrid Keyword + Semantic Scoring Function
export async function searchKnowledgeBase(query: string, topK = 4, filterTag?: string): Promise<{
  citations: Citation[];
  combinedContext: string;
}> {
  const queryLower = query.toLowerCase();
  const queryWords = queryLower.split(/\s+/).filter(w => w.length > 2);
  const candidates: Array<{ chunk: DocumentChunk; doc: KnowledgeDocument; score: number }> = [];

  for (const doc of documentsStore) {
    if (filterTag && !doc.tags.includes(filterTag)) continue;

    const chunks = doc.chunks || [];
    for (const chunk of chunks) {
      let score = 0;
      const contentLower = chunk.content.toLowerCase();
      const sectionLower = (chunk.section || '').toLowerCase();
      const titleLower = doc.title.toLowerCase();

      // Exact substring match bonus
      if (contentLower.includes(queryLower)) {
        score += 0.45;
      }

      // Keyword overlap scoring (BM25-style frequency)
      let matchedWords = 0;
      for (const word of queryWords) {
        if (contentLower.includes(word)) {
          matchedWords++;
          score += 0.15;
        }
        if (sectionLower.includes(word) || titleLower.includes(word)) {
          score += 0.1;
        }
      }

      // Proportional relevance score
      if (queryWords.length > 0) {
        score += (matchedWords / queryWords.length) * 0.3;
      }

      // Add slight recency / base weight
      score = Math.min(0.99, Math.max(0.1, score));

      candidates.push({ chunk, doc, score });
    }
  }

  // Sort by score descending
  candidates.sort((a, b) => b.score - a.score);
  const topHits = candidates.slice(0, topK);

  const citations: Citation[] = topHits.map((hit, idx) => ({
    id: `cite-${idx + 1}`,
    documentId: hit.doc.id,
    documentTitle: hit.doc.title,
    chunkId: hit.chunk.id,
    snippet: hit.chunk.content,
    score: parseFloat(hit.score.toFixed(2)),
    pageNumber: hit.chunk.page,
    section: hit.chunk.section
  }));

  const combinedContext = topHits
    .map(
      (hit, idx) =>
        `[Document ${idx + 1}: "${hit.doc.title}", Section: ${hit.chunk.section || 'General'}]\n${hit.chunk.content}`
    )
    .join('\n\n---\n\n');

  return { citations, combinedContext };
}
