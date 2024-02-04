# Vibes

Experimental turn-by-turn navigation using haptic feedback for walking and cycling.

### Vibration <-> Turn mapping.

It's described in [the vibrator module](lib/vibrator/index.ts). But the mapping right now is pretty simple.

If we represent `_` as a long vibration and `.` as a short one. And `-` as a pause.


* Right turn: `_-.`
* Straight ahead: `_-.-.`
* Left turn: `_-.-.-.`

* Arrive: `__`
* Depart: `__`
* Deviation: `_-_-_-_-`
