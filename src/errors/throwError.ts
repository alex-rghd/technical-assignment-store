export default function throwError(
  writeOrRead: "read" | "write",
  key: string
): void {
  throw new Error(`Not allowed to ${writeOrRead} the key ${key}`);
}
