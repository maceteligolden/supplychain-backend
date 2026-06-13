/** Health check response returned by the health endpoint. */
export interface IHealthStatusOutput {
  status: 'ok';
  message: string;
  timestamp: string;
}
