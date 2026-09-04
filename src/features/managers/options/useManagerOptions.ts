import { useLocale } from "@/shared/i18n/locale-context";
import { useQuery } from "@tanstack/react-query";
import type { ManagerPermissionScope } from "../api/manager-form-contract";
import { managerTypes } from "../api/manager-list-contract";
import {
  managerAgencyOptionsQuery,
  managerPermissionOptionsQuery,
  managerTypeOptionsQuery,
} from "../api/queries";

interface StringIdNameOptionSource {
  readonly id?: string;
  readonly name?: string;
}

interface IdNameOptionSource {
  readonly id?: string | number;
  readonly name?: string;
}

function toManagerTypeOptions(options: readonly StringIdNameOptionSource[]) {
  return options.flatMap(({ id, name }) =>
    id && Object.hasOwn(managerTypes, id)
      ? [{ value: id, label: name ?? "" }]
      : [],
  );
}

function toIdNameOptions(options: readonly IdNameOptionSource[]) {
  return options.flatMap(({ id, name }) =>
    id === undefined ? [] : [{ value: String(id), label: name ?? String(id) }],
  );
}

export function useManagerTypeOptions() {
  const { locale } = useLocale();
  return useQuery({
    ...managerTypeOptionsQuery(locale),
    select: toManagerTypeOptions,
  });
}

export function useManagerPermissionOptions(
  type: ManagerPermissionScope | undefined,
) {
  const { locale } = useLocale();
  return useQuery({
    ...managerPermissionOptionsQuery(locale, type),
    select: toIdNameOptions,
  });
}

export function useManagerAgencyOptions() {
  const { locale } = useLocale();
  return useQuery({
    ...managerAgencyOptionsQuery(locale),
    select: toIdNameOptions,
  });
}
