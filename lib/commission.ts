import type { CaptureMetadata } from './types';
import type { StoredUser } from './db';

export interface PlatformConfig {
  platformName: string;
  platformCnpj: string;
  platformContact: string;
}

export function getPlatformConfig(): PlatformConfig {
  return {
    platformName: process.env.PLATFORM_NAME || 'OBOM',
    platformCnpj: process.env.PLATFORM_CNPJ || '',
    platformContact: process.env.PLATFORM_CONTACT || '',
  };
}

const INCIDENT_LABELS: Record<string, string> = {
  verificacao: 'Verificação de placa',
  transito: 'Trânsito / Congestionamento',
  acidente: 'Acidente / Ocorrência',
  estacionamento: 'Estacionamento irregular',
  outro: 'Outro',
};

export interface AuthorityReport {
  versao: string;
  protocolo: string;
  dataGeracao: string;
  tipoRegistro: string;
  denunciante: {
    id: string;
    nome: string;
    email: string;
    telefone: string;
  };
  ocorrencia: {
    tipo: string;
    tipoCodigo: string;
    descricao: string;
    dataHora: string;
    dataHoraISO: string;
    fusoHorario: string;
    localizacao: {
      endereco: string | null;
      latitude: number | null;
      longitude: number | null;
      precisaoMetros: number | null;
    };
    placasIdentificadas: string[];
    duracaoSegundos: number | null;
  };
  midia: {
    tipo: 'foto' | 'video';
    arquivo: string;
    url: string;
    mimetype: string;
    tamanhoBytes: number;
  };
  plataforma: {
    nome: string;
    cnpj: string;
    contato: string;
    papel: string;
  };
  destinatario: {
    orgao: string;
    instrucao: string;
  };
  objetivo: {
    descricao: string;
  };
}

export function buildAuthorityReport(params: {
  protocolo: string;
  user: StoredUser;
  metadata: CaptureMetadata;
  filename: string;
  mimetype: string;
  size: number;
  mediaType: 'foto' | 'video';
  baseUrl?: string;
}): AuthorityReport {
  const config = getPlatformConfig();

  return {
    versao: '1.0',
    protocolo: params.protocolo,
    dataGeracao: new Date().toISOString(),
    tipoRegistro: 'registro_ocorrencia_transito',
    denunciante: {
      id: params.user.id,
      nome: params.user.nome,
      email: params.user.email,
      telefone: params.user.telefone,
    },
    ocorrencia: {
      tipo: INCIDENT_LABELS[params.metadata.incidentType] || params.metadata.incidentType,
      tipoCodigo: params.metadata.incidentType,
      descricao: INCIDENT_LABELS[params.metadata.incidentType] || params.metadata.incidentType,
      dataHora: params.metadata.datetime,
      dataHoraISO: params.metadata.timestamp,
      fusoHorario: params.metadata.timezone,
      localizacao: {
        endereco: params.metadata.address,
        latitude: params.metadata.latitude ?? null,
        longitude: params.metadata.longitude ?? null,
        precisaoMetros: params.metadata.accuracy ?? null,
      },
      placasIdentificadas: params.metadata.plates || [],
      duracaoSegundos: params.metadata.durationSeconds ?? null,
    },
    midia: {
      tipo: params.mediaType,
      arquivo: params.filename,
      url: `${params.baseUrl || ''}/api/capturas/${params.filename}`,
      mimetype: params.mimetype,
      tamanhoBytes: params.size,
    },
    plataforma: {
      nome: config.platformName,
      cnpj: config.platformCnpj,
      contato: config.platformContact,
      papel: 'Recolha estruturada de evidências georreferenciadas para análise institucional',
    },
    destinatario: {
      orgao: 'Autoridade competente (municipal, ANSR ou equivalente)',
      instrucao:
        'Registo automático para apoio à priorização e dimensionamento da resposta — agrega ocorrências que hoje não são tratadas de forma sistemática.',
    },
    objetivo: {
      descricao:
        'Permitir às entidades responsáveis medir volume, padrões e localização de infrações reportadas pela população, com media e metadados verificáveis.',
    },
  };
}

export function generateProtocolo(): string {
  const date = new Date();
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  const rand = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `OBOM-${y}${m}${d}-${rand}`;
}
