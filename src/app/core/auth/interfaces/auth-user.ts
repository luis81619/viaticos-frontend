import { PlantelInfo } from "./plantel-info";
import { Role } from "./role";

export interface AuthUser {
  userId: string;
  nombres: string;
  apellidoPaterno: string;
  apellidoMaterno: string;
  nombreCompleto: string;
  email: string;
  roles: Role[];
  plantel: PlantelInfo;
  numeroTrabajador?: string;
}
