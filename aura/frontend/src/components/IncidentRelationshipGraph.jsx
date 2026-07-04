import React, { useMemo, useRef, useEffect, useState } from 'react';
import ForceGraph2D from 'react-force-graph-2d';

export default function IncidentRelationshipGraph({ incidents = [] }) {
  const containerRef = useRef();
  const [dimensions, setDimensions] = useState({ width: 800, height: 400 });

  useEffect(() => {
    if (containerRef.current) {
      const { clientWidth, clientHeight } = containerRef.current;
      setDimensions({ width: clientWidth, height: clientHeight });
    }
    
    const handleResize = () => {
      if (containerRef.current) {
        setDimensions({
          width: containerRef.current.clientWidth,
          height: containerRef.current.clientHeight
        });
      }
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const graphData = useMemo(() => {
    const activeIncident = incidents.find(inc => inc.cascading_chain && inc.cascading_chain.length > 0);
    
    if (!activeIncident) {
      // Default stable topology
      return {
        nodes: [
          { id: 'DB Service', group: 'database', val: 20 },
          { id: 'API Gateway', group: 'gateway', val: 25 },
          { id: 'Auth Service', group: 'auth', val: 20 },
          { id: 'Frontend', group: 'client', val: 15 },
          { id: 'Payment Service', group: 'service', val: 15 },
        ],
        links: [
          { source: 'Frontend', target: 'API Gateway' },
          { source: 'API Gateway', target: 'Auth Service' },
          { source: 'API Gateway', target: 'DB Service' },
          { source: 'API Gateway', target: 'Payment Service' },
          { source: 'Auth Service', target: 'DB Service' },
          { source: 'Payment Service', target: 'DB Service' },
        ]
      };
    }

    const { cascading_chain, root_dependency } = activeIncident;
    const nodes = [];
    const links = [];
    const addedNodes = new Set();
    
    const addNode = (id) => {
      if (!addedNodes.has(id)) {
        addedNodes.add(id);
        const isRoot = id === root_dependency;
        nodes.push({
          id,
          isRoot,
          isAffected: true,
          val: isRoot ? 35 : 25
        });
      }
    };

    cascading_chain.forEach(link => {
      addNode(link.source);
      addNode(link.target);
      links.push({
        source: link.source,
        target: link.target,
        confidence: link.confidence,
        isCascade: true
      });
    });

    return { nodes, links };
  }, [incidents]);

  return (
    <div ref={containerRef} className="w-full h-full relative overflow-hidden bg-transparent rounded-xl">
      
      {/* Live Cascade Indicator */}
      {incidents.length > 0 && incidents[0].cascading_chain?.length > 0 && (
        <div className="absolute top-4 right-4 z-10 bg-red-950/80 border border-red-500/50 px-3 py-1.5 rounded-lg flex items-center space-x-2">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
          </span>
          <span className="text-[10px] text-red-400 font-bold uppercase tracking-widest animate-pulse">
            Cascading Failure Detected
          </span>
        </div>
      )}

      <ForceGraph2D
        width={dimensions.width}
        height={dimensions.height}
        graphData={graphData}
        backgroundColor="rgba(0,0,0,0)" // transparent
        
        // Node styling
        nodeRelSize={6}
        nodeColor={node => {
          if (node.isRoot) return '#ff0055'; // neon pink
          if (node.isAffected) return '#ffaa00'; // warning orange
          return '#00f0ff'; // neon cyan (stable)
        }}
        nodeCanvasObject={(node, ctx, globalScale) => {
          const label = node.id;
          const fontSize = 12/globalScale;
          
          // Draw Glowing Node
          ctx.beginPath();
          ctx.arc(node.x, node.y, node.val ? Math.sqrt(node.val)*2 : 8, 0, 2 * Math.PI, false);
          ctx.fillStyle = node.isRoot ? '#ff0055' : node.isAffected ? '#ffaa00' : '#00f0ff';
          
          // Glow effect
          ctx.shadowBlur = 15;
          ctx.shadowColor = ctx.fillStyle;
          ctx.fill();
          
          // Reset shadow for text
          ctx.shadowBlur = 0;

          // Draw Text
          ctx.font = `bold ${fontSize}px "Courier New", monospace`;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillStyle = '#ffffff';
          ctx.fillText(label, node.x, node.y + (node.val ? Math.sqrt(node.val)*2 + 6 : 14));
        }}

        // Edge styling
        linkColor={link => link.isCascade ? '#ff0055' : 'rgba(0, 240, 255, 0.2)'}
        linkWidth={link => link.isCascade ? Math.max(2, link.confidence * 4) : 1}
        linkDirectionalParticles={link => link.isCascade ? 4 : 2}
        linkDirectionalParticleSpeed={link => link.isCascade ? 0.015 : 0.005}
        linkDirectionalParticleWidth={link => link.isCascade ? 4 : 2}
        linkDirectionalParticleColor={link => link.isCascade ? '#ff0055' : '#00f0ff'}
        
        // Physics
        d3VelocityDecay={0.3}
      />
    </div>
  );
}
