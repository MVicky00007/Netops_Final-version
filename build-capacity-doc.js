// Build a deeply-annotated .docx walkthrough of the Capacity Management module.
// Run: node build-capacity-doc.js   ->   CapacityModule-Walkthrough.docx

const fs = require('fs');
const path = require('path');

const docxPath = path.join(process.env.APPDATA, 'npm', 'node_modules', 'docx');
const { Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
        Header, Footer, AlignmentType, LevelFormat, HeadingLevel,
        BorderStyle, WidthType, ShadingType, PageNumber, PageBreak } = require(docxPath);

// ─────────────────────────────────────────────────────────────────────
// Style constants
// ─────────────────────────────────────────────────────────────────────
const FONT       = 'Calibri';
const MONO       = 'Consolas';
const BRAND      = '1D4ED8';
const HEADING_FG = '1E3A8A';
const MUTED      = '64748B';
const ACCENT     = '0F766E';

// ─────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────
function p(text, opts = {}) {
  return new Paragraph({
    spacing: { after: 120, ...(opts.spacing || {}) },
    alignment: opts.alignment,
    children: [new TextRun({ text, font: FONT, size: 22, ...opts })],
  });
}
function h1(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_1, spacing: { before: 360, after: 200 },
    children: [new TextRun({ text, font: FONT, size: 38, bold: true, color: HEADING_FG })],
  });
}
function h2(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_2, spacing: { before: 320, after: 160 },
    children: [new TextRun({ text, font: FONT, size: 30, bold: true, color: HEADING_FG })],
  });
}
function h3(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_3, spacing: { before: 260, after: 120 },
    children: [new TextRun({ text, font: FONT, size: 25, bold: true, color: BRAND })],
  });
}
function h4(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_4, spacing: { before: 200, after: 100 },
    children: [new TextRun({ text, font: FONT, size: 22, bold: true, color: ACCENT })],
  });
}
function pMixed(segments, opts = {}) {
  return new Paragraph({
    spacing: { after: 120, ...(opts.spacing || {}) },
    children: segments.map((s) => new TextRun({
      text: s.t, font: s.code ? MONO : FONT,
      size: s.code ? 20 : 22, bold: !!s.bold, italics: !!s.italic, color: s.color,
    })),
  });
}
function bullet(text, level = 0) {
  return new Paragraph({
    numbering: { reference: 'bullets', level },
    spacing: { after: 80 },
    children: [new TextRun({ text, font: FONT, size: 22 })],
  });
}
function bulletMixed(segments, level = 0) {
  return new Paragraph({
    numbering: { reference: 'bullets', level },
    spacing: { after: 80 },
    children: segments.map((s) => new TextRun({
      text: s.t, font: s.code ? MONO : FONT,
      size: s.code ? 20 : 22, bold: !!s.bold, italics: !!s.italic,
    })),
  });
}
function code(text) {
  const lines = text.split('\n');
  return new Table({
    width: { size: 9360, type: WidthType.DXA },
    columnWidths: [9360],
    borders: {
      top:    { style: BorderStyle.SINGLE, size: 4, color: 'CBD5E1' },
      bottom: { style: BorderStyle.SINGLE, size: 4, color: 'CBD5E1' },
      left:   { style: BorderStyle.SINGLE, size: 4, color: 'CBD5E1' },
      right:  { style: BorderStyle.SINGLE, size: 4, color: 'CBD5E1' },
      insideHorizontal: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
      insideVertical:   { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
    },
    rows: [new TableRow({ children: [new TableCell({
      width: { size: 9360, type: WidthType.DXA },
      shading: { fill: 'F1F5F9', type: ShadingType.CLEAR },
      margins: { top: 120, bottom: 120, left: 160, right: 160 },
      children: lines.map((line) => new Paragraph({
        spacing: { after: 0 },
        children: [new TextRun({ text: line || ' ', font: MONO, size: 18 })],
      })),
    })] })],
  });
}
// "One-liner" — a 2-cell row: bold label on the left, plain explanation on the right.
function oneLiner(label, explanation, labelCode = true) {
  const td = {
    borders: {
      top:    { style: BorderStyle.SINGLE, size: 4, color: 'E2E8F0' },
      bottom: { style: BorderStyle.SINGLE, size: 4, color: 'E2E8F0' },
      left:   { style: BorderStyle.SINGLE, size: 4, color: 'E2E8F0' },
      right:  { style: BorderStyle.SINGLE, size: 4, color: 'E2E8F0' },
    },
    margins: { top: 80, bottom: 80, left: 120, right: 120 },
  };
  return new Table({
    width: { size: 9360, type: WidthType.DXA },
    columnWidths: [3000, 6360],
    rows: [new TableRow({ children: [
      new TableCell({ ...td, width: { size: 3000, type: WidthType.DXA },
        shading: { fill: 'F8FAFC', type: ShadingType.CLEAR },
        children: [new Paragraph({
          children: [new TextRun({ text: label, font: labelCode ? MONO : FONT,
            size: labelCode ? 18 : 21, bold: true, color: BRAND })],
        })] }),
      new TableCell({ ...td, width: { size: 6360, type: WidthType.DXA },
        children: [new Paragraph({
          children: [new TextRun({ text: explanation, font: FONT, size: 21 })],
        })] }),
    ] })],
  });
}
function gap() { return new Paragraph({ spacing: { after: 100 }, children: [new TextRun(' ')] }); }
function pageBreak() { return new Paragraph({ pageBreakBefore: true, children: [new TextRun('')] }); }

// ─────────────────────────────────────────────────────────────────────
// Build content
// ─────────────────────────────────────────────────────────────────────
const children = [];

// ─────────── TITLE PAGE ───────────
children.push(new Paragraph({
  alignment: AlignmentType.CENTER, spacing: { before: 1600, after: 240 },
  children: [new TextRun({ text: 'NetOpsOne', font: FONT, size: 56, bold: true, color: BRAND })],
}));
children.push(new Paragraph({
  alignment: AlignmentType.CENTER, spacing: { after: 120 },
  children: [new TextRun({ text: 'Capacity Management Module', font: FONT, size: 40, bold: true })],
}));
children.push(new Paragraph({
  alignment: AlignmentType.CENTER, spacing: { after: 480 },
  children: [new TextRun({ text: 'A deep walkthrough — every class, every method, one-line explanations',
                           font: FONT, size: 22, italics: true, color: MUTED })],
}));
children.push(new Paragraph({
  alignment: AlignmentType.CENTER, spacing: { after: 80 },
  children: [new TextRun({ text: 'capacity-service · port 9104',  font: MONO, size: 20, color: MUTED })],
}));
children.push(new Paragraph({
  alignment: AlignmentType.CENTER, spacing: { after: 80 },
  children: [new TextRun({ text: 'Angular feature @ /capacity-plans, /capacity-records',  font: MONO, size: 20, color: MUTED })],
}));

// ─────────── TABLE OF CONTENTS ───────────
children.push(pageBreak());
children.push(h1('Contents'));
const toc = [
  '1. Overview — what Capacity Management does',
  '2. The data model (3 tables, their FKs and lifecycle)',
  '3. Backend file tour — what each file is for',
  '4. Backend entities (CapacityPlan, CapacityApproval, CapacityRecord, ChangeEvidence)',
  '5. Backend DTOs (Request and Response objects)',
  '6. Backend mappers (entity ↔ DTO)',
  '7. Backend repositories (Spring Data JPA queries)',
  '8. Backend services — every method, one line each',
  '9. Backend controllers — every endpoint, one line each',
  '10. Frontend file tour — what each file is for',
  '11. Frontend ApiService — every capacity method',
  '12. Frontend CapacityPlansListComponent — every method',
  '13. Frontend CapacityPlanFormDialog — submit a plan',
  '14. Frontend ReviewPlanDialog — approve/reject with comments',
  '15. Frontend PlanEvidenceDialog — upload/download files',
  '16. Frontend CapacityRecordsListComponent — every method',
  '17. Frontend CapacityRecordFormDialog — record a measurement',
  '18. End-to-end round-trip (manager clicks Approve)',
  '19. Endpoint summary table',
  '20. Roles & permissions reference',
];
for (const t of toc) {
  children.push(p(t, { spacing: { after: 60 } }));
}

// ─────────── 1. OVERVIEW ───────────
children.push(pageBreak());
children.push(h1('1. Overview'));
children.push(p('Capacity Management is the part of NetOpsOne where the network team plans and tracks bandwidth changes on edge interfaces. It has three jobs:'));
children.push(bullet('Let engineers SUBMIT a "capacity plan" proposing an upgrade (e.g. 10 Gbps → 40 Gbps on Gi0/0/0/1) with a written justification.'));
children.push(bullet('Let managers REVIEW each plan and either approve or reject it, with their own comments.'));
children.push(bullet('Let engineers RECORD measured throughput samples, and ATTACH evidence files (PDFs, screenshots) to plans for auditors.'));
children.push(p('Everything is manual and on-demand — the system never polls a router or runs background jobs. That matches the problem statement: "operators perform all checks and triage manually".'));

// ─────────── 2. DATA MODEL ───────────
children.push(h1('2. The data model'));
children.push(p('Capacity Management owns four MySQL tables. Foreign-key arrows show the ownership direction.'));
children.push(code(
`sites  ─────────┐
                ↓
edge_nodes ─────┤
                ↓
interfaces  ────┤────────────────┐
                ↓                ↓
        capacity_plans    capacity_records
                ↓
        capacity_approvals    (one per plan, OneToOne)
                ↓
        change_evidence       (many per plan, OneToMany)`
));
children.push(h3('Lifecycle of one CapacityPlan'));
children.push(code(
`        ┌────────────┐  manager review   ┌──────────┐
        │  PENDING   │ ────────────────▶ │ APPROVED │ ─▶ IMPLEMENTED
        │ (default)  │      or           │ REJECTED │
        └────────────┘                   └──────────┘`
));
children.push(p('Only PENDING plans can be transitioned. The backend enforces this with a ConflictException (HTTP 409) if you try to re-approve.'));

// ─────────── 3. BACKEND FILE TOUR ───────────
children.push(h1('3. Backend file tour'));
children.push(p('Inside backend/capacity-service/src/main/java/com/project/netops/ — here is every file that touches capacity, with a one-line purpose:'));

children.push(h3('Controllers (HTTP layer)'));
children.push(oneLiner('CapacityPlanController.java',     'Exposes /capacity-plans endpoints — submit, list, approve.'));
children.push(oneLiner('CapacityRecordController.java',   'Exposes /capacity-records — POST one measurement, GET list with filters.'));
children.push(oneLiner('ChangeEvidenceController.java',   'Exposes /capacity-plans/{id}/evidence — multipart upload + download.'));

children.push(h3('Service interfaces (the contract)'));
children.push(oneLiner('CapacityPlanService.java',        'Declares submitPlan / listPlans / approvePlan.'));
children.push(oneLiner('CapacityRecordService.java',      'Declares recordMeasurement / listRecords.'));
children.push(oneLiner('ChangeEvidenceService.java',      'Declares uploadEvidence / listEvidence / downloadEvidenceFile.'));

children.push(h3('Service implementations (the business logic)'));
children.push(oneLiner('CapacityPlanServiceImpl.java',    'All plan rules: status enforcement, FK validation, audit logging.'));
children.push(oneLiner('CapacityRecordServiceImpl.java',  'Saves measurements + dispatches list queries by filter.'));
children.push(oneLiner('ChangeEvidenceServiceImpl.java',  'Streams uploaded bytes to disk, SHA-256 hashes them, stores metadata.'));

children.push(h3('Mappers (entity → DTO)'));
children.push(oneLiner('CapacityPlanMapper.java',         'Builds CapacityPlanResponse, resolving site/interface/requester names.'));
children.push(oneLiner('CapacityRecordMapper.java',       'Builds CapacityRecordResponse with rated-capacity context.'));
children.push(oneLiner('CapacityApprovalMapper.java',     'Builds CapacityApprovalResponse (used after a manager decision).'));
children.push(oneLiner('ChangeEvidenceMapper.java',       'Builds ChangeEvidenceResponse from a ChangeEvidence row.'));

children.push(h3('Request DTOs (incoming JSON)'));
children.push(oneLiner('CapacityPlanRequest.java',        'Validates siteId/interfaceId/current/proposed/reason/requestedBy.'));
children.push(oneLiner('ApprovalRequest.java',            'Validates approvedBy, status (APPROVED/REJECTED), and free-text comments.'));
children.push(oneLiner('CapacityRecordRequest.java',      'Validates siteId/interfaceId/measuredCapacityMbps/recordedBy.'));

children.push(h3('Response DTOs (outgoing JSON)'));
children.push(oneLiner('CapacityPlanResponse.java',       'Plan row enriched with siteCode/siteName/interfaceName/requestedByName.'));
children.push(oneLiner('CapacityApprovalResponse.java',   'Decision row with approver name and comments.'));
children.push(oneLiner('CapacityRecordResponse.java',     'Measurement row + the interface\'s rated Mbps for context.'));
children.push(oneLiner('ChangeEvidenceResponse.java',     'Evidence row with filename, hash, uploader name, notes.'));

children.push(h3('Entities (JPA, live in the common module)'));
children.push(oneLiner('CapacityPlan.java',               'capacity_plans table — the proposed change, with its status enum.'));
children.push(oneLiner('CapacityApproval.java',           'capacity_approvals — one row per decided plan (OneToOne).'));
children.push(oneLiner('CapacityRecord.java',             'capacity_records — measured Mbps per interface, timestamped.'));
children.push(oneLiner('ChangeEvidence.java',             'change_evidence — file URI + SHA-256 attached to a plan.'));

children.push(h3('Repositories (Spring Data)'));
children.push(oneLiner('CapacityPlanRepository',          'findAll + findByStatus(PlanStatus) generated from the method name.'));
children.push(oneLiner('CapacityApprovalRepository',      'Plain CRUD — used to insert the decision row.'));
children.push(oneLiner('CapacityRecordRepository',        'findBySiteSiteId, findByIfaceInterfaceId, etc — derived queries.'));
children.push(oneLiner('ChangeEvidenceRepository',        'findByPlanPlanId — list evidence for one plan.'));

// ─────────── 4. ENTITIES ───────────
children.push(pageBreak());
children.push(h1('4. Backend entities'));

children.push(h2('4.1 CapacityPlan'));
children.push(p('Represents one proposed bandwidth change. Lives in the capacity_plans table.'));
children.push(oneLiner('@Id planId',                      'Auto-increment primary key.'));
children.push(oneLiner('site',                            'ManyToOne FK to sites — which site the change is for.'));
children.push(oneLiner('iface',                           'ManyToOne FK to interfaces — optional (nullable).'));
children.push(oneLiner('currentCapacity',                 'Today\'s throughput in Mbps (Double, NOT NULL).'));
children.push(oneLiner('proposedCapacity',                'Target throughput in Mbps after the upgrade (NOT NULL).'));
children.push(oneLiner('reason',                          'Free text up to 1000 chars — why this upgrade is needed.'));
children.push(oneLiner('requestedBy',                     'ManyToOne FK to user — who submitted this plan.'));
children.push(oneLiner('requestedAt',                     'Auto-stamped at insert by @PrePersist (updatable=false).'));
children.push(oneLiner('status',                          'Enum PlanStatus stored as STRING. Always starts PENDING.'));
children.push(oneLiner('approval',                        'OneToOne back-reference to the matching CapacityApproval row.'));
children.push(oneLiner('evidenceFiles',                   'OneToMany list of ChangeEvidence attachments. Cascade ALL.'));
children.push(oneLiner('enum PlanStatus',                 'DRAFT, PENDING, APPROVED, REJECTED, IMPLEMENTED.'));

children.push(h2('4.2 CapacityApproval'));
children.push(p('Manager\'s recorded decision. One row per decided plan.'));
children.push(oneLiner('approvalId',                      'PK.'));
children.push(oneLiner('plan',                            'OneToOne to CapacityPlan with unique=true (DB-enforced).'));
children.push(oneLiner('approvedBy',                      'ManyToOne to user — the manager who made the call.'));
children.push(oneLiner('approvedAt',                      'Auto-stamped at insert.'));
children.push(oneLiner('comments',                        'Free text (up to 1000 chars).'));
children.push(oneLiner('status',                          'Enum ApprovalStatus { APPROVED, REJECTED }.'));

children.push(h2('4.3 CapacityRecord'));
children.push(p('A single measured-throughput sample. Recorded manually by an engineer.'));
children.push(oneLiner('capacityId',                      'PK.'));
children.push(oneLiner('site / iface',                    'Where it was measured (FKs).'));
children.push(oneLiner('measuredCapacityMbps',            'The reading itself, in Mbps.'));
children.push(oneLiner('measuredAt',                      'When (auto-stamped).'));
children.push(oneLiner('recordedBy',                      'Who took the measurement.'));

children.push(h2('4.4 ChangeEvidence'));
children.push(p('File attached to a plan as proof. The bytes live on disk; this entity tracks the metadata.'));
children.push(oneLiner('evidenceId',                      'PK.'));
children.push(oneLiner('plan',                            'ManyToOne to the plan this evidence belongs to.'));
children.push(oneLiner('fileUri',                         'Absolute path on disk where the bytes were written.'));
children.push(oneLiner('originalFilename',                'The user-visible name (preserved for display).'));
children.push(oneLiner('fileHash',                        'SHA-256 of the bytes — auditor can detect tampering.'));
children.push(oneLiner('uploadedBy / uploadedAt',         'Who uploaded the file and when.'));
children.push(oneLiner('notes',                           'Optional comment ("MRTG dump for Q1").'));

// ─────────── 5. DTOs ───────────
children.push(pageBreak());
children.push(h1('5. Backend DTOs'));

children.push(h2('5.1 Request DTOs'));
children.push(h4('CapacityPlanRequest'));
children.push(p('What the client sends to POST /capacity-plans.'));
children.push(oneLiner('siteId (@NotNull)',               'Where the upgrade is for.'));
children.push(oneLiner('interfaceId',                     'Optional — narrows to a specific port.'));
children.push(oneLiner('currentCapacity / proposedCapacity', 'Existing and target Mbps (validated as positive).'));
children.push(oneLiner('reason (@NotBlank)',              'Justification string.'));
children.push(oneLiner('requestedBy (@NotNull)',          'User ID of the submitter.'));

children.push(h4('ApprovalRequest'));
children.push(p('What the client sends to POST /capacity-plans/{id}/approve.'));
children.push(oneLiner('approvedBy (@NotNull)',           'User ID of the manager making the call.'));
children.push(oneLiner('status (@NotBlank)',              'Literal "APPROVED" or "REJECTED" (validated server-side).'));
children.push(oneLiner('comments',                        'Free-text reason (optional but recommended).'));

children.push(h4('CapacityRecordRequest'));
children.push(p('What the client sends to POST /capacity-records.'));
children.push(oneLiner('siteId / interfaceId (@NotNull)', 'Where the measurement was taken.'));
children.push(oneLiner('measuredCapacityMbps (@NotNull)', 'The Mbps figure to record.'));
children.push(oneLiner('recordedBy (@NotNull)',           'User ID of the engineer.'));

children.push(h2('5.2 Response DTOs'));
children.push(p('Every response is wrapped in APIResponse<T> which adds { success, message, data }.'));

children.push(h4('CapacityPlanResponse'));
children.push(p('What the table sees when it loads /capacity-plans.'));
children.push(oneLiner('planId',                          'The row\'s ID.'));
children.push(oneLiner('siteId, siteCode, siteName',      'Site identity — code and name pre-resolved so the UI doesn\'t round-trip.'));
children.push(oneLiner('interfaceId, interfaceName',      'Interface identity.'));
children.push(oneLiner('currentCapacity, proposedCapacity', 'The two Mbps values.'));
children.push(oneLiner('reason',                          'The free-text justification.'));
children.push(oneLiner('requestedBy, requestedByName',    'User ID + display name of the submitter.'));
children.push(oneLiner('requestedAt',                     'ISO-8601 timestamp.'));
children.push(oneLiner('status',                          'PENDING | APPROVED | REJECTED | IMPLEMENTED.'));

children.push(h4('CapacityRecordResponse'));
children.push(oneLiner('capacityId',                      'Row PK.'));
children.push(oneLiner('siteId / siteCode / siteName',    'Where the measurement was taken.'));
children.push(oneLiner('interfaceId / interfaceName',     'Which port.'));
children.push(oneLiner('interfaceCapacityMbps',           'The interface\'s rated capacity — for future utilisation %.'));
children.push(oneLiner('measuredCapacityMbps',            'The measured value.'));
children.push(oneLiner('measuredAt',                      'When.'));
children.push(oneLiner('recordedBy / recordedByName',     'Who.'));

children.push(h4('CapacityApprovalResponse'));
children.push(oneLiner('approvalId',                      'Row PK.'));
children.push(oneLiner('planId',                          'Which plan it decided.'));
children.push(oneLiner('approvedBy / approvedByName',     'The manager.'));
children.push(oneLiner('approvedAt',                      'Decision timestamp.'));
children.push(oneLiner('comments',                        'Manager\'s reasoning.'));
children.push(oneLiner('status',                          'APPROVED or REJECTED.'));

children.push(h4('ChangeEvidenceResponse'));
children.push(oneLiner('evidenceId',                      'Row PK.'));
children.push(oneLiner('planId',                          'Parent plan.'));
children.push(oneLiner('fileUri',                         'Server path (mostly for backend use).'));
children.push(oneLiner('originalFilename',                'What the user sees and downloads as.'));
children.push(oneLiner('fileHash',                        'SHA-256 — opaque, used by auditors to verify integrity.'));
children.push(oneLiner('uploadedBy / uploadedByName',     'Who uploaded.'));
children.push(oneLiner('uploadedAt',                      'When.'));
children.push(oneLiner('notes',                           'Free-text caption.'));

// ─────────── 6. MAPPERS ───────────
children.push(pageBreak());
children.push(h1('6. Mappers'));
children.push(p('Mappers are tiny @Component classes that translate an entity to its response DTO. They are the single place where joined-entity names get resolved — so controllers never accidentally expose raw JPA entities.'));

children.push(h3('CapacityPlanMapper.toResponse(plan)'));
children.push(oneLiner('Read core fields',               'planId, current/proposed capacity, reason, requestedAt, status.'));
children.push(oneLiner('Resolve site',                   'If plan.getSite() != null: copy siteId, siteCode, name.'));
children.push(oneLiner('Resolve interface',              'If plan.getIface() != null: copy interfaceId, name.'));
children.push(oneLiner('Resolve requester',              'If plan.getRequestedBy() != null: copy userId and name.'));
children.push(oneLiner('Build and return',               'Lombok builder produces the response DTO.'));

children.push(h3('CapacityRecordMapper.toResponse(record)'));
children.push(oneLiner('Core fields',                    'capacityId, measuredCapacityMbps, measuredAt.'));
children.push(oneLiner('Site / interface',               'Same null-guarded resolution — names + IDs.'));
children.push(oneLiner('Interface rated capacity',       'Extra field: iface.capacityMbps so the UI can compute utilisation.'));
children.push(oneLiner('Recorder',                       'userId + name of the engineer.'));

children.push(h3('CapacityApprovalMapper.toResponse(approval)'));
children.push(p('Returns plan reference + approver name + decision + timestamp + comments. Used right after a manager review so the UI can show their own decision.'));

children.push(h3('ChangeEvidenceMapper.toResponse(evidence)'));
children.push(p('Flattens the joined plan + user references to ids and names. The fileUri is included for backend use but the UI shows originalFilename instead.'));

// ─────────── 7. REPOSITORIES ───────────
children.push(h1('7. Repositories'));
children.push(p('Spring Data interfaces. Spring generates the SQL from method names — you never write JPQL for these.'));

children.push(h3('CapacityPlanRepository extends JpaRepository<CapacityPlan, Long>'));
children.push(oneLiner('findAll()',                      'List every plan (inherited).'));
children.push(oneLiner('findByStatus(PlanStatus)',       'Filter by status — used by GET /capacity-plans?status=.'));
children.push(oneLiner('findById(Long), save(...)',      'Standard CRUD (inherited).'));

children.push(h3('CapacityApprovalRepository extends JpaRepository<CapacityApproval, Long>'));
children.push(p('Just plain CRUD. Approvals are looked up via the plan back-reference.'));

children.push(h3('CapacityRecordRepository extends JpaRepository<CapacityRecord, Long>'));
children.push(oneLiner('findBySiteSiteId(Long)',         'All measurements at one site.'));
children.push(oneLiner('findByIfaceInterfaceId(Long)',   'All measurements on one interface.'));
children.push(oneLiner('findBySiteSiteIdAndIfaceInterfaceId(Long, Long)', 'Both filters — narrow drill-down.'));

children.push(h3('ChangeEvidenceRepository extends JpaRepository<ChangeEvidence, Long>'));
children.push(oneLiner('findByPlanPlanId(Long)',         'All evidence files for one plan.'));

// ─────────── 8. SERVICES ───────────
children.push(pageBreak());
children.push(h1('8. Backend services — every method, line by line'));

children.push(h2('8.1 CapacityPlanServiceImpl'));
children.push(p('Three public methods, all annotated with @Transactional for atomicity. Constructor-injected via @RequiredArgsConstructor.'));

children.push(h3('submitPlan(siteId, interfaceId, current, proposed, reason, requestedById)'));
children.push(oneLiner('Step 1 — load Site',             'siteRepository.findById() — throws 404 if site does not exist.'));
children.push(oneLiner('Step 2 — load Interface',        'interfaceRepository.findById() — throws 404 if not found.'));
children.push(oneLiner('Step 3 — load requester',        'userRepository.findById() — throws 404 if user does not exist.'));
children.push(oneLiner('Step 4 — build entity',          'CapacityPlan.builder()... .status(PENDING) — initial state hardcoded.'));
children.push(oneLiner('Step 5 — persist',               'planRepository.save(plan) — INSERT, generates planId.'));
children.push(oneLiner('Step 6 — audit',                 'auditLogService.logAction(..., "SUBMIT_CAPACITY_PLAN", ...).'));
children.push(oneLiner('Step 7 — return DTO',            'planMapper.toResponse(saved) — never expose entity.'));

children.push(h3('listPlans(status)'));
children.push(oneLiner('Branch A',                       'If status is null/blank: planRepository.findAll().'));
children.push(oneLiner('Branch B',                       'Else PlanStatus.valueOf(status.toUpperCase()) → findByStatus(...).'));
children.push(oneLiner('Error path',                     'If valueOf throws: BadRequestException (HTTP 400) listing valid values.'));
children.push(oneLiner('Return',                         'stream().map(mapper::toResponse).collect(toList()).'));
children.push(oneLiner('@Transactional(readOnly=true)',  'JPA skips dirty-check — slight perf win.'));

children.push(h3('approvePlan(planId, approvedById, decision, comments)'));
children.push(oneLiner('Step 1 — load plan',             'planRepository.findById() — 404 if missing.'));
children.push(oneLiner('Step 2 — guard invariant',       'If plan.status != PENDING: throw ConflictException → HTTP 409.'));
children.push(oneLiner('Step 3 — load approver',         'userRepository.findById() — 404 if missing.'));
children.push(oneLiner('Step 4 — build approval row',    'CapacityApproval.builder() with decision + comments.'));
children.push(oneLiner('Step 5 — INSERT approval',       'approvalRepository.save(approval).'));
children.push(oneLiner('Step 6 — flip plan status',      'plan.setStatus(APPROVED or REJECTED) → planRepository.save(plan).'));
children.push(oneLiner('Step 7 — audit',                 'logAction with action = "APPROVED_CAPACITY_PLAN" or "REJECTED_CAPACITY_PLAN".'));
children.push(oneLiner('Step 8 — return DTO',            'approvalMapper.toResponse(saved).'));
children.push(oneLiner('@Transactional',                 'All 3 DB writes (approval insert, plan update, audit insert) are atomic.'));

children.push(h2('8.2 CapacityRecordServiceImpl'));

children.push(h3('recordMeasurement(siteId, interfaceId, mbps, recordedById)'));
children.push(oneLiner('Load site',                      'siteRepository.findById() — 404 on miss.'));
children.push(oneLiner('Load interface',                 'interfaceRepository.findById() — 404 on miss.'));
children.push(oneLiner('Load user',                      'userRepository.findById() — 404 on miss.'));
children.push(oneLiner('Build CapacityRecord',           '.site, .iface, .measuredCapacityMbps, .recordedBy.'));
children.push(oneLiner('Persist',                        'recordRepository.save(record).'));
children.push(oneLiner('Audit',                          'action = "RECORD_CAPACITY_MEASUREMENT".'));
children.push(oneLiner('Return DTO',                     'mapper.toResponse(saved).'));

children.push(h3('listRecords(siteId, interfaceId)'));
children.push(oneLiner('Both filters',                   'findBySiteSiteIdAndIfaceInterfaceId(siteId, interfaceId).'));
children.push(oneLiner('Only siteId',                    'findBySiteSiteId(siteId).'));
children.push(oneLiner('Only interfaceId',               'findByIfaceInterfaceId(interfaceId).'));
children.push(oneLiner('Neither',                        'findAll().'));
children.push(oneLiner('Map and return',                 'stream().map(mapper::toResponse).collect(toList()).'));

children.push(h2('8.3 ChangeEvidenceServiceImpl'));

children.push(h3('uploadEvidence(planId, MultipartFile, uploadedById, notes)'));
children.push(oneLiner('Step 1 — load plan',             'planRepository.findById() — 404 if missing.'));
children.push(oneLiner('Step 2 — load uploader',         'userRepository.findById() — 404 if missing.'));
children.push(oneLiner('Step 3 — null/empty check',      'BadRequestException if file is null or empty.'));
children.push(oneLiner('Step 4 — sanitise filename',     'Paths.get(orig).getFileName() strips "../" — path-traversal defence.'));
children.push(oneLiner('Step 5 — disambiguate',          'storedFilename = UUID + "_" + safeName (no collisions).'));
children.push(oneLiner('Step 6 — make per-plan folder',  'Paths.get(uploadDir, String.valueOf(planId)) + Files.createDirectories.'));
children.push(oneLiner('Step 7 — stream to disk',        'Files.copy(file.getInputStream(), target, REPLACE_EXISTING).'));
children.push(oneLiner('Step 8 — hash bytes',            'computeSha256(file.getBytes()) — for audit verification later.'));
children.push(oneLiner('Step 9 — save metadata row',     'ChangeEvidence.builder()... .fileUri(target).fileHash(sha256)...'));
children.push(oneLiner('Step 10 — audit',                'logAction with action "UPLOAD_EVIDENCE".'));
children.push(oneLiner('Error path',                     'IOException wrapped → ResourceNotFoundException for clean client error.'));

children.push(h3('listEvidence(planId)'));
children.push(oneLiner('Verify plan exists',             'findById — gives a clean 404 instead of returning an empty list.'));
children.push(oneLiner('Query',                          'evidenceRepository.findByPlanPlanId(planId).'));
children.push(oneLiner('Map and return',                 'stream().map(mapper::toResponse).collect(toList()).'));

children.push(h3('downloadEvidenceFile(evidenceId)'));
children.push(oneLiner('Load row',                       'evidenceRepository.findById() — 404 if missing.'));
children.push(oneLiner('Resolve path',                   'Paths.get(evidence.getFileUri()).'));
children.push(oneLiner('Wrap as Resource',               'new UrlResource(filePath.toUri()) for Spring streaming.'));
children.push(oneLiner('Sanity check',                   'resource.exists() && resource.isReadable() — else 404.'));
children.push(oneLiner('Return',                         'Spring controller streams it back with correct headers.'));

children.push(h3('computeSha256(bytes)'));
children.push(oneLiner('Behaviour',                      'MessageDigest.getInstance("SHA-256") → HexFormat.formatHex(...).'));
children.push(oneLiner('Fallback',                       'If NoSuchAlgorithmException (impossible on JVM): returns "hash-unavailable".'));

// ─────────── 9. CONTROLLERS ───────────
children.push(pageBreak());
children.push(h1('9. Backend controllers — every endpoint, line by line'));

children.push(h2('9.1 CapacityPlanController'));
children.push(oneLiner('@RestController',                'Every method returns JSON, not a view.'));
children.push(oneLiner('@RequestMapping("/capacity-plans")', 'Base path for all endpoints in this class.'));
children.push(oneLiner('@RequiredArgsConstructor',       'Lombok generates the constructor for final fields; Spring auto-wires.'));

children.push(h3('POST /capacity-plans — submitPlan(req)'));
children.push(oneLiner('@Valid @RequestBody',            'Triggers bean-validation on CapacityPlanRequest before the method runs.'));
children.push(oneLiner('Call service',                   'planService.submitPlan(unpacked-fields).'));
children.push(oneLiner('Response',                       '201 CREATED, body = APIResponse.success("Capacity plan submitted.", saved).'));

children.push(h3('GET /capacity-plans?status= — listPlans(status)'));
children.push(oneLiner('@RequestParam(required=false)',  '"status" is optional. Missing means "all plans".'));
children.push(oneLiner('Call service',                   'planService.listPlans(status).'));
children.push(oneLiner('Response',                       '200 OK with APIResponse.success(plans).'));

children.push(h3('POST /capacity-plans/{planId}/approve — approvePlan(planId, req)'));
children.push(oneLiner('@PathVariable Long planId',      'Captured from the URL.'));
children.push(oneLiner('@Valid @RequestBody ApprovalRequest', 'Validates the JSON body.'));
children.push(oneLiner('Parse status string',            'try ApprovalStatus.valueOf(req.getStatus().toUpperCase()).'));
children.push(oneLiner('Catch invalid',                  'IllegalArgumentException → throw BadRequestException → 400.'));
children.push(oneLiner('Call service',                   'planService.approvePlan(planId, approvedBy, decision, comments).'));
children.push(oneLiner('Response',                       '200 OK with "Plan approved." or "Plan rejected." message.'));

children.push(h2('9.2 CapacityRecordController'));

children.push(h3('POST /capacity-records — recordMeasurement(req)'));
children.push(oneLiner('@Valid @RequestBody',            'CapacityRecordRequest validated.'));
children.push(oneLiner('Call service',                   'recordService.recordMeasurement(siteId, interfaceId, mbps, recordedBy).'));
children.push(oneLiner('Response',                       '201 CREATED with the saved record DTO.'));

children.push(h3('GET /capacity-records?siteId=&interfaceId= — listRecords(siteId, interfaceId)'));
children.push(oneLiner('Both params optional',           '@RequestParam(required = false) for siteId and interfaceId.'));
children.push(oneLiner('Service picks the query',        'Dispatch table based on which filters are non-null.'));
children.push(oneLiner('Response',                       '200 OK with the list.'));

children.push(h2('9.3 ChangeEvidenceController'));

children.push(h3('POST /capacity-plans/{planId}/evidence — uploadEvidence(planId, file, uploadedBy, notes)'));
children.push(oneLiner('@PostMapping(consumes = "multipart/form-data")', 'Tells Spring this expects multipart, not JSON.'));
children.push(oneLiner('@RequestParam("file") MultipartFile', 'Spring binds the file part of the upload.'));
children.push(oneLiner('@RequestParam Long uploadedBy',  'Plain form field carrying the user id.'));
children.push(oneLiner('@RequestParam(required=false) notes', 'Optional caption.'));
children.push(oneLiner('Call service',                   'evidenceService.uploadEvidence(planId, file, uploadedBy, notes).'));
children.push(oneLiner('Response',                       '201 CREATED with the saved evidence DTO.'));

children.push(h3('GET /capacity-plans/{planId}/evidence — listEvidence(planId)'));
children.push(oneLiner('Path variable',                  'Plan id from URL.'));
children.push(oneLiner('Call service',                   'evidenceService.listEvidence(planId).'));
children.push(oneLiner('Response',                       '200 OK with list of evidence DTOs.'));

children.push(h3('GET /capacity-plans/{planId}/evidence/{evidenceId}/download — download(planId, evidenceId)'));
children.push(oneLiner('Service returns Resource',       'evidenceService.downloadEvidenceFile(evidenceId).'));
children.push(oneLiner('Set Content-Disposition',        'Header: attachment; filename="..." so browser downloads.'));
children.push(oneLiner('Stream body',                    'ResponseEntity<Resource> — Spring writes the bytes for us.'));

// ─────────── 10. FRONTEND FILE TOUR ───────────
children.push(pageBreak());
children.push(h1('10. Frontend file tour'));
children.push(p('Inside frontend/src/app/ — only the files that touch capacity:'));

children.push(h3('Service layer'));
children.push(oneLiner('core/services/api.service.ts',          'Single class wrapping HttpClient calls for every endpoint.'));
children.push(oneLiner('core/services/current-user.service.ts', 'Resolves JWT email → numeric user id, cached per email.'));
children.push(oneLiner('core/services/auth.service.ts',         'Holds the JWT, exposes role() and hasRole(...).'));

children.push(h3('Feature components — Plans page'));
children.push(oneLiner('features/capacity/capacity-plans-list.component.ts', 'The main page: header, table, dialog launchers.'));
children.push(oneLiner('└── CapacityPlanFormDialog',             'Inline class: cascading Site→Node→Interface picker + submit form.'));
children.push(oneLiner('└── ReviewPlanDialog',                   'Inline class: approve/reject form with comments box.'));
children.push(oneLiner('└── PlanEvidenceDialog',                 'Inline class: file picker, list, download.'));

children.push(h3('Feature components — Records page'));
children.push(oneLiner('features/capacity/capacity-records-list.component.ts', 'The main records page.'));
children.push(oneLiner('└── CapacityRecordFormDialog',           'Inline class: pick site/node/interface, type measured Mbps.'));

// ─────────── 11. API SERVICE ───────────
children.push(h1('11. ApiService — capacity methods'));
children.push(p('All HTTP calls go through one class so headers, JWT, base URL are configured once. Every method returns an Observable.'));

children.push(h3('Plans'));
children.push(oneLiner('capacityPlans()',                'GET /capacity-plans — list all plans (unwraps APIResponse.data).'));
children.push(oneLiner('createCapacityPlan(body)',       'POST /capacity-plans — submit a new plan.'));
children.push(oneLiner('approveCapacityPlan(planId, body)', 'POST /capacity-plans/{id}/approve — manager decision.'));

children.push(h3('Records'));
children.push(oneLiner('capacityRecords()',              'GET /capacity-records — list all measurements.'));
children.push(oneLiner('createCapacityRecord(body)',     'POST /capacity-records — record a measurement.'));

children.push(h3('Evidence'));
children.push(oneLiner('planEvidence(planId)',           'GET /capacity-plans/{id}/evidence — list files for a plan.'));
children.push(oneLiner('uploadPlanEvidence(planId, file, uploadedBy, notes?)', 'Builds FormData → POST multipart.'));
children.push(oneLiner('downloadPlanEvidence(planId, evidenceId)', 'GET … /download with responseType: "blob".'));

children.push(h3('Sites / Nodes / Interfaces (used by capacity dialogs)'));
children.push(oneLiner('sites()',                        'GET /sites.'));
children.push(oneLiner('nodesBySite(siteId)',            'GET /sites/{id}/nodes — for the cascading dropdown.'));
children.push(oneLiner('interfacesByNode(nodeId)',       'GET /nodes/{id}/interfaces — for the cascading dropdown.'));

// ─────────── 12. PLANS COMPONENT ───────────
children.push(pageBreak());
children.push(h1('12. CapacityPlansListComponent — every method'));

children.push(h3('Injected dependencies'));
children.push(oneLiner('protected auth: AuthService',     'Used in the template for role-based @if (auth.hasRole(...)) gates.'));
children.push(oneLiner('private api: ApiService',        'HTTP wrapper.'));
children.push(oneLiner('private currentUser',            'Resolves the numeric userId from the JWT email.'));
children.push(oneLiner('private dialog: MatDialog',      'Opens modal dialogs.'));
children.push(oneLiner('private snack: MatSnackBar',     'Toast notifications.'));

children.push(h3('State'));
children.push(oneLiner('rows = signal<any[]>([])',       'Reactive list — table re-renders on every change.'));
children.push(oneLiner('loading = signal(true)',         'Shows the indeterminate progress bar while fetching.'));

children.push(h3('ngOnInit()'));
children.push(oneLiner('currentUser.resolveId().subscribe()', 'Prime the user-id cache so it\'s ready before any click.'));
children.push(oneLiner('this.refresh()',                 'Initial load.'));

children.push(h3('refresh()'));
children.push(oneLiner('loading.set(true)',              'Show progress bar.'));
children.push(oneLiner('api.capacityPlans().subscribe',  'Fire GET /capacity-plans.'));
children.push(oneLiner('next: set rows + clear loading', 'On success: update signal, hide spinner.'));
children.push(oneLiner('error: clear loading',           'On failure: at least hide spinner so UI isn\'t stuck.'));

children.push(h3('openCreate()'));
children.push(oneLiner('dialog.open(CapacityPlanFormDialog)', 'Modal with width 480px, data carrying current userId.'));
children.push(oneLiner('afterClosed().subscribe(created)', 'Truthy = dialog saved a plan; falsy = cancelled.'));
children.push(oneLiner('On created: snackbar + refresh', '"Plan submitted" toast and re-fetch the list.'));

children.push(h3('openEvidence(plan)'));
children.push(oneLiner('Single line',                    'dialog.open(PlanEvidenceDialog, { width: 640px, data: { plan } }).'));
children.push(oneLiner('No after-close handler',         'Evidence dialog manages its own internal refresh.'));

children.push(h3('openDecision(plan, decision)'));
children.push(oneLiner('Guard',                          'If currentUser.userId() is null: snackbar warning, return early.'));
children.push(oneLiner('Open ReviewPlanDialog',          'Pass plan, decision (APPROVED|REJECTED), approverId.'));
children.push(oneLiner('On done',                        'Snackbar "Plan #N approved/rejected" + refresh().'));

// ─────────── 13. PLAN FORM DIALOG ───────────
children.push(h1('13. CapacityPlanFormDialog — submit a plan'));

children.push(h3('State'));
children.push(oneLiner('model',                          'siteId, interfaceId, currentCapacity, proposedCapacity, reason.'));
children.push(oneLiner('selectedNodeId',                 'UI-only helper for narrowing the interface dropdown.'));
children.push(oneLiner('sites/nodes/interfaces signals', 'Three signal-backed dropdown lists.'));

children.push(h3('ngOnInit()'));
children.push(oneLiner('api.sites().subscribe',          'Load all sites upfront (small list).'));
children.push(oneLiner('On error',                       'Snackbar "Could not load sites".'));

children.push(h3('onSiteChange(siteId)'));
children.push(oneLiner('Reset downstream',               'Null out node, null out interface, clear both signal lists.'));
children.push(oneLiner('Early return',                   'If no siteId, leave dropdowns empty.'));
children.push(oneLiner('Fetch nodes',                    'api.nodesBySite(siteId) → populate nodes signal.'));

children.push(h3('onNodeChange(nodeId)'));
children.push(oneLiner('Reset interface',                'Null + clear list.'));
children.push(oneLiner('Fetch interfaces',               'api.interfacesByNode(nodeId) → populate interfaces signal.'));

children.push(h3('submit()'));
children.push(oneLiner('Read userId',                    'currentUser.userId() — must be resolved by now.'));
children.push(oneLiner('Guard',                          'If null: snackbar, return.'));
children.push(oneLiner('POST',                           'api.createCapacityPlan({ ...model, requestedBy: userId }).'));
children.push(oneLiner('On success',                     'ref.close(true) — parent sees truthy and refreshes.'));
children.push(oneLiner('On error',                       'Snackbar with err.error.message (or fallback "Submission failed").'));

// ─────────── 14. REVIEW DIALOG ───────────
children.push(h1('14. ReviewPlanDialog — approve / reject'));

children.push(h3('State and constructor'));
children.push(oneLiner('comments = ""',                  'Bound to the textarea via [(ngModel)].'));
children.push(oneLiner('submitting = signal(false)',     'Disables Confirm while in-flight to prevent double-click.'));
children.push(oneLiner('constructor @Inject MAT_DIALOG_DATA', 'Receives { plan, decision, approverId } from parent.'));

children.push(h3('submit()'));
children.push(oneLiner('Lock UI',                        'submitting.set(true).'));
children.push(oneLiner('Build body',                     '{ approvedBy, status, comments } — with default if comments blank.'));
children.push(oneLiner('POST',                           'api.approveCapacityPlan(plan.planId, body).'));
children.push(oneLiner('On success',                     'submitting.set(false), ref.close(true).'));
children.push(oneLiner('On error',                       'Unlock UI, show error in snackbar.'));

// ─────────── 15. EVIDENCE DIALOG ───────────
children.push(h1('15. PlanEvidenceDialog — files'));

children.push(h3('State'));
children.push(oneLiner('items = signal<any[]>([])',      'Existing evidence list.'));
children.push(oneLiner('loading = signal(true)',         'List-fetch spinner.'));
children.push(oneLiner('uploading = signal(false)',      'Upload-in-progress spinner.'));
children.push(oneLiner('file: File | null',              'Bound to the hidden <input type="file">.'));
children.push(oneLiner('notes = ""',                     'Optional caption typed by the user.'));

children.push(h3('ngOnInit() / refresh()'));
children.push(oneLiner('GET evidence',                   'api.planEvidence(plan.planId).subscribe → items.set.'));

children.push(h3('onFile(event)'));
children.push(oneLiner('Capture file',                   'this.file = input.files?.[0] ?? null.'));

children.push(h3('upload()'));
children.push(oneLiner('Guard file',                     'If no file selected: return early.'));
children.push(oneLiner('Guard userId',                   'Snackbar warning if userId not resolved.'));
children.push(oneLiner('uploading.set(true)',            'Disable the Upload button.'));
children.push(oneLiner('POST multipart',                 'api.uploadPlanEvidence(planId, file, userId, notes).'));
children.push(oneLiner('On success',                     'Clear form, snackbar, refresh().'));
children.push(oneLiner('On error',                       'Re-enable button, snackbar error.'));

children.push(h3('download(evidence)'));
children.push(oneLiner('Step 1 — fetch blob',            'api.downloadPlanEvidence(planId, evidenceId) → Blob.'));
children.push(oneLiner('Step 2 — make blob URL',         'URL.createObjectURL(blob).'));
children.push(oneLiner('Step 3 — temp anchor',           'document.createElement("a") + .download = filename.'));
children.push(oneLiner('Step 4 — programmatic click',    'a.click() — browser saves the file.'));
children.push(oneLiner('Step 5 — cleanup',               'URL.revokeObjectURL(url) — frees memory.'));

// ─────────── 16. RECORDS COMPONENT ───────────
children.push(pageBreak());
children.push(h1('16. CapacityRecordsListComponent — every method'));
children.push(p('Almost identical skeleton to the plans page.'));

children.push(h3('Injected dependencies'));
children.push(p('Same five — auth, api, currentUser, dialog, snack.'));

children.push(h3('State'));
children.push(oneLiner('rows = signal<any[]>([])',       'The measurements list.'));
children.push(oneLiner('loading = signal(true)',         'Spinner flag.'));

children.push(h3('ngOnInit()'));
children.push(oneLiner('resolveId',                      'Prime user-id cache.'));
children.push(oneLiner('refresh()',                      'Initial load.'));

children.push(h3('refresh()'));
children.push(oneLiner('GET',                            'api.capacityRecords() → rows.set.'));

children.push(h3('openCreate()'));
children.push(oneLiner('Dialog',                         'dialog.open(CapacityRecordFormDialog, { width: 420px }).'));
children.push(oneLiner('On saved',                       'Snackbar "Measurement recorded" + refresh.'));

// ─────────── 17. RECORD FORM ───────────
children.push(h1('17. CapacityRecordFormDialog'));

children.push(h3('State'));
children.push(oneLiner('model',                          'siteId, interfaceId, measuredCapacityMbps.'));
children.push(oneLiner('selectedNodeId',                 'UI-only narrower for the interface dropdown.'));
children.push(oneLiner('sites / nodes / interfaces',     'Same signal-backed lists as the plan form.'));

children.push(h3('ngOnInit() / onSiteChange / onNodeChange'));
children.push(p('Identical cascading-dropdown logic to the plan form. Pick a site, fetch nodes; pick a node, fetch interfaces.'));

children.push(h3('submit()'));
children.push(oneLiner('Read userId',                    'currentUser.userId().'));
children.push(oneLiner('POST',                           'api.createCapacityRecord({ ...model, recordedBy: userId }).'));
children.push(oneLiner('Outcome',                        'Same close-true on success, snackbar-error on failure.'));

// ─────────── 18. ROUND TRIP ───────────
children.push(pageBreak());
children.push(h1('18. End-to-end: Manager clicks Approve'));
children.push(p('A single button-click in the browser turns into 13 distinct steps across 3 services. Here they are:'));

const steps = [
  'Browser: user clicks the "Approve" button → openDecision(plan, "APPROVED") fires.',
  'Browser: dialog.open(ReviewPlanDialog, { data: { plan, decision, approverId } }) opens the modal.',
  'Browser: manager types comments, clicks Confirm.',
  'Browser: ReviewPlanDialog.submit() builds the body and calls api.approveCapacityPlan(planId, body).',
  'Browser: HttpClient issues POST http://localhost:9097/capacity-plans/{id}/approve with bearer JWT.',
  'Gateway (9097): looks up "capacity-service" in Eureka, forwards to port 9104.',
  'capacity-service (9104): JwtFilter validates token, extracts role=MANAGER, attaches to security context.',
  'capacity-service: CapacityPlanController.approvePlan(planId, req) is invoked.',
  'Service: Parses status string → enum; throws BadRequestException (400) on garbage input.',
  'Service: Loads plan; checks status == PENDING (else ConflictException → 409).',
  'Service: Inserts capacity_approvals row + updates capacity_plans.status + inserts audit_log row (atomic).',
  'Service: Builds and returns CapacityApprovalResponse, wrapped as APIResponse.success(...).',
  'Browser: subscribe(next) fires → ref.close(true) → parent.afterClosed → snackbar + refresh().',
];
for (const s of steps) {
  children.push(new Paragraph({
    numbering: { reference: 'numbers', level: 0 },
    spacing: { after: 100 },
    children: [new TextRun({ text: s, font: FONT, size: 22 })],
  }));
}

// ─────────── 19. ENDPOINT TABLE ───────────
children.push(pageBreak());
children.push(h1('19. Endpoint summary table'));

function epRow(method, path, who, what) {
  const tdProps = {
    borders: {
      top:    { style: BorderStyle.SINGLE, size: 4, color: 'CBD5E1' },
      bottom: { style: BorderStyle.SINGLE, size: 4, color: 'CBD5E1' },
      left:   { style: BorderStyle.SINGLE, size: 4, color: 'CBD5E1' },
      right:  { style: BorderStyle.SINGLE, size: 4, color: 'CBD5E1' },
    },
    margins: { top: 80, bottom: 80, left: 120, right: 120 },
  };
  return new TableRow({
    children: [
      new TableCell({ ...tdProps, width: { size: 900,  type: WidthType.DXA },
        children: [new Paragraph({ children: [new TextRun({ text: method, font: MONO, size: 18, bold: true })] })] }),
      new TableCell({ ...tdProps, width: { size: 3400, type: WidthType.DXA },
        children: [new Paragraph({ children: [new TextRun({ text: path, font: MONO, size: 18 })] })] }),
      new TableCell({ ...tdProps, width: { size: 1700, type: WidthType.DXA },
        children: [new Paragraph({ children: [new TextRun({ text: who, font: FONT, size: 20 })] })] }),
      new TableCell({ ...tdProps, width: { size: 3360, type: WidthType.DXA },
        children: [new Paragraph({ children: [new TextRun({ text: what, font: FONT, size: 20 })] })] }),
    ],
  });
}

const headerRow = new TableRow({
  tableHeader: true,
  children: ['Method', 'Path', 'Who', 'What it does'].map((h, i) => new TableCell({
    width: { size: [900, 3400, 1700, 3360][i], type: WidthType.DXA },
    borders: {
      top:    { style: BorderStyle.SINGLE, size: 4, color: '94A3B8' },
      bottom: { style: BorderStyle.SINGLE, size: 4, color: '94A3B8' },
      left:   { style: BorderStyle.SINGLE, size: 4, color: '94A3B8' },
      right:  { style: BorderStyle.SINGLE, size: 4, color: '94A3B8' },
    },
    shading: { fill: 'E2E8F0', type: ShadingType.CLEAR },
    margins: { top: 80, bottom: 80, left: 120, right: 120 },
    children: [new Paragraph({ children: [new TextRun({ text: h, font: FONT, size: 20, bold: true })] })],
  })),
});

children.push(new Table({
  width: { size: 9360, type: WidthType.DXA },
  columnWidths: [900, 3400, 1700, 3360],
  rows: [
    headerRow,
    epRow('POST',  '/capacity-plans',                       'NE / Mgr / Admin', 'Submit a new capacity plan (status = PENDING)'),
    epRow('GET',   '/capacity-plans?status=',               'all engineers',    'List plans, optional status filter (PENDING/APPROVED/...)'),
    epRow('POST',  '/capacity-plans/{id}/approve',          'Mgr / Admin',      'Approve or reject; body has status + comments'),
    epRow('POST',  '/capacity-plans/{id}/evidence',         'NE / Mgr / Admin', 'Multipart upload — adds an evidence file'),
    epRow('GET',   '/capacity-plans/{id}/evidence',         'all engineers',    'List uploaded evidence for one plan'),
    epRow('GET',   '/capacity-plans/{id}/evidence/{eid}/download', 'all engineers', 'Stream file bytes back to the browser'),
    epRow('POST',  '/capacity-records',                     'NE / Mgr / Admin', 'Record one measured throughput sample'),
    epRow('GET',   '/capacity-records?siteId=&interfaceId=','all engineers',    'List measurements, optional filters'),
  ],
}));

// ─────────── 20. ROLES ───────────
children.push(pageBreak());
children.push(h1('20. Roles & permissions reference'));
children.push(p('Capacity Management buttons are gated client-side by AuthService.hasRole(...) and server-side by JwtFilter + Spring Security. Both layers agree on who can do what:'));

children.push(h3('On the Plans page'));
children.push(oneLiner('View list',                      'Anyone authenticated.'));
children.push(oneLiner('Submit new plan',                'ADMIN, MANAGER, NETWORK_ENGINEER.'));
children.push(oneLiner('Approve / Reject',               'ADMIN, MANAGER (only PENDING plans).'));
children.push(oneLiner('Upload evidence',                'ADMIN, MANAGER, NETWORK_ENGINEER.'));
children.push(oneLiner('Download evidence',              'Any authenticated user (auditor reads).'));

children.push(h3('On the Records page'));
children.push(oneLiner('View list',                      'Anyone authenticated.'));
children.push(oneLiner('Record new measurement',         'ADMIN, NETWORK_ENGINEER.'));

children.push(h3('Why this split?'));
children.push(p('Managers don\'t typically measure throughput themselves — that\'s field/network engineering work. But they own the spend approval. Auditors only read.'));

children.push(gap());
children.push(pMixed([
  { t: 'End of document. ', italic: true, color: MUTED },
  { t: 'Regenerate any time with: ', italic: true, color: MUTED },
  { t: 'node build-capacity-doc.js', code: true, italic: true, color: MUTED },
]));

// ─────────────────────────────────────────────────────────────────────
// Document
// ─────────────────────────────────────────────────────────────────────
const doc = new Document({
  creator: 'NetOpsOne',
  title: 'Capacity Module — Deep Walkthrough',
  description: 'Line-by-line walkthrough of backend and frontend capacity code, with one-line explanations for every class and function.',
  styles: {
    default: { document: { run: { font: FONT, size: 22 } } },
    paragraphStyles: [
      { id: 'Heading1', name: 'Heading 1', basedOn: 'Normal', next: 'Normal', quickFormat: true,
        run: { size: 38, bold: true, font: FONT, color: HEADING_FG },
        paragraph: { spacing: { before: 360, after: 200 }, outlineLevel: 0 } },
      { id: 'Heading2', name: 'Heading 2', basedOn: 'Normal', next: 'Normal', quickFormat: true,
        run: { size: 30, bold: true, font: FONT, color: HEADING_FG },
        paragraph: { spacing: { before: 320, after: 160 }, outlineLevel: 1 } },
      { id: 'Heading3', name: 'Heading 3', basedOn: 'Normal', next: 'Normal', quickFormat: true,
        run: { size: 25, bold: true, font: FONT, color: BRAND },
        paragraph: { spacing: { before: 260, after: 120 }, outlineLevel: 2 } },
      { id: 'Heading4', name: 'Heading 4', basedOn: 'Normal', next: 'Normal', quickFormat: true,
        run: { size: 22, bold: true, font: FONT, color: ACCENT },
        paragraph: { spacing: { before: 200, after: 100 }, outlineLevel: 3 } },
    ],
  },
  numbering: {
    config: [
      { reference: 'bullets',
        levels: [
          { level: 0, format: LevelFormat.BULLET, text: '•', alignment: AlignmentType.LEFT,
            style: { paragraph: { indent: { left: 720, hanging: 360 } } } },
          { level: 1, format: LevelFormat.BULLET, text: '◦', alignment: AlignmentType.LEFT,
            style: { paragraph: { indent: { left: 1440, hanging: 360 } } } },
        ] },
      { reference: 'numbers',
        levels: [{ level: 0, format: LevelFormat.DECIMAL, text: '%1.', alignment: AlignmentType.LEFT,
          style: { paragraph: { indent: { left: 720, hanging: 360 } } } }] },
    ],
  },
  sections: [{
    properties: {
      page: {
        size: { width: 12240, height: 15840 },
        margin: { top: 1440, right: 1440, bottom: 1440, left: 1440 },
      },
    },
    headers: {
      default: new Header({ children: [new Paragraph({
        alignment: AlignmentType.RIGHT,
        children: [new TextRun({ text: 'NetOpsOne · Capacity Management — Deep Walkthrough', font: FONT, size: 18, color: MUTED })],
      })] }),
    },
    footers: {
      default: new Footer({ children: [new Paragraph({
        alignment: AlignmentType.CENTER,
        children: [
          new TextRun({ text: 'Page ', font: FONT, size: 18, color: MUTED }),
          new TextRun({ children: [PageNumber.CURRENT], font: FONT, size: 18, color: MUTED }),
        ],
      })] }),
    },
    children,
  }],
});

Packer.toBuffer(doc).then((buffer) => {
  const out = path.join(__dirname, 'CapacityModule-Walkthrough.docx');
  fs.writeFileSync(out, buffer);
  console.log('Wrote', out, '—', buffer.length, 'bytes');
});
