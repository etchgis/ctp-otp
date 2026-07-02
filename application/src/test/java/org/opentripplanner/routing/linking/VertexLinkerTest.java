package org.opentripplanner.routing.linking;

import static com.google.common.truth.Truth.assertThat;

import java.util.List;
import java.util.Set;
import org.junit.jupiter.api.Test;
import org.locationtech.jts.geom.Coordinate;
import org.locationtech.jts.geom.Polygon;
import org.opentripplanner.framework.application.OTPFeature;
import org.opentripplanner.framework.geometry.GeometryUtils;
import org.opentripplanner.routing.graph.Graph;
import org.opentripplanner.street.model._data.StreetModelForTest;
import org.opentripplanner.street.model.edge.LinkingDirection;
import org.opentripplanner.street.model.vertex.SplitterVertex;
import org.opentripplanner.street.model.vertex.StreetVertex;
import org.opentripplanner.street.model.vertex.TemporarySplitterVertex;
import org.opentripplanner.street.search.TraverseModeSet;
import org.opentripplanner.framework.i18n.NonLocalizedString;
import org.opentripplanner.transit.model._data.TimetableRepositoryForTest;
import org.opentripplanner.transit.model.site.AreaStop;
import org.opentripplanner.transit.service.SiteRepository;

class VertexLinkerTest {

  public static final TimetableRepositoryForTest REPO = TimetableRepositoryForTest.of();
  public static final AreaStop AREA_STOP_1 = REPO.areaStop("area-stop-1").build();
  public static final AreaStop AREA_STOP_2 = REPO.areaStop("area-stop-2").build();

  @Test
  void flex() {
    OTPFeature.FlexRouting.testOn(() -> {
      var v1 = StreetModelForTest.intersectionVertex(0, 0);
      v1.addAreaStops(Set.of(AREA_STOP_1));
      var v2 = StreetModelForTest.intersectionVertex(0.1, 0.1);
      v2.addAreaStops(Set.of(AREA_STOP_2));

      var toBeLinked = StreetModelForTest.intersectionVertex(0.05, 0.06);

      assertThat(toBeLinked.areaStops()).isEmpty();

      StreetModelForTest.streetEdge(v1, v2);

      var graph = new Graph();

      graph.addVertex(v1);
      graph.addVertex(v2);
      graph.index();

      var linker = new VertexLinker(graph);

      linker.linkVertexPermanently(
        toBeLinked,
        TraverseModeSet.allModes(),
        LinkingDirection.BIDIRECTIONAL,
        (vertex, streetVertex) ->
          List.of(
            StreetModelForTest.streetEdge((StreetVertex) vertex, streetVertex),
            StreetModelForTest.streetEdge(streetVertex, (StreetVertex) vertex)
          )
      );

      var splitterVertices = graph.getVerticesOfType(SplitterVertex.class);
      assertThat(splitterVertices).hasSize(1);
      var splitter = splitterVertices.getFirst();

      assertThat(splitter.areaStops()).containsExactly(AREA_STOP_1, AREA_STOP_2);
    });
  }

  /**
   * Test that the AreaStopLocator is used to assign AreaStops to temporary splitter vertices
   * when linking for a routing request. This enables flex pickup/dropoff at the user's exact
   * origin/destination location within a flex zone.
   */
  @Test
  void areaStopLocatorAssignsAreaStopsToTemporaryVertex() {
    OTPFeature.FlexRouting.testOn(() -> {
      // Create a polygon that covers the area where we'll link
      var polygon = createPolygon(0, 0, 0.2, 0.2);

      // Create an AreaStop with geometry
      var areaStopWithGeometry = SiteRepository.of()
        .areaStop(TimetableRepositoryForTest.id("flex-zone"))
        .withName(new NonLocalizedString("Flex Zone"))
        .withGeometry(polygon)
        .build();

      // Create street vertices at corners (these don't have AreaStops assigned)
      var v1 = StreetModelForTest.intersectionVertex(0, 0);
      var v2 = StreetModelForTest.intersectionVertex(0.1, 0.1);

      // Create the vertex to be linked - inside the flex zone polygon
      var toBeLinked = StreetModelForTest.intersectionVertex(0.05, 0.05);

      assertThat(toBeLinked.areaStops()).isEmpty();

      StreetModelForTest.streetEdge(v1, v2);

      var graph = new Graph();
      graph.addVertex(v1);
      graph.addVertex(v2);
      graph.index();

      var linker = new VertexLinker(graph);

      // Set up the AreaStopLocator that returns our test AreaStop for points inside the polygon
      linker.setAreaStopLocator((lon, lat) -> {
        var point = GeometryUtils.getGeometryFactory().createPoint(new Coordinate(lon, lat));
        if (areaStopWithGeometry.getGeometry().contains(point)) {
          return List.of(areaStopWithGeometry);
        }
        return List.of();
      });

      // Link using REQUEST scope (temporary vertex)
      var disposableEdges = linker.linkVertexForRequest(
        toBeLinked,
        TraverseModeSet.allModes(),
        LinkingDirection.BIDIRECTIONAL,
        (vertex, streetVertex) ->
          List.of(
            StreetModelForTest.streetEdge((StreetVertex) vertex, streetVertex),
            StreetModelForTest.streetEdge(streetVertex, (StreetVertex) vertex)
          )
      );

      // Find the temporary splitter vertex through the outgoing edges of toBeLinked
      // Temporary vertices are not added to the graph's vertex collection,
      // but they are connected via edges
      var splitter = toBeLinked.getOutgoing().stream()
        .map(e -> e.getToVertex())
        .filter(v -> v instanceof TemporarySplitterVertex)
        .map(v -> (TemporarySplitterVertex) v)
        .findFirst()
        .orElse(null);

      assertThat(splitter).isNotNull();

      // The splitter should have the AreaStop assigned via the locator
      assertThat(splitter.areaStops()).contains(areaStopWithGeometry);

      // Clean up
      disposableEdges.disposeEdges();
    });
  }

  /**
   * Test that AreaStopLocator doesn't assign AreaStops to vertices outside the polygon.
   */
  @Test
  void areaStopLocatorDoesNotAssignAreaStopsOutsidePolygon() {
    OTPFeature.FlexRouting.testOn(() -> {
      // Create a small polygon that does NOT cover where we'll link
      var polygon = createPolygon(0.5, 0.5, 0.6, 0.6);

      var areaStopWithGeometry = SiteRepository.of()
        .areaStop(TimetableRepositoryForTest.id("flex-zone"))
        .withName(new NonLocalizedString("Flex Zone"))
        .withGeometry(polygon)
        .build();

      // Create street vertices (outside the flex zone)
      var v1 = StreetModelForTest.intersectionVertex(0, 0);
      var v2 = StreetModelForTest.intersectionVertex(0.1, 0.1);

      // Vertex to be linked is also outside the flex zone
      var toBeLinked = StreetModelForTest.intersectionVertex(0.05, 0.05);

      StreetModelForTest.streetEdge(v1, v2);

      var graph = new Graph();
      graph.addVertex(v1);
      graph.addVertex(v2);
      graph.index();

      var linker = new VertexLinker(graph);

      linker.setAreaStopLocator((lon, lat) -> {
        var point = GeometryUtils.getGeometryFactory().createPoint(new Coordinate(lon, lat));
        if (areaStopWithGeometry.getGeometry().contains(point)) {
          return List.of(areaStopWithGeometry);
        }
        return List.of();
      });

      var disposableEdges = linker.linkVertexForRequest(
        toBeLinked,
        TraverseModeSet.allModes(),
        LinkingDirection.BIDIRECTIONAL,
        (vertex, streetVertex) ->
          List.of(
            StreetModelForTest.streetEdge((StreetVertex) vertex, streetVertex),
            StreetModelForTest.streetEdge(streetVertex, (StreetVertex) vertex)
          )
      );

      // Find the temporary splitter vertex through the outgoing edges
      var splitter = toBeLinked.getOutgoing().stream()
        .map(e -> e.getToVertex())
        .filter(v -> v instanceof TemporarySplitterVertex)
        .map(v -> (TemporarySplitterVertex) v)
        .findFirst()
        .orElse(null);

      assertThat(splitter).isNotNull();

      // The splitter should NOT have the AreaStop since it's outside the polygon
      assertThat(splitter.areaStops()).doesNotContain(areaStopWithGeometry);

      disposableEdges.disposeEdges();
    });
  }

  /**
   * Create a simple rectangular polygon for testing.
   */
  private static Polygon createPolygon(double minLon, double minLat, double maxLon, double maxLat) {
    return GeometryUtils.getGeometryFactory().createPolygon(
      new Coordinate[] {
        new Coordinate(minLon, minLat),
        new Coordinate(maxLon, minLat),
        new Coordinate(maxLon, maxLat),
        new Coordinate(minLon, maxLat),
        new Coordinate(minLon, minLat),
      }
    );
  }
}
