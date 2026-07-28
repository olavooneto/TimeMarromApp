# ASV 2026 - Time Marrom Dashboard

Este é um site estático simples para exibir os painéis Cestometro, Bazometro e Doações de Sangue do Time Marrom.

## Como usar

1. Edite os valores em `config.json`.
2. Salve o arquivo.
3. Abra `index.html` em um servidor local para visualizar.

## Como os valores são calculados

- `restam` e `totalArrecadadoPercentual` são calculados automaticamente a partir dos valores informados em `config.json`.
- Para o painel de Doações de Sangue, informe `totalNaIgreja`, `totalForaIgreja` e `totalMetaDeDoacoes`.

## Publicação

- Para publicar no GitHub, crie um repositório e faça push do projeto.
- Para publicar no Vercel, conecte seu repositório GitHub e adicione o projeto ao Vercel.

## Estrutura

- `index.html`
- `styles.css`
- `script.js`
- `config.json`

## Admin / Controle (backend)

Uma pequena API Express foi adicionada para permitir editar `config.json` pelo navegador usando a rota administrativa `/control`.

- Executar localmente:

```powershell
npm install
node server.js
# abrir http://localhost:3000/control
```

- Variáveis de ambiente úteis:
	- `SESSION_SECRET` : secret para as sessões do `express-session`. Defina em produção (ex: `set SESSION_SECRET=algo-seguro`).
	- `ADMIN_EMAIL` : (opcional) limita o login a um email específico.

- Admin password (generated):
	- Plaintext (example): TimeMarrom2026!
	- SHA-256 (set as `ADMIN_PASSWORD_HASH`): de4f08d7e9720fe25b5fe8a792394d3b9232a20031a1fe465a7fca822361e566

	You can set the hash as an environment variable in Vercel or your host, or edit `api/_utils.js` / `server.js` to change the default value.

- Fluxo de login:
	- A página `/control` faz `POST /api/login` com `{ email, password }`.
	- O servidor compara `sha256(password)` com o hash incorporado em `server.js`.
	- Após autenticação, `GET /api/config` retorna o JSON atual e `POST /api/save` sobrescreve `config.json` com validação.

- Segurança e recomendações:
	- Use `SESSION_SECRET` forte em produção.
	- Deploy em HTTPS (Vercel, Render, etc.) quando exposto publicamente.
	- Esta implementação aceita JSON enviado pelo cliente; revise/valide campos adicionais conforme necessário.

