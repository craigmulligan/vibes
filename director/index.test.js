const Director = require('./')
const mapboxRes = require('./res')
let d

beforeEach(() => {
  d = new Director(mapboxRes, { location: [-0.052848, 51.53507] })
})

describe('update Location', () => {
  test('should emit closest next step', () => {
    d.on('step', step => {
      expect(step.name).toBe('Virginia Road')
    })
    d.updateLocation([-0.073446, 51.528247])
  })

  test('should only be called once when locations are near one another', () => {
    const cb = jest.fn()
    d.on('step', cb)
    d.updateLocation([-0.073446, 51.528247])
    d.updateLocation([-0.073447, 51.528247])

    expect(cb.mock.calls.length).toBe(1)
  })

  test('should emit deviation event when user leaves route', () => {
    const cb = jest.fn()
    d.on('deviation', cb)
    d.updateLocation([-0.1, 51.528247])
    expect(cb).toHaveBeenCalled()
  })
})

describe('.hasDeviated', () => {
  test('should return true if current location is inside of route buffer', () => {
    expect(d.hasDeviated()).toBe(true)
  })

  test('should return false if current location is outside of route buffer', () => {
    d.updateLocation([-0.052848, 52.53507])
    expect(d.hasDeviated()).toBe(false)
  })
})

describe('.nextStep', () => {
  test('should return the next closest step (forwards)', () => {
    const step = d.nextStep()
    expect(step.name).toBe("Regent's Canal towpath")
    d.location = [-0.073446, 51.528247]
    const step2 = d.nextStep()
    expect(step2.name).toBe('Virginia Road')
  })

  test('should return the next step with regards to route bearing', () => {
    const step = d.nextStep()
    expect(step.name).toBe("Regent's Canal towpath")
    d.location = [-0.073446, 51.528247]
    const step2 = d.nextStep()
    expect(step2.name).toBe('Virginia Road')
  })
})
