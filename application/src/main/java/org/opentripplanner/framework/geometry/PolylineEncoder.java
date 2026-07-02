package org.opentripplanner.framework.geometry;

import org.locationtech.jts.geom.Coordinate;
import org.locationtech.jts.geom.Geometry;
import org.locationtech.jts.geom.LineString;
import org.locationtech.jts.geom.MultiLineString;
import org.locationtech.jts.geom.Point;
import org.locationtech.jts.geom.Polygon;

/**
 * This encodes geometries to the Google Polyline encoding
 *
 * {@see EncodedPolyline}
 */
class PolylineEncoder {

  static EncodedPolyline encodeGeometry(Geometry geometry, int precision) {
    if (geometry instanceof LineString string) {
      return encodeCoordinates(string.getCoordinates(), precision);
    } else if (geometry instanceof MultiLineString mls) {
      return encodeCoordinates(mls.getCoordinates(), precision);
    } else if (geometry instanceof Polygon polygon) {
      return encodeCoordinates(polygon.getCoordinates(), precision);
    } else if (geometry instanceof Point point) {
      return encodeCoordinates(point.getCoordinates(), precision);
    } else {
      throw new IllegalArgumentException(geometry.toString());
    }
  }

  static EncodedPolyline encodeCoordinates(Coordinate[] points, int precision) {
    StringBuilder encodedPoints = new StringBuilder();

    int plat = 0;
    int plng = 0;
    int count = 0;
    int factor = (int) Math.pow(10, precision);

    for (Coordinate point : points) {
      int lateN = floorN(point.y, factor);
      int lngeN = floorN(point.x, factor);

      int dlat = lateN - plat;
      int dlng = lngeN - plng;

      plat = lateN;
      plng = lngeN;

      encodedPoints.append(encodeSignedNumber(dlat)).append(encodeSignedNumber(dlng));
      count++;
    }

    return new EncodedPolyline(encodedPoints.toString(), count);
  }

  private static String encodeSignedNumber(int num) {
    int sgn_num = num << 1;
    if (num < 0) {
      sgn_num = ~(sgn_num);
    }
    return encodeNumber(sgn_num);
  }

  private static String encodeNumber(int num) {
    StringBuilder encodeString = new StringBuilder();

    while (num >= 0x20) {
      int nextValue = (0x20 | (num & 0x1f)) + 63;
      encodeString.append((char) nextValue);
      num >>= 5;
    }

    num += 63;
    encodeString.append((char) num);

    return encodeString.toString();
  }

  private static int floorN(double coordinate, int factor) {
    return (int) Math.floor(coordinate * factor);
  }
}
