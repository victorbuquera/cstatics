# CS2 Tactics — Setup

## 1. Configurar Supabase

1. Crie um projeto em [supabase.com](https://supabase.com)
2. Vá em **SQL Editor** e execute o arquivo `supabase/migration.sql` completo
3. Copie a **URL** e a **anon key** do projeto (Settings → API)

## 2. Variáveis de ambiente

Edite o arquivo `.env.local` na raiz do projeto:

```env
NEXT_PUBLIC_SUPABASE_URL=https://seu-projeto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua-anon-key
```

## 3. Imagens dos mapas (opcional)

As imagens em `/public/maps/` são SVG placeholder funcionais.
Para usar os radares reais do CS2, substitua os arquivos por PNGs 1024×1024:
- `/public/maps/dust2.png` (ou `.svg`)
- `/public/maps/inferno.png`
- `/public/maps/mirage.png`

Fontes sugeridas: radares do jogo em `game/csgo/pak01_dir.vpk` (caminho: `resource/overviews/`)

## 4. Rodar localmente

```bash
npm install
npm run dev
```

Acesse [http://localhost:3000](http://localhost:3000)

## 5. Colaboração em tempo real

- Abra o editor de uma tática em **duas abas ou navegadores diferentes**
- Os cursores dos outros usuários aparecem no canvas em tempo real
- Elementos adicionados/editados sincronizam automaticamente via Supabase Realtime

## Funcionalidades

| Feature | Como usar |
|---|---|
| Criar tática | Clique em "Nova Tática" na home |
| Adicionar jogador | Selecione CT ou TR na toolbar, clique no mapa |
| Desenhar rota | Selecione "Rota", clique nos pontos, dbl-clique para finalizar |
| Adicionar granada | Selecione smoke/flash/molotov/he, clique no mapa |
| Editar propriedades | Clique no elemento → painel lateral direito |
| Fases do round | Painel lateral → adicionar/navegar fases |
| Animação | Botão "Animar" no header → play/pause/scrubber |
| Comentários | Selecione elemento → seção de comentários no painel lateral |
| Exportar | Botões PNG / PDF no header do editor |
