<template>
  <div class="whiteboard-preview-container">
    <svg 
      v-if="viewBox" 
      :viewBox="viewBox" 
      preserveAspectRatio="xMidYMid meet"
      class="whiteboard-preview-svg"
    >
      <!-- Background -->
      <rect 
        x="0" 
        y="0" 
        width="100%" 
        height="100%" 
        :fill="backgroundColor" 
      />
      
      <!-- Background Pattern -->
      <defs>
        <pattern 
          v-if="backgroundVariant === 'lines'" 
          id="pattern-lines" 
          :width="patternGap" 
          :height="patternGap" 
          patternUnits="userSpaceOnUse"
        >
          <path 
            :d="`M ${patternGap / 2} 0 V ${patternGap} M 0 ${patternGap / 2} H ${patternGap}`" 
            fill="none" 
            :stroke="patternColor" 
            :stroke-width="patternSize" 
          />
        </pattern>
        <pattern 
          v-if="backgroundVariant === 'dots'" 
          id="pattern-dots" 
          :width="patternGap" 
          :height="patternGap" 
          patternUnits="userSpaceOnUse"
        >
          <circle 
            :cx="patternSize" 
            :cy="patternSize" 
            :r="patternSize" 
            :fill="patternColor" 
          />
        </pattern>
      </defs>
      <rect 
        v-if="backgroundVariant !== 'none'" 
        x="0" 
        y="0" 
        width="100%" 
        height="100%" 
        :fill="`url(#pattern-${backgroundVariant})`" 
      />

      <!-- Edges -->
      <g class="edges">
        <path 
          v-for="edge in edges" 
          :key="edge.id" 
          :d="getEdgePath(edge)" 
          fill="none" 
          :stroke="edgeStrokeColor" 
          :stroke-width="edgeStrokeWidth" 
          :stroke-dasharray="getEdgeDashArray(edge)"
        />
      </g>
      
      <!-- Nodes -->
      <g class="nodes">
        <rect 
          v-for="node in nodes" 
          :key="node.id" 
          :x="node.position.x" 
          :y="node.position.y" 
          :width="node.width" 
          :height="node.height" 
          :fill="getNodeColor(node)" 
          :stroke="getNodeStrokeColor(node)" 
          :stroke-width="nodeStrokeWidth"
          rx="4" 
          ry="4" 
        />
      </g>
    </svg>
    <div v-else class="whiteboard-preview-empty">
      <!-- Show message if no nodes or data -->
      <span>白板无内容</span>
    </div>
    <div class="whiteboard-title">
      <svg class="whiteboard-icon"><use xlink:href="#iconLayout"></use></svg>
      <span class="whiteboard-name">{{ title }}</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch, type PropType } from 'vue';

// Define local types to avoid import/extension issues

// Simple Viewport type
interface Viewport {
  x: number;
  y: number;
  zoom: number;
}

// Node type with necessary properties
interface PreviewNode {
  id: string;
  position: { x: number; y: number };
  width?: number;
  height?: number;
  data?: {
    style?: {
      backgroundColor?: string;
    };
    // Add other potential data properties if needed
  };
  // Add other base Node properties if needed
}

// Edge type with necessary properties
interface PreviewEdge {
  id: string;
  source: string;
  target: string;
  data?: {
    style?: 'solid' | 'dashed' | 'dotted';
    // Add other potential data properties if needed
  };
  // Add other base Edge properties if needed
}

const props = defineProps({
  nodes: {
    type: Array as PropType<PreviewNode[]>,
    default: () => [],
  },
  edges: {
    type: Array as PropType<PreviewEdge[]>,
    default: () => [],
  },
  viewport: {
    type: Object as PropType<Viewport>,
    default: () => ({ x: 0, y: 0, zoom: 1 }),
  },
  title: {
    type: String,
    default: '白板预览',
  },
  backgroundVariant: {
    type: String as PropType<'none' | 'lines' | 'dots'>,
    default: 'none', // Default to no background pattern
  },
  backgroundColor: {
    type: String,
    default: 'var(--b3-theme-background)',
  },
  patternColor: {
    type: String,
    default: 'var(--b3-border-color)',
  },
});

const PADDING = 50; // Padding around the content in SVG units
const MIN_ZOOM_FOR_PADDING = 0.1; // Minimum zoom level where padding is still significant

const patternGap = ref(48);
const patternSize = computed(() => props.backgroundVariant === 'dots' ? 1.5 : 1);
const edgeStrokeColor = ref('var(--b3-theme-on-surface)');
const edgeStrokeWidth = ref(1.5);
const nodeStrokeColor = ref('var(--b3-border-color)');
const nodeStrokeWidth = ref(1);

const viewBox = computed(() => {
  if (!props.nodes || props.nodes.length === 0) {
    // Default viewBox if no nodes, adjust as needed
    return '-100 -100 200 200'; 
  }

  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;

  props.nodes.forEach(node => {
    const nodeX = node.position.x;
    const nodeY = node.position.y;
    const nodeWidth = node.width ?? 150; // Default width if undefined
    const nodeHeight = node.height ?? 50; // Default height if undefined
    minX = Math.min(minX, nodeX);
    minY = Math.min(minY, nodeY);
    maxX = Math.max(maxX, nodeX + nodeWidth);
    maxY = Math.max(maxY, nodeY + nodeHeight);
  });

  // If only one node or dimensions are zero, provide a default size
  if (minX === Infinity || maxX === -Infinity || minY === Infinity || maxY === -Infinity || (maxX === minX && maxY === minY)) {
     minX = 0;
     minY = 0;
     maxX = 200;
     maxY = 150;
  }

  const contentWidth = maxX - minX;
  const contentHeight = maxY - minY;

  // Adjust padding based on zoom level to prevent excessive padding at high zoom
  const effectivePadding = props.viewport.zoom > MIN_ZOOM_FOR_PADDING 
                           ? PADDING / props.viewport.zoom 
                           : PADDING / MIN_ZOOM_FOR_PADDING;

  const viewBoxX = minX - effectivePadding;
  const viewBoxY = minY - effectivePadding;
  const viewBoxWidth = contentWidth + 2 * effectivePadding;
  const viewBoxHeight = contentHeight + 2 * effectivePadding;

  // Use viewport translation and zoom to refine the viewBox
  // This part requires careful calculation to match viewport behavior.
  // For simplicity in a preview, fitting to content + padding might be sufficient.
  // A more accurate approach would transform the viewport's view into SVG coords.

  // Simple fit-to-content viewBox:
   return `${viewBoxX} ${viewBoxY} ${Math.max(viewBoxWidth, 1)} ${Math.max(viewBoxHeight, 1)}`;

  // --- More Accurate Viewport Mapping (Conceptual) ---
  // const { x: vpX, y: vpY, zoom: vpZoom } = props.viewport;
  // // This requires knowing the preview container's aspect ratio
  // const containerWidth = 300; // Assume a default preview width
  // const containerHeight = 168; // Assume a default preview height (16:9)
  // 
  // const svgCenterX = vpX + (containerWidth / 2 / vpZoom);
  // const svgCenterY = vpY + (containerHeight / 2 / vpZoom);
  // const svgWidth = containerWidth / vpZoom;
  // const svgHeight = containerHeight / vpZoom;
  // 
  // return `${svgCenterX - svgWidth / 2} ${svgCenterY - svgHeight / 2} ${svgWidth} ${svgHeight}`;
  // --- End Conceptual ---

});

const getNodeColor = (node: PreviewNode) => {
  // Use neutral color as fallback, matching EnWhiteBoardRender minimap
  return node.data?.style?.backgroundColor || 'var(--color-neutral-4)'; 
};

// Add function to determine node stroke color
const getNodeStrokeColor = (node: PreviewNode) => {
  return node.data?.style?.backgroundColor ? 'transparent' : nodeStrokeColor.value;
};

// Simple straight line path for edges
const getEdgePath = (edge: PreviewEdge): string => {
  const sourceNode = props.nodes.find(n => n.id === edge.source);
  const targetNode = props.nodes.find(n => n.id === edge.target);

  if (!sourceNode || !targetNode) return '';

  // Center points of nodes
  const sourceX = sourceNode.position.x + (sourceNode.width ?? 150) / 2;
  const sourceY = sourceNode.position.y + (sourceNode.height ?? 50) / 2;
  const targetX = targetNode.position.x + (targetNode.width ?? 150) / 2;
  const targetY = targetNode.position.y + (targetNode.height ?? 50) / 2;

  return `M ${sourceX} ${sourceY} L ${targetX} ${targetY}`;
  
  // TODO: Implement more sophisticated edge routing if needed (e.g., Bezier curves)
};

const getEdgeDashArray = (edge: PreviewEdge): string | undefined => {
  // Example: Check edge data for style
  if (edge.data?.style === 'dashed') return '5, 5';
  if (edge.data?.style === 'dotted') return '1, 3';
  return undefined; // Solid line by default
};

</script>

<style lang="scss" scoped>
.whiteboard-preview-container {
  position: relative;
  width: 100%;
  height: 100%;
  overflow: hidden;
  background-color: transparent; // Ensure no background color conflicts
  border-radius: var(--b3-border-radius);
  border: none; // Remove border
  box-sizing: border-box;
}

.whiteboard-preview-svg {
  display: block;
  width: 100%;
  height: 100%;
  user-select: none; // Prevent text selection
  pointer-events: none; // Ensure non-interactive
  .nodes rect {
    transition: fill 0.15s ease; // Optional: smooth color transition
    opacity: 0.6; // Match minimap node opacity (adjust from 0.3 if too faint)
  }
  
  .edges path {
      opacity: 0.5;
  }
}

.whiteboard-preview-empty {
  display: flex;
  justify-content: center;
  align-items: center;
  width: 100%;
  height: 100%;
  color: var(--b3-theme-on-surface-light);
  font-size: 12px;
}

.whiteboard-title {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  padding: 6px 8px; // Slightly smaller padding
  background-color: rgba(var(--b3-theme-background-rgb), 0.7); // Slightly more transparent
  backdrop-filter: blur(2px); // Optional: add blur effect
  display: flex;
  align-items: center;
  gap: 4px;
  pointer-events: none; // Ensure title overlay is non-interactive
  
  .whiteboard-icon {
    width: 12px; // Smaller icon
    height: 12px;
    fill: var(--b3-theme-on-surface);
    flex-shrink: 0;
  }
  
  .whiteboard-name {
    font-size: 11px; // Smaller font size
    color: var(--b3-theme-on-surface);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
}
</style> 