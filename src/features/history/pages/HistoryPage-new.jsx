import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { StatusBar } from '../../../app/AppShell-new';
import { useAuth } from '../../auth/hooks/useAuth';
import * as db from '../../../lib/db';
import ScanCorrectionModal from '../../../components/ScanCorrectionModal';

// ── Micro Chart ───────────────────────────────────────────
function MicroChart({ data = [200, 150, 300, 250], color = '#ebebf0' }) {
  const max = Math.max(...data, 1);

  return (
    <svg style={{ width: 24, height: 12 }} viewBox="0 0 24 12" preserveAspectRatio="none">
      <polyline
        points={data.map((v, i) => `${i * 8},${12 - (v / max) * 10}`).join(' ')}
        fill="none"
        stroke={color}
        strokeWidth="1"
        opacity="0.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle
        cx={data.length * 8 - 8}
        cy={12 - (data[data.length - 1] / max) * 10}
        r="1"
        fill={color}
        opacity="0.6"
      />
    </svg>
  );
}

// ── Food Icon ─────────────────────────────────────────────
function FoodIcon({ status, confidence }) {
  const getIcon = () => {
    if (status === 'verified') return '✅';
    if (confidence === 'alta') return '🟢';
    if (confidence === 'media') return '🟡';
    if (confidence === 'baixa') return '🔴';
    return '🍽️';
  };

  return (
    <div style={{
      width: 40, height: 40, borderRadius: 12,
      background: '#1c1c1e', display: 'flex',
      alignItems: 'center', justifyContent: 'center',
      fontSize: 18, flexShrink: 0,
      border: '1px solid #2c2c2e',
    }}>
      {getIcon()}
    </div>
  );
}

// ── Scan Item ─────────────────────────────────────────────
function ScanItem({ scan, onEdit, onDelete }) {
  const timeString = new Date(scan.scanned_at).toLocaleTimeString('pt-BR', {
    hour: '2-digit',
    minute: '2-digit'
  });

  return (
    <div className="ns-history-item">
      <FoodIcon status={scan.status} confidence={scan.confidence} />

      <div className="ns-history-content">
        <div className="ns-history-name">
          {scan.food_name || 'Alimento desconhecido'}
        </div>
        <div className="ns-history-meta">
          <span className="ns-history-time">{timeString}</span>
          {scan.confidence && (
            <div className={`ns-confidence-badge ns-confidence-${scan.confidence}`}>
              {scan.confidence}
            </div>
          )}
          {scan.status === 'verified' && (
            <span className="ns-verified-badge">✓ corrigido</span>
          )}
        </div>
      </div>

      <div className="ns-history-macros">
        <div className="ns-macro">
          <div className="ns-macro-value">{scan.calories}</div>
          <div className="ns-macro-label">kcal</div>
        </div>
        <div className="ns-macro">
          <div className="ns-macro-value" style={{ color: '#ebebf0' }}>{scan.protein}g</div>
          <div className="ns-macro-label">prot</div>
        </div>
        <div className="ns-macro">
          <div className="ns-macro-value" style={{ color: '#aeaeb2' }}>{scan.carbs}g</div>
          <div className="ns-macro-label">carb</div>
        </div>
      </div>

      <div className="ns-history-actions">
        <button
          className="ns-icon-btn"
          onClick={() => onEdit(scan)}
          title="Corrigir"
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M3 11h8M7 3l4 4-6 6H3v-2l6-6z" stroke="#8e8e93" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
        <button
          className="ns-icon-btn"
          onClick={() => onDelete(scan.id)}
          title="Remover"
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M4 6v4M8 6v4M2 4h10l-1 8H3L2 4zM5 2h4v2H5V2z" stroke="#8e8e93" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
      </div>
    </div>
  );
}

// ── History Page ──────────────────────────────────────────
export default function HistoryPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [scans, setScans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingScan, setEditingScan] = useState(null);
  const [savingCorrection, setSavingCorrection] = useState(false);

  useEffect(() => {
    loadHistory();
  }, []);

  async function loadHistory() {
    try {
      const data = await db.listScanHistory(user.id, 50);
      setScans(data || []);
    } catch (err) {
      console.error('Erro ao carregar histórico:', err);
    } finally {
      setLoading(false);
    }
  }

  async function handleCorrection(updates) {
    if (!editingScan) return;
    setSavingCorrection(true);
    try {
      const updated = await db.updateScanHistory(editingScan.id, updates);
      setScans(prev => prev.map(s => s.id === editingScan.id ? { ...s, ...updated } : s));
      setEditingScan(null);
    } catch (err) {
      console.error('Erro ao corrigir scan:', err);
    } finally {
      setSavingCorrection(false);
    }
  }

  async function handleDelete(scanId) {
    try {
      await db.deleteScanHistory(scanId);
      setScans(prev => prev.filter(s => s.id !== scanId));
    } catch (err) {
      console.error('Erro ao deletar scan:', err);
    }
  }

  // Group scans by date
  const groupedScans = scans.reduce((acc, scan) => {
    const date = new Date(scan.scanned_at).toLocaleDateString('pt-BR');
    if (!acc[date]) acc[date] = [];
    acc[date].push(scan);
    return acc;
  }, {});

  const getDayTotal = (dayScans) => {
    return dayScans.reduce((sum, s) => sum + (s.calories || 0), 0);
  };

  const getDayMacros = (dayScans) => {
    return {
      protein: dayScans.reduce((sum, s) => sum + (s.protein || 0), 0),
      carbs: dayScans.reduce((sum, s) => sum + (s.carbs || 0), 0),
      fat: dayScans.reduce((sum, s) => sum + (s.fat || 0), 0),
    };
  };

  if (loading) {
    return (
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        minHeight: '100vh', background: '#000'
      }}>
        <div style={{
          width: 32, height: 32, border: '2px solid #2c2c2e',
          borderTop: '2px solid #ebebf0', borderRadius: '50%',
          animation: 'ns-rotate 1s linear infinite'
        }} />
      </div>
    );
  }

  return (
    <div className="ns-page">
      <StatusBar />

      <div className="ns-px" style={{ paddingTop: 14 }}>
        {/* ── Header ── */}
        <div style={{ marginBottom: 20 }}>
          <div style={{
            display: 'flex', justifyContent: 'space-between',
            alignItems: 'flex-end', marginBottom: 2
          }}>
            <div style={{
              fontSize: 34, fontWeight: 700, color: '#fff',
              letterSpacing: '-0.05em', lineHeight: 1
            }}>
              Histórico
            </div>
            <div style={{
              fontSize: 12, color: '#48484a', letterSpacing: '-0.01em'
            }}>
              {scans.length} análises
            </div>
          </div>
          <div style={{
            fontSize: 15, color: '#8e8e93', letterSpacing: '-0.02em'
          }}>
            Suas refeições analisadas
          </div>
        </div>

        {scans.length === 0 ? (
          /* ── Empty State ── */
          <div className="ns-card ns-shimmer" style={{
            padding: 40, textAlign: 'center', marginTop: 40
          }}>
            <div style={{ fontSize: 48, marginBottom: 12, opacity: 0.4 }}>📋</div>
            <div style={{
              fontSize: 18, fontWeight: 600, color: '#fff',
              letterSpacing: '-0.02em', marginBottom: 6
            }}>
              Nenhuma análise ainda
            </div>
            <div style={{
              fontSize: 14, color: '#8e8e93', letterSpacing: '-0.01em',
              marginBottom: 24, lineHeight: 1.4
            }}>
              Comece escaneando seus primeiros<br />alimentos para ver o histórico aqui
            </div>
            <div
              className="ns-scan-cta ns-shimmer"
              onClick={() => navigate('/scan')}
              style={{ margin: '0 auto', maxWidth: 280 }}
            >
              <div className="ns-scan-icon">
                <div className="ns-scan-icon-pulse" />
                <svg width="20" height="20" viewBox="0 0 22 22" fill="none">
                  <rect x="1" y="1" width="7" height="7" rx="2" stroke="#fff" strokeWidth="1.8"/>
                  <rect x="14" y="1" width="7" height="7" rx="2" stroke="#fff" strokeWidth="1.8"/>
                  <rect x="1" y="14" width="7" height="7" rx="2" stroke="#fff" strokeWidth="1.8"/>
                  <rect x="14" y="14" width="3" height="3" rx=".6" fill="#fff"/>
                  <rect x="18" y="14" width="3" height="3" rx=".6" fill="#fff"/>
                  <rect x="14" y="18" width="3" height="3" rx=".6" fill="#fff"/>
                </svg>
              </div>
              <div style={{ flex: 1 }}>
                <div className="ns-scan-title">Primeiro scan</div>
              </div>
              <div className="ns-scan-arrow">
                <svg width="11" height="11" viewBox="0 0 11 11" fill="none">
                  <path d="M3.5 2l4 3.5-4 3.5" stroke="#fff" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
            </div>
          </div>
        ) : (
          /* ── History List ── */
          Object.entries(groupedScans).map(([date, dayScans], groupIdx) => {
            const dayMacros = getDayMacros(dayScans);
            const chartData = dayScans.slice(-4).map(s => s.calories || 0);

            return (
              <div key={date} style={{ marginBottom: 16 }}>
                {/* Day Header */}
                <div className="ns-day-header">
                  <div className="ns-day-date">{date}</div>
                  <div className="ns-day-summary">
                    <div className="ns-day-total">
                      {getDayTotal(dayScans)} kcal
                    </div>
                    <MicroChart data={chartData} color="#ebebf0" />
                  </div>
                </div>

                {/* Day Card */}
                <div className="ns-card-history ns-shimmer">
                  {dayScans.map((scan, i) => (
                    <div key={scan.id}>
                      <ScanItem
                        scan={scan}
                        onEdit={setEditingScan}
                        onDelete={handleDelete}
                      />
                      {i < dayScans.length - 1 && <div className="ns-divider" />}
                    </div>
                  ))}

                  {/* Day Summary */}
                  <div className="ns-day-totals">
                    <div className="ns-day-macro">
                      <div className="ns-day-macro-value">{dayMacros.protein}g</div>
                      <div className="ns-day-macro-label">Proteína</div>
                    </div>
                    <div className="ns-day-macro">
                      <div className="ns-day-macro-value">{dayMacros.carbs}g</div>
                      <div className="ns-day-macro-label">Carboidratos</div>
                    </div>
                    <div className="ns-day-macro">
                      <div className="ns-day-macro-value">{dayMacros.fat}g</div>
                      <div className="ns-day-macro-label">Gorduras</div>
                    </div>
                  </div>
                </div>

                {/* AI Tips */}
                {dayScans.find(s => s.ai_tip) && (
                  <div className="ns-ai-tip">
                    <div style={{ fontSize: 18, marginRight: 8 }}>💡</div>
                    <div style={{ fontSize: 12, color: '#ebebf0', lineHeight: 1.3 }}>
                      {dayScans.find(s => s.ai_tip).ai_tip}
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Correction Modal */}
      {editingScan && (
        <ScanCorrectionModal
          scan={editingScan}
          onSave={handleCorrection}
          onClose={() => setEditingScan(null)}
          saving={savingCorrection}
        />
      )}
    </div>
  );
}