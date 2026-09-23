# OBOM Design System — Flat Design

> Filosofia: **zero profundidade artificial**. Hierarquia via tamanho, cor e tipografia. Visual poster — blocos sólidos de cor, formas geométricas, sem sombras.

## Stack de implementação

| Camada | Tecnologia |
|--------|------------|
| Tokens | `lib/design-tokens.ts` + CSS variables em `app/globals.css` |
| Tipografia | **Outfit** via `next/font/google` |
| Ícones | **lucide-react** em círculos coloridos (`IconCircle`) |
| Estilos | CSS puro com classes semânticas (sem Tailwind) |
| Decoração | `DecorShapes` — formas geométricas absolutas |

## Cores

| Token | Hex | Uso |
|-------|-----|-----|
| Background | `#FFFFFF` | Canvas principal |
| Foreground | `#111827` | Texto principal |
| Primary | `#3B82F6` | Ações, CTAs |
| Secondary | `#10B981` | Sucesso, localização |
| Accent | `#F59E0B` | Badges, comissão |
| Muted | `#F3F4F6` | Cards, inputs, seções |
| Border | `#E5E7EB` | Divisores, outline buttons |
| Danger | `#EF4444` | Erros, gravação |

Variantes muted: `--color-primary-muted`, `--color-secondary-muted`, `--color-accent-muted`, `--color-danger-muted`.

## Tipografia

- **Fonte:** Outfit (400–800)
- **Headings:** 700–800, `letter-spacing: -0.02em`
- **Labels:** uppercase, `letter-spacing: 0.08em`, 12px
- **Mono:** JetBrains Mono (protocolos, placas)

## Radius

| Token | Valor |
|-------|-------|
| sm | 6px |
| md | 8px |
| lg | 12px |
| full | 9999px |

## Regras Flat

- **Sem box-shadow** em elementos UI
- **Sem gradientes** em botões/cards
- **Sem backdrop-blur**
- Focus: `box-shadow: 0 0 0 2px bg, 0 0 0 4px primary`
- Hover: `scale(1.03–1.08)` + mudança de cor

## Componentes

### Botões (`.btn`)
- Altura: 56px (`h-14` equivalente)
- Primary: fundo `#3B82F6`, texto branco
- Secondary: fundo `#F3F4F6`
- Outline: `border: 4px solid`, fill no hover

### Cards (`.info-card`)
- Variantes: `--muted`, `--primary`, `--secondary`, `--accent`
- Sem borda, sem sombra
- Padding generoso (1.25rem)

### Inputs (`.form-input`)
- Fundo `#F3F4F6`, sem borda
- Focus: fundo branco + `box-shadow: 0 0 0 2px primary`

### Ícones (`IconCircle`)
- Círculo colorido com ícone lucide
- Variantes: primary, secondary, accent, success, danger, muted
- Tamanhos: md (48px), lg (56px)

### Decoração (`DecorShapes`)
- Círculos e quadrados rotacionados
- Opacity 12%, posicionamento absoluto
- Variantes: `hero`, `auth`

## Telas

| Tela | Tratamento visual |
|------|-------------------|
| Permissões | Fundo branco + decor hero |
| Câmera | Header branco, controls muted, viewfinder preto |
| Preview | Header primary blue, cards color-block |
| Sucesso | Fundo secondary-muted + decor |
| Auth/Profile | Fundo branco + decor auth |

## Motion

- Duração padrão: `200ms ease-out`
- Botões: `scale(1.03)` hover, `scale(0.98)` active
- Cards: `scale(1.02)` hover (quando interativos)

## Acessibilidade

- Touch targets mínimo 48px
- Focus rings visíveis (sem sombras)
- Contraste WCAG AA em texto sobre cores
- `aria-label` em controles de câmera

## Uso programático

```typescript
import { colors, spacing, radius, typography } from '@/lib/design-tokens';
```
