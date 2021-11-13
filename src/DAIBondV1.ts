import { DepositCall  } from '../generated/DAIBondV1/DAIBondV1'
import { toDecimal } from "./utils/Decimals"
import { DAIBOND_TOKEN } from './utils/Constants'
import { loadOrCreateToken } from './utils/Tokens'
import { createDailyBondRecord } from './utils/DailyBond'


export function handleDeposit(call: DepositCall): void {
  let token = loadOrCreateToken(DAIBOND_TOKEN)
  let amount = toDecimal(call.inputs.amount_, 18)

  createDailyBondRecord(call.block.timestamp, token, amount, amount)
}