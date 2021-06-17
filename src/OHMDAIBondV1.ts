import {  DepositBondPrincipleCall, RedeemBondCall  } from '../generated/OHMDAIBondV1/OHMDAIBondV1'
import { Deposit, Redemption } from '../generated/schema'
import { loadOrCreateTransaction } from "./utils/Transactions"
import { loadOrCreateOHMie, updateOhmieBalance } from "./utils/OHMie"
import { toDecimal } from "./utils/Decimals"
import { OHMDAILPBOND_TOKEN } from './utils/Constants'
import { loadOrCreateToken } from './utils/Tokens'
import { BigDecimal, BigInt } from '@graphprotocol/graph-ts'
import { createDailyBondRecord } from './utils/DailyBond'

export function handleDeposit(call: DepositBondPrincipleCall): void {
  let ohmie = loadOrCreateOHMie(call.transaction.from)
  let transaction = loadOrCreateTransaction(call.transaction, call.block)
  let token = loadOrCreateToken(OHMDAILPBOND_TOKEN)

  let amount = toDecimal(call.inputs.amountToDeposit_, 18)
  let deposit = new Deposit(transaction.id)
  deposit.transaction = transaction.id
  deposit.ohmie = ohmie.id
  deposit.amount = amount
  deposit.maxPremium = new BigDecimal(new BigInt(0))
  deposit.token = token.id;
  deposit.timestamp = transaction.timestamp;
  deposit.save()

  createDailyBondRecord(deposit.timestamp, token, deposit.amount)
  updateOhmieBalance(ohmie, transaction.timestamp)
}

export function handleRedeem(call: RedeemBondCall): void {
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
  updateOhmieBalance(ohmie, transaction.timestamp)
}