export interface ProblemDetail {
  type?: string;
  title?: string;
  status: number;
  detail?: string;
  instance?: string;
  invalidParameters?: Record<string, string>;
  [key: string]: unknown;
}

