import { Client, Connection } from "@temporalio/client";
import { InfrastructureError } from "@/core/base/errors/BaseError";
import { logger } from "@/core/base/utils/Logger";
import { env } from "../config/EnvValidator";

let temporalClient: Client | null = null;
let temporalConnection: Connection | null = null;

export async function createTemporalClient(): Promise<Client> {
  if (temporalClient) {
    return temporalClient;
  }

  try {
    // Create connection to Temporal server
    // For Temporal Cloud, include TLS and authentication
    const connectionOptions: any = {
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

    temporalConnection = await Connection.connect(connectionOptions);

    // Create client
    temporalClient = new Client({
      connection: temporalConnection,
      namespace: env.TEMPORAL_NAMESPACE,
    });

    logger.info("✅ Temporal client connected successfully");
    logger.info(`   Address: ${env.TEMPORAL_ADDRESS}`);
    logger.info(`   Namespace: ${env.TEMPORAL_NAMESPACE}`);

    return temporalClient;
  } catch (error) {
    logger.error("❌ Failed to connect to Temporal server:", error);
    throw new InfrastructureError(
      "Could not establish connection to Temporal server",
      { cause: error },
    );
  }
}

export async function getTemporalClient(): Promise<Client> {
  if (!temporalClient) {
    return createTemporalClient();
  }
  return temporalClient;
}

export async function closeTemporalConnection(): Promise<void> {
  if (temporalConnection) {
    await temporalConnection.close();
    temporalConnection = null;
    temporalClient = null;
    logger.info("✅ Temporal connection closed");
  }
}
