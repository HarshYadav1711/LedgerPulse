declare module "json2csv" {
  export type Json2CsvField<T = Record<string, unknown>> =
    | string
    | { label: string; value: keyof T | string };

  export interface ParserOptions<T = Record<string, unknown>> {
    fields?: Json2CsvField<T>[];
    defaultValue?: string;
  }

  export class Parser<T extends Record<string, unknown> = Record<string, unknown>> {
    constructor(opts?: ParserOptions<T>);
    parse(data: T[]): string;
  }
}
