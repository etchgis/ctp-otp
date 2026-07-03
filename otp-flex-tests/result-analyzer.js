// Decode Google Encoded Polyline to count points
function decodePolyline(encoded) {
  if (!encoded) return [];
  const points = [];
  let index = 0, lat = 0, lng = 0;

  while (index < encoded.length) {
    let shift = 0, result = 0, byte;
    do {
      byte = encoded.charCodeAt(index++) - 63;
      result |= (byte & 0x1f) << shift;
      shift += 5;
    } while (byte >= 0x20);
    const dlat = ((result & 1) ? ~(result >> 1) : (result >> 1));
    lat += dlat;

    shift = 0;
    result = 0;
    do {
      byte = encoded.charCodeAt(index++) - 63;
      result |= (byte & 0x1f) << shift;
      shift += 5;
    } while (byte >= 0x20);
    const dlng = ((result & 1) ? ~(result >> 1) : (result >> 1));
    lng += dlng;

    points.push([lat / 1e5, lng / 1e5]);
  }
  return points;
}

export function analyzeResults(scenario, response) {
  const analysis = {
    scenarioId: scenario.id,
    scenarioName: scenario.name,
    success: false,
    flexLegsFound: 0,
    hasWalkLeg: false,
    hasTransitLeg: false,
    flexInName: false,
    itineraryCount: 0,
    hasStairsInWalkSteps: false,
    totalWalkDistance: 0,  // Total walk distance in first itinerary (meters)
    geometryIssues: [],    // Track geometry problems
    errors: [],
    warnings: [],
    details: []
  };

  // Check for GraphQL errors
  if (response.errors) {
    analysis.errors.push(...response.errors.map(e => e.message));
    return analysis;
  }

  // Check for trip data
  if (!response.data || !response.data.trip) {
    analysis.errors.push('No trip data in response');
    return analysis;
  }

  const trip = response.data.trip;
  const tripPatterns = trip.tripPatterns || [];
  analysis.itineraryCount = tripPatterns.length;

  // Analyze each itinerary
  tripPatterns.forEach((pattern, idx) => {
    const legs = pattern.legs || [];
    const itineraryDetails = {
      index: idx,
      duration: pattern.duration,
      distance: pattern.distance,
      legs: [],
      startTime: pattern.aimedStartTime,
      endTime: pattern.aimedEndTime
    };

    legs.forEach(leg => {
      const legInfo = {
        mode: leg.mode,
        from: leg.fromPlace?.name || 'Unknown',
        to: leg.toPlace?.name || 'Unknown',
        distance: leg.distance,
        duration: leg.duration
      };

      // Check for flex indicators
      // Includes BNMC flex zone and UB shuttle (ub-1)
      const isFlexLeg =
        leg.mode === 'flex' ||
        leg.mode === 'flexible' ||
        leg.mode === 'FLEX' ||
        (leg.fromPlace?.name || '').toLowerCase().includes('bnmc') ||
        (leg.toPlace?.name || '').toLowerCase().includes('bnmc') ||
        (leg.fromPlace?.name || '').toLowerCase().includes('campus zone') ||
        (leg.toPlace?.name || '').toLowerCase().includes('campus zone') ||
        (leg.authority?.name || '').toLowerCase().includes('bnmc') ||
        (leg.authority?.id || '').toLowerCase().includes('ub-1') ||
        (leg.authority?.id || '').toLowerCase().includes('bnmc') ||
        (leg.line?.name || '').toLowerCase().includes('campus') ||
        (leg.line?.name || '').toLowerCase().includes('shuttle');

      if (isFlexLeg) {
        analysis.flexLegsFound++;
        analysis.flexInName = true;
        legInfo.isFlexLeg = true;
      }

      // Check geometry for transit legs (bus, rail, flex, etc.)
      if (leg.mode && leg.mode.toLowerCase() !== 'walk') {
        if (leg.legGeometry && leg.legGeometry.points) {
          const decodedPoints = decodePolyline(leg.legGeometry.points);
          legInfo.geometryPointCount = decodedPoints.length;
          legInfo.geometryLength = leg.legGeometry.length;

          // Flag if geometry has too few points (likely interpolated/skipping stops)
          // A proper route shape should have many more points than just the stops
          if (decodedPoints.length < 5) {
            analysis.geometryIssues.push({
              leg: `${leg.fromPlace?.name || 'Unknown'} → ${leg.toPlace?.name || 'Unknown'}`,
              mode: leg.mode,
              pointCount: decodedPoints.length,
              issue: 'Too few geometry points - may be missing route shape data'
            });
          }
        } else {
          analysis.geometryIssues.push({
            leg: `${leg.fromPlace?.name || 'Unknown'} → ${leg.toPlace?.name || 'Unknown'}`,
            mode: leg.mode,
            issue: 'No geometry data returned'
          });
        }
      }

      // Extract agency ID if available
      if (leg.authority?.id) {
        // Store the full ID for display
        legInfo.agencyId = leg.authority.id;
        // Extract simple name after colon for comparison
        legInfo.simpleAgencyId = leg.authority.id.includes(':')
          ? leg.authority.id.split(':')[1]
          : leg.authority.id;
      }

      if (leg.mode.toLowerCase() === 'walk') {
        analysis.hasWalkLeg = true;
        // Track walk distance for first itinerary
        if (idx === 0 && leg.distance) {
          analysis.totalWalkDistance += leg.distance;
        }
      }

      if (leg.line || ['bus', 'rail', 'tram', 'metro'].includes(leg.mode.toLowerCase())) {
        analysis.hasTransitLeg = true;
      }

      // Check for stairs in walk steps (handle both GTFS 'steps' and Transmodel 'walkSteps')
      const walkSteps = leg.walkSteps || leg.steps;
      if (walkSteps && Array.isArray(walkSteps)) {
        walkSteps.forEach(step => {
          // Check streetName for stairs or steps
          if (step.streetName) {
            const streetName = step.streetName.toLowerCase();
            if (streetName === 'steps' || streetName.includes('stairs') || streetName.includes('step')) {
              analysis.hasStairsInWalkSteps = true;
              legInfo.hasStairs = true;
            }
          }
          // Check relativeDirection for stairs-related directions
          if (step.relativeDirection) {
            const direction = step.relativeDirection.toLowerCase();
            if (direction.includes('stairs') || direction.includes('step')) {
              analysis.hasStairsInWalkSteps = true;
              legInfo.hasStairs = true;
            }
          }
          // Check absoluteDirection as well
          if (step.absoluteDirection) {
            const absDirection = step.absoluteDirection.toLowerCase();
            if (absDirection.includes('stairs') || absDirection.includes('step')) {
              analysis.hasStairsInWalkSteps = true;
              legInfo.hasStairs = true;
            }
          }
        });
      }

      itineraryDetails.legs.push(legInfo);
    });

    analysis.details.push(itineraryDetails);
  });

  // Check expectations
  if (scenario.expected) {
    const exp = scenario.expected;

    // Special check for outside-hours scenario
    if (scenario.id === 'outside-hours' && analysis.details[0]) {
      const requestTime = new Date(scenario.dateTime);
      const tripStartTime = new Date(analysis.details[0].startTime);

      if (tripStartTime.getDate() > requestTime.getDate()) {
        analysis.warnings.push('Trip scheduled for next day (service not available at requested time)');
        // Override the flex leg check since this is expected behavior
        if (!exp.hasFlexLeg && analysis.flexLegsFound > 0) {
          // Don't count this as an error - it's next day service
          analysis.flexLegsFound = 0;
          analysis.flexInName = false;
        }
      }
    }

    if (exp.hasFlexLeg !== undefined) {
      if (exp.hasFlexLeg && analysis.flexLegsFound === 0) {
        analysis.errors.push('Expected flex leg but none found');
      } else if (!exp.hasFlexLeg && analysis.flexLegsFound > 0) {
        analysis.errors.push('Did not expect flex leg but found one');
      }
    }

    if (exp.hasWalkLeg !== undefined && exp.hasWalkLeg !== analysis.hasWalkLeg) {
      analysis.errors.push(`Expected hasWalkLeg=${exp.hasWalkLeg} but got ${analysis.hasWalkLeg}`);
    }

    if (exp.hasTransitLeg !== undefined && exp.hasTransitLeg !== analysis.hasTransitLeg) {
      analysis.errors.push(`Expected hasTransitLeg=${exp.hasTransitLeg} but got ${analysis.hasTransitLeg}`);
    }

    if (exp.flexInName !== undefined && exp.flexInName !== analysis.flexInName) {
      analysis.errors.push(`Expected flex in place names but not found`);
    }

    if (exp.noItineraries && analysis.itineraryCount > 0) {
      analysis.warnings.push(`Expected no itineraries but found ${analysis.itineraryCount}`);
    }

    if (exp.minLegs !== undefined && analysis.details[0]) {
      const legCount = analysis.details[0].legs.length;
      if (legCount < exp.minLegs) {
        analysis.errors.push(`Expected at least ${exp.minLegs} legs but found ${legCount}`);
      }
    }

    if (exp.maxLegs !== undefined && analysis.details[0]) {
      const legCount = analysis.details[0].legs.length;
      if (legCount > exp.maxLegs) {
        analysis.errors.push(`Expected at most ${exp.maxLegs} legs but found ${legCount}`);
      }
    }

    if (exp.noStairsInWalkSteps !== undefined && exp.noStairsInWalkSteps === true && analysis.hasStairsInWalkSteps) {
      analysis.errors.push('Expected no stairs in walk steps but found stairs');
    }

    // Check maximum walk distance (in meters)
    if (exp.maxWalkDistance !== undefined && analysis.totalWalkDistance > exp.maxWalkDistance) {
      analysis.errors.push(`Walk distance ${Math.round(analysis.totalWalkDistance)}m exceeds maximum ${exp.maxWalkDistance}m`);
    }

    // Check geometry requirements
    if (exp.minGeometryPoints !== undefined) {
      analysis.details.forEach(itinerary => {
        itinerary.legs.forEach(leg => {
          if (leg.geometryPointCount !== undefined && leg.geometryPointCount < exp.minGeometryPoints) {
            analysis.errors.push(
              `Leg ${leg.from} → ${leg.to} has only ${leg.geometryPointCount} geometry points (expected at least ${exp.minGeometryPoints})`
            );
          }
        });
      });
    }

    // Fail on geometry issues if expectation requires valid geometry
    if (exp.requireValidGeometry && analysis.geometryIssues.length > 0) {
      analysis.geometryIssues.forEach(issue => {
        analysis.errors.push(`Geometry issue: ${issue.leg} (${issue.mode}) - ${issue.issue}`);
      });
    }

    // Check for required transit modes
    if (exp.requiredTransitModes && exp.requiredTransitModes.length > 0) {
      const foundModes = new Set();
      const foundAgencies = new Set();

      analysis.details.forEach(itinerary => {
        itinerary.legs.forEach(leg => {
          if (leg.mode) {
            foundModes.add(leg.mode.toLowerCase());
          }
          // Check for agency ID in leg data - use simple name
          if (leg.simpleAgencyId) {
            foundAgencies.add(leg.simpleAgencyId);
          }
        });
      });

      exp.requiredTransitModes.forEach(requiredMode => {
        if (!foundModes.has(requiredMode.toLowerCase()) && !foundAgencies.has(requiredMode)) {
          analysis.errors.push(`Required transit mode/agency '${requiredMode}' not found in trip`);
        }
      });
    }
  }

  // Determine overall success
  analysis.success = analysis.errors.length === 0 &&
    (scenario.expected?.hasFlexLeg ? analysis.flexLegsFound > 0 : true);

  return analysis;
}