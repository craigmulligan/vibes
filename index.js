const fs = require('fs')
const mbxDirections = require('@mapbox/mapbox-sdk/services/directions')

const directionsClient = mbxDirections({
  accessToken,
})
  ; (async () => {
    const config = {
      profile: 'cycling',
      steps: true,
      voiceUnits: 'metric',
      geometries: 'geojson',
      overview: "false",
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
        fs.writeFileSync('./director/res.json', JSON.stringify(res.body, null, 2))
      })
      .catch(console.log)
  })()
