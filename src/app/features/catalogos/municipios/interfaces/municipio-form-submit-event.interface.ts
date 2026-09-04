import { CreateMunicipioRequest } from './create-municipio-request.interface';
import { UpdateMunicipioRequest } from './update-municipio-request.interface';

export type MunicipioFormSubmitEvent =
  | {
      mode: 'create';
      request: CreateMunicipioRequest;
    }
  | {
      mode: 'update';
      id: string;
      request: UpdateMunicipioRequest;
      submode: 'assign' | 'edit';
    };
