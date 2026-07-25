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
