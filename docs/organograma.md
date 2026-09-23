# Organograma — OBOM

Estrutura organizacional da OBOM em duas fases: **startup (0–10 pessoas)** e **escala (20–50 pessoas)**.

---

## Fase 1 — Startup (0–10 colaboradores)

Foco: MVP, piloto B2G, conformidade RGPD, primeiros contratos municipais.

```mermaid
graph TD
    CEO["CEO / Fundador<br/>Estratégia · Vendas B2G · Parcerias"]
    
    CEO --> CTO["CTO<br/>Produto técnico · Arquitetura · DevOps"]
    CEO --> CLO["Consultor Jurídico / DPO<br/>RGPD · Contratos · CNPD"]
    CEO --> CPO["Product Designer<br/>UX mobile · Design System"]
    
    CTO --> BE["Backend Developer<br/>API · JSON · Integrações"]
    CTO --> FE["Frontend Developer<br/>React · PWA · Mobile"]
    CTO --> ML["ML/OCR Engineer<br/>Matrículas · Desfoque"]
    
    CEO --> BD["Business Development<br/>Municípios · ANSR · AMA"]
    CEO --> CS["Customer Success<br/>Onboarding · Suporte B2G"]
    CEO --> OPS["Operations / Finance<br/>Admin · Contabilidade"]

    style CEO fill:#1e40af,color:#fff
    style CTO fill:#2563eb,color:#fff
    style CLO fill:#7c3aed,color:#fff
    style CPO fill:#0891b2,color:#fff
```

### Responsabilidades — Fase Startup

| Cargo | Responsabilidades |
|-------|-------------------|
| **CEO / Fundador** | Visão, fundraising, vendas institucionais, relação ANMP/AMA, decisões estratégicas |
| **CTO** | Arquitetura Next.js, segurança, infra cloud, roadmap técnico, contratação dev |
| **Backend Developer** | API routes, JSON autoridades, base de dados, integrações SI municipais |
| **Frontend Developer** | App PWA, câmera, geolocalização, componentes React, acessibilidade |
| **ML/OCR Engineer** | Reconhecimento matrículas PT/EU, desfoque rostos, otimização mobile |
| **Consultor Jurídico / DPO** | Conformidade RGPD, DPIA, registo CNPD, contratos B2G, pareceres legais |
| **Product Designer** | Design system, fluxos mobile, testes utilizador, protótipos Figma |
| **Business Development** | Prospeção municípios, demos, propostas comerciais, feiras govtech |
| **Customer Success** | Onboarding municípios, formação, SLA, feedback produto |
| **Operations / Finance** | Faturação, contratos admin, RH, reporting financeiro |

---

## Fase 2 — Escala (20–50 colaboradores)

Foco: multi-tenant, expansão nacional, módulos B2B (seguradoras, frotas), equipa comercial.

```mermaid
graph TD
    CEO2["CEO"]
    
    CEO2 --> CTO2["CTO"]
    CEO2 --> CCO["CCO · Chief Commercial Officer"]
    CEO2 --> CLO2["CLO / DPO"]
    CEO2 --> CFO["CFO"]
    CEO2 --> CHRO["CHRO · People"]
    
    CTO2 --> ENG["Engineering<br/>12–18 pessoas"]
    CTO2 --> PROD["Product<br/>3–4 pessoas"]
    CTO2 --> DATA["Data & AI<br/>3–4 pessoas"]
    
    ENG --> BE2["Backend · 4"]
    ENG --> FE2["Frontend · 3"]
    ENG --> MOB["Mobile · 2"]
    ENG --> DEVOPS["DevOps/SRE · 2"]
    ENG --> QA["QA · 2"]
    
    PROD --> PM["Product Managers · 2"]
    PROD --> UX["UX/UI · 2"]
    
    DATA --> ML2["ML/OCR · 2"]
    DATA --> ANALYTICS["Analytics · 1"]
    
    CCO --> SALES["Sales B2G · 4"]
    CCO --> CS2["Customer Success · 3"]
    CCO --> MKT["Marketing · 2"]
    
    CLO2 --> LEGAL["Legal · 2"]
    CLO2 --> COMPLIANCE["Compliance RGPD · 1"]
    
    CFO --> FIN["Finance · 2"]
    CHRO --> HR["HR · 1"]

    style CEO2 fill:#1e40af,color:#fff
    style CTO2 fill:#2563eb,color:#fff
    style CCO fill:#059669,color:#fff
    style CLO2 fill:#7c3aed,color:#fff
```

### Departamentos — Fase Escala

#### Tecnologia (CTO) — ~18 pessoas

| Equipa | Headcount | Missão |
|--------|-----------|--------|
| Backend | 4 | APIs, multi-tenant, integrações ANSR/municípios |
| Frontend | 3 | Dashboard municipal, app cidadão, admin |
| Mobile | 2 | PWA nativa, performance câmera |
| DevOps/SRE | 2 | Infra, CI/CD, monitorização, SLA 99.9% |
| QA | 2 | Testes automatizados, conformidade |
| Product | 4 | PMs + UX — roadmap, discovery B2G |
| Data & AI | 3 | OCR matrículas EU, desfoque, analytics |

#### Comercial (CCO) — ~9 pessoas

| Equipa | Headcount | Missão |
|--------|-----------|--------|
| Sales B2G | 4 | Municípios, ANSR, contratos públicos |
| Customer Success | 3 | Retention, NPS, expansão contas |
| Marketing | 2 | Conteúdo govtech, eventos, brand |

#### Legal & Compliance (CLO/DPO) — ~3 pessoas

| Função | Missão |
|--------|--------|
| Legal | Contratos públicos, licitações, IP |
| Compliance RGPD | CNPD, DPIA, auditorias, formação interna |

#### Administração — ~4 pessoas

| Função | Missão |
|--------|--------|
| CFO + Finance | Fundraising, reporting, unit economics |
| CHRO + HR | Cultura, recrutamento, políticas |

---

## Matriz RACI — Decisões críticas

| Decisão | CEO | CTO | CLO/DPO | CCO |
|---------|-----|-----|---------|-----|
| Modelo de pricing B2G | A | C | I | R |
| Conformidade RGPD | I | C | A/R | I |
| Formato JSON autoridades | I | A/R | C | I |
| Contrato piloto município | A | I | R | R |
| Roadmap produto | A | R | C | C |
| Pivot de modelo negócio | A | C | R | C |

*R = Responsible · A = Accountable · C = Consulted · I = Informed*

---

## Cultura e valores

1. **Conformidade primeiro** — RGPD não é opcional
2. **Transparência cívica** — Tecnologia a serviço do interesse público
3. **Mobile-first** — O cidadão denuncia no momento, no local
4. **Dados mínimos** — Recolher só o necessário, reter o mínimo tempo
5. **Parceria institucional** — Trabalhar com autoridades, não contra elas

---

## Evolução headcount

| Fase | Pessoas | ARR alvo |
|------|---------|----------|
| Seed (MVP) | 3–5 | €0 |
| Piloto | 6–10 | €20k |
| Série A | 20–30 | €200k |
| Escala | 40–50 | €500k+ |
