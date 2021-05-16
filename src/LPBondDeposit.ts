import {  DepositCall, RedeemCall  } from '../generated/LPBondDepository/LPBondDepository'
import { Deposit, Redeemtion } from '../generated/schema'
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
  
  let redeem = new Redeemtion(transaction.id)
  redeem.transaction = transaction.id
  redeem.ohmie = ohmie.id
  redeem.token = loadOrCreateToken(OHMDAILPBOND_TOKEN).id;
  redeem.treasury = treasury.id;
  redeem.save()
}