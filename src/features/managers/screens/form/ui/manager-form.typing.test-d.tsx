import { useSaveForm } from "@/shared/ui/form/useSaveForm";
import { z } from "zod";
import {
  managerCreateSchema,
  managerEditSchema,
  type ManagerCreateInput,
  type ManagerEditInput,
} from "../model/manager-form-schema";
import { ManagerForm } from "./ManagerForm";

declare const createDefaults: ManagerCreateInput;
declare const editDefaults: ManagerEditInput;
declare const save: { run: () => Promise<unknown>; isPending: boolean };
declare const noop: () => void;

function Proof() {
  const create = useSaveForm({
    schema: managerCreateSchema,
    defaultValues: createDefaults,
    sections: { info: ["type"] },
    save,
    mapError: () => undefined,
    onDone: noop,
  });
  const edit = useSaveForm({
    schema: managerEditSchema,
    defaultValues: editDefaults,
    sections: { info: ["type"] },
    save,
    mapError: () => undefined,
    onDone: noop,
  });
  const login = useSaveForm({
    schema: z.object({ id: z.string() }),
    defaultValues: { id: "" },
    sections: { info: ["id"] },
    save,
    mapError: () => undefined,
    onDone: noop,
  });
  return (
    <>
      <ManagerForm save={create} identity={null} onCancel={noop} />
      <ManagerForm save={edit} identity={null} onCancel={noop} />
      {/* @ts-expect-error a form without the seven common manager fields cannot render them */}
      <ManagerForm save={login} identity={null} onCancel={noop} />
    </>
  );
}

void Proof;
