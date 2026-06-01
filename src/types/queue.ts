// Shared contracts for the producer -> queue -> worker -> realtime pipeline.

/** Message payload enqueued by producers and consumed by the worker. */
export interface TaskMessage {
  task: string;
  email: string;
  timestamp?: string | Date;
}

/** Realtime status payload pushed over Socket.io. */
export interface TaskStatusUpdate {
  id: string;
  taskName: string;
  status: string;
}

/** Events the Socket.io server emits to connected browser clients. */
export interface ServerToClientEvents {
  task_finished: (data: TaskStatusUpdate) => void;
}

/** Events clients (worker / browser) emit to the Socket.io server. */
export interface ClientToServerEvents {
  task_status_update: (data: TaskStatusUpdate) => void;
}
