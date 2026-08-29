// Gera payload PIX EMV conforme padrão BCB (BR Code) - dados reais, sem fictício
// Referência: https://www.bcb.gov.br/estabilidadefinanceira/pix

function tlv(id: string, value: string) {
  const len = String(value.length).padStart(2, "0");
  return `${id}${len}${value}`;
}

export function geraPixPayload(opts: {
  chave: string;
  valor: number;
  txid: string;
  nome: string;
  cidade: string;
  descricao?: string;
}) {
  const chave = opts.chave.trim();
  const nome = opts.nome.trim().substring(0, 25).toUpperCase() || "ELMESSON";
  const cidade = opts.cidade.trim().substring(0, 15).toUpperCase() || "SAO PAULO";
  const valor = opts.valor.toFixed(2);
  const txid = (opts.txid || "***").substring(0, 25);

  const gui = tlv("00", "BR.GOV.BCB.PIX");
  const chavePix = tlv("01", chave);
  const descricao = opts.descricao ? tlv("02", opts.descricao.substring(0, 30)) : "";
  const merchantAccount = tlv("26", gui + chavePix + descricao);
  const merchantCategory = tlv("52", "0000");
  const currency = tlv("53", "986");
  const amount = tlv("54", valor);
  const country = tlv("58", "BR");
  const merchantName = tlv("59", nome);
  const merchantCity = tlv("60", cidade);
  const tx = tlv("62", tlv("05", txid));

  const semCrc = tlv("00", "01") + merchantAccount + merchantCategory + currency + amount + country + merchantName + merchantCity + tx + "6304";
  const crc = crc16(semCrc);
  return semCrc + crc;
}

function crc16(str: string) {
  let crc = 0xffff;
  for (let i = 0; i < str.length; i++) {
    crc ^= str.charCodeAt(i) << 8;
    for (let j = 0; j < 8; j++) {
      if (crc & 0x8000) crc = (crc << 1) ^ 0x1021;
      else crc <<= 1;
      crc &= 0xffff;
    }
  }
  return crc.toString(16).toUpperCase().padStart(4, "0");
}

export function validaChavePix(tipo: string, chave: string): string | null {
  const c = chave.trim();
  if (tipo === "CPF") return /^\d{11}$/.test(c.replace(/\D/g, "")) ? null : "CPF deve ter 11 dígitos";
  if (tipo === "CNPJ") return /^\d{14}$/.test(c.replace(/\D/g, "")) ? null : "CNPJ deve ter 14 dígitos";
  if (tipo === "EMAIL") return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(c) ? null : "E-mail inválido";
  if (tipo === "TELEFONE") return /^\+55\d{10,11}$/.test(c) ? null : "Telefone deve ser +55DDDXXXXXXXX";
  if (tipo === "ALEATORIA") return /^[0-9a-f-]{32,36}$/i.test(c) ? null : "Chave aleatória deve ser UUID";
  return "Tipo inválido";
}
