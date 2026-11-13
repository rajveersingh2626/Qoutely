import React from 'react';
import {
  AbsoluteFill,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
  Img,
  OffthreadVideo,
  staticFile,
} from 'remotion';

// ============================================================================
// ANIMATED MOUSE CURSOR
// ============================================================================
const MouseCursor: React.FC<{ x: number; y: number; isClicking: boolean }> = ({
  x,
  y,
  isClicking,
}) => {
  return (
    <div
      style={{
        position: 'absolute',
        left: x,
        top: y,
        transform: `translate(-4px, -4px) scale(${isClicking ? 0.85 : 1})`,
        transition: 'transform 0.08s ease',
        pointerEvents: 'none',
        zIndex: 9999,
      }}
    >
      <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
        <path
          d="M5 3L19 12L12 14L8 21L5 3Z"
          fill="#0F5132"
          stroke="#FFFFFF"
          strokeWidth="2"
          strokeLinejoin="round"
        />
      </svg>
      {isClicking && (
        <div
          style={{
            position: 'absolute',
            left: 2,
            top: 2,
            width: 24,
            height: 24,
            borderRadius: '50%',
            border: '2px solid #22c55e',
            opacity: 0.8,
            animation: 'none',
            transform: 'scale(1.4)',
          }}
        />
      )}
    </div>
  );
};

// ============================================================================
// MAIN 45-SECOND LINKEDIN PROMO VIDEO COMPONENT
// ============================================================================
export const QoutelyLinkedInDemo: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // --------------------------------------------------------------------------
  // SCENE 1: THE HOOK (Frames 0 - 270 / 0s - 9s)
  // --------------------------------------------------------------------------
  const hookOpacity = interpolate(frame, [0, 20, 240, 270], [0, 1, 1, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const hookScale = interpolate(frame, [0, 240], [0.96, 1.02], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  // --------------------------------------------------------------------------
  // BROWSER WINDOW ENTRANCE & PERSPECTIVE (Frames 240 onwards)
  // --------------------------------------------------------------------------
  const browserOpacity = interpolate(frame, [240, 270, 1140, 1170], [0, 1, 1, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const browserSpring = spring({
    frame: frame - 250,
    fps,
    config: { damping: 14, stiffness: 90 },
  });
  const browserY = interpolate(browserSpring, [0, 1], [80, 0]);

  // --------------------------------------------------------------------------
  // SCENE 2: RISK SELECTION & INPUTS (Frames 270 - 570 / 9s - 19s)
  // --------------------------------------------------------------------------
  // Cursor trajectory for Scene 2
  const cursorX = interpolate(
    frame,
    [260, 310, 340, 390, 430, 480, 520, 570, 600],
    [1400, 480, 480, 960, 960, 640, 640, 960, 960],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
  );
  const cursorY = interpolate(
    frame,
    [260, 310, 340, 390, 430, 480, 520, 570, 600],
    [900, 340, 340, 460, 460, 620, 620, 720, 720],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
  );
  const isClicking =
    (frame >= 335 && frame <= 348) || // Clicking Property Card
    (frame >= 475 && frame <= 488) || // Clicking STFI toggle
    (frame >= 565 && frame <= 578);   // Clicking Calculate button

  const propertySelected = frame >= 340;
  const typedIdv = frame < 370 ? '' : frame < 400 ? '₹ 50,00' : '₹ 50,00,00,000';
  const stfiActive = frame >= 480;
  const eqActive = frame >= 510;

  // --------------------------------------------------------------------------
  // SCENE 3: MULTI-INSURER RATE CALCULATION (Frames 570 - 900 / 19s - 30s)
  // --------------------------------------------------------------------------
  const isCalculating = frame >= 570 && frame < 630;
  const showMatrix = frame >= 630;
  const matrixSpring = spring({
    frame: frame - 630,
    fps,
    config: { damping: 12, stiffness: 100 },
  });

  // --------------------------------------------------------------------------
  // SCENE 4: 1-CLICK PDF QUOTE SLIP EXPORT (Frames 900 - 1170 / 30s - 39s)
  // --------------------------------------------------------------------------
  const showPdfExport = frame >= 900;
  const pdfSpring = spring({
    frame: frame - 920,
    fps,
    config: { damping: 13, stiffness: 110 },
  });
  const pdfScale = interpolate(pdfSpring, [0, 1], [0.85, 1]);
  const pdfOpacity = interpolate(frame, [900, 930, 1140, 1170], [0, 1, 1, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  // --------------------------------------------------------------------------
  // SCENE 5: OUTRO & FOUNDER'S BETA ACCESS (Frames 1170 - 1350 / 39s - 45s)
  // --------------------------------------------------------------------------
  const outroOpacity = interpolate(frame, [1160, 1190], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const outroSpring = spring({
    frame: frame - 1170,
    fps,
    config: { damping: 14, stiffness: 95 },
  });

  return (
    <AbsoluteFill
      style={{
        backgroundColor: '#0A0D12',
        fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
        color: '#FFFFFF',
        overflow: 'hidden',
      }}
    >
      {/* Background Animated Gradient Aura */}
      <div
        style={{
          position: 'absolute',
          top: -200,
          left: '25%',
          width: 900,
          height: 900,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(15, 81, 50, 0.35) 0%, rgba(10, 13, 18, 0) 70%)',
          filter: 'blur(80px)',
          transform: `scale(${1 + Math.sin(frame / 40) * 0.08})`,
        }}
      />

      {/* ====================================================================
          SCENE 1: THE HOOK (WITH DYNAMIC INTRO VIDEO BACKDROP)
      ==================================================================== */}
      {frame < 270 && (
        <>
          {/* Dynamic Background Intro Video from Qoutely Personal */}
          <div
            style={{
              position: 'absolute',
              inset: 0,
              opacity: 0.38,
              overflow: 'hidden',
              filter: 'contrast(1.1) brightness(0.9)',
            }}
          >
            <OffthreadVideo
              src={staticFile('intro_video.mp4')}
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
              }}
            />
            {/* Dark vignette gradient overlay */}
            <div
              style={{
                position: 'absolute',
                inset: 0,
                background: 'linear-gradient(to bottom, rgba(10, 13, 18, 0.75) 0%, rgba(10, 13, 18, 0.92) 100%)',
              }}
            />
          </div>

          <AbsoluteFill
            style={{
              opacity: hookOpacity,
              transform: `scale(${hookScale})`,
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              alignItems: 'center',
              textAlign: 'center',
              padding: '0 120px',
              zIndex: 10,
            }}
          >
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 12,
                padding: '10px 24px',
                borderRadius: 9999,
                backgroundColor: 'rgba(15, 81, 50, 0.35)',
                border: '1px solid rgba(34, 197, 94, 0.5)',
                color: '#4ade80',
                fontSize: 16,
                fontWeight: 800,
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                marginBottom: 28,
              }}
            >
              <span>The Reality of Commercial Insurance in India</span>
            </div>

            <h1
              style={{
                fontSize: 64,
                fontWeight: 900,
                lineHeight: 1.15,
                letterSpacing: '-0.03em',
                maxWidth: 1300,
                marginBottom: 24,
              }}
            >
              Brokers waste <span style={{ color: '#ef4444' }}>3 to 5 days</span> waiting for underwriter replies on 40-page RFQs.
            </h1>

            <p
              style={{
                fontSize: 28,
                color: '#94a3b8',
                maxWidth: 1000,
                lineHeight: 1.5,
                marginBottom: 36,
              }}
            >
              Fighting spreadsheets and losing clients to faster competitors?
            </p>

            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 20,
                padding: '16px 36px',
                borderRadius: 24,
                backgroundColor: '#0F5132',
                border: '1px solid #22c55e',
                boxShadow: '0 20px 40px rgba(15, 81, 50, 0.4)',
                position: 'relative',
              }}
            >
              {/* Winged Money Character Mascot from Qoutely Personal */}
              <Img
                src={staticFile('winged_money_character.png')}
                style={{
                  width: 64,
                  height: 64,
                  objectFit: 'contain',
                  transform: `translateY(${Math.sin(frame / 12) * 8}px) rotate(${Math.sin(frame / 20) * 5}deg)`,
                  filter: 'drop-shadow(0 10px 15px rgba(0,0,0,0.5))',
                }}
              />
              <Img
                src={staticFile('qoutely_logo.png')}
                style={{ width: 40, height: 40, objectFit: 'contain' }}
              />
              <span style={{ fontSize: 26, fontWeight: 900, color: '#FFFFFF' }}>
                Qoutely: Compare Real Insurer Rates in 60 Seconds
              </span>
            </div>
          </AbsoluteFill>
        </>
      )}

      {/* ====================================================================
          SCENES 2 & 3: BROWSER STUDIO SIMULATION (Frames 240 - 1170)
      ==================================================================== */}
      {frame >= 240 && frame < 1170 && (
        <AbsoluteFill
          style={{
            opacity: browserOpacity,
            transform: `translateY(${browserY}px)`,
            padding: '50px 90px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
          }}
        >
          {/* Top Bar / Mac Window Chrome */}
          <div
            style={{
              width: '100%',
              backgroundColor: '#1E242E',
              borderTopLeftRadius: 24,
              borderTopRightRadius: 24,
              padding: '16px 24px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 14, height: 14, borderRadius: '50%', backgroundColor: '#ef4444' }} />
              <div style={{ width: 14, height: 14, borderRadius: '50%', backgroundColor: '#f59e0b' }} />
              <div style={{ width: 14, height: 14, borderRadius: '50%', backgroundColor: '#10b981' }} />
            </div>

            <div
              style={{
                backgroundColor: 'rgba(0, 0, 0, 0.35)',
                padding: '6px 32px',
                borderRadius: 12,
                fontSize: 14,
                fontFamily: 'monospace',
                color: '#94a3b8',
                display: 'flex',
                alignItems: 'center',
                gap: 8,
              }}
            >
              <span style={{ color: '#22c55e' }}>https://</span>
              <span>qoutely.vercel.app/quotes/new</span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <span style={{ fontSize: 13, color: '#4ade80', fontWeight: 700 }}>● Live Underwriting Desk</span>
            </div>
          </div>

          {/* Studio Body */}
          <div
            style={{
              backgroundColor: '#12161E',
              borderBottomLeftRadius: 24,
              borderBottomRightRadius: 24,
              padding: '36px 48px',
              boxShadow: '0 30px 80px rgba(0, 0, 0, 0.7)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              minHeight: 740,
              position: 'relative',
            }}
          >
            {/* Header in Studio */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 30 }}>
              <div>
                <h2 style={{ fontSize: 26, fontWeight: 900, color: '#FFFFFF', margin: 0 }}>
                  Commercial Property Rating Studio (Bharat Sookshma &amp; Laghu)
                </h2>
                <p style={{ fontSize: 14, color: '#94a3b8', margin: '4px 0 0 0' }}>
                  Statutory Tariff Schedule • IRDAI/AIFT 2001 Compliance
                </p>
              </div>
              <div
                style={{
                  backgroundColor: 'rgba(15, 81, 50, 0.3)',
                  border: '1px solid #22c55e',
                  padding: '8px 18px',
                  borderRadius: 12,
                  fontSize: 14,
                  fontWeight: 800,
                  color: '#4ade80',
                }}
              >
                Quote #QTL-2026-8819
              </div>
            </div>

            {/* Inputs & Coverage Row */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 32 }}>
              {/* Col 1: Risk Class & Sum Insured */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                {/* Risk Selector */}
                <div
                  style={{
                    padding: 20,
                    borderRadius: 18,
                    backgroundColor: propertySelected ? 'rgba(15, 81, 50, 0.25)' : 'rgba(255, 255, 255, 0.03)',
                    border: propertySelected ? '2px solid #22c55e' : '1px solid rgba(255, 255, 255, 0.1)',
                    transition: 'all 0.2s ease',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                      <div
                        style={{
                          width: 44,
                          height: 44,
                          borderRadius: 12,
                          backgroundColor: '#0F5132',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: 22,
                        }}
                      >
                        🏢
                      </div>
                      <div>
                        <div style={{ fontSize: 16, fontWeight: 800, color: '#FFFFFF' }}>Office &amp; Factory Property</div>
                        <div style={{ fontSize: 12, color: '#94a3b8' }}>Industrial Plants, Warehouses &amp; Commercial Parks</div>
                      </div>
                    </div>
                    {propertySelected && (
                      <span style={{ fontSize: 13, color: '#22c55e', fontWeight: 800 }}>✓ Selected</span>
                    )}
                  </div>
                </div>

                {/* Insured Value Field */}
                <div style={{ padding: 20, borderRadius: 18, backgroundColor: 'rgba(255, 255, 255, 0.03)', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
                  <label style={{ fontSize: 12, color: '#94a3b8', textTransform: 'uppercase', fontWeight: 700, display: 'block', marginBottom: 8 }}>
                    Total Insured Value (IDV)
                  </label>
                  <div
                    style={{
                      fontSize: 28,
                      fontWeight: 900,
                      color: typedIdv ? '#22c55e' : '#64748b',
                      fontFamily: 'monospace',
                    }}
                  >
                    {typedIdv || 'Enter Sum Insured...'}
                  </div>
                  {typedIdv && (
                    <span style={{ fontSize: 12, color: '#94a3b8', marginTop: 4, display: 'block' }}>
                      (Fifty Crores Indian Rupees)
                    </span>
                  )}
                </div>
              </div>

              {/* Col 2: Endorsement Toggles */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div
                  style={{
                    padding: 16,
                    borderRadius: 16,
                    backgroundColor: stfiActive ? 'rgba(34, 197, 94, 0.15)' : 'rgba(255, 255, 255, 0.03)',
                    border: stfiActive ? '1.5px solid #22c55e' : '1px solid rgba(255, 255, 255, 0.08)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}
                >
                  <div>
                    <div style={{ fontSize: 15, fontWeight: 700 }}>STFI Extension</div>
                    <div style={{ fontSize: 12, color: '#94a3b8' }}>Storm, Tempest, Flood &amp; Inundation Hazard</div>
                  </div>
                  <div
                    style={{
                      padding: '6px 14px',
                      borderRadius: 9999,
                      backgroundColor: stfiActive ? '#22c55e' : '#334155',
                      color: '#FFFFFF',
                      fontSize: 12,
                      fontWeight: 800,
                    }}
                  >
                    {stfiActive ? 'Active' : 'Off'}
                  </div>
                </div>

                <div
                  style={{
                    padding: 16,
                    borderRadius: 16,
                    backgroundColor: eqActive ? 'rgba(34, 197, 94, 0.15)' : 'rgba(255, 255, 255, 0.03)',
                    border: eqActive ? '1.5px solid #22c55e' : '1px solid rgba(255, 255, 255, 0.08)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}
                >
                  <div>
                    <div style={{ fontSize: 15, fontWeight: 700 }}>Earthquake Hazard (Zone II)</div>
                    <div style={{ fontSize: 12, color: '#94a3b8' }}>Delhi NCR / Mumbai Seismological Tariff</div>
                  </div>
                  <div
                    style={{
                      padding: '6px 14px',
                      borderRadius: 9999,
                      backgroundColor: eqActive ? '#22c55e' : '#334155',
                      color: '#FFFFFF',
                      fontSize: 12,
                      fontWeight: 800,
                    }}
                  >
                    {eqActive ? 'Active' : 'Off'}
                  </div>
                </div>

                {/* Calculate CTA */}
                <div
                  style={{
                    marginTop: 10,
                    padding: '16px 24px',
                    borderRadius: 16,
                    backgroundColor: isCalculating ? '#0b3d26' : '#0F5132',
                    border: '1px solid #22c55e',
                    textAlign: 'center',
                    fontSize: 16,
                    fontWeight: 900,
                    color: '#FFFFFF',
                    boxShadow: '0 10px 25px rgba(15, 81, 50, 0.4)',
                  }}
                >
                  {isCalculating ? 'Computing Pure Statutory Rates...' : 'Calculate Pure Tariff Rates (60s) →'}
                </div>
              </div>
            </div>

            {/* ================================================================
                COMPARATIVE INSURER MATRIX (Scene 3)
            ================================================================ */}
            {showMatrix && (
              <div
                style={{
                  marginTop: 28,
                  paddingTop: 24,
                  borderTop: '1px solid rgba(255, 255, 255, 0.1)',
                  transform: `scale(${matrixSpring})`,
                  opacity: matrixSpring,
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                  <span style={{ fontSize: 14, fontWeight: 800, color: '#4ade80', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Multi-Insurer Comparison (4 Insurers Evaluated)
                  </span>
                  <span style={{ fontSize: 12, color: '#94a3b8' }}>
                    Zero Hallucination • 100% Deterministic IRDAI Formula
                  </span>
                </div>

                {/* 4 Cards Grid */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
                  {/* Tata AIG */}
                  <div style={{ padding: 18, borderRadius: 16, backgroundColor: 'rgba(255, 255, 255, 0.04)', border: '1px solid rgba(255, 255, 255, 0.1)' }}>
                    <div style={{ fontSize: 14, fontWeight: 800, color: '#FFFFFF', marginBottom: 4 }}>Tata AIG</div>
                    <div style={{ fontSize: 11, color: '#94a3b8', marginBottom: 12 }}>Corporate Fire Policy</div>
                    <div style={{ fontSize: 22, fontWeight: 900, color: '#22c55e' }}>₹1,68,150</div>
                    <div style={{ fontSize: 11, color: '#64748b', marginTop: 4 }}>Net ₹1,42,500 + 18% GST</div>
                  </div>

                  {/* ICICI Lombard */}
                  <div style={{ padding: 18, borderRadius: 16, backgroundColor: 'rgba(255, 255, 255, 0.04)', border: '1px solid rgba(255, 255, 255, 0.1)' }}>
                    <div style={{ fontSize: 14, fontWeight: 800, color: '#FFFFFF', marginBottom: 4 }}>ICICI Lombard</div>
                    <div style={{ fontSize: 11, color: '#94a3b8', marginBottom: 12 }}>Bharat Laghu Udyam</div>
                    <div style={{ fontSize: 22, fontWeight: 900, color: '#22c55e' }}>₹1,74,876</div>
                    <div style={{ fontSize: 11, color: '#64748b', marginTop: 4 }}>Net ₹1,48,200 + 18% GST</div>
                  </div>

                  {/* The New India Assurance (PSU - Lowest) */}
                  <div style={{ padding: 18, borderRadius: 16, backgroundColor: 'rgba(15, 81, 50, 0.25)', border: '2px solid #22c55e', position: 'relative' }}>
                    <div style={{ position: 'absolute', top: -10, right: 12, backgroundColor: '#22c55e', color: '#000000', fontSize: 10, fontWeight: 900, padding: '2px 8px', borderRadius: 9999 }}>
                      BEST VALUE
                    </div>
                    <div style={{ fontSize: 14, fontWeight: 800, color: '#FFFFFF', marginBottom: 4 }}>New India (PSU)</div>
                    <div style={{ fontSize: 11, color: '#4ade80', marginBottom: 12 }}>Sovereign Commercial</div>
                    <div style={{ fontSize: 22, fontWeight: 900, color: '#4ade80' }}>₹1,61,424</div>
                    <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 4 }}>Net ₹1,36,800 + 18% GST</div>
                  </div>

                  {/* Bajaj Allianz */}
                  <div style={{ padding: 18, borderRadius: 16, backgroundColor: 'rgba(255, 255, 255, 0.04)', border: '1px solid rgba(255, 255, 255, 0.1)' }}>
                    <div style={{ fontSize: 14, fontWeight: 800, color: '#FFFFFF', marginBottom: 4 }}>Bajaj Allianz</div>
                    <div style={{ fontSize: 11, color: '#94a3b8', marginBottom: 12 }}>Industrial Risk Cover</div>
                    <div style={{ fontSize: 22, fontWeight: 900, color: '#22c55e' }}>₹1,78,180</div>
                    <div style={{ fontSize: 11, color: '#64748b', marginTop: 4 }}>Net ₹1,51,000 + 18% GST</div>
                  </div>
                </div>

                {/* Export CTA Button */}
                <div style={{ marginTop: 20, display: 'flex', justifyContent: 'flex-end' }}>
                  <div
                    style={{
                      padding: '12px 28px',
                      borderRadius: 14,
                      backgroundColor: '#22c55e',
                      color: '#000000',
                      fontSize: 14,
                      fontWeight: 900,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                      boxShadow: '0 8px 20px rgba(34, 197, 94, 0.3)',
                    }}
                  >
                    <span>📄 Export Client Quote Slip (PDF)</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </AbsoluteFill>
      )}

      {/* ====================================================================
          SCENE 4: 1-CLICK PDF QUOTE SLIP PREVIEW (Frames 900 - 1170)
      ==================================================================== */}
      {showPdfExport && frame < 1170 && (
        <AbsoluteFill
          style={{
            opacity: pdfOpacity,
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            backgroundColor: 'rgba(10, 13, 18, 0.85)',
            backdropFilter: 'blur(12px)',
            zIndex: 40,
          }}
        >
          <div
            style={{
              width: 860,
              backgroundColor: '#FFFFFF',
              color: '#0f172a',
              borderRadius: 16,
              padding: 40,
              boxShadow: '0 30px 100px rgba(0, 0, 0, 0.9)',
              transform: `scale(${pdfScale})`,
              fontFamily: 'system-ui, -apple-system, sans-serif',
            }}
          >
            {/* PDF Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '2px solid #0F5132', paddingBottom: 16, marginBottom: 20 }}>
              <div>
                <h3 style={{ fontSize: 20, fontWeight: 900, color: '#0F5132', margin: 0 }}>
                  COMMERCIAL INSURANCE PROPOSAL COMPARISON SLIP
                </h3>
                <p style={{ fontSize: 11, color: '#64748b', margin: '4px 0 0 0' }}>
                  Issued by Capital Brokers Pvt. Ltd. • IRDAI Registered Intermediary
                </p>
              </div>
              <div style={{ textAlign: 'right' }}>
                <span style={{ fontSize: 12, fontWeight: 800, color: '#0F5132' }}>SLIP #QTL-2026-8819</span>
                <div style={{ fontSize: 10, color: '#94a3b8' }}>Generated: 14 Nov 2026</div>
              </div>
            </div>

            {/* Client Risk Details */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, backgroundColor: '#f8fafc', padding: 14, borderRadius: 10, marginBottom: 20 }}>
              <div>
                <span style={{ fontSize: 10, color: '#64748b', display: 'block' }}>PROPOSED CLIENT</span>
                <strong style={{ fontSize: 13, color: '#0f172a' }}>Adani Logistics Warehouse Park</strong>
              </div>
              <div>
                <span style={{ fontSize: 10, color: '#64748b', display: 'block' }}>SUM INSURED (IDV)</span>
                <strong style={{ fontSize: 13, color: '#0F5132' }}>₹50,00,00,000 (Fifty Crores)</strong>
              </div>
              <div>
                <span style={{ fontSize: 10, color: '#64748b', display: 'block' }}>EXTENSIONS OPTED</span>
                <strong style={{ fontSize: 13, color: '#0f172a' }}>STFI + Earthquake (Zone II)</strong>
              </div>
            </div>

            {/* Table */}
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12, marginBottom: 20 }}>
              <thead>
                <tr style={{ backgroundColor: '#0F5132', color: '#FFFFFF', textAlign: 'left' }}>
                  <th style={{ padding: '8px 12px' }}>Insurer</th>
                  <th style={{ padding: '8px 12px' }}>Coverage Form</th>
                  <th style={{ padding: '8px 12px' }}>Net OD</th>
                  <th style={{ padding: '8px 12px' }}>GST (18%)</th>
                  <th style={{ padding: '8px 12px' }}>Gross Premium</th>
                </tr>
              </thead>
              <tbody>
                <tr style={{ borderBottom: '1px solid #e2e8f0', backgroundColor: '#f0fdf4' }}>
                  <td style={{ padding: '8px 12px', fontWeight: 800 }}>The New India Assurance</td>
                  <td style={{ padding: '8px 12px' }}>Sovereign Commercial</td>
                  <td style={{ padding: '8px 12px' }}>₹1,36,800</td>
                  <td style={{ padding: '8px 12px' }}>₹24,624</td>
                  <td style={{ padding: '8px 12px', fontWeight: 900, color: '#0F5132' }}>₹1,61,424 (Lowest)</td>
                </tr>
                <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
                  <td style={{ padding: '8px 12px' }}>Tata AIG General</td>
                  <td style={{ padding: '8px 12px' }}>Corporate Fire</td>
                  <td style={{ padding: '8px 12px' }}>₹1,42,500</td>
                  <td style={{ padding: '8px 12px' }}>₹25,650</td>
                  <td style={{ padding: '8px 12px', fontWeight: 700 }}>₹1,68,150</td>
                </tr>
                <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
                  <td style={{ padding: '8px 12px' }}>ICICI Lombard General</td>
                  <td style={{ padding: '8px 12px' }}>Bharat Laghu Udyam</td>
                  <td style={{ padding: '8px 12px' }}>₹1,48,200</td>
                  <td style={{ padding: '8px 12px' }}>₹26,676</td>
                  <td style={{ padding: '8px 12px', fontWeight: 700 }}>₹1,74,876</td>
                </tr>
              </tbody>
            </table>

            {/* Stamp Badge */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div
                style={{
                  border: '2px solid #0F5132',
                  padding: '6px 14px',
                  borderRadius: 8,
                  fontSize: 11,
                  fontWeight: 900,
                  color: '#0F5132',
                  textTransform: 'uppercase',
                }}
              >
                ✓ IRDAI Pure Tariff Math Verified
              </div>
              <div style={{ fontSize: 13, fontWeight: 900, color: '#0F5132' }}>
                READY TO SIGN IN 60 SECONDS
              </div>
            </div>
          </div>
        </AbsoluteFill>
      )}

      {/* ====================================================================
          SCENE 5: OUTRO & FOUNDER'S BETA ACCESS (Frames 1170 - 1350)
      ==================================================================== */}
      {frame >= 1160 && (
        <AbsoluteFill
          style={{
            opacity: outroOpacity,
            transform: `scale(${interpolate(outroSpring, [0, 1], [0.92, 1])})`,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            textAlign: 'center',
            padding: '0 120px',
            zIndex: 50,
          }}
        >
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 12,
              padding: '10px 24px',
              borderRadius: 9999,
              backgroundColor: 'rgba(15, 81, 50, 0.3)',
              border: '1px solid rgba(34, 197, 94, 0.5)',
              color: '#4ade80',
              fontSize: 16,
              fontWeight: 800,
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              marginBottom: 30,
            }}
          >
            <span>Exclusive Founder&apos;s Beta</span>
          </div>

          <h2
            style={{
              fontSize: 60,
              fontWeight: 900,
              lineHeight: 1.15,
              maxWidth: 1200,
              marginBottom: 20,
            }}
          >
            Get <span style={{ color: '#22c55e' }}>30 Days Free Full Access</span> for Your Brokerage.
          </h2>

          <p
            style={{
              fontSize: 24,
              color: '#94a3b8',
              maxWidth: 900,
              lineHeight: 1.5,
              marginBottom: 44,
            }}
          >
            Limited to 10–15 commercial brokerages in India. Run live Fire, Motor Fleet, and Marine quotes with zero commitment.
          </p>

          {/* Floating Mascot in Outro */}
          <div style={{ marginBottom: 16 }}>
            <Img
              src={staticFile('winged_money_character.png')}
              style={{
                width: 90,
                height: 90,
                objectFit: 'contain',
                transform: `translateY(${Math.sin(frame / 10) * 10}px)`,
                filter: 'drop-shadow(0 15px 25px rgba(0,0,0,0.6))',
              }}
            />
          </div>

          {/* Contact Box */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 40,
              padding: '24px 48px',
              borderRadius: 24,
              backgroundColor: '#161F2C',
              border: '1.5px solid rgba(34, 197, 94, 0.4)',
              boxShadow: '0 20px 50px rgba(0, 0, 0, 0.6)',
            }}
          >
            <div style={{ textAlign: 'left' }}>
              <div style={{ fontSize: 13, color: '#4ade80', fontWeight: 800, textTransform: 'uppercase' }}>
                Direct Founder Hotline &amp; WhatsApp
              </div>
              <div style={{ fontSize: 32, fontWeight: 900, color: '#FFFFFF', letterSpacing: '0.02em' }}>
                +91 9315218284
              </div>
            </div>

            <div style={{ height: 50, width: 1, backgroundColor: 'rgba(255, 255, 255, 0.15)' }} />

            <div style={{ textAlign: 'left' }}>
              <div style={{ fontSize: 13, color: '#94a3b8', fontWeight: 800, textTransform: 'uppercase' }}>
                Live Production Platform
              </div>
              <div style={{ fontSize: 28, fontWeight: 800, color: '#22c55e' }}>
                qoutely.vercel.app
              </div>
            </div>
          </div>
        </AbsoluteFill>
      )}

      {/* Animated Cursor overlay during demo */}
      {frame >= 250 && frame < 920 && (
        <MouseCursor x={cursorX} y={cursorY} isClicking={isClicking} />
      )}
    </AbsoluteFill>
  );
};
