// frontend-web/types/bcrypt.d.ts
declare module 'bcrypt' {
  export function hash(data: string, saltOrRounds: number): Promise<string>;
  export function compare(data: string, encrypted: string): Promise<boolean>;
  export function hashSync(data: string, saltOrRounds: number): string;
  export function compareSync(data: string, encrypted: string): boolean;
  export const genSaltSync: (rounds?: number) => string;
  export const genSalt: (rounds?: number) => Promise<string>;
}