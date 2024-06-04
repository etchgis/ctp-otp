package org.opentripplanner.graph_builder.issue.api;

import static org.opentripplanner.graph_builder.issue.api.DataImportIssueStore.ISSUES_LOG_NAME;

import com.google.gson.JsonArray;
import com.google.gson.JsonObject;
import java.io.FileWriter;
import java.io.IOException;
import java.io.Serializable;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;
import javax.annotation.Nonnull;
import org.locationtech.jts.geom.Geometry;
import org.locationtech.jts.io.ParseException;
import org.locationtech.jts.io.WKTReader;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

/**
 * A summarized version of the {@see DataImportIssueStore} which doesn't contain all the issues
 * instances but only the names and their counts.
 */
public class DataImportIssueSummary implements Serializable {

  private static final Logger ISSUE_LOG = LoggerFactory.getLogger(ISSUES_LOG_NAME);
  private final Map<String, Long> summary;
  private final Map<String, List<Geometry>> geometries;

  public DataImportIssueSummary(List<DataImportIssue> issues) {
    this.summary =
      issues
        .stream()
        .map(DataImportIssue::getType)
        .collect(Collectors.groupingBy(Function.identity(), Collectors.counting()));

    logSummary();

    this.geometries =
      issues
        .stream()
        .filter(issue -> issue.getGeometry() != null)
        .collect(
          Collectors.groupingBy(
            DataImportIssue::getType,
            Collectors.mapping(DataImportIssue::getGeometry, Collectors.toList())
          )
        );

    logGeometries();
  }

  private void logGeometries() {
    List<String> features = new ArrayList<>();
    int id = 1;

    for (Map.Entry<String, List<Geometry>> entry : geometries.entrySet()) {
      String issueType = entry.getKey();
      List<Geometry> geometryList = entry.getValue();

      for (Geometry geometry : geometryList) {
        String feature = createFeature(geometry, issueType, id++);
        features.add(feature);
      }
    }

    // Create a GeoJSON FeatureCollection
    String featureCollection = createFeatureCollection(features);

    // Log the complete GeoJSON representation
    if (featureCollection != null) {
      try (FileWriter file = new FileWriter("OTPIssues.json")) {
        file.write(featureCollection);
        ISSUE_LOG.info("written to file");
      } catch (IOException e) {
        e.printStackTrace();
      }
    } else {
      System.out.println("Failed to extract geometry.");
    }
  }

  public static JsonObject extractGeometry(String wktString) {
    // Create a WKTReader
    WKTReader wktReader = new WKTReader();

    try {
      // Parse the WKT string into a Geometry object
      Geometry geometry = wktReader.read(wktString);

      // Get coordinates from the Geometry object
      JsonArray coordinates = new JsonArray();
      for (int i = 0; i < geometry.getNumGeometries(); i++) {
        JsonArray coordinate = new JsonArray();
        coordinate.add(geometry.getGeometryN(i).getCoordinate().getX());
        coordinate.add(geometry.getGeometryN(i).getCoordinate().getY());
        coordinates.add(coordinate);
      }

      String type = geometry.getGeometryType();
      if (coordinates.size() < 2) {
        type = "MultiPoint";
      }

      // Build the geometry object
      JsonObject geometryObject = new JsonObject();
      geometryObject.addProperty("type", type);
      geometryObject.add("coordinates", coordinates);

      return geometryObject;
    } catch (ParseException e) {
      e.printStackTrace();
      return null;
    }
  }

  private String createFeature(Geometry geometry, String issueType, int id) {
    StringBuilder featureBuilder = new StringBuilder();
    featureBuilder.append("{");
    featureBuilder.append("\"type\": \"Feature\",");
    featureBuilder.append("\"id\": ").append(id).append(",");
    JsonObject jsonObject = extractGeometry(geometry.toString());
    featureBuilder.append("\"geometry\": ").append(jsonObject).append(",");

    // Create properties object
    featureBuilder.append("\"properties\": {");
    featureBuilder.append("\"issueType\": \"").append(issueType).append("\"");
    featureBuilder.append("}");
    featureBuilder.append("}");

    return featureBuilder.toString();
  }

  private String createFeatureCollection(List<String> features) {
    StringBuilder featureCollectionBuilder = new StringBuilder();
    featureCollectionBuilder.append("{");
    featureCollectionBuilder.append("\"type\": \"FeatureCollection\",");
    featureCollectionBuilder.append("\"features\": [");

    for (String feature : features) {
      featureCollectionBuilder.append(feature).append(",");
    }
    // Remove the trailing comma
    if (!features.isEmpty()) {
      featureCollectionBuilder.deleteCharAt(featureCollectionBuilder.length() - 1);
    }

    featureCollectionBuilder.append("]");
    featureCollectionBuilder.append("}");

    return featureCollectionBuilder.toString();
  }

  private DataImportIssueSummary(
    Map<String, Long> summary,
    Map<String, List<Geometry>> geometries
  ) {
    this.summary = Map.copyOf(summary);
    this.geometries = Map.copyOf(geometries);
  }

  /**
   * Takes two summaries and combine them into a single one. If there are types that
   * are in both summaries their counts are added.
   */
  public static DataImportIssueSummary combine(
    DataImportIssueSummary first,
    DataImportIssueSummary second
  ) {
    var combinedSummary = new HashMap<>(first.asMap());
    second
      .asMap()
      .forEach((type, count) -> {
        combinedSummary.merge(type, count, Long::sum);
      });

    var combinedGeometries = new HashMap<>(first.geometries);
    second.geometries.forEach((type, geomList) -> {
      combinedGeometries.merge(
        type,
        geomList,
        (firstList, secondList) -> {
          List<Geometry> combinedList = new ArrayList<>(firstList);
          combinedList.addAll(secondList);
          return combinedList;
        }
      );
    });

    return new DataImportIssueSummary(combinedSummary, combinedGeometries);
  }

  public static DataImportIssueSummary empty() {
    return new DataImportIssueSummary(List.of());
  }

  public void logSummary() {
    int maxLength = summary.keySet().stream().mapToInt(String::length).max().orElse(10);
    final String FMT = "  - %-" + maxLength + "s  %,7d";

    ISSUE_LOG.info("Issue summary (number of each type):");

    summary
      .keySet()
      .stream()
      .sorted()
      .forEach(issueType -> ISSUE_LOG.info(String.format(FMT, issueType, summary.get(issueType))));
  }

  @Nonnull
  public Map<String, Long> asMap() {
    return summary;
  }
}
