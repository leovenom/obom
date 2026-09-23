# Análise Legal — OBOM em Portugal

> **Veredito geral:** **RESTRITO / PARCIALMENTE VIÁVEL**  
> A monetização por **comissão sobre coimas** a cidadãos denunciantes **não é viável** em Portugal. A plataforma pode existir como **infraestrutura B2G/B2B** de gestão de evidências, com conformidade RGPD rigorosa.

---

## 1. Enquadramento legal português

### 1.1 Competência para contraordenações rodoviárias

| Entidade | Competência |
|----------|-------------|
| **ANSR** | Processamento de contraordenações rodoviárias (Art. 169.º CE) |
| **Presidente ANSR** | Aplicação de coimas e sanções acessórias |
| **GNR / PSP** | Fiscalização, levantamento de autos, participações |
| **Câmaras Municipais** | Estacionamento proibido/indevido em vias sob jurisdição municipal |

**Implicação:** Coimas são receita pública. Não existe base legal para uma app privada reter percentagem de coimas aplicadas a terceiros, nem para remunerar cidadãos com base no valor da multa.

### 1.2 Denúncias de cidadãos

- Cidadãos **podem participar** infrações às autoridades (GNR, PSP, ANSR).
- A participação **não confere direito a remuneração** proporcional à coima.
- **Lei n.º 93/2021** (proteção de denunciantes) aplica-se a denúncias **profissionais** de infrações específicas (corrupção, RGPD, ambiente, etc.) — **não** a denúncias genéricas de trânsito por cidadãos comuns.
- **Art. 365.º CP:** Denúncia falsa de crime/contraordenação é punível (até 1 ano prisão ou multa para contraordenações).

### 1.3 Proteção de dados (RGPD + Lei 58/2019)

| Dado | Tratamento |
|------|------------|
| **Matrícula** | Dado pessoal (reconduzível a proprietário/condutor) — CNPD |
| **Imagem de pessoas/veículos na via pública** | Tratamento sujeito a RGPD |
| **Geolocalização** | Dado pessoal; exige base legal |
| **Captação sistemática em via pública** | **Art. 19.º Lei 58/2019:** proibida videovigilância incidindo sobre vias públicas, salvo exceções legais |

**Posição CNPD (2024):** Captação de matrículas e pessoas na via pública por câmaras em automóveis/cidadãos comuns é, em regra, **ilícita**. Consentimento é **inexequível** em espaços públicos abertos.

**Exceções limitadas:**
- Uso **doméstico/privado** ocasional (ex.: dashcam para defesa pessoal em acidente) — debate jurídico, não escala comercial.
- Tratamento por **autoridades** com competência legal.
- Operadores com **contrato B2G** e enquadramento específico (ex.: câmaras municipais licenciadas).

### 1.4 Comissionamento sobre multas

| Modelo | Viabilidade legal |
|--------|-------------------|
| Denunciante recebe % da coima | **NÃO VIÁVEL** — sem base legal; risco de usura/intermediação ilícita |
| Plataforma recebe % da coima | **NÃO VIÁVEL** — coimas são receita do Estado |
| Taxa fixa SaaS à câmara/ANSR | **VIÁVEL** — contrato de prestação de serviços |
| Subscrição B2B (seguradoras, frotas) | **VIÁVEL** — com consentimento e finalidade definida |
| Prémio simbólico / gamificação sem vínculo à coima | **ZONA CINZENTA** — requer parecer jurídico; não pode ser % da multa |

---

## 2. Nota sobre Brasil (contexto do MVP atual)

O MVP foi construído com padrões brasileiros (placas Mercosul, CPF, PIX). No Brasil:

- Denúncias via app existem (ex.: CET-SP, alguns municípios), mas **comissão sobre multa** também **não tem amparo legal generalizado**.
- Lei Geral de Proteção de Dados (LGPD) impõe requisitos similares ao RGPD.
- Modelos de **parceria com órgãos públicos** (contrato, não % da multa) são os mais seguros.

---

## 3. Modelos de monetização

### ✅ Legais e recomendados

1. **SaaS B2G** — Licença mensal a municípios/ANSR para gestão de participações cidadãs
2. **Integração com seguradoras** — Registo de acidentes com consentimento do titular
3. **Monitorização de frotas B2B** — Empresas com veículos próprios (base legal: contrato trabalho/interesse legítimo)
4. **Consultoria de conformidade RGPD** — Auditoria e certificação do fluxo de dados
5. **API de evidências** — Encaminhamento estruturado para autoridades (fee por volume, pago pelo ente público)

### ❌ Ilegais ou alto risco

1. Percentagem da coima para denunciante ou plataforma
2. Captação massiva de matrículas na via pública sem enquadramento legal
3. Marketplace de denúncias remuneradas por resultado
4. Revenda de dados de matrículas/condutores
5. Vigilância cidadã organizada com OCR comercial sem contrato B2G

---

## 4. Modelo recomendado para OBOM (Portugal)

```
Cidadão → App OBOM → Encaminha JSON + mídia → Autoridade competente
                              ↑
                    Plataforma cobra fee fixo
                    ao MUNICÍPIO/ANSR (SaaS)
                    — NÃO % da coima
```

**Roadmap de conformidade:**
1. Parecer jurídico especializado (RGPD + CE)
2. Registo de tratamento na CNPD
3. Designação de DPO (Encarregado de Proteção de Dados)
4. DPIA (Avaliação de Impacto) para captura de imagens
5. Contratos-piloto com 1–2 municípios
6. Anonimização/desfoque automático de rostos e matrículas de terceiros quando não essenciais

---

## 5. Veredito final

| Aspeto | Veredito |
|--------|----------|
| App de captura com GPS e metadados | **Viável** com conformidade RGPD |
| OCR de matrículas em via pública | **Restrito** — requer enquadramento B2G |
| Comissão % sobre multas | **Não viável** |
| Monetização SaaS B2G | **Viável** — modelo principal recomendado |
| JSON para autoridades | **Viável** — valor claro para entidades públicas |

**Conclusão:** OBOM deve pivotar de "app de denúncias remuneradas" para **"plataforma civic-tech de evidências rodoviárias com contratos institucionais"**, mantendo o JSON estruturado como produto central para ANSR, GNR, PSP e câmaras municipais.
