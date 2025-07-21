export { Restrict } from "../decorators/restrict";
import { getPermission } from "../decorators/restrict";
import throwError from "../errors/throwError";

import { JSONObject } from "../types/json-types";
import {
  IStore,
  Permission,
  StoreResult,
  StoreValue,
} from "../interfaces/IStore";

export class Store implements IStore {
  defaultPolicy: Permission = "rw";

  private getPermission(key: string) {
    return getPermission(this, key) || this.defaultPolicy;
  }

  allowedToRead(key: string): boolean {
    const permission = this.getPermission(key);
    return permission === "r" || permission === "rw";
  }

  allowedToWrite(key: string): boolean {
    const permission = this.getPermission(key);
    return permission === "w" || permission === "rw";
  }

  read(path: string): StoreResult {
    const keys = path.split(":");
    let current: any = this;

    for (let i = 0; i < keys.length; i++) {
      const key = keys[i];

      if (!current.allowedToRead?.(key)) {
        throwError("read", key);
      }

      if (!(key in current)) return undefined;

      let value = current[key];

      if (typeof value === "function" && value.length === 0) {
        value = value.call(current);
        current[key] = value;
      }

      if (value && typeof value === "object" && !(value instanceof Store)) {
        value = this.wrapStore(value);
        current[key] = value;
      }

      const isLastKey = i === keys.length - 1;
      if (!isLastKey) {
        if (!(value instanceof Store)) return undefined;
        current = value;
      } else {
        return value;
      }
    }

    return undefined;
  }

  write(path: string, value: StoreValue): StoreValue {
    const keys = path.split(":");
    let current: any = this;

    for (let i = 0; i < keys.length - 1; i++) {
      const key = keys[i];

      if (!current.allowedToRead?.(key)) {
        throwError("read", key);
      }

      if (!(key in current)) {
        current[key] = new Store();
      }

      if (
        typeof current[key] === "object" &&
        !(current[key] instanceof Store)
      ) {
        current[key] = this.wrapStore(current[key]);
      }

      if (current[key] instanceof Store) {
        return current[key].write(keys.slice(i + 1).join(":"), value);
      }

      current = current[key];
    }

    const lastKey = keys[keys.length - 1];

    if (!current.allowedToWrite?.(lastKey)) {
      throwError("write", lastKey);
    }
    
    current[lastKey] = value;
    return value;
  }

  writeEntries(entries: JSONObject): void {
    for (const [key, value] of Object.entries(entries)) {
      this.write(key, value);
    }
  }

  entries(): JSONObject {
    const result: JSONObject = {};

    for (const key of Object.keys(this)) {
      const value = (this as any)[key];

      if (value instanceof Store) {
        result[key] = value.entries();
      } else {
        if (this.getPermission(key) !== "none") {
          result[key] = value;
        }
      }
    }

    return result;
  }

  private wrapStore(obj: any): Store {
    const wrapped = new Store();
    Object.assign(wrapped, obj);
    return wrapped;
  }
}
