// this takes a mapbox direction response and emits the manuers based on the current location
const EventEmitter = require('events')
const lineBuffer = require('@turf/buffer')
const pointInPoly = require('@turf/boolean-point-in-polygon')
const nearestPointOnLine = require('@turf/nearest-point-on-line')
const turfDistance = require('@turf/distance')

const defaultOptions = { leadDistance: 20, buffer: 50 }

class Director extends EventEmitter {
  constructor(res, opts = {}) {
    opts = {
      ...opts,
      ...defaultOptions,
    }

    super()
    // steps that have already been sent to the client
    this.prevSteps = []
    // the distance when a step is primed/appropriate for the client
    this.leadDistance = opts.leadDistance
    this.route = res.routes[0]
    this.buffedRoute = lineBuffer(this.route.geometry, opts.buffer, {
      units: 'meters',
    })
    this.location = opts.location || this.route.waypoints[0].location
  }

  hasDeviated() {
    return pointInPoly(this.location, this.buffedRoute)
  }

  nextStep() {
    const point = nearestPointOnLine(this.route.geometry, this.location)

    const step = this.route.legs[0].steps.find(({ maneuver }) => {
      return (
        maneuver.location[0] == point.geometry.coordinates[0] &&
        maneuver.location[1] == point.geometry.coordinates[1]
      )
    })

    return this.getStep(step)
  }

  getStep(step) {
    // if we have already notified the client it's not the nex
    if (!this.prevSteps.includes(step.name)) {
      return step
    } else {
      let current = this.route.legs[0].steps.findIndex(s => s.name == step.name)
      return this.getStep(this.route.legs[0].steps[current + 1])
    }
  }

  shouldNotify(step) {
    const distance = turfDistance(this.location, step.maneuver.location, {
      units: 'meters',
    })

    if (distance <= this.leadDistance) {
      return true
    }
    return false
  }

  updateLocation(location) {
    try {
      this.location = location
      if (this.hasDeviated) {
        this.emit('deviation')
      }

      const step = this.nextStep()
      if (this.shouldNotify(step)) {
        this.prevSteps.push(step.name)
        this.emit('step', step)
      }
    } catch (err) {
      this.emit('error', err)
    }
  }
}

module.exports = Director
