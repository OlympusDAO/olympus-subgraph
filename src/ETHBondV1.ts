import {  DepositCall  } from '../generated/FRAXBondV1/FRAXBondV1'
import { toDecimal } from "./utils/Decimals"
import { ETHBOND_TOKEN } from './utils/Constants'
import { loadOrCreateToken } from './utils/Tokens'
import { createDailyBondRecord } from './utils/DailyBond'
import { getETHUSDRate } from './utils/Price'

export function handleDeposit(call: DepositCall): void {
  let token = loadOrCreateToken(ETHBOND_TOKEN)
  let amount = toDecimal(call.inputs._amount, 18)

  createDailyBondRecord(call.block.timestamp, token, amount, amount.times(getETHUSDRate()))
}