/* eslint-disable */
import React, { useState, useMemo, useEffect } from 'react'
import { Canvas } from '@react-three/fiber'
import { OrbitControls, Text, Line } from '@react-three/drei'
import * as THREE from 'three'

// Add these interface definitions at the top of the file
interface LiquidityPositionProps {
    position: [number, number, number]
    width: number
    height: number
    depth: number
    color: string
    index: number
  }
  
interface MainProps{
    currentTick: number
    lowerTick: number
    upperTick: number
}

  
  interface AxisIndicatorsProps {
    size: number
  }
  interface AxisIndicators1Props {
    size: number
    axisC: number
    delta: number
    lowerTick: number
  }
  
  interface FullRangeIndicatorProps {
    size: number
  }
  
  interface CurrentPricePlaneProps {
    size: number
    axisC: number
    delta: number
    currentTick: number
    lowerTick: number
    uperTick: number
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

const AxisLabels = React.memo<AxisIndicators1Props>(({ size, axisC, delta, lowerTick }) => {
  const ticks = useMemo(() => [axisC, axisC-delta, axisC-2*delta, axisC-3*delta], [axisC, delta, lowerTick])
  console.log("lower===============>", axisC, delta)
  return (
    <>
      {ticks.map((tick, index) => (
        <Text
          key={index}
          position={[-size/2 + (axisC-tick)/(3 * delta) * size, - 0.5, size / 2 + 0.5]}
          color="white"
          fontSize={0.9}
          anchorX="center"
          anchorY="top"
        >
          {lowerTick>0?tick.toString():-tick.toString()}
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

const CurrentPricePlane = React.memo<CurrentPricePlaneProps>(({ size, currentTick, axisC, lowerTick, uperTick }) => {
  const position = -size/2 + (axisC - Math.abs(currentTick)) / (axisC - Math.abs(lowerTick>0?lowerTick:uperTick)) * size * 2 / 3
  const positionLow = -size/2 + (axisC - Math.abs(lowerTick)) / (axisC - Math.abs(lowerTick>0?lowerTick:uperTick)) * size * 2 / 3
  const positionUpper = -size/2 + (axisC - Math.abs(uperTick)) / (axisC - Math.abs(lowerTick>0?lowerTick:uperTick)) * size * 2 / 3
  return (
    <group>
      <mesh position={[position, size / 2, 0]}>
        <boxGeometry args={[0.1, size, 2]} />
        <meshBasicMaterial color="yellow" transparent opacity={0.5} />
      </mesh>
      <Text
        position={[position, 2, size / 2 + 0.5]}
        color="yellow"
        fontSize={0.9}
        anchorX="center"
        anchorY="bottom"
      >
        {`Current Price (Tick: ${currentTick})`}
      </Text>
      <Text
        position={[positionLow, 0.5, size / 2 + 0.5]}
        color="red"
        fontSize={0.9}
        anchorX="center"
        anchorY="bottom"
      >
        {`Lower Price (Tick: ${lowerTick})`}
      </Text>
      <Text
        position={[positionUpper, 0.5, size / 2 + 0.5]}
        color="red"
        fontSize={0.9}
        anchorX="center"
        anchorY="bottom"
      >
        {`Upper Price (Tick: ${uperTick})`}
      </Text>
    </group>
  )
})

CurrentPricePlane.displayName = 'CurrentPricePlane'

export default function InteractiveLiquidityVisualization({currentTick, lowerTick, upperTick}:MainProps) {
  const [axisC, setAxisC] = useState<number>(0);
  const [axisDelta, setAxisDelta] = useState<number>(0);
  const [fullRangeWeight] = useState(330000)
  const [baseOrderWidth] = useState(7000)
  const [limitOrderWidth] = useState(20000)
  const [limitOrderSide] = useState("right")

  const size = 40
//   const currentTick = -259545
  useEffect(() => { 
    if(!currentTick) return;
    if(lowerTick>0) setAxisC(Math.abs(lowerTick) + 2 * Math.abs(lowerTick - upperTick));
    else setAxisC(Math.abs(lowerTick) + Math.abs(lowerTick - upperTick))
    setAxisDelta(Math.abs(lowerTick - upperTick));
    console.log("axios", lowerTick, upperTick)
  }, [lowerTick])
  const liquidityData = useMemo(() => {
    const limitOrder = {
      name: "Limit Order",
      tickLower: lowerTick,
      tickUpper: upperTick,
      height: 15,
      color: "#9e4a4a",
      hoverColor: "#be5a5a",
    }

    return [limitOrder]
  }, [fullRangeWeight, baseOrderWidth, limitOrderWidth, lowerTick, limitOrderSide])

  return (
    <div className="flex justify-center items-center my-4 h-[800px] overflow-hidden">
        <div className="h-[40vh] w-[70vw] lg:h-[50vh]">
            <Canvas camera={{ position: [0, 25, 45], fov: 45 }}>
              <ambientLight intensity={0.5} />
              <pointLight position={[10, 10, 10]} />
              <OrbitControls />
              <AxisLabels size={size} axisC={axisC} delta = {axisDelta} lowerTick = {lowerTick}  />
              <AxisIndicators size={size} />
              <GridFloor />
              {/* <FullRangeIndicator size={size} /> */}
              <CurrentPricePlane size={size} currentTick={currentTick} axisC={axisC} delta = {axisDelta} lowerTick = {lowerTick} uperTick = {upperTick} />

              {liquidityData.map((data, index) => {
                const width = size/3
                const position: [number, number, number] = [
                  -size / 2 + (axisC - Math.abs(lowerTick + upperTick) /2 ) /(3 * axisDelta) * size,
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
