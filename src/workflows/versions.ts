/**
 * Temporal Workflow Version Tracking
 *
 * This file tracks all workflow versions using patched() for future cleanup.
 * When all workflows started before a version date are completed, you can
 * safely remove the old code path and this entry.
 */

export interface WorkflowVersion {
  /** Patch ID used in patched() call */
  patchId: string;
  /** Date the patch was added (YYYY-MM-DD) */
  addedDate: string;
  /** Earliest date we can safely remove old code path */
  canRemoveAfter: string;
  /** Description of what changed */
  description: string;
  /** Which workflow(s) are affected */
  workflows: string[];
  /** Current status */
  status: 'active' | 'can-remove' | 'removed';
}

/**
 * Active workflow versions
 * Check Temporal UI to see if workflows started before addedDate are still running
 * Once all old workflows complete, remove the old code path and mark status as 'removed'
 */
export const WORKFLOW_VERSIONS: Record<string, WorkflowVersion> = {
  'cache-delivery-details-2025-10-04': {
    patchId: 'cache-delivery-details-2025-10-04',
    addedDate: '2025-10-04',
    canRemoveAfter: '2025-11-04', // 30 days later
    description: 'Added delivery details caching at workflow start to reduce repeated DB calls in loop. Prevents Supabase timeout issues.',
    workflows: ['RecurringTrafficCheckWorkflow'],
    status: 'active',
  },
};

/**
 * Helper to check if a version can be safely removed
 * Run: tsx src/workflows/check-version-cleanup.ts
 */
export function getVersionsReadyForCleanup(): WorkflowVersion[] {
  const now = new Date();
  return Object.values(WORKFLOW_VERSIONS).filter(
    (v) => v.status === 'active' && new Date(v.canRemoveAfter) <= now
  );
}

/**
 * Helper to check if there are active versions
 */
export function hasActiveVersions(): boolean {
  return Object.values(WORKFLOW_VERSIONS).some((v) => v.status === 'active');
}
