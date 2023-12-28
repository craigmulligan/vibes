require('dotenv').config()
const fs = require('fs')
const mbxDirections = require('@mapbox/mapbox-sdk/services/directions')

const directionsClient = mbxDirections({
  accessToken: process.env.MAPBOX_TOKEN,
})
  ; (async () => {
    const config = {
      profile: 'cycling',
      steps: true,
      voiceUnits: 'metric',
      geometries: 'geojson',
      waypoints: [
        {
          name: 'Start',
          coordinates: [
            -118.50251276419922,
            34.019591183766934
          ]
        },
        {
          name: 'End',
          coordinates: [
            -118.490471,
            34.01714
          ],
        },
      ],
    }

    const res = await directionsClient
      .getDirections(config)
      .send(config)
      .then(res => {
        fs.writeFileSync('./director/rerouted.res.json', JSON.stringify(res.body, null, 2))
      })
      .catch(console.log)
  })()
