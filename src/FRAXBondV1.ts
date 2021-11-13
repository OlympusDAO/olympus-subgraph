import {  DepositCall  } from '../generated/FRAXBondV1/FRAXBondV1'
import { toDecimal } from "./utils/Decimals"
import { FRAXBOND_TOKEN } from './utils/Constants'
import { loadOrCreateToken } from './utils/Tokens'
import { createDailyBondRecord } from './utils/DailyBond'


export function handleDeposit(call: DepositCall): void {
  let token = loadOrCreateToken(FRAXBOND_TOKEN)
  let amount = toDecimal(call.inputs._amount, 18)

  createDailyBondRecord(call.block.timestamp, token, amount, amount)
}