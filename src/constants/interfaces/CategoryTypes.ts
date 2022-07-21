import { CATEGORY_TYPES } from "../constants";

export type CategoryTypeKeys = keyof typeof CATEGORY_TYPES;
export type CategoryTypeValues = typeof CATEGORY_TYPES[CategoryTypeKeys]