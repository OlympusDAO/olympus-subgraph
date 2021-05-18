import {  DepositCall, RedeemCall  } from '../generated/LPBondDepository/LPBondDepository'
import { Deposit, Redemption } from '../generated/schema'
import { loadOrCreateTransaction } from "./utils/Transactions"
import { loadOrCreateOHMie } from "./utils/OHMie"
import { toDecimal } from "./utils/Decimals"
import { OHMDAILPBOND_TOKEN } from './utils/Constants'
import { loadOrCreateToken } from './utils/Tokens'
import { loadOrCreateTreasury } from './utils/Treasuries'

export function handleDeposit(call: DepositCall): void {
  let ohmie = loadOrCreateOHMie(call.transaction.from)
  let treasury = loadOrCreateTreasury()
  let transaction = loadOrCreateTransaction(call.transaction, call.block)
  
  let amount = toDecimal(call.inputs.amount_, 18)
  let deposit = new Deposit(transaction.id)
  deposit.transaction = transaction.id
  deposit.ohmie = ohmie.id
  deposit.amount = amount
  deposit.maxPremium = toDecimal(call.inputs.maxPremium_)
  deposit.token = loadOrCreateToken(OHMDAILPBOND_TOKEN).id;
  deposit.treasury = treasury.id;
  deposit.timestamp = transaction.timestamp;
  deposit.save()

  ohmie.ohmDaiSlpTotalDeposit = ohmie.ohmDaiSlpTotalDeposit.plus(amount)
  ohmie.save()

  treasury.ohmDaiSlpTotalDeposit = treasury.ohmDaiSlpTotalDeposit.plus(amount)
  treasury.save()
}

export function handleRedeem(call: RedeemCall): void {
  let ohmie = loadOrCreateOHMie(call.transaction.from)
  let treasury = loadOrCreateTreasury()
  let transaction = loadOrCreateTransaction(call.transaction, call.block)
  
  let redemption = Redemption.load(transaction.id)
  if (redemption==null){
    redemption = new Redemption(transaction.id)
  }
  redemption.transaction = transaction.id
  redemption.ohmie = ohmie.id
  redemption.token = loadOrCreateToken(OHMDAILPBOND_TOKEN).id;
  redemption.treasury = treasury.id;
  redemption.timestamp = transaction.timestamp;
  redemption.save()
}