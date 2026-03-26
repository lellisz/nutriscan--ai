/**
 * Gera ícones PWA placeholder para Praxis Nutri
 * Fundo verde #1A7F56 com letra "P" branca centralizada
 * Sem dependências externas — usa apenas zlib nativo do Node.js
 */

const zlib = require('zlib');
const fs   = require('fs');
const path = require('path');

// ── CRC32 (necessário para chunks PNG) ────────────────────
function makeCRCTable() {
  const table = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1);
    table[n] = c;
  }
  return table;
}
const CRC_TABLE = makeCRCTable();

function crc32(buf) {
  let crc = 0xFFFFFFFF;
  for (let i = 0; i < buf.length; i++) {
    crc = CRC_TABLE[(crc ^ buf[i]) & 0xFF] ^ (crc >>> 8);
  }
  return (crc ^ 0xFFFFFFFF) >>> 0;
}

// ── Chunk PNG ─────────────────────────────────────────────
function makeChunk(type, data) {
  const typeBuf = Buffer.from(type, 'ascii');
  const lenBuf  = Buffer.alloc(4);
  lenBuf.writeUInt32BE(data.length, 0);
  const crcBuf  = Buffer.alloc(4);
  crcBuf.writeUInt32BE(crc32(Buffer.concat([typeBuf, data])), 0);
  return Buffer.concat([lenBuf, typeBuf, data, crcBuf]);
}

// ── Desenhar um "P" estilizado em pixels ──────────────────
// Retorna bitmap 1-bit (true = pixel branco) centrado na imagem
function drawLetter(width, height) {
  const pixels = new Uint8Array(width * height); // 0 = verde, 1 = branco

  // "P" desenhado como padrão de pixels
  // Definir como porcentagem do tamanho para escalar
  const cx = Math.floor(width  * 0.5);
  const cy = Math.floor(height * 0.5);
  const scale = Math.floor(width * 0.018); // ~espessura do traço

  const lw  = Math.floor(width  * 0.35); // largura da letra
  const lh  = Math.floor(height * 0.50); // altura da letra
  const ox  = cx - Math.floor(lw * 0.4); // offset x de início
  const oy  = cy - Math.floor(lh * 0.5); // offset y de início

  function fill(x1, y1, x2, y2) {
    for (let y = Math.max(0, y1); y < Math.min(height, y2); y++) {
      for (let x = Math.max(0, x1); x < Math.min(width, x2); x++) {
        pixels[y * width + x] = 1;
      }
    }
  }

  const t = Math.max(1, scale); // espessura
  // Haste vertical esquerda
  fill(ox, oy, ox + t, oy + lh);
  // Topo horizontal
  fill(ox, oy, ox + Math.floor(lw * 0.75), oy + t);
  // Barriga superior (meio)
  fill(ox, oy + Math.floor(lh * 0.4), ox + Math.floor(lw * 0.75), oy + Math.floor(lh * 0.4) + t);
  // Curva direita superior (barra vertical direita do arco)
  fill(ox + Math.floor(lw * 0.75) - t, oy, ox + Math.floor(lw * 0.75), oy + Math.floor(lh * 0.4) + t);

  return pixels;
}

// ── Gerar PNG ─────────────────────────────────────────────
function generatePNG(size) {
  const [r, g, b] = [0x1A, 0x7F, 0x56]; // #1A7F56 verde Praxis
  const [pr, pg, pb] = [0xFF, 0xFF, 0xFF]; // branco

  const letter = drawLetter(size, size);

  // Raw image data: para cada linha um byte de filtro (0) + pixels RGB
  const raw = Buffer.alloc(size * (size * 3 + 1));
  for (let y = 0; y < size; y++) {
    raw[y * (size * 3 + 1)] = 0; // filtro None
    for (let x = 0; x < size; x++) {
      const offset = y * (size * 3 + 1) + 1 + x * 3;
      if (letter[y * size + x]) {
        raw[offset]     = pr;
        raw[offset + 1] = pg;
        raw[offset + 2] = pb;
      } else {
        raw[offset]     = r;
        raw[offset + 1] = g;
        raw[offset + 2] = b;
      }
    }
  }

  const compressed = zlib.deflateSync(raw, { level: 6 });

  // IHDR
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8]  = 8; // bit depth
  ihdr[9]  = 2; // RGB
  ihdr[10] = 0;
  ihdr[11] = 0;
  ihdr[12] = 0;

  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]), // assinatura PNG
    makeChunk('IHDR', ihdr),
    makeChunk('IDAT', compressed),
    makeChunk('IEND', Buffer.alloc(0)),
  ]);
}

// ── Main ──────────────────────────────────────────────────
const publicDir = path.join(__dirname, '..', 'public');
if (!fs.existsSync(publicDir)) fs.mkdirSync(publicDir, { recursive: true });

for (const size of [192, 512]) {
  const filename = path.join(publicDir, `pwa-${size}x${size}.png`);
  fs.writeFileSync(filename, generatePNG(size));
  console.log(`✓ Gerado: public/pwa-${size}x${size}.png (${size}x${size}px)`);
}

console.log('\nÍcones PWA gerados com sucesso!');
