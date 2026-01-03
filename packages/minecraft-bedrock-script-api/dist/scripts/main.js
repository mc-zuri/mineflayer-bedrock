// scripts/main.ts
import { world } from "@minecraft/server";
import * as GameTest from "@minecraft/server-gametest";
function logEntityAttributes(entity, name) {
  const movement = entity.getComponent("minecraft:movement");
  if (movement) {
    console.warn(`[${name}] Movement - default: ${movement.defaultValue}, current: ${movement.currentValue}`);
    world.sendMessage(`\xA7d[${name}] Movement speed: ${movement.currentValue}`);
  }
}
var TICKS_TO_RECORD = 6e3;
function calculateSpeed(v) {
  return Math.sqrt(v.x ** 2 + v.y ** 2 + v.z ** 2);
}
function calculateHorizontalSpeed(v) {
  return Math.sqrt(v.x ** 2 + v.z ** 2);
}
function printResults(testName, data) {
  const log = (msg) => {
    console.warn(msg);
    world.sendMessage(msg);
  };
  log(`\xA7e=== ${testName} Movement Test ===`);
  const maxSpeed = Math.max(...data.map((d) => d.horizontalSpeed));
  const avgSpeed = data.reduce((sum, d) => sum + d.horizontalSpeed, 0) / data.length;
  log(`\xA7aMax H.Speed: ${maxSpeed.toPrecision(10)} blocks/tick (${(maxSpeed * 20).toPrecision(10)} blocks/sec)`);
  log(`\xA7bAvg H.Speed: ${avgSpeed.toPrecision(10)} blocks/tick (${(avgSpeed * 20).toPrecision(10)} blocks/sec)`);
  console.warn("Tick | Velocity (x, y, z) | Speed | H.Speed");
  for (const d of data) {
    const velStr = `(${d.x.toPrecision(21)}, ${d.y.toPrecision(21)}, ${d.z.toPrecision(21)})`;
    console.warn(`${d.tick.toString().padStart(4)} | ${velStr} | ${d.speed} | ${d.horizontalSpeed}`);
  }
}
GameTest.registerAsync("velocity", "walk_test", async (test) => {
  const player = test.spawnSimulatedPlayer({ x: 100, y: 2, z: 100 }, "Walker");
  const data = [];
  await test.idle(10);
  logEntityAttributes(player, "Walker");
  player.move(0, 1);
  for (let tick = 0; tick < TICKS_TO_RECORD; tick++) {
    const velocity = player.getVelocity();
    data.push({
      tick,
      x: velocity.x,
      y: velocity.y,
      z: velocity.z,
      speed: calculateSpeed(velocity),
      horizontalSpeed: calculateHorizontalSpeed(velocity)
    });
    await test.idle(1);
  }
  player.stopMoving();
  printResults("WALK", data);
  test.succeed();
}).maxTicks(TICKS_TO_RECORD + 100).tag("velocity");
GameTest.registerAsync("velocity", "sneak_test", async (test) => {
  const player = test.spawnSimulatedPlayer({ x: 100, y: 2, z: 100 }, "Sneaker");
  const data = [];
  await test.idle(10);
  player.isSneaking = true;
  logEntityAttributes(player, "Sneaker (sneaking)");
  player.move(0, 1);
  for (let tick = 0; tick < TICKS_TO_RECORD; tick++) {
    const velocity = player.getVelocity();
    data.push({
      tick,
      x: velocity.x,
      y: velocity.y,
      z: velocity.z,
      speed: calculateSpeed(velocity),
      horizontalSpeed: calculateHorizontalSpeed(velocity)
    });
    await test.idle(1);
  }
  player.stopMoving();
  printResults("SNEAK", data);
  test.succeed();
}).maxTicks(TICKS_TO_RECORD + 100).tag("velocity");
GameTest.registerAsync("velocity", "sprint_test", async (test) => {
  const player = test.spawnSimulatedPlayer({ x: 100, y: 2, z: 100 }, "Sprinter");
  const data = [];
  await test.idle(10);
  player.isSprinting = true;
  logEntityAttributes(player, "Sprinter (sprinting)");
  player.move(0, 1);
  for (let tick = 0; tick < TICKS_TO_RECORD; tick++) {
    const velocity = player.getVelocity();
    data.push({
      tick,
      x: velocity.x,
      y: velocity.y,
      z: velocity.z,
      speed: calculateSpeed(velocity),
      horizontalSpeed: calculateHorizontalSpeed(velocity)
    });
    await test.idle(1);
  }
  player.stopMoving();
  printResults("SPRINT", data);
  test.succeed();
}).maxTicks(TICKS_TO_RECORD + 100).tag("velocity");
GameTest.registerAsync("velocity", "walk_fixed_test", async (test) => {
  const player = test.spawnSimulatedPlayer({ x: 100, y: 2, z: 100 }, "FixedWalker");
  const data = [];
  await test.idle(10);
  logEntityAttributes(player, "FixedWalker (speed=0.1)");
  player.move(0, 1);
  for (let tick = 0; tick < TICKS_TO_RECORD; tick++) {
    const velocity = player.getVelocity();
    data.push({
      tick,
      x: velocity.x,
      y: velocity.y,
      z: velocity.z,
      speed: calculateSpeed(velocity),
      horizontalSpeed: calculateHorizontalSpeed(velocity)
    });
    await test.idle(1);
  }
  player.stopMoving();
  printResults("WALK (speed=0.1)", data);
  test.succeed();
}).maxTicks(TICKS_TO_RECORD + 100).tag("velocity");
GameTest.registerAsync("velocity", "sprint_fixed_test", async (test) => {
  const player = test.spawnSimulatedPlayer({ x: 100, y: 2, z: 100 }, "FixedSprinter");
  const data = [];
  await test.idle(10);
  player.isSprinting = true;
  logEntityAttributes(player, "FixedSprinter (sprint+speed=0.1)");
  player.move(0, 1);
  for (let tick = 0; tick < TICKS_TO_RECORD; tick++) {
    const velocity = player.getVelocity();
    data.push({
      tick,
      x: velocity.x,
      y: velocity.y,
      z: velocity.z,
      speed: calculateSpeed(velocity),
      horizontalSpeed: calculateHorizontalSpeed(velocity)
    });
    await test.idle(1);
  }
  player.stopMoving();
  printResults("SPRINT (speed=0.1)", data);
  test.succeed();
}).maxTicks(TICKS_TO_RECORD + 100).tag("velocity");
console.log("[Script API] Velocity tests registered");
console.log("[Script API] Run: /gametest run velocity:walk_test");
console.log("[Script API] Run: /gametest run velocity:sneak_test");
console.log("[Script API] Run: /gametest run velocity:sprint_test");
console.log("[Script API] Or run all: /gametest runset velocity");

//# sourceMappingURL=../debug/main.js.map
