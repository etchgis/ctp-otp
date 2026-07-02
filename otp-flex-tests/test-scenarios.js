export const testScenarios = [

  // Scenarios from Darlene
  // HDS = Human-Driven Shuttle (flex service)
  // SDS = Self-Driving Shuttle (frequency-based transit)

  // Scenario 1a: Rail-bus - Rob's office to Jefferson & Best
  {
    id: 'rail-bus-1a',
    name: 'Rail-Bus: Ellicott to Jefferson',
    description: "Rob's office (outside) to Summer Best (inside) take 22 to Jefferson",
    from: '181 Ellicott Street, Buffalo, NY',
    to: 'Jefferson Avenue and Best Street, Buffalo, NY',
    time: '11:00:00',
    modes: {
      transit: ['rail', 'bus']
    },
    expected: {
      hasTransitLeg: true,
      minLegs: 1
    }
  },

  // Scenario 1b: Rail-bus - UB South to Seneca Casino
  {
    id: 'rail-bus-1b',
    name: 'Rail-Bus: UB South to Casino',
    description: 'University Buffalo South to Allen and connect 14 or 16 south to Seneca Buffalo Creek Casino',
    from: 'University at Buffalo South Campus',
    to: 'Seneca Buffalo Creek Casino',
    time: '10:30:00',
    modes: {
      transit: ['rail', 'bus']
    },
    expected: {
      hasTransitLeg: true,
      minLegs: 1
    }
  },

  // Scenario 3: Rail to HDS (flex) - Utica to Future's Academy
  {
    id: 'rail-to-hds',
    name: 'Rail to HDS: Utica to Futures Academy',
    description: 'Utica station to Fruitbelt (Futures Academy; Carlton/Orange) using rail and flex',
    from: 'Utica Station, Buffalo, NY',
    to: '295 Carlton Street, Buffalo, NY', // Future's Academy
    time: '10:45:00',
    modes: {
      transit: ['rail'],
      access: 'flexible',
      egress: 'flexible',
      direct: 'flexible'
    },
    expected: {
      hasTransitLeg: true,
      hasFlexLeg: true,
      flexInName: true
    }
  },

  // Scenario 4a: Bus to bus - Outside to outside via Allen station
  {
    id: 'bus-to-bus-4a',
    name: 'Bus-Bus: Utica to Casino',
    description: 'Outside to outside: Allen station transfer (8 to 14 or 16)',
    from: 'Utica Station, Buffalo, NY',
    to: 'Seneca Buffalo Creek Casino',
    time: '14:45:00',
    modes: {
      transit: ['bus']
    },
    expected: {
      hasTransitLeg: true
    }
  },

  // Scenario 4b: Bus to bus - Outside to inside
  {
    id: 'bus-to-bus-4b',
    name: 'Bus-Bus: Jefferson to Main',
    description: 'Outside to inside: Route 8 to 22 at Summer Best transfer',
    from: 'Jefferson Avenue and Best Street, Buffalo, NY',
    to: '1618 Main Street, Buffalo, NY', // Dollar General
    time: '15:10:00',
    modes: {
      transit: ['bus']
    },
    expected: {
      hasTransitLeg: true
    }
  },

  // Scenario 5a: Bus to rail (reverse of 1a)
  {
    id: 'bus-to-rail-5a',
    name: 'Bus-Rail: Jefferson to Ellicott',
    description: 'Bus to rail reverse of scenario 1a',
    from: 'Jefferson Avenue and Best Street, Buffalo, NY',
    to: '181 Ellicott Street, Buffalo, NY',
    time: '15:15:00',
    modes: {
      transit: ['rail', 'bus']
    },
    expected: {
      hasTransitLeg: true
    }
  },

  // Scenario 5b: Bus to rail (reverse of 1b)
  {
    id: 'bus-to-rail-5b',
    name: 'Bus-Rail: Casino to UB South',
    description: 'Bus to rail reverse of scenario 1b',
    from: 'Seneca Buffalo Creek Casino',
    to: 'University at Buffalo South Campus',
    time: '15:20:00',
    modes: {
      transit: ['rail', 'bus']
    },
    expected: {
      hasTransitLeg: true
    }
  },

  // Scenario 7: Bus to HDS - Route 22 at Summer/Best to Tops
  {
    id: 'bus-to-hds',
    name: 'Bus to HDS: Senior Center to Tops',
    description: 'Route 22 at Summer/Best to library or Tops on Jefferson Ave using flex',
    from: '337 Summer Street, Buffalo, NY', // Richmond-Summer Senior Citizen Center
    to: '1275 Jefferson Avenue, Buffalo, NY', // Tops
    time: '15:30:00',
    modes: {
      transit: ['bus'],
      access: 'flexible',
      egress: 'flexible'
    },
    expected: {
      hasTransitLeg: true,
      hasFlexLeg: true,
      flexInName: true
    }
  },

  // Scenario 10: HDS to rail (reverse of 3)
  {
    id: 'hds-to-rail',
    name: 'HDS to Rail: Futures Academy to Utica',
    description: 'HDS (flex) to rail reverse of scenario 3',
    from: '295 Carlton Street, Buffalo, NY', // Future's Academy
    to: 'Utica Station, Buffalo, NY',
    time: '15:30:00',
    modes: {
      transit: ['rail'],
      access: 'flexible',
      egress: 'flexible',
      direct: 'flexible'
    },
    expected: {
      hasTransitLeg: true,
      hasFlexLeg: true,
      flexInName: true
    }
  },

  {
    id: 'within-zone',
    name: 'Both points inside BNMC zone',
    description: 'Direct FLEX trip between two points within the campus zone',
    from: { lat: 42.893856, lon: -78.864563 },
    to: { lat: 42.899735, lon: -78.867030 },
    time: '13:09:00',
    modes: {
      direct: 'flexible',
      access: 'flexible',
      egress: 'flexible'
    },
    expected: {
      hasFlexLeg: true,
      flexInName: true,
      minLegs: 1,
      maxLegs: 3
    }
  },
  {
    id: 'walk-to-zone',
    name: 'Walk to zone boundary',
    description: 'User walks from outside to inside the campus zone',
    from: { lat: 42.9046, lon: -78.8596 },
    to: { lat: 42.89252095018077, lon: -78.86169181982142 },
    time: '10:00:00',
    modes: {
      direct: 'flexible',
      access: 'flexible',
      egress: 'flexible'
    },
    expected: {
      hasFlexLeg: true,
      hasWalkLeg: true,
      flexInName: true,
      minLegs: 2
    }
  },
  {
    id: 'walk-from-zone',
    name: 'Walk from zone boundary',
    description: 'User takes shuttle to zone boundary then walks',
    from: { lat: 42.89252095018077, lon: -78.86169181982142 },
    to: { lat: 42.9046, lon: -78.8596 },
    time: '14:30:00',
    modes: {
      direct: 'flexible',
      access: 'flexible',
      egress: 'flexible'
    },
    expected: {
      hasFlexLeg: true,
      hasWalkLeg: true,
      flexInName: true,
      minLegs: 2
    }
  },
  {
    id: 'early-morning',
    name: 'Early morning service',
    description: 'Testing within service hours (6 AM start)',
    from: { lat: 42.90, lon: -78.86 },
    to: { lat: 42.91, lon: -78.85 },
    time: '06:30:00',
    modes: {
      direct: 'flexible',
      access: 'flexible',
      egress: 'flexible'
    },
    expected: {
      hasFlexLeg: true,
      flexInName: true
    }
  },
  {
    id: 'outside-hours',
    name: 'Outside service hours',
    description: 'Testing after 6 PM when service ends',
    from: { lat: 42.90, lon: -78.86 },
    to: { lat: 42.91, lon: -78.85 },
    time: '19:00:00',
    modes: {
      direct: 'flexible',
      access: 'flexible',
      egress: 'flexible'
    },
    expected: {
      hasFlexLeg: false,
      noItineraries: true
    }
  },
  {
    id: 'weekend-no-service',
    name: 'Weekend (no service)',
    description: 'Testing on Saturday when there is no service',
    from: { lat: 42.90, lon: -78.86 },
    to: { lat: 42.91, lon: -78.85 },
    time: '13:00:00', weekend: true,
    modes: {
      direct: 'flexible',
      access: 'flexible',
      egress: 'flexible'
    },
    expected: {
      hasFlexLeg: false,
      noItineraries: true
    }
  },
  {
    id: 'far-outside-zone',
    name: 'Too far from zone',
    description: 'Both points far outside the service zone',
    from: { lat: 42.95, lon: -78.80 },
    to: { lat: 42.96, lon: -78.79 },
    time: '13:00:00',
    modes: {
      direct: 'flexible',
      access: 'flexible',
      egress: 'flexible'
    },
    expected: {
      hasFlexLeg: false,
      noItineraries: true
    }
  },

  // Scenario: UB Shuttle only - VIA to Innovation Center
  {
    id: 'ub-shuttle-only',
    name: 'UB Shuttle Only: VIA to Innovation Center',
    description: 'Force use of UB Shuttle by making other agencies unpreferred',
    from: 'VIA Buffalo NY',
    to: 'Innovation Center Buffalo NY',
    time: '13:00:00',
    modes: {
      transit: ['bus'],
      access: 'flexible',
      egress: 'flexible',
      direct: 'flexible'
    },
    unpreferred: {
      // Make all non-UB agencies very unpreferred
      agencies: ['NFTA', 'MET', 'BNMC'],
      cost: '60m + 5.0 t'  // High penalty for non-UB services
    },
    expected: {
      hasFlexLeg: true,
      flexInName: true,
      agencyId: 'ub-1'
    }
  },

  // Scenario: Disable UB Shuttle - VIA to Innovation Center
  {
    id: 'no-ub-shuttle',
    name: 'No UB Shuttle: VIA to Innovation Center',
    description: 'Avoid UB Shuttle by making it unpreferred',
    from: 'VIA Buffalo NY',
    to: 'Innovation Center Buffalo NY',
    time: '13:00:00',
    modes: {
      transit: ['bus', 'rail'],
      access: 'walk',
      egress: 'walk'
    },
    unpreferred: {
      agencies: ['ub-1'],  // Make UB Shuttle unpreferred
      cost: '60m + 5.0 t'  // High penalty for UB Shuttle
    },
    expected: {
      hasTransitLeg: true,
      notAgencyId: 'ub-1'
    }
  },

  // Scenario: No stairs test - ensure walkSteps don't include stairs
  {
    id: 'no-stairs-test',
    name: 'No Stairs: Walk steps should not include stairs',
    description: 'Test that walk steps do not include stairs in the route',
    from: { lat: 42.90106130103308, lon: -78.86698099244465 },
    to: { lat: 42.900360670725746, lon: -78.86634114996224 },
    time: '13:00:00',
    modes: {
      transit: ['bus', 'rail'],
      access: 'walk',
      egress: 'walk'
    },
    expected: {
      hasTransitLeg: false,
      hasWalkLeg: true,
      noStairsInWalkSteps: true
    }
  },

  // Scenario: UB Shuttle - 181 Ellicott St to Virginia/Michigan
  // Tests using UB shuttle by banning BNMC and NFTA
  {
    id: 'ub-flex-ellicott-to-virginia',
    name: 'UB Shuttle: 181 Ellicott to Virginia/Michigan',
    description: 'Trip from 181 Ellicott St to Virginia/Michigan using UB shuttle (flex service)',
    from: '181 Ellicott Street, Buffalo, NY',
    to: 'Virginia Street and Michigan Avenue, Buffalo, NY',
    time: '13:00:00',
    modes: {
      transit: ['bus'],
      access: 'flexible',
      egress: 'flexible',
      direct: 'flexible'
    },
    banned: {
      // Ban both BNMC and NFTA to force UB-1 usage
      authorities: ['BNMC', 'NFTA']
    },
    expected: {
      hasFlexLeg: true,
      hasTransitLeg: true
    }
  },

  // ============================================
  // UB Shuttle All Stop Pairs (56 tests)
  // 8 stops x 7 destinations = 56 combinations
  // Banning BNMC, NFTA, MET to test UB shuttle only
  // ============================================
  //
  // Stop Reference:
  // 1. Carlton   = Michigan Ave & Carlton St South (42.898291, -78.863767)
  // 2. Virginia  = Michigan Ave & Virginia St South (42.896916, -78.864166)
  // 3. Goodell   = Michigan Ave & Goodell St South (42.894412, -78.865085)
  // 4. GoodellEl = Goodell St & Ellicott St West (42.894974, -78.868763)
  // 5. Allen     = Main St & Allen/Medical Campus St (42.899336, -78.869869)
  // 6. MainBest  = Main St & Best St North (42.904445, -78.868191)
  // 7. BestEl    = Best St & Ellicott St East (42.903918, -78.866304)
  // 8. BestMich  = Best St & Michigan Ave East (42.9039, -78.862842)

  // FROM: Carlton (Stop 1)
  { id: 'ub-1-to-2', name: 'UB: Carlton → Virginia', from: { lat: 42.898291, lon: -78.863767 }, to: { lat: 42.896916, lon: -78.864166 }, time: '10:00:00', modes: { transit: ['bus'], access: 'flexible', egress: 'flexible', direct: 'flexible' }, banned: { authorities: ['BNMC', 'NFTA', 'MET'] }, expected: { hasFlexLeg: true, hasTransitLeg: true, maxWalkDistance: 150, requireValidGeometry: true, minGeometryPoints: 10 } },
  { id: 'ub-1-to-3', name: 'UB: Carlton → Goodell', from: { lat: 42.898291, lon: -78.863767 }, to: { lat: 42.894412, lon: -78.865085 }, time: '10:05:00', modes: { transit: ['bus'], access: 'flexible', egress: 'flexible', direct: 'flexible' }, banned: { authorities: ['BNMC', 'NFTA', 'MET'] }, expected: { hasFlexLeg: true, hasTransitLeg: true, maxWalkDistance: 150, requireValidGeometry: true, minGeometryPoints: 10 } },
  { id: 'ub-1-to-4', name: 'UB: Carlton → GoodellEl', from: { lat: 42.898291, lon: -78.863767 }, to: { lat: 42.894974, lon: -78.868763 }, time: '10:10:00', modes: { transit: ['bus'], access: 'flexible', egress: 'flexible', direct: 'flexible' }, banned: { authorities: ['BNMC', 'NFTA', 'MET'] }, expected: { hasFlexLeg: true, hasTransitLeg: true, maxWalkDistance: 150, requireValidGeometry: true, minGeometryPoints: 10 } },
  { id: 'ub-1-to-5', name: 'UB: Carlton → Allen', from: { lat: 42.898291, lon: -78.863767 }, to: { lat: 42.899336, lon: -78.869869 }, time: '10:15:00', modes: { transit: ['bus'], access: 'flexible', egress: 'flexible', direct: 'flexible' }, banned: { authorities: ['BNMC', 'NFTA', 'MET'] }, expected: { hasFlexLeg: true, hasTransitLeg: true, maxWalkDistance: 150, requireValidGeometry: true, minGeometryPoints: 10 } },
  { id: 'ub-1-to-6', name: 'UB: Carlton → MainBest', from: { lat: 42.898291, lon: -78.863767 }, to: { lat: 42.904445, lon: -78.868191 }, time: '10:20:00', modes: { transit: ['bus'], access: 'flexible', egress: 'flexible', direct: 'flexible' }, banned: { authorities: ['BNMC', 'NFTA', 'MET'] }, expected: { hasFlexLeg: true, hasTransitLeg: true, maxWalkDistance: 150, requireValidGeometry: true, minGeometryPoints: 10 } },
  { id: 'ub-1-to-7', name: 'UB: Carlton → BestEl', from: { lat: 42.898291, lon: -78.863767 }, to: { lat: 42.903918, lon: -78.866304 }, time: '10:25:00', modes: { transit: ['bus'], access: 'flexible', egress: 'flexible', direct: 'flexible' }, banned: { authorities: ['BNMC', 'NFTA', 'MET'] }, expected: { hasFlexLeg: true, hasTransitLeg: true, maxWalkDistance: 150, requireValidGeometry: true, minGeometryPoints: 10 } },
  { id: 'ub-1-to-8', name: 'UB: Carlton → BestMich', from: { lat: 42.898291, lon: -78.863767 }, to: { lat: 42.9039, lon: -78.862842 }, time: '10:30:00', modes: { transit: ['bus'], access: 'flexible', egress: 'flexible', direct: 'flexible' }, banned: { authorities: ['BNMC', 'NFTA', 'MET'] }, expected: { hasFlexLeg: true, hasTransitLeg: true, maxWalkDistance: 150, requireValidGeometry: true, minGeometryPoints: 10 } },

  // FROM: Virginia (Stop 2)
  // Adjacent stops (~150m) - use high walkReluctance to force transit over walking
  { id: 'ub-2-to-1', name: 'UB: Virginia → Carlton', from: { lat: 42.896916, lon: -78.864166 }, to: { lat: 42.898291, lon: -78.863767 }, time: '10:35:00', modes: { transit: ['bus'], access: 'flexible', egress: 'flexible', direct: 'flexible' }, banned: { authorities: ['BNMC', 'NFTA', 'MET'] }, walkReluctance: 100, expected: { hasFlexLeg: true, hasTransitLeg: true, maxWalkDistance: 150, requireValidGeometry: true, minGeometryPoints: 10 } },
  { id: 'ub-2-to-3', name: 'UB: Virginia → Goodell', from: { lat: 42.896916, lon: -78.864166 }, to: { lat: 42.894412, lon: -78.865085 }, time: '10:40:00', modes: { transit: ['bus'], access: 'flexible', egress: 'flexible', direct: 'flexible' }, banned: { authorities: ['BNMC', 'NFTA', 'MET'] }, expected: { hasFlexLeg: true, hasTransitLeg: true, maxWalkDistance: 150, requireValidGeometry: true, minGeometryPoints: 10 } },
  { id: 'ub-2-to-4', name: 'UB: Virginia → GoodellEl', from: { lat: 42.896916, lon: -78.864166 }, to: { lat: 42.894974, lon: -78.868763 }, time: '10:45:00', modes: { transit: ['bus'], access: 'flexible', egress: 'flexible', direct: 'flexible' }, banned: { authorities: ['BNMC', 'NFTA', 'MET'] }, expected: { hasFlexLeg: true, hasTransitLeg: true, maxWalkDistance: 150, requireValidGeometry: true, minGeometryPoints: 10 } },
  { id: 'ub-2-to-5', name: 'UB: Virginia → Allen', from: { lat: 42.896916, lon: -78.864166 }, to: { lat: 42.899336, lon: -78.869869 }, time: '10:50:00', modes: { transit: ['bus'], access: 'flexible', egress: 'flexible', direct: 'flexible' }, banned: { authorities: ['BNMC', 'NFTA', 'MET'] }, expected: { hasFlexLeg: true, hasTransitLeg: true, maxWalkDistance: 150, requireValidGeometry: true, minGeometryPoints: 10 } },
  { id: 'ub-2-to-6', name: 'UB: Virginia → MainBest', from: { lat: 42.896916, lon: -78.864166 }, to: { lat: 42.904445, lon: -78.868191 }, time: '10:55:00', modes: { transit: ['bus'], access: 'flexible', egress: 'flexible', direct: 'flexible' }, banned: { authorities: ['BNMC', 'NFTA', 'MET'] }, expected: { hasFlexLeg: true, hasTransitLeg: true, maxWalkDistance: 150, requireValidGeometry: true, minGeometryPoints: 10 } },
  { id: 'ub-2-to-7', name: 'UB: Virginia → BestEl', from: { lat: 42.896916, lon: -78.864166 }, to: { lat: 42.903918, lon: -78.866304 }, time: '11:00:00', modes: { transit: ['bus'], access: 'flexible', egress: 'flexible', direct: 'flexible' }, banned: { authorities: ['BNMC', 'NFTA', 'MET'] }, expected: { hasFlexLeg: true, hasTransitLeg: true, maxWalkDistance: 150, requireValidGeometry: true, minGeometryPoints: 10 } },
  { id: 'ub-2-to-8', name: 'UB: Virginia → BestMich', from: { lat: 42.896916, lon: -78.864166 }, to: { lat: 42.9039, lon: -78.862842 }, time: '11:05:00', modes: { transit: ['bus'], access: 'flexible', egress: 'flexible', direct: 'flexible' }, banned: { authorities: ['BNMC', 'NFTA', 'MET'] }, expected: { hasFlexLeg: true, hasTransitLeg: true, maxWalkDistance: 150, requireValidGeometry: true, minGeometryPoints: 10 } },

  // FROM: Goodell (Stop 3)
  { id: 'ub-3-to-1', name: 'UB: Goodell → Carlton', from: { lat: 42.894412, lon: -78.865085 }, to: { lat: 42.898291, lon: -78.863767 }, time: '11:10:00', modes: { transit: ['bus'], access: 'flexible', egress: 'flexible', direct: 'flexible' }, banned: { authorities: ['BNMC', 'NFTA', 'MET'] }, expected: { hasFlexLeg: true, hasTransitLeg: true, maxWalkDistance: 150, requireValidGeometry: true, minGeometryPoints: 10 } },
  { id: 'ub-3-to-2', name: 'UB: Goodell → Virginia', from: { lat: 42.894412, lon: -78.865085 }, to: { lat: 42.896916, lon: -78.864166 }, time: '11:15:00', modes: { transit: ['bus'], access: 'flexible', egress: 'flexible', direct: 'flexible' }, banned: { authorities: ['BNMC', 'NFTA', 'MET'] }, expected: { hasFlexLeg: true, hasTransitLeg: true, maxWalkDistance: 150, requireValidGeometry: true, minGeometryPoints: 10 } },
  { id: 'ub-3-to-4', name: 'UB: Goodell → GoodellEl', from: { lat: 42.894412, lon: -78.865085 }, to: { lat: 42.894974, lon: -78.868763 }, time: '11:20:00', modes: { transit: ['bus'], access: 'flexible', egress: 'flexible', direct: 'flexible' }, banned: { authorities: ['BNMC', 'NFTA', 'MET'] }, expected: { hasFlexLeg: true, hasTransitLeg: true, maxWalkDistance: 150, requireValidGeometry: true, minGeometryPoints: 10 } },
  { id: 'ub-3-to-5', name: 'UB: Goodell → Allen', from: { lat: 42.894412, lon: -78.865085 }, to: { lat: 42.899336, lon: -78.869869 }, time: '11:25:00', modes: { transit: ['bus'], access: 'flexible', egress: 'flexible', direct: 'flexible' }, banned: { authorities: ['BNMC', 'NFTA', 'MET'] }, expected: { hasFlexLeg: true, hasTransitLeg: true, maxWalkDistance: 150, requireValidGeometry: true, minGeometryPoints: 10 } },
  { id: 'ub-3-to-6', name: 'UB: Goodell → MainBest', from: { lat: 42.894412, lon: -78.865085 }, to: { lat: 42.904445, lon: -78.868191 }, time: '11:30:00', modes: { transit: ['bus'], access: 'flexible', egress: 'flexible', direct: 'flexible' }, banned: { authorities: ['BNMC', 'NFTA', 'MET'] }, expected: { hasFlexLeg: true, hasTransitLeg: true, maxWalkDistance: 150, requireValidGeometry: true, minGeometryPoints: 10 } },
  { id: 'ub-3-to-7', name: 'UB: Goodell → BestEl', from: { lat: 42.894412, lon: -78.865085 }, to: { lat: 42.903918, lon: -78.866304 }, time: '11:35:00', modes: { transit: ['bus'], access: 'flexible', egress: 'flexible', direct: 'flexible' }, banned: { authorities: ['BNMC', 'NFTA', 'MET'] }, expected: { hasFlexLeg: true, hasTransitLeg: true, maxWalkDistance: 150, requireValidGeometry: true, minGeometryPoints: 10 } },
  { id: 'ub-3-to-8', name: 'UB: Goodell → BestMich', from: { lat: 42.894412, lon: -78.865085 }, to: { lat: 42.9039, lon: -78.862842 }, time: '11:40:00', modes: { transit: ['bus'], access: 'flexible', egress: 'flexible', direct: 'flexible' }, banned: { authorities: ['BNMC', 'NFTA', 'MET'] }, expected: { hasFlexLeg: true, hasTransitLeg: true, maxWalkDistance: 150, requireValidGeometry: true, minGeometryPoints: 10 } },

  // FROM: GoodellEl (Stop 4)
  { id: 'ub-4-to-1', name: 'UB: GoodellEl → Carlton', from: { lat: 42.894974, lon: -78.868763 }, to: { lat: 42.898291, lon: -78.863767 }, time: '11:45:00', modes: { transit: ['bus'], access: 'flexible', egress: 'flexible', direct: 'flexible' }, banned: { authorities: ['BNMC', 'NFTA', 'MET'] }, expected: { hasFlexLeg: true, hasTransitLeg: true, maxWalkDistance: 150, requireValidGeometry: true, minGeometryPoints: 10 } },
  { id: 'ub-4-to-2', name: 'UB: GoodellEl → Virginia', from: { lat: 42.894974, lon: -78.868763 }, to: { lat: 42.896916, lon: -78.864166 }, time: '11:50:00', modes: { transit: ['bus'], access: 'flexible', egress: 'flexible', direct: 'flexible' }, banned: { authorities: ['BNMC', 'NFTA', 'MET'] }, expected: { hasFlexLeg: true, hasTransitLeg: true, maxWalkDistance: 150, requireValidGeometry: true, minGeometryPoints: 10 } },
  { id: 'ub-4-to-3', name: 'UB: GoodellEl → Goodell', from: { lat: 42.894974, lon: -78.868763 }, to: { lat: 42.894412, lon: -78.865085 }, time: '11:55:00', modes: { transit: ['bus'], access: 'flexible', egress: 'flexible', direct: 'flexible' }, banned: { authorities: ['BNMC', 'NFTA', 'MET'] }, expected: { hasFlexLeg: true, hasTransitLeg: true, maxWalkDistance: 150, requireValidGeometry: true, minGeometryPoints: 10 } },
  { id: 'ub-4-to-5', name: 'UB: GoodellEl → Allen', from: { lat: 42.894974, lon: -78.868763 }, to: { lat: 42.899336, lon: -78.869869 }, time: '12:00:00', modes: { transit: ['bus'], access: 'flexible', egress: 'flexible', direct: 'flexible' }, banned: { authorities: ['BNMC', 'NFTA', 'MET'] }, expected: { hasFlexLeg: true, hasTransitLeg: true, maxWalkDistance: 150, requireValidGeometry: true, minGeometryPoints: 10 } },
  { id: 'ub-4-to-6', name: 'UB: GoodellEl → MainBest', from: { lat: 42.894974, lon: -78.868763 }, to: { lat: 42.904445, lon: -78.868191 }, time: '12:05:00', modes: { transit: ['bus'], access: 'flexible', egress: 'flexible', direct: 'flexible' }, banned: { authorities: ['BNMC', 'NFTA', 'MET'] }, expected: { hasFlexLeg: true, hasTransitLeg: true, maxWalkDistance: 150, requireValidGeometry: true, minGeometryPoints: 10 } },
  { id: 'ub-4-to-7', name: 'UB: GoodellEl → BestEl', from: { lat: 42.894974, lon: -78.868763 }, to: { lat: 42.903918, lon: -78.866304 }, time: '12:10:00', modes: { transit: ['bus'], access: 'flexible', egress: 'flexible', direct: 'flexible' }, banned: { authorities: ['BNMC', 'NFTA', 'MET'] }, expected: { hasFlexLeg: true, hasTransitLeg: true, maxWalkDistance: 150, requireValidGeometry: true, minGeometryPoints: 10 } },
  { id: 'ub-4-to-8', name: 'UB: GoodellEl → BestMich', from: { lat: 42.894974, lon: -78.868763 }, to: { lat: 42.9039, lon: -78.862842 }, time: '12:15:00', modes: { transit: ['bus'], access: 'flexible', egress: 'flexible', direct: 'flexible' }, banned: { authorities: ['BNMC', 'NFTA', 'MET'] }, expected: { hasFlexLeg: true, hasTransitLeg: true, maxWalkDistance: 150, requireValidGeometry: true, minGeometryPoints: 10 } },

  // FROM: Allen (Stop 5)
  { id: 'ub-5-to-1', name: 'UB: Allen → Carlton', from: { lat: 42.899336, lon: -78.869869 }, to: { lat: 42.898291, lon: -78.863767 }, time: '12:20:00', modes: { transit: ['bus'], access: 'flexible', egress: 'flexible', direct: 'flexible' }, banned: { authorities: ['BNMC', 'NFTA', 'MET'] }, expected: { hasFlexLeg: true, hasTransitLeg: true, maxWalkDistance: 150, requireValidGeometry: true, minGeometryPoints: 10 } },
  { id: 'ub-5-to-2', name: 'UB: Allen → Virginia', from: { lat: 42.899336, lon: -78.869869 }, to: { lat: 42.896916, lon: -78.864166 }, time: '12:25:00', modes: { transit: ['bus'], access: 'flexible', egress: 'flexible', direct: 'flexible' }, banned: { authorities: ['BNMC', 'NFTA', 'MET'] }, expected: { hasFlexLeg: true, hasTransitLeg: true, maxWalkDistance: 150, requireValidGeometry: true, minGeometryPoints: 10 } },
  { id: 'ub-5-to-3', name: 'UB: Allen → Goodell', from: { lat: 42.899336, lon: -78.869869 }, to: { lat: 42.894412, lon: -78.865085 }, time: '12:30:00', modes: { transit: ['bus'], access: 'flexible', egress: 'flexible', direct: 'flexible' }, banned: { authorities: ['BNMC', 'NFTA', 'MET'] }, expected: { hasFlexLeg: true, hasTransitLeg: true, maxWalkDistance: 150, requireValidGeometry: true, minGeometryPoints: 10 } },
  { id: 'ub-5-to-4', name: 'UB: Allen → GoodellEl', from: { lat: 42.899336, lon: -78.869869 }, to: { lat: 42.894974, lon: -78.868763 }, time: '12:35:00', modes: { transit: ['bus'], access: 'flexible', egress: 'flexible', direct: 'flexible' }, banned: { authorities: ['BNMC', 'NFTA', 'MET'] }, expected: { hasFlexLeg: true, hasTransitLeg: true, maxWalkDistance: 150, requireValidGeometry: true, minGeometryPoints: 10 } },
  { id: 'ub-5-to-6', name: 'UB: Allen → MainBest', from: { lat: 42.899336, lon: -78.869869 }, to: { lat: 42.904445, lon: -78.868191 }, time: '12:40:00', modes: { transit: ['bus'], access: 'flexible', egress: 'flexible', direct: 'flexible' }, banned: { authorities: ['BNMC', 'NFTA', 'MET'] }, expected: { hasFlexLeg: true, hasTransitLeg: true, maxWalkDistance: 150, requireValidGeometry: true, minGeometryPoints: 10 } },
  { id: 'ub-5-to-7', name: 'UB: Allen → BestEl', from: { lat: 42.899336, lon: -78.869869 }, to: { lat: 42.903918, lon: -78.866304 }, time: '12:45:00', modes: { transit: ['bus'], access: 'flexible', egress: 'flexible', direct: 'flexible' }, banned: { authorities: ['BNMC', 'NFTA', 'MET'] }, expected: { hasFlexLeg: true, hasTransitLeg: true, maxWalkDistance: 150, requireValidGeometry: true, minGeometryPoints: 10 } },
  { id: 'ub-5-to-8', name: 'UB: Allen → BestMich', from: { lat: 42.899336, lon: -78.869869 }, to: { lat: 42.9039, lon: -78.862842 }, time: '12:50:00', modes: { transit: ['bus'], access: 'flexible', egress: 'flexible', direct: 'flexible' }, banned: { authorities: ['BNMC', 'NFTA', 'MET'] }, expected: { hasFlexLeg: true, hasTransitLeg: true, maxWalkDistance: 150, requireValidGeometry: true, minGeometryPoints: 10 } },

  // FROM: MainBest (Stop 6)
  { id: 'ub-6-to-1', name: 'UB: MainBest → Carlton', from: { lat: 42.904445, lon: -78.868191 }, to: { lat: 42.898291, lon: -78.863767 }, time: '12:55:00', modes: { transit: ['bus'], access: 'flexible', egress: 'flexible', direct: 'flexible' }, banned: { authorities: ['BNMC', 'NFTA', 'MET'] }, expected: { hasFlexLeg: true, hasTransitLeg: true, maxWalkDistance: 150, requireValidGeometry: true, minGeometryPoints: 10 } },
  { id: 'ub-6-to-2', name: 'UB: MainBest → Virginia', from: { lat: 42.904445, lon: -78.868191 }, to: { lat: 42.896916, lon: -78.864166 }, time: '13:00:00', modes: { transit: ['bus'], access: 'flexible', egress: 'flexible', direct: 'flexible' }, banned: { authorities: ['BNMC', 'NFTA', 'MET'] }, expected: { hasFlexLeg: true, hasTransitLeg: true, maxWalkDistance: 150, requireValidGeometry: true, minGeometryPoints: 10 } },
  { id: 'ub-6-to-3', name: 'UB: MainBest → Goodell', from: { lat: 42.904445, lon: -78.868191 }, to: { lat: 42.894412, lon: -78.865085 }, time: '13:05:00', modes: { transit: ['bus'], access: 'flexible', egress: 'flexible', direct: 'flexible' }, banned: { authorities: ['BNMC', 'NFTA', 'MET'] }, expected: { hasFlexLeg: true, hasTransitLeg: true, maxWalkDistance: 150, requireValidGeometry: true, minGeometryPoints: 10 } },
  { id: 'ub-6-to-4', name: 'UB: MainBest → GoodellEl', from: { lat: 42.904445, lon: -78.868191 }, to: { lat: 42.894974, lon: -78.868763 }, time: '13:10:00', modes: { transit: ['bus'], access: 'flexible', egress: 'flexible', direct: 'flexible' }, banned: { authorities: ['BNMC', 'NFTA', 'MET'] }, expected: { hasFlexLeg: true, hasTransitLeg: true, maxWalkDistance: 150, requireValidGeometry: true, minGeometryPoints: 10 } },
  { id: 'ub-6-to-5', name: 'UB: MainBest → Allen', from: { lat: 42.904445, lon: -78.868191 }, to: { lat: 42.899336, lon: -78.869869 }, time: '13:15:00', modes: { transit: ['bus'], access: 'flexible', egress: 'flexible', direct: 'flexible' }, banned: { authorities: ['BNMC', 'NFTA', 'MET'] }, expected: { hasFlexLeg: true, hasTransitLeg: true, maxWalkDistance: 150, requireValidGeometry: true, minGeometryPoints: 10 } },
  { id: 'ub-6-to-7', name: 'UB: MainBest → BestEl', from: { lat: 42.904445, lon: -78.868191 }, to: { lat: 42.903918, lon: -78.866304 }, time: '13:20:00', modes: { transit: ['bus'], access: 'flexible', egress: 'flexible', direct: 'flexible' }, banned: { authorities: ['BNMC', 'NFTA', 'MET'] }, expected: { hasFlexLeg: true, hasTransitLeg: true, maxWalkDistance: 150, requireValidGeometry: true, minGeometryPoints: 10 } },
  { id: 'ub-6-to-8', name: 'UB: MainBest → BestMich', from: { lat: 42.904445, lon: -78.868191 }, to: { lat: 42.9039, lon: -78.862842 }, time: '13:25:00', modes: { transit: ['bus'], access: 'flexible', egress: 'flexible', direct: 'flexible' }, banned: { authorities: ['BNMC', 'NFTA', 'MET'] }, expected: { hasFlexLeg: true, hasTransitLeg: true, maxWalkDistance: 150, requireValidGeometry: true, minGeometryPoints: 10 } },

  // FROM: BestEl (Stop 7)
  { id: 'ub-7-to-1', name: 'UB: BestEl → Carlton', from: { lat: 42.903918, lon: -78.866304 }, to: { lat: 42.898291, lon: -78.863767 }, time: '13:30:00', modes: { transit: ['bus'], access: 'flexible', egress: 'flexible', direct: 'flexible' }, banned: { authorities: ['BNMC', 'NFTA', 'MET'] }, expected: { hasFlexLeg: true, hasTransitLeg: true, maxWalkDistance: 150, requireValidGeometry: true, minGeometryPoints: 10 } },
  { id: 'ub-7-to-2', name: 'UB: BestEl → Virginia', from: { lat: 42.903918, lon: -78.866304 }, to: { lat: 42.896916, lon: -78.864166 }, time: '13:35:00', modes: { transit: ['bus'], access: 'flexible', egress: 'flexible', direct: 'flexible' }, banned: { authorities: ['BNMC', 'NFTA', 'MET'] }, expected: { hasFlexLeg: true, hasTransitLeg: true, maxWalkDistance: 150, requireValidGeometry: true, minGeometryPoints: 10 } },
  { id: 'ub-7-to-3', name: 'UB: BestEl → Goodell', from: { lat: 42.903918, lon: -78.866304 }, to: { lat: 42.894412, lon: -78.865085 }, time: '13:40:00', modes: { transit: ['bus'], access: 'flexible', egress: 'flexible', direct: 'flexible' }, banned: { authorities: ['BNMC', 'NFTA', 'MET'] }, expected: { hasFlexLeg: true, hasTransitLeg: true, maxWalkDistance: 150, requireValidGeometry: true, minGeometryPoints: 10 } },
  { id: 'ub-7-to-4', name: 'UB: BestEl → GoodellEl', from: { lat: 42.903918, lon: -78.866304 }, to: { lat: 42.894974, lon: -78.868763 }, time: '13:45:00', modes: { transit: ['bus'], access: 'flexible', egress: 'flexible', direct: 'flexible' }, banned: { authorities: ['BNMC', 'NFTA', 'MET'] }, expected: { hasFlexLeg: true, hasTransitLeg: true, maxWalkDistance: 150, requireValidGeometry: true, minGeometryPoints: 10 } },
  { id: 'ub-7-to-5', name: 'UB: BestEl → Allen', from: { lat: 42.903918, lon: -78.866304 }, to: { lat: 42.899336, lon: -78.869869 }, time: '13:50:00', modes: { transit: ['bus'], access: 'flexible', egress: 'flexible', direct: 'flexible' }, banned: { authorities: ['BNMC', 'NFTA', 'MET'] }, expected: { hasFlexLeg: true, hasTransitLeg: true, maxWalkDistance: 150, requireValidGeometry: true, minGeometryPoints: 10 } },
  // Adjacent stops (~164m) - use high walkReluctance to force transit over walking
  { id: 'ub-7-to-6', name: 'UB: BestEl → MainBest', from: { lat: 42.903918, lon: -78.866304 }, to: { lat: 42.904445, lon: -78.868191 }, time: '13:55:00', modes: { transit: ['bus'], access: 'flexible', egress: 'flexible', direct: 'flexible' }, banned: { authorities: ['BNMC', 'NFTA', 'MET'] }, walkReluctance: 100, expected: { hasFlexLeg: true, hasTransitLeg: true, maxWalkDistance: 150, requireValidGeometry: true, minGeometryPoints: 10 } },
  { id: 'ub-7-to-8', name: 'UB: BestEl → BestMich', from: { lat: 42.903918, lon: -78.866304 }, to: { lat: 42.9039, lon: -78.862842 }, time: '14:00:00', modes: { transit: ['bus'], access: 'flexible', egress: 'flexible', direct: 'flexible' }, banned: { authorities: ['BNMC', 'NFTA', 'MET'] }, expected: { hasFlexLeg: true, hasTransitLeg: true, maxWalkDistance: 150, requireValidGeometry: true, minGeometryPoints: 10 } },

  // FROM: BestMich (Stop 8)
  { id: 'ub-8-to-1', name: 'UB: BestMich → Carlton', from: { lat: 42.9039, lon: -78.862842 }, to: { lat: 42.898291, lon: -78.863767 }, time: '14:05:00', modes: { transit: ['bus'], access: 'flexible', egress: 'flexible', direct: 'flexible' }, banned: { authorities: ['BNMC', 'NFTA', 'MET'] }, expected: { hasFlexLeg: true, hasTransitLeg: true, maxWalkDistance: 150, requireValidGeometry: true, minGeometryPoints: 10 } },
  { id: 'ub-8-to-2', name: 'UB: BestMich → Virginia', from: { lat: 42.9039, lon: -78.862842 }, to: { lat: 42.896916, lon: -78.864166 }, time: '14:10:00', modes: { transit: ['bus'], access: 'flexible', egress: 'flexible', direct: 'flexible' }, banned: { authorities: ['BNMC', 'NFTA', 'MET'] }, expected: { hasFlexLeg: true, hasTransitLeg: true, maxWalkDistance: 150, requireValidGeometry: true, minGeometryPoints: 10 } },
  { id: 'ub-8-to-3', name: 'UB: BestMich → Goodell', from: { lat: 42.9039, lon: -78.862842 }, to: { lat: 42.894412, lon: -78.865085 }, time: '14:15:00', modes: { transit: ['bus'], access: 'flexible', egress: 'flexible', direct: 'flexible' }, banned: { authorities: ['BNMC', 'NFTA', 'MET'] }, expected: { hasFlexLeg: true, hasTransitLeg: true, maxWalkDistance: 150, requireValidGeometry: true, minGeometryPoints: 10 } },
  { id: 'ub-8-to-4', name: 'UB: BestMich → GoodellEl', from: { lat: 42.9039, lon: -78.862842 }, to: { lat: 42.894974, lon: -78.868763 }, time: '14:20:00', modes: { transit: ['bus'], access: 'flexible', egress: 'flexible', direct: 'flexible' }, banned: { authorities: ['BNMC', 'NFTA', 'MET'] }, expected: { hasFlexLeg: true, hasTransitLeg: true, maxWalkDistance: 150, requireValidGeometry: true, minGeometryPoints: 10 } },
  { id: 'ub-8-to-5', name: 'UB: BestMich → Allen', from: { lat: 42.9039, lon: -78.862842 }, to: { lat: 42.899336, lon: -78.869869 }, time: '14:25:00', modes: { transit: ['bus'], access: 'flexible', egress: 'flexible', direct: 'flexible' }, banned: { authorities: ['BNMC', 'NFTA', 'MET'] }, expected: { hasFlexLeg: true, hasTransitLeg: true, maxWalkDistance: 150, requireValidGeometry: true, minGeometryPoints: 10 } },
  { id: 'ub-8-to-6', name: 'UB: BestMich → MainBest', from: { lat: 42.9039, lon: -78.862842 }, to: { lat: 42.904445, lon: -78.868191 }, time: '14:30:00', modes: { transit: ['bus'], access: 'flexible', egress: 'flexible', direct: 'flexible' }, banned: { authorities: ['BNMC', 'NFTA', 'MET'] }, expected: { hasFlexLeg: true, hasTransitLeg: true, maxWalkDistance: 150, requireValidGeometry: true, minGeometryPoints: 10 } },
  { id: 'ub-8-to-7', name: 'UB: BestMich → BestEl', from: { lat: 42.9039, lon: -78.862842 }, to: { lat: 42.903918, lon: -78.866304 }, time: '14:35:00', modes: { transit: ['bus'], access: 'flexible', egress: 'flexible', direct: 'flexible' }, banned: { authorities: ['BNMC', 'NFTA', 'MET'] }, expected: { hasFlexLeg: true, hasTransitLeg: true, maxWalkDistance: 150, requireValidGeometry: true, minGeometryPoints: 10 } },

  // BNMC to South Buffalo - Mercy Hospital
  // Note: OTP may return walk-only as first itinerary; hasTransitLeg checks all itineraries
  {
    id: 'bnmc-to-mercy-hospital',
    name: 'Bus: Innovation Center to Mercy Hospital',
    description: 'Trip from BNMC to Mercy Hospital in South Buffalo via bus (route 14 or 16)',
    from: { lat: 42.896125, lon: -78.868749 },  // Innovation Center
    to: { lat: 42.8479879, lon: -78.8131724 },  // Mercy Hospital, 565 Abbott Road
    time: '10:00:00',
    modes: {
      transit: ['bus']
    },
    expected: {
      hasTransitLeg: true  // Verifies bus route exists in any of the returned itineraries
    }
  },

  // HDS drop-off precision tests - should not drop at corner and make user walk far
  {
    id: 'hds-dropoff-precision',
    name: 'HDS: Innovation Center to 150 Maple Street',
    description: 'HDS should drop user close to destination, not at a corner with long walk',
    from: { lat: 42.896125, lon: -78.868749 },  // Innovation Center
    to: { lat: 42.8970146, lon: -78.8633668 },  // 150 Maple Street
    time: '10:00:00',
    modes: {
      direct: 'flexible',
      access: 'flexible',
      egress: 'flexible'
    },
    expected: {
      hasFlexLeg: true,
      flexInName: true,
      maxWalkDistance: 50,  // With fix, should be nearly 0 walk distance
      minLegs: 1,  // Direct flex trip within zone
      maxLegs: 3
    }
  }
];

// Scenarios store only a time of day. The date is computed at load time as the next
// upcoming service day so the suite never rots to a past date. Weekday scenarios use the
// next Mon-Fri; scenarios marked weekend: true use the next Saturday.
function nextServiceDate(weekend) {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  while (weekend ? d.getDay() !== 6 : d.getDay() === 0 || d.getDay() === 6) {
    d.setDate(d.getDate() + 1);
  }
  return d;
}

// The America/New_York UTC offset (e.g. "-04:00") for the given date, so the time of day is
// interpreted as Buffalo local time across daylight saving changes.
function newYorkOffset(date) {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/New_York',
    timeZoneName: 'shortOffset',
  }).formatToParts(date);
  const name = parts.find(p => p.type === 'timeZoneName')?.value ?? 'GMT-4';
  const match = name.match(/GMT([+-])(\d{1,2})(?::(\d{2}))?/);
  const sign = match[1];
  const hours = match[2].padStart(2, '0');
  const minutes = match[3] ?? '00';
  return `${sign}${hours}:${minutes}`;
}

function toDateTime(scenario) {
  const d = nextServiceDate(!!scenario.weekend);
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}T${scenario.time}${newYorkOffset(d)}`;
}

for (const scenario of testScenarios) {
  scenario.dateTime = toDateTime(scenario);
}