import React, { useState } from 'react';
import {
  Network,
  Copy,
  Check,
  Award,
  Share2,
  RefreshCw,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Eye,
  EyeOff,
  Maximize2
} from 'lucide-react';
import { MlmNodeRecord, AffiliateStats } from '../services/affiliateService';

interface MlmTreeVisualizerProps {
  treeData?: MlmNodeRecord | null;
  stats?: AffiliateStats | null;
  isLoading?: boolean;
  onRefresh?: () => void;
  hideDuplicateHeader?: boolean;
}

interface TreeNodeItemProps {
  node?: MlmNodeRecord | null;
  positionLabel: string;
  depth: number;
  maxDepth: number;
  displayRootId: string;
  onNodeClick: (node: MlmNodeRecord) => void;
  showVacantSpots: boolean;
}

const TreeNodeItem: React.FC<TreeNodeItemProps> = ({
  node,
  positionLabel,
  depth,
  maxDepth,
  displayRootId,
  onNodeClick,
  showVacantSpots
}) => {
  // If slot is empty/vacant
  if (!node || node.userId === 'VACANT') {
    if (!showVacantSpots) {
      return null;
    }
    return (
      <div style={{
        border: '1.5px dashed var(--border-color)',
        borderRadius: '10px',
        padding: '6px 12px',
        textAlign: 'center',
        color: 'var(--text-muted)',
        fontSize: '0.72rem',
        minWidth: '105px',
        background: 'var(--bg-surface)',
        marginTop: '2px'
      }}>
        + Vacant ({positionLabel})
      </div>
    );
  }

  const isFocused = displayRootId === node.id;
  const leftChild = node.leftLeg;
  const rightChild = node.rightLeg;

  const hasRealLeft = Boolean(leftChild && leftChild.userId !== 'VACANT');
  const hasRealRight = Boolean(rightChild && rightChild.userId !== 'VACANT');

  // When compact (showVacantSpots=false), only render branches that actually have members
  const shouldRenderLeft = depth < maxDepth && (hasRealLeft || (showVacantSpots && (hasRealLeft || hasRealRight)));
  const shouldRenderRight = depth < maxDepth && (hasRealRight || (showVacantSpots && (hasRealLeft || hasRealRight)));
  const hasAnyChildToRender = shouldRenderLeft || shouldRenderRight;
  const hasBothChildren = shouldRenderLeft && shouldRenderRight;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      {/* Node Card */}
      <div
        onClick={() => onNodeClick(node)}
        className="glass-card"
        title="Click node to focus and inspect its downline tree"
        style={{
          padding: '10px 14px',
          border: isFocused ? '2px solid var(--primary-accent)' : '1.5px solid var(--border-color)',
          background: isFocused ? 'var(--badge-primary-bg)' : 'var(--bg-card)',
          cursor: 'pointer',
          minWidth: '135px',
          maxWidth: '165px',
          textAlign: 'center',
          borderRadius: '12px',
          transition: 'all 0.2s ease',
          boxShadow: isFocused ? '0 0 16px rgba(99,102,241,0.35)' : 'var(--shadow-card)',
          userSelect: 'none'
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '4px', marginBottom: '3px' }}>
          <span className="badge badge-emerald" style={{ fontSize: '0.62rem', padding: '1px 6px', fontWeight: '700' }}>
            {node.rank || 'BRONZE'}
          </span>
          <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', fontWeight: '700' }}>
            {positionLabel}
          </span>
        </div>

        <div style={{
          fontWeight: '800',
          fontSize: '0.88rem',
          color: 'var(--text-primary)',
          marginBottom: '1px',
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis'
        }}>
          {node.name}
        </div>

        <div style={{
          fontSize: '0.68rem',
          color: 'var(--text-secondary)',
          marginBottom: '5px',
          fontFamily: 'monospace',
          background: 'var(--bg-surface)',
          padding: '1px 5px',
          borderRadius: '4px',
          display: 'inline-block'
        }}>
          ID: {node.userId}
        </div>

        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          fontSize: '0.68rem',
          padding: '3px 6px',
          borderRadius: '6px',
          background: 'var(--bg-surface)',
          border: '1px solid var(--border-color)'
        }}>
          <span>L: <strong style={{ color: 'var(--badge-emerald-color)' }}>{node.leftVolume || 0} PV</strong></span>
          <span style={{ color: 'var(--border-color)' }}>|</span>
          <span>R: <strong style={{ color: 'var(--primary-accent)' }}>{node.rightVolume || 0} PV</strong></span>
        </div>
      </div>

      {/* Render Child Branches Recursively */}
      {hasAnyChildToRender && (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%' }}>
          {/* Vertical stem from parent */}
          <div style={{ width: '2px', height: '14px', background: 'var(--primary-accent)' }} />

          {/* Horizontal crossbar bridge when both branches are rendered */}
          {hasBothChildren && (
            <div style={{
              display: 'flex',
              width: '100%',
              justifyContent: 'center'
            }}>
              <div style={{
                width: '65%',
                minWidth: '100px',
                height: '2px',
                background: 'var(--primary-accent)'
              }} />
            </div>
          )}

          {/* Children container */}
          <div style={{
            display: 'flex',
            gap: hasBothChildren ? '20px' : '0px',
            justifyContent: 'center',
            alignItems: 'flex-start',
            flexWrap: 'nowrap'
          }}>
            {shouldRenderLeft && (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <div style={{ width: '2px', height: '12px', background: 'var(--primary-accent)' }} />
                <TreeNodeItem
                  node={leftChild}
                  positionLabel="L"
                  depth={depth + 1}
                  maxDepth={maxDepth}
                  displayRootId={displayRootId}
                  onNodeClick={onNodeClick}
                  showVacantSpots={showVacantSpots}
                />
              </div>
            )}

            {shouldRenderRight && (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <div style={{ width: '2px', height: '12px', background: 'var(--primary-accent)' }} />
                <TreeNodeItem
                  node={rightChild}
                  positionLabel="R"
                  depth={depth + 1}
                  maxDepth={maxDepth}
                  displayRootId={displayRootId}
                  onNodeClick={onNodeClick}
                  showVacantSpots={showVacantSpots}
                />
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export const MlmTreeVisualizer: React.FC<MlmTreeVisualizerProps> = ({
  treeData,
  stats,
  isLoading,
  onRefresh,
  hideDuplicateHeader = false
}) => {
  const [copied, setCopied] = useState(false);
  const [focusedNode, setFocusedNode] = useState<MlmNodeRecord | null>(null);
  const [zoomLevel, setZoomLevel] = useState<number>(1);
  const [showVacantSpots, setShowVacantSpots] = useState<boolean>(false);
  const [maxDepth, setMaxDepth] = useState<number>(4);

  const copyReferralLink = () => {
    const currentOrigin = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000';
    let link = stats?.referralLink || `${currentOrigin}/register?ref=${stats?.referralCode || 'EDU-99201'}`;
    if (currentOrigin.includes('localhost') || currentOrigin.includes('127.0.0.1')) {
      link = link.replace('https://eduverse.in', currentOrigin);
    }
    navigator.clipboard.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleZoomIn = () => {
    setZoomLevel(prev => Math.min(1.5, Number((prev + 0.15).toFixed(2))));
  };

  const handleZoomOut = () => {
    setZoomLevel(prev => Math.max(0.4, Number((prev - 0.15).toFixed(2))));
  };

  const handleZoomReset = () => {
    setZoomLevel(1);
  };

  const handleZoomFit = () => {
    setZoomLevel(0.75);
  };

  const displayRoot = focusedNode || treeData;

  return (
    <div>
      {/* Top Overview Cards (rendered only when not embedded in Affiliate Portal) */}
      {!hideDuplicateHeader && (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '20px' }}>
            <div className="glass-card" style={{ padding: '18px', background: 'var(--bg-card)', borderRadius: '16px', border: '1.5px solid var(--border-color)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--primary-accent)', fontWeight: '700', fontSize: '0.8rem', marginBottom: '4px' }}>
                <Award size={16} /> YOUR CURRENT RANK
              </div>
              <div style={{ fontSize: '1.5rem', fontWeight: '800', color: 'var(--text-primary)' }}>{stats?.rank || 'BRONZE'} PARTNER</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px' }}>Matching Bonus: 10% Weaker Leg Volume</div>
            </div>

            <div className="glass-card" style={{ padding: '18px', borderRadius: '16px', border: '1.5px solid var(--border-color)' }}>
              <div style={{ fontSize: '0.78rem', color: 'var(--badge-emerald-color)', fontWeight: '700', marginBottom: '4px' }}>
                LEFT LEG VOLUME (PV)
              </div>
              <div style={{ fontSize: '1.5rem', fontWeight: '800', color: 'var(--badge-emerald-color)' }}>
                {stats ? stats.leftVolume.toLocaleString('en-IN') : 0} PV
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px' }}>Left Downline Accumulation</div>
            </div>

            <div className="glass-card" style={{ padding: '18px', borderRadius: '16px', border: '1.5px solid var(--border-color)' }}>
              <div style={{ fontSize: '0.78rem', color: 'var(--primary-accent)', fontWeight: '700', marginBottom: '4px' }}>
                RIGHT LEG VOLUME (PV)
              </div>
              <div style={{ fontSize: '1.5rem', fontWeight: '800', color: 'var(--primary-accent)' }}>
                {stats ? stats.rightVolume.toLocaleString('en-IN') : 0} PV
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px' }}>Right Downline Accumulation</div>
            </div>

            <div className="glass-card" style={{ padding: '18px', borderRadius: '16px', border: '1.5px solid var(--border-color)' }}>
              <div style={{ fontSize: '0.78rem', color: 'var(--badge-amber-color)', fontWeight: '700', marginBottom: '4px' }}>
                ESTIMATED MATCHING BONUS
              </div>
              <div style={{ fontSize: '1.5rem', fontWeight: '800', color: 'var(--badge-amber-color)' }}>
                ₹ {stats ? (stats.estimatedMatchingBonus || 0).toLocaleString('en-IN') : 0}.00
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px' }}>10% Weaker Leg Balance</div>
            </div>
          </div>

          <div className="glass-card" style={{ padding: '14px 20px', marginBottom: '20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px', borderRadius: '14px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Share2 size={20} color="var(--primary-accent)" />
              <div>
                <div style={{ fontWeight: '700', fontSize: '0.9rem' }}>Your Binary Referral Share Link</div>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                  Referral Code: <strong style={{ color: 'var(--text-primary)' }}>{stats?.referralCode || 'EDU-99201'}</strong> • Direct Referrals: <strong style={{ color: 'var(--text-primary)' }}>{stats?.directReferralsCount || 0} Members</strong>
                </div>
              </div>
            </div>

            <button className="btn-primary" onClick={copyReferralLink} style={{ fontSize: '0.8rem', padding: '6px 14px' }}>
              {copied ? <Check size={14} /> : <Copy size={14} />}
              {copied ? 'Link Copied!' : 'Copy Referral Link'}
            </button>
          </div>
        </>
      )}

      {/* Visual Binary Tree Display Card */}
      <div className="glass-card" style={{ padding: '20px', borderRadius: '16px', border: '1.5px solid var(--border-color)' }}>
        {/* Header Title & Breadcrumb */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px', flexWrap: 'wrap' }}>
              <span className="badge badge-primary" style={{ fontSize: '0.72rem', padding: '2px 8px', fontWeight: '700' }}>
                <Network size={12} /> RECURSIVE DYNAMIC BINARY TREE VISUALIZER
              </span>
              {focusedNode && (
                <span className="badge badge-amber" style={{ fontSize: '0.72rem', padding: '2px 8px', display: 'flex', alignItems: 'center', gap: '4px', fontWeight: '700' }}>
                  <ZoomIn size={12} /> Focused on: {focusedNode.name} ({focusedNode.userId})
                </span>
              )}
            </div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: '800', margin: '2px 0' }}>
              Downline Tree & Binary Network
            </h2>
            <div style={{ fontSize: '0.76rem', color: 'var(--text-secondary)' }}>
              💡 Click any member node to drill down into their personal downline tree.
            </div>
          </div>

          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
            {focusedNode && (
              <button
                type="button"
                className="btn-amber"
                onClick={() => setFocusedNode(null)}
                style={{ fontSize: '0.78rem', padding: '6px 12px', display: 'flex', alignItems: 'center', gap: '4px' }}
              >
                <RotateCcw size={14} /> Reset View to Root
              </button>
            )}

            <button
              type="button"
              className="btn-secondary"
              onClick={onRefresh}
              style={{ fontSize: '0.78rem', padding: '6px 12px', display: 'flex', alignItems: 'center', gap: '4px' }}
            >
              <RefreshCw size={14} className={isLoading ? 'spin' : ''} /> Reload Tree
            </button>
          </div>
        </div>

        {/* Interactive Controls Toolbar: Zoom, Depth, Vacant Spots */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '10px',
          padding: '10px 14px',
          background: 'var(--bg-surface)',
          borderRadius: '12px',
          marginBottom: '16px',
          border: '1px solid var(--border-color)'
        }}>
          {/* Zoom controls */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ fontSize: '0.74rem', fontWeight: '700', color: 'var(--text-muted)' }}>Zoom:</span>
            <button
              type="button"
              onClick={handleZoomOut}
              title="Zoom Out (-15%)"
              style={{
                background: 'var(--bg-card)',
                border: '1px solid var(--border-color)',
                borderRadius: '6px',
                padding: '4px 8px',
                cursor: 'pointer',
                fontSize: '0.75rem',
                color: 'var(--text-primary)',
                display: 'flex',
                alignItems: 'center'
              }}
            >
              <ZoomOut size={13} />
            </button>
            <span style={{
              fontSize: '0.75rem',
              fontWeight: '800',
              color: 'var(--primary-accent)',
              minWidth: '42px',
              textAlign: 'center',
              userSelect: 'none'
            }}>
              {Math.round(zoomLevel * 100)}%
            </span>
            <button
              type="button"
              onClick={handleZoomIn}
              title="Zoom In (+15%)"
              style={{
                background: 'var(--bg-card)',
                border: '1px solid var(--border-color)',
                borderRadius: '6px',
                padding: '4px 8px',
                cursor: 'pointer',
                fontSize: '0.75rem',
                color: 'var(--text-primary)',
                display: 'flex',
                alignItems: 'center'
              }}
            >
              <ZoomIn size={13} />
            </button>
            <button
              type="button"
              onClick={handleZoomReset}
              title="Reset to 100%"
              style={{
                background: 'var(--bg-card)',
                border: '1px solid var(--border-color)',
                borderRadius: '6px',
                padding: '4px 8px',
                cursor: 'pointer',
                fontSize: '0.72rem',
                color: 'var(--text-secondary)',
                fontWeight: '600'
              }}
            >
              100%
            </button>
            <button
              type="button"
              onClick={handleZoomFit}
              title="Fit View (75%)"
              style={{
                background: 'var(--bg-card)',
                border: '1px solid var(--border-color)',
                borderRadius: '6px',
                padding: '4px 8px',
                cursor: 'pointer',
                fontSize: '0.72rem',
                color: 'var(--text-secondary)',
                fontWeight: '600',
                display: 'flex',
                alignItems: 'center',
                gap: '3px'
              }}
            >
              <Maximize2 size={12} /> Fit
            </button>
          </div>

          {/* Depth / Levels Filter */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ fontSize: '0.74rem', fontWeight: '700', color: 'var(--text-muted)' }}>Levels:</span>
            {[3, 4, 5, 20].map((lvl) => (
              <button
                key={lvl}
                type="button"
                onClick={() => setMaxDepth(lvl)}
                style={{
                  padding: '3px 8px',
                  borderRadius: '6px',
                  border: maxDepth === lvl ? '1.5px solid var(--primary-accent)' : '1px solid var(--border-color)',
                  background: maxDepth === lvl ? 'var(--badge-primary-bg)' : 'var(--bg-card)',
                  color: maxDepth === lvl ? 'var(--primary-accent)' : 'var(--text-secondary)',
                  fontWeight: '700',
                  fontSize: '0.72rem',
                  cursor: 'pointer'
                }}
              >
                {lvl === 20 ? 'All' : `${lvl}`}
              </button>
            ))}
          </div>

          {/* Toggle Vacant Spots */}
          <button
            type="button"
            onClick={() => setShowVacantSpots(prev => !prev)}
            style={{
              padding: '4px 10px',
              borderRadius: '8px',
              border: showVacantSpots ? '1.5px solid var(--badge-amber-color)' : '1px solid var(--border-color)',
              background: showVacantSpots ? 'var(--badge-amber-bg)' : 'var(--bg-card)',
              color: showVacantSpots ? 'var(--badge-amber-color)' : 'var(--text-secondary)',
              fontWeight: '700',
              fontSize: '0.74rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '5px'
            }}
          >
            {showVacantSpots ? <Eye size={13} /> : <EyeOff size={13} />}
            {showVacantSpots ? 'Vacant Slots: ON' : 'Compact (Active Only)'}
          </button>
        </div>

        {/* Tree Render Structure inside Scrollable & Zoomable Viewport */}
        {isLoading ? (
          <div style={{ padding: '60px 20px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
            <RefreshCw size={24} className="spin" style={{ margin: '0 auto 10px auto', display: 'block' }} />
            Loading binary network hierarchy...
          </div>
        ) : !displayRoot ? (
          <div style={{ padding: '40px 20px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.88rem' }}>
            No binary tree data found.
          </div>
        ) : (
          <div
            style={{
              maxHeight: '560px',
              height: '560px',
              overflow: 'auto',
              borderRadius: '14px',
              border: '1.5px solid var(--border-color)',
              background: 'var(--bg-main)',
              position: 'relative',
              boxShadow: 'inset 0 2px 8px rgba(0, 0, 0, 0.04)',
              display: 'flex',
              flexDirection: 'column'
            }}
          >
            <div
              style={{
                minWidth: 'max-content',
                padding: '36px 60px 60px 60px',
                transform: `scale(${zoomLevel})`,
                transformOrigin: 'top center',
                transition: 'transform 0.15s ease-out',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                margin: '0 auto'
              }}
            >
              <TreeNodeItem
                node={displayRoot}
                positionLabel="Root"
                depth={1}
                maxDepth={maxDepth}
                displayRootId={displayRoot.id}
                onNodeClick={(clickedNode) => setFocusedNode(clickedNode)}
                showVacantSpots={showVacantSpots}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

