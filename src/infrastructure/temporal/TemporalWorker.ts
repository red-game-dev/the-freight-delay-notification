import path from "node:path";
import {
  NativeConnection,
  type NativeConnectionOptions,
  Worker,
} from "@temporalio/worker";
import { InfrastructureError } from "../../core/base/errors/BaseError";
import { logger } from "../../core/base/utils/Logger";
import * as activities from "../../workflows/activities";
import { env } from "../config/EnvValidator";
import { getBuildIdFromEnv, getBuildInfo } from "./BuildVersion";

let worker: Worker | null = null;

export async function createTemporalWorker(): Promise<Worker> {
  try {
    // Get build information for worker versioning
    const buildInfo = getBuildInfo();
    const buildId = getBuildIdFromEnv();

    logger.info("🏗️  Worker Build Information:");
    logger.info(`   Build ID: ${buildId}`);
    logger.info(`   Git Hash: ${buildInfo.gitHash}`);
    logger.info(`   Git Branch: ${buildInfo.gitBranch}`);
    logger.info(`   Timestamp: ${buildInfo.timestamp}`);
    if (buildInfo.isDirty) {
      logger.warn("   ⚠️  Working directory has uncommitted changes");
    }

    // Create connection to Temporal server
    // For Temporal Cloud, include TLS and authentication
    const connectionOptions: NativeConnectionOptions = {
      address: env.TEMPORAL_ADDRESS,
    };

    // Add Temporal Cloud authentication if API key is provided
    if (env.TEMPORAL_API_KEY) {
      logger.info(
        "🔐 Connecting to Temporal Cloud with API key authentication",
      );
      connectionOptions.tls = {
        // Temporal Cloud uses TLS by default
      };
      connectionOptions.metadata = {
        "temporal-namespace": env.TEMPORAL_NAMESPACE,
        authorization: `Bearer ${env.TEMPORAL_API_KEY}`,
      };
    } else {
      logger.info("🔌 Connecting to local Temporal server");
    }

    const connection = await NativeConnection.connect(connectionOptions);

    // Enable worker versioning via environment variable
    // Set TEMPORAL_WORKER_VERSIONING=true to enable (recommended for production)
    const useVersioning = env.TEMPORAL_WORKER_VERSIONING === "true";

    // Create worker with workflow and activity registrations
    worker = await Worker.create({
      connection,
      namespace: env.TEMPORAL_NAMESPACE,
      taskQueue: env.TEMPORAL_TASK_QUEUE,
      workflowsPath: path.resolve(__dirname, "../../workflows/workflows.ts"),
      activities,

      // Worker configuration
      maxConcurrentActivityTaskExecutions: 10,
      maxConcurrentWorkflowTaskExecutions: 5,

      // 🔑 Worker Versioning (enables zero-downtime deployments)
      // When enabled:
      // - Old workflows route to workers with their original build ID
      // - New workflows route to workers with latest build ID
      // - Multiple worker versions can run simultaneously
      ...(useVersioning && {
        buildId,
        useVersioning: true,
      }),
    });

    logger.info("✅ Temporal worker created successfully");
    logger.info(`   Task Queue: ${env.TEMPORAL_TASK_QUEUE}`);
    logger.info(`   Namespace: ${env.TEMPORAL_NAMESPACE}`);
    logger.info(
      `   Versioning: ${useVersioning ? "✅ Enabled" : "❌ Disabled (use TEMPORAL_WORKER_VERSIONING=true)"}`,
    );

    return worker;
  } catch (error) {
    logger.error("❌ Failed to create Temporal worker:", error);
    throw new InfrastructureError("Could not create Temporal worker", {
      cause: error,
    });
  }
}

export async function startWorker(): Promise<void> {
  if (!worker) {
    worker = await createTemporalWorker();
  }

  logger.info("🏃 Starting Temporal worker...");
  await worker.run();
}

export async function stopWorker(): Promise<void> {
  if (worker) {
    logger.info("🛑 Shutting down Temporal worker...");
    await worker.shutdown();
    worker = null;
    logger.info("✅ Temporal worker stopped");
  }
}
