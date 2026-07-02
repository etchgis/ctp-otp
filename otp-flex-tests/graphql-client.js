import axios from 'axios';
import { getEndpointUrl, config } from './config.js';
import { resolveLocation } from './geocoder.js';

// Cache for agency mappings
let agencyMappingsCache = null;

// GTFS GraphQL query for agencies
const AGENCIES_QUERY = `
query {
  agencies {
    gtfsId
    name
  }
}`;

// GTFS GraphQL query for trip planning
const GTFS_TRIP_QUERY = `
query plan(
  $from: InputCoordinates!,
  $to: InputCoordinates!,
  $date: String,
  $time: String,
  $arriveBy: Boolean,
  $wheelchair: Boolean,
  $numItineraries: Int,
  $transportModes: [TransportMode],
  $walkReluctance: Float,
  $waitReluctance: Float,
  $transferPenalty: Int,
  $banned: InputBanned
) {
  plan(
    from: $from
    to: $to
    date: $date
    time: $time
    arriveBy: $arriveBy
    wheelchair: $wheelchair
    numItineraries: $numItineraries
    transportModes: $transportModes
    walkReluctance: $walkReluctance
    waitReluctance: $waitReluctance
    transferPenalty: $transferPenalty
    banned: $banned
  ) {
    itineraries {
      start
      end
      duration
      walkTime
      waitingTime
      walkDistance
      generalizedCost
      legs {
        start {
          scheduledTime
          estimated {
            time
          }
        }
        end {
          scheduledTime
          estimated {
            time
          }
        }
        mode
        duration
        realTime
        distance
        transitLeg
        from {
          name
          lat
          lon
          stop {
            gtfsId
            name
            code
          }
        }
        to {
          name
          lat
          lon
          stop {
            gtfsId
            name
            code
          }
        }
        route {
          gtfsId
          shortName
          longName
          type
          color
        }
        trip {
          gtfsId
          tripHeadsign
        }
        agency {
          gtfsId
          name
          url
        }
        intermediateStops {
          name
          gtfsId
        }
        legGeometry {
          points
          length
        }
        steps {
          relativeDirection
          absoluteDirection
          distance
          streetName
          stayOn
          area
          bogusName
          alerts {
            alertHeaderText
            alertDescriptionText
            alertUrl
          }
        }
      }
    }
    messageEnums
    messageStrings
  }
}`;

// Transmodel GraphQL query (kept for compatibility)
const TRANSMODEL_TRIP_QUERY = `
query trip(
  $from: Location!,
  $to: Location!,
  $dateTime: DateTime,
  $modes: Modes,
  $arriveBy: Boolean,
  $wheelchairAccessible: Boolean,
  $numTripPatterns: Int,
  $walkReluctance: Float,
  $waitReluctance: Float,
  $transferPenalty: Int,
  $searchWindow: Int
) {
  trip(
    from: $from
    to: $to
    dateTime: $dateTime
    modes: $modes
    arriveBy: $arriveBy
    wheelchairAccessible: $wheelchairAccessible
    numTripPatterns: $numTripPatterns
    walkReluctance: $walkReluctance
    waitReluctance: $waitReluctance
    transferPenalty: $transferPenalty
    searchWindow: $searchWindow
  ) {
    previousPageCursor
    nextPageCursor
    tripPatterns {
      aimedStartTime
      aimedEndTime
      expectedEndTime
      expectedStartTime
      duration
      distance
      generalizedCost
      legs {
        id
        mode
        aimedStartTime
        aimedEndTime
        expectedEndTime
        expectedStartTime
        realtime
        distance
        duration
        generalizedCost
        fromPlace {
          name
          quay {
            id
          }
        }
        toPlace {
          name
          quay {
            id
          }
        }
        line {
          publicCode
          name
          id
        }
        authority {
          name
          id
        }
        walkSteps {
          relativeDirection
          absoluteDirection
          distance
          streetName
          alerts {
            alertText
          }
        }
      }
      systemNotices {
        tag
      }
    }
  }
}`;

export async function queryTrip(variables) {
  try {
    let query, transformedVariables, operationName;

    if (config.apiType === 'gtfs') {
      query = GTFS_TRIP_QUERY;
      operationName = 'plan';
      // Transform variables for GTFS API
      transformedVariables = await transformVariablesForGTFS(variables);
    } else {
      query = TRANSMODEL_TRIP_QUERY;
      operationName = 'trip';
      transformedVariables = variables;

      // Add walk reluctance for Transmodel if using flex modes
      if (variables.modes && (variables.modes.accessMode === 'flexible' ||
          variables.modes.egressMode === 'flexible' ||
          variables.modes.directMode === 'flexible')) {
        transformedVariables.walkReluctance = 5.0;
        transformedVariables.waitReluctance = 0.8;  // Lower wait reluctance - waiting is better than walking
        transformedVariables.transferPenalty = 300; // 5 minute penalty for transfers
        transformedVariables.searchWindow = 60;    // Search within 60 minute window
      }
    }

    const response = await axios.post(
      getEndpointUrl(),
      {
        query,
        variables: transformedVariables,
        operationName
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/graphql-response+json, application/json'
        },
        timeout: config.timeout
      }
    );

    // Transform response if using GTFS API
    if (config.apiType === 'gtfs') {
      return transformGTFSResponse(response.data);
    }

    return response.data;
  } catch (error) {
    if (error.response) {
      return {
        error: true,
        status: error.response.status,
        data: error.response.data
      };
    }
    throw error;
  }
}

async function transformVariablesForGTFS(variables) {
  // Convert datetime to separate date and time for GTFS API
  const dateTime = new Date(variables.dateTime);
  const date = dateTime.toISOString().split('T')[0]; // YYYY-MM-DD
  const time = dateTime.toTimeString().split(' ')[0]; // HH:MM:SS

  const gtfsVariables = {
    from: {
      lat: variables.from.coordinates.latitude,
      lon: variables.from.coordinates.longitude
    },
    to: {
      lat: variables.to.coordinates.latitude,
      lon: variables.to.coordinates.longitude
    },
    date,
    time,
    arriveBy: variables.arriveBy || false,
    wheelchair: variables.wheelchairAccessible || false,
    numItineraries: variables.numTripPatterns || 5,
    transportModes: transformModesForGTFS(variables.modes)
  };

  // Add preferences to minimize walking if we have flex modes
  if (variables.modes && (variables.modes.accessMode === 'flexible' ||
      variables.modes.egressMode === 'flexible' ||
      variables.modes.directMode === 'flexible')) {
    gtfsVariables.walkReluctance = variables.walkReluctance || 5.0;  // Use provided value or default
    gtfsVariables.waitReluctance = 0.8;  // Lower wait reluctance - waiting is better than walking
    gtfsVariables.transferPenalty = 300; // 5 minute penalty for transfers
    gtfsVariables.maxSearchWindow = 60; // Search within 60 minute window
  } else if (variables.walkReluctance) {
    // Also set walk reluctance if explicitly provided, even without flex modes
    gtfsVariables.walkReluctance = variables.walkReluctance;
  }

  // Add banned agencies if specified
  if (variables.banned && variables.banned.authorities) {
    // Normalize agency IDs first
    const normalizedAgencies = await normalizeAgencyIds(variables.banned.authorities);
    gtfsVariables.banned = {
      agencies: normalizedAgencies.join(',')  // GTFS expects comma-separated string
    };
  }

  return gtfsVariables;
}

function transformModesForGTFS(modes) {
  // Transform modes from Transmodel format to GTFS TransportMode array
  const transportModes = [];

  // Add basic modes first
  if (modes.transportModes) {
    modes.transportModes.forEach(mode => {
      transportModes.push({
        mode: mode.toUpperCase()
      });
    });
  }

  // Handle access/egress/direct flexible modes
  if (modes.accessMode === 'flexible') {
    transportModes.push({
      mode: 'FLEX',
      qualifier: 'ACCESS'
    });
  }

  if (modes.egressMode === 'flexible') {
    transportModes.push({
      mode: 'FLEX',
      qualifier: 'EGRESS'
    });
  }

  if (modes.directMode === 'flexible') {
    transportModes.push({
      mode: 'FLEX',
      qualifier: 'DIRECT'
    });
  }

  // Default to WALK and TRANSIT if no modes specified
  if (transportModes.length === 0) {
    transportModes.push(
      { mode: 'WALK' },
      { mode: 'TRANSIT' }
    );
  }

  return transportModes;
}

function transformGTFSResponse(gtfsResponse) {
  // Transform GTFS response to match Transmodel structure for consistency
  if (!gtfsResponse.data || !gtfsResponse.data.plan) {
    return gtfsResponse;
  }

  const plan = gtfsResponse.data.plan;

  return {
    data: {
      trip: {
        tripPatterns: plan.itineraries.map(itinerary => ({
          aimedStartTime: itinerary.start,
          aimedEndTime: itinerary.end,
          expectedStartTime: itinerary.start,
          expectedEndTime: itinerary.end,
          duration: itinerary.duration,
          distance: itinerary.walkDistance,
          generalizedCost: itinerary.generalizedCost,
          legs: itinerary.legs.map(leg => ({
            id: `${leg.from.name}-${leg.to.name}`,
            mode: leg.mode,
            aimedStartTime: leg.start?.scheduledTime || leg.start?.estimated?.time,
            aimedEndTime: leg.end?.scheduledTime || leg.end?.estimated?.time,
            expectedStartTime: leg.start?.estimated?.time || leg.start?.scheduledTime,
            expectedEndTime: leg.end?.estimated?.time || leg.end?.scheduledTime,
            realtime: leg.realTime,
            distance: leg.distance,
            duration: leg.duration,
            generalizedCost: 0, // Not available in GTFS API
            fromPlace: {
              name: leg.from.name,
              quay: leg.from.stop ? { id: leg.from.stop.gtfsId } : null
            },
            toPlace: {
              name: leg.to.name,
              quay: leg.to.stop ? { id: leg.to.stop.gtfsId } : null
            },
            line: leg.route ? {
              publicCode: leg.route.shortName,
              name: leg.route.longName,
              id: leg.route.gtfsId
            } : null,
            authority: leg.agency ? {
              name: leg.agency.name,
              id: leg.agency.gtfsId
            } : null,
            steps: leg.steps, // Pass through the steps for GTFS
            legGeometry: leg.legGeometry // Pass through geometry for validation
          }))
        }))
      }
    },
    errors: gtfsResponse.errors
  };
}

export function createLocation(lat, lon) {
  return {
    coordinates: {
      latitude: lat,
      longitude: lon
    }
  };
}

export async function createLocationFromInput(locationInput, options = {}) {
  const resolved = await resolveLocation(locationInput, options);
  return {
    location: createLocation(resolved.lat, resolved.lon),
    info: {
      title: resolved.title,
      description: resolved.description,
      coordinates: { lat: resolved.lat, lon: resolved.lon }
    }
  };
}

// Fetch agencies from the server
async function fetchAgencyMappings() {
  if (agencyMappingsCache) {
    return agencyMappingsCache;
  }

  try {
    const endpointUrl = getEndpointUrl();
    const response = await axios.post(endpointUrl, {
      query: AGENCIES_QUERY
    });

    if (response.data && response.data.data && response.data.data.agencies) {
      const mappings = {};

      response.data.data.agencies.forEach(agency => {
        const gtfsId = agency.gtfsId;
        const name = agency.name;

        // Map by the part after the colon (e.g., "NFTA" from "3:NFTA")
        const simpleName = gtfsId.includes(':') ? gtfsId.split(':')[1] : gtfsId;

        // Create multiple mappings for flexibility
        mappings[simpleName] = gtfsId;  // NFTA -> 3:NFTA
        mappings[simpleName.toLowerCase()] = gtfsId;  // nfta -> 3:NFTA
        mappings[gtfsId] = gtfsId;  // 3:NFTA -> 3:NFTA (passthrough)

        // Also map by agency name if different
        if (name && name !== simpleName) {
          mappings[name] = gtfsId;
          mappings[name.toLowerCase()] = gtfsId;
        }
      });

      agencyMappingsCache = mappings;
      return mappings;
    }
  } catch (error) {
    console.error('Failed to fetch agency mappings:', error.message);
  }

  // Return empty mappings if fetch fails
  return {};
}

// Normalize agency IDs using server data
async function normalizeAgencyIds(agencies) {
  if (!Array.isArray(agencies)) {
    return [];
  }

  const mappings = await fetchAgencyMappings();

  return agencies.map(agency => {
    // Check if we have a mapping for this agency
    const mapped = mappings[agency];
    if (mapped) {
      return mapped;
    }

    // If no mapping found, return as-is
    console.warn(`Warning: No mapping found for agency '${agency}', using as-is`);
    return agency;
  });
}

export function createModes(config) {
  const modes = {};

  if (config.direct) modes.directMode = config.direct;
  if (config.access) modes.accessMode = config.access;
  if (config.egress) modes.egressMode = config.egress;
  if (config.transit) modes.transportModes = config.transit;

  return modes;
}