# Hack VP Site

Aplicação Angular simples com:
- Tela de login (email/senha)
- Tela de cadastro (nome/email/senha)
- Tela pós-login para seleção e upload de vídeo

## Integração com backend Spring

Os serviços já estão prontos para chamadas HTTP e podem ser ajustados para o seu backend Java/Spring:

- `POST {apiBaseUrl}/auth/login`
- `POST {apiBaseUrl}/usuarios`
- `POST {apiBaseUrl}/videos/upload`

Altere `src/environments/environment.ts` para apontar para seu backend.

## Rodando localmente

```bash
npm install
npm start
```
