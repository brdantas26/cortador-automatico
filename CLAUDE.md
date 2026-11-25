# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Projeto

Cortador Automático: corta vídeo/live (Kick, Twitch, YouTube) em clipes verticais 9:16, tudo local. Node puro, **zero dependências npm** (não existe `npm install`; `package.json` não tem `dependencies`). Código, comentários, commits e UI são em **pt-BR** e sem acento nos identificadores/arquivos (`pastas.js`, `aovivo.js`). Mantenha esse padrão.

## Comandos

```
node src/server.js        # sobe o servidor (porta 4321, sobe pra próxima livre se ocupada)
iniciar.bat               # idem no Windows, achando o Node; npm start também funciona
node instalador/montar.js # monta o .exe do instalador (precisa Inno Setup; baixa Python/ffmpeg/yt-dlp)
```

Não há testes, linter nem build. A checagem possível é de sintaxe: `node --check src/<arquivo>.js` e, para Python, `python -c "import ast,sys; ast.parse(open(sys.argv[1],encoding='utf8').read())" py/<arquivo>.py`. Um hook em `.claude/settings.json` já faz isso após cada Edit/Write.

Dependências externas de runtime (não vêm do npm): Node 22+, `ffmpeg`, `yt-dlp` e Python com `faster-whisper`. `media.js` e `baixar.js` procuram os binários no PATH e nos lugares do WinGet; dá para forçar com `YTDLP_PATH`, `PYTHON_BIN`, `FFMPEG_PATH`.

Variáveis de ambiente úteis: `PORTA`/`PORT`, `DADOS` (pasta de dados), `REDE=1`/`HOST=0.0.0.0` (expõe na rede; `PORT` já liga isso, é o modo "nuvem"), `AUTH_SENHA`, `NAO_ABRIR`, `MODELOS_DIR`.

## Arquitetura

`src/server.js` é um servidor `http` cru (sem framework) que serve `src/ui/index.html` e expõe as rotas `/api/*` (o modo ao vivo fica em `/api/aovivo/*`). A UI é um único HTML grande, sem build. Progresso de tarefas longas chega à UI por eventos (`emitirAoVivo` e afins no servidor).

Dois fluxos independentes que compartilham `media.js`, `legenda.js` e `copy.js`:

- **Vídeo gravado** (`pipeline.js`): `baixar.js` (yt-dlp) ou arquivo local → `py/transcrever.py` (faster-whisper, spawnado como processo filho) → `score.js` + `momentos.js` escolhem trechos (nota por gancho/curiosidade/emoção/energia de voz; `momentos.js` acha picos de volume e mudança de imagem) → `media.js` corta em 9:16 com legenda `.ass` de `legenda.js` → `copy.js`/`jogo.js` geram título, legenda do post e hashtags. `intencao.js` converte o texto livre do usuário em pesos que mudam a nota. `projetos.js` persiste cada rodada em `saida/<pasta>/sessao.json` para reabrir e editar sem refazer download/transcrição.
- **Ao vivo** (`aovivo.js`, o maior arquivo): yt-dlp acha a URL, ffmpeg grava em pedaços de 4 s com `-c copy` (buffer de ~20 min, apagado ao parar), detecção por taxa de mensagens do chat (Twitch IRC anônimo / Kick via Pusher) + pico de volume contra a mediana recente, e "CLIPAR AGORA" junta os pedaços com render rápido (x264 veryfast). Só depois transcreve o clipe pronto, só para sugerir título.

Pontos que exigem ler mais de um arquivo:

- **`pastas.js` é a fonte única de caminhos.** Todo módulo pergunta o caminho a cada uso, nunca guarda em constante, porque a pasta de dados muda em runtime pelos Ajustes (ordem: `config.json` → `DADOS` → `D:\CortadorAutomatico` se existir → pasta do programa). Não cacheie caminhos de saída/download/gravação.
- **`desempenho.js`** define o modo "leve"/"total" (núcleos e prioridade); `media.js` e `momentos.js` o consultam ao spawnar processos pesados.
- **`sessoes.js`** guarda um único perfil de corte geral (a versão antiga com perfis por canal/campeonato foi aposentada).
- Quase tudo fala com ffmpeg/yt-dlp/Python via `child_process` com URLs e nomes de arquivo vindos do usuário, e o usuário usa Windows com acentos em caminhos. Cuide de quoting e use arrays de args (`spawn`), nunca string de shell.

## Pastas fora de `src/`

- `docs/` é o **site público** (GitHub Pages, landing + download), não documentação; seu `index.html` é diferente de `src/ui/index.html`.
- `instalador/` monta o instalador Windows (`montar.js` + `cortador.iss` do Inno Setup + `lancador/`). `.github/workflows/instalador.yml` roda isso no GitHub Actions ao empurrar uma tag `v*` (ex.: `git tag v2.0.8 && git push origin v2.0.8`) e publica no Releases.
- `LEIA-ME.txt` é o guia para quem usa o programa, não para desenvolvedores.

## Convenções do repositório

Commits seguem `Versao X.Y.Z: resumo em pt-BR` e a versão é lançada por tag. O nome "Cortador Automático", "Gabriel Workspace" e o logo não são MIT (ver `MARCA.md`).
