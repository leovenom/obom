# Plano de Negócio — OBOM

**Plataforma civic-tech de evidências rodoviárias**  
Versão 1.0 · Portugal · Setembro 2026

---

## 1. Sumário Executivo

A **OBOM** é uma plataforma mobile-first que permite capturar fotos e vídeos de ocorrências rodoviárias com geolocalização, carimbo temporal e identificação de matrículas, gerando automaticamente um **pacote JSON estruturado** para autoridades competentes (ANSR, GNR, PSP, câmaras municipais).

**Problema:** Denúncias informais (WhatsApp, email) chegam incompletas, sem metadados fiáveis, dificultando o processamento e aumentando o risco de denúncias infundadas.

**Solução:** App PWA com fluxo guiado, evidências georreferenciadas e relatório padronizado para entidades públicas.

**Modelo de receita recomendado:** SaaS B2G (licença anual a municípios e entidades de fiscalização) — **não** comissão sobre coimas.

**Investimento inicial estimado:** €80.000 – €150.000 (MVP → piloto)  
**Break-even projetado:** Ano 3 (8–12 contratos municipais)

---

## 2. Problema e Oportunidade

### 2.1 Problema

| Stakeholder | Dor |
|-------------|-----|
| **Autoridades** | Volume alto de participações mal formatadas; custo de triagem manual |
| **Cidadãos** | Falta de canal oficial simples; incerteza sobre utilidade da denúncia |
| **Municípios** | Estacionamento irregular difícil de fiscalizar com recursos limitados |
| **Seguradoras** | Registo de acidentes sem evidências estruturadas |

### 2.2 Oportunidade (Portugal)

- **~38.000 acidentes com vítimas/ano** (ANSR, dados consolidados)
- **308 municípios** — potencial clientes B2G para gestão de participações
- Digitalização da administração pública (Simplex, transição digital)
- RGPD maduro — entidades públicas precisam de fornecedores conformes

---

## 3. Proposta de Valor

| Para quem | Valor |
|-----------|-------|
| **Autoridades** | JSON padronizado, metadados verificáveis, redução de triagem |
| **Municípios** | Canal cidadão para estacionamento irregular com evidências |
| **Cidadãos** | Participação estruturada, protocolo de rastreio, transparência |
| **Seguradoras (B2B)** | Registo de sinistros com timestamp e GPS |

**Diferenciador:** Pacote completo (mídia + metadados + JSON para autoridades) num único fluxo mobile, conforme RGPD.

---

## 4. Análise de Mercado

### 4.1 Segmentos

| Segmento | TAM estimado PT | Prioridade |
|----------|-----------------|------------|
| Câmaras municipais (>50k hab.) | ~80 municípios | Alta |
| ANSR / entidades rodoviárias | 1 cliente âncora | Alta |
| Seguradoras (sinistros) | 15–20 players | Média |
| Frotas empresariais | 5.000+ empresas | Média |
| Cidadãos (freemium) | 10M+ condutores | Baixa (aquisição) |

### 4.2 Concorrência

| Tipo | Exemplos | Gap OBOM |
|------|----------|----------|
| Canais oficiais | ePortugal, ANSR online | Sem app mobile de captura guiada |
| Dashcams | Hardware privado | Problemas RGPD; sem integração institucional |
| Apps de trânsito | Waze, Google Maps | Sem evidências legais nem JSON para autoridades |
| Denúncias genéricas | Formulários web | Sem mídia georreferenciada |

### 4.3 Tendências

- Reforço de fiscalização eletrónica (radares, ANPR)
- Pressão por transparência e rastreabilidade de denúncias
- CNPD mais ativa em videovigilância — conformidade como vantagem competitiva

---

## 5. Modelo de Receita e Pricing

### 5.1 Modelo principal: SaaS B2G

| Plano | Preço/mês | Inclui |
|-------|-----------|--------|
| **Municipal Starter** | €499 | Até 500 participações/mês, 1 município, dashboard |
| **Municipal Pro** | €1.299 | Até 2.000 participações, API, relatórios, SLA |
| **Institucional** | €3.500+ | ANSR/região, volume ilimitado, integração SI |

### 5.2 Receitas complementares

| Fonte | Modelo | Preço indicativo |
|-------|--------|------------------|
| Seguradoras | API sinistros | €0,50–€2,00/registo |
| Frotas B2B | Licença por veículo | €3–€8/veículo/mês |
| Setup/onboarding | Projeto | €5.000–€15.000 |
| Conformidade RGPD | Auditoria anual | €2.000–€5.000 |

### 5.3 O que NÃO fazer

- ❌ Comissão de 30% ao denunciante sobre coimas
- ❌ Taxa por multa aplicada
- ❌ Marketplace de denúncias pagas

> Ver [analise-legal.md](./analise-legal.md) para fundamentação jurídica.

---

## 6. Go-to-Market

### Fase 1 — Validação (Meses 1–6)

1. MVP funcional (✅ concluído)
2. Parecer jurídico RGPD + CE
3. Piloto com 1 município (estacionamento irregular)
4. 3 entrevistas ANSR/GNR para validar formato JSON

### Fase 2 — Piloto pago (Meses 7–12)

1. Contrato piloto €499/mês com 2 municípios
2. Apresentação em AMA / Smart Cities Portugal
3. Certificação CNPD (registo de tratamento + DPIA)
4. Landing page + materiais institucionais

### Fase 3 — Escala (Ano 2–3)

1. Força de vendas B2G (1–2 account executives)
2. Parceria com associação de municípios (ANMP)
3. Integração com sistemas municipais existentes
4. Expansão Iberia (Espanha — modelo similar)

### Canais de aquisição

| Canal | CAC estimado | Conversão |
|-------|--------------|-----------|
| Outreach direto municípios | €2.000 | 5–10% |
| Eventos govtech | €500 | Networking |
| Referral ANMP/AMA | €0 | Alto |
| Conteúdo (RGPD + trânsito) | €200 | Médio prazo |

---

## 7. Roadmap Legal e Conformidade

| Etapa | Prazo | Custo estimado |
|-------|-------|----------------|
| Parecer jurídico especializado | M1 | €3.000–€8.000 |
| Registo tratamento CNPD | M2 | €1.000 |
| Nomeação DPO (part-time) | M2 | €500/mês |
| DPIA captura de imagens | M3 | €2.000 |
| Política de privacidade + ToS | M1 | €1.500 |
| Contratos-piloto B2G | M4–M6 | Incluído em vendas |
| Certificação ISO 27001 (opcional) | Ano 2 | €15.000–€30.000 |

---

## 8. Projeções Financeiras (3 anos)

**Premissas:** SaaS municipal €799/médio; 2 clientes Y1, 8 Y2, 20 Y3; churn 10%.

| Métrica | Ano 1 | Ano 2 | Ano 3 |
|---------|-------|-------|-------|
| Clientes B2G | 2 | 8 | 20 |
| MRR (€) | 1.598 | 6.392 | 15.980 |
| ARR (€) | 19.176 | 76.704 | 191.760 |
| Receita total (€)* | 25.000 | 95.000 | 220.000 |
| Custos operacionais (€) | 120.000 | 180.000 | 280.000 |
| EBITDA (€) | -95.000 | -85.000 | -60.000 |

*Inclui setup fees e receitas B2B complementares.

**Break-even:** Projetado para **Ano 4** com 35+ clientes e margem bruta >70%.

### Estrutura de custos (Ano 1)

| Rubrica | % | Valor (€) |
|---------|---|-----------|
| Equipa (2 devs + 1 founder) | 55% | 66.000 |
| Legal/compliance | 15% | 18.000 |
| Infra cloud + ferramentas | 10% | 12.000 |
| Marketing/vendas | 15% | 18.000 |
| Admin/contabilidade | 5% | 6.000 |

---

## 9. Riscos e Mitigações

| Risco | Prob. | Impacto | Mitigação |
|-------|-------|---------|-----------|
| CNPD proibir captura de matrículas | Alta | Crítico | Pivot B2G com contrato; desfoque automático |
| Municípios não adotam | Média | Alto | Piloto gratuito 3 meses; ROI demonstrável |
| Denúncias falsas | Média | Médio | Protocolo + registo utilizador; triagem |
| Concorrência estatal (app oficial) | Baixa | Alto | Ser o fornecedor white-label |
| Ciclo de vendas B2G longo | Alta | Médio | Runway 18 meses; receita B2B paralela |

---

## 10. Roadmap Produto (MVP → Escala)

```
Q4 2026  MVP captura + JSON autoridades (✅)
Q1 2027  Auth + perfil + dashboard municipal
Q2 2027  Desfoque automático RGPD + DPIA
Q3 2027  API integração SI municipais
Q4 2027  Piloto 3 municípios
Q1 2028  App white-label + multi-tenant
Q2 2028  Módulo sinistros seguradoras
```

---

## 11. Equipa Fundadora (mínima viável)

| Papel | Perfil | Dedicação |
|-------|--------|-----------|
| CEO/Founder | Visão, vendas B2G, legal | Full-time |
| CTO | Next.js, infra, RGPD técnico | Full-time |
| Legal/DPO | RGPD, contratos públicos | Part-time → full |
| Product Designer | UX mobile, design system | Part-time |

Ver [organograma.md](./organograma.md) para estrutura completa.

---

## 12. Métricas de Sucesso (KPIs)

| KPI | Meta Y1 | Meta Y3 |
|-----|---------|---------|
| Participações processadas | 5.000 | 100.000 |
| Tempo médio triagem (autoridade) | -40% | -60% |
| NPS municípios | >40 | >60 |
| Uptime plataforma | 99.5% | 99.9% |
| Incidentes RGPD | 0 | 0 |

---

## Anexos

- [Análise Legal](./analise-legal.md)
- [Design System](./design-system.md)
- [Organograma](./organograma.md)
