/**
 * Matches the backend's com.project.netops.api.APIResponse<T> wrapper used by
 * incident-service, capacity-service, and task-service controllers.
 * (user-service + site-service return raw bodies, not this wrapper.)
 */
export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}
