import React from 'react';
import { Line } from '@react-three/drei';

interface CircleProps {
  radius: number;
  position?: [number, number, number];
  color: string;
}

const Circle = (props: CircleProps) => {
  const points = getCirclePoints(props.radius);

  return <Line points={points} color={props.color} lineWidth={3} position={props.position} />;
};

// Helper function to calculate circle points
const getCirclePoints = (radius: number): number[] => {
  const segments = 64; // Number of segments for the circle
  const points: number[] = [];

  for (let i = 0; i <= segments; i++) {
    const theta = (i / segments) * Math.PI * 2;
    const x = radius * Math.cos(theta);
    const y = radius * Math.sin(theta);

    points.push(x, y, 0); // Add coordinates in (x, y, z) order
  }

  return points;
};

export default Circle;
