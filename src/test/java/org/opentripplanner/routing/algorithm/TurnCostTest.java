package org.opentripplanner.routing.algorithm;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;

import java.util.List;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.locationtech.jts.geom.Coordinate;
import org.locationtech.jts.geom.LineString;
import org.opentripplanner.common.TurnRestriction;
import org.opentripplanner.common.TurnRestrictionType;
import org.opentripplanner.routing.algorithm.astar.AStarBuilder;
import org.opentripplanner.routing.api.request.RouteRequest;
import org.opentripplanner.routing.core.RoutingContext;
import org.opentripplanner.routing.core.State;
import org.opentripplanner.routing.core.TraverseMode;
import org.opentripplanner.routing.core.TraverseModeSet;
import org.opentripplanner.routing.core.intersection_model.ConstantIntersectionTraversalCalculator;
import org.opentripplanner.routing.core.intersection_model.IntersectionTraversalCalculator;
import org.opentripplanner.routing.edgetype.StreetEdge;
import org.opentripplanner.routing.edgetype.StreetTraversalPermission;
import org.opentripplanner.routing.graph.Graph;
import org.opentripplanner.routing.graph.Vertex;
import org.opentripplanner.routing.spt.GraphPath;
import org.opentripplanner.routing.spt.ShortestPathTree;
import org.opentripplanner.routing.vertextype.IntersectionVertex;
import org.opentripplanner.routing.vertextype.StreetVertex;
import org.opentripplanner.util.geometry.GeometryUtils;

public class TurnCostTest {

  private Graph graph;

  private Vertex topRight;

  private Vertex bottomLeft;

  private StreetEdge maple_main1, broad1_2;

  private RouteRequest proto;

  private IntersectionTraversalCalculator calculator;

  @BeforeEach
  public void before() {
    graph = new Graph();

    // Graph for a fictional grid city with turn restrictions
    StreetVertex maple1 = vertex("maple_1st", 2.0, 2.0);
    StreetVertex maple2 = vertex("maple_2nd", 1.0, 2.0);
    StreetVertex maple3 = vertex("maple_3rd", 0.0, 2.0);

    StreetVertex main1 = vertex("main_1st", 2.0, 1.0);
    StreetVertex main2 = vertex("main_2nd", 1.0, 1.0);
    StreetVertex main3 = vertex("main_3rd", 0.0, 1.0);

    StreetVertex broad1 = vertex("broad_1st", 2.0, 0.0);
    StreetVertex broad2 = vertex("broad_2nd", 1.0, 0.0);
    StreetVertex broad3 = vertex("broad_3rd", 0.0, 0.0);

    // Each block along the main streets has unit length and is one-way
    StreetEdge maple1_2 = edge(maple1, maple2, 100.0, false);
    StreetEdge maple2_3 = edge(maple2, maple3, 100.0, false);

    StreetEdge main1_2 = edge(main1, main2, 100.0, false);
    StreetEdge main2_3 = edge(main2, main3, 100.0, false);

    broad1_2 = edge(broad1, broad2, 100.0, false);
    StreetEdge broad2_3 = edge(broad2, broad3, 100.0, false);

    // Each cross-street connects
    maple_main1 = edge(maple1, main1, 50.0, false);
    StreetEdge main_broad1 = edge(main1, broad1, 100.0, false);

    StreetEdge maple_main2 = edge(maple2, main2, 50.0, false);
    StreetEdge main_broad2 = edge(main2, broad2, 50.0, false);

    StreetEdge maple_main3 = edge(maple3, main3, 100.0, false);
    StreetEdge main_broad3 = edge(main3, broad3, 100.0, false);

    // Turn restrictions are only for driving modes.
    // - can't turn from 1st onto Main.
    // - can't turn from 2nd onto Main.
    // - can't turn from 2nd onto Broad.
    DisallowTurn(maple_main1, main1_2);
    DisallowTurn(maple_main2, main2_3);
    DisallowTurn(main_broad2, broad2_3);

    // Hold onto some vertices for the tests
    topRight = maple1;
    bottomLeft = broad3;

    // Make a prototype routing request.
    proto = new RouteRequest();
    var preferences = proto.preferences();
    preferences.withCar(it -> it.setSpeed(1.0));
    preferences.withWalk(walk -> {
      walk.setSpeed(1.0);
      walk.setStairsReluctance(1.0);
    });
    preferences.withBike(bike -> bike.setSpeed(1.0));
    preferences.street().setTurnReluctance(1.0);
    preferences.setAllStreetReluctance(1.0);

    // Turn costs are all 0 by default.
    calculator = new ConstantIntersectionTraversalCalculator(0.0);
  }

  @Test
  public void testForwardDefaultNoTurnCosts() {
    // Without turn costs, this path costs 2x100 + 2x50 = 300.
    checkForwardRouteDuration(new RoutingContext(proto, graph, topRight, bottomLeft), 300);
  }

  @Test
  public void testForwardDefaultConstTurnCosts() {
    calculator = new ConstantIntersectionTraversalCalculator(10.0);

    // Without turn costs, this path costs 2x100 + 2x50 = 300.
    // Since we traverse 3 intersections, the total cost should be 330.
    GraphPath path = checkForwardRouteDuration(
      new RoutingContext(proto, graph, topRight, bottomLeft),
      330
    );

    // The intersection traversal cost should be applied to the state *after*
    // the intersection itself.
    List<State> states = path.states;
    assertEquals(5, states.size());

    assertEquals("maple_1st", states.get(0).getVertex().getLabel());
    assertEquals("main_1st", states.get(1).getVertex().getLabel());
    assertEquals("main_2nd", states.get(2).getVertex().getLabel());
    assertEquals("broad_2nd", states.get(3).getVertex().getLabel());
    assertEquals("broad_3rd", states.get(4).getVertex().getLabel());

    assertEquals(0, states.get(0).getElapsedTimeSeconds());
    assertEquals(50, states.get(1).getElapsedTimeSeconds()); // maple_main1 = 50
    assertEquals(160, states.get(2).getElapsedTimeSeconds()); // main1_2 = 100
    assertEquals(220, states.get(3).getElapsedTimeSeconds()); // main_broad2 = 50
    assertEquals(330, states.get(4).getElapsedTimeSeconds()); // broad2_3 = 100
  }

  @Test
  public void testForwardCarNoTurnCosts() {
    RouteRequest options = proto.clone();
    options.setMode(TraverseMode.CAR);

    // Without turn costs, this path costs 3x100 + 1x50 = 300.
    GraphPath path = checkForwardRouteDuration(
      new RoutingContext(options, graph, topRight, bottomLeft),
      350
    );

    List<State> states = path.states;
    assertEquals(5, states.size());

    assertEquals("maple_1st", states.get(0).getVertex().getLabel());
    assertEquals("main_1st", states.get(1).getVertex().getLabel());
    assertEquals("broad_1st", states.get(2).getVertex().getLabel());
    assertEquals("broad_2nd", states.get(3).getVertex().getLabel());
    assertEquals("broad_3rd", states.get(4).getVertex().getLabel());
  }

  @Test
  public void testForwardCarConstTurnCosts() {
    RouteRequest options = proto.clone();
    calculator = new ConstantIntersectionTraversalCalculator(10.0);
    options.setMode(TraverseMode.CAR);

    // Without turn costs, this path costs 3x100 + 1x50 = 350.
    // Since there are 3 turns, the total cost should be 380.
    GraphPath path = checkForwardRouteDuration(
      new RoutingContext(options, graph, topRight, bottomLeft),
      380
    );

    List<State> states = path.states;
    assertEquals(5, states.size());

    assertEquals("maple_1st", states.get(0).getVertex().getLabel());
    assertEquals("main_1st", states.get(1).getVertex().getLabel());
    assertEquals("broad_1st", states.get(2).getVertex().getLabel());
    assertEquals("broad_2nd", states.get(3).getVertex().getLabel());
    assertEquals("broad_3rd", states.get(4).getVertex().getLabel());

    assertEquals(0, states.get(0).getElapsedTimeSeconds());
    assertEquals(50, states.get(1).getElapsedTimeSeconds()); // maple_main1 = 50
    assertEquals(160, states.get(2).getElapsedTimeSeconds()); // main1_2 = 100
    assertEquals(270, states.get(3).getElapsedTimeSeconds()); // broad1_2 = 100
    assertEquals(380, states.get(4).getElapsedTimeSeconds()); // broad2_3 = 100
  }

  private GraphPath checkForwardRouteDuration(RoutingContext context, int expectedDuration) {
    ShortestPathTree tree = AStarBuilder
      .oneToOne()
      .setContext(context)
      .setIntersectionTraversalCalculator(calculator)
      .getShortestPathTree();
    GraphPath path = tree.getPath(bottomLeft);
    assertNotNull(path);

    // Without turn costs, this path costs 2x100 + 2x50 = 300.
    assertEquals(expectedDuration, path.getDuration());

    // Weight == duration when reluctances == 0.
    assertEquals(expectedDuration, (int) path.getWeight());

    for (State s : path.states) {
      assertEquals(s.getElapsedTimeSeconds(), (int) s.getWeight());
    }

    return path;
  }

  /****
   * Private Methods
   ****/

  private StreetVertex vertex(String label, double lat, double lon) {
    return new IntersectionVertex(graph, label, lat, lon);
  }

  /**
   * Create an edge. If twoWay, create two edges (back and forth).
   *
   * @param back true if this is a reverse edge
   */
  private StreetEdge edge(StreetVertex vA, StreetVertex vB, double length, boolean back) {
    String labelA = vA.getLabel();
    String labelB = vB.getLabel();
    String name = String.format("%s_%s", labelA, labelB);
    Coordinate[] coords = new Coordinate[2];
    coords[0] = vA.getCoordinate();
    coords[1] = vB.getCoordinate();
    LineString geom = GeometryUtils.getGeometryFactory().createLineString(coords);

    StreetTraversalPermission perm = StreetTraversalPermission.ALL;
    StreetEdge pse = new StreetEdge(vA, vB, geom, name, length, perm, back);
    pse.setCarSpeed(1.0f);
    return pse;
  }

  private void DisallowTurn(StreetEdge from, StreetEdge to) {
    TurnRestrictionType rType = TurnRestrictionType.NO_TURN;
    TraverseModeSet restrictedModes = new TraverseModeSet(TraverseMode.CAR);
    TurnRestriction restrict = new TurnRestriction(from, to, rType, restrictedModes, null);
    from.addTurnRestriction(restrict);
  }
}
