import {  DepositCall, RedeemCall  } from '../generated/OHMDAIBondV4/OHMDAIBondV4'
import { Deposit, Redemption } from '../generated/schema'
import { loadOrCreateTransaction } from "./utils/Transactions"
import { loadOrCreateOHMie, updateOhmieBalance } from "./utils/OHMie"
import { toDecimal } from "./utils/Decimals"
import { OHMDAILPBOND_TOKEN, SUSHI_OHMDAI_PAIR } from './utils/Constants'
import { loadOrCreateToken } from './utils/Tokens'
import { createDailyBondRecord } from './utils/DailyBond'
import { getPairUSD } from './utils/Price'

export function handleDeposit(call: DepositCall): void {
  let ohmie = loadOrCreateOHMie(call.transaction.from)
  let transaction = loadOrCreateTransaction(call.transaction, call.block)
  let token = loadOrCreateToken(OHMDAILPBOND_TOKEN)

  let amount = toDecimal(call.inputs._amount, 18)
  let deposit = new Deposit(transaction.id)
  deposit.transaction = transaction.id
  deposit.ohmie = ohmie.id
  deposit.amount = amount
  deposit.value = getPairUSD(call.inputs._amount, SUSHI_OHMDAI_PAIR)
  deposit.maxPremium = toDecimal(call.inputs._maxPrice)
  deposit.token = token.id;
  deposit.timestamp = transaction.timestamp;
  deposit.save()

  createDailyBondRecord(deposit.timestamp, token, deposit.amount, deposit.value)
  updateOhmieBalance(ohmie, transaction)
}

export function handleRedeem(call: RedeemCall): void {
  let ohmie = loadOrCreateOHMie(call.transaction.from)
  let transaction = loadOrCreateTransaction(call.transaction, call.block)
  
  let redemption = Redemption.load(transaction.id)
  if (redemption==null){
    redemption = new Redemption(transaction.id)
  }
  redemption.transaction = transaction.id
  redemption.ohmie = ohmie.id
  redemption.token = loadOrCreateToken(OHMDAILPBOND_TOKEN).id;
  redemption.timestamp = transaction.timestamp;
  redemption.save()
  updateOhmieBalance(ohmie, transaction)
}