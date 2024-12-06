/* eslint-disable */
import React, { useState, useCallback, useMemo } from 'react'
import { Canvas } from '@react-three/fiber'
import { OrbitControls, Text, Line } from '@react-three/drei'
import * as THREE from 'three'
import { Slider } from "./Animation/Slider"
import { Label } from "./Animation/Label"
import { RadioGroup, RadioGroupItem } from "./Animation/Radio_group"

const TokenA_USD_PRICE = 2000
const oooOOO_USD_PRICE = 0.00001
// Add these interface definitions at the top of the file
interface LiquidityPositionProps {
    position: [number, number, number]
    width: number
    height: number
    depth: number
    color: string
    index: number
  }
  
  interface AxisLabelsProps {
    size: number
  }
  
  interface AxisIndicatorsProps {
    size: number
  }
  
  interface FullRangeIndicatorProps {
    size: number
  }
  
  interface CurrentPricePlaneProps {
    size: number
    currentTick: number
  }
  

const LiquidityPosition = React.memo<LiquidityPositionProps>(({ position, width, height, depth, color, index }) => {
  const yOffset = index * 0.4 // Slight vertical offset for stacking
  return (
    <group position={[position[0], position[1] + yOffset, position[2]]}>
      <mesh>
        <boxGeometry args={[width, height, depth]} />
        <meshStandardMaterial color={color} transparent opacity={0.3} />
      </mesh>
      <lineSegments>
        <edgesGeometry args={[new THREE.BoxGeometry(width, height, depth)]} />
        <lineBasicMaterial color={color} linewidth={2} />
      </lineSegments>
    </group>
  )
})

LiquidityPosition.displayName = 'LiquidityPosition'

const AxisLabels = React.memo<AxisIndicatorsProps>(({ size }) => {
  const ticks = useMemo(() => [-270000, -260000, -250000, -240000], [])
  return (
    <>
      {ticks.map((tick, index) => (
        <Text
          key={index}
          position={[((tick + 270000) / 30000) * size - size / 2, -0.5, size / 2 + 0.5]}
          color="white"
          fontSize={0.9}
          anchorX="center"
          anchorY="top"
        >
          {tick.toString()}
        </Text>
      ))}
      <Text position={[0, -1, size / 2 + 1]} color="white" fontSize={1} anchorX="center" anchorY="top">
        Ticks (X-axis)
      </Text>
      <Text
        position={[-size / 2 - 1, size / 4, 0]}
        color="white"
        fontSize={1}
        anchorY="middle"
        rotation={[0, 0, Math.PI / 2]}
      >
        Liquidity (Y-axis)
      </Text>
      <Text
        position={[0, 0, -size / 2 - 1]}
        color="white"
        fontSize={1}
        anchorX="center"
        anchorY="top"
        rotation={[-Math.PI / 2, 0, 0]}
      >
        Depth (Z-axis)
      </Text>
    </>
  )
})

AxisLabels.displayName = 'AxisLabels'

const AxisIndicators = React.memo<AxisIndicatorsProps>(({ size }) => {
  const axisColor = new THREE.Color(0x808080) // 50% brightness of white
  return (
    <group>
      <Line
        points={[[-size / 2 - 1, 0, 0], [size / 2 + 1, 0, 0]]}
        color={axisColor}
        lineWidth={2}
      />
      <Line
        points={[[0, 0, 0], [0, size / 2 + 1, 0]]}
        color={axisColor}
        lineWidth={2}
      />
      <Line
        points={[[0, 0, -size / 2 - 1], [0, 0, size / 2 + 1]]}
        color={axisColor}
        lineWidth={2}
      />
    </group>
  )
})

AxisIndicators.displayName = 'AxisIndicators'

const GridFloor = React.memo(() => {
  return <gridHelper args={[50, 20, 0x202020, 0x404040]} position={[0, 0, 0]} />
})

GridFloor.displayName = 'GridFloor'

const FullRangeIndicator = React.memo<FullRangeIndicatorProps>(({ size }) => {
  return (
    <group>
      <Line
        points={[[-size, 0.25, 0], [size, 0.25, 0]]}
        color="#4a9e9e"
        lineWidth={4}
      />
      <Text
        position={[-size / 2, 0.5, 0]}
        color="#4a9e9e"
        fontSize={0.9}
        anchorX="left"
        anchorY="bottom"
      >
        Full Range (-887200 to 887200)
      </Text>
    </group>
  )
})

FullRangeIndicator.displayName = 'FullRangeIndicator'

const CurrentPricePlane = React.memo<CurrentPricePlaneProps>(({ size, currentTick }) => {
  const position = ((currentTick + 270000) / 30000) * size - size / 2
  return (
    <group>
      <mesh position={[position, size / 2, 0]}>
        <boxGeometry args={[0.1, size, 2]} />
        <meshBasicMaterial color="yellow" transparent opacity={0.5} />
      </mesh>
      <Text
        position={[position, 0.5, size / 2 + 0.5]}
        color="yellow"
        fontSize={0.9}
        anchorX="center"
        anchorY="bottom"
      >
        {`Current Price (Tick: ${currentTick})`}
      </Text>
    </group>
  )
})

CurrentPricePlane.displayName = 'CurrentPricePlane'

export default function InteractiveLiquidityVisualization() {
  const [fullRangeWeight, setFullRangeWeight] = useState(330000)
  const [baseOrderWidth, setBaseOrderWidth] = useState(7000)
  const [limitOrderWidth, setLimitOrderWidth] = useState(20000)
  const [limitOrderSide, setLimitOrderSide] = useState("right")

  const size = 40
  const currentTick = -259545

  const liquidityData = useMemo(() => {
    const fullRange = {
      name: "Full Range",
      tickLower: -887200,
      tickUpper: 887200,
      height: 1 * (fullRangeWeight / 1000000),
      color: "#4a9e9e",
      hoverColor: "#5abebe",
    }

    const baseOrder = {
      name: "Base Order",
      tickLower: currentTick - baseOrderWidth / 2,
      tickUpper: currentTick + baseOrderWidth / 2,
      height: 8,
      color: "#4a4a9e",
      hoverColor: "#5a5abe",
    }

    const limitOrder = {
      name: "Limit Order",
      tickLower: limitOrderSide === "left" ? currentTick - limitOrderWidth : currentTick,
      tickUpper: limitOrderSide === "left" ? currentTick : currentTick + limitOrderWidth,
      height: 12,
      color: "#9e4a4a",
      hoverColor: "#be5a5a",
    }

    return [fullRange, baseOrder, limitOrder]
  }, [fullRangeWeight, baseOrderWidth, limitOrderWidth, currentTick, limitOrderSide])

  return (
    <div className="flex justify-center items-center my-4 h-[800px] overflow-hidden">
        <div className="h-[40vh] w-[70vw] lg:h-[50vh]">
            <Canvas camera={{ position: [0, 25, 45], fov: 45 }}>
              <ambientLight intensity={0.5} />
              <pointLight position={[10, 10, 10]} />
              <OrbitControls />

              <AxisLabels size={size} />
              <AxisIndicators size={size} />
              <GridFloor />
              <FullRangeIndicator size={size} />
              <CurrentPricePlane size={size} currentTick={currentTick} />

              {liquidityData.map((data, index) => {
                const width = ((data.tickUpper - data.tickLower) / 30000) * size
                const position: [number, number, number] = [
                  ((data.tickLower + data.tickUpper) / 2 + 270000) / 30000 * size - size / 2,
                  data.height / 2,
                  0
                ]
                return (
                  <LiquidityPosition
                    key={index}
                    position={position}
                    width={width}
                    height={data.height}
                    depth={2}
                    color={data.color}
                    index={index}
                  />
                )
              })}
            </Canvas>
        </div>
    </div>
  )
}
