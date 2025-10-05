/**
 * Temporal Worker Build Version Management
 *
 * Generates unique build IDs from git commits for worker versioning.
 * This enables zero-downtime deployments where old workflows route to old workers
 * and new workflows route to new workers automatically.
 *
 * Learn more: https://docs.temporal.io/workers#worker-versioning
 */

import { execSync } from "node:child_process";
import { logger } from "@/core/base/utils/Logger";

export interface BuildInfo {
  buildId: string;
  gitHash: string;
  gitBranch: string;
  timestamp: string;
  isDirty: boolean;
}

/**
 * Generate build ID from git commit hash
 * Format: branch-hash-date (e.g., main-a1b2c3d-2025-10-04)
 *
 * This is used to version workers in Temporal. Each deployment gets a unique build ID,
 * and Temporal routes workflows to the correct worker version automatically.
 */
export function getBuildId(): string {
  try {
    const gitHash = execSync("git rev-parse --short HEAD", {
      encoding: "utf-8",
    }).trim();
    const gitBranch = execSync("git rev-parse --abbrev-ref HEAD", {
      encoding: "utf-8",
    }).trim();
    const timestamp = new Date().toISOString().split("T")[0]; // YYYY-MM-DD

    // Check if working directory is dirty (uncommitted changes)
    let isDirty = false;
    try {
      const status = execSync("git status --porcelain", {
        encoding: "utf-8",
      }).trim();
      isDirty = status.length > 0;
    } catch {
      // Ignore errors checking dirty status
    }

    const dirtySuffix = isDirty ? "-dirty" : "";

    return `${gitBranch}-${gitHash}-${timestamp}${dirtySuffix}`;
  } catch (_error) {
    // Fallback for non-git environments (CI/CD, Docker, etc.)
    logger.warn("⚠️  Git not available, using timestamp-based build ID");
    return `build-${Date.now()}`;
  }
}

/**
 * Get detailed build information
 */
export function getBuildInfo(): BuildInfo {
  try {
    const gitHash = execSync("git rev-parse --short HEAD", {
      encoding: "utf-8",
    }).trim();
    const gitBranch = execSync("git rev-parse --abbrev-ref HEAD", {
      encoding: "utf-8",
    }).trim();
    const timestamp = new Date().toISOString();

    let isDirty = false;
    try {
      const status = execSync("git status --porcelain", {
        encoding: "utf-8",
      }).trim();
      isDirty = status.length > 0;
    } catch {
      // Ignore
    }

    const buildId = getBuildId();

    return {
      buildId,
      gitHash,
      gitBranch,
      timestamp,
      isDirty,
    };
  } catch (_error) {
    return {
      buildId: `build-${Date.now()}`,
      gitHash: "unknown",
      gitBranch: "unknown",
      timestamp: new Date().toISOString(),
      isDirty: false,
    };
  }
}

/**
 * Get previous build ID (for rollback scenarios)
 */
export function getPreviousBuildId(): string | undefined {
  try {
    const prevHash = execSync("git rev-parse --short HEAD~1", {
      encoding: "utf-8",
    }).trim();
    const gitBranch = execSync("git rev-parse --abbrev-ref HEAD", {
      encoding: "utf-8",
    }).trim();

    // Note: Timestamp won't match exactly, but hash is the key identifier
    return `${gitBranch}-${prevHash}`;
  } catch (_error) {
    return undefined;
  }
}

/**
 * Get build ID from environment variable (for containerized deployments)
 * Falls back to git-based ID if not set
 */
export function getBuildIdFromEnv(): string {
  return process.env.TEMPORAL_WORKER_BUILD_ID || getBuildId();
}
