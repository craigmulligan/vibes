# Experiment on using limited haptic feed to give directions

# Maneuver types

* turn
  A basic turn in the direction of the modifier.

  * left
  * right

* new name
  The road name changes (after a mandatory turn).

* depart
  Indicates departure from a leg. The modifier value indicates the position of the departure point in relation to the current direction of travel.

* arrive
  Indicates arrival to a destination of a leg. The modifier value indicates the position of the arrival point in relation to the current direction of travel.

* merge
  Merge onto a street.

* end of road
  Road ends in a T intersection.

* continue
  Continue on a street after a turn.

* rotary

* roundabout turn

* notification

* exit roundabout

* exit rotary

modifiers

* uturn Indicates a reversal of direction
* sharp right A sharp right turn
* right A normal turn to the right
* slight right A slight turn to the right
* straight No relevant change in direction
* slight left A slight turn to the left
* left A normal turn to the left
* sharp left A sharp turn to the left

We may need a buffer, to call attention to the signal?

TODOs:

* Create an emitter that takes a mapbox direction response and emits manuevers based on current location.
* Create a fn to translate the emitted manuevers to ios/android vibration api calls based on some mapping.
