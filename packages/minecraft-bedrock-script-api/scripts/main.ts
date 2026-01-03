import { world, system, GameMode, Vector3, Entity, EntityMovementComponent } from '@minecraft/server';
import * as GameTest from '@minecraft/server-gametest';

function getMovementSpeed(entity: GameTest.SimulatedPlayer): number | undefined {
  const movement = entity.getComponent('minecraft:movement') as EntityMovementComponent | undefined;
  return movement?.currentValue;
}

function logEntityAttributes(entity: GameTest.SimulatedPlayer, name: string) {
  const movement = entity.getComponent('minecraft:movement') as EntityMovementComponent | undefined;
  if (movement) {
    console.warn(`[${name}] Movement - default: ${movement.defaultValue}, current: ${movement.currentValue}`);
    world.sendMessage(`§d[${name}] Movement speed: ${movement.currentValue}`);
  }
}

function setMovementSpeed(entity: GameTest.SimulatedPlayer, speed: number): boolean {
  const movement = entity.getComponent('minecraft:movement') as EntityMovementComponent | undefined;
  if (movement) {
    movement.setCurrentValue(speed);
    return true;
  }
  return false;
}

interface VelocityData {
  tick: number;
  x: number;
  y: number;
  z: number;
  speed: number;
  horizontalSpeed: number;
}

const TICKS_TO_RECORD = 6000;

function calculateSpeed(v: Vector3): number {
  return Math.sqrt(v.x ** 2 + v.y ** 2 + v.z ** 2);
}

function calculateHorizontalSpeed(v: Vector3): number {
  return Math.sqrt(v.x ** 2 + v.z ** 2);
}

function printResults(testName: string, data: VelocityData[]) {
  const log = (msg: string) => {
    console.warn(msg); // console.warn shows in BDS console
    world.sendMessage(msg);
  };

  log(`§e=== ${testName} Movement Test ===`);

  // Just show summary to avoid chat spam
  const maxSpeed = Math.max(...data.map((d) => d.horizontalSpeed));
  const avgSpeed = data.reduce((sum, d) => sum + d.horizontalSpeed, 0) / data.length;

  log(`§aMax H.Speed: ${maxSpeed.toPrecision(10)} blocks/tick (${(maxSpeed * 20).toPrecision(10)} blocks/sec)`);
  log(`§bAvg H.Speed: ${avgSpeed.toPrecision(10)} blocks/tick (${(avgSpeed * 20).toPrecision(10)} blocks/sec)`);

  // Log full data to console only
  console.warn('Tick | Velocity (x, y, z) | Speed | H.Speed');
  for (const d of data) {
    const velStr = `(${d.x.toPrecision(21)}, ${d.y.toPrecision(21)}, ${d.z.toPrecision(21)})`;
    console.warn(`${d.tick.toString().padStart(4)} | ${velStr} | ${d.speed} | ${d.horizontalSpeed}`);
  }
}

// Test: WALK movement
GameTest.registerAsync('velocity', 'walk_test', async (test) => {
  const player = test.spawnSimulatedPlayer({ x: 100, y: 2, z: 100 }, 'Walker');
  const data: VelocityData[] = [];

  await test.idle(10);
  logEntityAttributes(player, 'Walker');
  // Start walking forward
  player.move(0, 1);

  for (let tick = 0; tick < TICKS_TO_RECORD; tick++) {
    const velocity = player.getVelocity();
    data.push({
      tick,
      x: velocity.x,
      y: velocity.y,
      z: velocity.z,
      speed: calculateSpeed(velocity),
      horizontalSpeed: calculateHorizontalSpeed(velocity),
    });
    await test.idle(1);
  }

  player.stopMoving();
  printResults('WALK', data);
  test.succeed();
})
  .maxTicks(TICKS_TO_RECORD + 100)
  .tag('velocity');

// Test: SNEAK movement
GameTest.registerAsync('velocity', 'sneak_test', async (test) => {
  const player = test.spawnSimulatedPlayer({ x: 100, y: 2, z: 100 }, 'Sneaker');
  const data: VelocityData[] = [];

  // Start sneaking and moving
  await test.idle(10);
  player.isSneaking = true;
  logEntityAttributes(player, 'Sneaker (sneaking)');
  player.move(0, 1);

  for (let tick = 0; tick < TICKS_TO_RECORD; tick++) {
    const velocity = player.getVelocity();
    data.push({
      tick,
      x: velocity.x,
      y: velocity.y,
      z: velocity.z,
      speed: calculateSpeed(velocity),
      horizontalSpeed: calculateHorizontalSpeed(velocity),
    });
    await test.idle(1);
  }

  player.stopMoving();
  printResults('SNEAK', data);
  test.succeed();
})
  .maxTicks(TICKS_TO_RECORD + 100)
  .tag('velocity');

// Test: SPRINT movement
GameTest.registerAsync('velocity', 'sprint_test', async (test) => {
  const player = test.spawnSimulatedPlayer({ x: 100, y: 2, z: 100 }, 'Sprinter');
  const data: VelocityData[] = [];

  await test.idle(10);
  // Start sprinting
  player.isSprinting = true;
  logEntityAttributes(player, 'Sprinter (sprinting)');
  player.move(0, 1);

  for (let tick = 0; tick < TICKS_TO_RECORD; tick++) {
    const velocity = player.getVelocity();
    data.push({
      tick,
      x: velocity.x,
      y: velocity.y,
      z: velocity.z,
      speed: calculateSpeed(velocity),
      horizontalSpeed: calculateHorizontalSpeed(velocity),
    });
    await test.idle(1);
  }

  player.stopMoving();
  printResults('SPRINT', data);
  test.succeed();
})
  .maxTicks(TICKS_TO_RECORD + 100)
  .tag('velocity');

// Test: WALK with fixed speed 0.1
GameTest.registerAsync('velocity', 'walk_fixed_test', async (test) => {
  const player = test.spawnSimulatedPlayer({ x: 100, y: 2, z: 100 }, 'FixedWalker');
  const data: VelocityData[] = [];

  await test.idle(10);
  // Set speed to exactly 0.1
  //setMovementSpeed(player, 0.1);
  logEntityAttributes(player, 'FixedWalker (speed=0.1)');
  // Start walking forward
  player.move(0, 1);

  for (let tick = 0; tick < TICKS_TO_RECORD; tick++) {
    const velocity = player.getVelocity();
    data.push({
      tick,
      x: velocity.x,
      y: velocity.y,
      z: velocity.z,
      speed: calculateSpeed(velocity),
      horizontalSpeed: calculateHorizontalSpeed(velocity),
    });
    await test.idle(1);
  }

  player.stopMoving();
  printResults('WALK (speed=0.1)', data);
  test.succeed();
})
  .maxTicks(TICKS_TO_RECORD + 100)
  .tag('velocity');

// Test: SPRINT with fixed speed 0.1 (no sprint bonus)
GameTest.registerAsync('velocity', 'sprint_fixed_test', async (test) => {
  const player = test.spawnSimulatedPlayer({ x: 100, y: 2, z: 100 }, 'FixedSprinter');
  const data: VelocityData[] = [];

  await test.idle(10);
  player.isSprinting = true;
  // Set speed to exactly 0.1 AFTER enabling sprint
  //setMovementSpeed(player, 0.1);
  logEntityAttributes(player, 'FixedSprinter (sprint+speed=0.1)');
  player.move(0, 1);

  for (let tick = 0; tick < TICKS_TO_RECORD; tick++) {
    const velocity = player.getVelocity();
    data.push({
      tick,
      x: velocity.x,
      y: velocity.y,
      z: velocity.z,
      speed: calculateSpeed(velocity),
      horizontalSpeed: calculateHorizontalSpeed(velocity),
    });
    await test.idle(1);
  }

  player.stopMoving();
  printResults('SPRINT (speed=0.1)', data);
  test.succeed();
})
  .maxTicks(TICKS_TO_RECORD + 100)
  .tag('velocity');

console.log('[Script API] Velocity tests registered');
console.log('[Script API] Run: /gametest run velocity:walk_test');
console.log('[Script API] Run: /gametest run velocity:sneak_test');
console.log('[Script API] Run: /gametest run velocity:sprint_test');
console.log('[Script API] Or run all: /gametest runset velocity');
