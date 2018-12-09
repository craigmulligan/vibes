const fs = require('fs')
const mbxDirections = require('@mapbox/mapbox-sdk/services/directions')

const directionsClient = mbxDirections({
  accessToken: null,
})
;(async () => {
  const config = {
    profile: 'cycling',
    steps: true,
    voiceUnits: 'metric',
    geometries: 'geojson',
    waypoints: [
      {
        name: 'Start',
        coordinates: [-0.052848, 51.53507],
      },
      {
        name: 'End',
        coordinates: [-0.077387, 51.526756],
      },
    ],
  }

  const res = await directionsClient
    .getDirections(config)
    .send(config)
    .then(res => {
      fs.writeFileSync('res.json', JSON.stringify(res.body, null, 2))
    })
    .catch(console.log)
})()
