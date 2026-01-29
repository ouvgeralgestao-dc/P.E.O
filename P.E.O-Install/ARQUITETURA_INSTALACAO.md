# 🏥 Relatório Técnico de Engenharia: Instaladores P.E.O

Este documento detalha as decisões de arquitetura e engenharia para a distribuição profissional do sistema P.E.O em ambientes corporativos e governamentais.

## 1. Arquitetura Multiplataforma

Utilizamos o **Electron** como camada de abstração de hardware e interface. O backend Node.js é iniciado como um processo filho (Sidecar) assim que o aplicativo é aberto, garantindo que o usuário não precise configurar o ambiente manualmente.

### Ciclo de Vida:

1. **Início**: O executável nativo carrega o runtime Electron.
2. **Bootstrap**: O servidor Express + SQLite é iniciado em uma porta segura (aleatória ou 6001).
3. **Renderização**: A interface React é carregada via protocolo local seguro.
4. **Persistência**: Os dados são salvos em pastas protegidas do sistema em vez da pasta de instalação (Prevenção de perda de dados em atualizações).

## 2. Tecnologias e Bibliotecas

- **Electron Builder**: Motor de empacotamento para gerar `.exe` (NSIS) e `.deb`/`AppImage`.
- **NSIS (Nullsoft Scriptable Install System)**: Para garantir que no Windows o instalador se comporte exatamente como um "App Oficial Microsoft".
- **Better-SQLite3**: Banco de dados relacional de alta performance sem dependências externas.
- **Node-Forge**: Criptografia de nível governamental para o .env virtual.

## 3. Segurança e Criptografia do .env

Diferente de aplicações comuns, o P.E.O não armazena credenciais em texto simples.

- **Virtual .env**: As variáveis são encapsuladas em um arquivo binário criptografado (`config.dat`).
- **AES-256-GCM**: Algoritmo utilizado com autenticação de dados (AEAD), garantindo que se o arquivo for adulterado, o app não o abrirá.
- **Hardening**: Ofuscação do código fonte via `javascript-obfuscator` durante o processo de build para impedir engenharia reversa simples.

## 4. Estratégia de Persistência

### Windows (C:\Program Files (x86)\PEO)

- **Instalação**: Estática, somente leitura para o usuário comum.
- **Dados**: `%LOCALAPPDATA%\PEO\db\organograma.db`.

### Linux (/opt/peo)

- **Instalação**: Seguindo o FHS para pacotes binários de terceiros.
- **Dados**: `$HOME/.config/peo/db/organograma.db`.
- **Permissões**: Instalador configura proprietário `root` com execução para o grupo `users`.

## 5. Modos de Distribuição

### Instalador 1: MODO LOCAL

- **Perfil**: Usuário único, offline.
- **Auto-Config**: Cria o banco local automaticamente na primeira execução.
- **Privacidade**: Sem coleta de telemetria ou necessidade de cadastro externo.

### Instalador 2: MODO INTRANET / COMPLETO

- **Perfil**: Servidor de rede ou departamentos integrados.
- **Segurança**: Cadastro por e-mail obrigatório para trilha de auditoria.
- **Rede**: Backend configurado para responder a IPs específicos da intranet.

## 6. Boas Práticas e Certificados

Para evitar o aviso "Editor Desconhecido" do Windows e Linux:

- **Windows**: Recomendamos assinar o executável com um certificado **Code Signing (EV)**.
- **Linux**: Recomendamos a criação de um repositório PPA ou o uso de AppImage assinado por chave GPG corporativa.

---

**Engenheiro Responsável:** Antigravity AI
**Versão:** 1.0.0
**Data:** 28/01/2026
