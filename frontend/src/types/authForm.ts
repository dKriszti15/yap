export type Tab = "login" | "register";

export type FieldName =
  | "lUsername"
  | "lPassword"
  | "rUsername"
  | "rEmail"
  | "rPassword"
  | "rConfirm";

export type Values = Record<FieldName, string>;
export type Touched = Record<FieldName, boolean>;