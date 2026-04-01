export const OP = {
  // Server -> Client
  HELLO: 0,
  READY: 1,
  MESSAGE_CREATE: 2,
  MESSAGE_UPDATE: 3,
  MESSAGE_DELETE: 4,
  PRESENCE_UPDATE: 5,
  TYPING_START: 6,

  // Client -> Server
  IDENTIFY: 40,
  HEARTBEAT: 41,
  SUBSCRIBE: 42,
} as const;

export type GatewayMessage<T = unknown> = {
  op: number;
  d: T;
  s?: number;
};
