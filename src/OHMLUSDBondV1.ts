import {  DepositCall } from '../generated/OHMDAIBondV4/OHMDAIBondV4'
import { toDecimal } from "./utils/Decimals"
import { OHMLUSDLPBOND_TOKEN, SUSHI_OHMLUSD_PAIR } from './utils/Constants'
import { loadOrCreateToken } from './utils/Tokens'
import { createDailyBondRecord } from './utils/DailyBond'
import { getPairUSD } from './utils/Price'

export function handleDeposit(call: DepositCall): void {
  let token = loadOrCreateToken(OHMLUSDLPBOND_TOKEN)
  let amount = toDecimal(call.inputs._amount, 18)

  createDailyBondRecord(call.block.timestamp, token, amount, getPairUSD(call.inputs._amount, SUSHI_OHMLUSD_PAIR))
}