# Postinsta

Monitora feeds RSS de notícias e gera automaticamente, para cada notícia nova,
uma imagem já no formato do Instagram com o **título da notícia em destaque
sobre a foto**. Você acompanha tudo por um painel web, baixa a imagem pronta
e, se quiser, salva automaticamente uma cópia numa pasta do Google Drive.

> O app **não publica automaticamente no Instagram** (a API oficial exige
> conta Business/Creator vinculada a uma Página do Facebook). Ele entrega a
> imagem pronta no formato certo para você publicar manualmente.

## O que ele faz

- Monitora 1 ou mais feeds RSS em segundo plano (intervalo configurável).
- Para cada notícia nova, gera uma imagem 1080x1080 (quadrado) ou 1080x1350
  (retrato) usando a foto da notícia como fundo, com um gradiente escuro e o
  título em destaque na frente da imagem.
- Se a notícia não tiver foto mas mencionar uma marca/empresa conhecida no
  título (Google, Meta, Apple, Nubank, Petrobras, etc.), busca o **logo
  oficial** dessa marca (via Clearbit Logo API, gratuita e sem chave) e o
  coloca bem grande e centralizado no fundo, sobre um card branco.
- Se não houver foto nem marca reconhecida, usa IA gratuita (Pollinations.ai,
  sem necessidade de chave de API) para gerar uma imagem de fundo a partir do
  título.
- Gera automaticamente uma sugestão de legenda + hashtags via IA gratuita.
- Permite baixar a imagem gerada com um clique.
- Permite salvar automaticamente (ou sob demanda) cada imagem gerada numa
  pasta do seu Google Drive.

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
   computador, ou **Salvar no Drive** para subir para o Google Drive.
4. **Configurações**: escolha o formato da imagem (quadrado/retrato), ligue
   ou desligue a IA gratuita, e configure a pasta do Google Drive.

## Configurando o Google Drive (opcional)

1. Crie um projeto no [Google Cloud Console](https://console.cloud.google.com/).
2. Ative a **Google Drive API** para o projeto.
3. Crie uma **Service Account** (IAM & Admin → Service Accounts) e gere uma
   chave no formato JSON.
4. Salve o arquivo JSON como `server/google-service-account.json` (ou aponte
   `GOOGLE_SERVICE_ACCOUNT_KEY_FILE` no `.env` para o caminho do arquivo).
5. No Google Drive, crie (ou escolha) a pasta onde as imagens devem ser
   salvas, compartilhe essa pasta com o **e-mail da service account**
   (algo como `nome@projeto.iam.gserviceaccount.com`, encontrado no JSON) com
   permissão de Editor.
6. Copie o ID da pasta (a parte final da URL da pasta no Drive) e cole em
   Configurações → Google Drive → "ID da pasta no Drive".
7. Ative "Salvar automaticamente" se quiser que toda imagem gerada suba
   sozinha para o Drive.

## IA gratuita

O app usa a [Pollinations.ai](https://pollinations.ai), que é gratuita e não
exige chave de API, para:

- Gerar uma imagem de fundo quando a notícia não tem foto.
- Sugerir legenda + hashtags para cada post.

Isso pode ser desligado em Configurações a qualquer momento.

## Logo de marcas conhecidas

Quando o título da notícia menciona uma marca/empresa que o app reconhece
(lista em `server/src/services/entityImageService.ts`), o logo oficial dela é
buscado via [Clearbit Logo API](https://clearbit.com/logo) (gratuita, sem
chave) e usado bem grande no fundo da imagem, no lugar da IA genérica.

Para adicionar mais marcas, edite o objeto `BRAND_DOMAINS` nesse arquivo,
associando uma palavra-chave (como aparece no título) ao domínio da empresa,
por exemplo:

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
| `GOOGLE_SERVICE_ACCOUNT_KEY_FILE` | Caminho do JSON da service account |
| `GOOGLE_DRIVE_FOLDER_ID` | ID da pasta de destino no Drive |
| `GOOGLE_DRIVE_AUTO_SAVE` | Salva automaticamente no Drive a cada post gerado |

## Build de produção

```bash
npm run build
npm start   # sobe a API compilada em server/dist
```

Para produção, sirva os arquivos estáticos gerados em `client/dist` (ex: via
Nginx) apontando `/api` e `/generated` para o processo do `server`.
