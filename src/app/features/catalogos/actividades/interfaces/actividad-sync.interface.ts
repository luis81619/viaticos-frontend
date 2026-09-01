export interface ProyectoSyncResult {
  received: number;
  inserted: number;
  updated: number;
  reactivated: number;
}

export interface ActividadSyncResult {
  received: number;
  inserted: number;
  updated: number;
  reactivated: number;
  deactivated: number;
}

export interface ActividadSync {
  projects: ProyectoSyncResult;
  activities: ActividadSyncResult;
  generatedAt: string;
  done: boolean;
}
