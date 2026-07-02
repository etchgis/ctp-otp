export function generateDebugUIUrl(scenario, fromResult, toResult, baseUrl = 'http://localhost:8080') {
  // Build variables object
  const variables = {
    from: {
      coordinates: {
        latitude: fromResult.location.coordinates.latitude,
        longitude: fromResult.location.coordinates.longitude
      }
    },
    to: {
      coordinates: {
        latitude: toResult.location.coordinates.latitude,
        longitude: toResult.location.coordinates.longitude
      }
    },
    dateTime: scenario.dateTime
  };

  // Add modes if specified
  if (scenario.modes) {
    variables.modes = {};

    // Map direct mode to directMode
    if (scenario.modes.direct) {
      variables.modes.directMode = scenario.modes.direct;
    }

    // Map access/egress modes
    if (scenario.modes.access) {
      variables.modes.accessMode = scenario.modes.access;
    }
    if (scenario.modes.egress) {
      variables.modes.egressMode = scenario.modes.egress;
    }

    // Map transit modes array to transportModes (Transmodel API field name)
    if (scenario.modes.transit && scenario.modes.transit.length > 0) {
      variables.modes.transportModes = scenario.modes.transit.map(mode => ({
        transportMode: mode.toLowerCase()  // Transmodel uses lowercase enum values
      }));
    }
  }

  // Add unpreferred agencies if specified
  if (scenario.unpreferred && scenario.unpreferred.agencies) {
    variables.unpreferred = {
      agencies: scenario.unpreferred.agencies.map(id => ({ id }))
    };
  }

  // Add banned authorities if specified
  if (scenario.banned && scenario.banned.authorities) {
    variables.banned = {
      authorities: scenario.banned.authorities
    };
  }

  // Convert to JSON string
  const variablesJson = JSON.stringify(variables);

  // URL encode twice (as required by the debug UI)
  const encoded = encodeURIComponent(encodeURIComponent(variablesJson));

  // Calculate map center and zoom
  const centerLat = (fromResult.location.coordinates.latitude + toResult.location.coordinates.latitude) / 2;
  const centerLon = (fromResult.location.coordinates.longitude + toResult.location.coordinates.longitude) / 2;

  // Calculate rough zoom level based on distance
  const latDiff = Math.abs(fromResult.location.coordinates.latitude - toResult.location.coordinates.latitude);
  const lonDiff = Math.abs(fromResult.location.coordinates.longitude - toResult.location.coordinates.longitude);
  const maxDiff = Math.max(latDiff, lonDiff);

  let zoom = 14;
  if (maxDiff > 0.1) zoom = 12;
  else if (maxDiff > 0.05) zoom = 13;
  else if (maxDiff < 0.01) zoom = 15;

  // Build the URL with hash for map position
  const url = `${baseUrl}/?variables=${encoded}#${zoom}/${centerLat.toFixed(5)}/${centerLon.toFixed(5)}`;

  return url;
}

// Helper function to generate a shortened URL description
export function getDebugUIDescription(scenario) {
  return `Debug: ${scenario.name}`;
}