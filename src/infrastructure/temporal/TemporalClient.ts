import { Client, Connection } from '@temporalio/client';
import { env } from '../config/EnvValidator';

let temporalClient: Client | null = null;
let temporalConnection: Connection | null = null;

export async function createTemporalClient(): Promise<Client> {
  if (temporalClient) {
    return temporalClient;
  }

  try {
    // Create connection to Temporal server
    temporalConnection = await Connection.connect({
      address: env.TEMPORAL_ADDRESS,
    });

    // Create client
    temporalClient = new Client({
      connection: temporalConnection,
      namespace: env.TEMPORAL_NAMESPACE,
    });

    console.log('✅ Temporal client connected successfully');
    console.log(`   Address: ${env.TEMPORAL_ADDRESS}`);
    console.log(`   Namespace: ${env.TEMPORAL_NAMESPACE}`);

    return temporalClient;
  } catch (error) {
    console.error('❌ Failed to connect to Temporal server:', error);
    throw new Error('Could not establish connection to Temporal server');
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
    console.log('✅ Temporal connection closed');
  }
}