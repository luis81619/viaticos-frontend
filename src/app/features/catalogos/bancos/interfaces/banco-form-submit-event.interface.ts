import { CreateBancoRequest } from './create-banco-request.interface';
import { UpdateBancoRequest } from './update-banco-request.interface';

export type BancoFormSubmitEvent =
  | {
      mode: 'create';
      request: CreateBancoRequest;
    }
  | {
      mode: 'update';
      id: string;
      request: UpdateBancoRequest;
    };
