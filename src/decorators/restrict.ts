import "reflect-metadata";

import { Permission } from "../interfaces/IStore";

const PERMISSION_METADATA_KEY = Symbol("permission");

export function Restrict(permission: Permission = 'none'): any {
  return function (target: Object, propertyKey: string | symbol) {
    Reflect.defineMetadata(
      PERMISSION_METADATA_KEY,
      permission,
      target,
      propertyKey
    );
  };
}

export function getPermission(
  target: any,
  propertyKey: string
): string | undefined {
  return Reflect.getMetadata(PERMISSION_METADATA_KEY, target, propertyKey);
}
