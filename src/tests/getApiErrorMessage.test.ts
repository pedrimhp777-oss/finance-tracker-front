import { describe, expect, it } from 'vitest';
import axios from 'axios';
import { getApiErrorMessage } from '../services/api';

describe('getApiErrorMessage', () => {
  it('extrai o detail string da resposta da API', () => {
    const error = new axios.AxiosError(
      'Request failed',
      'ERR_BAD_REQUEST',
      undefined,
      undefined,
      { data: { detail: 'E-mail já cadastrado' } } as never,
    );
    expect(getApiErrorMessage(error, 'fallback')).toBe('E-mail já cadastrado');
  });

  it('agrega mensagens de validação do Pydantic', () => {
    const error = new axios.AxiosError(
      'Request failed',
      'ERR_BAD_REQUEST',
      undefined,
      undefined,
      { data: { detail: [{ msg: 'Campo obrigatório' }] } } as never,
    );
    expect(getApiErrorMessage(error, 'fallback')).toBe('Campo obrigatório');
  });

  it('usa o fallback quando não há detalhes', () => {
    expect(getApiErrorMessage(new Error('x'), 'fallback')).toBe('fallback');
    expect(getApiErrorMessage(null, 'fallback')).toBe('fallback');
  });
});
