import { getNestedMachine, getTransition, StateBehavior } from '@nxg-org/mineflayer-static-statemachine';
import type { Bot } from 'mineflayer';
import type { FarmingContext } from '../context.ts';
import { IdleState, HarvestState, PlantState, DepositState, CutTreeState, PlantTreeState } from '../states/index.ts';

interface StateWithMethods extends StateBehavior {
  isFinished(): boolean;
  needsDeposit?(): boolean;
  hasTree?(): boolean;
  hasMatureCrops?(): boolean;
  hasEmptyFarmland?(): boolean;
}

const getCtx = (state: StateWithMethods): FarmingContext | undefined => state.bot.farmingContext;

export function buildFarmingMachine(_bot: Bot) {
  const Idle = IdleState.clone('Idle');
  const Harvest = HarvestState.clone('Harvest');
  const Plant = PlantState.clone('Plant');
  const Deposit = DepositState.clone('Deposit');
  const CutTree = CutTreeState.clone('CutTree');
  const PlantTree = PlantTreeState.clone('PlantTree');

  const transitions = [
    getTransition('needsDeposit', Idle, Deposit)
      .setShouldTransition((s: StateWithMethods) => s.isFinished() && s.needsDeposit?.() === true)
      .build(),

    getTransition('cutTree', Idle, CutTree)
      .setShouldTransition((s: StateWithMethods) => s.isFinished() && s.hasTree?.() === true)
      .build(),

    getTransition('startHarvest', Idle, Harvest)
      .setShouldTransition((s: StateWithMethods) => s.isFinished() && s.hasMatureCrops?.() === true)
      .build(),

    getTransition('plantEmptyFarmland', Idle, Plant)
      .setShouldTransition((s: StateWithMethods) => s.isFinished() && s.hasEmptyFarmland?.() === true)
      .build(),

    getTransition('afterHarvest', Harvest, Plant)
      .setShouldTransition((s: StateWithMethods) => s.isFinished() && getCtx(s)?.harvested === true)
      .build(),

    getTransition('harvestFailed', Harvest, Idle)
      .setShouldTransition((s: StateWithMethods) => s.isFinished() && getCtx(s)?.harvested !== true)
      .build(),

    getTransition('afterPlant', Plant, Idle)
      .setShouldTransition((s: StateWithMethods) => s.isFinished())
      .build(),

    getTransition('afterDeposit', Deposit, Idle)
      .setShouldTransition((s: StateWithMethods) => s.isFinished())
      .build(),

    getTransition('afterCutTree', CutTree, PlantTree)
      .setShouldTransition((s: StateWithMethods) => s.isFinished() && getCtx(s)?.treeBasePosition !== null)
      .build(),

    getTransition('cutTreeFailed', CutTree, Idle)
      .setShouldTransition((s: StateWithMethods) => s.isFinished() && getCtx(s)?.treeBasePosition === null)
      .build(),

    getTransition('afterPlantTree', PlantTree, Idle)
      .setShouldTransition((s: StateWithMethods) => s.isFinished())
      .build(),
  ];

  return getNestedMachine('farmingMachine', transitions, Idle, []).build();
}
