# Memory leak

This repo aims to reproduce the memory leak we've seen caused by `useSharedValue`.

We have a flatList that renders a list of `ProfileViewers` based on the profile data and renders some views that are animated.

Opening the app the memory usage is around 200mb, if you swipe through the list you'll see the memory usage increase to approx 300mb and then stay their, swiping left and right just cause an increase in the amount of memory shown from the expo dev menu. The amount of RAM never decreases and stays constant. Running the hermes profiler it says the `makeShareableClone` as the culprit for the leak.

Profiling

To reproduce the issue, run:

`yarn expo start`

Shake the device and open the performance monitor and look at the RAM value 