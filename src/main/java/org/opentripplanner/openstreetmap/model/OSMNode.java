package org.opentripplanner.openstreetmap.model;

import java.util.Set;
import org.locationtech.jts.geom.Coordinate;
import org.opentripplanner.street.model.StreetTraversalPermission;

public class OSMNode extends OSMWithTags {

  public double lat;
  public double lon;

  public String toString() {
    return "osm node " + id;
  }

  public Coordinate getCoordinate() {
    return new Coordinate(this.lon, this.lat);
  }

  /**
   * Is this a multi-level node that should be decomposed to multiple coincident nodes? Currently
   * returns true only for elevators.
   *
   * @return whether the node is multi-level
   * @author mattwigway
   */
  public boolean isMultiLevel() {
    return isElevator();
  }

  public boolean hasHighwayTrafficLight() {
    return hasTag("highway") && "traffic_signals".equals(getTag("highway"));
  }

  public boolean hasCrossingTrafficLight() {
    return hasTag("crossing") && "traffic_signals".equals(getTag("crossing"));
  }

  static final Set<String> motorVehicleBarriers = Set.of("bollard", "bar", "chain");

  /* Checks if this node is a barrier which prevents motor vehicle traffic
   *
   * @return true if it is
   */
  public boolean isMotorVehicleBarrier() {
    var barrier = this.getTag("barrier");
    return barrier != null && motorVehicleBarriers.contains(barrier);
  }

  /**
   * Checks if this node blocks traversal in any way
   *
   * @return true if it does
   */
  public boolean isBarrier() {
    return (
      isMotorVehicleBarrier() ||
      isPedestrianExplicitlyDenied() ||
      isBicycleExplicitlyDenied() ||
      isMotorcarExplicitlyDenied() ||
      isMotorVehicleExplicitlyDenied() ||
      isGeneralAccessDenied()
    );
  }

  /**
   * Consider barrier tag in  permissions. Leave the rest for the super class.
   */
  @Override
  public StreetTraversalPermission overridePermissions(StreetTraversalPermission def) {
    StreetTraversalPermission permission = def;
    if (isMotorVehicleBarrier()) {
      permission = permission.remove(StreetTraversalPermission.CAR);
    }
    return super.overridePermissions(permission);
  }

  @Override
  public String url() {
    return String.format("https://www.openstreetmap.org/node/%d", getId());
  }
}
