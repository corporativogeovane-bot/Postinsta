# Postinsta

Monitora feeds RSS de notícias e gera automaticamente, para cada notícia nova,
uma imagem já no formato do Instagram com o **título da notícia em destaque
sobre a foto**. Você acompanha tudo por um painel web, baixa a imagem pronta
e, se quiser, salva automaticamente uma cópia numa pasta do Dropbox.

> O app **não publica automaticamente no Instagram** (a API oficial exige
> conta Business/Creator vinculada a uma Página do Facebook). Ele entrega a
> imagem pronta no formato certo para você publicar manualmente.

## O que ele faz

- Monitora 1 ou mais feeds RSS em segundo plano (intervalo configurável).
- Para cada notícia nova, gera uma imagem 1080x1080 (quadrado) ou 1080x1350
  (retrato) usando a foto da notícia como fundo, com um gradiente escuro e o
  título em destaque na frente da imagem.
- Se a notícia não tiver foto mas mencionar uma marca/empresa conhecida no
  título (Google, Meta, Apple, Nubank, Petrobras, etc.), pede para a **IA
  gratuita desenhar o símbolo dessa marca** (só o ícone, sem precisar escrever
  o nome todo — ex: o "G" do Google), bem grande, quase preenchendo o quadro
  inteiro. Se a IA estiver desligada ou falhar, cai para o logo oficial exato
  da marca (via Clearbit Logo API, gratuita e sem chave).
- Se não houver foto nem marca reconhecida, usa a IA gratuita (Pollinations.ai,
  sem necessidade de chave de API) para gerar uma imagem de fundo a partir do
  título da notícia.
- Gera automaticamente uma sugestão de legenda + hashtags via IA gratuita.
- Permite baixar a imagem gerada com um clique.
- Permite salvar automaticamente (ou sob demanda) cada imagem gerada numa
  pasta do seu Dropbox.

## Estrutura

```
server/   API + monitor de feeds + geração de imagem (Node.js + Express + TypeScript)
client/   Painel web (React + Vite + TypeScript)
```

## Como rodar

Pré-requisito: Node.js 20+.

```bash
npm install          # instala as dependências do server e do client
cp server/.env.example server/.env   # ajuste se quiser
npm run dev           # sobe API (porta 4000) e painel (porta 5173) juntos
```

Abra `http://localhost:5173`.

## Usando o painel

1. **Feeds**: cadastre a URL do RSS de cada site de notícias que quer
   monitorar (ex: `https://exemplo.com/rss`).
2. O app checa os feeds automaticamente a cada `CHECK_INTERVAL_MINUTES`
   (padrão 15 min) e também assim que você cadastra um feed novo. Você
   também pode clicar em **"Checar feeds agora"** na aba Posts.
3. **Posts gerados**: cada notícia nova vira um card com a imagem pronta,
   legenda sugerida e hashtags. Use **Baixar imagem** para salvar no seu
   computador, ou **Salvar no Dropbox** para subir para o Dropbox.
4. **Configurações**: escolha o formato da imagem (quadrado/retrato), ligue
   ou desligue a IA gratuita, e configure a pasta do Dropbox.

## Configurando o Dropbox (opcional)

1. Acesse [dropbox.com/developers/apps](https://www.dropbox.com/developers/apps)
   e clique em "Create app".
2. Escolha **"Scoped access"** e, em "Access type", **"Full Dropbox"** (ou
   "App folder" se preferir restringir a uma pasta exclusiva do app).
3. Na aba **Permissions** do app criado, ative os escopos `files.content.write`,
   `files.content.read` e `sharing.write`, depois clique em "Submit".
4. Na aba **Settings**, na seção "OAuth 2", clique em **"Generate"** para
   criar um Access Token e copie o valor gerado.
5. Cole o token em `DROPBOX_ACCESS_TOKEN` no `server/.env`.
6. Defina `DROPBOX_FOLDER_PATH` com o caminho da pasta onde salvar (ex:
   `/Postinsta`) — ela é criada automaticamente no primeiro envio.
7. Ative "Salvar automaticamente" em Configurações se quiser que toda imagem
   gerada suba sozinha para o Dropbox.

## IA gratuita

O app usa a [Pollinations.ai](https://pollinations.ai), que é gratuita e não
exige chave de API, para:

- Gerar uma imagem de fundo quando a notícia não tem foto.
- Sugerir legenda + hashtags para cada post.

Isso pode ser desligado em Configurações a qualquer momento.

## Logo de marcas conhecidas

Quando o título da notícia menciona uma marca/empresa que o app reconhece
(lista em `server/src/services/entityImageService.ts`):

1. Primeiro pede para a IA gratuita (Pollinations.ai) **desenhar só o símbolo**
   dessa marca (ícone, sem precisar escrever o nome todo), bem grande, quase
   preenchendo o quadro.
2. Se a IA estiver desligada ou a geração falhar, busca o **logo oficial
   exato** via [Clearbit Logo API](https://clearbit.com/logo) (gratuita, sem
   chave) e o exibe grande, centralizado sobre um card branco.

Para adicionar mais marcas, edite o objeto `BRAND_DOMAINS` em
`entityImageService.ts`, associando uma palavra-chave (como aparece no
título) ao domínio da empresa, por exemplo:

```ts
"banco central": "bcb.gov.br",
```

## Variáveis de ambiente (`server/.env`)

Veja `server/.env.example` para a lista completa e comentada. As principais:

| Variável | Descrição |
|---|---|
| `PORT` | Porta da API (padrão 4000) |
| `CHECK_INTERVAL_MINUTES` | Frequência de checagem automática dos feeds |
| `IMAGE_FORMAT` | `square` ou `portrait` (padrão inicial) |
| `AI_ENABLED` | Liga/desliga a IA gratuita |
| `DROPBOX_ACCESS_TOKEN` | Token de acesso gerado no app do Dropbox |
| `DROPBOX_FOLDER_PATH` | Pasta de destino no Dropbox (padrão `/Postinsta`) |
| `DROPBOX_AUTO_SAVE` | Salva automaticamente no Dropbox a cada post gerado |

## Build de produção

```bash
npm run build
npm start   # sobe a API compilada em server/dist
```

Para produção, sirva os arquivos estáticos gerados em `client/dist` (ex: via
Nginx) apontando `/api` e `/generated` para o processo do `server`.
