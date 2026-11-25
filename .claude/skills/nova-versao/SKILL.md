---
name: nova-versao
description: Sobe a versão do Cortador Automático (iss, lançador .cs, texto do site) e prepara o commit "Versao X.Y.Z" e a tag. Use com a nova versão, ex. /nova-versao 2.0.8
disable-model-invocation: true
argument-hint: "<X.Y.Z> [resumo curto]"
---

Lançar a versão `$ARGUMENTS`. Se não vier número, descubra a atual (passo 1) e pergunte qual é a nova (sugira +0.0.1).

## 1. Achar a versão atual

```
grep -n '#define Versao' instalador/cortador.iss
grep -n 'AssemblyVersion\|AssemblyFileVersion' instalador/lancador/CortadorAutomatico.cs
grep -n 'Novo na versão' docs/index.html
```

As três têm que bater. Se não baterem, pare e avise antes de mexer.

## 2. Trocar a versão nos 3 lugares

| Arquivo | O que muda |
|---|---|
| `instalador/cortador.iss` | `#define Versao "X.Y.Z"` |
| `instalador/lancador/CortadorAutomatico.cs` | `AssemblyVersion` e `AssemblyFileVersion`, ambos no formato `"X.Y.Z.0"` |
| `docs/index.html` | o texto `Novo na versão X.Y.Z: ...` (a novidade vem do resumo; se o usuário não deu, use o assunto principal do diff) |

Não mexa em `package.json` (fica em 1.0.0 de propósito) nem em `package-lock.json`.

## 3. Conferir

`git diff --stat` deve mostrar só esses 3 arquivos além do que o usuário já tinha mudado. Rode `node --check` em qualquer `.js` alterado.

## 4. Commit (só prepare, não faça push)

Mensagem no padrão do repositório, em pt-BR e sem acento no título:

```
Versao X.Y.Z: <resumo curto separado por vírgulas>

- <um item por mudança relevante, com o motivo>
```

Mostre a mensagem e o diff ao usuário e **espere confirmação** antes de `git commit`.

## 5. Tag (só depois do commit, e só se o usuário pedir)

O GitHub Actions monta e publica o instalador quando a tag `v*` sobe:

```
git tag vX.Y.Z
git push origin vX.Y.Z
```

Isso dispara um build de até 90 min e cria uma release pública. Nunca faça sem pedido explícito.
