import {  DepositCall  } from '../generated/OHMDAIBondV2/OHMDAIBondV2'
import { toDecimal } from "./utils/Decimals"
import { OHMDAILPBOND_TOKEN, SUSHI_OHMDAI_PAIR } from './utils/Constants'
import { loadOrCreateToken } from './utils/Tokens'
import { createDailyBondRecord } from './utils/DailyBond'
import { getPairUSD } from './utils/Price'

export function handleDeposit(call: DepositCall): void {
  let token = loadOrCreateToken(OHMDAILPBOND_TOKEN)
  let amount = toDecimal(call.inputs.amount_, 18)

  createDailyBondRecord(call.block.timestamp, token, amount, getPairUSD(call.inputs.amount_, SUSHI_OHMDAI_PAIR))
}