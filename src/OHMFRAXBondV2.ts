import {  DepositCall  } from '../generated/OHMFRAXBondV2/OHMFRAXBondV2'
import { toDecimal } from "./utils/Decimals"
import { OHMFRAXLPBOND_TOKEN, UNI_OHMFRAX_PAIR } from './utils/Constants'
import { loadOrCreateToken } from './utils/Tokens'
import { createDailyBondRecord } from './utils/DailyBond'
import { getPairUSD } from './utils/Price'

export function handleDeposit(call: DepositCall): void {
  let token = loadOrCreateToken(OHMFRAXLPBOND_TOKEN)
  let amount = toDecimal(call.inputs._amount, 18)

  createDailyBondRecord(call.block.timestamp, token, amount, getPairUSD(call.inputs._amount, UNI_OHMFRAX_PAIR))
}