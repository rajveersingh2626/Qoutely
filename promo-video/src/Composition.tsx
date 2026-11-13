import React from 'react';
import {
  AbsoluteFill,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
  Img,
  staticFile,
} from 'remotion';

// ============================================================================
// REUSABLE SNAPPY "WE GOT YOU" BADGE COMPONENT
// ============================================================================
const WeGotYouBadge: React.FC<{ frameOffset: number }> = ({ frameOffset }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const badgeSpring = spring({
    frame: frame - frameOffset,
    fps,
    config: { damping: 10, stiffness: 180 },
  });

  const scale = interpolate(badgeSpring, [0, 1], [0.4, 1]);
  const opacity = interpolate(frame - frameOffset, [0, 6], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  return (
    <div
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 12,
        padding: '12px 32px',
        borderRadius: 9999,
        backgroundColor: '#22c55e',
        color: '#052e16',
        fontSize: 32,
        fontWeight: 900,
        letterSpacing: '0.04em',
        textTransform: 'uppercase',
        boxShadow: '0 0 40px rgba(34, 197, 94, 0.7), 0 10px 20px rgba(0,0,0,0.5)',
        transform: `scale(${scale})`,
        opacity,
      }}
    >
      <span>⚡ WE GOT YOU.</span>
    </div>
  );
};

// ============================================================================
// MAIN FAST-PACED "NEED X? WE GOT YOU" VIDEO COMPOSITION (30s / 900 frames)
// ============================================================================
export const QoutelyLinkedInDemo: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // --------------------------------------------------------------------------
  // BEAT DEFINITIONS (Every ~120-140 frames / ~4 seconds)
  // --------------------------------------------------------------------------
  // Beat 0: 0 - 100   (The Hook: Spreadsheets & 5-day delays)
  // Beat 1: 100 - 240 (Need Fire & Property? We got you.)
  // Beat 2: 240 - 380 (Need 50-Truck Motor Fleet? We got you.)
  // Beat 3: 380 - 520 (Need Marine Cargo Transit? We got you.)
  // Beat 4: 520 - 660 (Need 4-Insurer Comparison? We got you.)
  // Beat 5: 660 - 790 (Need 1-Click PDF Proposal? We got you.)
  // Beat 6: 790 - 900 (Need 30 Days Free Beta? We got you.)

  return (
    <AbsoluteFill
      style={{
        backgroundColor: '#07090E',
        fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
        color: '#FFFFFF',
        overflow: 'hidden',
      }}
    >
      {/* Background Pulse Aura */}
      <div
        style={{
          position: 'absolute',
          top: -150,
          left: '20%',
          width: 1000,
          height: 1000,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(15, 81, 50, 0.35) 0%, rgba(7, 9, 14, 0) 70%)',
          filter: 'blur(90px)',
          transform: `scale(${1 + Math.sin(frame / 20) * 0.06})`,
        }}
      />

      {/* Floating Top Brand Pill */}
      <div
        style={{
          position: 'absolute',
          top: 36,
          left: 60,
          right: 60,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          zIndex: 100,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <Img
            src={staticFile('qoutely_logo.png')}
            style={{ width: 44, height: 44, objectFit: 'contain' }}
          />
          <div>
            <div style={{ fontSize: 22, fontWeight: 900, letterSpacing: '-0.02em' }}>Qoutely</div>
            <div style={{ fontSize: 11, color: '#4ade80', fontWeight: 700 }}>Commercial Underwriting Copilot</div>
          </div>
        </div>

        <div
          style={{
            backgroundColor: 'rgba(255, 255, 255, 0.06)',
            border: '1px solid rgba(255, 255, 255, 0.12)',
            padding: '8px 20px',
            borderRadius: 9999,
            fontSize: 13,
            fontWeight: 800,
            color: '#94a3b8',
          }}
        >
          IRDAI Deterministic Engine • 60-Second Quoting
        </div>
      </div>

      {/* ====================================================================
          BEAT 0: THE HOOK (0 - 100 frames / 0s - 3.3s)
      ==================================================================== */}
      {frame < 100 && (
        <AbsoluteFill
          style={{
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            textAlign: 'center',
            padding: '0 120px',
            opacity: interpolate(frame, [0, 15, 85, 100], [0, 1, 1, 0]),
            transform: `scale(${interpolate(frame, [0, 100], [0.95, 1.02])})`,
          }}
        >
          <div
            style={{
              padding: '8px 24px',
              borderRadius: 9999,
              backgroundColor: 'rgba(239, 68, 68, 0.2)',
              border: '1px solid rgba(239, 68, 68, 0.4)',
              color: '#f87171',
              fontSize: 16,
              fontWeight: 800,
              textTransform: 'uppercase',
              marginBottom: 24,
            }}
          >
            ⚠️ Attention Commercial Insurance Brokers
          </div>

          <h1 style={{ fontSize: 68, fontWeight: 900, lineHeight: 1.15, maxWidth: 1300, marginBottom: 24 }}>
            Still waiting <span style={{ color: '#ef4444' }}>3 to 5 days</span> for underwriters to quote a tender?
          </h1>

          <p style={{ fontSize: 28, color: '#94a3b8', maxWidth: 900 }}>
            Manual spreadsheets &amp; slow rate replies are costing you corporate clients.
          </p>
        </AbsoluteFill>
      )}

      {/* ====================================================================
          BEAT 1: NEED FIRE & PROPERTY? WE GOT YOU. (100 - 240 frames)
      ==================================================================== */}
      {frame >= 100 && frame < 240 && (
        <AbsoluteFill
          style={{
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            textAlign: 'center',
            padding: '0 100px',
            opacity: interpolate(frame, [100, 115, 225, 240], [0, 1, 1, 0]),
          }}
        >
          <div style={{ fontSize: 24, color: '#94a3b8', fontWeight: 800, textTransform: 'uppercase', marginBottom: 12 }}>
            Problem #1 • High-Value Industrial Property
          </div>

          <h2 style={{ fontSize: 62, fontWeight: 900, maxWidth: 1200, marginBottom: 30, lineHeight: 1.2 }}>
            Need Fire &amp; Property rates for a <span style={{ color: '#38bdf8' }}>₹50 Crore Factory</span>?
          </h2>

          <WeGotYouBadge frameOffset={125} />

          {/* Quick UI Snippet Card */}
          <div
            style={{
              marginTop: 40,
              display: 'flex',
              alignItems: 'center',
              gap: 32,
              padding: '20px 40px',
              borderRadius: 20,
              backgroundColor: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid rgba(34, 197, 94, 0.3)',
            }}
          >
            <div style={{ textAlign: 'left' }}>
              <div style={{ fontSize: 13, color: '#94a3b8', textTransform: 'uppercase' }}>Bharat Sookshma &amp; Laghu</div>
              <div style={{ fontSize: 26, fontWeight: 900, color: '#22c55e' }}>STFI + Earthquake Zone II</div>
            </div>
            <div style={{ width: 1, height: 45, backgroundColor: 'rgba(255,255,255,0.1)' }} />
            <div style={{ textAlign: 'left' }}>
              <div style={{ fontSize: 13, color: '#94a3b8', textTransform: 'uppercase' }}>Turnaround Speed</div>
              <div style={{ fontSize: 26, fontWeight: 900, color: '#FFFFFF' }}>Instant (60 Seconds)</div>
            </div>
          </div>
        </AbsoluteFill>
      )}

      {/* ====================================================================
          BEAT 2: NEED COMMERCIAL FLEET? WE GOT YOU. (240 - 380 frames)
      ==================================================================== */}
      {frame >= 240 && frame < 380 && (
        <AbsoluteFill
          style={{
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            textAlign: 'center',
            padding: '0 100px',
            opacity: interpolate(frame, [240, 255, 365, 380], [0, 1, 1, 0]),
          }}
        >
          <div style={{ fontSize: 24, color: '#94a3b8', fontWeight: 800, textTransform: 'uppercase', marginBottom: 12 }}>
            Problem #2 • Multi-Vehicle Commercial Fleet
          </div>

          <h2 style={{ fontSize: 62, fontWeight: 900, maxWidth: 1200, marginBottom: 30, lineHeight: 1.2 }}>
            Need Motor Fleet rating across <span style={{ color: '#fbbf24' }}>50 Heavy Commercial Trucks</span>?
          </h2>

          <WeGotYouBadge frameOffset={265} />

          {/* Quick UI Snippet Card */}
          <div
            style={{
              marginTop: 40,
              display: 'flex',
              alignItems: 'center',
              gap: 32,
              padding: '20px 40px',
              borderRadius: 20,
              backgroundColor: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid rgba(34, 197, 94, 0.3)',
            }}
          >
            <div style={{ textAlign: 'left' }}>
              <div style={{ fontSize: 13, color: '#94a3b8', textTransform: 'uppercase' }}>AIMT GR.8 Depreciation</div>
              <div style={{ fontSize: 26, fontWeight: 900, color: '#22c55e' }}>IMT 23 + Zero Dep + Statutory TP</div>
            </div>
            <div style={{ width: 1, height: 45, backgroundColor: 'rgba(255,255,255,0.1)' }} />
            <div style={{ textAlign: 'left' }}>
              <div style={{ fontSize: 13, color: '#94a3b8', textTransform: 'uppercase' }}>Fleet Size</div>
              <div style={{ fontSize: 26, fontWeight: 900, color: '#FFFFFF' }}>Bulk Excel Upload (1 Click)</div>
            </div>
          </div>
        </AbsoluteFill>
      )}

      {/* ====================================================================
          BEAT 3: NEED MARINE CARGO? WE GOT YOU. (380 - 520 frames)
      ==================================================================== */}
      {frame >= 380 && frame < 520 && (
        <AbsoluteFill
          style={{
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            textAlign: 'center',
            padding: '0 100px',
            opacity: interpolate(frame, [380, 395, 505, 520], [0, 1, 1, 0]),
          }}
        >
          <div style={{ fontSize: 24, color: '#94a3b8', fontWeight: 800, textTransform: 'uppercase', marginBottom: 12 }}>
            Problem #3 • Transit Risk &amp; Export Shipments
          </div>

          <h2 style={{ fontSize: 62, fontWeight: 900, maxWidth: 1200, marginBottom: 30, lineHeight: 1.2 }}>
            Need Inland &amp; Ocean <span style={{ color: '#818cf8' }}>Marine Cargo Transit Cover</span>?
          </h2>

          <WeGotYouBadge frameOffset={405} />

          {/* Quick UI Snippet Card */}
          <div
            style={{
              marginTop: 40,
              display: 'flex',
              alignItems: 'center',
              gap: 32,
              padding: '20px 40px',
              borderRadius: 20,
              backgroundColor: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid rgba(34, 197, 94, 0.3)',
            }}
          >
            <div style={{ textAlign: 'left' }}>
              <div style={{ fontSize: 13, color: '#94a3b8', textTransform: 'uppercase' }}>Clause Engineering</div>
              <div style={{ fontSize: 26, fontWeight: 900, color: '#22c55e' }}>ITC-A / ICC-A + Incoterms CIF</div>
            </div>
            <div style={{ width: 1, height: 45, backgroundColor: 'rgba(255,255,255,0.1)' }} />
            <div style={{ textAlign: 'left' }}>
              <div style={{ fontSize: 13, color: '#94a3b8', textTransform: 'uppercase' }}>Carrier Validation</div>
              <div style={{ fontSize: 26, fontWeight: 900, color: '#FFFFFF' }}>IBA Certified Discount Included</div>
            </div>
          </div>
        </AbsoluteFill>
      )}

      {/* ====================================================================
          BEAT 4: NEED MULTI-INSURER COMPARISON? WE GOT YOU. (520 - 660 frames)
      ==================================================================== */}
      {frame >= 520 && frame < 660 && (
        <AbsoluteFill
          style={{
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            textAlign: 'center',
            padding: '0 80px',
            opacity: interpolate(frame, [520, 535, 645, 660], [0, 1, 1, 0]),
          }}
        >
          <div style={{ fontSize: 22, color: '#94a3b8', fontWeight: 800, textTransform: 'uppercase', marginBottom: 10 }}>
            Problem #4 • Comparative Insurer Negotiations
          </div>

          <h2 style={{ fontSize: 56, fontWeight: 900, maxWidth: 1200, marginBottom: 24, lineHeight: 1.2 }}>
            Need real rates compared across <span style={{ color: '#22c55e' }}>Top Indian Insurers</span>?
          </h2>

          <WeGotYouBadge frameOffset={545} />

          {/* 4 Cards Row */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 18, marginTop: 32, width: '100%', maxWidth: 1200 }}>
            <div style={{ padding: 20, borderRadius: 18, backgroundColor: '#131822', border: '1px solid rgba(255,255,255,0.1)' }}>
              <div style={{ fontSize: 14, fontWeight: 800, color: '#94a3b8' }}>Tata AIG</div>
              <div style={{ fontSize: 26, fontWeight: 900, color: '#FFFFFF', margin: '8px 0' }}>₹1,68,150</div>
              <div style={{ fontSize: 11, color: '#22c55e' }}>Corporate Fire Policy</div>
            </div>

            <div style={{ padding: 20, borderRadius: 18, backgroundColor: '#131822', border: '1px solid rgba(255,255,255,0.1)' }}>
              <div style={{ fontSize: 14, fontWeight: 800, color: '#94a3b8' }}>ICICI Lombard</div>
              <div style={{ fontSize: 26, fontWeight: 900, color: '#FFFFFF', margin: '8px 0' }}>₹1,74,876</div>
              <div style={{ fontSize: 11, color: '#22c55e' }}>Bharat Laghu Udyam</div>
            </div>

            <div style={{ padding: 20, borderRadius: 18, backgroundColor: 'rgba(15, 81, 50, 0.4)', border: '2px solid #22c55e' }}>
              <div style={{ fontSize: 14, fontWeight: 800, color: '#4ade80' }}>New India (PSU)</div>
              <div style={{ fontSize: 26, fontWeight: 900, color: '#4ade80', margin: '8px 0' }}>₹1,61,424</div>
              <div style={{ fontSize: 11, color: '#86efac' }}>★ Lowest Sovereign Rate</div>
            </div>

            <div style={{ padding: 20, borderRadius: 18, backgroundColor: '#131822', border: '1px solid rgba(255,255,255,0.1)' }}>
              <div style={{ fontSize: 14, fontWeight: 800, color: '#94a3b8' }}>Bajaj Allianz</div>
              <div style={{ fontSize: 26, fontWeight: 900, color: '#FFFFFF', margin: '8px 0' }}>₹1,78,180</div>
              <div style={{ fontSize: 11, color: '#22c55e' }}>Industrial Risk Cover</div>
            </div>
          </div>
        </AbsoluteFill>
      )}

      {/* ====================================================================
          BEAT 5: NEED 1-CLICK CLIENT PDF SLIP? WE GOT YOU. (660 - 790 frames)
      ==================================================================== */}
      {frame >= 660 && frame < 790 && (
        <AbsoluteFill
          style={{
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            textAlign: 'center',
            padding: '0 100px',
            opacity: interpolate(frame, [660, 675, 775, 790], [0, 1, 1, 0]),
          }}
        >
          <div style={{ fontSize: 24, color: '#94a3b8', fontWeight: 800, textTransform: 'uppercase', marginBottom: 12 }}>
            Problem #5 • Client Presentation
          </div>

          <h2 style={{ fontSize: 60, fontWeight: 900, maxWidth: 1200, marginBottom: 28, lineHeight: 1.2 }}>
            Need a branded <span style={{ color: '#f43f5e' }}>Client Quote Slip PDF</span> ready for the CFO?
          </h2>

          <WeGotYouBadge frameOffset={680} />

          {/* PDF Preview Snapshot */}
          <div
            style={{
              marginTop: 36,
              padding: '24px 44px',
              borderRadius: 20,
              backgroundColor: '#FFFFFF',
              color: '#0f172a',
              boxShadow: '0 25px 70px rgba(0,0,0,0.8)',
              display: 'flex',
              alignItems: 'center',
              gap: 40,
            }}
          >
            <div style={{ textAlign: 'left' }}>
              <div style={{ fontSize: 12, fontWeight: 800, color: '#0F5132' }}>EXECUTIVE QUOTE SLIP #QTL-2026-8819</div>
              <div style={{ fontSize: 22, fontWeight: 900, color: '#0f172a' }}>Adani Logistics Warehouse Park (₹50 Cr IDV)</div>
              <div style={{ fontSize: 12, color: '#64748b' }}>Complete 4-Insurer Comparative Matrix &amp; Deductibles Included</div>
            </div>
            <div
              style={{
                padding: '10px 20px',
                borderRadius: 12,
                backgroundColor: '#0F5132',
                color: '#FFFFFF',
                fontSize: 14,
                fontWeight: 900,
              }}
            >
              ✓ READY TO SIGN
            </div>
          </div>
        </AbsoluteFill>
      )}

      {/* ====================================================================
          BEAT 6: NEED 30-DAY FREE ACCESS? WE GOT YOU. (790 - 900 frames / 26s - 30s)
      ==================================================================== */}
      {frame >= 790 && (
        <AbsoluteFill
          style={{
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            textAlign: 'center',
            padding: '0 100px',
            opacity: interpolate(frame, [790, 805], [0, 1]),
          }}
        >
          {/* Winged Money Mascot */}
          <Img
            src={staticFile('winged_money_character.png')}
            style={{
              width: 90,
              height: 90,
              objectFit: 'contain',
              marginBottom: 16,
              transform: `translateY(${Math.sin(frame / 10) * 8}px)`,
              filter: 'drop-shadow(0 15px 25px rgba(0,0,0,0.6))',
            }}
          />

          <h2 style={{ fontSize: 56, fontWeight: 900, maxWidth: 1200, marginBottom: 20, lineHeight: 1.15 }}>
            Need 30 Days Free Access for your Brokerage? <br />
            <span style={{ color: '#22c55e' }}>WE GOT YOU.</span>
          </h2>

          <p style={{ fontSize: 22, color: '#94a3b8', maxWidth: 850, marginBottom: 36 }}>
            Exclusive Founder&apos;s Beta for 10–15 commercial brokerages in India. Run live quotes with zero fees.
          </p>

          {/* Contact Box */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 40,
              padding: '20px 48px',
              borderRadius: 24,
              backgroundColor: '#131822',
              border: '2px solid #22c55e',
              boxShadow: '0 20px 50px rgba(0, 0, 0, 0.7)',
            }}
          >
            <div style={{ textAlign: 'left' }}>
              <div style={{ fontSize: 12, color: '#4ade80', fontWeight: 800, textTransform: 'uppercase' }}>
                WhatsApp / Call Founder Direct
              </div>
              <div style={{ fontSize: 32, fontWeight: 900, color: '#FFFFFF', letterSpacing: '0.02em' }}>
                +91 9315218284
              </div>
            </div>

            <div style={{ height: 45, width: 1, backgroundColor: 'rgba(255, 255, 255, 0.15)' }} />

            <div style={{ textAlign: 'left' }}>
              <div style={{ fontSize: 12, color: '#94a3b8', fontWeight: 800, textTransform: 'uppercase' }}>
                Try Live Platform
              </div>
              <div style={{ fontSize: 28, fontWeight: 800, color: '#22c55e' }}>
                qoutely.vercel.app
              </div>
            </div>
          </div>
        </AbsoluteFill>
      )}
    </AbsoluteFill>
  );
};
