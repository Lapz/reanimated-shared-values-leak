import React, { useCallback, useMemo, useRef, useState } from "react";
import {
  ListRenderItemInfo,
  StatusBar,
  StyleSheet,
  Text,
  View,
  ViewToken,
} from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { SCREEN_HEIGHT, SCREEN_WIDTH } from "@gorhom/bottom-sheet";
import {
  Gesture,
  GestureDetector,
  GestureHandlerRootView,
} from "react-native-gesture-handler";
import Animated, {
  LinearTransition,
  SlideOutRight,
  runOnJS,
  scrollTo,
  useAnimatedReaction,
  useAnimatedRef,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import uuid from "react-native-uuid";

const CANVAS_HEIGHT = SCREEN_HEIGHT * 1.5;
const OPEN_LIMIT = 10;

const ProfileViewer = () => {
  const isOpened = useSharedValue<boolean>(false);
  const safeArea = useSafeAreaInsets();

  const elements = Array(10)
    .fill(undefined)
    .map(() => {
      return {
        id: uuid.v4().toString(),
        isMoveable: true,
      };
    });

  console.log(elements);

  const positions = Object.fromEntries(elements.map((el) => [el.id, {}]));
  const animatedRef = useAnimatedRef<Animated.ScrollView>();
  const hapticTriggered = useSharedValue(false);
  const isLike = useSharedValue(false);
  const shouldShowBorder = useSharedValue(false);

  const [statusBarColor, setStatusBarColor] = useState<"light" | "dark">(
    "dark"
  );

  const renderedElements = useMemo(() => {
    return elements.map((element) => {
      if (positions[element.id] === undefined) return null;

      return (
        <Element
          key={element.id}
          element={element}
          position={positions[element.id]}
          positions={positions}
          originalCanvasHeight={SCREEN_HEIGHT}
          originalCanvasWidth={SCREEN_HEIGHT}
          isFullScreenViewer={isOpened}
          editMode={false}
        />
      );
    });
  }, [elements, isOpened, positions]);

  const profilePageSafeAreaStyle = useAnimatedStyle(() => {
    return {
      top: withTiming(isOpened.value ? 0 : safeArea.top),
      bottom: safeArea.bottom,
      width: SCREEN_WIDTH,
    };
  });

  const profileHeaderStyle = useAnimatedStyle(() => {
    return {
      height: withTiming(isOpened.value ? 0 : 30),
      marginVertical: withTiming(isOpened.value ? 0 : 8),
    };
  });

  const profilePortalStyle = useAnimatedStyle(() => {
    return {
      width: withTiming(isOpened.value ? SCREEN_WIDTH : SCREEN_WIDTH - 40),
      height: withTiming(
        isOpened.value
          ? SCREEN_HEIGHT
          : false
          ? 400
          : SCREEN_HEIGHT - (140 + safeArea.bottom + safeArea.top)
      ),
      borderRadius: withTiming(isOpened.value ? 0 : 20),
      borderColor: shouldShowBorder.value ? "black" : "transparent",
      borderWidth: withTiming(
        isOpened.value ? 0 : shouldShowBorder.value ? 1 : 0
      ),
    };
  });

  const profileActionsStyle = useAnimatedStyle(() => {
    return {
      bottom: withTiming(isOpened.value ? 35 : 16),
      paddingHorizontal: withTiming(isOpened.value ? 35 : 16),
      width: false ? SCREEN_WIDTH / 2 : "100%",
    };
  });

  const profileViewStyle = useAnimatedStyle(() => {
    return {
      bottom: 16,
      opacity: withTiming(isOpened.value ? 0 : 1),
    };
  });

  const animatedContainerStyle = useAnimatedStyle(() => ({
    height: CANVAS_HEIGHT,
  }));

  const handleScroll = useAnimatedScrollHandler((event) => {
    const isCurrentlyOpened = isOpened.value;

    const shouldBeOpened = event.contentOffset.y >= OPEN_LIMIT;
    isOpened.value = shouldBeOpened;

    if (isCurrentlyOpened !== shouldBeOpened) {
      hapticTriggered.value = false;
    }

    if (shouldBeOpened && !hapticTriggered.value) {
      hapticTriggered.value = true;
    }
  });

  const tapGesture = Gesture.Tap().onEnd(() => {
    scrollTo(animatedRef, 0, 10, false);
  });

  return (
    <Animated.View
      exiting={SlideOutRight}
      className="flex items-center"
      style={[profilePageSafeAreaStyle]}
    >
      <Animated.View
        className="px-4 overflow-hidden self-start"
        style={[profileHeaderStyle]}
      >
        <Text className="text-xl font-body">{"your profile"}</Text>
      </Animated.View>

      <Animated.View
        style={[
          profilePortalStyle,
          { position: "relative", overflow: "hidden" },
        ]}
      >
        <View style={{ width: SCREEN_WIDTH, zIndex: 0 }}>
          {isOpened.value && <StatusBar style={statusBarColor} animated />}

          <GestureDetector gesture={tapGesture}>
            <Animated.ScrollView
              ref={animatedRef}
              onScroll={handleScroll}
              scrollEventThrottle={16}
              keyboardShouldPersistTaps="always"
              directionalLockEnabled
              showsHorizontalScrollIndicator={false}
              showsVerticalScrollIndicator={false}
            >
              <Animated.View style={[animatedContainerStyle]}>
                {renderedElements}
              </Animated.View>
            </Animated.ScrollView>
          </GestureDetector>
        </View>

        {false && (
          <Animated.View
            className="bg-green-200 border-green-300 border-2 flex flex-row space-x-2 px-4 items-center justify-center rounded-full mr-2 pointer-events-none absolute bottom-0 left-4 py-2"
            style={[{ zIndex: 999, pointerEvents: "none" }, profileViewStyle]}
          >
            <Text className="text-green-900">view profile</Text>
          </Animated.View>
        )}
      </Animated.View>
    </Animated.View>
  );
};

export const BASE_FONT_SIZE = 24;

export const Element: React.FC<any> = ({
  editMode = false,
  element,
  position,
  originalCanvasWidth,
  originalCanvasHeight,
  isFullScreenViewer,
}) => {
  const wScaleCalc = (width: number) => {
    "worklet";
    return width / originalCanvasWidth;
  };

  const wScale = wScaleCalc(SCREEN_WIDTH);
  const hScale = (SCREEN_HEIGHT * 1.5) / originalCanvasHeight;
  const insets = useSafeAreaInsets();
  const isLockedByUser = useSharedValue(false);

  const translateX = useSharedValue(position.x * wScale);
  const translateY = useSharedValue(position.y * hScale);
  const translateZ = useSharedValue(position.z);

  const scale = useSharedValue(position.scale * (wScale / hScale));
  const rotate = useSharedValue(position.rotation);
  const containerRef = useAnimatedRef<Animated.View>();

  // this dictates whether gestures are enabled for an element
  const [isStateLocked, setIsStateLocked] = useState(false);
  useAnimatedReaction(
    () => element.isMovable === false || isLockedByUser.value, // if the user has locked the element
    (isDisabled) => runOnJS(setIsStateLocked)(isDisabled)
  );

  // TEXT ONLY
  const fontSize = useSharedValue(BASE_FONT_SIZE);
  const fontColor = useSharedValue("black");

  const fontFamily = useSharedValue(undefined);

  // IMAGE ONLY
  const imageWidth = useSharedValue(400);
  const imageHeight = useSharedValue(400);
  const imageStyle = useSharedValue("straight");

  // For accumulating transformations
  const lastTranslateX = useSharedValue(position.x * wScale);
  const lastTranslateY = useSharedValue(position.y * hScale);
  const lastRotate = useSharedValue(0);
  const lastScale = useSharedValue(position.scale * (wScale / hScale));

  // on profile being expanded, we adjustted the Y position to factor in the safe area top inset
  useAnimatedReaction(
    () => isFullScreenViewer?.value ?? true,
    (isFullScreen) => {
      if (editMode) return;

      const marginScale = Math.floor(40 * (SCREEN_WIDTH / originalCanvasWidth));

      const newWScale = wScaleCalc(
        isFullScreen ? SCREEN_WIDTH : SCREEN_WIDTH - marginScale
      );

      translateX.value = withTiming(position.x * newWScale);
      fontSize.value = withTiming(BASE_FONT_SIZE);
      scale.value = withSpring(position.scale * (newWScale / hScale));
    }
  );

  useAnimatedReaction(
    () => isFullScreenViewer?.value ?? true,
    (isFullScreen) => {
      translateY.value = withTiming(
        lastTranslateY.value + (isFullScreen ? insets.top : 0)
      );
    }
  );

  // TEXT ONLY
  const lastFontSize = useSharedValue(BASE_FONT_SIZE);

  // FOR OVERLAPPING HAPTIC ONLY
  const hasRanOverlapHaptic = useRef(false);
  const isCurrentlyPanning = useSharedValue(false);
  const isCurrentlyPinching = useSharedValue(false);
  const isCurrentlyOverlapping = useSharedValue(false);
  const scaleBeforeOverlapping = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [
        { translateX: translateX.value },
        { translateY: translateY.value },
        { scale: scale.value },
        { rotate: `${rotate.value}rad` },
      ],
      zIndex: translateZ.value,
    };
  });

  const animatedTextStyle = useAnimatedStyle(() => {
    return {
      fontSize: fontSize.value,
      fontFamily: fontFamily.value,
      color: fontColor.value,
      zIndex: translateZ.value,
    };
  });

  const animatedLockStyle = useAnimatedStyle(() => ({
    backgroundColor: "rgba(0,0,0,0.5)",
    opacity: isLockedByUser.value ? 1 : 0,
  }));

  const renderCanvasElement = useMemo(() => {
    const isTextEl = Math.random() < 0.7;
    if (isTextEl) {
      return <Animated.Text style={[animatedTextStyle]}>Element</Animated.Text>;
    } else {
      return (
        <Animated.Text
          style={[
            animatedTextStyle,
            { height: imageHeight.value, width: imageWidth.value },
          ]}
        >
          Image
        </Animated.Text>
      );
    }
  }, [
    animatedTextStyle,
    element,
    imageHeight,
    imageStyle,
    imageWidth,

    translateZ,
  ]);

  return <Animated.View>{renderCanvasElement}</Animated.View>;
};

export default function App() {
  const isTabVisible = useSharedValue(true);
  const zoomedProfiles = useSharedValue([]);

  const profiles = Array(35)
    .fill(undefined)
    .map(() => {
      return {
        id: uuid.v4().toString(),
        firstName: "foo",
        lastName: "bar",
      };
    });

  const handleViewableItemsChanged = useCallback(
    (info: { viewableItems: ViewToken[]; changed: ViewToken[] }) => {
      if (!zoomedProfiles || !isTabVisible) return;

      // if profile is viewable and is NOT zoomed in, we show tab bar
      if (info.changed[0].isViewable) {
        isTabVisible.value = !zoomedProfiles.value.includes(
          info.changed[0].item.id
        );
      }
    },
    [isTabVisible, zoomedProfiles]
  );

  const renderProfile = useCallback((listItem: ListRenderItemInfo<any>) => {
    return <ProfileViewer {...listItem.item} />;
  }, []);

  const getItemLayout = useCallback(
    (_: any, index: number) => ({
      length: SCREEN_WIDTH,
      offset: SCREEN_WIDTH * index,
      index,
    }),
    []
  );

  const emptyState = useMemo(() => {
    return null;
  }, []);

  const animatedFeedStyle = useAnimatedStyle(() => {
    return {
      opacity: withTiming(1),
      height: SCREEN_HEIGHT,
    };
  });

  const keyExtractor = useCallback((item: any) => item.id, []);

  return (
    <SafeAreaProvider>
      <GestureHandlerRootView style={{ flex: 1 }} className="bg-red-50">
        <View style={styles.container}>
          <Animated.FlatList
            className="bg-red-50"
            onViewableItemsChanged={handleViewableItemsChanged}
            showsHorizontalScrollIndicator={false}
            itemLayoutAnimation={LinearTransition.springify()}
            horizontal
            data={profiles}
            renderItem={renderProfile}
            pagingEnabled
            keyExtractor={keyExtractor}
            getItemLayout={getItemLayout}
            style={[animatedFeedStyle]}
            ListEmptyComponent={emptyState}
            initialNumToRender={3}
            maxToRenderPerBatch={3}
            windowSize={3}
            removeClippedSubviews
          />
        </View>
      </GestureHandlerRootView>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
  },
});
