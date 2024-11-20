export type TypeFromArray<T> = T extends (infer U)[] ? U : never;
