import { afterEach, describe, expect, it } from 'vitest';
import { clearResetTokenFromUrl, readResetToken } from '../utils/resetLink';

/** jsdom: muda a URL sem navegar. */
const irPara = (url: string) => window.history.replaceState({}, '', url);
const urlAtual = () => `${window.location.pathname}${window.location.search}${window.location.hash}`;

describe('readResetToken', () => {
  afterEach(() => irPara('/'));

  it('lê o token do fragmento (link novo)', () => {
    irPara('/#reset_token=abc-123');
    expect(readResetToken()).toBe('abc-123');
  });

  it('lê o token da query (link enviado antes do deploy)', () => {
    irPara('/?reset_token=antigo-456');
    expect(readResetToken()).toBe('antigo-456');
  });

  it('prefere o fragmento quando os dois existem', () => {
    irPara('/?reset_token=da-query#reset_token=do-fragmento');
    expect(readResetToken()).toBe('do-fragmento');
  });

  it('devolve null sem token', () => {
    irPara('/');
    expect(readResetToken()).toBeNull();
  });

  it('devolve null para token vazio', () => {
    irPara('/#reset_token=');
    expect(readResetToken()).toBeNull();
  });

  it('ignora outros fragmentos', () => {
    irPara('/#secao-qualquer');
    expect(readResetToken()).toBeNull();
  });
});

describe('clearResetTokenFromUrl', () => {
  afterEach(() => irPara('/'));

  it('remove o token do fragmento', () => {
    irPara('/#reset_token=abc-123');
    clearResetTokenFromUrl();
    expect(urlAtual()).toBe('/');
  });

  it('remove o token da query', () => {
    irPara('/?reset_token=abc-123');
    clearResetTokenFromUrl();
    expect(urlAtual()).toBe('/');
  });

  it('remove dos dois lugares', () => {
    irPara('/?reset_token=da-query#reset_token=do-fragmento');
    clearResetTokenFromUrl();
    expect(urlAtual()).toBe('/');
  });

  it('preserva outros parâmetros', () => {
    irPara('/?page=2&reset_token=abc#sec');
    clearResetTokenFromUrl();
    expect(urlAtual()).toBe('/?page=2#sec');
  });

  it('não quebra quando não há token', () => {
    irPara('/?page=2');
    clearResetTokenFromUrl();
    expect(urlAtual()).toBe('/?page=2');
  });
});
