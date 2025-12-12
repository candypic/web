'use client';

import * as React from 'react';
import {
  useSpring,
  useTransform,
  motion,
  useInView,
} from 'motion/react';
import useMeasure from 'react-use-measure';

function SlidingNumberRoller({ prevValue, value, place, transition }) {
  const startNumber = Math.floor(prevValue / place) % 10;
  const targetNumber = Math.floor(value / place) % 10;

  const animatedValue = useSpring(startNumber, transition);

  React.useEffect(() => {
    animatedValue.set(targetNumber);
  }, [targetNumber, animatedValue]);

  const [measureRef, { height }] = useMeasure();

  return (
    <span
      ref={measureRef}
      className="relative inline-block overflow-hidden leading-none align-middle"
      style={{
        minWidth: height ? height * 0.62 : undefined, // Prevent squeezing
      }}
    >
      {/* Placeholder to calculate digit height */}
      <span className="invisible block">0</span>

      {/* Digit Roller */}
      {Array.from({ length: 10 }, (_, i) => (
        <SlidingNumberDigit
          key={i}
          motionValue={animatedValue}
          number={i}
          height={height}
          transition={transition}
        />
      ))}
    </span>
  );
}

function SlidingNumberDigit({ motionValue, number, height, transition }) {
  const y = useTransform(motionValue, (latest) => {
    if (!height) return 0;

    const currentDigit = latest % 10;
    const offset = (10 + number - currentDigit) % 10;

    let translateY = offset * height;

    if (offset > 5) {
      translateY -= 10 * height;
    }

    return translateY;
  });

  if (!height) {
    return <span className="invisible absolute">{number}</span>;
  }

  return (
    <motion.span
      style={{ y }}
      transition={{ ...transition, type: 'spring' }}
      className="absolute inset-0 flex items-center justify-center leading-none"
    >
      {number}
    </motion.span>
  );
}

function SlidingNumber({
  number,
  className = "",
  inView = false,
  inViewMargin = '0px',
  inViewOnce = true,
  padStart = false,
  decimalSeparator = '.',
  decimalPlaces = 0,
  transition = {
    stiffness: 200,
    damping: 22,
    mass: 0.4,
  },
  ...props
}) {
  const ref = React.useRef(null);

  const inViewResult = useInView(ref, {
    once: inViewOnce,
    margin: inViewMargin,
  });

  const isVisible = !inView || inViewResult;

  const previousValue = React.useRef(0);

  const effectiveNumber = React.useMemo(
    () => (isVisible ? Math.abs(Number(number)) : 0),
    [number, isVisible]
  );

  const formatNumber = React.useCallback(
    (num) =>
      decimalPlaces != null
        ? num.toFixed(decimalPlaces)
        : num.toString(),
    [decimalPlaces]
  );

  const formattedNew = formatNumber(effectiveNumber);
  const formattedPrev = formatNumber(previousValue.current);

  const [intNew, decNew = ""] = formattedNew.split(".");
  const [intPrev, decPrev = ""] = formattedPrev.split(".");

  const finalIntPrev = padStart
    ? intPrev.padStart(intNew.length, "0")
    : intPrev.slice(-intNew.length).padStart(intNew.length, "0");

  const finalDecPrev = decPrev.padEnd(decNew.length, "0");

  React.useEffect(() => {
    if (isVisible) previousValue.current = effectiveNumber;
  }, [effectiveNumber, isVisible]);

  const intPlaces = Array.from(
    { length: intNew.length },
    (_, i) => Math.pow(10, intNew.length - i - 1)
  );

  const decPlaces = decNew
    ? Array.from(
        { length: decNew.length },
        (_, i) => Math.pow(10, decNew.length - i - 1)
      )
    : [];

  return (
    <span
      ref={ref}
      className={`flex items-center gap-[1px] select-none tracking-tight ${className}`}
      {...props}
    >
      {/* Integer Part */}
      {intPlaces.map((place) => (
        <SlidingNumberRoller
          key={`int-${place}`}
          prevValue={parseInt(finalIntPrev, 10)}
          value={parseInt(intNew, 10)}
          place={place}
          transition={transition}
        />
      ))}

      {/* Decimal */}
      {decNew && (
        <>
          <span>{decimalSeparator}</span>

          {decPlaces.map((place) => (
            <SlidingNumberRoller
              key={`dec-${place}`}
              prevValue={parseInt(finalDecPrev)}
              value={parseInt(decNew)}
              place={place}
              transition={transition}
            />
          ))}
        </>
      )}
    </span>
  );
}

export { SlidingNumber };
