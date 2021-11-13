import {  DepositCall, RedeemCall  } from '../generated/OHMDAIBondV4/OHMDAIBondV4'
import { toDecimal } from "./utils/Decimals"
import { OHMDAILPBOND_TOKEN, SUSHI_OHMDAI_PAIR } from './utils/Constants'
import { loadOrCreateToken } from './utils/Tokens'
import { createDailyBondRecord } from './utils/DailyBond'
import { getPairUSD } from './utils/Price'

export function handleDeposit(call: DepositCall): void {
  let token = loadOrCreateToken(OHMDAILPBOND_TOKEN)
  let amount = toDecimal(call.inputs._amount, 18)

  createDailyBondRecord(call.block.timestamp, token, amount, getPairUSD(call.inputs._amount, SUSHI_OHMDAI_PAIR))
}