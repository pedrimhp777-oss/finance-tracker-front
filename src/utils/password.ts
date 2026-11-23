/**
 * Limite de bytes da senha no bcrypt.
 *
 * O bcrypt trunca em 72 bytes — e o backend recusa em vez de truncar (senão
 * `senha` e `senha` + 100 caracteres viram a mesma senha). Acentos ocupam 2
 * bytes e emojis até 4, então 72 **caracteres** pode passar de 72 bytes: o
 * campo precisa contar bytes, não caracteres. `maxLength` do HTML conta
 * caracteres e por isso não serve aqui.
 */

export const BCRYPT_MAX_PASSWORD_BYTES = 72;

const encoder = new TextEncoder();

export const passwordByteLength = (value: string): number => encoder.encode(value).length;

export const isPasswordTooLong = (value: string): boolean =>
  passwordByteLength(value) > BCRYPT_MAX_PASSWORD_BYTES;

export const PASSWORD_TOO_LONG_MESSAGE =
  'A senha é longa demais: o limite é de 72 bytes (acentos e emojis contam mais de um).';
