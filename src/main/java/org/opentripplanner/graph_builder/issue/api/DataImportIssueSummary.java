package org.opentripplanner.graph_builder.issue.api;

import static org.opentripplanner.graph_builder.issue.api.DataImportIssueStore.ISSUES_LOG_NAME;

import com.google.gson.JsonArray;
import com.google.gson.JsonObject;
import java.io.File;
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
import okhttp3.*;
import org.apache.http.HttpEntity;
import org.apache.http.client.methods.CloseableHttpResponse;
import org.apache.http.client.methods.HttpGet;
import org.apache.http.client.methods.HttpPost;
import org.apache.http.entity.ContentType;
import org.apache.http.entity.StringEntity;
import org.apache.http.entity.mime.MultipartEntityBuilder;
import org.apache.http.impl.client.CloseableHttpClient;
import org.apache.http.impl.client.HttpClients;
import org.apache.http.util.EntityUtils;
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
  private final Map<String, List<DataImportIssue>> issuesByType;

  public DataImportIssueSummary(List<DataImportIssue> issues) {
    this.summary =
      issues
        .stream()
        .map(DataImportIssue::getType)
        .collect(Collectors.groupingBy(Function.identity(), Collectors.counting()));

    this.issuesByType =
      issues.stream().collect(Collectors.groupingBy(DataImportIssue::getType, Collectors.toList()));
  }

  public void logGeometries() {
    List<String> features = new ArrayList<>();
    int id = 1;

    for (Map.Entry<String, List<DataImportIssue>> entry : issuesByType.entrySet()) {
      String issueType = entry.getKey();
      List<DataImportIssue> issueList = entry.getValue();

      for (DataImportIssue issue : issueList) {
        if (issue.getGeometry() != null) {
          String feature = createFeature(
            issue.getGeometry(),
            issueType,
            issue.getMessage(),
            issue.getPriority(),
            id++
          );
          features.add(feature);
        }
      }
    }

    // Create a GeoJSON FeatureCollection
    String featureCollection = createFeatureCollection(features);

    // Log the complete GeoJSON representation
    if (featureCollection != null) {
      File tempFile = new File("otpissues.json");
      try {
        // Write the featureCollection to the temporary file
        try (FileWriter fileWriter = new FileWriter(tempFile)) {
          fileWriter.write(featureCollection);
        }

        // Make the POST request using the temporary file
        try {
          String response = fetch(tempFile);
          ISSUE_LOG.info("Response: " + response);
        } catch (IOException e) {
          e.printStackTrace();
        }
      } catch (IOException e) {
        e.printStackTrace();
      }
    } else {
      System.out.println("Failed to extract geometry.");
    }
  }

  public static String fetch(File file) throws IOException {
    OkHttpClient client = new OkHttpClient().newBuilder().build();
    MediaType mediaType = MediaType.parse("text/plain");
    RequestBody body = new MultipartBody.Builder()
      .setType(MultipartBody.FORM)
      .addFormDataPart("overwrite_existing_layer", "True")
      .addFormDataPart(
        "base_file",
        file.getName(),
        RequestBody.create(MediaType.parse("application/octet-stream"), file)
      )
      .build();
    Request request = new Request.Builder()
      .url("https://geo4.stage.511mobility.org/api/v2/uploads/upload")
      .method("POST", body)
      .addHeader("Authorization", "Basic SmVzc2VAZXRjaGdpcy5jb206Z2VvTmFyZHM=")
      .addHeader("Cookie", "sessionid=jl5n6scanmc311g90csshvd7h94m4jhf")
      .build();
    try (Response response = client.newCall(request).execute()) {
      if (!response.isSuccessful()) {
        throw new IOException("Unexpected response code " + response);
      }
      return response.body().string();
    }
  }

  public static JsonObject extractGeometry(String wktString) {
    WKTReader wktReader = new WKTReader();

    try {
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

  private String createFeature(
    Geometry geometry,
    String issueType,
    String message,
    int priority,
    int id
  ) {
    StringBuilder featureBuilder = new StringBuilder();
    featureBuilder.append("{");
    featureBuilder.append("\"type\": \"Feature\",");
    featureBuilder.append("\"id\": ").append(id).append(",");
    JsonObject jsonObject = extractGeometry(geometry.toString());
    featureBuilder.append("\"geometry\": ").append(jsonObject).append(",");

    // Create properties object
    featureBuilder.append("\"properties\": {");
    featureBuilder.append("\"issueType\": \"").append(issueType).append("\",");
    featureBuilder.append("\"message\": \"").append(message).append("\"");
    featureBuilder.append("\"priority\": \"").append(priority).append("\"");
    featureBuilder.append("}");
    featureBuilder.append("}");

    ISSUE_LOG.info(featureBuilder.toString());
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
    Map<String, List<DataImportIssue>> issuesByType
  ) {
    this.summary = Map.copyOf(summary);
    this.issuesByType = Map.copyOf(issuesByType);
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

    var combinedIssues = new HashMap<>(first.issuesByType);
    second.issuesByType.forEach((type, issueList) -> {
      combinedIssues.merge(
        type,
        issueList,
        (firstList, secondList) -> {
          List<DataImportIssue> combinedList = new ArrayList<>(firstList);
          combinedList.addAll(secondList);
          return combinedList;
        }
      );
    });

    return new DataImportIssueSummary(combinedSummary, combinedIssues);
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
