package org.opentripplanner.street.model.edge;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.opentripplanner.street.model._data.StreetModelForTest.intersectionVertex;

import java.util.stream.Stream;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.Arguments;
import org.junit.jupiter.params.provider.MethodSource;
import org.locationtech.jts.geom.Coordinate;
import org.locationtech.jts.geom.impl.PackedCoordinateSequence;
import org.opentripplanner.routing.api.request.preference.WheelchairPreferences;
import org.opentripplanner.street.model.StreetTraversalPermission;
import org.opentripplanner.street.model.vertex.StreetVertex;
import org.opentripplanner.street.search.request.StreetSearchRequest;
import org.opentripplanner.street.search.state.State;

class StreetEdgeWheelchairCostTest {

  StreetVertex V1;
  StreetVertex V2;

  public StreetEdgeWheelchairCostTest() {
    V1 = intersectionVertex("V1", 0.0, 0.0);
    V2 = intersectionVertex("V2", 2.0, 0.0);
  }

  static Stream<Arguments> slopeCases() {
    return Stream.of(
      // no extra cost
      Arguments.of(0.07, 1, 101632),
      // no extra cost
      Arguments.of(0.08, 1, 118908),
      // no extra cost
      Arguments.of(0.09, 1, 138165),
      // 0.1 % above the max slope, tiny extra cost
      Arguments.of(0.091, 1, 154177),
      // 3 % above max slope, will incur very large cost
      Arguments.of(0.091, 3, 182209),
      // 0.1 % above the max slope, but high reluctance will large cost
      Arguments.of(0.0915, 1, 162335),
      // 2 % above max slope, but lowered reluctance
      Arguments.of(0.11, 0.5, 352990),
      // 2 % above max slope, will incur very large cost
      Arguments.of(0.11, 1, 529485),
      // 3 % above max slope, will incur very large cost
      Arguments.of(0.12, 1, 759563)
    );
  }

  /**
   * This makes sure that when you exceed the max slope in a wheelchair there isn't a hard cut-off
   * but rather the cost increases proportional to how much you go over the maximum.
   * <p>
   * In other words: 0.1 % over the limit only has a small cost but 1% over doubles the cost
   * dramatically to the point where it's only used as a last resort.
   */
  @ParameterizedTest(
    name = "slope of {0} with maxSlopeExceededReluctance of {1} should lead to traversal costs of {2}"
  )
  @MethodSource("slopeCases")
  public void shouldScaleCostWithMaxSlope(double slope, double reluctance, long expectedCost) {
    double length = 1000;
    var edge = new StreetEdgeBuilder<>()
      .withFromVertex(V1)
      .withToVertex(V2)
      .withName("edge with elevation")
      .withMeterLength(length)
      .withPermission(StreetTraversalPermission.ALL)
      .withBack(false)
      .buildAndConnect();

    Coordinate[] profile = new Coordinate[] {
      new Coordinate(0, 0),
      new Coordinate(length, slope * length),
    };

    PackedCoordinateSequence elev = new PackedCoordinateSequence.Double(profile);
    StreetElevationExtensionBuilder.of(edge)
      .withElevationProfile(elev)
      .withComputed(true)
      .build()
      .ifPresent(edge::setElevationExtension);
    assertEquals(slope, edge.getMaxSlope(), 0.0001);

    var req = StreetSearchRequest.of();
    req.withWheelchair(true);
    req.withPreferences(preferences ->
      preferences.withWheelchair(
        WheelchairPreferences.of()
          .withTripOnlyAccessible()
          .withStopOnlyAccessible()
          .withElevatorOnlyAccessible()
          .withInaccessibleStreetReluctance(25)
          .withMaxSlope(0.09)
          .withSlopeExceededReluctance(reluctance)
          .withStairsReluctance(10)
          .build()
      )
    );
    State result = traverse(edge, req.build());
    assertNotNull(result);
    assertEquals(expectedCost, (long) result.weight);
  }

  static Stream<Arguments> wheelchairStairsCases() {
    return Stream.of(Arguments.of(1, 451), Arguments.of(10, 4511), Arguments.of(100, 45112));
  }

  @ParameterizedTest(
    name = "wheelchair stairs reluctance of {0} should lead to traversal costs of {1}"
  )
  @MethodSource("wheelchairStairsCases")
  public void wheelchairStairsReluctance(double stairsReluctance, long expectedCost) {
    double length = 10;
    var stairEdge = new StreetEdgeBuilder<>()
      .withFromVertex(V1)
      .withToVertex(V2)
      .withName("stairs")
      .withMeterLength(length)
      .withPermission(StreetTraversalPermission.ALL)
      .withBack(false)
      .withStairs(true)
      .buildAndConnect();

    var req = StreetSearchRequest.of();
    req.withWheelchair(true);
    req.withPreferences(preferences ->
      preferences.withWheelchair(
        WheelchairPreferences.of()
          .withTripOnlyAccessible()
          .withStopOnlyAccessible()
          .withElevatorOnlyAccessible()
          .withInaccessibleStreetReluctance(25)
          .withMaxSlope(0)
          .withSlopeExceededReluctance(1.1)
          .withStairsReluctance(stairsReluctance)
          .build()
      )
    );

    req.withPreferences(pref -> pref.withWalk(w -> w.withReluctance(1.0)));

    var result = traverse(stairEdge, req.build());
    assertEquals(expectedCost, (long) result.weight);

    StreetEdge noStairsEdge = stairEdge.toBuilder().withStairs(false).buildAndConnect();
    var notStairsResult = traverse(noStairsEdge, req.build());
    assertEquals(150, (long) notStairsResult.weight);
  }

  static Stream<Arguments> inaccessibleStreetCases() {
    return Stream.of(Arguments.of(1f, 300), Arguments.of(10f, 3007), Arguments.of(100f, 30075));
  }

  @ParameterizedTest(
    name = "an inaccessible street with the reluctance of {0} should lead to traversal costs of {1}"
  )
  @MethodSource("inaccessibleStreetCases")
  public void inaccessibleStreet(float inaccessibleStreetReluctance, long expectedCost) {
    double length = 10;
    var edge = new StreetEdgeBuilder<>()
      .withFromVertex(V1)
      .withToVertex(V2)
      .withName("stairs")
      .withMeterLength(length)
      .withPermission(StreetTraversalPermission.ALL)
      .withBack(false)
      .withWheelchairAccessible(false)
      .buildAndConnect();

    var req = StreetSearchRequest.of();
    req.withWheelchair(true);
    req.withPreferences(preferences ->
      preferences.withWheelchair(
        WheelchairPreferences.of()
          .withTripOnlyAccessible()
          .withStopOnlyAccessible()
          .withElevatorOnlyAccessible()
          .withInaccessibleStreetReluctance(inaccessibleStreetReluctance)
          .withMaxSlope(0)
          .withSlopeExceededReluctance(1.1)
          .withStairsReluctance(25)
          .build()
      )
    );

    var result = traverse(edge, req.build());
    assertEquals(expectedCost, (long) result.weight);

    // reluctance should have no effect when the edge is accessible
    StreetEdge accessibleEdge = edge.toBuilder().withWheelchairAccessible(true).buildAndConnect();
    var accessibleResult = traverse(accessibleEdge, req.build());
    assertEquals(300, (long) accessibleResult.weight);
  }

  static Stream<Arguments> walkReluctanceCases() {
    return Stream.of(
      Arguments.of(0.5, 75),
      Arguments.of(1, 150),
      Arguments.of(10, 1503),
      Arguments.of(100, 15037)
    );
  }

  @ParameterizedTest(
    name = "walkReluctance of {0} should affect wheelchair users and lead to traversal costs of {1}"
  )
  @MethodSource("walkReluctanceCases")
  public void walkReluctance(double walkReluctance, long expectedCost) {
    double length = 10;
    var edge = new StreetEdgeBuilder<>()
      .withFromVertex(V1)
      .withToVertex(V2)
      .withName("stairs")
      .withMeterLength(length)
      .withPermission(StreetTraversalPermission.ALL)
      .withBack(false)
      .buildAndConnect();

    var req = StreetSearchRequest.of();
    req.withPreferences(p -> p.withWalk(w -> w.withReluctance(walkReluctance)));
    req.withWheelchair(true);

    var result = traverse(edge, req.build());
    assertEquals(expectedCost, (long) result.weight);

    assertEquals(8, result.getElapsedTimeSeconds());
  }

  private State traverse(StreetEdge edge, StreetSearchRequest req) {
    var state = new State(V1, req);

    assertEquals(0, state.weight);
    return edge.traverse(state)[0];
  }
}
