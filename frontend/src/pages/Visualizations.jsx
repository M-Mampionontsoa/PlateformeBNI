import React, { useEffect, useRef, useState } from "react";
import * as d3 from "d3";
import { api } from "../api.js";
import "./styles/data.css";

const COLORS = ["#14776e", "#c47a1a", "#b23a4d", "#3a5fc4", "#8f4fc4", "#4d8f2e"];

export default function Visualizations() {
  const svgRef = useRef(null);
  const [graph, setGraph] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    api.getGraph().then(setGraph).catch((e) => setError(e.message));
  }, []);

  useEffect(() => {
    if (!graph || !svgRef.current) return;

    const width = 860;
    const height = 560;
    const groups = [...new Set(graph.nodes.map((n) => n.group))];
    const color = d3.scaleOrdinal().domain(groups).range(COLORS);

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();
    svg.attr("viewBox", [0, 0, width, height]);

    const nodes = graph.nodes.map((d) => ({ ...d }));
    const links = graph.edges.map((d) => ({ ...d }));

    const simulation = d3
      .forceSimulation(nodes)
      .force("link", d3.forceLink(links).id((d) => d.id).distance(70).strength(0.4))
      .force("charge", d3.forceManyBody().strength(-90))
      .force("center", d3.forceCenter(width / 2, height / 2))
      .force("collide", d3.forceCollide(16));

    const link = svg
      .append("g")
      .attr("stroke", "#e5e7f2")
      .attr("stroke-width", 1)
      .selectAll("line")
      .data(links)
      .join("line");

    const node = svg
      .append("g")
      .selectAll("circle")
      .data(nodes)
      .join("circle")
      .attr("r", 7)
      .attr("fill", (d) => color(d.group))
      .attr("stroke", "#ffffff")
      .attr("stroke-width", 1.5)
      .call(drag(simulation));

    const label = svg
      .append("g")
      .selectAll("text")
      .data(nodes)
      .join("text")
      .text((d) => d.label)
      .attr("font-size", 9)
      .attr("font-family", "monospace")
      .attr("fill", "#6b7280")
      .attr("dx", 10)
      .attr("dy", 3);

    node.append("title").text((d) => `${d.group}: ${d.label}`);

    simulation.on("tick", () => {
      link
        .attr("x1", (d) => d.source.x)
        .attr("y1", (d) => d.source.y)
        .attr("x2", (d) => d.target.x)
        .attr("y2", (d) => d.target.y);
      node.attr("cx", (d) => d.x).attr("cy", (d) => d.y);
      label.attr("x", (d) => d.x).attr("y", (d) => d.y);
    });

    function drag(sim) {
      function dragstarted(event, d) {
        if (!event.active) sim.alphaTarget(0.3).restart();
        d.fx = d.x; d.fy = d.y;
      }
      function dragged(event, d) { d.fx = event.x; d.fy = event.y; }
      function dragended(event, d) {
        if (!event.active) sim.alphaTarget(0);
        d.fx = null; d.fy = null;
      }
      return d3.drag().on("start", dragstarted).on("drag", dragged).on("end", dragended);
    }

    return () => simulation.stop();
  }, [graph]);

  const groups = graph ? [...new Set(graph.nodes.map((n) => n.group))] : [];
  const color = d3.scaleOrdinal().domain(groups).range(COLORS);

  return (
    <div className="ds-content-inner">
      <div className="dp-header">
        <h1 className="ds-page-title">Visualizations</h1>
        <p>Relations entre entites deduites des cles etrangeres - equivalent leger a une exploration Neo4j pour ce MVP.</p>
      </div>

      {error && <p className="dp-empty">{error}</p>}
      {graph && graph.nodes.length === 0 && (
        <p className="dp-empty">Aucune relation detectee. Importez des datasets lies (ex: commandes/clients).</p>
      )}

      {graph && graph.nodes.length > 0 && (
        <div className="dp-card">
          <svg ref={svgRef} width="100%" style={{ display: "block" }} />
          <div className="dp-legend">
            {groups.map((g) => (
              <span key={g}>
                <span className="dp-legend-dot" style={{ background: color(g) }} />
                {g}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
